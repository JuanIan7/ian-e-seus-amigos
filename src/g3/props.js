// Objetos 3D do jogo: obstáculos, estrelas, equipamentos, chamas, alvos de missão e cenário de cada tema.
import { THREE, P, sph, box, cyl, cone, cap, tor, dome, lathe, taper, slab, rockGeo, toMesh, toon, toonFlat, glow, hex, mergeParts } from './kit.js';
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
  buoy: { w: 0.9, h: 0.9, d: 0.9 },
  rope: { w: 1.5, h: 0.6, d: 1.0 },
  barrel: { w: 0.9, h: 1.0, d: 0.9 },
  lavarock: { w: 1.3, h: 0.85, d: 1.0 },
  ptero: { w: 1.5, h: 2.0, d: 1.0 },          // muro alto: exige pulo duplo
};

export function buildObstacle(kind) {
  const d = OBSTACLES[kind];
  let parts = [];
  switch (kind) {
    case 'cone':
      parts = [P(box(0.8, 0.09, 0.8, 0.05), 0x2b3350, [0, 0.045, 0]), P(lathe([[0.3, 0.08], [0.27, 0.2], [0.06, 0.8], [0.0001, 0.82]], 20), 0xff7a1a), P(cyl(0.215, 0.24, 0.12, 20), 0xffffff, [0, 0.36, 0]), P(cyl(0.13, 0.155, 0.1, 20), 0xffffff, [0, 0.58, 0])];
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
      parts = [P(lathe([[0.3, 0], [0.3, 0.1], [0.24, 0.12], [0.22, 0.62], [0.25, 0.66], [0.23, 0.72], [0.15, 0.86], [0.0001, 0.9]], 22), 0xe8352f), P(cyl(0.08, 0.08, 0.12, 12), 0xffd23f, [0, 0.93, 0]), P(cyl(0.09, 0.1, 0.5, 14), 0xffd23f, [0, 0.45, 0], [0, 0, Math.PI / 2]), P(cyl(0.11, 0.11, 0.06, 14), 0xffd23f, [0.27, 0.45, 0], [0, 0, Math.PI / 2]), P(cyl(0.11, 0.11, 0.06, 14), 0xffd23f, [-0.27, 0.45, 0], [0, 0, Math.PI / 2]), P(cyl(0.13, 0.13, 0.08, 16), 0xb5231e, [0, 0.55, -0.22], [Math.PI / 2, 0, 0])];
      break;
    case 'bench':
      parts = [P(box(1.6, 0.1, 0.5, 0.04), 0xc2864a, [0, 0.42, 0]), P(box(1.6, 0.4, 0.08, 0.03), 0xc2864a, [0, 0.68, 0.22]), P(box(0.1, 0.42, 0.45, 0.02), 0x3b4558, [-0.7, 0.21, 0]), P(box(0.1, 0.42, 0.45, 0.02), 0x3b4558, [0.7, 0.21, 0])];
      break;
    case 'bush':
      parts = [P(rockGeo(0.5, 1.1, 0.12), 0x2fc55a, [-0.3, 0.42, 0]), P(rockGeo(0.58, 2.3, 0.12), 0x37d664, [0.1, 0.5, 0.05]), P(rockGeo(0.46, 3.7, 0.12), 0x2fc55a, [0.45, 0.4, -0.05]), P(sph(0.07), 0xff5d8f, [0.0, 0.92, -0.35]), P(sph(0.07), 0xffd23f, [0.4, 0.8, -0.35]), P(sph(0.07), 0xff5d8f, [-0.4, 0.82, -0.3])];
      break;
    case 'log':
      parts = [P(taper([[-0.95, 0.34, 0], [0, 0.36, 0.02], [0.95, 0.34, 0]], [0.34, 0.36, 0.33], 12, 16), 0x9a6a3a), P(cyl(0.345, 0.345, 0.04, 18), 0xe9c58f, [0.95, 0.34, 0], [0, 0, Math.PI / 2]), P(cyl(0.345, 0.345, 0.04, 18), 0xe9c58f, [-0.95, 0.34, 0], [0, 0, Math.PI / 2]), P(tor(0.18, 0.02, 6, 18), 0xc7955a, [0.975, 0.34, 0], [0, Math.PI / 2, 0]), P(tor(0.09, 0.02, 6, 14), 0xc7955a, [0.975, 0.34, 0], [0, Math.PI / 2, 0]), P(rockGeo(0.14, 2.2, 0.1), 0x59c24a, [0.3, 0.7, 0], [0, 0, 0], [1.6, 0.5, 1]), P(taper([[-0.3, 0.6, 0.1], [-0.4, 0.95, 0.15], [-0.5, 1.05, 0.1]], [0.06, 0.04, 0.02], 8, 8), 0x8a5a2e)];
      break;
    case 'rock':
      parts = [P(rockGeo(0.62, 3.1, 0.14), 0x9aa3b5, [0, 0.38, 0], [0, 0.4, 0], [1.1, 0.8, 0.9]), P(rockGeo(0.4, 5.3, 0.14), 0xb2bacb, [0.5, 0.26, 0.15], [0, 0.2, 0], [1, 0.8, 0.9]), P(rockGeo(0.28, 7.7, 0.1), 0x59c24a, [-0.15, 0.78, 0], [0, 0, 0], [1.4, 0.45, 1.2])];
      break;
    case 'mushroom':
      parts = [P(lathe([[0.22, 0], [0.19, 0.3], [0.17, 0.5], [0.0001, 0.52]], 16), 0xfff3dc), P(lathe([[0.0001, 0.42], [0.58, 0.4], [0.55, 0.6], [0.35, 0.86], [0.0001, 0.95]], 22), 0xe8352f), P(sph(0.09), 0xffffff, [0.2, 0.8, -0.25], [0, 0, 0], [1, 0.6, 1]), P(sph(0.1), 0xffffff, [-0.22, 0.75, 0.15], [0, 0, 0], [1, 0.6, 1]), P(sph(0.07), 0xffffff, [0.1, 0.9, 0.2], [0, 0, 0], [1, 0.6, 1]), P(sph(0.08), 0xffffff, [-0.08, 0.92, -0.25], [0, 0, 0], [1, 0.6, 1])];
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
    case 'buoy':
      parts = [P(sph(0.42, 18, 14), 0xe8352f, [0, 0.44, 0]), P(cyl(0.44, 0.44, 0.16, 20), 0xffffff, [0, 0.44, 0]), P(cyl(0.06, 0.08, 0.5, 10), 0x59616e, [0, 0.95, 0]), P(sph(0.1, 12, 10), 0xffd23f, [0, 1.22, 0])];
      break;
    case 'rope':
      parts = [P(tor(0.42, 0.13, 10, 22), 0xd9b47a, [0, 0.14, 0], [Math.PI / 2, 0, 0]), P(tor(0.28, 0.12, 10, 20), 0xc9a066, [0, 0.36, 0], [Math.PI / 2, 0, 0]), P(tor(0.14, 0.1, 8, 16), 0xd9b47a, [0, 0.54, 0], [Math.PI / 2, 0, 0]), P(box(0.5, 0.12, 0.12, 0.05), 0xd9b47a, [0.55, 0.06, 0.2], [0, 0.4, 0])];
      break;
    case 'barrel':
      parts = [P(cyl(0.38, 0.38, 0.96, 18), 0x2f78e0, [0, 0.48, 0]), P(sph(0.4, 18, 10), 0x2f78e0, [0, 0.48, 0], [0, 0, 0], [1.05, 1.15, 1.05]), P(tor(0.42, 0.04, 6, 22), 0xdfe6f1, [0, 0.2, 0], [Math.PI / 2, 0, 0]), P(tor(0.42, 0.04, 6, 22), 0xdfe6f1, [0, 0.76, 0], [Math.PI / 2, 0, 0]), P(cyl(0.3, 0.3, 0.04, 18), 0x1f5fb8, [0, 0.98, 0])];
      break;
    case 'lavarock':
      parts = [P(sph(0.62, 14, 10), 0x4a3a3a, [0, 0.38, 0], [0, 0.4, 0], [1.1, 0.8, 0.9]), P(sph(0.4, 12, 9), 0x5a4646, [0.5, 0.26, 0.15], [0, 0.2, 0], [1, 0.8, 0.9]), P(sph(0.16, 10, 8), 0xff6a1a, [-0.25, 0.72, -0.3]), P(sph(0.12, 10, 8), 0xffa43a, [0.2, 0.62, -0.42]), P(sph(0.1, 8, 6), 0xff6a1a, [0.45, 0.45, -0.3])];
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
let glowTex = null;
function getGlowTex() {
  if (glowTex) return glowTex;
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,220,120,1)'); gr.addColorStop(0.35, 'rgba(255,150,40,.55)'); gr.addColorStop(1, 'rgba(255,90,0,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 64, 64); glowTex = new THREE.CanvasTexture(c); glowTex.colorSpace = THREE.SRGBColorSpace; return glowTex;
}
const FLAME_MATS = [0.72, 0.88, 1].map((op) => new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: op, depthWrite: false }));
const FLAME_PROFILE = [[0.0001, 0], [0.2, 0.04], [0.3, 0.17], [0.29, 0.36], [0.2, 0.6], [0.09, 0.84], [0.0001, 0.98]];
/** fogo cartunesco: três camadas em gota (sem sombra), brilho em volta e olhinhos travessos (não assusta) */
export function buildFlame() {
  const g = new THREE.Group();
  // camadas translúcidas desenhadas de fora para dentro: o miolo amarelo aparece através da chama laranja
  const layer = (sc, col, dy, op, ro) => { const m = new THREE.Mesh(mergeParts([P(lathe(FLAME_PROFILE, 20), col, [0, dy, 0], [0, 0, 0], [sc, sc, sc])]), FLAME_MATS[ro]); m.renderOrder = 6 + ro; return m; };
  g.add(layer(1.0, 0xff5a1a, 0, 0.78, 0), layer(0.72, 0xffa21f, 0.02, 0.9, 1), layer(0.46, 0xfff06a, 0.04, 1, 2));
  const eyes = mergeParts([P(sph(0.045), 0xffffff, [-0.08, 0.26, -0.22]), P(sph(0.045), 0xffffff, [0.08, 0.26, -0.22]), P(sph(0.022), 0x3a1a0a, [-0.08, 0.26, -0.26]), P(sph(0.022), 0x3a1a0a, [0.08, 0.26, -0.26])]);
  g.add(new THREE.Mesh(eyes, glow));
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: getGlowTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.85 }));
  halo.scale.set(1.5, 1.6, 1); halo.position.y = 0.38; g.add(halo);
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
  // lixeira com tampa abaulada, alça, frisos e rodinhas
  const g = new THREE.Group();
  const p = [P(lathe([[0.0001, 0.06], [0.44, 0.06], [0.47, 0.2], [0.53, 1.08], [0.57, 1.12], [0.0001, 1.12]], 28), 0x2f9bff),
    P(lathe([[0.6, 1.1], [0.62, 1.16], [0.55, 1.26], [0.3, 1.36], [0.0001, 1.38]], 28), 0x1f78d6),
    P(tor(0.12, 0.035, 8, 16, Math.PI), 0x8bc7ff, [0, 1.36, 0], [0, 0, 0]),
    P(tor(0.5, 0.025, 6, 28), 0x8bc7ff, [0, 0.45, 0], [Math.PI / 2, 0, 0]), P(tor(0.52, 0.025, 6, 28), 0x8bc7ff, [0, 0.8, 0], [Math.PI / 2, 0, 0]),
    P(cyl(0.11, 0.11, 0.08, 16), 0x2b2b35, [-0.3, 0.1, 0.42], [0, 0, Math.PI / 2]), P(cyl(0.11, 0.11, 0.08, 16), 0x2b2b35, [0.3, 0.1, 0.42], [0, 0, Math.PI / 2]),
    P(box(0.24, 0.24, 0.02, 0.02), 0xffffff, [0, 0.66, -0.505], [0.06, 0, 0]), P(slab([[-0.07, -0.06], [0.07, -0.06], [0.0, 0.08]], 0.02, 0.008), 0x3ecb6b, [0, 0.66, -0.52], [0.06, 0, 0])];
  g.add(toMesh(p, { thin: true }));
  return g;
}
/** telhado de duas águas (com beiral) */
function gable(parts, w, d, h, y, col, over = 0.35) {
  const half = w / 2 + over, ang = Math.atan2(h, w / 2), len = Math.hypot(w / 2, h) + over;
  [-1, 1].forEach((s) => {
    const cx = (k) => s * Math.cos(ang) * len * k, cy = (k) => y + h - Math.sin(ang) * len * k, nx = s * Math.sin(ang) * 0.1, ny = Math.cos(ang) * 0.1;
    parts.push(P(box(len, 0.2, d + over * 2, 0.08), col, [cx(0.5), cy(0.5), 0], [0, 0, -s * ang]));
    for (let i = 1; i < 4; i++) parts.push(P(box(0.07, 0.07, d + over * 2 + 0.02, 0.03), hex(col, 0.82), [cx(i / 4) + nx, cy(i / 4) + ny, 0], [0, 0, -s * ang]));
  });
  parts.push(P(cyl(0.12, 0.12, d + over * 2 + 0.04, 14), hex(col, 0.75), [0, y + h + 0.02, 0], [Math.PI / 2, 0, 0]));
  return half;
}
/** janela com moldura, vidro, cruz, peitoril e (opcional) floreira e venezianas */
function windowParts(parts, x, y, z, w, h, frame = 0xffffff, shutter = null, flowers = false) {
  parts.push(P(box(w + 0.16, h + 0.16, 0.08, 0.04), frame, [x, y, z]), P(box(w, h, 0.06, 0.03), 0xbfe6ff, [x, y, z - 0.03]), P(box(0.05, h, 0.04, 0.01), frame, [x, y, z - 0.07]), P(box(w, 0.05, 0.04, 0.01), frame, [x, y, z - 0.07]), P(box(w + 0.28, 0.08, 0.18, 0.03), frame, [x, y - h / 2 - 0.1, z - 0.06]));
  parts.push(P(box(w * 0.32, h * 0.3, 0.02, 0.01), 0xffffff, [x - w * 0.22, y + h * 0.22, z - 0.065]));
  if (shutter !== null) [-1, 1].forEach((s) => parts.push(P(box(w * 0.42, h + 0.1, 0.06, 0.03), shutter, [x + s * (w / 2 + w * 0.24), y, z + 0.0])));
  if (flowers) { parts.push(P(box(w + 0.1, 0.18, 0.2, 0.05), 0x9a6a3a, [x, y - h / 2 - 0.22, z - 0.12])); for (let i = 0; i < 4; i++) parts.push(P(sph(0.07), [0xff5d8f, 0xffd23f, 0xff8a1f, 0xffffff][i], [x - w * 0.35 + i * w * 0.24, y - h / 2 - 0.08, z - 0.14])); }
}
export function buildHouse(wall = 0xffd66b, roof = 0xe8352f) {
  const g = new THREE.Group(), W = 4.4, H = 2.6, D = 3.6;
  const p = [P(box(W, H, D, 0.14), wall, [0, H / 2, 0]), P(box(W + 0.3, 0.24, D + 0.3, 0.08), 0xd9c7a0, [0, 0.12, 0]), P(box(W + 0.06, 0.12, D + 0.06, 0.04), hex(wall, 0.85), [0, H - 0.05, 0])];
  // empena (triângulo na frente e atrás)
  [-1, 1].forEach((s) => p.push(P(slab([[-W / 2, 0], [W / 2, 0], [0, 1.45]], 0.1, 0.03), wall, [0, H, s * (D / 2 - 0.05)])));
  gable(p, W, D, 1.45, H, roof);
  p.push(P(box(0.56, 1.3, 0.56, 0.08), 0xc2573a, [1.3, H + 1.25, 0.4]), P(box(0.72, 0.14, 0.72, 0.05), 0x8a3a24, [1.3, H + 1.95, 0.4]));
  // porta com arco, maçaneta, degrau e lampião
  p.push(P(slab([[-0.45, 0], [0.45, 0], [0.45, 1.25], [0.32, 1.45], [0, 1.52], [-0.32, 1.45], [-0.45, 1.25]], 0.1, 0.03), 0x8a5a35, [0, 0.22, -D / 2 - 0.02]), P(sph(0.06), 0xffd23f, [0.28, 0.9, -D / 2 - 0.1]), P(box(1.2, 0.14, 0.5, 0.05), 0xcfc4ac, [0, 0.16, -D / 2 - 0.3]), P(sph(0.09), 0xfff2a8, [0.7, 1.75, -D / 2 - 0.12]));
  [-1.4, 1.4].forEach((x) => windowParts(p, x, 1.45, -D / 2 - 0.03, 0.8, 0.8, 0xffffff, hex(roof, 0.9), true));
  g.add(toMesh(p, { thin: true }));
  return g;
}
export function buildTower(floors = 4, wall = 0xb9c6dd) {
  const g = new THREE.Group(); const h = floors * 1.9, W = 5.2, D = 3.6;
  const p = [P(box(W, h, D, 0.16), wall, [0, h / 2, 0]), P(box(W + 0.3, 0.36, D + 0.3, 0.1), 0x7b8cae, [0, h + 0.18, 0]), P(box(W + 0.3, 0.44, D + 0.3, 0.1), 0x7b8cae, [0, 0.22, 0])];
  for (let f = 1; f < floors; f++) p.push(P(box(W + 0.08, 0.1, D + 0.08, 0.04), hex(wall, 0.85), [0, f * 1.9 + 0.2, 0]));
  for (let f = 0; f < floors; f++) for (let i = 0; i < 3; i++) {
    if (f === 0 && i === 1) continue;
    windowParts(p, -1.6 + i * 1.6, 1.2 + f * 1.9, -D / 2 - 0.03, 1.0, 0.9, 0xffffff, null, false);
    if (f > 0 && f % 2 === 1 && i !== 1) { p.push(P(box(1.4, 0.1, 0.5, 0.04), 0xdfe6f1, [-1.6 + i * 1.6, 0.66 + f * 1.9, -D / 2 - 0.28])); for (let k = 0; k < 6; k++) p.push(P(cyl(0.025, 0.025, 0.42, 8), 0x59616e, [-2.2 + i * 1.6 + k * 0.24, 0.9 + f * 1.9, -D / 2 - 0.5])); p.push(P(cap(0.03, 1.3, 4, 8), 0x59616e, [-1.6 + i * 1.6, 1.12 + f * 1.9, -D / 2 - 0.5], [0, 0, Math.PI / 2])); }
  }
  // térreo: porta de vidro e toldo listrado
  p.push(P(box(1.2, 1.7, 0.1, 0.06), 0x4b5d86, [0, 1.0, -D / 2 - 0.02]), P(box(1.0, 1.5, 0.06, 0.04), 0x9fdcff, [0, 1.0, -D / 2 - 0.06]));
  for (let i = 0; i < 6; i++) p.push(P(box(0.44, 0.1, 0.9, 0.04), i % 2 ? 0xffffff : 0xe8352f, [-1.1 + i * 0.44, 2.05, -D / 2 - 0.42], [0.45, 0, 0]));
  p.push(P(cyl(0.6, 0.6, 0.8, 18), 0xdfe6f1, [1.4, h + 0.75, 0.2]), P(cone(0.65, 0.4, 18), 0xc2573a, [1.4, h + 1.35, 0.2]), P(cyl(0.04, 0.04, 1.4, 8), 0x59616e, [-1.6, h + 0.9, 0.3]), P(sph(0.08), 0xe8352f, [-1.6, h + 1.65, 0.3]), P(box(0.9, 0.5, 0.7, 0.08), 0xdfe6f1, [-0.2, h + 0.55, 0.6]));
  g.add(toMesh(p, { thin: true }));
  g.userData.h = h;
  return g;
}

