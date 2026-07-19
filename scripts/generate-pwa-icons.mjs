/**
 * Generates PWA PNG icons from public/icon.svg
 * Run: node scripts/generate-pwa-icons.mjs
 */
import { readFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const svgPath = join(root, "public", "icon.svg");
const outDir = join(root, "public", "icons");

mkdirSync(outDir, { recursive: true });

const svg = readFileSync(svgPath);

const targets = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "apple-touch-icon.png", size: 180 },
];

for (const { name, size } of targets) {
  const out = join(outDir, name);
  await sharp(svg)
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log(`Wrote ${name} (${size}×${size})`);
}
