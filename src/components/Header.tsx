import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Menu, X, Download } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import invyouIcon from "@/assets/invyou-icon.png";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 glass"
    >
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src={invyouIcon} alt="Invyou" className="w-8 h-8 sm:w-10 sm:h-10" />
            <span className="text-foreground font-bold text-lg sm:text-xl tracking-tight lowercase">
              inv<span className="text-gradient">you</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Recursos
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              Planos
            </a>
            <a href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">
              FAQ
            </a>
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/instalar">
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                Instalar App
              </Button>
            </Link>
            <Link to="/auth">
              <Button variant="ghost" size="sm">
                Login
              </Button>
            </Link>
            <Link to="/auth">
              <Button variant="hero" size="sm">
                Começar Grátis
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-foreground"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[-1] md:hidden"
              onClick={handleLinkClick}
            />
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="md:hidden pb-6 pt-2"
            >
              <nav className="flex flex-col gap-4">
                <a href="#features" onClick={handleLinkClick} className="text-muted-foreground hover:text-foreground transition-colors py-2">
                  Recursos
                </a>
                <a href="#pricing" onClick={handleLinkClick} className="text-muted-foreground hover:text-foreground transition-colors py-2">
                  Planos
                </a>
                <a href="#faq" onClick={handleLinkClick} className="text-muted-foreground hover:text-foreground transition-colors py-2">
                  FAQ
                </a>
                <div className="flex flex-col gap-2 pt-2">
                  <Link to="/instalar" onClick={handleLinkClick}>
                    <Button variant="outline" size="sm" className="w-full gap-2">
                      <Download className="w-4 h-4" />
                      Instalar App
                    </Button>
                  </Link>
                  <Link to="/auth" onClick={handleLinkClick}>
                    <Button variant="ghost" size="sm" className="w-full">
                      Login
                    </Button>
                  </Link>
                  <Link to="/auth" onClick={handleLinkClick}>
                    <Button variant="hero" size="sm" className="w-full">
                      Começar Grátis
                    </Button>
                  </Link>
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </div>
    </motion.header>
  );
};
