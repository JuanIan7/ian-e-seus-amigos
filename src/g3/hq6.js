// Comparação de qualidade — fase 6 (resgate na água).
import { THREE, P, sph, box, cyl, cone, cap, tor, dome, lathe, taper, slab, rockGeo, toMesh, hex } from './kit.js';
import { TEX } from './hq.js';
import { noise3 } from './hq2.js';

const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, ...o });
const paint = (c, o = {}) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.1, ...o });
const chrome = () => std(0xdfe4ec, { metalness: 1, roughness: 0.2 });
function adder(g) { return (geo, m, p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1]) => { const x = new THREE.Mesh(geo, m); x.position.set(...p); x.rotation.set(...r); x.scale.set(...s); x.castShadow = x.receiveShadow = true; g.add(x); return x; }; }
const L = (pts, seg = 40) => new THREE.LatheGeometry(pts.map(([a, b]) => new THREE.Vector2(Math.max(0.0001, a), b)), seg);
const R0 = (seed) => { let s = seed * 9301 + 49297; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
const at = (o, x) => { o.position.x = x; return o; };
const wave = (x, z) => Math.sin(x * 0.55 + z * 0.2) * 0.12 + Math.sin(z * 0.8 - x * 0.3) * 0.08 + (noise3(x * 0.4, 0, z * 0.4) - 0.5) * 0.12;

// =================================================================== MAR (superfície usada também como chão das outras peças)
export function seaAtual() { const m = new THREE.Mesh(new THREE.PlaneGeometry(400, 400).rotateX(-Math.PI / 2), new THREE.MeshToonMaterial({ color: 0x2f9be0 })); m.position.y = -0.3; return m; }
export function seaAlta() {
  // ondinhas de verdade na malha + cristas claras e faixas de espuma (cartoon)
  const g = new THREE.Group(), geo = new THREE.PlaneGeometry(140, 140, 220, 220).rotateX(-Math.PI / 2), ps = geo.attributes.position, col = new Float32Array(ps.count * 3), c = new THREE.Color();
  for (let i = 0; i < ps.count; i++) { const x = ps.getX(i), z = ps.getZ(i), h = wave(x, z); ps.setY(i, h); const k = (h + 0.3) / 0.6; c.set(0x1f7fd0).lerp(new THREE.Color(0x56c7ff), Math.max(0, Math.min(1, k))); if (h > 0.17) c.lerp(new THREE.Color(0xffffff), 0.7); col.set([c.r, c.g, c.b], i * 3); }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, new THREE.MeshToonMaterial({ vertexColors: true })); m.position.y = -0.3; m.receiveShadow = true; g.add(m);
  // brilhos do sol (estrelinhas) espalhados
  const sp = []; const r = R0(4); for (let i = 0; i < 70; i++) { const x = (r() - 0.5) * 40, z = (r() - 0.5) * 30 + 5; sp.push(P(box(0.35, 0.02, 0.06, 0.01), 0xffffff, [x, -0.3 + wave(x, z) + 0.03, z], [0, r() * 3, 0])); }
  g.add(toMesh(sp, { outline: false }));
  return g;
}
let seaNormal = null;
function seaNormalTex() {
  if (seaNormal) return seaNormal;
  const N = 256, c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d'), im = x.createImageData(N, N);
  const hgt = (i, j) => { const u = i / N * 6.28, v = j / N * 6.28; return Math.sin(u * 3 + Math.sin(v * 2) * 1.5) * 0.5 + Math.sin(v * 5 + u * 2) * 0.3 + Math.sin(u * 9 - v * 7) * 0.12; };
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const dx = hgt(i + 1, j) - hgt(i - 1, j), dy = hgt(i, j + 1) - hgt(i, j - 1), k = (j * N + i) * 4; im.data[k] = 128 - dx * 90; im.data[k + 1] = 128 - dy * 90; im.data[k + 2] = 255; im.data[k + 3] = 255; }
  x.putImageData(im, 0, 0); seaNormal = new THREE.CanvasTexture(c); seaNormal.wrapS = seaNormal.wrapT = THREE.RepeatWrapping; seaNormal.repeat.set(40, 40); return seaNormal;
}
export function seaMuito() {
  const g = new THREE.Group(), geo = new THREE.PlaneGeometry(140, 140, 260, 260).rotateX(-Math.PI / 2), ps = geo.attributes.position;
  for (let i = 0; i < ps.count; i++) ps.setY(i, wave(ps.getX(i), ps.getZ(i)));
  geo.computeVertexNormals();
  const mat = new THREE.MeshPhysicalMaterial({ color: 0x1a78b8, roughness: 0.06, metalness: 0.0, normalMap: seaNormalTex(), normalScale: new THREE.Vector2(0.35, 0.35), clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.6, sheen: 0.4, sheenColor: new THREE.Color(0x8fe0ff) });
  const m = new THREE.Mesh(geo, mat); m.position.y = -0.3; m.receiveShadow = true; g.add(m);
  return g;
}
/** espuma em volta de um objeto na água */
export function foamRing(level, r, add) {
  if (level === 'alta') { const m = toMesh([P(tor(r, 0.06, 6, 40), 0xffffff, [0, -0.22, 0], [Math.PI / 2, 0, 0], [1, 1, 1]), P(tor(r * 1.25, 0.04, 6, 44), 0xe8f8ff, [0, -0.24, 0], [Math.PI / 2, 0, 0])], { outline: false }); return m; }
  const m = new THREE.Mesh(new THREE.RingGeometry(r * 0.92, r * 1.2, 64), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, roughness: 0.9, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.y = -0.2; return m;
}
export function seaShowcase(level) { const g = new THREE.Group(); const r = R0(2);
  const rocks = level === 'alta' ? toMesh([P(rockGeo(1.1, 3, 0.25, 22, 16), 0x8f98ab, [0, 0.0, 0], [0, 0.5, 0], [1.3, 0.7, 1]), P(rockGeo(0.6, 5, 0.25, 18, 12), 0xa9b1c4, [1.1, -0.1, 0.4]), P(rockGeo(0.5, 9, 0.2), 0x5fae4a, [-0.1, 0.55, 0], [0, 0, 0], [1.4, 0.3, 1.1])], { thin: true }) : (() => { const q = new THREE.Group(), add = adder(q), rm = std(0xffffff, { map: TEX.plaster('#8f98ab', [2, 2]), bumpMap: TEX.plaster('#8f98ab', [2, 2]), bumpScale: 4, roughness: 0.85 }); add(rockGeo(1.1, 3, 0.25, 32, 24), rm, [0, 0, 0], [0, 0.5, 0], [1.3, 0.7, 1]); add(rockGeo(0.6, 5, 0.25, 24, 18), rm, [1.1, -0.1, 0.4]); return q; })();
  g.add(rocks); g.add(foamRing(level, 1.7)); return g; }

// =================================================================== BARCO DE RESGATE
const HULL = [[0.0001, -0.55], [0.45, -0.52], [0.8, -0.32], [0.98, -0.05], [1.02, 0.25], [0.0001, 0.25]];
export function boatAlta() {
  const g = new THREE.Group(), p = [], W = 0xffffff, R = 0xe8352f, N = 0x1b2a49;
  p.push(P(lathe(HULL, 40), W, [0, 0, 0.1], [0, 0, 0], [1.05, 1, 2.3]), P(lathe([[0.0001, -0.4], [0.6, -0.3], [0.85, -0.12], [0.0001, -0.12]], 40), N, [0, 0, 0.1], [0, 0, 0], [1.06, 1, 2.32]));
  p.push(P(tor(0.98, 0.12, 10, 44), 0xff8a1f, [0, 0.08, 0.1], [Math.PI / 2, 0, 0], [1.07, 2.32, 1])); // boia em volta (defensa)
  p.push(P(box(1.9, 0.08, 3.9, 0.04), 0xd9b47a, [0, 0.24, 0.1]));
  for (let i = 0; i < 8; i++) p.push(P(box(1.9, 0.01, 0.02, 0.005), 0xb98a52, [0, 0.285, -1.6 + i * 0.5]));
  // cabine com janelas, teto com luzes e faixa
  p.push(P(box(1.3, 1.0, 1.4, 0.12), W, [0, 0.78, 0.5]), P(box(1.1, 0.4, 0.06, 0.05), 0x9fdcff, [0, 0.95, -0.22], [-0.2, 0, 0]), P(box(0.06, 0.35, 0.9, 0.04), 0x9fdcff, [-0.66, 0.95, 0.5]), P(box(0.06, 0.35, 0.9, 0.04), 0x9fdcff, [0.66, 0.95, 0.5]));
  p.push(P(box(1.4, 0.12, 1.5, 0.05), R, [0, 1.32, 0.5]), P(box(1.32, 0.12, 0.04, 0.02), R, [0, 0.55, -0.22]));
  p.push(P(cyl(0.05, 0.05, 1.3, 10), 0xdfe6f1, [0, 2.0, 0.8]), P(box(0.5, 0.05, 0.05, 0.02), 0xdfe6f1, [0, 2.4, 0.8]), P(sph(0.07), 0xffd23f, [0, 2.7, 0.8]));
  [-1, 1].forEach((s) => { p.push(P(box(0.04, 0.05, 2.6, 0.02), 0xdfe6f1, [s * 0.95, 0.62, -0.7])); for (let k = 0; k < 6; k++) p.push(P(cyl(0.025, 0.025, 0.36, 6), 0xdfe6f1, [s * 0.95, 0.44, -1.9 + k * 0.48])); });
  p.push(P(tor(0.22, 0.07, 8, 20), R, [0.7, 0.85, 1.25], [0, Math.PI / 2, 0]), P(tor(0.22, 0.072, 8, 20, 0.6), W, [0.7, 0.85, 1.25], [0, Math.PI / 2, 0]));
  p.push(P(box(0.4, 0.3, 0.4, 0.05), 0x2b2f3a, [0, 0.45, 2.55]), P(cyl(0.03, 0.03, 0.5, 6), 0x59616e, [0, 0.1, 2.75]));
  [-1, 1].forEach((s) => p.push(P(box(0.02, 0.12, 0.5, 0.01), R, [s * 1.03, 0.0, -1.2]), P(box(0.02, 0.5, 0.12, 0.01), R, [s * 1.03, 0.0, -1.2])));
  g.add(toMesh(p, { thin: true }));
  [[-0.35, 0x4db8ff], [0.35, 0xff3b3b]].forEach(([x, c]) => { const l = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), new THREE.MeshBasicMaterial({ color: c })); l.position.set(x, 1.45, 0.5); g.add(l); });
  g.add(foamRing('alta', 1.5));
  return g;
}
function boatMuito() {
  const g = new THREE.Group(), add = adder(g), W = paint(0xf8f8f8), R = paint(0xd8241c), N = paint(0x14203a);
  add(L(HULL, 64), W, [0, 0, 0.1], [0, 0, 0], [1.05, 1, 2.3]); add(L([[0.0001, -0.4], [0.6, -0.3], [0.85, -0.12], [0.0001, -0.12]], 64), N, [0, 0, 0.1], [0, 0, 0], [1.06, 1, 2.32]);
  add(new THREE.TorusGeometry(0.98, 0.12, 14, 64), std(0xff7a12, { roughness: 0.7 }), [0, 0.08, 0.1], [Math.PI / 2, 0, 0], [1.07, 2.32, 1]);
  add(new THREE.BoxGeometry(1.9, 0.08, 3.9), std(0xffffff, { map: TEX.wood([1, 4], '#c99a62'), roughness: 0.6 }), [0, 0.24, 0.1]);
  add(box(1.3, 1.0, 1.4, 0.12), W, [0, 0.78, 0.5]);
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x9fd6ff, roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.6, envMapIntensity: 2 });
  add(new THREE.BoxGeometry(1.1, 0.4, 0.04), glass, [0, 0.95, -0.24], [-0.2, 0, 0]); add(new THREE.BoxGeometry(0.04, 0.35, 0.9), glass, [-0.67, 0.95, 0.5]); add(new THREE.BoxGeometry(0.04, 0.35, 0.9), glass, [0.67, 0.95, 0.5]);
  add(box(1.4, 0.12, 1.5, 0.05), R, [0, 1.32, 0.5]);
  add(new THREE.CylinderGeometry(0.05, 0.05, 1.3, 12), chrome(), [0, 2.0, 0.8]); add(new THREE.BoxGeometry(0.5, 0.05, 0.05), chrome(), [0, 2.4, 0.8]);
  [-1, 1].forEach((s) => { add(new THREE.BoxGeometry(0.04, 0.05, 2.6), chrome(), [s * 0.95, 0.62, -0.7]); for (let k = 0; k < 6; k++) add(new THREE.CylinderGeometry(0.025, 0.025, 0.36, 8), chrome(), [s * 0.95, 0.44, -1.9 + k * 0.48]); });
  add(new THREE.TorusGeometry(0.22, 0.07, 12, 32), std(0xe02a22, { roughness: 0.6 }), [0.7, 0.85, 1.25], [0, Math.PI / 2, 0]);
  add(box(0.4, 0.3, 0.4, 0.05), std(0x22252c, { metalness: 0.5, roughness: 0.4 }), [0, 0.45, 2.55]);
  [[-0.35, 0x2aa8ff], [0.35, 0xff2b2b]].forEach(([x, c]) => { const l = add(new THREE.SphereGeometry(0.1, 16, 12), std(c, { emissive: c, emissiveIntensity: 3 }), [x, 1.45, 0.5]); l.castShadow = false; const pl = new THREE.PointLight(c, 3, 3); pl.position.set(x, 1.7, 0.5); g.add(pl); });
  g.add(foamRing('muito', 1.5));
  // rastro de espuma atrás
  const wake = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 4), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, depthWrite: false })); wake.rotation.x = -Math.PI / 2; wake.position.set(0, -0.2, 4.4); g.add(wake);
  return g;
}

