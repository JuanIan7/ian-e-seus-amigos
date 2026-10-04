// Bichinhos, dinossauros e objetos de resgate em 3D (modelados por código, desenho original).
// Formas orgânicas: corpos arredondados, caudas/pescoços/patas em tubos curvos e afinados, olhos grandes com brilho.
// Todos "olham" para -Z (como a criança). userData guarda as articulações para a animação procedural.
import { THREE, P, sph, box, cyl, cone, cap, tor, dome, lathe, taper, slab, toMesh, toon, glow, hex, pivot, mergeParts } from './kit.js';

const part = (parts, o) => toMesh(parts, { thin: true, ...o });
/** corpo com barriga: a barriga (cor 'b') fica sem contorno para não marcar faixas escuras onde encosta na pele */
const partB = (parts, b) => { const g = new THREE.Group(); g.add(part(parts.filter((q) => q.color !== b))); const d = parts.filter((q) => q.color === b); if (d.length) g.add(part(d, { outline: false })); return g; };
/** olhos expressivos: branco, íris colorida, pupila, dois brilhos e pálpebra superior */
const eyes = (x, y, z, r = 0.07, spread = 0.13, iris = 0x3a2a1a, lid = null) => {
  const out = [];
  [-1, 1].forEach((s) => {
    const ex = x + s * spread;
    out.push(P(sph(r * 1.55), 0xffffff, [ex, y, z], [0, 0, 0], [1, 1.12, 0.62]));
    out.push(P(sph(r * 1.05), iris, [ex, y - r * 0.08, z - r * 0.62], [0, 0, 0], [1, 1.1, 0.5]));
    out.push(P(sph(r * 0.62), 0x0d0b0a, [ex, y - r * 0.08, z - r * 0.88], [0, 0, 0], [1, 1.1, 0.5]));
    out.push(P(sph(r * 0.36), 0xffffff, [ex - s * r * 0.3, y + r * 0.38, z - r * 1.18], [0, 0, 0], [1, 1, 0.5]));
    out.push(P(sph(r * 0.18), 0xffffff, [ex + s * r * 0.35, y - r * 0.35, z - r * 1.12], [0, 0, 0], [1, 1, 0.5]));
    if (lid) out.push(P(dome(r * 1.62, 0, Math.PI / 2), lid, [ex, y + r * 0.05, z + r * 0.05], [-0.35, 0, 0], [1, 0.75, 0.66]));
  });
  return out;
};
/** sorriso (arco) e língua opcional */
const smile = (x, y, z, w = 0.08, tongue = false, col = 0x3a1d18) => {
  const out = [P(tor(w, w * 0.18, 8, 16, Math.PI), col, [x, y, z], [0, 0, Math.PI])];
  if (tongue) out.push(P(sph(w * 0.55), 0xff6f8a, [x, y - w * 0.85, z + 0.005], [0.3, 0, 0], [1, 1.2, 0.5]));
  return out;
};

