// Objetos 3D do jogo: obstáculos, estrelas, equipamentos, chamas, alvos de missão e cenário de cada tema.
import { THREE, P, sph, box, cyl, cone, cap, tor, dome, toMesh, toon, glow, hex, mergeParts } from './kit.js';
import { buildBoneProp, buildEgg, buildGlider, buildWing, buildFruit } from './creatures.js';

const bx = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const group = (...kids) => { const g = new THREE.Group(); kids.forEach((k) => k && g.add(k)); return g; };
const WALLS = [0xffd66b, 0xff9fb2, 0x86dcff, 0xb4f08a, 0xffb36b, 0xcdb2ff];
const ROOFS = [0xe8352f, 0x2f78e0, 0xff8a1f, 0x8a4fd9, 0x1fa8a0];

// ------------------------------------------------------------------ obstáculos (origem no chão, centro da faixa)
export const OBSTACLES = {
  cone: { w: 0.8, h: 0.8, d: 0.8 },
  barrier: { w: 1.8, h: 0.8, d: 0.4 },
  crate: { w: 0.95, h: 0.9, d: 0.95 },
  hydrant: { w: 0.6, h: 0.85, d: 0.6 },
  bench: { w: 1.6, h: 0.75, d: 0.6 },
  bush: { w: 1.2, h: 0.85, d: 1.0 },
  log: { w: 1.9, h: 0.7, d: 0.8 },
  rock: { w: 1.3, h: 0.85, d: 1.0 },
  mushroom: { w: 1.0, h: 0.95, d: 1.0 },
  ac: { w: 1.3, h: 0.85, d: 0.9 },
  pipe: { w: 1.9, h: 0.65, d: 0.7 },
  bone: { w: 1.6, h: 0.6, d: 0.7 },
  wall: { w: 2.0, h: 2.7, d: 0.5 },
  ptero: { w: 1.5, h: 2.0, d: 1.0 },          // muro alto: exige pulo duplo
};

