import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type Msg = { role: "user" | "assistant"; content: string };

export function useInvyChat() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Oi! Sou a **Invy** ✨ sua assistente financeira e de produtividade. Posso registrar gastos, tirar dúvidas sobre o app, analisar suas finanças e ajudar com metas e rotinas.\n\nO que você quer fazer hoje?",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;
      const userMsg: Msg = { role: "user", content: trimmed };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const apiMessages = [...messages, userMsg].filter((m) => m.role !== "assistant" || messages.indexOf(m) > 0);
        const { data, error } = await supabase.functions.invoke("invy-chat", {
          body: { messages: apiMessages, conversationId },
        });

        if (error) throw error;
        if (data?.error) {
          toast.error(data.error);
          setMessages((prev) => [...prev, { role: "assistant", content: `⚠️ ${data.error}` }]);
          return;
        }

        if (data?.conversationId && !conversationId) setConversationId(data.conversationId);
        setMessages((prev) => [...prev, { role: "assistant", content: data?.content ?? "..." }]);
      } catch (e: any) {
        console.error(e);
        toast.error("Erro ao conversar com a Invy");
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Desculpe, tive um problema agora. Tenta de novo? 🙏" },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading, conversationId],
  );

  return { messages, isLoading, send };
}