// =================================================================== FAROL E ILHA COM COQUEIRO
function palmTree(p, x, z, lean, r) {
  for (let i = 0; i < 9; i++) p.push(P(lathe([[0.2, 0], [0.25, 0.08], [0.22, 0.5], [0.19, 0.52]], 16), i % 2 ? 0x9a6a3a : 0x8a5a2e, [x + Math.sin(lean) * i * 0.42, 0.3 + i * 0.47, z], [0, 0, -lean * 0.5]));
  const tx = x + Math.sin(lean) * 3.8, ty = 4.5;
  for (let k = 0; k < 8; k++) { const a = k / 8 * 6.28; const pts = [[tx, ty, z], [tx + Math.cos(a) * 0.9, ty + 0.5, z + Math.sin(a) * 0.9], [tx + Math.cos(a) * 1.8, ty, z + Math.sin(a) * 1.8], [tx + Math.cos(a) * 2.2, ty - 0.8, z + Math.sin(a) * 2.2]];
    p.push(P(taper(pts, [0.03, 0.03, 0.02, 0.01], 14, 6), 0x3a8a2e)); const cv = new THREE.CatmullRomCurve3(pts.map((q) => new THREE.Vector3(...q)));
    for (let j = 1; j < 14; j++) { const t = j / 14, q = cv.getPoint(t), tg = cv.getTangent(t); [-1, 1].forEach((s) => { const sd = new THREE.Vector3(-tg.z, 0, tg.x).normalize().multiplyScalar(s * 0.25 * Math.sin((1 - t) * 2.6 + 0.3)); p.push(P(new THREE.SphereGeometry(0.1, 8, 5), hex(0x3fcf5a, 0.8 + t * 0.3), [q.x + sd.x, q.y - 0.08, q.z + sd.z], [0, -Math.atan2(sd.z, sd.x), -0.5 * s], [2.6 * Math.sin((1 - t) * 2.6 + 0.3), 0.12, 0.38])); }); } }
  [[0.2, 0], [-0.2, 0.15], [0, -0.2]].forEach(([dx, dz]) => p.push(P(sph(0.2), 0x7a5a2e, [tx + dx, ty - 0.3, z + dz])));
}
export function lightAlta() {
  const g = new THREE.Group(), p = [], leaves = [], r = R0(6);
  p.push(P(rockGeo(3.2, 2, 0.15, 26, 16), 0xf2d79a, [0, -0.9, 0], [0, 0, 0], [1.4, 0.45, 1.2]));
  for (let i = 0; i < 6; i++) { const a = r() * 6.28; p.push(P(rockGeo(0.6, i, 0.25), 0x8f98ab, [Math.cos(a) * 3.8, 0.0, Math.sin(a) * 3.0])); }
  palmTree(leaves, -2.2, 0.5, 0.2, r);
  // farol: listras, janelinhas, porta, varanda com grade e lanterna com raios de luz
  const fx = 2.0; for (let i = 0; i < 6; i++) p.push(P(cyl(1.0 - i * 0.09, 1.09 - i * 0.09, 1.2, 32), i % 2 ? 0xffffff : 0xe8352f, [fx, 0.7 + i * 1.2, 0]));
  [2, 4].forEach((i) => p.push(P(box(0.25, 0.4, 0.1, 0.04), 0x2b3350, [fx, 0.7 + i * 1.2, -0.92 + i * 0.09])));
  p.push(P(box(0.45, 0.8, 0.1, 0.06), 0x8a5a35, [fx, 0.5, -1.05]), P(cyl(0.95, 0.95, 0.14, 32), 0x1b2a49, [fx, 7.55, 0]));
  for (let k = 0; k < 16; k++) { const a = k / 16 * 6.28; p.push(P(cyl(0.025, 0.025, 0.5, 6), 0x1b2a49, [fx + Math.cos(a) * 0.9, 7.85, Math.sin(a) * 0.9])); }
  p.push(P(tor(0.9, 0.035, 6, 40), 0x1b2a49, [fx, 8.1, 0], [Math.PI / 2, 0, 0]), P(cyl(0.6, 0.6, 0.9, 24), 0xfff2a8, [fx, 8.1, 0]), P(lathe([[0.75, 0], [0.6, 0.4], [0.1, 0.8], [0.0001, 0.85]], 24), 0xe8352f, [fx, 8.55, 0]), P(sph(0.12), 0x1b2a49, [fx, 9.45, 0]));
  g.add(toMesh(p, { thin: true }), toMesh(leaves, { outline: false }));
  const beam = new THREE.Mesh(new THREE.ConeGeometry(1.2, 7, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff6c8, transparent: true, opacity: 0.25, depthWrite: false, side: THREE.DoubleSide })); beam.rotation.z = Math.PI / 2; beam.position.set(fx - 3.5, 8.1, 0); g.add(beam);
  g.add(foamRing('alta', 4.2));
  return g;
}
function lightMuito() {
  const g = new THREE.Group(), add = adder(g), r = R0(6);
  const sand = std(0xffffff, { map: TEX.plaster('#efd59a', [4, 2]), bumpMap: TEX.plaster('#efd59a', [4, 2]), bumpScale: 3, roughness: 1 });
  add(rockGeo(3.2, 2, 0.15, 40, 24), sand, [0, -0.9, 0], [0, 0, 0], [1.4, 0.45, 1.2]);
  const rk = std(0xffffff, { map: TEX.plaster('#8f98ab', [2, 2]), bumpMap: TEX.plaster('#8f98ab', [2, 2]), bumpScale: 4, roughness: 0.85 });
  for (let i = 0; i < 6; i++) { const a = r() * 6.28; add(rockGeo(0.6, i, 0.25, 20, 14), rk, [Math.cos(a) * 3.8, 0.0, Math.sin(a) * 3.0]); }
  // coqueiro: tronco em anéis texturizados e folhas recortadas
  const bark = std(0xffffff, { map: TEX.bark([2, 1]), bumpMap: TEX.bark([2, 1]), bumpScale: 3, color: 0xc0a080, roughness: 0.95 });
  for (let i = 0; i < 9; i++) add(L([[0.2, 0], [0.25, 0.08], [0.22, 0.5], [0.19, 0.52]], 24), bark, [-2.2 + Math.sin(0.2) * i * 0.42, 0.3 + i * 0.47, 0.5], [0, 0, -0.1]);
  const palmT = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 256; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(30, 0, 4, 256); for (let i = 0; i < 40; i++) { const y = 4 + i * 6.2, Lw = 30 * Math.sin((1 - i / 40) * Math.PI * 0.85 + 0.25); [-1, 1].forEach((s) => { x.save(); x.translate(32, y); x.rotate(s * 0.5); x.fillRect(s < 0 ? -Lw : 0, -1.6, Lw, 3.2); x.restore(); }); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const fg = new THREE.PlaneGeometry(0.9, 2.6, 1, 14); fg.translate(0, 1.3, 0); { const ps = fg.attributes.position; for (let i = 0; i < ps.count; i++) { const y = ps.getY(i), t = y / 2.6; ps.setZ(i, -Math.pow(t, 2) * 1.6); } fg.computeVertexNormals(); }
  const fm = std(0x3a9a3e, { map: palmT, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.55 }), dm = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: palmT, alphaTest: 0.4 });
  const tx = -2.2 + Math.sin(0.2) * 3.8;
  for (let k = 0; k < 10; k++) { const m = add(fg, fm, [tx, 4.5, 0.5], [0, -k / 10 * 6.28, 0]); m.rotateX(-1.1); m.customDepthMaterial = dm; }
  [[0.2, 0], [-0.2, 0.15], [0, -0.2]].forEach(([dx, dz]) => add(new THREE.SphereGeometry(0.2, 20, 14), std(0x6a4a24, { roughness: 0.7 }), [tx + dx, 4.2, 0.5 + dz]));
  // farol
  const fx = 2.0, wr = paint(0xd8241c), ww = paint(0xf6f6f6), nv = paint(0x14203a);
  for (let i = 0; i < 6; i++) add(new THREE.CylinderGeometry(1.0 - i * 0.09, 1.09 - i * 0.09, 1.2, 48), i % 2 ? ww : wr, [fx, 0.7 + i * 1.2, 0]);
  add(new THREE.BoxGeometry(0.45, 0.8, 0.1), std(0xffffff, { map: TEX.wood([1, 2], '#7a4a26') }), [fx, 0.5, -1.05]);
  add(new THREE.CylinderGeometry(0.95, 0.95, 0.14, 48), nv, [fx, 7.55, 0]);
  for (let k = 0; k < 16; k++) { const a = k / 16 * 6.28; add(new THREE.CylinderGeometry(0.025, 0.025, 0.5, 8), nv, [fx + Math.cos(a) * 0.9, 7.85, Math.sin(a) * 0.9]); }
  add(new THREE.TorusGeometry(0.9, 0.035, 8, 64), nv, [fx, 8.1, 0], [Math.PI / 2, 0, 0]);
  const lamp = add(new THREE.CylinderGeometry(0.6, 0.6, 0.9, 32), new THREE.MeshPhysicalMaterial({ color: 0xfff6d0, emissive: 0xfff0b0, emissiveIntensity: 2.5, transparent: true, opacity: 0.9, roughness: 0.1 }), [fx, 8.1, 0]); lamp.castShadow = false;
  add(L([[0.75, 0], [0.6, 0.4], [0.1, 0.8], [0.0001, 0.85]], 40), wr, [fx, 8.55, 0]);
  const beam = new THREE.Mesh(new THREE.ConeGeometry(1.2, 7, 32, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff6c8, transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })); beam.rotation.z = Math.PI / 2; beam.position.set(fx - 3.5, 8.1, 0); g.add(beam);
  const pl = new THREE.PointLight(0xfff0b0, 20, 8); pl.position.set(fx, 8.1, 0); g.add(pl);
  g.add(foamRing('muito', 4.2));
  return g;
}

