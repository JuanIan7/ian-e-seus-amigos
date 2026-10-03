// Teste de interface com toques reais (emulados) e capturas de tela.
import { serve, launch, waitGame } from './helpers.mjs';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, 'out'); fs.mkdirSync(out, { recursive: true });
const srv = await serve(path.join(here, '..', 'dist'));
const { browser, errors } = await launch();
let fails = 0;
const check = (name, cond, extra = '') => { console.log((cond ? 'OK   ' : 'FALHA') + ' ' + name + (extra ? '  ' + extra : '')); if (!cond) fails++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function open(viewport = { width: 1560, height: 720 }) {
  const ctx = await browser.newContext({ viewport, hasTouch: true });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await waitGame(page, 'http://localhost:4199/?renderer=canvas');
  const tap = async (gx, gy) => {
    const m = await page.evaluate(() => { const r = document.querySelector('canvas').getBoundingClientRect(); return { x: r.left, y: r.top, s: r.width / 1560 }; });
    await page.touchscreen.tap(m.x + gx * m.s, m.y + gy * m.s);
  };
  const state = () => page.evaluate(() => window.__ian.game.scene.getScene('Game').snapshot());
  return { ctx, page, tap, state };
}

// ---------- 1) menu, seleção de modo e salvamento ----------
{
  const { ctx, page, tap } = await open();
  await page.screenshot({ path: path.join(out, '01-menu.png') });
  await tap(1150, 190); await sleep(200);
  let saved = await page.evaluate(() => JSON.parse(localStorage.getItem('ian-e-seus-amigos:v1')));
  check('toque no cartão Desafio salva o modo', saved.mode === 'desafio', JSON.stringify(saved.mode));
  await page.goto('http://localhost:4199/?renderer=canvas'); await page.waitForFunction(() => window.__ian && window.__ian.game.scene.isActive('Menu'));
  await sleep(300);
  check('modo escolhido persiste após reabrir', await page.evaluate(() => window.__ian.game.scene.getScene('Menu').mode) === 'desafio');
  await tap(410, 190); await sleep(150);
  await tap(1470, 70); await sleep(150);
  saved = await page.evaluate(() => JSON.parse(localStorage.getItem('ian-e-seus-amigos:v1')));
  check('botão de som alterna e salva', saved.sound === false && saved.mode === 'facil');
  await tap(1470, 70); await sleep(100);
  // seletor de fase: toque no ladrilho da fase 3 salva a escolha
  await tap(780, 415); await sleep(200);
  saved = await page.evaluate(() => JSON.parse(localStorage.getItem('ian-e-seus-amigos:v1')));
  check('toque no ladrilho Fase 3 salva a fase inicial', saved.phase === 3, String(saved.phase));
  await page.screenshot({ path: path.join(out, '01b-menu-fase3.png') });
  await tap(292, 415); await sleep(150);
  await ctx.close();
}

// ---------- 2) jogo: toques de pulo e ação, tutorial, pausa ----------
{
  const { ctx, page, tap, state } = await open();
  await tap(780, 610); // jogar (modo fácil padrão, fase 1)
  await page.waitForFunction(() => window.__ian.game.scene.isActive('Game'));
  await sleep(1200);
  await page.screenshot({ path: path.join(out, '02-jogo-corrida.png') });
  let s = await state();
  check('jogo inicia no modo fácil e corre sozinho', s.mode === 'facil' && s.dist > 50, `dist=${Math.round(s.dist)}`);

  // tutorial: o mundo congela perto do primeiro obstáculo até tocar em pular
  await page.waitForFunction(() => window.__ian.game.scene.getScene('Game').tutorialActive === true, null, { timeout: 30000 });
  await sleep(300);
  await page.screenshot({ path: path.join(out, '03-tutorial-pulo.png') });
  const d0 = (await state()).dist; await sleep(600); const d1 = (await state()).dist;
  check('tutorial congela a corrida até o toque', Math.abs(d1 - d0) < 1);
  await tap(1345, 590); await sleep(150);
  s = await state();
  check('toque no botão Pular faz o personagem saltar', s.onGround === false && s.stats.jumps === 1);
  await sleep(1400);
  s = await state();
  check('tutorial salta junto e passa sem colisão', s.stats.hits === 0, `hits=${s.stats.hits}`);

  // multitoque: pular + ação ao mesmo tempo
  await sleep(1200);
  const cdp = await ctx.newCDPSession(page);
  const geo = await page.evaluate(() => { const r = document.querySelector('canvas').getBoundingClientRect(); return { x: r.left, y: r.top, s: r.width / 1560 }; });
  const pt = (id, gx, gy) => ({ x: geo.x + gx * geo.s, y: geo.y + gy * geo.s, id });
  await page.waitForFunction(() => window.__ian.game.scene.getScene('Game').p.ground);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [pt(1, 1345, 590), pt(2, 205, 590)] });
  await sleep(120);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  const multi = await page.evaluate(() => { const g = window.__ian.game.scene.getScene('Game'); return { jumped: !g.p.ground, shaking: g.tweens.isTweening(g.actionBtn.root) }; });
  check('dois toques simultâneos são lidos (pular e ação)', multi.jumped && multi.shaking, JSON.stringify(multi));

  // pausa
  await sleep(1200);
  await tap(1480, 70); await sleep(200);
  s = await state(); const dp0 = s.dist;
  await page.screenshot({ path: path.join(out, '04-pausa.png') });
  await sleep(800); const dp1 = (await state()).dist;
  check('pausa congela o jogo', s.paused === true && Math.abs(dp1 - dp0) < 0.5);
  await tap(780, 360); await sleep(300); // retomar
  s = await state(); const dr0 = s.dist; await sleep(600);
  check('retomar volta a correr', s.paused === false && (await state()).dist > dr0 + 20);

  // segundo plano => pausa automática
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
  await sleep(300);
  check('ir para segundo plano pausa o jogo', (await state()).paused === true);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); });
  await tap(780, 360); await sleep(200);

  // ---------- 3) missão da mangueira e do fogo ----------
  await page.evaluate(() => { const g = window.__ian.game.scene.getScene('Game'); g.queue = ['pickup:hose', 'obs', 'mission:fire_bin']; g.nextGapPx = 0; g.sinceSpawn = 1; });
  const ok = await page.evaluate(async () => {
    const g = window.__ian.game.scene.getScene('Game');
    for (let i = 0; i < 60 * 90 && !(g.mission && g.mission.engaged); i++) {
      const p = g.p; const h = g.nextHazard();
      if (h && p.ground && h.cx - p.x <= g.jumpDist() / 2) g.pressJump();
      g.tick(1 / 60);
    }
    return { engaged: !!(g.mission && g.mission.engaged), hose: g.eq.hose, key: g.mission && g.mission.key };
  });
  check('pega a mangueira e para diante do fogo', ok.engaged && ok.hose && ok.key === 'fire_bin', JSON.stringify(ok));
  await sleep(400);
  await page.screenshot({ path: path.join(out, '05-fogo.png') });
  const before = await state();
  check('corrida parada na posição de interação', before.mission && before.mission.engaged && before.speed === 0);
  for (let i = 0; i < 3; i++) { await tap(205, 590); await sleep(420); if (i === 0) await page.screenshot({ path: path.join(out, '06-jato.png') }); }
  await sleep(400);
  s = await state();
  check('3 toques na gota apagam o fogo e liberam a corrida', s.stats.missions === 1, JSON.stringify(s.mission));
  const dd = s.dist; await sleep(1500);
  check('corrida retoma sozinha depois do fogo', (await state()).dist > dd + 100);
  await page.screenshot({ path: path.join(out, '07-depois.png') });
  await ctx.close();
}

