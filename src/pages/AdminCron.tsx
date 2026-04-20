import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Play, RefreshCw, Shield, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import invyouIcon from "@/assets/invyou-icon.png";

interface CronJob {
  name: string;
  schedule: string;
  description: string;
  last_run: string | null;
  last_period: string | null;
  summaries_last_7d: number;
  status: string;
}

const AdminCron = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [triggering, setTriggering] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user) fetchJobs();
  }, [user, authLoading]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-cron");
      if (error) throw error;
      if (data?.error) {
        setError(data.error === "Forbidden" ? "Acesso negado. Você não é administrador." : data.error);
        return;
      }
      setJobs(data.jobs || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar jobs");
    } finally {
      setLoading(false);
    }
  };

  const triggerJob = async (name: string) => {
    setTriggering(name);
    try {
      const { data, error } = await supabase.functions.invoke(`admin-cron?action=trigger`);
      if (error) throw error;
      if (data?.ok) {
        toast.success(`${name} disparado com sucesso`, {
          description: data.result?.generated
            ? `${data.result.generated} resumos gerados de ${data.result.total} usuários`
            : "Job executado",
        });
        await fetchJobs();
      } else {
        toast.error(`Falha ao disparar ${name}`, {
          description: `Status ${data?.status ?? "?"}`,
        });
      }
    } catch (err: any) {
      toast.error("Erro ao disparar job", { description: err.message });
    } finally {
      setTriggering(null);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Nunca executado";
    return new Date(dateStr).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const getTimeSince = (dateStr: string | null) => {
    if (!dateStr) return null;
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "Há menos de 1h";
    if (hours < 24) return `Há ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Há ${days}d`;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
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
      <header className="sticky top-0 z-30 glass border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={invyouIcon} alt="Invyou" className="w-8 h-8" />
            <div>
              <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
                Cron Jobs
                <Badge variant="outline" className="text-xs border-primary text-primary">
                  <Shield className="w-3 h-3 mr-1" /> Admin
                </Badge>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={fetchJobs}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/adm")}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Admin
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-6 space-y-4">
        <div className="mb-2">
          <h2 className="text-2xl font-bold text-foreground mb-1">Tarefas agendadas</h2>
          <p className="text-sm text-muted-foreground">
            Monitore e dispare manualmente os jobs do sistema.
          </p>
        </div>

        {jobs.length === 0 ? (
          <div className="glass rounded-xl border-glow p-12 text-center">
            <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhum job encontrado</p>
          </div>
        ) : (
          jobs.map((job, i) => (
            <motion.div
              key={job.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-xl border-glow overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-bold text-foreground">{job.name}</h3>
                      {job.status === "active" ? (
                        <Badge variant="outline" className="text-[10px] border-primary text-primary">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Ativo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] border-muted-foreground text-muted-foreground">
                          <AlertCircle className="w-3 h-3 mr-1" /> Inativo
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{job.description}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => triggerJob(job.name)}
                    disabled={triggering === job.name}
                  >
                    {triggering === job.name ? (
                      <>
                        <RefreshCw className="w-3 h-3 mr-1.5 animate-spin" /> Executando...
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 mr-1.5" /> Disparar agora
                      </>
                    )}
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mt-4">
                  <div className="flex justify-between bg-secondary/40 rounded-lg px-3 py-2">
                    <span className="text-muted-foreground">Agendamento</span>
                    <span className="text-foreground font-mono text-[11px]">{job.schedule}</span>
                  </div>
                  <div className="flex justify-between bg-secondary/40 rounded-lg px-3 py-2">
                    <span className="text-muted-foreground">Última execução</span>
                    <span className="text-foreground">
                      {getTimeSince(job.last_run) ?? "Nunca"}
                    </span>
                  </div>
                  <div className="flex justify-between bg-secondary/40 rounded-lg px-3 py-2">
                    <span className="text-muted-foreground">Data exata</span>
                    <span className="text-foreground">{formatDate(job.last_run)}</span>
                  </div>
                  <div className="flex justify-between bg-secondary/40 rounded-lg px-3 py-2">
                    <span className="text-muted-foreground">Resumos (7d)</span>
                    <span className="text-foreground font-bold">{job.summaries_last_7d}</span>
                  </div>
                  {job.last_period && (
                    <div className="flex justify-between bg-secondary/40 rounded-lg px-3 py-2 sm:col-span-2">
                      <span className="text-muted-foreground">Última semana processada</span>
                      <span className="text-foreground font-mono text-[11px]">{job.last_period}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </main>
    </div>
  );
};

export default AdminCron;
