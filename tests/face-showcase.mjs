// Gera as imagens de comparação de estilo de rosto. Uso: node tests/face-showcase.mjs
import { serve, launch } from './helpers.mjs';
import path from 'node:path'; import fs from 'node:fs'; import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const srv = await serve(path.join(here, '..', 'dist'));
const PORT = +(process.env.PORT || 4199);
const { browser, page, errors } = await launch({ viewport: { width: 640, height: 640 } });
const out = path.join(here, 'out', 'faces'); fs.mkdirSync(out, { recursive: true });
const styles = ['infantil', 'normal', 'anime', 'realista', 'ultra'];
for (const st of styles) {
  await page.goto(`http://localhost:${PORT}/faces.html?style=${st}`);
  await page.waitForFunction(() => window.__ready, null, { timeout: 60000 });
  await page.screenshot({ path: path.join(out, `${st}.png`) });
  console.log(st, 'ok');
}
console.log('erros:', errors.length ? errors.slice(0, 5) : 'nenhum');
await browser.close(); srv.close();
