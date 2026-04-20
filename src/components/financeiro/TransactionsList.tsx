import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, Trash2 } from "lucide-react";
import { format, parseISO, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";

interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  date: string;
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
  onDelete: (id: string) => void;
}

const fmt = (n: number) =>
  n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const dayLabel = (iso: string) => {
  const d = parseISO(iso);
  if (isToday(d)) return "Hoje";
  if (isYesterday(d)) return "Ontem";
  return format(d, "EEE, dd 'de' MMM", { locale: ptBR });
};

export const TransactionsList = ({ transactions, categories, onDelete }: Props) => {
  const grouped = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    transactions.forEach((t) => {
      const arr = map.get(t.date) || [];
      arr.push(t);
      map.set(t.date, arr);
    });
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [transactions]);

  if (transactions.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border/60 p-8 text-center">
        <p className="text-sm font-medium text-foreground mb-1">Nenhuma transação por aqui</p>
        <p className="text-xs text-muted-foreground">
          Usa o input acima ou o botão flutuante pra adicionar
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h2 className="text-sm font-semibold text-foreground">Transações</h2>
      <AnimatePresence initial={false}>
        {grouped.map(([date, items]) => {
          const dayTotal = items.reduce(
            (sum, t) => sum + (t.type === "income" ? Number(t.amount) : -Number(t.amount)),
            0,
          );
          return (
            <motion.div
              key={date}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <div className="flex items-baseline justify-between px-1">
                <span className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground">
                  {dayLabel(date)}
                </span>
                <span className={`text-[11px] font-medium ${dayTotal >= 0 ? "text-primary" : "text-destructive"}`}>
                  {dayTotal >= 0 ? "+" : "−"}R$ {fmt(Math.abs(dayTotal))}
                </span>
              </div>
              <div className="rounded-2xl bg-card/60 border border-border/40 overflow-hidden">
                {items.map((t, idx) => {
                  const cat = categories.find((c) => c.id === t.category_id);
                  return (
                    <motion.div
                      key={t.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`group flex items-center gap-3 px-3.5 py-3 hover:bg-secondary/40 transition-colors ${
                        idx > 0 ? "border-t border-border/30" : ""
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                          t.type === "income" ? "bg-primary/10" : "bg-destructive/10"
                        }`}
                      >
                        {t.type === "income" ? (
                          <ArrowUpRight className="w-4 h-4 text-primary" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4 text-destructive" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate leading-tight">
                          {t.description}
                        </p>
                        {cat && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: cat.color || "hsl(var(--primary))" }}
                            />
                            <span className="text-[11px] text-muted-foreground truncate">
                              {cat.name}
                            </span>
                          </div>
                        )}
                      </div>
                      <span
                        className={`text-sm font-semibold shrink-0 ${
                          t.type === "income" ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {t.type === "income" ? "+" : "−"}R$ {fmt(Number(t.amount))}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(t.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        aria-label="Apagar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