// =================================================================== OBSTÁCULOS NA ÁGUA (boia, barril, corda)
export function obs6Alta() {
  const g = new THREE.Group();
  const b = [P(lathe([[0.0001, -0.1], [0.3, -0.05], [0.45, 0.2], [0.44, 0.55], [0.3, 0.75], [0.0001, 0.8]], 32), 0xe8352f), P(cyl(0.46, 0.46, 0.18, 32), 0xffffff, [0, 0.42, 0]), P(tor(0.46, 0.03, 6, 32), 0xffffff, [0, 0.2, 0], [Math.PI / 2, 0, 0])];
  b.push(P(cyl(0.05, 0.07, 0.5, 12), 0x59616e, [0, 1.0, 0]), P(box(0.3, 0.3, 0.04, 0.02), 0xffd23f, [0, 1.15, 0]), P(sph(0.1), 0xfff2a8, [0, 1.38, 0]), P(tor(0.08, 0.02, 6, 14), 0x59616e, [0.45, 0.6, 0], [0, Math.PI / 2, 0]));
  const m1 = toMesh(b, { thin: true }); m1.position.x = -2.2; g.add(m1); g.add(at(foamRing('alta', 0.6), -2.2));
  const br = [P(lathe([[0.0001, 0], [0.34, 0], [0.4, 0.15], [0.43, 0.48], [0.4, 0.81], [0.34, 0.96], [0.0001, 0.96]], 32), 0x2f78e0)];
  [0.18, 0.48, 0.78].forEach((y) => br.push(P(tor(0.42 - Math.abs(y - 0.48) * 0.15, 0.03, 6, 32), 0xdfe6f1, [0, y, 0], [Math.PI / 2, 0, 0])));
  br.push(P(cyl(0.07, 0.07, 0.04, 12), 0xdfe6f1, [0.15, 0.97, 0]), P(box(0.36, 0.26, 0.02, 0.02), 0xffd23f, [0, 0.5, -0.42]), P(slab([[-0.08, -0.08], [0.08, -0.08], [0, 0.08]], 0.02, 0.005), 0x1b2a49, [0, 0.5, -0.44]));
  const m2 = toMesh(br, { thin: true }); m2.position.x = 0; m2.rotation.z = 0.15; g.add(m2); g.add(at(foamRing('alta', 0.6), 0));
  // corda enrolada: espiral contínua com textura trançada (listras)
  const pts = []; for (let i = 0; i < 160; i++) { const t = i / 160, a = t * 6.28 * 3.2, rr = 0.45 - t * 0.28; pts.push(new THREE.Vector3(Math.cos(a) * rr, 0.12 + t * 0.45, Math.sin(a) * rr)); }
  const tube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 240, 0.1, 10);
  const cr = [P(tube, 0xd9b47a)]; for (let i = 0; i < 60; i++) { const q = pts[Math.floor(i / 60 * 159)]; cr.push(P(tor(0.1, 0.012, 4, 10), 0xb98a52, [q.x, q.y, q.z], [Math.PI / 2, 0, Math.atan2(q.z, q.x)])); }
  cr.push(P(taper([[0.2, 0.55, 0], [0.5, 0.4, -0.2], [0.8, 0.12, -0.3]], [0.1, 0.1, 0.09], 16, 10), 0xd9b47a));
  const m3 = toMesh(cr, { thin: true }); m3.position.x = 2.2; g.add(m3);
  return g;
}
function obsMuito() {
  const g = new THREE.Group(), add = adder(g);
  add(L([[0.0001, -0.1], [0.3, -0.05], [0.45, 0.2], [0.44, 0.55], [0.3, 0.75], [0.0001, 0.8]], 56), paint(0xd8241c), [-2.2, 0, 0]); add(new THREE.CylinderGeometry(0.46, 0.46, 0.18, 48), paint(0xf6f6f6), [-2.2, 0.42, 0]);
  add(new THREE.CylinderGeometry(0.05, 0.07, 0.5, 16), std(0x59616e, { metalness: 0.8, roughness: 0.3 }), [-2.2, 1.0, 0]); const l = add(new THREE.SphereGeometry(0.1, 16, 12), std(0xfff2a8, { emissive: 0xfff2a8, emissiveIntensity: 3 }), [-2.2, 1.38, 0]); l.castShadow = false;
  g.add(at(foamRing('muito', 0.6), -2.2));
  const metalB = paint(0x2468d0, { metalness: 0.4 }); const bar = add(L([[0.0001, 0], [0.34, 0], [0.4, 0.15], [0.43, 0.48], [0.4, 0.81], [0.34, 0.96], [0.0001, 0.96]], 56), metalB, [0, 0, 0], [0, 0, 0.15]);
  [0.18, 0.48, 0.78].forEach((y) => { const t = new THREE.Mesh(new THREE.TorusGeometry(0.42 - Math.abs(y - 0.48) * 0.15, 0.03, 8, 48), chrome()); t.position.y = y; t.rotation.x = Math.PI / 2; bar.add(t); });
  g.add(at(foamRing('muito', 0.6), 0));
  const ropeT = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 16; const x = c.getContext('2d'); x.fillStyle = '#d9b47a'; x.fillRect(0, 0, 64, 16); x.strokeStyle = 'rgba(120,80,40,.6)'; x.lineWidth = 3; for (let i = -2; i < 12; i++) { x.beginPath(); x.moveTo(i * 8, 0); x.lineTo(i * 8 + 10, 16); x.stroke(); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(60, 1); return t; })();
  const pts = []; for (let i = 0; i < 160; i++) { const t = i / 160, a = t * 6.28 * 3.2, rr = 0.45 - t * 0.28; pts.push(new THREE.Vector3(Math.cos(a) * rr, 0.12 + t * 0.45, Math.sin(a) * rr)); }
  add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 320, 0.1, 14), std(0xffffff, { map: ropeT, bumpMap: ropeT, bumpScale: 3, roughness: 0.95 }), [2.2, 0, 0]);
  return g;
}