export function buildObstacle(kind) {
  const d = OBSTACLES[kind];
  let parts = [];
  switch (kind) {
    case 'cone':
      parts = [P(box(0.8, 0.09, 0.8, 0.04), 0x2b3350, [0, 0.045, 0]), P(cone(0.3, 0.74, 14), 0xff7a1a, [0, 0.45, 0]), P(cyl(0.2, 0.235, 0.12, 14), 0xffffff, [0, 0.42, 0]), P(cyl(0.125, 0.15, 0.1, 14), 0xffffff, [0, 0.62, 0]), P(sph(0.045, 8, 6), 0xff7a1a, [0, 0.82, 0])];
      break;
    case 'barrier':
      [-0.78, 0.78].forEach((x) => parts.push(P(box(0.1, 0.8, 0.36, 0.03), 0x59616e, [x, 0.4, 0])));
      for (let i = 0; i < 6; i++) { parts.push(P(box(0.3, 0.2, 0.1, 0.02), i % 2 ? 0xffffff : 0xe8352f, [-0.75 + i * 0.3, 0.68, 0]), P(box(0.3, 0.2, 0.1, 0.02), i % 2 ? 0xe8352f : 0xffffff, [-0.75 + i * 0.3, 0.46, 0])); }
      parts.push(P(sph(0.07, 8, 6), 0xffc92b, [0.78, 0.84, 0]));
      break;
    case 'crate':
      parts = [P(box(0.95, 0.9, 0.95, 0.07), 0xd69a52, [0, 0.45, 0]), P(box(1.0, 0.1, 1.0, 0.03), 0x9a6a30, [0, 0.1, 0]), P(box(1.0, 0.1, 1.0, 0.03), 0x9a6a30, [0, 0.8, 0]), P(box(0.1, 0.9, 1.0, 0.03), 0x9a6a30, [-0.4, 0.45, 0]), P(box(0.1, 0.9, 1.0, 0.03), 0x9a6a30, [0.4, 0.45, 0]), P(box(0.1, 0.9, 1.0, 0.03), 0x9a6a30, [0, 0.45, 0], [0, 0, 0.0])];
      break;
    case 'hydrant':
      parts = [P(cyl(0.22, 0.26, 0.6, 14), 0xe8352f, [0, 0.35, 0]), P(dome(0.23, 0, Math.PI / 2, 14, 8), 0xe8352f, [0, 0.65, 0]), P(sph(0.05, 8, 6), 0xffd23f, [0, 0.9, 0]), P(cyl(0.3, 0.3, 0.1, 14), 0xb5231e, [0, 0.07, 0]), P(cyl(0.09, 0.09, 0.5, 10), 0xffd23f, [0, 0.45, 0], [0, 0, Math.PI / 2]), P(sph(0.1, 8, 6), 0xffd23f, [0.27, 0.45, 0]), P(sph(0.1, 8, 6), 0xffd23f, [-0.27, 0.45, 0])];
      break;
    case 'bench':
      parts = [P(box(1.6, 0.1, 0.5, 0.04), 0xc2864a, [0, 0.42, 0]), P(box(1.6, 0.4, 0.08, 0.03), 0xc2864a, [0, 0.68, 0.22]), P(box(0.1, 0.42, 0.45, 0.02), 0x3b4558, [-0.7, 0.21, 0]), P(box(0.1, 0.42, 0.45, 0.02), 0x3b4558, [0.7, 0.21, 0])];
      break;
    case 'bush':
      parts = [P(sph(0.5, 10, 8), 0x2fc55a, [-0.3, 0.42, 0]), P(sph(0.58, 10, 8), 0x37d664, [0.1, 0.5, 0.05]), P(sph(0.46, 10, 8), 0x2fc55a, [0.45, 0.4, -0.05]), P(sph(0.07, 6, 5), 0xff5d8f, [0.0, 0.88, -0.35]), P(sph(0.07, 6, 5), 0xffd23f, [0.4, 0.78, -0.35]), P(sph(0.07, 6, 5), 0xff5d8f, [-0.4, 0.8, -0.3])];
      break;
    case 'log':
      parts = [P(cyl(0.34, 0.34, 1.9, 14), 0x9a6a3a, [0, 0.34, 0], [0, 0, Math.PI / 2]), P(cyl(0.345, 0.345, 0.04, 14), 0xe9c58f, [0.95, 0.34, 0], [0, 0, Math.PI / 2]), P(cyl(0.345, 0.345, 0.04, 14), 0xe9c58f, [-0.95, 0.34, 0], [0, 0, Math.PI / 2]), P(cyl(0.2, 0.2, 0.05, 12), 0xc7955a, [0.96, 0.34, 0], [0, 0, Math.PI / 2]), P(sph(0.12, 8, 6), 0x59c24a, [0.3, 0.72, 0], [0, 0, 0], [1.6, 0.5, 1])];
      break;
    case 'rock':
      parts = [P(sph(0.62, 8, 6), 0x9aa3b5, [0, 0.38, 0], [0, 0.4, 0], [1.1, 0.8, 0.9]), P(sph(0.4, 8, 6), 0xb2bacb, [0.5, 0.26, 0.15], [0, 0.2, 0], [1, 0.8, 0.9]), P(sph(0.28, 7, 5), 0x59c24a, [-0.15, 0.78, 0], [0, 0, 0], [1.4, 0.5, 1.2])];
      break;
    case 'mushroom':
      parts = [P(cyl(0.17, 0.22, 0.5, 12), 0xfff3dc, [0, 0.25, 0]), P(dome(0.56, 0, 1.6, 16, 9), 0xe8352f, [0, 0.45, 0], [0, 0, 0], [1, 0.9, 1]), P(sph(0.09, 6, 5), 0xffffff, [0.2, 0.9, -0.2]), P(sph(0.1, 6, 5), 0xffffff, [-0.22, 0.85, 0.15]), P(sph(0.07, 6, 5), 0xffffff, [0.1, 0.95, 0.25]), P(sph(0.08, 6, 5), 0xffffff, [-0.05, 0.98, -0.3])];
      break;
    case 'ac':
      parts = [P(box(1.3, 0.85, 0.9, 0.08), 0xdfe6f1, [0, 0.43, 0]), P(cyl(0.3, 0.3, 0.04, 16), 0x59616e, [0, 0.87, 0]), P(box(1.1, 0.06, 0.04, 0.01), 0x8b94a6, [0, 0.4, -0.46]), P(box(1.1, 0.06, 0.04, 0.01), 0x8b94a6, [0, 0.28, -0.46]), P(box(1.1, 0.06, 0.04, 0.01), 0x8b94a6, [0, 0.52, -0.46])];
      break;
    case 'pipe':
      parts = [P(cyl(0.3, 0.3, 1.9, 14), 0x4db8ff, [0, 0.32, 0], [0, 0, Math.PI / 2]), P(cyl(0.34, 0.34, 0.12, 14), 0x2f78e0, [-0.7, 0.32, 0], [0, 0, Math.PI / 2]), P(cyl(0.34, 0.34, 0.12, 14), 0x2f78e0, [0.7, 0.32, 0], [0, 0, Math.PI / 2]), P(box(0.12, 0.3, 0.5, 0.03), 0x59616e, [-0.7, 0.15, 0]), P(box(0.12, 0.3, 0.5, 0.03), 0x59616e, [0.7, 0.15, 0])];
      break;
    case 'bone':
      parts = [P(cyl(0.14, 0.14, 1.2, 10), 0xfff3dc, [0, 0.3, 0], [0, 0, Math.PI / 2])];
      [[-0.62, 0.12], [-0.62, -0.12], [0.62, 0.12], [0.62, -0.12]].forEach(([x, z]) => parts.push(P(sph(0.22, 8, 6), 0xfff3dc, [x, 0.3, z])));
      parts.push(P(sph(0.34, 8, 6), 0xf5e8c8, [0.0, 0.2, 0.2], [0, 0, 0], [3.0, 0.7, 0.5]));
      break;
    case 'wall':
      parts = [P(box(2.0, 2.7, 0.5, 0.08), 0xe8d9c0, [0, 1.35, 0]), P(box(2.1, 0.2, 0.6, 0.05), 0xc9b08a, [0, 2.7, 0]), P(box(1.8, 0.18, 0.54, 0.02), 0xffc92b, [0, 0.4, 0]), P(box(1.8, 0.18, 0.54, 0.02), 0x2b3350, [0, 0.58, 0]), P(box(1.8, 0.18, 0.54, 0.02), 0xffc92b, [0, 0.76, 0])];
      for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) parts.push(P(box(0.28, 0.14, 0.02, 0.01), 0xc9b08a, [-0.7 + i * 0.35 + (j % 2) * 0.1, 1.2 + j * 0.45, -0.26]));
      break;
    default: break;
  }
  const g = toMesh(parts, { thin: true });
  g.userData = { kind, ...d };
  return g;
}

