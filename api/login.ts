
import type { VercelRequest, VercelResponse } from '@vercel/node';

const CLIENT_ID = "c041bc323d854084a3b6d9212270a7f0";
// We gebruiken een absolute URL voor redirect_uri gebaseerd op de host
const getRedirectUri = (req: VercelRequest) => {
  const host = req.headers.host || 'beat-stop.vercel.app';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  return `${protocol}://${host}/api/callback`;
};

export default function handler(req: VercelRequest, res: VercelResponse) {
  const scopes = [
    'user-read-private',
    'user-read-email',
    'playlist-read-private',
    'streaming',
    'user-read-playback-state',
    'user-modify-playback-state'
  ].join(' ');

  const spotifyUrl = new URL('https://accounts.spotify.com/authorize');
  spotifyUrl.searchParams.append('response_type', 'code');
  spotifyUrl.searchParams.append('client_id', CLIENT_ID);
  spotifyUrl.searchParams.append('scope', scopes);
  spotifyUrl.searchParams.append('redirect_uri', getRedirectUri(req));
  
  res.redirect(spotifyUrl.toString());
}
