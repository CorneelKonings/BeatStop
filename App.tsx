
import React, { useState, useEffect } from 'react';
import { GameSettings, Theme, MusicMode } from './types';
import SettingsView from './components/SettingsView';
import GameView from './components/GameView';
import { SPOTIFY_CONFIG } from './config';

const DEFAULT_SETTINGS: GameSettings = {
  minStopSeconds: 15,
  maxStopSeconds: 45,
  pauseDuration: 5,
  autoResume: false,
  theme: Theme.STANDARD,
  playlistUrl: SPOTIFY_CONFIG.DEFAULT_PLAYLIST,
  spotifyToken: '',
  shuffle: true,
  musicMode: MusicMode.LOCAL_UPLOAD,
  localTracks: []
};

const App: React.FC = () => {
  const [inGame, setInGame] = useState(false);
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      setSettings(prev => ({ ...prev, spotifyToken: token, musicMode: MusicMode.SPOTIFY_PREMIUM }));
      window.history.replaceState({}, document.title, "/");
    }
  }, []);

  return (
    <div className="fixed inset-0 select-none touch-none bg-slate-950 text-white overflow-hidden">
      {!inGame ? (
        <SettingsView 
          settings={settings} 
          setSettings={setSettings} 
          onStart={() => setInGame(true)}
        />
      ) : (
        <GameView 
          settings={settings} 
          onExit={() => setInGame(false)}
          setSettings={setSettings}
        />
      )}
    </div>
  );
};

export default App;
