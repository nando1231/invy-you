import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export interface RecurringTransaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  day_of_month: number;
  icon: string;
  is_active: boolean;
  created_at: string;
}

export const useRecurringTransactions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecurring = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("recurring_transactions")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("type", { ascending: true });

    if (data) setRecurring(data as RecurringTransaction[]);
    setLoading(false);
  }, [user]);

  const addRecurring = async (item: {
    type: "income" | "expense";
    amount: number;
    description: string;
    day_of_month: number;
    icon?: string;
  }) => {
    if (!user) return;
    const { error } = await supabase.from("recurring_transactions").insert({
      user_id: user.id,
      ...item,
    });
    if (error) {
      toast({ title: "Erro ao adicionar", variant: "destructive" });
    } else {
      toast({ title: `${item.description} adicionado como recorrente!` });
      fetchRecurring();
    }
  };

  const removeRecurring = async (id: string) => {
    const { error } = await supabase
      .from("recurring_transactions")
      .delete()
      .eq("id", id);
    if (!error) {
      toast({ title: "Recorrente removido" });
      fetchRecurring();
    }
  };

  // Auto-generate transactions for current month
  const generateMonthlyTransactions = useCallback(async () => {
    if (!user) return;

    const currentMonth = format(new Date(), "yyyy-MM");

    // Get all active recurring
    const { data: activeRecurring } = await supabase
      .from("recurring_transactions")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true);

    if (!activeRecurring || activeRecurring.length === 0) return;

    // Get already generated logs for this month
    const { data: logs } = await supabase
      .from("recurring_transaction_logs")
      .select("recurring_id")
      .eq("user_id", user.id)
      .eq("generated_for_month", currentMonth);

    const generatedIds = new Set(logs?.map((l) => l.recurring_id) || []);

    // Generate missing ones
    for (const rec of activeRecurring) {
      if (generatedIds.has(rec.id)) continue;

      const day = Math.min(rec.day_of_month, 28);
      const transactionDate = `${currentMonth}-${String(day).padStart(2, "0")}`;

      const { data: txn, error: txnError } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          type: rec.type,
          amount: rec.amount,
          description: `${rec.description} (recorrente)`,
          date: transactionDate,
        })
        .select("id")
        .single();

      if (!txnError && txn) {
        await supabase.from("recurring_transaction_logs").insert({
          recurring_id: rec.id,
          user_id: user.id,
          generated_for_month: currentMonth,
          transaction_id: txn.id,
        });
      }
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchRecurring();
    }
  }, [user, fetchRecurring]);

  return {
    recurring,
    loading,
    addRecurring,
    removeRecurring,
    generateMonthlyTransactions,
    refetch: fetchRecurring,
  };
};