// ---------- 3b) tela de personagem: escolhas por toque, salvas e usadas no jogo ----------
{
  const { ctx, page, tap } = await open();
  await tap(240, 610); await sleep(600);
  check('botão do personagem abre a tela de montar', await page.evaluate(() => window.__ian.game.scene.isActive('Character')));
  await page.screenshot({ path: path.join(out, '09-personagem-aparencia.png') });
  await tap(750, 250); await sleep(250); // pele (1º tom, o mais claro)
  await tap(900, 96); await sleep(300);              // aba cabelo
  await tap(983, 262); await sleep(300);             // 2º penteado
  await page.screenshot({ path: path.join(out, '10-personagem-cabelo.png') });
  await tap(1050, 96); await sleep(300);             // aba roupa
  await tap(1050, 280); await sleep(300);            // 3ª roupa (dinossauro)
  await page.screenshot({ path: path.join(out, '11-personagem-roupa.png') });
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('ian-e-seus-amigos:v1')).look);
  check('escolhas de pele, cabelo e roupa por toque são salvas', saved.skin === 0 && saved.hair === 1 && saved.outfit === 2, JSON.stringify(saved));
  await tap(1425, 650); await sleep(500); // OK -> menu
  check('botão OK volta ao menu', await page.evaluate(() => window.__ian.game.scene.isActive('Menu')));
  await tap(1024, 415); await sleep(200); await tap(780, 610); // fase 4
  await page.waitForFunction(() => window.__ian.game.scene.isActive('Game'));
  await sleep(700);
  const g = await page.evaluate(() => { const s = window.__ian.game.scene.getScene('Game'); return { phase: s.phaseNum, theme: s.snapshot().theme, outfit: s.kid.parts.outfit, hair: JSON.parse(localStorage.getItem('ian-e-seus-amigos:v1')).look.hair }; });
  check('jogo começa na fase escolhida, com a roupa escolhida', g.phase === 4 && g.theme === 'altura' && g.outfit === 'dino', JSON.stringify(g));
  await page.screenshot({ path: path.join(out, '12-jogo-fase4-dino.png') });
  await ctx.close();
}

// ---------- 4) proporções de tela diferentes ----------
for (const [name, vp] of [['16x9', { width: 1280, height: 720 }], ['20x9', { width: 2400, height: 1080 }], ['4x3', { width: 1024, height: 768 }]]) {
  const { ctx, page, tap } = await open(vp);
  await tap(780, 610); await sleep(900);
  await page.screenshot({ path: path.join(out, `08-tela-${name}.png`) });
  const box = await page.evaluate(() => { const r = document.querySelector('canvas').getBoundingClientRect(); return { w: r.width, h: r.height, l: r.left, t: r.top }; });
  check(`tela ${name}: jogo inteiro visível, centralizado`, box.l >= -1 && box.t >= -1 && box.l + box.w <= vp.width + 1 && box.t + box.h <= vp.height + 1, JSON.stringify(box));
  await ctx.close();
}

check('sem erros no console/página', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close(); srv.close();
console.log(fails ? `\n${fails} verificação(ões) falharam` : '\nTudo certo');
process.exit(fails ? 1 : 0);
