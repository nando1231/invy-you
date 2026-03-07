// Shared AI provider abstraction for Invy-You edge functions.
// Set AI_PROVIDER to: ollama | openai | gemini | anthropic
// Defaults to ollama for backwards compatibility.

type Provider = 'ollama' | 'openai' | 'gemini' | 'anthropic'

export async function callAI(prompt: string): Promise<string> {
  const provider = (Deno.env.get('AI_PROVIDER') ?? 'ollama') as Provider

  switch (provider) {
    case 'openai':    return callOpenAI(prompt)
    case 'gemini':    return callGemini(prompt)
    case 'anthropic': return callAnthropic(prompt)
    default:          return callOllama(prompt)
  }
}

async function callOllama(prompt: string): Promise<string> {
  const url   = Deno.env.get('OLLAMA_URL')   ?? 'http://host.docker.internal:11434/api/generate'
  const model = Deno.env.get('OLLAMA_MODEL') ?? 'qwen3:8b'
  const res   = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ model, prompt, stream: false }),
  })
  const data = await res.json()
  return data.response?.trim() ?? ''
}

async function callOpenAI(prompt: string): Promise<string> {
  const apiKey = Deno.env.get('OPENAI_API_KEY') ?? ''
  const model  = Deno.env.get('OPENAI_MODEL')   ?? 'gpt-4o-mini'
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body:    JSON.stringify({
      model,
      messages:    [{ role: 'user', content: prompt }],
      temperature: 0.7,
    }),
  })
  const data = await res.json()
  return data.choices?.[0]?.message?.content?.trim() ?? ''
}

async function callGemini(prompt: string): Promise<string> {
  const apiKey = Deno.env.get('GEMINI_API_KEY') ?? ''
  const model  = Deno.env.get('GEMINI_MODEL')   ?? 'gemini-2.5-flash'
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { thinkingConfig: { thinkingBudget: 0 } },
      }),
    }
  )
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? ''
}

async function callAnthropic(prompt: string): Promise<string> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY') ?? ''
  const model  = Deno.env.get('ANTHROPIC_MODEL')   ?? 'claude-haiku-4-5-20251001'
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method:  'POST',
    headers: {
      'Content-Type':      'application/json',
      'x-api-key':         apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      messages:   [{ role: 'user', content: prompt }],
    }),
  })
  const data = await res.json()
  return data.content?.[0]?.text?.trim() ?? ''
}
