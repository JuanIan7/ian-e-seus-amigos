// Bichinhos, dinossauros e objetos de resgate em 3D (modelados por código, desenho original).
// Todos "olham" para -Z (como a criança). userData guarda as articulações para a animação procedural.
import { THREE, P, sph, box, cyl, cone, cap, tor, dome, toMesh, toon, glow, hex, pivot, mergeParts } from './kit.js';

const part = (parts, o) => toMesh(parts, { thin: true, ...o });
const eyes = (x, y, z, r = 0.07, spread = 0.13) => [P(sph(r * 1.5, 8, 6), 0xffffff, [-spread + x, y, z]), P(sph(r * 1.5, 8, 6), 0xffffff, [spread + x, y, z]), P(sph(r, 7, 5), 0x1b2a49, [-spread + x, y, z - r * 0.9]), P(sph(r, 7, 5), 0x1b2a49, [spread + x, y, z - r * 0.9]), P(sph(r * 0.35, 5, 4), 0xffffff, [-spread + x + 0.02, y + 0.03, z - r * 1.6]), P(sph(r * 0.35, 5, 4), 0xffffff, [spread + x + 0.02, y + 0.03, z - r * 1.6])];

// =============================================================== cães da equipe (originais: nomes, cores e funções próprias)
export const DOGS3 = {
  bolota: { name: 'Bolota', coat: 0xd9944a, patch: 0x7a4a22, belly: 0xfff3dc, gear: 0xff8a1f, hat: 'fire', ears: 'floppy' },
  trovao: { name: 'Trovão', coat: 0x4a3a2a, patch: 0xc98b3f, belly: 0xc98b3f, gear: 0x3f8f4a, hat: 'ranger', ears: 'pointy' },
  pipoca: { name: 'Pipoca', coat: 0xffffff, patch: 0x222222, belly: 0xffffff, gear: 0x8a4fd9, hat: 'aviator', ears: 'floppy', spots: true },
};
export function buildDog(key = 'bolota') {
  const d = DOGS3[key] || DOGS3.bolota, g = new THREE.Group(), u = g.userData;
  u.body = pivot(0, 0, 0); g.add(u.body);
  const torso = [P(sph(0.42, 12, 9), d.coat, [0, 0.62, 0.05], [0, 0, 0], [0.85, 0.82, 1.35]), P(sph(0.3, 10, 7), d.belly, [0, 0.46, -0.05], [0, 0, 0], [0.9, 0.7, 1.4]), P(box(0.62, 0.1, 0.62, 0.04), d.gear, [0, 0.93, 0.0])];
  if (d.spots) for (let i = 0; i < 6; i++) torso.push(P(sph(0.09, 6, 5), d.patch, [Math.sin(i * 2.1) * 0.3, 0.7 + Math.cos(i * 1.7) * 0.12, 0.35 - i * 0.12], [0, 0, 0], [1, 0.6, 1]));
  else torso.push(P(sph(0.3, 9, 7), d.patch, [0.1, 0.78, 0.25], [0, 0, 0], [1.1, 0.5, 1.2]));
  u.body.add(part(torso));
  u.head = pivot(0, 0.86, -0.55); u.body.add(u.head);
  const hp = [P(sph(0.34, 12, 9), d.coat, [0, 0, 0]), P(sph(0.2, 9, 7), d.belly, [0, -0.08, -0.26], [0, 0, 0], [0.95, 0.8, 1.1]), P(sph(0.07, 7, 5), 0x1b2a49, [0, -0.02, -0.46]), ...eyes(0, 0.07, -0.28, 0.06, 0.13), P(box(0.12, 0.04, 0.02, 0.01), 0x1b2a49, [0, -0.2, -0.42]), P(sph(0.09, 6, 5), 0xff7a9a, [0, -0.2, -0.33], [0, 0, 0], [0.9, 0.5, 1])];
  if (d.ears === 'pointy') [-1, 1].forEach((s) => hp.push(P(cone(0.12, 0.34, 6), d.coat, [s * 0.18, 0.34, 0.02], [0, 0, -s * 0.15])));
  else [-1, 1].forEach((s) => hp.push(P(sph(0.16, 8, 6), d.spots ? d.patch : d.patch, [s * 0.3, 0.1, 0.05], [0, 0, s * 0.35], [0.5, 1.2, 0.8])));
  if (d.hat === 'fire') hp.push(P(dome(0.33, 0, Math.PI / 2, 12, 6), 0xe8352f, [0, 0.22, 0]), P(cyl(0.38, 0.38, 0.05, 14), 0xe8352f, [0, 0.22, 0]), P(box(0.12, 0.1, 0.03, 0.01), 0xffd23f, [0, 0.38, -0.3]));
  if (d.hat === 'ranger') hp.push(P(dome(0.28, 0, Math.PI / 2, 12, 6), 0x7a5a2a, [0, 0.24, 0]), P(cyl(0.46, 0.46, 0.04, 14), 0x7a5a2a, [0, 0.24, 0]));
  if (d.hat === 'aviator') hp.push(P(dome(0.35, 0, Math.PI / 2, 12, 6), 0x8a4fd9, [0, 0.14, 0.02]), P(tor(0.12, 0.03, 6, 12), 0x9fdcff, [-0.13, 0.2, -0.3]), P(tor(0.12, 0.03, 6, 12), 0x9fdcff, [0.13, 0.2, -0.3]));
  u.head.add(part(hp));
  u.legs = [[-0.22, -0.34], [0.22, -0.34], [-0.22, 0.42], [0.22, 0.42]].map(([x, z]) => { const l = pivot(x, 0.45, z); l.add(part([P(cyl(0.09, 0.08, 0.42, 8), d.coat, [0, -0.2, 0]), P(sph(0.115, 8, 6), d.belly, [0, -0.42, -0.03], [0, 0, 0], [1, 0.7, 1.2])])); u.body.add(l); return l; });
  u.tail = pivot(0, 0.78, 0.55); u.tail.add(part([P(cap(0.07, 0.3, 4, 8), d.coat, [0, 0.14, 0.1], [0.8, 0, 0])])); u.body.add(u.tail);
  u.baseY = 0;
  return g;
}

