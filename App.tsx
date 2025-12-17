
import React, { useState } from 'react';
import { GameSettings, Theme } from './types';
import SettingsView from './components/SettingsView';
import GameView from './components/GameView';
import { SPOTIFY_CONFIG } from './config';

const DEFAULT_SETTINGS: GameSettings = {
  minStopSeconds: 20,
  maxStopSeconds: 60,
  pauseDuration: 5,
  autoResume: false, // Default is manual for full control
  shuffle: true,
  theme: Theme.STANDARD,
  playlistUrl: SPOTIFY_CONFIG.DEFAULT_PLAYLIST,
  spotifyToken: SPOTIFY_CONFIG.TOKEN
};

const App: React.FC = () => {
  const [inGame, setInGame] = useState(false);
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);

  return (
    <div className="fixed inset-0 select-none touch-none bg-slate-950">
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
        />
      )}
    </div>
  );
};

export default App;
