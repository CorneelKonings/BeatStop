
import { Track, SpotifyUser } from '../types';

export const parsePlaylistId = (url: string): string | null => {
  const match = url.match(/playlist[\/:]([a-zA-Z0-9]+)/);
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
  if (!id) throw new Error('Geen geldige Spotify link gevonden.');

  try {
    const response = await fetch(`https://api.spotify.com/v1/playlists/${id}/tracks?limit=50`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.status === 401) {
      throw new Error('AUTH_EXPIRED');
    }

    if (!response.ok) {
      throw new Error('Kon playlist niet ophalen. Is deze openbaar?');
    }

    const data = await response.json();
    const tracks = data.items
      .filter((item: any) => item.track)
      .map((item: any) => ({
        id: item.track.id,
        name: item.track.name,
        artist: item.track.artists.map((a: any) => a.name).join(', '),
        previewUrl: item.track.preview_url,
        albumArt: item.track.album.images[0]?.url || `https://picsum.photos/seed/${item.track.id}/400/400`,
        uri: item.track.uri
      }));

    if (tracks.length === 0) {
      throw new Error('Deze playlist is leeg of bevat geen afspeelbare nummers.');
    }

    return tracks;
  } catch (err: any) {
    if (err.message === 'AUTH_EXPIRED') throw err;
    throw new Error(err.message || 'Er is een fout opgetreden bij het laden van Spotify.');
  }
};
