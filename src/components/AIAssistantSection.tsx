import { Button } from "@/components/ui/button";
import { Bot, Send, Sparkles, Brain, Zap } from "lucide-react";
import { useState } from "react";

const sampleMessages = [
  { type: "user", text: "J'ai des maux de tête fréquents et des vertiges" },
  { type: "assistant", text: "D'après vos symptômes, je vous recommande de consulter un neurologue ou un médecin généraliste. Voulez-vous que je vous trouve les spécialistes disponibles près de chez vous?" },
];

const AIAssistantSection = () => {
  const [input, setInput] = useState("");

  return (
    <section className="py-20 gradient-hero relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0">
        <div className="absolute top-20 right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-secondary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "3s" }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content - Chat Interface */}
          <div className="order-2 lg:order-1">
            <div className="bg-card rounded-3xl shadow-elevated overflow-hidden max-w-md mx-auto lg:mx-0">
              {/* Chat Header */}
              <div className="gradient-primary p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h4 className="font-semibold text-primary-foreground">Assistant MEDLINK IA</h4>
                  <span className="text-xs text-primary-foreground/80">En ligne • Répond instantanément</span>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="p-4 space-y-4 min-h-[300px] bg-muted/30">
                {sampleMessages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        message.type === "user"
                          ? "gradient-primary text-primary-foreground rounded-br-sm"
                          : "bg-card text-foreground shadow-soft rounded-bl-sm"
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Décrivez vos symptômes..."
                    className="flex-1 h-12 px-4 rounded-xl bg-muted/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground placeholder:text-muted-foreground text-sm"
                  />
                  <Button variant="hero" size="icon" className="h-12 w-12">
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content */}
          <div className="order-1 lg:order-2 text-center lg:text-left">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Intelligence Artificielle
            </span>
            
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Votre assistant santé{" "}
              <span className="text-gradient">intelligent</span>
            </h2>
            
            <p className="text-lg text-muted-foreground mb-8">
              Notre IA médicale analyse vos symptômes et vous oriente vers le bon spécialiste. Plus besoin de chercher, laissez l'intelligence artificielle vous guider.
            </p>

            {/* Features */}
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-card shadow-soft">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                  <Brain className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-foreground">Analyse Intelligente</h4>
                  <p className="text-sm text-muted-foreground">Interprétation avancée de vos symptômes</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-xl bg-card shadow-soft">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                  <Zap className="w-6 h-6 text-secondary-foreground" />
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-foreground">Réponse Instantanée</h4>
                  <p className="text-sm text-muted-foreground">Orientation en quelques secondes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIAssistantSection;
