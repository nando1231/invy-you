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

export const TopCategories = ({ transactions, categories }: Props) => {
  const items = useMemo(() => {
    const expenses = transactions.filter((t) => t.type === "expense");
    const total = expenses.reduce((s, t) => s + Number(t.amount), 0);
    if (total === 0) return [];
    const map = new Map<string, number>();
    expenses.forEach((t) => {
      const k = t.category_id || "_none";
      map.set(k, (map.get(k) || 0) + Number(t.amount));
    });
    return Array.from(map.entries())
      .map(([id, value]) => {
        const cat = categories.find((c) => c.id === id);
        return {
          id,
          name: cat?.name || "Sem categoria",
          color: cat?.color || "hsl(var(--primary))",
          value,
          pct: (value / total) * 100,
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 4);
  }, [transactions, categories]);

  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-foreground">Onde tua grana foi</h2>
        <span className="text-xs text-muted-foreground">Top {items.length}</span>
      </div>
      <div className="space-y-2.5">
        {items.map((item, i) => (
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
          </motion.div>
        ))}
      </div>
    </div>
  );
};