// =============================================================== cães da equipe (originais: nomes, cores e funções próprias)
export const DOGS3 = {
  bolota: { name: 'Bolota', coat: 0xe0a35a, patch: 0x9a5a2a, belly: 0xfff1d8, gear: 0xff8a1f, hat: 'fire', ears: 'floppy', iris: 0x5a3a1a },
  trovao: { name: 'Trovão', coat: 0x5a4430, patch: 0xd29a52, belly: 0xe8b878, gear: 0x3f8f4a, hat: 'ranger', ears: 'pointy', iris: 0x3a2a1a },
  pipoca: { name: 'Pipoca', coat: 0xfafafa, patch: 0x2a2a2a, belly: 0xffffff, gear: 0x8a4fd9, hat: 'aviator', ears: 'floppy', spots: true, iris: 0x2f5fb8 },
  marola: { name: 'Marola', coat: 0xf1cf7a, patch: 0xd9a84a, belly: 0xfff4d8, gear: 0xff6a1a, hat: 'sailor', ears: 'floppy', vest: true, iris: 0x5a3a1a },
  faisca: { name: 'Faísca', coat: 0x7a7f8c, patch: 0xf2f2f2, belly: 0xffffff, gear: 0xe8352f, hat: 'helmet', ears: 'pointy', mask: true, iris: 0x2f8fd0 },
};
export function buildDog(key = 'bolota') {
  const d = DOGS3[key] || DOGS3.bolota, g = new THREE.Group(), u = g.userData;
  u.body = pivot(0, 0, 0); g.add(u.body);
  // corpo: tronco em forma de feijão, peito fofo e colete/coleira da equipe
  const torso = [
    P(taper([[0, 0.66, -0.3], [0, 0.66, 0.05], [0, 0.62, 0.38]], [0.33, 0.36, 0.3]), d.coat),
    P(sph(0.26), d.belly, [0, 0.6, -0.36], [0.4, 0, 0], [1, 1.05, 0.8]),
    P(sph(0.24), d.belly, [0, 0.46, 0.0], [0, 0, 0], [1, 0.6, 1.6]),
    P(tor(0.25, 0.05, 8, 20), d.gear, [0, 0.82, -0.36], [1.25, 0, 0]),
    P(cyl(0.07, 0.07, 0.03, 16), 0xffd23f, [0, 0.66, -0.58], [Math.PI / 2, 0, 0]),
  ];
  if (d.vest) torso.push(P(taper([[0, 0.68, -0.22], [0, 0.68, 0.22]], [0.39, 0.38]), 0xff6a1a), P(box(0.5, 0.06, 0.12, 0.03), 0xffffff, [0, 0.8, -0.05], [0, 0, 0]));
  else torso.push(P(box(0.46, 0.06, 0.4, 0.03), d.gear, [0, 0.98, 0.0], [0.05, 0, 0]), P(box(0.18, 0.08, 0.18, 0.04), hex(d.gear, 0.8), [0, 1.02, 0.12]));
  if (d.spots) [[0.2, 0.86, 0.1], [-0.24, 0.8, 0.25], [0.28, 0.66, 0.3], [-0.3, 0.7, -0.1], [0.05, 0.94, 0.35], [-0.12, 0.92, -0.05]].forEach(([x, y, z], i) => torso.push(P(sph(0.075 + (i % 3) * 0.015), d.patch, [x, y, z], [0, 0, 0], [1, 0.5, 1])));
  else torso.push(P(sph(0.27), d.patch, [0.04, 0.8, 0.22], [0, 0, 0], [1.15, 0.45, 1.1]));
  u.body.add(part(torso));
  // cabeça grande (proporção de filhote)
  u.head = pivot(0, 0.98, -0.5); u.body.add(u.head);
  const hp = [
    P(sph(0.36), d.coat, [0, 0.04, 0], [0, 0, 0], [1.05, 0.98, 1]),
    P(sph(0.2), d.belly, [0, -0.1, -0.26], [0, 0, 0], [1.15, 0.85, 1.05]),
    P(sph(0.12), d.belly, [-0.13, -0.13, -0.24], [0, 0, 0], [1, 0.85, 1]), P(sph(0.12), d.belly, [0.13, -0.13, -0.24], [0, 0, 0], [1, 0.85, 1]),
    P(sph(0.075), 0x1b1b24, [0, -0.02, -0.46], [0, 0, 0], [1.25, 0.9, 0.9]), P(sph(0.025), 0xffffff, [-0.025, 0.01, -0.52]),
    ...eyes(0, 0.1, -0.27, 0.065, 0.14, d.iris),
    ...smile(0, -0.17, -0.4, 0.07, true),
    P(cap(0.018, 0.08, 4, 8), hex(d.coat, 0.55), [-0.14, 0.27, -0.27], [0, 0, 1.3]), P(cap(0.018, 0.08, 4, 8), hex(d.coat, 0.55), [0.14, 0.27, -0.27], [0, 0, -1.3]),
  ];
  if (d.mask) hp.push(P(sph(0.3), d.patch, [0, 0.0, -0.08], [0, 0, 0], [1.02, 0.6, 0.95]));
  if (d.ears === 'pointy') [-1, 1].forEach((s) => hp.push(P(taper([[s * 0.2, 0.28, 0.02], [s * 0.25, 0.48, 0.0], [s * 0.27, 0.62, 0.03]], [0.12, 0.07, 0.01], 10, 10), d.coat), P(taper([[s * 0.2, 0.32, -0.04], [s * 0.25, 0.5, -0.05]], [0.07, 0.01], 8, 8), 0xffb3c7)));
  else [-1, 1].forEach((s) => hp.push(P(taper([[s * 0.28, 0.2, 0.02], [s * 0.4, 0.06, 0.0], [s * 0.42, -0.14, -0.02]], [0.09, 0.13, 0.1], 12, 12), d.spots ? d.patch : d.patch, [0, 0, 0], [0, 0, 0], [1, 1, 0.55])));
  if (d.hat === 'fire') hp.push(P(dome(0.33), 0xe8352f, [0, 0.24, 0.02], [0, 0, 0], [1, 0.9, 1]), P(cyl(0.42, 0.44, 0.05, 24), 0xc62828, [0, 0.24, 0.06]), P(slab([[-0.09, 0], [0.09, 0], [0.11, 0.13], [0, 0.2], [-0.11, 0.13]], 0.04, 0.015), 0xffd23f, [0, 0.36, -0.3], [-0.35, 0, 0]));
  if (d.hat === 'ranger') hp.push(P(dome(0.27), 0x8a6a3a, [0, 0.27, 0.02]), P(cyl(0.48, 0.5, 0.04, 26), 0x7a5a2a, [0, 0.27, 0.02]), P(tor(0.27, 0.025, 6, 22), 0x3f8f4a, [0, 0.3, 0.02], [Math.PI / 2, 0, 0]));
  if (d.hat === 'aviator') hp.push(P(dome(0.36), 0x8a4fd9, [0, 0.12, 0.03], [0, 0, 0], [1, 1, 1]), P(tor(0.1, 0.025, 8, 16), 0x9fdcff, [-0.12, 0.3, -0.24], [0.4, 0, 0]), P(tor(0.1, 0.025, 8, 16), 0x9fdcff, [0.12, 0.3, -0.24], [0.4, 0, 0]), P(sph(0.08), 0xcbeeff, [-0.12, 0.3, -0.25], [0.4, 0, 0], [1, 1, 0.4]), P(sph(0.08), 0xcbeeff, [0.12, 0.3, -0.25], [0.4, 0, 0], [1, 1, 0.4]));
  if (d.hat === 'sailor') hp.push(P(cyl(0.22, 0.25, 0.14, 22), 0xffffff, [0, 0.38, 0.02]), P(cyl(0.26, 0.26, 0.04, 22), 0x2f78e0, [0, 0.33, 0.02]));
  if (d.hat === 'helmet') hp.push(P(dome(0.36), 0xe8352f, [0, 0.2, 0.03]), P(box(0.08, 0.06, 0.5, 0.03), 0xffd23f, [0, 0.52, 0.03]), P(sph(0.3), 0x9fdcff, [0, 0.16, -0.18], [0, 0, 0], [1.05, 0.35, 0.5]));
  u.head.add(part(hp));
  // patas curvinhas com almofadinhas
  u.legs = [[-0.2, -0.28], [0.2, -0.28], [-0.2, 0.36], [0.2, 0.36]].map(([x, z], i) => {
    const l = pivot(x, 0.5, z); const back = i > 1;
    l.add(part([P(taper([[0, 0.02, 0], [0, -0.2, back ? 0.04 : -0.02], [0, -0.4, 0]], [0.1, 0.085, 0.08], 10, 10), d.coat), P(sph(0.11), d.spots ? 0xffffff : d.belly, [0, -0.44, -0.04], [0, 0, 0], [1, 0.62, 1.3])]));
    u.body.add(l); return l;
  });
  u.tail = pivot(0, 0.78, 0.48); u.tail.add(part([P(taper([[0, 0, 0], [0, 0.18, 0.12], [0, 0.34, 0.1]], [0.07, 0.06, 0.03], 10, 10), d.coat)])); u.body.add(u.tail);
  u.baseY = 0;
  return g;
}

// =============================================================== gatinho
export function buildCat() {
  const g = new THREE.Group(), u = g.userData, c = 0xffa043, st = 0xd9711f, w = 0xfff0d6; u.body = pivot(0, 0, 0); g.add(u.body);
  u.body.add(part([
    P(lathe([[0.001, 0.0], [0.24, 0.04], [0.33, 0.2], [0.32, 0.42], [0.24, 0.6], [0.001, 0.66]]), c, [0, 0.0, 0.05]),
    P(sph(0.2), w, [0, 0.34, -0.17], [0, 0, 0], [1, 1.3, 0.55]),
    P(sph(0.11), w, [-0.15, 0.06, -0.2], [0, 0, 0], [1, 0.6, 1.3]), P(sph(0.11), w, [0.15, 0.06, -0.2], [0, 0, 0], [1, 0.6, 1.3]),
    P(tor(0.25, 0.035, 6, 18, Math.PI), st, [0, 0.5, 0.06], [0, Math.PI / 2, 0]), P(tor(0.28, 0.035, 6, 18, Math.PI), st, [0, 0.36, 0.08], [0, Math.PI / 2, 0]),
  ]));
  u.head = pivot(0, 0.8, -0.1); u.body.add(u.head);
  u.head.add(part([
    P(sph(0.29), c, [0, 0, 0], [0, 0, 0], [1.1, 0.95, 1]),
    P(sph(0.12), w, [-0.08, -0.1, -0.22], [0, 0, 0], [1, 0.8, 0.8]), P(sph(0.12), w, [0.08, -0.1, -0.22], [0, 0, 0], [1, 0.8, 0.8]),
    P(cone(0.12, 0.24, 12), c, [-0.18, 0.27, 0], [0, 0, 0.28]), P(cone(0.12, 0.24, 12), c, [0.18, 0.27, 0], [0, 0, -0.28]),
    P(cone(0.065, 0.15, 10), 0xffa0b4, [-0.18, 0.25, -0.05], [0, 0, 0.28]), P(cone(0.065, 0.15, 10), 0xffa0b4, [0.18, 0.25, -0.05], [0, 0, -0.28]),
    ...eyes(0, 0.04, -0.24, 0.06, 0.11, 0x3f9b5a),
    P(sph(0.035), 0xff7a9a, [0, -0.05, -0.31], [0, 0, 0], [1.3, 0.8, 0.8]),
    ...smile(-0.035, -0.12, -0.3, 0.035), ...smile(0.035, -0.12, -0.3, 0.035),
    P(cap(0.02, 0.1, 4, 8), st, [0, 0.2, -0.2], [0.4, 0, 0]), P(cap(0.018, 0.08, 4, 8), st, [-0.08, 0.19, -0.2], [0.4, 0, 0.3]), P(cap(0.018, 0.08, 4, 8), st, [0.08, 0.19, -0.2], [0.4, 0, -0.3]),
  ]));
  u.tail = pivot(0, 0.2, 0.32); u.tail.add(part([P(taper([[0, 0, 0], [0, 0.2, 0.25], [0, 0.55, 0.3], [0, 0.72, 0.15]], [0.06, 0.06, 0.055, 0.04], 16, 10), c)])); u.body.add(u.tail);
  return g;
}

