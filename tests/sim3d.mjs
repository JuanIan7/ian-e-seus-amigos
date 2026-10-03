// Testes automáticos do jogo 3D: controles (correr, pulo duplo, descida suave), progressão de velocidade, pausa, fases.
// Uso: node tests/sim3d.mjs   (precisa de `npx vite build` antes)
import { serve, launch } from './helpers.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const srv = await serve(process.env.DIST ? path.resolve(process.env.DIST) : path.join(here, '..', 'dist'));
const { browser, errors } = await launch({ viewport: { width: 1280, height: 600 } });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 600 }, hasTouch: true });
const page = await ctx.newPage();
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message)); page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
let fails = 0;
const ok = (c, msg, extra = '') => { console.log((c ? '  ok  ' : ' FALHA ') + msg + (extra ? '  [' + extra + ']' : '')); if (!c) fails++; };

async function start(mode, phase = 1, free = true) {
  await page.goto(`http://localhost:${process.env.PORT || 4199}/?renderer=canvas`);
  await page.waitForFunction(() => window.__ian && window.__ian.game.scene.isActive('Menu'), null, { timeout: 20000 });
  await page.evaluate(() => { try { localStorage.setItem('ian-e-seus-amigos:v1', JSON.stringify({ tut: { jump: true, water: true } })); } catch (e) {} });
  await page.evaluate(([mode, phase, free]) => {
    window.__ian.game.scene.start('Game3D', { mode, phase, seed: 'sim', manual: true });
  }, [mode, phase, free]);
  await page.waitForFunction(() => window.__ian3, null, { timeout: 20000 });
  if (free) await page.evaluate(() => { const g = window.__ian3; g.spawnLogic = () => {}; g.tutorialJump = false; g.p.invul = 1e9; });
}
const run = (fn, arg) => page.evaluate(fn, arg);
const ticks = (n) => run((n) => { const g = window.__ian3; for (let i = 0; i < n; i++) g.tick(1 / 60); return g.snapshot(); }, n);

// ---------------------------------------------------------------- 1. segurar correr / acelerar gradualmente
console.log('1. Correr (segurar para a frente)');
for (const mode of ['facil', 'aventura', 'desafio']) {
  await start(mode);
  const cfg = await run(() => ({ ...window.__ian3.cfg }));
  let s = await ticks(120);
  const free = s.speed;
  await run(() => window.__ian3.setRun(true));
  const mid = await ticks(30); const full = await ticks(240);
  await run(() => window.__ian3.setRun(false));
  const rel = await ticks(240);
  ok(mid.speed > free * 1.01 && mid.speed < full.speed, `${mode}: acelera aos poucos (${free.toFixed(2)} → ${mid.speed.toFixed(2)} → ${full.speed.toFixed(2)})`);
  ok(full.speed <= cfg.speedMax * cfg.runBoost * 1.03, `${mode}: respeita o limite seguro`, `${full.speed.toFixed(2)} ≤ ${(cfg.speedMax * cfg.runBoost).toFixed(2)}`);
  ok(rel.speed < full.speed - 0.2 && rel.speed >= rel.base * 0.98, `${mode}: ao soltar, volta suavemente (${rel.speed.toFixed(2)})`);
}

