import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeletons";
import {
  Wallet, TrendingUp, TrendingDown, CheckSquare, Target,
  ArrowRight, Sparkles, Trophy, X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, startOfMonth, endOfMonth, subMonths, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import ReminderBanner from "@/components/notifications/ReminderBanner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAchievements } from "@/hooks/useAchievements";
import { Progress } from "@/components/ui/progress";

interface Stats {
  income: number; expense: number;
  tasksCompleted: number; tasksPending: number;
  goalsCompleted: number; goalsTotal: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({ income: 0, expense: 0, tasksCompleted: 0, tasksPending: 0, goalsCompleted: 0, goalsTotal: 0 });
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [monthlyBalances, setMonthlyBalances] = useState<{ month: string; saldo: number }[]>([]);
  const [budgetTotal, setBudgetTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [dismissedUnlock, setDismissedUnlock] = useState<string | null>(null);

  const { achievements, newUnlocks } = useAchievements();

  useEffect(() => {
    if (user) {
      fetchStats();
      fetchRecentTasks();
      fetchMonthlyBalances();
      fetchBudget();
    }
  }, [user]);

  const fetchStats = async () => {
    const today = new Date();
    const start = format(startOfMonth(today), "yyyy-MM-dd");
    const end = format(endOfMonth(today), "yyyy-MM-dd");

    const [{ data: txs }, { data: tasks }, { data: goals }] = await Promise.all([
      supabase.from("transactions").select("type, amount").eq("user_id", user!.id).gte("date", start).lte("date", end),
      supabase.from("tasks").select("is_completed").eq("user_id", user!.id),
      supabase.from("goals").select("is_completed").eq("user_id", user!.id),
    ]);

    const income = txs?.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0) || 0;
    const expense = txs?.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0) || 0;
    setStats({
      income, expense,
      tasksCompleted: tasks?.filter(t => t.is_completed).length || 0,
      tasksPending: tasks?.filter(t => !t.is_completed).length || 0,
      goalsCompleted: goals?.filter(g => g.is_completed).length || 0,
      goalsTotal: goals?.length || 0,
    });
    setLoading(false);
  };

  const fetchRecentTasks = async () => {
    const { data } = await supabase.from("tasks").select("*").eq("user_id", user!.id).eq("is_completed", false).order("created_at", { ascending: false }).limit(5);
    setRecentTasks(data || []);
  };

  const fetchMonthlyBalances = async () => {
    const result: { month: string; saldo: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const { data: txs } = await supabase.from("transactions").select("type, amount").eq("user_id", user!.id).gte("date", format(startOfMonth(date), "yyyy-MM-dd")).lte("date", format(endOfMonth(date), "yyyy-MM-dd"));
      const inc = txs?.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0) || 0;
      const exp = txs?.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0) || 0;
      result.push({ month: format(date, "MMM", { locale: ptBR }), saldo: inc - exp });
    }
    setMonthlyBalances(result);
  };

  const fetchBudget = async () => {
    const { data } = await supabase.from("profiles" as any).select("budget_total").eq("user_id", user!.id).maybeSingle();
    if (data) setBudgetTotal(Number((data as any).budget_total) || 0);
  };

  // Derived
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "você";
  const balance = stats.income - stats.expense;
  const isFirstUse = stats.income === 0 && stats.expense === 0 && stats.tasksCompleted === 0 && stats.tasksPending === 0 && stats.goalsTotal === 0;
  const hasChartData = monthlyBalances.some(m => m.saldo !== 0);

  // Balance forecast
  const today = new Date();
  const daysPassed = Math.max(differenceInDays(today, startOfMonth(today)) + 1, 1);
  const daysInMonth = differenceInDays(endOfMonth(today), startOfMonth(today)) + 1;
  const daysRemaining = daysInMonth - daysPassed;
  const avgDailyExpense = stats.expense / daysPassed;
  const forecastBalance = balance - avgDailyExpense * daysRemaining;

  // Budget %
  const budgetUsedPct = budgetTotal > 0 ? Math.min((stats.expense / budgetTotal) * 100, 100) : 0;

  // Weekly score
  const habitScore = 0; // simplified — tasks as proxy
  const taskScore = (stats.tasksCompleted + stats.tasksPending) > 0 ? (stats.tasksCompleted / (stats.tasksCompleted + stats.tasksPending)) * 30 : 0;
  const balanceScore = balance > 0 ? 40 : 0;
  const goalScore = stats.goalsTotal > 0 ? (stats.goalsCompleted / stats.goalsTotal) * 30 : 0;
  const weeklyScore = Math.round(taskScore + balanceScore + goalScore + habitScore);
  const scoreLabel = weeklyScore >= 80 ? "Semana incrível! 🏆" : weeklyScore >= 60 ? "Ótima semana! 🌟" : weeklyScore >= 40 ? "Bom progresso! 👍" : "Pode melhorar 💪";

  const newUnlock = newUnlocks.find(a => a.key !== dismissedUnlock);

  const statCards = [
    { title: "Receitas do Mês", value: `R$ ${stats.income.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: "text-primary", bgColor: "bg-primary/10" },
    { title: "Despesas do Mês", value: `R$ ${stats.expense.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: TrendingDown, color: "text-destructive", bgColor: "bg-destructive/10" },
    { title: "Tarefas Hoje", value: `${stats.tasksCompleted}/${stats.tasksCompleted + stats.tasksPending}`, icon: CheckSquare, color: "text-primary", bgColor: "bg-primary/10" },
    { title: "Metas Ativas", value: `${stats.goalsCompleted}/${stats.goalsTotal}`, icon: Target, color: "text-primary", bgColor: "bg-primary/10" },
  ];

  return (
    <DashboardLayout>
      {loading ? <DashboardSkeleton /> : (
        <div className="space-y-6">

          {/* Achievement unlock toast */}
          <AnimatePresence>
            {newUnlock && newUnlock.key !== dismissedUnlock && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex items-center gap-3 p-4 glass rounded-xl border border-primary/40 border-glow"
              >
                <span className="text-2xl">{newUnlock.icon}</span>
                <div className="flex-1">
                  <p className="font-bold text-foreground text-sm">Conquista desbloqueada!</p>
                  <p className="text-primary text-sm">{newUnlock.title} — {newUnlock.description}</p>
                </div>
                <button onClick={() => setDismissedUnlock(newUnlock.key)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{greeting}, {firstName}!</h1>
            <p className="text-muted-foreground">{format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}</p>
          </div>

          <ReminderBanner />

          {/* Onboarding */}
          {isFirstUse && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-5 border-glow border-primary/40">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-foreground">Boas-vindas ao Invy-You!</h2>
              </div>
              <p className="text-muted-foreground text-sm mb-4">Comece em 3 passos rápidos:</p>
              <div className="space-y-2 text-sm">
                {[
                  { to: "/dashboard/financeiro", icon: <Wallet className="w-4 h-4 text-primary shrink-0" />, label: "Adicione seu primeiro gasto ou receita", num: "1" },
                  { to: "/dashboard/metas", icon: <Target className="w-4 h-4 text-primary shrink-0" />, label: "Defina uma meta financeira", num: "2" },
                  { to: "/dashboard/configuracoes", icon: <span className="text-base shrink-0">🌿</span>, label: "Ative a Ivy no WhatsApp", num: "3" },
                ].map(item => (
                  <Link key={item.num} to={item.to} className="flex items-center gap-2 p-2.5 bg-secondary/60 rounded-lg hover:bg-secondary transition-colors">
                    <span className="text-primary font-bold w-5">{item.num}.</span>
                    {item.icon}
                    <span className="flex-1">{item.label}</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </motion.div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {statCards.map((stat, index) => (
              <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="glass rounded-xl p-3 sm:p-4 lg:p-6 border-glow">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <div className={`p-1.5 sm:p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color}`} />
                  </div>
                </div>
                <p className="text-muted-foreground text-xs sm:text-sm">{stat.title}</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground truncate">{stat.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { to: "/dashboard/financeiro", icon: <Wallet className="w-5 h-5 text-primary" />, title: "Financeiro", sub: "Controle seus gastos" },
              { to: "/dashboard/rotinas", icon: <CheckSquare className="w-5 h-5 text-primary" />, title: "Rotinas", sub: "Organize seu dia" },
              { to: "/dashboard/metas", icon: <Target className="w-5 h-5 text-primary" />, title: "Metas", sub: "Acompanhe seu progresso" },
            ].map(item => (
              <Link key={item.to} to={item.to}>
                <motion.div whileHover={{ scale: 1.02 }} className="glass rounded-xl p-4 sm:p-5 border-glow cursor-pointer group flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10">{item.icon}</div>
                    <div>
                      <h3 className="font-bold text-foreground text-sm">{item.title}</h3>
                      <p className="text-muted-foreground text-xs">{item.sub}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </motion.div>
              </Link>
            ))}
          </div>

          {/* Balance + Forecast */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-xl p-6 border-glow">
            <h2 className="text-lg font-bold text-foreground mb-3">Saldo do Mês</h2>
            <div className="flex items-center gap-4 mb-3">
              <div className={`text-3xl sm:text-4xl font-black ${balance >= 0 ? "text-primary" : "text-destructive"}`}>
                R$ {balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${balance >= 0 ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive"}`}>
                {balance >= 0 ? "Positivo" : "Negativo"}
              </div>
            </div>
            {stats.expense > 0 && daysRemaining > 0 && (
              <p className="text-sm text-muted-foreground">
                📈 Previsão de fim do mês:{" "}
                <span className={`font-semibold ${forecastBalance >= 0 ? "text-primary" : "text-destructive"}`}>
                  R$ {forecastBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
                <span className="text-xs ml-1">(média R$ {avgDailyExpense.toFixed(0)}/dia)</span>
              </p>
            )}
          </motion.div>

          {/* Budget widget */}
          {budgetTotal > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-5 border-glow">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-bold text-foreground text-sm">Orçamento Mensal</h2>
                <span className={`text-sm font-bold ${budgetUsedPct >= 90 ? "text-destructive" : budgetUsedPct >= 70 ? "text-yellow-500" : "text-primary"}`}>
                  {budgetUsedPct.toFixed(0)}%
                </span>
              </div>
              <Progress value={budgetUsedPct} className="h-2 mb-2" />
              <p className="text-xs text-muted-foreground">
                R$ {stats.expense.toLocaleString("pt-BR", { minimumFractionDigits: 0 })} de R$ {budgetTotal.toLocaleString("pt-BR", { minimumFractionDigits: 0 })} usados
              </p>
            </motion.div>
          )}

          {/* Weekly Score */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-5 border-glow">
              <h2 className="font-bold text-foreground text-sm mb-3">Score da Semana</h2>
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16">
                  <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(var(--secondary))" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeDasharray={`${weeklyScore} 100`} strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-base font-bold text-foreground">{weeklyScore}</span>
                </div>
                <p className="text-sm text-muted-foreground">{scoreLabel}</p>
              </div>
            </motion.div>

            {/* Achievements */}
            {achievements.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-5 border-glow">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="w-4 h-4 text-primary" />
                  <h2 className="font-bold text-foreground text-sm">Conquistas ({achievements.length})</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {achievements.map(a => (
                    <div key={a.key} title={a.description} className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 rounded-full text-xs font-medium text-primary">
                      <span>{a.icon}</span>
                      <span>{a.title}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* 6-Month Chart */}
          {hasChartData && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-6 border-glow">
              <h2 className="text-lg font-bold text-foreground mb-4">Evolução do Saldo (6 meses)</h2>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={monthlyBalances}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={v => `R$${Math.abs(v) >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, "Saldo"]} />
                  <Line type="monotone" dataKey="saldo" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 4 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Recent Tasks */}
          {recentTasks.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-6 border-glow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">Tarefas Pendentes</h2>
                <Link to="/dashboard/rotinas" className="text-primary text-sm hover:underline">Ver todas</Link>
              </div>
              <div className="space-y-2">
                {recentTasks.map(task => (
                  <div key={task.id} className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${task.priority === "high" ? "bg-destructive" : task.priority === "medium" ? "bg-yellow-500" : "bg-primary"}`} />
                    <span className="text-foreground flex-1 text-sm">{task.title}</span>
                    {task.is_recurring && <span className="text-xs text-muted-foreground">🔁</span>}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default Dashboard;
