import DoctorCard from "./DoctorCard";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

const doctors = [
  {
    name: "Karim Benali",
    specialty: "Cardiologue",
    location: "Alger Centre",
    rating: 4.9,
    reviews: 234,
    price: "3000",
    nextSlot: "Aujourd'hui 14h30",
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop&crop=face",
  },
  {
    name: "Amina Cherif",
    specialty: "Dermatologue",
    location: "Oran",
    rating: 4.8,
    reviews: 189,
    price: "2500",
    nextSlot: "Demain 10h00",
    image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=200&h=200&fit=crop&crop=face",
  },
  {
    name: "Youcef Mansouri",
    specialty: "Pédiatre",
    location: "Constantine",
    rating: 4.9,
    reviews: 312,
    price: "2000",
    nextSlot: "Aujourd'hui 16h00",
    image: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=200&h=200&fit=crop&crop=face",
  },
  {
    name: "Sara Boudiaf",
    specialty: "Gynécologue",
    location: "Sétif",
    rating: 4.7,
    reviews: 156,
    price: "3500",
    nextSlot: "Demain 09h00",
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop&crop=face",
  },
];

const DoctorsSection = () => {
  return (
    <section id="doctors" className="py-20 gradient-hero relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Médecins Recommandés
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Les meilleurs{" "}
              <span className="text-gradient">professionnels de santé</span>
            </h2>
          </div>
          <Button variant="outline" className="gap-2 self-start md:self-auto">
            Voir tous les médecins
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {doctors.map((doctor, index) => (
            <div
              key={doctor.name}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <DoctorCard {...doctor} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DoctorsSection;
