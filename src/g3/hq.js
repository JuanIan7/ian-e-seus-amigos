// Modelos em níveis de qualidade para comparação (fase 1: bairro).
//  - 'alta': mesmo estilo cartoon do jogo, com muito mais forma e detalhe (geometria).
//  - 'muito': materiais físicos (luz e reflexo reais), texturas desenhadas por código, sombras projetadas.
// Tudo é gerado por código, sem imagens externas.
import { THREE, P, sph, box, cyl, cone, cap, tor, dome, lathe, taper, slab, rockGeo, toMesh, hex } from './kit.js';

// ------------------------------------------------------------------ texturas desenhadas por código
const texCache = {};
function canvasTex(key, w, h, draw, repeat = [1, 1], srgb = true) {
  const k = key + repeat.join('x');
  if (texCache[k]) return texCache[k];
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); draw(x, w, h);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace; texCache[k] = t; return t;
}
const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
const T = {
  bark: (rep = [2, 3]) => canvasTex('bark', 128, 256, (x, w, h) => {
    x.fillStyle = '#7a4e2c'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) { const px = rnd() * w, wd = 2 + rnd() * 5; x.fillStyle = rnd() < 0.5 ? 'rgba(60,35,18,.55)' : 'rgba(150,105,65,.35)'; x.beginPath(); x.moveTo(px, 0); for (let y = 0; y <= h; y += 16) x.lineTo(px + Math.sin(y * 0.05 + i) * 4, y); x.lineTo(px + wd, h); x.lineTo(px + wd, 0); x.fill(); }
  }, rep),
  leaf: () => canvasTex('leaf', 64, 64, (x, w, h) => {
    x.clearRect(0, 0, w, h); x.fillStyle = '#ffffff'; x.beginPath(); x.moveTo(32, 3); x.quadraticCurveTo(60, 26, 32, 61); x.quadraticCurveTo(4, 26, 32, 3); x.fill();
    x.strokeStyle = 'rgba(0,0,0,.25)'; x.lineWidth = 2; x.beginPath(); x.moveTo(32, 8); x.lineTo(32, 58); x.stroke();
  }),
  plaster: (col, rep = [3, 2]) => canvasTex('plaster' + col, 128, 128, (x, w, h) => {
    x.fillStyle = col; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) { x.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.05)'; x.fillRect(rnd() * w, rnd() * h, 2, 2); }
    x.strokeStyle = 'rgba(0,0,0,.08)'; x.lineWidth = 2; for (let y = 0; y < h; y += 16) { x.beginPath(); x.moveTo(0, y); x.lineTo(w, y); x.stroke(); }
  }, rep),
  shingle: (col, rep = [4, 3]) => canvasTex('shingle' + col, 128, 128, (x, w, h) => {
    x.fillStyle = col; x.fillRect(0, 0, w, h);
    for (let row = 0; row < 8; row++) for (let i = -1; i < 9; i++) {
      const cx = i * 16 + (row % 2) * 8, cy = row * 16; x.fillStyle = `rgba(${rnd() < 0.5 ? '255,255,255' : '0,0,0'},${0.04 + rnd() * 0.08})`;
      x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + 15, cy); x.lineTo(cx + 15, cy + 10); x.quadraticCurveTo(cx + 7.5, cy + 17, cx, cy + 10); x.closePath(); x.fill();
      x.strokeStyle = 'rgba(0,0,0,.28)'; x.lineWidth = 1.5; x.stroke();
    }
  }, rep),
  brick: (rep = [3, 1]) => canvasTex('brick', 128, 64, (x, w, h) => {
    x.fillStyle = '#d9cbb5'; x.fillRect(0, 0, w, h);
    for (let r = 0; r < 4; r++) for (let i = -1; i < 5; i++) { const bx = i * 32 + (r % 2) * 16, by = r * 16; x.fillStyle = `hsl(${12 + rnd() * 8},${45 + rnd() * 15}%,${40 + rnd() * 10}%)`; x.fillRect(bx + 1.5, by + 1.5, 29, 13); }
  }, rep),
  wood: (rep = [1, 1], col = '#9a6236') => canvasTex('wood' + col, 128, 128, (x, w, h) => {
    x.fillStyle = col; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { x.strokeStyle = `rgba(${rnd() < 0.5 ? '60,30,10' : '200,150,100'},${0.15 + rnd() * 0.2})`; x.lineWidth = 1 + rnd() * 2; x.beginPath(); const yy = rnd() * h; x.moveTo(0, yy); x.bezierCurveTo(w * 0.3, yy + 6, w * 0.6, yy - 6, w, yy + 2); x.stroke(); }
    x.fillStyle = 'rgba(0,0,0,.25)'; for (let i = 1; i < 4; i++) x.fillRect(0, i * 32 - 1, w, 2);
  }, rep),
  asphalt: (rep = [4, 4]) => canvasTex('asph', 128, 128, (x, w, h) => { x.fillStyle = '#4a5162'; x.fillRect(0, 0, w, h); for (let i = 0; i < 1600; i++) { x.fillStyle = `rgba(${rnd() < 0.5 ? '255,255,255' : '0,0,0'},${rnd() * 0.12})`; x.fillRect(rnd() * w, rnd() * h, 2, 2); } }, rep),
  grass: (rep = [6, 6]) => canvasTex('grass', 128, 128, (x, w, h) => { x.fillStyle = '#5bcf68'; x.fillRect(0, 0, w, h); for (let i = 0; i < 700; i++) { x.strokeStyle = `rgba(${rnd() < 0.5 ? '40,140,60' : '140,230,120'},.5)`; x.lineWidth = 1.2; const px = rnd() * w, py = rnd() * h; x.beginPath(); x.moveTo(px, py); x.lineTo(px + (rnd() - 0.5) * 3, py - 4 - rnd() * 4); x.stroke(); } }, rep),
  stripes: (a, b, n = 4) => canvasTex('stripes' + a + b + n, 64, 64, (x, w, h) => { for (let i = 0; i < n; i++) { x.fillStyle = i % 2 ? b : a; x.fillRect(0, i * h / n, w, h / n); } }),
};
export const TEX = T;

// ------------------------------------------------------------------ materiais físicos
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0, ...o });
const MAT = {
  chrome: () => std(0xdfe4ec, { metalness: 1, roughness: 0.18 }),
  darkMetal: () => std(0x2f3542, { metalness: 0.75, roughness: 0.35 }),
  glass: () => new THREE.MeshPhysicalMaterial({ color: 0x9fd6ff, metalness: 0.1, roughness: 0.05, transparent: true, opacity: 0.55, envMapIntensity: 1.6 }),
  window: () => std(0x86c6f2, { metalness: 0.3, roughness: 0.08, envMapIntensity: 1.8 }),
  rubber: () => std(0x1e1f24, { roughness: 0.92 }),
  paint: (c) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.32, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.08 }),
  emissive: (c, k = 2) => std(c, { emissive: c, emissiveIntensity: k }),
};
function mesh(geo, mat, p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1]) { const m = new THREE.Mesh(geo, mat); m.position.set(p[0], p[1], p[2]); m.rotation.set(r[0], r[1], r[2]); m.scale.set(s[0], s[1], s[2]); m.castShadow = true; m.receiveShadow = true; return m; }
function grp(...ch) { const g = new THREE.Group(); ch.forEach((c) => c && g.add(c)); return g; }
const RBox = (w, h, d, r = 0.05, seg = 3) => { const g = box(w, h, d, r); return g; };
let glowTex = null;
function glowSprite(col = 0xfff2c0, size = 1, op = 0.8) {
  if (!glowTex) { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,255,255,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); glowTex = new THREE.CanvasTexture(c); }
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: col, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: op })); s.scale.setScalar(size); return s;
}

