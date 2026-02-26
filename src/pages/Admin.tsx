import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Users, Shield, Activity, BarChart3, 
  ArrowLeft, Search, ChevronDown, ChevronUp,
  Wallet, CheckSquare, Target, Zap
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import invyouIcon from "@/assets/invyou-icon.png";

interface UserSummary {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  roles: string[];
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  trial_ends_at: string | null;
  stats: {
    transactions: number;
    tasks: number;
    habits: number;
    goals: number;
  };
}

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user) fetchUsers();
  }, [user, authLoading]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("admin-users");
      if (error) throw error;
      if (data?.error) {
        setError(data.error === "Forbidden" ? "Acesso negado. Você não é administrador." : data.error);
        return;
      }
      setUsers(data.users || []);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u =>
    (u.email?.toLowerCase() || "").includes(search.toLowerCase()) ||
    (u.full_name?.toLowerCase() || "").includes(search.toLowerCase())
  );

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Nunca";
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const getTimeSince = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Hoje";
    if (days === 1) return "1 dia";
    return `${days} dias`;
  };

  const totalStats = users.reduce(
    (acc, u) => ({
      transactions: acc.transactions + u.stats.transactions,
      tasks: acc.tasks + u.stats.tasks,
      habits: acc.habits + u.stats.habits,
      goals: acc.goals + u.stats.goals,
    }),
    { transactions: 0, tasks: 0, habits: 0, goals: 0 }
  );

  const activeUsers = users.filter(u => {
    if (!u.last_sign_in_at) return false;
    const diff = Date.now() - new Date(u.last_sign_in_at).getTime();
    return diff < 7 * 24 * 60 * 60 * 1000; // 7 days
  }).length;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
          <Skeleton className="h-10 w-full" />
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="glass rounded-2xl p-8 border-glow text-center max-w-md">
          <Shield className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-bold text-foreground mb-2">Acesso Restrito</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 glass border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={invyouIcon} alt="Invyou" className="w-8 h-8" />
            <div>
              <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
                Painel Admin
                <Badge variant="outline" className="text-xs border-primary text-primary">
                  <Shield className="w-3 h-3 mr-1" /> Admin
                </Badge>
              </h1>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Dashboard
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="glass rounded-xl p-4 border-glow">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-primary/10"><Users className="w-4 h-4 text-primary" /></div>
              <span className="text-xs text-muted-foreground">Total Usuários</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{users.length}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="glass rounded-xl p-4 border-glow">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-green-500/10"><Activity className="w-4 h-4 text-green-500" /></div>
              <span className="text-xs text-muted-foreground">Ativos (7d)</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{activeUsers}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="glass rounded-xl p-4 border-glow">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-blue-500/10"><Wallet className="w-4 h-4 text-blue-500" /></div>
              <span className="text-xs text-muted-foreground">Transações</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{totalStats.transactions}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="glass rounded-xl p-4 border-glow">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-purple-500/10"><BarChart3 className="w-4 h-4 text-purple-500" /></div>
              <span className="text-xs text-muted-foreground">Engajamento</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {totalStats.tasks + totalStats.habits + totalStats.goals}
            </p>
          </motion.div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-secondary"
          />
        </div>

        {/* Users List */}
        <div className="space-y-3">
          {filteredUsers.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">Nenhum usuário encontrado</p>
          ) : (
            filteredUsers.map((u, i) => {
              const isExpanded = expandedUser === u.id;
              return (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="glass rounded-xl border-glow overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedUser(isExpanded ? null : u.id)}
                    className="w-full p-4 flex items-center gap-3 text-left hover:bg-secondary/30 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="text-primary font-bold text-sm">
                        {(u.full_name || u.email || "?").charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-foreground text-sm truncate">
                          {u.full_name || "Sem nome"}
                        </span>
                        {u.roles.includes("admin") && (
                          <Badge variant="outline" className="text-[10px] border-primary text-primary px-1.5 py-0">
                            Admin
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    </div>
                    <div className="hidden sm:block text-right shrink-0">
                      <p className="text-xs text-muted-foreground">Último acesso</p>
                      <p className="text-xs text-foreground">{u.last_sign_in_at ? getTimeSince(u.last_sign_in_at) : "Nunca"}</p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                  </button>

                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      className="border-t border-border px-4 pb-4 pt-3"
                    >
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                        <div className="bg-secondary/50 rounded-lg p-3 text-center">
                          <Wallet className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                          <p className="text-lg font-bold text-foreground">{u.stats.transactions}</p>
                          <p className="text-[10px] text-muted-foreground">Transações</p>
                        </div>
                        <div className="bg-secondary/50 rounded-lg p-3 text-center">
                          <CheckSquare className="w-4 h-4 text-green-500 mx-auto mb-1" />
                          <p className="text-lg font-bold text-foreground">{u.stats.tasks}</p>
                          <p className="text-[10px] text-muted-foreground">Tarefas</p>
                        </div>
                        <div className="bg-secondary/50 rounded-lg p-3 text-center">
                          <Zap className="w-4 h-4 text-yellow-500 mx-auto mb-1" />
                          <p className="text-lg font-bold text-foreground">{u.stats.habits}</p>
                          <p className="text-[10px] text-muted-foreground">Hábitos</p>
                        </div>
                        <div className="bg-secondary/50 rounded-lg p-3 text-center">
                          <Target className="w-4 h-4 text-purple-500 mx-auto mb-1" />
                          <p className="text-lg font-bold text-foreground">{u.stats.goals}</p>
                          <p className="text-[10px] text-muted-foreground">Metas</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="flex justify-between bg-secondary/30 rounded-lg px-3 py-2">
                          <span className="text-muted-foreground">Cadastro</span>
                          <span className="text-foreground">{formatDate(u.created_at)}</span>
                        </div>
                        <div className="flex justify-between bg-secondary/30 rounded-lg px-3 py-2">
                          <span className="text-muted-foreground">Último login</span>
                          <span className="text-foreground">{formatDate(u.last_sign_in_at)}</span>
                        </div>
                        <div className="flex justify-between bg-secondary/30 rounded-lg px-3 py-2">
                          <span className="text-muted-foreground">Email confirmado</span>
                          <span className="text-foreground">{u.email_confirmed_at ? "Sim" : "Não"}</span>
                        </div>
                        <div className="flex justify-between bg-secondary/30 rounded-lg px-3 py-2">
                          <span className="text-muted-foreground">Tempo ativo</span>
                          <span className="text-foreground">{getTimeSince(u.created_at)}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
};

export default Admin;
