import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SubscriptionState {
  subscribed: boolean;
  isTrial: boolean;
  productId: string | null;
  subscriptionEnd: string | null;
  loading: boolean;
  error: string | null;
}

// Price IDs
const PRICES = {
  monthly: "price_1Sx9u2DLlJb4M4aZHmGGPdsf",    // R$29,90/mês
  quarterly: "price_1Sx9z3DLlJb4M4aZ1XExqoNn",  // R$45/3 meses
};

export const useSubscription = () => {
  const { user } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    subscribed: false,
    isTrial: false,
    productId: null,
    subscriptionEnd: null,
    loading: true,
    error: null,
  });

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setState(prev => ({ ...prev, loading: false, subscribed: false }));
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const { data, error } = await supabase.functions.invoke("check-subscription");
      
      if (error) throw error;
      
      setState({
        subscribed: data.subscribed ?? false,
        isTrial: data.is_trial ?? false,
        productId: data.product_id ?? null,
        subscriptionEnd: data.subscription_end ?? null,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error("Error checking subscription:", error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Failed to check subscription",
      }));
    }
  }, [user]);

  const createCheckout = async (plan: "monthly" | "quarterly" = "monthly") => {
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: PRICES[plan] }
      });
      
      if (error) throw error;
      
      if (data?.url) {
        // Use location.href for better compatibility - popup blockers often block window.open
        window.location.href = data.url;
      } else {
        throw new Error("Checkout URL not received");
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      throw error;
    }
  };

  const openCustomerPortal = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      
      if (error) throw error;
      
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Portal URL not received");
      }
    } catch (error) {
      console.error("Error opening customer portal:", error);
      throw error;
    }
  };

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Auto-refresh every minute
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  return {
    ...state,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
  };
};