// =================================================================== ÁRVORE
function treeSkeleton(seed = 1) {
  // tronco + galhos (pontos), devolve também as pontas onde nasce a folhagem
  const R = (() => { let s = seed * 9301 + 49297; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  const trunk = { pts: [[0, 0, 0], [0.08, 0.9, 0.02], [-0.06, 1.8, 0.0], [0.03, 2.4, 0]], r: [0.36, 0.27, 0.21, 0.17] };
  const branches = [], tips = [[0.03, 3.0, 0]];
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * Math.PI * 2 + R() * 0.6, y0 = 1.7 + R() * 0.6, len = 1.0 + R() * 0.5;
    const tip = [Math.cos(a) * len, y0 + 0.7 + R() * 0.5, Math.sin(a) * len];
    branches.push({ pts: [[0, y0, 0], [Math.cos(a) * len * 0.45, y0 + 0.35, Math.sin(a) * len * 0.45], tip], r: [0.12, 0.08, 0.05] });
    tips.push(tip);
    // galhinho secundário
    const a2 = a + (R() - 0.5) * 1.2, t2 = [tip[0] + Math.cos(a2) * 0.5, tip[1] + 0.35, tip[2] + Math.sin(a2) * 0.5];
    branches.push({ pts: [[tip[0] * 0.7, tip[1] - 0.2, tip[2] * 0.7], [(tip[0] + t2[0]) / 2, tip[1] + 0.1, (tip[2] + t2[2]) / 2], t2], r: [0.05, 0.035, 0.02] });
    tips.push(t2);
  }
  const roots = [0, 1, 2, 3].map((i) => { const a = i / 4 * Math.PI * 2 + 0.4; return { pts: [[0, 0.35, 0], [Math.cos(a) * 0.35, 0.08, Math.sin(a) * 0.35], [Math.cos(a) * 0.6, -0.02, Math.sin(a) * 0.6]], r: [0.14, 0.1, 0.04] }; });
  return { trunk, branches, roots, tips, R };
}
// copa em forma de nuvem: muitos tufos sobre a superfície de um elipsoide + miolo, como árvore de animação
function canopyPuffs(R, cx = 0, cy = 3.0, rx = 1.55, ry = 1.15, n = 26) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const u = 1 - 2 * (i + 0.5) / n, th = i * 2.399963 + R() * 0.3, s = Math.sqrt(1 - u * u);
    const yy = u * ry; if (yy < -ry * 0.75) continue;
    out.push([cx + Math.cos(th) * s * rx, cy + yy, Math.sin(th) * s * rx * 0.9, 0.42 + R() * 0.22]);
  }
  out.push([cx, cy, 0, Math.min(rx, ry) * 0.95]);
  return out;
}
export function treeAlta(c = 0x3bc65e) {
  const sk = treeSkeleton(3), wood = [], leaf = [];
  [sk.trunk, ...sk.roots].forEach((b) => wood.push(P(taper(b.pts, b.r, 14, 14), 0x8a5a35)));
  sk.branches.slice(0, 6).forEach((b) => wood.push(P(taper(b.pts.map(([x, y, z]) => [x * 0.6, Math.min(y, 2.9), z * 0.6]), b.r, 10, 10), 0x7e5030)));
  const puffs = canopyPuffs(sk.R);
  puffs.forEach(([x, y, z, r], i) => { const k = 0.72 + 0.5 * (y - 1.9) / 2.2; leaf.push(P(rockGeo(r, i * 1.7 + 0.3, 0.1, 18, 13), hex(c, Math.max(0.62, Math.min(1.2, k))), [x, y, z])); });
  // tufinhos mais claros no topo (brilho do sol) e frutinhas
  puffs.filter((q) => q[1] > 3.3).forEach(([x, y, z, r], i) => leaf.push(P(rockGeo(r * 0.55, i + 9, 0.1), hex(c, 1.28), [x - 0.08, y + r * 0.55, z - 0.08])));
  puffs.filter((q, i) => q[1] < 3.2 && q[2] < 0 && i % 3 === 0).forEach(([x, y, z, r]) => leaf.push(P(sph(0.09), 0xff4d4d, [x * 1.08, y - r * 0.4, z * 1.08 - 0.25])));
  const g = grp(toMesh(wood, { thin: true }), toMesh(leaf, { outline: false }));
  return g;
}
export function treeMuito(c = 0x3aa852, seed = 3) {
  const sk = treeSkeleton(seed), g = new THREE.Group(), bark = std(0xffffff, { map: T.bark([3, 1]), bumpMap: T.bark([3, 1]), bumpScale: 3, roughness: 0.95 });
  [sk.trunk, ...sk.roots].forEach((b) => g.add(mesh(taper(b.pts, b.r, 24, 18), bark)));
  sk.branches.slice(0, 6).forEach((b) => g.add(mesh(taper(b.pts.map(([x, y, z]) => [x * 0.6, Math.min(y, 2.9), z * 0.6]), b.r, 14, 12), bark)));
  // miolo escuro (dá profundidade) + 3200 folhas individuais distribuídas na casca de cada tufo
  const puffs = canopyPuffs(sk.R), core = std(hex(c, 0.42), { roughness: 1 });
  puffs.forEach(([x, y, z, r], i) => g.add(mesh(rockGeo(r * 0.82, i * 1.7, 0.12, 16, 12), core, [x, y, z])));
  const leafGeo = new THREE.PlaneGeometry(0.3, 0.3); leafGeo.translate(0, 0.12, 0);
  const leafMat = std(0xffffff, { map: T.leaf(), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.6 });
  const N = 3200, inst = new THREE.InstancedMesh(leafGeo, leafMat, N), d = new THREE.Object3D(), col = new THREE.Color(), n = new THREE.Vector3();
  for (let i = 0; i < N; i++) {
    const [px, py, pz, r] = puffs[i % puffs.length], u = sk.R() * 2 - 1, th = sk.R() * Math.PI * 2, s = Math.sqrt(1 - u * u);
    n.set(Math.cos(th) * s, u, Math.sin(th) * s); const rr = r * (0.82 + sk.R() * 0.28);
    d.position.set(px + n.x * rr, py + n.y * rr, pz + n.z * rr); d.lookAt(d.position.x + n.x + (sk.R() - 0.5), d.position.y + n.y + 0.6, d.position.z + n.z + (sk.R() - 0.5)); d.rotateZ(sk.R() * 6.28);
    d.scale.setScalar(0.75 + sk.R() * 0.6); d.updateMatrix(); inst.setMatrixAt(i, d.matrix);
    const k = 0.7 + 0.45 * ((d.position.y - 2.0) / 2.2) + n.y * 0.12 + (sk.R() - 0.5) * 0.22; col.set(c).multiplyScalar(Math.max(0.45, Math.min(1.3, k))); col.offsetHSL((sk.R() - 0.5) * 0.05, 0, 0); inst.setColorAt(i, col);
  }
  inst.castShadow = true; inst.receiveShadow = true;
  inst.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: T.leaf(), alphaTest: 0.5 });
  g.add(inst);
  puffs.filter((q, i) => q[1] < 3.2 && q[2] < 0 && i % 3 === 0).forEach(([x, y, z, r]) => g.add(mesh(sph(0.09), std(0xe8302f, { roughness: 0.3 }), [x * 1.08, y - r * 0.4, z * 1.08 - 0.3])));
  return g;
}


