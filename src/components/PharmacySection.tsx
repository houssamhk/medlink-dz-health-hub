import { Button } from "@/components/ui/button";
import { MapPin, Clock, Phone, Navigation } from "lucide-react";

const pharmacies = [
  {
    name: "Pharmacie El Hakim",
    address: "123 Rue Didouche Mourad, Alger",
    phone: "023 45 67 89",
    distance: "0.5 km",
    hours: "24h/24",
    isOpen: true,
  },
  {
    name: "Pharmacie Centrale",
    address: "45 Boulevard Khemisti, Oran",
    phone: "041 23 45 67",
    distance: "1.2 km",
    hours: "24h/24",
    isOpen: true,
  },
  {
    name: "Pharmacie Es-Salem",
    address: "78 Avenue de l'ALN, Constantine",
    phone: "031 98 76 54",
    distance: "2.0 km",
    hours: "24h/24",
    isOpen: true,
  },
];

const PharmacySection = () => {
  return (
    <section id="pharmacy" className="py-20 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl -translate-y-1/2" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div>
            <span className="inline-block px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
              Pharmacies de Garde
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Trouvez une pharmacie{" "}
              <span className="text-gradient">ouverte maintenant</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Localisez rapidement les pharmacies de garde les plus proches de votre position, 24h/24 et 7j/7.
            </p>

            <Button variant="emergency" size="lg" className="gap-2 mb-8">
              <Navigation className="w-5 h-5" />
              Trouver une pharmacie de garde
            </Button>

            {/* Pharmacy List */}
            <div className="space-y-4">
              {pharmacies.map((pharmacy) => (
                <div
                  key={pharmacy.name}
                  className="gradient-card rounded-xl p-4 shadow-card hover:shadow-elevated transition-all duration-300 group cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {pharmacy.name}
                      </h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{pharmacy.address}</span>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-secondary/20 text-secondary text-xs font-medium">
                      {pharmacy.distance}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{pharmacy.hours}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Phone className="w-3.5 h-3.5" />
                        <span>{pharmacy.phone}</span>
                      </div>
                    </div>
                    <span className="flex items-center gap-1 text-sm font-medium text-secondary">
                      <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                      Ouverte
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Content - Map Placeholder */}
          <div className="relative">
            <div className="aspect-square rounded-3xl overflow-hidden shadow-elevated bg-muted">
              <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-20 h-20 rounded-full gradient-primary mx-auto mb-4 flex items-center justify-center shadow-glow">
                    <MapPin className="w-10 h-10 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Carte Interactive
                  </h3>
                  <p className="text-muted-foreground">
                    Visualisez toutes les pharmacies de garde sur la carte
                  </p>
                </div>
              </div>
            </div>
            
            {/* Floating badges */}
            <div className="absolute -top-4 -right-4 px-4 py-2 rounded-xl gradient-primary shadow-elevated animate-float">
              <span className="text-sm font-semibold text-primary-foreground">58 Wilayas</span>
            </div>
            <div className="absolute -bottom-4 -left-4 px-4 py-2 rounded-xl bg-card shadow-elevated animate-float" style={{ animationDelay: "1s" }}>
              <span className="text-sm font-semibold text-foreground">24h/24</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PharmacySection;
