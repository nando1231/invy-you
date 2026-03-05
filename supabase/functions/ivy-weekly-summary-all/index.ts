import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? 'http://host.docker.internal:54321'
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const OLLAMA_URL = Deno.env.get('OLLAMA_URL') ?? 'http://host.docker.internal:11434/api/generate'
const OLLAMA_MODEL = Deno.env.get('OLLAMA_MODEL') ?? 'qwen3:8b'
const WAHA_URL = Deno.env.get('WAHA_URL') ?? 'http://host.docker.internal:3000'
const WAHA_API_KEY = Deno.env.get('WAHA_API_KEY') ?? ''
const CRON_SECRET = Deno.env.get('CRON_SECRET') ?? 'change-me'

async function sendWhatsApp(chatId: string, text: string) {
  await fetch(`${WAHA_URL}/api/sendText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Api-Key': WAHA_API_KEY },
    body: JSON.stringify({ chatId, text, session: 'default' }),
  }).catch(e => console.error('sendWhatsApp error:', e))
}

async function generateSummary(
  name: string,
  totalIncome: number,
  totalExpense: number,
  habitsCompleted: number,
  totalHabits: number,
  goals: unknown[]
): Promise<string> {
  const prompt = `Você é a Ivy, coach financeira do Invy-You. Gere um resumo semanal CURTO (máximo 4 frases) e motivador em português para ${name || 'o utilizador'}.

Dados da semana:
- Receitas: R$${totalIncome.toFixed(2)}
- Despesas: R$${totalExpense.toFixed(2)}
- Saldo: R$${(totalIncome - totalExpense).toFixed(2)}
- Hábitos cumpridos: ${habitsCompleted}/${totalHabits}
- Metas em curso: ${JSON.stringify(goals.slice(0, 2))}

Seja concisa, empática e dê 1 dica prática para a próxima semana. Não use markdown.`

  const res = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: OLLAMA_MODEL, prompt, stream: false }),
  })
  const data = await res.json()
  return data.response?.trim() ?? 'Resumo indisponível.'
}

serve(async (req) => {
  // Validate cron secret
  const cronSecret = req.headers.get('x-cron-secret') ?? ''
  if (cronSecret !== CRON_SECRET) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Fetch all users with AI coach enabled and WhatsApp configured
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, whatsapp_number')
      .eq('ai_coach_enabled', true)
      .not('whatsapp_number', 'is', null)

    if (!profiles?.length) {
      return new Response(JSON.stringify({ processed: 0 }))
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const today = new Date().toISOString().split('T')[0]
    let processed = 0

    for (const profile of profiles) {
      try {
        const [{ data: transactions }, { data: habits }, { data: habitLogs }, { data: goals }] = await Promise.all([
          supabase.from('transactions').select('amount,type').eq('user_id', profile.user_id).gte('date', sevenDaysAgo).lte('date', today),
          supabase.from('habits').select('name').eq('user_id', profile.user_id),
          supabase.from('habit_logs').select('habit_id').eq('user_id', profile.user_id).gte('completed_at', sevenDaysAgo),
          supabase.from('goals').select('title,target_value,current_value').eq('user_id', profile.user_id).eq('is_completed', false).limit(3),
        ])

        const totalIncome = (transactions || []).filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
        const totalExpense = (transactions || []).filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
        const habitsCompleted = new Set((habitLogs || []).map(l => l.habit_id)).size
        const totalHabits = (habits || []).length

        const summary = await generateSummary(profile.full_name, totalIncome, totalExpense, habitsCompleted, totalHabits, goals || [])

        const chatId = `${profile.whatsapp_number.replace(/\D/g, '')}@c.us`
        await sendWhatsApp(chatId, `📅 *Resumo Semanal — Ivy*\n\n${summary}`)

        await supabase.from('ai_coach_logs').insert({
          user_id: profile.user_id,
          insight: summary,
          direction: 'outbound',
        })

        processed++
      } catch (e) {
        console.error(`Error processing user ${profile.user_id}:`, e.message)
      }
    }

    return new Response(JSON.stringify({ processed }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('ivy-weekly-summary-all error:', error.message)
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 })
  }
})
