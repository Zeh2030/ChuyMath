import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWizard, PriorityTask } from "@/contexts/WizardContext";
import NotificationSettings from "@/components/NotificationSettings";
import { ChevronRight, ChevronLeft, Target, Clock, Lightbulb, Gift, Loader2 } from "lucide-react";

// Mock AI priority generation (replace with actual Gemini API call via Firebase Functions)
function generatePriorities(wizardData: any): PriorityTask[] {
  const tasks = wizardData.brainState?.tasks || [];
  const energy = wizardData.brainState?.energy;
  const mood = wizardData.brainState?.mood;
  const timeAvailable = wizardData.realityCheck?.timeAvailable;
  
  // Sort tasks by category priority
  const categoryPriority = {
    urgent: 1,
    "time-sensitive": 2,
    important: 3,
    "nice-to-do": 4,
  };
  
  const sortedTasks = [...tasks].sort((a, b) => {
    const aPriority = categoryPriority[(a.category || "nice-to-do") as keyof typeof categoryPriority];
    const bPriority = categoryPriority[(b.category || "nice-to-do") as keyof typeof categoryPriority];
    return aPriority - bPriority;
  });
  
  // Determine how many tasks to prioritize based on time available
  const maxTasksMap = {
    full: 5,
    half: 3,
    few: 2,
    minimal: 1,
  };
  const maxTasks = maxTasksMap[(timeAvailable || "few") as keyof typeof maxTasksMap];
  
  const topTasks = sortedTasks.slice(0, maxTasks);
  
  // Generate priority tasks with AI-like suggestions
  const priorities: PriorityTask[] = topTasks.map((task, index) => {
    const priority = index + 1;
    
    // Energy-based hacks
    const energyHacksMap = {
      turbo: ["Aprovecha tu energía alta", "Tackle el trabajo más difícil primero", "Usa timer Pomodoro de 25 min"],
      steady: ["Mantén un ritmo constante", "Toma breaks cada 45 min", "Usa música de fondo"],
      low: ["Empieza con lo más fácil", "Breaks frecuentes de 10 min", "Snack energético antes"],
      survival: ["Solo lo esencial", "Máximo 15 min por sesión", "Pide ayuda si es posible"],
    };
    const energyHacks = energyHacksMap[(energy || "steady") as keyof typeof energyHacksMap];
    
    // Mood-based rewards
    const moodRewardsMap = {
      spark: "🎉 Celebra con algo que te emocione",
      chill: "☕ Toma tu bebida favorita",
      zen: "🧘 5 min de meditación o respiración",
      wired: "🚶 Camina 10 min al aire libre",
      grit: "💪 Reconoce tu fortaleza mental",
      lowtide: "🎵 Escucha tu canción favorita",
    };
    const moodRewards = moodRewardsMap[(mood || "chill") as keyof typeof moodRewardsMap];
    
    return {
      ...task,
      priority,
      reason: priority === 1 
        ? `Es tu tarea más urgente y crítica. Completarla primero reducirá significativamente tu estrés.`
        : priority === 2
        ? `Tiene alto impacto y es manejable con tu energía actual. Construye momentum.`
        : `Importante pero flexible. Complétala si tienes energía extra.`,
      estimatedTime: task.category === "urgent" ? 1 : task.category === "time-sensitive" ? 0.75 : 0.5,
      hacks: energyHacks,
      reward: moodRewards,
    };
  });
  
  // Add bonus tasks if there's room
  const bonusTasks = sortedTasks.slice(maxTasks, maxTasks + 2).map((task) => ({
    ...task,
    priority: 99,
    reason: "Bonus opcional si completas las prioridades principales.",
    estimatedTime: 0.25,
    hacks: ["Solo si tienes energía extra", "No te presiones"],
    reward: "🌟 Bonus achievement unlocked!",
  }));
  
  return [...priorities, ...bonusTasks];
}

