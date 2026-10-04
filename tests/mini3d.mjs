// Desafios das fases (30 s, +1 vida): quebra-cabeça 4x4/5x5, labirinto, maçãs, mangueira, barco e lava.
// Resolve cada um com toques/arrastes simulados, testa o tempo esgotado e a estação que abre o desafio no caminho.
// Uso: DIST=dist PORT=4210 node tests/mini3d.mjs [modos]
import { serve, launch } from './helpers.mjs';
import path from 'node:path'; import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const srv = await serve(process.env.DIST ? path.resolve(process.env.DIST) : path.join(here, '..', 'dist'));
const PORT = +(process.env.PORT || 4199);
const { browser, errors } = await launch({ viewport: { width: 1280, height: 600 } });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 600 }, hasTouch: true });
const page = await ctx.newPage();
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message)); page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
const out = path.join(here, 'out', 'mini3d'); fs.mkdirSync(out, { recursive: true });
let fails = 0;
const ok = (c, msg, extra = '') => { console.log((c ? '  ok  ' : ' FALHA ') + msg + (extra ? '  [' + extra + ']' : '')); if (!c) fails++; };
const run = (fn, arg) => page.evaluate(fn, arg);
const ticks = (n) => run((n) => { const g = window.__ian3; for (let i = 0; i < n; i++) g.tick(1 / 60); return g.snapshot(); }, n);
const modes = (process.argv[2] || 'facil,aventura,desafio').split(',');

async function start(mode, phase = 1) {
  await page.goto(`http://localhost:${PORT}/?renderer=canvas`);
  await page.waitForFunction(() => window.__ian && window.__ian.game.scene.isActive('Menu'), null, { timeout: 20000 });
  await page.evaluate(() => { try { localStorage.setItem('ian-e-seus-amigos:v1', JSON.stringify({ tut: { jump: true, water: true, dbl: true, float: true } })); } catch (e) {} });
  await page.evaluate(([mode, phase]) => window.__ian.game.scene.start('Game3D', { mode, phase, seed: 'mini', manual: true }), [mode, phase]);
  await page.waitForFunction(() => window.__ian3, null, { timeout: 20000 });
  await run(() => { const g = window.__ian3; g.spawnLogic = () => {}; g.tutorialJump = false; g.lives = 2; g.hud.setLives(2, g.maxLives); });
}
async function drag(from, to, steps = 8) {
  await page.mouse.move(from[0], from[1]); await page.mouse.down();
  for (let i = 1; i <= steps; i++) await page.mouse.move(from[0] + (to[0] - from[0]) * i / steps, from[1] + (to[1] - from[1]) * i / steps);
  await page.mouse.up();
}
const closed = () => page.waitForFunction(() => !window.__ian3.mini, null, { timeout: 9000 }).then(() => true).catch(() => false);

// ---- solucionadores (usam a interface de toque, como uma criança) ----
async function solveJigsaw() {
  const n = await run(() => window.__ian3.mini.list.length);
  for (let k = 0; k < n + 3; k++) {
    const nx = await run(() => { const m = window.__ian3.mini, p = m.list.find((q) => !q.ok); if (!p) return null; const pr = p.getBoundingClientRect(), sr = m.slots[p.cell].getBoundingClientRect(); return { from: [pr.x + pr.width / 2, pr.y + pr.height / 2], to: [sr.x + sr.width / 2, sr.y + sr.height / 2] }; });
    if (!nx) break; await drag(nx.from, nx.to, 5);
  }
}
async function solveMaze() {
  for (let k = 0; k < 80; k++) {
    const nx = await run(() => { const m = window.__ian3.mini; if (!m || m.won) return null; const path = m.solve(m.cur()); if (path.length < 2) return null; return m.cellCenter(path[1][0], path[1][1]); });
    if (!nx) break; await page.mouse.click(nx[0], nx[1]);
  }
}
async function solveApples() {
  for (let k = 0; k < 900; k++) {
    const st = await run(() => { const m = window.__ian3.mini; if (!m || m.won || m.over) return null; const it = m.items().filter((i) => i.kind === 'apple').sort((a, b) => b.y - a.y)[0]; if (!it) return { x: null }; const r = m.canvasRect(); return { x: r.x + it.x * (r.width / m.W), y: r.y + r.height - 20 }; });
    if (!st) break;
    if (st.x !== null) { await page.mouse.move(st.x, st.y); await page.mouse.down(); await page.mouse.move(st.x + 1, st.y); await page.mouse.up(); }
    await page.waitForTimeout(40);
  }
}
async function solveAim() {
  for (let k = 0; k < 900; k++) {
    const t = await run(() => { const m = window.__ian3.mini; if (!m || m.won || m.over) return null; const tg = m.targets().find((x) => !x.dead && !x.shot && x.age > 0.15); return tg ? m.toClient(tg.x, tg.y) : []; });
    if (!t) break; if (t.length) await page.mouse.click(t[0], t[1]); else await page.waitForTimeout(60);
  }
}
async function solveBoat() {
  const pts = await run(() => { const m = window.__ian3.mini; return m.path.map(([x, y]) => m.toClient(x, y)); });
  await page.mouse.move(pts[0][0], pts[0][1]); await page.mouse.down();
  for (let i = 1; i < pts.length; i += 3) { await page.mouse.move(pts[i][0], pts[i][1]); await page.waitForTimeout(10); if (!(await run(() => !!window.__ian3.mini && !window.__ian3.mini.won))) break; }
  await page.mouse.move(pts[pts.length - 1][0], pts[pts.length - 1][1]); await page.mouse.up();
}
const SOLVE = { jigsaw4: solveJigsaw, jigsaw5: solveJigsaw, maze: solveMaze, apples: solveApples, hose: solveAim, lava: solveAim, boat: solveBoat };
const PHASE_OF = { jigsaw4: 1, maze: 2, jigsaw5: 3, apples: 4, hose: 5, boat: 6, lava: 7 };