// ---------------------------------------------------------------- 2. salto, pulo duplo e descida suave
console.log('2. Salto, pulo duplo e descida suave');
for (const mode of ['facil', 'aventura', 'desafio']) {
  await start(mode);
  await ticks(10);
  // salto simples
  const single = await run(() => { const g = window.__ian3; let max = 0; g.setJump(true); g.setJump(false); for (let i = 0; i < 200; i++) { g.tick(1 / 60); max = Math.max(max, g.p.y); if (g.p.ground && i > 5) break; } return { max, doubles: g.stats.doubles }; });
  ok(single.max > 1.2 && single.doubles === 0, `${mode}: salto simples chega a ${single.max.toFixed(2)} m`);
  await ticks(30);
  // toque duplo
  const dbl = await run(() => { const g = window.__ian3; let max = 0, flip = false; g.setJump(true); g.setJump(false); for (let i = 0; i < 14; i++) g.tick(1 / 60); g.setJump(true); g.setJump(false); const y0 = g.p.y; for (let i = 0; i < 260; i++) { g.tick(1 / 60); max = Math.max(max, g.p.y); flip = flip || g.p.flip > 0; if (g.p.ground && i > 5) break; } return { max, y0, doubles: g.stats.doubles, flip }; });
  ok(dbl.doubles === 1 && dbl.max > single.max * 1.3 && dbl.flip, `${mode}: pulo duplo uma vez, mais alto (${dbl.max.toFixed(2)} m) e com cambalhota`);
  await ticks(30);
  // terceiro toque no mesmo salto não faz nada
  const triple = await run(() => { const g = window.__ian3; g.stats.doubles = 0; g.setJump(true); g.setJump(false); for (let i = 0; i < 14; i++) g.tick(1 / 60); for (let k = 0; k < 3; k++) { g.setJump(true); g.setJump(false); for (let i = 0; i < 6; i++) g.tick(1 / 60); } for (let i = 0; i < 200; i++) { g.tick(1 / 60); if (g.p.ground && i > 5) break; } return g.stats.doubles; });
  ok(triple === 1, `${mode}: no máximo um pulo duplo por salto`, 'doubles=' + triple);
  await ticks(30);
  // segurar durante a descida
  const fall = await run(() => { const g = window.__ian3; const rec = (hold) => { g.setJump(true); g.setJump(false); let maxFall = 0, air = 0; for (let i = 0; i < 300; i++) { if (i === 20 && hold) g.setJump(true); g.tick(1 / 60); maxFall = Math.min(maxFall, g.p.vy); if (!g.p.ground) air++; if (g.p.ground && i > 5) break; } g.setJump(false); return { maxFall, air: air / 60, floats: g.stats.floats }; }; const a = rec(false); for (let i = 0; i < 40; i++) g.tick(1 / 60); const b = rec(true); return { a, b }; });
  ok(fall.b.air > fall.a.air + 0.15 && fall.b.maxFall > fall.a.maxFall * 0.6, `${mode}: segurar o pulo faz descer devagar`, `ar ${fall.a.air.toFixed(2)}s → ${fall.b.air.toFixed(2)}s, queda máx ${fall.a.maxFall.toFixed(1)} → ${fall.b.maxFall.toFixed(1)}`);
  ok(fall.b.air < fall.a.air + 3.0, `${mode}: a descida lenta é limitada`);
}

// ---------------------------------------------------------------- 3. combinação: correr + pulo duplo + segurar na descida
console.log('3. Combinação correr + pulo duplo + descida suave');
for (const mode of ['facil', 'aventura', 'desafio']) {
  await start(mode);
  await ticks(60);
  const r = await run(() => {
    const g = window.__ian3; g.setRun(true); for (let i = 0; i < 120; i++) g.tick(1 / 60);
    const d0 = g.dist, v0 = g.worldSpeed;
    g.setJump(true); g.setJump(false); for (let i = 0; i < 16; i++) g.tick(1 / 60);
    g.setJump(true); g.setJump(false);                                 // segundo toque
    let max = 0, flip = false, floated = false, minVy = 0;
    for (let i = 0; i < 320; i++) { if (g.p.vy < -0.5 && !g.p.ground) g.setJump(true); g.tick(1 / 60); max = Math.max(max, g.p.y); flip = flip || g.p.flip > 0; floated = floated || g.p.floating; minVy = Math.min(minVy, g.p.vy); if (g.p.ground && i > 5) break; }
    g.setJump(false);
    return { ground: g.p.ground, doubles: g.stats.doubles, max, flip, floated, minVy, v0, v1: g.worldSpeed, d: g.dist - d0, falls: g.stats.falls, turbo: g.turbo };
  });
  ok(r.ground && r.doubles === 1 && r.flip && r.floated && r.minVy > -6, `${mode}: combinação funciona e aterrissa`, `alt ${r.max.toFixed(2)} m, vel ${r.v0.toFixed(1)}→${r.v1.toFixed(1)}, queda máx ${r.minVy.toFixed(1)}`);
  ok(r.v1 > 0.9 * r.v0 && r.falls === 0, `${mode}: velocidade mantida durante a combinação`);
}

