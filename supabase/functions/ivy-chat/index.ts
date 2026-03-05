import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { callAI } from "../_shared/ai-provider.ts"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? 'http://host.docker.internal:54321'
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const WHISPER_URL = Deno.env.get('WHISPER_URL') ?? 'http://host.docker.internal:9000'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

function sanitizeInput(input: string, maxLen = 800): string {
  return input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/```/g, "'''")
    .slice(0, maxLen)
}

async function transcribeAudio(audioBytes: Uint8Array, mimeType: string): Promise<string | null> {
  try {
    const ext = mimeType.includes('webm') ? 'webm' : mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm'
    const form = new FormData()
    form.append('audio_file', new Blob([audioBytes], { type: mimeType }), `audio.${ext}`)
    const res = await fetch(`${WHISPER_URL}/asr?encode=true&task=transcribe&language=pt&output=json`, { method: 'POST', body: form })
    if (!res.ok) return null
    const data = await res.json()
    return (data.text ?? '').trim() || null
  } catch { return null }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // Decode JWT
    const authHeader = req.headers.get('Authorization') ?? ''
    const jwt = authHeader.replace('Bearer ', '')
    if (!jwt) return new Response('Unauthorized', { status: 401, headers: corsHeaders })

    const [, payloadB64] = jwt.split('.')
    const padding = '='.repeat((4 - (payloadB64.length % 4)) % 4)
    const payload = JSON.parse(atob(payloadB64 + padding))
    const userId: string = payload.sub
    if (!userId) return new Response('Unauthorized', { status: 401, headers: corsHeaders })

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // ── Rate limit: max 20 messages per minute per user ───────────────────
    const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString()
    const { count: recentCount } = await supabase
      .from('ai_coach_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', oneMinuteAgo)
    if ((recentCount ?? 0) >= 20) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Aguarda um momento.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── 1. Parse input: FormData (voice) or JSON (text) ──────────────────
    let message = ''
    let isVoice = false
    const contentType = req.headers.get('content-type') ?? ''

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      const audioFile = formData.get('audio') as File | null
      if (!audioFile) {
        return new Response(JSON.stringify({ error: 'No audio file' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      const bytes = new Uint8Array(await audioFile.arrayBuffer())
      const transcribed = await transcribeAudio(bytes, audioFile.type || 'audio/webm')
      if (!transcribed) {
        return new Response(JSON.stringify({ response: 'Não consegui entender o áudio. Tenta digitar!', action: 'chat' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      message = sanitizeInput(transcribed)
      isVoice = true
    } else {
      const body = await req.json()
      message = body.message ?? ''
    }

    message = sanitizeInput(message)

    if (!message.trim()) {
      return new Response(JSON.stringify({ error: 'Empty message' }), { status: 400, headers: corsHeaders })
    }

    // ── 2. Build rich context ──────────────────────────────────────────────
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const today = now.toISOString().split('T')[0]
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const dayOfMonth = now.getDate()
    const daysLeft = daysInMonth - dayOfMonth

    const [
      { data: transactions },
      { data: goals },
      { data: habits },
      { data: categories },
      { data: historyLogs },
      { data: monthTxs },
    ] = await Promise.all([
      supabase.from('transactions').select('amount,description,type,date').eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
      supabase.from('goals').select('title,target_value,current_value,deadline').eq('user_id', userId).eq('is_completed', false).limit(5),
      supabase.from('habits').select('name,target_frequency').eq('user_id', userId).limit(5),
      supabase.from('categories').select('id,name,budget_limit').eq('user_id', userId),
      supabase.from('ai_coach_logs').select('user_message,insight').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
      supabase.from('transactions').select('amount').eq('user_id', userId).eq('type', 'expense').gte('date', startOfMonth).lte('date', today),
    ])

    const totalExpense = (monthTxs || []).reduce((s, t) => s + Number(t.amount), 0)
    const dailyAvg = dayOfMonth > 0 ? totalExpense / dayOfMonth : 0
    const projected = totalExpense + dailyAvg * daysLeft

    const historyText = (historyLogs || [])
      .reverse()
      .map((l: { user_message: string | null; insight: string | null }) =>
        `${l.user_message ? `Usuário: ${l.user_message}` : ''}${l.insight ? `\nIvy: ${l.insight}` : ''}`
      )
      .join('\n')

    const catsText = (categories || []).map((c: { id: string; name: string }) => `"${c.name}" (id: ${c.id})`).join(', ')

    // ── 3. Prompt Ollama ───────────────────────────────────────────────────
    const prompt = `Você é a Ivy, assistente financeira do Invy-You.

Mensagem: "${message}"

Histórico recente:
${historyText || 'Sem histórico'}

Contexto:
- Transações recentes: ${JSON.stringify(transactions ?? [])}
- Metas: ${JSON.stringify(goals ?? [])}
- Hábitos: ${JSON.stringify(habits ?? [])}
- Gasto total este mês: R$${totalExpense.toFixed(2)}
- Média diária: R$${dailyAvg.toFixed(2)}
- Projeção fim de mês: R$${projected.toFixed(2)} (${daysLeft} dias restantes)
- Categorias: ${catsText || 'Nenhuma'}

Responda APENAS com JSON válido:
{
  "action": "add_expense" | "add_income" | "query_expenses" | "query_habits" | "query_goals" | "chat",
  "data": { "amount": numero_ou_null, "description": "texto_ou_null", "category_id": "uuid_ou_null" },
  "response": "resposta amigável em português (máximo 3 frases)"
}

Regras:
- "gastei/paguei X" → add_expense, tenta category_id pelo nome
- "recebi X" → add_income
- Menciona a projeção de fim de mês quando relevante
- Responde com contexto do histórico para parecer natural`

    const rawResponse = await callAI(prompt)
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON')
    const aiResult = JSON.parse(jsonMatch[0]) as { action: string; data: Record<string, unknown>; response: string }

    // ── 4. Execute action ──────────────────────────────────────────────────
    let budgetAlert: string | null = null

    if ((aiResult.action === 'add_expense' || aiResult.action === 'add_income') && aiResult.data?.amount) {
      const categoryId = (aiResult.data.category_id as string) ?? null
      const { error } = await supabase.from('transactions').insert({
        user_id: userId,
        amount: aiResult.data.amount,
        description: aiResult.data.description ?? message,
        type: aiResult.action === 'add_expense' ? 'expense' : 'income',
        category_id: categoryId,
        date: today,
      })

      if (error) {
        console.error('Insert error:', error.message)
      } else if (aiResult.action === 'add_expense' && categoryId) {
        // Check budget alert for this category
        const { data: cat } = await supabase.from('categories').select('name,budget_limit').eq('id', categoryId).single()
        if (cat && Number(cat.budget_limit) > 0) {
          const { data: catTxs } = await supabase.from('transactions').select('amount')
            .eq('user_id', userId).eq('category_id', categoryId).eq('type', 'expense')
            .gte('date', startOfMonth).lte('date', today)
          const spent = (catTxs || []).reduce((s, t) => s + Number(t.amount), 0)
          const pct = (spent / Number(cat.budget_limit)) * 100
          if (pct >= 80) {
            const emoji = pct >= 100 ? '🔴' : '🟡'
            budgetAlert = `${emoji} Alerta: já usaste ${pct.toFixed(0)}% do orçamento de ${cat.name} este mês.`
          }
        }
      }
    }

    const finalResponse = budgetAlert
      ? `${aiResult.response} ${budgetAlert}`
      : aiResult.response

    // ── 5. Log ─────────────────────────────────────────────────────────────
    await supabase.from('ai_coach_logs').insert({
      user_id: userId,
      user_message: message,
      insight: finalResponse,
      direction: 'inbound',
    })

    return new Response(JSON.stringify({
      response: finalResponse,
      action: aiResult.action,
      ...(isVoice ? { transcribed: message } : {}),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('ivy-chat error:', error.message)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
