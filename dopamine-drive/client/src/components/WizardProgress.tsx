import { useWizard } from "@/contexts/WizardContext";

const phaseNames = [
  "Inicio",
  "Estado Cerebral",
  "Captura de Tareas",
  "Chequeo de Realidad",
  "Matriz de Prioridades",
  "Plan de Ejecución",
  "Iniciadores de Momentum",
  "Guardrails de Hiperfoco",
  "Seguimiento de Progreso",
  "Plan de Pivote de Energía",
  "Protocolo de Cierre",
];

export default function WizardProgress() {
  const { wizardData } = useWizard();
  const { currentPhase, progress } = wizardData;

  return (
    <div className="w-full space-y-3 mb-8 animate-fade-in">
      {/* Progress bar */}
      <div className="wizard-progress">
        <div
          className="wizard-progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Phase indicator */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground font-medium">
          Fase {currentPhase} de 10
        </span>
        <span className="text-primary font-semibold">
          {phaseNames[currentPhase]}
        </span>
      </div>

      {/* Mini phase dots */}
      <div className="flex items-center justify-center gap-1.5">
        {Array.from({ length: 11 }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === currentPhase
                ? "w-8 bg-primary"
                : i < currentPhase
                ? "w-1.5 bg-primary/50"
                : "w-1.5 bg-muted"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

