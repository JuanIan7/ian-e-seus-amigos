// Simulação determinística: roda o jogo "por dentro" em passos de 1/60 s com bots diferentes.
import { serve, launch, waitGame } from './helpers.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const srv = await serve(root);
const { browser, errors } = await launch();
const results = [];
let failed = false;
const fail = (...a) => { failed = true; console.log('FALHA', ...a); };

async function newPage() {
  const ctx = await browser.newContext({ viewport: { width: 1560, height: 720 } }); // contexto novo = salvamento limpo
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await waitGame(page, 'http://localhost:4199/?renderer=canvas');
  return { ctx, page };
}

// Roda o jogo. opts: {mode, phase, bot, maxSec, untilPhases, power, seed}
async function run(opts) {
  const { ctx, page } = await newPage();
  const out = await page.evaluate(async (o) => {
    const game = window.__ian.game;
    game.scene.start('Game', { mode: o.mode, phase: o.phase || 1, seed: o.seed || 'teste-1', manual: true });
    await new Promise((r) => setTimeout(r, 400));
    const s = game.scene.getScene('Game');
    if (o.power) s.grantPower(o.power);
    const dt = 1 / 60, steps = Math.round(o.maxSec / dt);
    let stuckT = 0, lastDist = 0, maxStuck = 0, maxAssist = 0, maxEnts = 0, i = 0, maxMission = 0, mT = 0;
    const seen = new Set(); const log = [];
    for (; i < steps; i++) {
      const p = s.p, m = s.mission;
      if (o.bot === 'perfect') {
        if (m && m.engaged) { if (i % 12 === 0) s.pressAction(); }
        else if (p.ground && !p.flying && !s.ride) {
          const h = s.nextHazard();
          if (h) {
            if (h.e.type === 'hole') { if (h.edge - (p.x + 17) <= s.jumpDist() * (h.e.w > s.jumpDist() * 0.9 ? 0.04 : 0.2)) s.pressJump(); }
            else {
              const grp = s.ents.filter((e) => e.type === 'obs' && !e.hit && Math.abs(e.x - h.e.x) < 200);
              const l = Math.min(...grp.map((e) => e.x)), r = Math.max(...grp.map((e) => e.x + e.w));
              if ((l + r) / 2 - p.x <= s.jumpDist() / 2) s.pressJump();
            }
          }
        }
        s.jumpHeld = !p.ground && s.holeNear(p.x - 30, p.x + 400);
        if (p.flying) s.jumpHeld = (i % 90) < 45;
      } else if (o.bot === 'mash') { if (i % 17 === 0) { s.jumpHeld = true; s.pressJump(); } else if (i % 17 === 8) s.jumpHeld = false; if (i % 23 === 0) s.pressAction(); }
      const before = s.stats.hits + s.stats.falls;
      s.tick(dt);
      if (s.stats.hits + s.stats.falls > before && log.length < 4) log.push({ t: +s.t.toFixed(1), phase: s.phaseNum, mission: s.mission && s.mission.key, ents: s.ents.filter((e) => e.type !== 'star').slice(0, 6).map((e) => e.type + ':' + (e.kind || '') + '@' + Math.round(e.x)), speed: Math.round(s.worldSpeed) });
      maxAssist = Math.max(maxAssist, s.assist); maxEnts = Math.max(maxEnts, s.ents.length);
      if (s.mission && s.mission.engaged) { mT += dt; maxMission = Math.max(maxMission, mT); } else mT = 0;
      const wait = (s.mission && s.mission.engaged) || s.tutorialActive || s.fall;
      if (s.dist - lastDist < 0.5 && !wait) stuckT += dt; else stuckT = 0;
      lastDist = s.dist; maxStuck = Math.max(maxStuck, stuckT);
      if (s.mission) seen.add(s.mission.key);
      if (o.untilPhases && s.stats.phases >= o.untilPhases) break;
    }
    return { snap: s.snapshot(), simSec: +(i / 60).toFixed(0), maxStuck: +maxStuck.toFixed(2), maxAssist, maxEnts, maxMission: +maxMission.toFixed(1), missions: [...seen], log };
  }, opts);
  await ctx.close();
  return out;
}

// ---------- 1) bot perfeito: cada fase em cada modo, sem erros, sem travar, e a fase avança ----------
for (const mode of ['facil', 'aventura', 'desafio']) {
  for (let phase = 1; phase <= 5; phase++) {
    const r = await run({ mode, phase, bot: 'perfect', maxSec: 400, untilPhases: 1 });
    const sn = r.snap;
    const ok = sn.stats.hits === 0 && sn.stats.falls === 0 && sn.stats.phases >= 1 && r.maxStuck < 5;
    results.push({ teste: 'perfeito', mode, fase: phase, seg: r.simSec, avancou: sn.stats.phases, missoes: sn.stats.missions, hits: sn.stats.hits, quedas: sn.stats.falls, estrelas: sn.stars, poderes: sn.stats.powers, planou: sn.stats.glides, parado: r.maxStuck, ok });
    if (!ok) fail(mode, 'fase', phase, JSON.stringify({ snap: sn, log: r.log, maxStuck: r.maxStuck }));
  }
}