// ------------------------------------------------------------------ estrela colecionável
let starGeoCache = null;
function starGeo() {
  if (starGeoCache) return starGeoCache;
  const s = new THREE.Shape(); const R = 0.34, r = 0.16;
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r : R; i ? s.lineTo(Math.cos(a) * rr, -Math.sin(a) * rr) : s.moveTo(Math.cos(a) * rr, -Math.sin(a) * rr); }
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 2 });
  g.translate(0, 0, -0.05); starGeoCache = g; return g;
}
export function buildStar() {
  const m = toMesh([P(starGeo(), 0xffd62e)], { thin: true, material: glow });
  const shine = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 5), new THREE.MeshBasicMaterial({ color: 0xffffff })); shine.position.set(-0.12, 0.12, -0.12); m.add(shine);
  m.userData.spin = true;
  return m;
}

// ------------------------------------------------------------------ chamas (fogo cartunesco e simpático)
export function buildFlame() {
  const g = new THREE.Group();
  const outer = mergeParts([P(cone(0.34, 0.95, 10), 0xff6a1a, [0, 0.47, 0]), P(sph(0.3, 10, 8), 0xff6a1a, [0, 0.2, 0], [0, 0, 0], [1, 0.8, 1])]);
  const mid = mergeParts([P(cone(0.24, 0.78, 10), 0xff9d1a, [0, 0.4, 0]), P(sph(0.22, 10, 8), 0xff9d1a, [0, 0.16, 0.02], [0, 0, 0], [1, 0.8, 1])]);
  const inner = mergeParts([P(cone(0.14, 0.52, 10), 0xffe14a, [0, 0.28, 0.03]), P(sph(0.13, 8, 6), 0xffe14a, [0, 0.1, 0.04])]);
  [outer, mid, inner].forEach((geo) => { const m = new THREE.Mesh(geo, glow); g.add(m); });
  // olhinhos para o fogo parecer travesso, não assustador
  const eyes = mergeParts([P(sph(0.045, 6, 5), 0xffffff, [-0.09, 0.2, -0.28]), P(sph(0.045, 6, 5), 0xffffff, [0.09, 0.2, -0.28]), P(sph(0.022, 6, 5), 0x222222, [-0.09, 0.2, -0.32]), P(sph(0.022, 6, 5), 0x222222, [0.09, 0.2, -0.32])]);
  g.add(new THREE.Mesh(eyes, glow));
  g.userData.parts = g.children.slice(0, 3);
  return g;
}

