// Serverless function: GET returns the shared pin list, POST replaces it.
//
// Uses Upstash Redis via the Vercel Marketplace — Vercel's original
// first-party "Vercel KV" product was fully discontinued (sunset into
// Upstash Redis in Dec 2024, @vercel/kv is dead on npm with no releases
// since), so this connects directly with @upstash/redis instead.
//
// Setup: Vercel dashboard -> Storage tab -> Marketplace -> search "Redis"
// -> install the Upstash integration -> connect it to this project.
// That auto-injects the env vars this reads below — nothing to copy by
// hand. The Vercel/Upstash integration has used a couple of different
// naming conventions over time, so this checks both rather than assuming
// one.
//
// Storage model is intentionally simple: one shared list under a single
// key, "last write wins" on conflicts. Fine for a small group of friends
// editing the same trip; not built for heavy concurrent editing.

const { Redis } = require('@upstash/redis');

const PINS_KEY = 'tokyo-trip-pins';

const redisUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

let redis = null;
if (redisUrl && redisToken) {
  redis = new Redis({ url: redisUrl, token: redisToken });
}

module.exports = async (req, res) => {
  if (!redis) {
    res.status(500).json({
      error: 'No Redis connection configured',
      detail: 'Neither KV_REST_API_URL/KV_REST_API_TOKEN nor UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN are set. Connect an Upstash Redis integration to this project from the Vercel dashboard Storage tab.',
    });
    return;
  }

  try {
    if (req.method === 'GET') {
      const pins = (await redis.get(PINS_KEY)) || [];
      res.status(200).json({ pins });
      return;
    }

    if (req.method === 'POST') {
      let body = req.body;
      // Some Vercel runtimes deliver the body as a raw string.
      if (typeof body === 'string') {
        body = JSON.parse(body);
      }
      const pins = Array.isArray(body && body.pins) ? body.pins : [];
      await redis.set(PINS_KEY, pins);
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[api/pins] error:', err);
    res.status(500).json({ error: 'Storage error', detail: String(err && err.message || err) });
  }
};
