import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import GlobalMap from "@/components/GlobalMap";
import TravelersSection from "@/components/TravelersSection";
import { ItineraryData } from "@/types/itinerary";
import { Calendar, MapPin, Plane } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";

export default function Home() {
  const [itinerary, setItinerary] = useState<ItineraryData | null>(null);
  const [currentDayId, setCurrentDayId] = useState<number | null>(null);

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
        }
      });
  }, []);

  if (!itinerary) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando itinerario...</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sakura-gradient overflow-hidden">
        <div className="absolute inset-0 wave-pattern opacity-30"></div>
        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm mb-6">
              <Plane className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                {itinerary.trip.dates}
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 text-foreground">
              {itinerary.trip.title}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Una aventura inolvidable por Japón y Corea del Sur
            </p>
            
            {currentDayId && (
              <Link href={`/day/${currentDayId}`}>
                <Button size="lg" className="shadow-lg">
                  <Calendar className="mr-2 h-5 w-5" />
                  Ver Día Actual (Día {currentDayId})
                </Button>
              </Link>
            )}
            {!currentDayId && (
              <Link href="/day/1">
                <Button size="lg" className="shadow-lg">
                  <MapPin className="mr-2 h-5 w-5" />
                  Comenzar el Viaje
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Travelers Section */}
      <TravelersSection />

      {/* Phrases Quick Access */}
      <section className="py-16 px-4 bg-secondary/20">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">Frases Útiles</h2>
          <p className="text-muted-foreground mb-6">
            Aprende frases esenciales en japonés y coreano con audio
          </p>
          <Link href="/phrases">
            <Button size="lg" className="gap-2">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              Ver Frases Útiles
            </Button>
          </Link>
        </div>
      </section>

      {/* Global Map */}
      <section className="py-16 px-4 bg-secondary/10">
        <div className="container">
          <h2 className="text-3xl font-bold mb-4 text-center">Ruta del Viaje</h2>
          <p className="text-center text-muted-foreground mb-8">
            Explora las ciudades que visitaremos en este viaje
          </p>
          <GlobalMap days={itinerary.days} />
        </div>
      </section>

      {/* Days Overview */}
      <section className="py-16 px-4">
        <div className="container">
          <h2 className="text-3xl font-bold mb-8 text-center">Resumen del Itinerario</h2>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {itinerary.days.map((day) => {
              const isCurrent = day.id === currentDayId;
              return (
                <Link key={day.id} href={`/day/${day.id}`}>
                  <Card className={`h-full transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer ${
                    isCurrent ? 'ring-2 ring-primary' : ''
                  }`}>
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            isCurrent ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                          }`}>
                            {day.id}
                          </div>
                          {isCurrent && (
                            <span className="text-xs font-semibold text-primary">HOY</span>
                          )}
                        </div>
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <CardTitle className="text-lg">{day.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {formatDate(day.date)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{day.location}</span>
                      </div>
                      <div className="mt-3 text-sm text-muted-foreground">
                        {day.activities.length} actividad{day.activities.length !== 1 ? 'es' : ''}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quick Access Section */}
      <section className="py-16 px-4 bg-secondary/30">
        <div className="container">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Acceso Rápido</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Link href="/phrases">
                <Card className="h-full transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <svg
                        className="h-6 w-6 text-primary"
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
                      Frases Útiles
                    </CardTitle>
                    <CardDescription>
                      Japonés y coreano con audio
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
              
              <Card className="h-full bg-gradient-to-br from-primary/10 to-accent/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-6 w-6 text-primary" />
                    Duración Total
                  </CardTitle>
                  <CardDescription className="text-2xl font-bold text-foreground">
                    17 días
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

