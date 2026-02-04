import { motion } from "framer-motion";
import { Crown, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import { useState } from "react";
import { toast } from "sonner";

interface PaywallProps {
  children: React.ReactNode;
}

export const Paywall = ({ children }: PaywallProps) => {
  const { subscribed, loading, createCheckout } = useSubscription();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "quarterly">("quarterly");

  const handleCheckout = async (plan: "monthly" | "quarterly") => {
    setCheckoutLoading(true);
    setSelectedPlan(plan);
    try {
      await createCheckout(plan);
      // If we get here without redirect, it means something failed
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Erro ao iniciar checkout. Tente novamente.");
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (subscribed) {
    return <>{children}</>;
  }

  // User not subscribed - show paywall
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="glass rounded-2xl p-6 sm:p-8 border-glow text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="w-8 h-8 text-primary" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
            Assine para Continuar
          </h1>
          
          <p className="text-muted-foreground mb-6">
            Seu período de teste expirou. Assine o Cavilha IA para continuar organizando sua vida.
          </p>

          {/* Plans */}
          <div className="space-y-3 mb-6">
            {/* Quarterly - Recommended */}
            <button
              onClick={() => setSelectedPlan("quarterly")}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                selectedPlan === "quarterly"
                  ? "border-primary bg-primary/10"
                  : "border-border bg-secondary/50 hover:border-primary/50"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-primary" />
                  <span className="font-bold text-foreground">Trimestral</span>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-primary text-primary-foreground font-medium">
                  50% OFF
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-foreground">R$ 45</span>
                <span className="text-muted-foreground text-sm">/3 meses</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Equivale a R$ 15/mês • Economia de R$ 45
              </p>
            </button>

            {/* Monthly */}
            <button
              onClick={() => setSelectedPlan("monthly")}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                selectedPlan === "monthly"
                  ? "border-primary bg-primary/10"
                  : "border-border bg-secondary/50 hover:border-primary/50"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-muted-foreground" />
                <span className="font-bold text-foreground">Mensal</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-foreground">R$ 29,90</span>
                <span className="text-muted-foreground text-sm">/mês</span>
              </div>
            </button>
          </div>

          <Button
            variant="hero"
            size="lg"
            onClick={() => handleCheckout(selectedPlan)}
            disabled={checkoutLoading}
            className="w-full"
          >
            {checkoutLoading ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <Crown className="w-5 h-5 mr-2" />
            )}
            {selectedPlan === "quarterly" ? "Assinar por R$ 45" : "Assinar por R$ 29,90/mês"}
          </Button>

          <p className="text-xs text-muted-foreground mt-4">
            3 dias grátis • Cancele quando quiser
          </p>
        </div>
      </motion.div>
    </div>
  );
};
