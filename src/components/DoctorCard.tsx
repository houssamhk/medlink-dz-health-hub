import { Button } from "@/components/ui/button";
import { Star, MapPin, Clock, CheckCircle } from "lucide-react";

interface DoctorCardProps {
  name: string;
  specialty: string;
  location: string;
  rating: number;
  reviews: number;
  price: string;
  nextSlot: string;
  image: string;
  verified?: boolean;
}

const DoctorCard = ({
  name,
  specialty,
  location,
  rating,
  reviews,
  price,
  nextSlot,
  image,
  verified = true,
}: DoctorCardProps) => {
  return (
    <div className="gradient-card rounded-2xl p-6 shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-1 group">
      <div className="flex gap-4">
        {/* Doctor Image */}
        <div className="relative">
          <img
            src={image}
            alt={name}
            className="w-20 h-20 rounded-xl object-cover shadow-soft"
          />
          {verified && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-soft">
              <CheckCircle className="w-4 h-4 text-primary-foreground" />
            </div>
          )}
        </div>

        {/* Doctor Info */}
        <div className="flex-1">
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
            Dr. {name}
          </h3>
          <p className="text-sm text-primary font-medium">{specialty}</p>
          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
            <MapPin className="w-3.5 h-3.5" />
            <span>{location}</span>
          </div>
        </div>
      </div>

      {/* Rating & Price */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10">
            <Star className="w-4 h-4 text-primary fill-primary" />
            <span className="text-sm font-semibold text-primary">{rating}</span>
          </div>
          <span className="text-xs text-muted-foreground">({reviews} avis)</span>
        </div>
        <div className="text-right">
          <span className="text-lg font-bold text-foreground">{price}</span>
          <span className="text-sm text-muted-foreground"> DA</span>
        </div>
      </div>

      {/* Next Available Slot */}
      <div className="flex items-center gap-2 mt-3 p-3 rounded-xl bg-muted/50">
        <Clock className="w-4 h-4 text-secondary" />
        <span className="text-sm text-muted-foreground">Prochain RDV:</span>
        <span className="text-sm font-medium text-foreground">{nextSlot}</span>
      </div>

      {/* Book Button */}
      <Button variant="hero" className="w-full mt-4">
        Réserver maintenant
      </Button>
    </div>
  );
};

export default DoctorCard;
