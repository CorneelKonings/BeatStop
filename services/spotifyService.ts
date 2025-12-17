
import { Track } from '../types';

export const parsePlaylistId = (url: string): string | null => {
  const match = url.match(/playlist[\/:]([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
};

export const fetchPlaylistTracks = async (playlistUrl: string, token?: string): Promise<Track[]> => {
  const id = parsePlaylistId(playlistUrl);
  if (!id) throw new Error('Oeps! Die Spotify link klopt niet.');

  // Gebruik de API als er een token is (uit UI of App.tsx)
  if (token && token.trim().length > 0) {
    try {
      const response = await fetch(`https://api.spotify.com/v1/playlists/${id}/tracks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        if (response.status === 401) throw new Error('Spotify Token is verlopen. Vernieuw hem in App.tsx.');
        throw new Error('Spotify API fout.');
      }
      
      const data = await response.json();
      return data.items.map((item: any) => ({
        id: item.track.id,
        name: item.track.name,
        artist: item.track.artists.map((a: any) => a.name).join(', '),
        previewUrl: item.track.preview_url || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        albumArt: item.track.album.images[0]?.url || `https://picsum.photos/seed/${item.track.id}/400/400`
      }));
    } catch (err: any) {
      console.warn('API mislukt, fallback naar scraper...', err.message);
      // Als de API faalt maar we hebben een token geprobeerd, proberen we alsnog de scraper
    }
  }

  // Fallback naar Scraper voor "no-login" ervaring
  try {
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://open.spotify.com/embed/playlist/${id}`)}`;
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error('Kon de playlist niet bereiken.');
    const data = await response.json();
    const html = data.contents;
    const scriptRegex = /<script id="__NEXT_DATA__" type="application\/json">([^<]+)<\/script>/;
    const match = html.match(scriptRegex);
    if (!match) throw new Error('Kon playlist data niet verwerken.');
    const jsonData = JSON.parse(match[1]);
    const trackItems = jsonData.props?.pageProps?.state?.data?.entity?.tracks?.items || 
                       jsonData.props?.pageProps?.state?.data?.tracks?.items || [];
    if (trackItems.length === 0) throw new Error('Geen liedjes gevonden.');

    return trackItems.map((item: any) => {
      const t = item.track || item;
      return {
        id: t.id || Math.random().toString(),
        name: t.name || 'Liedje zonder naam',
        artist: t.artists ? t.artists.map((a: any) => a.name).join(', ') : 'Onbekende artiest',
        previewUrl: t.preview_url || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        albumArt: t.album?.images?.[0]?.url || `https://picsum.photos/seed/${t.id}/400/400`
      };
    });
  } catch (err) {
    throw new Error('Kon de playlist niet laden. Check de link of de API key in App.tsx.');
  }
};
