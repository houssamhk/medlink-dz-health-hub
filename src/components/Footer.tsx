import { Stethoscope, Facebook, Instagram, Twitter, Linkedin, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    services: [
      { name: "Trouver un médecin", href: "#" },
      { name: "Pharmacies de garde", href: "#" },
      { name: "Téléconsultation", href: "#" },
      { name: "Résultats d'analyses", href: "#" },
    ],
    company: [
      { name: "À propos", href: "#" },
      { name: "Carrières", href: "#" },
      { name: "Partenaires", href: "#" },
      { name: "Blog", href: "#" },
    ],
    support: [
      { name: "Centre d'aide", href: "#" },
      { name: "Contact", href: "#" },
      { name: "FAQ", href: "#" },
      { name: "Conditions d'utilisation", href: "#" },
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: "#" },
    { icon: Instagram, href: "#" },
    { icon: Twitter, href: "#" },
    { icon: Linkedin, href: "#" },
  ];

  return (
    <footer id="about" className="bg-foreground text-background pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <a href="#" className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-background">
                MEDLINK DZ
              </span>
            </a>
            <p className="text-background/70 mb-6 max-w-sm">
              La première plateforme médicale algérienne qui connecte patients, médecins, pharmacies et laboratoires en un seul endroit.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-background/70">
                <MapPin className="w-4 h-4 text-primary" />
                <span>Alger, Algérie</span>
              </div>
              <div className="flex items-center gap-3 text-background/70">
                <Phone className="w-4 h-4 text-primary" />
                <span>+213 (0) 23 45 67 89</span>
              </div>
              <div className="flex items-center gap-3 text-background/70">
                <Mail className="w-4 h-4 text-primary" />
                <span>contact@medlink.dz</span>
              </div>
            </div>
          </div>

          {/* Services Links */}
          <div>
            <h4 className="font-semibold text-background mb-4">Services</h4>
            <ul className="space-y-3">
              {footerLinks.services.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-background/70 hover:text-primary transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold text-background mb-4">Entreprise</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-background/70 hover:text-primary transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-semibold text-background mb-4">Support</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-background/70 hover:text-primary transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-background/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-background/50 text-sm">
            © {currentYear} MEDLINK DZ. Tous droits réservés.
          </p>
          
          {/* Social Links */}
          <div className="flex items-center gap-4">
            {socialLinks.map((social, index) => (
              <a
                key={index}
                href={social.href}
                className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-primary transition-colors group"
              >
                <social.icon className="w-5 h-5 text-background/70 group-hover:text-primary-foreground transition-colors" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
