// Gera resumo semanal proativo da Invy para todos os usuários ativos.
// Disparado por cron todo domingo 23h UTC.
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

async function sb(path: string, init: RequestInit = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      ...((init.headers as Record<string, string>) ?? {}),
    },
  });
}

function weekRange(now = new Date()) {
  // Semana = últimos 7 dias até ontem (resumo enviado domingo)
  const end = new Date(now);
  end.setUTCDate(end.getUTCDate() - 1);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 6);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

async function generateForUser(userId: string, firstName: string | null) {
  const { start, end } = weekRange();
  const txRes = await sb(
    `transactions?user_id=eq.${userId}&date=gte.${start}&date=lte.${end}&order=date.desc&limit=200`,
  );
  const transactions = txRes.ok ? await txRes.json() : [];
  if (!transactions.length) return null;

  const catRes = await sb(`categories?user_id=eq.${userId}&limit=50`);
  const categories = catRes.ok ? await catRes.json() : [];
  const catMap = new Map(categories.map((c: any) => [c.id, c.name]));

  let income = 0, expense = 0;
  const catSpend: Record<string, number> = {};
  for (const t of transactions) {
    const v = Number(t.amount);
    if (t.type === "income") income += v;
    else {
      expense += v;
      const c = (t.category_id && catMap.get(t.category_id)) || "Sem categoria";
      catSpend[c] = (catSpend[c] || 0) + v;
    }
  }
  const topCat = Object.entries(catSpend).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  const topCatList = Object.entries(catSpend)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k, v]) => `${k}: R$ ${v.toFixed(2)}`)
    .join(", ");

  const prompt = `Faça um resumo semanal CURTO (máx 3 parágrafos curtos) pra ${firstName ?? "essa pessoa"}, no tom da Invy: amiga conselheira de finanças, brasileira, direta, sem travessão (— ou –), sem formalismo. Use vírgula ou ponto.

Dados da semana ${start} a ${end}:
- Receitas: R$ ${income.toFixed(2)}
- Despesas: R$ ${expense.toFixed(2)}
- Saldo: R$ ${(income - expense).toFixed(2)}
- Top 3 categorias: ${topCatList || "—"}
- ${transactions.length} transações no total

Escreva como se tivesse mandando uma mensagem pro WhatsApp. Comente o saldo, destaque a categoria que mais pesou e termine com 1 dica prática pra próxima semana. Não cumprimente formalmente.`;

  const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!aiResp.ok) {
    console.error("AI fail for user", userId, aiResp.status);
    return null;
  }
  const data = await aiResp.json();
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) return null;

  // Upsert (ignore if já existe)
  await sb("weekly_summaries", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({
      user_id: userId,
      week_start: start,
      week_end: end,
      content,
      total_income: income,
      total_expense: expense,
      top_category: topCat,
    }),
  });
  return content;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Pega todos os perfis (usuários ativos)
    const profilesRes = await sb(`profiles?select=user_id,full_name`);
    const profiles = profilesRes.ok ? await profilesRes.json() : [];

    let generated = 0;
    for (const p of profiles) {
      const firstName = p.full_name?.split(" ")[0] ?? null;
      try {
        const r = await generateForUser(p.user_id, firstName);
        if (r) generated++;
      } catch (e) {
        console.error("user fail", p.user_id, e);
      }
    }

    return new Response(JSON.stringify({ ok: true, generated, total: profiles.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("weekly-summary error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "erro" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
