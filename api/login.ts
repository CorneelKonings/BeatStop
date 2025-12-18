
import type { VercelRequest, VercelResponse } from '@vercel/node';

const CLIENT_ID = "c041bc323d854084a3b6d9212270a7f0";
const REDIRECT_URI = "https://beat-stop.vercel.app/api/callback";

export default function handler(req: VercelRequest, res: VercelResponse) {
  const scopes = [
    'user-read-private',
    'user-read-email',
    'playlist-read-private',
    'playlist-read-collaborative',
    'streaming',
    'user-modify-playback-state'
  ].join(' ');

  const spotifyUrl = new URL('https://accounts.spotify.com/authorize');
  spotifyUrl.searchParams.append('response_type', 'code');
  spotifyUrl.searchParams.append('client_id', CLIENT_ID);
  spotifyUrl.searchParams.append('scope', scopes);
  spotifyUrl.searchParams.append('redirect_uri', REDIRECT_URI);
  
  res.redirect(spotifyUrl.toString());
}
