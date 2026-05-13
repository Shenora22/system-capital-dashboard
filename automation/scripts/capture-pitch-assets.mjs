#!/usr/bin/env node
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../..");
const outputDir = resolve(repoRoot, "public/pitch-assets");
const baseUrl = process.env.PITCH_CAPTURE_URL || "http://127.0.0.1:3000";
const droneUrl = `${baseUrl.replace(/\/$/, "")}/drone`;
const viewport = { width: 1440, height: 1100 };
const allowFallback = process.env.PITCH_CAPTURE_ALLOW_FALLBACK === "1";

const assets = [
  { name: "skytrace-dashboard-hero.png", selector: null, description: "full dashboard hero viewport" },
  { name: "skytrace-map-view.png", selector: '[data-pitch-capture="map"]', description: "map-focused screenshot" },
  { name: "skytrace-alerts-panel.png", selector: '[data-pitch-capture="alerts"]', description: "alerts panel screenshot" },
  { name: "skytrace-telemetry-panel.png", selector: '[data-pitch-capture="telemetry"]', description: "telemetry close-up screenshot" },
  { name: "skytrace-automation-panel.png", selector: '[data-pitch-capture="automation"]', description: "automation/action panel screenshot" },
];

async function main() {
  await mkdir(outputDir, { recursive: true });

  try {
    await captureWithPlaywright();
  } catch (error) {
    if (!allowFallback) {
      console.error("[pitch-assets] Browser capture failed; refusing to overwrite pitch assets with fallback graphics.");
      console.error(
        "[pitch-assets] Set PITCH_CAPTURE_ALLOW_FALLBACK=1 only when placeholder assets are explicitly desired.",
      );
      throw error;
    }

    console.warn("[pitch-assets] Browser capture failed; PITCH_CAPTURE_ALLOW_FALLBACK=1, writing deterministic fallback PNG assets.");
    console.warn(`[pitch-assets] Reason: ${error.message}`);
    await createFallbackAssets();
  }

  console.log(`[pitch-assets] Assets saved to ${outputDir}`);
}

async function captureWithPlaywright() {
  let chromium;
  try {
    ({ chromium } = require("@playwright/test"));
  } catch {
    try {
      ({ chromium } = require("playwright"));
    } catch {
      throw new Error(
        "Playwright is not installed. Install @playwright/test and Chromium, then rerun npm run capture:pitch-assets.",
      );
    }
  }

  console.log(`[pitch-assets] Capturing live browser screenshots from ${droneUrl}`);
  const server = await ensureServer();
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
    await page.emulateMedia({ colorScheme: "dark" });

    const response = await page.goto(droneUrl, { waitUntil: "domcontentloaded" });
    if (!response?.ok()) throw new Error(`Unable to load ${droneUrl}; status ${response?.status() ?? "unknown"}.`);

    await page.waitForLoadState("networkidle");
    await assertLiveDroneDom(page);

    for (const asset of assets) {
      const path = join(outputDir, asset.name);
      if (!asset.selector) {
        await page.screenshot({ path, fullPage: false });
      } else {
        await page.locator(asset.selector).first().screenshot({ path });
      }
      console.log(`[pitch-assets] Captured ${asset.description}: ${asset.name}`);
    }

    console.log("[pitch-assets] Browser capture succeeded from the live /drone dashboard DOM.");
  } finally {
    await browser?.close();
    server?.kill("SIGTERM");
  }
}

async function assertLiveDroneDom(page) {
  await page.waitForSelector('[data-pitch-capture="dashboard"]', { timeout: 15_000 });

  for (const asset of assets.filter((asset) => asset.selector)) {
    const count = await page.locator(asset.selector).count();
    if (count === 0) throw new Error(`Missing capture hook ${asset.selector} for ${asset.name}.`);
  }

  await page.waitForFunction(
    () =>
      !document.body.innerText.includes("Syncing fleet API…") &&
      !document.body.innerText.includes("Syncing fleet API..."),
    undefined,
    { timeout: 15_000 },
  );

  const missionControlHeading = page.getByRole("heading", {
    name: /AI Mission Control for Autonomous Drone Operations/i,
  });
  await missionControlHeading.waitFor({ timeout: 15_000 });
}

