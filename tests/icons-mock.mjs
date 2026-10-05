// Gera as imagens de comparação de ícone + tela de carregamento. Uso: node tests/icons-mock.mjs
import { serve, launch } from './helpers.mjs';
import path from 'node:path'; import fs from 'node:fs'; import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const PORT = +(process.env.PORT || 4198);
const srv = await serve(path.join(here, 'mock'), PORT);
const { browser, page, errors } = await launch({ viewport: { width: 640, height: 610 } });
const out = path.join(here, 'out', 'icons'); fs.mkdirSync(out, { recursive: true });
for (const c of ['a', 'b', 'c']) {
  await page.goto(`http://localhost:${PORT}/icons.html?c=${c}`);
  await page.waitForFunction(() => window.__ready, null, { timeout: 20000 });
  await page.screenshot({ path: path.join(out, `concept-${c}.png`) });
  console.log(c, 'ok');
}
console.log('erros:', errors.length ? errors.slice(0, 5) : 'nenhum');
await browser.close(); srv.close();
