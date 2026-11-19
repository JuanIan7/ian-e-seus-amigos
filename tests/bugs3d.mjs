// Caça-bugs: um robô "criança" joga o modo história inteiro e a corrida infinita, mexendo em tudo (faixas, corrida ×2/×3,
// mergulho, poderes da lojinha) e conferindo a cada tick se algo saiu do normal (valores inválidos, travas, obstáculo
// atravessado sem batida, vazamento de objetos, erros de página). Uso: node tests/bugs3d.mjs [modos] [shots]
//   PORT=4201 node tests/bugs3d.mjs facil,desafio 1
import { serve, launch } from './helpers.mjs';
import path from 'node:path'; import fs from 'node:fs'; import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url)); const out = path.join(here, 'out', 'bugs3d'); fs.mkdirSync(out, { recursive: true });
const modes = (process.argv[2] || 'facil,aventura,desafio').split(','), shots = process.argv[3] === '1';
const srv = await serve(process.env.DIST ? path.resolve(process.env.DIST) : path.join(here, '..', 'dist'));
const { browser, errors } = await launch({ viewport: { width: 1280, height: 600 } });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 600 }, hasTouch: true });
const page = await ctx.newPage();
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message)); page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
let fails = 0; const ok = (c, msg, x = '') => { console.log((c ? '  ok  ' : ' FALHA ') + msg + (x ? '  [' + x + ']' : '')); if (!c) fails++; };

