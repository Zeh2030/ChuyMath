import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useWizard } from "@/contexts/WizardContext";
import { ChevronRight, ChevronLeft, Sparkles, Construction } from "lucide-react";

interface PhaseComingSoonProps {
  phaseNumber: number;
  title: string;
  description: string;
  features: string[];
}

export default function PhaseComingSoon({
  phaseNumber,
  title,
  description,
  features,
}: PhaseComingSoonProps) {
  const { nextPhase, previousPhase, wizardData } = useWizard();

  const isLastPhase = phaseNumber === 10;

  return (
    <div className="container max-w-4xl py-8 space-y-6 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">
            Fase {phaseNumber}: {title}
          </CardTitle>
          <CardDescription className="text-base">{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center justify-center py-12 space-y-6">
            <div className="relative">
              <Construction className="w-24 h-24 text-primary/30" />
              <Sparkles className="w-8 h-8 text-accent absolute -top-2 -right-2 animate-pulse" />
            </div>
            
            <div className="text-center space-y-2 max-w-md">
              <h3 className="text-2xl font-bold">En Construcción</h3>
              <p className="text-muted-foreground">
                Esta fase estará disponible próximamente. Estamos trabajando para
                ofrecerte la mejor experiencia ADHD-friendly.
              </p>
            </div>

            <Card className="w-full max-w-md border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg">Características Planeadas</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-primary mt-0.5">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Progress Summary */}
          {wizardData.priorities && wizardData.priorities.length > 0 && (
            <Card className="bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 border-primary/20">
              <CardContent className="p-6">
                <div className="space-y-2">
                  <h4 className="font-semibold">📊 Tu Plan Actual</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Prioridades</p>
                      <p className="text-2xl font-bold">
                        {wizardData.priorities.filter((p) => p.priority < 99).length}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Tareas totales</p>
                      <p className="text-2xl font-bold">
                        {wizardData.brainState?.tasks.length || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Button variant="outline" onClick={previousPhase}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Atrás
        </Button>
        {!isLastPhase && (
          <Button onClick={nextPhase} size="lg">
            Siguiente (Preview)
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}

