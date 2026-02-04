import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Check, Zap, Crown, Rocket } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "Grátis",
    period: "",
    description: "Perfeito para começar a organizar sua vida",
    icon: Zap,
    features: [
      "Dashboard básico",
      "Até 10 tarefas/dia",
      "Controle de 3 categorias",
      "Relatório semanal",
    ],
    cta: "Começar Grátis",
    variant: "outline" as const,
    popular: false
  },
  {
    name: "Pro",
    price: "R$ 29",
    period: "/mês",
    description: "Para quem quer resultados reais",
    icon: Crown,
    features: [
      "Tudo do Starter",
      "Tarefas ilimitadas",
      "Controle financeiro completo",
      "Metas e Sprints 60 dias",
      "Sistema de hábitos",
      "Relatórios detalhados",
      "Suporte prioritário"
    ],
    cta: "Assinar Pro",
    variant: "hero" as const,
    popular: true
  },
  {
    name: "Elite",
    price: "R$ 49",
    period: "/mês",
    description: "Máximo controle e performance",
    icon: Rocket,
    features: [
      "Tudo do Pro",
      "IA para sugestões",
      "Mentoria personalizada",
      "Múltiplos perfis",
      "API de integrações",
      "White-label",
      "Suporte VIP 24/7"
    ],
    cta: "Ir para Elite",
    variant: "heroOutline" as const,
    popular: false
  }
];

export const Pricing = () => {
  return (
    <section id="pricing" className="py-20 sm:py-32 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
          <span className="text-primary text-sm font-semibold tracking-wider mb-4 block">
            💎 PLANOS
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground mb-4">
            ESCOLHA SEU NÍVEL
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
            Comece grátis. Evolua quando estiver pronto.
          </p>
        </motion.div>

        {/* Pricing Grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`relative glass rounded-2xl p-6 sm:p-8 ${
                plan.popular ? "border-2 border-primary glow-primary-subtle scale-105" : "border-glow"
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full">
                    MAIS POPULAR
                  </span>
                </div>
              )}

              {/* Plan Icon & Name */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${plan.popular ? "bg-primary" : "bg-primary/10"}`}>
                  <plan.icon className={`w-5 h-5 ${plan.popular ? "text-primary-foreground" : "text-primary"}`} />
                </div>
                <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
              </div>

              {/* Price */}
              <div className="mb-4">
                <span className="text-4xl font-black text-foreground">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>

              {/* Description */}
              <p className="text-muted-foreground text-sm mb-6">{plan.description}</p>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-foreground text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button variant={plan.variant} className="w-full" size="lg">
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Guarantee */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center text-muted-foreground text-sm mt-8"
        >
          ✅ Garantia de 7 dias • Cancele quando quiser • Sem fidelidade
        </motion.p>
      </div>
    </section>
  );
};
