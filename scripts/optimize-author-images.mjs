/**
 * Resize + WebP encode author/hero images for mobile payload (keeps originals on disk).
 * Run: node scripts/optimize-author-images.mjs
 */
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTHORS_DIR = path.join(__dirname, "..", "public", "images", "authors");

/** Max edge length — enough for 2× retina at ~320px display; larger would bloat mobile */
const MAX_EDGE = 640;
const WEBP_QUALITY = 90;

const FILES = [
  "elon musk 1.jpg",
  "dr Marcus Elliott.jpeg",
  "Tim-Ferriss.png",
  "David Clerc empresarial traje.png",
  "Vilfredo_Pareto.jpg",
  "Mieko-Kamiya.jpg",
  "Jesse Itzler.jpg",
  "dwight-d-eisenhower.jpg",
];

async function main() {
  for (const name of FILES) {
    const input = path.join(AUTHORS_DIR, name);
    if (!fs.existsSync(input)) {
      console.warn("Skip (missing):", name);
      continue;
    }
    const base = name.replace(/\.(jpe?g|png)$/i, "");
    const outPath = path.join(AUTHORS_DIR, `${base}.webp`);
    const statIn = fs.statSync(input);
    await sharp(input)
      .rotate()
      .resize({
        width: MAX_EDGE,
        height: MAX_EDGE,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALITY, effort: 4 })
      .toFile(outPath);
    const statOut = fs.statSync(outPath);
    console.log(
      `${base}.webp  ${(statIn.size / 1024).toFixed(0)} KiB → ${(statOut.size / 1024).toFixed(0)} KiB`,
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
