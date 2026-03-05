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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus, TrendingUp, TrendingDown, Trash2, Calendar, Download,
  AlertTriangle, Pencil, Filter, Search, ArrowUpDown, Copy, Upload,
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
  parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import ExpenseCharts from "@/components/financeiro/ExpenseCharts";
import ExpenseTemplates from "@/components/financeiro/ExpenseTemplates";
import QuickTransactionInput from "@/components/financeiro/QuickTransactionInput";
import RecurringTransactions from "@/components/financeiro/RecurringTransactions";
import { useRecurringTransactions } from "@/hooks/useRecurringTransactions";

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
  budget_limit: number;
}

const Financeiro = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [viewPeriod, setViewPeriod] = useState<"day" | "week" | "month">("month");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [csvPreview, setCsvPreview] = useState<{ date: string; description: string; amount: string }[]>([]);
  const [csvImporting, setCsvImporting] = useState(false);
  const { recurring, addRecurring, removeRecurring, generateMonthlyTransactions } =
    useRecurringTransactions();

  // Add form state
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [categoryId, setCategoryId] = useState("");

  // Edit form state
  const [editType, setEditType] = useState<"income" | "expense">("expense");
  const [editAmount, setEditAmount] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");

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

  const fetchTransactions = async () => {
    const { start, end } = getDateRange();
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user!.id)
      .gte("date", format(start, "yyyy-MM-dd"))
      .lte("date", format(end, "yyyy-MM-dd"))
      .order("date", { ascending: false });

    if (!error && data) setTransactions(data as Transaction[]);
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", user!.id);
    if (data) setCategories(data as Category[]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
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
      toast({ title: "Erro ao adicionar transação", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Transação adicionada!" });
      setDialogOpen(false);
      resetForm();
      fetchTransactions();
    }
  };

  const handleEditOpen = (t: Transaction) => {
    setEditingTransaction(t);
    setEditType(t.type);
    setEditAmount(String(t.amount));
    setEditDescription(t.description);
    setEditDate(t.date);
    setEditCategoryId(t.category_id || "");
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction || !editAmount || !editDescription) return;
    const { error } = await supabase
      .from("transactions")
      .update({
        type: editType,
        amount: parseFloat(editAmount),
        description: editDescription,
        date: editDate,
        category_id: editCategoryId || null,
      })
      .eq("id", editingTransaction.id);

    if (error) {
      toast({ title: "Erro ao actualizar", variant: "destructive" });
    } else {
      toast({ title: "Transação actualizada!" });
      setEditDialogOpen(false);
      setEditingTransaction(null);
      fetchTransactions();
    }
  };

  const handleQuickTransaction = async (
    transactionType: "income" | "expense",
    transactionAmount: number,
    transactionDescription: string
  ) => {
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
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (!error) {
      toast({ title: "Transação removida" });
      fetchTransactions();
    }
  };

  const handleDuplicate = (t: Transaction) => {
    setType(t.type);
    setAmount(String(t.amount));
    setDescription(t.description);
    setDate(format(new Date(), "yyyy-MM-dd"));
    setCategoryId(t.category_id || "");
    setDialogOpen(true);
  };

  const handleCsvFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande (máx. 2MB)", variant: "destructive" });
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").filter(l => l.trim());
      const delimiter = lines[0].includes(";") ? ";" : ",";
      const start = /\d/.test(lines[0].split(delimiter)[0]) ? 0 : 1;
      const rows = lines.slice(start).map(line => {
        const cols = line.split(delimiter).map(c => c.replace(/^"|"$/g, "").trim());
        return { date: cols[0] || "", description: cols[1] || "", amount: cols[2] || "" };
      }).filter(r => r.date && r.amount);
      setCsvPreview(rows.slice(0, 50));
    };
    reader.readAsText(file, "utf-8");
  };

  const handleCsvImport = async () => {
    setCsvImporting(true);
    const inserts = csvPreview.map(row => {
      const rawAmount = row.amount.replace(/[^\d,.-]/g, "").replace(",", ".");
      const amount = Math.abs(parseFloat(rawAmount) || 0);
      const type = parseFloat(rawAmount) < 0 ? "expense" : "expense";
      const rawDate = row.date.includes("/") ? row.date.split("/").reverse().join("-") : row.date;
      return { user_id: user!.id, type, amount, description: row.description || "Importado", date: rawDate };
    }).filter(r => r.amount > 0);

    const { error } = await supabase.from("transactions").insert(inserts);
    if (error) {
      toast({ title: "Erro na importação", variant: "destructive" });
    } else {
      toast({ title: `${inserts.length} transações importadas!` });
      setCsvModalOpen(false);
      setCsvPreview([]);
      fetchTransactions();
    }
    setCsvImporting(false);
  };

  const exportCSV = () => {
    const headers = ["Data", "Tipo", "Valor", "Descrição", "Categoria"];
    const rows = filteredTransactions.map((t) => [
      t.date,
      t.type === "income" ? "Receita" : "Despesa",
      Number(t.amount).toFixed(2).replace(".", ","),
      `"${t.description}"`,
      categories.find((c) => c.id === t.category_id)?.name || "",
    ]);
    const csv = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transacoes-${format(new Date(), "yyyy-MM")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    setType("expense");
    setAmount("");
    setDescription("");
    setDate(format(new Date(), "yyyy-MM-dd"));
    setCategoryId("");
  };

  const filteredTransactions = transactions
    .filter(t => categoryFilter === "all" || t.category_id === categoryFilter)
    .filter(t => !searchQuery || t.description.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => sortBy === "amount" ? Number(b.amount) - Number(a.amount) : new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + Number(t.amount), 0);
  const balance = totalIncome - totalExpense;
  const periodLabel = viewPeriod === "day" ? "Hoje" : viewPeriod === "week" ? "Esta Semana" : "Este Mês";

  // Budget alerts: categories with budget_limit that are ≥70% used
  const budgetAlerts = categories
    .filter((cat) => cat.budget_limit > 0)
    .map((cat) => {
      const spent = transactions
        .filter((t) => t.type === "expense" && t.category_id === cat.id)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      return { ...cat, spent, percent: (spent / cat.budget_limit) * 100 };
    })
    .filter((c) => c.percent >= 70);

  return (
    <DashboardLayout>
      {loading ? (
        <FinanceiroSkeleton />
      ) : (
        <div className="space-y-4 sm:space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Financeiro</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Controle suas receitas e despesas</p>
          </div>

          <QuickTransactionInput onSubmit={handleQuickTransaction} />
          <ExpenseTemplates onAddExpense={handleQuickExpense} />
          <RecurringTransactions recurring={recurring} onAdd={addRecurring} onRemove={removeRecurring} />

          {/* Budget Alerts */}
          {budgetAlerts.length > 0 && (
            <div className="space-y-2">
              {budgetAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-sm ${
                    alert.percent >= 100
                      ? "bg-destructive/10 border-destructive/30 text-destructive"
                      : "bg-yellow-500/10 border-yellow-500/30 text-yellow-600 dark:text-yellow-400"
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    <strong>{alert.name}</strong>:{" "}
                    {alert.percent >= 100
                      ? `Limite ultrapassado! (R$ ${alert.spent.toFixed(0)} / R$ ${Number(alert.budget_limit).toFixed(0)})`
                      : `${alert.percent.toFixed(0)}% do limite usado (R$ ${alert.spent.toFixed(0)} / R$ ${Number(alert.budget_limit).toFixed(0)})`}
                  </span>
                </div>
              ))}
            </div>
          )}

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

          <ExpenseCharts transactions={transactions} categories={categories} />

          {/* Actions row */}
          <div className="flex flex-wrap gap-2">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
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
                    <Button type="button" variant={type === "expense" ? "default" : "outline"} onClick={() => setType("expense")} className="w-full">
                      <TrendingDown className="w-4 h-4 mr-2" />Despesa
                    </Button>
                    <Button type="button" variant={type === "income" ? "default" : "outline"} onClick={() => setType("income")} className="w-full">
                      <TrendingUp className="w-4 h-4 mr-2" />Receita
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label>Valor</Label>
                    <Input type="number" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-secondary" />
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Input placeholder="Ex: Almoço, Salário..." value={description} onChange={(e) => setDescription(e.target.value)} className="bg-secondary" />
                  </div>
                  <div className="space-y-2">
                    <Label>Data</Label>
                    <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-secondary" />
                  </div>
                  {categories.length > 0 && (
                    <div className="space-y-2">
                      <Label>Categoria (opcional)</Label>
                      <Select value={categoryId} onValueChange={setCategoryId}>
                        <SelectTrigger className="bg-secondary"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <Button type="submit" variant="hero" className="w-full">Adicionar</Button>
                </form>
              </DialogContent>
            </Dialog>

            <Button variant="outline" onClick={exportCSV}>
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
            <Button variant="outline" onClick={() => setCsvModalOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Importar CSV
            </Button>
          </div>

          {/* CSV Import Modal */}
          <Dialog open={csvModalOpen} onOpenChange={setCsvModalOpen}>
            <DialogContent className="bg-card border-border mx-4 sm:mx-auto max-w-lg">
              <DialogHeader><DialogTitle>Importar CSV Bancário</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Formato esperado: <code className="bg-secondary px-1 rounded">data;descrição;valor</code> (separador ; ou ,)</p>
                <input type="file" accept=".csv,.txt" onChange={handleCsvFile} className="text-sm text-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-primary file:text-primary-foreground file:text-sm file:cursor-pointer" />
                {csvPreview.length > 0 && (
                  <div className="max-h-48 overflow-y-auto border border-border rounded-lg">
                    <table className="w-full text-xs">
                      <thead className="bg-secondary sticky top-0">
                        <tr>
                          <th className="p-2 text-left">Data</th>
                          <th className="p-2 text-left">Descrição</th>
                          <th className="p-2 text-right">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvPreview.map((r, i) => (
                          <tr key={i} className="border-t border-border">
                            <td className="p-2 text-muted-foreground">{r.date}</td>
                            <td className="p-2 truncate max-w-[150px]">{r.description}</td>
                            <td className="p-2 text-right">{r.amount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {csvPreview.length > 0 && (
                  <Button variant="hero" className="w-full" onClick={handleCsvImport} disabled={csvImporting}>
                    {csvImporting ? "Importando..." : `Importar ${csvPreview.length} transações`}
                  </Button>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit dialog */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="bg-card border-border mx-4 sm:mx-auto max-w-md">
              <DialogHeader>
                <DialogTitle>Editar Transação</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button type="button" variant={editType === "expense" ? "default" : "outline"} onClick={() => setEditType("expense")} className="w-full">
                    <TrendingDown className="w-4 h-4 mr-2" />Despesa
                  </Button>
                  <Button type="button" variant={editType === "income" ? "default" : "outline"} onClick={() => setEditType("income")} className="w-full">
                    <TrendingUp className="w-4 h-4 mr-2" />Receita
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>Valor</Label>
                  <Input type="number" step="0.01" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} className="bg-secondary" />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="bg-secondary" />
                </div>
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="bg-secondary" />
                </div>
                {categories.length > 0 && (
                  <div className="space-y-2">
                    <Label>Categoria (opcional)</Label>
                    <Select value={editCategoryId} onValueChange={setEditCategoryId}>
                      <SelectTrigger className="bg-secondary"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button type="submit" variant="hero" className="w-full">Salvar</Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* Transactions List */}
          <div className="glass rounded-xl border-glow overflow-hidden">
            <div className="p-3 sm:p-4 border-b border-border flex items-center justify-between gap-2">
              <h2 className="font-bold text-foreground text-sm sm:text-base">
                Transações — {periodLabel}
              </h2>
              {categories.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="bg-secondary h-8 text-xs w-36 sm:w-40">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {filteredTransactions.length === 0 ? (
              <div className="p-6 sm:p-8 text-center text-muted-foreground">
                <p className="text-sm sm:text-base">Nenhuma transação encontrada</p>
                <p className="text-xs sm:text-sm">Use o input acima para adicionar rapidamente!</p>
              </div>
            ) : (
              <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
                {filteredTransactions.map((transaction) => (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-between p-3 hover:bg-secondary/50 transition-colors gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div
                        className={`p-1.5 rounded-lg flex-shrink-0 ${
                          transaction.type === "income" ? "bg-primary/10" : "bg-destructive/10"
                        }`}
                      >
                        {transaction.type === "income" ? (
                          <TrendingUp className="w-3 h-3 text-primary" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-destructive" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground text-sm truncate">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          {format(parseISO(transaction.date), "dd/MM")}
                          {transaction.category_id && (
                            <>
                              <span>·</span>
                              <span
                                className="inline-block w-2 h-2 rounded-full"
                                style={{
                                  backgroundColor:
                                    categories.find((c) => c.id === transaction.category_id)?.color ||
                                    "currentColor",
                                }}
                              />
                              <span>{categories.find((c) => c.id === transaction.category_id)?.name}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span
                        className={`font-bold text-sm ${
                          transaction.type === "income" ? "text-primary" : "text-destructive"
                        }`}
                      >
                        {transaction.type === "income" ? "+" : "-"}R${" "}
                        {Number(transaction.amount).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditOpen(transaction)}
                        className="text-muted-foreground hover:text-primary h-7 w-7"
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive h-7 w-7"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-card border-border">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover transação?</AlertDialogTitle>
                            <AlertDialogDescription>
                              "{transaction.description}" — R${" "}
                              {Number(transaction.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(transaction.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Financeiro;
