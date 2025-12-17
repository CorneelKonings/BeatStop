
import React from 'react';
import { GameSettings, Theme, SpotifyUser } from '../types';
import { Music, Clock, Palette, Shuffle, Radio, LogOut, CheckCircle2, User } from 'lucide-react';

interface Props {
  settings: GameSettings;
  setSettings: (s: GameSettings) => void;
  onStart: () => void;
  user: SpotifyUser;
  onLogout: () => void;
}

const SettingsView: React.FC<Props> = ({ settings, setSettings, onStart, user, onLogout }) => {
  const updateSetting = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    setSettings({ ...settings, [key]: value });
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 p-6 overflow-y-auto pb-40">
      <div className="flex flex-col items-center mb-8 mt-6">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full blur opacity-75"></div>
          <div className="relative bg-slate-900 p-5 rounded-full ring-1 ring-white/10 shadow-2xl">
            <Radio className="w-10 h-10 text-blue-400" />
          </div>
        </div>
        <h1 className="text-5xl font-game tracking-tighter text-white mt-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">BEATSTOP</h1>
      </div>

      <div className="space-y-6 max-w-md mx-auto w-full">
        {/* User Badge */}
        <div className="glass p-4 rounded-3xl flex items-center justify-between border-green-500/20 bg-green-500/5">
          <div className="flex items-center gap-3">
            {user.images?.[0] ? (
              <img src={user.images[0].url} className="w-10 h-10 rounded-full border border-white/20" alt="Profile" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                <User className="w-5 h-5 text-slate-500" />
              </div>
            )}
            <div>
              <p className="text-[9px] font-black text-green-500 uppercase tracking-widest">Ingelogd als</p>
              <p className="text-sm text-white font-bold">{user.display_name}</p>
            </div>
          </div>
          <button onClick={onLogout} className="p-3 text-slate-500 hover:text-red-400 transition-colors bg-white/5 rounded-2xl">
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Playlist Link */}
        <div className="glass p-5 rounded-3xl space-y-3 shadow-xl">
          <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
            <Music className="w-3 h-3 text-blue-500" /> Spotify Playlist
          </label>
          <input
            type="text"
            value={settings.playlistUrl}
            onChange={(e) => updateSetting('playlistUrl', e.target.value)}
            placeholder="Plak Spotify playlist URL..."
            className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white placeholder:text-slate-600 focus:border-blue-500 outline-none transition-all text-sm font-bold"
          />
        </div>

        {/* Timings */}
        <div className="glass p-5 rounded-3xl space-y-4 shadow-xl border-l-4 border-blue-500">
          <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
            <Clock className="w-3 h-3 text-blue-500" /> Stop Interval (sec)
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-600 uppercase">Minimaal</span>
              <input
                type="number"
                value={settings.minStopSeconds}
                onChange={(e) => updateSetting('minStopSeconds', Math.max(1, Number(e.target.value)))}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-center font-bold"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-600 uppercase">Maximaal</span>
              <input
                type="number"
                value={settings.maxStopSeconds}
                onChange={(e) => updateSetting('maxStopSeconds', Math.max(settings.minStopSeconds, Number(e.target.value)))}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-center font-bold"
              />
            </div>
          </div>
        </div>

        {/* Extra opties */}
        <div className="grid grid-cols-2 gap-4 pb-10">
           <button 
             onClick={() => updateSetting('shuffle', !settings.shuffle)}
             className={`glass p-4 rounded-3xl flex items-center justify-between transition-all ${settings.shuffle ? 'border-blue-500/50 bg-blue-500/5' : ''}`}
           >
             <div className="flex flex-col items-start gap-1">
               <Shuffle className={`w-4 h-4 ${settings.shuffle ? 'text-blue-400' : 'text-slate-600'}`} />
               <span className="text-[9px] font-black uppercase">Shuffle</span>
             </div>
             <div className={`w-8 h-5 rounded-full p-1 transition-colors ${settings.shuffle ? 'bg-blue-600' : 'bg-slate-800'}`}>
               <div className={`w-3 h-3 bg-white rounded-full transition-transform ${settings.shuffle ? 'translate-x-3' : 'translate-x-0'}`} />
             </div>
           </button>

           <button 
             onClick={() => updateSetting('theme', settings.theme === Theme.STANDARD ? Theme.CHRISTMAS : Theme.STANDARD)}
             className={`glass p-4 rounded-3xl flex items-center justify-between transition-all ${settings.theme === Theme.CHRISTMAS ? 'border-red-500/50 bg-red-500/5' : ''}`}
           >
             <div className="flex flex-col items-start gap-1">
               <Palette className={`w-4 h-4 ${settings.theme === Theme.CHRISTMAS ? 'text-red-400' : 'text-slate-600'}`} />
               <span className="text-[9px] font-black uppercase">X-MAS</span>
             </div>
             <div className={`w-8 h-5 rounded-full p-1 transition-colors ${settings.theme === Theme.CHRISTMAS ? 'bg-red-600' : 'bg-slate-800'}`}>
               <div className={`w-3 h-3 bg-white rounded-full transition-transform ${settings.theme === Theme.CHRISTMAS ? 'translate-x-3' : 'translate-x-0'}`} />
             </div>
           </button>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 w-full p-8 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent flex flex-col items-center z-50">
        <button
          onClick={onStart}
          className="w-full max-w-md py-6 rounded-[32px] font-game text-2xl shadow-2xl transition-all uppercase tracking-widest border-t border-white/20 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white shadow-blue-900/50"
        >
          START GAME
        </button>
      </div>
    </div>
  );
};

export default SettingsView;
