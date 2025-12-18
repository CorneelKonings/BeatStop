import type { VercelRequest, VercelResponse } from '@vercel/node';
// Fix: Import Buffer explicitly to provide type definitions for Node.js environment
import { Buffer } from 'buffer';

const CLIENT_ID = "c041bc323d854084a3b6d9212270a7f0";
const CLIENT_SECRET = "8c3c6a2ddd3440a6b3ced573ebef65cf";
const REDIRECT_URI = "https://beat-stop.vercel.app/api/callback";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const code = req.query.code as string;

  if (!code) {
    return res.redirect('/?error=no_code');
  }

  try {
    // Fix: Explicitly using Buffer from 'buffer' package to satisfy TypeScript compiler
    const authHeader = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authHeader}`,
      },
      body: new URLSearchParams({
        code,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }).toString(),
    });

    const data = await response.json();

    if (data.access_token) {
      // Stuur de gebruiker terug met de token in de URL
      return res.redirect(`/?token=${data.access_token}`);
    } else {
      console.error('Spotify Token Error:', data);
      return res.redirect(`/?error=token_exchange_failed&msg=${encodeURIComponent(data.error_description || data.error)}`);
    }
  } catch (error) {
    console.error('Server error in callback:', error);
    return res.redirect('/?error=server_error');
  }
}