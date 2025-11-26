import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useWizard, EnergyLevel, MoodState, TaskCount } from "@/contexts/WizardContext";
import SpotifyPlayer from "@/components/SpotifyPlayer";
import { Plus, Trash2, ChevronRight, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

const energyOptions = [
  {
    value: "turbo" as EnergyLevel,
    label: "🔥 Turbo Mode",
    description: "Energía al máximo, ¡listo para dominar el mundo!",
  },
  {
    value: "steady" as EnergyLevel,
    label: "😊 Steady Flow",
    description: "Energía normal, fluyendo con lo esencial sin problemas",
  },
  {
    value: "low" as EnergyLevel,
    label: "😐 Low Gear",
    description: "Energía baja, costando esfuerzo pero avanzando paso a paso",
  },
  {
    value: "survival" as EnergyLevel,
    label: "💀 Survival Mode",
    description: "Energía mínima, solo lo básico para no colapsar",
  },
];

const moodOptions = [
  {
    value: "spark" as MoodState,
    label: "🤩 Spark Mode",
    description: "¡Excitado, lleno de ideas y listo para brillar!",
  },
  {
    value: "chill" as MoodState,
    label: "😊 Chill Vibe",
    description: "Motivado y tranquilo, en control con buen flow",
  },
  {
    value: "zen" as MoodState,
    label: "😌 Zen Zone",
    description: "Calmado, en paz, navegando el día con serenidad",
  },
  {
    value: "wired" as MoodState,
    label: "😟 Wired Edge",
    description: "Ansioso, sintiendo presión pero con ganas de avanzar",
  },
  {
    value: "grit" as MoodState,
    label: "😠 Grit Mode",
    description: "Frustrado, con energía para pelear el caos",
  },
  {
    value: "lowtide" as MoodState,
    label: "😔 Low Tide",
    description: "Triste, en un bajón emocional, necesitando un boost",
  },
];

const taskCountOptions = [
  {
    value: "low" as TaskCount,
    label: "3-5 tareas",
    description: "Caos controlable, nada que no puedas manejar",
  },
  {
    value: "medium" as TaskCount,
    label: "6-10 tareas",
    description: "Subiendo la adrenalina, ¡vamos con todo!",
  },
  {
    value: "high" as TaskCount,
    label: "10+ tareas",
    description: "¡Emergencia total! Todo en ebullición",
  },
];

export default function Phase1BrainState() {
  const { wizardData, updateBrainState, addTask, removeTask, nextPhase, previousPhase } = useWizard();
  const [energy, setEnergy] = useState<EnergyLevel | "">(wizardData.brainState?.energy || "");
  const [mood, setMood] = useState<MoodState | "">(wizardData.brainState?.mood || "");
  const [taskCount, setTaskCount] = useState<TaskCount | "">(wizardData.brainState?.taskCount || "");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");

  const tasks = wizardData.brainState?.tasks || [];

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) {
      toast.error("Por favor ingresa un título para la tarea");
      return;
    }

    addTask({
      title: newTaskTitle,
      description: newTaskDescription,
    });

    setNewTaskTitle("");
    setNewTaskDescription("");
    toast.success("Tarea agregada");
  };

  const handleNext = () => {
    if (!energy || !mood || !taskCount) {
      toast.error("Por favor completa todos los campos del chequeo");
      return;
    }

    if (tasks.length === 0) {
      toast.error("Por favor agrega al menos una tarea");
      return;
    }

    updateBrainState({
      energy: energy as EnergyLevel,
      mood: mood as MoodState,
      taskCount: taskCount as TaskCount,
      tasks,
    });

    nextPhase();
  };

  return (
    <div className="container max-w-4xl py-8 space-y-6 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Fase 1: Chequeo de Estado Cerebral</CardTitle>
          <CardDescription className="text-base">
            Calibremos tu estado actual para crear un plan personalizado que funcione con tu cerebro, no contra él.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Energy Level */}
          <div className="space-y-2">
            <Label htmlFor="energy" className="text-base font-semibold">
              Nivel de Energía
            </Label>
            <Select value={energy} onValueChange={(value) => setEnergy(value as EnergyLevel)}>
              <SelectTrigger id="energy" className="w-full">
                <SelectValue placeholder="Selecciona tu nivel de energía" />
              </SelectTrigger>
              <SelectContent>
                {energyOptions.map((option) => (
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

          {/* Mood State */}
          <div className="space-y-2">
            <Label htmlFor="mood" className="text-base font-semibold">
              Estado de Ánimo
            </Label>
            <Select value={mood} onValueChange={(value) => setMood(value as MoodState)}>
              <SelectTrigger id="mood" className="w-full">
                <SelectValue placeholder="Selecciona tu estado de ánimo" />
              </SelectTrigger>
              <SelectContent>
                {moodOptions.map((option) => (
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

          {/* Task Count */}
          <div className="space-y-2">
            <Label htmlFor="taskCount" className="text-base font-semibold">
              ¿Cuántas tareas en tu cabeza?
            </Label>
            <Select value={taskCount} onValueChange={(value) => setTaskCount(value as TaskCount)}>
              <SelectTrigger id="taskCount" className="w-full">
                <SelectValue placeholder="Selecciona la cantidad de tareas" />
              </SelectTrigger>
              <SelectContent>
                {taskCountOptions.map((option) => (
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
        </CardContent>
      </Card>

      {/* Task Dump */}
      <Card>
        <CardHeader>
          <CardTitle>Dump de Tareas</CardTitle>
          <CardDescription>
            Vacía tu mente. Escribe todas las tareas que están dando vueltas en tu cabeza.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="taskTitle">Título de la tarea</Label>
              <Input
                id="taskTitle"
                placeholder="Ej: Responder emails importantes"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAddTask();
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taskDescription">Descripción (opcional)</Label>
              <Textarea
                id="taskDescription"
                placeholder="Detalles adicionales..."
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                rows={2}
              />
            </div>
            <Button onClick={handleAddTask} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Agregar Tarea
            </Button>
          </div>

          {/* Task List */}
          {tasks.length > 0 && (
            <div className="space-y-2 mt-6">
              <h4 className="font-semibold text-sm text-muted-foreground">
                Tareas agregadas ({tasks.length})
              </h4>
              <div className="space-y-2">
                {tasks.map((task) => (
                  <Card key={task.id} className="border-l-4 border-l-primary">
                    <CardContent className="p-4 flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-1">
                        <h5 className="font-medium">{task.title}</h5>
                        {task.description && (
                          <p className="text-sm text-muted-foreground">{task.description}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTask(task.id)}
                        className="flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Spotify Player */}
      {energy && mood && <SpotifyPlayer />}

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

