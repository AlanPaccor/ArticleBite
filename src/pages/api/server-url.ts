import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Use the new static URL
  const serverUrl = 'http://localhost:3005';
  
  res.status(200).json({ url: serverUrl });
}
