/**
 * Generates the iOS launch images.
 *
 *   node scripts/gen-splash.mjs
 *
 * iOS shows a blank canvas while an installed web app boots - about two
 * seconds on mobile data - unless it finds an apple-touch-startup-image
 * matching the device exactly. There is no fallback and no scaling: a size
 * that is not listed gets white, so this covers every current iPhone.
 *
 * The images are the brand purple with the app icon and "Loading…" centred.
 * Purple is also the manifest's theme and background colour, so the launch
 * image and the app it becomes match and the handover is invisible - and the
 * word matches the app's own loading state, so the two read as one moment
 * rather than two screens.
 */
import { Resvg } from "@resvg/resvg-js";
import fs from "node:fs";
import path from "node:path";

const BRAND = "#4309ff";
const OUT = "public/splash";

/** CSS pixels and the device pixel ratio, which is what the media query matches. */
const DEVICES = [
  { w: 320, h: 568, r: 2 }, // SE (1st gen)
  { w: 375, h: 667, r: 2 }, // SE 2/3, 8
  { w: 414, h: 736, r: 3 }, // 8 Plus
  { w: 375, h: 812, r: 3 }, // X, XS, 11 Pro, 12/13 mini
  { w: 414, h: 896, r: 2 }, // XR, 11
  { w: 414, h: 896, r: 3 }, // XS Max, 11 Pro Max
  { w: 390, h: 844, r: 3 }, // 12, 13, 14
  { w: 428, h: 926, r: 3 }, // 12/13 Pro Max, 14 Plus
  { w: 393, h: 852, r: 3 }, // 14 Pro, 15, 16
  { w: 430, h: 932, r: 3 }, // 14 Pro Max, 15 Plus/Pro Max, 16 Plus
  { w: 402, h: 874, r: 3 }, // 16 Pro
  { w: 440, h: 956, r: 3 }, // 16 Pro Max
];

const icon = fs.readFileSync("public/icon-512.png").toString("base64");

fs.mkdirSync(OUT, { recursive: true });

const links = [];
for (const { w, h, r } of DEVICES) {
  const pw = w * r;
  const ph = h * r;
  // A quarter of the narrow edge, matching how iOS sizes its own launch marks.
  const size = Math.round(Math.min(pw, ph) * 0.25);

  // Icon sits above centre so the pair - icon and word - is optically centred
  // rather than the icon alone.
  const iconY = (ph - size) / 2 - size * 0.28;
  const textY = iconY + size + Math.round(size * 0.42);
  const fontSize = Math.round(size * 0.15);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${pw}" height="${ph}" viewBox="0 0 ${pw} ${ph}">
  <rect width="${pw}" height="${ph}" fill="${BRAND}"/>
  <image x="${(pw - size) / 2}" y="${iconY}" width="${size}" height="${size}"
         href="data:image/png;base64,${icon}"/>
  <text x="${pw / 2}" y="${textY}" fill="#ffffff" fill-opacity="0.85"
        font-family="Segoe UI, Helvetica, Arial, sans-serif"
        font-size="${fontSize}" text-anchor="middle">Loading…</text>
</svg>`;

  const png = new Resvg(svg, {
    fitTo: { mode: "width", value: pw },
    // Text is drawn once here, at generation time, so the phone never needs
    // the font - but this machine does.
    font: { loadSystemFonts: true },
  }).render().asPng();
  const file = `splash-${pw}x${ph}.png`;
  fs.writeFileSync(path.join(OUT, file), png);

  links.push({
    url: `/splash/${file}`,
    media: `(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${r}) and (orientation: portrait)`,
  });
  console.log(`  ${file}  ${(png.length / 1024).toFixed(1)} kB`);
}

fs.writeFileSync("public/splash/index.json", JSON.stringify(links, null, 2));
console.log(`\n${links.length} launch images written to ${OUT}`);
