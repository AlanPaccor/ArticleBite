import type { NextApiRequest, NextApiResponse } from 'next';

export function getServerUrl() {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:3000';
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Use the new static URL
  const serverUrl = getServerUrl();
  
  res.status(200).json({ url: serverUrl });
}
