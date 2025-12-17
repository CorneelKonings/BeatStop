
import React, { useState } from 'react';
import { GameSettings, Theme } from '../types';
import { Music, Clock, PlayCircle, Palette, Shuffle, Radio, Key, ChevronDown, ChevronUp, Info } from 'lucide-react';

interface Props {
  settings: GameSettings;
  setSettings: (s: GameSettings) => void;
  onStart: () => void;
}

const SettingsView: React.FC<Props> = ({ settings, setSettings, onStart }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateSetting = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    setSettings({ ...settings, [key]: value });
  };

  const hasToken = settings.spotifyToken && settings.spotifyToken.length > 5;

  return (
    <div className="flex flex-col h-full bg-slate-950 p-6 overflow-y-auto pb-40">
      <div className="flex flex-col items-center mb-10 mt-6">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000"></div>
          <div className="relative bg-slate-900 p-5 rounded-full ring-1 ring-white/10 shadow-2xl">
            <Radio className="w-10 h-10 text-blue-400" />
          </div>
        </div>
        <h1 className="text-5xl font-game tracking-tighter text-white mt-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">BEATSTOP</h1>
        <div className="bg-slate-800 px-4 py-1.5 rounded-full mt-2 border border-white/10 shadow-lg">
          <p className="text-slate-400 font-black text-[10px] tracking-[0.2em] uppercase">Smart Music Controller</p>
        </div>
      </div>

      <div className="space-y-6 max-w-md mx-auto w-full">
        {/* Playlist Link */}
        <div className="glass p-5 rounded-3xl space-y-3 shadow-xl">
          <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
            <Music className="w-3 h-3 text-blue-500" /> Spotify Bron
          </label>
          <input
            type="text"
            value={settings.playlistUrl}
            onChange={(e) => updateSetting('playlistUrl', e.target.value)}
            placeholder="Plak Spotify playlist URL..."
            className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white placeholder:text-slate-600 focus:border-blue-500 outline-none transition-all"
          />
        </div>

        {/* Timings */}
        <div className="glass p-5 rounded-3xl space-y-4 shadow-xl border-l-4 border-blue-500">
          <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
            <Clock className="w-3 h-3 text-blue-500" /> Interval Instellingen (sec)
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-600 uppercase">Min. Muziek</span>
              <input
                type="number"
                value={settings.minStopSeconds}
                onChange={(e) => updateSetting('minStopSeconds', Math.max(1, Number(e.target.value)))}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-center font-bold"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-600 uppercase">Max. Muziek</span>
              <input
                type="number"
                value={settings.maxStopSeconds}
                onChange={(e) => updateSetting('maxStopSeconds', Math.max(settings.minStopSeconds, Number(e.target.value)))}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-center font-bold"
              />
            </div>
          </div>
        </div>

        {/* API Key Status */}
        <div className="glass rounded-3xl overflow-hidden shadow-xl border border-white/5">
          <button 
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Key className={`w-4 h-4 ${hasToken ? 'text-green-500' : 'text-slate-400'}`} />
              <div className="text-left">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Spotify Token Status</span>
                <span className="text-[9px] text-slate-500 uppercase font-bold">{hasToken ? 'TOKEN ACTIEF (CODE)' : 'GEEN TOKEN (BEPERKTE MODUS)'}</span>
              </div>
            </div>
            {showAdvanced ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>
          
          {showAdvanced && (
            <div className="p-5 pt-0 space-y-4 animate-in fade-in slide-in-from-top-2">
              <p className="text-[10px] text-slate-500 leading-relaxed italic">
                De token is momenteel geladen vanuit <b>config.ts</b>. Je kunt hem hieronder handmatig overschrijven voor deze sessie.
              </p>
              <input
                type="password"
                value={settings.spotifyToken || ''}
                onChange={(e) => updateSetting('spotifyToken', e.target.value)}
                placeholder="Overschrijf token..."
                className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-white text-xs placeholder:text-slate-700 outline-none focus:border-blue-500"
              />
            </div>
          )}
        </div>

        {/* Stop Systeem */}
        <div className="glass p-5 rounded-3xl space-y-3 shadow-xl">
          <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
            <PlayCircle className="w-3 h-3 text-blue-500" /> Stop Systeem
          </label>
          <div className="flex gap-2 p-1 bg-black/40 rounded-2xl border border-white/5">
            <button
              onClick={() => updateSetting('autoResume', false)}
              className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${!settings.autoResume ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              HANDMATIG DOORGAAN
            </button>
            <button
              onClick={() => updateSetting('autoResume', true)}
              className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${settings.autoResume ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              AUTO-RESUME
            </button>
          </div>
        </div>

        {/* Opties */}
        <div className="grid grid-cols-2 gap-4 pb-10">
           <button 
             onClick={() => updateSetting('shuffle', !settings.shuffle)}
             className={`glass p-4 rounded-3xl flex items-center justify-between transition-all ${settings.shuffle ? 'border-blue-500/50 bg-blue-500/5' : ''}`}
           >
             <div className="flex flex-col items-start gap-1">
               <Shuffle className={`w-4 h-4 ${settings.shuffle ? 'text-blue-400' : 'text-slate-600'}`} />
               <span className="text-[9px] font-black uppercase">Shuffle</span>
             </div>
             <div className={`w-10 h-6 rounded-full p-1 transition-colors ${settings.shuffle ? 'bg-blue-600' : 'bg-slate-800'}`}>
               <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.shuffle ? 'translate-x-4' : 'translate-x-0'}`} />
             </div>
           </button>

           <button 
             onClick={() => updateSetting('theme', settings.theme === Theme.STANDARD ? Theme.CHRISTMAS : Theme.STANDARD)}
             className={`glass p-4 rounded-3xl flex items-center justify-between transition-all ${settings.theme === Theme.CHRISTMAS ? 'border-red-500/50 bg-red-500/5' : ''}`}
           >
             <div className="flex flex-col items-start gap-1">
               <Palette className={`w-4 h-4 ${settings.theme === Theme.CHRISTMAS ? 'text-red-400' : 'text-slate-600'}`} />
               <span className="text-[9px] font-black uppercase">Feest Modus</span>
             </div>
             <div className={`w-10 h-6 rounded-full p-1 transition-colors ${settings.theme === Theme.CHRISTMAS ? 'bg-red-600' : 'bg-slate-800'}`}>
               <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.theme === Theme.CHRISTMAS ? 'translate-x-4' : 'translate-x-0'}`} />
             </div>
           </button>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 w-full p-8 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent flex flex-col items-center z-50">
        <button
          onClick={onStart}
          className="w-full max-w-md bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-game text-2xl py-6 rounded-[32px] shadow-2xl shadow-blue-900/50 transition-all uppercase tracking-widest border-t border-white/20"
        >
          START BEATSTOP
        </button>
      </div>
    </div>
  );
};

export default SettingsView;
