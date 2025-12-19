
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
    <div className={`flex flex-col h-full transition-colors duration-1000 ${settings.theme === Theme.CHRISTMAS ? 'bg-red-950' : 'bg-slate-950'} relative overflow-hidden`}>
      {settings.theme === Theme.CHRISTMAS && <Snowfall />}
      
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        multiple 
        accept=".mp3,.wav,.m4a,.aac,audio/*" 
        className="fixed opacity-0 pointer-events-none" 
      />

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-6 pt-10 pb-48 landscape:pb-32">
        
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-10 z-10 landscape:mb-16">
          <div className="relative">
            <div className={`absolute -inset-8 rounded-full blur-3xl opacity-30 ${settings.theme === Theme.CHRISTMAS ? 'bg-red-500' : 'bg-green-500'}`}></div>
            <Zap className={`w-14 h-14 relative z-10 landscape:w-20 landscape:h-20 ${settings.theme === Theme.CHRISTMAS ? 'text-red-500' : 'text-green-500'}`} />
          </div>
          <h1 className="text-4xl font-game tracking-tighter text-white mt-4 uppercase italic leading-none landscape:text-6xl landscape:mt-6">BEATSTOP</h1>
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white opacity-40 mt-3 landscape:text-xs">Smart Party Controller</p>
        </div>

        {/* Dashboard Grid */}
        <div className="max-w-md mx-auto w-full z-10 space-y-6 landscape:max-w-6xl landscape:grid landscape:grid-cols-2 landscape:gap-12 landscape:space-y-0">
          
          {/* Kolom Links: Modus & Thema */}
          <div className="space-y-6 landscape:space-y-8">
            {/* Modus Selectie */}
            <div className="glass p-2 rounded-[36px] flex flex-col gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-6 pt-4 mb-2">Afspeel Modus</span>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => updateSetting('musicMode', MusicMode.SPOTIFY_PREMIUM)}
                  className={`flex flex-col items-center gap-2 py-6 rounded-[28px] transition-all ${settings.musicMode === MusicMode.SPOTIFY_PREMIUM ? 'bg-green-500 text-black shadow-xl shadow-green-500/20 scale-100' : 'text-slate-500 hover:bg-white/5 opacity-60'}`}
                >
                  <Crown className="w-6 h-6 landscape:w-8 landscape:h-8" />
                  <span className="text-[10px] font-black uppercase tracking-widest landscape:text-xs">Spotify</span>
                </button>
                <button 
                  onClick={() => updateSetting('musicMode', MusicMode.LOCAL_UPLOAD)}
                  className={`flex flex-col items-center gap-2 py-6 rounded-[28px] transition-all ${settings.musicMode === MusicMode.LOCAL_UPLOAD ? 'bg-purple-500 text-white shadow-xl shadow-purple-500/20 scale-100' : 'text-slate-500 hover:bg-white/5 opacity-60'}`}
                >
                  <Upload className="w-6 h-6 landscape:w-8 landscape:h-8" />
                  <span className="text-[10px] font-black uppercase tracking-widest landscape:text-xs">Eigen MP3</span>
                </button>
              </div>
            </div>

            {/* Thema Selectie */}
            <div className="glass p-6 rounded-[36px] space-y-6">
              <label className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 landscape:text-xs">
                <Palette className="w-4 h-4 text-white" /> Visuele Sfeer
              </label>
              <div className="grid grid-cols-2 gap-6">
                {[
                  { id: Theme.STANDARD, icon: Zap, label: 'Modern', color: 'bg-green-500', shadow: 'bg-green-800' },
                  { id: Theme.CHRISTMAS, icon: Snowflake, label: 'Kerstmis', color: 'bg-red-600', shadow: 'bg-red-900' }
                ].map((t) => (
                  <button key={t.id} onClick={() => updateSetting('theme', t.id)} className="btn-3d-wrap h-20 landscape:h-24">
                    <div className={`btn-3d-top transition-colors ${settings.theme === t.id ? `${t.color} text-white` : 'bg-slate-900/50 text-slate-500 opacity-40'}`}>
                      <div className="flex flex-col items-center gap-1.5">
                        <t.icon className="w-5 h-5 landscape:w-7 landscape:h-7" />
                        <span className="text-[9px] font-black uppercase landscape:text-xs">{t.label}</span>
                      </div>
                    </div>
                    {settings.theme === t.id && <div className={`btn-3d-bottom ${t.shadow}`} />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Kolom Rechts: Music Auth & Timings */}
          <div className="space-y-6 landscape:space-y-8">
            {/* Music Connection Card */}
            <div className="glass p-6 rounded-[36px] space-y-6 min-h-[160px] flex flex-col justify-center">
               <label className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 landscape:text-xs">
                {settings.musicMode === MusicMode.SPOTIFY_PREMIUM ? <Crown className="w-4 h-4 text-green-500" /> : <Upload className="w-4 h-4 text-purple-500" />} 
                Muziek Bron
              </label>
              
              {settings.musicMode === MusicMode.SPOTIFY_PREMIUM ? (
                <div className="w-full">
                  {!settings.spotifyToken ? (
                    <button onClick={handleLogin} className="btn-3d-wrap h-20">
                      <div className="btn-3d-top bg-[#1DB954] text-black">
                         <LogIn className="w-6 h-6 mr-3" /> VERBIND SPOTIFY
                      </div>
                      <div className="btn-3d-bottom bg-green-800" />
                    </button>
                  ) : (
                    <div className="bg-black/40 p-4 rounded-3xl flex items-center justify-between border-green-500/20 border-2 landscape:p-6">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img src={user?.images[0]?.url || `https://ui-avatars.com/api/?name=U`} className="w-12 h-12 rounded-full border-2 border-green-500 landscape:w-16 landscape:h-16" />
                          <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1"><CheckCircle2 className="w-3 h-3 text-black" /></div>
                        </div>
                        <div>
                          <p className="font-black text-sm text-white uppercase tracking-tight landscape:text-lg">{user?.display_name || 'Spotify Verbonden'}</p>
                          <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Premium Active</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full">
                  <button onClick={triggerFileUpload} className="btn-3d-wrap h-20">
                    <div className="btn-3d-top bg-purple-600 text-white">
                       <Upload className="w-6 h-6 mr-3" /> {settings.localTracks.length > 0 ? `${settings.localTracks.length} BESTANDEN` : 'UPLOAD MUZIEK'}
                    </div>
                    <div className="btn-3d-bottom bg-purple-900" />
                  </button>
                </div>
              )}
            </div>

            {/* Timings Control Panel */}
            <div className="glass p-6 rounded-[36px] space-y-6">
              <label className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 landscape:text-xs">
                <Clock className="w-4 h-4 text-green-500" /> Stop-Interval Instellingen
              </label>
              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <span className="text-[9px] text-slate-500 text-center uppercase font-black tracking-widest">Minimaal (sec)</span>
                  <input 
                    type="number" 
                    value={settings.minStopSeconds} 
                    onChange={(e) => updateSetting('minStopSeconds', Math.max(1, Number(e.target.value)))} 
                    className="bg-black/60 border-2 border-white/5 rounded-[24px] p-5 text-white text-center font-black text-xl focus:border-green-500/50 outline-none transition-all landscape:text-3xl" 
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-[9px] text-slate-500 text-center uppercase font-black tracking-widest">Maximaal (sec)</span>
                  <input 
                    type="number" 
                    value={settings.maxStopSeconds} 
                    onChange={(e) => updateSetting('maxStopSeconds', Math.max(settings.minStopSeconds, Number(e.target.value)))} 
                    className="bg-black/60 border-2 border-white/5 rounded-[24px] p-5 text-white text-center font-black text-xl focus:border-green-500/50 outline-none transition-all landscape:text-3xl" 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Credit */}
        <div className="mt-20 text-center opacity-30 landscape:mt-32">
          <p className="text-[10px] font-black uppercase tracking-[0.6em] text-white italic">Made by Corneel Konings</p>
        </div>
      </div>

      {/* Persistent Bottom Bar with Start Button */}
      <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent flex flex-col items-center z-50 landscape:px-20 landscape:pb-10">
        <button
          onClick={onStart}
          disabled={(settings.musicMode === MusicMode.SPOTIFY_PREMIUM && !settings.spotifyToken) || (settings.musicMode === MusicMode.LOCAL_UPLOAD && settings.localTracks.length === 0)}
          className="btn-3d-wrap h-20 max-w-lg disabled:opacity-20 transition-all active:scale-95"
        >
          <div className="btn-3d-top bg-white text-black font-game text-2xl uppercase italic tracking-tighter landscape:text-3xl">
            LAAT DE BEAT BEGINNEN
          </div>
          <div className="btn-3d-bottom bg-slate-300" />
        </button>
      </div>
    </div>
  );
};

export default SettingsView;
