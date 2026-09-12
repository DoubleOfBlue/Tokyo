// Injects GOOGLE_MAPS_API_KEY (set as a Vercel environment variable) into
// index.html at build time, replacing the %%GOOGLE_MAPS_API_KEY%% placeholder.
// Output goes to dist/index.html, which Vercel serves as the static site.
//
// If the env var isn't set, the placeholder is left as-is on purpose rather
// than failing the build — the app itself falls back to asking for a key
// manually in that case, so a missing env var degrades gracefully instead
// of breaking the deploy.

const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'index.html');
const OUT_DIR = path.join(__dirname, 'dist');
const OUT = path.join(OUT_DIR, 'index.html');
const PLACEHOLDER = '%%GOOGLE_MAPS_API_KEY%%';

const apiKey = process.env.GOOGLE_MAPS_API_KEY;

if (!apiKey) {
  console.warn(
    '\n[build.js] WARNING: GOOGLE_MAPS_API_KEY is not set.\n' +
    '  The deployed site will fall back to asking visitors to paste in\n' +
    '  their own key manually. Set it in Vercel under Project Settings\n' +
    '  -> Environment Variables if you want it pre-configured instead.\n'
  );
}

let html = fs.readFileSync(SRC, 'utf8');

if (apiKey) {
  html = html.split(PLACEHOLDER).join(apiKey);
}

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

fs.writeFileSync(OUT, html, 'utf8');
console.log('[build.js] Wrote', OUT, apiKey ? '(with API key injected)' : '(no key — manual entry fallback)');
