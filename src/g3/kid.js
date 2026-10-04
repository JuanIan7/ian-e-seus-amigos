// Criança 3D personalizável (feita por código): 7 tons de pele, 3 formatos de rosto, 8 penteados,
// 8 cores de cabelo, 6 cores de olhos e 10 roupas. Olha para -Z (a câmera fica atrás, em +Z).
import { THREE, P, sph, box, cyl, cone, cap, tor, dome, toMesh, toonGlass, pivot, hex } from './kit.js';
import { SKINS, HAIR_COLORS, EYE_COLORS } from '../character.js';

const O = {
  bombeiro:   { top: 0xe8352f, pants: 0x1f3b73, shoes: 0x2b2b2b, sleeve: 0xe8352f },
  equipe:     { top: 0xf6ead0, pants: 0x1b6e7e, shoes: 0xffffff, sleeve: 0x1fb8ae },
  dino:       { top: 0x58c248, pants: 0x58c248, shoes: 0x7ed56f, sleeve: 0x58c248 },
  explorador: { top: 0xf3ead2, pants: 0xa38c52, shoes: 0x6b4a2b, sleeve: 0xf3ead2 },
  piloto:     { top: 0x2f78e0, pants: 0x2f78e0, shoes: 0xffffff, sleeve: 0x2f78e0, glove: 0xffffff },
  guarda:     { top: 0x5fa03a, pants: 0x7a5530, shoes: 0x3b2a1a, sleeve: 0x5fa03a },
  astronauta: { top: 0xf4f6fa, pants: 0xf4f6fa, shoes: 0x9aa0a8, sleeve: 0xf4f6fa, glove: 0xffffff },
  heroi:      { top: 0x7b3fe0, pants: 0x7b3fe0, shoes: 0xff3d8f, sleeve: 0x7b3fe0, glove: 0xff3d8f },
  esporte:    { top: 0x2f9bff, pants: 0x1f3b73, shoes: 0xffffff, sleeve: 0x2f9bff },
  casual:     { top: 0xffd23f, pants: 0x4a82cc, shoes: 0xe8352f, sleeve: 0xffd23f, shortSleeve: true },
};
const OUTFIT_IDS = ['bombeiro', 'equipe', 'dino', 'explorador', 'piloto', 'guarda', 'astronauta', 'heroi', 'esporte', 'casual'];

const R = 0.27;                 // raio da cabeça (cabeça grande = proporção cartoon)
const FEET = 0.46;              // altura do quadril

