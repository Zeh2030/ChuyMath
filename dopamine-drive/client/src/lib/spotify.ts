import { EnergyLevel, MoodState } from "@/contexts/WizardContext";

// Spotify playlist recommendations based on energy and mood
// These are curated public playlists that work well for ADHD focus

interface SpotifyPlaylist {
  name: string;
  description: string;
  url: string;
  embedId: string;
}

const energyPlaylists: Record<EnergyLevel, SpotifyPlaylist[]> = {
  turbo: [
    {
      name: "Beast Mode",
      description: "High-energy music to match your turbo energy",
      url: "https://open.spotify.com/playlist/37i9dQZF1DX76Wlfdnj7AP",
      embedId: "37i9dQZF1DX76Wlfdnj7AP",
    },
    {
      name: "Power Workout",
      description: "Intense beats for maximum productivity",
      url: "https://open.spotify.com/playlist/37i9dQZF1DX70RN3TfWWJh",
      embedId: "37i9dQZF1DX70RN3TfWWJh",
    },
  ],
  steady: [
    {
      name: "Deep Focus",
      description: "Ambient and post-rock music to keep you in the zone",
      url: "https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ",
      embedId: "37i9dQZF1DWZeKCadgRdKQ",
    },
    {
      name: "Productive Morning",
      description: "Upbeat but not overwhelming",
      url: "https://open.spotify.com/playlist/37i9dQZF1DX3Ogo9pFvBkY",
      embedId: "37i9dQZF1DX3Ogo9pFvBkY",
    },
  ],
  low: [
    {
      name: "Chill Lofi Study",
      description: "Relaxed beats to help you focus gently",
      url: "https://open.spotify.com/playlist/37i9dQZF1DWWQRwui0ExPn",
      embedId: "37i9dQZF1DWWQRwui0ExPn",
    },
    {
      name: "Peaceful Piano",
      description: "Soft piano for low-energy focus",
      url: "https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO",
      embedId: "37i9dQZF1DX4sWSpwq3LiO",
    },
  ],
  survival: [
    {
      name: "Calm Vibes",
      description: "Minimal, calming music for survival mode",
      url: "https://open.spotify.com/playlist/37i9dQZF1DX3Ogo9pFvBkY",
      embedId: "37i9dQZF1DX3Ogo9pFvBkY",
    },
    {
      name: "Ambient Relaxation",
      description: "Pure ambient sounds to reduce overwhelm",
      url: "https://open.spotify.com/playlist/37i9dQZF1DWZd79rJ6a7lp",
      embedId: "37i9dQZF1DWZd79rJ6a7lp",
    },
  ],
};

const moodPlaylists: Record<MoodState, SpotifyPlaylist[]> = {
  spark: [
    {
      name: "Happy Hits",
      description: "Upbeat songs to match your excitement",
      url: "https://open.spotify.com/playlist/37i9dQZF1DXdPec7aLTmlC",
      embedId: "37i9dQZF1DXdPec7aLTmlC",
    },
  ],
  chill: [
    {
      name: "Chill Hits",
      description: "Relaxed vibes for your chill mood",
      url: "https://open.spotify.com/playlist/37i9dQZF1DX4WYpdgoIcn6",
      embedId: "37i9dQZF1DX4WYpdgoIcn6",
    },
  ],
  zen: [
    {
      name: "Peaceful Piano",
      description: "Serene piano for your zen state",
      url: "https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO",
      embedId: "37i9dQZF1DX4sWSpwq3LiO",
    },
  ],
  wired: [
    {
      name: "Calming Acoustic",
      description: "Gentle acoustic to ease anxiety",
      url: "https://open.spotify.com/playlist/37i9dQZF1DX1s9knjP51Oa",
      embedId: "37i9dQZF1DX1s9knjP51Oa",
    },
  ],
  grit: [
    {
      name: "Motivation Mix",
      description: "Powerful music to channel your frustration",
      url: "https://open.spotify.com/playlist/37i9dQZF1DX3rxVfibe1L0",
      embedId: "37i9dQZF1DX3rxVfibe1L0",
    },
  ],
  lowtide: [
    {
      name: "Life Sucks",
      description: "Music for when you're feeling down",
      url: "https://open.spotify.com/playlist/37i9dQZF1DX3YSRoSdA634",
      embedId: "37i9dQZF1DX3YSRoSdA634",
    },
  ],
};

export function getPlaylistsForEnergy(energy: EnergyLevel): SpotifyPlaylist[] {
  return energyPlaylists[energy] || energyPlaylists.steady;
}

export function getPlaylistsForMood(mood: MoodState): SpotifyPlaylist[] {
  return moodPlaylists[mood] || moodPlaylists.chill;
}

export function getRecommendedPlaylists(
  energy: EnergyLevel,
  mood: MoodState
): SpotifyPlaylist[] {
  // Combine energy and mood playlists, prioritizing energy
  const energyLists = getPlaylistsForEnergy(energy);
  const moodLists = getPlaylistsForMood(mood);
  
  // Return top 3 playlists (2 from energy, 1 from mood)
  return [
    ...energyLists.slice(0, 2),
    ...moodLists.slice(0, 1),
  ];
}

export function getSpotifyEmbedUrl(embedId: string): string {
  return `https://open.spotify.com/embed/playlist/${embedId}?utm_source=generator&theme=0`;
}