// ---------- 2) ciclo completo 1 -> 5 -> volta ao tema 1 (fase 6), sessão contínua ----------
for (const mode of ['facil', 'desafio']) {
  const r = await run({ mode, phase: 1, bot: 'perfect', maxSec: 1500, untilPhases: 5 });
  const sn = r.snap;
  const ok = sn.stats.phases >= 5 && sn.phase === 6 && sn.theme === 'bairro' && sn.stats.hits === 0;
  results.push({ teste: 'ciclo 1-5-1', mode, fase: sn.phase, seg: r.simSec, avancou: sn.stats.phases, missoes: sn.stats.missions, hits: sn.stats.hits, quedas: sn.stats.falls, estrelas: sn.stars, poderes: sn.stats.powers, planou: sn.stats.glides, parado: r.maxStuck, ok });
  if (!ok) fail('ciclo', mode, JSON.stringify(sn), JSON.stringify(r.log));
}

// ---------- 3) sem nenhuma entrada (criança só olhando) no modo fácil: nunca fica preso ----------
for (const phase of [1, 2, 3, 4, 5]) {
  const r = await run({ mode: 'facil', phase, bot: 'none', maxSec: 300, untilPhases: 1 });
  const sn = r.snap;
  const ok = sn.stats.phases >= 1 && r.maxStuck < 5;
  results.push({ teste: 'sem toques', mode: 'facil', fase: phase, seg: r.simSec, avancou: sn.stats.phases, missoes: sn.stats.missions, hits: sn.stats.hits, quedas: sn.stats.falls, estrelas: sn.stars, poderes: sn.stats.powers, planou: sn.stats.glides, parado: r.maxStuck, ok });
  if (!ok) fail('sem toques', phase, JSON.stringify(sn), JSON.stringify(r.log));
}

// ---------- 4) toques aleatórios (mash) nos 3 modos: não trava nem quebra ----------
for (const mode of ['facil', 'aventura', 'desafio']) {
  for (const phase of [3, 4]) {
    const r = await run({ mode, phase, bot: 'mash', maxSec: 150 });
    const ok = r.maxStuck < 5 && r.maxEnts < 80;
    results.push({ teste: 'aleatório', mode, fase: phase, seg: r.simSec, avancou: r.snap.stats.phases, missoes: r.snap.stats.missions, hits: r.snap.stats.hits, quedas: r.snap.stats.falls, estrelas: r.snap.stars, poderes: r.snap.stats.powers, planou: r.snap.stats.glides, parado: r.maxStuck, ok });
    if (!ok) fail('mash', mode, phase, JSON.stringify(r.snap), JSON.stringify(r.log));
  }
}

// ---------- 5) cada poder, com bot perfeito (ficam sem batida/queda e terminam em chão firme) ----------
for (const power of ['shield', 'magnet', 'jump', 'speed', 'fly', 'jet']) {
  for (const phase of [3, 4]) {
    const r = await run({ mode: 'facil', phase, bot: 'perfect', maxSec: 60, power });
    const sn = r.snap;
    const ok = sn.stats.falls === 0 && sn.stats.hits === 0 && r.maxStuck < 5 && !sn.falling;
    results.push({ teste: 'poder ' + power, mode: 'facil', fase: phase, seg: r.simSec, avancou: sn.stats.phases, missoes: sn.stats.missions, hits: sn.stats.hits, quedas: sn.stats.falls, estrelas: sn.stars, poderes: sn.stats.powers, planou: sn.stats.glides, parado: r.maxStuck, ok });
    if (!ok) fail('poder', power, phase, JSON.stringify(sn), JSON.stringify(r.log));
  }
}

// ---------- 6) a cada 50 estrelas nasce um poder; sorteio cobre os poderes ----------
{
  const { ctx, page } = await newPage();
  const r = await page.evaluate(async () => {
    const game = window.__ian.game;
    game.scene.start('Game', { mode: 'facil', phase: 1, seed: 'p', manual: true });
    await new Promise((x) => setTimeout(x, 300));
    const s = game.scene.getScene('Game');
    const got = new Set(); const first = [];
    for (let k = 0; k < 60; k++) {
      s.powers = {}; Object.keys(s.powerHud).forEach((h) => s.removePower(h));
      const before = s.stats.powers; s.addStars(50);
      if (s.stats.powers !== before + 1) return { erro: 'não concedeu poder no passo ' + k };
      Object.keys(s.powers).forEach((p) => got.add(p)); if (k < 3) first.push(Object.keys(s.powers)[0]);
    }
    s.addStars(49); const n49 = s.stats.powers; s.addStars(1);
    return { got: [...got], porCem: s.stats.powers - n49, stars: s.stars };
  });
  const ok = !r.erro && r.got.length === 6 && r.porCem === 1;
  results.push({ teste: 'poder/50 estrelas', mode: 'facil', fase: 1, seg: 0, avancou: 0, missoes: 0, hits: 0, quedas: 0, estrelas: r.stars, poderes: r.got ? r.got.length : 0, planou: 0, parado: 0, ok });
  if (!ok) fail('50 estrelas', JSON.stringify(r));
  await ctx.close();
}

