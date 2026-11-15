import type { VercelRequest, VercelResponse } from '@vercel/node';

import { handleSkyGet } from './_lib/handleSkyGet';
import { SKY_CACHE_HEADERS } from './_lib/skyCache';

/** GET /api/sky?date=YYYY-MM-DD — NASA DONKI proxy with server-side classification input. */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const result = await handleSkyGet(req.query);

  if (!result.ok) {
    res.status(result.status).json(result.body);
    return;
  }

  res.setHeader('Cache-Control', SKY_CACHE_HEADERS);
  res.status(200).json(result.body);
}
