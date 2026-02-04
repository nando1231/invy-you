import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Trash2,
  CheckCircle,
  Circle,
  Flame,
  Star
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, differenceInDays } from "date-fns";
import TaskTemplates from "@/components/rotinas/TaskTemplates";
import HabitTemplates from "@/components/rotinas/HabitTemplates";

interface Task {
  id: string;
  title: string;
  description: string | null;
  is_completed: boolean;
  due_date: string | null;
  priority: "low" | "medium" | "high";
  created_at: string;
}

interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  streak: number;
  completedToday: boolean;
}

const Rotinas = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [habitDialogOpen, setHabitDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("tasks");

  // Task form
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState<"low" | "medium" | "high">("medium");
  const [taskDueDate, setTaskDueDate] = useState("");

  // Habit form
  const [habitName, setHabitName] = useState("");

  useEffect(() => {
    if (user) {
      fetchTasks();
      fetchHabits();
    }
  }, [user]);

  const fetchTasks = async () => {
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user!.id)
      .order("is_completed", { ascending: true })
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false });

    if (data) {
      setTasks(data as Task[]);
    }
    setLoading(false);
  };

  const fetchHabits = async () => {
    const { data: habitsData } = await supabase
      .from("habits")
      .select("*")
      .eq("user_id", user!.id);

    if (habitsData) {
      const today = format(new Date(), "yyyy-MM-dd");
      const { data: logsData } = await supabase
        .from("habit_logs")
        .select("habit_id, completed_at")
        .eq("user_id", user!.id);

      const habitsWithStreak = habitsData.map((habit) => {
        const habitLogs = logsData?.filter(l => l.habit_id === habit.id) || [];
        const completedToday = habitLogs.some(l => l.completed_at === today);
        
        let streak = 0;
        const sortedLogs = habitLogs
          .map(l => l.completed_at)
          .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        
        if (sortedLogs.length > 0) {
          let currentDate = new Date();
          for (const logDate of sortedLogs) {
            const diff = differenceInDays(currentDate, parseISO(logDate));
            if (diff <= 1) {
              streak++;
              currentDate = parseISO(logDate);
            } else {
              break;
            }
          }
        }

        return {
          ...habit,
          streak,
          completedToday,
        };
      });

      setHabits(habitsWithStreak as Habit[]);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!taskTitle) {
      toast({ title: "Digite o título da tarefa", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("tasks").insert({
      user_id: user!.id,
      title: taskTitle,
      description: taskDescription || null,
      priority: taskPriority,
      due_date: taskDueDate || null,
    });

    if (error) {
      toast({ title: "Erro ao adicionar tarefa", variant: "destructive" });
    } else {
      toast({ title: "Tarefa adicionada!" });
      setTaskDialogOpen(false);
      resetTaskForm();
      fetchTasks();
    }
  };

  const handleQuickAddTask = async (title: string, priority: "low" | "medium" | "high") => {
    const { error } = await supabase.from("tasks").insert({
      user_id: user!.id,
      title,
      priority,
    });

    if (!error) {
      toast({ title: "Tarefa adicionada!" });
      fetchTasks();
    }
  };

  const handleAddHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!habitName) {
      toast({ title: "Digite o nome do hábito", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("habits").insert({
      user_id: user!.id,
      name: habitName,
    });

    if (error) {
      toast({ title: "Erro ao adicionar hábito", variant: "destructive" });
    } else {
      toast({ title: "Hábito adicionado!" });
      setHabitDialogOpen(false);
      setHabitName("");
      fetchHabits();
    }
  };

  const handleQuickAddHabit = async (name: string) => {
    const { error } = await supabase.from("habits").insert({
      user_id: user!.id,
      name,
    });

    if (!error) {
      toast({ title: "Hábito adicionado!" });
      fetchHabits();
    }
  };

  const toggleTask = async (task: Task) => {
    const { error } = await supabase
      .from("tasks")
      .update({ 
        is_completed: !task.is_completed,
        completed_at: !task.is_completed ? new Date().toISOString() : null
      })
      .eq("id", task.id);

    if (!error) {
      fetchTasks();
    }
  };

  const toggleHabit = async (habit: Habit) => {
    const today = format(new Date(), "yyyy-MM-dd");
    
    if (habit.completedToday) {
      await supabase
        .from("habit_logs")
        .delete()
        .eq("habit_id", habit.id)
        .eq("completed_at", today);
    } else {
      await supabase.from("habit_logs").insert({
        habit_id: habit.id,
        user_id: user!.id,
        completed_at: today,
      });
    }
    
    fetchHabits();
  };

  const deleteTask = async (id: string) => {
    await supabase.from("tasks").delete().eq("id", id);
    fetchTasks();
    toast({ title: "Tarefa removida" });
  };

  const deleteHabit = async (id: string) => {
    await supabase.from("habits").delete().eq("id", id);
    fetchHabits();
    toast({ title: "Hábito removido" });
  };

  const resetTaskForm = () => {
    setTaskTitle("");
    setTaskDescription("");
    setTaskPriority("medium");
    setTaskDueDate("");
  };

  const completedTasks = tasks.filter(t => t.is_completed).length;
  const totalTasks = tasks.length;

  return (
    <Paywall>
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Rotinas</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Organize seu dia e construa hábitos</p>
        </div>

        {/* Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-4 sm:p-6 border-glow"
        >
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="font-bold text-foreground text-sm sm:text-base">Progresso de Hoje</h2>
            <span className="text-primary font-bold text-sm sm:text-base">
              {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2 sm:h-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }}
              transition={{ duration: 0.5 }}
              className="bg-primary h-2 sm:h-3 rounded-full"
            />
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm mt-2">
            {completedTasks} de {totalTasks} tarefas concluídas
          </p>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-secondary w-full sm:w-auto">
            <TabsTrigger value="tasks" className="flex-1 sm:flex-none">Tarefas</TabsTrigger>
            <TabsTrigger value="habits" className="flex-1 sm:flex-none">Hábitos</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-4 mt-4">
            {/* Task Templates */}
            <TaskTemplates 
              onAddTask={handleQuickAddTask}
              existingTasks={tasks.map(t => t.title)}
            />

            {/* Add Task Button */}
            <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="hero" className="w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Tarefa Personalizada
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border mx-4 sm:mx-auto max-w-md">
                <DialogHeader>
                  <DialogTitle>Nova Tarefa</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddTask} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Título</Label>
                    <Input
                      placeholder="O que precisa fazer?"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      className="bg-secondary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Descrição (opcional)</Label>
                    <Input
                      placeholder="Detalhes..."
                      value={taskDescription}
                      onChange={(e) => setTaskDescription(e.target.value)}
                      className="bg-secondary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Prioridade</Label>
                    <Select value={taskPriority} onValueChange={(v: any) => setTaskPriority(v)}>
                      <SelectTrigger className="bg-secondary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Data limite (opcional)</Label>
                    <Input
                      type="date"
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                      className="bg-secondary"
                    />
                  </div>

                  <Button type="submit" variant="hero" className="w-full">
                    Adicionar
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            {/* Tasks List */}
            <div className="space-y-2">
              <AnimatePresence>
                {tasks.map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className={`glass rounded-xl p-3 border-glow flex items-center gap-3 ${
                      task.is_completed ? "opacity-60" : ""
                    }`}
                  >
                    <button
                      onClick={() => toggleTask(task)}
                      className="flex-shrink-0 touch-manipulation"
                    >
                      {task.is_completed ? (
                        <CheckCircle className="w-6 h-6 text-primary" />
                      ) : (
                        <Circle className="w-6 h-6 text-muted-foreground hover:text-primary transition-colors" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-foreground text-sm ${
                        task.is_completed ? "line-through" : ""
                      }`}>
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-xs text-muted-foreground truncate">
                          {task.description}
                        </p>
                      )}
                    </div>

                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      task.priority === "high" ? "bg-destructive" :
                      task.priority === "medium" ? "bg-yellow-500" : "bg-primary"
                    }`} />

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteTask(task.id)}
                      className="flex-shrink-0 text-muted-foreground hover:text-destructive h-8 w-8"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>

              {tasks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">Nenhuma tarefa ainda</p>
                  <p className="text-xs">Clique nas sugestões acima ou crie uma personalizada!</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="habits" className="space-y-4 mt-4">
            {/* Habit Templates */}
            <HabitTemplates 
              onAddHabit={handleQuickAddHabit}
              existingHabits={habits.map(h => h.name)}
            />

            {/* Add Habit Button */}
            <Dialog open={habitDialogOpen} onOpenChange={setHabitDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="hero" className="w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Hábito Personalizado
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border mx-4 sm:mx-auto max-w-md">
                <DialogHeader>
                  <DialogTitle>Novo Hábito</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddHabit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome do hábito</Label>
                    <Input
                      placeholder="Ex: Exercício, Leitura..."
                      value={habitName}
                      onChange={(e) => setHabitName(e.target.value)}
                      className="bg-secondary"
                    />
                  </div>

                  <Button type="submit" variant="hero" className="w-full">
                    Adicionar
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            {/* Habits List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <AnimatePresence>
                {habits.map((habit) => (
                  <motion.div
                    key={habit.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`glass rounded-xl p-3 border-glow ${
                      habit.completedToday ? "border-primary" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          onClick={() => toggleHabit(habit)}
                          className={`p-2 rounded-lg transition-colors flex-shrink-0 touch-manipulation ${
                            habit.completedToday 
                              ? "bg-primary text-primary-foreground" 
                              : "bg-secondary text-muted-foreground hover:text-primary"
                          }`}
                        >
                          <Star className="w-5 h-5" />
                        </button>
                        <span className="font-medium text-foreground text-sm truncate">{habit.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteHabit(habit.id)}
                        className="text-muted-foreground hover:text-destructive h-8 w-8 flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Flame className={`w-4 h-4 ${habit.streak > 0 ? "text-orange-500" : "text-muted-foreground"}`} />
                      <span className={habit.streak > 0 ? "text-orange-500 font-medium" : "text-muted-foreground"}>
                        {habit.streak} dias de sequência
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {habits.length === 0 && (
                <div className="text-center py-8 text-muted-foreground col-span-full">
                  <p className="text-sm">Nenhum hábito ainda</p>
                  <p className="text-xs">Clique nas sugestões acima ou crie um personalizado!</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
    </Paywall>
  );
};

export default Rotinas;
