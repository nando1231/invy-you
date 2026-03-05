import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  getWeek,
  parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";

interface Transaction {
  type: "income" | "expense";
  amount: number;
  date: string;
  category_id: string | null;
  description: string;
}

interface Category {
  id: string;
  name: string;
  color: string;
}

const Relatorio = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [prevTransactions, setPrevTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const currentMonthLabel = format(new Date(), "MMMM yyyy", { locale: ptBR });
  const prevMonthLabel = format(subMonths(new Date(), 1), "MMMM yyyy", { locale: ptBR });

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    const now = new Date();
    const [cats, curr, prev] = await Promise.all([
      supabase.from("categories").select("id, name, color").eq("user_id", user!.id),
      supabase
        .from("transactions")
        .select("type, amount, date, category_id, description")
        .eq("user_id", user!.id)
        .gte("date", format(startOfMonth(now), "yyyy-MM-dd"))
        .lte("date", format(endOfMonth(now), "yyyy-MM-dd")),
      supabase
        .from("transactions")
        .select("type, amount, date, category_id, description")
        .eq("user_id", user!.id)
        .gte("date", format(startOfMonth(subMonths(now, 1)), "yyyy-MM-dd"))
        .lte("date", format(endOfMonth(subMonths(now, 1)), "yyyy-MM-dd")),
    ]);

    setCategories((cats.data || []) as Category[]);
    setTransactions((curr.data || []) as Transaction[]);
    setPrevTransactions((prev.data || []) as Transaction[]);
    setLoading(false);
  };

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const prevExpense = prevTransactions.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const prevIncome = prevTransactions.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);

  const expenseChange = prevExpense > 0 ? ((totalExpense - prevExpense) / prevExpense) * 100 : 0;
  const incomeChange = prevIncome > 0 ? ((totalIncome - prevIncome) / prevIncome) * 100 : 0;

  // Top 5 categories by expense
  const catExpenses = categories
    .map((cat) => ({
      ...cat,
      total: transactions
        .filter((t) => t.type === "expense" && t.category_id === cat.id)
        .reduce((s, t) => s + Number(t.amount), 0),
    }))
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Uncategorized expenses
  const uncatTotal = transactions
    .filter((t) => t.type === "expense" && !t.category_id)
    .reduce((s, t) => s + Number(t.amount), 0);

  // Weekly breakdown
  const weeklyMap: Record<string, { week: string; receitas: number; despesas: number }> = {};
  transactions.forEach((t) => {
    const weekNum = getWeek(parseISO(t.date), { locale: ptBR });
    const key = `Sem. ${weekNum}`;
    if (!weeklyMap[key]) weeklyMap[key] = { week: key, receitas: 0, despesas: 0 };
    if (t.type === "income") weeklyMap[key].receitas += Number(t.amount);
    else weeklyMap[key].despesas += Number(t.amount);
  });
  const weeklyData = Object.values(weeklyMap).sort((a, b) =>
    Number(a.week.split(" ")[1]) - Number(b.week.split(" ")[1])
  );

  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground capitalize">
            Relatório — {currentMonthLabel}
          </h1>
          <p className="text-muted-foreground text-sm">Comparado com {prevMonthLabel}</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Carregando...</div>
        ) : (
          <>
            {/* Summary vs Previous Month */}
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  label: "Receitas",
                  value: totalIncome,
                  prev: prevIncome,
                  change: incomeChange,
                  icon: TrendingUp,
                  positive: true,
                  color: "text-primary",
                  bg: "bg-primary/10",
                },
                {
                  label: "Despesas",
                  value: totalExpense,
                  prev: prevExpense,
                  change: expenseChange,
                  icon: TrendingDown,
                  positive: false,
                  color: "text-destructive",
                  bg: "bg-destructive/10",
                },
              ].map((item) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass rounded-xl p-4 sm:p-6 border-glow"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-2 rounded-lg ${item.bg}`}>
                      <item.icon className={`w-4 h-4 ${item.color}`} />
                    </div>
                    <span className="text-muted-foreground text-sm">{item.label}</span>
                  </div>
                  <p className={`text-2xl font-bold ${item.color}`}>{fmt(item.value)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Mês anterior: {fmt(item.prev)}
                    {item.prev > 0 && (
                      <span
                        className={`ml-2 font-medium ${
                          item.positive
                            ? item.change >= 0
                              ? "text-primary"
                              : "text-destructive"
                            : item.change >= 0
                            ? "text-destructive"
                            : "text-primary"
                        }`}
                      >
                        {item.change >= 0 ? "+" : ""}
                        {item.change.toFixed(1)}%
                      </span>
                    )}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Weekly Chart */}
            {weeklyData.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-xl p-5 border-glow"
              >
                <h2 className="font-bold text-foreground mb-4">Receitas vs Despesas por Semana</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="week" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `R$${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                      formatter={(v: number) => [fmt(v)]}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                    <Bar dataKey="receitas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Receitas" />
                    <Bar dataKey="despesas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Despesas" />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            )}

            {/* Top Categories */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-xl p-5 border-glow"
            >
              <h2 className="font-bold text-foreground mb-4">Top Categorias de Gastos</h2>
              {catExpenses.length === 0 && uncatTotal === 0 ? (
                <p className="text-muted-foreground text-sm">Nenhuma despesa categorizada.</p>
              ) : (
                <div className="space-y-3">
                  {catExpenses.map((cat, i) => (
                    <div key={cat.id} className="flex items-center gap-3">
                      <span className="text-muted-foreground text-xs w-5">{i + 1}.</span>
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-sm font-medium text-foreground truncate">{cat.name}</span>
                          <span className="text-sm font-bold text-destructive ml-2 shrink-0">{fmt(cat.total)}</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full"
                            style={{
                              width: `${Math.min((cat.total / totalExpense) * 100, 100)}%`,
                              backgroundColor: cat.color,
                            }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {totalExpense > 0 ? ((cat.total / totalExpense) * 100).toFixed(1) : 0}% do total
                        </span>
                      </div>
                    </div>
                  ))}
                  {uncatTotal > 0 && (
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground text-xs w-5">{catExpenses.length + 1}.</span>
                      <div className="w-3 h-3 rounded-full shrink-0 bg-muted-foreground/40" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Sem categoria</span>
                          <span className="text-sm font-bold text-destructive">{fmt(uncatTotal)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>

            {/* Balance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-xl p-5 border-glow"
            >
              <h2 className="font-bold text-foreground mb-2">Saldo do Mês</h2>
              <p className={`text-3xl font-black ${totalIncome - totalExpense >= 0 ? "text-primary" : "text-destructive"}`}>
                {fmt(totalIncome - totalExpense)}
              </p>
              {prevIncome > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  Mês anterior: {fmt(prevIncome - prevExpense)}
                </p>
              )}
            </motion.div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Relatorio;
