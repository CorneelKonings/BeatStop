
export enum GameState {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  PAUSED_AUTO = 'PAUSED_AUTO',
  PAUSED_MANUAL = 'PAUSED_MANUAL'
}

export enum Theme {
  STANDARD = 'STANDARD',
  CHRISTMAS = 'CHRISTMAS'
}

export interface GameSettings {
  minStopSeconds: number;
  maxStopSeconds: number;
  pauseDuration: number;
  autoResume: boolean;
  shuffle: boolean;
  theme: Theme;
  playlistUrl: string;
  spotifyToken: string;
}

export interface Track {
  id: string;
  name: string;
  artist: string;
  previewUrl: string | null;
  albumArt: string;
  uri?: string;
}

export interface SpotifyUser {
  display_name: string;
  images: { url: string }[];
}
