import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWizard } from "@/contexts/WizardContext";
import { getRecommendedPlaylists, getSpotifyEmbedUrl } from "@/lib/spotify";
import { Music, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";

export default function SpotifyPlayer() {
  const { wizardData } = useWizard();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedPlaylistIndex, setSelectedPlaylistIndex] = useState(0);

  const energy = wizardData.brainState?.energy;
  const mood = wizardData.brainState?.mood;

  if (!energy || !mood) {
    return null;
  }

  const playlists = getRecommendedPlaylists(energy, mood);
  const selectedPlaylist = playlists[selectedPlaylistIndex];

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Música para tu estado</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>
        <CardDescription>
          Playlists de Spotify recomendadas para tu energía ({energy}) y estado de ánimo ({mood})
        </CardDescription>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Playlist selector */}
          <div className="flex flex-wrap gap-2">
            {playlists.map((playlist, index) => (
              <Badge
                key={index}
                variant={selectedPlaylistIndex === index ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/20 transition-colors"
                onClick={() => setSelectedPlaylistIndex(index)}
              >
                {playlist.name}
              </Badge>
            ))}
          </div>

          {/* Selected playlist info */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold">{selectedPlaylist.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedPlaylist.description}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <a
                  href={selectedPlaylist.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Abrir en Spotify
                </a>
              </Button>
            </div>

            {/* Spotify embed player */}
            <div className="rounded-lg overflow-hidden border border-border">
              <iframe
                src={getSpotifyEmbedUrl(selectedPlaylist.embedId)}
                width="100%"
                height="152"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                title={selectedPlaylist.name}
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            💡 Tip: La música puede ayudar a mantener el enfoque y regular tu energía
          </p>
        </CardContent>
      )}
    </Card>
  );
}

