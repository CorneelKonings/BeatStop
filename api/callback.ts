
import type { VercelRequest, VercelResponse } from '@vercel/node';

const CLIENT_ID = "c041bc323d854084a3b6d9212270a7f0";
const CLIENT_SECRET = "8c3c6a2ddd3440a6b3ced573ebef65cf";
const REDIRECT_URI = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}/api/callback` 
  : "http://localhost:3000/api/callback";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const code = req.query.code as string;

  if (!code) {
    return res.redirect('/?error=no_code');
  }

  try {
    const authHeader = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);
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
      // Stuur de gebruiker terug met de token in de URL (App.tsx pikt dit op)
      return res.redirect(`/?token=${data.access_token}`);
    } else {
      return res.redirect('/?error=token_exchange_failed');
    }
  } catch (error) {
    return res.redirect('/?error=server_error');
  }
}
