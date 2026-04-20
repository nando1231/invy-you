import { useEffect, useRef, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Sparkles, Loader2, Plus, History } from "lucide-react";
import { useInvyChat } from "@/hooks/useInvyChat";
import { MessageBubble } from "./MessageBubble";
import { InvyHistory } from "./InvyHistory";
import { WeeklySummaryBanner } from "./WeeklySummaryBanner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const SUGGESTIONS = [
  "Pra onde tá indo minha grana esse mês?",
  "Gastei 45 no iFood agora",
  "Me dá 3 cortes que eu posso fazer já",
  "Crio uma meta de R$ 2000 pra viagem?",
];

export const InvyChat = ({ open, onOpenChange }: Props) => {
  const { messages, isLoading, send, conversationId, newConversation, loadConversation } = useInvyChat();
  const [input, setInput] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    send(input);
    setInput("");
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md p-0 flex flex-col h-full gap-0 pt-[env(safe-area-inset-top)]"
        >
          <SheetHeader className="p-4 border-b border-border shrink-0">
            <div className="flex items-center justify-between gap-2">
              <SheetTitle className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="truncate">
                  Invy <span className="text-xs text-muted-foreground font-normal">· tua parceira</span>
                </span>
              </SheetTitle>
              <div className="flex gap-1 shrink-0 mr-8">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setHistoryOpen(true)}
                  aria-label="Ver conversas anteriores"
                >
                  <History className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={newConversation}
                  aria-label="Nova conversa"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </SheetHeader>

          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            <WeeklySummaryBanner />
            <div className="p-4 space-y-4">
              {messages.map((m, i) => (
                <MessageBubble key={i} role={m.role} content={m.content} />
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex items-center gap-2 text-muted-foreground text-sm pl-10">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Invy tá pensando...
                </div>
              )}
            </div>
          </div>

          {messages.length <= 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-2 shrink-0">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  disabled={isLoading}
                  className="text-xs px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/70 text-foreground transition-colors disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="p-4 border-t border-border shrink-0 flex gap-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
              placeholder="Pergunte algo ou registre um gasto..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={isLoading || !input.trim()} size="icon">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <InvyHistory
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        currentId={conversationId}
        onSelect={loadConversation}
        onNew={newConversation}
      />
    </>
  );
};