// =============================================================== gatinho
export function buildCat() {
  const g = new THREE.Group(), u = g.userData; u.body = pivot(0, 0, 0); g.add(u.body);
  u.body.add(part([P(sph(0.34, 10, 8), 0xff9d3a, [0, 0.34, 0.05], [0, 0, 0], [0.95, 1, 1.05]), P(sph(0.22, 9, 7), 0xfff0d6, [0, 0.28, -0.14], [0, 0, 0], [0.9, 1, 0.6]), P(sph(0.11, 6, 5), 0xff9d3a, [-0.18, 0.06, -0.2], [0, 0, 0], [1, 0.6, 1.3]), P(sph(0.11, 6, 5), 0xff9d3a, [0.18, 0.06, -0.2], [0, 0, 0], [1, 0.6, 1.3])]));
  u.head = pivot(0, 0.78, -0.12); u.body.add(u.head);
  u.head.add(part([P(sph(0.27, 12, 9), 0xff9d3a), P(cone(0.1, 0.22, 4), 0xff9d3a, [-0.17, 0.25, 0], [0, 0, 0.2]), P(cone(0.1, 0.22, 4), 0xff9d3a, [0.17, 0.25, 0], [0, 0, -0.2]), P(cone(0.05, 0.13, 4), 0xff9fb2, [-0.17, 0.25, -0.03], [0, 0, 0.2]), P(cone(0.05, 0.13, 4), 0xff9fb2, [0.17, 0.25, -0.03], [0, 0, -0.2]), ...eyes(0, 0.04, -0.22, 0.06, 0.1), P(sph(0.04, 6, 5), 0xff7a9a, [0, -0.04, -0.27]), P(sph(0.09, 7, 5), 0xfff0d6, [0, -0.1, -0.2], [0, 0, 0], [1.3, 0.8, 0.8]), P(box(0.34, 0.03, 0.02, 0.01), 0xc4680f, [0, 0.12, -0.25]), P(box(0.2, 0.03, 0.02, 0.01), 0xc4680f, [0, 0.19, -0.23])]));
  u.tail = pivot(0, 0.2, 0.38); u.tail.add(part([P(tor(0.22, 0.06, 6, 12, Math.PI * 1.2), 0xff9d3a, [0, 0.22, 0.02], [0, 0, 0])])); u.body.add(u.tail);
  return g;
}

