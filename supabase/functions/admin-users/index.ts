import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization")!;

    // Verify caller is admin
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check admin role
    const { data: roleData } = await supabaseAdmin
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

    // Fetch all users from auth
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    if (usersError) throw usersError;

    // Fetch profiles
    const { data: profiles } = await supabaseAdmin.from("profiles").select("*");
    
    // Fetch transaction counts per user
    const { data: transactionCounts } = await supabaseAdmin
      .from("transactions")
      .select("user_id");
    
    // Fetch task counts per user
    const { data: taskCounts } = await supabaseAdmin
      .from("tasks")
      .select("user_id");

    // Fetch habit counts per user
    const { data: habitCounts } = await supabaseAdmin
      .from("habits")
      .select("user_id");

    // Fetch goal counts per user
    const { data: goalCounts } = await supabaseAdmin
      .from("goals")
      .select("user_id");

    // Fetch roles
    const { data: roles } = await supabaseAdmin.from("user_roles").select("*");

    // Build user summaries
    const userSummaries = users.map((u) => {
      const profile = profiles?.find((p) => p.user_id === u.id);
      const userRoles = roles?.filter((r) => r.user_id === u.id).map((r) => r.role) || [];
      const txCount = transactionCounts?.filter((t) => t.user_id === u.id).length || 0;
      const taskCount = taskCounts?.filter((t) => t.user_id === u.id).length || 0;
      const habitCount = habitCounts?.filter((h) => h.user_id === u.id).length || 0;
      const goalCount = goalCounts?.filter((g) => g.user_id === u.id).length || 0;

      return {
        id: u.id,
        email: u.email,
        full_name: profile?.full_name || u.user_metadata?.full_name || null,
        avatar_url: profile?.avatar_url || null,
        roles: userRoles,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        email_confirmed_at: u.email_confirmed_at,
        trial_ends_at: profile?.trial_ends_at || null,
        stats: {
          transactions: txCount,
          tasks: taskCount,
          habits: habitCount,
          goals: goalCount,
        },
      };
    });

    return new Response(JSON.stringify({ users: userSummaries, total: userSummaries.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("admin-users error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
