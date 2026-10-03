// Testes dos minijogos opcionais (quebra-cabeça e cobrinha) com arrastes de toque simulados.
// Uso: DIST=dist PORT=4210 node tests/mini3d.mjs
import { serve, launch } from './helpers.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const srv = await serve(process.env.DIST ? path.resolve(process.env.DIST) : path.join(here, '..', 'dist'));
const PORT = +(process.env.PORT || 4199);
const { browser, errors } = await launch({ viewport: { width: 1280, height: 600 } });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 600 }, hasTouch: true });
const page = await ctx.newPage();
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message)); page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
const out = path.join(here, 'out', 'mini3d');
let fails = 0;
const ok = (c, msg, extra = '') => { console.log((c ? '  ok  ' : ' FALHA ') + msg + (extra ? '  [' + extra + ']' : '')); if (!c) fails++; };
const run = (fn, arg) => page.evaluate(fn, arg);
const ticks = (n) => run((n) => { const g = window.__ian3; for (let i = 0; i < n; i++) g.tick(1 / 60); return g.snapshot(); }, n);

async function start(mode) {
  await page.goto(`http://localhost:${PORT}/?renderer=canvas`);
  await page.waitForFunction(() => window.__ian && window.__ian.game.scene.isActive('Menu'), null, { timeout: 20000 });
  await page.evaluate(() => { try { localStorage.setItem('ian-e-seus-amigos:v1', JSON.stringify({ tut: { jump: true, water: true, dbl: true, float: true } })); } catch (e) {} });
  await page.evaluate((mode) => window.__ian.game.scene.start('Game3D', { mode, phase: 1, seed: 'mini', manual: true }), mode);
  await page.waitForFunction(() => window.__ian3, null, { timeout: 20000 });
  await run(() => { const g = window.__ian3; g.spawnLogic = () => {}; g.tutorialJump = false; });
}
const center = async (sel) => { const r = await page.locator(sel).first().boundingBox(); return [r.x + r.width / 2, r.y + r.height / 2]; };
async function drag(from, to, steps = 8) {
  await page.mouse.move(from[0], from[1]); await page.mouse.down();
  for (let i = 1; i <= steps; i++) { await page.mouse.move(from[0] + (to[0] - from[0]) * i / steps, from[1] + (to[1] - from[1]) * i / steps); }
  await page.mouse.up();
}
async function solvePuzzle() {
  const n = await run(() => window.__ian3.mini.list.length);
  // 1) uma soltura errada volta para a bandeja
  const wrong = await run(() => { const m = window.__ian3.mini, L = m.layout(), p = m.list.find((q) => !q.ok); const pr = p.getBoundingClientRect(), br = m.U.body.getBoundingClientRect(), sr = m.slots[p.cell].getBoundingClientRect(), sc = [sr.x + sr.width / 2, sr.y + sr.height / 2]; const cs = [[br.x + 6, br.y + 6], [br.x + L.W - 6, br.y + 6], [br.x + 6, br.y + L.H - 6], [br.x + L.W - 6, br.y + L.H - 6]]; cs.sort((a, b) => Math.hypot(b[0] - sc[0], b[1] - sc[1]) - Math.hypot(a[0] - sc[0], a[1] - sc[1])); return { i: +p.dataset.i, from: [pr.x + pr.width / 2, pr.y + pr.height / 2], to: cs[0] }; });
  await drag(wrong.from, wrong.to); await page.waitForTimeout(450);
  const back = await run((i) => window.__ian3.mini.list[i].ok, wrong.i);
  ok(back === false, 'peça solta no lugar errado não encaixa e volta para a bandeja');
  // 2) encaixa todas
  for (let k = 0; k < n + 2; k++) {
    const nx = await run(() => { const m = window.__ian3.mini, p = m.list.find((q) => !q.ok); if (!p) return null; const pr = p.getBoundingClientRect(), sr = m.slots[p.cell].getBoundingClientRect(); return { from: [pr.x + pr.width / 2, pr.y + pr.height / 2], to: [sr.x + sr.width / 2, sr.y + sr.height / 2] }; });
    if (!nx) break; await drag(nx.from, nx.to);
  }
}

