import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import ItinerarySidebar from "./components/ItinerarySidebar";
import ThemeToggle from "./components/ThemeToggle";
import { ThemeProvider } from "./contexts/ThemeContext";
import DayDetail from "./pages/DayDetail";
import Home from "./pages/Home";
import Phrases from "./pages/Phrases";
import { useEffect, useState } from "react";
import { ItineraryData } from "./types/itinerary";

function Router() {
  const [itinerary, setItinerary] = useState<ItineraryData | null>(null);
  const [currentDayId, setCurrentDayId] = useState<number | undefined>(undefined);
  const [location, navigate] = useLocation();

  useEffect(() => {
    // Load itinerary data
    fetch('/itinerary_data.json')
      .then(res => res.json())
      .then(data => {
        setItinerary(data);
        
        // Calculate current day based on date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const currentDay = data.days.find((day: any) => {
          const dayDate = new Date(day.date);
          dayDate.setHours(0, 0, 0, 0);
          return dayDate.getTime() === today.getTime();
        });
        
        if (currentDay) {
          setCurrentDayId(currentDay.id);
          
          // Auto-redirect to current day if on home page
          if (location === "/" && window.location.search !== "?home") {
            navigate(`/day/${currentDay.id}`);
          }
        }
      });
  }, []);

  return (
    <div className="flex min-h-screen">
      <ThemeToggle />
      
      {itinerary && (
        <ItinerarySidebar days={itinerary.days} currentDayId={currentDayId} />
      )}
      
      <main className="flex-1 lg:ml-72">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/day/:id" component={DayDetail} />
          <Route path="/phrases" component={Phrases} />
          <Route path="/404" component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

