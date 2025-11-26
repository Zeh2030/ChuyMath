import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { saveSession, loadLatestSession } from "@/lib/firestore";
import { toast } from "sonner";

export type EnergyLevel = "turbo" | "steady" | "low" | "survival";
export type MoodState = "spark" | "chill" | "zen" | "wired" | "grit" | "lowtide";
export type TaskCount = "low" | "medium" | "high";
export type TimeAvailable = "full" | "half" | "few" | "minimal";
export type TaskCategory = "urgent" | "time-sensitive" | "important" | "nice-to-do";

export interface Task {
  id: string;
  title: string;
  description: string;
  category?: TaskCategory;
  priority?: number;
  estimatedTime?: number;
  completed?: boolean;
}

export interface BrainState {
  energy: EnergyLevel;
  mood: MoodState;
  taskCount: TaskCount;
  tasks: Task[];
}

export interface RealityCheck {
  timeAvailable: TimeAvailable;
  horizon: "day" | "week" | "month" | "year";
  derailments: string[];
}

export interface PriorityTask extends Task {
  priority: number;
  reason: string;
  estimatedTime: number;
  hacks: string[];
  reward: string;
}

export interface ExecutionPlan {
  rituals: string[];
  focusKeepers: string[];
  energyManagement: string[];
}

export interface WizardData {
  currentPhase: number;
  brainState?: BrainState;
  realityCheck?: RealityCheck;
  priorities?: PriorityTask[];
  executionPlan?: ExecutionPlan;
  progress: number;
  wins: string[];
}

interface WizardContextType {
  wizardData: WizardData;
  updateBrainState: (state: Partial<BrainState>) => void;
  addTask: (task: Omit<Task, "id">) => void;
  removeTask: (id: string) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  updateRealityCheck: (check: Partial<RealityCheck>) => void;
  setPriorities: (priorities: PriorityTask[]) => void;
  setExecutionPlan: (plan: ExecutionPlan) => void;
  nextPhase: () => void;
  previousPhase: () => void;
  goToPhase: (phase: number) => void;
  addWin: (win: string) => void;
  resetWizard: () => void;
  saveToFirebase: () => Promise<void>;
}

const WizardContext = createContext<WizardContextType | undefined>(undefined);

const initialWizardData: WizardData = {
  currentPhase: 0,
  progress: 0,
  wins: [],
};

export function WizardProvider({ children }: { children: ReactNode }) {
  const [wizardData, setWizardData] = useState<WizardData>(initialWizardData);
  const [isLoaded, setIsLoaded] = useState(false);
  const { user } = useAuth();

  // Load session from Firebase when user logs in
  useEffect(() => {
    if (user && !isLoaded) {
      loadLatestSession(user.uid)
        .then((data) => {
          if (data) {
            setWizardData(data);
            toast.success("Sesión anterior cargada");
          }
          setIsLoaded(true);
        })
        .catch((error) => {
          console.error("Error loading session:", error);
          setIsLoaded(true);
        });
    } else if (!user) {
      setIsLoaded(true);
    }
  }, [user, isLoaded]);

  // Auto-save to Firebase when data changes (debounced)
  useEffect(() => {
    if (user && isLoaded && wizardData.currentPhase > 0) {
      const timeoutId = setTimeout(() => {
        saveSession(user.uid, wizardData).catch((error) => {
          console.error("Error auto-saving session:", error);
        });
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(timeoutId);
    }
  }, [wizardData, user, isLoaded]);

  const updateBrainState = (state: Partial<BrainState>) => {
    setWizardData((prev) => ({
      ...prev,
      brainState: {
        ...prev.brainState,
        ...state,
      } as BrainState,
    }));
  };

  const addTask = (task: Omit<Task, "id">) => {
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      completed: false,
    };
    
    setWizardData((prev) => ({
      ...prev,
      brainState: {
        ...prev.brainState!,
        tasks: [...(prev.brainState?.tasks || []), newTask],
      },
    }));
  };

  const removeTask = (id: string) => {
    setWizardData((prev) => ({
      ...prev,
      brainState: {
        ...prev.brainState!,
        tasks: prev.brainState?.tasks.filter((t) => t.id !== id) || [],
      },
    }));
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setWizardData((prev) => ({
      ...prev,
      brainState: {
        ...prev.brainState!,
        tasks:
          prev.brainState?.tasks.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ) || [],
      },
    }));
  };

  const updateRealityCheck = (check: Partial<RealityCheck>) => {
    setWizardData((prev) => ({
      ...prev,
      realityCheck: {
        ...prev.realityCheck,
        ...check,
      } as RealityCheck,
    }));
  };

  const setPriorities = (priorities: PriorityTask[]) => {
    setWizardData((prev) => ({
      ...prev,
      priorities,
    }));
  };

  const setExecutionPlan = (plan: ExecutionPlan) => {
    setWizardData((prev) => ({
      ...prev,
      executionPlan: plan,
    }));
  };

  const nextPhase = () => {
    setWizardData((prev) => {
      const newPhase = Math.min(prev.currentPhase + 1, 10);
      return {
        ...prev,
        currentPhase: newPhase,
        progress: (newPhase / 10) * 100,
      };
    });
  };

  const previousPhase = () => {
    setWizardData((prev) => {
      const newPhase = Math.max(prev.currentPhase - 1, 0);
      return {
        ...prev,
        currentPhase: newPhase,
        progress: (newPhase / 10) * 100,
      };
    });
  };

  const goToPhase = (phase: number) => {
    setWizardData((prev) => ({
      ...prev,
      currentPhase: Math.max(0, Math.min(phase, 10)),
      progress: (Math.max(0, Math.min(phase, 10)) / 10) * 100,
    }));
  };

  const addWin = (win: string) => {
    setWizardData((prev) => ({
      ...prev,
      wins: [...prev.wins, win],
    }));
  };

  const resetWizard = () => {
    setWizardData(initialWizardData);
  };

  const saveToFirebase = async () => {
    if (!user) {
      toast.error("Debes iniciar sesión para guardar");
      return;
    }

    try {
      await saveSession(user.uid, wizardData);
      toast.success("Sesión guardada exitosamente");
    } catch (error) {
      console.error("Error saving session:", error);
      toast.error("Error al guardar la sesión");
      throw error;
    }
  };

  return (
    <WizardContext.Provider
      value={{
        wizardData,
        updateBrainState,
        addTask,
        removeTask,
        updateTask,
        updateRealityCheck,
        setPriorities,
        setExecutionPlan,
        nextPhase,
        previousPhase,
        goToPhase,
        addWin,
        resetWizard,
        saveToFirebase,
      }}
    >
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const context = useContext(WizardContext);
  if (context === undefined) {
    throw new Error("useWizard must be used within a WizardProvider");
  }
  return context;
}

