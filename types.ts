
export enum GameState {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  PAUSED_AUTO = 'PAUSED_AUTO',
  PAUSED_MANUAL = 'PAUSED_MANUAL'
}

export enum Theme {
  STANDARD = 'STANDARD',
  CHRISTMAS = 'CHRISTMAS',
  CIRCUS = 'CIRCUS'
}

export enum MusicMode {
  SPOTIFY_PREMIUM = 'SPOTIFY_PREMIUM',
  LOCAL_UPLOAD = 'LOCAL_UPLOAD'
}

export interface SpotifyUser {
  display_name: string;
  images: { url: string }[];
}

export interface Track {
  id: string;
  name: string;
  artist: string;
  previewUrl: string | null; // Dit wordt de Blob URL voor uploads
  albumArt: string;
  uri: string;
}

export interface GameSettings {
  minStopSeconds: number;
  maxStopSeconds: number;
  pauseDuration: number;
  autoResume: boolean;
  theme: Theme;
  playlistUrl: string;
  spotifyToken: string;
  shuffle: boolean;
  musicMode: MusicMode;
  localTracks: Track[]; // Nieuwe opslag voor geüploade bestanden
}
