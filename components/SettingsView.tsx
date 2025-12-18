
import React, { useState, useEffect } from 'react';
import { GameSettings, Theme, SpotifyUser } from '../types';
import { fetchUserProfile } from '../services/spotifyService';
import { Clock, Palette, Music, LogIn, CheckCircle2, Zap, Shuffle } from 'lucide-react';

interface Props {
  settings: GameSettings;
  setSettings: (s: GameSettings) => void;
  onStart: () => void;
}

const SettingsView: React.FC<Props> = ({ settings, setSettings, onStart }) => {
  const [user, setUser] = useState<SpotifyUser | null>(null);

  useEffect(() => {
    if (settings.spotifyToken) {
      fetchUserProfile(settings.spotifyToken).then(setUser);
    }
  }, [settings.spotifyToken]);

  const updateSetting = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    setSettings({ ...settings, [key]: value });
  };

  const handleLogin = () => {
    window.location.href = '/api/login';
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 p-6 overflow-y-auto pb-40">
      <div className="flex flex-col items-center mb-8 mt-6">
        <div className="relative">
          <div className="absolute -inset-4 bg-green-500 rounded-full blur-2xl opacity-20"></div>
          <Zap className="w-12 h-12 text-green-500 relative z-10" />
        </div>
        <h1 className="text-4xl font-game tracking-tighter text-white mt-4 uppercase">BEATSTOP</h1>
        <p className="text-[10px] font-black text-slate-500 tracking-[0.3em] uppercase mt-2">Spotify Powered</p>
      </div>

      <div className="space-y-6 max-w-md mx-auto w-full">
        {/* Spotify Connection */}
        {!settings.spotifyToken ? (
          <button 
            onClick={handleLogin}
            className="w-full bg-[#1DB954] text-black py-5 rounded-3xl font-black flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-green-900/20"
          >
            <LogIn className="w-6 h-6" /> VERBIND MET SPOTIFY
          </button>
        ) : (
          <div className="glass p-4 rounded-[32px] flex items-center justify-between border-green-500/30 border-2">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-green-500">
                <img src={user?.images[0]?.url || `https://ui-avatars.com/api/?name=${user?.display_name || 'User'}`} alt="User" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase">Verbonden als</p>
                <p className="font-bold text-white leading-none">{user?.display_name || 'Spotify Gebruiker'}</p>
              </div>
            </div>
            <CheckCircle2 className="text-green-500 w-6 h-6" />
          </div>
        )}

        {/* Playlist Link */}
        <div className="glass p-5 rounded-[32px] space-y-4">
          <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">
            <Music className="w-3 h-3" /> Spotify Playlist Link
          </label>
          <input
            type="text"
            placeholder="Plak link hier..."
            value={settings.playlistUrl}
            onChange={(e) => updateSetting('playlistUrl', e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white font-medium text-sm focus:border-green-500 transition-colors"
          />
        </div>

        {/* Vibe Selection */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">
            <Palette className="w-3 h-3" /> Kies Thema
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: Theme.STANDARD, label: 'Party', icon: '🕺' },
              { id: Theme.CHRISTMAS, label: 'Kerst', icon: '🎄' }
            ].map(vibe => (
              <button
                key={vibe.id}
                onClick={() => updateSetting('theme', vibe.id)}
                className={`flex items-center justify-center gap-3 p-4 rounded-3xl border-2 transition-all ${
                  settings.theme === vibe.id 
                    ? `border-green-500 bg-green-500/10 text-white` 
                    : 'border-white/5 bg-white/5 text-slate-500'
                }`}
              >
                <span className="text-xl">{vibe.icon}</span>
                <span className="text-[10px] font-black uppercase">{vibe.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Shuffle Toggle */}
        <button 
          onClick={() => updateSetting('shuffle', !settings.shuffle)}
          className={`w-full p-5 rounded-3xl flex items-center justify-between border-2 transition-all ${settings.shuffle ? 'border-blue-500/50 bg-blue-500/5 text-white' : 'border-white/5 text-slate-500'}`}
        >
          <div className="flex items-center gap-3">
            <Shuffle className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase">Shuffle Playlist</span>
          </div>
          <div className={`w-10 h-6 rounded-full relative transition-colors ${settings.shuffle ? 'bg-blue-500' : 'bg-slate-800'}`}>
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.shuffle ? 'left-5' : 'left-1'}`} />
          </div>
        </button>

        {/* Timings */}
        <div className="glass p-5 rounded-[32px] space-y-4">
          <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
            <Clock className="w-3 h-3 text-green-500" /> Stop Interval (sec)
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-600 uppercase">Minimaal</span>
              <input
                type="number"
                value={settings.minStopSeconds}
                onChange={(e) => updateSetting('minStopSeconds', Math.max(1, Number(e.target.value)))}
                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-center font-bold"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-600 uppercase">Maximaal</span>
              <input
                type="number"
                value={settings.maxStopSeconds}
                onChange={(e) => updateSetting('maxStopSeconds', Math.max(settings.minStopSeconds, Number(e.target.value)))}
                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-center font-bold"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 w-full p-8 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent flex flex-col items-center z-50">
        <button
          onClick={onStart}
          disabled={!settings.spotifyToken || !settings.playlistUrl}
          className="w-full max-w-md bg-white text-black py-6 rounded-[32px] font-game text-2xl shadow-2xl active:scale-95 transition-all uppercase disabled:opacity-20 disabled:grayscale"
        >
          START GAME
        </button>
      </div>
    </div>
  );
};

export default SettingsView;