// =================================================================== JANGADA E BOIA SALVA-VIDAS
function raftAlta() {
  const g = new THREE.Group(), p = [], w = 2.0, len = 3.4;
  for (let i = 0; i < 5; i++) { const x = -w / 2 + 0.2 + i * (w - 0.4) / 4; p.push(P(taper([[x, -0.15, -len / 2], [x + 0.02, -0.14, 0], [x, -0.15, len / 2]], [0.22, 0.23, 0.21], 12, 14), i % 2 ? 0xc99a62 : 0xb98a52)); [-1, 1].forEach((s) => { p.push(P(cyl(0.21, 0.21, 0.02, 14), 0xe9c58f, [x, -0.15, s * len / 2], [Math.PI / 2, 0, 0])); p.push(P(tor(0.12, 0.012, 4, 14), 0xb98a52, [x, -0.15, s * (len / 2 + 0.01)])); }); }
  [-len * 0.35, len * 0.35].forEach((z) => { p.push(P(box(w + 0.1, 0.08, 0.2, 0.04), 0x8a5a35, [0, 0.1, z])); for (let i = 0; i < 5; i++) p.push(P(tor(0.12, 0.035, 6, 14), 0xd9b47a, [-w / 2 + 0.2 + i * (w - 0.4) / 4, 0.05, z], [0, Math.PI / 2, 0])); });
  p.push(P(cyl(0.06, 0.07, 2.2, 10), 0x8a5a35, [0, 1.1, 0.6]), P(slab([[0, 0], [1.1, 0.1], [0, 1.6]], 0.02, 0.005), 0xffffff, [0.05, 0.4, 0.6], [0, Math.PI / 2, 0]), P(slab([[0, 0], [0.35, 0.1], [0, 0.25]], 0.02, 0.005), 0xe8352f, [0, 2.15, 0.6], [0, -Math.PI / 2, 0]));
  const m = toMesh(p, { thin: true }); m.position.x = -1.4; g.add(m); g.add(at(foamRing('alta', 1.8), -1.4));
  const ring = []; for (let i = 0; i < 8; i++) ring.push(P(tor(0.42, 0.14, 12, 10, Math.PI / 4 + 0.01), i % 2 ? 0xffffff : 0xe8352f, [0, 0, 0], [Math.PI / 2, 0, i * Math.PI / 4]));
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 8; ring.push(P(tor(0.14, 0.02, 4, 10, Math.PI), 0xdfe6f1, [Math.cos(a) * 0.42, 0, Math.sin(a) * 0.42], [0, -a, 0])); }
  ring.push(P(tor(0.62, 0.015, 4, 40), 0xdfe6f1, [0, 0, 0], [Math.PI / 2, 0, 0]));
  const r = toMesh(ring, { thin: true }); r.position.set(1.8, -0.15, 0); r.scale.setScalar(1.4); g.add(r); g.add(at(foamRing('alta', 1.0), 1.8));
  return g;
}
export function raftMuito(w = 2.0, len = 3.4, X = -1.4, withSail = true) {
  const g = new THREE.Group(), add = adder(g);
  const log = std(0xffffff, { map: TEX.bark([2, 1]), bumpMap: TEX.bark([2, 1]), bumpScale: 3, color: 0xd0b090, roughness: 0.9 }), cut = std(0xffffff, { map: TEX.wood([1, 1], '#e8c48c') });
  for (let i = 0; i < 5; i++) { const x = X - w / 2 + 0.2 + i * (w - 0.4) / 4; add(new THREE.CylinderGeometry(0.22, 0.22, len, 24), log, [x, -0.15, 0], [Math.PI / 2, 0, 0]); [-1, 1].forEach((s) => add(new THREE.CircleGeometry(0.22, 24), cut, [x, -0.15, s * (len / 2 + 0.005)], [0, s > 0 ? 0 : Math.PI, 0])); }
  const rope = std(0xd9b47a, { roughness: 0.95 });
  [-len * 0.35, len * 0.35].forEach((z) => { add(new THREE.BoxGeometry(w + 0.1, 0.08, 0.2), std(0xffffff, { map: TEX.wood([2, 1], '#8a5a35') }), [X, 0.1, z]); for (let i = 0; i < 5; i++) add(new THREE.TorusGeometry(0.12, 0.035, 8, 18), rope, [X - w / 2 + 0.2 + i * (w - 0.4) / 4, 0.05, z], [0, Math.PI / 2, 0]); });
  if (withSail) {
  add(new THREE.CylinderGeometry(0.06, 0.07, 2.2, 12), log, [X, 1.1, 0.6]);
  const sail = new THREE.Shape(); sail.moveTo(0, 0); sail.quadraticCurveTo(0.7, 0.6, 1.1, 0.1); sail.lineTo(0, 1.6); sail.closePath();
  add(new THREE.ShapeGeometry(sail, 16), new THREE.MeshPhysicalMaterial({ color: 0xf6f0e0, roughness: 0.8, side: THREE.DoubleSide, sheen: 0.5 }), [X + 0.05, 0.4, 0.6], [0, Math.PI / 2, 0]); }
  g.add(at(foamRing('muito', 1.8), X));
  const rr = new THREE.Group(); rr.position.set(1.8, -0.15, 0); rr.scale.setScalar(1.4); g.add(rr);
  for (let i = 0; i < 8; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.14, 20, 16, Math.PI / 4 + 0.01), paint(i % 2 ? 0xf6f6f6 : 0xd8241c, { roughness: 0.45 })); t.rotation.set(Math.PI / 2, 0, i * Math.PI / 4); t.castShadow = true; rr.add(t); }
  const rl = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.015, 6, 64), std(0xdfe6f1, { roughness: 0.9 })); rl.rotation.x = Math.PI / 2; rr.add(rl);
  g.add(at(foamRing('muito', 1.0), 1.8));
  return g;
}

