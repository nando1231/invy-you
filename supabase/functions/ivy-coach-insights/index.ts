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

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization') ?? ''
    const jwt = authHeader.replace('Bearer ', '')
    if (!jwt) return new Response('Unauthorized', { status: 401, headers: corsHeaders })

    const [, payloadB64] = jwt.split('.')
    const padding = '='.repeat((4 - (payloadB64.length % 4)) % 4)
    const payload = JSON.parse(atob(payloadB64 + padding))
    const userId: string = payload.sub
    if (!userId) return new Response('Unauthorized', { status: 401, headers: corsHeaders })

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data: profile } = await supabase
      .from('profiles')
      .select('whatsapp_number, ai_coach_enabled, full_name')
      .eq('user_id', userId)
      .single()

    // Fetch last 30 days of transactions
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const today = new Date().toISOString().split('T')[0]

    const [{ data: recentTxs }, { data: prevTxs }, { data: categories }] = await Promise.all([
      supabase.from('transactions').select('amount,type,date,category_id').eq('user_id', userId).eq('type', 'expense').gte('date', thirtyDaysAgo).lte('date', today),
      supabase.from('transactions').select('amount,category_id').eq('user_id', userId).eq('type', 'expense').gte('date', sixtyDaysAgo).lt('date', thirtyDaysAgo),
      supabase.from('categories').select('id,name').eq('user_id', userId),
    ])

    const txs = recentTxs || []
    const prevTxsData = prevTxs || []

    // Pattern 1: day of week with most spending
    const byDayOfWeek: Record<number, number> = {}
    txs.forEach(t => {
      const dow = new Date(t.date).getDay()
      byDayOfWeek[dow] = (byDayOfWeek[dow] || 0) + Number(t.amount)
    })
    const topDow = Object.entries(byDayOfWeek).sort((a, b) => Number(b[1]) - Number(a[1]))[0]
    const topDayName = topDow ? DAY_NAMES[Number(topDow[0])] : null

    // Pattern 2: category with biggest growth vs previous 30 days
    const catMap: Record<string, { name: string; recent: number; prev: number }> = {}
    const getCatName = (id: string) => (categories || []).find(c => c.id === id)?.name ?? 'Sem categoria'

    txs.forEach(t => {
      const catId = t.category_id ?? 'none'
      if (!catMap[catId]) catMap[catId] = { name: getCatName(catId), recent: 0, prev: 0 }
      catMap[catId].recent += Number(t.amount)
    })
    prevTxsData.forEach(t => {
      const catId = t.category_id ?? 'none'
      if (!catMap[catId]) catMap[catId] = { name: getCatName(catId), recent: 0, prev: 0 }
      catMap[catId].prev += Number(t.amount)
    })

    const growingCats = Object.values(catMap)
      .filter(c => c.prev > 0 && c.recent > c.prev)
      .map(c => ({ ...c, growth: ((c.recent - c.prev) / c.prev) * 100 }))
      .sort((a, b) => b.growth - a.growth)
      .slice(0, 2)

    const totalRecent = txs.reduce((s, t) => s + Number(t.amount), 0)
    const totalPrev = prevTxsData.reduce((s, t) => s + Number(t.amount), 0)

    const patternSummary = [
      topDayName ? `Dia com mais gastos: ${topDayName} (R$${(byDayOfWeek[Number(topDow[0])] || 0).toFixed(2)})` : '',
      growingCats.length ? `Categorias em crescimento: ${growingCats.map(c => `${c.name} +${c.growth.toFixed(0)}%`).join(', ')}` : '',
      `Total 30 dias: R$${totalRecent.toFixed(2)} vs período anterior: R$${totalPrev.toFixed(2)}`,
    ].filter(Boolean).join('\n')

    const prompt = `Você é a Ivy, coach financeira do Invy-You. Analise os padrões de gastos de ${profile?.full_name || 'o utilizador'} e gere 2-3 insights práticos em português.

Padrões identificados:
${patternSummary}

Seja direta, empática e dê sugestões acionáveis. Máximo 5 frases. Não use markdown.`

    const insight: string = await callAI(prompt) || 'Análise indisponível.'

    // Send via WhatsApp if configured
    if (profile?.ai_coach_enabled && profile?.whatsapp_number) {
      const chatId = `${profile.whatsapp_number.replace(/\D/g, '')}@c.us`
      await fetch(`${WAHA_URL}/api/sendText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Api-Key': WAHA_API_KEY },
        body: JSON.stringify({ chatId, text: `🔍 *Análise de Padrões — Ivy*\n\n${insight}`, session: 'default' }),
      }).catch(e => console.error('WhatsApp error:', e))
    }

    await supabase.from('ai_coach_logs').insert({
      user_id: userId,
      insight,
      direction: 'outbound',
    })

    return new Response(JSON.stringify({ insight, patterns: patternSummary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('ivy-coach-insights error:', error.message)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
