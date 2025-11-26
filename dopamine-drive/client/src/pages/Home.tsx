import { useWizard } from "@/contexts/WizardContext";
import WizardLayout from "@/components/WizardLayout";
import Phase0Landing from "@/components/phases/Phase0Landing";
import Phase1BrainState from "@/components/phases/Phase1BrainState";
import Phase2TaskCapture from "@/components/phases/Phase2TaskCapture";
import Phase3RealityCheck from "@/components/phases/Phase3RealityCheck";
import Phase4PriorityMatrix from "@/components/phases/Phase4PriorityMatrix";
import PhaseComingSoon from "@/components/phases/PhaseComingSoon";

export default function Home() {
  const { wizardData } = useWizard();
  const { currentPhase } = wizardData;

  const renderPhase = () => {
    switch (currentPhase) {
      case 0:
        return <Phase0Landing />;
      case 1:
        return <Phase1BrainState />;
      case 2:
        return <Phase2TaskCapture />;
      case 3:
        return <Phase3RealityCheck />;
      case 4:
        return <Phase4PriorityMatrix />;
      case 5:
        return (
          <PhaseComingSoon
            phaseNumber={5}
            title="ADHD-Proof Execution Plan"
            description="Plan de batalla con rituales, focus keepers y energy management"
            features={[
              "Rituales de inicio personalizados",
              "Focus keepers basados en tu energía",
              "Estrategias de energy management",
              "Protocolos anti-procrastinación",
            ]}
          />
        );
      case 6:
        return (
          <PhaseComingSoon
            phaseNumber={6}
            title="Momentum Starters"
            description="Opciones para iniciar tu Priority 1 con el pie derecho"
            features={[
              "Técnicas de inicio rápido",
              "Body doubling virtual",
              "Warm-up tasks",
              "Ambiente de trabajo óptimo",
            ]}
          />
        );
      case 7:
        return (
          <PhaseComingSoon
            phaseNumber={7}
            title="Hyperfocus Guardrails"
            description="Protocolos para evitar pérdidas de tiempo y mantener el enfoque"
            features={[
              "Timers y alarmas inteligentes",
              "Checklists de verificación",
              "Límites de tiempo por tarea",
              "Estrategias de redirección",
            ]}
          />
        );
      case 8:
        return (
          <PhaseComingSoon
            phaseNumber={8}
            title="Progress Tracking"
            description="Gamificación con estrellas, niveles y celebraciones"
            features={[
              "Sistema de puntos y badges",
              "Visualización de progreso",
              "Celebraciones con confetti",
              "Estadísticas y streaks",
            ]}
          />
        );
      case 9:
        return (
          <PhaseComingSoon
            phaseNumber={9}
            title="Energy Pivot Plan"
            description="Alternativas para cuando tu energía cambia inesperadamente"
            features={[
              "Tareas alternativas por nivel de energía",
              "Estrategias de recuperación",
              "Quick wins para momentum",
              "Opciones de descanso activo",
            ]}
          />
        );
      case 10:
        return (
          <PhaseComingSoon
            phaseNumber={10}
            title="End-of-Day Protocol"
            description="Cierre con wins, reflexión y preparación para mañana"
            features={[
              "Celebración de wins del día",
              "Reflexión guiada",
              "Preparación para mañana",
              "Exportación de plan a PDF",
            ]}
          />
        );
      default:
        return <Phase0Landing />;
    }
  };

  return (
    <WizardLayout showProgress={currentPhase > 0}>
      {renderPhase()}
    </WizardLayout>
  );
}

