// Prévia dos modelos prontos (Tripo): fotografa as mesmas cenas do jogo sem nenhum modelo pronto e com os modelos ligados.
// Serve para mostrar ao Juan uma troca nova ANTES de aplicar: os itens só valem quando entram em ITENS_APROVADOS (src/g3/modelos.js).
// Uso: DIST=<pasta do build> OUT=<pasta de saída> PORT=4205 node tests/previa-modelos.mjs [cena1,cena2]
import { serve, launch } from './helpers.mjs';
import path from 'node:path'; import fs from 'node:fs'; import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const out = process.env.OUT || path.join(here, 'out', 'previa-modelos'); fs.mkdirSync(out, { recursive: true });
const so = process.argv[2] ? process.argv[2].split(',') : null;
const srv = await serve(process.env.DIST ? path.resolve(process.env.DIST) : path.join(here, '..', 'dist'));
const { browser } = await launch({});
const ctx = await browser.newContext({ viewport: { width: 1280, height: 590 }, hasTouch: true });
const page = await ctx.newPage(); const errs = [];
page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
const P = 'http://localhost:' + (process.env.PORT || 4199) + '/?renderer=canvas';

// cada cena: fase, onde parar (dist) e o que colocar na pista
const CENAS = {
  'obstaculos-fase1': { phase: 1, run: (g) => { g.addObstacle('cone', -1, g.dist + 4.2); g.addObstacle('hydrant', 1, g.dist + 4.2); g.addObstacle('cone', 0, g.dist + 9); g.tick(1 / 60); } },
  'cenario-bairro': { phase: 1, dist: 68 },
  'cenario-praca-jipe': { phase: 2, dist: 57 },
  'cenario-praca-arvore': { phase: 2, dist: 81 },
  'cenario-dinos-a': { phase: 5, dist: 68 },
  'cenario-dinos-b': { phase: 5, dist: 104 },
  'cenario-dinos-c': { phase: 5, dist: 140 },
  'cenario-mar': { phase: 6, dist: 56 },
  'cenario-alturas': { phase: 4, dist: 68 },
};
// 'hoje' = sem nenhum modelo pronto (?modelos= vazio); 'novo' = o jogo como está, com os itens aprovados (ou MODELOS=lista para testar outros)
const LADO = { hoje: '&modelos=', novo: process.env.MODELOS ? '&modelos=' + process.env.MODELOS : '' };
async function foto(nome, lado) {
  const c = CENAS[nome];
  await page.goto(P + LADO[lado]); await page.waitForFunction(() => window.__ian && window.__ian.game.scene.isActive('Menu'));
  await page.evaluate(() => { localStorage.setItem('ian-e-seus-amigos:v1', JSON.stringify({ tut: { jump: true, water: true, dbl: true, float: true }, sound: false })); });
  await page.evaluate(() => window.__ian.modelos.carregarModelos());
  await page.evaluate((phase) => window.__ian.game.scene.start('Game3D', { mode: 'facil', phase, seed: 'previa', manual: true }), c.phase);
  await page.waitForFunction(() => window.__ian3);
  await page.evaluate(([c, run]) => {
    const g = window.__ian3; g.spawnLogic = () => {}; g.tutorialJump = false; g.tutDouble = false; g.tutFloat = false; g.p.invul = 1e9;
    if (c.dist) { g.dist = c.dist; g.prevDist = c.dist; }
    for (let i = 0; i < 40; i++) g.tick(1 / 60);
    if (run) (0, eval)('(' + run + ')')(g);
    g.kid.visible = true; g.updateCamera(1, true); g.render();
  }, [{ dist: c.dist || 0 }, c.run ? c.run.toString() : null]);
  await page.waitForTimeout(2600);                                            // some o letreiro "Fase N"
  await page.evaluate(() => window.__ian3.render());
  await page.screenshot({ path: path.join(out, `${nome}-${lado}.png`) });
}
// tela inicial
if (!so || so.includes('tela-inicial')) for (const lado of ['hoje', 'novo']) {
  await page.goto(P + LADO[lado]); await page.waitForFunction(() => window.__ian && window.__ian.game.scene.isActive('Menu'));
  await page.evaluate(() => window.__ian.modelos.carregarModelos()); await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(out, `tela-inicial-${lado}.png`) });
}
for (const nome of Object.keys(CENAS)) { if (so && !so.includes(nome)) continue; for (const lado of ['hoje', 'novo']) await foto(nome, lado); console.log('ok', nome); }
console.log('erros:', errs.length ? [...new Set(errs)].slice(0, 6) : 'nenhum');
await browser.close(); srv.close();
