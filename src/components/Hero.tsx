import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Check, Smartphone, Calendar, TrendingUp, Download } from "lucide-react";
import { Link } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";

export const Hero = () => {
  const features = [
    "100% gratuito",
    "Sem cartão necessário",
    "Acesso completo"
  ];

  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/70" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 mb-6"
            >
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-primary text-sm font-medium">100% GRATUITO</span>
            </motion.div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-tight mb-6">
              CONTROLE SUAS
              <br />
              <span className="text-gradient">FINANÇAS & ROTINA.</span>
            </h1>

            {/* Subheadline */}
            <p className="text-muted-foreground text-base sm:text-lg lg:text-xl mb-8 max-w-xl mx-auto lg:mx-0">
              Invyou é seu sistema completo: controla gastos, organiza sua rotina e mostra exatamente seu progresso.
            </p>

            {/* Features */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-4 sm:gap-6 mb-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-center gap-2"
                >
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  <span className="text-muted-foreground text-sm sm:text-base">{feature}</span>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
            >
              <Link to="/auth">
                <Button variant="hero" size="xl" className="w-full sm:w-auto">
                  COMEÇAR AGORA — É GRÁTIS
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/instalar">
                <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2">
                  <Download className="w-5 h-5" />
                  Instalar App
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Right Content - App Preview */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative hidden lg:block"
          >
            <div className="relative">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-accent/20 blur-3xl rounded-full scale-75" />
              
              {/* Preview Cards */}
              <div className="relative grid grid-cols-2 gap-4">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="glass rounded-2xl p-6 border-glow"
                >
                  <TrendingUp className="w-8 h-8 text-primary mb-4" />
                  <h3 className="font-bold text-foreground mb-2">Dashboard</h3>
                  <p className="text-muted-foreground text-sm">Visão completa dos seus gastos</p>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="glass rounded-2xl p-6 border-glow mt-8"
                >
                  <Calendar className="w-8 h-8 text-accent mb-4" />
                  <h3 className="font-bold text-foreground mb-2">Rotina</h3>
                  <p className="text-muted-foreground text-sm">Organize seu dia a dia</p>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="glass rounded-2xl p-6 border-glow col-span-2"
                >
                  <Smartphone className="w-8 h-8 text-primary mb-4" />
                  <h3 className="font-bold text-foreground mb-2">Progresso</h3>
                  <div className="w-full bg-secondary rounded-full h-2 mb-2">
                    <div className="gradient-primary h-2 rounded-full w-3/4" />
                  </div>
                  <p className="text-muted-foreground text-sm">87% das metas alcançadas</p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center pt-2"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
        </motion.div>
      </motion.div>

      {/* Marquee */}
      <div className="absolute bottom-0 left-0 right-0 py-4 bg-card/50 border-t border-border overflow-hidden">
        <div className="flex marquee">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center gap-8 px-4 whitespace-nowrap">
              <span className="text-muted-foreground">Tarefas Diárias</span>
              <span className="text-primary">•</span>
              <span className="text-muted-foreground">Controle Financeiro</span>
              <span className="text-primary">•</span>
              <span className="text-muted-foreground">Metas Claras</span>
              <span className="text-primary">•</span>
              <span className="text-muted-foreground">Sprints 60 Dias</span>
              <span className="text-primary">•</span>
              <span className="text-muted-foreground">Progresso Visível</span>
              <span className="text-primary">•</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
