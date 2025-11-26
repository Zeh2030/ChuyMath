import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useWizard, TimeAvailable } from "@/contexts/WizardContext";
import { ChevronRight, ChevronLeft, AlertTriangle, Clock, Calendar } from "lucide-react";
import { toast } from "sonner";

const timeOptions = [
  {
    value: "full" as TimeAvailable,
    label: "Full Day (6-8 horas)",
    description: "Tengo todo el día para trabajar",
    hours: 8,
  },
  {
    value: "half" as TimeAvailable,
    label: "Half Day (3-4 horas)",
    description: "Tengo medio día disponible",
    hours: 4,
  },
  {
    value: "few" as TimeAvailable,
    label: "Few Hours (1-2 horas)",
    description: "Solo tengo unas pocas horas",
    hours: 2,
  },
  {
    value: "minimal" as TimeAvailable,
    label: "Minimal (<1 hora)",
    description: "Muy poco tiempo disponible",
    hours: 1,
  },
];

const commonDerailments = [
  { id: "meetings", label: "Reuniones inesperadas" },
  { id: "emails", label: "Emails/mensajes urgentes" },
  { id: "interruptions", label: "Interrupciones frecuentes" },
  { id: "fatigue", label: "Fatiga mental" },
  { id: "hyperfocus", label: "Tendencia al hyperfocus" },
  { id: "perfectionism", label: "Perfeccionismo paralizante" },
  { id: "distractions", label: "Distracciones digitales" },
  { id: "procrastination", label: "Procrastinación" },
];

const horizonOptions = [
  { value: "day", label: "📅 Día", description: "Plan para hoy" },
  { value: "week", label: "📆 Semana", description: "Plan semanal (próximamente)" },
  { value: "month", label: "🗓️ Mes", description: "Plan mensual (próximamente)" },
  { value: "year", label: "📋 Año", description: "Plan anual (próximamente)" },
];

export default function Phase3RealityCheck() {
  const { wizardData, updateRealityCheck, nextPhase, previousPhase } = useWizard();
  const [timeAvailable, setTimeAvailable] = useState<TimeAvailable | "">(
    wizardData.realityCheck?.timeAvailable || ""
  );
  const [horizon, setHorizon] = useState<"day" | "week" | "month" | "year">(wizardData.realityCheck?.horizon || "day");
  const [selectedDerailments, setSelectedDerailments] = useState<string[]>(
    wizardData.realityCheck?.derailments || []
  );

  const handleDerailmentToggle = (id: string) => {
    setSelectedDerailments((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    if (!timeAvailable) {
      toast.error("Por favor selecciona tu tiempo disponible");
      return;
    }

    updateRealityCheck({
      timeAvailable: timeAvailable as TimeAvailable,
      horizon: horizon as "day" | "week" | "month" | "year",
      derailments: selectedDerailments,
    });

    nextPhase();
  };

  const selectedTimeOption = timeOptions.find((opt) => opt.value === timeAvailable);
  const taskCount = wizardData.brainState?.tasks.length || 0;
  const estimatedTimePerTask = 0.5; // hours
  const totalEstimatedTime = taskCount * estimatedTimePerTask;
  const availableHours = selectedTimeOption?.hours || 0;

  return (
    <div className="container max-w-4xl py-8 space-y-6 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Fase 3: ADHD Reality Check</CardTitle>
          <CardDescription className="text-base">
            Seamos realistas sobre tu tiempo y energía. Esto no es rendirse, es
            ser estratégico.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Time Available */}
          <div className="space-y-2">
            <Label htmlFor="timeAvailable" className="text-base font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Tiempo Disponible Hoy
            </Label>
            <Select value={timeAvailable} onValueChange={(value) => setTimeAvailable(value as TimeAvailable)}>
              <SelectTrigger id="timeAvailable" className="w-full">
                <SelectValue placeholder="Selecciona tu tiempo disponible" />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="space-y-1">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Horizon */}
          <div className="space-y-2">
            <Label htmlFor="horizon" className="text-base font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Horizonte Temporal
            </Label>
            <Select value={horizon} onValueChange={(value) => setHorizon(value as "day" | "week" | "month" | "year")}>
              <SelectTrigger id="horizon" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {horizonOptions.map((option) => (
                  <SelectItem 
                    key={option.value} 
                    value={option.value}
                    disabled={option.value !== "day"}
                  >
                    <div className="space-y-1">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Common Derailments */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Derrailes Comunes (selecciona los que aplican)
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {commonDerailments.map((derailment) => (
                <div
                  key={derailment.id}
                  className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleDerailmentToggle(derailment.id)}
                >
                  <Checkbox
                    id={derailment.id}
                    checked={selectedDerailments.includes(derailment.id)}
                    onCheckedChange={() => handleDerailmentToggle(derailment.id)}
                  />
                  <label
                    htmlFor={derailment.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {derailment.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reality Check Summary */}
      {timeAvailable && (
        <Card className={`border-2 ${
          totalEstimatedTime > availableHours
            ? "border-destructive/50 bg-destructive/5"
            : "border-primary/50 bg-primary/5"
        }`}>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <AlertTriangle className={`w-6 h-6 ${
                  totalEstimatedTime > availableHours ? "text-destructive" : "text-primary"
                }`} />
              </div>
              <div className="space-y-2 flex-1">
                <h4 className="font-semibold">Reality Check</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Tareas capturadas</p>
                    <p className="text-2xl font-bold">{taskCount}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tiempo estimado</p>
                    <p className="text-2xl font-bold">{totalEstimatedTime}h</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tiempo disponible</p>
                    <p className="text-2xl font-bold">{availableHours}h</p>
                  </div>
                </div>
                {totalEstimatedTime > availableHours ? (
                  <p className="text-sm text-destructive font-medium">
                    ⚠️ Tienes más tareas de las que puedes completar hoy. En el
                    siguiente paso priorizaremos lo más importante.
                  </p>
                ) : (
                  <p className="text-sm text-primary font-medium">
                    ✅ Tu carga de trabajo parece manejable. Vamos a crear un
                    plan estratégico.
                  </p>
                )}
                {selectedDerailments.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    📌 Consideraremos tus {selectedDerailments.length} derrailes
                    comunes al crear el plan.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Button variant="outline" onClick={previousPhase}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Atrás
        </Button>
        <Button onClick={handleNext} size="lg">
          Siguiente
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

