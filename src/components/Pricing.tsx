import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  "Dashboard completo",
  "Controle financeiro ilimitado",
  "Tarefas e hábitos ilimitados",
  "Metas e progresso",
  "Acesso web + mobile (PWA)",
  "Sem limites de uso",
  "Atualizações constantes"
];

export const Pricing = () => {
  return (
    <section id="pricing" className="py-20 sm:py-32 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
          <span className="text-primary text-sm font-semibold tracking-wider mb-4 block">
            🎉 ACESSO GRATUITO
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground mb-4">
            TOTALMENTE GRÁTIS
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
            Acesse todas as funcionalidades sem pagar nada. Sem pegadinhas.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-md mx-auto"
        >
          <div className="relative glass rounded-2xl p-6 sm:p-8 border-2 border-primary glow-primary-subtle">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full">
                GRÁTIS
              </span>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Acesso Completo</h3>
            </div>

            <div className="mb-4">
              <span className="text-4xl font-black text-foreground">R$ 0</span>
              <span className="text-muted-foreground"> /sempre</span>
            </div>

            <p className="text-muted-foreground text-sm mb-6">Tudo liberado, sem limites.</p>

            <ul className="space-y-3 mb-8">
              {features.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-foreground text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <Link to="/auth">
              <Button variant="hero" className="w-full" size="lg">
                Começar Agora
              </Button>
            </Link>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center text-muted-foreground text-sm mt-8"
        >
          ✅ 100% gratuito • Sem cartão • Sem limites
        </motion.p>
      </div>
    </section>
  );
};