// =============================================================== coelhinho
export function buildBunny() {
  const g = new THREE.Group(), u = g.userData, c = 0xf4f0ee; u.body = pivot(0, 0, 0); g.add(u.body);
  u.body.add(part([P(sph(0.3), c, [0, 0.3, 0.05], [0, 0, 0], [1, 1, 1.15]), P(sph(0.14), 0xffffff, [0, 0.3, 0.4]), P(sph(0.1), c, [-0.18, 0.06, -0.16], [0, 0, 0], [1, 0.6, 1.4]), P(sph(0.1), c, [0.18, 0.06, -0.16], [0, 0, 0], [1, 0.6, 1.4]), P(sph(0.12), c, [-0.2, 0.1, 0.25], [0, 0, 0], [0.8, 0.7, 1.5]), P(sph(0.12), c, [0.2, 0.1, 0.25], [0, 0, 0], [0.8, 0.7, 1.5])]));
  u.head = pivot(0, 0.62, -0.18); u.body.add(u.head);
  u.head.add(part([
    P(sph(0.25), c, [0, 0, 0], [0, 0, 0], [1.05, 0.95, 1]),
    P(taper([[-0.09, 0.18, 0.02], [-0.12, 0.42, 0.04], [-0.1, 0.62, 0.06]], [0.065, 0.075, 0.03], 12, 10), c), P(taper([[0.09, 0.18, 0.02], [0.12, 0.42, 0.04], [0.1, 0.62, 0.06]], [0.065, 0.075, 0.03], 12, 10), c),
    P(taper([[-0.1, 0.24, -0.02], [-0.12, 0.44, -0.01], [-0.1, 0.58, 0.02]], [0.03, 0.04, 0.01], 10, 8), 0xffb3c7), P(taper([[0.1, 0.24, -0.02], [0.12, 0.44, -0.01], [0.1, 0.58, 0.02]], [0.03, 0.04, 0.01], 10, 8), 0xffb3c7),
    ...eyes(0, 0.04, -0.2, 0.05, 0.09, 0x6a4a3a), P(sph(0.035), 0xff7a9a, [0, -0.05, -0.24], [0, 0, 0], [1.2, 0.8, 0.8]),
    P(sph(0.07), 0xffffff, [-0.04, -0.1, -0.21]), P(sph(0.07), 0xffffff, [0.04, -0.1, -0.21]), P(sph(0.06), 0xffc4d2, [-0.15, -0.05, -0.16], [0, 0, 0], [1, 0.7, 0.4]), P(sph(0.06), 0xffc4d2, [0.15, -0.05, -0.16], [0, 0, 0], [1, 0.7, 0.4]),
  ]));
  u.ears = [u.head];
  return g;
}

