import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { FinanceiroSkeleton } from "@/components/dashboard/DashboardSkeletons";
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
} from "@/components/ui/dialog";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Zap,
  Repeat,
  BarChart3,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
  subWeeks,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import ExpenseCharts from "@/components/financeiro/ExpenseCharts";
import ExpenseTemplates from "@/components/financeiro/ExpenseTemplates";
import QuickTransactionInput from "@/components/financeiro/QuickTransactionInput";
import RecurringTransactions from "@/components/financeiro/RecurringTransactions";
import { useRecurringTransactions } from "@/hooks/useRecurringTransactions";
import { BalanceHero } from "@/components/financeiro/BalanceHero";
import { TopCategories } from "@/components/financeiro/TopCategories";
import { TransactionsList } from "@/components/financeiro/TransactionsList";
import { CollapsibleSection } from "@/components/financeiro/CollapsibleSection";

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
  const [previousTransactions, setPreviousTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewPeriod, setViewPeriod] = useState<"day" | "week" | "month">("month");
  const { recurring, addRecurring, removeRecurring, generateMonthlyTransactions } =
    useRecurringTransactions();

  // Form
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [categoryId, setCategoryId] = useState("");

  useEffect(() => {
    if (user) {
      fetchTransactions();
      fetchCategories();
      generateMonthlyTransactions().then(() => fetchTransactions());
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

  const getPreviousDateRange = () => {
    const today = new Date();
    switch (viewPeriod) {
      case "day": {
        const y = subDays(today, 1);
        return { start: startOfDay(y), end: endOfDay(y) };
      }
      case "week": {
        const lw = subWeeks(today, 1);
        return {
          start: startOfWeek(lw, { locale: ptBR }),
          end: endOfWeek(lw, { locale: ptBR }),
        };
      }
      case "month": {
        const lm = subMonths(today, 1);
        return { start: startOfMonth(lm), end: endOfMonth(lm) };
      }
    }
  };

  const fetchTransactions = async () => {
    const { start, end } = getDateRange();
    const prev = getPreviousDateRange();
    const [curr, previous] = await Promise.all([
      supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user!.id)
        .gte("date", format(start, "yyyy-MM-dd"))
        .lte("date", format(end, "yyyy-MM-dd"))
        .order("date", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("transactions")
        .select("type,amount,category_id")
        .eq("user_id", user!.id)
        .gte("date", format(prev.start, "yyyy-MM-dd"))
        .lte("date", format(prev.end, "yyyy-MM-dd")),
    ]);
    if (!curr.error && curr.data) setTransactions(curr.data as Transaction[]);
    if (!previous.error && previous.data)
      setPreviousTransactions(previous.data as Transaction[]);
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("*").eq("user_id", user!.id);
    if (data) setCategories(data as Category[]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) {
      toast({ title: "Preencha valor e descrição", variant: "destructive" });
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
      toast({ title: "Erro ao adicionar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Transação adicionada!" });
      setDialogOpen(false);
      resetForm();
      fetchTransactions();
    }
  };

  const handleQuickTransaction = async (
    transactionType: "income" | "expense",
    transactionAmount: number,
    transactionDescription: string,
  ) => {
    const { error } = await supabase.from("transactions").insert({
      user_id: user!.id,
      type: transactionType,
      amount: transactionAmount,
      description: transactionDescription,
      date: format(new Date(), "yyyy-MM-dd"),
    });
    if (!error) {
      toast({ title: "Adicionado!" });
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
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (!error) {
      toast({ title: "Removido" });
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

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + Number(t.amount), 0);
  const balance = totalIncome - totalExpense;

  const periodLabel = viewPeriod === "day" ? "Hoje" : viewPeriod === "week" ? "Esta semana" : "Este mês";

  const periodPills: { v: typeof viewPeriod; label: string }[] = [
    { v: "day", label: "Hoje" },
    { v: "week", label: "Semana" },
    { v: "month", label: "Mês" },
  ];

  return (
    <DashboardLayout>
      {loading ? (
        <FinanceiroSkeleton />
      ) : (
        <>
          <div className="space-y-5 sm:space-y-6 pb-24">
            {/* Header + period pills */}
            <div className="flex items-end justify-between gap-3 flex-wrap">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                  Financeiro
                </h1>
                <p className="text-muted-foreground text-sm">Controle no automático</p>
              </div>
              <div className="flex gap-1 p-1 bg-secondary/60 rounded-full">
                {periodPills.map((p) => (
                  <button
                    key={p.v}
                    onClick={() => setViewPeriod(p.v)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      viewPeriod === p.v
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Hero do saldo */}
            <BalanceHero
              balance={balance}
              income={totalIncome}
              expense={totalExpense}
              periodLabel={periodLabel}
            />

            {/* Input rápido */}
            <QuickTransactionInput onSubmit={handleQuickTransaction} />

            {/* Top categorias inline */}
            <TopCategories transactions={transactions} categories={categories} />

            {/* Lista de transações agrupada por dia */}
            <TransactionsList
              transactions={transactions}
              categories={categories}
              onDelete={handleDelete}
            />

            {/* Seções colapsáveis */}
            <div className="space-y-3 pt-2">
              <CollapsibleSection
                title="Gastos rápidos"
                subtitle="Aluguel, mercado, combustível e mais"
                icon={<Zap className="w-4 h-4" />}
              >
                <ExpenseTemplates onAddExpense={handleQuickExpense} />
              </CollapsibleSection>

              <CollapsibleSection
                title="Recorrentes"
                subtitle="Receitas e despesas que se repetem todo mês"
                icon={<Repeat className="w-4 h-4" />}
                badge={recurring.length || undefined}
              >
                <RecurringTransactions
                  recurring={recurring}
                  onAdd={addRecurring}
                  onRemove={removeRecurring}
                />
              </CollapsibleSection>

              <CollapsibleSection
                title="Análise detalhada"
                subtitle="Gráficos por categoria, comparativo e diário"
                icon={<BarChart3 className="w-4 h-4" />}
              >
                <ExpenseCharts transactions={transactions} categories={categories} />
              </CollapsibleSection>
            </div>
          </div>

          {/* FAB — transação completa */}
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setDialogOpen(true)}
            aria-label="Nova transação"
            className="fixed z-30 bottom-20 right-4 sm:bottom-6 sm:right-6 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center hover:shadow-xl hover:shadow-primary/40 transition-shadow"
            style={{ marginBottom: "env(safe-area-inset-bottom)" }}
          >
            <Plus className="w-6 h-6" />
          </motion.button>

          {/* Dialog de transação completa */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="bg-card border-border mx-4 sm:mx-auto max-w-md">
              <DialogHeader>
                <DialogTitle>Nova transação</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={type === "expense" ? "default" : "outline"}
                    onClick={() => setType("expense")}
                  >
                    <TrendingDown className="w-4 h-4 mr-2" /> Despesa
                  </Button>
                  <Button
                    type="button"
                    variant={type === "income" ? "default" : "outline"}
                    onClick={() => setType("income")}
                  >
                    <TrendingUp className="w-4 h-4 mr-2" /> Receita
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Valor</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
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
        </>
      )}
    </DashboardLayout>
  );
};

export default Financeiro;
