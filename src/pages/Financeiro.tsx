import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Paywall } from "@/components/Paywall";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Trash2,
  Calendar
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import ExpenseCharts from "@/components/financeiro/ExpenseCharts";
import ExpenseTemplates from "@/components/financeiro/ExpenseTemplates";
import QuickTransactionInput from "@/components/financeiro/QuickTransactionInput";

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
  icon: string;
  color: string;
}

const Financeiro = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewPeriod, setViewPeriod] = useState<"day" | "week" | "month">("month");

  // Form state
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [categoryId, setCategoryId] = useState("");

  useEffect(() => {
    if (user) {
      fetchTransactions();
      fetchCategories();
    }
  }, [user, viewPeriod]);

  const getDateRange = () => {
    const today = new Date();
    switch (viewPeriod) {
      case "day":
        return { start: startOfDay(today), end: endOfDay(today) };
      case "week":
        return { start: startOfWeek(today, { locale: ptBR }), end: endOfWeek(today, { locale: ptBR }) };
      case "month":
        return { start: startOfMonth(today), end: endOfMonth(today) };
    }
  };

  const fetchTransactions = async () => {
    const { start, end } = getDateRange();
    
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user!.id)
      .gte("date", format(start, "yyyy-MM-dd"))
      .lte("date", format(end, "yyyy-MM-dd"))
      .order("date", { ascending: false });

    if (!error && data) {
      setTransactions(data as Transaction[]);
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", user!.id);

    if (data) {
      setCategories(data as Category[]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !description) {
      toast({
        title: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("transactions").insert({
      user_id: user!.id,
      type,
      amount: parseFloat(amount),
      description,
      date,
      category_id: categoryId || null,
    });

    if (error) {
      toast({
        title: "Erro ao adicionar transação",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Transação adicionada!",
      });
      setDialogOpen(false);
      resetForm();
      fetchTransactions();
    }
  };

  const handleQuickTransaction = async (transactionType: "income" | "expense", transactionAmount: number, transactionDescription: string) => {
    const { error } = await supabase.from("transactions").insert({
      user_id: user!.id,
      type: transactionType,
      amount: transactionAmount,
      description: transactionDescription,
      date: format(new Date(), "yyyy-MM-dd"),
    });

    if (!error) {
      toast({ title: "Transação adicionada!" });
      fetchTransactions();
    } else {
      toast({ title: "Erro ao adicionar", variant: "destructive" });
    }
  };

  const handleQuickExpense = async (expenseDescription: string, expenseAmount: number) => {
    const { error } = await supabase.from("transactions").insert({
      user_id: user!.id,
      type: "expense",
      amount: expenseAmount,
      description: expenseDescription,
      date: format(new Date(), "yyyy-MM-dd"),
    });

    if (!error) {
      toast({ title: `${expenseDescription} adicionado!` });
      fetchTransactions();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id);

    if (!error) {
      toast({ title: "Transação removida" });
      fetchTransactions();
    }
  };

  const resetForm = () => {
    setType("expense");
    setAmount("");
    setDescription("");
    setDate(format(new Date(), "yyyy-MM-dd"));
    setCategoryId("");
  };

  const totalIncome = transactions.filter(t => t.type === "income").reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + Number(t.amount), 0);
  const balance = totalIncome - totalExpense;

  const periodLabel = viewPeriod === "day" ? "Hoje" : viewPeriod === "week" ? "Esta Semana" : "Este Mês";

  return (
    <Paywall>
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Financeiro</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Controle suas receitas e despesas</p>
        </div>

        {/* Quick Transaction Input */}
        <QuickTransactionInput onSubmit={handleQuickTransaction} />

        {/* Expense Templates */}
        <ExpenseTemplates onAddExpense={handleQuickExpense} />

        {/* Period Tabs */}
        <Tabs value={viewPeriod} onValueChange={(v) => setViewPeriod(v as any)}>
          <TabsList className="bg-secondary w-full sm:w-auto">
            <TabsTrigger value="day" className="flex-1 sm:flex-none">Diário</TabsTrigger>
            <TabsTrigger value="week" className="flex-1 sm:flex-none">Semanal</TabsTrigger>
            <TabsTrigger value="month" className="flex-1 sm:flex-none">Mensal</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-3 sm:p-6 border-glow"
          >
            <div className="flex items-center gap-2 mb-1 sm:mb-2">
              <div className="p-1 sm:p-2 rounded-lg bg-primary/10">
                <TrendingUp className="w-3 h-3 sm:w-5 sm:h-5 text-primary" />
              </div>
              <span className="text-muted-foreground text-xs sm:text-base hidden sm:inline">Receitas</span>
            </div>
            <p className="text-sm sm:text-2xl font-bold text-primary">
              R$ {totalIncome.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-xl p-3 sm:p-6 border-glow"
          >
            <div className="flex items-center gap-2 mb-1 sm:mb-2">
              <div className="p-1 sm:p-2 rounded-lg bg-destructive/10">
                <TrendingDown className="w-3 h-3 sm:w-5 sm:h-5 text-destructive" />
              </div>
              <span className="text-muted-foreground text-xs sm:text-base hidden sm:inline">Despesas</span>
            </div>
            <p className="text-sm sm:text-2xl font-bold text-destructive">
              R$ {totalExpense.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-xl p-3 sm:p-6 border-glow"
          >
            <div className="flex items-center gap-2 mb-1 sm:mb-2">
              <div className="p-1 sm:p-2 rounded-lg bg-secondary">
                <Calendar className="w-3 h-3 sm:w-5 sm:h-5 text-muted-foreground" />
              </div>
              <span className="text-muted-foreground text-xs sm:text-base hidden sm:inline">Saldo</span>
            </div>
            <p className={`text-sm sm:text-2xl font-bold ${balance >= 0 ? "text-primary" : "text-destructive"}`}>
              R$ {balance.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </motion.div>
        </div>

        {/* Charts */}
        <ExpenseCharts transactions={transactions} categories={categories} />

        {/* Advanced Transaction Button */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Transação Avançada
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border mx-4 sm:mx-auto max-w-md">
            <DialogHeader>
              <DialogTitle>Nova Transação</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={type === "expense" ? "default" : "outline"}
                  onClick={() => setType("expense")}
                  className="w-full"
                >
                  <TrendingDown className="w-4 h-4 mr-2" />
                  Despesa
                </Button>
                <Button
                  type="button"
                  variant={type === "income" ? "default" : "outline"}
                  onClick={() => setType("income")}
                  className="w-full"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Receita
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Valor</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-secondary"
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input
                  placeholder="Ex: Almoço, Salário..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-secondary"
                />
              </div>

              <div className="space-y-2">
                <Label>Data</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-secondary"
                />
              </div>

              {categories.length > 0 && (
                <div className="space-y-2">
                  <Label>Categoria (opcional)</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger className="bg-secondary">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button type="submit" variant="hero" className="w-full">
                Adicionar
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Transactions List */}
        <div className="glass rounded-xl border-glow overflow-hidden">
          <div className="p-3 sm:p-4 border-b border-border">
            <h2 className="font-bold text-foreground text-sm sm:text-base">Transações - {periodLabel}</h2>
          </div>
          
          {transactions.length === 0 ? (
            <div className="p-6 sm:p-8 text-center text-muted-foreground">
              <p className="text-sm sm:text-base">Nenhuma transação encontrada</p>
              <p className="text-xs sm:text-sm">Use o input acima para adicionar rapidamente!</p>
            </div>
          ) : (
            <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
              {transactions.map((transaction) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-between p-3 hover:bg-secondary/50 transition-colors gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                      transaction.type === "income" ? "bg-primary/10" : "bg-destructive/10"
                    }`}>
                      {transaction.type === "income" 
                        ? <TrendingUp className="w-3 h-3 text-primary" />
                        : <TrendingDown className="w-3 h-3 text-destructive" />
                      }
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground text-sm truncate">{transaction.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(transaction.date), "dd/MM")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`font-bold text-sm ${
                      transaction.type === "income" ? "text-primary" : "text-destructive"
                    }`}>
                      {transaction.type === "income" ? "+" : "-"}
                      R$ {Number(transaction.amount).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(transaction.id)}
                      className="text-muted-foreground hover:text-destructive h-7 w-7"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
    </Paywall>
  );
};

export default Financeiro;
