import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingDown, TrendingUp, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Props {
  onSubmit: (type: "income" | "expense", amount: number, description: string) => void;
}

const QuickTransactionInput = ({ onSubmit }: Props) => {
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const canSubmit = amount && description && parseFloat(amount) > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit(type, parseFloat(amount), description);
    setAmount("");
    setDescription("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && canSubmit) handleSubmit();
  };

  return (
    <div className="rounded-3xl bg-card/60 border border-border/40 p-3 sm:p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-foreground">Adicionar rápido</span>
        <div className="flex gap-1 p-0.5 bg-secondary/60 rounded-full">
          <button
            onClick={() => setType("expense")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
              type === "expense"
                ? "bg-destructive/20 text-destructive"
                : "text-muted-foreground"
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            Saiu
          </button>
          <button
            onClick={() => setType("income")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
              type === "income"
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Entrou
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative w-[120px] shrink-0">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-medium">
            R$
          </span>
          <Input
            type="number"
            inputMode="decimal"
            step="0.01"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-9 bg-secondary/60 border-border/40 font-bold text-base h-11"
          />
        </div>
        <Input
          placeholder="O que foi?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={handleKeyDown}
          className="bg-secondary/60 border-border/40 flex-1 min-w-0 h-11"
        />
        <AnimatePresence>
          {canSubmit && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onClick={handleSubmit}
              className="h-11 w-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 active:scale-95 transition-transform"
              aria-label="Adicionar"
            >
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {amount && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="flex flex-wrap gap-1.5 pt-1"
        >
          {[10, 20, 50, 100, 200, 500].map((val) => (
            <button
              key={val}
              onClick={() => setAmount(val.toString())}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                amount === val.toString()
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/60 text-muted-foreground hover:bg-secondary"
              }`}
            >
              {val}
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default QuickTransactionInput;
