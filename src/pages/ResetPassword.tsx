import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import invyouIcon from "@/assets/invyou-icon.png";
import { z } from "zod";

const passwordSchema = z.string().min(6, "Senha deve ter no mínimo 6 caracteres");

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if we have a recovery session
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get("type");
    if (type !== "recovery") {
      // Also check query params (some flows use query params)
      const queryParams = new URLSearchParams(window.location.search);
      const queryType = queryParams.get("type");
      if (queryType !== "recovery") {
        // Listen for PASSWORD_RECOVERY event
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
          if (event === "PASSWORD_RECOVERY") {
            // User is in recovery mode, stay on page
          }
        });
        return () => subscription.unsubscribe();
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const result = passwordSchema.safeParse(password);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    setIsLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      setSuccess(true);
      toast({ title: "Senha atualizada com sucesso!" });
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (err: any) {
      setError(err.message || "Erro ao atualizar senha");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Senha atualizada!</h1>
          <p className="text-muted-foreground">Redirecionando para o dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center justify-center gap-2 mb-8">
          <img src={invyouIcon} alt="Invyou" className="w-10 h-10" />
          <span className="text-foreground font-bold text-xl tracking-tight lowercase">
            inv<span className="text-gradient">you</span>
          </span>
        </div>

        <div className="glass rounded-2xl p-8 border-glow">
          <h1 className="text-2xl font-bold text-foreground mb-2 text-center">
            Nova senha
          </h1>
          <p className="text-muted-foreground text-center mb-6">
            Digite sua nova senha abaixo
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-secondary border-border"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 bg-secondary border-border"
                />
              </div>
            </div>

            {error && (
              <p className="text-destructive text-sm">{error}</p>
            )}

            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Atualizando..." : "Atualizar senha"}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
