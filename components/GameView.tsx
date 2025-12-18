
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameSettings, GameState, Track, Theme } from '../types';
import { fetchPlaylistTracks, playTrackOnDevice } from '../services/spotifyService';
import { Play, Pause, ChevronLeft, AlertCircle, Loader2, Music, Volume2, ShieldAlert } from 'lucide-react';
import Snowfall from './Snowfall';

interface Props {
  settings: GameSettings;
  onExit: () => void;
}

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: any;
  }
}

const GameView: React.FC<Props> = ({ settings, onExit }) => {
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoResumeTimeLeft, setAutoResumeTimeLeft] = useState<number | null>(null);
  const [isPremium, setIsPremium] = useState(true);
  
  // SDK States
  const [player, setPlayer] = useState<any>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  const stopTimerRef = useRef<any>(null);

  // 1. Initialiseer Spotify Player SDK
  useEffect(() => {
    window.onSpotifyWebPlaybackSDKReady = () => {
      const newPlayer = new window.Spotify.Player({
        name: 'BeatStop Game Player',
        getOAuthToken: (cb: any) => { cb(settings.spotifyToken); },
        volume: 0.8
      });

      newPlayer.addListener('ready', ({ device_id }: { device_id: string }) => {
        console.log('Ready with Device ID', device_id);
        setDeviceId(device_id);
        setIsPlayerReady(true);
      });

      newPlayer.addListener('not_ready', ({ device_id }: { device_id: string }) => {
        console.log('Device ID has gone offline', device_id);
      });

      newPlayer.addListener('initialization_error', ({ message }: any) => { console.error(message); });
      newPlayer.addListener('authentication_error', ({ message }: any) => { 
        setError("Spotify login mislukt. Log opnieuw in."); 
      });
      newPlayer.addListener('account_error', ({ message }: any) => { 
        setIsPremium(false);
        setError("Spotify Premium is vereist voor volledige nummers.");
      });

      newPlayer.connect();
      setPlayer(newPlayer);
    };

    return () => {
      if (player) player.disconnect();
    };
  }, [settings.spotifyToken]);

  // 2. Laad Tracks
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
    const nextIdx = (currentTrackIndex + 1) % tracks.length;
    setCurrentTrackIndex(nextIdx);
    if (deviceId && isPlayerReady) {
       playTrackOnDevice(settings.spotifyToken, deviceId, tracks[nextIdx].uri);
    }
  }, [tracks, currentTrackIndex, deviceId, isPlayerReady, settings.spotifyToken]);

  const stopMusic = useCallback(async () => {
    if (player) {
      await player.pause();
    }
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    
    const sfxUrl = settings.theme === Theme.CHRISTMAS 
        ? 'https://actions.google.com/sounds/v1/alarms/bugle_tune.ogg' 
        : 'https://actions.google.com/sounds/v1/emergency/emergency_siren_short_burst.ogg';
    const sfx = new Audio(sfxUrl);
    sfx.volume = 0.8;
    sfx.play().catch(() => {});

    if (settings.autoResume) {
      setGameState(GameState.PAUSED_AUTO);
      setAutoResumeTimeLeft(settings.pauseDuration);
    } else {
      setGameState(GameState.PAUSED_MANUAL);
    }
  }, [player, settings.autoResume, settings.pauseDuration, settings.theme]);

  const scheduleNextStop = useCallback(() => {
    const duration = Math.floor(Math.random() * (settings.maxStopSeconds - settings.minStopSeconds + 1)) + settings.minStopSeconds;
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    stopTimerRef.current = setTimeout(() => {
      stopMusic();
    }, duration * 1000);
  }, [settings.maxStopSeconds, settings.minStopSeconds, stopMusic]);

  const startMusic = useCallback(async () => {
    if (!player || !isPlayerReady || !deviceId) return;

    try {
      if (gameState === GameState.IDLE) {
        // Eerste keer afspelen: forceer track via API naar de SDK device
        await playTrackOnDevice(settings.spotifyToken, deviceId, tracks[currentTrackIndex].uri);
      } else {
        // Hervatten van pauze
        await player.resume();
      }
      
      setGameState(GameState.PLAYING);
      scheduleNextStop();
    } catch (e) {
      console.error(e);
      setError("Kon muziek niet starten. Check of je Spotify Premium hebt.");
    }
  }, [player, isPlayerReady, deviceId, gameState, tracks, currentTrackIndex, settings.spotifyToken, scheduleNextStop]);

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
    if (gameState === GameState.PLAYING) return settings.theme === Theme.CHRISTMAS ? 'bg-red-900' : 'bg-green-900';
    if (gameState === GameState.PAUSED_AUTO || gameState === GameState.PAUSED_MANUAL) return 'bg-orange-600';
    return 'bg-slate-900';
  };

  if (isLoading || !isPlayerReady) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-950">
        <Loader2 className="w-16 h-16 text-green-500 animate-spin mb-6" />
        <p className="font-black text-green-500/60 uppercase tracking-[0.4em] text-xs">Spotify Player Verbinden...</p>
      </div>
    );
  }

  if (error || !isPremium) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-900 p-10 text-center">
        {!isPremium ? <ShieldAlert className="w-20 h-20 text-orange-500 mb-6" /> : <AlertCircle className="w-20 h-20 text-red-500 mb-6 opacity-20" />}
        <h2 className="text-3xl font-game mb-4">{!isPremium ? 'PREMIUM NODIG' : 'FOUTJE'}</h2>
        <p className="text-slate-400 font-bold mb-10 text-sm leading-relaxed">
          {error || "De Spotify Player vereist een Premium account om volledige nummers af te spelen."}
        </p>
        <button onClick={onExit} className="w-full max-w-xs glass py-5 rounded-2xl font-black uppercase tracking-widest text-xs">TERUG NAAR MENU</button>
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
          <h2 className="font-game text-2xl tracking-tighter text-white drop-shadow-xl italic">BEATSTOP</h2>
        </div>
        <div className="w-14 h-14 flex items-center justify-center">
           <div className={`w-3 h-3 rounded-full ${isPlayerReady ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} title="SDK Status" />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8 z-10 text-center">
        <div className={`transition-all duration-1000 transform ${gameState === GameState.PLAYING ? 'scale-110' : 'scale-95 opacity-70'}`}>
          <div className="relative mb-12">
            <div className={`absolute -inset-10 rounded-full blur-[80px] transition-opacity duration-1000 ${gameState === GameState.PLAYING ? 'bg-green-400/30 opacity-100' : 'bg-transparent opacity-0'}`} />
            
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

          <h1 className="text-8xl font-game mb-4 tracking-tighter text-white drop-shadow-2xl uppercase italic">
            {gameState === GameState.IDLE ? 'READY?' : (gameState === GameState.PLAYING ? 'BEAT!' : 'STOP')}
          </h1>
          
          <div className="h-10">
            {gameState === GameState.PAUSED_AUTO && (
              <p className="text-2xl font-black text-white bg-black/30 px-6 py-2 rounded-full uppercase tracking-tighter animate-bounce">
                Verder in {autoResumeTimeLeft}s
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="px-8 py-4 z-10">
         <div className="glass p-5 rounded-[40px] flex items-center gap-5 border-t border-white/10 shadow-2xl">
            <div className={`w-14 h-14 rounded-2xl bg-black/40 flex items-center justify-center ${gameState === GameState.PLAYING ? 'animate-pulse' : ''}`}>
               <Music className="w-7 h-7 text-green-400" />
            </div>
            <div className="flex-1 min-w-0 text-left">
               <p className="text-white font-black text-sm truncate uppercase tracking-tight italic">{currentTrack.name}</p>
               <p className="text-white/40 text-[11px] font-bold truncate uppercase tracking-widest">{currentTrack.artist}</p>
            </div>
         </div>
      </div>

      <div className="p-8 z-20 pb-20">
        {gameState === GameState.IDLE || gameState === GameState.PAUSED_MANUAL ? (
          <button
            onClick={startMusic}
            className="w-full bg-[#1DB954] text-black py-8 rounded-[40px] font-game text-3xl shadow-2xl active:scale-95 transition-all uppercase tracking-tighter border-t-4 border-green-400"
          >
            {gameState === GameState.IDLE ? 'START MUZIEK' : 'VERDER GAAN'}
          </button>
        ) : (
          <div className="h-28 flex items-center justify-center">
             <div className="flex items-end gap-2.5 h-16">
               {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => (
                 <div 
                  key={i} 
                  className={`w-2.5 bg-white/40 rounded-full transition-all duration-300`} 
                  style={{ 
                    height: gameState === GameState.PLAYING ? `${Math.random() * 80 + 20}%` : '15%',
                    animation: gameState === GameState.PLAYING ? `pulse 0.4s ease-in-out infinite alternate ${i * 0.04}s` : 'none'
                  }} 
                 />
               ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameView;
