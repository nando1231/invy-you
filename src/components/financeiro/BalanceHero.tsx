import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface Props {
  balance: number;
  income: number;
  expense: number;
  periodLabel: string;
}

const fmt = (n: number) =>
  n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export const BalanceHero = ({ balance, income, expense, periodLabel }: Props) => {
  const positive = balance >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-card via-card to-accent/20 border border-border/50 p-5 sm:p-7"
    >
      {/* Glow decorativo */}
      <div className="absolute -top-20 -right-20 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-accent/30 rounded-full blur-3xl pointer-events-none" />

      <div className="relative">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
          Saldo · {periodLabel}
        </p>
        <div className="flex items-baseline gap-1.5 mb-5">
          <span className={`text-3xl sm:text-5xl font-bold tracking-tight ${positive ? "text-foreground" : "text-destructive"}`}>
            {positive ? "" : "−"}R$ {fmt(Math.abs(balance))}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-background/40 backdrop-blur-sm border border-border/40 p-3 sm:p-4">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5 font-medium">
              <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center">
                <ArrowUpRight className="w-3 h-3 text-primary" />
              </div>
              Entrou
            </div>
            <p className="text-base sm:text-xl font-semibold text-primary truncate">
              R$ {fmt(income)}
            </p>
          </div>
          <div className="rounded-2xl bg-background/40 backdrop-blur-sm border border-border/40 p-3 sm:p-4">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5 font-medium">
              <div className="w-5 h-5 rounded-full bg-destructive/15 flex items-center justify-center">
                <ArrowDownRight className="w-3 h-3 text-destructive" />
              </div>
              Saiu
            </div>
            <p className="text-base sm:text-xl font-semibold text-destructive truncate">
              R$ {fmt(expense)}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
