// Invy AI chat - streaming SSE via Lovable AI Gateway
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

async function sb(path: string, init: RequestInit = {}, userToken?: string) {
  const headers: Record<string, string> = {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${userToken ?? SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    ...((init.headers as Record<string, string>) ?? {}),
  };
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...init, headers });
}

async function getUser(token: string) {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_SERVICE_ROLE_KEY },
  });
  if (!r.ok) return null;
  return await r.json();
}

async function buildContext(userId: string) {
  const [txRes, taskRes, goalRes, habitRes] = await Promise.all([
    sb(`transactions?user_id=eq.${userId}&order=date.desc&limit=30`),
    sb(`tasks?user_id=eq.${userId}&is_completed=eq.false&order=created_at.desc&limit=15`),
    sb(`goals?user_id=eq.${userId}&is_completed=eq.false&order=created_at.desc&limit=10`),
    sb(`habits?user_id=eq.${userId}&order=created_at.desc&limit=10`),
  ]);
  const transactions = txRes.ok ? await txRes.json() : [];
  const tasks = taskRes.ok ? await taskRes.json() : [];
  const goals = goalRes.ok ? await goalRes.json() : [];
  const habits = habitRes.ok ? await habitRes.json() : [];

  const totalIn = transactions
    .filter((t: any) => t.type === "income")
    .reduce((s: number, t: any) => s + Number(t.amount), 0);
  const totalOut = transactions
    .filter((t: any) => t.type === "expense")
    .reduce((s: number, t: any) => s + Number(t.amount), 0);

  return `
DADOS DO USUÁRIO (use para personalizar respostas):
- Receitas (últimas 30 transações): R$ ${totalIn.toFixed(2)}
- Despesas (últimas 30 transações): R$ ${totalOut.toFixed(2)}
- Saldo: R$ ${(totalIn - totalOut).toFixed(2)}
- Últimas transações: ${JSON.stringify(transactions.slice(0, 10).map((t: any) => ({ d: t.date, desc: t.description, v: t.amount, tipo: t.type })))}
- Tarefas pendentes (${tasks.length}): ${JSON.stringify(tasks.slice(0, 5).map((t: any) => t.title))}
- Metas ativas (${goals.length}): ${JSON.stringify(goals.slice(0, 5).map((g: any) => ({ t: g.title, alvo: g.target_value, atual: g.current_value })))}
- Hábitos (${habits.length}): ${JSON.stringify(habits.slice(0, 5).map((h: any) => h.name))}
`.trim();
}

const SYSTEM_PROMPT = (ctx: string) => `Você é a Invy, assistente financeira e de produtividade do app Invyou.

PERSONALIDADE:
- Tom amigável, motivador e próximo, em português brasileiro (informal mas respeitoso).
- Concisa: máximo 3 parágrafos curtos. Use markdown (negrito, listas) para clareza.
- Use emojis com moderação (✨💰🎯).
- Sempre que possível, use os DADOS REAIS do usuário abaixo para personalizar.

O QUE VOCÊ FAZ:
1. Tira dúvidas sobre o app Invyou (financeiro, rotinas, metas, configurações).
2. Dá dicas financeiras personalizadas com base nos gastos reais.
3. Registra transações quando o usuário menciona um gasto/receita — use a tool create_transaction.
4. Analisa padrões de gastos, sugere economias.
5. Ajuda a criar e manter metas e hábitos.

REGRAS:
- Quando o usuário disser algo como "gastei 50 no mercado", "paguei 200 de luz", "recebi 1000 de salário", chame create_transaction com os dados extraídos. Confirme depois com uma frase curta.
- Se faltar info essencial (valor), pergunte antes.
- Nunca invente dados. Se não souber, diga.

${ctx}`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "create_transaction",
      description: "Registra uma transação financeira (receita ou despesa) do usuário.",
      parameters: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["income", "expense"], description: "income=receita, expense=despesa" },
          amount: { type: "number", description: "Valor em reais (positivo)" },
          description: { type: "string", description: "Descrição curta (ex: 'Mercado', 'Salário')" },
          date: { type: "string", description: "Data ISO YYYY-MM-DD. Se não informada, hoje." },
        },
        required: ["type", "amount", "description"],
        additionalProperties: false,
      },
    },
  },
];

async function executeTool(name: string, args: any, userId: string, userToken: string) {
  if (name === "create_transaction") {
    const payload = {
      user_id: userId,
      type: args.type,
      amount: Math.abs(Number(args.amount)),
      description: args.description,
      date: args.date || new Date().toISOString().slice(0, 10),
    };
    const r = await sb("transactions", { method: "POST", body: JSON.stringify(payload) }, userToken);
    if (!r.ok) return { ok: false, error: await r.text() };
    return { ok: true, message: `Transação registrada: ${payload.type === "income" ? "+" : "-"}R$ ${payload.amount.toFixed(2)} (${payload.description})` };
  }
  return { ok: false, error: "Tool desconhecida" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization") ?? "";
    const token = auth.replace("Bearer ", "");
    const user = token ? await getUser(token) : null;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, conversationId } = await req.json();
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ensure conversation
    let convId = conversationId as string | undefined;
    if (!convId) {
      const r = await sb("chat_conversations", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({ user_id: user.id, title: (messages[messages.length - 1]?.content ?? "Nova conversa").slice(0, 60) }),
      });
      const created = await r.json();
      convId = created[0]?.id;
    }

    // Persist last user message
    const lastUser = [...messages].reverse().find((m: any) => m.role === "user");
    if (lastUser && convId) {
      await sb("chat_messages", {
        method: "POST",
        body: JSON.stringify({ conversation_id: convId, user_id: user.id, role: "user", content: lastUser.content }),
      });
    }

    const ctx = await buildContext(user.id);

    // Call Lovable AI with tool support (loop for tool execution)
    let workingMessages: any[] = [
      { role: "system", content: SYSTEM_PROMPT(ctx) },
      ...messages,
    ];

    // First, non-streaming call to detect tool calls
    let assistantContent = "";
    for (let iteration = 0; iteration < 3; iteration++) {
      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: workingMessages,
          tools: TOOLS,
        }),
      });

      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições, tente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos da IA esgotados. Adicione créditos no workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!aiResp.ok) {
        const t = await aiResp.text();
        console.error("AI error", aiResp.status, t);
        return new Response(JSON.stringify({ error: "AI gateway error" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await aiResp.json();
      const choice = data.choices?.[0]?.message;
      const toolCalls = choice?.tool_calls;

      if (toolCalls && toolCalls.length > 0) {
        workingMessages.push(choice);
        for (const tc of toolCalls) {
          const args = JSON.parse(tc.function.arguments || "{}");
          const result = await executeTool(tc.function.name, args, user.id, token);
          workingMessages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: JSON.stringify(result),
          });
        }
        continue; // loop again to get final answer
      }

      assistantContent = choice?.content ?? "";
      break;
    }

    // Persist assistant message
    if (convId && assistantContent) {
      await sb("chat_messages", {
        method: "POST",
        body: JSON.stringify({ conversation_id: convId, user_id: user.id, role: "assistant", content: assistantContent }),
      });
      await sb(`chat_conversations?id=eq.${convId}`, {
        method: "PATCH",
        body: JSON.stringify({ updated_at: new Date().toISOString() }),
      });
    }

    return new Response(
      JSON.stringify({ content: assistantContent, conversationId: convId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("invy-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
