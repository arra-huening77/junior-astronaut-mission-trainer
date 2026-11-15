import type { VercelRequest, VercelResponse } from '@vercel/node';

import { handleDebriefPost } from './_lib/handleDebriefPost';

/** POST /api/debrief — Gemini mission summary (server-only keys). */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const clientKey =
    (typeof req.headers['x-forwarded-for'] === 'string'
      ? req.headers['x-forwarded-for'].split(',')[0]
      : undefined) ??
    req.socket?.remoteAddress ??
    'anonymous';

  const result = await handleDebriefPost(req.body, clientKey, req.query);

  if (!result.ok) {
    res.status(result.status).json(result.body);
    return;
  }

  res.setHeader('Cache-Control', 'no-store');
  res.status(result.status).json(result.body);
}
