import { Button } from "@/components/ui/button";
import { Smartphone, Apple, Play } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-20 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="relative gradient-primary rounded-3xl p-8 md:p-16 overflow-hidden shadow-elevated">
          {/* Background decorations */}
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary-foreground/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-foreground/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          </div>

          <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
                Téléchargez MEDLINK DZ
              </h2>
              <p className="text-lg text-primary-foreground/80 mb-8">
                Rejoignez des milliers d'Algériens qui ont déjà simplifié leur accès aux soins de santé. Disponible sur iOS et Android.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button 
                  variant="glass" 
                  size="lg" 
                  className="bg-primary-foreground/20 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/30 gap-3"
                >
                  <Apple className="w-6 h-6" />
                  <div className="text-left">
                    <div className="text-xs opacity-80">Télécharger sur</div>
                    <div className="font-semibold">App Store</div>
                  </div>
                </Button>

                <Button 
                  variant="glass" 
                  size="lg" 
                  className="bg-primary-foreground/20 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/30 gap-3"
                >
                  <Play className="w-6 h-6" />
                  <div className="text-left">
                    <div className="text-xs opacity-80">Disponible sur</div>
                    <div className="font-semibold">Google Play</div>
                  </div>
                </Button>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-8 mt-8 pt-8 border-t border-primary-foreground/20">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-foreground">4.9</div>
                  <div className="text-sm text-primary-foreground/70">Note moyenne</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-foreground">100K+</div>
                  <div className="text-sm text-primary-foreground/70">Téléchargements</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-foreground">58</div>
                  <div className="text-sm text-primary-foreground/70">Wilayas couvertes</div>
                </div>
              </div>
            </div>

            {/* Right Content - Phone Mockup */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative">
                <div className="w-64 h-[500px] bg-foreground rounded-[40px] p-3 shadow-2xl">
                  <div className="w-full h-full bg-gradient-to-b from-primary/20 to-secondary/20 rounded-[32px] overflow-hidden flex items-center justify-center">
                    <div className="text-center p-6">
                      <Smartphone className="w-16 h-16 text-primary mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground">MEDLINK DZ</h3>
                      <p className="text-sm text-muted-foreground mt-2">Votre santé simplifiée</p>
                    </div>
                  </div>
                </div>
                
                {/* Floating badge */}
                <div className="absolute -top-4 -right-4 px-4 py-2 rounded-xl bg-accent text-accent-foreground shadow-elevated animate-float">
                  <span className="text-sm font-bold">Gratuit!</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
