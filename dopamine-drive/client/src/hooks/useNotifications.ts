import { useEffect, useState } from "react";
import { toast } from "sonner";

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    // Check if notifications are supported
    if ("Notification" in window) {
      setSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!supported) {
      toast.error("Las notificaciones no están soportadas en este navegador");
      return false;
    }

    if (permission === "granted") {
      return true;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === "granted") {
        toast.success("¡Notificaciones habilitadas!");
        return true;
      } else {
        toast.error("Permiso de notificaciones denegado");
        return false;
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      toast.error("Error al solicitar permisos de notificación");
      return false;
    }
  };

  const showNotification = (options: NotificationOptions) => {
    if (!supported) {
      // Fallback to toast notification
      toast.info(options.title, {
        description: options.body,
      });
      return;
    }

    if (permission !== "granted") {
      toast.info(options.title, {
        description: options.body,
      });
      return;
    }

    try {
      new Notification(options.title, {
        body: options.body,
        icon: options.icon || "/favicon.ico",
        tag: options.tag,
        badge: "/favicon.ico",
      });
    } catch (error) {
      console.error("Error showing notification:", error);
      toast.info(options.title, {
        description: options.body,
      });
    }
  };

  const scheduleNotification = (
    options: NotificationOptions,
    delayMs: number
  ) => {
    const timeoutId = setTimeout(() => {
      showNotification(options);
    }, delayMs);

    return () => clearTimeout(timeoutId);
  };

  const scheduleTaskReminder = (taskTitle: string, minutesFromNow: number) => {
    const delayMs = minutesFromNow * 60 * 1000;
    
    return scheduleNotification(
      {
        title: "⏰ Recordatorio de Tarea",
        body: `Es hora de trabajar en: ${taskTitle}`,
        tag: `task-${taskTitle}`,
      },
      delayMs
    );
  };

  const scheduleBreakReminder = (minutesFromNow: number) => {
    const delayMs = minutesFromNow * 60 * 1000;
    
    return scheduleNotification(
      {
        title: "☕ Tiempo de Descanso",
        body: "Has estado trabajando duro. Toma un break de 5-10 minutos.",
        tag: "break-reminder",
      },
      delayMs
    );
  };

  const scheduleHyperfocusAlert = (minutesFromNow: number) => {
    const delayMs = minutesFromNow * 60 * 1000;
    
    return scheduleNotification(
      {
        title: "🚨 Hyperfocus Alert",
        body: "Revisa si sigues en la tarea correcta o si te desviaste.",
        tag: "hyperfocus-alert",
      },
      delayMs
    );
  };

  return {
    supported,
    permission,
    requestPermission,
    showNotification,
    scheduleNotification,
    scheduleTaskReminder,
    scheduleBreakReminder,
    scheduleHyperfocusAlert,
  };
}