// ------------------------------------------------------------------ equipamentos
export function buildHosePickup() {
  const g = new THREE.Group();
  g.add(toMesh([P(tor(0.26, 0.075, 8, 18), 0xe8352f), P(tor(0.16, 0.075, 8, 16), 0xe8352f), P(box(0.13, 0.13, 0.2, 0.04), 0xffd23f, [0.26, -0.2, 0], [0, 0, 0.3]), P(cyl(0.05, 0.05, 0.2, 8), 0x59616e, [0.3, -0.36, 0], [0, 0, 0.3])], { thin: true }));
  const halo = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.62, 28), new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.8, side: THREE.DoubleSide })); g.add(halo); g.userData.halo = halo;
  return g;
}
export function buildPickup(kind) {
  if (kind === 'hose') return buildHosePickup();
  const g = new THREE.Group();
  let m = null;
  if (kind === 'bone') { m = buildBoneProp(2.4); }
  else if (kind === 'egg') { m = buildEgg(1.6); m.position.y = -0.35; }
  else if (kind === 'glider') { m = buildGlider(); m.scale.setScalar(1.5); }
  else if (kind === 'flight') { m = buildWing(); m.scale.setScalar(1.3); }
  else if (kind === 'truck') { m = buildFireTruck(); m.scale.setScalar(0.17); m.rotation.y = Math.PI * 0.8; }
  else m = toMesh([P(sph(0.34, 14, 10), 0xffd23f)], { thin: true });
  g.add(m);
  const halo = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.62, 28), new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.8, side: THREE.DoubleSide })); g.add(halo); g.userData.halo = halo;
  return g;
}

// ------------------------------------------------------------------ alvos de missão (fase 1)
export function buildBin() {
  const g = new THREE.Group();
  g.add(toMesh([P(cyl(0.55, 0.45, 1.15, 16), 0x2f9bff, [0, 0.58, 0]), P(cyl(0.6, 0.6, 0.12, 16), 0x1f78d6, [0, 1.18, 0]), P(cyl(0.58, 0.58, 0.06, 16), 0x8bc7ff, [0, 0.6, 0]), P(cyl(0.12, 0.12, 0.05, 10), 0xffffff, [0, 1.26, 0]), P(sph(0.3, 8, 6), 0x59616e, [0.4, 1.2, 0.1], [0, 0, 0], [1.2, 0.7, 1]), P(sph(0.26, 8, 6), 0x8b94a6, [-0.3, 1.18, -0.05], [0, 0, 0], [1.2, 0.7, 1])], { thin: true }));
  return g;
}
export function buildHouse(wall = 0xffd66b, roof = 0xe8352f) {
  const g = new THREE.Group();
  const p = [P(box(4.4, 2.6, 3.6, 0.12), wall, [0, 1.3, 0]), P(box(4.7, 0.18, 3.9, 0.05), 0xd9c7a0, [0, 0.09, 0])];
  p.push(P(cone(3.3, 1.9, 4), roof, [0, 3.55, 0], [0, Math.PI / 4, 0], [1.0, 1, 0.82]));
  p.push(P(box(0.55, 1.3, 0.55, 0.05), 0xc2573a, [1.4, 3.7, 0.4]), P(box(0.7, 0.12, 0.7, 0.03), 0x8a3a24, [1.4, 4.4, 0.4]));
  p.push(P(box(0.85, 1.5, 0.12, 0.04), 0x8a5a35, [0, 0.8, -1.82]), P(sph(0.06, 6, 5), 0xffd23f, [0.25, 0.8, -1.9]));
  [-1.4, 1.4].forEach((x) => p.push(P(box(0.9, 0.9, 0.1, 0.04), 0xcdeeff, [x, 1.45, -1.82]), P(box(1.05, 0.08, 0.16, 0.02), 0xffffff, [x, 0.95, -1.84]), P(box(0.05, 0.9, 0.12, 0.01), 0xffffff, [x, 1.45, -1.84]), P(box(0.9, 0.05, 0.12, 0.01), 0xffffff, [x, 1.45, -1.84])));
  g.add(toMesh(p, { thin: true }));
  return g;
}
export function buildTower(floors = 4, wall = 0xb9c6dd) {
  const g = new THREE.Group(); const h = floors * 1.9;
  const p = [P(box(5.2, h, 3.6, 0.12), wall, [0, h / 2, 0]), P(box(5.5, 0.35, 3.9, 0.05), 0x7b8cae, [0, h + 0.17, 0]), P(box(5.5, 0.4, 3.9, 0.05), 0x7b8cae, [0, 0.2, 0])];
  for (let f = 0; f < floors; f++) for (let i = 0; i < 3; i++) {
    p.push(P(box(1.1, 1.0, 0.12, 0.04), 0xcdeeff, [-1.6 + i * 1.6, 1.2 + f * 1.9, -1.84]), P(box(1.25, 0.1, 0.18, 0.02), 0xffffff, [-1.6 + i * 1.6, 0.66 + f * 1.9, -1.86]));
  }
  p.push(P(box(1.0, 1.7, 0.12, 0.04), 0x4b5d86, [0, 0.95, -1.84]));
  p.push(P(cyl(0.6, 0.6, 0.8, 12), 0xdfe6f1, [1.4, h + 0.75, 0.2]), P(box(0.1, 1.4, 0.1, 0.01), 0x59616e, [-1.6, h + 0.9, 0.3]));
  g.add(toMesh(p, { thin: true }));
  g.userData.h = h;
  return g;
}

