// Injects build-time environment variables into index.html, replacing their
// %%PLACEHOLDER%% tokens. Output goes to public/index.html — "public" is
// Vercel's zero-config default output directory, so no extra project
// settings or vercel.json outputDirectory value are needed.
//
// If an env var isn't set, its placeholder is left as-is on purpose rather
// than failing the build:
//  - GOOGLE_MAPS_API_KEY missing  -> app falls back to asking for a key manually
//  - TRIP_PASSCODE missing        -> app skips the passcode gate entirely (no lock)
// Both degrade gracefully instead of breaking the deploy.

const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'index.html');
const OUT_DIR = path.join(__dirname, 'public');
const OUT = path.join(OUT_DIR, 'index.html');

const REPLACEMENTS = [
  { envVar: 'GOOGLE_MAPS_API_KEY', placeholder: '%%GOOGLE_MAPS_API_KEY%%' },
  { envVar: 'TRIP_PASSCODE', placeholder: '%%TRIP_PASSCODE%%' },
];

let html = fs.readFileSync(SRC, 'utf8');
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

fs.writeFileSync(OUT, html, 'utf8');
console.log(
  '[build.js] Wrote', OUT,
  injectedLabels.length ? `(injected: ${injectedLabels.join(', ')})` : '(no env vars injected)'
);
