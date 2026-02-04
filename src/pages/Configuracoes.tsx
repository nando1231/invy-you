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
  CreditCard,
  Crown,
  ExternalLink,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";

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
  const { 
    subscribed, 
    isTrial, 
    subscriptionEnd, 
    loading: subLoading,
    createCheckout,
    openCustomerPortal,
    checkSubscription
  } = useSubscription();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  // Category form
  const [categoryName, setCategoryName] = useState("");
  const [categoryColor, setCategoryColor] = useState("#14b8a6");
  const [categoryBudget, setCategoryBudget] = useState("");

  useEffect(() => {
    if (user) {
      fetchCategories();
      setFullName(user.user_metadata?.full_name || "");
    }
  }, [user]);

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

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    try {
      await createCheckout();
    } catch (error) {
      toast({ title: "Erro ao iniciar checkout", variant: "destructive" });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleOpenPortal = async () => {
    setPortalLoading(true);
    try {
      await openCustomerPortal();
    } catch (error) {
      toast({ title: "Erro ao abrir portal", variant: "destructive" });
    } finally {
      setPortalLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 max-w-2xl">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Personalize sua experiência</p>
        </div>

        {/* Subscription Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-4 sm:p-6 border-glow"
        >
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
              <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <h2 className="font-bold text-foreground text-sm sm:text-base">Assinatura</h2>
          </div>

          {subLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : subscribed ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-lg border border-primary/20">
                <CreditCard className="w-8 h-8 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">
                    Cavilha IA Pro {isTrial && <span className="text-primary">(Trial)</span>}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isTrial ? "Período de teste até" : "Próxima cobrança em"} {formatDate(subscriptionEnd)}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleOpenPortal}
                  disabled={portalLoading}
                  className="flex-1"
                >
                  {portalLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <ExternalLink className="w-4 h-4 mr-2" />
                  )}
                  Gerenciar Assinatura
                </Button>
                <Button variant="ghost" onClick={checkSubscription} size="sm">
                  Atualizar Status
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-secondary/50 rounded-lg">
                <p className="text-muted-foreground mb-2">
                  Você ainda não tem uma assinatura ativa.
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                  <li>✓ 3 dias grátis para testar</li>
                  <li>✓ Acesso completo a todas as funcionalidades</li>
                  <li>✓ Cancele quando quiser</li>
                </ul>
                <p className="font-bold text-foreground text-lg">
                  R$ 29,90<span className="text-sm font-normal text-muted-foreground">/mês</span>
                </p>
              </div>

              <Button 
                variant="hero" 
                onClick={handleCheckout}
                disabled={checkoutLoading}
                className="w-full"
              >
                {checkoutLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Crown className="w-4 h-4 mr-2" />
                )}
                Começar 3 Dias Grátis
              </Button>
            </div>
          )}
        </motion.div>

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
              Salvar Alterações
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