// ------------------------------------------------------------------ cenário por tema (mescladas, sem contorno: custo baixo)
const scen = (parts) => { const g = new THREE.Group(); g.add(new THREE.Mesh(mergeParts(parts), toon)); return g; };

export const SCENERY = {
  house: (r) => {
    const wall = r.pick(WALLS), roof = r.pick(ROOFS), w = r.between(4.6, 6.4), d = r.between(4, 5.4), h = r.between(2.6, 3.4);
    const p = [P(box(w, h, d, 0.1), wall, [0, h / 2, 0]), P(cone(Math.max(w, d) * 0.78, 2.0, 4), roof, [0, h + 0.95, 0], [0, Math.PI / 4, 0], [w / Math.max(w, d), 1, d / Math.max(w, d)]), P(box(0.8, 1.5, 0.1, 0.03), 0x8a5a35, [0, 0.75, -d / 2 - 0.02])];
    for (let i = -1; i <= 1; i += 2) p.push(P(box(1.0, 1.0, 0.1, 0.03), 0xcdeeff, [i * w * 0.28, h * 0.58, -d / 2 - 0.02]), P(box(1.2, 0.1, 0.18, 0.02), 0xffffff, [i * w * 0.28, h * 0.58 - 0.55, -d / 2 - 0.05]));
    p.push(P(box(0.6, 1.3, 0.6, 0.04), 0xc2573a, [w * 0.25, h + 1.4, 0.3]));
    return scen(p);
  },
  tower: (r) => {
    const fl = r.int(4, 8), wall = r.pick([0xb9c6dd, 0xffcf9a, 0xa7e0ff, 0xf2b7d0, 0xc8e6a5]), w = r.between(5, 7), d = r.between(5, 7), h = fl * 1.9;
    const p = [P(box(w, h, d, 0.1), wall, [0, h / 2, 0]), P(box(w + 0.3, 0.3, d + 0.3, 0.04), hex(wall, 0.8), [0, h + 0.15, 0])];
    for (let f = 0; f < fl; f++) for (let i = 0; i < 3; i++) p.push(P(bx(1.2, 1.0, 0.08), 0xbfe6ff, [-w / 3 + i * (w / 3), 1.4 + f * 1.9, -d / 2 - 0.03]));
    p.push(P(cyl(0.05, 0.05, 2.2, 6), 0x59616e, [w * 0.3, h + 1.4, 0]), P(cyl(0.7, 0.7, 0.9, 10), 0xdfe6f1, [-w * 0.2, h + 0.75, 0]));
    return scen(p);
  },
  tree: (r) => {
    const s = r.between(0.9, 1.4), c = r.pick([0x2fc55a, 0x3bd36b, 0x57d94a, 0x1fb85a]);
    return scen([P(cyl(0.2 * s, 0.28 * s, 1.5 * s, 8), 0x8a5a35, [0, 0.75 * s, 0]), P(sph(1.2 * s, 10, 8), c, [0, 2.4 * s, 0]), P(sph(0.9 * s, 9, 7), hex(c, 1.12), [0.7 * s, 1.9 * s, 0.2 * s]), P(sph(0.8 * s, 9, 7), hex(c, 0.92), [-0.7 * s, 2.0 * s, -0.2 * s])]);
  },
  pine: (r) => {
    const s = r.between(1.0, 1.7), c = r.pick([0x1e9a52, 0x27ad5e, 0x2bb35a]);
    return scen([P(cyl(0.2 * s, 0.27 * s, 1.2 * s, 8), 0x7a4e2a, [0, 0.6 * s, 0]), P(cone(1.3 * s, 1.7 * s, 9), c, [0, 1.9 * s, 0]), P(cone(1.0 * s, 1.5 * s, 9), hex(c, 1.15), [0, 2.9 * s, 0]), P(cone(0.7 * s, 1.3 * s, 9), hex(c, 1.3), [0, 3.8 * s, 0])]);
  },
  bigtree: (r) => {
    const s = r.between(1.5, 2.1), c = r.pick([0x1fb85a, 0x2fc55a]);
    return scen([P(cyl(0.45 * s, 0.7 * s, 3.0 * s, 10), 0x8a5a35, [0, 1.5 * s, 0]), P(sph(2.0 * s, 10, 8), c, [0, 4.2 * s, 0]), P(sph(1.5 * s, 9, 7), hex(c, 1.12), [1.4 * s, 3.4 * s, 0.4]), P(sph(1.4 * s, 9, 7), hex(c, 0.9), [-1.4 * s, 3.5 * s, -0.3])]);
  },
  lamp: () => scen([P(cyl(0.09, 0.12, 3.6, 8), 0x4a5568, [0, 1.8, 0]), P(sph(0.3, 10, 8), 0xfff2a8, [0, 3.7, 0]), P(box(0.7, 0.12, 0.7, 0.04), 0x4a5568, [0, 3.45, 0])]),
  bush: (r) => { const c = r.pick([0x2fc55a, 0x3bd36b]); return scen([P(sph(0.6, 9, 7), c, [-0.4, 0.45, 0]), P(sph(0.7, 9, 7), hex(c, 1.1), [0.2, 0.55, 0]), P(sph(0.5, 9, 7), hex(c, 0.92), [0.8, 0.4, 0.1]), P(sph(0.08, 6, 5), r.pick([0xff5d8f, 0xffd23f, 0xffffff]), [0.1, 1.05, -0.4])]); },
  flowers: (r) => { const p = [P(cyl(1.3, 1.3, 0.22, 12), 0x8a5a35, [0, 0.11, 0])]; for (let i = 0; i < 9; i++) { const a = i * 2.4, rr = 0.2 + (i % 3) * 0.28; p.push(P(sph(0.16, 6, 5), r.pick([0xff5d8f, 0xffd23f, 0xff8a1f, 0xffffff, 0xb18cff]), [Math.cos(a) * rr, 0.5 + (i % 2) * 0.1, Math.sin(a) * rr]), P(cyl(0.02, 0.02, 0.4, 4), 0x2fc55a, [Math.cos(a) * rr, 0.3, Math.sin(a) * rr])); } return scen(p); },
  car: (r) => {
    const c = r.pick([0xe8352f, 0x2f78e0, 0xffc92b, 0x3ecb6b, 0xff8a1f, 0xb18cff]);
    const p = [P(box(2.1, 0.6, 4.0, 0.2), c, [0, 0.6, 0]), P(box(1.8, 0.55, 2.0, 0.2), c, [0, 1.1, 0.1]), P(box(1.7, 0.4, 1.8, 0.1), 0xbfe6ff, [0, 1.15, 0.1])];
    [[-0.95, 1.2], [0.95, 1.2], [-0.95, -1.2], [0.95, -1.2]].forEach(([x, z]) => p.push(P(cyl(0.38, 0.38, 0.3, 12), 0x2b2b2b, [x, 0.38, z], [0, 0, Math.PI / 2]), P(cyl(0.2, 0.2, 0.32, 10), 0xcfd5e0, [x, 0.38, z], [0, 0, Math.PI / 2])));
    p.push(P(sph(0.16, 6, 5), 0xfff2a8, [-0.6, 0.65, -2.0]), P(sph(0.16, 6, 5), 0xfff2a8, [0.6, 0.65, -2.0]));
    return scen(p);
  },
  fence: () => { const p = []; for (let i = 0; i < 6; i++) p.push(P(box(0.18, 1.0, 0.1, 0.03), 0xffffff, [i * 0.5 - 1.25, 0.5, 0])); p.push(P(box(3.2, 0.12, 0.08, 0.02), 0xffffff, [0, 0.75, 0])); return scen(p); },
  shop: (r) => {
    const wall = r.pick(WALLS), aw = r.pick([0xe8352f, 0x2f78e0, 0xff8a1f, 0x3ecb6b]);
    const p = [P(box(5.2, 3.2, 4, 0.1), wall, [0, 1.6, 0]), P(box(5.4, 0.3, 4.2, 0.05), 0xffffff, [0, 3.3, 0])];
    for (let i = 0; i < 6; i++) p.push(P(box(0.87, 0.14, 1.1, 0.04), i % 2 ? 0xffffff : aw, [-2.2 + i * 0.88, 2.0, -2.45], [0.4, 0, 0]));
    p.push(P(box(1.6, 1.2, 0.08, 0.03), 0xcdeeff, [-1.2, 1.1, -2.03]), P(box(1.0, 1.7, 0.08, 0.03), 0x8a5a35, [1.4, 0.85, -2.03]), P(box(2.0, 0.6, 0.1, 0.04), 0xffd23f, [0, 2.8, -2.05]));
    return scen(p);
  },
  fountain: () => scen([P(cyl(1.6, 1.8, 0.5, 20), 0xcfd5e0, [0, 0.25, 0]), P(cyl(1.4, 1.4, 0.2, 20), 0x56c7ff, [0, 0.45, 0]), P(cyl(0.2, 0.3, 1.4, 10), 0xcfd5e0, [0, 1.0, 0]), P(sph(0.5, 10, 8), 0x8ee0ff, [0, 1.9, 0], [0, 0, 0], [1, 0.7, 1])]),
  bench: () => scen([P(box(1.8, 0.12, 0.6, 0.04), 0xc2864a, [0, 0.5, 0]), P(box(1.8, 0.5, 0.1, 0.03), 0xc2864a, [0, 0.85, 0.25]), P(box(0.12, 0.5, 0.5, 0.02), 0x3b4558, [-0.8, 0.25, 0]), P(box(0.12, 0.5, 0.5, 0.02), 0x3b4558, [0.8, 0.25, 0])]),
  rock: (r) => { const s = r.between(0.9, 2.2), c = r.pick([0x9aa3b5, 0xa9b1c4, 0x8f98ab]); return scen([P(sph(0.9 * s, 7, 5), c, [0, 0.5 * s, 0], [0, 0.5, 0], [1.1, 0.8, 0.95]), P(sph(0.55 * s, 7, 5), hex(c, 1.1), [0.9 * s, 0.3 * s, 0.2], [0, 0.2, 0], [1, 0.8, 1]), P(sph(0.35 * s, 6, 5), 0x59c24a, [-0.1 * s, 0.95 * s, 0], [0, 0, 0], [1.4, 0.5, 1.2])]); },
  mushroom: (r) => { const s = r.between(0.8, 1.6); return scen([P(cyl(0.2 * s, 0.26 * s, 0.7 * s, 10), 0xfff3dc, [0, 0.35 * s, 0]), P(dome(0.85 * s, 0, 1.6, 14, 8), r.pick([0xe8352f, 0xff8a1f, 0xb18cff]), [0, 0.65 * s, 0]), P(sph(0.12 * s, 6, 5), 0xffffff, [0.3 * s, 1.25 * s, -0.3 * s]), P(sph(0.14 * s, 6, 5), 0xffffff, [-0.3 * s, 1.2 * s, 0.2 * s])]); },
  fern: (r) => { const p = []; for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2; p.push(P(cone(0.16, 1.5, 4), 0x2fb84a, [Math.cos(a) * 0.4, 0.6, Math.sin(a) * 0.4], [Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9], [1, 1, 0.3])); } return scen(p); },
  cycad: (r) => { const p = [P(cyl(0.22, 0.32, 2.2, 8), 0x8a5a35, [0, 1.1, 0]), P(sph(0.34, 8, 6), 0x7a4e2a, [0, 2.3, 0])]; for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; p.push(P(cone(0.2, 2.3, 4), 0x3fcf5a, [Math.cos(a) * 0.8, 2.5, Math.sin(a) * 0.8], [Math.sin(a) * 1.15, 0, -Math.cos(a) * 1.15], [1, 1, 0.25])); } return scen(p); },
  bones: () => scen([P(cyl(0.18, 0.18, 2.4, 8), 0xfff3dc, [0, 0.3, 0], [0, 0, Math.PI / 2], [1, 1, 1]), P(sph(0.3, 7, 5), 0xfff3dc, [-1.2, 0.3, 0.16]), P(sph(0.3, 7, 5), 0xfff3dc, [-1.2, 0.3, -0.16]), P(sph(0.3, 7, 5), 0xfff3dc, [1.2, 0.3, 0.16]), P(sph(0.3, 7, 5), 0xfff3dc, [1.2, 0.3, -0.16]), P(dome(1.2, 0, 1.4, 12, 7), 0xf5e8c8, [3, 0, 0.5], [0, 0, 0], [1.2, 0.8, 0.8])]),
  volcano: () => scen([P(cone(14, 14, 14), 0x8a5a4a, [0, 7, 0]), P(cone(4.6, 3.2, 14), 0xff6a1a, [0, 14.4, 0], [0, 0, 0], [1, 0.8, 1]), P(sph(2.6, 10, 8), 0xffffff, [3, 20, 0], [0, 0, 0], [1.4, 0.8, 1]), P(sph(2.0, 10, 8), 0xe8eaf2, [5, 23, 0])]),
  hill: (r) => { const s = r.between(14, 26); return scen([P(sph(1, 14, 8), r.pick([0x5fc87a, 0x4db38a, 0x7ad06a]), [0, 0, 0], [0, 0, 0], [s, s * 0.45, s * 0.8])]); },
  dino: () => scen([P(sph(1.8, 10, 8), 0x7dc86a, [0, 3.2, 0], [0, 0, 0], [1.6, 1, 1]), P(cone(0.8, 5.0, 8), 0x7dc86a, [2.6, 5.6, 0], [0, 0, -0.7]), P(sph(0.8, 8, 6), 0x7dc86a, [4.4, 7.7, 0], [0, 0, 0], [1.3, 0.8, 0.9]), P(cone(0.9, 4.2, 8), 0x7dc86a, [-3.6, 2.4, 0], [0, 0, 1.2]), P(cyl(0.5, 0.6, 2.8, 8), 0x7dc86a, [-1.0, 1.4, 0.9]), P(cyl(0.5, 0.6, 2.8, 8), 0x7dc86a, [1.0, 1.4, 0.9]), P(cyl(0.5, 0.6, 2.8, 8), 0x7dc86a, [-1.0, 1.4, -0.9]), P(cyl(0.5, 0.6, 2.8, 8), 0x7dc86a, [1.0, 1.4, -0.9])]),
  rail: () => scen([P(box(0.4, 1.0, 12, 0.04), 0xdfe6f1, [0, 0.5, 0])]),
  tank: () => scen([P(cyl(1.0, 1.0, 1.8, 12), 0xdfe6f1, [0, 2.4, 0]), P(cone(1.1, 0.9, 12), 0xc2573a, [0, 3.75, 0]), P(box(0.12, 1.8, 0.12, 0.01), 0x59616e, [-0.7, 0.9, -0.7]), P(box(0.12, 1.8, 0.12, 0.01), 0x59616e, [0.7, 0.9, 0.7])]),
  billboard: (r) => scen([P(box(0.3, 3.2, 0.3, 0.03), 0x59616e, [0, 1.6, 0]), P(box(4.6, 2.2, 0.25, 0.05), r.pick([0xff7ab0, 0x5cc8ff, 0xffd23f]), [0, 3.6, -0.2]), P(box(3.4, 1.2, 0.1, 0.03), 0xffffff, [0, 3.6, -0.36])]),
  cloud: (r) => { const s = r.between(2, 4); return scen([P(sph(1.2 * s, 10, 8), 0xffffff, [0, 0, 0]), P(sph(0.95 * s, 10, 8), 0xffffff, [1.3 * s, -0.2 * s, 0.2 * s]), P(sph(0.9 * s, 10, 8), 0xf4f9ff, [-1.3 * s, -0.25 * s, 0]), P(sph(0.8 * s, 10, 8), 0xf4f9ff, [0.2 * s, 0.3 * s, 0.6 * s])]); },
};