console.log('1. Quebra-cabeça por modo');
const EXPECT = { facil: [2, 3, 4], aventura: [4, 5, 6], desafio: [6, 7, 9] };
for (const mode of ['facil', 'aventura', 'desafio']) {
  await start(mode);
  await ticks(90);
  const before = await run(() => { const g = window.__ian3; return { dist: g.dist, rt: g.runTime, stars: g.stars, powers: Object.keys(g.powers).length, t: g.t }; });
  await run(() => window.__ian3.openMini('puzzle'));
  const info = await run(() => { const m = window.__ian3.mini; return { pieces: m.pieces, mode: m.mode }; });
  ok(EXPECT[mode].includes(info.pieces), `${mode}: ${info.pieces} peças (esperado ${EXPECT[mode].join('/')})`);
  await ticks(180);
  const frozen = await run(() => { const g = window.__ian3; return { dist: g.dist, rt: g.runTime, t: g.t }; });
  ok(frozen.dist === before.dist && frozen.rt === before.rt && frozen.t === before.t, `${mode}: jogo pausado durante o quebra-cabeça`);
  // botões do jogo não reagem por baixo
  await run(() => { const g = window.__ian3; g.setJump(true); g.setJump(false); g.steer(1); });
  const lane = await run(() => window.__ian3.p.lane); ok(lane === 0, `${mode}: comandos do jogo ignorados com o minijogo aberto`);
  await page.screenshot({ path: path.join(out, `puzzle-${mode}-inicio.png`) });
  await solvePuzzle();
  await page.screenshot({ path: path.join(out, `puzzle-${mode}-fim.png`) });
  await page.waitForFunction(() => !window.__ian3.mini, null, { timeout: 8000 }).catch(() => {});
  const after = await run(() => { const g = window.__ian3; return { mini: !!g.mini, won: g.stats.minisWon, stars: g.stars, powers: Object.keys(g.powers).length, reward: g.lastReward, invul: g.p.invul, resume: g.resumeMul }; });
  ok(!after.mini && after.won === 1, `${mode}: quebra-cabeça concluído, volta ao jogo`);
  ok(after.stars > before.stars || after.powers > before.powers, `${mode}: recompensa entregue uma vez (${after.reward})`);
  ok(after.invul > 2 && after.resume === 0, `${mode}: retorno seguro (proteção ${after.invul.toFixed(1)}s, arranque suave)`);
  const s1 = await ticks(1); await ticks(120); const s2 = await run(() => window.__ian3.snapshot());
  ok(s1.speed < s2.speed * 0.8, `${mode}: velocidade volta gradualmente (${s1.speed.toFixed(2)} → ${s2.speed.toFixed(2)})`);
  await run(() => window.__ian3.closeMini(true)); // nada aberto: não deve fazer nada
  const again = await run(() => window.__ian3.stats.minisWon); ok(again === 1, `${mode}: recompensa não se repete`);
}

console.log('2. Fechar sem concluir');
await start('facil'); await ticks(60);
const st0 = await run(() => ({ stars: window.__ian3.stars, p: Object.keys(window.__ian3.powers).length }));
await run(() => window.__ian3.openMini('puzzle'));
await page.locator('.g3 .mini .mclose').click();
const cl = await run(() => { const g = window.__ian3; return { mini: !!g.mini, stars: g.stars, p: Object.keys(g.powers).length, won: g.stats.minisWon }; });
ok(!cl.mini && cl.won === 0 && cl.stars === st0.stars && cl.p === st0.p, 'sair pelo X volta ao jogo sem recompensa e sem punição');