// ------------------------------------------------------------------ cenário por tema (mescladas, sem contorno: custo baixo)
const scen = (parts) => { const g = new THREE.Group(); g.add(new THREE.Mesh(mergeParts(parts), toon)); return g; };

const SCENERY_BASE = {
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
  // ---- fase 6: resgate aquático ----
  post: () => scen([P(cyl(0.16, 0.18, 2.2, 14), 0x8a5a35, [0, 0.1, 0]), P(tor(0.2, 0.05, 8, 16), 0xd9b47a, [0, 0.8, 0], [Math.PI / 2, 0, 0])]),
  buoyS: (r) => { const c = r.pick([0xe8352f, 0xffd23f, 0xff8a1f]); return scen([P(sph(0.5, 18, 14), c, [0, -0.1, 0], [0, 0, 0], [1, 0.8, 1]), P(cyl(0.52, 0.52, 0.14, 20), 0xffffff, [0, 0.0, 0]), P(cone(0.18, 0.9, 12), c, [0, 0.6, 0]), P(sph(0.12, 12, 10), 0xfff2a8, [0, 1.1, 0])]); },
  rocksea: (r) => { const s = r.between(0.9, 1.8); return scen([P(sph(0.9 * s, 14, 10), 0x8f98ab, [0, 0.1 * s, 0], [0, 0.5, 0], [1.2, 0.7, 1]), P(sph(0.5 * s, 12, 9), 0xa9b1c4, [0.8 * s, 0.05, 0.3], [0, 0.2, 0], [1, 0.7, 1]), P(cyl(1.4 * s, 1.5 * s, 0.06, 24), 0xffffff, [0, -0.3, 0])]); },
  boat: (r) => {
    const c = r.pick([0xe8352f, 0xffffff, 0x2f78e0, 0xffd23f]), st = r.pick([0xffffff, 0x1b2a49, 0xe8352f]);
    const p = [P(sph(1, 20, 12), c, [0, 0.0, 0], [0, 0, 0], [1.2, 0.55, 2.6]), P(box(2.3, 0.2, 4.4, 0.1), 0xd9b47a, [0, 0.42, 0]), P(box(2.42, 0.18, 4.8, 0.09), st, [0, 0.3, 0]), P(box(1.3, 1.0, 1.4, 0.18), 0xffffff, [0, 1.0, 0.4]), P(box(1.1, 0.4, 0.06, 0.06), 0x9fdcff, [0, 1.15, -0.32]), P(cyl(0.06, 0.06, 2.6, 10), 0xdfe6f1, [0, 2.4, 0.6]), P(cyl(1.5, 1.6, 0.04, 28), 0xffffff, [0, -0.32, 0])];
    return scen(p);
  },
  palmisle: (r) => { const p = [P(sph(2.2, 20, 12), 0xf2d79a, [0, -0.9, 0], [0, 0, 0], [1.4, 0.5, 1.2]), P(cyl(3.0, 3.2, 0.06, 32), 0xffffff, [0, -0.32, 0])]; const trunk = (x, z, lean) => { for (let i = 0; i < 7; i++) p.push(P(cyl(0.2, 0.24, 0.62, 12), i % 2 ? 0x9a6a3a : 0x8a5a2e, [x + Math.sin(lean) * i * 0.55, 0.3 + i * 0.58, z], [0, 0, -lean * 0.6])); const tx = x + Math.sin(lean) * 3.9, ty = 4.4; for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2; p.push(P(sph(1, 14, 8), k % 2 ? 0x3fcf5a : 0x2fb84a, [tx + Math.cos(a) * 1.0, ty - 0.2, z + Math.sin(a) * 1.0], [Math.sin(a) * 0.6, a, -Math.cos(a) * 0.6], [1.5, 0.12, 0.42])); } p.push(P(sph(0.2, 12, 10), 0x8a5a2e, [tx + 0.2, ty - 0.45, z]), P(sph(0.2, 12, 10), 0x7a4e2a, [tx - 0.2, ty - 0.45, z + 0.15])); }; trunk(0, 0, 0.18); if (r.frac() < 0.5) trunk(1.2, 0.8, -0.25); return scen(p); },
  lighthouse: () => { const p = []; for (let i = 0; i < 6; i++) p.push(P(cyl(1.3 - i * 0.12, 1.42 - i * 0.12, 1.5, 24), i % 2 ? 0xffffff : 0xe8352f, [0, 0.75 + i * 1.5, 0])); p.push(P(cyl(0.9, 0.9, 1.0, 20), 0xfff2a8, [0, 9.6, 0]), P(cone(1.1, 1.0, 20), 0xe8352f, [0, 10.6, 0]), P(cyl(1.15, 1.15, 0.16, 24), 0x1b2a49, [0, 9.1, 0]), P(sph(3, 20, 10), 0x8f98ab, [0, -1.6, 0], [0, 0, 0], [1.3, 0.6, 1.3])); return scen(p); },
  island: (r) => { const s = r.between(8, 14); return scen([P(sph(1, 24, 12), 0x5fc87a, [0, 0, 0], [0, 0, 0], [s, s * 0.32, s * 0.7]), P(sph(1, 24, 12), 0xf2d79a, [0, -0.15 * s, 0], [0, 0, 0], [s * 1.08, s * 0.18, s * 0.78])]); },
  // ---- fase 7: resgate no vulcão ----
  lavarockS: (r) => { const s = r.between(0.8, 1.6); return scen([P(sph(0.9 * s, 14, 10), 0x4a3a3a, [0, 0.4 * s, 0], [0, 0.5, 0], [1.1, 0.8, 0.95]), P(sph(0.5 * s, 12, 9), 0x5a4646, [0.8 * s, 0.25 * s, 0.2], [0, 0.2, 0], [1, 0.8, 1]), P(sph(0.18 * s, 10, 8), 0xff6a1a, [-0.3 * s, 0.9 * s, -0.4 * s]), P(sph(0.14 * s, 10, 8), 0xffa43a, [0.3 * s, 0.8 * s, -0.5 * s])]); },
  deadtree: (r) => { const s = r.between(1.0, 1.6), c = 0x3a2e28; const p = [P(cyl(0.18 * s, 0.32 * s, 2.6 * s, 12), c, [0, 1.3 * s, 0])]; for (let i = 0; i < 4; i++) { const a = i * 1.7 + 0.4; p.push(P(cyl(0.05 * s, 0.11 * s, 1.3 * s, 8), c, [Math.cos(a) * 0.4 * s, (1.9 + i * 0.25) * s, Math.sin(a) * 0.4 * s], [Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9])); } p.push(P(sph(0.3 * s, 12, 10), 0x5a4646, [0, 0.1, 0], [0, 0, 0], [1.6, 0.4, 1.6])); return scen(p); },
  vent: () => scen([P(cone(1.2, 1.2, 18), 0x4a3a3a, [0, 0.6, 0]), P(cyl(0.35, 0.35, 0.1, 16), 0xff6a1a, [0, 1.15, 0]), P(sph(0.5, 14, 10), 0x8a8f9c, [0.2, 2.0, 0], [0, 0, 0], [1, 0.8, 1]), P(sph(0.7, 14, 10), 0xa9aeb8, [-0.1, 2.9, 0.2], [0, 0, 0], [1, 0.8, 1]), P(sph(0.9, 14, 10), 0xc4c8d0, [0.3, 4.0, 0], [0, 0, 0], [1, 0.8, 1])]),
  hut: (r) => { const c = r.pick([0xd9b47a, 0xc9a066]); return scen([P(cyl(1.5, 1.6, 1.8, 18), c, [0, 0.9, 0]), P(cone(2.3, 1.8, 18), 0xb5893a, [0, 2.7, 0]), P(cone(0.5, 0.5, 12), 0x9a6a3a, [0, 3.7, 0]), P(box(0.8, 1.3, 0.1, 0.05), 0x6a4426, [0, 0.65, -1.5]), P(cyl(1.7, 1.7, 0.1, 20), 0x8a7060, [0, 0.05, 0])]); },
  lavapool: (r) => { const s = r.between(1.5, 2.6); const g = scen([P(cyl(1.4 * s, 1.5 * s, 0.24, 24), 0x3a2e2e, [0, 0.06, 0]), P(sph(0.3 * s, 12, 9), 0x4a3a3a, [1.3 * s, 0.15, 0.3 * s])]); const lava = new THREE.Mesh(new THREE.CircleGeometry(1.2 * s, 28), new THREE.MeshBasicMaterial({ color: 0xff6a1a })); lava.rotation.x = -Math.PI / 2; lava.position.y = 0.2; g.add(lava); const glowL = new THREE.Mesh(new THREE.CircleGeometry(0.7 * s, 24), new THREE.MeshBasicMaterial({ color: 0xffd23f })); glowL.rotation.x = -Math.PI / 2; glowL.position.set(0.2 * s, 0.21, -0.1 * s); g.add(glowL); return g; },
  darkhill: (r) => { const s = r.between(14, 26); return scen([P(sph(1, 24, 12), r.pick([0x6a4a40, 0x5a4038, 0x7a5448]), [0, 0, 0], [0, 0, 0], [s, s * 0.45, s * 0.8])]); },
  cloud: (r) => { const s = r.between(2, 4); return scen([P(sph(1.2 * s, 10, 8), 0xffffff, [0, 0, 0]), P(sph(0.95 * s, 10, 8), 0xffffff, [1.3 * s, -0.2 * s, 0.2 * s]), P(sph(0.9 * s, 10, 8), 0xf4f9ff, [-1.3 * s, -0.25 * s, 0]), P(sph(0.8 * s, 10, 8), 0xf4f9ff, [0.2 * s, 0.3 * s, 0.6 * s])]); },
};

