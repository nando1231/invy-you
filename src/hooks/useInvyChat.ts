import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type Msg = { role: "user" | "assistant"; content: string };

const WELCOME: Msg = {
  role: "assistant",
  content:
    "Oi! Sou a **Invy** ✨\n\nTua parceira de finanças. Posso anotar gasto na hora, te mostrar onde a grana tá indo e dar uns toques quando precisar.\n\nManda ver, o que rolou hoje?",
};

export function useInvyChat() {
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const newConversation = useCallback(() => {
    setMessages([WELCOME]);
    setConversationId(null);
  }, []);

  const loadConversation = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("role,content")
        .eq("conversation_id", id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      const loaded: Msg[] = (data || []).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));
      setMessages(loaded.length ? loaded : [WELCOME]);
      setConversationId(id);
    } catch (e) {
      toast.error("Não consegui carregar essa conversa");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;
      const userMsg: Msg = { role: "user", content: trimmed };
      setMessages((prev) => [...prev, userMsg, { role: "assistant", content: "" }]);
      setIsLoading(true);

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;
        if (!accessToken) throw new Error("Sessão expirada");

        // Send full history (excluding our local welcome message) + new user msg
        const apiMessages = [...messages.slice(1), userMsg].map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invy-chat`;
        const resp = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ messages: apiMessages, conversationId }),
        });

        const convHeader = resp.headers.get("x-conversation-id");
        if (convHeader && !conversationId) setConversationId(convHeader);

        if (!resp.ok) {
          let errMsg = "Erro ao falar com a Invy";
          try {
            const j = await resp.json();
            if (j?.error) errMsg = j.error;
          } catch { /* ignore */ }
          if (resp.status === 429) errMsg = "Tô recebendo muitas mensagens. Tenta de novo em uns segundos 🙏";
          if (resp.status === 402) errMsg = "Os créditos da IA acabaram. Adicione créditos no workspace 💳";
          toast.error(errMsg);
          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = { role: "assistant", content: `⚠️ ${errMsg}` };
            return next;
          });
          return;
        }

        if (!resp.body) throw new Error("Sem stream");

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        let assistantSoFar = "";
        let done = false;

        while (!done) {
          const r = await reader.read();
          if (r.done) break;
          buf += decoder.decode(r.value, { stream: true });
          let nl: number;
          while ((nl = buf.indexOf("\n")) !== -1) {
            let line = buf.slice(0, nl);
            buf = buf.slice(nl + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line || line.startsWith(":")) continue;
            if (!line.startsWith("data: ")) continue;
            const j = line.slice(6).trim();
            if (j === "[DONE]") { done = true; break; }
            try {
              const parsed = JSON.parse(j);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                assistantSoFar += delta;
                setMessages((prev) => {
                  const next = [...prev];
                  next[next.length - 1] = { role: "assistant", content: assistantSoFar };
                  return next;
                });
              }
            } catch {
              buf = line + "\n" + buf;
              break;
            }
          }
        }

        // Flush leftovers
        if (buf.trim()) {
          for (let raw of buf.split("\n")) {
            if (!raw || raw.startsWith(":") || !raw.startsWith("data: ")) continue;
            const j = raw.slice(6).trim();
            if (j === "[DONE]") continue;
            try {
              const parsed = JSON.parse(j);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                assistantSoFar += delta;
                setMessages((prev) => {
                  const next = [...prev];
                  next[next.length - 1] = { role: "assistant", content: assistantSoFar };
                  return next;
                });
              }
            } catch { /* ignore */ }
          }
        }

        if (!assistantSoFar) {
          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = { role: "assistant", content: "Hmm, fiquei sem palavras agora 😅 manda de novo?" };
            return next;
          });
        }
      } catch (e: any) {
        console.error(e);
        toast.error("Erro ao conversar com a Invy");
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: "Deu ruim aqui agora 😬 tenta de novo em alguns segundos." };
          return next;
        });
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading, conversationId],
  );

  return { messages, isLoading, send, conversationId, newConversation, loadConversation };
}
