import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Log {
  id: string;
  user_message: string | null;
  insight: string;
  created_at: string;
}

const IvyHistorico = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchLogs();
  }, [user]);

  const fetchLogs = async () => {
    const { data } = await supabase
      .from("ai_coach_logs" as any)
      .select("id, user_message, insight, created_at")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (data) setLogs(data as Log[]);
    setLoading(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Histórico Ivy</h1>
          <p className="text-muted-foreground">Conversas e insights anteriores</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Carregando...</div>
        ) : logs.length === 0 ? (
          <div className="glass rounded-xl border-glow p-8 text-center text-muted-foreground">
            <p className="text-3xl mb-3">🌿</p>
            <p className="font-medium">Ainda sem conversas com a Ivy.</p>
            <p className="text-sm mt-1">Use o chat abaixo ou envie uma mensagem pelo WhatsApp!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="glass rounded-xl border-glow p-4 space-y-3">
                <p className="text-xs text-muted-foreground">
                  {format(parseISO(log.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                </p>

                {log.user_message && (
                  <div className="flex justify-end">
                    <div className="max-w-[80%] bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-3 py-2 text-sm">
                      {log.user_message}
                    </div>
                  </div>
                )}

                <div className="flex justify-start">
                  <div className="max-w-[85%] bg-secondary text-foreground rounded-2xl rounded-tl-sm px-3 py-2 text-sm">
                    <span className="font-semibold text-primary text-xs block mb-1">🌿 Ivy</span>
                    {log.insight}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default IvyHistorico;
