// Injects build-time environment variables into index.html, replacing their
// %%PLACEHOLDER%% tokens. Output goes to public/index.html — "public" is
// Vercel's zero-config default output directory, so no extra project
// settings are needed for the static file.
//
// Also copies api/ into public/api/. When a custom outputDirectory is set
// (as it is here), Vercel expects Serverless Functions to live inside that
// same output directory rather than at the project root — the root-level
// api/ convention only applies in the fully zero-config case. Without this
// copy step, /api/pins.js builds fine but never actually gets deployed,
// which is exactly what caused the 404s.
//
// If an env var isn't set, its placeholder is left as-is on purpose rather
// than failing the build:
//  - GOOGLE_MAPS_API_KEY missing  -> app falls back to asking for a key manually
//  - TRIP_PASSCODE missing        -> app skips the passcode gate entirely (no lock)
// Both degrade gracefully instead of breaking the deploy.

const fs = require('fs');
const path = require('path');

const SRC_HTML = path.join(__dirname, 'index.html');
const SRC_API_DIR = path.join(__dirname, 'api');
const OUT_DIR = path.join(__dirname, 'public');
const OUT_HTML = path.join(OUT_DIR, 'index.html');
const OUT_API_DIR = path.join(OUT_DIR, 'api');

const REPLACEMENTS = [
  { envVar: 'GOOGLE_MAPS_API_KEY', placeholder: '%%GOOGLE_MAPS_API_KEY%%' },
  { envVar: 'TRIP_PASSCODE', placeholder: '%%TRIP_PASSCODE%%' },
];

let html = fs.readFileSync(SRC_HTML, 'utf8');
const injectedLabels = [];

for (const { envVar, placeholder } of REPLACEMENTS) {
  const value = process.env[envVar];
  if (value) {
    html = html.split(placeholder).join(value);
    injectedLabels.push(envVar);
  } else {
    console.warn(`[build.js] WARNING: ${envVar} is not set — leaving its placeholder in place.`);
  }
}

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

fs.writeFileSync(OUT_HTML, html, 'utf8');
console.log(
  '[build.js] Wrote', OUT_HTML,
  injectedLabels.length ? `(injected: ${injectedLabels.join(', ')})` : '(no env vars injected)'
);

if (fs.existsSync(SRC_API_DIR)) {
  fs.cpSync(SRC_API_DIR, OUT_API_DIR, { recursive: true });
  console.log('[build.js] Copied', SRC_API_DIR, '->', OUT_API_DIR);
} else {
  console.warn('[build.js] WARNING: no api/ directory found — skipping API function copy.');
}
