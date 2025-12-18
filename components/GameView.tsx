
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameSettings, GameState, Track, Theme } from '../types';
import { fetchPlaylistTracks, playTrackOnDevice } from '../services/spotifyService';
import { ChevronLeft, AlertCircle, Loader2, Music, RefreshCw, ShieldAlert, CheckCircle2, Circle } from 'lucide-react';
import Snowfall from './Snowfall';

interface Props {
  settings: GameSettings;
  onExit: () => void;
}

const GameView: React.FC<Props> = ({ settings, onExit }) => {
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isLoadingTracks, setIsLoadingTracks] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoResumeTimeLeft, setAutoResumeTimeLeft] = useState<number | null>(null);
  
  const [player, setPlayer] = useState<any>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(!!(window as any).spotifySDKReady);
  const [statusMsg, setStatusMsg] = useState('Opstarten...');

  const stopTimerRef = useRef<any>(null);

  const setupPlayer = useCallback(() => {
    if (!(window as any).Spotify || !settings.spotifyToken || player) return;

    setStatusMsg('Player configureren...');
    const newPlayer = new (window as any).Spotify.Player({
      name: 'BeatStop Console',
      getOAuthToken: (cb: any) => cb(settings.spotifyToken),
      volume: 0.7
    });

    newPlayer.addListener('ready', ({ device_id }: any) => {
      console.log('Spotify Device Ready:', device_id);
      setDeviceId(device_id);
      setIsPlayerReady(true);
      setStatusMsg('Klaar voor actie!');
    });

    newPlayer.addListener('not_ready', ({ device_id }: any) => {
      console.log('Device has gone offline', device_id);
      setIsPlayerReady(false);
    });

    newPlayer.addListener('initialization_error', ({ message }: any) => {
      console.error('Initialization Error:', message);
      setError('Kon de speler niet laden. Check je internetverbinding.');
    });

    newPlayer.addListener('authentication_error', ({ message }: any) => {
      console.error('Auth Error:', message);
      setError('Spotify sessie verlopen. Log opnieuw in.');
    });

    newPlayer.addListener('account_error', ({ message }: any) => {
      console.error('Account Error:', message);
      setError('Spotify Premium is vereist voor de "Volledige Nummers" modus.');
    });

    newPlayer.connect().then((success: boolean) => {
      if (!success) {
        setError('Kon geen verbinding maken met Spotify. Probeer de app te herstarten.');
      } else {
        setStatusMsg('Wachten op Spotify signaal...');
      }
    });

    setPlayer(newPlayer);
  }, [settings.spotifyToken, player]);

  // SDK Loading monitor
  useEffect(() => {
    const handleLoaded = () => {
      setSdkLoaded(true);
      setupPlayer();
    };

    window.addEventListener('spotifySDKLoaded', handleLoaded);
    
    // Polling als fallback
    const interval = setInterval(() => {
      if ((window as any).Spotify && (window as any).spotifySDKReady) {
        setSdkLoaded(true);
        setupPlayer();
        clearInterval(interval);
      }
    }, 500);

    return () => {
      window.removeEventListener('spotifySDKLoaded', handleLoaded);
      clearInterval(interval);
    };
  }, [setupPlayer]);

  // Track loading
  useEffect(() => {
    const loadTracks = async () => {
      try {
        const fetched = await fetchPlaylistTracks(settings.playlistUrl, settings.spotifyToken);
        setTracks(settings.shuffle ? [...fetched].sort(() => Math.random() - 0.5) : fetched);
        setIsLoadingTracks(false);
      } catch (err: any) {
        setError(err.message);
        setIsLoadingTracks(false);
      }
    };
    loadTracks();
  }, [settings.playlistUrl, settings.spotifyToken, settings.shuffle]);

  const stopMusic = useCallback(async () => {
    if (player) {
      try {
        await player.pause();
      } catch (e) {
        console.error("Pause failed", e);
      }
    }
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    
    // SFX
    new Audio('https://actions.google.com/sounds/v1/emergency/emergency_siren_short_burst.ogg').play().catch(() => {});

    if (settings.autoResume) {
      setGameState(GameState.PAUSED_AUTO);
      setAutoResumeTimeLeft(settings.pauseDuration);
    } else {
      setGameState(GameState.PAUSED_MANUAL);
    }
  }, [player, settings.autoResume, settings.pauseDuration]);

  const startMusic = useCallback(async () => {
    if (!deviceId || !tracks.length || !isPlayerReady) return;
    
    try {
      if (gameState === GameState.IDLE) {
        // Eerste start op dit device
        await playTrackOnDevice(settings.spotifyToken, deviceId, tracks[currentTrackIndex].uri);
      } else {
        // Hervatten na pauze
        await player.resume();
      }
      
      setGameState(GameState.PLAYING);
      const duration = Math.floor(Math.random() * (settings.maxStopSeconds - settings.minStopSeconds + 1)) + settings.minStopSeconds;
      stopTimerRef.current = setTimeout(stopMusic, duration * 1000);
    } catch (e: any) {
      setError(e.message || "Kon muziek niet starten.");
    }
  }, [deviceId, tracks, currentTrackIndex, gameState, settings, player, stopMusic, isPlayerReady]);

  // Cleanup on exit
  useEffect(() => {
    return () => {
      if (player) {
        player.disconnect();
      }
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    };
  }, [player]);

  // Progress steps for UI
  const steps = [
    { label: 'Playlist ophalen', done: !isLoadingTracks },
    { label: 'Spotify Engine laden', done: sdkLoaded },
    { label: 'Audio kanaal koppelen', done: isPlayerReady }
  ];

  if (isLoadingTracks || !isPlayerReady) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-950 p-10 text-center">
        <div className="relative mb-10">
           <div className="absolute -inset-10 bg-green-500/20 rounded-full blur-3xl animate-pulse" />
           <Loader2 className="w-20 h-20 text-green-500 animate-spin relative z-10" />
        </div>
        
        <h2 className="font-game text-2xl text-white mb-8 italic tracking-tighter">VERBINDEN...</h2>
        
        <div className="w-full max-w-xs space-y-4">
          {steps.map((step, i) => (
            <div key={i} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${step.done ? 'bg-green-500/10 border-green-500/20' : 'bg-white/5 border-white/5 opacity-50'}`}>
               {step.done ? <CheckCircle2 className="text-green-500 w-5 h-5" /> : <Circle className="text-slate-600 w-5 h-5 animate-pulse" />}
               <span className={`text-xs font-black uppercase tracking-widest ${step.done ? 'text-green-500' : 'text-slate-400'}`}>
                 {step.label}
               </span>
            </div>
          ))}
        </div>

        <p className="mt-10 text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em]">{statusMsg}</p>
        
        <button 
          onClick={() => window.location.reload()} 
          className="mt-12 text-slate-400 hover:text-white transition-colors text-xs flex items-center gap-2 font-bold uppercase"
        >
          <RefreshCw className="w-3 h-3" /> Herladen als het hangt
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-950 p-10 text-center">
        <div className="bg-red-500/10 p-10 rounded-full mb-8">
           <ShieldAlert className="w-16 h-16 text-red-500" />
        </div>
        <h2 className="font-game text-2xl mb-4 italic uppercase">STOP! ER IS EEN FOUT</h2>
        <p className="text-slate-400 text-sm mb-10 max-w-xs mx-auto leading-relaxed font-bold">{error}</p>
        <button 
          onClick={onExit} 
          className="w-full max-w-xs bg-white text-black py-6 rounded-3xl font-black uppercase text-xs shadow-2xl active:scale-95 transition-transform"
        >
          TERUG NAAR MENU
        </button>
      </div>
    );
  }

  const track = tracks[currentTrackIndex];

  return (
    <div className={`flex flex-col h-full transition-all duration-1000 ${gameState === GameState.PLAYING ? 'bg-green-950' : 'bg-slate-950'} relative`}>
      {settings.theme === Theme.CHRISTMAS && <Snowfall />}
      
      <div className="p-6 flex items-center justify-between z-20">
        <button onClick={onExit} className="p-3 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 active:scale-90 transition-transform">
          <ChevronLeft className="w-8 h-8 text-white" />
        </button>
        <h2 className="font-game text-2xl text-white italic drop-shadow-xl">BEATSTOP</h2>
        <div className="w-4 h-4 rounded-full bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)]" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8 z-10 text-center">
        <div className={`transition-all duration-1000 transform ${gameState === GameState.PLAYING ? 'scale-110' : 'scale-95 opacity-80'}`}>
          <div className="relative mb-12">
            <div className={`absolute -inset-20 rounded-full blur-[100px] transition-all duration-1000 ${gameState === GameState.PLAYING ? 'bg-green-500/40 opacity-100' : 'bg-transparent opacity-0'}`} />
            <img 
              src={track.albumArt} 
              alt="Album Art"
              className={`w-64 h-64 md:w-80 md:h-80 rounded-[60px] shadow-2xl border-4 border-white/10 transition-all duration-1000 ${gameState === GameState.PLAYING ? 'rotate-0' : 'grayscale brightness-50 contrast-125'}`} 
            />
          </div>
          <h1 className="text-8xl font-game text-white uppercase italic drop-shadow-2xl tracking-tighter">
            {gameState === GameState.PLAYING ? 'BEAT!' : 'STOP'}
          </h1>
        </div>
      </div>

      <div className="p-10 z-20 pb-20">
        <button 
          onClick={startMusic} 
          className={`w-full py-8 rounded-[40px] font-game text-3xl shadow-2xl transition-all active:scale-95 ${gameState === GameState.PLAYING ? 'hidden' : 'bg-white text-black border-b-8 border-slate-300'}`}
        >
          {gameState === GameState.IDLE ? 'START MUZIEK' : 'DOORGAAN'}
        </button>
        
        {gameState === GameState.PLAYING && (
          <div className="flex items-center justify-center gap-1.5 h-16">
            {[1,2,3,4,5,6].map(i => (
              <div 
                key={i} 
                className="w-2 bg-white/30 rounded-full animate-bounce" 
                style={{ height: '60%', animationDelay: `${i * 0.1}s` }} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GameView;