// =============================================================== coelhinho
export function buildBunny() {
  const g = new THREE.Group(), u = g.userData; u.body = pivot(0, 0, 0); g.add(u.body);
  u.body.add(part([P(sph(0.3, 10, 8), 0xf3f0ee, [0, 0.3, 0.05], [0, 0, 0], [1, 1, 1.15]), P(sph(0.13, 8, 6), 0xffffff, [0, 0.28, 0.4]), P(sph(0.1, 6, 5), 0xf3f0ee, [-0.18, 0.06, -0.16], [0, 0, 0], [1, 0.6, 1.4]), P(sph(0.1, 6, 5), 0xf3f0ee, [0.18, 0.06, -0.16], [0, 0, 0], [1, 0.6, 1.4])]));
  u.head = pivot(0, 0.62, -0.18); u.body.add(u.head);
  u.head.add(part([P(sph(0.24, 12, 9), 0xf3f0ee), P(cap(0.07, 0.34, 4, 8), 0xf3f0ee, [-0.1, 0.38, 0.0], [0, 0, 0.12]), P(cap(0.07, 0.34, 4, 8), 0xf3f0ee, [0.1, 0.38, 0.0], [0, 0, -0.12]), P(cap(0.035, 0.26, 4, 8), 0xffb3c7, [-0.1, 0.38, -0.05], [0, 0, 0.12]), P(cap(0.035, 0.26, 4, 8), 0xffb3c7, [0.1, 0.38, -0.05], [0, 0, -0.12]), ...eyes(0, 0.04, -0.19, 0.05, 0.09), P(sph(0.04, 6, 5), 0xff7a9a, [0, -0.04, -0.23])]));
  u.ears = [u.head];
  return g;
}