// =============================================================== dinossauros (leitura infantil: arredondados, olhos grandes, sem dentes pontudos)
const SK = { green: 0x6fd06a, teal: 0x34b89e, blue: 0x4aa3e8, yellow: 0xf0c94a, lime: 0xa6e04a, orange: 0xff9a3a };
/** pata grossa e curvinha com três unhas */
function dinoLeg(col, belly, len, r, bend = 0.1) {
  const p = [P(taper([[0, 0, 0], [0, -len * 0.5, -bend], [0, -len, 0]], [r, r * 0.86, r * 0.8], 12, 14), col), P(sph(r * 1.15), col, [0, -len, -r * 0.25], [0, 0, 0], [1, 0.62, 1.35])];
  [-0.5, 0, 0.5].forEach((k) => p.push(P(sph(r * 0.28), 0xfff3dc, [k * r * 0.9, -len - r * 0.2, -r * 1.35], [0, 0, 0], [1, 0.8, 1])));
  return part(p);
}
function legs4(u, parent, col, belly, pts, len = 0.9, r = 0.25) {
  u.legs = pts.map(([x, z], i) => { const l = pivot(x, len, z); l.add(dinoLeg(col, belly, len, r, i > 1 ? -0.12 : 0.1)); parent.add(l); return l; });
}
export function buildDino(kind = 'stego') {
  const g = new THREE.Group(), u = g.userData; u.body = pivot(0, 0, 0); g.add(u.body); u.kind = kind;
  if (kind === 'stego') {
    const c = SK.green, b = 0xeaf7c6, plate = 0xff8a1f;
    const bp = [P(taper([[0, 1.45, -1.05], [0, 1.75, -0.2], [0, 1.7, 0.6], [0, 1.45, 1.15]], [0.55, 0.95, 0.88, 0.55], 20, 18), c), P(sph(0.8), b, [0, 1.18, -0.05], [0, 0, 0], [0.95, 0.5, 1.6])];
    for (let i = 0; i < 7; i++) {
      const z = -0.95 + i * 0.34, k = Math.sin((i / 6) * Math.PI), s = 0.42 + k * 0.42, y = 2.3 + k * 0.38;
      bp.push(P(slab([[-0.5, 0], [0, 0.95], [0.5, 0], [0, -0.25]], 0.08, 0.05), i % 2 ? plate : 0xffa43a, [i % 2 ? 0.1 : -0.1, y - 0.2, z], [0, Math.PI / 2, i % 2 ? -0.12 : 0.12], [s, s, s]));
    }
    u.body.add(partB(bp, b));
    u.head = pivot(0, 1.42, -1.25); u.body.add(u.head);
    u.head.add(part([P(sph(0.46), c, [0, 0.05, -0.15], [0, 0, 0], [0.9, 0.85, 1.25]), P(sph(0.3), b, [0, -0.12, -0.55], [0, 0, 0], [1, 0.7, 0.95]), ...eyes(0, 0.2, -0.52, 0.09, 0.22, 0x5a3a1a, c), ...smile(0, -0.16, -0.78, 0.12), P(sph(0.03), 0x3a5a2a, [-0.08, 0.0, -0.82]), P(sph(0.03), 0x3a5a2a, [0.08, 0.0, -0.82]), P(sph(0.08), 0xff9aa8, [-0.28, -0.05, -0.62], [0, 0, 0], [1, 0.7, 0.4]), P(sph(0.08), 0xff9aa8, [0.28, -0.05, -0.62], [0, 0, 0], [1, 0.7, 0.4])]));
    u.tail = pivot(0, 1.4, 1.05); u.body.add(u.tail);
    const tp = [P(taper([[0, 0, 0], [0, -0.1, 0.8], [0, -0.25, 1.6], [0, -0.3, 2.3]], [0.5, 0.36, 0.22, 0.08], 20, 14), c)];
    [[0.18, 0.05, 1.9], [-0.18, 0.05, 1.9], [0.15, 0.0, 2.2], [-0.15, 0.0, 2.2]].forEach(([x, y, z]) => tp.push(P(cone(0.07, 0.4, 12), 0xfff3dc, [x, y, z], [0, 0, x > 0 ? -1.1 : 1.1])));
    u.tail.add(part(tp));
    legs4(u, u.body, c, b, [[-0.5, -0.75], [0.5, -0.75], [-0.5, 0.75], [0.5, 0.75]], 1.0, 0.27);
  } else if (kind === 'tricera') {
    const c = SK.blue, b = 0xe0f0ff, fr = 0xffc94a;
    u.body.add(partB([P(taper([[0, 1.25, -1.0], [0, 1.45, -0.2], [0, 1.4, 0.7], [0, 1.2, 1.3]], [0.62, 0.95, 0.9, 0.55], 20, 18), c), P(sph(0.78), b, [0, 0.95, 0.15], [0, 0, 0], [1.05, 0.55, 1.55])], b));
    u.head = pivot(0, 1.3, -1.25); u.body.add(u.head);
    const hp = [P(sph(0.56), c, [0, 0, -0.2], [0, 0, 0], [1, 0.95, 1.2]), P(sph(0.34), b, [0, -0.2, -0.72], [0, 0, 0], [1, 0.7, 0.9]),
      P(lathe([[0.0001, 0], [0.75, 0.0], [1.05, 0.05], [1.1, 0.12], [0.0001, 0.12]], 32), fr, [0, 0.35, 0.25], [-1.15, 0, 0]),
      P(cone(0.11, 0.75, 16), 0xfff3dc, [-0.33, 0.55, -0.62], [-1.0, 0, 0.12]), P(cone(0.11, 0.75, 16), 0xfff3dc, [0.33, 0.55, -0.62], [-1.0, 0, -0.12]), P(cone(0.09, 0.32, 14), 0xfff3dc, [0, 0.0, -0.98], [-1.2, 0, 0]),
      P(sph(0.16), 0xffa43a, [0, -0.28, -0.96], [0, 0, 0], [1.2, 0.7, 1]), ...eyes(0, 0.2, -0.62, 0.095, 0.27, 0x3a2a1a, c), ...smile(0, -0.38, -0.85, 0.12)];
    for (let i = 0; i < 7; i++) { const a = (i / 6) * Math.PI; hp.push(P(sph(0.09), 0xff8a1f, [Math.cos(a) * 0.82, 0.35 + Math.sin(a) * 0.82 * 0.6 + 0.2, 0.25 + Math.sin(a) * 0.82 * 0.75], [0, 0, 0], [1, 1, 0.4])); }
    u.head.add(part(hp));
    u.tail = pivot(0, 1.25, 1.2); u.body.add(u.tail); u.tail.add(part([P(taper([[0, 0, 0], [0, -0.15, 0.7], [0, -0.35, 1.4]], [0.45, 0.28, 0.06], 16, 14), c)]));
    legs4(u, u.body, c, b, [[-0.6, -0.65], [0.6, -0.65], [-0.6, 0.85], [0.6, 0.85]], 0.9, 0.3);
  } else if (kind === 'brachio') {
    const c = SK.yellow, b = 0xfff4c4;
    u.body.add(partB([P(taper([[0, 1.95, -0.7], [0, 2.2, 0.3], [0, 2.0, 1.4]], [0.85, 1.1, 0.75], 18, 18), c), P(sph(0.9), b, [0, 1.62, 0.35], [0, 0, 0], [1.05, 0.55, 1.55]), ...[0, 1, 2, 3].map((i) => P(sph(0.16), 0xe0a83a, [0.35 - (i % 2) * 0.7, 2.6 + (i > 1 ? -0.2 : 0), -0.2 + i * 0.4], [0, 0, 0], [1, 0.5, 1]))], b));
    u.neck = pivot(0, 2.4, -0.9); u.body.add(u.neck);
    u.neck.add(part([P(taper([[0, 0, 0], [0, 1.1, -0.45], [0, 2.3, -0.8], [0, 3.35, -0.75]], [0.55, 0.4, 0.33, 0.3], 22, 16), c)]));
    u.head = pivot(0, 3.55, -0.95); u.neck.add(u.head);
    u.head.add(part([P(sph(0.45), c, [0, 0, -0.1], [0, 0, 0], [0.95, 0.85, 1.25]), P(sph(0.26), b, [0, -0.12, -0.5], [0, 0, 0], [1, 0.7, 1]), ...eyes(0, 0.17, -0.42, 0.085, 0.22, 0x5a3a1a, c), ...smile(0, -0.17, -0.66, 0.1), P(sph(0.07), 0xff9aa8, [-0.26, -0.05, -0.45], [0, 0, 0], [1, 0.7, 0.4]), P(sph(0.07), 0xff9aa8, [0.26, -0.05, -0.45], [0, 0, 0], [1, 0.7, 0.4])]));
    u.tail = pivot(0, 1.95, 1.4); u.body.add(u.tail); u.tail.add(part([P(taper([[0, 0, 0], [0, -0.3, 1.1], [0, -0.75, 2.2], [0.2, -1.0, 3.0]], [0.6, 0.42, 0.22, 0.06], 20, 14), c)]));
    legs4(u, u.body, c, b, [[-0.65, -0.45], [0.65, -0.45], [-0.65, 1.2], [0.65, 1.2]], 1.55, 0.36);
  } else if (kind === 'trex') {
    const c = SK.teal, b = 0xdff7ef;
    u.body.add(partB([P(taper([[0, 1.55, 0.7], [0, 1.9, 0.1], [0, 2.35, -0.45]], [0.7, 0.95, 0.65], 18, 18), c), P(sph(0.7), b, [0, 1.75, -0.25], [0.5, 0, 0], [0.95, 0.85, 0.75]),
      P(taper([[-0.5, 1.85, -0.45], [-0.55, 1.6, -0.75], [-0.48, 1.5, -0.9]], [0.12, 0.1, 0.08], 10, 10), c), P(taper([[0.5, 1.85, -0.45], [0.55, 1.6, -0.75], [0.48, 1.5, -0.9]], [0.12, 0.1, 0.08], 10, 10), c)], b));
    for (let i = 0; i < 6; i++) u.body.add(part([P(slab([[-0.14, 0], [0, 0.3], [0.14, 0]], 0.06, 0.03), 0xff8a1f, [0, 2.95 - i * 0.2, -0.35 + i * 0.32], [0.2 + i * 0.15, Math.PI / 2, 0])]));
    u.head = pivot(0, 2.65, -0.85); u.body.add(u.head);
    u.head.add(part([P(sph(0.6), c, [0, 0.05, -0.15], [0, 0, 0], [1, 0.88, 1.2]), P(sph(0.44), c, [0, -0.15, -0.72], [0, 0, 0], [0.95, 0.72, 1.15]), P(sph(0.36), b, [0, -0.32, -0.65], [0, 0, 0], [0.95, 0.5, 1.2]),
      P(sph(0.06), 0x1b2a49, [-0.13, 0.02, -1.15]), P(sph(0.06), 0x1b2a49, [0.13, 0.02, -1.15]), ...smile(0, -0.3, -1.08, 0.2, true), P(cone(0.05, 0.1, 12), 0xffffff, [-0.12, -0.27, -1.1], [Math.PI, 0, 0]), P(cone(0.05, 0.1, 12), 0xffffff, [0.12, -0.27, -1.1], [Math.PI, 0, 0]),
      ...eyes(0, 0.3, -0.52, 0.11, 0.3, 0x5a3a1a, c), P(sph(0.1), 0xff9aa8, [-0.4, -0.12, -0.65], [0, 0, 0], [1, 0.7, 0.4]), P(sph(0.1), 0xff9aa8, [0.4, -0.12, -0.65], [0, 0, 0], [1, 0.7, 0.4])]));
    u.tail = pivot(0, 1.6, 0.8); u.body.add(u.tail); u.tail.add(part([P(taper([[0, 0, 0], [0, -0.1, 0.9], [0, -0.35, 1.8], [0, -0.45, 2.5]], [0.62, 0.42, 0.22, 0.06], 20, 14), c)]));
    legs4(u, u.body, c, b, [[-0.5, 0.35], [0.5, 0.35]], 1.3, 0.36);
  } else if (kind === 'baby') {
    const c = SK.lime, b = 0xf6ffd8;
    u.body.add(partB([P(sph(0.42), c, [0, 0.5, 0.1], [0, 0, 0], [1, 0.92, 1.18]), P(sph(0.3), b, [0, 0.4, -0.05], [0, 0, 0], [1, 0.75, 1.15]), P(slab([[-0.1, 0], [0, 0.22], [0.1, 0]], 0.05, 0.03), 0xff9a3a, [0, 0.88, 0.15], [0.2, Math.PI / 2, 0]), P(slab([[-0.08, 0], [0, 0.18], [0.08, 0]], 0.05, 0.03), 0xff9a3a, [0, 0.85, 0.42], [0.5, Math.PI / 2, 0])], b));
    u.head = pivot(0, 0.95, -0.36); u.body.add(u.head);
    u.head.add(part([P(sph(0.42), c, [0, 0, 0], [0, 0, 0], [1, 0.95, 1]), P(sph(0.22), b, [0, -0.12, -0.32], [0, 0, 0], [1, 0.72, 1]), ...eyes(0, 0.08, -0.3, 0.11, 0.17, 0x5a3a1a), ...smile(0, -0.19, -0.48, 0.07, true), P(sph(0.07), 0xff9aa8, [-0.27, -0.06, -0.3], [0, 0, 0], [1, 0.7, 0.4]), P(sph(0.07), 0xff9aa8, [0.27, -0.06, -0.3], [0, 0, 0], [1, 0.7, 0.4]),
      P(lathe([[0.32, 0], [0.36, 0.08], [0.3, 0.2], [0.0001, 0.26]], 20), 0xfff3dc, [0, 0.22, 0.04], [0.2, 0, 0]), P(cone(0.06, 0.12, 4), 0xfff3dc, [-0.2, 0.26, 0.04], [0, 0, 0.6]), P(cone(0.06, 0.12, 4), 0xfff3dc, [0.2, 0.26, 0.04], [0, 0, -0.6])]));
    u.tail = pivot(0, 0.5, 0.55); u.body.add(u.tail); u.tail.add(part([P(taper([[0, 0, 0], [0, -0.05, 0.3], [0, -0.15, 0.55]], [0.18, 0.11, 0.03], 12, 12), c)]));
    legs4(u, u.body, c, b, [[-0.2, -0.1], [0.2, -0.1], [-0.2, 0.4], [0.2, 0.4]], 0.32, 0.12);
  } else if (kind === 'ptero') {
    const c = 0xe0733a, m = 0xf2a35a;
    u.body.add(part([P(taper([[0, 0, -0.35], [0, 0.02, 0.1], [0, 0.05, 0.75]], [0.22, 0.3, 0.06], 14, 14), c)]));
    u.head = pivot(0, 0.15, -0.5); u.body.add(u.head);
    u.head.add(part([P(sph(0.24), c), P(taper([[0, -0.03, -0.15], [0, -0.06, -0.55], [0, -0.1, -0.85]], [0.11, 0.06, 0.01], 12, 10), 0xffc94a), P(taper([[0, 0.12, 0.05], [0, 0.32, 0.35], [0, 0.38, 0.55]], [0.06, 0.05, 0.01], 10, 8), 0xff4a4a), ...eyes(0, 0.08, -0.18, 0.06, 0.13, 0x3a2a1a)]));
    u.wings = [-1, 1].map((s) => {
      const w = pivot(s * 0.2, 0.08, 0);
      const wp = [[0, -0.3], [0.9, -0.1], [1.9, 0.35], [1.2, 0.1], [0.9, 0.35], [0.5, 0.1], [0, 0.3]].map(([x, y]) => [s * x, y]); if (s < 0) wp.reverse();
      w.add(part([P(slab(wp, 0.04, 0.02), m, [0, 0, 0], [Math.PI / 2, 0, 0]), P(taper([[0, 0, -0.25], [s * 0.9, 0.02, -0.12], [s * 1.9, 0.0, 0.33]], [0.06, 0.05, 0.02], 12, 8), c)], { outline: true }));
      u.body.add(w); return w;
    });
  }
  return g;
}