// ------------------------------------------------------------------ carrinhos e bichinhos de passagem
export function buildFireTruck() {
  const g = new THREE.Group();
  const p = [P(box(2.2, 1.4, 4.2, 0.18), 0xe8352f, [0, 1.1, 0.6]), P(box(2.2, 1.7, 1.7, 0.2), 0xc62828, [0, 1.25, -1.75]), P(box(1.9, 0.7, 0.1, 0.05), 0x9fdcff, [0, 1.65, -2.62]), P(box(2.24, 0.14, 4.0, 0.03), 0xffd23f, [0, 1.15, 0.6]), P(box(2.0, 0.12, 3.6, 0.03), 0xdfe3ea, [0, 1.95, 0.7]), P(box(2.3, 0.3, 6.2, 0.1), 0x6c757d, [0, 0.45, -0.1]), P(sph(0.3, 10, 8), 0xffd23f, [0, 1.1, 2.7], [0, 0, 0], [1, 1, 0.3])];
  for (let i = 0; i < 6; i++) p.push(P(box(1.9, 0.05, 0.08, 0.01), 0x9aa0a8, [0, 2.0, 1.9 - i * 0.6]));
  [[-1.15, -1.7], [1.15, -1.7], [-1.15, 1.6], [1.15, 1.6]].forEach(([x, z]) => p.push(P(cyl(0.5, 0.5, 0.36, 14), 0x222222, [x, 0.5, z], [0, 0, Math.PI / 2]), P(cyl(0.26, 0.26, 0.38, 10), 0xcfd5e0, [x, 0.5, z], [0, 0, Math.PI / 2])));
  g.add(toMesh(p, { thin: true }));
  const l1 = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), new THREE.MeshBasicMaterial({ color: 0x4db8ff })); l1.position.set(-0.5, 2.25, -1.75);
  const l2 = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff3b3b })); l2.position.set(0.5, 2.25, -1.75);
  g.add(l1, l2); g.userData.lights = [l1, l2];
  return g;
}
