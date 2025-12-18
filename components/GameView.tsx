
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameSettings, GameState, Track, Theme } from '../types';
import { fetchPlaylistTracks, playTrackOnDevice } from '../services/spotifyService';
import { Play, Pause, ChevronLeft, AlertCircle, Loader2, Music, Volume2, ShieldAlert, RefreshCw } from 'lucide-react';
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
  const [connectionStatus, setConnectionStatus] = useState('Initialiseren...');

  const stopTimerRef = useRef<any>(null);

  const initSpotifyPlayer = useCallback(() => {
    if (!settings.spotifyToken) return;

    setConnectionStatus('Wachten op Spotify SDK...');

    const setupPlayer = () => {
      if (!window.Spotify) {
        setConnectionStatus('SDK niet gevonden, herproberen...');
        setTimeout(setupPlayer, 1000);
        return;
      }

      const newPlayer = new window.Spotify.Player({
        name: 'BeatStop Game Player',
        getOAuthToken: (cb: any) => { cb(settings.spotifyToken); },
        volume: 0.7
      });

      newPlayer.addListener('ready', ({ device_id }: { device_id: string }) => {
        console.log('Spotify Player Ready:', device_id);
        setDeviceId(device_id);
        setIsPlayerReady(true);
        setConnectionStatus('Verbonden!');
      });

      newPlayer.addListener('not_ready', ({ device_id }: { device_id: string }) => {
        setConnectionStatus('Verbinding verloren...');
        setIsPlayerReady(false);
      });

      newPlayer.addListener('initialization_error', ({ message }: any) => { 
        console.error('Init Error:', message);
        setError("Kon speler niet initialiseren. Heb je een actieve internetverbinding?"); 
      });

      newPlayer.addListener('authentication_error', ({ message }: any) => { 
        setError("Sessie verlopen. Log opnieuw in op het hoofdscherm."); 
      });

      newPlayer.addListener('account_error', ({ message }: any) => { 
        setIsPremium(false);
        setError("Spotify Premium is vereist voor de 'Full Song' modus.");
      });

      newPlayer.connect().then((success: boolean) => {
        if (success) {
          setConnectionStatus('Systeem koppelen...');
        }
      });
      setPlayer(newPlayer);
    };

    if (window.Spotify) {
      setupPlayer();
    } else {
      window.onSpotifyWebPlaybackSDKReady = setupPlayer;
    }
  }, [settings.spotifyToken]);

  // 1. Initialiseer Spotify Player SDK
  useEffect(() => {
    initSpotifyPlayer();
    return () => {
      if (player) {
        player.disconnect();
      }
    };
  }, [initSpotifyPlayer]);

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
    if (!player || !isPlayerReady || !deviceId) {
      alert("Speler is nog niet klaar. Momentje geduld...");
      return;
    }

    try {
      if (gameState === GameState.IDLE) {
        await playTrackOnDevice(settings.spotifyToken, deviceId, tracks[currentTrackIndex].uri);
      } else {
        await player.resume();
      }
      
      setGameState(GameState.PLAYING);
      scheduleNextStop();
    } catch (e) {
      console.error(e);
      setError("Kon muziek niet starten. Check je internet en Spotify account.");
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
    if (gameState === GameState.PLAYING) return settings.theme === Theme.CHRISTMAS ? 'bg-red-900' : 'bg-green-950';
    if (gameState === GameState.PAUSED_AUTO || gameState === GameState.PAUSED_MANUAL) return 'bg-orange-600';
    return 'bg-slate-950';
  };

  if (isLoading || !isPlayerReady) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-950 p-10 text-center">
        <div className="relative mb-10">
          <div className="absolute -inset-8 bg-green-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
          <Loader2 className="w-20 h-20 text-green-500 animate-spin relative z-10" />
        </div>
        <p className="font-game text-xl text-white mb-2 uppercase italic tracking-tighter">Even geduld...</p>
        <p className="font-black text-green-500/60 uppercase tracking-[0.3em] text-[10px] mb-8">{connectionStatus}</p>
        
        <div className="max-w-xs w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-left space-y-3">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${tracks.length > 0 ? 'bg-green-500' : 'bg-slate-700'}`}></div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Playlist laden</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${window.Spotify ? 'bg-green-500' : 'bg-slate-700'}`}></div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Spotify Engine</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${deviceId ? 'bg-green-500' : 'bg-slate-700'}`}></div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Audio koppeling</p>
          </div>
        </div>

        <button 
          onClick={() => window.location.reload()}
          className="mt-10 flex items-center gap-2 text-slate-500 font-bold text-xs uppercase hover:text-white transition-colors"
        >
          <RefreshCw className="w-3 h-3" /> Herladen als het te lang duurt
        </button>
      </div>
    );
  }

  if (error || !isPremium) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-950 p-10 text-center">
        <div className="bg-red-500/10 p-8 rounded-full mb-8">
           {!isPremium ? <ShieldAlert className="w-20 h-20 text-orange-500" /> : <AlertCircle className="w-20 h-20 text-red-500" />}
        </div>
        <h2 className="text-3xl font-game mb-4 uppercase italic tracking-tighter">{!isPremium ? 'PREMIUM NODIG' : 'FOUTJE'}</h2>
        <p className="text-slate-400 font-bold mb-10 text-sm leading-relaxed max-w-xs mx-auto">
          {error || "De Spotify Player SDK werkt alleen met een Premium account. Gebruik een Premium login voor de volledige ervaring."}
        </p>
        <button onClick={onExit} className="w-full max-w-xs glass py-6 rounded-3xl font-black uppercase tracking-widest text-xs border-white/20">TERUG NAAR MENU</button>
      </div>
    );
  }

  const currentTrack = tracks[currentTrackIndex];

  return (
    <div className={`flex flex-col h-full transition-colors duration-1000 ${getStatusColor()} relative overflow-hidden`}>
      {settings.theme === Theme.CHRISTMAS && <Snowfall />}

      <div className="p-6 flex items-center justify-between z-20">
        <button onClick={onExit} className="p-3 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 active:scale-90 transition-transform">
          <ChevronLeft className="w-8 h-8 text-white" />
        </button>
        <div className="text-center">
          <h2 className="font-game text-2xl tracking-tighter text-white drop-shadow-xl italic">BEATSTOP</h2>
        </div>
        <div className="w-14 h-14 flex items-center justify-center">
           <div className={`w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]`} />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8 z-10 text-center">
        <div className={`transition-all duration-1000 transform ${gameState === GameState.PLAYING ? 'scale-110' : 'scale-95 opacity-70'}`}>
          <div className="relative mb-12">
            <div className={`absolute -inset-20 rounded-full blur-[100px] transition-all duration-1000 ${gameState === GameState.PLAYING ? 'bg-green-500/40 opacity-100 scale-125' : 'bg-transparent opacity-0 scale-50'}`} />
            
            <div className={`relative z-10 w-64 h-64 md:w-80 md:h-80 transition-all duration-1000 ${gameState === GameState.PLAYING ? 'playing-indicator' : ''}`}>
              <img 
                src={currentTrack.albumArt} 
                alt="Album" 
                className={`w-full h-full rounded-[60px] shadow-2xl object-cover transition-all duration-1000 border-4 border-white/10 ${gameState === GameState.PLAYING ? '' : 'grayscale brightness-50 contrast-125'}`}
              />
              {gameState !== GameState.PLAYING && (
                <div className="absolute inset-0 flex items-center justify-center z-20">
                  <Pause className="w-24 h-24 text-white drop-shadow-2xl opacity-40" />
                </div>
              )}
            </div>
          </div>

          <h1 className="text-8xl font-game mb-4 tracking-tighter text-white drop-shadow-2xl uppercase italic">
            {gameState === GameState.IDLE ? 'READY?' : (gameState === GameState.PLAYING ? 'BEAT!' : 'STOP')}
          </h1>
          
          <div className="h-10">
            {gameState === GameState.PAUSED_AUTO && (
              <p className="text-2xl font-black text-white bg-white/10 backdrop-blur-md px-8 py-3 rounded-full uppercase tracking-tighter animate-bounce border border-white/20">
                Verder in {autoResumeTimeLeft}s
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="px-8 py-4 z-10">
         <div className="glass p-6 rounded-[48px] flex items-center gap-5 border-t border-white/20 shadow-2xl bg-black/40">
            <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center ${gameState === GameState.PLAYING ? 'animate-pulse' : ''}`}>
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
            className="w-full bg-white text-black py-8 rounded-[40px] font-game text-3xl shadow-2xl active:scale-95 transition-all uppercase tracking-tighter border-b-8 border-slate-300"
          >
            {gameState === GameState.IDLE ? 'START MUZIEK' : 'VERDER GAAN'}
          </button>
        ) : (
          <div className="h-28 flex items-center justify-center">
             <div className="flex items-end gap-3 h-20">
               {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map(i => (
                 <div 
                  key={i} 
                  className={`w-3 bg-white/20 rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.1)]`} 
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
