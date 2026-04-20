import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare, Trash2, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface Conv {
  id: string;
  title: string;
  updated_at: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currentId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}

export const InvyHistory = ({ open, onOpenChange, currentId, onSelect, onNew }: Props) => {
  const [convs, setConvs] = useState<Conv[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("chat_conversations")
      .select("id,title,updated_at")
      .order("updated_at", { ascending: false })
      .limit(50);
    if (!error && data) setConvs(data);
    setLoading(false);
  };

  useEffect(() => { if (open) load(); }, [open]);

  const remove = async (id: string) => {
    await supabase.from("chat_messages").delete().eq("conversation_id", id);
    const { error } = await supabase.from("chat_conversations").delete().eq("id", id);
    if (error) { toast.error("Não consegui apagar"); return; }
    setConvs((c) => c.filter((x) => x.id !== id));
    if (id === currentId) onNew();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-full sm:max-w-sm p-0 flex flex-col gap-0 pt-[env(safe-area-inset-top)]">
        <SheetHeader className="p-4 border-b border-border shrink-0">
          <SheetTitle>Conversas</SheetTitle>
        </SheetHeader>

        <div className="p-3 shrink-0">
          <Button
            onClick={() => { onNew(); onOpenChange(false); }}
            className="w-full justify-start gap-2"
            variant="outline"
          >
            <Plus className="w-4 h-4" /> Nova conversa
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {loading && (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          )}
          {!loading && convs.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8 px-4">
              Nenhuma conversa ainda. Manda a primeira mensagem pra Invy!
            </p>
          )}
          {convs.map((c) => (
            <div
              key={c.id}
              className={`group flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-colors ${
                c.id === currentId ? "bg-secondary" : "hover:bg-secondary/50"
              }`}
              onClick={() => { onSelect(c.id); onOpenChange(false); }}
            >
              <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{c.title}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(c.updated_at), { locale: ptBR, addSuffix: true })}
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); remove(c.id); }}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive p-1 transition-opacity"
                aria-label="Apagar conversa"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};
