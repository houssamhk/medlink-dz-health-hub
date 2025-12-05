import { 
  Stethoscope, 
  Pill, 
  TestTube, 
  Ambulance, 
  FileText, 
  Video,
  Bot,
  Clock
} from "lucide-react";

const services = [
  {
    icon: Stethoscope,
    title: "Consultation Médecin",
    description: "Trouvez et réservez chez plus de 5000 médecins de toutes spécialités",
    color: "bg-primary",
  },
  {
    icon: Pill,
    title: "Pharmacies de Garde",
    description: "Localisez les pharmacies ouvertes 24h/24 près de chez vous",
    color: "bg-secondary",
  },
  {
    icon: TestTube,
    title: "Résultats d'Analyses",
    description: "Recevez vos résultats de laboratoire directement sur l'application",
    color: "bg-primary",
  },
  {
    icon: Ambulance,
    title: "Urgences SOS",
    description: "Bouton d'urgence avec géolocalisation pour une assistance rapide",
    color: "bg-accent",
  },
  {
    icon: FileText,
    title: "Dossier Médical",
    description: "Accédez à tout votre historique médical en un seul endroit",
    color: "bg-secondary",
  },
  {
    icon: Video,
    title: "Téléconsultation",
    description: "Consultez un médecin à distance par vidéo depuis chez vous",
    color: "bg-primary",
  },
  {
    icon: Bot,
    title: "Assistant IA",
    description: "Intelligence artificielle pour vous orienter vers le bon spécialiste",
    color: "bg-secondary",
  },
  {
    icon: Clock,
    title: "Rappels & Suivi",
    description: "Notifications pour vos rendez-vous et traitements médicaux",
    color: "bg-primary",
  },
];

const ServicesSection = () => {
  return (
    <section id="services" className="py-20 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Nos Services
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Tout ce dont vous avez besoin pour{" "}
            <span className="text-gradient">votre santé</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Une plateforme complète qui révolutionne l'accès aux soins de santé en Algérie
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <div
              key={service.title}
              className="group gradient-card rounded-2xl p-6 shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-2"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`w-14 h-14 rounded-xl ${service.color} flex items-center justify-center mb-4 shadow-soft group-hover:scale-110 transition-transform duration-300`}>
                <service.icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                {service.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
