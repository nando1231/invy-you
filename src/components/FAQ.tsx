import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Como funciona o controle financeiro?",
    answer: "Você registra suas receitas e despesas de forma simples. O sistema categoriza automaticamente, mostra gráficos de evolução e te alerta quando estiver próximo de estourar limites. Você tem visão diária, semanal e mensal."
  },
  {
    question: "Posso usar no celular?",
    answer: "Sim! O Cavilha Rotinas funciona perfeitamente no navegador do celular. É responsivo e otimizado para todas as telas. Em breve teremos app nativo para iOS e Android."
  },
  {
    question: "Como funciona o sistema de metas e sprints?",
    answer: "Você define metas com prazos específicos. Os sprints de 60 dias te ajudam a manter foco em ciclos curtos de evolução. O dashboard mostra seu progresso em tempo real e te cobra consistência."
  },
  {
    question: "Posso testar antes de assinar?",
    answer: "Claro! O plano Starter é totalmente gratuito. Você pode testar as funcionalidades básicas sem compromisso. Os planos pagos têm garantia de 7 dias - não gostou, devolvemos seu dinheiro."
  },
  {
    question: "Meus dados ficam seguros?",
    answer: "Absolutamente. Usamos criptografia de ponta e servidores seguros. Seus dados financeiros e pessoais são tratados com máxima privacidade. Nunca compartilhamos ou vendemos suas informações."
  },
  {
    question: "Como funciona o cancelamento?",
    answer: "Você pode cancelar a qualquer momento, sem burocracia. Basta acessar as configurações da sua conta. Seu acesso continua até o fim do período pago."
  }
];

export const FAQ = () => {
  return (
    <section id="faq" className="py-20 sm:py-32 relative">
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
            ❓ DÚVIDAS
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground mb-4">
            PERGUNTAS FREQUENTES
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
            Tudo que você precisa saber antes de começar.
          </p>
        </motion.div>

        {/* FAQ Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="glass rounded-xl px-6 border-glow"
              >
                <AccordionTrigger className="text-left text-foreground font-semibold hover:text-primary transition-colors py-5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};