// =============================================================== dinossauros (leitura infantil: arredondados, olhos grandes, sem dentes pontudos)
const SK = { green: 0x6fcf6a, teal: 0x3fb8a0, blue: 0x4aa3e8, yellow: 0xe8c94a, lime: 0xa6e04a, orange: 0xff9a3a };
function legs4(u, parent, col, belly, pts, len = 0.9, r = 0.25) {
  u.legs = pts.map(([x, z]) => { const l = pivot(x, len, z); l.add(part([P(cyl(r, r * 0.9, len, 10), col, [0, -len / 2, 0]), P(sph(r * 1.2, 8, 6), belly, [0, -len, -r * 0.4], [0, 0, 0], [1, 0.6, 1.4])])); parent.add(l); return l; });
}
export function buildDino(kind = 'stego') {
  const g = new THREE.Group(), u = g.userData; u.body = pivot(0, 0, 0); g.add(u.body); u.kind = kind;
  if (kind === 'stego') {
    const c = SK.green, plate = 0xff8a1f;
    const bp = [P(sph(1.0, 14, 10), c, [0, 1.55, 0], [0, 0, 0], [1.5, 0.95, 0.95]), P(sph(0.8, 12, 8), 0xe8f5c8, [0, 1.15, -0.05], [0, 0, 0], [1.5, 0.6, 0.9])];
    for (let i = 0; i < 7; i++) { const x = -1.3 + i * 0.45, s = 0.5 + Math.sin((i / 6) * Math.PI) * 0.4; bp.push(P(cone(0.32 * s + 0.05, 0.95 * s, 4), plate, [0, 2.4 + Math.sin((i / 6) * Math.PI) * 0.1 + s * 0.2 - 0.25, x], [0, Math.PI / 4, 0], [0.35, 1, 1])); }
    u.body.add(part(bp));
    u.head = pivot(0, 1.5, -1.5); u.body.add(u.head);
    u.head.add(part([P(sph(0.5, 12, 9), c, [0, 0, 0], [0, 0, 0], [0.9, 0.9, 1.3]), P(sph(0.3, 8, 6), 0xe8f5c8, [0, -0.15, -0.55], [0, 0, 0], [1, 0.7, 1]), ...eyes(0, 0.18, -0.52, 0.09, 0.25), P(box(0.3, 0.04, 0.03, 0.01), 0x1b2a49, [0, -0.2, -0.82])]));
    u.tail = pivot(0, 1.4, 1.2); u.body.add(u.tail);
    const tp = [P(cone(0.55, 2.6, 10), c, [0, 0, 1.2], [Math.PI / 2, 0, 0])]; for (let i = 0; i < 4; i++) tp.push(P(cone(0.12, 0.5, 5), 0xe8f5c8, [i % 2 ? 0.12 : -0.12, 0.3, 1.2 + i * 0.5], [0.3, 0, 0]));
    u.tail.add(part(tp));
    legs4(u, u.body, c, 0xe8f5c8, [[-0.55, -0.85], [0.55, -0.85], [-0.55, 0.85], [0.55, 0.85]], 0.95, 0.27);
  } else if (kind === 'tricera') {
    const c = SK.blue;
    u.body.add(part([P(sph(1.0, 14, 10), c, [0, 1.3, 0.2], [0, 0, 0], [1.2, 0.95, 1.45]), P(sph(0.8, 12, 8), 0xdff0ff, [0, 0.95, 0.2], [0, 0, 0], [1.2, 0.6, 1.4])]));
    u.head = pivot(0, 1.35, -1.55); u.body.add(u.head);
    u.head.add(part([P(sph(0.6, 12, 9), c, [0, 0, 0], [0, 0, 0], [1, 0.95, 1.25]), P(cyl(1.0, 1.0, 0.14, 18), 0xffc94a, [0, 0.25, 0.45], [-0.7, 0, 0]), P(cone(0.12, 0.7, 8), 0xfff3dc, [-0.38, 0.55, -0.65], [-0.9, 0, 0]), P(cone(0.12, 0.7, 8), 0xfff3dc, [0.38, 0.55, -0.65], [-0.9, 0, 0]), P(cone(0.1, 0.4, 8), 0xfff3dc, [0, -0.05, -0.85], [-1.5, 0, 0]), P(sph(0.25, 8, 6), 0xffa43a, [0, -0.2, -0.75], [0, 0, 0], [1.2, 0.8, 1]), ...eyes(0, 0.22, -0.5, 0.09, 0.3)]));
    u.tail = pivot(0, 1.3, 1.5); u.body.add(u.tail); u.tail.add(part([P(cone(0.45, 1.6, 10), c, [0, 0, 0.7], [Math.PI / 2, 0, 0])]));
    legs4(u, u.body, c, 0xdff0ff, [[-0.65, -0.75], [0.65, -0.75], [-0.65, 1.0], [0.65, 1.0]], 0.9, 0.3);
  } else if (kind === 'brachio') {
    const c = SK.yellow;
    u.body.add(part([P(sph(1.1, 14, 10), c, [0, 2.0, 0.4], [0, 0, 0], [1.1, 0.95, 1.5]), P(sph(0.9, 12, 8), 0xfff4c4, [0, 1.6, 0.4], [0, 0, 0], [1.1, 0.6, 1.4])]));
    u.neck = pivot(0, 2.6, -1.0); u.body.add(u.neck);
    u.neck.add(part([P(cap(0.45, 3.4, 6, 12), c, [0, 1.7, -0.5], [-0.28, 0, 0])]));
    u.head = pivot(0, 3.95, -1.25); u.neck.add(u.head);
    u.head.add(part([P(sph(0.5, 12, 9), c, [0, 0, 0], [0, 0, 0], [0.9, 0.9, 1.2]), P(sph(0.28, 8, 6), 0xfff4c4, [0, -0.12, -0.5], [0, 0, 0], [1, 0.7, 1]), ...eyes(0, 0.18, -0.45, 0.09, 0.24)]));
    u.tail = pivot(0, 2.0, 1.7); u.body.add(u.tail); u.tail.add(part([P(cone(0.6, 3.0, 10), c, [0, -0.1, 1.5], [Math.PI / 2 + 0.1, 0, 0])]));
    legs4(u, u.body, c, 0xfff4c4, [[-0.7, -0.6], [0.7, -0.6], [-0.7, 1.4], [0.7, 1.4]], 1.5, 0.38);
  } else if (kind === 'trex') {
    const c = SK.teal;
    u.body.add(part([P(sph(0.95, 14, 10), c, [0, 1.9, 0.3], [0.2, 0, 0], [0.95, 1.1, 1.3]), P(sph(0.7, 12, 8), 0xdff7ef, [0, 1.6, 0.0], [0.2, 0, 0], [0.9, 0.8, 1.1]), P(cyl(0.15, 0.1, 0.5, 6), c, [-0.55, 1.5, -0.5], [0.7, 0, 0]), P(cyl(0.15, 0.1, 0.5, 6), c, [0.55, 1.5, -0.5], [0.7, 0, 0])]));
    for (let i = 0; i < 5; i++) u.body.add(part([P(cone(0.14, 0.4, 4), 0xff8a1f, [0, 2.9 - i * 0.18, 0.1 + i * 0.35], [0.2, Math.PI / 4, 0])]));
    u.head = pivot(0, 2.6, -0.9); u.body.add(u.head);
    u.head.add(part([P(sph(0.62, 12, 9), c, [0, 0, 0], [0, 0, 0], [1, 0.9, 1.3]), P(sph(0.42, 10, 8), c, [0, -0.15, -0.6], [0, 0, 0], [0.95, 0.75, 1.2]), P(sph(0.1, 6, 5), 0x1b2a49, [-0.14, 0.0, -1.05]), P(sph(0.1, 6, 5), 0x1b2a49, [0.14, 0.0, -1.05]), P(box(0.7, 0.05, 0.03, 0.01), 0x1b2a49, [0, -0.38, -0.95]), ...eyes(0, 0.28, -0.5, 0.11, 0.32), P(box(0.07, 0.08, 0.04, 0.01), 0xffffff, [-0.18, -0.35, -1.0]), P(box(0.07, 0.08, 0.04, 0.01), 0xffffff, [0.18, -0.35, -1.0])]));
    u.tail = pivot(0, 1.7, 1.0); u.body.add(u.tail); u.tail.add(part([P(cone(0.55, 2.6, 10), c, [0, 0, 1.2], [Math.PI / 2 - 0.1, 0, 0])]));
    legs4(u, u.body, c, 0xdff7ef, [[-0.55, 0.2], [0.55, 0.2]], 1.25, 0.34);
  } else if (kind === 'baby') {
    const c = SK.lime;
    u.body.add(part([P(sph(0.42, 12, 9), c, [0, 0.5, 0.1], [0, 0, 0], [1, 0.9, 1.2]), P(sph(0.3, 9, 7), 0xf6ffd8, [0, 0.38, 0.0], [0, 0, 0], [1, 0.7, 1.2]), P(cone(0.1, 0.25, 4), 0xff9a3a, [0, 0.95, 0.2], [0.3, Math.PI / 4, 0]), P(cone(0.09, 0.2, 4), 0xff9a3a, [0, 0.9, 0.45], [0.5, Math.PI / 4, 0])]));
    u.head = pivot(0, 0.95, -0.38); u.body.add(u.head);
    u.head.add(part([P(sph(0.42, 12, 9), c, [0, 0, 0], [0, 0, 0], [1, 0.95, 1]), P(sph(0.2, 8, 6), 0xf6ffd8, [0, -0.1, -0.34], [0, 0, 0], [1, 0.7, 1]), ...eyes(0, 0.06, -0.3, 0.11, 0.17), P(box(0.18, 0.03, 0.02, 0.01), 0x1b2a49, [0, -0.2, -0.5]), P(dome(0.3, 0, 1.5, 10, 6), 0xfff3dc, [0, 0.25, 0.05], [0.2, 0, 0], [1, 0.8, 1])]));
    u.tail = pivot(0, 0.5, 0.6); u.body.add(u.tail); u.tail.add(part([P(cone(0.2, 0.7, 8), c, [0, 0, 0.3], [Math.PI / 2, 0, 0])]));
    legs4(u, u.body, c, 0xf6ffd8, [[-0.2, -0.1], [0.2, -0.1], [-0.2, 0.4], [0.2, 0.4]], 0.32, 0.12);
  } else if (kind === 'ptero') {
    const c = 0xe0733a;
    u.body.add(part([P(sph(0.35, 10, 8), c, [0, 0, 0], [0, 0, 0], [0.9, 0.8, 1.5]), P(cone(0.18, 0.7, 6), c, [0, 0.1, 0.8], [Math.PI / 2, 0, 0])]));
    u.head = pivot(0, 0.15, -0.55); u.body.add(u.head);
    u.head.add(part([P(sph(0.25, 10, 8), c), P(cone(0.1, 0.8, 6), 0xffc94a, [0, -0.02, -0.5], [-Math.PI / 2, 0, 0]), P(cone(0.1, 0.5, 4), 0xff4a4a, [0, 0.2, 0.2], [0.9, 0, 0]), ...eyes(0, 0.08, -0.2, 0.06, 0.14)]));
    u.wings = [-1, 1].map((s) => { const w = pivot(s * 0.25, 0.1, 0); w.add(part([P(box(1.9, 0.05, 0.9, 0.02), 0xf2a35a, [s * 0.95, 0, 0.1], [0, s * -0.2, 0])], { outline: true })); u.body.add(w); return w; });
  }
  return g;
}