async function ensureServer() {
  if (await isUrlReady(droneUrl)) return null;

  console.log("[pitch-assets] Starting Next.js dev server for capture...");
  const child = spawn("npm", ["run", "dev", "--", "--hostname", "127.0.0.1", "--port", "3000"], {
    cwd: repoRoot,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, BROWSER: "none" },
  });

  child.stdout.on("data", (data) => process.stdout.write(`[next] ${data}`));
  child.stderr.on("data", (data) => process.stderr.write(`[next] ${data}`));

  const started = Date.now();
  while (Date.now() - started < 45_000) {
    if (await isUrlReady(droneUrl)) return child;
    await sleep(750);
  }

  child.kill("SIGTERM");
  throw new Error(`Timed out waiting for ${droneUrl}. Start the app manually and set PITCH_CAPTURE_URL if needed.`);
}

async function isUrlReady(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(1500) });
    return response.ok;
  } catch {
    return false;
  }
}

function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

async function createFallbackAssets() {
  const specs = [
    { file: "skytrace-dashboard-hero.png", mode: "hero", w: 1600, h: 1000 },
    { file: "skytrace-map-view.png", mode: "map", w: 1400, h: 900 },
    { file: "skytrace-alerts-panel.png", mode: "alerts", w: 1200, h: 900 },
    { file: "skytrace-telemetry-panel.png", mode: "telemetry", w: 1400, h: 850 },
    { file: "skytrace-automation-panel.png", mode: "automation", w: 1200, h: 900 },
  ];

  for (const spec of specs) {
    const canvas = new Canvas(spec.w, spec.h);
    drawAsset(canvas, spec.mode);
    await writeFile(join(outputDir, spec.file), canvas.toPng());
    console.log(`[pitch-assets] Wrote fallback asset: ${spec.file}`);
  }
}

class Canvas {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.data = Buffer.alloc(width * height * 4);
    this.clear([4, 7, 13, 255]);
  }

  clear(color) {
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) this.pixel(x, y, color);
    }
  }

  pixel(x, y, color) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    const i = (Math.floor(y) * this.width + Math.floor(x)) * 4;
    const alpha = color[3] / 255;
    this.data[i] = Math.round(color[0] * alpha + this.data[i] * (1 - alpha));
    this.data[i + 1] = Math.round(color[1] * alpha + this.data[i + 1] * (1 - alpha));
    this.data[i + 2] = Math.round(color[2] * alpha + this.data[i + 2] * (1 - alpha));
    this.data[i + 3] = 255;
  }

  rect(x, y, w, h, color) {
    for (let yy = y; yy < y + h; yy += 1) for (let xx = x; xx < x + w; xx += 1) this.pixel(xx, yy, color);
  }

  stroke(x, y, w, h, color, size = 2) {
    this.rect(x, y, w, size, color); this.rect(x, y + h - size, w, size, color);
    this.rect(x, y, size, h, color); this.rect(x + w - size, y, size, h, color);
  }

  line(x1, y1, x2, y2, color) {
    const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
    for (let i = 0; i <= steps; i += 1) this.pixel(x1 + ((x2 - x1) * i) / steps, y1 + ((y2 - y1) * i) / steps, color);
  }

  circle(cx, cy, r, color, fill = true) {
    for (let y = -r; y <= r; y += 1) for (let x = -r; x <= r; x += 1) {
      const d = x * x + y * y;
      if ((fill && d <= r * r) || (!fill && Math.abs(d - r * r) < r * 2)) this.pixel(cx + x, cy + y, color);
    }
  }

  text(text, x, y, scale = 3, color = [240, 249, 255, 255]) {
    let cursor = x;
    for (const char of text.toUpperCase()) {
      const glyph = FONT[char] || FONT[" "];
      for (let row = 0; row < glyph.length; row += 1) {
        for (let col = 0; col < glyph[row].length; col += 1) {
          if (glyph[row][col] === "1") this.rect(cursor + col * scale, y + row * scale, scale, scale, color);
        }
      }
      cursor += (glyph[0].length + 1) * scale;
    }
  }

  gradient() {
    for (let y = 0; y < this.height; y += 1) for (let x = 0; x < this.width; x += 1) {
      const cyan = Math.max(0, 1 - Math.hypot(x - this.width * 0.18, y - this.height * 0.12) / 780);
      const orange = Math.max(0, 1 - Math.hypot(x - this.width * 0.82, y - this.height * 0.1) / 620);
      this.pixel(x, y, [4 + cyan * 35 + orange * 25, 7 + cyan * 70 + orange * 25, 13 + cyan * 100, 255]);
    }
  }

  toPng() {
    const scanlines = [];
    for (let y = 0; y < this.height; y += 1) {
      scanlines.push(Buffer.from([0]));
      scanlines.push(this.data.subarray(y * this.width * 4, (y + 1) * this.width * 4));
    }
    const raw = Buffer.concat(scanlines);
    const chunks = [pngChunk("IHDR", ihdr(this.width, this.height)), pngChunk("IDAT", zlib.deflateSync(raw)), pngChunk("IEND", Buffer.alloc(0))];
    return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), ...chunks]);
  }
}

