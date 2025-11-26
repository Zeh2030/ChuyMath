import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWizard, TaskCategory } from "@/contexts/WizardContext";
import { ChevronRight, ChevronLeft, Flame, Calendar, DollarSign, Sparkles } from "lucide-react";

const categoryConfig = {
  urgent: {
    icon: Flame,
    label: "🚨 Urgent Fires",
    description: "Requieren atención inmediata",
    className: "badge-urgent",
  },
  "time-sensitive": {
    icon: Calendar,
    label: "📅 Time-Sensitive",
    description: "Tienen deadline próximo",
    className: "badge-time-sensitive",
  },
  important: {
    icon: DollarSign,
    label: "💰 Important",
    description: "Alto impacto pero no urgentes",
    className: "badge-important",
  },
  "nice-to-do": {
    icon: Sparkles,
    label: "✨ Nice-to-Do",
    description: "Pueden esperar sin consecuencias",
    className: "badge-nice-to-do",
  },
};

// Simple categorization logic (can be enhanced with AI later)
function categorizeTask(title: string, description: string): TaskCategory {
  const text = `${title} ${description}`.toLowerCase();
  
  // Urgent keywords
  if (
    text.includes("urgente") ||
    text.includes("ahora") ||
    text.includes("ya") ||
    text.includes("emergencia") ||
    text.includes("crítico")
  ) {
    return "urgent";
  }
  
  // Time-sensitive keywords
  if (
    text.includes("hoy") ||
    text.includes("mañana") ||
    text.includes("deadline") ||
    text.includes("fecha") ||
    text.includes("plazo")
  ) {
    return "time-sensitive";
  }
  
  // Important keywords
  if (
    text.includes("importante") ||
    text.includes("proyecto") ||
    text.includes("reunión") ||
    text.includes("presentación") ||
    text.includes("entrega")
  ) {
    return "important";
  }
  
  return "nice-to-do";
}

export default function Phase2TaskCapture() {
  const { wizardData, updateTask, nextPhase, previousPhase } = useWizard();
  const tasks = wizardData.brainState?.tasks || [];

  // Auto-categorize tasks on mount
  useEffect(() => {
    tasks.forEach((task) => {
      if (!task.category) {
        const category = categorizeTask(task.title, task.description || "");
        updateTask(task.id, { category });
      }
    });
  }, []);

  const tasksByCategory = {
    urgent: tasks.filter((t) => t.category === "urgent"),
    "time-sensitive": tasks.filter((t) => t.category === "time-sensitive"),
    important: tasks.filter((t) => t.category === "important"),
    "nice-to-do": tasks.filter((t) => t.category === "nice-to-do"),
  };

  return (
    <div className="container max-w-4xl py-8 space-y-6 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Fase 2: Captura y Organización</CardTitle>
          <CardDescription className="text-base">
            He organizado tus tareas automáticamente en categorías. Revisa que tenga sentido.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(categoryConfig).map(([key, config]) => {
              const Icon = config.icon;
              const categoryTasks = tasksByCategory[key as TaskCategory];
              
              return (
                <Card
                  key={key}
                  className={`border-2 ${
                    categoryTasks.length > 0 ? "border-primary/20" : "border-border"
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Icon className="w-5 h-5" />
                      <CardTitle className="text-lg">{config.label}</CardTitle>
                    </div>
                    <CardDescription className="text-sm">
                      {config.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {categoryTasks.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">
                        No hay tareas en esta categoría
                      </p>
                    ) : (
                      categoryTasks.map((task) => (
                        <div
                          key={task.id}
                          className="p-3 rounded-lg bg-muted/50 border border-border space-y-1"
                        >
                          <h5 className="font-medium text-sm">{task.title}</h5>
                          {task.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {task.description}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Resumen de tu carga mental</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="badge-urgent">
                  {tasksByCategory.urgent.length} Urgentes
                </Badge>
                <Badge variant="outline" className="badge-time-sensitive">
                  {tasksByCategory["time-sensitive"].length} Con plazo
                </Badge>
                <Badge variant="outline" className="badge-important">
                  {tasksByCategory.important.length} Importantes
                </Badge>
                <Badge variant="outline" className="badge-nice-to-do">
                  {tasksByCategory["nice-to-do"].length} Opcionales
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Total: {tasks.length} tareas capturadas. En el siguiente paso
                crearemos un plan realista basado en tu energía y tiempo disponible.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Button variant="outline" onClick={previousPhase}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Atrás
        </Button>
        <Button onClick={nextPhase} size="lg">
          Siguiente
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