function buildHead(look, o, id) {
  const skin = SKINS[look.skin] ?? SKINS[3], hc = HAIR_COLORS[look.hairColor] ?? HAIR_COLORS[1], ec = EYE_COLORS[look.eyes] ?? EYE_COLORS[0];
  const head = new THREE.Group();
  const face = look.face ?? 0;
  // --- cabeça ---
  const base = [];
  let zf = R;                    // posição z da frente do rosto
  if (face === 2) { base.push(P(box(0.5, 0.5, 0.48, 0.19), skin, [0, 0, 0])); zf = 0.24; }
  else if (face === 1) { base.push(P(sph(R, 18, 14), skin, [0, 0.01, 0], [0, 0, 0], [0.92, 1.1, 0.96])); zf = R * 0.96; }
  else base.push(P(sph(R, 18, 14), skin, [0, 0, 0], [0, 0, 0], [1, 0.97, 0.98]));
  const ex = face === 1 ? 0.25 : 0.265;
  base.push(P(sph(0.06, 8, 6), hex(skin, 0.93), [-ex, -0.01, 0.01], [0, 0, 0], [0.6, 1, 0.9]), P(sph(0.06, 8, 6), hex(skin, 0.93), [ex, -0.01, 0.01], [0, 0, 0], [0.6, 1, 0.9]));
  base.push(P(cyl(0.07, 0.08, 0.1, 10), hex(skin, 0.9), [0, -0.27, 0.01]));
  head.add(toMesh(base, { thin: true }));

  // --- rosto: olhos grandes e brilhantes, sobrancelhas, nariz, sorriso aberto e bochechas ---
  const fz = -zf;
  const f = [];
  const eye = (sx) => {
    f.push(P(sph(0.078, 12, 9), 0xffffff, [sx * 0.105, 0.035, fz + 0.035], [0, 0, 0], [1, 1.2, 0.55]));
    f.push(P(sph(0.052, 10, 8), ec, [sx * 0.105, 0.03, fz + 0.012], [0, 0, 0], [1, 1.15, 0.5]));
    f.push(P(sph(0.029, 8, 6), 0x0d0b0a, [sx * 0.105, 0.03, fz + 0.002], [0, 0, 0], [1, 1.1, 0.5]));
    f.push(P(sph(0.018, 6, 5), 0xffffff, [sx * 0.105 - sx * 0.018, 0.058, fz - 0.004], [0, 0, 0], [1, 1, 0.5]));
    f.push(P(sph(0.009, 6, 5), 0xffffff, [sx * 0.105 + sx * 0.02, 0.0, fz - 0.004], [0, 0, 0], [1, 1, 0.5]));
    f.push(P(cap(look.brows ? 0.022 : 0.014, 0.075, 3, 6), hex(hc, 0.7), [sx * 0.105, 0.125 + (look.brows ? 0.005 : 0), fz + 0.03], [0, 0, Math.PI / 2 + sx * 0.12], [1, 1, 0.8]));
  };
  eye(-1); eye(1);
  if (look.freckles) [-1, 1].forEach((s) => [[0.13, -0.04], [0.17, -0.02], [0.16, -0.07], [0.2, -0.05], [0.12, -0.08]].forEach(([x, y]) => f.push(P(sph(0.011, 6, 5), hex(skin, 0.72), [s * x, y, fz + 0.045]))));
  f.push(P(sph(0.026, 8, 6), hex(skin, 0.86), [0, -0.035, fz - 0.005], [0, 0, 0], [1, 0.8, 0.8]));
  f.push(P(tor(0.062, 0.014, 6, 14, Math.PI), 0x5a1a26, [0, -0.07, fz + 0.018], [0, 0, Math.PI]));                       // sorriso
  f.push(P(sph(0.05, 8, 6), 0x7a2230, [0, -0.095, fz + 0.012], [0, 0, 0], [1.2, 0.55, 0.4]));                           // boca aberta
  f.push(P(sph(0.026, 6, 5), 0xff7d8a, [0, -0.106, fz + 0.006], [0, 0, 0], [1.3, 0.5, 0.4]));
  f.push(P(sph(0.045, 8, 6), 0xff7a8a, [-0.17, -0.055, fz + 0.04], [0, 0, 0], [1, 0.7, 0.35]), P(sph(0.045, 8, 6), 0xff7a8a, [0.17, -0.055, fz + 0.04], [0, 0, 0], [1, 0.7, 0.35]));
  if (id === 'heroi') f.push(P(box(0.47, 0.1, 0.03, 0.03), 0x4a1fb0, [0, 0.035, fz + 0.03]), P(sph(0.078, 12, 9), 0xffffff, [-0.105, 0.035, fz + 0.003], [0, 0, 0], [1, 1.2, 0.5]), P(sph(0.078, 12, 9), 0xffffff, [0.105, 0.035, fz + 0.003], [0, 0, 0], [1, 1.2, 0.5]));
  head.add(toMesh(f, { outline: false }));

  // --- cabelo ---
  const hair = new THREE.Group(); head.add(hair);
  const hat = id === 'bombeiro' || id === 'equipe' || id === 'dino' || id === 'explorador' || id === 'piloto' || id === 'guarda' || id === 'casual';
  const covered = id === 'bombeiro' || id === 'dino' || id === 'piloto';          // capacete cobre o topo do cabelo
  const hp = [];
  const style = look.hair ?? 0;
  const capR = R * 1.07;
  const cap1 = () => hp.push(P(dome(capR, 0, 1.78, 18, 10), hc, [0, 0.015, 0.012], [0.3, 0, 0], [face === 1 ? 0.95 : 1, 1.02, 1.02]));
  const fringe = () => { [[-0.12, 0.17, 0.19, 0.5], [0, 0.205, 0.215, 0.2], [0.12, 0.17, 0.19, -0.5]].forEach(([x, y, z, rz]) => hp.push(P(sph(0.095, 9, 7), hc, [x, y, -z], [0.3, 0, rz], [1.15, 0.75, 0.8]))); };
  if (!covered) {
    if (style === 4) hp.push(P(sph(0.385, 14, 10), hc, [0, 0.06, 0.14], [0, 0, 0], [1, 0.98, 0.98]));
    else if (style === 9) hp.push(P(dome(capR * 0.97, 0, 1.6, 18, 10), hc, [0, 0.01, 0.01], [0.3, 0, 0]));
    else cap1();
    if (style !== 4 && style !== 9 && style !== 8 && !hat) fringe();
    if (style === 8 && !hat) for (let i = 0; i < 6; i++) hp.push(P(cone(0.06, 0.16 - Math.abs(i - 2.5) * 0.02, 10), hc, [0, 0.29 - Math.abs(i - 2.5) * 0.02, -0.18 + i * 0.075], [-0.4 + i * 0.16, 0, 0]));
    if (style === 1) { hp.push(P(box(0.5, 0.62, 0.13, 0.06), hc, [0, -0.15, 0.2])); hp.push(P(cap(0.055, 0.34, 4, 8), hc, [-0.275, -0.08, 0.02]), P(cap(0.055, 0.34, 4, 8), hc, [0.275, -0.08, 0.02])); }
    if (style === 2) { [[-1, 0.0], [1, 0.0], [-1, -0.15], [1, -0.15], [0, -0.04], [-0.5, -0.13], [0.5, -0.13]].forEach(([sx, y], i) => hp.push(P(sph(0.1, 8, 6), hc, [sx * 0.24, y - 0.03, 0.1 + (sx === 0 || Math.abs(sx) < 1 ? 0.14 : 0)], [0, 0, 0], [1, 1.1, 1]))); }
    if (style === 3) { for (let i = 0; i < 22; i++) { const a = i * 2.399, k = Math.sqrt((i + 0.5) / 22); const y = 0.1 + (1 - k) * 0.22, rr = 0.19 + k * 0.1; const x = Math.cos(a) * rr, z = Math.sin(a) * rr + 0.03; if (z < -0.12 && y < 0.2) continue; hp.push(P(sph(0.082, 7, 6), hc, [x, y, z])); } [-1, 1].forEach((s) => hp.push(P(sph(0.085, 7, 6), hc, [s * 0.255, -0.02, 0.05]), P(sph(0.08, 7, 6), hc, [s * 0.235, -0.1, 0.1]))); }
    if (style === 7) { [-1, 1].forEach((s) => { hp.push(P(sph(0.12, 10, 8), hc, [s * 0.2, 0.3, 0.02])); hp.push(P(tor(0.07, 0.022, 6, 12), 0xff6fb5, [s * 0.2, 0.235, 0.02], [Math.PI / 2, 0, 0])); }); }
  } else if (id === 'bombeiro' || id === 'piloto') { hp.push(P(sph(0.1, 8, 6), hc, [-0.16, -0.03, 0.14]), P(sph(0.1, 8, 6), hc, [0.16, -0.03, 0.14])); if (style === 1) hp.push(P(box(0.4, 0.5, 0.1, 0.05), hc, [0, -0.1, 0.24])); }
  if (hp.length) hair.add(toMesh(hp, { thin: true }));
  // rabo de cavalo / trança com balanço próprio
  const sway = [];
  if (style === 5 || style === 6) {
    const pv = pivot(0, 0.12, 0.27); const q = [];
    if (style === 5) { q.push(P(sph(0.045, 8, 6), 0xff6fb5, [0, 0, 0.02])); q.push(P(cap(0.075, 0.28, 4, 8), hc, [0, -0.15, 0.1], [0.28, 0, 0])); q.push(P(sph(0.09, 8, 6), hc, [0, -0.33, 0.14])); }
    else { for (let i = 0; i < 6; i++) q.push(P(sph(0.07 - i * 0.004, 8, 6), hc, [0, -0.04 - i * 0.095, 0.03 + i * 0.012])); q.push(P(sph(0.04, 8, 6), 0xff6fb5, [0, -0.62, 0.1])); }
    pv.add(toMesh(q, { thin: true })); head.add(pv); sway.push(pv);
  }
  head.userData.sway = sway;

  // --- chapéus e acessórios de cabeça ---
  const hd = [], glass = [];
  const brimBack = (c, w = 0.44, z = 0.06, y = 0.02) => hd.push(P(sph(0.5, 14, 6), c, [0, y, z], [0, 0, 0], [w, 0.06, w * 0.92]));
  switch (id) {
    case 'bombeiro':
      hd.push(P(dome(0.315, 0, 1.85, 18, 10), 0xe8352f, [0, 0.02, 0.012], [0.3, 0, 0]));
      hd.push(P(sph(0.5, 14, 6), 0xc42620, [0, 0.0, 0.1], [0.28, 0, 0], [0.74, 0.07, 0.62]));                           // aba traseira
      hd.push(P(box(0.07, 0.04, 0.5, 0.02), 0xfff3b0, [0, 0.31, 0.0], [0.3, 0, 0]));                                   // faixa
      hd.push(P(sph(0.08, 10, 8), 0xffd23f, [0, 0.17, -0.29], [0.3, 0, 0], [1.2, 1.3, 0.35]));                          // escudo fictício
      hd.push(P(sph(0.034, 8, 6), 0xe8352f, [0, 0.17, -0.31], [0, 0, 0], [1, 1, 0.5]));
      break;
    case 'equipe':
      hd.push(P(dome(0.3, 0, 1.6, 18, 10), 0x1fb8ae, [0, 0.11, 0.03], [0.35, 0, 0]));
      hd.push(P(sph(0.5, 14, 6), 0x168f87, [0, 0.19, -0.25], [-0.12, 0, 0], [0.46, 0.06, 0.32]));
      hd.push(P(sph(0.07, 10, 8), 0xff8a1f, [0, 0.33, -0.17], [0.5, 0, 0], [1.2, 1.2, 0.35]), P(sph(0.026, 8, 6), 0xffffff, [0, 0.335, -0.19], [0.5, 0, 0], [1.3, 1.1, 0.5]));
      break;
    case 'dino':
      hd.push(P(dome(0.325, 0, 1.95, 18, 10), 0x58c248, [0, 0.02, 0.02], [0.28, 0, 0]));
      [[0.3, 0.07], [0.22, 0.07], [0.13, 0.09]].forEach(([z, s2], i) => hd.push(P(cone(0.06 + i * 0.01, 0.15 + i * 0.03, 8), 0xf1e6b3, [0, 0.34 - i * 0.04, 0.16 + z * 0.3 - 0.14 + i * 0.05], [0.5, 0, 0])));
      [-1, 1].forEach((s) => hd.push(P(sph(0.075, 10, 8), 0xffffff, [s * 0.13, 0.28, -0.1]), P(sph(0.04, 8, 6), 0x111111, [s * 0.13, 0.3, -0.16])));
      break;
    case 'explorador':
      hd.push(P(dome(0.29, 0, 1.6, 18, 10), 0xd2b36a, [0, 0.07, 0.01], [0.15, 0, 0]));
      brimBack(0xc2a15a, 0.98, -0.01, 0.1); hd.push(P(cyl(0.3, 0.3, 0.05, 18), 0x6b4a2b, [0, 0.12, 0.01]));
      break;
    case 'piloto':
      hd.push(P(dome(0.31, 0, 1.9, 18, 10), 0x2f78e0, [0, 0.02, 0.012], [0.3, 0, 0]));
      hd.push(P(box(0.07, 0.04, 0.46, 0.02), 0xffffff, [0, 0.31, 0.0], [0.3, 0, 0]));
      [-1, 1].forEach((s) => { hd.push(P(tor(0.075, 0.025, 8, 14), 0xff8a1f, [s * 0.1, 0.2, -0.285], [0.1, 0, 0])); hd.push(P(cyl(0.07, 0.07, 0.02, 12), 0x8fdcff, [s * 0.1, 0.2, -0.29], [Math.PI / 2 + 0.1, 0, 0])); });
      hd.push(P(box(0.08, 0.025, 0.03, 0.01), 0xff8a1f, [0, 0.2, -0.29]));
      break;
    case 'guarda':
      hd.push(P(cyl(0.22, 0.26, 0.17, 16), 0x5fa03a, [0, 0.22, 0.01]), P(cyl(0.435, 0.435, 0.035, 20), 0x4b8a2c, [0, 0.14, 0.0]), P(cyl(0.262, 0.262, 0.04, 16), 0xffd23f, [0, 0.18, 0.01]));
      break;
    case 'astronauta':
      glass.push(P(sph(0.39, 20, 14), 0xbfe8ff, [0, 0.0, 0.0]));
      hd.push(P(tor(0.27, 0.05, 8, 20), 0xdfe3ea, [0, -0.28, 0.0], [Math.PI / 2, 0, 0]));
      break;
    case 'esporte':
      hd.push(P(tor(0.27, 0.035, 6, 20), 0x2f9bff, [0, 0.14, 0.01], [Math.PI / 2 + 0.2, 0, 0]), P(tor(0.272, 0.01, 4, 20), 0xffffff, [0, 0.14, 0.01], [Math.PI / 2 + 0.2, 0, 0]));
      break;
    case 'casual':
      hd.push(P(dome(0.3, 0, 1.55, 18, 10), 0xffd23f, [0, 0.13, 0.03], [0.35, 0, 0]));
      hd.push(P(sph(0.5, 14, 6), 0xe8352f, [0, 0.215, -0.25], [-0.12, 0, 0], [0.5, 0.06, 0.34]));
      hd.push(P(sph(0.035, 8, 6), 0xe8352f, [0, 0.37, 0.0]));
      break;
    default: break;
  }
  // --- acessórios escolhidos na personalização ---
  const acc = look.acc || 0, fz2 = -zf;
  if (acc === 1 || acc === 2) {
    const rim = acc === 1 ? 0x2b3350 : 0x1b1b24, lens = acc === 1 ? 0xcfefff : 0x253046;
    [-1, 1].forEach((s) => { hd.push(P(tor(0.065, 0.014, 8, 20), rim, [s * 0.105, 0.035, fz2 - 0.015])); if (acc === 2) hd.push(P(cyl(0.062, 0.062, 0.01, 20), lens, [s * 0.105, 0.035, fz2 - 0.018], [Math.PI / 2, 0, 0])); });
    hd.push(P(box(0.07, 0.014, 0.014, 0.006), rim, [0, 0.045, fz2 - 0.015]), P(box(0.014, 0.014, 0.2, 0.006), rim, [-0.25, 0.04, fz2 + 0.08]), P(box(0.014, 0.014, 0.2, 0.006), rim, [0.25, 0.04, fz2 + 0.08]));
  }
  if (acc === 3) { const c = 0xff4f9a; hd.push(P(sph(0.06), c, [0.2, 0.24, -0.05], [0, 0, 0], [1.4, 0.9, 0.6]), P(sph(0.06), c, [0.32, 0.24, -0.05], [0, 0, 0], [1.4, 0.9, 0.6]), P(sph(0.035), hex(c, 0.8), [0.26, 0.24, -0.06])); }
  if (acc === 4) { for (let i = 0; i < 5; i++) { const a = -0.9 + i * 0.45; hd.push(P(sph(0.035), i % 2 ? 0xffd23f : 0xff8a1f, [Math.sin(a) * 0.27, 0.27 + Math.cos(a) * 0.05, -Math.cos(a) * 0.08 + 0.02], [0, 0, 0], [1, 1, 0.5])); } hd.push(P(tor(0.27, 0.014, 6, 24, Math.PI), 0xffd23f, [0, 0.2, 0.0], [0.15, 0, 0])); }
  if (hd.length) head.add(toMesh(hd, { thin: true }));
  if (glass.length) { const gm = toMesh(glass, { outline: false, material: toonGlass }); gm.renderOrder = 3; head.add(gm); }
  return head;
}

