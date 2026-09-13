// Serverless function: GET returns the shared pin list, POST replaces it.
// Requires a Vercel KV database connected to this project (Vercel dashboard
// -> Storage -> Create Database -> KV -> Connect to this project). Vercel
// injects the KV_REST_API_URL / KV_REST_API_TOKEN env vars automatically
// once connected — no manual key copying needed.
//
// Storage model is intentionally simple: one shared list under a single
// key, "last write wins" on conflicts. That's a fine trade-off for a small
// group of friends editing the same trip; it is not built for heavy
// concurrent editing.

const { kv } = require('@vercel/kv');

const PINS_KEY = 'tokyo-trip-pins';

module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      const pins = (await kv.get(PINS_KEY)) || [];
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
      await kv.set(PINS_KEY, pins);
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[api/pins] error:', err);
    res.status(500).json({ error: 'Storage error', detail: String(err && err.message || err) });
  }
};
