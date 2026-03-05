import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  User,
  Plus,
  Trash2,
  Palette,
  Bot,
  MessageCircle,
  PiggyBank,
  Loader2,
  Send,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  budget_limit: number;
}

const Configuracoes = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [isAiCoachEnabled, setIsAiCoachEnabled] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [budgetTotal, setBudgetTotal] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Category form
  const [categoryName, setCategoryName] = useState("");
  const [categoryColor, setCategoryColor] = useState("#14b8a6");
  const [categoryBudget, setCategoryBudget] = useState("");

  useEffect(() => {
    if (user) {
      fetchCategories();
      fetchProfile();
      setFullName(user.user_metadata?.full_name || "");
    }
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("ai_coach_enabled, whatsapp_number, budget_total" as any)
      .eq("user_id", user!.id)
      .maybeSingle();

    if (data) {
      setIsAiCoachEnabled((data as any).ai_coach_enabled || false);
      setWhatsappNumber((data as any).whatsapp_number || "");
      setBudgetTotal(String((data as any).budget_total || ""));
    }
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

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!categoryName) {
      toast({ title: "Digite o nome da categoria", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("categories").insert({
      user_id: user!.id,
      name: categoryName,
      color: categoryColor,
      budget_limit: categoryBudget ? parseFloat(categoryBudget) : 0,
    });

    if (error) {
      toast({ title: "Erro ao adicionar categoria", variant: "destructive" });
    } else {
      toast({ title: "Categoria adicionada!" });
      setDialogOpen(false);
      setCategoryName("");
      setCategoryColor("#14b8a6");
      setCategoryBudget("");
      fetchCategories();
    }
  };

  const deleteCategory = async (id: string) => {
    await supabase.from("categories").delete().eq("id", id);
    fetchCategories();
    toast({ title: "Categoria removida" });
  };

  const handleUpdateProfile = async () => {
    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName }
    });

    if (error) {
      toast({ title: "Erro ao atualizar perfil", variant: "destructive" });
    } else {
      toast({ title: "Perfil atualizado!" });
    }
  };

  const handleUpdateAiSettings = async () => {
    const { error } = await supabase
      .from("profiles" as any)
      .update({
        ai_coach_enabled: isAiCoachEnabled,
        whatsapp_number: whatsappNumber,
      })
      .eq("user_id", user!.id);

    if (error) {
      toast({ title: "Erro ao atualizar IA", variant: "destructive" });
      return;
    }

    toast({ title: "Configurações de IA salvas!" });

    // Send WhatsApp welcome message when enabling with a number configured
    if (isAiCoachEnabled && whatsappNumber) {
      await supabase.functions.invoke("ivy-weekly-summary");
    }
  };

  const handleUpdateBudget = async () => {
    const { error } = await supabase
      .from("profiles" as any)
      .update({ budget_total: budgetTotal ? parseFloat(budgetTotal) : 0 })
      .eq("user_id", user!.id);

    if (error) {
      toast({ title: "Erro ao salvar orçamento", variant: "destructive" });
    } else {
      toast({ title: "Orçamento mensal salvo!" });
    }
  };

  const handleTestWeeklySummary = async () => {
    setSummaryLoading(true);
    const { error } = await supabase.functions.invoke("ivy-weekly-summary");
    setSummaryLoading(false);
    if (error) {
      toast({ title: "Erro ao gerar resumo", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Resumo semanal enviado via WhatsApp!" });
    }
  };

  const handleCoachInsights = async () => {
    setSummaryLoading(true);
    const { data, error } = await supabase.functions.invoke("ivy-coach-insights");
    setSummaryLoading(false);
    if (error) {
      toast({ title: "Erro na análise", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Análise de padrões gerada!", description: data?.insight?.slice(0, 80) + "..." });
    }
  };


  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 max-w-2xl">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Personalize sua experiência</p>
        </div>

        {/* Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-xl p-4 sm:p-6 border-glow"
        >
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <h2 className="font-bold text-foreground text-sm sm:text-base">Perfil</h2>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-sm">Nome</Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="bg-secondary text-sm sm:text-base"
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-sm">Email</Label>
              <Input
                value={user?.email || ""}
                disabled
                className="bg-secondary opacity-60 text-sm sm:text-base"
              />
            </div>

            <Button variant="default" onClick={handleUpdateProfile} className="w-full sm:w-auto">
              Salvar Perfil
            </Button>
          </div>
        </motion.div>

        {/* AI Settings Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass rounded-xl p-4 sm:p-6 border-glow"
        >
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
              <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <h2 className="font-bold text-foreground text-sm sm:text-base">AI Financial Coach</h2>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Ativar Inteligência Artificial</Label>
                <p className="text-[10px] sm:text-xs text-muted-foreground italic">
                  A IA enviará dicas e avisos sobre seus gastos via WhatsApp.
                </p>
              </div>
              <Switch
                checked={isAiCoachEnabled}
                onCheckedChange={setIsAiCoachEnabled}
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-sm flex items-center gap-2">
                <MessageCircle className="w-3.5 h-3.5" />
                Número do WhatsApp
              </Label>
              <Input
                placeholder="Ex: 5541999999999"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="bg-secondary text-sm sm:text-base"
              />
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Insira o número completo com DDI (55) e DDD.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="default" onClick={handleUpdateAiSettings} className="flex-1 sm:flex-none">
                Salvar IA
              </Button>
              {isAiCoachEnabled && whatsappNumber && (
                <>
                  <Button
                    variant="outline"
                    onClick={handleTestWeeklySummary}
                    disabled={summaryLoading}
                    className="flex-1 sm:flex-none"
                  >
                    {summaryLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Resumo semanal
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCoachInsights}
                    disabled={summaryLoading}
                    className="flex-1 sm:flex-none"
                  >
                    {summaryLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Bot className="w-4 h-4 mr-2" />
                    )}
                    Análise de padrões
                  </Button>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Budget Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="glass rounded-xl p-4 sm:p-6 border-glow"
        >
          <div className="flex items-center gap-2 sm:gap-3 mb-4">
            <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
              <PiggyBank className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <h2 className="font-bold text-foreground text-sm sm:text-base">Orçamento Mensal</h2>
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Limite de gastos por mês (R$)</Label>
              <Input
                type="number"
                placeholder="Ex: 3000"
                value={budgetTotal}
                onChange={(e) => setBudgetTotal(e.target.value)}
                className="bg-secondary text-sm sm:text-base"
              />
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Será exibido no Dashboard como % do orçamento utilizado.
              </p>
            </div>
            <Button variant="default" onClick={handleUpdateBudget} className="w-full sm:w-auto">
              Salvar Orçamento
            </Button>
          </div>
        </motion.div>

        {/* Categories Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-xl p-4 sm:p-6 border-glow"
        >
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
                <Palette className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <h2 className="font-bold text-foreground text-sm sm:text-base">Categorias de Gastos</h2>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Nova</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border mx-4">
                <DialogHeader>
                  <DialogTitle>Nova Categoria</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddCategory} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input
                      placeholder="Ex: Alimentação, Transporte..."
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
                      className="bg-secondary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Cor</Label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={categoryColor}
                        onChange={(e) => setCategoryColor(e.target.value)}
                        className="w-12 h-12 rounded-lg cursor-pointer border-0"
                      />
                      <Input
                        value={categoryColor}
                        onChange={(e) => setCategoryColor(e.target.value)}
                        className="bg-secondary flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Limite mensal (opcional)</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={categoryBudget}
                      onChange={(e) => setCategoryBudget(e.target.value)}
                      className="bg-secondary"
                    />
                  </div>

                  <Button type="submit" variant="hero" className="w-full">
                    Criar Categoria
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {categories.length === 0 ? (
            <p className="text-muted-foreground text-center py-6 sm:py-8 text-sm">
              Nenhuma categoria criada ainda
            </p>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-2.5 sm:p-3 bg-secondary/50 rounded-lg"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div
                      className="w-3 h-3 sm:w-4 sm:h-4 rounded-full shrink-0"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="font-medium text-foreground text-sm sm:text-base truncate">{category.name}</span>
                    {category.budget_limit > 0 && (
                      <span className="text-xs sm:text-sm text-muted-foreground hidden sm:inline">
                        (Limite: R$ {Number(category.budget_limit).toLocaleString("pt-BR", { minimumFractionDigits: 2 })})
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteCategory(category.id)}
                    className="text-muted-foreground hover:text-destructive shrink-0 h-8 w-8"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Configuracoes;
