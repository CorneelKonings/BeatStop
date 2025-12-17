
import type { VercelRequest, VercelResponse } from '@vercel/node';

const CLIENT_ID = "c041bc323d854084a3b6d9212270a7f0";

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Bepaal de host (bijv. localhost:3000 of app.vercel.app)
  const host = req.headers.host;
  const protocol = host?.includes('localhost') ? 'http' : 'https';
  const REDIRECT_URI = `${protocol}://${host}/api/callback`;

  const scopes = [
    'user-read-private',
    'user-read-email',
    'playlist-read-private',
    'playlist-read-collaborative',
    'streaming',
    'user-modify-playback-state'
  ].join(' ');

  const spotifyUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${CLIENT_ID}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
  
  res.redirect(spotifyUrl);
}