// ---------------------------------------------------------------- 4. progressão de velocidade, pausa e fases
console.log('4. Progressão de velocidade, pausa e fases');
for (const mode of ['facil', 'aventura', 'desafio']) {
  await start(mode);
  const cfg = await run(() => ({ ...window.__ian3.cfg }));
  const a = await ticks(60 * 5), b = await ticks(60 * 20);
  ok(b.base > a.base, `${mode}: velocidade básica cresce com o tempo ativo (${a.base.toFixed(2)} → ${b.base.toFixed(2)})`);
  // pausa não conta
  await run(() => window.__ian3.setPaused(true));
  const p1 = await run(() => { const g = window.__ian3; const r0 = g.runTime; for (let i = 0; i < 600; i++) g.tick(1 / 60); return [r0, g.runTime]; });
  ok(p1[0] === p1[1], `${mode}: pausa não conta como tempo ativo`);
  await run(() => window.__ian3.setPaused(false));
  // mudança de fase preserva a velocidade
  const before = await run(() => window.__ian3.snapshot().base);
  for (let k = 0; k < 5; k++) await run(() => window.__ian3.advancePhase());
  const after = await ticks(2);
  ok(Math.abs(after.base - before) < 0.1 && after.phase === 6, `${mode}: velocidade preservada após 5 trocas de fase (${before.toFixed(2)} → ${after.base.toFixed(2)}), fase ${after.phase}`);
  await ticks(60 * 600);
  const cap = await ticks(1);
  ok(cap.base <= cfg.speedMax + 1e-6, `${mode}: teto de velocidade (${cap.base.toFixed(2)} ≤ ${cfg.speedMax})`);
}

// ---------------------------------------------------------------- 5. partida real sem ajuda: bot joga cada fase em cada modo
console.log('5. Bot joga a partida (sem invulnerabilidade)');
for (const mode of process.env.QUICK ? [] : ['facil', 'aventura', 'desafio']) {
  await start(mode, 1, false);
  const r = await run(() => {
    const g = window.__ian3; let last = g.dist, stuck = 0, maxStuck = 0;
    for (let i = 0; i < 60 * 150; i++) {
      const p = g.p, f = g.focus;
      if (f && !f.done && i % 12 === 0) g.pressAction();
      else if (!f && p.ground) { const h = g.nextHazard(); if (g.tutorialActive || (h && h.gap < g.jumpDist() * 0.3 && h.gap > 0)) { g.setJump(true); g.setJump(false); } }
      g.tick(1 / 60);
      if (i % 60 === 59) { if (g.dist - last < 0.5 && !g.focus) stuck++; else stuck = 0; maxStuck = Math.max(maxStuck, stuck); last = g.dist; }
    }
    return { ...g.snapshot(), maxStuck };
  });
  ok(r.maxStuck < 12 && r.stats.missions >= 1, `${mode}: sem travar e concluiu missões`, `missões ${r.stats.missions}, quedas ${r.stats.falls}, batidas ${r.stats.hits}, fase ${r.phase}, estrelas ${r.stars}`);
}

console.log('erros de página:', errors.length ? errors.slice(0, 6) : 'nenhum');
if (errors.length) fails++;
await browser.close(); srv.close();
console.log(fails ? `\n${fails} FALHA(S)` : '\nTUDO OK');
process.exit(fails ? 1 : 0);
