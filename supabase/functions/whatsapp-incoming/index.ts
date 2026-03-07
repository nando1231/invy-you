import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { callAI } from "../_shared/ai-provider.ts"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? 'http://host.docker.internal:54321'
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const WHISPER_URL = Deno.env.get('WHISPER_URL') ?? 'http://host.docker.internal:9000'
const WAHA_URL = Deno.env.get('WAHA_URL') ?? 'http://host.docker.internal:3000'
const WAHA_API_KEY = Deno.env.get('WAHA_API_KEY') ?? ''
const WEBHOOK_TOKEN = Deno.env.get('WEBHOOK_TOKEN') ?? ''

// ── Types ──────────────────────────────────────────────────────────────────

interface Category { id: string; name: string; budget_limit: number }
interface HistoryEntry { role: 'user' | 'ivy'; text: string }
interface PendingTx { amount: number; description: string; type: 'expense' | 'income'; category_id: string | null }
interface Profile { user_id: string; ai_coach_enabled: boolean; whatsapp_number: string; full_name: string; pending_tx: PendingTx | null }

// ── Helpers ────────────────────────────────────────────────────────────────

async function sendWhatsApp(chatId: string, text: string) {
  await fetch(`${WAHA_URL}/api/sendText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Api-Key': WAHA_API_KEY },
    body: JSON.stringify({ chatId, text, session: 'default' }),
  }).catch(e => console.error('sendWhatsApp error:', e))
}

async function downloadMedia(messageId: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(
      `${WAHA_URL}/api/default/messages/${encodeURIComponent(messageId)}/download-media`,
      { headers: { 'X-Api-Key': WAHA_API_KEY } }
    )
    if (!res.ok) return null
    return new Uint8Array(await res.arrayBuffer())
  } catch { return null }
}

async function transcribeAudio(audioBytes: Uint8Array, mimeType: string): Promise<string | null> {
  try {
    const ext = mimeType.includes('ogg') ? 'ogg' : mimeType.includes('mp4') ? 'mp4' : 'ogg'
    const form = new FormData()
    form.append('audio_file', new Blob([audioBytes], { type: mimeType }), `audio.${ext}`)
    const res = await fetch(`${WHISPER_URL}/asr?encode=true&task=transcribe&language=pt&output=json`, { method: 'POST', body: form })
    if (!res.ok) return null
    const data = await res.json()
    return (data.text ?? '').trim() || null
  } catch { return null }
}

async function analyzeImage(imageBytes: Uint8Array): Promise<string | null> {
  try {
    let binary = ''
    for (let i = 0; i < imageBytes.length; i++) binary += String.fromCharCode(imageBytes[i])
    const base64 = btoa(binary)
    const prompt = `Analise esta imagem em base64: ${base64}\n\nSe for nota fiscal, recibo ou cupom: liste itens com valores e o total. Responda em português de forma concisa.`
    const result = await callAI(prompt)
    return result.trim() || null
  } catch { return null }
}

async function parseIntent(
  userMessage: string,
  context: { transactions: unknown; goals: unknown; habits: unknown; categories: Category[]; history: HistoryEntry[]; dailyAvg: number; projected: number; daysLeft: number }
) {
  const historyText = context.history.map(h => `${h.role === 'user' ? 'Usuário' : 'Ivy'}: ${h.text}`).join('\n')
  const catsText = context.categories.map(c => `"${c.name}" (id: ${c.id})`).join(', ')

  const prompt = `Você é a Ivy, assistente financeira do Invy-You. Usuário enviou mensagem pelo WhatsApp.

Mensagem: "${userMessage}"

Histórico recente da conversa:
${historyText || 'Sem histórico'}

Contexto financeiro:
- Transações recentes: ${JSON.stringify(context.transactions ?? [])}
- Metas ativas: ${JSON.stringify(context.goals ?? [])}
- Hábitos: ${JSON.stringify(context.habits ?? [])}
- Média diária de gastos: R$${context.dailyAvg.toFixed(2)}
- Projeção fim de mês: R$${context.projected.toFixed(2)} (${context.daysLeft} dias restantes)

Categorias disponíveis: ${catsText || 'Nenhuma'}

Responda APENAS com JSON válido (sem markdown, sem texto extra):
{
  "action": "add_expense" | "add_income" | "query_expenses" | "query_habits" | "query_goals" | "chat",
  "data": { "amount": numero_ou_null, "description": "texto_ou_null", "category_id": "uuid_ou_null" },
  "response": "resposta amigável em português (máximo 2 frases)"
}

Regras:
- "gastei/paguei/comprei X em Y" → add_expense, tenta associar category_id pelo contexto
- "recebi/salário/renda X" → add_income
- Perguntas sobre gastos → query_expenses, menciona projeção se relevante
- Notas fiscais → registra o total como add_expense`

  const rawResponse = await callAI(prompt)
  const jsonMatch = rawResponse.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON in response')
  return JSON.parse(jsonMatch[0]) as { action: string; data: Record<string, unknown>; response: string }
}

async function checkAndSendBudgetAlert(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  categoryId: string | null,
  whatsappNumber: string,
  chatId: string
) {
  if (!categoryId) return
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const today = now.toISOString().split('T')[0]

  const { data: cat } = await supabase.from('categories').select('name,budget_limit').eq('id', categoryId).single()
  if (!cat || !Number(cat.budget_limit)) return

  const { data: txs } = await supabase.from('transactions').select('amount')
    .eq('user_id', userId).eq('category_id', categoryId).eq('type', 'expense')
    .gte('date', startOfMonth).lte('date', today)

  const spent = (txs || []).reduce((s, t) => s + Number(t.amount), 0)
  const budget = Number(cat.budget_limit)
  const pct = (spent / budget) * 100

  if (pct >= 80) {
    const emoji = pct >= 100 ? '🔴' : '🟡'
    await sendWhatsApp(chatId, `${emoji} *Alerta de Orçamento — Ivy*\n\nJá gastaste *${pct.toFixed(0)}%* do orçamento de *${cat.name}*.\n\nGasto: R$${spent.toFixed(2)} / Limite: R$${budget.toFixed(2)}`)
  }
}

// ── Input sanitizer ────────────────────────────────────────────────────────

function sanitizeInput(input: string, maxLen = 800): string {
  return input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // strip control chars
    .replace(/```/g, "'''")                              // break prompt code blocks
    .slice(0, maxLen)
}

