import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = path.join(root, "public", "app-icon.png");
const out = (name) => path.join(root, "public", name);

// crop the logo, then cut it to a circle so no old gradient corners remain
const circle = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500">
    <circle cx="250" cy="250" r="250" fill="#fff"/>
  </svg>`
);
const ring = await sharp(SOURCE)
  .extract({ left: 262, top: 245, width: 500, height: 500 })
  .composite([{ input: circle, blend: "dest-in" }])
  .png()
  .toBuffer();

async function make(size, logoScale, file) {
  const bg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#C2305A"/><stop offset="1" stop-color="#FF5A00"/>
      </linearGradient></defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
    </svg>`
  );
  const logoSize = Math.round(size * logoScale);
  const logo = await sharp(ring).resize(logoSize, logoSize).toBuffer();
  await sharp(bg)
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(out(file));
}

await make(512, 0.6, "maskable-icon-512x512.png");
await make(512, 0.7, "pwa-512x512.png");
await make(192, 0.7, "pwa-192x192.png");
await make(180, 0.7, "apple-touch-icon.png");
console.log("done");
