import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingDown, TrendingUp, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface QuickTransactionInputProps {
  onSubmit: (type: "income" | "expense", amount: number, description: string) => void;
}

const QuickTransactionInput = ({ onSubmit }: QuickTransactionInputProps) => {
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = () => {
    if (!amount || !description) return;
    
    onSubmit(type, parseFloat(amount), description);
    setAmount("");
    setDescription("");
    setIsExpanded(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && amount && description) {
      handleSubmit();
    }
  };

  return (
    <motion.div 
      className="glass rounded-xl border-glow overflow-hidden"
      animate={{ height: isExpanded ? "auto" : "auto" }}
    >
      <div className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          {/* Type Toggle */}
          <div className="flex gap-1 p-1 bg-secondary rounded-lg shrink-0">
            <button
              onClick={() => setType("expense")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                type === "expense" 
                  ? "bg-destructive/20 text-destructive" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <TrendingDown className="w-4 h-4" />
              <span className="hidden sm:inline">Despesa</span>
            </button>
            <button
              onClick={() => setType("income")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                type === "income" 
                  ? "bg-primary/20 text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Receita</span>
            </button>
          </div>

          {/* Amount Input */}
          <div className="relative flex-1 min-w-0">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">R$</span>
            <Input
              type="number"
              step="0.01"
              placeholder="0,00"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (e.target.value) setIsExpanded(true);
              }}
              onKeyDown={handleKeyDown}
              className="pl-10 bg-secondary font-bold"
            />
          </div>

          {/* Description Input */}
          <Input
            placeholder="O que foi?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsExpanded(true)}
            className="bg-secondary flex-1 min-w-0"
          />

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            variant="hero"
            size="icon"
            disabled={!amount || !description}
            className="shrink-0 h-10 w-10"
          >
            <Check className="w-4 h-4" />
          </Button>
        </div>

        {/* Quick amounts */}
        {isExpanded && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border"
          >
            <span className="text-xs text-muted-foreground self-center mr-2">Valores rápidos:</span>
            {[10, 20, 50, 100, 200, 500].map((val) => (
              <button
                key={val}
                onClick={() => setAmount(val.toString())}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  amount === val.toString()
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:bg-primary/20 hover:text-primary"
                }`}
              >
                R$ {val}
              </button>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default QuickTransactionInput;
