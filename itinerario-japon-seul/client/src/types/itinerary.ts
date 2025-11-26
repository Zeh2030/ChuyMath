export interface Activity {
  time: string;
  title: string;
  description: string;
  type: 'transport' | 'attraction' | 'food' | 'accommodation' | 'flexible';
  duration?: string;
  cost?: string;
  mapUrl?: string;
  website?: string;
  address?: string;
  tips?: string;
  transport?: string;
  details?: string[];
  resources?: { name: string; url: string }[];
  recommendations?: string;
  babyTips?: string;
  price?: string;
  options?: {
    name: string;
    type?: string;
    description?: string;
    mapUrl?: string;
    website?: string;
  }[];
}

export interface Day {
  id: number;
  date: string;
  title: string;
  location: string;
  activities: Activity[];
}

export interface Trip {
  title: string;
  dates: string;
  travelers: string;
}

export interface ItineraryData {
  trip: Trip;
  days: Day[];
}

export interface Phrase {
  spanish: string;
  japanese?: string;
  korean?: string;
  romaji?: string;
  romaja?: string;
  pronunciation: string;
}

export interface PhraseCategory {
  name: string;
  phrases: Phrase[];
}

export interface LanguagePhrases {
  title: string;
  categories: PhraseCategory[];
}

export interface PhrasesData {
  japanese: LanguagePhrases;
  korean: LanguagePhrases;
}

