
import React, { useState, useEffect, useRef } from 'react';
import { GameSettings, Theme, SpotifyUser, MusicMode, Track } from '../types';
import { fetchUserProfile } from '../services/spotifyService';
import { Clock, Palette, LogIn, CheckCircle2, Zap, Upload, Crown, Snowflake } from 'lucide-react';
import Snowfall from './Snowfall';

interface Props {
  settings: GameSettings;
  setSettings: (s: GameSettings) => void;
  onStart: () => void;
}

const SettingsView: React.FC<Props> = ({ settings, setSettings, onStart }) => {
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (settings.spotifyToken && settings.musicMode === MusicMode.SPOTIFY_PREMIUM) {
      fetchUserProfile(settings.spotifyToken).then(setUser);
    }
  }, [settings.spotifyToken, settings.musicMode]);

  const updateSetting = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    setSettings({ ...settings, [key]: value });
  };

  const handleLogin = () => {
    window.location.href = '/api/login';
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newTracks: Track[] = (Array.from(files) as File[]).map((file, index) => ({
      id: `local-${Date.now()}-${index}`,
      name: file.name.replace(/\.[^/.]+$/, ""),
      artist: 'Eigen Bestand',
      previewUrl: URL.createObjectURL(file), 
      albumArt: `https://picsum.photos/seed/${file.name}/400/400`,
      uri: ''
    }));

    setSettings({
      ...settings,
      localTracks: [...settings.localTracks, ...newTracks],
      musicMode: MusicMode.LOCAL_UPLOAD
    });
  };

  const triggerFileUpload = (e: React.MouseEvent) => {
    e.preventDefault();
    fileInputRef.current?.click();
  };

  return (
    <div className={`flex flex-col h-full transition-colors duration-1000 ${settings.theme === Theme.CHRISTMAS ? 'bg-red-950' : 'bg-slate-950'} p-6 overflow-y-auto landscape:pb-40 pb-48 relative scrollbar-hide`}>
      {settings.theme === Theme.CHRISTMAS && <Snowfall />}
      
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        multiple 
        accept=".mp3,.wav,.m4a,.aac,audio/*" 
        className="fixed opacity-0 pointer-events-none" 
      />

      <div className="flex flex-col items-center mb-6 mt-4 z-10 landscape:mt-2">
        <div className="relative">
          <div className={`absolute -inset-4 rounded-full blur-2xl opacity-20 ${settings.theme === Theme.CHRISTMAS ? 'bg-red-500' : 'bg-green-500'}`}></div>
          <Zap className={`w-10 h-10 relative z-10 ${settings.theme === Theme.CHRISTMAS ? 'text-red-500' : 'text-green-500'}`} />
        </div>
        <h1 className="text-3xl font-game tracking-tighter text-white mt-2 uppercase italic leading-none landscape:text-2xl">BEATSTOP</h1>
      </div>

      <div className="space-y-6 max-w-md mx-auto w-full z-10 landscape:grid landscape:grid-cols-2 landscape:gap-6 landscape:space-y-0 landscape:max-w-4xl">
        <div className="space-y-6">
          {/* Modus Selectie */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 rounded-[28px] glass">
            <button 
              onClick={() => updateSetting('musicMode', MusicMode.SPOTIFY_PREMIUM)}
              className={`flex flex-col items-center gap-1.5 py-4 rounded-[24px] transition-all ${settings.musicMode === MusicMode.SPOTIFY_PREMIUM ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' : 'text-slate-500'}`}
            >
              <Crown className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-widest">Spotify</span>
            </button>
            <button 
              onClick={() => updateSetting('musicMode', MusicMode.LOCAL_UPLOAD)}
              className={`flex flex-col items-center gap-1.5 py-4 rounded-[24px] transition-all ${settings.musicMode === MusicMode.LOCAL_UPLOAD ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'text-slate-500'}`}
            >
              <Upload className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-widest">Eigen MP3</span>
            </button>
          </div>

          {/* Thema Selectie */}
          <div className="glass p-5 rounded-[32px] space-y-4">
            <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
              <Palette className="w-3 h-3 text-white" /> Kies Sfeer
            </label>
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: Theme.STANDARD, icon: Zap, label: 'Modern', color: 'bg-green-500', shadow: 'bg-green-800' },
                { id: Theme.CHRISTMAS, icon: Snowflake, label: 'Kerst', color: 'bg-red-600', shadow: 'bg-red-900' }
              ].map((t) => (
                <button key={t.id} onClick={() => updateSetting('theme', t.id)} className="btn-3d-wrap h-16">
                  <div className={`btn-3d-top transition-colors ${settings.theme === t.id ? `${t.color} text-white` : 'bg-slate-900/50 text-slate-500 opacity-60'}`}>
                    <div className="flex flex-col items-center gap-1">
                      <t.icon className="w-4 h-4" />
                      <span className="text-[9px] font-black uppercase">{t.label}</span>
                    </div>
                  </div>
                  {settings.theme === t.id && <div className={`btn-3d-bottom ${t.shadow}`} />}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Music Context */}
          {settings.musicMode === MusicMode.SPOTIFY_PREMIUM ? (
            <div className="space-y-4">
              {!settings.spotifyToken ? (
                <button onClick={handleLogin} className="btn-3d-wrap h-16">
                  <div className="btn-3d-top bg-[#1DB954] text-black">
                     <LogIn className="w-5 h-5 mr-3" /> VERBIND SPOTIFY
                  </div>
                  <div className="btn-3d-bottom bg-green-800" />
                </button>
              ) : (
                <div className="glass p-4 rounded-3xl flex items-center justify-between border-green-500/30 border-2">
                  <div className="flex items-center gap-3">
                    <img src={user?.images[0]?.url || `https://ui-avatars.com/api/?name=U`} className="w-10 h-10 rounded-full border-2 border-green-500" />
                    <p className="font-bold text-sm text-white">{user?.display_name || 'Verbonden'}</p>
                  </div>
                  <CheckCircle2 className="text-green-500 w-5 h-5" />
                </div>
              )}
            </div>
          ) : (
            <button onClick={triggerFileUpload} className="btn-3d-wrap h-16">
              <div className="btn-3d-top bg-purple-600 text-white">
                 <Upload className="w-5 h-5 mr-3" /> MUZIEK KIEZEN
              </div>
              <div className="btn-3d-bottom bg-purple-900" />
            </button>
          )}

          {/* Timings */}
          <div className="glass p-5 rounded-[32px] space-y-4">
            <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
              <Clock className="w-3 h-3 text-green-500" /> Interval (sec)
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[8px] text-slate-500 text-center uppercase font-bold">Min</span>
                <input type="number" value={settings.minStopSeconds} onChange={(e) => updateSetting('minStopSeconds', Math.max(1, Number(e.target.value)))} className="bg-black/40 border border-white/10 rounded-2xl p-3 text-white text-center font-bold text-sm" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[8px] text-slate-500 text-center uppercase font-bold">Max</span>
                <input type="number" value={settings.maxStopSeconds} onChange={(e) => updateSetting('maxStopSeconds', Math.max(settings.minStopSeconds, Number(e.target.value)))} className="bg-black/40 border border-white/10 rounded-2xl p-3 text-white text-center font-bold text-sm" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center pb-4 z-10 landscape:mt-4">
        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white opacity-40 italic">© Corneel Konings</p>
      </div>

      <div className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent flex flex-col items-center z-50 landscape:p-4">
        <button
          onClick={onStart}
          disabled={(settings.musicMode === MusicMode.SPOTIFY_PREMIUM && !settings.spotifyToken) || (settings.musicMode === MusicMode.LOCAL_UPLOAD && settings.localTracks.length === 0)}
          className="btn-3d-wrap h-16 max-w-md disabled:opacity-30"
        >
          <div className="btn-3d-top bg-white text-black font-game text-xl uppercase italic tracking-tighter">START BEATSTOP</div>
          <div className="btn-3d-bottom bg-slate-300" />
        </button>
      </div>
    </div>
  );
};

export default SettingsView;