// versões caprichadas (formas arredondadas, telhados de duas águas, copas fofas, postes com luz)
const puff = (r, seed, amp = 0.12) => rockGeo(r, seed, amp, 16, 11);
const scenLit = (parts, lights = []) => { const g = scen(parts); lights.forEach(([x, y, z, rr, col]) => { const m = new THREE.Mesh(new THREE.SphereGeometry(rr, 14, 10), new THREE.MeshBasicMaterial({ color: col || 0xfff2a8 })); m.position.set(x, y, z); g.add(m); const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: getGlowTex(), color: 0xfff2c0, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.55 })); h.scale.setScalar(rr * 7); h.position.set(x, y, z); g.add(h); }); return g; };
export const SCENERY = {
  ...SCENERY_BASE,
  house: (r) => {
    const wall = r.pick(WALLS), roof = r.pick(ROOFS), W = r.between(4.6, 6.2), D = r.between(4, 5.2), H = r.between(2.6, 3.3), rh = r.between(1.4, 2.0);
    const p = [P(box(W, H, D, 0.14), wall, [0, H / 2, 0]), P(box(W + 0.3, 0.26, D + 0.3, 0.08), 0xd9c7a0, [0, 0.13, 0])];
    [-1, 1].forEach((s2) => p.push(P(slab([[-W / 2, 0], [W / 2, 0], [0, rh]], 0.1, 0.03), wall, [0, H, s2 * (D / 2 - 0.05)])));
    gable(p, W, D, rh, H, roof, 0.4);
    p.push(P(slab([[-0.45, 0], [0.45, 0], [0.45, 1.25], [0, 1.5], [-0.45, 1.25]], 0.1, 0.03), r.pick([0x8a5a35, 0x2f78e0, 0xe8352f]), [0, 0.24, -D / 2 - 0.02]), P(sph(0.06), 0xffd23f, [0.28, 0.9, -D / 2 - 0.1]));
    [-1, 1].forEach((i) => windowParts(p, i * W * 0.29, H * 0.58, -D / 2 - 0.03, 0.85, 0.85, 0xffffff, r.frac() < 0.5 ? hex(roof, 0.9) : null, r.frac() < 0.4));
    if (r.frac() < 0.7) p.push(P(box(0.56, 1.3, 0.56, 0.08), 0xc2573a, [W * 0.25, H + rh * 0.7, 0.3]), P(box(0.72, 0.14, 0.72, 0.05), 0x8a3a24, [W * 0.25, H + rh * 0.7 + 0.68, 0.3]));
    return scen(p);
  },
  tower: (r) => {
    const fl = r.int(4, 8), wall = r.pick([0xb9c6dd, 0xffcf9a, 0xa7e0ff, 0xf2b7d0, 0xc8e6a5]), w = r.between(5, 7), d = r.between(5, 7), h = fl * 1.9;
    const p = [P(box(w, h, d, 0.16), wall, [0, h / 2, 0]), P(box(w + 0.35, 0.35, d + 0.35, 0.1), hex(wall, 0.78), [0, h + 0.17, 0]), P(box(w + 0.3, 0.5, d + 0.3, 0.1), hex(wall, 0.75), [0, 0.25, 0])];
    for (let f = 1; f < fl; f++) p.push(P(box(w + 0.1, 0.1, d + 0.1, 0.04), hex(wall, 0.86), [0, f * 1.9 + 0.2, 0]));
    for (let f = 0; f < fl; f++) for (let i = 0; i < 3; i++) { const x = -w / 3 + i * (w / 3); p.push(P(box(1.24, 1.04, 0.08, 0.04), 0xffffff, [x, 1.3 + f * 1.9, -d / 2 - 0.02]), P(box(1.08, 0.88, 0.06, 0.03), r.frac() < 0.2 ? 0xfff2a8 : 0xbfe6ff, [x, 1.3 + f * 1.9, -d / 2 - 0.05])); }
    p.push(P(cyl(0.05, 0.05, 2.2, 8), 0x59616e, [w * 0.3, h + 1.4, 0]), P(cyl(0.7, 0.7, 0.9, 16), 0xdfe6f1, [-w * 0.2, h + 0.75, 0]), P(cone(0.75, 0.4, 16), 0xc2573a, [-w * 0.2, h + 1.4, 0]));
    return scen(p);
  },
  tree: (r) => {
    const s = r.between(0.9, 1.4), c = r.pick([0x2fc55a, 0x3bd36b, 0x57d94a, 0x1fb85a]);
    const p = [P(taper([[0, 0, 0], [0.05 * s, 1.0 * s, 0], [-0.05 * s, 1.9 * s, 0]], [0.32 * s, 0.22 * s, 0.16 * s], 8, 10), 0x8a5a35)];
    [0, 2.1, 4.2].forEach((a) => p.push(P(cone(0.12 * s, 0.4 * s, 8), 0x7a4e2a, [Math.cos(a) * 0.22 * s, 0.1 * s, Math.sin(a) * 0.22 * s], [Math.sin(a) * 0.8, 0, -Math.cos(a) * 0.8])));
    const n = 7; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + r.frac(), rr = i === 0 ? 0 : 0.75 * s, y = (i === 0 ? 2.75 : 2.15 + r.frac() * 0.6) * s; p.push(P(puff((i === 0 ? 1.05 : 0.72 + r.frac() * 0.2) * s, i + r.frac() * 9), hex(c, 0.9 + r.frac() * 0.25), [Math.cos(a) * rr, y, Math.sin(a) * rr])); }
    if (r.frac() < 0.35) for (let i = 0; i < 5; i++) { const a = r.frac() * 6.28; p.push(P(sph(0.1 * s), 0xff4d4d, [Math.cos(a) * 1.0 * s, (2.2 + r.frac() * 0.8) * s, Math.sin(a) * 1.0 * s])); }
    return scen(p);
  },
  pine: (r) => {
    const s = r.between(1.0, 1.7), c = r.pick([0x1e9a52, 0x27ad5e, 0x2bb35a]);
    const p = [P(cyl(0.18 * s, 0.26 * s, 1.2 * s, 10), 0x7a4e2a, [0, 0.6 * s, 0])];
    for (let i = 0; i < 4; i++) { const k = 1 - i * 0.22; p.push(P(lathe([[0.0001, 0], [1.35 * k * s, 0.05], [1.25 * k * s, 0.22 * s], [0.0001, 1.6 * k * s]], 16), hex(c, 1 + i * 0.08), [0, (1.1 + i * 0.85) * s, 0])); }
    return scen(p);
  },
  bigtree: (r) => {
    const s = r.between(1.5, 2.1), c = r.pick([0x1fb85a, 0x2fc55a]);
    const p = [P(taper([[0, 0, 0], [0.1 * s, 1.6 * s, 0], [-0.1 * s, 3.2 * s, 0]], [0.75 * s, 0.5 * s, 0.38 * s], 10, 12), 0x8a5a35)];
    [0.5, 2.6, 4.4].forEach((a) => p.push(P(taper([[0, 2.6 * s, 0], [Math.cos(a) * 0.9 * s, 3.3 * s, Math.sin(a) * 0.9 * s], [Math.cos(a) * 1.4 * s, 3.9 * s, Math.sin(a) * 1.4 * s]], [0.22 * s, 0.15 * s, 0.1 * s], 8, 8), 0x8a5a35)));
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, rr = i === 0 ? 0 : 1.5 * s; p.push(P(puff((i === 0 ? 2.0 : 1.3) * s, i * 3 + 1), hex(c, 0.88 + r.frac() * 0.28), [Math.cos(a) * rr, (i === 0 ? 4.6 : 3.9 + r.frac()) * s, Math.sin(a) * rr])); }
    return scen(p);
  },
  bush: (r) => { const c = r.pick([0x2fc55a, 0x3bd36b]); const p = []; for (let i = 0; i < 5; i++) p.push(P(puff(0.45 + r.frac() * 0.25, i + 2), hex(c, 0.9 + r.frac() * 0.25), [-0.6 + i * 0.32, 0.42 + (i % 2) * 0.12, (r.frac() - 0.5) * 0.4])); for (let i = 0; i < 4; i++) p.push(P(sph(0.08), r.pick([0xff5d8f, 0xffd23f, 0xffffff]), [-0.5 + i * 0.35, 0.9 + (i % 2) * 0.1, -0.35])); return scen(p); },
  rock: (r) => { const s = r.between(0.9, 2.2), c = r.pick([0x9aa3b5, 0xa9b1c4, 0x8f98ab]); return scen([P(rockGeo(0.9 * s, r.frac() * 9, 0.16, 14, 10), c, [0, 0.45 * s, 0], [0, 0.5, 0], [1.15, 0.78, 1]), P(rockGeo(0.5 * s, r.frac() * 9, 0.16, 12, 9), hex(c, 1.1), [0.9 * s, 0.25 * s, 0.2], [0, 0.2, 0], [1, 0.8, 1]), P(puff(0.35 * s, 4), 0x59c24a, [-0.1 * s, 0.9 * s, 0], [0, 0, 0], [1.4, 0.45, 1.2])]); },
  lamp: () => scenLit([P(cyl(0.1, 0.14, 3.7, 12), 0x3b4558, [0, 1.85, 0]), P(cyl(0.2, 0.24, 0.3, 14), 0x3b4558, [0, 0.15, 0]), P(taper([[0, 3.6, 0], [0, 4.0, -0.25], [0, 3.95, -0.75]], [0.06, 0.05, 0.05], 10, 8), 0x3b4558), P(lathe([[0.0001, 0.3], [0.32, 0.0], [0.36, -0.05], [0.0001, -0.05]], 16), 0x3b4558, [0, 3.72, -0.8])], [[0, 3.6, -0.8, 0.16]]),
  mushroom: (r) => { const s = r.between(0.8, 1.6), col = r.pick([0xe8352f, 0xff8a1f, 0xb18cff]); return scen([P(lathe([[0.22 * s, 0], [0.2 * s, 0.4 * s], [0.18 * s, 0.7 * s], [0.0001, 0.72 * s]], 14), 0xfff3dc), P(lathe([[0.0001, 0.62 * s], [0.85 * s, 0.6 * s], [0.8 * s, 0.85 * s], [0.5 * s, 1.15 * s], [0.0001, 1.25 * s]], 18), col), P(sph(0.13 * s), 0xffffff, [0.35 * s, 1.0 * s, -0.3 * s], [0, 0, 0], [1, 0.6, 1]), P(sph(0.15 * s), 0xffffff, [-0.3 * s, 1.05 * s, 0.25 * s], [0, 0, 0], [1, 0.6, 1]), P(sph(0.1 * s), 0xffffff, [0, 1.2 * s, 0], [0, 0, 0], [1, 0.6, 1])]); },
  cloud: (r) => { const s = r.between(2, 4), g = new THREE.Group(), parts = [[0, 0, 0, 1.2], [1.3, -0.2, 0.2, 0.95], [-1.3, -0.25, 0, 0.9], [0.2, 0.3, 0.6, 0.8], [-0.5, 0.45, -0.3, 0.75]]; g.add(new THREE.Mesh(mergeParts(parts.map(([x, y, z, k], i) => P(new THREE.SphereGeometry(k * s, 14, 9), i % 2 ? 0xf4f9ff : 0xffffff, [x * s, y * s, z * s]))), toonFlat)); return g; },
  hill: (r) => { const s = r.between(14, 26); return scen([P(new THREE.SphereGeometry(1, 32, 16), r.pick([0x5fc87a, 0x4db38a, 0x7ad06a]), [0, 0, 0], [0, 0, 0], [s, s * 0.45, s * 0.8])]); },
  island: (r) => { const s = r.between(8, 14); return scen([P(new THREE.SphereGeometry(1, 32, 14), 0x5fc87a, [0, 0, 0], [0, 0, 0], [s, s * 0.32, s * 0.7]), P(new THREE.SphereGeometry(1, 32, 12), 0xf2d79a, [0, -0.15 * s, 0], [0, 0, 0], [s * 1.08, s * 0.18, s * 0.78])]); },
  darkhill: (r) => { const s = r.between(14, 26); return scen([P(new THREE.SphereGeometry(1, 32, 16), r.pick([0x6a4a40, 0x5a4038, 0x7a5448]), [0, 0, 0], [0, 0, 0], [s, s * 0.45, s * 0.8])]); },
  volcano: () => { const g = scen([P(lathe([[14, 0], [11, 4], [6.5, 11], [4.4, 14.2], [3.6, 14.4], [3.2, 13.6], [0.0001, 13.6]], 28), 0x8a5a4a), P(lathe([[3.7, 0], [3.4, 0.4], [0.0001, 0.4]], 24), 0xff6a1a, [0, 13.7, 0]), P(taper([[1.5, 14, -3.2], [3.5, 9, -5.5], [6, 3, -9.5]], [0.9, 0.8, 0.5], 12, 8), 0xff7a2a), P(sph(2.6), 0xffffff, [2.5, 19, 0], [0, 0, 0], [1.4, 0.8, 1]), P(sph(2.0), 0xe8eaf2, [4.5, 22, 0]), P(sph(1.6), 0xd9dde6, [5.5, 25, 0])]); return g; },
  shop: (r) => {
    const wall = r.pick(WALLS), aw = r.pick([0xe8352f, 0x2f78e0, 0xff8a1f, 0x3ecb6b]);
    const p = [P(box(5.2, 3.2, 4, 0.14), wall, [0, 1.6, 0]), P(box(5.5, 0.34, 4.3, 0.08), 0xffffff, [0, 3.35, 0])];
    for (let i = 0; i < 6; i++) p.push(P(box(0.88, 0.12, 1.2, 0.05), i % 2 ? 0xffffff : aw, [-2.2 + i * 0.88, 2.2, -2.5], [0.45, 0, 0]));
    p.push(P(box(1.9, 1.4, 0.1, 0.06), 0xffffff, [-1.2, 1.15, -2.02]), P(box(1.7, 1.2, 0.06, 0.04), 0xbfe6ff, [-1.2, 1.15, -2.06]), P(box(1.0, 1.8, 0.1, 0.05), 0x8a5a35, [1.4, 0.9, -2.03]), P(box(2.2, 0.62, 0.12, 0.08), 0xffd23f, [0, 2.85, -2.08]));
    for (let i = 0; i < 3; i++) p.push(P(sph(0.16), r.pick([0xff5d8f, 0xff8a1f, 0x3ecb6b]), [-1.75 + i * 0.5, 0.75, -2.1]));
    return scen(p);
  },
  car: (r) => {
    const c = r.pick([0xe8352f, 0x2f78e0, 0xffc92b, 0x3ecb6b, 0xff8a1f, 0xb18cff]);
    const p = [P(box(2.1, 0.7, 4.0, 0.3), c, [0, 0.62, 0]), P(box(1.8, 0.7, 2.1, 0.3), c, [0, 1.15, 0.15]), P(box(1.82, 0.42, 1.9, 0.14), 0xbfe6ff, [0, 1.2, 0.15]), P(box(2.15, 0.12, 4.05, 0.05), hex(c, 0.8), [0, 0.45, 0])];
    [[-0.95, 1.2], [0.95, 1.2], [-0.95, -1.2], [0.95, -1.2]].forEach(([x, z]) => p.push(P(cyl(0.38, 0.38, 0.3, 16), 0x2b2b2b, [x, 0.38, z], [0, 0, Math.PI / 2]), P(cyl(0.2, 0.2, 0.32, 12), 0xcfd5e0, [x, 0.38, z], [0, 0, Math.PI / 2])));
    p.push(P(sph(0.16), 0xfff2a8, [-0.6, 0.7, -2.0]), P(sph(0.16), 0xfff2a8, [0.6, 0.7, -2.0]), P(box(1.6, 0.16, 0.12, 0.06), 0xdfe6f1, [0, 0.4, -2.04]));
    return scen(p);
  },
};

