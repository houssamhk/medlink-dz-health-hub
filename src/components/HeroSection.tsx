import { Button } from "@/components/ui/button";
import { Search, Calendar, Shield, Sparkles } from "lucide-react";

const HeroSection = () => {
  return (
    <section id="hero" className="relative min-h-screen gradient-hero pt-20 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 py-12 lg:py-20">
          {/* Left Content */}
          <div className="flex-1 text-center lg:text-left max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6 animate-fade-in">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Plateforme Médicale #1 en Algérie</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6 animate-slide-up">
              Votre santé,{" "}
              <span className="text-gradient">simplifiée</span>
              <br />
              en un clic
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 animate-slide-up" style={{ animationDelay: "0.1s" }}>
              Trouvez un médecin, réservez un rendez-vous, consultez vos résultats d'analyses et accédez aux pharmacies de garde. Tout cela dans une seule application.
            </p>

            {/* Search Box */}
            <div className="bg-card rounded-2xl p-4 shadow-card mb-8 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Spécialité ou nom du médecin..."
                    className="w-full h-12 pl-12 pr-4 rounded-xl bg-muted/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <select className="h-12 px-4 rounded-xl bg-muted/50 border border-border focus:border-primary outline-none text-foreground">
                  <option value="">Wilaya</option>
                  <option value="alger">Alger</option>
                  <option value="oran">Oran</option>
                  <option value="constantine">Constantine</option>
                  <option value="setif">Sétif</option>
                  <option value="annaba">Annaba</option>
                </select>
                <Button variant="hero" size="lg" className="h-12">
                  Rechercher
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-8 animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">5000+</div>
                <div className="text-sm text-muted-foreground">Médecins</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">58</div>
                <div className="text-sm text-muted-foreground">Wilayas</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">100K+</div>
                <div className="text-sm text-muted-foreground">Patients</div>
              </div>
            </div>
          </div>

          {/* Right Content - Feature Cards */}
          <div className="flex-1 relative max-w-lg w-full">
            <div className="grid grid-cols-2 gap-4">
              {/* Card 1 */}
              <div className="gradient-card rounded-2xl p-6 shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-1 animate-slide-up" style={{ animationDelay: "0.2s" }}>
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4 shadow-soft">
                  <Calendar className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Réservation Rapide</h3>
                <p className="text-sm text-muted-foreground">En moins de 20 secondes</p>
              </div>

              {/* Card 2 */}
              <div className="gradient-card rounded-2xl p-6 shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-1 animate-slide-up mt-8" style={{ animationDelay: "0.3s" }}>
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-4 shadow-soft">
                  <Shield className="w-6 h-6 text-secondary-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Dossier Médical</h3>
                <p className="text-sm text-muted-foreground">100% sécurisé</p>
              </div>

              {/* Card 3 */}
              <div className="gradient-card rounded-2xl p-6 shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-1 animate-slide-up col-span-2" style={{ animationDelay: "0.4s" }}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center shadow-soft">
                    <Sparkles className="w-6 h-6 text-accent-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Assistant IA Médical</h3>
                    <p className="text-sm text-muted-foreground">Orientation intelligente vers le bon spécialiste</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