// =================================================================== CASA
function gableRoofParts(add, W, D, H, y, over) {
  const ang = Math.atan2(H, W / 2), len = Math.hypot(W / 2, H) + over;
  return [-1, 1].map((s) => ({ s, ang, len, cx: s * Math.cos(ang) * len / 2, cy: y + H - Math.sin(ang) * len / 2 }));
}
export function houseAlta(wall = 0xffd66b, roof = 0xe8352f) {
  const g = new THREE.Group(), W = 4.4, H = 2.6, D = 3.6, RH = 1.5, p = [];
  p.push(P(box(W, H, D, 0.14), wall, [0, H / 2, 0]));
  // base de tijolinhos e faixas de madeira (siding)
  p.push(P(box(W + 0.12, 0.55, D + 0.12, 0.08), 0xc4704a, [0, 0.27, 0]));
  for (let i = 0; i < 7; i++) p.push(P(box(W + 0.04, 0.035, D + 0.04, 0.015), hex(wall, 0.9), [0, 0.75 + i * 0.27, 0]));
  [-1, 1].forEach((s) => p.push(P(slab([[-W / 2, 0], [W / 2, 0], [0, RH]], 0.1, 0.03), wall, [0, H, s * (D / 2 - 0.05)])));
  // telhado com fileiras de telhas sobrepostas, calha e cumeeira
  gableRoofParts(null, W, D, RH, H, 0.42).forEach(({ s, ang, len }) => {
    for (let k = 0; k < 7; k++) { const t = (k + 0.5) / 7; p.push(P(box(len / 7 + 0.08, 0.13, D + 0.84, 0.05), hex(roof, 0.86 + (k % 2) * 0.14), [s * Math.cos(ang) * len * t, H + RH - Math.sin(ang) * len * t + 0.05, 0], [0, 0, -s * ang])); }
    p.push(P(cyl(0.07, 0.07, D + 0.9, 12), 0xdfe6f1, [s * Math.cos(ang) * len, H + RH - Math.sin(ang) * len - 0.02, 0], [Math.PI / 2, 0, 0]));
  });
  p.push(P(cyl(0.13, 0.13, D + 0.9, 14), hex(roof, 0.7), [0, H + RH + 0.05, 0], [Math.PI / 2, 0, 0]));
  // chaminé de tijolos
  p.push(P(box(0.6, 1.4, 0.6, 0.06), 0xc4704a, [1.3, H + 1.25, 0.45]), P(box(0.76, 0.14, 0.76, 0.05), 0x8a3a24, [1.3, H + 1.98, 0.45]));
  // varandinha com colunas e telhadinho sobre a porta
  const fz = -D / 2;
  p.push(P(box(1.9, 0.18, 1.0, 0.06), 0xd9c7a0, [0, 0.09, fz - 0.5]), P(box(1.5, 0.12, 0.35, 0.04), 0xcfc4ac, [0, 0.06, fz - 1.15]));
  [-0.8, 0.8].forEach((x) => p.push(P(cyl(0.07, 0.08, 1.95, 14), 0xffffff, [x, 1.15, fz - 0.88]), P(box(0.2, 0.1, 0.2, 0.04), 0xffffff, [x, 0.2, fz - 0.88])));
  p.push(P(slab([[-1.1, 0], [1.1, 0], [0, 0.5]], 1.05, 0.04), roof, [0, 2.12, fz - 0.45], [0, 0, 0]));
  p.push(P(box(2.2, 0.12, 1.1, 0.04), 0xffffff, [0, 2.12, fz - 0.47]));
  // porta com almofadas e vidrinho; luminária
  p.push(P(box(1.0, 1.75, 0.08, 0.04), 0xffffff, [0, 1.0, fz - 0.02]), P(box(0.82, 1.62, 0.08, 0.04), 0x2f78e0, [0, 0.95, fz - 0.05]));
  [[-0.2, 0.6], [0.2, 0.6], [-0.2, 1.05], [0.2, 1.05]].forEach(([x, y]) => p.push(P(box(0.28, 0.32, 0.04, 0.03), hex(0x2f78e0, 1.15), [x, y, fz - 0.1])));
  p.push(P(box(0.5, 0.22, 0.04, 0.03), 0xbfe6ff, [0, 1.52, fz - 0.1]), P(sph(0.055), 0xffd23f, [0.3, 0.92, fz - 0.14]));
  // janelas com moldura, peitoril, venezianas e floreira
  [-1.55, 1.55].forEach((x) => {
    p.push(P(box(0.98, 0.98, 0.08, 0.04), 0xffffff, [x, 1.5, fz - 0.03]), P(box(0.8, 0.8, 0.06, 0.03), 0x9fd6ff, [x, 1.5, fz - 0.05]), P(box(0.04, 0.8, 0.04, 0.01), 0xffffff, [x, 1.5, fz - 0.09]), P(box(0.8, 0.04, 0.04, 0.01), 0xffffff, [x, 1.5, fz - 0.09]));
    p.push(P(box(0.26, 0.24, 0.02, 0.01), 0xffffff, [x - 0.18, 1.7, fz - 0.09]));
    [-1, 1].forEach((s) => { p.push(P(box(0.36, 1.0, 0.06, 0.03), hex(roof, 0.9), [x + s * 0.68, 1.5, fz - 0.02])); for (let k = 0; k < 5; k++) p.push(P(box(0.3, 0.03, 0.02, 0.01), hex(roof, 0.75), [x + s * 0.68, 1.15 + k * 0.17, fz - 0.06])); });
    p.push(P(box(1.08, 0.08, 0.2, 0.03), 0xffffff, [x, 1.0, fz - 0.1]), P(box(0.95, 0.2, 0.22, 0.05), 0x9a6a3a, [x, 0.85, fz - 0.18]));
    for (let k = 0; k < 5; k++) p.push(P(sph(0.075), [0xff5d8f, 0xffd23f, 0xff8a1f, 0xffffff, 0xb18cff][k], [x - 0.36 + k * 0.18, 1.0, fz - 0.2]), P(sph(0.07), 0x3ecb6b, [x - 0.27 + k * 0.18, 0.96, fz - 0.22], [0, 0, 0], [1, 0.6, 1]));
  });
  // janela redonda no oitão
  p.push(P(cyl(0.3, 0.3, 0.08, 22), 0xffffff, [0, H + 0.6, fz - 0.03], [Math.PI / 2, 0, 0]), P(cyl(0.24, 0.24, 0.08, 22), 0x9fd6ff, [0, H + 0.6, fz - 0.05], [Math.PI / 2, 0, 0]));
  g.add(toMesh(p, { thin: true }));
  // canteiro e caixa de correio
  const q = [P(box(0.12, 1.0, 0.12, 0.04), 0xffffff, [-2.6, 0.5, fz - 1.4]), P(box(0.36, 0.3, 0.5, 0.12), 0x2f78e0, [-2.6, 1.1, fz - 1.4]), P(slab([[0, 0], [0.2, 0.1], [0, 0.2]], 0.02, 0.01), 0xe8352f, [-2.4, 1.25, fz - 1.3])];
  for (let i = 0; i < 6; i++) q.push(P(rockGeo(0.28, i, 0.14), 0x3bc65e, [1.7 + (i % 3) * 0.5, 0.25, fz - 0.4 - Math.floor(i / 3) * 0.35]));
  g.add(toMesh(q, { thin: true }));
  return g;
}
export function houseMuito(wallCol = '#ffd66b', roofCol = '#d9372f') {
  const g = new THREE.Group(), W = 4.4, H = 2.6, D = 3.6, RH = 1.5, fz = -D / 2;
  const wallM = std(0xffffff, { map: T.plaster(wallCol, [3, 2]), bumpMap: T.plaster(wallCol, [3, 2]), bumpScale: 1.2, roughness: 0.9 });
  const roofM = std(0xffffff, { map: T.shingle(roofCol, [4, 3]), bumpMap: T.shingle(roofCol, [4, 3]), bumpScale: 4, roughness: 0.75 });
  const trim = std(0xfafafa, { roughness: 0.5 }), brick = std(0xffffff, { map: T.brick([6, 1]), bumpMap: T.brick([6, 1]), bumpScale: 2, roughness: 0.9 });
  g.add(mesh(new THREE.BoxGeometry(W, H, D), wallM, [0, H / 2, 0]));
  g.add(mesh(new THREE.BoxGeometry(W + 0.12, 0.55, D + 0.12), brick, [0, 0.27, 0]));
  [-1, 1].forEach((s) => g.add(mesh(slab([[-W / 2, 0], [W / 2, 0], [0, RH]], 0.1, 0), wallM, [0, H, s * (D / 2 - 0.05)])));
  gableRoofParts(null, W, D, RH, H, 0.42).forEach(({ s, ang, len, cx, cy }) => {
    g.add(mesh(new THREE.BoxGeometry(len, 0.18, D + 0.84), roofM, [cx, cy + 0.04, 0], [0, 0, -s * ang]));
    g.add(mesh(cyl(0.07, 0.07, D + 0.9, 16), MAT.chrome(), [s * Math.cos(ang) * len, H + RH - Math.sin(ang) * len - 0.02, 0], [Math.PI / 2, 0, 0]));
  });
  g.add(mesh(cyl(0.13, 0.13, D + 0.9, 16), std(0x8a2a22, { roughness: 0.6 }), [0, H + RH + 0.05, 0], [Math.PI / 2, 0, 0]));
  g.add(mesh(new THREE.BoxGeometry(0.6, 1.4, 0.6), brick, [1.3, H + 1.25, 0.45]), mesh(new THREE.BoxGeometry(0.76, 0.14, 0.76), std(0x5a5f6a), [1.3, H + 1.98, 0.45]));
  // varanda
  g.add(mesh(new THREE.BoxGeometry(1.9, 0.18, 1.0), std(0xd9c7a0, { roughness: 0.85 }), [0, 0.09, fz - 0.5]));
  [-0.8, 0.8].forEach((x) => g.add(mesh(cyl(0.07, 0.08, 1.95, 18), trim, [x, 1.15, fz - 0.88])));
  g.add(mesh(slab([[-1.1, 0], [1.1, 0], [0, 0.5]], 1.05, 0), roofM, [0, 2.12, fz - 0.45]), mesh(new THREE.BoxGeometry(2.2, 0.12, 1.1), trim, [0, 2.12, fz - 0.47]));
  // porta de madeira, janelas de vidro que refletem o céu
  g.add(mesh(new THREE.BoxGeometry(1.0, 1.75, 0.08), trim, [0, 1.0, fz - 0.02]), mesh(new THREE.BoxGeometry(0.82, 1.62, 0.08), std(0xffffff, { map: T.wood([1, 2], '#3a6fd0'), roughness: 0.45 }), [0, 0.95, fz - 0.05]));
  g.add(mesh(sph(0.055), MAT.chrome(), [0.3, 0.92, fz - 0.12]));
  [-1.55, 1.55].forEach((x) => {
    g.add(mesh(new THREE.BoxGeometry(0.98, 0.98, 0.08), trim, [x, 1.5, fz - 0.03]), mesh(new THREE.BoxGeometry(0.8, 0.8, 0.04), MAT.window(), [x, 1.5, fz - 0.07]));
    g.add(mesh(new THREE.BoxGeometry(0.04, 0.8, 0.05), trim, [x, 1.5, fz - 0.1]), mesh(new THREE.BoxGeometry(0.8, 0.04, 0.05), trim, [x, 1.5, fz - 0.1]));
    [-1, 1].forEach((s) => g.add(mesh(new THREE.BoxGeometry(0.36, 1.0, 0.06), std(0xffffff, { map: T.wood([1, 3], '#b8322b'), roughness: 0.55 }), [x + s * 0.68, 1.5, fz - 0.02])));
    g.add(mesh(new THREE.BoxGeometry(0.95, 0.2, 0.22), std(0xffffff, { map: T.wood([2, 1]) }), [x, 0.85, fz - 0.18]));
    for (let k = 0; k < 5; k++) g.add(mesh(sph(0.075), std([0xff5d8f, 0xffd23f, 0xff8a1f, 0xffffff, 0xb18cff][k], { roughness: 0.5 }), [x - 0.36 + k * 0.18, 1.0, fz - 0.2]));
  });
  const lamp = mesh(sph(0.09), MAT.emissive(0xfff2a8, 3), [0.75, 1.85, fz - 0.15]); g.add(lamp);
  return g;
}