// =================================================================== PÍER E BARQUINHO DE PASSEIO
export function pierAlta() {
  const g = new THREE.Group(), p = [];
  for (let i = 0; i < 4; i++) { p.push(P(taper([[-2.6, -1, i * 1.2 - 1.8], [-2.62, 0.5, i * 1.2 - 1.8], [-2.6, 1.6, i * 1.2 - 1.8]], [0.16, 0.17, 0.15], 10, 14), 0x8a5a35)); p.push(P(cyl(0.17, 0.17, 0.04, 14), 0xc99a62, [-2.6, 1.62, i * 1.2 - 1.8])); p.push(P(tor(0.2, 0.05, 8, 16), 0xd9b47a, [-2.6, 1.0, i * 1.2 - 1.8], [Math.PI / 2, 0, 0])); }
  for (let i = 0; i < 9; i++) p.push(P(box(1.4, 0.08, 0.4, 0.03), i % 2 ? 0xc99a62 : 0xb98a52, [-1.9, 0.6, -2.0 + i * 0.44]));
  p.push(P(taper([[-2.6, 1.0, -0.6], [-1.2, 0.5, -0.4], [0.3, 0.6, -0.1]], [0.035, 0.035, 0.035], 16, 6), 0xd9b47a));
  // barquinho de passeio: casco, faixa, banquinhos, remos
  const bx = 1.2, H = [[0.0001, -0.4], [0.35, -0.37], [0.6, -0.2], [0.72, 0.05], [0.75, 0.2], [0.0001, 0.2]];
  p.push(P(lathe(H, 36), 0x2f78e0, [bx, 0, 0], [0, 0, 0], [1.1, 1, 2.2]), P(tor(0.74, 0.05, 6, 40), 0xffffff, [bx, 0.18, 0], [Math.PI / 2, 0, 0], [1.1, 2.2, 1]), P(lathe([[0.0001, 0.05], [0.68, 0.05], [0.0001, 0.06]], 36), 0xd9b47a, [bx, 0, 0], [0, 0, 0], [1.1, 1, 2.2]));
  [-0.6, 0.6].forEach((z) => p.push(P(box(1.4, 0.06, 0.3, 0.02), 0xc99a62, [bx, 0.15, z])));
  [-1, 1].forEach((s) => p.push(P(cyl(0.025, 0.025, 2.0, 8), 0xc99a62, [bx + s * 0.9, 0.2, 0], [0.3, 0, s * 1.2]), P(box(0.18, 0.02, 0.4, 0.01), 0xc99a62, [bx + s * 1.7, -0.1, 0.3], [0, 0, s * 1.2])));
  g.add(toMesh(p, { thin: true }), at(foamRing('alta', 1.4), bx));
  return g;
}
function pierMuito() {
  const g = new THREE.Group(), add = adder(g), wood = std(0xffffff, { map: TEX.wood([1, 1], '#9a6a3a'), roughness: 0.85 }), post = std(0xffffff, { map: TEX.bark([1, 2]), color: 0xc0a080, roughness: 0.95 });
  for (let i = 0; i < 4; i++) { add(new THREE.CylinderGeometry(0.16, 0.17, 2.6, 20), post, [-2.6, 0.3, i * 1.2 - 1.8]); add(new THREE.TorusGeometry(0.2, 0.05, 10, 20), std(0xd9b47a, { roughness: 0.95 }), [-2.6, 1.0, i * 1.2 - 1.8], [Math.PI / 2, 0, 0]); }
  for (let i = 0; i < 9; i++) add(new THREE.BoxGeometry(1.4, 0.08, 0.4), wood, [-1.9, 0.6, -2.0 + i * 0.44]);
  const bx = 1.2, H = [[0.0001, -0.4], [0.35, -0.37], [0.6, -0.2], [0.72, 0.05], [0.75, 0.2], [0.0001, 0.2]];
  add(L(H, 56), paint(0x2468d0), [bx, 0, 0], [0, 0, 0], [1.1, 1, 2.2]); add(new THREE.TorusGeometry(0.74, 0.05, 8, 64), paint(0xf6f6f6), [bx, 0.18, 0], [Math.PI / 2, 0, 0], [1.1, 2.2, 1]);
  add(new THREE.CircleGeometry(0.68, 40), std(0xffffff, { map: TEX.wood([2, 2], '#c99a62') }), [bx, 0.06, 0], [-Math.PI / 2, 0, 0], [1.1, 2.2, 1]);
  [-0.6, 0.6].forEach((z) => add(new THREE.BoxGeometry(1.4, 0.06, 0.3), wood, [bx, 0.15, z]));
  [-1, 1].forEach((s) => { add(new THREE.CylinderGeometry(0.025, 0.025, 2.0, 10), wood, [bx + s * 0.9, 0.2, 0], [0.3, 0, s * 1.2]); });
  g.add(at(foamRing('muito', 1.4), bx));
  return g;
}

export const SEA = { atual: seaAtual, alta: seaAlta, muito: seaMuito };
export const HQ6 = {
  sea: { alta: () => seaShowcase('alta'), muito: () => seaShowcase('muito') },
  rboat: { alta: boatAlta, muito: boatMuito },
  lighthouse: { alta: lightAlta, muito: lightMuito },
  obs6: { alta: obs6Alta, muito: obsMuito },
  raft: { alta: raftAlta, muito: raftMuito },
  pier: { alta: pierAlta, muito: pierMuito },
};
