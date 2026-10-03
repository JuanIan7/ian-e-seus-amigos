// Captura a página de modelos (viewer.html). Uso: node tests/viewer3d.mjs what cam [dist] [cols] [fov]
import { serve, launch } from './helpers.mjs';
import path from 'node:path'; import fs from 'node:fs'; import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url)); const out = path.join(here, 'out', 'models'); fs.mkdirSync(out, { recursive: true });
const [what = 'dogs', cam = 'back', dist = '13', cols = '3', fov = '32'] = process.argv.slice(2);
const srv = await serve(path.join(here, '..', 'dist'));
const { browser, page, errors } = await launch({ viewport: { width: 1280, height: 640 } });
await page.goto(`http://localhost:4199/viewer.html?what=${what}&cam=${cam}&dist=${dist}&cols=${cols}&fov=${fov}`);
await page.waitForFunction(() => window.__ready, null, { timeout: 20000 });
await page.screenshot({ path: path.join(out, `${what}-${cam}.png`) });
console.log('erros:', errors.slice(0, 5));
await browser.close(); srv.close();
