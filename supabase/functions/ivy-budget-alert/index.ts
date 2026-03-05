import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? 'http://host.docker.internal:54321'
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const WAHA_URL = Deno.env.get('WAHA_URL') ?? 'http://host.docker.internal:3000'
const WAHA_API_KEY = Deno.env.get('WAHA_API_KEY') ?? ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

async function sendWhatsApp(chatId: string, text: string) {
  await fetch(`${WAHA_URL}/api/sendText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Api-Key': WAHA_API_KEY },
    body: JSON.stringify({ chatId, text, session: 'default' }),
  }).catch(e => console.error('sendWhatsApp error:', e))
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // Decode JWT to get user_id
    const authHeader = req.headers.get('Authorization') ?? ''
    const jwt = authHeader.replace('Bearer ', '')
    if (!jwt) return new Response('Unauthorized', { status: 401, headers: corsHeaders })

    const [, payloadB64] = jwt.split('.')
    const padding = '='.repeat((4 - (payloadB64.length % 4)) % 4)
    const payload = JSON.parse(atob(payloadB64 + padding))
    const userId: string = payload.sub
    if (!userId) return new Response('Unauthorized', { status: 401, headers: corsHeaders })

    const { category_id } = await req.json()

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get user profile for WhatsApp number
    const { data: profile } = await supabase
      .from('profiles')
      .select('whatsapp_number, ai_coach_enabled')
      .eq('user_id', userId)
      .single()

    if (!profile?.ai_coach_enabled || !profile?.whatsapp_number) {
      return new Response(JSON.stringify({ skipped: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Get category info
    const { data: cat } = await supabase
      .from('categories')
      .select('name, budget_limit')
      .eq('id', category_id)
      .eq('user_id', userId)
      .single()

    if (!cat || !Number(cat.budget_limit)) {
      return new Response(JSON.stringify({ skipped: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Calculate month spending for this category
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const today = now.toISOString().split('T')[0]

    const { data: txs } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('category_id', category_id)
      .eq('type', 'expense')
      .gte('date', startOfMonth)
      .lte('date', today)

    const spent = (txs || []).reduce((s, t) => s + Number(t.amount), 0)
    const budget = Number(cat.budget_limit)
    const pct = (spent / budget) * 100

    let alerted = false
    if (pct >= 80) {
      const emoji = pct >= 100 ? '🔴' : '🟡'
      const chatId = `${profile.whatsapp_number.replace(/\D/g, '')}@c.us`
      await sendWhatsApp(chatId, `${emoji} *Alerta de Orçamento — Ivy*\n\nJá gastaste *${pct.toFixed(0)}%* do orçamento de *${cat.name}* este mês.\n\nGasto: R$${spent.toFixed(2)} / Limite: R$${budget.toFixed(2)}`)
      alerted = true
    }

    return new Response(JSON.stringify({ alerted, pct: pct.toFixed(0) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('ivy-budget-alert error:', error.message)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
