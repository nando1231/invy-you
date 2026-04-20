import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, X } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Summary {
  id: string;
  content: string;
  week_start: string;
  week_end: string;
  total_income: number;
  total_expense: number;
}

export const WeeklySummaryBanner = () => {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("weekly_summaries")
        .select("id,content,week_start,week_end,total_income,total_expense")
        .is("read_at", null)
        .order("week_start", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) setSummary(data as Summary);
    })();
  }, []);

  const dismiss = async () => {
    if (!summary) return;
    await supabase
      .from("weekly_summaries")
      .update({ read_at: new Date().toISOString() })
      .eq("id", summary.id);
    setSummary(null);
  };

  if (!summary) return null;

  return (
    <div className="m-4 p-3 rounded-xl bg-gradient-to-br from-primary/15 to-accent/10 border border-primary/30 relative">
      <button
        onClick={dismiss}
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground p-1"
        aria-label="Fechar resumo"
      >
        <X className="w-3.5 h-3.5" />
      </button>
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-xs font-semibold text-primary">Resumo da semana</span>
      </div>
      <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 text-sm">
        <ReactMarkdown>{summary.content}</ReactMarkdown>
      </div>
    </div>
  );
};