/** animação procedural (andar, respirar, abanar o rabo, bater asas); t em segundos, o.walk 0..1 */
export function animCreature(g, t, o = {}) {
  const u = g.userData, walk = o.walk ?? 0, ph = t * (o.rate ?? 8) + (o.off || 0);
  if (u.legs) u.legs.forEach((l, i) => { l.rotation.x = Math.sin(ph + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI * 0.5 : 0)) * 0.7 * walk; });
  if (u.tail) { u.tail.rotation.y = Math.sin(t * (o.wag ?? 5) + (o.off || 0)) * (o.wagAmp ?? 0.3); }
  if (u.head && !o.keepHead) { u.head.rotation.x = Math.sin(t * 2 + (o.off || 0)) * 0.05 + (o.headX || 0); u.head.rotation.z = (o.tilt || 0); }
  if (u.body) { u.body.position.y = Math.abs(Math.sin(ph)) * 0.08 * walk + (o.bob ? Math.sin(t * 3) * 0.02 : 0) + (o.lift || 0); }
  if (u.wings) u.wings.forEach((w, i) => { w.rotation.z = Math.sin(t * (o.flap ?? 7)) * 0.7 * (i ? -1 : 1); });
  if (u.neck) u.neck.rotation.x = Math.sin(t * 1.4) * 0.05;
}

