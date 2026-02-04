import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, CheckCircle, Clock, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, isToday, parseISO, startOfDay, endOfDay } from "date-fns";

interface Reminder {
  id: string;
  type: "task" | "habit" | "goal";
  title: string;
  description?: string;
}

const ReminderBanner = () => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchReminders();
    }
  }, [user]);

  const fetchReminders = async () => {
    if (!user) return;

    const today = new Date();
    const newReminders: Reminder[] = [];

    // Buscar tarefas pendentes de hoje ou atrasadas
    const { data: tasks } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_completed", false)
      .lte("due_date", format(today, "yyyy-MM-dd"));

    if (tasks) {
      tasks.forEach(task => {
        const dueDate = task.due_date ? parseISO(task.due_date) : null;
        const isOverdue = dueDate && dueDate < startOfDay(today);
        
        newReminders.push({
          id: `task-${task.id}`,
          type: "task",
          title: task.title,
          description: isOverdue 
            ? `Atrasada desde ${format(dueDate, "dd/MM")}` 
            : "Vence hoje",
        });
      });
    }

    // Buscar hábitos não completados hoje
    const { data: habits } = await supabase
      .from("habits")
      .select("*")
      .eq("user_id", user.id);

    if (habits) {
      const { data: todayLogs } = await supabase
        .from("habit_logs")
        .select("habit_id")
        .eq("user_id", user.id)
        .gte("completed_at", format(startOfDay(today), "yyyy-MM-dd'T'HH:mm:ss"))
        .lte("completed_at", format(endOfDay(today), "yyyy-MM-dd'T'HH:mm:ss"));

      const completedToday = new Set(todayLogs?.map(l => l.habit_id) || []);

      habits.forEach(habit => {
        if (!completedToday.has(habit.id)) {
          newReminders.push({
            id: `habit-${habit.id}`,
            type: "habit",
            title: habit.name,
            description: "Não foi completado hoje",
          });
        }
      });
    }

    // Buscar metas próximas do prazo
    const { data: goals } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_completed", false);

    if (goals) {
      goals.forEach(goal => {
        if (goal.deadline) {
          const deadline = parseISO(goal.deadline);
          const daysUntil = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysUntil <= 7 && daysUntil >= 0) {
            const progress = goal.target_value && goal.current_value 
              ? Math.round((goal.current_value / goal.target_value) * 100)
              : 0;
              
            newReminders.push({
              id: `goal-${goal.id}`,
              type: "goal",
              title: goal.title,
              description: `${daysUntil === 0 ? "Vence hoje" : `${daysUntil} dias restantes`} - ${progress}% concluído`,
            });
          }
        }
      });
    }

    setReminders(newReminders);
    setLoading(false);
  };

  const handleDismiss = (id: string) => {
    setDismissed(prev => new Set([...prev, id]));
  };

  const handleDismissAll = () => {
    setDismissed(new Set(reminders.map(r => r.id)));
  };

  const visibleReminders = reminders.filter(r => !dismissed.has(r.id));

  if (loading || visibleReminders.length === 0) {
    return null;
  }

  const getIcon = (type: Reminder["type"]) => {
    switch (type) {
      case "task": return <Clock className="w-4 h-4" />;
      case "habit": return <CheckCircle className="w-4 h-4" />;
      case "goal": return <Target className="w-4 h-4" />;
    }
  };

  const getColor = (type: Reminder["type"]) => {
    switch (type) {
      case "task": return "text-yellow-500 bg-yellow-500/10";
      case "habit": return "text-blue-500 bg-blue-500/10";
      case "goal": return "text-primary bg-primary/10";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <div className="glass rounded-xl border-glow overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">
              Lembretes ({visibleReminders.length})
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismissAll}
            className="text-muted-foreground hover:text-foreground"
          >
            Dispensar todos
          </Button>
        </div>

        <div className="divide-y divide-border max-h-60 overflow-y-auto">
          <AnimatePresence>
            {visibleReminders.slice(0, 5).map((reminder) => (
              <motion.div
                key={reminder.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getColor(reminder.type)}`}>
                    {getIcon(reminder.type)}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{reminder.title}</p>
                    {reminder.description && (
                      <p className="text-sm text-muted-foreground">{reminder.description}</p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDismiss(reminder.id)}
                  className="text-muted-foreground hover:text-foreground shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {visibleReminders.length > 5 && (
          <div className="p-3 bg-secondary/30 text-center">
            <span className="text-sm text-muted-foreground">
              +{visibleReminders.length - 5} lembretes
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ReminderBanner;
