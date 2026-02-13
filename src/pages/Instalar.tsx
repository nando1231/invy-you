import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Download, Smartphone, Share, Plus, MoreVertical, Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import invyouIcon from "@/assets/invyou-icon.png";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Instalar = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const userAgent = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon" className="shrink-0">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <img src={invyouIcon} alt="Invyou" className="w-8 h-8" />
              <span className="font-bold text-lg lowercase">inv<span className="text-gradient">you</span></span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Hero */}
          <div className="text-center space-y-4">
            <div className="w-24 h-24 mx-auto rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Smartphone className="w-12 h-12 text-primary-foreground" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">Instalar Invyou</h1>
            <p className="text-muted-foreground">
              Tenha acesso rápido ao seu assistente de finanças e rotinas direto na tela inicial
            </p>
          </div>

          {/* Status Card */}
          {isInstalled ? (
            <Card className="border-primary/50 bg-primary/10">
              <CardContent className="p-6 text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
                  <Check className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-lg font-semibold">App já instalado!</h2>
                <p className="text-sm text-muted-foreground">
                  O Invyou está na sua tela inicial. Basta tocar no ícone para abrir.
                </p>
                <Link to="/dashboard">
                  <Button className="w-full mt-2">Ir para o Dashboard</Button>
                </Link>
              </CardContent>
            </Card>
          ) : deferredPrompt ? (
            <Card className="border-primary/50">
              <CardContent className="p-6 text-center space-y-4">
                <Button onClick={handleInstallClick} size="lg" className="w-full gap-2">
                  <Download className="w-5 h-5" />
                  Instalar Agora
                </Button>
                <p className="text-xs text-muted-foreground">
                  Um clique e o app aparece na sua tela inicial
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {isIOS && (
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <h2 className="font-semibold flex items-center gap-2">
                      <Share className="w-5 h-5 text-primary" />
                      Como instalar no iPhone/iPad
                    </h2>
                    <ol className="space-y-4">
                      <li className="flex gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-sm flex items-center justify-center shrink-0">1</span>
                        <div>
                          <p className="font-medium">Toque no ícone de Compartilhar</p>
                          <p className="text-sm text-muted-foreground">Na barra inferior do Safari, toque em <Share className="w-4 h-4 inline" /></p>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-sm flex items-center justify-center shrink-0">2</span>
                        <div>
                          <p className="font-medium">Selecione "Adicionar à Tela de Início"</p>
                          <p className="text-sm text-muted-foreground">Role para baixo e toque na opção <Plus className="w-4 h-4 inline" /></p>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-sm flex items-center justify-center shrink-0">3</span>
                        <div>
                          <p className="font-medium">Toque em "Adicionar"</p>
                          <p className="text-sm text-muted-foreground">Confirme e o app aparecerá na sua tela inicial</p>
                        </div>
                      </li>
                    </ol>
                  </CardContent>
                </Card>
              )}

              {isAndroid && (
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <h2 className="font-semibold flex items-center gap-2">
                      <Download className="w-5 h-5 text-primary" />
                      Como instalar no Android
                    </h2>
                    <ol className="space-y-4">
                      <li className="flex gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-sm flex items-center justify-center shrink-0">1</span>
                        <div>
                          <p className="font-medium">Toque no menu do navegador</p>
                          <p className="text-sm text-muted-foreground">Toque nos três pontos <MoreVertical className="w-4 h-4 inline" /> no canto superior</p>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-sm flex items-center justify-center shrink-0">2</span>
                        <div>
                          <p className="font-medium">Selecione "Instalar app" ou "Adicionar à tela inicial"</p>
                          <p className="text-sm text-muted-foreground">A opção pode variar dependendo do navegador</p>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-sm flex items-center justify-center shrink-0">3</span>
                        <div>
                          <p className="font-medium">Confirme a instalação</p>
                          <p className="text-sm text-muted-foreground">O app será adicionado à sua tela inicial</p>
                        </div>
                      </li>
                    </ol>
                  </CardContent>
                </Card>
              )}

              {!isIOS && !isAndroid && (
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <h2 className="font-semibold flex items-center gap-2">
                      <Download className="w-5 h-5 text-primary" />
                      Como instalar
                    </h2>
                    <p className="text-muted-foreground">Acesse este site pelo celular para ver as instruções de instalação específicas para seu dispositivo.</p>
                    <p className="text-sm text-muted-foreground">No computador, procure pelo ícone de instalação na barra de endereços do navegador.</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Benefits */}
          <div className="space-y-3">
            <h2 className="font-semibold text-center">Por que instalar?</h2>
            <div className="grid gap-3">
              {[
                { icon: "⚡", title: "Acesso Rápido", desc: "Abra direto da tela inicial" },
                { icon: "📴", title: "Funciona Offline", desc: "Use mesmo sem internet" },
                { icon: "🔔", title: "Notificações", desc: "Receba lembretes importantes" },
                { icon: "💾", title: "Menos Espaço", desc: "Muito mais leve que apps tradicionais" },
              ].map((item) => (
                <div key={item.title} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <p className="font-medium text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Instalar;