/** animação procedural (andar, respirar, abanar o rabo, bater asas); t em segundos, o.walk 0..1 */
export function animCreature(g, t, o = {}) {
  const u = g.userData, walk = o.walk ?? 0, ph = t * (o.rate ?? 8) + (o.off || 0);
  if (u.legs) u.legs.forEach((l, i) => { l.rotation.x = Math.sin(ph + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI * 0.5 : 0)) * 0.7 * walk; });
  if (u.tail) { u.tail.rotation.y = Math.sin(t * (o.wag ?? 5) + (o.off || 0)) * (o.wagAmp ?? 0.3); u.tail.rotation.x = Math.sin(t * 2.2 + (o.off || 0)) * 0.05; }
  if (u.head && !o.keepHead) { u.head.rotation.x = Math.sin(t * 2 + (o.off || 0)) * 0.05 + (o.headX || 0); u.head.rotation.z = (o.tilt || 0); }
  if (u.body) { u.body.position.y = Math.abs(Math.sin(ph)) * 0.08 * walk + (o.bob ? Math.sin(t * 3) * 0.02 : 0) + (o.lift || 0); u.body.scale.y = 1 + Math.sin(t * 2.6 + (o.off || 0)) * 0.012; }
  if (u.wings) u.wings.forEach((w, i) => { w.rotation.z = Math.sin(t * (o.flap ?? 7)) * 0.7 * (i ? -1 : 1); });
  if (u.neck) u.neck.rotation.x = Math.sin(t * 1.4) * 0.05;
}