console.log('3. Caminho da cobrinha');
for (const mode of ['facil', 'aventura', 'desafio']) {
  await start(mode); await ticks(60);
  await run(() => window.__ian3.openMini('snake'));
  const cfg = await run(() => { const m = window.__ian3.mini; return { time: m.cfg.time, segs: m.cfg.segs, len: m.path.length }; });
  const timeVisible = await page.locator('.g3 .mini .mtime').evaluate((e) => getComputedStyle(e).display !== 'none');
  ok(timeVisible === (mode === 'desafio'), `${mode}: barra de tempo ${mode === 'desafio' ? 'visível' : 'oculta'}`);
  await page.screenshot({ path: path.join(out, `snake-${mode}-inicio.png`) });
  const pts = await run(() => { const m = window.__ian3.mini, cv = m.U.body.querySelector('canvas'), r = cv.getBoundingClientRect(); return m.path.map(([x, y]) => [r.x + x * (r.width / cv.width), r.y + y * (r.height / cv.height)]); });
  // soltar longe do caminho não adianta
  await drag([pts[0][0] + 400, pts[0][1] - 150], [pts[0][0] + 450, pts[0][1] - 150], 3);
  const h0 = await run(() => window.__ian3.mini.head()); ok(h0 === 0, `${mode}: arrastar fora da cobrinha não anda`);
  await page.mouse.move(pts[0][0], pts[0][1]); await page.mouse.down();
  let shot = false;
  for (let i = 1; i < pts.length; i += 3) {
    await page.mouse.move(pts[i][0], pts[i][1]); await page.waitForTimeout(12);
    if (!shot && i > pts.length / 2) { shot = true; await page.screenshot({ path: path.join(out, `snake-${mode}-meio.png`) }); }
    if (!(await run(() => !!window.__ian3.mini))) break;
  }
  await page.mouse.move(pts[pts.length - 1][0], pts[pts.length - 1][1]); await page.mouse.up();
  await page.waitForFunction(() => !window.__ian3.mini, null, { timeout: 8000 }).catch(() => {});
  const r = await run(() => { const g = window.__ian3; return { mini: !!g.mini, won: g.stats.minisWon, reward: g.lastReward }; });
  ok(!r.mini && r.won === 1, `${mode}: cobrinha concluída, recompensa ${r.reward}`);
}

console.log('4. Bolha de desafio opcional');
await start('aventura');
await run(() => { const g = window.__ian3; g.runTime = 30; g.offerCd = 0; });
await ticks(5);
const o1 = await run(() => { const g = window.__ian3; return { offer: g.offer && g.offer.kind, vis: getComputedStyle(g.hud.els.quest).display, mini: !!g.mini, dist: g.dist }; });
ok(o1.offer && o1.vis !== 'none' && !o1.mini, 'a bolha aparece e o jogo continua normalmente (opcional)', 'tipo ' + o1.offer);
await ticks(60 * 12);
const o2 = await run(() => { const g = window.__ian3; return { offer: g.offer, dist: g.dist, vis: getComputedStyle(g.hud.els.quest).display }; });
ok(!o2.offer && o2.vis === 'none' && o2.dist > o1.dist + 20, 'ignorar a bolha não pune: ela some sozinha e a corrida segue');
// não reaparece em seguida
await ticks(60 * 5);
ok(!(await run(() => window.__ian3.offer)), 'não aparece duas vezes em sequência');
await run(() => { const g = window.__ian3; g.offerCd = 0; g.lastOfferMissions = -1; g.showOffer('snake'); });
await page.locator('.g3 .btn.quest').click({ force: true });
ok(await run(() => !!window.__ian3.mini && window.__ian3.mini.kind === 'snake'), 'tocar na bolha abre o minijogo');
await page.screenshot({ path: path.join(out, 'bolha-aberta.png') });
await run(() => window.__ian3.closeMini(false));
// bolha some perto de perigo
await run(() => { const g = window.__ian3; g.offerCd = 0; g.lastOfferMissions = -1; g.runTime = 60; });
await ticks(3);
const had = await run(() => !!window.__ian3.offer);
await run(() => { const g = window.__ian3; g.hazardWithin = () => true; });
await ticks(3);
ok(had && !(await run(() => window.__ian3.offer)), 'a bolha some quando um obstáculo se aproxima');

console.log('erros de página:', errors.length ? errors.slice(0, 6) : 'nenhum');
if (errors.length) fails++;
await browser.close(); srv.close();
console.log(fails ? `\n${fails} FALHA(S)` : '\nTUDO OK');
process.exit(fails ? 1 : 0);
