import { useEffect, useRef, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Send, Sparkles, Plus, History } from "lucide-react";
import { useInvyChat } from "@/hooks/useInvyChat";
import { MessageBubble } from "./MessageBubble";
import { InvyHistory } from "./InvyHistory";
import { WeeklySummaryBanner } from "./WeeklySummaryBanner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const SUGGESTIONS = [
  "Pra onde tá indo minha grana?",
  "Gastei 45 no iFood",
  "3 cortes que eu posso fazer",
  "Cria meta de R$ 2000 viagem",
  "Resumo do mês",
];

export const InvyChat = ({ open, onOpenChange }: Props) => {
  const { messages, isLoading, send, conversationId, newConversation, loadConversation } = useInvyChat();
  const [input, setInput] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }, [input]);

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
          className="w-full sm:max-w-md p-0 flex flex-col h-full gap-0 pt-[env(safe-area-inset-top)] bg-background/95 backdrop-blur-xl border-l border-border/50"
        >
          {/* Header — compacto, estilo Pierre */}
          <SheetHeader className="px-4 py-3 border-b border-border/50 shrink-0 bg-background/80 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-2">
              <SheetTitle className="flex items-center gap-2.5 min-w-0 text-left">
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary via-primary to-accent flex items-center justify-center shadow-md shadow-primary/30">
                    <Sparkles className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background" />
                </div>
                <div className="flex flex-col min-w-0 leading-tight">
                  <span className="text-[15px] font-semibold truncate">Invy</span>
                  <span className="text-[11px] text-muted-foreground font-normal">tua parceira de finanças</span>
                </div>
              </SheetTitle>
              <div className="flex gap-0.5 shrink-0 mr-7">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full"
                  onClick={() => setHistoryOpen(true)}
                  aria-label="Ver conversas anteriores"
                >
                  <History className="w-[18px] h-[18px]" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full"
                  onClick={newConversation}
                  aria-label="Nova conversa"
                >
                  <Plus className="w-[18px] h-[18px]" />
                </Button>
              </div>
            </div>
          </SheetHeader>

          {/* Mensagens */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain">
            <WeeklySummaryBanner />
            <div className="px-3 sm:px-4 py-4 space-y-3">
              {messages.map((m, i) => (
                <MessageBubble key={i} role={m.role} content={m.content} />
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex items-center gap-2 pl-11">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sugestões — scroll horizontal */}
          {messages.length <= 1 && (
            <div className="shrink-0 pb-2">
              <div
                className="flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none"
                style={{ scrollbarWidth: "none" }}
              >
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    disabled={isLoading}
                    className="shrink-0 text-xs px-3.5 py-2 rounded-full bg-secondary/60 hover:bg-secondary text-foreground border border-border/50 transition-all disabled:opacity-50 active:scale-95 whitespace-nowrap"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input — estilo iMessage */}
          <div className="shrink-0 px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-border/50 bg-background/90 backdrop-blur-sm">
            <div className="flex items-end gap-2">
              <div className="flex-1 relative bg-secondary/60 rounded-3xl border border-border/50 focus-within:border-primary/50 transition-colors">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Conversa com a Invy..."
                  disabled={isLoading}
                  rows={1}
                  className="w-full resize-none bg-transparent px-4 py-2.5 text-[15px] outline-none placeholder:text-muted-foreground/70 max-h-[120px]"
                />
              </div>
              <Button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                size="icon"
                className="h-10 w-10 rounded-full shrink-0 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground transition-all active:scale-95"
                aria-label="Enviar"
              >
                <Send className="w-[18px] h-[18px]" />
              </Button>
            </div>
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
