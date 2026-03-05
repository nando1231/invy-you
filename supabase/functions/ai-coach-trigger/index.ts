import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { callAI } from "../_shared/ai-provider.ts"

const TRIGGER_SECRET = Deno.env.get('TRIGGER_SECRET') ?? ''

serve(async (req) => {
  // Validate Supabase webhook secret (set via DB webhook Authorization header)
  if (TRIGGER_SECRET) {
    const auth = req.headers.get('Authorization') ?? ''
    if (auth !== `Bearer ${TRIGGER_SECRET}`) {
      return new Response('Unauthorized', { status: 401 })
    }
  }

  const payload = await req.json()
  console.log("Webhook received:", payload.record?.description, payload.record?.amount)

  // Respond immediately so the DB webhook doesn't timeout
  // Process AI + WhatsApp in background
  EdgeRuntime.waitUntil(processAiCoach(payload))

  return new Response(JSON.stringify({ queued: true }), { status: 200 })
})

async function processAiCoach(payload: Record<string, unknown>) {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? 'http://host.docker.internal:54321',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const record = payload.record as Record<string, unknown>
    const userId = record?.user_id as string

    // 1. Check if AI Coach is enabled + get WhatsApp number
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('ai_coach_enabled, whatsapp_number')
      .eq('user_id', userId)
      .single()

    if (!profile?.ai_coach_enabled) {
      console.log("AI Coach disabled for user:", userId)
      return
    }

    // 2. Get last 10 transactions for context
    const { data: transactions } = await supabaseClient
      .from('transactions')
      .select('amount, description, type, date')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    // 3. Call AI provider
    const prompt = `Você é o Coach Financeiro do Invy-You. Analise o novo gasto abaixo e o histórico recente, e envie UMA dica curta (máximo 2 frases), empática e em português para o usuário via WhatsApp.

Novo gasto: R$${record.amount} em "${record.description}" (${record.type})
Histórico recente: ${JSON.stringify(transactions?.slice(0,5))}

Responda APENAS com a mensagem para o usuário, sem introduções.`

    console.log("Calling AI provider...")
    const insight = await callAI(prompt)
    console.log("AI Insight:", insight)

    // 4. Save log
    await supabaseClient.from('ai_coach_logs').insert({ user_id: userId, insight })

    // 5. Send WhatsApp via WAHA
    const whatsappNumber = profile.whatsapp_number
    if (whatsappNumber) {
      const WAHA_URL = Deno.env.get('WAHA_URL') || 'http://host.docker.internal:3000'
      const WAHA_API_KEY = Deno.env.get('WAHA_API_KEY') || ''
      const chatId = `${whatsappNumber.replace(/\D/g, '')}@c.us`

      await fetch(`${WAHA_URL}/api/sendText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Api-Key': WAHA_API_KEY },
        body: JSON.stringify({
          chatId,
          text: `💰 *Ivy*\n\n${insight}`,
          session: 'default',
        }),
      })
      console.log("WhatsApp sent to:", chatId)
    }
  } catch (error) {
    console.error("AI Coach error:", error.message)
  }
}
