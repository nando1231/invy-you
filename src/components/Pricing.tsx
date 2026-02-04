import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Check, Crown, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Mensal",
    price: "R$ 29,90",
    period: "/mês",
    description: "Flexibilidade total para testar",
    icon: Crown,
    features: [
      "3 dias grátis para começar",
      "Dashboard completo",
      "Controle financeiro ilimitado",
      "Tarefas e hábitos ilimitados",
      "Metas e progresso",
      "Acesso web + mobile (PWA)",
      "Cancele quando quiser"
    ],
    cta: "Começar Grátis",
    variant: "heroOutline" as const,
    popular: false,
    badge: null
  },
  {
    name: "Trimestral",
    price: "R$ 45",
    originalPrice: "R$ 89,70",
    period: "/3 meses",
    description: "Melhor custo-benefício",
    icon: Sparkles,
    features: [
      "Tudo do plano mensal",
      "50% de economia",
      "Equivale a R$ 15/mês",
      "3 dias grátis para começar",
      "Compromisso com resultados",
      "Acesso web + mobile (PWA)",
      "Cancele quando quiser"
    ],
    cta: "Economizar 50%",
    variant: "hero" as const,
    popular: true,
    badge: "50% OFF"
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
            ESCOLHA SEU PLANO
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
            Comece com 3 dias grátis. Sem cartão para testar.
          </p>
        </motion.div>

        {/* Pricing Grid */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-3xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`relative glass rounded-2xl p-6 sm:p-8 ${
                plan.popular ? "border-2 border-primary glow-primary-subtle" : "border-glow"
              }`}
            >
              {/* Popular Badge */}
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full">
                    {plan.badge}
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
                {plan.originalPrice && (
                  <span className="text-muted-foreground line-through text-lg mr-2">{plan.originalPrice}</span>
                )}
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
              <Link to="/auth">
                <Button variant={plan.variant} className="w-full" size="lg">
                  {plan.cta}
                </Button>
              </Link>
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
          ✅ 3 dias grátis • Cancele quando quiser • Sem fidelidade
        </motion.p>
      </div>
    </section>
  );
};
