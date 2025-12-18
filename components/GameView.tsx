
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameSettings, GameState, Track, Theme, MusicMode } from '../types';
import { fetchPlaylistTracks, playTrackOnDevice } from '../services/spotifyService';
import { ChevronLeft, Loader2, RefreshCw, ShieldAlert, CheckCircle2, Circle, Headphones, SkipForward, Upload, Crown } from 'lucide-react';
import Snowfall from './Snowfall';

interface Props {
  settings: GameSettings;
  onExit: () => void;
  setSettings: (s: GameSettings) => void;
}

const GameView: React.FC<Props> = ({ settings, onExit, setSettings }) => {
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isLoadingTracks, setIsLoadingTracks] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAccountError, setIsAccountError] = useState(false);
  
  const [player, setPlayer] = useState<any>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stopTimerRef = useRef<any>(null);

  const setupSpotifyPlayer = useCallback(() => {
    if (settings.musicMode !== MusicMode.SPOTIFY_PREMIUM) return;
    if (!(window as any).Spotify || !settings.spotifyToken || player) return;

    const newPlayer = new (window as any).Spotify.Player({
      name: 'BeatStop Console',
      getOAuthToken: (cb: any) => cb(settings.spotifyToken),
      volume: 0.7
    });

    newPlayer.addListener('ready', ({ device_id }: any) => {
      setDeviceId(device_id);
      setIsPlayerReady(true);
    });

    newPlayer.addListener('account_error', () => {
      setError('Geen Spotify Premium gevonden. Premium is vereist voor de Spotify-modus.');
      setIsAccountError(true);
    });

    newPlayer.connect();
    setPlayer(newPlayer);
  }, [settings, player]);

  useEffect(() => {
    if (settings.musicMode === MusicMode.SPOTIFY_PREMIUM) {
      window.addEventListener('spotifySDKLoaded', setupSpotifyPlayer);
      if ((window as any).spotifySDKReady) setupSpotifyPlayer();
      return () => window.removeEventListener('spotifySDKLoaded', setupSpotifyPlayer);
    } else {
      setIsPlayerReady(true);
    }
  }, [settings.musicMode, setupSpotifyPlayer]);

  useEffect(() => {
    const loadTracks = async () => {
      try {
        if (settings.musicMode === MusicMode.LOCAL_UPLOAD) {
          setTracks(settings.shuffle ? [...settings.localTracks].sort(() => Math.random() - 0.5) : settings.localTracks);
          setIsLoadingTracks(false);
          return;
        }

        let fetched = await fetchPlaylistTracks(settings.playlistUrl || '', settings.spotifyToken);
        setTracks(settings.shuffle ? [...fetched].sort(() => Math.random() - 0.5) : fetched);
        setIsLoadingTracks(false);
      } catch (err: any) {
        setError(err.message || 'Kon de playlist niet laden.');
        setIsLoadingTracks(false);
      }
    };
    loadTracks();
  }, [settings]);

  const stopMusic = useCallback(async () => {
    if (settings.musicMode === MusicMode.SPOTIFY_PREMIUM && player) {
      await player.pause();
    } else if (audioRef.current) {
      audioRef.current.pause();
    }
    
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    new Audio('https://actions.google.com/sounds/v1/emergency/emergency_siren_short_burst.ogg').play().catch(() => {});
    setGameState(GameState.PAUSED_MANUAL);
  }, [player, settings.musicMode]);

  const startMusic = useCallback(async () => {
    if (!tracks.length) return;
    const currentTrack = tracks[currentTrackIndex];

    try {
      if (settings.musicMode === MusicMode.SPOTIFY_PREMIUM && deviceId) {
        if (gameState === GameState.IDLE) {
          await playTrackOnDevice(settings.spotifyToken, deviceId, currentTrack.uri);
        } else {
          await player.resume();
        }
      } else {
        if (!audioRef.current) audioRef.current = new Audio();
        
        if (gameState === GameState.IDLE || audioRef.current.src !== currentTrack.previewUrl) {
          audioRef.current.src = currentTrack.previewUrl || '';
          audioRef.current.volume = 0.7;
          audioRef.current.onended = skipTrack; 
        }
        await audioRef.current.play();
      }
      
      setGameState(GameState.PLAYING);
      const duration = Math.floor(Math.random() * (settings.maxStopSeconds - settings.minStopSeconds + 1)) + settings.minStopSeconds;
      stopTimerRef.current = setTimeout(stopMusic, duration * 1000);
    } catch (e: any) {
      setError(e.message);
    }
  }, [deviceId, tracks, currentTrackIndex, gameState, settings, player, stopMusic]);

  const skipTrack = useCallback(() => {
    const next = (currentTrackIndex + 1) % tracks.length;
    setCurrentTrackIndex(next);
    setGameState(GameState.IDLE);
    if (audioRef.current) audioRef.current.pause();
  }, [currentTrackIndex, tracks.length]);

  const switchToUpload = () => {
    setSettings({ ...settings, musicMode: MusicMode.LOCAL_UPLOAD });
    setError(null);
    setIsAccountError(false);
    setIsPlayerReady(true);
    onExit(); // Ga terug naar menu om bestanden te uploaden
  };

  if (isLoadingTracks || (settings.musicMode === MusicMode.SPOTIFY_PREMIUM && !isPlayerReady && !error)) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-950 p-10 text-center">
        <Loader2 className="w-16 h-16 text-green-500 animate-spin mb-8" />
        <h2 className="font-game text-xl text-white mb-2 italic">LADEN...</h2>
        <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em]">
          {settings.musicMode === MusicMode.LOCAL_UPLOAD ? 'Bestanden voorbereiden' : 'Spotify Engine laden'}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-950 p-10 text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-6" />
        <h2 className="font-game text-2xl mb-4 italic uppercase">STOP! FOUT</h2>
        <p className="text-slate-400 text-sm mb-10 font-bold max-w-xs">{error}</p>
        {isAccountError ? (
          <button onClick={switchToUpload} className="w-full bg-purple-600 text-white py-6 rounded-3xl font-black uppercase text-xs shadow-2xl active:scale-95 transition-all">
            UPLOAD EIGEN MP3'S
          </button>
        ) : (
          <button onClick={onExit} className="w-full max-w-xs bg-white text-black py-6 rounded-3xl font-black uppercase text-xs">TERUG NAAR MENU</button>
        )}
      </div>
    );
  }

  const track = tracks[currentTrackIndex];

  return (
    <div className={`flex flex-col h-full transition-all duration-1000 ${gameState === GameState.PLAYING ? 'bg-green-950' : 'bg-slate-950'} relative`}>
      {settings.theme === Theme.CHRISTMAS && <Snowfall />}
      
      <div className="p-6 flex items-center justify-between z-20">
        <button onClick={onExit} className="p-3 bg-black/40 rounded-2xl border border-white/10 active:scale-90 transition-transform">
          <ChevronLeft className="w-8 h-8 text-white" />
        </button>
        <div className="flex flex-col items-center">
          <h2 className="font-game text-2xl text-white italic leading-none">BEATSTOP</h2>
          <span className="text-[7px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1 mt-1">
             {settings.musicMode === MusicMode.SPOTIFY_PREMIUM ? <Crown className="w-2 h-2 text-green-500" /> : <Upload className="w-2 h-2 text-purple-500" />}
             {settings.musicMode === MusicMode.SPOTIFY_PREMIUM ? 'Spotify Premium' : 'Eigen Upload'}
          </span>
        </div>
        <button onClick={skipTrack} className="p-3 bg-black/40 rounded-2xl border border-white/10 active:scale-90"><SkipForward className="w-6 h-6 text-white" /></button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8 z-10 text-center">
        <div className={`transition-all duration-1000 transform ${gameState === GameState.PLAYING ? 'scale-110' : 'scale-95 opacity-80'}`}>
          <div className="relative mb-8">
            <div className={`absolute -inset-20 rounded-full blur-[100px] transition-all duration-1000 ${gameState === GameState.PLAYING ? 'bg-green-500/40' : 'bg-transparent'}`} />
            <img 
              src={track?.albumArt || 'https://picsum.photos/400/400?grayscale'} 
              className={`w-64 h-64 md:w-80 md:h-80 rounded-[56px] shadow-2xl border-4 border-white/10 transition-all duration-1000 ${gameState === GameState.PLAYING ? 'rotate-0' : 'grayscale brightness-50 contrast-125'}`} 
            />
          </div>
          <div className="mb-4">
             <p className="text-white font-bold text-lg leading-tight truncate max-w-[280px]">{track?.name || 'Onbekend nummer'}</p>
             <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">{track?.artist || 'Onbekende artiest'}</p>
          </div>
          <h1 className="text-8xl font-game text-white uppercase italic drop-shadow-2xl tracking-tighter">
            {gameState === GameState.PLAYING ? 'BEAT!' : 'STOP'}
          </h1>
        </div>
      </div>

      <div className="p-10 z-20 pb-20">
        <button 
          onClick={startMusic} 
          className={`w-full py-8 rounded-[40px] font-game text-3xl shadow-2xl transition-all active:scale-95 border-b-8 border-slate-300 ${gameState === GameState.PLAYING ? 'hidden' : 'bg-white text-black'}`}
        >
          {gameState === GameState.IDLE ? 'START GAME' : 'DOORGAAN'}
        </button>
      </div>
    </div>
  );
};

export default GameView;
