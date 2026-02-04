import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

type StripeSubscription = Stripe.Subscription;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // First, check if user is in free trial period (no credit card required)
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("trial_ends_at, created_at")
      .eq("user_id", user.id)
      .single();

    if (profileError) {
      logStep("Error fetching profile", { error: profileError.message });
    }

    const now = new Date();
    
    // Check free trial (no payment required)
    if (profile?.trial_ends_at) {
      const trialEndsAt = new Date(profile.trial_ends_at);
      if (now < trialEndsAt) {
        logStep("User is in free trial period", { trialEndsAt: profile.trial_ends_at });
        return new Response(JSON.stringify({
          subscribed: true,
          is_trial: true,
          is_free_trial: true, // New flag to indicate no-card trial
          product_id: null,
          subscription_end: profile.trial_ends_at,
          trial_days_remaining: Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    // If free trial expired, check Stripe for paid subscription
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found and trial expired, returning unsubscribed state");
      return new Response(JSON.stringify({ 
        subscribed: false,
        is_trial: false,
        is_free_trial: false,
        product_id: null,
        subscription_end: null,
        trial_expired: true
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Check for active or trialing subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 10,
    });
    
    // Find active or trialing subscription
    const activeSubscription = subscriptions.data.find(
      (sub: StripeSubscription) => sub.status === "active" || sub.status === "trialing"
    );

    if (!activeSubscription) {
      logStep("No active subscription found and trial expired");
      return new Response(JSON.stringify({ 
        subscribed: false,
        is_trial: false,
        is_free_trial: false,
        product_id: null,
        subscription_end: null,
        trial_expired: true
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const subscriptionEnd = new Date(activeSubscription.current_period_end * 1000).toISOString();
    const isTrial = activeSubscription.status === "trialing";
    const productId = activeSubscription.items.data[0]?.price?.product as string;
    
    logStep("Active subscription found", { 
      subscriptionId: activeSubscription.id, 
      status: activeSubscription.status,
      isTrial,
      endDate: subscriptionEnd 
    });

    return new Response(JSON.stringify({
      subscribed: true,
      is_trial: isTrial,
      is_free_trial: false,
      product_id: productId,
      subscription_end: subscriptionEnd
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
