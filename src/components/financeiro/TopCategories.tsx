import { useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Transaction {
  type: "income" | "expense";
  amount: number;
  category_id: string | null;
}

interface Category {
  id: string;
  name: string;
  color: string | null;
}

interface Props {
  transactions: Transaction[];
  categories: Category[];
  previousTransactions?: Transaction[];
  comparisonLabel?: string;
}

const fmt = (n: number) =>
  n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export const TopCategories = ({
  transactions,
  categories,
  previousTransactions = [],
  comparisonLabel = "vs período anterior",
}: Props) => {
  const items = useMemo(() => {
    const expenses = transactions.filter((t) => t.type === "expense");
    const total = expenses.reduce((s, t) => s + Number(t.amount), 0);
    if (total === 0) return [];

    const prevExpenses = previousTransactions.filter((t) => t.type === "expense");
    const prevMap = new Map<string, number>();
    prevExpenses.forEach((t) => {
      const k = t.category_id || "_none";
      prevMap.set(k, (prevMap.get(k) || 0) + Number(t.amount));
    });

    const map = new Map<string, number>();
    expenses.forEach((t) => {
      const k = t.category_id || "_none";
      map.set(k, (map.get(k) || 0) + Number(t.amount));
    });
    return Array.from(map.entries())
      .map(([id, value]) => {
        const cat = categories.find((c) => c.id === id);
        const prev = prevMap.get(id) || 0;
        const delta = prev > 0 ? ((value - prev) / prev) * 100 : null;
        return {
          id,
          name: cat?.name || "Sem categoria",
          color: cat?.color || "hsl(var(--primary))",
          value,
          prev,
          delta,
          pct: (value / total) * 100,
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 4);
  }, [transactions, categories, previousTransactions]);

  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-foreground">Onde tua grana foi</h2>
        <span className="text-xs text-muted-foreground">Top {items.length}</span>
      </div>
      <div className="space-y-2.5">
        {items.map((item, i) => {
          const deltaUp = item.delta !== null && item.delta > 2;
          const deltaDown = item.delta !== null && item.delta < -2;
          const deltaFlat = item.delta !== null && !deltaUp && !deltaDown;
          const isNew = item.delta === null && item.prev === 0;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl bg-card/60 border border-border/40 p-3"
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-medium truncate">{item.name}</span>
                </div>
                <div className="flex items-baseline gap-1.5 shrink-0">
                  <span className="text-sm font-semibold">R$ {fmt(item.value)}</span>
                  <span className="text-[11px] text-muted-foreground">{item.pct.toFixed(0)}%</span>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-secondary/60 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.pct}%` }}
                  transition={{ delay: i * 0.05 + 0.1, duration: 0.6, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: item.color }}
                />
              </div>
              {(deltaUp || deltaDown || deltaFlat || isNew) && (
                <div className="mt-2 flex items-center gap-1.5 text-[11px] flex-wrap">
                  {deltaUp && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-destructive/15 text-destructive font-medium">
                      <TrendingUp className="w-3 h-3" />
                      +{item.delta!.toFixed(0)}%
                    </span>
                  )}
                  {deltaDown && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 font-medium">
                      <TrendingDown className="w-3 h-3" />
                      {item.delta!.toFixed(0)}%
                    </span>
                  )}
                  {deltaFlat && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-secondary/60 text-muted-foreground font-medium">
                      <Minus className="w-3 h-3" />
                      estável
                    </span>
                  )}
                  {isNew && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-medium">
                      novo
                    </span>
                  )}
                  <span className="text-muted-foreground">{comparisonLabel}</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