const BOT = (seed) => {
  let s = seed >>> 0; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const A = window.__an = { list: {}, n: {}, stats: { maxSpeed: 0, maxEnts: 0, maxKids: 0, minEngageGap: 99, flyAtMission: 0, pzWaitMax: 0, stuckMax: 0, focusMax: 0, hits: 0, passes: 0 } };
  const note = (k, d) => { A.n[k] = (A.n[k] || 0) + 1; (A.list[k] = A.list[k] || []).length < 4 && A.list[k].push(d); };
  const b = window.__bot = { jumpAt: -9, dblDone: true, hold: false, lastAct: 0, stuck: 0, focusT: 0, pzT: 0, lastPhase: 0 };
  window.__step = (n, wild = 1) => {
    const g = window.__ian3;
    for (let i = 0; i < n; i++) {
      if (g.over || g.won) break;
      if (g.mini) { g.closeMini(rnd() < 0.7); }
      const p = g.p, f = g.focus;
      // ---- criança mexendo em tudo ----
      if (rnd() < 0.012 * wild) g.steer(rnd() < 0.5 ? -1 : 1);
      if (rnd() < 0.004 * wild) g.toggleRun();
      if (rnd() < 0.006 * wild) g.dive();
      if (rnd() < 0.002 * wild) { const ks = Object.keys(g.inv).filter((k) => g.inv[k] > 0); if (ks.length) g.useItem(ks[Math.floor(rnd() * ks.length)]); }
      if (rnd() < 0.003 * wild) g.pressAction();
      // ---- robô competente (para a partida andar) ----
      if (f && !f.done) { if (g.t - b.lastAct > 0.2 && g.sprayCd <= 0) { g.pressAction(); b.lastAct = g.t; } g.setJump(false); }
      else if (g.powers.fly) { g.setJump(p.y < 2.2 || g.dist % 7 < 3.5); }
      else if (p.ground) {
        g.setJump(false); b.hold = false; b.dblDone = true;
        const h = g.nextHazard(), jd = g.jumpDist(g.worldSpeed || g.baseSpeed);
        if (g.tutorialActive) { if (g.tutKind === 'double') { g.setJump(true); g.setJump(false); b.dblDone = false; b.jumpAt = g.t; } else { g.setJump(true); g.setJump(false); b.jumpAt = g.t; b.hold = true; } }
        else if (h && h.gap > 0) {
          const lead = h.kind === 'hole' && !h.glide ? 0.9 + g.worldSpeed * 0.03 : h.kind === 'wall' ? jd * 0.24 : h.glide ? jd * 0.1 : jd * 0.26;
          if (h.gap < lead) { g.setJump(true); g.setJump(false); b.jumpAt = g.t; b.dblDone = h.kind !== 'wall'; b.hold = !!h.glide; }
        }
      } else {
        if (!b.dblDone && g.t - b.jumpAt > 0.22) { g.setJump(true); g.setJump(false); b.dblDone = true; }
        g.setJump(b.hold || (g.p.vy < -2 && g.world.inHole(g.dist - 0.5, g.dist + 3.5)));
      }
      // ---- estado antes do tick ----
      const d0 = g.dist, inv0 = p.invul, hits0 = g.stats.hits, lives0 = g.lives, fall0 = !!g.fall, focus0 = g.focus, phase0 = g.phaseNum, stars0 = g.stars, shield0 = !!g.powers.shield;
      const cand = (inv0 <= 1 / 60 + 1e-6 && !g.powers.fly && !g.powers.truck && !g.fall) ? g.ents.filter((o) => o.type === 'obs' && !o.hit && o.s > d0 && Math.abs(p.x - o.x) < o.w / 2 + 0.05) : [];
      g.lives = Math.max(g.lives, 3);                                   // a partida não acaba: queremos ver o jogo inteiro
      g.tick(1 / 60);
      if (g.won || g.over) break;
      // ---- conferências ----
      const sp = g.worldSpeed;
      if (![p.x, p.y, p.vy, g.dist, sp, g.turbo, g.camera.position.x, g.camera.position.y, g.camera.position.z, g.camera.fov].every(Number.isFinite)) note('nan', { t: g.t, x: p.x, y: p.y, dist: g.dist, sp });
      if (g.dist < d0 - 1e-6 && !fall0) note('dist-voltou', { t: g.t, d0, d1: g.dist });
      if (g.dist - d0 > 1.2) note('salto-de-distancia', { t: g.t, d: g.dist - d0 });
      if (p.y < -0.05 && !g.fall && p.ground) note('abaixo-do-chao', { t: g.t, y: p.y });
      if (p.y > 9) note('alto-demais', { t: g.t, y: p.y, powers: Object.keys(g.powers) });
      if (Math.abs(p.x) > 3.2) note('fora-da-pista', { t: g.t, x: p.x });
      if (g.lives < 0 || g.lives > g.maxLives) note('vidas-invalidas', { lives: g.lives });
      if (g.stars < stars0) note('estrelas-diminuiram', { a: stars0, b: g.stars });
      const cap = (g.infinite ? 15 : g.cfg.speedMax) * 3 * 1.021; if (sp > cap) note('acima-do-teto', { sp, cap });
      A.stats.maxSpeed = Math.max(A.stats.maxSpeed, sp); A.stats.maxEnts = Math.max(A.stats.maxEnts, g.ents.length); A.stats.maxKids = Math.max(A.stats.maxKids, g.scene.children.length);
      // obstáculo atravessado sem batida: cruzou o centro do obstáculo, na mesma faixa, baixo, sem proteção
      for (const o of cand) if (g.dist >= o.s && !o.hit && p.y < o.h - 0.35 && Math.abs(p.x - o.x) < o.w / 2 + 0.05 && g.p.invul <= 0 && !g.powers.fly && !g.powers.truck) note('atravessou-obstaculo', { t: g.t, kind: o.kind, y: p.y, h: o.h, sp, x: p.x, ox: o.x, phase: g.phaseNum });
      if (g.stats.hits > hits0) { A.stats.hits++; if (g.lives !== Math.max(lives0, 3) - 1 && !shield0) note('batida-sem-perder-vida', { t: g.t, lives0, lives: g.lives }); }
      // missão: distância ao engajar e poder de voo ainda ligado
      if (g.focus && !focus0) { const gap = g.focus.s - g.dist; A.stats.minEngageGap = Math.min(A.stats.minEngageGap, gap); if (gap < 1.5) note('missao-passou-do-ponto', { t: g.t, key: g.focus.key, gap, sp }); }
      const m = g.ents.find((e) => e.type === 'mission' && e.engaged && !e.done);
      if (m) { b.focusT += 1 / 60; if (g.powers.fly) { A.stats.flyAtMission++; if (!b.flyNoted) { b.flyNoted = true; note('voando-na-missao', { t: g.t, key: m.key, y: p.y }); window.__wantShot = 'voo-missao-' + m.key; } } } else { A.stats.focusMax = Math.max(A.stats.focusMax, b.focusT); b.focusT = 0; b.flyNoted = false; }
      // durante a missão a criança tem de estar no chão (o voo fica suspenso): no ar por mais de 1,5 s é erro
      if (m && p.y > 0.3) { b.airT = (b.airT || 0) + 1 / 60; if (b.airT > 1.5 && !b.airNoted) { b.airNoted = true; note('no-ar-durante-missao', { t: g.t, key: m.key, y: p.y, powers: Object.keys(g.powers) }); } } else { b.airT = 0; b.airNoted = false; }
      if (b.focusT > 90) { note('missao-nao-termina', { t: g.t, key: m && m.key, hp: m && m.hp }); b.focusT = 0; }
      // desafio da fase: tempo parado esperando abrir
      const pz = g.ents.find((e) => e.type === 'puzzle' && !e.done && !e.opened);
      if (pz && pz.s - g.dist < 3.6) { b.pzT += 1 / 60; A.stats.pzWaitMax = Math.max(A.stats.pzWaitMax, b.pzT); if (b.pzT > 4 && !b.pzNoted) { b.pzNoted = true; note('desafio-demora-a-abrir', { t: g.t, wait: b.pzT, fly: !!g.powers.fly, ground: p.ground, y: p.y }); } } else { b.pzT = 0; b.pzNoted = false; }
      // travado: sem andar, sem missão, sem tutorial, sem queda
      if (g.dist - d0 < 0.002 && !g.focus && !g.tutorialActive && !g.fall && !g.mini) { b.stuck += 1 / 60; A.stats.stuckMax = Math.max(A.stats.stuckMax, b.stuck); if (b.stuck > 8 && !b.stuckNoted) { b.stuckNoted = true; note('travado', { t: g.t, dist: g.dist, phase: g.phaseNum, mission: g.mission && g.mission.key, pz: !!pz, mul: g.missionMul, powers: Object.keys(g.powers), ground: p.ground }); } } else { b.stuck = 0; b.stuckNoted = false; }
      if (g.phaseNum !== phase0) { b.lastPhase = g.t; }
    }
    window.__n = (window.__n || 0) + 1; if (window.__n % 3 === 0) { try { g.render(); } catch (e) { note('render-erro', String(e)); } }
    return g.snapshot();
  };
};