// ------------------------------------------------------------------ carrinhos e bichinhos de passagem
export function buildFireTruck() {
  // viatura original: cabine com para-brisa e janelas, giroflex, escada com degraus, carretel de mangueira,
  // compartimentos laterais com puxadores, para-choques e rodas com calotas. Emblema fictício (estrela).
  const g = new THREE.Group(), R = 0xe8352f, D = 0xc62828, S = 0xdfe3ea, Y = 0xffd23f;
  const p = [
    P(box(2.25, 1.45, 4.3, 0.22), R, [0, 1.15, 0.6]), P(box(2.25, 1.8, 1.8, 0.3), D, [0, 1.3, -1.75]),
    P(box(1.95, 0.72, 0.1, 0.08), 0x9fdcff, [0, 1.75, -2.64]), P(box(0.08, 0.6, 1.0, 0.04), 0x9fdcff, [-1.13, 1.7, -1.8]), P(box(0.08, 0.6, 1.0, 0.04), 0x9fdcff, [1.13, 1.7, -1.8]),
    P(box(2.3, 0.16, 4.1, 0.05), Y, [0, 1.12, 0.6]), P(box(2.3, 0.1, 1.85, 0.04), Y, [0, 1.0, -1.75]),
    P(box(2.4, 0.32, 6.3, 0.14), 0x59616e, [0, 0.45, -0.1]), P(box(2.3, 0.3, 0.3, 0.12), S, [0, 0.55, -2.85]), P(box(1.4, 0.4, 0.06, 0.05), 0x8b94a6, [0, 0.95, -2.68]),
    P(sph(0.16), 0xfff2a8, [-0.82, 0.95, -2.68], [0, 0, 0], [1, 1, 0.5]), P(sph(0.16), 0xfff2a8, [0.82, 0.95, -2.68], [0, 0, 0], [1, 1, 0.5]),
    P(box(1.6, 0.16, 0.36, 0.08), 0x2b3350, [0, 2.3, -1.75]),
    P(cap(0.05, 3.8, 4, 8), S, [-0.6, 2.1, 0.6], [Math.PI / 2 - 0.06, 0, 0]), P(cap(0.05, 3.8, 4, 8), S, [0.6, 2.1, 0.6], [Math.PI / 2 - 0.06, 0, 0]),
    P(cyl(0.5, 0.5, 0.3, 22), 0x59616e, [1.0, 1.25, 1.6], [0, 0, Math.PI / 2]), P(tor(0.4, 0.09, 8, 22), Y, [1.18, 1.25, 1.6], [0, Math.PI / 2, 0]),
    P(cyl(0.22, 0.22, 0.04, 20), Y, [-1.14, 1.55, -1.75], [0, 0, Math.PI / 2]), P(slab([[-0.1, -0.08], [0.1, -0.08], [0, 0.12]], 0.03, 0.01), R, [-1.16, 1.55, -1.75], [0, Math.PI / 2, 0]),
  ];
  for (let i = 0; i < 7; i++) p.push(P(cyl(0.035, 0.035, 1.2, 8), S, [0, 2.12 - i * 0.017, -1.2 + i * 0.6], [0, 0, Math.PI / 2]));
  [-1, 1].forEach((sd) => { for (let k = 0; k < 3; k++) { p.push(P(box(0.06, 0.9, 1.0, 0.05), hex(R, 0.88), [sd * 1.13, 1.1, -0.4 + k * 1.1]), P(box(0.05, 0.06, 0.3, 0.03), S, [sd * 1.17, 1.05, -0.4 + k * 1.1])); } });
  [[-1.15, -1.7], [1.15, -1.7], [-1.15, 1.6], [1.15, 1.6]].forEach(([x, z]) => p.push(P(cyl(0.52, 0.52, 0.38, 22), 0x222222, [x, 0.52, z], [0, 0, Math.PI / 2]), P(cyl(0.3, 0.3, 0.4, 18), S, [x, 0.52, z], [0, 0, Math.PI / 2]), P(sph(0.1), Y, [x * 1.18, 0.52, z]), P(tor(0.62, 0.1, 8, 20, Math.PI), D, [x, 0.52, z], [0, Math.PI / 2, 0], [1, 1, 2.2])));
  g.add(toMesh(p, { thin: true }));
  const l1 = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 9), new THREE.MeshBasicMaterial({ color: 0x4db8ff })); l1.position.set(-0.55, 2.42, -1.75);
  const l2 = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 9), new THREE.MeshBasicMaterial({ color: 0xff3b3b })); l2.position.set(0.55, 2.42, -1.75);
  g.add(l1, l2); g.userData.lights = [l1, l2];
  return g;
}