function buildBody(look, id) {
  const o = O[id];
  const parts = {};
  const root = new THREE.Group();
  const skin = SKINS[look.skin] ?? SKINS[3];

  // pernas (pivô no quadril)
  const mkLeg = (x) => {
    const pv = pivot(x, FEET, 0);
    const ps = [];
    if (id === 'casual') ps.push(P(cap(0.085, 0.1, 4, 10), o.pants, [0, -0.11, 0]), P(cap(0.07, 0.14, 4, 10), skin, [0, -0.27, 0]));
    else ps.push(P(cap(0.088, 0.24, 4, 10), o.pants, [0, -0.19, 0]));
    if (id === 'bombeiro') ps.push(P(cyl(0.09, 0.09, 0.03, 10), 0xffd23f, [0, -0.3, 0]));
    if (id === 'dino') ps.push(P(cap(0.09, 0.2, 4, 10), o.pants, [0, -0.19, 0]));
    ps.push(P(box(0.17, 0.1, 0.27, 0.05), o.shoes, [0, -0.43, -0.04]), P(box(0.172, 0.03, 0.272, 0.01), 0xf2f2f2, [0, -0.485, -0.04]));
    if (id === 'dino') [-1, 0, 1].forEach((k) => ps.push(P(sph(0.032, 6, 5), 0xfff3dc, [k * 0.05, -0.43, -0.185])));
    pv.add(toMesh(ps, { thin: true }));
    return pv;
  };
  const legL = mkLeg(-0.1), legR = mkLeg(0.1);
  root.add(legL, legR);

  // tronco
  const torso = pivot(0, FEET, 0);
  const tp = [P(box(0.37, 0.4, 0.25, 0.1), o.top, [0, 0.2, 0]), P(box(0.375, 0.07, 0.255, 0.03), hex(o.pants, 0.9), [0, 0.035, 0])];
  switch (id) {
    case 'bombeiro':
      tp.push(P(box(0.385, 0.045, 0.265, 0.02), 0xffe14a, [0, 0.27, 0]), P(box(0.385, 0.035, 0.265, 0.02), 0xffe14a, [0, 0.17, 0]));
      tp.push(P(box(0.045, 0.34, 0.27, 0.02), 0xffe14a, [0, 0.2, 0.002]));        // faixa vertical (vista de costas)
      tp.push(P(sph(0.028, 6, 5), 0xffd23f, [-0.1, 0.32, -0.125]), P(sph(0.028, 6, 5), 0xffd23f, [0.1, 0.32, -0.125]));
      break;
    case 'equipe':
      tp.push(P(box(0.14, 0.38, 0.262, 0.05), 0x1fb8ae, [-0.115, 0.2, 0]), P(box(0.14, 0.38, 0.262, 0.05), 0x1fb8ae, [0.115, 0.2, 0]));
      tp.push(P(sph(0.075, 10, 8), 0xff8a1f, [0, 0.27, 0.125], [0, 0, 0], [1, 1, 0.3]), P(sph(0.03, 8, 6), 0xffffff, [0, 0.265, 0.14], [0, 0, 0], [1.2, 1, 0.5]));
      [[-0.04, 0.31], [0, 0.325], [0.04, 0.31]].forEach(([x, y]) => tp.push(P(sph(0.013, 6, 5), 0xffffff, [x, y, 0.14])));
      break;
    case 'dino': tp.push(P(sph(0.16, 12, 10), 0xf1e6b3, [0, 0.2, -0.07], [0, 0, 0], [0.9, 1.15, 0.6])); break;
    case 'explorador':
      tp.push(P(box(0.15, 0.38, 0.262, 0.05), 0xc2a15a, [-0.115, 0.2, 0]), P(box(0.15, 0.38, 0.262, 0.05), 0xc2a15a, [0.115, 0.2, 0]), P(box(0.385, 0.05, 0.265, 0.02), 0x6b4a2b, [0, 0.05, 0]));
      tp.push(P(box(0.07, 0.07, 0.03, 0.01), 0xa8863f, [-0.12, 0.22, -0.13]), P(box(0.07, 0.07, 0.03, 0.01), 0xa8863f, [0.12, 0.22, -0.13]));
      break;
    case 'piloto': tp.push(P(box(0.385, 0.05, 0.265, 0.02), 0xff8a1f, [0, 0.22, 0]), P(tor(0.14, 0.05, 8, 16), 0xffffff, [0, 0.4, 0], [Math.PI / 2, 0, 0])); break;
    case 'guarda':
      tp.push(P(box(0.07, 0.4, 0.262, 0.02), 0x8a5a35, [-0.1, 0.2, 0]), P(box(0.07, 0.4, 0.262, 0.02), 0x8a5a35, [0.1, 0.2, 0]), P(box(0.385, 0.05, 0.265, 0.02), 0x3b2a1a, [0, 0.05, 0]));
      tp.push(P(cone(0.05, 0.1, 3), 0xffd23f, [0, 0.31, -0.13]));
      break;
    case 'astronauta':
      tp.push(P(box(0.2, 0.15, 0.03, 0.03), 0x4db8ff, [0, 0.27, -0.125]), P(sph(0.03, 6, 5), 0xe8352f, [-0.05, 0.27, -0.145]), P(sph(0.03, 6, 5), 0x3ecb6b, [0.05, 0.27, -0.145]), P(box(0.385, 0.045, 0.265, 0.02), 0xff8a1f, [0, 0.15, 0]));
      tp.push(P(box(0.3, 0.34, 0.14, 0.06), 0xdfe3ea, [0, 0.22, 0.19]), P(cyl(0.04, 0.04, 0.12, 8), 0xff8a1f, [-0.07, 0.1, 0.27]), P(cyl(0.04, 0.04, 0.12, 8), 0xff8a1f, [0.07, 0.1, 0.27]));
      break;
    case 'heroi':
      tp.push(P(sph(0.1, 10, 8), 0xffd23f, [0, 0.27, -0.12], [0, 0, 0], [1, 1, 0.25]), P(box(0.385, 0.06, 0.265, 0.02), 0xffd23f, [0, 0.06, 0]));
      break;
    case 'esporte': tp.push(P(box(0.07, 0.4, 0.262, 0.02), 0xffffff, [0, 0.2, 0]), P(box(0.385, 0.04, 0.265, 0.02), 0xffffff, [0, 0.3, 0]), P(box(0.385, 0.06, 0.265, 0.02), 0x1f3b73, [0, 0.04, 0])); break;
    case 'casual':
      [[0.12, 0xe8352f], [0.09, 0x3ecb6b], [0.06, 0x2f9bff]].forEach(([r, c]) => tp.push(P(tor(r, 0.016, 5, 14, Math.PI), c, [0, 0.24, -0.128], [0, 0, 0])));
      break;
    default: break;
  }
  torso.add(toMesh(tp, { thin: true }));
  root.add(torso);

  // braços (pivô no ombro)
  const mkArm = (x) => {
    const pv = pivot(x, FEET + 0.37, 0); const ps = [];
    if (o.shortSleeve) ps.push(P(cap(0.07, 0.07, 4, 10), o.sleeve, [0, -0.07, 0]), P(cap(0.058, 0.12, 4, 10), skin, [0, -0.2, 0]));
    else ps.push(P(cap(0.07, 0.17, 4, 10), o.sleeve, [0, -0.13, 0]));
    ps.push(P(sph(0.075, 10, 8), o.glove ?? skin, [0, -0.31, 0]));
    if (id === 'bombeiro') ps.push(P(cyl(0.073, 0.073, 0.035, 10), 0xffe14a, [0, -0.2, 0]));
    if (id === 'heroi' || id === 'astronauta') ps.push(P(cyl(0.078, 0.078, 0.04, 10), id === 'heroi' ? 0xffd23f : 0xff8a1f, [0, -0.25, 0]));
    pv.add(toMesh(ps, { thin: true }));
    return pv;
  };
  const armL = mkArm(-0.24), armR = mkArm(0.24);
  root.add(armL, armR);

  // traseiros: cauda, capa, mochila
  const back = pivot(0, FEET + 0.3, 0.14); root.add(back);
  if (id === 'dino') {
    const tail = pivot(0, -0.12, 0.05); const tp2 = [P(cone(0.1, 0.5, 8), 0x58c248, [0, 0, 0.22], [Math.PI / 2 + 0.25, 0, 0]), P(cone(0.05, 0.12, 6), 0xf1e6b3, [0, 0.09, 0.14]), P(cone(0.045, 0.1, 6), 0xf1e6b3, [0, 0.06, 0.3]), P(cone(0.04, 0.09, 6), 0xf1e6b3, [0, 0.03, 0.43])];
    tail.add(toMesh(tp2, { thin: true })); back.add(tail); parts.tail = tail;
  }
  if (id === 'heroi') {
    const cape = pivot(0, 0.12, 0.02); const cg = new THREE.PlaneGeometry(0.5, 0.64, 1, 4); cg.translate(0, -0.32, 0);
    const pos = cg.attributes.position; const col = new Float32Array(pos.count * 3); const c1 = new THREE.Color(0xff3d8f), c2 = new THREE.Color(0xc2185b);
    for (let i = 0; i < pos.count; i++) { const k = Math.min(1, Math.max(0, -pos.getY(i) / 0.64)); const c = c1.clone().lerp(c2, k * 0.6); col.set([c.r, c.g, c.b], i * 3); }
    cg.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const mat = new THREE.MeshToonMaterial({ vertexColors: true, side: THREE.DoubleSide, gradientMap: null });
    const cm = new THREE.Mesh(cg, mat); cape.add(cm); cape.userData.geo = cg; cape.userData.base = Float32Array.from(pos.array); back.add(cape); parts.cape = cape;
  }
  if (id === 'explorador') back.add(toMesh([P(box(0.3, 0.34, 0.14, 0.06), 0x8a5a35, [0, -0.02, 0.09]), P(cyl(0.07, 0.07, 0.34, 10), 0xd04a3a, [0, 0.2, 0.1], [0, 0, Math.PI / 2]), P(box(0.12, 0.08, 0.04, 0.02), 0x6b4a2b, [0, -0.06, 0.17])], { thin: true }));
  if (id === 'piloto') back.add(toMesh([P(cyl(0.06, 0.06, 0.3, 10), 0xff8a1f, [-0.08, -0.02, 0.09]), P(cyl(0.06, 0.06, 0.3, 10), 0xff8a1f, [0.08, -0.02, 0.09]), P(cone(0.05, 0.1, 8), 0x555a66, [-0.08, -0.22, 0.09], [Math.PI, 0, 0]), P(cone(0.05, 0.1, 8), 0x555a66, [0.08, -0.22, 0.09], [Math.PI, 0, 0])], { thin: true }));
  if (id === 'guarda') back.add(toMesh([P(sph(0.1, 10, 8), 0x8a5a35, [0.0, -0.05, 0.1], [0, 0, 0], [1, 1.15, 0.7]), P(cyl(0.04, 0.04, 0.05, 8), 0xdfe3ea, [0, 0.07, 0.1], [Math.PI / 2, 0, 0])], { thin: true }));
  const acc = look.acc || 0;
  if (acc === 5 && id !== 'explorador' && id !== 'astronauta') back.add(toMesh([P(box(0.3, 0.32, 0.14, 0.08), 0xff8a1f, [0, -0.04, 0.1]), P(box(0.22, 0.12, 0.05, 0.04), 0xffd23f, [0, -0.1, 0.18]), P(cap(0.02, 0.28, 4, 8), 0x2b3350, [-0.1, 0.06, -0.02], [0.2, 0, 0]), P(cap(0.02, 0.28, 4, 8), 0x2b3350, [0.1, 0.06, -0.02], [0.2, 0, 0])], { thin: true }));
  if (acc === 6) torso.add(toMesh([P(tor(0.15, 0.05, 8, 20), 0xe8352f, [0, 0.4, 0], [Math.PI / 2, 0, 0]), P(box(0.08, 0.2, 0.05, 0.03), 0xe8352f, [0.08, 0.3, -0.13], [0, 0, 0.2]), P(tor(0.152, 0.012, 6, 20), 0xffffff, [0, 0.42, 0], [Math.PI / 2, 0, 0])], { thin: true }));
  if (id === 'equipe') back.add(toMesh([P(sph(0.05, 8, 6), 0xffffff, [0, 0.12, 0.0], [0, 0, 0], [1, 0.4, 0.2])], { outline: false }));

  // equipamento de mangueira (nas costas) e bocal (na mão)
  const hose = new THREE.Group(); hose.visible = false;
  hose.add(toMesh([P(tor(0.14, 0.04, 6, 16), 0xe8352f, [0, 0, 0.0]), P(tor(0.09, 0.04, 6, 16), 0xe8352f, [0, 0, 0.0]), P(box(0.07, 0.07, 0.1, 0.02), 0xffd23f, [0.14, -0.14, 0.0])], { thin: true }));
  hose.position.set(0, FEET + 0.22, 0.2); root.add(hose);
  const nozzle = new THREE.Group(); nozzle.visible = false;
  nozzle.add(toMesh([P(cyl(0.035, 0.035, 0.34, 8), 0xffd23f, [0, 0, -0.17], [Math.PI / 2, 0, 0]), P(cyl(0.055, 0.04, 0.1, 8), 0x555a66, [0, 0, -0.38], [Math.PI / 2, 0, 0]), P(cyl(0.032, 0.032, 0.2, 8), 0xe8352f, [0, 0.07, 0.0], [0.3, 0, 0])], { thin: true }));
  armR.add(nozzle); nozzle.position.set(0, -0.31, 0);
  Object.assign(parts, { legL, legR, torso, armL, armR, back, hose, nozzle });
  return { root, parts };
}