// =================================================================== PRÉDIO
export function towerAlta(floors = 5, wall = 0xb9c6dd) {
  const g = new THREE.Group(), h = floors * 1.9, W = 5.2, D = 3.6, fz = -D / 2, p = [];
  p.push(P(box(W, h, D, 0.16), wall, [0, h / 2, 0]));
  // pilastras nas quinas, cornija e marquise
  [-1, 1].forEach((s) => p.push(P(box(0.36, h, 0.36, 0.08), hex(wall, 0.85), [s * (W / 2 - 0.1), h / 2, fz + 0.1])));
  p.push(P(box(W + 0.4, 0.4, D + 0.4, 0.1), hex(wall, 0.7), [0, h + 0.2, 0]), P(box(W + 0.2, 0.5, D + 0.2, 0.1), 0x7b8cae, [0, 0.25, 0]));
  for (let f = 1; f < floors; f++) p.push(P(box(W + 0.12, 0.12, D + 0.12, 0.05), hex(wall, 0.82), [0, f * 1.9 + 0.2, 0]));
  for (let f = 1; f < floors; f++) for (let i = 0; i < 3; i++) {
    const x = -1.6 + i * 1.6, y = 1.25 + f * 1.9;
    p.push(P(box(1.1, 1.1, 0.12, 0.05), 0xffffff, [x, y, fz - 0.02]), P(box(0.92, 0.92, 0.06, 0.03), f % 2 ? 0x9fd6ff : 0xb5e2ff, [x, y, fz - 0.1]), P(box(0.04, 0.92, 0.04, 0.01), 0xffffff, [x, y, fz - 0.14]), P(box(1.2, 0.08, 0.24, 0.03), 0xffffff, [x, y - 0.6, fz - 0.1]));
    p.push(P(box(0.3, 0.3, 0.02, 0.01), 0xffffff, [x - 0.2, y + 0.2, fz - 0.14]));
    if (f % 2 === 0 && i !== 1) { // varanda com grade
      p.push(P(box(1.5, 0.12, 0.6, 0.05), 0xdfe6f1, [x, y - 0.62, fz - 0.35]), P(cap(0.03, 1.4, 4, 8), 0x59616e, [x, y - 0.1, fz - 0.62], [0, 0, Math.PI / 2]));
      for (let k = 0; k < 7; k++) p.push(P(cyl(0.022, 0.022, 0.5, 8), 0x59616e, [x - 0.66 + k * 0.22, y - 0.35, fz - 0.62]));
      p.push(P(rockGeo(0.18, f + i, 0.15), 0x3bc65e, [x + 0.5, y - 0.43, fz - 0.4]), P(cyl(0.12, 0.1, 0.18, 12), 0xc4704a, [x + 0.5, y - 0.52, fz - 0.4]));
    }
  }
  // térreo: vitrine, porta de vidro, toldo listrado e letreiro
  p.push(P(box(4.6, 1.4, 0.1, 0.05), 0xffffff, [0, 1.05, fz - 0.03]), P(box(1.5, 1.2, 0.06, 0.03), 0x9fd6ff, [-1.4, 1.05, fz - 0.06]), P(box(1.5, 1.2, 0.06, 0.03), 0x9fd6ff, [1.4, 1.05, fz - 0.06]), P(box(1.0, 1.3, 0.06, 0.03), 0x7fb8e0, [0, 1.0, fz - 0.06]));
  for (let i = 0; i < 9; i++) p.push(P(box(0.52, 0.08, 0.9, 0.03), i % 2 ? 0xffffff : 0xe8352f, [-2.08 + i * 0.52, 2.0, fz - 0.4], [0.42, 0, 0]));
  for (let i = 0; i < 9; i++) p.push(P(cyl(0.13, 0.13, 0.08, 14, 1), i % 2 ? 0xffffff : 0xe8352f, [-2.08 + i * 0.52, 1.78, fz - 0.78], [Math.PI / 2, 0, 0]));
  p.push(P(box(2.0, 0.42, 0.1, 0.06), 0xffd23f, [0, 2.45, fz - 0.06]));
  // telhado: caixa d'água, antena, ar-condicionado
  p.push(P(cyl(0.6, 0.6, 0.9, 20), 0xdfe6f1, [1.4, h + 0.85, 0.2]), P(cone(0.66, 0.4, 20), 0xc2573a, [1.4, h + 1.5, 0.2]), P(cyl(0.04, 0.04, 1.6, 8), 0x59616e, [-1.6, h + 1.0, 0.3]), P(sph(0.08), 0xe8352f, [-1.6, h + 1.85, 0.3]), P(box(0.9, 0.5, 0.7, 0.08), 0xdfe6f1, [-0.3, h + 0.65, 0.6]), P(cyl(0.2, 0.2, 0.04, 16), 0x59616e, [-0.3, h + 0.92, 0.6]));
  g.add(toMesh(p, { thin: true }));
  return g;
}
export function towerMuito(floors = 5) {
  const g = new THREE.Group(), h = floors * 1.9, W = 5.2, D = 3.6, fz = -D / 2;
  const wallM = std(0xffffff, { map: T.plaster('#c4d2e8', [3, 4]), bumpMap: T.plaster('#c4d2e8', [3, 4]), bumpScale: 1, roughness: 0.85 });
  const trim = std(0xf4f4f4, { roughness: 0.5 }), glass = MAT.window(), metal = MAT.darkMetal();
  g.add(mesh(new THREE.BoxGeometry(W, h, D), wallM, [0, h / 2, 0]));
  [-1, 1].forEach((s) => g.add(mesh(new THREE.BoxGeometry(0.36, h, 0.36), std(0x9aa8c2, { roughness: 0.7 }), [s * (W / 2 - 0.1), h / 2, fz + 0.1])));
  g.add(mesh(new THREE.BoxGeometry(W + 0.4, 0.4, D + 0.4), std(0x7b8cae), [0, h + 0.2, 0]), mesh(new THREE.BoxGeometry(W + 0.2, 0.5, D + 0.2), std(0x6b7a99), [0, 0.25, 0]));
  for (let f = 1; f < floors; f++) for (let i = 0; i < 3; i++) {
    const x = -1.6 + i * 1.6, y = 1.25 + f * 1.9;
    g.add(mesh(new THREE.BoxGeometry(1.1, 1.1, 0.1), trim, [x, y, fz - 0.02]), mesh(new THREE.BoxGeometry(0.92, 0.92, 0.04), glass, [x, y, fz - 0.09]), mesh(new THREE.BoxGeometry(1.2, 0.08, 0.24), trim, [x, y - 0.6, fz - 0.1]));
    if (f % 2 === 0 && i !== 1) {
      g.add(mesh(new THREE.BoxGeometry(1.5, 0.12, 0.6), std(0xdfe6f1), [x, y - 0.62, fz - 0.35]));
      g.add(mesh(new THREE.BoxGeometry(1.5, 0.5, 0.02), MAT.glass(), [x, y - 0.33, fz - 0.64]), mesh(cap(0.025, 1.45, 4, 8), MAT.chrome(), [x, y - 0.07, fz - 0.64], [0, 0, Math.PI / 2]));
    }
  }
  g.add(mesh(new THREE.BoxGeometry(4.6, 1.4, 0.1), trim, [0, 1.05, fz - 0.03]), mesh(new THREE.BoxGeometry(4.4, 1.25, 0.04), glass, [0, 1.05, fz - 0.07]));
  const aw = std(0xffffff, { map: T.stripes('#e8352f', '#ffffff', 8), roughness: 0.8, side: THREE.DoubleSide });
  aw.map.rotation = Math.PI / 2; g.add(mesh(new THREE.PlaneGeometry(4.6, 0.95), aw, [0, 2.0, fz - 0.4], [-Math.PI / 2 + 0.42, 0, 0]));
  g.add(mesh(new THREE.BoxGeometry(2.0, 0.42, 0.1), MAT.emissive(0xffd23f, 0.6), [0, 2.45, fz - 0.06]));
  g.add(mesh(cyl(0.6, 0.6, 0.9, 24), MAT.chrome(), [1.4, h + 0.85, 0.2]), mesh(cyl(0.04, 0.04, 1.6, 8), metal, [-1.6, h + 1.0, 0.3]), mesh(sph(0.08), MAT.emissive(0xff3030, 3), [-1.6, h + 1.85, 0.3]), mesh(new THREE.BoxGeometry(0.9, 0.5, 0.7), std(0xdfe6f1, { metalness: 0.4, roughness: 0.4 }), [-0.3, h + 0.65, 0.6]));
  return g;
}

