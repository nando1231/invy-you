import { motion } from "framer-motion";

export const Footer = () => {
  return (
    <footer className="py-12 border-t border-border">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row items-center justify-between gap-6"
        >
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-black text-lg">C</span>
            </div>
            <span className="text-foreground font-bold text-lg tracking-tight">
              CAVILHA<span className="text-primary">.IA</span>
            </span>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap justify-center gap-6 text-sm">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Recursos
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              Planos
            </a>
            <a href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">
              FAQ
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              Termos
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              Privacidade
            </a>
          </nav>

          {/* Copyright */}
          <p className="text-muted-foreground text-sm">
            © 2024 Cavilha IA. Todos os direitos reservados.
          </p>
        </motion.div>
      </div>
    </footer>
  );
};
