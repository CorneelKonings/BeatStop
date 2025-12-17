
import React, { useState } from 'react';
import { GameSettings, Theme } from './types';
import SettingsView from './components/SettingsView';
import GameView from './components/GameView';

/**
 * 🔑 SPOTIFY API KEY (CLIENT ACCESS TOKEN)
 * Plak hier je token als je de officiële API wilt gebruiken.
 * Je kunt een tijdelijke token ophalen op: https://developer.spotify.com/documentation/web-api/reference/get-playlist
 */
const HARDCODED_SPOTIFY_TOKEN = ""; 

const DEFAULT_SETTINGS: GameSettings = {
  minStopSeconds: 10,  // Ideaal voor stoelendans
  maxStopSeconds: 30,  // Houdt het spannend
  pauseDuration: 5,    // Alleen relevant bij autoResume
  autoResume: false,   // STANDAARD STOELENDANS: Handmatig starten voor de volgende ronde
  shuffle: true,
  theme: Theme.STANDARD,
  playlistUrl: 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M',
  spotifyToken: HARDCODED_SPOTIFY_TOKEN 
};

const App: React.FC = () => {
  const [inGame, setInGame] = useState(false);
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);

  return (
    <div className="fixed inset-0 select-none touch-none">
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
