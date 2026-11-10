// Runs after `next build`. Static hosting cannot send headers, so the
// Content-Security-Policy is a meta tag, and Next's inline bootstrap scripts
// differ per page. This replaces 'unsafe-inline' in each page's script-src
// with the SHA-256 hash of every inline script on that page, so the browser
// runs those scripts and no others.
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT = "out";
const PLACEHOLDER = "script-src &#x27;self&#x27; &#x27;unsafe-inline&#x27;";
const INLINE_SCRIPT = /<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g;

const pages = readdirSync(OUT, { recursive: true }).filter((file) => String(file).endsWith(".html"));
for (const page of pages) {
  const path = join(OUT, String(page));
  const html = readFileSync(path, "utf8");
  if (!html.includes(PLACEHOLDER)) throw new Error(`${path}: no script-src placeholder to replace`);
  const hashes = new Set(
    [...html.matchAll(INLINE_SCRIPT)].map(([, body]) => `&#x27;sha256-${createHash("sha256").update(body).digest("base64")}&#x27;`),
  );
  writeFileSync(path, html.replace(PLACEHOLDER, `script-src &#x27;self&#x27; ${[...hashes].join(" ")}`));
}
console.log(`CSP: hashed inline scripts in ${pages.length} pages`);
