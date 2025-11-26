import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNotifications } from "@/hooks/useNotifications";
import { useWizard } from "@/contexts/WizardContext";
import { Bell, BellOff, Clock, Coffee, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function NotificationSettings() {
  const {
    supported,
    permission,
    requestPermission,
    scheduleTaskReminder,
    scheduleBreakReminder,
    scheduleHyperfocusAlert,
  } = useNotifications();

  const { wizardData } = useWizard();
  const [taskRemindersEnabled, setTaskRemindersEnabled] = useState(false);
  const [breakRemindersEnabled, setBreakRemindersEnabled] = useState(false);
  const [hyperfocusAlertsEnabled, setHyperfocusAlertsEnabled] = useState(false);
  const [taskReminderInterval, setTaskReminderInterval] = useState("30");
  const [breakInterval, setBreakInterval] = useState("45");
  const [hyperfocusInterval, setHyperfocusInterval] = useState("60");

  const [activeReminders, setActiveReminders] = useState<(() => void)[]>([]);

  // Clear all reminders when component unmounts
  useEffect(() => {
    return () => {
      activeReminders.forEach((cancel) => cancel());
    };
  }, [activeReminders]);

  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    if (!granted) {
      setTaskRemindersEnabled(false);
      setBreakRemindersEnabled(false);
      setHyperfocusAlertsEnabled(false);
    }
  };

  const handleTaskRemindersToggle = (enabled: boolean) => {
    if (enabled && permission !== "granted") {
      handleEnableNotifications();
      return;
    }

    setTaskRemindersEnabled(enabled);

    if (enabled) {
      const interval = parseInt(taskReminderInterval);
      const cancel = scheduleTaskReminder(
        wizardData.priorities?.[0]?.title || "Tu próxima tarea",
        interval
      );
      setActiveReminders((prev) => [...prev, cancel]);
      toast.success(`Recordatorio programado en ${interval} minutos`);
    }
  };

  const handleBreakRemindersToggle = (enabled: boolean) => {
    if (enabled && permission !== "granted") {
      handleEnableNotifications();
      return;
    }

    setBreakRemindersEnabled(enabled);

    if (enabled) {
      const interval = parseInt(breakInterval);
      const cancel = scheduleBreakReminder(interval);
      setActiveReminders((prev) => [...prev, cancel]);
      toast.success(`Recordatorio de break en ${interval} minutos`);
    }
  };

  const handleHyperfocusAlertsToggle = (enabled: boolean) => {
    if (enabled && permission !== "granted") {
      handleEnableNotifications();
      return;
    }

    setHyperfocusAlertsEnabled(enabled);

    if (enabled) {
      const interval = parseInt(hyperfocusInterval);
      const cancel = scheduleHyperfocusAlert(interval);
      setActiveReminders((prev) => [...prev, cancel]);
      toast.success(`Alerta de hyperfocus en ${interval} minutos`);
    }
  };

  if (!supported) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <BellOff className="w-6 h-6 text-destructive" />
            <div>
              <p className="font-semibold">Notificaciones no soportadas</p>
              <p className="text-sm text-muted-foreground">
                Tu navegador no soporta notificaciones del sistema
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          <CardTitle>Recordatorios y Alertas</CardTitle>
        </div>
        <CardDescription>
          Configura notificaciones para mantener el enfoque y evitar hyperfocus
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Permission status */}
        {permission !== "granted" && (
          <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
            <p className="text-sm mb-3">
              Para recibir notificaciones, necesitas habilitar los permisos
            </p>
            <Button onClick={handleEnableNotifications} size="sm">
              <Bell className="w-4 h-4 mr-2" />
              Habilitar Notificaciones
            </Button>
          </div>
        )}

        {/* Task Reminders */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <Label htmlFor="task-reminders" className="font-semibold">
                Recordatorios de Tareas
              </Label>
            </div>
            <Switch
              id="task-reminders"
              checked={taskRemindersEnabled}
              onCheckedChange={handleTaskRemindersToggle}
            />
          </div>
          {taskRemindersEnabled && (
            <div className="ml-6 space-y-2">
              <Label htmlFor="task-interval" className="text-sm">
                Recordar cada:
              </Label>
              <Select
                value={taskReminderInterval}
                onValueChange={setTaskReminderInterval}
              >
                <SelectTrigger id="task-interval" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutos</SelectItem>
                  <SelectItem value="30">30 minutos</SelectItem>
                  <SelectItem value="45">45 minutos</SelectItem>
                  <SelectItem value="60">1 hora</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Break Reminders */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coffee className="w-4 h-4 text-primary" />
              <Label htmlFor="break-reminders" className="font-semibold">
                Recordatorios de Descanso
              </Label>
            </div>
            <Switch
              id="break-reminders"
              checked={breakRemindersEnabled}
              onCheckedChange={handleBreakRemindersToggle}
            />
          </div>
          {breakRemindersEnabled && (
            <div className="ml-6 space-y-2">
              <Label htmlFor="break-interval" className="text-sm">
                Descanso cada:
              </Label>
              <Select value={breakInterval} onValueChange={setBreakInterval}>
                <SelectTrigger id="break-interval" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 minutos (Pomodoro)</SelectItem>
                  <SelectItem value="45">45 minutos</SelectItem>
                  <SelectItem value="60">1 hora</SelectItem>
                  <SelectItem value="90">90 minutos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Hyperfocus Alerts */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-primary" />
              <Label htmlFor="hyperfocus-alerts" className="font-semibold">
                Alertas de Hyperfocus
              </Label>
            </div>
            <Switch
              id="hyperfocus-alerts"
              checked={hyperfocusAlertsEnabled}
              onCheckedChange={handleHyperfocusAlertsToggle}
            />
          </div>
          {hyperfocusAlertsEnabled && (
            <div className="ml-6 space-y-2">
              <Label htmlFor="hyperfocus-interval" className="text-sm">
                Verificar cada:
              </Label>
              <Select
                value={hyperfocusInterval}
                onValueChange={setHyperfocusInterval}
              >
                <SelectTrigger id="hyperfocus-interval" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutos</SelectItem>
                  <SelectItem value="60">1 hora</SelectItem>
                  <SelectItem value="90">90 minutos</SelectItem>
                  <SelectItem value="120">2 horas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          💡 Las notificaciones te ayudarán a mantener el enfoque y evitar el
          hyperfocus en tareas incorrectas
        </p>
      </CardContent>
    </Card>
  );
}

