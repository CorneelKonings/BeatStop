
import React, { useState, useEffect } from 'react';
import { GameSettings, Theme, SpotifyUser } from './types';
import SettingsView from './components/SettingsView';
import GameView from './components/GameView';
import { SPOTIFY_CONFIG } from './config';
import { fetchUserProfile } from './services/spotifyService';
import { LogIn, Radio } from 'lucide-react';

const DEFAULT_SETTINGS: GameSettings = {
  minStopSeconds: 20,
  maxStopSeconds: 60,
  pauseDuration: 5,
  autoResume: false,
  shuffle: true,
  theme: Theme.STANDARD,
  playlistUrl: SPOTIFY_CONFIG.DEFAULT_PLAYLIST,
  spotifyToken: ''
};

const App: React.FC = () => {
  const [inGame, setInGame] = useState(false);
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const params = new URLSearchParams(window.location.search);
      const tokenFromUrl = params.get('token');
      let currentToken = '';

      if (tokenFromUrl) {
        localStorage.setItem('spotify_access_token', tokenFromUrl);
        currentToken = tokenFromUrl;
        window.history.replaceState({}, document.title, "/");
      } else {
        currentToken = localStorage.getItem('spotify_access_token') || '';
      }

      if (currentToken) {
        const profile = await fetchUserProfile(currentToken);
        if (profile) {
          setUser(profile);
          setSettings(prev => ({ ...prev, spotifyToken: currentToken }));
        } else {
          // Token waarschijnlijk verlopen
          localStorage.removeItem('spotify_access_token');
        }
      }
      setIsInitialized(true);
    };

    initAuth();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('spotify_access_token');
    setSettings(prev => ({ ...prev, spotifyToken: '' }));
    setUser(null);
  };

  const handleLogin = () => {
    window.location.href = '/api/login';
  };

  if (!isInitialized) return null;

  // Login Gate
  if (!user) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center p-8 text-center">
        <div className="relative mb-12">
          <div className="absolute -inset-4 bg-blue-600 rounded-full blur-2xl opacity-20 animate-pulse"></div>
          <Radio className="w-20 h-20 text-blue-500 relative z-10" />
        </div>
        <h1 className="text-5xl font-game text-white mb-4">BEATSTOP</h1>
        <p className="text-slate-400 max-w-xs mb-12 font-bold text-sm leading-relaxed uppercase tracking-widest">
          De slimme stoelendans controller voor jouw feestjes.
        </p>
        <button
          onClick={handleLogin}
          className="w-full max-w-sm bg-[#1DB954] hover:bg-[#1ed760] text-black font-black py-6 rounded-[32px] flex items-center justify-center gap-4 transition-all active:scale-95 shadow-2xl shadow-green-900/40 text-lg"
        >
          <LogIn className="w-6 h-6" />
          LOG IN MET SPOTIFY
        </button>
        <p className="mt-8 text-[10px] text-slate-600 font-black uppercase tracking-[0.2em]">
          Vereist een Spotify account
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 select-none touch-none bg-slate-950">
      {!inGame ? (
        <SettingsView 
          settings={settings} 
          setSettings={setSettings} 
          onStart={() => setInGame(true)}
          user={user}
          onLogout={handleLogout}
        />
      ) : (
        <GameView 
          settings={settings} 
          onExit={() => setInGame(false)} 
        />
      )}
    </div>
  );
};

export default App;
