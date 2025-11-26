import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useWizard } from "@/contexts/WizardContext";
import { useAuth } from "@/hooks/useAuth";
import { Zap, Target, Trophy, Brain, Sparkles, Rocket, LogIn, LogOut } from "lucide-react";

export default function Phase0Landing() {
  const { nextPhase } = useWizard();
  const { user, loading, signInWithGoogle, signOut } = useAuth();

  const features = [
    {
      icon: Brain,
      title: "Brain State Check-in",
      description: "Calibra tu energía y estado de ánimo actual",
    },
    {
      icon: Target,
      title: "Smart Prioritization",
      description: "Transforma el caos en un plan accionable",
    },
    {
      icon: Zap,
      title: "Dopamine Hacking",
      description: "Recompensas motivadoras para cada logro",
    },
    {
      icon: Trophy,
      title: "Progress Tracking",
      description: "Gamificación con estrellas y niveles",
    },
    {
      icon: Sparkles,
      title: "ADHD-Proof",
      description: "Diseñado específicamente para cerebros ADHD",
    },
    {
      icon: Rocket,
      title: "Momentum Builders",
      description: "Técnicas para iniciar y mantener el enfoque",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-8 animate-fade-in">
        {/* Hero section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent mb-4 animate-pulse-glow">
            <Brain className="w-10 h-10 text-primary-foreground" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            Dopamine Drive
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Tu coach ejecutivo ADHD: Transforma el caos en acción{" "}
            <span className="text-primary font-semibold">laser-focused</span>
          </p>
          
          <p className="text-base text-muted-foreground max-w-xl mx-auto">
            Diseñado por un médico internista con ADHD que entiende el burnout
            y la sobrecarga. Convierte listas abrumadoras en planes accionables
            con técnicas de dopamine-hacking.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6 space-y-3">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CTA section */}
        <div className="text-center space-y-4">
          {user ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-primary/10 border border-primary/20">
                {user.photoURL && (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "User"}
                    className="w-10 h-10 rounded-full"
                  />
                )}
                <div className="text-left">
                  <p className="font-semibold">{user.displayName}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <Button
                size="lg"
                className="text-lg px-8 py-6 animate-pulse-glow"
                onClick={nextPhase}
              >
                <Rocket className="w-5 h-5 mr-2" />
                ¡Comenzar mi viaje!
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={signOut}
                className="ml-4"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar sesión
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Button
                size="lg"
                className="text-lg px-8 py-6 animate-pulse-glow"
                onClick={signInWithGoogle}
                disabled={loading}
              >
                <LogIn className="w-5 h-5 mr-2" />
                Iniciar con Google
              </Button>
              <p className="text-sm text-muted-foreground">
                Inicia sesión para guardar tu progreso automáticamente
              </p>
            </div>
          )}
          
          <p className="text-sm text-muted-foreground">
            🔥 Gratis • 🚀 Datos seguros en Firebase • 💪 ADHD-friendly
          </p>
        </div>

        {/* Info banner */}
        <Card className="bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold">¿Qué hace diferente a Dopamine Drive?</h4>
                <p className="text-sm text-muted-foreground">
                  No es solo otra app de tareas. Es un sistema completo basado
                  en principios de gestión de crisis médica, adaptado para la
                  vida diaria con ADHD. Incluye safeguards contra hyperfocus,
                  burnout y overwhelm, con recompensas motivadoras en cada paso.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