// ---------- 7) todas as aparências desenham sem erro, em todas as poses ----------
{
  const { ctx, page } = await newPage();
  const r = await page.evaluate(async () => {
    const game = window.__ian.game;
    game.scene.getScene('Menu').scene.start('Character'); await new Promise((x) => setTimeout(x, 400));
    const sc = game.scene.getScene('Character');
    let n = 0; const pick = (k) => Math.floor(Math.random() * k);
    for (let outfit = 0; outfit < 10; outfit++) for (let hair = 0; hair < 8; hair++) for (let face = 0; face < 3; face++) {
      sc.look = { skin: pick(7), face, hair, hairColor: pick(8), eyes: pick(6), outfit }; sc.buildPreview(); sc.cycleStates(); n++;
    }
    for (let skin = 0; skin < 7; skin++) for (let hc = 0; hc < 8; hc++) for (let eyes = 0; eyes < 6; eyes++) {
      sc.look = { skin, face: pick(3), hair: pick(8), hairColor: hc, eyes, outfit: pick(10) }; sc.buildPreview(); sc.cycleStates(); n++;
    }
    for (let tab = 0; tab < 3; tab++) { sc.setTab(tab); }
    return { n };
  });
  const ok = r.n === 240 + 336;
  results.push({ teste: 'aparências', mode: '-', fase: '-', seg: 0, avancou: 0, missoes: 0, hits: 0, quedas: 0, estrelas: r.n, poderes: 0, planou: 0, parado: 0, ok });
  if (!ok) fail('aparências', JSON.stringify(r));
  await ctx.close();
}

// ---------- 8) controles novos: segurar "para frente" acelera, segurar pulo desce devagar, pulo duplo ----------
{
  const run1 = async (fn) => {
    const { ctx, page } = await newPage();
    const r = await page.evaluate(async (src) => {
      const game = window.__ian.game;
      game.scene.start('Game', { mode: 'facil', phase: 1, seed: 'ctl', manual: true });
      await new Promise((x) => setTimeout(x, 300));
      const s = game.scene.getScene('Game');
      s.ents.forEach((e) => { e.sprite && e.sprite.destroy && e.sprite.destroy(); }); s.ents = []; s.spawnLogic = () => {}; s.tutorialJump = false;
      // simula um voo sem nada no caminho: mede apex, tempo no ar e velocidade máxima de queda
      const flight = (o) => {
        s.p.y = 590; s.p.vy = 0; s.p.ground = true; s.p.dbl = false; s.p.floating = false; s.jumpHeld = false;
        const dt = 1 / 60; let top = 590, air = 0, maxFall = 0, i = 0;
        s.pressJump();
        for (; i < 600; i++) {
          if (o.dbl && i === 20) s.pressJump();
          if (o.dbl && i === 26) s.pressJump(); // terceiro toque não pode dar um triplo salto
          s.jumpHeld = !!o.hold && i > 20;
          s.tick(dt);
          top = Math.min(top, s.p.y); if (!s.p.ground) { air++; maxFall = Math.max(maxFall, s.p.vy); }
          if (i > 5 && s.p.ground) break;
        }
        return { apex: Math.round(590 - top), air: +(air / 60).toFixed(2), maxFall: Math.round(maxFall), doubles: s.stats.doubles };
      };
      const single = flight({}), dbl = flight({ dbl: true }), hold = flight({ hold: true });
      // acelerar
      s.p.y = 590; s.p.ground = true;
      for (let i = 0; i < 90; i++) s.tick(1 / 60);
      const normal = s.worldSpeed; s.fwdHeld = true;
      for (let i = 0; i < 90; i++) s.tick(1 / 60);
      const fast = s.worldSpeed; s.fwdHeld = false;
      for (let i = 0; i < 120; i++) s.tick(1 / 60);
      return { single, dbl, hold, normal: Math.round(normal), fast: Math.round(fast), back: Math.round(s.worldSpeed) };
    });
    await ctx.close();
    return r;
  };
  const r = await run1();
  const ok = r.dbl.apex > r.single.apex * 1.5 && r.dbl.doubles === 1 && r.hold.air > r.single.air * 1.2 && r.hold.maxFall < 340 && r.fast > r.normal * 1.15 && Math.abs(r.back - r.normal) < r.normal * 0.12;
  results.push({ teste: 'controles', mode: 'facil', fase: 1, seg: 0, avancou: 0, missoes: 0, hits: 0, quedas: 0, estrelas: 0, poderes: 0, planou: 0, parado: 0, ok });
  console.log('controles:', JSON.stringify(r));
  if (!ok) fail('controles', JSON.stringify(r));
}

console.table(results);
if (errors.length) { console.log('ERROS DE PÁGINA:', errors.slice(0, 10)); failed = true; }
await browser.close(); srv.close();
process.exit(failed ? 1 : 0);