// =============================================================== objetos das missões
export function buildCrates(n = 3) {
  const g = new THREE.Group(), p = [];
  const spots = [[-0.55, 0, 0], [0.55, 0, 0], [0, 0.95, 0], [-0.6, 0, 1.0], [0.55, 0, -1.0]].slice(0, n + 2);
  spots.forEach(([x, y, z], i) => {
    const r = [0, i * 0.3, 0], c = [0xd69a52, 0xc98a42, 0xe2a85c][i % 3];
    p.push(P(box(1.0, 0.95, 1.0, 0.1), c, [x, y + 0.48, z], r));
    [0.1, 0.86].forEach((yy) => p.push(P(box(1.05, 0.1, 1.05, 0.04), 0x9a6a30, [x, y + yy, z], r)));
    p.push(P(box(0.12, 0.8, 1.04, 0.04), 0x9a6a30, [x, y + 0.48, z], [0, i * 0.3, 0.75]));
  });
  g.add(part(p)); return g;
}
export function buildShelter() {
  const g = new THREE.Group(), p = [P(box(3.2, 0.2, 2.6, 0.08), 0xdfe6f1, [0, 0.1, 0]), P(slab([[-1.8, 0], [1.8, 0], [1.6, 0.35], [-1.6, 0.35]], 2.9, 0.06), 0x3ecb6b, [0, 2.3, 0])];
  [[-1.5, -1.2], [1.5, -1.2], [-1.5, 1.2], [1.5, 1.2]].forEach(([x, z]) => p.push(P(cyl(0.07, 0.07, 2.3, 12), 0x59616e, [x, 1.2, z])));
  p.push(P(box(2.8, 0.14, 0.7, 0.06), 0xc2864a, [0, 0.55, 0.9]), P(cyl(0.55, 0.55, 0.08, 24), 0xffffff, [0, 1.4, 1.25], [Math.PI / 2, 0, 0]), P(box(0.62, 0.18, 0.1, 0.04), 0x3ecb6b, [0, 1.4, 1.2]), P(box(0.18, 0.62, 0.1, 0.04), 0x3ecb6b, [0, 1.4, 1.2]));
  g.add(part(p)); return g;
}
export function buildEgg(scale = 1) {
  const g = new THREE.Group();
  const e = toMesh([P(lathe([[0.0001, 0], [0.2, 0.04], [0.27, 0.22], [0.24, 0.48], [0.13, 0.66], [0.0001, 0.7]], 24), 0xf6e6bb, [0, 0.03, 0]), P(sph(0.07), 0x6fcf6a, [0.12, 0.42, -0.2], [0, 0, 0], [1, 1, 0.5]), P(sph(0.06), 0x6fcf6a, [-0.1, 0.25, -0.22], [0, 0, 0], [1, 1, 0.5]), P(sph(0.055), 0x6fcf6a, [0.08, 0.16, -0.23], [0, 0, 0], [1, 1, 0.5]), P(sph(0.06), 0x6fcf6a, [-0.14, 0.5, -0.16], [0, 0, 0], [1, 1, 0.5])], { thin: true });
  g.add(e); g.scale.setScalar(scale); return g;
}
export function buildNest() {
  const g = new THREE.Group(), p = [P(tor(0.9, 0.24, 10, 26), 0x9a6a3a, [0, 0.25, 0], [Math.PI / 2, 0, 0]), P(cyl(0.85, 0.7, 0.2, 24), 0xe8c97a, [0, 0.18, 0]), P(tor(0.78, 0.12, 8, 24), 0xb98a52, [0, 0.42, 0], [Math.PI / 2, 0, 0])];
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; p.push(P(cyl(0.04, 0.04, 1.0, 6), 0x7a4e2a, [Math.cos(a) * 0.86, 0.44, Math.sin(a) * 0.86], [Math.PI / 2, 0, a + 1.2])); }
  g.add(part(p)); return g;
}
export function buildTent() {
  const g = new THREE.Group();
  g.add(part([P(cone(1.7, 2.1, 6), 0xff8a1f, [0, 1.05, 0], [0, Math.PI / 6, 0]), P(cone(0.75, 1.3, 6), 0x7a3b10, [0, 0.62, -1.18], [0, Math.PI / 6, 0], [0.8, 1, 0.35]), P(cyl(0.05, 0.05, 1.2, 8), 0x59616e, [0, 2.4, 0]), P(slab([[0, 0], [0.6, 0.2], [0, 0.4]], 0.03, 0.01), 0xe8352f, [0.02, 2.55, 0])]));
  return g;
}
export function buildGiftBox(col = 0xe8352f) {
  const g = new THREE.Group();
  g.add(toMesh([P(box(0.5, 0.42, 0.5, 0.08), col, [0, 0.21, 0]), P(box(0.56, 0.12, 0.56, 0.05), hex(col, 0.85), [0, 0.42, 0]), P(box(0.1, 0.45, 0.53, 0.03), 0xffd23f, [0, 0.21, 0]), P(box(0.53, 0.45, 0.1, 0.03), 0xffd23f, [0, 0.21, 0]), P(tor(0.1, 0.035, 8, 14), 0xffd23f, [-0.09, 0.55, 0], [0, 0, 0.3]), P(tor(0.1, 0.035, 8, 14), 0xffd23f, [0.09, 0.55, 0], [0, 0, -0.3])], { thin: true }));
  return g;
}
export function buildBoneProp(scale = 1) {
  const g = new THREE.Group();
  g.add(toMesh([P(cyl(0.07, 0.07, 0.5, 12), 0xfff3dc, [0, 0, 0], [0, 0, Math.PI / 2]), P(sph(0.12), 0xfff3dc, [-0.27, 0.06, 0]), P(sph(0.12), 0xfff3dc, [-0.27, -0.06, 0]), P(sph(0.12), 0xfff3dc, [0.27, 0.06, 0]), P(sph(0.12), 0xfff3dc, [0.27, -0.06, 0])], { thin: true }));
  g.scale.setScalar(scale); return g;
}
/** coração (projétil de carinho) */
export function buildHeart(scale = 1) {
  const g = new THREE.Group();
  const pts = []; for (let i = 0; i <= 24; i++) { const t = i / 24 * Math.PI * 2; pts.push([0.016 * 16 * Math.sin(t) ** 3, 0.016 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))]); }
  g.add(toMesh([P(slab(pts, 0.12, 0.06), 0xff4d7d)], { thin: true, material: glow }));
  g.scale.setScalar(scale); return g;
}
export function buildHeli() {
  const g = new THREE.Group(), u = g.userData;
  g.add(part([P(sph(0.9), 0x8a4fd9, [0, 0, 0], [0, 0, 0], [1, 0.9, 1.4]), P(sph(0.56), 0x9fdcff, [0, 0.15, -0.95], [0, 0, 0], [1, 0.9, 0.8]), P(taper([[0, 0.15, 0.9], [0, 0.25, 2.0], [0, 0.4, 3.0]], [0.36, 0.2, 0.12], 12, 12), 0x8a4fd9), P(slab([[0, 0], [0.5, 0], [0.7, 0.9], [0.3, 0.9]], 0.08, 0.03), 0xffd23f, [0, 0.35, 3.0], [0, Math.PI / 2, 0]), P(cyl(0.08, 0.08, 0.35, 10), 0x59616e, [0, 1.0, 0]), P(cap(0.06, 2.0, 4, 10), 0x59616e, [-0.65, -0.95, 0], [Math.PI / 2, 0, 0]), P(cap(0.06, 2.0, 4, 10), 0x59616e, [0.65, -0.95, 0], [Math.PI / 2, 0, 0]),
    ...[[-0.65, -0.5], [0.65, -0.5], [-0.65, 0.5], [0.65, 0.5]].map(([x, z]) => P(cyl(0.04, 0.04, 0.5, 8), 0x59616e, [x, -0.7, z])), P(box(0.6, 0.12, 0.05, 0.03), 0xffffff, [0, 0.0, -1.24])]));
  u.rotor = pivot(0, 1.25, 0); u.rotor.add(part([P(box(4.6, 0.06, 0.28, 0.03), 0xdfe6f1), P(box(0.28, 0.06, 4.6, 0.03), 0xdfe6f1), P(cyl(0.16, 0.16, 0.14, 14), 0x59616e)], { outline: false })); g.add(u.rotor);
  return g;
}
export function buildBasket() {
  const g = new THREE.Group();
  g.add(part([P(lathe([[0.42, -0.22], [0.5, 0.22], [0.46, 0.24], [0.38, -0.18], [0.0001, -0.18]], 24), 0xc2864a), P(tor(0.5, 0.05, 8, 24), 0x9a6a30, [0, 0.22, 0], [Math.PI / 2, 0, 0]), P(tor(0.46, 0.03, 6, 24), 0x9a6a30, [0, 0.0, 0], [Math.PI / 2, 0, 0]), P(cyl(0.025, 0.025, 1.6, 6), 0xdfe6f1, [0, 0.9, 0])]));
  return g;
}
/** folha grande (plataforma natural): formato de folha com nervura e caule */
export function buildLeaf(w = 2.2, len = 3.4, col = 0x3fcf5a) {
  const g = new THREE.Group(), pts = [];
  for (let i = 0; i <= 20; i++) { const t = i / 20, z = -len / 2 + t * len, x = Math.sin(t * Math.PI) ** 0.8 * w / 2; pts.push([x, z]); }
  for (let i = 19; i > 0; i--) { const t = i / 20, z = -len / 2 + t * len, x = Math.sin(t * Math.PI) ** 0.8 * w / 2; pts.push([-x, z]); }
  const p = [P(slab(pts, 0.1, 0.06), col, [0, -0.05, 0], [Math.PI / 2, 0, 0]), P(cap(0.04, len * 0.86, 4, 8), hex(col, 1.25), [0, 0.04, 0], [Math.PI / 2, 0, 0])];
  [-0.25, 0.1, 0.45].forEach((k) => [-1, 1].forEach((s) => p.push(P(cap(0.025, w * 0.3, 4, 8), hex(col, 1.2), [s * w * 0.16, 0.035, k * len * 0.6], [Math.PI / 2, 0, s * 0.9]))));
  p.push(P(taper([[0, -0.1, len * 0.35], [0.1, -1.5, len * 0.4], [0, -3.2, len * 0.2], [0, -5, 0]], [0.12, 0.14, 0.18, 0.22], 14, 10), 0x7a5a2a));
  g.add(part(p)); return g;
}
export function buildPlatform(w = 2.4, len = 3.4) {
  const g = new THREE.Group();
  const p = [P(box(w, 0.3, len, 0.12), 0x7b828c, [0, -0.15, 0]), P(box(w + 0.1, 0.08, len + 0.1, 0.04), 0xffd23f, [0, 0.0, 0])];
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => p.push(P(cyl(0.09, 0.09, 6, 12), 0x586380, [a * (w / 2 - 0.2), -3.1, b * (len / 2 - 0.2)])));
  for (let i = 0; i < 6; i++) p.push(P(box(0.3, 0.07, 0.25, 0.02), 0x2b3350, [-w / 2 + 0.2 + i * (w - 0.4) / 5, 0.045, -len / 2 + 0.2]));
  g.add(part(p)); return g;
}
/** jangada de madeira (fase da água) */
export function buildRaft(w = 2.0, len = 3.4) {
  const g = new THREE.Group(), p = [];
  for (let i = 0; i < 5; i++) p.push(P(cyl(0.22, 0.22, len, 14), i % 2 ? 0xc99a62 : 0xb98a52, [-w / 2 + 0.2 + i * (w - 0.4) / 4, -0.15, 0], [Math.PI / 2, 0, 0]));
  [-len * 0.35, len * 0.35].forEach((z) => p.push(P(box(w + 0.1, 0.08, 0.2, 0.04), 0x8a5a35, [0, 0.08, z])));
  g.add(part(p)); return g;
}
export function buildPad() {
  const g = new THREE.Group(), u = g.userData;
  u.top = pivot(0, 0.3, 0); u.top.add(part([P(cyl(0.9, 0.9, 0.16, 28), 0xff5d8f, [0, 0.1, 0]), P(tor(0.8, 0.08, 8, 28), 0xffd23f, [0, 0.19, 0], [Math.PI / 2, 0, 0]), P(sph(0.22), 0xffffff, [0, 0.22, 0], [0, 0, 0], [1, 0.3, 1])])); g.add(u.top);
  g.add(part([P(lathe([[0.82, 0], [0.86, 0.06], [0.64, 0.3], [0.0001, 0.3]], 28), 0x59616e, [0, 0, 0])]));
  return g;
}
export function buildGlider() {
  const g = new THREE.Group(), pts = [[-0.75, 0.0], [-0.3, 0.32], [0.3, 0.32], [0.75, 0.0], [0.4, 0.1], [0, 0.04], [-0.4, 0.1]];
  g.add(toMesh([P(slab(pts, 0.05, 0.02), 0x4db8ff, [0, 0, 0.1], [Math.PI / 2, 0, 0]), P(slab([[-0.4, 0.06], [0, 0.25], [0.4, 0.06], [0, 0.12]], 0.06, 0.02), 0xffd23f, [0, 0.04, 0.1], [Math.PI / 2, 0, 0]), P(cyl(0.03, 0.03, 0.6, 8), 0x59616e, [0, -0.25, 0.1])], { thin: true }));
  return g;
}
export function buildWing() {
  const g = new THREE.Group(), u = g.userData;
  u.l = pivot(-0.2, 0.15, 0.2); u.r = pivot(0.2, 0.15, 0.2);
  const wp = (s) => { const pts = [[0, -0.12], [0.5, -0.2], [0.95, 0.1], [0.7, 0.22], [0.3, 0.2], [0, 0.12]].map(([x, y]) => [s * x, y]); if (s < 0) pts.reverse(); return part([P(slab(pts, 0.05, 0.02), 0xffffff, [0, 0, 0], [Math.PI / 2, 0, 0]), P(slab(pts.map(([x, y]) => [x * 0.6, y * 0.6 + 0.02]), 0.06, 0.02), 0x9fdcff, [0, 0.02, 0], [Math.PI / 2, 0, 0])]); };
  u.l.add(wp(-1)); u.r.add(wp(1)); g.add(u.l, u.r); return g;
}
export function buildFruit(scale = 1) {
  const g = new THREE.Group();
  g.add(toMesh([P(sph(0.2), 0xff5a4a, [0, 0.2, 0], [0, 0, 0], [1.05, 0.95, 1.05]), P(slab([[0, 0], [0.12, 0.05], [0.16, 0.12], [0.05, 0.08]], 0.02, 0.01), 0x3ecb6b, [0.02, 0.4, 0], [0, 0, 0]), P(cyl(0.015, 0.015, 0.1, 6), 0x7a4e2a, [0, 0.4, 0]), P(sph(0.05), 0xffffff, [-0.08, 0.28, -0.14], [0, 0, 0], [1, 1, 0.5])], { thin: true }));
  g.scale.setScalar(scale); return g;
}
export function buildSplash() { return new THREE.Group(); }