async function open(o) {
  await page.goto('http://localhost:' + (process.env.PORT || 4199) + '/?renderer=canvas');
  await page.waitForFunction(() => window.__ian && window.__ian.game.scene.isActive('Menu'), null, { timeout: 20000 });
  // dados só deste navegador de teste (nunca o salvamento real do jogador): lojinha cheia para o robô usar os poderes
  await page.evaluate(() => { localStorage.setItem('ian-e-seus-amigos:v1', JSON.stringify({ inv: { shield: 3, truck: 3, fly: 3, glide: 3, magnet: 3, jump: 3, speed: 3, jet: 3 } })); });
  await page.reload(); await page.waitForFunction(() => window.__ian && window.__ian.game.scene.isActive('Menu'), null, { timeout: 20000 });
  await page.evaluate((o) => window.__ian.game.scene.start('Game3D', { ...o, manual: true }), o);
  await page.waitForFunction(() => window.__ian3, null, { timeout: 20000 });
}
const semVoz = new Set();
const report = async (label) => {
  const a = await page.evaluate(() => window.__an);
  (await page.evaluate(() => (window.__ianVoice && window.__ianVoice.missing) || [])).forEach((t) => semVoz.add(t));
  const keys = Object.keys(a.n);
  console.log('   medidas:', JSON.stringify(Object.fromEntries(Object.entries(a.stats).map(([k, v]) => [k, typeof v === 'number' ? +v.toFixed(2) : v]))));
  keys.forEach((k) => console.log(`   ⚠ ${k} ×${a.n[k]}`, JSON.stringify(a.list[k]).slice(0, 700)));
  return a;
};

