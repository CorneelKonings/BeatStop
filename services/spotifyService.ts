
import { Track, SpotifyUser } from '../types';

export const parsePlaylistId = (url: string): string | null => {
  if (!url) return null;
  // Regex die zowel de ID als eventuele query params aanpakt
  const match = url.match(/playlist[\/:]([a-zA-Z0-9]{22})/);
  const id = match ? match[1] : null;
  console.log('Parsed Playlist ID:', id);
  return id;
};

export const fetchUserProfile = async (token: string): Promise<SpotifyUser | null> => {
  try {
    const response = await fetch('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    return null;
  }
};

export const fetchPlaylistTracks = async (playlistUrl: string, token: string): Promise<Track[]> => {
  const id = parsePlaylistId(playlistUrl);
  if (!id) throw new Error('Ongeldige Spotify link.');

  try {
    const response = await fetch(`https://api.spotify.com/v1/playlists/${id}/tracks?limit=50`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 404) {
      throw new Error(`Playlist niet gevonden. Is de link openbaar?`);
    }
    if (response.status === 401) throw new Error('Sessie verlopen. Log opnieuw in.');
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Spotify Fout: ${response.status}`);
    }

    const data = await response.json();
    if (!data.items || data.items.length === 0) throw new Error('Geen nummers gevonden in deze playlist.');

    return data.items
      .filter((item: any) => item.track && item.track.id)
      .map((item: any) => ({
        id: item.track.id,
        name: item.track.name,
        artist: item.track.artists.map((a: any) => a.name).join(', '),
        previewUrl: item.track.preview_url,
        albumArt: item.track.album.images[0]?.url || `https://picsum.photos/seed/${item.track.id}/400/400`,
        uri: item.track.uri
      }));
  } catch (err: any) {
    console.error('Spotify API Error:', err);
    throw err;
  }
};

export const playTrackOnDevice = async (token: string, deviceId: string, trackUri: string) => {
  const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
    method: 'PUT',
    body: JSON.stringify({ uris: [trackUri] }),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
  });
  
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    console.error('Play Request Failed:', err);
    if (response.status === 403) {
      throw new Error('Spotify Premium vereist voor deze functie.');
    }
    throw new Error(err.error?.message || 'Kon muziek niet starten.');
  }
};