// =============================================================== fase 6: água
export function buildLifeRing(scale = 1) {
  const g = new THREE.Group(), p = [];
  for (let i = 0; i < 8; i++) p.push(P(tor(0.4, 0.13, 10, 8, Math.PI / 4 + 0.01), i % 2 ? 0xffffff : 0xe8352f, [0, 0, 0], [Math.PI / 2, 0, i * Math.PI / 4]));
  g.add(part(p)); g.scale.setScalar(scale); return g;
}
export function buildWaterPatch(r = 2.6) {
  const g = new THREE.Group();
  const w = new THREE.Mesh(new THREE.CircleGeometry(r, 36), new THREE.MeshToonMaterial({ color: 0x2f9be0, transparent: true, opacity: 0.92 })); w.rotation.x = -Math.PI / 2; w.position.y = -0.38; g.add(w);
  const foam = new THREE.Mesh(new THREE.RingGeometry(r * 0.97, r * 1.05, 36), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 })); foam.rotation.x = -Math.PI / 2; foam.position.y = -0.36; g.add(foam);
  return g;
}
export function buildRescueBoat(col = 0xffffff, stripe = 0xe8352f) {
  const g = new THREE.Group();
  g.add(part([P(lathe([[0.0001, -0.55], [0.6, -0.45], [0.95, -0.1], [1.0, 0.25], [0.0001, 0.25]], 28), col, [0, 0, 0], [0, 0, 0], [1.05, 1, 2.3]), P(tor(0.98, 0.08, 8, 30), stripe, [0, 0.1, 0], [Math.PI / 2, 0, 0], [1.05, 2.3, 1]), P(box(1.2, 0.9, 1.3, 0.16), 0xffffff, [0, 0.7, 0.5]), P(box(1.0, 0.36, 0.06, 0.06), 0x9fdcff, [0, 0.82, -0.17]), P(box(1.25, 0.12, 1.35, 0.05), stripe, [0, 1.18, 0.5]), P(cyl(0.05, 0.05, 1.2, 10), 0xdfe6f1, [0, 1.8, 0.8]), P(box(1.6, 0.12, 4.0, 0.05), 0xd9b47a, [0, 0.22, 0])]));
  return g;
}
export function buildFloatCrate() {
  const g = new THREE.Group();
  g.add(part([P(box(1.3, 0.55, 1.1, 0.1), 0xd69a52, [0, 0.27, 0]), P(box(1.35, 0.1, 1.15, 0.04), 0x9a6a30, [0, 0.52, 0]), P(box(1.35, 0.1, 1.15, 0.04), 0x9a6a30, [0, 0.06, 0])]));
  return g;
}
// =============================================================== fase 7: vulcão
export function buildLavaFlow() {
  const g = new THREE.Group();
  g.add(part([P(sph(0.7), 0x4a3a3a, [-1.6, 0.25, 0.4], [0, 0, 0], [1.3, 0.6, 1]), P(sph(0.5), 0x5a4646, [1.5, 0.2, -0.6], [0, 0, 0], [1.2, 0.6, 1]), P(sph(0.6), 0x4a3a3a, [1.2, 0.25, 1.3], [0, 0, 0], [1, 0.6, 1.2])]));
  const lava = new THREE.Mesh(new THREE.CircleGeometry(1.9, 32), new THREE.MeshBasicMaterial({ color: 0xff6a1a })); lava.rotation.x = -Math.PI / 2; lava.position.y = 0.05; lava.scale.set(1, 1.4, 1); g.add(lava);
  const glowM = new THREE.Mesh(new THREE.CircleGeometry(1.1, 28), new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.8 })); glowM.rotation.x = -Math.PI / 2; glowM.position.y = 0.07; g.add(glowM);
  g.userData = { lava, glow: glowM };
  return g;
}
export function buildLavaIsland() {
  const g = new THREE.Group();
  const lava = new THREE.Mesh(new THREE.CircleGeometry(3.4, 36), new THREE.MeshBasicMaterial({ color: 0xff6a1a })); lava.rotation.x = -Math.PI / 2; lava.position.y = 0.04; g.add(lava);
  g.add(part([P(lathe([[1.0, -0.2], [1.05, 0.2], [0.85, 0.5], [0.0001, 0.55]], 24), 0x5a4646, [0, 0, 0])]));
  const stones = [];
  for (let i = 0; i < 4; i++) { const s = part([P(cyl(0.42, 0.48, 0.4, 18), 0x6a5450, [0, 0, 0])]); s.position.set(0, -0.6, -1.4 - i * 0.7); g.add(s); stones.push(s); }
  g.userData = { stones };
  return g;
}
export function buildHut() {
  const g = new THREE.Group();
  const p = [P(cyl(1.6, 1.7, 2.0, 24), 0xd9b47a, [0, 1.0, 0]), P(cone(2.5, 2.0, 24), 0xc29a4a, [0, 2.95, 0]), P(tor(2.2, 0.12, 8, 28), 0xa8803a, [0, 2.05, 0], [Math.PI / 2, 0, 0]), P(cone(0.5, 0.6, 14), 0x9a6a3a, [0, 4.1, 0]), P(box(0.9, 1.4, 0.14, 0.08), 0x6a4426, [0, 0.72, -1.6]), P(box(0.6, 0.5, 0.1, 0.06), 0x9fdcff, [1.0, 1.3, -1.25], [0, -0.6, 0]), P(cyl(1.8, 1.8, 0.1, 28), 0x8a7060, [0, 0.05, 0])];
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; p.push(P(cyl(0.06, 0.06, 2.0, 8), 0xb08a52, [Math.cos(a) * 1.66, 1.0, Math.sin(a) * 1.66])); }
  g.add(part(p)); return g;
}
export { SK };