// =================================================================== POSTE DE LUZ
export function lampAlta() {
  const p = [P(lathe([[0.3, 0], [0.3, 0.12], [0.22, 0.2], [0.2, 0.45], [0.14, 0.55], [0.11, 0.62], [0.11, 3.6], [0.14, 3.7], [0.0001, 3.72]], 20), 0x2f3a4f)];
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; p.push(P(cyl(0.018, 0.018, 2.8, 6), 0x3f4b63, [Math.cos(a) * 0.11, 2.1, Math.sin(a) * 0.11])); }
  p.push(P(taper([[0, 3.6, 0], [0, 4.05, -0.2], [0, 4.05, -0.7], [0, 3.85, -0.95]], [0.06, 0.055, 0.05, 0.05], 16, 10), 0x2f3a4f));
  p.push(P(taper([[0, 3.3, 0], [0, 3.55, -0.35], [0, 3.95, -0.55]], [0.03, 0.025, 0.02], 10, 8), 0x2f3a4f));
  p.push(P(lathe([[0.0001, 0.42], [0.1, 0.42], [0.36, 0.1], [0.42, 0.0], [0.36, -0.02], [0.0001, -0.02]], 20), 0x2f3a4f, [0, 3.45, -0.95]));
  p.push(P(sph(0.06), 0xffd23f, [0, 3.95, -0.95]));
  const g = grp(toMesh(p, { thin: true }));
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.17, 18, 12), new THREE.MeshBasicMaterial({ color: 0xfff6c8 })); bulb.position.set(0, 3.42, -0.95); g.add(bulb);
  const gl = glowSprite(0xfff0b0, 1.6, 0.7); gl.position.copy(bulb.position); g.add(gl);
  // cone de luz suave no chão
  const pool = new THREE.Mesh(new THREE.CircleGeometry(1.3, 32), new THREE.MeshBasicMaterial({ color: 0xfff2b0, transparent: true, opacity: 0.18, depthWrite: false })); pool.rotation.x = -Math.PI / 2; pool.position.set(0, 0.02, -0.95); g.add(pool);
  return g;
}
export function lampMuito() {
  const g = new THREE.Group(), iron = std(0x1f2633, { metalness: 0.85, roughness: 0.32 });
  g.add(mesh(lathe([[0.3, 0], [0.3, 0.12], [0.22, 0.2], [0.2, 0.45], [0.14, 0.55], [0.11, 0.62], [0.11, 3.6], [0.14, 3.7], [0.0001, 3.72]], 32), iron));
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; g.add(mesh(cyl(0.018, 0.018, 2.8, 8), iron, [Math.cos(a) * 0.11, 2.1, Math.sin(a) * 0.11])); }
  g.add(mesh(taper([[0, 3.6, 0], [0, 4.05, -0.2], [0, 4.05, -0.7], [0, 3.85, -0.95]], [0.06, 0.055, 0.05, 0.05], 24, 12), iron));
  g.add(mesh(lathe([[0.0001, 0.42], [0.1, 0.42], [0.36, 0.1], [0.42, 0.0], [0.36, -0.02], [0.0001, -0.02]], 32), iron, [0, 3.45, -0.95]));
  const bulb = mesh(new THREE.SphereGeometry(0.17, 24, 16), MAT.emissive(0xfff3c4, 6), [0, 3.42, -0.95]); bulb.castShadow = false; g.add(bulb);
  const glass = mesh(lathe([[0.3, -0.02], [0.24, -0.3], [0.0001, -0.34]], 24), MAT.glass(), [0, 3.45, -0.95]); glass.castShadow = false; g.add(glass);
  const light = new THREE.PointLight(0xffd99a, 18, 7, 1.6); light.position.set(0, 3.25, -0.95); g.add(light);
  const gl = glowSprite(0xffe3a0, 2.0, 0.85); gl.position.set(0, 3.4, -0.95); g.add(gl);
  return g;
}

