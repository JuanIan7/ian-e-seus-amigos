// Gera as imagens de comparação de qualidade. Uso: node tests/showcase.mjs tree,house [atual,alta,muito]
import { serve, launch } from './helpers.mjs';
import path from 'node:path'; import fs from 'node:fs'; import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const srv = await serve(path.join(here, '..', 'dist'));
const PORT = +(process.env.PORT || 4199);
const { browser, page, errors } = await launch({ viewport: { width: 720, height: 540 } });
const out = path.join(here, 'out', 'showcase'); fs.mkdirSync(out, { recursive: true });
const els = (process.argv[2] || 'tree,house,tower,lamp,binfire,truck,obstacles').split(',');
const lv = (process.argv[3] || 'atual,alta,muito').split(',');
for (const el of els) for (const q of lv) {
  await page.goto(`http://localhost:${PORT}/showcase.html?el=${el}&q=${q}`);
  await page.waitForFunction(() => window.__ready, null, { timeout: 60000 });
  const st = await page.evaluate(() => window.__stats);
  await page.screenshot({ path: path.join(out, `${el}-${q}.png`) });
  console.log(el, q, JSON.stringify(st));
}
console.log('erros:', errors.length ? errors.slice(0, 5) : 'nenhum');
await browser.close(); srv.close();