function drawAsset(c, mode) {
  c.gradient();
  c.text("SKYTRACE MISSION CONTROL", 56, 44, 4, [125, 236, 255, 255]);
  c.text("AI MISSION CONTROL FOR", 56, 96, 7, [255, 255, 255, 255]);
  c.text("AUTONOMOUS DRONE OPERATIONS", 56, 156, 7, [255, 255, 255, 255]);
  c.text("RUN FLEETS  DETECT ISSUES  AUTOMATE DECISIONS IN REAL TIME", 60, 232, 3, [203, 213, 225, 255]);

  if (mode === "hero") {
    metrics(c, 60, 285);
    drawMap(c, 60, 405, 930, 505);
    drawSelected(c, 1020, 405, 510, 235);
    drawAutomation(c, 1020, 670, 510, 240);
  }
  if (mode === "map") drawMap(c, 70, 180, 1260, 650, true);
  if (mode === "alerts") drawAlerts(c, 70, 190, 1060, 620);
  if (mode === "telemetry") drawTelemetry(c, 70, 190, 1260, 560);
  if (mode === "automation") { drawSelected(c, 80, 190, 1040, 270); drawAutomation(c, 80, 500, 1040, 300); }
}

function panel(c, x, y, w, h, title) {
  c.rect(x, y, w, h, [15, 23, 42, 210]);
  c.stroke(x, y, w, h, [103, 232, 249, 55], 3);
  c.text(title, x + 28, y + 26, 4, [255, 255, 255, 255]);
}

function metrics(c, x, y) {
  [["FLEET", "4"], ["ALERTS", "2"], ["BATTERY", "58%"], ["SIGNAL", "87%"]].forEach((m, i) => {
    const xx = x + i * 375;
    panel(c, xx, y, 330, 100, m[0]);
    c.text(m[1], xx + 28, y + 58, 5, [255, 255, 255, 255]);
  });
}