// =================================================================== LIXEIRA COM FOGO
function flameTongues(n, scale, colors, seed = 1) {
  // várias "línguas" de fogo em gota, inclinadas, de tamanhos diferentes
  const R = (() => { let s = seed * 999; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2, r = i === 0 ? 0 : 0.18 + R() * 0.12, h = (i === 0 ? 1.15 : 0.6 + R() * 0.45) * scale;
    out.push({ x: Math.cos(a) * r * scale, z: Math.sin(a) * r * scale, h, w: (i === 0 ? 0.42 : 0.24 + R() * 0.1) * scale, lean: [Math.sin(a) * 0.25, Math.cos(a) * 0.25] });
  }
  return out;
}
const TONGUE = (w, h) => lathe([[0.0001, 0], [w * 0.7, h * 0.05], [w, h * 0.2], [w * 0.92, h * 0.42], [w * 0.6, h * 0.68], [w * 0.22, h * 0.9], [0.0001, h]], 20);
export function binFireAlta() {
  const g = new THREE.Group(), p = [];
  p.push(P(lathe([[0.0001, 0.06], [0.44, 0.06], [0.47, 0.2], [0.53, 1.08], [0.57, 1.12], [0.0001, 1.12]], 32), 0x2f9bff));
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; p.push(P(box(0.05, 0.8, 0.04, 0.02), 0x1f78d6, [Math.cos(a) * 0.5, 0.62, Math.sin(a) * 0.5], [0, -a, 0.05])); }
  p.push(P(tor(0.5, 0.03, 8, 30), 0x8bc7ff, [0, 0.4, 0], [Math.PI / 2, 0, 0]), P(tor(0.53, 0.035, 8, 30), 0x1f78d6, [0, 1.12, 0], [Math.PI / 2, 0, 0]));
  p.push(P(cyl(0.11, 0.11, 0.08, 16), 0x2b2b35, [-0.3, 0.1, 0.42], [0, 0, Math.PI / 2]), P(cyl(0.11, 0.11, 0.08, 16), 0x2b2b35, [0.3, 0.1, 0.42], [0, 0, Math.PI / 2]));
  // tampa aberta, lixo (papel, caixa) e reciclagem
  p.push(P(lathe([[0.6, 0], [0.62, 0.06], [0.55, 0.16], [0.3, 0.26], [0.0001, 0.28]], 28), 0x1f78d6, [0, 1.25, 0.62], [1.2, 0, 0]));
  p.push(P(box(0.3, 0.22, 0.25, 0.04), 0xd9a066, [0.15, 1.12, -0.1], [0.3, 0.4, 0.2]), P(sph(0.12), 0xffffff, [-0.18, 1.12, 0.05], [0, 0, 0], [1.3, 0.7, 1]));
  p.push(P(box(0.24, 0.24, 0.02, 0.02), 0xffffff, [0, 0.66, -0.505], [0.06, 0, 0]), P(slab([[-0.07, -0.06], [0.07, -0.06], [0.0, 0.08]], 0.02, 0.008), 0x3ecb6b, [0, 0.66, -0.52], [0.06, 0, 0]));
  g.add(toMesh(p, { thin: true }));
  // fogo: 6 línguas em 3 cores, brilho e brasinhas
  const fl = new THREE.Group(); fl.position.y = 1.08;
  flameTongues(6, 1.4, 0, 2).forEach((t, i) => {
    [[0xff4a12, 1, 0.82], [0xff9a1f, 0.7, 0.9], [0xfff06a, 0.4, 1]].forEach(([c, k, op], j) => {
      const m = new THREE.Mesh(TONGUE(t.w * k, t.h * (0.9 + j * 0.05)), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: op, depthWrite: false })); m.renderOrder = 6 + j; m.position.set(t.x, 0, t.z); m.rotation.set(t.lean[1] * 0.4, 0, t.lean[0] * 0.4); fl.add(m);
    });
  });
  const gl = glowSprite(0xff9a30, 3.2, 0.75); gl.position.y = 0.6; fl.add(gl);
  for (let i = 0; i < 10; i++) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffd23f })); e.position.set((Math.sin(i * 7) * 0.5), 1.0 + (i % 4) * 0.35, Math.cos(i * 5) * 0.4); fl.add(e); }
  g.add(fl);
  return g;
}
// chama com sombreador (ruído animado) — fogo "de verdade" em estilo cartoon
const flameShader = () => new THREE.ShaderMaterial({
  uniforms: { t: { value: 1.3 } }, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `varying vec2 vUv; uniform float t;
    float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
    float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
    void main(){ vec2 uv = vUv; float y = uv.y; float x = (uv.x - 0.5) * 2.0;
      float noise = n(vec2(uv.x*5.0, uv.y*4.0 - t*3.0)) * 0.6 + n(vec2(uv.x*11.0, uv.y*9.0 - t*5.0)) * 0.4;
      float shape = (1.0 - y) * 1.25 - abs(x) * (0.55 + y * 1.1) + noise * 0.5 - 0.12;
      float a = smoothstep(0.0, 0.18, shape) * smoothstep(0.0, 0.12, uv.x) * smoothstep(1.0, 0.88, uv.x) * smoothstep(1.0, 0.9, uv.y);
      vec3 c = mix(vec3(1.0,0.25,0.03), vec3(1.0,0.62,0.1), smoothstep(0.1,0.45,shape)); c = mix(c, vec3(1.0,0.95,0.55), smoothstep(0.45,0.85,shape));
      gl_FragColor = vec4(c, a); }`,
});
export function binFireMuito() {
  const g = new THREE.Group(), plastic = std(0x2f8fef, { roughness: 0.38 });
  g.add(mesh(lathe([[0.0001, 0.06], [0.44, 0.06], [0.47, 0.2], [0.53, 1.08], [0.57, 1.12], [0.5, 1.1], [0.45, 0.25], [0.0001, 0.25]], 40), plastic));
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; g.add(mesh(box(0.05, 0.8, 0.04, 0.02), std(0x1f78d6, { roughness: 0.4 }), [Math.cos(a) * 0.5, 0.62, Math.sin(a) * 0.5], [0, -a, 0.05])); }
  g.add(mesh(tor(0.53, 0.035, 10, 40), std(0x1f78d6, { roughness: 0.4 }), [0, 1.12, 0], [Math.PI / 2, 0, 0]));
  [-0.3, 0.3].forEach((x) => g.add(mesh(cyl(0.11, 0.11, 0.08, 20), MAT.rubber(), [x, 0.1, 0.42], [0, 0, Math.PI / 2])));
  g.add(mesh(lathe([[0.6, 0], [0.62, 0.06], [0.55, 0.16], [0.3, 0.26], [0.0001, 0.28]], 36), std(0x1f78d6, { roughness: 0.4 }), [0, 1.25, 0.62], [1.2, 0, 0]));
  g.add(mesh(box(0.3, 0.22, 0.25, 0.04), std(0xffffff, { map: T.wood([1, 1], '#c99a62') }), [0.15, 1.08, -0.1], [0.3, 0.4, 0.2]));
  // fogo: três planos cruzados com sombreador de chama + luz laranja que ilumina a lixeira e o chão
  const fl = new THREE.Group(); fl.position.y = 1.0;
  for (let i = 0; i < 2; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 2.1), flameShader()); m.position.y = 1.0; m.rotation.y = 0.55 + i * Math.PI / 2; m.renderOrder = 8; fl.add(m); }
  const core = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.2), flameShader()); core.position.y = 0.55; core.rotation.y = 0.55 + Math.PI / 4; core.renderOrder = 9; fl.add(core);
  const gl = glowSprite(0xff8a30, 2.6, 0.35); gl.position.y = 0.7; fl.add(gl);
  const pl = new THREE.PointLight(0xff7a2a, 25, 6, 1.5); pl.position.set(0, 0.8, -0.2); fl.add(pl);
  for (let i = 0; i < 7; i++) { const s = glowSprite(0x777b88, 0.7 + i * 0.22, 0.28); s.material.blending = THREE.NormalBlending; s.position.set(Math.sin(i) * 0.25, 2.2 + i * 0.38, Math.cos(i * 2) * 0.15); fl.add(s); }
  g.add(fl);
  return g;
}

