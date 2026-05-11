# SkyTrace pitch deck assets

These PNGs are exported from the `/drone` mission-control MVP for investor pitch materials.

## Start the app

```bash
npm install
npm run dev
```

Open the MVP at:

```text
http://localhost:3000/drone
```

## Capture or refresh screenshots

Run:

```bash
npm run capture:pitch-assets
```

The capture script writes PNG files to:

```text
public/pitch-assets/
```

Generated PNG exports are intentionally ignored by Git so the repository keeps only the capture automation, documentation, and this lightweight folder placeholder.

For exact browser screenshots, install Playwright locally and its Chromium browser before running the command:

```bash
npm install --save-dev @playwright/test
npx playwright install chromium
npm run capture:pitch-assets
```

If Playwright or Chromium is unavailable, the script writes deterministic fallback PNG assets using the same SkyTrace mission-control content and visual framing. To capture from an already-running app on another port, set:

```bash
PITCH_CAPTURE_URL=http://127.0.0.1:3001 npm run capture:pitch-assets
```

## Exported assets

| File | Source view | Recommended slide |
| --- | --- | --- |
| `skytrace-dashboard-hero.png` | Full `/drone` hero viewport | Product vision / hero demo slide |
| `skytrace-map-view.png` | Tactical airspace map panel | Live operations / situational awareness slide |
| `skytrace-alerts-panel.png` | Alert review queue | AI risk detection / operator review slide |
| `skytrace-telemetry-panel.png` | Fleet telemetry table | Data platform / telemetry ingestion slide |
| `skytrace-automation-panel.png` | Selected asset and automation action log | Human-in-the-loop automation slide |

## Manual screenshot fallback

If browser automation fails locally:

1. Start the app with `npm run dev`.
2. Visit `http://localhost:3000/drone`.
3. Set the browser window to roughly `1440 × 1100` for hero screenshots.
4. Capture the top viewport for `skytrace-dashboard-hero.png`.
5. Use browser devtools or your OS screenshot tool to crop the map, alerts, telemetry, and automation panels.
6. Save each PNG into `public/pitch-assets/` using the filenames above.
