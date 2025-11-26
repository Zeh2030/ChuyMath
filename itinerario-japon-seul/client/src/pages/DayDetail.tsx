import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DayMap from "@/components/DayMap";
import { Day } from "@/types/itinerary";
import { Calendar, ChevronLeft, ChevronRight, Clock, ExternalLink, Info, MapPin, Train } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";

export default function DayDetail() {
  const [, params] = useRoute("/day/:id");
  const dayId = params?.id ? parseInt(params.id) : 1;
  
  const [day, setDay] = useState<Day | null>(null);
  const [totalDays, setTotalDays] = useState(0);

  useEffect(() => {
    fetch('/itinerary_data.json')
      .then(res => res.json())
      .then(data => {
        const foundDay = data.days.find((d: Day) => d.id === dayId);
        setDay(foundDay || null);
        setTotalDays(data.days.length);
      });
  }, [dayId]);

  if (!day) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando día {dayId}...</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'transport':
        return <Train className="h-5 w-5" />;
      case 'attraction':
        return <MapPin className="h-5 w-5" />;
      case 'food':
        return <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>;
      case 'accommodation':
        return <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'transport':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'attraction':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'food':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'accommodation':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="sakura-gradient border-b border-border">
        <div className="container py-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link href="/">
              <a className="hover:text-foreground transition-colors">Inicio</a>
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span>Día {day.id}</span>
          </div>
          
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                  {day.id}
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold">{day.title}</h1>
                  <div className="flex items-center gap-4 mt-2 text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">{formatDate(day.date)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">{day.location}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Navigation Buttons */}
            <div className="flex gap-2">
              {day.id > 1 && (
                <Link href={`/day/${day.id - 1}`}>
                  <Button variant="outline" size="sm">
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Día Anterior
                  </Button>
                </Link>
              )}
              {day.id < totalDays && (
                <Link href={`/day/${day.id + 1}`}>
                  <Button variant="outline" size="sm">
                    Día Siguiente
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Day Map */}
      {(() => {
        const locationCount = day.activities.reduce((count, activity) => {
          let activityCount = activity.mapUrl ? 1 : 0;
          if (activity.options) {
            activityCount += activity.options.filter(opt => opt.mapUrl).length;
          }
          return count + activityCount;
        }, 0);
        
        if (locationCount >= 2) {
          return (
            <div className="container mt-8">
              <div className="max-w-4xl mx-auto mb-8">
                <h3 className="text-2xl font-bold mb-4">Mapa del Día</h3>
                <DayMap activities={day.activities} dayTitle={day.title} />
              </div>
            </div>
          );
        }
        return null;
      })()}

      {/* Activities */}
      <div className="container mt-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {day.activities.map((activity, index) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader className={getActivityColor(activity.type)}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {getActivityIcon(activity.type)}
                    <div>
                      <CardTitle className="text-xl">{activity.title}</CardTitle>
                      {activity.time && (
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          {activity.time}
                          {activity.duration && ` • ${activity.duration}`}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {activity.type === 'transport' && 'Transporte'}
                    {activity.type === 'attraction' && 'Atracción'}
                    {activity.type === 'food' && 'Comida'}
                    {activity.type === 'accommodation' && 'Alojamiento'}
                    {activity.type === 'flexible' && 'Flexible'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pt-6">
                <p className="text-foreground mb-4">{activity.description}</p>
                
                {/* Details */}
                {activity.details && activity.details.length > 0 && (
                  <div className="mb-4 p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2 text-sm">Detalles:</h4>
                    <ul className="space-y-1 text-sm">
                      {activity.details.map((detail, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Tips */}
                {activity.tips && (
                  <div className="mb-4 p-4 bg-accent/10 border border-accent/20 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Consejo:</h4>
                        <p className="text-sm">{activity.tips}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Recommendations */}
                {activity.recommendations && (
                  <div className="mb-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="flex items-start gap-2">
                      <svg className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <div>
                        <h4 className="font-semibold text-sm mb-1 text-primary">💡 Qué ver/hacer/pedir:</h4>
                        <p className="text-sm">{activity.recommendations}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Baby Tips */}
                {activity.babyTips && (
                  <div className="mb-4 p-4 bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 rounded-lg">
                    <div className="flex items-start gap-2">
                      <span className="text-lg flex-shrink-0">👶</span>
                      <div>
                        <h4 className="font-semibold text-sm mb-1 text-pink-700 dark:text-pink-300">Con bebé:</h4>
                        <p className="text-sm text-pink-900 dark:text-pink-100">{activity.babyTips}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Options */}
                {activity.options && activity.options.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold mb-3 text-sm">Opciones:</h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {activity.options.map((option, i) => (
                        <div key={i} className="p-3 border border-border rounded-lg hover:border-primary transition-colors">
                          <h5 className="font-medium text-sm mb-1">{option.name}</h5>
                          {option.type && (
                            <p className="text-xs text-muted-foreground mb-2">{option.type}</p>
                          )}
                          {option.description && (
                            <p className="text-xs text-muted-foreground mb-2">{option.description}</p>
                          )}
                          {option.mapUrl && (
                            <a
                              href={option.mapUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                            >
                              Ver en mapa
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Info Grid */}
                <div className="grid gap-4 sm:grid-cols-2 mb-4">
                  {activity.cost && (
                    <div className="flex items-start gap-2">
                      <span className="text-sm font-semibold text-muted-foreground">Costo:</span>
                      <span className="text-sm">{activity.cost}</span>
                    </div>
                  )}
                  {activity.price && (
                    <div className="flex items-start gap-2">
                      <span className="text-sm font-semibold text-muted-foreground">Entrada:</span>
                      <span className="text-sm font-semibold text-primary">{activity.price}</span>
                    </div>
                  )}
                  {activity.transport && (
                    <div className="flex items-start gap-2">
                      <span className="text-sm font-semibold text-muted-foreground">Transporte:</span>
                      <span className="text-sm">{activity.transport}</span>
                    </div>
                  )}
                  {activity.address && (
                    <div className="flex items-start gap-2 sm:col-span-2">
                      <span className="text-sm font-semibold text-muted-foreground">Dirección:</span>
                      <span className="text-sm">{activity.address}</span>
                    </div>
                  )}
                </div>
                
                {/* Links */}
                <div className="flex flex-wrap gap-2">
                  {activity.mapUrl && (
                    <a
                      href={activity.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm">
                        <MapPin className="h-4 w-4 mr-2" />
                        Abrir en Google Maps
                        <ExternalLink className="h-3 w-3 ml-2" />
                      </Button>
                    </a>
                  )}
                  {activity.website && (
                    <a
                      href={activity.website}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Sitio Web Oficial
                      </Button>
                    </a>
                  )}
                  {activity.resources && activity.resources.map((resource, i) => (
                    <a
                      key={i}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        {resource.name}
                      </Button>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