function drawMap(c, x, y, w, h, large = false) {
  panel(c, x, y, w, h, "TACTICAL AIRSPACE MAP");
  for (let gx = x + 40; gx < x + w - 20; gx += 60) c.line(gx, y + 90, gx, y + h - 40, [103, 232, 249, 35]);
  for (let gy = y + 90; gy < y + h - 40; gy += 60) c.line(x + 30, gy, x + w - 30, gy, [103, 232, 249, 35]);
  c.circle(x + w / 2, y + h / 2 + 40, Math.floor(Math.min(w, h) * 0.32), [103, 232, 249, 40], false);
  c.circle(x + w / 2, y + h / 2 + 40, Math.floor(Math.min(w, h) * 0.21), [103, 232, 249, 40], false);
  const drones = [[.30,.38,"SCOUT 01", false, false], [.55,.45,"SENTINEL 04", true, true], [.67,.62,"RAVEN 12", true, false], [.42,.70,"HARBOR 07", false, false]];
  for (const [px, py, label, alert, active] of drones) {
    const dx = x + w * px, dy = y + h * py;
    c.line(dx - 80, dy + 42, dx, dy, alert ? [248, 113, 113, 90] : [103, 232, 249, 80]);
    if (active) c.circle(dx, dy, large ? 38 : 28, [103, 232, 249, 42], false);
    c.circle(dx, dy, active ? (large ? 22 : 16) : (large ? 17 : 12), alert ? [248, 113, 113, 255] : [103, 232, 249, 255]);
    c.text(label, dx + 26, dy - 10, large ? 4 : 3, [255, 255, 255, 255]);
  }
  c.rect(x + 35, y + h - 95, large ? 450 : 360, 55, [0, 0, 0, 110]);
  c.text("LOWER MANHATTAN PERIMETER", x + 55, y + h - 78, 3, [255, 255, 255, 255]);
  c.text("SIMULATED GPS LAYER", x + 55, y + h - 50, 3, [203, 213, 225, 255]);
}

function drawSelected(c, x, y, w, h) {
  panel(c, x, y, w, h, "SELECTED ASSET");
  c.text("DRONE 02", x + 28, y + 82, 7, [255, 255, 255, 255]);
  [["STATUS", "REROUTING"], ["ZONE", "PIER 17"], ["ALTITUDE", "410 FT"], ["SPEED", "28 MPH"]].forEach((m, i) => {
    const xx = x + 28 + (i % 2) * (w / 2 - 20), yy = y + 150 + Math.floor(i / 2) * 58;
    c.text(m[0], xx, yy, 3, [148, 163, 184, 255]); c.text(m[1], xx, yy + 26, 3, [255, 255, 255, 255]);
  });
}

function drawAutomation(c, x, y, w, h) {
  panel(c, x, y, w, h, "ACTION LOG");
  ["FLEET REFRESH  4 DRONES  3 ALERTS", "RETURN HOME STAGED  REVIEW ONLY", "SNAPSHOT LOADED FROM MOCK DATA"].forEach((t, i) => {
    c.rect(x + 28, y + 84 + i * 68, w - 56, 48, [2, 6, 23, 180]);
    c.text(t, x + 48, y + 100 + i * 68, 3, [203, 213, 225, 255]);
  });
}

function drawAlerts(c, x, y, w, h) {
  panel(c, x, y, w, h, "ALERTS");
  [["CRITICAL", "GEOFENCE CONFLICT DETECTED", [239, 68, 68, 70]], ["HIGH", "BATTERY RESERVE BELOW ROUTE PLAN", [251, 146, 60, 70]], ["MEDIUM", "SIGNAL DEGRADATION WATCH", [250, 204, 21, 55]]].forEach((a, i) => {
    c.rect(x + 35, y + 95 + i * 155, w - 70, 115, a[2]);
    c.stroke(x + 35, y + 95 + i * 155, w - 70, 115, [255, 255, 255, 55], 2);
    c.text(a[0], x + 60, y + 120 + i * 155, 4, [255, 255, 255, 255]);
    c.text(a[1], x + 60, y + 166 + i * 155, 4, [255, 255, 255, 255]);
  });
}

