
import { Track, SpotifyUser } from '../types';

/**
 * Extraheert het playlist ID uit diverse Spotify URL formats.
 */
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
    throw new Error('Ongeldige Spotify link. Plak een link zoals: https://open.spotify.com/playlist/...');
  }

  try {
    const response = await fetch(`https://api.spotify.com/v1/playlists/${id}/tracks?limit=50`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 401) {
      throw new Error('Je sessie is verlopen. Log opnieuw in.');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'Kon playlist niet ophalen.');
    }

    const data = await response.json();
    
    // CRUCIAAL: Filter op tracks die een preview_url hebben. 
    // Zonder dit filter probeert de app nummers af te spelen die 'stil' zijn.
    const playableTracks = data.items
      .filter((item: any) => item.track && item.track.id && item.track.preview_url)
      .map((item: any) => ({
        id: item.track.id,
        name: item.track.name,
        artist: item.track.artists.map((a: any) => a.name).join(', '),
        previewUrl: item.track.preview_url,
        albumArt: item.track.album.images[0]?.url || `https://picsum.photos/seed/${item.track.id}/400/400`,
        uri: item.track.uri
      }));

    if (playableTracks.length === 0) {
      throw new Error('Deze playlist bevat geen nummers met een audio-preview. Probeer een andere (openbare) playlist.');
    }

    return playableTracks;
  } catch (err: any) {
    console.error('Spotify API Error:', err);
    throw err;
  }
};
