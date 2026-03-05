import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  habitId: string;
}

export const HabitHeatmap = ({ habitId }: Props) => {
  const [completedDates, setCompletedDates] = useState<Set<string>>(new Set());

  useEffect(() => {
    const thirtyDaysAgo = format(subDays(new Date(), 29), "yyyy-MM-dd");
    supabase
      .from("habit_logs")
      .select("completed_at")
      .eq("habit_id", habitId)
      .gte("completed_at", thirtyDaysAgo)
      .then(({ data }) => {
        if (data) setCompletedDates(new Set(data.map((l) => l.completed_at)));
      });
  }, [habitId]);

  const days = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(new Date(), 29 - i);
    const dateStr = format(date, "yyyy-MM-dd");
    return {
      dateStr,
      completed: completedDates.has(dateStr),
      label: format(date, "d MMM", { locale: ptBR }),
    };
  });

  const completedCount = days.filter((d) => d.completed).length;

  return (
    <div className="mt-2 pt-2 border-t border-border/40">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
        <p className="text-xs font-medium text-primary">{completedCount}/30</p>
      </div>
      <div className="flex flex-wrap gap-[3px]">
        {days.map(({ dateStr, completed, label }) => (
          <div
            key={dateStr}
            title={`${label}: ${completed ? "✓ Feito" : "Não feito"}`}
            className={`w-3 h-3 rounded-[2px] transition-colors ${
              completed ? "bg-primary" : "bg-secondary"
            }`}
          />
        ))}
      </div>
    </div>
  );
};
