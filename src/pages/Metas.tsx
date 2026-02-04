import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Paywall } from "@/components/Paywall";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Plus, 
  Trash2,
  Target,
  Trophy,
  Calendar
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Goal {
  id: string;
  title: string;
  description: string | null;
  target_value: number | null;
  current_value: number;
  deadline: string | null;
  is_completed: boolean;
  created_at: string;
}

const Metas = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [updateValue, setUpdateValue] = useState("");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [deadline, setDeadline] = useState("");

  useEffect(() => {
    if (user) {
      fetchGoals();
    }
  }, [user]);

  const fetchGoals = async () => {
    const { data } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", user!.id)
      .order("is_completed", { ascending: true })
      .order("created_at", { ascending: false });

    if (data) {
      setGoals(data as Goal[]);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title) {
      toast({ title: "Digite o título da meta", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("goals").insert({
      user_id: user!.id,
      title,
      description: description || null,
      target_value: targetValue ? parseFloat(targetValue) : null,
      deadline: deadline || null,
    });

    if (error) {
      toast({ title: "Erro ao adicionar meta", variant: "destructive" });
    } else {
      toast({ title: "Meta adicionada!" });
      setDialogOpen(false);
      resetForm();
      fetchGoals();
    }
  };

  const handleUpdateProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedGoal || !updateValue) return;

    const newValue = parseFloat(updateValue);
    const isCompleted = selectedGoal.target_value ? newValue >= selectedGoal.target_value : false;

    const { error } = await supabase
      .from("goals")
      .update({ 
        current_value: newValue,
        is_completed: isCompleted
      })
      .eq("id", selectedGoal.id);

    if (!error) {
      toast({ title: isCompleted ? "Meta alcançada! 🎉" : "Progresso atualizado!" });
      setUpdateDialogOpen(false);
      setSelectedGoal(null);
      setUpdateValue("");
      fetchGoals();
    }
  };

  const deleteGoal = async (id: string) => {
    await supabase.from("goals").delete().eq("id", id);
    fetchGoals();
    toast({ title: "Meta removida" });
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setTargetValue("");
    setDeadline("");
  };

  const completedGoals = goals.filter(g => g.is_completed).length;
  const activeGoals = goals.filter(g => !g.is_completed).length;

  return (
    <Paywall>
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Metas</h1>
            <p className="text-muted-foreground">Defina e acompanhe seus objetivos</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="hero">
                <Plus className="w-4 h-4 mr-2" />
                Nova Meta
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Nova Meta</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input
                    placeholder="Ex: Economizar R$ 5.000"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-secondary"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descrição (opcional)</Label>
                  <Input
                    placeholder="Detalhes da meta..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="bg-secondary"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Valor alvo (opcional)</Label>
                  <Input
                    type="number"
                    placeholder="Ex: 5000"
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    className="bg-secondary"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Prazo (opcional)</Label>
                  <Input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="bg-secondary"
                  />
                </div>

                <Button type="submit" variant="hero" className="w-full">
                  Criar Meta
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-4 sm:p-6 border-glow"
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm">Metas Ativas</p>
            <p className="text-2xl sm:text-3xl font-bold text-foreground">{activeGoals}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-xl p-4 sm:p-6 border-glow"
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
                <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm">Metas Alcançadas</p>
            <p className="text-2xl sm:text-3xl font-bold text-primary">{completedGoals}</p>
          </motion.div>
        </div>

        {/* Goals List */}
        <div className="space-y-3 sm:space-y-4">
          <AnimatePresence>
            {goals.map((goal) => {
              const progress = goal.target_value 
                ? Math.min((Number(goal.current_value) / Number(goal.target_value)) * 100, 100)
                : goal.is_completed ? 100 : 0;

              const daysLeft = goal.deadline 
                ? differenceInDays(parseISO(goal.deadline), new Date())
                : null;

              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`glass rounded-xl p-4 sm:p-6 border-glow ${
                    goal.is_completed ? "border-primary" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className={`font-bold text-foreground text-sm sm:text-base ${
                          goal.is_completed ? "line-through opacity-70" : ""
                        }`}>
                          {goal.title}
                        </h3>
                        {goal.is_completed && (
                          <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full">
                            Concluída
                          </span>
                        )}
                      </div>
                      {goal.description && (
                        <p className="text-muted-foreground text-xs sm:text-sm">{goal.description}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteGoal(goal.id)}
                      className="text-muted-foreground hover:text-destructive h-8 w-8 flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {goal.target_value && (
                    <div className="mb-3 sm:mb-4">
                      <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className="text-foreground font-medium">
                          {Number(goal.current_value).toLocaleString("pt-BR")} / {Number(goal.target_value).toLocaleString("pt-BR")}
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                    <div className="flex items-center gap-4 text-xs sm:text-sm text-muted-foreground">
                      {goal.deadline && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>
                            {daysLeft !== null && daysLeft >= 0 
                              ? `${daysLeft} dias restantes`
                              : daysLeft !== null && daysLeft < 0
                              ? "Prazo expirado"
                              : format(parseISO(goal.deadline), "dd/MM/yyyy")
                            }
                          </span>
                        </div>
                      )}
                    </div>

                    {!goal.is_completed && goal.target_value && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs sm:text-sm w-full sm:w-auto"
                        onClick={() => {
                          setSelectedGoal(goal);
                          setUpdateValue(String(goal.current_value));
                          setUpdateDialogOpen(true);
                        }}
                      >
                        Atualizar Progresso
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {goals.length === 0 && (
            <div className="text-center py-8 sm:py-12 text-muted-foreground glass rounded-xl border-glow">
              <Target className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-50" />
              <p className="text-sm sm:text-base">Nenhuma meta ainda</p>
              <p className="text-xs sm:text-sm">Defina sua primeira meta!</p>
            </div>
          )}
        </div>

        {/* Update Progress Dialog */}
        <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Atualizar Progresso</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateProgress} className="space-y-4">
              <div className="space-y-2">
                <Label>Valor atual</Label>
                <Input
                  type="number"
                  value={updateValue}
                  onChange={(e) => setUpdateValue(e.target.value)}
                  className="bg-secondary"
                />
              </div>
              <Button type="submit" variant="hero" className="w-full">
                Salvar
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
    </Paywall>
  );
};

export default Metas;
