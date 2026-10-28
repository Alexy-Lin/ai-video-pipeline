/**
 * Records every feature beat of the intro as a REAL frame sequence.
 *
 * Chrome's CDP `Page.startScreencast` pushes a frame whenever the page repaints.
 * CDP ignores frames while nothing changes, so a hidden 1px probe repaints every
 * animation frame — that keeps the capture at a steady ~60fps instead of ~6fps.
 * Frames arrive at irregular times and are resampled onto a strict 30fps grid.
 *
 *   node scripts/capture-frames.mjs            # all flows
 *   node scripts/capture-frames.mjs player     # just one
 *
 * Output per flow:
 *   public/frames/<key>/*.jpg
 *   src/generated/<key>Frames.json
 */
import { chromium } from 'playwright-core';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const BASE = process.env.FC27_BASE ?? 'http://127.0.0.1:8765';
const CHROME =
  process.env.FC27_CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FPS = 30;
const ROOT = process.cwd();

const VIEWPORT = { width: 1600, height: 900 };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const tab = (view) => `.tab[data-view="${view}"]`;

async function jsClick(page, selector, timeout = 20000) {
  const deadline = Date.now() + timeout;
  for (;;) {
    const clicked = await page
      .$eval(selector, (el) => {
        el.click();
        return true;
      })
      .catch(() => false);
    if (clicked) return;
    if (Date.now() > deadline) throw new Error(`element never appeared: ${selector}`);
    await wait(250);
  }
}

/** Each flow is the real user story we want to see in the video. */
const FLOWS = [
  {
    key: 'player',
    run: async (page) => {
      await page.click('#playerSearch');
      await page.type('#playerSearch', 'Lionel Messi', { delay: 100 });
      await wait(800);
      await jsClick(page, '#playerResults [data-player-id]');
      await wait(1500);
    },
  },
  {
    key: 'teams',
    run: async (page) => {
      await jsClick(page, tab('teams'));
      await wait(500);
      await page.click('#teamSearch');
      await page.type('#teamSearch', 'Milan', { delay: 80 });
      await page.waitForSelector('#teamResults [data-team-id]', { timeout: 30000 });
      await wait(500);
      await jsClick(page, '#teamResults [data-team-id]');
      await wait(1300);
    },
  },
  {
    key: 'transfers',
    run: async (page) => {
      await jsClick(page, tab('transfers'));
      await wait(500);
      await page.click('#transferFromTeam');
      await page.type('#transferFromTeam', 'Milan', { delay: 70 });
      await page.waitForSelector('#transferFromOptions [data-transfer-team-id]', { timeout: 30000 });
      await wait(450);
      await jsClick(page, '#transferFromOptions [data-transfer-team-id]');
      await wait(500);
      await page.click('#transferToTeam');
      await page.type('#transferToTeam', '112893', { delay: 60 });
      await page.waitForSelector('#transferToOptions [data-transfer-team-id]', { timeout: 30000 });
      await wait(450);
      await jsClick(page, '#transferToOptions [data-transfer-team-id]');
      await wait(1500);
    },
  },
  {
    key: 'national',
    run: async (page) => {
      await jsClick(page, tab('national'));
      await page.waitForFunction(
        () => (document.querySelector('#nationalTeam')?.options.length ?? 0) > 1,
        null,
        { timeout: 30000 },
      );
      await wait(400);
      await page.selectOption('#nationalTeam', { index: 1 });
      await wait(1700);
    },
  },
  {
    key: 'quick',
    run: async (page) => {
      await jsClick(page, tab('quick'));
      await wait(500);
      await page.click('#peakPreview');
      await page.waitForFunction(() => document.querySelector('#listDialog')?.open === true, null, {
        timeout: 60000,
      });
      await wait(1500);
    },
  },
];

/** Capture one flow, then resample onto a fixed 30fps timeline. */
async function captureFlow(context, flow) {
  const imgDir = path.join(ROOT, 'public', 'frames', flow.key);
  const manifest = path.join(ROOT, 'src', 'generated', `${flow.key}Frames.json`);

  await rm(imgDir, { recursive: true, force: true });
  await mkdir(imgDir, { recursive: true });
  await mkdir(path.dirname(manifest), { recursive: true });

  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForFunction(
    () => Number((document.querySelector('#playerCount')?.textContent ?? '').replace(/[^0-9]/g, '')) > 1000,
    null,
    { timeout: 90000 },
  );
  await wait(900);

  const client = await context.newCDPSession(page);
  const raw = [];
  let index = 0;

  client.on('Page.screencastFrame', async (event) => {
    const n = index++;
    const file = `${String(n).padStart(5, '0')}.jpg`;
    try {
      await writeFile(path.join(imgDir, file), Buffer.from(event.data, 'base64'));
      raw.push({ file, t: event.metadata.timestamp });
    } catch (error) {
      console.warn('  frame write failed', error.message);
    }
    await client.send('Page.screencastFrameAck', { sessionId: event.sessionId }).catch(() => {});
  });

  await client.send('Page.startScreencast', {
    format: 'jpeg',
    quality: 92,
    maxWidth: VIEWPORT.width,
    maxHeight: VIEWPORT.height,
    everyNthFrame: 1,
  });

  await wait(400);
  await flow.run(page);
  await client.send('Page.stopScreencast');
  await wait(600);
  await page.close();

  if (raw.length < 10) throw new Error(`${flow.key}: only ${raw.length} frames`);

  raw.sort((a, b) => a.t - b.t);
  const t0 = raw[0].t;
  const duration = raw[raw.length - 1].t - t0;
  const frameCount = Math.max(1, Math.round(duration * FPS));

  const sequence = [];
  let cursor = 0;
  for (let i = 0; i < frameCount; i += 1) {
    const target = t0 + i / FPS;
    while (cursor + 1 < raw.length && raw[cursor + 1].t <= target) cursor += 1;
    sequence.push(raw[cursor].file);
  }

  await writeFile(
    manifest,
    `${JSON.stringify({ fps: FPS, durationInFrames: frameCount, frames: sequence }, null, 2)}\n`,
    'utf8',
  );

  console.log(
    `  ${flow.key}: ${raw.length} raw -> ${frameCount} frames @30fps (${duration.toFixed(2)}s)`,
  );
  return { key: flow.key, frameCount, rawCount: raw.length, duration };
}

async function main() {
  const only = process.argv[2];
  const flows = only ? FLOWS.filter((f) => f.key === only) : FLOWS;
  if (!flows.length) throw new Error(`unknown flow: ${only}`);

  const browser = await chromium.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--hide-scrollbars', '--force-color-profile=srgb'],
  });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
  });

  // Keep the compositor repainting so the screencast delivers a real 60fps.
  await context.addInitScript(() => {
    window.addEventListener('DOMContentLoaded', () => {
      const probe = document.createElement('div');
      probe.style.cssText =
        'position:fixed;left:0;top:0;width:1px;height:1px;pointer-events:none;z-index:2147483647;';
      document.body.appendChild(probe);
      let toggle = false;
      const tick = () => {
        toggle = !toggle;
        probe.style.backgroundColor = toggle ? 'rgba(0,0,0,0.01)' : 'rgba(0,0,0,0.02)';
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  });

  const results = [];
  for (const flow of flows) {
    console.log(`capturing ${flow.key} ...`);
    try {
      results.push(await captureFlow(context, flow));
    } catch (error) {
      console.error(`  FAILED ${flow.key}: ${error.message}`);
    }
  }

  await browser.close();
  console.table(results);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
