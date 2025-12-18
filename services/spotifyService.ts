
import { Track, SpotifyUser } from '../types';

export const parsePlaylistId = (url: string): string | null => {
  if (!url) return null;
  const match = url.match(/playlist[\/:]([a-zA-Z0-9]{22})/);
  return match ? match[1] : null;
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
  
  if (!id) {
    throw new Error('Ongeldige Spotify link.');
  }

  try {
    const response = await fetch(`https://api.spotify.com/v1/playlists/${id}/tracks?limit=50`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 401) throw new Error('Sessie verlopen.');
    if (!response.ok) throw new Error('Kon playlist niet laden.');

    const data = await response.json();
    
    // We filteren niet meer op preview_url, want we gaan de volledige URI afspelen via de SDK.
    return data.items
      .filter((item: any) => item.track && item.track.id)
      .map((item: any) => ({
        id: item.track.id,
        name: item.track.name,
        artist: item.track.artists.map((a: any) => a.name).join(', '),
        previewUrl: item.track.preview_url, // fallback
        albumArt: item.track.album.images[0]?.url || `https://picsum.photos/seed/${item.track.id}/400/400`,
        uri: item.track.uri
      }));
  } catch (err: any) {
    console.error('Spotify API Error:', err);
    throw err;
  }
};

/**
 * Start een specifieke track op een specifiek apparaat (de SDK player)
 */
export const playTrackOnDevice = async (token: string, deviceId: string, trackUri: string) => {
  await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
    method: 'PUT',
    body: JSON.stringify({ uris: [trackUri] }),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
  });
};
