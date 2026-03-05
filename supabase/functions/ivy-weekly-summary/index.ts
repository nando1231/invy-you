import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { callAI } from "../_shared/ai-provider.ts"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? 'http://host.docker.internal:54321'
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const WAHA_URL = Deno.env.get('WAHA_URL') ?? 'http://host.docker.internal:3000'
const WAHA_API_KEY = Deno.env.get('WAHA_API_KEY') ?? ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // Extract user from JWT
    const authHeader = req.headers.get('Authorization') ?? ''
    const jwt = authHeader.replace('Bearer ', '')
    if (!jwt) return new Response('Unauthorized', { status: 401, headers: corsHeaders })

    const [, payloadB64] = jwt.split('.')
    const padding = '='.repeat((4 - (payloadB64.length % 4)) % 4)
    const payload = JSON.parse(atob(payloadB64 + padding))
    const userId: string = payload.sub

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('ai_coach_enabled, whatsapp_number, full_name')
      .eq('user_id', userId)
      .single()

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const today = new Date().toISOString().split('T')[0]

    // Get week data
    const [{ data: transactions }, { data: habits }, { data: habitLogs }, { data: goals }] = await Promise.all([
      supabase.from('transactions').select('amount,description,type,date').eq('user_id', userId).gte('date', sevenDaysAgo).lte('date', today),
      supabase.from('habits').select('name').eq('user_id', userId),
      supabase.from('habit_logs').select('habit_id,completed_at').eq('user_id', userId).gte('completed_at', sevenDaysAgo),
      supabase.from('goals').select('title,target_value,current_value').eq('user_id', userId).eq('is_completed', false).limit(3),
    ])

    const totalIncome = (transactions || []).filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
    const totalExpense = (transactions || []).filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
    const habitsCompleted = new Set((habitLogs || []).map(l => l.habit_id)).size
    const totalHabits = (habits || []).length

    const prompt = `Você é a Ivy, coach financeira do Invy-You. Gere um resumo semanal CURTO (máximo 4 frases) e motivador em português para ${profile?.full_name || 'o utilizador'}.

Dados da semana:
- Receitas: R$${totalIncome.toFixed(2)}
- Despesas: R$${totalExpense.toFixed(2)}
- Saldo: R$${(totalIncome - totalExpense).toFixed(2)}
- Hábitos cumpridos: ${habitsCompleted}/${totalHabits}
- Metas em curso: ${JSON.stringify(goals?.slice(0, 2))}

Seja concisa, empática e dê 1 dica prática para a próxima semana. Não use markdown.`

    const summary: string = await callAI(prompt) || 'Resumo indisponível.'

    // Send via WhatsApp if configured
    if (profile?.whatsapp_number) {
      const chatId = `${profile.whatsapp_number.replace(/\D/g, '')}@c.us`
      await fetch(`${WAHA_URL}/api/sendText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Api-Key': WAHA_API_KEY },
        body: JSON.stringify({ chatId, text: `📅 *Resumo Semanal — Ivy*\n\n${summary}`, session: 'default' }),
      })
    }

    // Log
    await supabase.from('ai_coach_logs').insert({ user_id: userId, insight: summary, direction: 'outbound' })

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('ivy-weekly-summary error:', error.message)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
