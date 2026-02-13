import { motion } from "framer-motion";
import { 
  CheckSquare, 
  Wallet, 
  Target, 
  TrendingUp,
  ArrowRight
} from "lucide-react";

const features = [
  {
    icon: CheckSquare,
    title: "TAREFAS DIÁRIAS",
    description: "Crie, organize, EXECUTE. O sistema cobra cada uma. Dashboard mostra progresso em tempo real.",
    stat: "87% das tarefas completadas esta semana",
    color: "text-primary"
  },
  {
    icon: Wallet,
    title: "CONTROLE FINANCEIRO",
    description: "Receitas, despesas, orçamento. Veja onde cada centavo vai. Alertas quando estourar limite.",
    stat: "R$ 1.247 economizados este mês",
    color: "text-primary"
  },
  {
    icon: Target,
    title: "SISTEMA DE HÁBITOS",
    description: "Construa hábitos inquebráveis. Registro de sequências. Cada dia conta para sua evolução.",
    stat: "47 dias de sequência - recorde pessoal",
    color: "text-primary"
  },
  {
    icon: TrendingUp,
    title: "METAS & SPRINTS",
    description: "Defina metas claras com prazos. Sprints de 60 dias para evolução constante e mensurável.",
    stat: "3 metas alcançadas este mês",
    color: "text-primary"
  }
];

export const Features = () => {
  return (
    <section id="features" className="py-20 sm:py-32 relative">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
          <span className="text-primary text-sm font-semibold tracking-wider mb-4 block">
            ⚔️ ARSENAL COMPLETO
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground mb-4">
            O ARSENAL COMPLETO
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
            Invyou comanda. Você executa. Resultados aparecem.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group glass rounded-2xl p-6 sm:p-8 border-glow hover:glow-primary-subtle transition-all duration-500"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className={`w-6 h-6 sm:w-8 sm:h-8 ${feature.color}`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm sm:text-base mb-4">
                    {feature.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-primary font-medium">
                    <ArrowRight className="w-4 h-4" />
                    {feature.stat}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
