// Simulação determinística: roda o jogo "por dentro" em passos de 1/60 s com bots diferentes.
import { serve, launch, waitGame } from './helpers.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const srv = await serve(root);
const { browser, errors } = await launch();
const results = [];
let failed = false;

async function runBot(mode, bot, seconds, seed = 'teste-1') {
  const ctx = await browser.newContext({ viewport: { width: 1560, height: 720 } }); // contexto novo = salvamento limpo
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  await waitGame(page, 'http://localhost:4199/?renderer=canvas');
  const out = await page.evaluate(async ({ mode, bot, seconds, seed }) => {
    const game = window.__ian.game;
    game.scene.start('Game', { mode, seed, manual: true });
    await new Promise((r) => setTimeout(r, 400));
    const s = game.scene.getScene('Game');
    const dt = 1 / 60, steps = Math.round(seconds / dt);
    let maxObs = 0, stuckT = 0, lastDist = 0, maxStuck = 0, maxAssist = 0, firesDone = 0, lastFireOut = false;
    const log = [];
    const pressJumpIfNeeded = () => {
      const p = s.p; if (!p.ground) return;
      const obs = s.obstacles.filter((o) => o.solid && !o.hit && o.x + o.w > p.x - 20);
      if (!obs.length) return;
      const g = obs.reduce((a, o) => (o.x < a.x ? o : a));
      const mem = obs.filter((o) => o.group === g.group);
      const l = Math.min(...mem.map((o) => o.x)), r = Math.max(...mem.map((o) => o.x + o.w));
      if ((l + r) / 2 - p.x <= s.baseSpeed * s.airtime / 2) s.pressJump();
    };
    for (let i = 0; i < steps; i++) {
      if (bot === 'perfect') { pressJumpIfNeeded(); if (s.fire && s.fire.engaged && i % 12 === 0) s.pressAction(); }
      else if (bot === 'mash') { if (i % 17 === 0) s.pressJump(); if (i % 23 === 0) s.pressAction(); }
      // 'none' = nenhuma entrada
      const before = s.stats.hits;
      s.tick(dt);
      if (s.stats.hits > before) log.push({ t: +s.t.toFixed(1), obs: s.obstacles.filter(o=>o.solid).map(o=>({k:o.kind,x:Math.round(o.x),g:o.group})) .slice(0,3), speed: Math.round(s.worldSpeed) });
      maxObs = Math.max(maxObs, s.obstacles.length);
      maxAssist = Math.max(maxAssist, s.assist);
      const eng = s.fire && s.fire.engaged;
      if (s.dist - lastDist < 0.5 && !eng) stuckT += dt; else { stuckT = 0; lastDist = s.dist; }
      maxStuck = Math.max(maxStuck, stuckT);
      lastDist = s.dist;
    }
    const snap = s.snapshot();
    return { snap, maxObs, maxStuck: +maxStuck.toFixed(2), maxAssist, log: log.slice(0, 5), items: s.items.length, drops: s.drops.length };
  }, { mode, bot, seconds, seed });
  await ctx.close();
  return out;
}

const plan = [
  ['facil', 'perfect', 240], ['aventura', 'perfect', 240], ['desafio', 'perfect', 240],
  ['facil', 'none', 120], ['facil', 'mash', 120], ['desafio', 'mash', 120],
];
for (const [mode, bot, sec] of plan) {
  const r = await runBot(mode, bot, sec);
  const ok = bot !== 'perfect' || r.snap.stats.hits === 0;
  results.push({ mode, bot, sec, hits: r.snap.stats.hits, jumps: r.snap.stats.jumps, stars: r.snap.stars, fires: r.snap.stats.fires, hose: r.snap.hasHose, speed: Math.round(r.snap.speed || 0), assist: r.maxAssist, maxStuck: r.maxStuck, maxObs: r.maxObs, ok });
  if (!ok) { failed = true; console.log('FALHA', mode, bot, JSON.stringify(r.log)); }
}
console.table(results);
if (errors.length) { console.log('ERROS DE PÁGINA:', errors); failed = true; }
await browser.close(); srv.close();
process.exit(failed ? 1 : 0);
