
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameSettings, GameState, Track, Theme } from '../types';
import { fetchPlaylistTracks } from '../services/spotifyService';
import { Play, Pause, ChevronLeft, AlertCircle, Loader2, Music, Volume2 } from 'lucide-react';
import Snowfall from './Snowfall';

interface Props {
  settings: GameSettings;
  onExit: () => void;
}

const GameView: React.FC<Props> = ({ settings, onExit }) => {
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoResumeTimeLeft, setAutoResumeTimeLeft] = useState<number | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stopTimerRef = useRef<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const fetched = await fetchPlaylistTracks(settings.playlistUrl, settings.spotifyToken);
        setTracks(settings.shuffle ? [...fetched].sort(() => Math.random() - 0.5) : fetched);
        setIsLoading(false);
      } catch (err: any) {
        setError(err.message || 'Kon de playlist niet laden.');
        setIsLoading(false);
      }
    };
    load();
  }, [settings.playlistUrl, settings.shuffle, settings.spotifyToken]);

  const nextTrack = useCallback(() => {
    setCurrentTrackIndex(prev => (prev + 1) % tracks.length);
  }, [tracks.length]);

  const handleAudioError = () => {
    console.warn("Audio track kon niet laden, skippen...");
    nextTrack();
  };

  const stopMusic = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    
    const sfxUrl = settings.theme === Theme.CHRISTMAS 
        ? 'https://actions.google.com/sounds/v1/alarms/bugle_tune.ogg' 
        : 'https://actions.google.com/sounds/v1/emergency/emergency_siren_short_burst.ogg';
    const sfx = new Audio(sfxUrl);
    sfx.volume = 0.6;
    sfx.play().catch(() => {});

    if (settings.autoResume) {
      setGameState(GameState.PAUSED_AUTO);
      setAutoResumeTimeLeft(settings.pauseDuration);
    } else {
      setGameState(GameState.PAUSED_MANUAL);
    }
  }, [settings.autoResume, settings.pauseDuration, settings.theme]);

  const scheduleNextStop = useCallback(() => {
    const duration = Math.floor(Math.random() * (settings.maxStopSeconds - settings.minStopSeconds + 1)) + settings.minStopSeconds;
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    stopTimerRef.current = setTimeout(() => {
      stopMusic();
    }, duration * 1000);
  }, [settings.maxStopSeconds, settings.minStopSeconds, stopMusic]);

  const startMusic = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.volume = 1.0;
      audioRef.current.play().catch(e => {
        console.error("Play blocked or failed", e);
        setError("Browser blokkeert audio. Klik ergens op het scherm en probeer opnieuw.");
      });
      setGameState(GameState.PLAYING);
      scheduleNextStop();
    }
  }, [scheduleNextStop]);

  useEffect(() => {
    if (gameState === GameState.PAUSED_AUTO && autoResumeTimeLeft !== null) {
      if (autoResumeTimeLeft > 0) {
        const t = setTimeout(() => setAutoResumeTimeLeft(autoResumeTimeLeft - 1), 1000);
        return () => clearTimeout(t);
      } else {
        startMusic();
      }
    }
  }, [gameState, autoResumeTimeLeft, startMusic]);

  const getStatusColor = () => {
    if (gameState === GameState.PLAYING) return settings.theme === Theme.CHRISTMAS ? 'bg-red-900' : 'bg-blue-900';
    if (gameState === GameState.PAUSED_AUTO || gameState === GameState.PAUSED_MANUAL) return 'bg-amber-600';
    return 'bg-slate-900';
  };

  const getStatusText = () => {
    switch (gameState) {
      case GameState.IDLE: return 'KLAAR?';
      case GameState.PLAYING: return 'BEAT!';
      case GameState.PAUSED_AUTO: return 'STOP';
      case GameState.PAUSED_MANUAL: return 'STOP';
      default: return '';
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-950">
        <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-6" />
        <p className="font-black text-blue-500/60 uppercase tracking-[0.4em] text-xs">Tracks ophalen...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-900 p-10 text-center">
        <AlertCircle className="w-20 h-20 text-red-500 mb-6 opacity-20" />
        <h2 className="text-3xl font-game mb-4">OPGELET</h2>
        <p className="text-slate-400 font-bold mb-10 text-sm leading-relaxed">{error}</p>
        <button onClick={onExit} className="w-full max-w-xs glass py-5 rounded-2xl font-black uppercase tracking-widest text-xs">Ander menu / Playlist</button>
      </div>
    );
  }

  const currentTrack = tracks[currentTrackIndex];

  return (
    <div className={`flex flex-col h-full transition-colors duration-1000 ${getStatusColor()} relative overflow-hidden`}>
      {settings.theme === Theme.CHRISTMAS && <Snowfall />}

      <div className="p-6 flex items-center justify-between z-20">
        <button onClick={onExit} className="p-3 bg-black/20 backdrop-blur-md rounded-2xl border border-white/10 active:scale-90 transition-transform">
          <ChevronLeft className="w-8 h-8 text-white" />
        </button>
        <div className="text-center">
          <h2 className="font-game text-2xl tracking-tighter text-white drop-shadow-xl">BEATSTOP</h2>
        </div>
        <div className="w-14 h-14 flex items-center justify-center">
           <Volume2 className="text-white/20 w-6 h-6" />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8 z-10 text-center">
        <div className={`transition-all duration-1000 transform ${gameState === GameState.PLAYING ? 'scale-110' : 'scale-90 opacity-70'}`}>
          <div className="relative mb-16">
            <div className={`absolute -inset-10 rounded-full blur-[80px] transition-opacity duration-1000 ${gameState === GameState.PLAYING ? 'bg-white/20 opacity-100' : 'bg-transparent opacity-0'}`} />
            
            <div className={`relative z-10 w-64 h-64 md:w-80 md:h-80 transition-all duration-1000 ${gameState === GameState.PLAYING ? 'playing-indicator' : ''}`}>
              <img 
                src={currentTrack.albumArt} 
                alt="Album" 
                className={`w-full h-full rounded-[48px] shadow-2xl object-cover transition-all duration-1000 border-4 border-white/20 ${gameState === GameState.PLAYING ? '' : 'grayscale brightness-50'}`}
              />
              {gameState !== GameState.PLAYING && (
                <div className="absolute inset-0 flex items-center justify-center z-20">
                  <Pause className="w-24 h-24 text-white drop-shadow-2xl opacity-60" />
                </div>
              )}
            </div>
          </div>

          <h1 className="text-7xl font-game mb-4 tracking-tighter text-white drop-shadow-2xl uppercase">
            {getStatusText()}
          </h1>
          
          <div className="h-10">
            {gameState === GameState.PAUSED_AUTO ? (
              <p className="text-2xl font-black text-white bg-black/30 px-6 py-2 rounded-full uppercase tracking-tighter animate-bounce">
                Verder in {autoResumeTimeLeft}s
              </p>
            ) : (
              <p className="text-xl font-bold text-white/80 uppercase tracking-tight">
                {gameState === GameState.PLAYING ? 'Muziek speelt' : 'Muziek gestopt'}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="px-8 py-4 z-10">
         <div className="glass p-4 rounded-3xl flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center ${gameState === GameState.PLAYING ? 'animate-pulse' : ''}`}>
               <Music className="w-6 h-6 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0 text-left">
               <p className="text-white font-black text-xs truncate uppercase tracking-tight">{currentTrack.name}</p>
               <p className="text-white/40 text-[10px] font-bold truncate uppercase">{currentTrack.artist}</p>
            </div>
         </div>
      </div>

      <div className="p-8 z-20 pb-20">
        {gameState === GameState.IDLE ? (
          <button
            onClick={startMusic}
            className="w-full bg-white text-slate-950 py-8 rounded-[40px] font-game text-3xl shadow-2xl active:scale-95 transition-all uppercase tracking-tighter border-t-4 border-slate-200"
          >
            START
          </button>
        ) : (gameState === GameState.PAUSED_MANUAL) ? (
          <button
            onClick={startMusic}
            className="w-full bg-blue-500 text-white py-8 rounded-[40px] font-game text-3xl shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all uppercase tracking-tighter border-t-4 border-white/20"
          >
            VERDER
          </button>
        ) : (
          <div className="h-28 flex items-center justify-center">
             <div className="flex items-end gap-2 h-16">
               {[1,2,3,4,5,6,7,8,9,10].map(i => (
                 <div 
                  key={i} 
                  className={`w-2.5 bg-white/30 rounded-full transition-all duration-300`} 
                  style={{ 
                    height: gameState === GameState.PLAYING ? `${Math.random() * 80 + 20}%` : '10%',
                    animation: gameState === GameState.PLAYING ? `pulse 0.5s ease-in-out infinite alternate ${i * 0.05}s` : 'none'
                  }} 
                 />
               ))}
             </div>
          </div>
        )}
      </div>

      <audio 
        ref={audioRef} 
        src={currentTrack.previewUrl || ''} 
        onEnded={nextTrack}
        onError={handleAudioError}
        preload="auto"
        hidden
      />
    </div>
  );
};

export default GameView;
