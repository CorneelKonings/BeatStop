
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameSettings, GameState, Track, Theme } from '../types';
import { fetchPlaylistTracks, playTrackOnDevice } from '../services/spotifyService';
import { ChevronLeft, AlertCircle, Loader2, Music, RefreshCw, ShieldAlert } from 'lucide-react';
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
  
  const [player, setPlayer] = useState<any>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [statusMsg, setStatusMsg] = useState('Opstarten...');

  const stopTimerRef = useRef<any>(null);

  const setupPlayer = useCallback(() => {
    // Fix: Access Spotify SDK through (window as any) to avoid TypeScript error since it's loaded externally
    if (!(window as any).Spotify || !settings.spotifyToken) return;

    setStatusMsg('Koppelen met Spotify Player...');
    // Fix: Access Spotify SDK through (window as any) to avoid TypeScript error
    const newPlayer = new (window as any).Spotify.Player({
      name: 'BeatStop Console',
      getOAuthToken: (cb: any) => cb(settings.spotifyToken),
      volume: 0.7
    });

    newPlayer.addListener('ready', ({ device_id }: any) => {
      setDeviceId(device_id);
      setIsPlayerReady(true);
      setStatusMsg('Verbonden!');
    });

    newPlayer.addListener('authentication_error', () => setError('Sessie verlopen.'));
    newPlayer.addListener('account_error', () => setError('Spotify Premium vereist.'));
    newPlayer.connect();
    setPlayer(newPlayer);
  }, [settings.spotifyToken]);

  useEffect(() => {
    // Luister naar het event dat we in index.html hebben gemaakt
    const handleLoaded = () => setupPlayer();
    window.addEventListener('spotifySDKLoaded', handleLoaded);
    
    // Als het al klaar was (race condition)
    if ((window as any).spotifySDKReady) setupPlayer();

    return () => {
      window.removeEventListener('spotifySDKLoaded', handleLoaded);
      if (player) player.disconnect();
    };
  }, [setupPlayer]);

  useEffect(() => {
    const loadTracks = async () => {
      try {
        const fetched = await fetchPlaylistTracks(settings.playlistUrl, settings.spotifyToken);
        setTracks(settings.shuffle ? [...fetched].sort(() => Math.random() - 0.5) : fetched);
        setIsLoading(false);
      } catch (err: any) {
        setError(err.message);
        setIsLoading(false);
      }
    };
    loadTracks();
  }, [settings.playlistUrl, settings.spotifyToken, settings.shuffle]);

  const stopMusic = useCallback(async () => {
    if (player) await player.pause();
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    
    new Audio('https://actions.google.com/sounds/v1/emergency/emergency_siren_short_burst.ogg').play().catch(() => {});

    if (settings.autoResume) {
      setGameState(GameState.PAUSED_AUTO);
      setAutoResumeTimeLeft(settings.pauseDuration);
    } else {
      setGameState(GameState.PAUSED_MANUAL);
    }
  }, [player, settings.autoResume, settings.pauseDuration]);

  const startMusic = useCallback(async () => {
    if (!deviceId || !tracks.length) return;
    try {
      if (gameState === GameState.IDLE) {
        await playTrackOnDevice(settings.spotifyToken, deviceId, tracks[currentTrackIndex].uri);
      } else {
        await player.resume();
      }
      setGameState(GameState.PLAYING);
      const duration = Math.floor(Math.random() * (settings.maxStopSeconds - settings.minStopSeconds + 1)) + settings.minStopSeconds;
      stopTimerRef.current = setTimeout(stopMusic, duration * 1000);
    } catch (e: any) {
      setError(e.message);
    }
  }, [deviceId, tracks, currentTrackIndex, gameState, settings, player, stopMusic]);

  if (isLoading || !isPlayerReady) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-950 p-10 text-center">
        <Loader2 className="w-16 h-16 text-green-500 animate-spin mb-6" />
        <p className="font-game text-xl text-white mb-2 italic">BEATSTOP LADEN</p>
        <p className="text-green-500/60 font-black uppercase tracking-widest text-[10px]">{statusMsg}</p>
        <button onClick={() => window.location.reload()} className="mt-8 text-slate-500 text-xs flex items-center gap-2"><RefreshCw className="w-3 h-3"/> HERLADEN BIJ FOUT</button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-950 p-10 text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-6" />
        <h2 className="font-game text-2xl mb-4 italic">SPOTIFY FOUT</h2>
        <p className="text-slate-400 text-sm mb-8">{error}</p>
        <button onClick={onExit} className="w-full glass py-5 rounded-2xl font-black uppercase text-xs">TERUG</button>
      </div>
    );
  }

  const track = tracks[currentTrackIndex];

  return (
    <div className={`flex flex-col h-full transition-all duration-1000 ${gameState === GameState.PLAYING ? 'bg-green-950' : 'bg-slate-950'} relative`}>
      {settings.theme === Theme.CHRISTMAS && <Snowfall />}
      <div className="p-6 flex items-center justify-between z-20">
        <button onClick={onExit} className="p-3 bg-black/40 rounded-2xl border border-white/10"><ChevronLeft className="w-8 h-8 text-white" /></button>
        <h2 className="font-game text-2xl text-white italic">BEATSTOP</h2>
        <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_green]" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8 z-10 text-center">
        <div className="relative mb-12">
          <div className={`absolute -inset-10 rounded-full blur-3xl transition-all duration-1000 ${gameState === GameState.PLAYING ? 'bg-green-500/30' : 'bg-transparent'}`} />
          <img src={track.albumArt} className={`w-64 h-64 rounded-[48px] shadow-2xl border-4 border-white/10 transition-all ${gameState === GameState.PLAYING ? 'scale-110' : 'grayscale brightness-50'}`} />
        </div>
        <h1 className="text-7xl font-game text-white uppercase italic">{gameState === GameState.PLAYING ? 'BEAT!' : 'STOP'}</h1>
      </div>

      <div className="p-8 z-20 pb-20">
        <button onClick={startMusic} className={`w-full py-8 rounded-[40px] font-game text-3xl shadow-2xl transition-all ${gameState === GameState.PLAYING ? 'hidden' : 'bg-white text-black'}`}>
          {gameState === GameState.IDLE ? 'START MUZIEK' : 'DOORGAAN'}
        </button>
      </div>
    </div>
  );
};

export default GameView;