// =================================================================== VIATURA DE BOMBEIROS
function truckParts(p, R, D, S, Y) {
  p.push(P(box(2.25, 1.45, 4.3, 0.24), R, [0, 1.15, 0.6]), P(box(2.25, 1.85, 1.85, 0.32), D, [0, 1.32, -1.75]));
  p.push(P(box(1.95, 0.75, 0.1, 0.1), 0x9fd6ff, [0, 1.78, -2.66]), P(box(0.08, 0.62, 1.05, 0.05), 0x9fd6ff, [-1.13, 1.72, -1.82]), P(box(0.08, 0.62, 1.05, 0.05), 0x9fd6ff, [1.13, 1.72, -1.82]));
  p.push(P(box(2.32, 0.18, 4.15, 0.06), Y, [0, 1.12, 0.6]), P(box(2.32, 0.08, 4.15, 0.03), 0xffffff, [0, 0.95, 0.6]), P(box(2.3, 0.12, 1.9, 0.05), Y, [0, 1.02, -1.75]));
  p.push(P(box(2.42, 0.34, 6.4, 0.16), 0x4a515e, [0, 0.45, -0.1]), P(box(2.36, 0.34, 0.32, 0.14), S, [0, 0.55, -2.88]));
  for (let i = 0; i < 6; i++) p.push(P(box(1.3, 0.05, 0.06, 0.02), S, [0, 0.82 + i * 0.07, -2.69]));
  [-0.82, 0.82].forEach((x) => p.push(P(cyl(0.17, 0.17, 0.06, 18), S, [x, 0.95, -2.69], [Math.PI / 2, 0, 0]), P(sph(0.14), 0xfff2a8, [x, 0.95, -2.71], [0, 0, 0], [1, 1, 0.45])));
  p.push(P(box(1.7, 0.18, 0.4, 0.09), 0x2b3350, [0, 2.32, -1.75]));
  // escada com degraus, carretel, compartimentos, espelhos
  p.push(P(cap(0.05, 4.0, 4, 8), S, [-0.6, 2.12, 0.55], [Math.PI / 2 - 0.05, 0, 0]), P(cap(0.05, 4.0, 4, 8), S, [0.6, 2.12, 0.55], [Math.PI / 2 - 0.05, 0, 0]));
  for (let i = 0; i < 8; i++) p.push(P(cyl(0.032, 0.032, 1.2, 10), S, [0, 2.13 - i * 0.013, -1.25 + i * 0.52], [0, 0, Math.PI / 2]));
  p.push(P(cyl(0.5, 0.5, 0.3, 26), 0x59616e, [1.0, 1.25, 1.6], [0, 0, Math.PI / 2]), P(tor(0.4, 0.09, 10, 28), Y, [1.18, 1.25, 1.6], [0, Math.PI / 2, 0]));
  [-1, 1].forEach((sd) => { for (let k = 0; k < 3; k++) p.push(P(box(0.06, 0.92, 1.0, 0.05), hex(R, 0.88), [sd * 1.14, 1.1, -0.42 + k * 1.1]), P(box(0.05, 0.06, 0.32, 0.03), S, [sd * 1.18, 1.05, -0.42 + k * 1.1])); p.push(P(box(0.05, 0.3, 0.2, 0.04), 0x2b3350, [sd * 1.32, 1.8, -2.35]), P(cyl(0.02, 0.02, 0.2, 6), 0x2b3350, [sd * 1.22, 1.8, -2.35], [0, 0, Math.PI / 2])); });
  p.push(P(cyl(0.24, 0.24, 0.04, 22), Y, [-1.15, 1.55, -1.75], [0, 0, Math.PI / 2]), P(slab([[0, 0.12], [0.035, 0.035], [0.12, 0.035], [0.05, -0.02], [0.075, -0.11], [0, -0.055], [-0.075, -0.11], [-0.05, -0.02], [-0.12, 0.035], [-0.035, 0.035]], 0.03, 0.01), R, [-1.17, 1.55, -1.75], [0, Math.PI / 2, 0]));
}
export function truckAlta() {
  const g = new THREE.Group(), R = 0xe8352f, D = 0xc62828, S = 0xdfe3ea, Y = 0xffd23f, p = [];
  truckParts(p, R, D, S, Y);
  [[-1.15, -1.7], [1.15, -1.7], [-1.15, 1.6], [1.15, 1.6]].forEach(([x, z]) => {
    p.push(P(cyl(0.52, 0.52, 0.38, 26), 0x222222, [x, 0.52, z], [0, 0, Math.PI / 2]), P(tor(0.46, 0.06, 8, 26), 0x333333, [x * 1.08, 0.52, z], [0, Math.PI / 2, 0]), P(cyl(0.3, 0.3, 0.4, 20), S, [x, 0.52, z], [0, 0, Math.PI / 2]), P(sph(0.1), Y, [x * 1.18, 0.52, z]));
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; p.push(P(sph(0.035), 0x8b94a6, [x * 1.19, 0.52 + Math.cos(a) * 0.2, z + Math.sin(a) * 0.2])); }
    p.push(P(tor(0.62, 0.1, 8, 22, Math.PI), D, [x, 0.52, z], [0, Math.PI / 2, 0], [1, 1, 2.2]));
  });
  g.add(toMesh(p, { thin: true }));
  const lg = [new THREE.Group(), new THREE.Group()]; g.add(lg[0], lg[1]); g.userData.lights = lg;
  [[-0.55, 0x4db8ff], [0.55, 0xff3b3b], [-0.18, 0x4db8ff], [0.18, 0xff3b3b]].forEach(([x, c], i) => { const l = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 10), new THREE.MeshBasicMaterial({ color: c })); l.position.set(x, 2.44, -1.75); lg[i % 2].add(l); const s = glowSprite(c, 0.9, 0.7); s.position.copy(l.position); lg[i % 2].add(s); });
  return g;
}
export function truckMuito() {
  const g = new THREE.Group(), paint = MAT.paint(0xd8241c), paint2 = MAT.paint(0xb51c16), chrome = MAT.chrome(), yel = std(0xffd23f, { roughness: 0.3, metalness: 0.2 });
  // carroceria com tinta envernizada e cromados que refletem o ambiente
  g.add(mesh(box(2.25, 1.45, 4.3, 0.24), paint, [0, 1.15, 0.6]), mesh(box(2.25, 1.85, 1.85, 0.32), paint2, [0, 1.32, -1.75]));
  g.add(mesh(box(1.95, 0.75, 0.08, 0.1), MAT.window(), [0, 1.78, -2.66]), mesh(box(0.06, 0.62, 1.05, 0.05), MAT.window(), [-1.13, 1.72, -1.82]), mesh(box(0.06, 0.62, 1.05, 0.05), MAT.window(), [1.13, 1.72, -1.82]));
  g.add(mesh(box(2.32, 0.18, 4.15, 0.06), yel, [0, 1.12, 0.6]), mesh(box(2.32, 0.08, 4.15, 0.03), std(0xffffff, { roughness: 0.2 }), [0, 0.95, 0.6]));
  g.add(mesh(box(2.42, 0.34, 6.4, 0.16), std(0x3a404c, { metalness: 0.5, roughness: 0.4 }), [0, 0.45, -0.1]), mesh(box(2.36, 0.34, 0.32, 0.14), chrome, [0, 0.55, -2.88]));
  for (let i = 0; i < 6; i++) g.add(mesh(box(1.3, 0.05, 0.06, 0.02), chrome, [0, 0.82 + i * 0.07, -2.69]));
  [-0.82, 0.82].forEach((x) => { g.add(mesh(cyl(0.17, 0.17, 0.06, 24), chrome, [x, 0.95, -2.69], [Math.PI / 2, 0, 0])); const hl = mesh(sph(0.14), MAT.emissive(0xfff6d0, 2), [x, 0.95, -2.72], [0, 0, 0], [1, 1, 0.45]); g.add(hl); });
  g.add(mesh(box(1.7, 0.18, 0.4, 0.09), std(0x1b2230, { roughness: 0.4 }), [0, 2.32, -1.75]));
  g.add(mesh(cap(0.05, 4.0, 4, 10), chrome, [-0.6, 2.12, 0.55], [Math.PI / 2 - 0.05, 0, 0]), mesh(cap(0.05, 4.0, 4, 10), chrome, [0.6, 2.12, 0.55], [Math.PI / 2 - 0.05, 0, 0]));
  for (let i = 0; i < 8; i++) g.add(mesh(cyl(0.032, 0.032, 1.2, 12), chrome, [0, 2.13 - i * 0.013, -1.25 + i * 0.52], [0, 0, Math.PI / 2]));
  g.add(mesh(cyl(0.5, 0.5, 0.3, 32), std(0x59616e, { metalness: 0.6, roughness: 0.35 }), [1.0, 1.25, 1.6], [0, 0, Math.PI / 2]), mesh(tor(0.4, 0.09, 12, 32), yel, [1.18, 1.25, 1.6], [0, Math.PI / 2, 0]));
  [-1, 1].forEach((sd) => { for (let k = 0; k < 3; k++) g.add(mesh(box(0.06, 0.92, 1.0, 0.05), paint2, [sd * 1.14, 1.1, -0.42 + k * 1.1]), mesh(box(0.05, 0.06, 0.32, 0.03), chrome, [sd * 1.18, 1.05, -0.42 + k * 1.1])); g.add(mesh(box(0.05, 0.3, 0.2, 0.04), chrome, [sd * 1.32, 1.8, -2.35])); });
  [[-1.15, -1.7], [1.15, -1.7], [-1.15, 1.6], [1.15, 1.6]].forEach(([x, z]) => {
    g.add(mesh(cyl(0.52, 0.52, 0.38, 36), MAT.rubber(), [x, 0.52, z], [0, 0, Math.PI / 2]), mesh(cyl(0.3, 0.3, 0.4, 28), chrome, [x, 0.52, z], [0, 0, Math.PI / 2]), mesh(sph(0.1), yel, [x * 1.18, 0.52, z]));
    g.add(mesh(tor(0.62, 0.1, 10, 28, Math.PI), paint2, [x, 0.52, z], [0, Math.PI / 2, 0], [1, 1, 2.2]));
  });
  [[-0.55, 0x2aa8ff], [0.55, 0xff2b2b], [-0.18, 0x2aa8ff], [0.18, 0xff2b2b]].forEach(([x, c]) => { const l = mesh(new THREE.SphereGeometry(0.15, 18, 12), MAT.emissive(c, 4), [x, 2.44, -1.75]); l.castShadow = false; g.add(l); const s = glowSprite(c, 1.1, 0.75); s.position.copy(l.position); g.add(s); });
  const red = new THREE.PointLight(0xff3030, 6, 4); red.position.set(0.5, 2.8, -1.75); g.add(red);
  const blue = new THREE.PointLight(0x3aa8ff, 6, 4); blue.position.set(-0.5, 2.8, -1.75); g.add(blue);
  return g;
}

