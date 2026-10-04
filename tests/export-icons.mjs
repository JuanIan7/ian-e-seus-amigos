// Gera os PNGs reais de ícone + splash (conceito B) nos tamanhos que o Android espera.
import { serve, launch } from './helpers.mjs';
import path from 'node:path'; import fs from 'node:fs'; import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const res = path.join(here, '..', 'android', 'app', 'src', 'main', 'res');
const PORT = +(process.env.PORT || 4197);
const srv = await serve(path.join(here, 'mock'), PORT);
const { browser, page, errors } = await launch({ viewport: { width: 512, height: 512 } });

async function shot(mode, w, h, outFile) {
  await page.setViewportSize({ width: w, height: h });
  await page.goto(`http://localhost:${PORT}/export.html?mode=${mode}&w=${w}&h=${h}`);
  await page.waitForFunction(() => window.__ready, null, { timeout: 20000 });
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  await page.screenshot({ path: outFile, omitBackground: mode === 'fg' });
  console.log('OK', outFile);
}

// ícone legado (quadrado opaco) e versão "round" (mesmo bitmap — a máscara redonda é aplicada pelo launcher)
const ICON = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
for (const [dpi, sz] of Object.entries(ICON)) {
  await shot('icon', sz, sz, path.join(res, `mipmap-${dpi}`, 'ic_launcher.png'));
  await shot('icon', sz, sz, path.join(res, `mipmap-${dpi}`, 'ic_launcher_round.png'));
}
// camada "foreground" do ícone adaptativo (Android 8+), fundo transparente
const FG = { mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 };
for (const [dpi, sz] of Object.entries(FG)) {
  await shot('fg', sz, sz, path.join(res, `mipmap-${dpi}`, 'ic_launcher_foreground.png'));
}
// splash retrato
const PORT_SPLASH = { mdpi: [320, 480], hdpi: [480, 800], xhdpi: [720, 1280], xxhdpi: [960, 1600], xxxhdpi: [1280, 1920] };
for (const [dpi, [w, h]] of Object.entries(PORT_SPLASH)) {
  await shot('splash', w, h, path.join(res, `drawable-port-${dpi}`, 'splash.png'));
}
// splash paisagem
const LAND_SPLASH = { mdpi: [480, 320], hdpi: [800, 480], xhdpi: [1280, 720], xxhdpi: [1600, 960], xxxhdpi: [1920, 1280] };
for (const [dpi, [w, h]] of Object.entries(LAND_SPLASH)) {
  await shot('splash-land', w, h, path.join(res, `drawable-land-${dpi}`, 'splash.png'));
}
// padrão (drawable/splash.png) — paisagem base, usado antes do Android resolver a densidade
await shot('splash-land', 480, 320, path.join(res, 'drawable', 'splash.png'));

console.log('erros:', errors.length ? errors.slice(0, 5) : 'nenhum');
await browser.close(); srv.close();
