
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameSettings, GameState, Track, Theme, MusicMode } from '../types';
import { fetchPlaylistTracks, playTrackOnDevice } from '../services/spotifyService';
import { ChevronLeft, Loader2, ShieldAlert, SkipForward, Upload, Crown, Play } from 'lucide-react';
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
  const [progress, setProgress] = useState(0); 
  
  const [player, setPlayer] = useState<any>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stopTimerRef = useRef<any>(null);
  const progressIntervalRef = useRef<any>(null);

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

    newPlayer.addListener('player_state_changed', (state: any) => {
      if (state) {
        setProgress(state.position / state.duration || 0);
      }
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
        setError(err.message || 'Laden mislukt.');
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
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
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

        progressIntervalRef.current = setInterval(() => {
          if (audioRef.current) {
            setProgress(audioRef.current.currentTime / audioRef.current.duration || 0);
          }
        }, 500);
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
    setProgress(0);
    if (audioRef.current) audioRef.current.pause();
  }, [currentTrackIndex, tracks.length]);

  const getThemeConfig = () => {
    switch(settings.theme) {
      case Theme.CHRISTMAS: return { bg: gameState === GameState.PLAYING ? 'bg-red-950' : 'bg-slate-950', accent: 'text-white', glow: 'bg-white/10' };
      default: return { bg: gameState === GameState.PLAYING ? 'bg-green-950' : 'bg-slate-950', accent: 'text-green-500', glow: 'bg-green-500/20' };
    }
  };

  const theme = getThemeConfig();
  const track = tracks[currentTrackIndex];
  const hasRealArt = track?.albumArt && !track.albumArt.includes('picsum.photos');

  // TOONARM BEWEGING:
  // Idle: 70 graden (ver buiten de plaat)
  // Progress 0 (Buitenrand van de groeven): 48 graden
  // Progress 1 (Vlakbij het label/midden): 18 graden
  const armRotation = gameState === GameState.PLAYING 
    ? 48 - (progress * 30) 
    : 70;

  if (isLoadingTracks) return <div className="h-full flex items-center justify-center bg-slate-950 font-game italic text-2xl animate-pulse text-white">BEATS LADEN...</div>;

  return (
    <div className={`flex flex-col h-full transition-all duration-1000 ${theme.bg} relative overflow-hidden`}>
      {settings.theme === Theme.CHRISTMAS && <Snowfall isPaused={gameState !== GameState.PLAYING} />}
      
      <div className="p-6 flex items-center justify-between z-20">
        <button onClick={onExit} className="p-3 bg-black/40 rounded-2xl border border-white/10 active:scale-90"><ChevronLeft className="w-8 h-8 text-white" /></button>
        <div className="flex flex-col items-center">
          <h2 className="font-game text-2xl text-white italic leading-none tracking-tighter">BEATSTOP</h2>
          <span className="text-[7px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-1 mt-1">
             {settings.musicMode === MusicMode.SPOTIFY_PREMIUM ? <Crown className="w-2 h-2 text-green-500" /> : <Upload className="w-2 h-2 text-purple-500" />}
             {settings.musicMode === MusicMode.SPOTIFY_PREMIUM ? 'Premium' : 'Lokaal'}
          </span>
        </div>
        <button onClick={skipTrack} className="p-3 bg-black/40 rounded-2xl border border-white/10 active:scale-90"><SkipForward className="w-6 h-6 text-white" /></button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8 z-10 text-center relative">
        <div className="relative group perspective-1000">
          
          {/* TOONARM - Gefixt: pivot boven-rechts, beweegt van buiten (48deg) naar binnen (18deg) */}
          <div 
            className="absolute -right-24 -top-16 w-48 h-64 z-40 transition-all duration-1000 origin-top-right transform pointer-events-none"
            style={{ transform: `rotate(${armRotation}deg)` }}
          >
             <div className="absolute right-4 top-4 w-14 h-14 bg-slate-800 rounded-full border-4 border-slate-700 shadow-xl" />
             <div className="absolute right-10 top-12 w-3 h-[85%] bg-gradient-to-b from-slate-300 via-slate-500 to-slate-400 rounded-full shadow-lg origin-top">
                <div className="absolute -bottom-4 -left-3 w-10 h-14 bg-slate-900 rounded-sm border border-slate-700 shadow-md transform rotate-[-10deg]">
                   <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-3 bg-slate-300 rounded-full" />
                </div>
             </div>
          </div>

          {/* DE PLAAT */}
          <div className={`relative w-80 h-80 md:w-96 md:h-96 rounded-full shadow-[0_0_150px_rgba(0,0,0,1)] transition-all duration-1000 transform ${gameState === GameState.PLAYING ? 'scale-105' : 'scale-95 grayscale-[0.2]'}`}>
            <div className={`absolute -inset-10 rounded-full blur-[80px] transition-opacity duration-1000 ${gameState === GameState.PLAYING ? 'opacity-100' : 'opacity-0'} ${theme.glow}`} />

            <div 
              className={`absolute inset-0 rounded-full bg-black flex items-center justify-center overflow-hidden border-[6px] border-[#151515] ${gameState === GameState.PLAYING ? 'animate-spin-vinyl' : ''}`}
              style={{
                backgroundImage: `
                  repeating-radial-gradient(circle at center, transparent 0, transparent 4px, rgba(255,255,255,0.05) 5px),
                  repeating-radial-gradient(circle at center, #020202 0, #020202 6px, #080808 7px, #080808 1px)
                `
              }}
            >
              {/* WITTE GLANS STREPEN */}
              <div className="absolute inset-0 vinyl-white-glint pointer-events-none z-10 opacity-80" />

              {/* Center Label */}
              <div className={`relative w-[34%] h-[34%] rounded-full overflow-hidden border-[6px] border-[#0a0a0a] z-20 shadow-[0_0_20px_rgba(0,0,0,1)] transition-transform duration-500 ${gameState === GameState.PLAYING ? 'scale-100' : 'scale-95'}`}>
                {hasRealArt ? (
                  <img src={track.albumArt} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[#050505] flex flex-col items-center justify-center p-2 text-center">
                    <MusicIcon className={`w-6 h-6 ${theme.accent} mb-1 opacity-40`} />
                    <span className="text-[5px] font-black uppercase text-slate-700 leading-tight tracking-[0.2em]">BEATSTOP<br/>EDITION</span>
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                   <div className="w-3 h-3 bg-[#0a0a0a] rounded-full border border-white/10 shadow-inner" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BEAT / STOP TEKST (WIT) */}
        <div className="mt-16 h-36 flex flex-col items-center justify-start overflow-visible">
          <div className="relative">
             <span className={`font-game text-8xl italic text-white transition-all duration-300 block drop-shadow-[0_0_30px_rgba(255,255,255,0.6)] ${gameState === GameState.PLAYING ? 'opacity-100 translate-y-0 scale-110' : 'opacity-0 -translate-y-4 scale-90'}`}>BEAT</span>
             <span className={`font-game text-8xl italic text-white transition-all duration-300 absolute inset-0 text-center drop-shadow-[0_0_40px_rgba(255,0,0,0.5)] ${gameState === GameState.PAUSED_MANUAL ? 'opacity-100 translate-y-0 scale-105' : 'opacity-0 translate-y-4 scale-125'}`}>STOP</span>
          </div>
          
          <div className={`mt-6 transition-all duration-700 transform ${gameState === GameState.PLAYING ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-4'}`}>
              <p className="text-white font-bold text-lg leading-tight truncate max-w-[280px] mx-auto uppercase tracking-tighter">{track?.name || 'Klaar voor de start'}</p>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-2 opacity-60 leading-none">{track?.artist || 'BeatStop Console'}</p>
          </div>
        </div>
      </div>

      <div className="p-10 z-20 pb-24 flex justify-center">
        <button 
          onClick={startMusic} 
          disabled={gameState === GameState.PLAYING}
          className={`btn-3d-wrap w-full max-w-sm h-24 ${gameState === GameState.PLAYING ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        >
          <div className="btn-3d-top bg-white text-black font-game text-3xl italic uppercase flex items-center justify-center gap-4">
            <Play className="fill-current w-8 h-8" /> START BEAT
          </div>
          <div className="btn-3d-bottom bg-slate-300" />
        </button>
      </div>

      <style>{`
        @keyframes spin-vinyl {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-vinyl {
          animation: spin-vinyl 3.5s linear infinite;
        }
        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
    </div>
  );
};

const MusicIcon = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
);

export default GameView;
