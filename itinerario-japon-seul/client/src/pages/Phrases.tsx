import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PhrasesData } from "@/types/itinerary";
import { ChevronRight, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";

export default function Phrases() {
  const [phrases, setPhrases] = useState<PhrasesData | null>(null);
  const [playingPhrase, setPlayingPhrase] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetch('/phrases.json')
      .then(res => res.json())
      .then(data => setPhrases(data));
  }, []);

  const playAudio = (audioPath: string, phraseId: string) => {
    // Stop any currently playing audio
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }

    const audio = new Audio(audioPath);
    setAudioElement(audio);
    setPlayingPhrase(phraseId);

    audio.play();

    audio.onended = () => {
      setPlayingPhrase(null);
    };

    audio.onerror = () => {
      setPlayingPhrase(null);
      console.error('Error playing audio:', audioPath);
    };
  };

  if (!phrases) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando frases...</p>
        </div>
      </div>
    );
  }

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
            <span>Frases Útiles</span>
          </div>
          
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Frases Útiles</h1>
            <p className="text-muted-foreground">
              Frases esenciales en japonés y coreano para tu viaje. Toca el botón de audio para escuchar la pronunciación.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mt-8">
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="japanese" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="japanese" className="text-base">
                🇯🇵 Japonés
              </TabsTrigger>
              <TabsTrigger value="korean" className="text-base">
                🇰🇷 Coreano
              </TabsTrigger>
            </TabsList>
            
            {/* Japanese Tab */}
            <TabsContent value="japanese" className="space-y-6">
              {phrases.japanese.categories.map((category, catIndex) => (
                <Card key={catIndex}>
                  <CardHeader>
                    <CardTitle>{category.name}</CardTitle>
                    <CardDescription>
                      {category.phrases.length} frases
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {category.phrases.map((phrase, phraseIndex) => (
                        <div
                          key={phraseIndex}
                          className="p-4 border border-border rounded-lg hover:border-primary transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex-1">
                              <p className="font-medium text-foreground mb-1">
                                {phrase.spanish}
                              </p>
                              <p className="text-2xl mb-1" lang="ja">
                                {phrase.japanese}
                              </p>
                              <p className="text-sm text-muted-foreground italic">
                                {phrase.romaji}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => playAudio(`/audio/ja/ja_${catIndex}_${phraseIndex}.mp3`, `ja_${catIndex}_${phraseIndex}`)}
                              disabled={playingPhrase === `ja_${catIndex}_${phraseIndex}`}
                              className="flex-shrink-0"
                            >
                              <Volume2 className={`h-4 w-4 ${playingPhrase === `ja_${catIndex}_${phraseIndex}` ? 'animate-pulse' : ''}`} />
                            </Button>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted px-3 py-2 rounded">
                            <span className="font-semibold">Pronunciación:</span>
                            <span>{phrase.pronunciation}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
            
            {/* Korean Tab */}
            <TabsContent value="korean" className="space-y-6">
              {phrases.korean.categories.map((category, catIndex) => (
                <Card key={catIndex}>
                  <CardHeader>
                    <CardTitle>{category.name}</CardTitle>
                    <CardDescription>
                      {category.phrases.length} frases
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {category.phrases.map((phrase, phraseIndex) => (
                        <div
                          key={phraseIndex}
                          className="p-4 border border-border rounded-lg hover:border-primary transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex-1">
                              <p className="font-medium text-foreground mb-1">
                                {phrase.spanish}
                              </p>
                              <p className="text-2xl mb-1" lang="ko">
                                {phrase.korean}
                              </p>
                              <p className="text-sm text-muted-foreground italic">
                                {phrase.romaja}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => playAudio(`/audio/ko/ko_${catIndex}_${phraseIndex}.mp3`, `ko_${catIndex}_${phraseIndex}`)}
                              disabled={playingPhrase === `ko_${catIndex}_${phraseIndex}`}
                              className="flex-shrink-0"
                            >
                              <Volume2 className={`h-4 w-4 ${playingPhrase === `ko_${catIndex}_${phraseIndex}` ? 'animate-pulse' : ''}`} />
                            </Button>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted px-3 py-2 rounded">
                            <span className="font-semibold">Pronunciación:</span>
                            <span>{phrase.pronunciation}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

