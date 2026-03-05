import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  role: "user" | "ivy";
  text: string;
}

export const IvyChat = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "0",
      role: "ivy",
      text: "Olá! Sou a Ivy 🌿 Pode me dizer um gasto, uma receita ou tirar dúvidas sobre suas finanças!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const appendMessage = (role: "user" | "ivy", text: string) => {
    setMessages((prev) => [...prev, { id: Date.now().toString(), role, text }]);
  };

  const handleResponse = async (data: { response?: string; transcribed?: string } | null, err: unknown) => {
    if (err || !data) {
      appendMessage("ivy", "Desculpa, tive um problema técnico. Tenta novamente!");
      return;
    }
    appendMessage("ivy", data.response ?? "Não entendi. Tente novamente!");
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    appendMessage("user", text);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("ivy-chat", {
        body: { message: text },
      });
      await handleResponse(data, error);
    } catch {
      appendMessage("ivy", "Desculpa, tive um problema técnico. Tenta novamente!");
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (blob.size < 1000) return; // too short

        appendMessage("user", "🎙️ [mensagem de voz]");
        setLoading(true);

        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) throw new Error("No session");

          const formData = new FormData();
          formData.append("audio", blob, "recording.webm");

          const supabaseUrl = (supabase as unknown as { supabaseUrl: string }).supabaseUrl;
          const res = await fetch(`${supabaseUrl}/functions/v1/ivy-chat`, {
            method: "POST",
            headers: { Authorization: `Bearer ${session.access_token}` },
            body: formData,
          });
          const data = await res.json();

          if (data.transcribed) {
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last?.role === "user" && last.text === "🎙️ [mensagem de voz]") {
                updated[updated.length - 1] = { ...last, text: `🎙️ "${data.transcribed}"` };
              }
              return updated;
            });
          }
          appendMessage("ivy", data.response ?? "Não entendi. Tenta de novo!");
        } catch {
          appendMessage("ivy", "Erro ao processar o áudio. Tenta digitar!");
        } finally {
          setLoading(false);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      appendMessage("ivy", "Não foi possível acessar o microfone.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const toggleRecording = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-20 right-4 w-80 sm:w-96 z-50 glass border border-border rounded-2xl overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-base">
                  🌿
                </div>
                <div>
                  <p className="font-bold text-foreground text-sm leading-tight">Ivy</p>
                  <p className="text-xs text-muted-foreground leading-tight">Coach Financeira</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                className="h-7 w-7 text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Messages */}
            <div className="h-72 overflow-y-auto p-3 space-y-2 bg-background/30">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-snug ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-secondary text-foreground rounded-tl-sm"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-secondary rounded-2xl rounded-tl-sm px-3 py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border flex gap-2 bg-card/50">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Ex: gastei 50 no mercado..."
                className="bg-secondary text-sm h-9"
                disabled={loading || isRecording}
              />
              <Button
                size="icon"
                variant={isRecording ? "destructive" : "outline"}
                onClick={toggleRecording}
                disabled={loading}
                className="h-9 w-9 shrink-0"
                title={isRecording ? "Parar gravação" : "Gravar áudio"}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
              <Button
                size="icon"
                onClick={sendMessage}
                disabled={loading || !input.trim() || isRecording}
                className="h-9 w-9 shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-4 right-4 z-50 w-[52px] h-[52px] rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-5 h-5" />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="text-xl"
            >
              🌿
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
};