/** Cria a criança; usa a aparência salva (look). Origem nos pés. */
export function buildKid(look) {
  const id = OUTFIT_IDS[look.outfit] || 'bombeiro';
  const o = O[id];
  const group = new THREE.Group();                  // posição no mundo
  const spin = new THREE.Group(); group.add(spin);  // giros (cambalhota, comemoração)
  const body = new THREE.Group(); spin.add(body);   // inclinação e agachar
  const { root, parts } = buildBody(look, id);
  body.add(root);
  const head = buildHead(look, o, id); head.position.set(0, FEET + 0.4 + 0.26 + 0.02, 0); body.add(head);
  group.userData = { id, spin, body, head, ...parts, root };
  return group;
}

const ease = (a, b, k) => a + (b - a) * k;
/** Animação: correr / pular / pulo duplo / flutuar / jato de água / comemorar / parado. t = relógio, ph = fase da passada */
export function poseKid(kid, st, ph, t, o = {}) {
  const u = kid.userData, { legL, legR, armL, armR, body, head, torso, tail, cape } = u;
  const k = o.k ?? 1;
  let ly = 0, ry = 0, la = 0, ra = 0, bob = 0, lean = o.lean ?? 0, tilt = 0, lz = 0, rz = 0;
  if (st === 'run') {
    const s = Math.sin(ph), s2 = Math.sin(ph + Math.PI);
    ly = s * 1.0; ry = s2 * 1.0; la = s2 * 0.95; ra = s * 0.95; bob = Math.abs(Math.cos(ph)) * 0.05; lean += 0.2 + (o.fast ? 0.18 : 0);
    lz = 0.12; rz = -0.12;
  } else if (st === 'jump') { ly = -0.5; ry = 0.9; la = -2.5; ra = -2.3; lean += 0.05; lz = 0.2; rz = -0.2; }
  else if (st === 'flip') { ly = -1.2; ry = -1.2; la = -1.4; ra = -1.4; lean += 0.0; }
  else if (st === 'float') { ly = -0.25; ry = 0.35; la = -0.4; ra = -0.4; lz = 1.5; rz = -1.5; bob = Math.sin(t * 5) * 0.03; lean -= 0.05; }
  else if (st === 'glide') { ly = 0.1; ry = -0.1; la = -0.2; ra = -0.2; lz = 1.7; rz = -1.7; lean += 0.15; }
  else if (st === 'spray') { ly = 0.05; ry = -0.1; la = -0.5 + Math.sin(t * 9) * 0.05; ra = -1.55 + Math.sin(t * 14) * 0.05; lean += 0.08; }
  else if (st === 'cheer') { ly = 0; ry = 0; la = -2.9 + Math.sin(t * 12) * 0.35; ra = -2.9 - Math.sin(t * 12) * 0.35; bob = Math.abs(Math.sin(t * 7)) * 0.14; lz = 0.3; rz = -0.3; }
  else if (st === 'hit') { ly = 0.4; ry = -0.4; la = -0.6; ra = 0.6; lean = -0.3; }
  else { ly = ry = 0; la = ra = 0; bob = Math.sin(t * 2.4) * 0.012; lz = 0.04; rz = -0.04; }   // parado
  legL.rotation.x = ly * k; legR.rotation.x = ry * k; armL.rotation.x = la; armR.rotation.x = ra;
  armL.rotation.z = lz; armR.rotation.z = rz;
  body.position.y = bob; body.rotation.x = lean; body.rotation.z = (o.roll ?? 0);
  head.rotation.x = -lean * 0.6; head.rotation.y = o.look ?? 0; head.rotation.z = -(o.roll ?? 0) * 0.5;
  head.position.y = FEET + 0.4 + 0.26 + 0.02 + (st === 'run' ? Math.abs(Math.cos(ph)) * 0.015 : 0);
  head.userData.sway.forEach((p, i) => { p.rotation.x = (st === 'run' ? 0.5 + Math.sin(ph * 2 + i) * 0.3 : st === 'jump' || st === 'flip' ? -0.6 : st === 'float' ? Math.sin(t * 5) * 0.4 : Math.sin(t * 2) * 0.1); p.rotation.z = (o.roll ?? 0) * 1.5; });
  if (tail) { tail.rotation.y = Math.sin(t * (st === 'run' ? 8 : 3)) * 0.35; tail.rotation.x = st === 'jump' ? -0.5 : st === 'run' ? 0.1 + Math.sin(ph * 2) * 0.08 : 0; }
  if (cape) {
    const g = cape.userData.geo, pos = g.attributes.position, b = cape.userData.base;
    const sp = st === 'run' ? 1 : st === 'jump' || st === 'flip' || st === 'float' ? 0.5 : 0.2;
    for (let i = 0; i < pos.count; i++) { const y = b[i * 3 + 1], dd = -y / 0.64; pos.setZ(i, b[i * 3 + 2] + dd * (0.1 + (st === 'run' ? 0.38 : st === 'float' ? 0.2 : 0.12)) + Math.sin(t * 14 + y * 9) * 0.045 * dd * sp); pos.setX(i, b[i * 3] * (1 + dd * 0.25) + Math.sin(t * 9 + y * 5) * 0.03 * dd * sp); }
    pos.needsUpdate = true; g.computeVertexNormals(); cape.rotation.x = st === 'run' ? 0.25 : st === 'float' ? 0.5 : 0.1;
  }
}

// opções da personalização (3D)
export const HAIR_STYLES3 = ['Curto liso', 'Longo liso', 'Ondulado', 'Cacheado', 'Crespo', 'Rabo de cavalo', 'Trança', 'Coquinhos', 'Moicano', 'Raspadinho'];
export const ACCESSORIES = ['Nenhum', 'Óculos', 'Óculos escuros', 'Laço', 'Tiara de estrelas', 'Mochila', 'Cachecol'];
export { OUTFIT_IDS };
