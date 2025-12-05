import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Stethoscope } from "lucide-react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: "Accueil", href: "#hero" },
    { name: "Services", href: "#services" },
    { name: "Médecins", href: "#doctors" },
    { name: "Pharmacies", href: "#pharmacy" },
    { name: "À propos", href: "#about" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-soft group-hover:shadow-elevated transition-all duration-300">
              <Stethoscope className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">
              MED<span className="text-gradient">LINK</span> DZ
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-muted-foreground hover:text-primary font-medium transition-colors duration-300"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm">
              Connexion
            </Button>
            <Button variant="hero" size="sm">
              Inscription
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border/50 animate-slide-up">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-muted-foreground hover:text-primary font-medium transition-colors px-2 py-2"
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              <div className="flex flex-col gap-2 pt-4 border-t border-border/50">
                <Button variant="outline" className="w-full">
                  Connexion
                </Button>
                <Button variant="hero" className="w-full">
                  Inscription
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
