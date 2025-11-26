import { ReactNode } from "react";
import { useWizard } from "@/contexts/WizardContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/hooks/useAuth";
import WizardProgress from "./WizardProgress";
import { Button } from "@/components/ui/button";
import { Brain, Moon, Sun, LogOut, User } from "lucide-react";

interface WizardLayoutProps {
  children: ReactNode;
  showProgress?: boolean;
}

export default function WizardLayout({ children, showProgress = true }: WizardLayoutProps) {
  const { wizardData } = useWizard();
  const { currentPhase } = wizardData;
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();

  // Don't show progress on landing page
  const shouldShowProgress = showProgress && currentPhase > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent">
                <Brain className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                  Dopamine Drive
                </h1>
                <p className="text-xs text-muted-foreground">
                  Tu coach ejecutivo ADHD
                </p>
              </div>
            </div>
            
            {/* Right side controls */}
            <div className="flex items-center gap-2">
              {/* Theme toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
              >
                {theme === "dark" ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </Button>
              
              {/* User menu */}
              {user && (
                <div className="flex items-center gap-2">
                  <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted">
                    {user.photoURL && (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || "User"}
                        className="w-6 h-6 rounded-full"
                      />
                    )}
                    <span className="text-sm font-medium">{user.displayName}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={signOut}
                    title="Cerrar sesión"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Progress bar */}
      {shouldShowProgress && (
        <div className="border-b bg-card/30 backdrop-blur-sm sticky top-[73px] z-40">
          <div className="container py-4">
            <WizardProgress />
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="pb-12">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t bg-card/50 backdrop-blur-sm mt-auto">
        <div className="container py-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Creado con 💜 por un médico internista con ADHD
            </p>
            <p className="text-xs text-muted-foreground">
              Basado en principios de gestión de crisis médica adaptados para la vida diaria
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