// =============================================================== objetos das missões
export function buildCrates(n = 3) {
  const g = new THREE.Group(), p = [];
  const spots = [[-0.55, 0, 0], [0.55, 0, 0], [0, 0.95, 0], [-0.6, 0, 1.0], [0.55, 0, -1.0]].slice(0, n + 2);
  spots.forEach(([x, y, z], i) => p.push(P(box(1.0, 0.95, 1.0, 0.07), [0xd69a52, 0xc98a42, 0xe2a85c][i % 3], [x, y + 0.48, z], [0, i * 0.3, 0]), P(box(1.05, 0.1, 1.05, 0.03), 0x9a6a30, [x, y + 0.1, z], [0, i * 0.3, 0]), P(box(1.05, 0.1, 1.05, 0.03), 0x9a6a30, [x, y + 0.86, z], [0, i * 0.3, 0])));
  g.add(part(p)); return g;
}
export function buildShelter() {
  const g = new THREE.Group();
  g.add(part([P(box(3.2, 0.2, 2.6, 0.05), 0xdfe6f1, [0, 0.1, 0]), P(box(3.4, 0.22, 2.8, 0.06), 0x3ecb6b, [0, 2.4, 0]), P(box(0.14, 2.3, 0.14, 0.02), 0x59616e, [-1.5, 1.2, -1.2]), P(box(0.14, 2.3, 0.14, 0.02), 0x59616e, [1.5, 1.2, -1.2]), P(box(0.14, 2.3, 0.14, 0.02), 0x59616e, [-1.5, 1.2, 1.2]), P(box(0.14, 2.3, 0.14, 0.02), 0x59616e, [1.5, 1.2, 1.2]), P(box(2.8, 0.14, 0.7, 0.04), 0xc2864a, [0, 0.55, 0.9]), P(box(1.1, 1.1, 0.1, 0.05), 0xffffff, [0, 1.4, 1.25]), P(box(0.7, 0.2, 0.12, 0.03), 0x3ecb6b, [0, 1.4, 1.28]), P(box(0.2, 0.7, 0.12, 0.03), 0x3ecb6b, [0, 1.4, 1.28])]));
  return g;
}
export function buildEgg(scale = 1) {
  const g = new THREE.Group();
  const e = toMesh([P(sph(0.3, 12, 9), 0xf3e2b5, [0, 0.38, 0], [0, 0, 0], [0.82, 1.12, 0.82]), P(sph(0.07, 6, 5), 0x6fcf6a, [0.12, 0.5, -0.2]), P(sph(0.06, 6, 5), 0x6fcf6a, [-0.1, 0.32, -0.22]), P(sph(0.055, 6, 5), 0x6fcf6a, [0.08, 0.2, -0.24]), P(sph(0.06, 6, 5), 0x6fcf6a, [-0.14, 0.52, -0.16])], { thin: true });
  g.add(e); g.scale.setScalar(scale); return g;
}
export function buildNest() {
  const g = new THREE.Group(), p = [P(tor(0.9, 0.22, 8, 22), 0x9a6a3a, [0, 0.25, 0], [Math.PI / 2, 0, 0]), P(cyl(0.85, 0.7, 0.2, 18), 0xe8c97a, [0, 0.18, 0]), P(tor(0.78, 0.12, 6, 18), 0xb98a52, [0, 0.4, 0], [Math.PI / 2, 0, 0])];
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; p.push(P(cyl(0.05, 0.05, 1.0, 5), 0x7a4e2a, [Math.cos(a) * 0.82, 0.42, Math.sin(a) * 0.82], [Math.PI / 2, 0, a + 1.2])); }
  g.add(part(p)); return g;
}
export function buildTent() {
  const g = new THREE.Group();
  g.add(part([P(cone(1.7, 2.1, 4), 0xff8a1f, [0, 1.05, 0], [0, Math.PI / 4, 0]), P(cone(0.7, 1.2, 4), 0x7a3b10, [0, 0.6, -1.2], [0, Math.PI / 4, 0], [0.8, 1, 0.3]), P(cyl(0.05, 0.05, 1.2, 6), 0x59616e, [0, 2.4, 0]), P(box(0.6, 0.4, 0.04, 0.01), 0xe8352f, [0.3, 2.65, 0])]));
  return g;
}
export function buildGiftBox(col = 0xe8352f) {
  const g = new THREE.Group();
  g.add(toMesh([P(box(0.5, 0.42, 0.5, 0.06), col, [0, 0.21, 0]), P(box(0.54, 0.1, 0.54, 0.03), hex(col, 0.85), [0, 0.42, 0]), P(box(0.1, 0.44, 0.52, 0.02), 0xffd23f, [0, 0.21, 0]), P(box(0.52, 0.44, 0.1, 0.02), 0xffd23f, [0, 0.21, 0]), P(tor(0.1, 0.035, 5, 10), 0xffd23f, [-0.09, 0.55, 0], [0, 0, 0.3]), P(tor(0.1, 0.035, 5, 10), 0xffd23f, [0.09, 0.55, 0], [0, 0, -0.3])], { thin: true }));
  return g;
}
export function buildBoneProp(scale = 1) {
  const g = new THREE.Group();
  g.add(toMesh([P(cyl(0.07, 0.07, 0.5, 8), 0xfff3dc, [0, 0, 0], [0, 0, Math.PI / 2]), P(sph(0.12, 8, 6), 0xfff3dc, [-0.27, 0.06, 0]), P(sph(0.12, 8, 6), 0xfff3dc, [-0.27, -0.06, 0]), P(sph(0.12, 8, 6), 0xfff3dc, [0.27, 0.06, 0]), P(sph(0.12, 8, 6), 0xfff3dc, [0.27, -0.06, 0])], { thin: true }));
  g.scale.setScalar(scale); return g;
}
export function buildHeli() {
  const g = new THREE.Group(), u = g.userData;
  g.add(part([P(sph(0.9, 12, 9), 0x8a4fd9, [0, 0, 0], [0, 0, 0], [1, 0.9, 1.4]), P(sph(0.55, 10, 8), 0x9fdcff, [0, 0.15, -0.95], [0, 0, 0], [1, 0.9, 0.8]), P(cone(0.28, 2.4, 8), 0x8a4fd9, [0, 0.15, 1.9], [Math.PI / 2, 0, 0]), P(box(0.1, 0.9, 0.5, 0.03), 0xffd23f, [0, 0.5, 3.0]), P(cyl(0.08, 0.08, 0.35, 6), 0x59616e, [0, 1.0, 0]), P(box(0.12, 0.1, 2.0, 0.02), 0x59616e, [-0.65, -0.95, 0]), P(box(0.12, 0.1, 2.0, 0.02), 0x59616e, [0.65, -0.95, 0]), P(cyl(0.04, 0.04, 0.5, 5), 0x59616e, [-0.65, -0.7, -0.5]), P(cyl(0.04, 0.04, 0.5, 5), 0x59616e, [0.65, -0.7, -0.5]), P(cyl(0.04, 0.04, 0.5, 5), 0x59616e, [-0.65, -0.7, 0.5]), P(cyl(0.04, 0.04, 0.5, 5), 0x59616e, [0.65, -0.7, 0.5]), P(box(0.5, 0.4, 0.04, 0.01), 0xffd23f, [0.9, 0.0, 0.0])]));
  u.rotor = pivot(0, 1.25, 0); u.rotor.add(part([P(box(4.6, 0.06, 0.28, 0.02), 0xdfe6f1), P(box(0.28, 0.06, 4.6, 0.02), 0xdfe6f1)], { outline: false })); g.add(u.rotor);
  return g;
}
export function buildBasket() {
  const g = new THREE.Group();
  g.add(part([P(cyl(0.5, 0.42, 0.45, 12), 0xc2864a, [0, 0, 0]), P(tor(0.5, 0.05, 6, 14), 0x9a6a30, [0, 0.22, 0], [Math.PI / 2, 0, 0]), P(cyl(0.025, 0.025, 1.6, 5), 0xdfe6f1, [0, 0.9, 0])]));
  return g;
}
export function buildLeaf(w = 2.2, len = 3.4, col = 0x3fcf5a) {
  const g = new THREE.Group();
  g.add(part([P(box(w, 0.16, len, 0.07), col, [0, -0.08, 0]), P(box(0.12, 0.05, len * 0.94, 0.02), hex(col, 1.25), [0, 0.02, 0]), P(box(0.35, 0.05, 0.12, 0.02), hex(col, 1.2), [0.5, 0.02, -0.5], [0, 0.6, 0]), P(box(0.35, 0.05, 0.12, 0.02), hex(col, 1.2), [-0.5, 0.02, 0.5], [0, -0.6, 0]), P(cyl(0.12, 0.2, 5, 8), 0x7a5a2a, [0, -2.6, len * 0.35])]));
  return g;
}
export function buildPlatform(w = 2.4, len = 3.4, theme = 'altura') {
  const g = new THREE.Group();
  g.add(part([P(box(w, 0.28, len, 0.06), 0x7b828c, [0, -0.14, 0]), P(box(w + 0.1, 0.06, len + 0.1, 0.02), 0xffd23f, [0, 0.0, 0], [0, 0, 0], [1, 1, 1]), P(box(0.14, 6, 0.14, 0.02), 0x586380, [-w / 2 + 0.2, -3.1, -len / 2 + 0.2]), P(box(0.14, 6, 0.14, 0.02), 0x586380, [w / 2 - 0.2, -3.1, -len / 2 + 0.2]), P(box(0.14, 6, 0.14, 0.02), 0x586380, [-w / 2 + 0.2, -3.1, len / 2 - 0.2]), P(box(0.14, 6, 0.14, 0.02), 0x586380, [w / 2 - 0.2, -3.1, len / 2 - 0.2])]));
  const stripes = []; for (let i = 0; i < 6; i++) stripes.push(P(box(0.3, 0.07, 0.25, 0.01), 0x2b3350, [-w / 2 + 0.2 + i * (w - 0.4) / 5, 0.04, -len / 2 + 0.2]));
  g.add(part(stripes, { outline: false }));
  return g;
}
export function buildPad() {
  const g = new THREE.Group(), u = g.userData;
  u.top = pivot(0, 0.3, 0); u.top.add(part([P(cyl(0.9, 0.9, 0.16, 18), 0xff5d8f, [0, 0.1, 0]), P(tor(0.78, 0.07, 6, 18), 0xffd23f, [0, 0.19, 0], [Math.PI / 2, 0, 0]), P(sph(0.2, 8, 6), 0xffffff, [0, 0.22, 0], [0, 0, 0], [1, 0.3, 1])])); g.add(u.top);
  g.add(part([P(cyl(0.62, 0.8, 0.3, 14), 0x59616e, [0, 0.15, 0])]));
  return g;
}
export function buildGlider() {
  const g = new THREE.Group();
  g.add(toMesh([P(box(1.4, 0.06, 0.7, 0.02), 0x4db8ff, [0, 0, 0], [0, 0, 0]), P(box(0.9, 0.06, 0.5, 0.02), 0xffd23f, [0, 0.04, 0]), P(cyl(0.04, 0.04, 0.6, 5), 0x59616e, [0, -0.25, 0.1])], { thin: true }));
  return g;
}
export function buildWing() {
  const g = new THREE.Group(), u = g.userData;
  u.l = pivot(-0.2, 0.15, 0.2); u.r = pivot(0.2, 0.15, 0.2);
  const wp = (s) => part([P(box(0.9, 0.05, 0.6, 0.02), 0x4db8ff, [s * 0.45, 0, 0], [0, 0, s * 0.15]), P(box(0.5, 0.06, 0.4, 0.02), 0xffd23f, [s * 0.4, 0.02, 0.0])]);
  u.l.add(wp(-1)); u.r.add(wp(1)); g.add(u.l, u.r); return g;
}
export function buildFruit(scale = 1) {
  const g = new THREE.Group();
  g.add(toMesh([P(sph(0.2, 10, 8), 0xff5a4a, [0, 0.2, 0]), P(sph(0.06, 6, 5), 0x3ecb6b, [0.05, 0.42, 0], [0, 0, 0], [1.6, 0.5, 1]), P(cyl(0.015, 0.015, 0.1, 4), 0x7a4e2a, [0, 0.4, 0])], { thin: true }));
  g.scale.setScalar(scale); return g;
}
export function buildSplash() { return new THREE.Group(); }
export { SK };
