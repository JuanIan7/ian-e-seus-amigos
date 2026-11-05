// Gera o ícone (1024x1024) e o splash universal (2732x2732) do iOS, reaproveitando a mesma
// arte (conceito B) usada no Android, a partir do mock export.html.
import { serve, launch } from './helpers.mjs';
import path from 'node:path'; import fs from 'node:fs'; import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const assets = path.join(here, '..', 'ios', 'App', 'App', 'Assets.xcassets');
const PORT = +(process.env.PORT || 4198);
const srv = await serve(path.join(here, 'mock'), PORT);
const { browser, page, errors } = await launch({ viewport: { width: 1024, height: 1024 } });

async function shot(mode, w, h, outFile) {
  await page.setViewportSize({ width: w, height: h });
  await page.goto(`http://localhost:${PORT}/export.html?mode=${mode}&w=${w}&h=${h}`);
  await page.waitForFunction(() => window.__ready, null, { timeout: 20000 });
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  await page.screenshot({ path: outFile });
  console.log('OK', outFile);
}

// ícone da App Store/launcher: 1024x1024, opaco (sem transparência)
await shot('icon', 1024, 1024, path.join(assets, 'AppIcon.appiconset', 'AppIcon-512@2x.png'));

// splash universal: um único PNG 2732x2732 usado nos 3 slots (1x/2x/3x)
const splashOut = path.join(assets, 'Splash.imageset');
await shot('splash-square', 2732, 2732, path.join(splashOut, 'splash-2732x2732.png'));
fs.copyFileSync(path.join(splashOut, 'splash-2732x2732.png'), path.join(splashOut, 'splash-2732x2732-1.png'));
fs.copyFileSync(path.join(splashOut, 'splash-2732x2732.png'), path.join(splashOut, 'splash-2732x2732-2.png'));

console.log('erros:', errors.length ? errors.slice(0, 5) : 'nenhum');
await browser.close(); srv.close();