for (const mode of modes) {
  console.log(`História completa, modo ${mode}`);
  await open({ mode, phase: 1, gameMode: 'story', seed: 'bug-' + mode });
  await page.evaluate(BOT, mode.length * 7919 + 13);
  let s, phaseSeen = new Set(), lastPhase = 0;
  for (let k = 0; k < 60 * 1500 / 30; k++) {
    s = await page.evaluate(() => window.__step(30));
    phaseSeen.add(s.phase);
    const want = await page.evaluate(() => { const w = window.__wantShot; window.__wantShot = null; return w; });
    if (shots && want) { await page.evaluate(() => window.__ian3.render()); await page.screenshot({ path: path.join(out, `${mode}-${want}.png`) }); }
    if (shots && s.phase !== lastPhase) { lastPhase = s.phase; await page.evaluate(() => { window.__step(90, 0); window.__ian3.render(); }); await page.screenshot({ path: path.join(out, `${mode}-fase${s.phase}.png`) }); }
    if (s.won || s.over) break;
  }
  const a = await report();
  ok(s.won, `${mode}: chegou ao fim da história`, `fase ${s.phase}, t=${s.t.toFixed(0)}s, missões ${s.stats.missions}, batidas ${s.stats.hits}, quedas ${s.stats.falls}, fases vistas ${[...phaseSeen].join(',')}`);
  ok(Object.keys(a.n).filter((k) => k !== 'voando-na-missao').length === 0, `${mode}: nenhuma anomalia`, Object.keys(a.n).join(', '));
  // vitória: tela aparece, toque leva ao resultado
  const win = await page.evaluate(() => getComputedStyle(document.querySelector('.g3 .win')).display);
  if (shots) await page.screenshot({ path: path.join(out, `${mode}-vitoria.png`) });
  await page.waitForTimeout(1700);
  await page.evaluate(() => document.querySelector('.g3 .win').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })));
  const res = await page.evaluate(() => ({ res: getComputedStyle(document.querySelector('.g3 .res')).display, over: window.__ian3.over, text: document.querySelector('.g3 .res').textContent.slice(0, 80) }));
  ok(win === 'flex' && res.res === 'flex' && res.over, `${mode}: vitória → resultado`, res.text);
  if (shots) await page.screenshot({ path: path.join(out, `${mode}-resultado.png`) });
  // "jogar de novo" recomeça limpo
  await page.waitForTimeout(600);
  await page.evaluate(() => document.querySelector('.g3 .res [data-k=again]').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })));
  await page.waitForTimeout(600);
  const again = await page.evaluate(() => { const g = window.__ian3; return g ? { phase: g.phaseNum, over: g.over, lives: g.lives, canv: document.querySelectorAll('.g3').length } : null; });
  ok(again && again.phase === 1 && !again.over && again.canv === 1, `${mode}: jogar de novo recomeça na fase 1 com uma tela só`, JSON.stringify(again));
}

console.log('Corrida infinita (12 min de jogo)');
await open({ mode: 'aventura', gameMode: 'infinite', seed: 'bug-inf' });
await page.evaluate(BOT, 4242);
let s, lastStage = 0;
for (let k = 0; k < 60 * 720 / 30; k++) {
  s = await page.evaluate(() => window.__step(30));
  if (shots && s.stage !== lastStage) { lastStage = s.stage; await page.evaluate(() => { window.__step(90, 0); window.__ian3.render(); }); await page.screenshot({ path: path.join(out, `infinita-area${s.stage}-fase${s.phase}.png`) }); }
  if (s.over) break;
}
const a = await report();
ok(!s.over && s.dist > 3000, 'infinita: correu sem acabar', `dist ${s.dist.toFixed(0)} m, área ${s.stage}, mul ×${s.starMul}, estrelas ${s.stars}, batidas ${s.stats.hits}, quedas ${s.stats.falls}`);
ok(Object.keys(a.n).length === 0, 'infinita: nenhuma anomalia', Object.keys(a.n).join(', '));
const mem = await page.evaluate(() => { const g = window.__ian3, i = g.renderer.info; return { geo: i.memory.geometries, tex: i.memory.textures, ents: g.ents.length, kids: g.scene.children.length }; });
ok(mem.geo < 2500 && mem.kids < 900, 'infinita: sem vazamento de objetos', JSON.stringify(mem));

// nenhuma frase pode cair na voz robótica do sistema: toda fala do jogo tem gravação
ok(semVoz.size === 0, 'todas as falas das partidas têm gravação (voz natural)', [...semVoz].join(' | '));

console.log('erros de página:', errors.length ? errors.slice(0, 8) : 'nenhum'); if (errors.length) fails++;
await browser.close(); srv.close();
console.log(fails ? `\n${fails} FALHA(S)` : '\nTUDO OK'); process.exit(fails ? 1 : 0);
