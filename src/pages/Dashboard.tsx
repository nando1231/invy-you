import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeletons";
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  CheckSquare, 
  Target,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import ReminderBanner from "@/components/notifications/ReminderBanner";

interface Stats {
  income: number;
  expense: number;
  tasksCompleted: number;
  tasksPending: number;
  goalsCompleted: number;
  goalsTotal: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    income: 0,
    expense: 0,
    tasksCompleted: 0,
    tasksPending: 0,
    goalsCompleted: 0,
    goalsTotal: 0,
  });
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
      fetchRecentTasks();
    }
  }, [user]);

  const fetchStats = async () => {
    const today = new Date();
    const monthStart = startOfMonth(today).toISOString();
    const monthEnd = endOfMonth(today).toISOString();

    // Fetch monthly transactions
    const { data: transactions } = await supabase
      .from("transactions")
      .select("type, amount")
      .eq("user_id", user!.id)
      .gte("date", monthStart.split("T")[0])
      .lte("date", monthEnd.split("T")[0]);

    const income = transactions?.filter(t => t.type === "income").reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    const expense = transactions?.filter(t => t.type === "expense").reduce((sum, t) => sum + Number(t.amount), 0) || 0;

    // Fetch tasks
    const { data: tasks } = await supabase
      .from("tasks")
      .select("is_completed")
      .eq("user_id", user!.id);

    const tasksCompleted = tasks?.filter(t => t.is_completed).length || 0;
    const tasksPending = tasks?.filter(t => !t.is_completed).length || 0;

    // Fetch goals
    const { data: goals } = await supabase
      .from("goals")
      .select("is_completed")
      .eq("user_id", user!.id);

    const goalsCompleted = goals?.filter(g => g.is_completed).length || 0;
    const goalsTotal = goals?.length || 0;

    setStats({ income, expense, tasksCompleted, tasksPending, goalsCompleted, goalsTotal });
    setLoading(false);
  };

  const fetchRecentTasks = async () => {
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user!.id)
      .eq("is_completed", false)
      .order("created_at", { ascending: false })
      .limit(5);

    setRecentTasks(data || []);
  };

  const statCards = [
    {
      title: "Receitas do Mês",
      value: `R$ ${stats.income.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Despesas do Mês",
      value: `R$ ${stats.expense.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      icon: TrendingDown,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      title: "Tarefas Hoje",
      value: `${stats.tasksCompleted}/${stats.tasksCompleted + stats.tasksPending}`,
      icon: CheckSquare,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Metas Ativas",
      value: `${stats.goalsCompleted}/${stats.goalsTotal}`,
      icon: Target,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  return (
    <DashboardLayout>
        {loading ? <DashboardSkeleton /> : (
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">
              {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
          </div>

          {/* Reminder Banner */}
          <ReminderBanner />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {statCards.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-xl p-3 sm:p-4 lg:p-6 border-glow"
              >
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <Link to="/dashboard/financeiro">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="glass rounded-xl p-4 sm:p-6 border-glow cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-2 sm:p-3 rounded-xl bg-primary/10">
                      <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-sm sm:text-base">Financeiro</h3>
                      <p className="text-muted-foreground text-xs sm:text-sm">Controle seus gastos</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </motion.div>
            </Link>

            <Link to="/dashboard/rotinas">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="glass rounded-xl p-4 sm:p-6 border-glow cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-2 sm:p-3 rounded-xl bg-primary/10">
                      <CheckSquare className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-sm sm:text-base">Rotinas</h3>
                      <p className="text-muted-foreground text-xs sm:text-sm">Organize seu dia</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </motion.div>
            </Link>

            <Link to="/dashboard/metas">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="glass rounded-xl p-4 sm:p-6 border-glow cursor-pointer group sm:col-span-2 lg:col-span-1"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-2 sm:p-3 rounded-xl bg-primary/10">
                      <Target className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-sm sm:text-base">Metas</h3>
                      <p className="text-muted-foreground text-xs sm:text-sm">Acompanhe seu progresso</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </motion.div>
            </Link>
          </div>

          {/* Balance Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-xl p-6 border-glow"
          >
            <h2 className="text-lg font-bold text-foreground mb-4">Saldo do Mês</h2>
            <div className="flex items-center gap-4">
              <div className={`text-3xl sm:text-4xl font-black ${stats.income - stats.expense >= 0 ? "text-primary" : "text-destructive"}`}>
                R$ {(stats.income - stats.expense).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                stats.income - stats.expense >= 0 
                  ? "bg-primary/20 text-primary" 
                  : "bg-destructive/20 text-destructive"
              }`}>
                {stats.income - stats.expense >= 0 ? "Positivo" : "Negativo"}
              </div>
            </div>
          </motion.div>

          {/* Recent Tasks */}
          {recentTasks.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass rounded-xl p-6 border-glow"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">Tarefas Pendentes</h2>
                <Link to="/dashboard/rotinas" className="text-primary text-sm hover:underline">
                  Ver todas
                </Link>
              </div>
              <div className="space-y-3">
                {recentTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                    <div className={`w-3 h-3 rounded-full ${
                      task.priority === "high" ? "bg-destructive" :
                      task.priority === "medium" ? "bg-yellow-500" : "bg-primary"
                    }`} />
                    <span className="text-foreground flex-1">{task.title}</span>
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
