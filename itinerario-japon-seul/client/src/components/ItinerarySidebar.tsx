import { Day } from "@/types/itinerary";
import { Calendar, MapPin, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";

interface ItinerarySidebarProps {
  days: Day[];
  currentDayId?: number;
}

export default function ItinerarySidebar({ days, currentDayId }: ItinerarySidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-primary">Itinerario</h2>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">22 oct - 7 nov 2025</p>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto p-4">
        <nav className="space-y-1">
          {/* Home Link */}
          <Link href="/">
            <a
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all hover:bg-secondary ${
                location === "/" ? "bg-primary text-primary-foreground" : ""
              }`}
              onClick={() => setIsOpen(false)}
            >
              <Calendar className="h-5 w-5 flex-shrink-0" />
              <span className="font-medium">Inicio</span>
            </a>
          </Link>

          {/* Phrases Link */}
          <Link href="/phrases">
            <a
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all hover:bg-secondary ${
                location === "/phrases" ? "bg-primary text-primary-foreground" : ""
              }`}
              onClick={() => setIsOpen(false)}
            >
              <svg
                className="h-5 w-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                />
              </svg>
              <span className="font-medium">Frases Útiles</span>
            </a>
          </Link>

          {/* Day Links */}
          {days.map((day) => {
            const isActive = location === `/day/${day.id}` || currentDayId === day.id;
            return (
              <Link key={day.id} href={`/day/${day.id}`}>
                <a
                  className={`flex items-start gap-3 px-4 py-3 rounded-lg transition-all hover:bg-secondary ${
                    isActive ? "bg-primary text-primary-foreground" : ""
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <MapPin className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">Día {day.id}</div>
                    <div className={`text-xs truncate ${isActive ? "opacity-90" : "text-muted-foreground"}`}>
                      {formatDate(day.date)} • {day.location}
                    </div>
                  </div>
                </a>
              </Link>
            );
          })}

        </nav>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground text-center">
          Familia Carrillo
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden shadow-lg"
        onClick={() => setIsOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-sidebar border-r border-sidebar-border z-50 transform transition-transform duration-300 lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed top-0 left-0 h-full w-72 bg-sidebar border-r border-sidebar-border z-30">
        <SidebarContent />
      </aside>
    </>
  );
}

