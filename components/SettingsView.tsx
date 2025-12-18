
import React, { useState, useEffect, useRef } from 'react';
import { GameSettings, Theme, SpotifyUser, MusicMode, Track } from '../types';
import { fetchUserProfile } from '../services/spotifyService';
import { Clock, Palette, Music, LogIn, CheckCircle2, Zap, Upload, Headphones, Crown, X, Trash2 } from 'lucide-react';

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
      artist: 'Lokaal Bestand',
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

  const removeTrack = (id: string) => {
    const filtered = settings.localTracks.filter(t => t.id !== id);
    updateSetting('localTracks', filtered);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 p-6 overflow-y-auto pb-48">
      <div className="flex flex-col items-center mb-8 mt-6">
        <div className="relative">
          <div className="absolute -inset-4 bg-green-500 rounded-full blur-2xl opacity-20"></div>
          <Zap className="w-12 h-12 text-green-500 relative z-10" />
        </div>
        <h1 className="text-4xl font-game tracking-tighter text-white mt-4 uppercase italic leading-none">BEATSTOP</h1>
      </div>

      <div className="space-y-6 max-w-md mx-auto w-full">
        {/* Modus Selectie */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 rounded-[28px]">
          <button 
            onClick={() => updateSetting('musicMode', MusicMode.SPOTIFY_PREMIUM)}
            className={`flex flex-col items-center gap-1.5 py-4 rounded-[24px] transition-all ${settings.musicMode === MusicMode.SPOTIFY_PREMIUM ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' : 'text-slate-500'}`}
          >
            <Crown className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase">Spotify Premium</span>
          </button>
          <button 
            onClick={() => updateSetting('musicMode', MusicMode.LOCAL_UPLOAD)}
            className={`flex flex-col items-center gap-1.5 py-4 rounded-[24px] transition-all ${settings.musicMode === MusicMode.LOCAL_UPLOAD ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'text-slate-500'}`}
          >
            <Upload className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase">Eigen MP3</span>
          </button>
        </div>

        {/* Dynamic Context Section */}
        {settings.musicMode === MusicMode.SPOTIFY_PREMIUM && (
          <div className="space-y-4">
            {!settings.spotifyToken ? (
              <button onClick={handleLogin} className="w-full bg-[#1DB954] text-black py-5 rounded-3xl font-black flex items-center justify-center gap-3 active:scale-95 transition-all">
                <LogIn className="w-6 h-6" /> VERBIND SPOTIFY
              </button>
            ) : (
              <div className="glass p-4 rounded-3xl flex items-center justify-between border-green-500/30 border-2">
                <div className="flex items-center gap-3">
                  <img src={user?.images[0]?.url || `https://ui-avatars.com/api/?name=U`} className="w-10 h-10 rounded-full border-2 border-green-500" />
                  <p className="font-bold text-sm">{user?.display_name || 'Verbonden'}</p>
                </div>
                <CheckCircle2 className="text-green-500 w-5 h-5" />
              </div>
            )}
            <div className="glass p-5 rounded-[32px] space-y-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Playlist Link</label>
              <input
                type="text"
                value={settings.playlistUrl}
                onChange={(e) => updateSetting('playlistUrl', e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-sm"
                placeholder="https://open.spotify.com/playlist/..."
              />
            </div>
          </div>
        )}

        {settings.musicMode === MusicMode.LOCAL_UPLOAD && (
          <div className="space-y-4">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white py-6 rounded-3xl font-black flex items-center justify-center gap-3 border-b-4 border-purple-800 active:border-b-0 active:translate-y-1 transition-all"
            >
              <Upload className="w-6 h-6" /> SELECTEER MP3 BESTANDEN
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              multiple 
              accept="audio/*" 
              className="hidden" 
            />
            
            {settings.localTracks.length > 0 && (
              <div className="glass rounded-[32px] p-2 max-h-60 overflow-y-auto">
                {settings.localTracks.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-3 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                        <Music className="w-4 h-4 text-purple-500" />
                      </div>
                      <p className="text-xs font-bold text-slate-300 truncate">{t.name}</p>
                    </div>
                    <button onClick={() => removeTrack(t.id)} className="p-2 text-slate-600 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Global Timings */}
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
          disabled={
            (settings.musicMode === MusicMode.SPOTIFY_PREMIUM && !settings.spotifyToken) ||
            (settings.musicMode === MusicMode.LOCAL_UPLOAD && settings.localTracks.length === 0)
          }
          className="w-full max-w-md bg-white text-black py-6 rounded-[32px] font-game text-2xl shadow-2xl active:scale-95 transition-all uppercase disabled:opacity-20"
        >
          START GAME
        </button>
      </div>
    </div>
  );
};

export default SettingsView;
