// Mostra cada tipo de trecho (plataformas, trampolim, planar, parede, pterossauro, voo, viatura) com um robô e tira fotos.
// Uso: node tests/tokens3d.mjs [fase] [modo] "tok1,tok2,..."
import { serve, launch } from './helpers.mjs';
import path from 'node:path'; import fs from 'node:fs'; import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url)); const out = path.join(here, 'out', 'tokens3d'); fs.mkdirSync(out, { recursive: true });
const phase = +(process.argv[2] || 3), mode = process.argv[3] || 'facil';
const toks = (process.argv[4] || 'obs,pad,stars,leaf,glidegap,wall,ptero,pickup:flight,flystars,flystars,pickup:truck,obs,stars').split(',');
const srv = await serve(path.join(here, '..', 'dist'));
const { browser, errors } = await launch({ viewport: { width: 1280, height: 600 } });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 600 }, hasTouch: true })).newPage();
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message)); page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
await page.goto('http://localhost:'+(process.env.PORT||4199)+'/?renderer=canvas');
await page.waitForFunction(() => window.__ian && window.__ian.game.scene.isActive('Menu'), null, { timeout: 20000 });
await page.evaluate(() => { try { localStorage.removeItem('ian-e-seus-amigos:v1'); } catch (e) {} });
await page.evaluate(([phase, mode, toks]) => { window.__ian.game.scene.start('Game3D', { mode, phase, seed: 'tok', manual: true }); }, [phase, mode, toks]);
await page.waitForFunction(() => window.__ian3, null, { timeout: 20000 });
await page.evaluate((toks) => {
  const g = window.__ian3; g.queue = toks.slice(); g.tutorialJump = false;
  window.__bot = { jumpAt: -9, dblDone: true, hold: false };
  window.__step = (n) => {
    const b = window.__bot;
    for (let i = 0; i < n; i++) {
      const p = g.p;
      if (g.powers.fly) g.setJump(p.y < 2.4 || g.dist % 7 < 3.5);
      else if (p.ground) {
        g.setJump(false); b.hold = false; b.dblDone = true;
        const h = g.nextHazard(), jd = g.jumpDist();
        if (g.tutorialActive) { if (g.tutKind === 'double') { g.setJump(true); g.setJump(false); b.dblDone = false; b.jumpAt = g.t; } else { g.setJump(true); g.setJump(false); b.jumpAt = g.t; b.hold = true; } }
        else if (h && h.gap > 0) { const lead = h.kind === 'hole' && !h.glide ? 0.9 : h.kind === 'wall' ? jd * 0.24 : h.glide ? jd * 0.1 : jd * 0.26; if (h.gap < lead) { g.setJump(true); g.setJump(false); b.jumpAt = g.t; b.dblDone = h.kind !== 'wall'; b.hold = !!h.glide; } }
        // plataformas: o robô pula do trampolim sem precisar de mais nada
      } else { if (!b.dblDone && g.t - b.jumpAt > 0.22) { g.setJump(true); g.setJump(false); b.dblDone = true; } g.setJump(b.hold || (g.p.vy < -2 && g.world.inHole(g.dist - 0.5, g.dist + 3.5))); }
      g.tick(1 / 60);
    }
    g.render();
    const near = (type, kind) => { let best = 99; for (const e of g.ents) if ((e.type === type) && (!kind || e.kind === kind) && e.s - g.dist > -2) best = Math.min(best, e.s - g.dist); return best; };
    return { y: g.p.y, ground: g.p.ground, powers: Object.keys(g.powers), tut: g.tutKind, falls: g.stats.falls, hits: g.stats.hits, dist: g.dist, q: g.queue.length,
      pad: near('pad'), plat: near('plat'), wall: near('obs', 'wall'), ptero: near('obs', 'ptero'), hole: near('hole'), floats: g.stats.floats, doubles: g.stats.doubles, bounces: g.stats.bounces || 0 };
  };
}, toks);
const taken = new Set(); let s;
const snap = async (name) => { if (taken.has(name)) return; taken.add(name); await page.screenshot({ path: path.join(out, `${name}.png`) }); };
for (let k = 0; k < 60 * 120 / 6; k++) {
  s = await page.evaluate(() => window.__step(6));
  if (s.pad < 8) await snap('pad'); if (s.plat < 6 && s.y > 1.9) await snap('sobre-plataforma'); if (s.plat < 7) await snap('plataforma');
  if (s.hole < 9) await snap('buraco'); if (s.wall < 7) await snap('parede'); if (s.ptero < 7) await snap('ptero');
  if (s.tut === 'double') await snap('tutorial-pulo-duplo'); if (s.tut === 'float') await snap('tutorial-planar');
  if (s.powers.includes('fly') && s.y > 2.2) await snap('voo'); if (s.powers.includes('truck')) await snap('viatura'); if (s.powers.includes('glide') && !s.ground) await snap('planador');
  if (!s.ground && s.y > 0.5 && s.hole < 3 && s.floats) await snap('planando-no-vao');
  if (s.q === 0 && s.dist > 400) break;
}
console.log(JSON.stringify(s)); console.log('fotos:', [...taken].join(', ')); console.log('erros:', errors.slice(0, 5));
await browser.close(); srv.close();