// ------------------------------------------------------------------ estação do desafio da fase (baú brilhante com o ícone do desafio)
export function buildPuzzleStation(icon = 'puzzle') {
  const g = new THREE.Group();
  const base = toMesh([P(cyl(1.2, 1.35, 0.3, 24), 0x7a5adf, [0, 0.15, 0]), P(cyl(1.05, 1.05, 0.06, 24), 0xffd23f, [0, 0.31, 0]),
    P(box(1.4, 0.9, 1.0, 0.12), 0xff8a1f, [0, 0.8, 0]), P(box(1.5, 0.14, 1.1, 0.06), 0xffd23f, [0, 0.6, 0]), P(box(0.3, 0.32, 0.1, 0.05), 0xffd23f, [0, 0.9, -0.52])], { thin: true });
  g.add(base);
  const lid = new THREE.Group(); lid.position.set(0, 1.25, 0.5);
  lid.add(toMesh([P(box(1.46, 0.3, 1.06, 0.12), 0xff8a1f, [0, 0.1, -0.5]), P(box(1.5, 0.08, 1.1, 0.04), 0xffd23f, [0, -0.02, -0.5])], { thin: true }));
  g.add(lid);
  // ícone flutuante (desenhado em uma plaquinha)
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  x.fillStyle = '#2f9bff'; x.beginPath(); x.arc(64, 64, 58, 0, Math.PI * 2); x.fill(); x.lineWidth = 8; x.strokeStyle = '#1b2a49'; x.stroke();
  x.font = '64px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText({ puzzle: '🧩', maze: '🐶', apple: '🍎', hose: '🔥', boat: '⛵', lava: '🌋' }[icon] || '❓', 64, 70);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const sign = new THREE.Mesh(new THREE.CircleGeometry(0.62, 32), new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide }));
  const iconG = new THREE.Group(); iconG.add(sign); iconG.position.y = 2.9; g.add(iconG);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.06, 8, 40), new THREE.MeshBasicMaterial({ color: 0xffe14a })); ring.rotation.x = Math.PI / 2; ring.position.y = 0.34; g.add(ring);
  g.userData = { lid, icon: iconG, ring };
  return g;
}