export default function Phase4PriorityMatrix() {
  const { wizardData, setPriorities, nextPhase, previousPhase } = useWizard();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPriorities, setGeneratedPriorities] = useState<PriorityTask[]>(
    wizardData.priorities || []
  );

  useEffect(() => {
    if (generatedPriorities.length === 0) {
      setIsGenerating(true);
      // Simulate AI processing time
      setTimeout(() => {
        const priorities = generatePriorities(wizardData);
        setGeneratedPriorities(priorities);
        setPriorities(priorities);
        setIsGenerating(false);
      }, 2000);
    }
  }, []);

  const handleNext = () => {
    nextPhase();
  };

  const mainPriorities = generatedPriorities.filter((p) => p.priority < 99);
  const bonusPriorities = generatedPriorities.filter((p) => p.priority === 99);

  if (isGenerating) {
    return (
      <div className="container max-w-4xl py-8 animate-fade-in">
        <Card>
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <h3 className="text-xl font-semibold">Generando tu matriz de prioridades...</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Analizando tu energía, estado de ánimo, tiempo disponible y tareas
                para crear un plan personalizado.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8 space-y-6 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Fase 4: ADHD Priority Matrix</CardTitle>
          <CardDescription className="text-base">
            He creado un plan personalizado basado en tu energía, estado de ánimo y
            tiempo disponible. Enfócate en las prioridades en orden.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Main Priorities */}
      <div className="space-y-4">
        {mainPriorities.map((task, index) => (
          <Card
            key={task.id}
            className="border-l-4 border-l-primary hover:shadow-lg transition-all"
            style={{ borderLeftColor: `hsl(var(--primary) / ${1 - index * 0.2})` }}
          >
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="text-lg px-3 py-1">
                      Prioridad {task.priority}
                    </Badge>
                    {task.category && (
                      <Badge variant="outline" className={`badge-${task.category}`}>
                        {task.category}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-2xl">{task.title}</CardTitle>
                  {task.description && (
                    <CardDescription className="text-base">{task.description}</CardDescription>
                  )}
                </div>
                <Target className="w-8 h-8 text-primary flex-shrink-0" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Reason */}
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  ¿Por qué esta prioridad?
                </p>
                <p className="text-sm">{task.reason}</p>
              </div>

              {/* Time Estimate */}
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-primary" />
                <span className="font-medium">Tiempo estimado:</span>
                <span>{task.estimatedTime}h</span>
              </div>

              {/* Hacks */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Lightbulb className="w-4 h-4 text-accent" />
                  <span>ADHD Hacks:</span>
                </div>
                <ul className="space-y-1 ml-6">
                  {task.hacks.map((hack, i) => (
                    <li key={i} className="text-sm text-muted-foreground">
                      • {hack}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Reward */}
              <div className="p-4 rounded-lg bg-gradient-to-r from-accent/10 to-primary/10 border border-accent/20">
                <div className="flex items-center gap-2 text-sm font-medium mb-1">
                  <Gift className="w-4 h-4 text-accent" />
                  <span>Recompensa al completar:</span>
                </div>
                <p className="text-sm">{task.reward}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bonus Priorities */}
      {bonusPriorities.length > 0 && (
        <Card className="border-2 border-dashed border-secondary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="secondary">Bonus</Badge>
              Tareas Opcionales
            </CardTitle>
            <CardDescription>
              Solo si completas las prioridades principales y tienes energía extra
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {bonusPriorities.map((task) => (
              <div
                key={task.id}
                className="p-4 rounded-lg border bg-secondary/5 hover:bg-secondary/10 transition-colors"
              >
                <h4 className="font-medium">{task.title}</h4>
                {task.description && (
                  <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                )}
                <p className="text-xs text-muted-foreground mt-2">{task.reward}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Notification Settings */}
      <NotificationSettings />

      {/* Summary */}
      <Card className="bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 border-primary/20">
        <CardContent className="p-6">
          <div className="space-y-2">
            <h4 className="font-semibold">📊 Resumen del Plan</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Prioridades</p>
                <p className="text-2xl font-bold">{mainPriorities.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Bonus</p>
                <p className="text-2xl font-bold">{bonusPriorities.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Tiempo total</p>
                <p className="text-2xl font-bold">
                  {mainPriorities.reduce((sum, t) => sum + t.estimatedTime, 0)}h
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Recompensas</p>
                <p className="text-2xl font-bold">{generatedPriorities.length}</p>
              </div>
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
        <Button onClick={handleNext} size="lg">
          Siguiente
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