// =================================================================== OBSTÁCULOS (cone, hidrante, barreira, caixote)
export function obstaclesAlta() {
  const g = new THREE.Group();
  const cone1 = [P(box(0.82, 0.1, 0.82, 0.06), 0x2b3350, [0, 0.05, 0]), P(lathe([[0.31, 0.08], [0.28, 0.2], [0.07, 0.82], [0.045, 0.86], [0.0001, 0.87]], 28), 0xff7a1a), P(cyl(0.22, 0.245, 0.13, 28), 0xffffff, [0, 0.36, 0]), P(cyl(0.135, 0.16, 0.11, 28), 0xffffff, [0, 0.58, 0])];
  const m1 = toMesh(cone1, { thin: true }); m1.position.set(-2.4, 0, 0); g.add(m1);
  const hyd = [P(lathe([[0.32, 0], [0.32, 0.1], [0.25, 0.13], [0.23, 0.6], [0.27, 0.64], [0.27, 0.7], [0.24, 0.74], [0.17, 0.9], [0.0001, 0.94]], 28), 0xe8352f), P(cyl(0.08, 0.08, 0.14, 6), 0xffd23f, [0, 0.98, 0]), P(cyl(0.09, 0.11, 0.56, 18), 0xffd23f, [0, 0.45, 0], [0, 0, Math.PI / 2]), P(cyl(0.12, 0.12, 0.07, 6), 0xffd23f, [0.3, 0.45, 0], [0, 0, Math.PI / 2]), P(cyl(0.12, 0.12, 0.07, 6), 0xffd23f, [-0.3, 0.45, 0], [0, 0, Math.PI / 2]), P(cyl(0.14, 0.14, 0.09, 20), 0xb5231e, [0, 0.55, -0.24], [Math.PI / 2, 0, 0]), P(cyl(0.06, 0.06, 0.1, 6), 0xffd23f, [0, 0.55, -0.3], [Math.PI / 2, 0, 0])];
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; hyd.push(P(sph(0.03), 0x8a1f1a, [Math.cos(a) * 0.27, 0.11, Math.sin(a) * 0.27])); }
  const m2 = toMesh(hyd, { thin: true }); m2.position.set(-0.8, 0, 0); g.add(m2);
  const bar = []; [-0.78, 0.78].forEach((x) => bar.push(P(box(0.1, 0.85, 0.1, 0.03), 0x59616e, [x, 0.42, 0]), P(box(0.5, 0.06, 0.4, 0.03), 0x59616e, [x, 0.03, 0])));
  [0.48, 0.7].forEach((y) => { bar.push(P(box(1.7, 0.2, 0.08, 0.04), 0xffffff, [0, y, 0])); for (let i = 0; i < 5; i++) bar.push(P(box(0.18, 0.2, 0.085, 0.01), 0xe8352f, [-0.68 + i * 0.34, y, 0], [0, 0, 0.6])); });
  bar.push(P(sph(0.07), 0xffc92b, [0.78, 0.9, 0]));
  const m3 = toMesh(bar, { thin: true }); m3.position.set(0.9, 0, 0); g.add(m3);
  const cr = [P(box(0.95, 0.9, 0.95, 0.08), 0xd69a52, [0, 0.45, 0])];
  for (let i = 0; i < 5; i++) cr.push(P(box(0.97, 0.16, 0.97, 0.03), i % 2 ? 0xc98a42 : 0xd69a52, [0, 0.09 + i * 0.18, 0]));
  [[-0.43, -0.43], [0.43, -0.43], [-0.43, 0.43], [0.43, 0.43]].forEach(([x, z]) => cr.push(P(box(0.12, 0.92, 0.12, 0.04), 0x9a6a30, [x, 0.46, z])));
  const m4 = toMesh(cr, { thin: true }); m4.position.set(2.5, 0, 0); g.add(m4);
  return g;
}
export function obstaclesMuito() {
  const g = new THREE.Group(), refl = std(0xffffff, { roughness: 0.15, metalness: 0.3 });
  const c1 = grp(mesh(box(0.82, 0.1, 0.82, 0.06), MAT.rubber()), mesh(lathe([[0.31, 0.08], [0.28, 0.2], [0.07, 0.82], [0.045, 0.86], [0.0001, 0.87]], 36), std(0xff6a12, { roughness: 0.55 })), mesh(cyl(0.222, 0.247, 0.13, 36), refl, [0, 0.36, 0]), mesh(cyl(0.137, 0.162, 0.11, 36), refl, [0, 0.58, 0]));
  c1.children[0].position.y = 0.05; c1.position.set(-2.4, 0, 0); g.add(c1);
  const paintR = MAT.paint(0xd62a22), brass = std(0xe0b030, { metalness: 0.9, roughness: 0.3 });
  const hy = grp(mesh(lathe([[0.32, 0], [0.32, 0.1], [0.25, 0.13], [0.23, 0.6], [0.27, 0.64], [0.27, 0.7], [0.24, 0.74], [0.17, 0.9], [0.0001, 0.94]], 36), paintR), mesh(cyl(0.08, 0.08, 0.14, 6), brass, [0, 0.98, 0]), mesh(cyl(0.09, 0.11, 0.56, 24), brass, [0, 0.45, 0], [0, 0, Math.PI / 2]), mesh(cyl(0.12, 0.12, 0.07, 6), brass, [0.3, 0.45, 0], [0, 0, Math.PI / 2]), mesh(cyl(0.12, 0.12, 0.07, 6), brass, [-0.3, 0.45, 0], [0, 0, Math.PI / 2]), mesh(cyl(0.14, 0.14, 0.09, 24), paintR, [0, 0.55, -0.24], [Math.PI / 2, 0, 0]));
  hy.position.set(-0.8, 0, 0); g.add(hy);
  const stripes = std(0xffffff, { map: canvasTex('barStripe', 128, 32, (x, w, h) => { x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.fillStyle = '#e02a22'; for (let i = -1; i < 8; i++) { x.beginPath(); x.moveTo(i * 20, h); x.lineTo(i * 20 + 10, h); x.lineTo(i * 20 + 22, 0); x.lineTo(i * 20 + 12, 0); x.fill(); } }), roughness: 0.3 });
  const b = grp(mesh(box(1.7, 0.2, 0.08, 0.03), stripes, [0, 0.48, 0]), mesh(box(1.7, 0.2, 0.08, 0.03), stripes, [0, 0.7, 0]));
  [-0.78, 0.78].forEach((x) => b.add(mesh(box(0.1, 0.85, 0.1, 0.03), MAT.darkMetal(), [x, 0.42, 0]), mesh(box(0.5, 0.06, 0.4, 0.03), MAT.darkMetal(), [x, 0.03, 0])));
  b.add(mesh(sph(0.07), MAT.emissive(0xffb020, 3), [0.78, 0.9, 0])); b.position.set(0.9, 0, 0); g.add(b);
  const woodM = std(0xffffff, { map: T.wood([1, 1], '#c88a4a'), bumpMap: T.wood([1, 1], '#c88a4a'), bumpScale: 2, roughness: 0.85 });
  const cr = grp(mesh(new THREE.BoxGeometry(0.95, 0.9, 0.95), woodM, [0, 0.45, 0]));
  [[-0.43, -0.43], [0.43, -0.43], [-0.43, 0.43], [0.43, 0.43]].forEach(([x, z]) => cr.add(mesh(new THREE.BoxGeometry(0.12, 0.92, 0.12), std(0xffffff, { map: T.wood([1, 1], '#8a5a28') }), [x, 0.46, z])));
  cr.position.set(2.5, 0, 0); g.add(cr);
  return g;
}

export const HQ = {
  tree: { alta: treeAlta, muito: treeMuito },
  house: { alta: houseAlta, muito: houseMuito },
  tower: { alta: towerAlta, muito: towerMuito },
  lamp: { alta: lampAlta, muito: lampMuito },
  binfire: { alta: binFireAlta, muito: binFireMuito },
  truck: { alta: truckAlta, muito: truckMuito },
  obstacles: { alta: obstaclesAlta, muito: obstaclesMuito },
};