for (const mode of modes) {
  console.log(`== ${mode}`);
  for (const kind of Object.keys(SOLVE)) {
    await start(mode, PHASE_OF[kind]);
    await ticks(30);
    const before = await run(() => { const g = window.__ian3; return { dist: g.dist, t: g.t, rt: g.runTime, lives: g.lives }; });
    await run((k) => window.__ian3.openMini(k), kind);
    await ticks(120);
    const fr = await run(() => { const g = window.__ian3; return { dist: g.dist, t: g.t, rt: g.runTime }; });
    const frozen = fr.dist === before.dist && fr.t === before.t && fr.rt === before.rt;
    await page.screenshot({ path: path.join(out, `${kind}-${mode}-inicio.png`) });
    const t0 = Date.now(); await SOLVE[kind]();
    await page.screenshot({ path: path.join(out, `${kind}-${mode}-fim.png`) });
    await page.waitForFunction(() => !window.__ian3.mini || window.__ian3.mini.won || window.__ian3.mini.over, null, { timeout: 4000 }).catch(() => {});
    const won = await run(() => !window.__ian3.mini || !!window.__ian3.mini.won);
    const done = await closed();
    const after = await run(() => { const g = window.__ian3; return { lives: g.lives, mini: !!g.mini, invul: g.p.invul, won: g.stats.puzzlesWon }; });
    ok(frozen && won && done && after.lives === before.lives + 1 && after.won === 1, `${mode} ${kind}: corrida pausada, resolvido por toque e +1 vida`, `vidas ${before.lives}→${after.lives}, ${((Date.now() - t0) / 1000).toFixed(1)}s reais`);
  }
  // tempo esgotado: não ganha vida e a corrida continua
  await start(mode, 1); await ticks(20);
  await run(() => window.__ian3.openMini('maze'));
  const l0 = await run(() => window.__ian3.lives);
  await run(() => window.__ian3.mini.setTime(0.05)); await page.waitForTimeout(300);
  ok(await run(() => window.__ian3.mini && window.__ian3.mini.over), `${mode}: tempo esgotado mostra o aviso`);
  const ok2 = await closed(); const s2 = await ticks(90);
  ok(ok2 && s2.lives === l0 && s2.speed > 0.5, `${mode}: sem vida extra ao esgotar o tempo, a corrida volta`, `vidas ${l0}→${s2.lives}`);
}

console.log('== estação do desafio no caminho');
await start('facil', 2);
await run(() => { const g = window.__ian3; g.spawnLogic = Object.getPrototypeOf(g).spawnLogic.bind(g); g.queue = ['puzzle']; g.nextS = g.dist + 20; });
const st = await run(() => { const g = window.__ian3; for (let i = 0; i < 60 * 15 && !g.mini; i++) g.tick(1 / 60); return { mini: !!g.mini, kind: g.mini && g.mini.kind }; });
ok(st.mini && st.kind === 'maze', 'ao chegar na estação, o desafio da fase abre sozinho', 'tipo ' + st.kind);
await page.screenshot({ path: path.join(out, 'estacao-abriu.png') });
await page.locator('.g3 .mini .mclose').dispatchEvent('pointerdown');
const st2 = await run(() => { const g = window.__ian3; for (let i = 0; i < 120; i++) g.tick(1 / 60); return { mini: !!g.mini, done: g.ents.filter((e) => e.type === 'puzzle').every((e) => e.done), lives: g.lives }; });
ok(!st2.mini && st2.done, 'sair pelo X fecha o desafio e a corrida segue (sem vida extra)', 'vidas ' + st2.lives);

console.log('erros de página:', errors.length ? errors.slice(0, 6) : 'nenhum');
if (errors.length) fails++;
await browser.close(); srv.close();
console.log(fails ? `\n${fails} FALHA(S)` : '\nTUDO OK');
process.exit(fails ? 1 : 0);
