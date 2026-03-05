import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, startOfMonth, endOfMonth } from "date-fns";

export interface Achievement {
  key: string;
  title: string;
  description: string;
  icon: string;
  unlocked_at?: string;
}

const DEFS: Omit<Achievement, "unlocked_at">[] = [
  { key: "first_transaction", title: "Primeiro Passo", description: "Registaste a primeira transação", icon: "💰" },
  { key: "first_habit", title: "Criador de Hábitos", description: "Criaste o primeiro hábito", icon: "⭐" },
  { key: "first_goal", title: "Sonhador", description: "Criaste a primeira meta", icon: "🎯" },
  { key: "goal_achieved", title: "Realizador", description: "Alcançaste uma meta", icon: "🏆" },
  { key: "streak_7", title: "Sequência de 7", description: "7 dias consecutivos num hábito", icon: "🔥" },
  { key: "positive_month", title: "Mês no Verde", description: "Mês com saldo positivo", icon: "💚" },
  { key: "transactions_10", title: "Financeiro Ativo", description: "10 transações registadas", icon: "📊" },
];

export const useAchievements = () => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [newUnlocks, setNewUnlocks] = useState<Achievement[]>([]);

  const fetchAndCheck = useCallback(async () => {
    if (!user) return;

    const { data: existing } = await supabase
      .from("achievements" as any)
      .select("key, unlocked_at")
      .eq("user_id", user.id);

    const unlockedKeys = new Set((existing || []).map((a: any) => a.key));
    const unlocked: Achievement[] = DEFS
      .filter((def) => unlockedKeys.has(def.key))
      .map((def) => ({
        ...def,
        unlocked_at: (existing || []).find((a: any) => a.key === def.key)?.unlocked_at,
      }));
    setAchievements(unlocked);

    const toUnlock: Omit<Achievement, "unlocked_at">[] = [];

    const check = async (key: string, condition: () => Promise<boolean>) => {
      if (!unlockedKeys.has(key)) {
        if (await condition()) {
          const def = DEFS.find((d) => d.key === key);
          if (def) toUnlock.push(def);
        }
      }
    };

    await check("first_transaction", async () => {
      const { count } = await supabase.from("transactions").select("id", { count: "exact", head: true }).eq("user_id", user.id);
      return (count ?? 0) >= 1;
    });

    await check("first_habit", async () => {
      const { count } = await supabase.from("habits").select("id", { count: "exact", head: true }).eq("user_id", user.id);
      return (count ?? 0) >= 1;
    });

    await check("first_goal", async () => {
      const { count } = await supabase.from("goals").select("id", { count: "exact", head: true }).eq("user_id", user.id);
      return (count ?? 0) >= 1;
    });

    await check("goal_achieved", async () => {
      const { count } = await supabase.from("goals").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("is_completed", true);
      return (count ?? 0) >= 1;
    });

    await check("transactions_10", async () => {
      const { count } = await supabase.from("transactions").select("id", { count: "exact", head: true }).eq("user_id", user.id);
      return (count ?? 0) >= 10;
    });

    await check("positive_month", async () => {
      const start = format(startOfMonth(new Date()), "yyyy-MM-dd");
      const end = format(endOfMonth(new Date()), "yyyy-MM-dd");
      const { data: txs } = await supabase.from("transactions").select("type, amount").eq("user_id", user.id).gte("date", start).lte("date", end);
      if (!txs) return false;
      const inc = txs.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
      const exp = txs.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
      return inc > exp && inc > 0;
    });

    await check("streak_7", async () => {
      const { data: logs } = await supabase.from("habit_logs").select("completed_at").eq("user_id", user.id).order("completed_at", { ascending: false }).limit(30);
      if (!logs || logs.length < 7) return false;
      let consecutive = 0;
      for (let i = 0; i < 7; i++) {
        const d = format(new Date(Date.now() - i * 86400000), "yyyy-MM-dd");
        if (logs.some((l) => l.completed_at === d)) consecutive++;
        else break;
      }
      return consecutive >= 7;
    });

    if (toUnlock.length > 0) {
      const inserts = toUnlock.map((a) => ({ user_id: user.id, key: a.key, title: a.title, description: a.description, icon: a.icon }));
      await supabase.from("achievements" as any).upsert(inserts, { onConflict: "user_id,key", ignoreDuplicates: true });
      const newOnes = toUnlock as Achievement[];
      setNewUnlocks(newOnes);
      setAchievements((prev) => [...prev, ...newOnes]);
    }
  }, [user]);

  useEffect(() => {
    fetchAndCheck();
  }, [fetchAndCheck]);

  return { achievements, newUnlocks, refetch: fetchAndCheck };
};