function drawTelemetry(c, x, y, w, h) {
  panel(c, x, y, w, h, "FLEET TELEMETRY");
  const cols = ["DRONE", "MISSION", "OPERATOR", "BATTERY", "SIGNAL", "COORDINATES"];
  const widths = [180, 250, 190, 160, 150, 260];
  let xx = x + 35;
  cols.forEach((col, i) => { c.text(col, xx, y + 100, 3, [148, 163, 184, 255]); xx += widths[i]; });
  [["DRONE 01", "PERIMETER SCAN", "M RAMOS", "72%", "94%", "40.7128 -74.0060"], ["DRONE 02", "RIVER CORRIDOR", "A CHEN", "22%", "88%", "40.7099 -74.0134"], ["DRONE 03", "ROOFTOP THERMAL", "J PATEL", "64%", "91%", "40.7161 -74.0021"], ["DRONE 04", "EVENT OVERWATCH", "K SMITH", "73%", "75%", "40.7046 -74.0188"]].forEach((row, r) => {
    c.rect(x + 35, y + 145 + r * 82, w - 70, 62, [2, 6, 23, 150]);
    let rx = x + 55;
    row.forEach((cell, i) => { c.text(cell, rx, y + 166 + r * 82, 3, [226, 232, 240, 255]); rx += widths[i]; });
  });
}

function ihdr(width, height) {
  const b = Buffer.alloc(13);
  b.writeUInt32BE(width, 0); b.writeUInt32BE(height, 4); b[8] = 8; b[9] = 6;
  return b;
}

function pngChunk(type, data) {
  const t = Buffer.from(type);
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}

function crc32(buf) {
  let crc = -1;
  for (const byte of buf) {
    crc ^= byte;
    for (let k = 0; k < 8; k += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ -1) >>> 0;
}

const FONT = {
  " ": ["000", "000", "000", "000", "000", "000", "000"],
  A:["01110","10001","10001","11111","10001","10001","10001"],B:["11110","10001","10001","11110","10001","10001","11110"],C:["01111","10000","10000","10000","10000","10000","01111"],D:["11110","10001","10001","10001","10001","10001","11110"],E:["11111","10000","10000","11110","10000","10000","11111"],F:["11111","10000","10000","11110","10000","10000","10000"],G:["01111","10000","10000","10111","10001","10001","01111"],H:["10001","10001","10001","11111","10001","10001","10001"],I:["111","010","010","010","010","010","111"],J:["00111","00010","00010","00010","10010","10010","01100"],K:["10001","10010","10100","11000","10100","10010","10001"],L:["10000","10000","10000","10000","10000","10000","11111"],M:["10001","11011","10101","10101","10001","10001","10001"],N:["10001","11001","10101","10011","10001","10001","10001"],O:["01110","10001","10001","10001","10001","10001","01110"],P:["11110","10001","10001","11110","10000","10000","10000"],Q:["01110","10001","10001","10001","10101","10010","01101"],R:["11110","10001","10001","11110","10100","10010","10001"],S:["01111","10000","10000","01110","00001","00001","11110"],T:["11111","00100","00100","00100","00100","00100","00100"],U:["10001","10001","10001","10001","10001","10001","01110"],V:["10001","10001","10001","10001","10001","01010","00100"],W:["10001","10001","10001","10101","10101","10101","01010"],X:["10001","10001","01010","00100","01010","10001","10001"],Y:["10001","10001","01010","00100","00100","00100","00100"],Z:["11111","00001","00010","00100","01000","10000","11111"],
  0:["01110","10001","10011","10101","11001","10001","01110"],1:["010","110","010","010","010","010","111"],2:["01110","10001","00001","00010","00100","01000","11111"],3:["11110","00001","00001","01110","00001","00001","11110"],4:["00010","00110","01010","10010","11111","00010","00010"],5:["11111","10000","10000","11110","00001","00001","11110"],6:["01110","10000","10000","11110","10001","10001","01110"],7:["11111","00001","00010","00100","01000","01000","01000"],8:["01110","10001","10001","01110","10001","10001","01110"],9:["01110","10001","10001","01111","00001","00001","01110"],
  "%":["11001","11010","00100","01000","10011","0011","00000"],".":["0","0","0","0","0","0","1"],"-":["000","000","000","111","000","000","000"],":":["0","1","0","0","0","1","0"],"/": ["00001","00010","00100","01000","10000","00000","00000"]
};

main().catch((error) => {
  console.error(`[pitch-assets] ${error.stack || error.message}`);
  process.exit(1);
});
