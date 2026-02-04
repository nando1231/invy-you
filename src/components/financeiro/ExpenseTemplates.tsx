import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Home, 
  Car, 
  Wifi, 
  Zap, 
  Droplet,
  CreditCard,
  ShoppingCart,
  Fuel,
  GraduationCap,
  Heart,
  Plus,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ExpenseTemplate {
  id: string;
  name: string;
  icon: React.ReactNode;
  defaultAmount?: number;
}

const fixedExpenses: ExpenseTemplate[] = [
  { id: "rent", name: "Aluguel", icon: <Home className="w-4 h-4" /> },
  { id: "car", name: "Carro", icon: <Car className="w-4 h-4" /> },
  { id: "fuel", name: "Combustível", icon: <Fuel className="w-4 h-4" /> },
  { id: "internet", name: "Internet", icon: <Wifi className="w-4 h-4" /> },
  { id: "electricity", name: "Luz", icon: <Zap className="w-4 h-4" /> },
  { id: "water", name: "Água", icon: <Droplet className="w-4 h-4" /> },
  { id: "credit-card", name: "Cartão", icon: <CreditCard className="w-4 h-4" /> },
  { id: "groceries", name: "Mercado", icon: <ShoppingCart className="w-4 h-4" /> },
  { id: "education", name: "Educação", icon: <GraduationCap className="w-4 h-4" /> },
  { id: "health", name: "Saúde", icon: <Heart className="w-4 h-4" /> },
];

interface ExpenseTemplatesProps {
  onAddExpense: (description: string, amount: number) => void;
}

const ExpenseTemplates = ({ onAddExpense }: ExpenseTemplatesProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState<ExpenseTemplate | null>(null);
  const [amount, setAmount] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSelectTemplate = (template: ExpenseTemplate) => {
    setSelectedTemplate(template);
    setAmount("");
    setDialogOpen(true);
  };

  const handleConfirm = () => {
    if (selectedTemplate && amount) {
      onAddExpense(selectedTemplate.name, parseFloat(amount));
      setDialogOpen(false);
      setSelectedTemplate(null);
      setAmount("");
    }
  };

  return (
    <>
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Gastos Rápidos</h3>
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
          {fixedExpenses.map((expense, index) => (
            <motion.div
              key={expense.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSelectTemplate(expense)}
                className="flex flex-col items-center justify-center gap-1 h-16 w-full p-2 bg-secondary/50 hover:bg-primary/20 hover:border-primary/50 transition-all"
                title={expense.name}
              >
                {expense.icon}
                <span className="text-[10px] sm:text-xs truncate w-full text-center">{expense.name}</span>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTemplate?.icon}
              {selectedTemplate?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">R$</span>
              <Input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10 text-2xl font-bold h-14 bg-secondary"
                autoFocus
              />
            </div>
            <Button 
              onClick={handleConfirm} 
              variant="hero" 
              className="w-full h-12"
              disabled={!amount || parseFloat(amount) <= 0}
            >
              <Check className="w-4 h-4 mr-2" />
              Adicionar Despesa
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ExpenseTemplates;
