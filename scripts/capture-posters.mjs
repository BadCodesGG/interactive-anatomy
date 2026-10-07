/**
 * Captures the assembled brain and body, in both themes, into public/posters/<feature>.png and <feature>-dark.png at 1200x800 (the chooser's
 * cards), and the stage's own cuts <feature>-stage[-dark].png (800x520 at 2x, the desktop plate) and <feature>-portrait[-dark].png (540x675 at 2x,
 * a phone's 4:5 plate, narrow enough that the stage draws no leader labels): the stills the stage gate shows before the 3D view
 * draws, without WebGL 2, and under reduced motion. POSTER_VARIANTS=stage,portrait (a comma list of "", "stage", "portrait") limits the run.
 *
 * Runs against `next start` after `npm run build`, on a free port, or against STAGE_URL if set.
 * With POSTER_PREVIEW_DIR set it also saves the exploded pose there, for checking the layout by eye.
 */

import { chromium } from "playwright";
import { existsSync, mkdirSync } from "node:fs";
import { createServer } from "node:net";
import path from "node:path";
import { ROOT, startDevServer, stopDevServer, waitForServer } from "./lib/dev-server.mjs";

const FEATURES = ["brain", "body"];
// One still per theme: the light plate is <feature>.png, the night plate <feature>-dark.png.
const THEMES = [
  { theme: "light", suffix: "" },
  { theme: "dark", suffix: "-dark" },
];
const OUT = path.join(ROOT, "public", "posters");
const PREVIEW = process.env.POSTER_PREVIEW_DIR ? path.resolve(ROOT, process.env.POSTER_PREVIEW_DIR) : null;

// The cuts: the file's name suffix, the gate's size in CSS px and the capture's pixel ratio.
const VARIANTS = [
  { name: "", width: 1200, height: 800, scale: 1 },
  { name: "-stage", width: 800, height: 520, scale: 2 },
  { name: "-portrait", width: 540, height: 675, scale: 2 },
];
const ONLY = process.env.POSTER_VARIANTS?.split(",");

// The gate at poster size, alone on the page.
const posterCss = ({ width, height }) => `
  main { max-width: none !important; padding: 0 !important; }
  aside, header, footer, [data-explode-controls], [data-age-control], [data-tour-entry] { display: none !important; }
  [data-plate] { margin: 0 !important; }
  [data-stage-gate] { width: ${width}px !important; height: ${height}px !important; max-width: none !important; max-height: none !important; min-height: 0 !important; aspect-ratio: auto !important; border: 0 !important; border-radius: 0 !important; clip-path: none !important; }
  /* Next's dev-server badge, when STAGE_URL points at \`next dev\` rather than a production build. */
  nextjs-portal { display: none !important; }
  /* The page sets the plate's frame, number and caption around the poster; the poster is only the stage. */
  [data-plate]::before, [data-plate] > p, [data-plate] > figcaption { display: none !important; }
`;

const freePort = () =>
  new Promise((resolve, reject) => {
    const srv = createServer();
    srv.once("error", reject);
    srv.listen(0, () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });

async function main() {
  const explicit = process.env.STAGE_URL;
  if (!explicit && !existsSync(path.join(ROOT, ".next", "BUILD_ID"))) throw new Error("No production build found (.next/BUILD_ID). Run `npm run build` first.");
  const port = explicit ? null : await freePort();
  const baseUrl = explicit ?? `http://localhost:${port}`;
  const server = explicit ? null : startDevServer(port, "start");
  const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  try {
    await waitForServer(baseUrl, 90_000);
    mkdirSync(OUT, { recursive: true });
    if (PREVIEW) mkdirSync(PREVIEW, { recursive: true });
    const jobs = VARIANTS.filter((v) => !ONLY || ONLY.includes(v.name.replace(/^-/, ""))).flatMap((variant) =>
      THEMES.flatMap((t) => FEATURES.map((feature) => ({ variant, feature, ...t }))),
    );
    for (const { variant, feature, theme, suffix } of jobs) {
      const context = await browser.newContext({ viewport: { width: 1300, height: 900 }, deviceScaleFactor: variant.scale });
      await context.addInitScript((t) => localStorage.setItem("theme", t), theme);
      const page = await context.newPage();
      await page.goto(new URL(`/${feature}`, baseUrl).href, { waitUntil: "load" });
      await page.addStyleTag({ content: posterCss(variant) });
      // The canvas sizes itself to the gate when it mounts: wait for it, then for the first frame.
      await page.waitForSelector('[data-stage-ready="true"]', { timeout: 90_000 });
      await page.waitForTimeout(800);
      const gate = page.locator("[data-stage-gate]");
      const file = path.join(OUT, `${feature}${variant.name}${suffix}.png`);
      await gate.screenshot({ path: file });
      console.log(`wrote ${path.relative(ROOT, file)}`);
      if (PREVIEW) {
        await page.evaluate(() => {
          const r = document.querySelector("[data-explode-range]");
          const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
          set.call(r, "1");
          r.dispatchEvent(new Event("input", { bubbles: true }));
        });
        await page.waitForSelector('[data-stage-k="1"]', { timeout: 20_000 });
        await page.waitForTimeout(500);
        const shot = path.join(PREVIEW, `${feature}${variant.name}${suffix}-exploded.png`);
        await gate.screenshot({ path: shot });
        console.log(`preview ${shot}`);
      }
      await context.close();
    }
  } finally {
    await browser.close();
    stopDevServer(server);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