// ── Main handler ───────────────────────────────────────────────────────────

serve(async (req) => {
  try {
    // ── 0. Webhook token validation ─────────────────────────────────────
    if (WEBHOOK_TOKEN) {
      const provided = req.headers.get('x-webhook-token')
        ?? new URL(req.url).searchParams.get('token')
        ?? ''
      if (provided !== WEBHOOK_TOKEN) {
        return new Response('Unauthorized', { status: 401 })
      }
    }

    const body = await req.json()

    if (body.event !== 'message' || body.payload?.fromMe) {
      return new Response('ok', { status: 200 })
    }

    const from: string = body.payload?.from ?? ''
    if (!from) return new Response('ok', { status: 200 })

    const msgType: string = body.payload?.type ?? 'chat'
    const hasMedia: boolean = body.payload?.hasMedia ?? false
    const messageId: string = body.payload?.id?._serialized ?? body.payload?.id ?? ''
    const mimeType: string = body.payload?._data?.mimetype ?? ''
    const phoneNumber = from.replace('@c.us', '').replace(/\D/g, '')

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // ── 1. Identify user ────────────────────────────────────────────────
    const phoneAlt = phoneNumber.length === 12
      ? phoneNumber.slice(0, 4) + '9' + phoneNumber.slice(4)
      : phoneNumber.slice(0, 4) + phoneNumber.slice(5)

    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, ai_coach_enabled, whatsapp_number, full_name, pending_tx')
      .in('whatsapp_number', [phoneNumber, phoneAlt])
      .limit(1)

    const profile = profiles?.[0] as Profile | undefined
    if (!profile || !profile.ai_coach_enabled) return new Response('ok', { status: 200 })

    const userId = profile.user_id
    const rawMsg: string = sanitizeInput(body.payload?.body ?? '')

    // ── 2. Pending confirmation flow ────────────────────────────────────
    if (profile.pending_tx) {
      const msg = rawMsg.trim().toLowerCase()
      const isYes = ['sim', 's', 'yes', 'y', 'confirmar', 'confirma', 'ok', '✓'].includes(msg)
      const isNo = ['não', 'nao', 'n', 'no', 'cancelar', 'cancela', 'não quero'].includes(msg)

      if (isYes) {
        const pending = profile.pending_tx
        const { error } = await supabase.from('transactions').insert({
          user_id: userId,
          amount: pending.amount,
          description: pending.description,
          type: pending.type,
          category_id: pending.category_id,
          date: new Date().toISOString().split('T')[0],
        })
        await supabase.from('profiles').update({ pending_tx: null }).eq('user_id', userId)

        if (error) {
          await sendWhatsApp(from, '🌿 *Ivy*\n\nErro ao registar o lançamento. Tenta novamente!')
        } else {
          const typeLabel = pending.type === 'expense' ? 'Despesa' : 'Receita'
          await sendWhatsApp(from, `✅ *Ivy*\n\n${typeLabel} de *R$${Number(pending.amount).toFixed(2)}* registada com sucesso!`)
          if (pending.type === 'expense') {
            await checkAndSendBudgetAlert(supabase, userId, pending.category_id, profile.whatsapp_number, from)
          }
        }
        await supabase.from('ai_coach_logs').insert({ user_id: userId, user_message: rawMsg, insight: 'Transação confirmada e registada', direction: 'inbound' })
        return new Response('ok', { status: 200 })
      }

      if (isNo) {
        await supabase.from('profiles').update({ pending_tx: null }).eq('user_id', userId)
        await sendWhatsApp(from, '🌿 *Ivy*\n\nLançamento cancelado! Se precisar de mim, é só chamar.')
        await supabase.from('ai_coach_logs').insert({ user_id: userId, user_message: rawMsg, insight: 'Transação cancelada pelo utilizador', direction: 'inbound' })
        return new Response('ok', { status: 200 })
      }

      // Not a confirmation reply — clear pending and process as new message
      await supabase.from('profiles').update({ pending_tx: null }).eq('user_id', userId)
    }

    // ── 3. Extract message text ──────────────────────────────────────────
    let userMessage: string = rawMsg

    if (hasMedia && !userMessage) {
      const isAudio = msgType === 'ptt' || msgType === 'audio'
      const isImage = msgType === 'image' || msgType === 'document'

      if (isAudio) {
        await sendWhatsApp(from, '🎙️ *Ivy*\n\nRecebi seu áudio, transcrevendo...')
        const bytes = await downloadMedia(messageId)
        if (bytes) userMessage = await transcribeAudio(bytes, mimeType || 'audio/ogg; codecs=opus') ?? ''
        if (!userMessage) {
          await sendWhatsApp(from, '🌿 *Ivy*\n\nNão consegui entender o áudio. Tenta digitar!')
          return new Response('ok', { status: 200 })
        }
      } else if (isImage) {
        await sendWhatsApp(from, '📷 *Ivy*\n\nRecebi sua imagem, analisando...')
        const bytes = await downloadMedia(messageId)
        if (bytes) userMessage = await analyzeImage(bytes) ?? ''
        if (!userMessage) {
          await sendWhatsApp(from, '🌿 *Ivy*\n\nNão consegui analisar a imagem.')
          return new Response('ok', { status: 200 })
        }
      } else {
        return new Response('ok', { status: 200 })
      }
    }

    if (!userMessage) return new Response('ok', { status: 200 })

    // ── 4. Build rich context ────────────────────────────────────────────
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

    const totalExpenseMonth = (monthTxs || []).reduce((s, t) => s + Number(t.amount), 0)
    const dailyAvg = dayOfMonth > 0 ? totalExpenseMonth / dayOfMonth : 0
    const projected = totalExpenseMonth + dailyAvg * daysLeft

    const history: HistoryEntry[] = (historyLogs || [])
      .reverse()
      .flatMap((l: { user_message: string | null; insight: string | null }) => [
        ...(l.user_message ? [{ role: 'user' as const, text: l.user_message }] : []),
        ...(l.insight ? [{ role: 'ivy' as const, text: l.insight }] : []),
      ])

    // ── 5. Parse intent with full context ───────────────────────────────
    let aiResult: { action: string; data: Record<string, unknown>; response: string }
    try {
      aiResult = await parseIntent(userMessage, {
        transactions,
        goals,
        habits,
        categories: (categories || []) as Category[],
        history,
        dailyAvg,
        projected,
        daysLeft,
      })
    } catch (_) {
      await sendWhatsApp(from, '🌿 *Ivy*\n\nNão entendi. Tenta: "gastei 50 no mercado" ou envia uma foto de um recibo!')
      return new Response('ok', { status: 200 })
    }

    // ── 6. Store pending or execute ──────────────────────────────────────
    if ((aiResult.action === 'add_expense' || aiResult.action === 'add_income') && aiResult.data?.amount) {
      const pendingTx: PendingTx = {
        amount: Number(aiResult.data.amount),
        description: String(aiResult.data.description ?? userMessage),
        type: aiResult.action === 'add_expense' ? 'expense' : 'income',
        category_id: (aiResult.data.category_id as string) ?? null,
      }

      await supabase.from('profiles').update({ pending_tx: pendingTx }).eq('user_id', userId)

      const typeLabel = pendingTx.type === 'expense' ? 'despesa' : 'receita'
      const catName = pendingTx.category_id
        ? (categories || []).find((c: Category) => c.id === pendingTx.category_id)?.name
        : null
      const catInfo = catName ? ` em *${catName}*` : ''

      await sendWhatsApp(from, `🌿 *Ivy*\n\nConfirmas ${typeLabel} de *R$${pendingTx.amount.toFixed(2)}*${catInfo}?\n\nResponde *sim* para confirmar ou *não* para cancelar.`)
    } else {
      await sendWhatsApp(from, `🌿 *Ivy*\n\n${aiResult.response}`)
    }

    // ── 7. Log ───────────────────────────────────────────────────────────
    await supabase.from('ai_coach_logs').insert({
      user_id: userId,
      user_message: userMessage,
      insight: aiResult.response,
      direction: 'inbound',
    })

    return new Response('ok', { status: 200 })

  } catch (error) {
    console.error('whatsapp-incoming error:', error.message)
    return new Response('ok', { status: 200 })
  }
})
