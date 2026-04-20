import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const cronSecret = Deno.env.get("CRON_SECRET")!;
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is admin
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: roleData } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action") ?? "list";

    if (action === "trigger") {
      // Dispara invy-weekly-summary manualmente
      const triggerRes = await fetch(`${supabaseUrl}/functions/v1/invy-weekly-summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-cron-secret": cronSecret,
        },
        body: JSON.stringify({ triggered_by: user.email, manual: true }),
      });
      const triggerBody = await triggerRes.json().catch(() => ({}));
      return new Response(
        JSON.stringify({ ok: triggerRes.ok, status: triggerRes.status, result: triggerBody }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // action === "list" — busca cron jobs via REST (cron schema não acessível direto pelo client)
    // Usamos um workaround: contamos resumos da última semana pra dar contexto.
    const { count: weeklyCount } = await admin
      .from("weekly_summaries")
      .select("*", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    const { data: lastSummary } = await admin
      .from("weekly_summaries")
      .select("created_at, week_start, week_end")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const jobs = [
      {
        name: "invy-weekly-summary",
        schedule: "0 23 * * 0 (Domingo 23h UTC)",
        description: "Gera resumo semanal de finanças via IA pra todos os usuários",
        last_run: lastSummary?.created_at ?? null,
        last_period: lastSummary ? `${lastSummary.week_start} → ${lastSummary.week_end}` : null,
        summaries_last_7d: weeklyCount ?? 0,
        status: "active",
      },
    ];

    return new Response(JSON.stringify({ jobs }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("admin-cron error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
