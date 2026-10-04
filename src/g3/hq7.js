// Comparação de qualidade — fase 7 (resgate no vulcão).
import { THREE, P, sph, box, cyl, cone, cap, tor, dome, lathe, taper, slab, rockGeo, toMesh, hex } from './kit.js';
import { TEX } from './hq.js';
import { noise3 } from './hq2.js';

const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8, ...o });
function adder(g) { return (geo, m, p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1]) => { const x = new THREE.Mesh(geo, m); x.position.set(...p); x.rotation.set(...r); x.scale.set(...s); x.castShadow = x.receiveShadow = true; g.add(x); return x; }; }
const L = (pts, seg = 40) => new THREE.LatheGeometry(pts.map(([a, b]) => new THREE.Vector2(Math.max(0.0001, a), b)), seg);
const R0 = (seed) => { let s = seed * 9301 + 49297; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
let glowT = null;
function glow(col, size, op = 0.7) {
  if (!glowT) { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, '#fff'); gr.addColorStop(0.4, 'rgba(255,255,255,.4)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); glowT = new THREE.CanvasTexture(c); }
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowT, color: col, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: op })); s.scale.setScalar(size); return s;
}
// textura de lava: placas escuras de crosta separadas por veios brilhantes
const texC = {};
export function lavaTex(key, vein = 6, rep = 2) {
  if (texC[key]) return texC[key];
  const N = 256, c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d'), r = R0(key.length + 3), im = x.createImageData(N, N);
  const pts = []; for (let i = 0; i < 36; i++) pts.push([r() * N, r() * N]);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { let d1 = 1e9, d2 = 1e9; for (const [px, py] of pts) for (const ox of [-N, 0, N]) for (const oy of [-N, 0, N]) { const d = (i - px - ox) ** 2 + (j - py - oy) ** 2; if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d; }
    const e = Math.sqrt(d2) - Math.sqrt(d1), k = (j * N + i) * 4, n = r() * 0.15;
    let R, G, B; if (e < vein * 0.45) { R = 255; G = 225; B = 110; } else if (e < vein) { R = 255; G = 120; B = 25; } else { const t = Math.min(1, (e - vein) / 10); R = 120 - 70 * t + n * 40; G = 45 - 20 * t + n * 20; B = 30 - 10 * t; }
    im.data[k] = R; im.data[k + 1] = G; im.data[k + 2] = B; im.data[k + 3] = 255; }
  x.putImageData(im, 0, 0);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); return (texC[key] = t);
}
const basalt = () => std(0xffffff, { map: TEX.plaster('#4a3a38', [3, 3]), bumpMap: TEX.plaster('#4a3a38', [3, 3]), bumpScale: 5, roughness: 0.95 });

/** chão escuro de rocha vulcânica para a vitrine */
export const GROUND7 = {
  atual: () => { const m = new THREE.Mesh(new THREE.PlaneGeometry(400, 400).rotateX(-Math.PI / 2), new THREE.MeshToonMaterial({ color: 0x4a3a38 })); return m; },
  alta: () => { const m = new THREE.Mesh(new THREE.PlaneGeometry(400, 400).rotateX(-Math.PI / 2), new THREE.MeshToonMaterial({ color: 0x4f3e3b })); return m; },
  muito: () => { const m = new THREE.Mesh(new THREE.PlaneGeometry(400, 400).rotateX(-Math.PI / 2), std(0xffffff, { map: TEX.plaster('#4a3a38', [80, 80]), bumpMap: TEX.plaster('#4a3a38', [80, 80]), bumpScale: 4, roughness: 1 })); m.receiveShadow = true; return m; },
};

// =================================================================== POÇA E RIO DE LAVA
function lavaSurfaceAlta(rx, rz, seg = 64) {
  // disco com veios amarelos e placas escuras pintados nos vértices (cartoon)
  const geo = new THREE.CircleGeometry(1, seg, 0, Math.PI * 2); const sub = new THREE.PlaneGeometry(2, 2, 90, 90); sub.rotateX(-Math.PI / 2);
  const ps = sub.attributes.position, idx = [], col = new Float32Array(ps.count * 3), c = new THREE.Color();
  for (let i = 0; i < ps.count; i++) { const x = ps.getX(i), z = ps.getZ(i); const n = noise3(x * 4 + 3, 0, z * 4), n2 = noise3(x * 9, 1, z * 9); c.set(0xff6a1a); if (n > 0.55) c.set(0x5a3a30).lerp(new THREE.Color(0x3a2a28), n2); else if (n > 0.48) c.set(0xffd23f); else if (n2 > 0.7) c.set(0xffa43a); col.set([c.r, c.g, c.b], i * 3); ps.setXYZ(i, x * rx, n > 0.55 ? 0.03 : 0, z * rz); }
  sub.setAttribute('color', new THREE.BufferAttribute(col, 3));
  // recorta em forma de elipse (descarta vértices fora): usa alpha por cor de vértice via shader simples
  const m = new THREE.Mesh(sub, new THREE.MeshBasicMaterial({ vertexColors: true })); m.onBeforeRender = () => {};
  m.material.onBeforeCompile = (sh) => { sh.vertexShader = 'varying vec2 vXY;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>\n vXY = vec2(position.x / ${rx.toFixed(2)}, position.z / ${rz.toFixed(2)});`); sh.fragmentShader = 'varying vec2 vXY;\n' + sh.fragmentShader.replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n if (dot(vXY, vXY) > 1.0) discard;'); };
  m.material.customProgramCacheKey = () => 'lavaE' + rx + '_' + rz;
  return m;
}
function lavaAlta() {
  const g = new THREE.Group(), p = [], r = R0(3);
  // borda de rochas escuras em volta da poça + rio que desce
  for (let i = 0; i < 22; i++) { const a = i / 22 * 6.28, rr = 2.1 + r() * 0.2; p.push(P(rockGeo(0.32 + r() * 0.2, i, 0.25, 14, 10), r() < 0.5 ? 0x4a3a3a : 0x5a4646, [Math.cos(a) * rr * 1.3, 0.1, Math.sin(a) * rr], [0, r() * 3, 0], [1.2, 0.6, 1])); }
  for (let i = 0; i < 6; i++) { const a = r() * 6.28; p.push(P(sph(0.06), 0xffd23f, [Math.cos(a) * 1.0, 0.12, Math.sin(a) * 0.8])); p.push(P(tor(0.12, 0.03, 6, 14), 0xffa43a, [Math.cos(a + 1) * 1.4, 0.06, Math.sin(a + 1) * 1.0], [Math.PI / 2, 0, 0])); }
  g.add(toMesh(p, { thin: true }));
  const pool = lavaSurfaceAlta(2.6, 2.0); pool.position.y = 0.05; g.add(pool);
  const river = lavaSurfaceAlta(0.8, 3.0); river.position.set(2.9, 0.04, -2.3); river.rotation.y = 0.75; g.add(river);
  const gl = glow(0xff8a30, 6, 0.45); gl.position.y = 0.6; g.add(gl);
  return g;
}
export function lavaMuito(withRiver = true) {
  const g = new THREE.Group(), add = adder(g), r = R0(3), rock = basalt();
  for (let i = 0; i < 22; i++) { const a = i / 22 * 6.28, rr = 2.1 + r() * 0.2; add(rockGeo(0.32 + r() * 0.2, i, 0.25, 18, 14), rock, [Math.cos(a) * rr * 1.3, 0.1, Math.sin(a) * rr], [0, r() * 3, 0], [1.2, 0.6, 1]); }
  const lt = lavaTex('pool', 9, 1.5), lm = new THREE.MeshStandardMaterial({ map: lt, emissiveMap: lt, emissive: 0xffffff, emissiveIntensity: 0.7, roughness: 0.55, toneMapped: false });
  const pool = add(new THREE.CircleGeometry(1, 64), lm, [0, 0.05, 0], [-Math.PI / 2, 0, 0], [2.6, 2.0, 1]); pool.castShadow = false;
  if (withRiver) { const river = add(new THREE.CircleGeometry(1, 48), lm, [2.9, 0.04, -2.3], [-Math.PI / 2, 0, 0.75], [0.8, 3.0, 1]); river.castShadow = false; }
  // bolhas brilhantes e calor
  const bub = std(0xffb040, { emissive: 0xff8a20, emissiveIntensity: 2, roughness: 0.3 }); for (let i = 0; i < 8; i++) { const a = r() * 6.28, rr = r() * 1.6; const b = add(new THREE.SphereGeometry(0.06 + r() * 0.08, 16, 10, 0, 6.28, 0, 1.6), bub, [Math.cos(a) * rr, 0.06, Math.sin(a) * rr * 0.8]); b.castShadow = false; }
  const pl = new THREE.PointLight(0xff6a20, 30, 8, 1.5); pl.position.set(0, 1.0, 0); g.add(pl);
  const gl = glow(0xff7a20, 6, 0.35); gl.position.y = 0.5; g.add(gl);
  return g;
}

// =================================================================== ILHA DE PEDRA E PEDRAS-PONTE NA LAVA
function islandAlta() {
  const g = new THREE.Group(), p = [], r = R0(5);
  p.push(P(rockGeo(1.15, 2, 0.2, 26, 18), 0x5a4646, [0, 0.1, 0], [0, 0, 0], [1, 0.5, 1]), P(rockGeo(0.5, 6, 0.2), 0x6a5450, [0.5, 0.45, 0.3], [0, 0, 0], [1, 0.6, 1]));
  p.push(P(cyl(0.05, 0.06, 0.6, 8), 0x3a2e2e, [-0.4, 0.75, -0.2]), P(sph(0.12), 0x3fbf5a, [-0.4, 1.08, -0.2], [0, 0, 0], [1.4, 0.6, 1]));
  for (let i = 0; i < 4; i++) { const z = -1.6 - i * 0.75; p.push(P(rockGeo(0.42, i + 3, 0.15, 18, 12), 0x6a5450, [Math.sin(i) * 0.25, 0.05, z], [0, 0, 0], [1, 0.45, 0.9]), P(lathe([[0.4, 0], [0.32, 0.05], [0.0001, 0.06]], 20), 0x8a7470, [Math.sin(i) * 0.25, 0.22, z])); }
  g.add(toMesh(p, { thin: true }));
  const lava = lavaSurfaceAlta(3.6, 4.6); lava.position.set(0, 0.04, -1.2); g.add(lava);
  return g;
}
export function islandMuito() {
  const g = new THREE.Group(), add = adder(g), rock = basalt();
  add(rockGeo(1.15, 2, 0.2, 40, 28), rock, [0, 0.1, 0], [0, 0, 0], [1, 0.5, 1]); add(rockGeo(0.5, 6, 0.2, 24, 18), rock, [0.5, 0.45, 0.3], [0, 0, 0], [1, 0.6, 1]);
  for (let i = 0; i < 4; i++) add(rockGeo(0.42, i + 3, 0.15, 24, 16), rock, [Math.sin(i) * 0.25, 0.05, -1.6 - i * 0.75], [0, 0, 0], [1, 0.45, 0.9]);
  const lt = lavaTex('isl', 9, 2), lm = new THREE.MeshStandardMaterial({ map: lt, emissiveMap: lt, emissive: 0xffffff, emissiveIntensity: 0.7, roughness: 0.55, toneMapped: false });
  const lava = add(new THREE.CircleGeometry(1, 64), lm, [0, 0.04, -1.2], [-Math.PI / 2, 0, 0], [3.6, 4.6, 1]); lava.castShadow = false;
  const pl = new THREE.PointLight(0xff6a20, 30, 8, 1.5); pl.position.set(0, 1.2, -1.5); g.add(pl);
  return g;
}

// =================================================================== CABANA
function hutAlta() {
  const g = new THREE.Group(), p = [], r = R0(7);
  // parede de toras verticais com amarrações
  for (let i = 0; i < 28; i++) { const a = i / 28 * 6.28; p.push(P(cyl(0.19, 0.2, 2.0, 10), i % 2 ? 0xc9a066 : 0xb98a52, [Math.cos(a) * 1.6, 1.0, Math.sin(a) * 1.6])); p.push(P(sph(0.19), 0xc9a066, [Math.cos(a) * 1.6, 2.0, Math.sin(a) * 1.6], [0, 0, 0], [1, 0.4, 1])); }
  [0.5, 1.5].forEach((y) => p.push(P(tor(1.79, 0.04, 6, 56), 0xd9b47a, [0, y, 0], [Math.PI / 2, 0, 0])));
  // telhado de palha em três camadas com bordas desfiadas
  [[2.6, 2.0, 0xd9b062], [2.0, 2.65, 0xe6c070], [1.3, 3.3, 0xd9b062]].forEach(([R, y, c], k) => { p.push(P(lathe([[R, 0], [R * 0.95, 0.12], [R * 0.45, 0.85], [0.0001, 1.0]], 40), c, [0, y, 0])); for (let i = 0; i < 40; i++) { const a = i / 40 * 6.28; p.push(P(cone(0.07, 0.35, 5), hex(c, 0.85 + r() * 0.2), [Math.cos(a) * R * 0.97, y - 0.12, Math.sin(a) * R * 0.97], [Math.PI, 0, 0])); } });
  p.push(P(cone(0.35, 0.5, 14), 0x9a6a3a, [0, 4.35, 0]), P(sph(0.08), 0xff8a1f, [0, 4.6, 0]));
  // porta de tábuas, janela com venezianas, cerquinha e pote
  const fz = -1.62; p.push(P(box(1.0, 1.5, 0.12, 0.06), 0x6a4426, [0, 0.76, fz])); for (let i = 0; i < 4; i++) p.push(P(box(0.22, 1.42, 0.05, 0.02), i % 2 ? 0x7a5030 : 0x6a4426, [-0.33 + i * 0.22, 0.76, fz - 0.06]));
  p.push(P(box(0.9, 0.08, 0.06, 0.02), 0x4a3020, [0, 1.2, fz - 0.1]), P(box(0.9, 0.08, 0.06, 0.02), 0x4a3020, [0, 0.35, fz - 0.1]), P(sph(0.05), 0xffd23f, [0.3, 0.8, fz - 0.12]));
  p.push(P(box(0.6, 0.5, 0.1, 0.04), 0x2b2b35, [1.0, 1.25, fz + 0.32], [0, 0.6, 0]), P(box(0.24, 0.55, 0.05, 0.02), 0x8a5a35, [0.72, 1.25, fz + 0.15], [0, 0.6, 0]), P(box(0.24, 0.55, 0.05, 0.02), 0x8a5a35, [1.25, 1.25, fz + 0.52], [0, 0.6, 0]));
  for (let i = 0; i < 7; i++) p.push(P(cyl(0.05, 0.05, 0.7, 8), 0x9a6a3a, [-2.4 + i * 0.3, 0.35, fz - 0.6]), P(cone(0.05, 0.1, 8), 0x9a6a3a, [-2.4 + i * 0.3, 0.75, fz - 0.6]));
  p.push(P(box(2.0, 0.06, 0.05, 0.02), 0x8a5a35, [-1.5, 0.5, fz - 0.6]), P(lathe([[0.0001, 0], [0.22, 0.02], [0.28, 0.2], [0.18, 0.4], [0.2, 0.46], [0.0001, 0.46]], 20), 0xc4704a, [1.4, 0, fz - 0.6]));
  g.add(toMesh(p, { thin: true }));
  return g;
}
export function hutMuito() {
  const g = new THREE.Group(), add = adder(g), r = R0(7);
  const strawT = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); x.fillStyle = '#c9a050'; x.fillRect(0, 0, 128, 128); for (let i = 0; i < 700; i++) { x.strokeStyle = `rgba(${r() < 0.5 ? '120,85,30' : '245,215,140'},${0.3 + r() * 0.4})`; x.lineWidth = 1 + r(); const px = r() * 128, py = r() * 128; x.beginPath(); x.moveTo(px, py); x.lineTo(px + (r() - 0.5) * 4, py + 10 + r() * 14); x.stroke(); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 2); return t; })();
  const straw = std(0xffffff, { map: strawT, bumpMap: strawT, bumpScale: 4, roughness: 1 }), log = std(0xffffff, { map: TEX.bark([1, 2]), bumpMap: TEX.bark([1, 2]), bumpScale: 3, color: 0xe0c090, roughness: 0.95 });
  for (let i = 0; i < 28; i++) { const a = i / 28 * 6.28; add(new THREE.CylinderGeometry(0.19, 0.2, 2.0, 14), log, [Math.cos(a) * 1.6, 1.0, Math.sin(a) * 1.6], [0, r() * 3, 0]); }
  [0.5, 1.5].forEach((y) => add(new THREE.TorusGeometry(1.79, 0.04, 8, 80), std(0xd9b47a, { roughness: 1 }), [0, y, 0], [Math.PI / 2, 0, 0]));
  [[2.6, 2.0], [2.0, 2.65], [1.3, 3.3]].forEach(([R, y]) => { add(L([[R, 0], [R * 0.95, 0.12], [R * 0.45, 0.85], [0.0001, 1.0]], 64), straw, [0, y, 0]); });
  // franja de palha desfiada (centenas de fios)
  const fiber = new THREE.CylinderGeometry(0.008, 0.012, 0.4, 3); fiber.translate(0, -0.2, 0); const N = 900, inst = new THREE.InstancedMesh(fiber, std(0xd8b060, { roughness: 1 }), N), d = new THREE.Object3D(), col = new THREE.Color();
  for (let i = 0; i < N; i++) { const k = i % 3, R = [2.6, 2.0, 1.3][k], y = [2.0, 2.65, 3.3][k], a = r() * 6.28; d.position.set(Math.cos(a) * R * 0.97, y + 0.05, Math.sin(a) * R * 0.97); d.rotation.set((r() - 0.5) * 0.3, 0, (r() - 0.5) * 0.3); d.scale.setScalar(0.7 + r() * 0.6); d.updateMatrix(); inst.setMatrixAt(i, d.matrix); col.set(0xd8b060).multiplyScalar(0.8 + r() * 0.35); inst.setColorAt(i, col); }
  inst.castShadow = true; g.add(inst);
  add(new THREE.ConeGeometry(0.35, 0.5, 20), log, [0, 4.35, 0]);
  const fz = -1.62, plank = std(0xffffff, { map: TEX.wood([1, 2], '#6a4426') });
  add(new THREE.BoxGeometry(1.0, 1.5, 0.12), plank, [0, 0.76, fz]); add(new THREE.BoxGeometry(0.9, 0.08, 0.06), std(0x3a2818), [0, 1.2, fz - 0.08]); add(new THREE.BoxGeometry(0.9, 0.08, 0.06), std(0x3a2818), [0, 0.35, fz - 0.08]);
  add(new THREE.SphereGeometry(0.05, 12, 8), std(0xe0b030, { metalness: 1, roughness: 0.3 }), [0.3, 0.8, fz - 0.1]);
  // luz quentinha saindo da janela
  const win = add(new THREE.BoxGeometry(0.6, 0.5, 0.06), std(0xffb050, { emissive: 0xff9a30, emissiveIntensity: 1.5 }), [1.0, 1.25, fz + 0.32], [0, 0.6, 0]); win.castShadow = false;
  for (let i = 0; i < 7; i++) add(new THREE.CylinderGeometry(0.05, 0.05, 0.7, 10), log, [-2.4 + i * 0.3, 0.35, fz - 0.6]);
  add(new THREE.BoxGeometry(2.0, 0.06, 0.05), plank, [-1.5, 0.5, fz - 0.6]);
  add(L([[0.0001, 0], [0.22, 0.02], [0.28, 0.2], [0.18, 0.4], [0.2, 0.46], [0.0001, 0.46]], 32), std(0xb5603a, { roughness: 0.7 }), [1.4, 0, fz - 0.6]);
  return g;
}

// =================================================================== ÁRVORE SECA E FUMAROLA
export function deadVentAlta() {
  const g = new THREE.Group(), p = [], sm = [], r = R0(9);
  const tr = [[0, 0, 0], [0.1, 1.2, 0], [-0.1, 2.4, 0.05], [0.05, 3.2, 0]]; p.push(P(taper(tr, [0.32, 0.22, 0.16, 0.08], 16, 12), 0x3a2e28));
  [[0.6, 1.6, 0.9, 1], [2.2, 2.0, 0.8, -1], [4.0, 2.6, 0.6, 1], [1.4, 2.8, 0.5, -1]].forEach(([a, y, len, s]) => { const t = [Math.cos(a) * len, y + 0.6, Math.sin(a) * len]; p.push(P(taper([[0, y, 0], [t[0] * 0.5, y + 0.4, t[2] * 0.5], t], [0.1, 0.07, 0.03], 12, 8), 0x3a2e28)); p.push(P(taper([[t[0] * 0.7, y + 0.5, t[2] * 0.7], [t[0] * 0.9 + s * 0.2, y + 0.9, t[2] * 0.9], [t[0] + s * 0.3, y + 1.1, t[2]]], [0.04, 0.03, 0.01], 10, 6), 0x3a2e28)); });
  [0, 2.1, 4.2].forEach((a) => p.push(P(taper([[0, 0.4, 0], [Math.cos(a) * 0.4, 0.08, Math.sin(a) * 0.4], [Math.cos(a) * 0.7, -0.02, Math.sin(a) * 0.7]], [0.14, 0.09, 0.03], 10, 8), 0x3a2e28)));
  for (let i = 0; i < 4; i++) p.push(P(sph(0.05), 0xff6a1a, [Math.sin(i * 2) * 0.28, 0.5 + i * 0.6, Math.cos(i * 2) * 0.28 - 0.1], [0, 0, 0], [0.6, 1.4, 0.6])); // brasas nas rachaduras
  // fumarola: cone de rocha rachado com brilho e fumaça em tufos
  const vx = 2.6; p.push(P(lathe([[1.2, 0], [1.0, 0.4], [0.5, 1.0], [0.38, 1.15], [0.3, 1.0], [0.0001, 1.0]], 36), 0x4a3a3a, [vx, 0, 0]), P(cyl(0.3, 0.3, 0.05, 20), 0xff8a1f, [vx, 1.02, 0]));
  for (let i = 0; i < 5; i++) { const a = i * 1.3; p.push(P(taper([[vx + Math.cos(a) * 0.45, 0.95, Math.sin(a) * 0.45], [vx + Math.cos(a) * 0.8, 0.5, Math.sin(a) * 0.8], [vx + Math.cos(a) * 1.05, 0.1, Math.sin(a) * 1.05]], [0.03, 0.025, 0.02], 10, 6), 0xffa43a)); }
  for (let i = 0; i < 7; i++) sm.push(P(rockGeo(0.35 + i * 0.12, i, 0.25, 14, 10), hex(0xb5bac6, 1 - i * 0.05), [vx + Math.sin(i * 1.4) * 0.2 + i * 0.12, 1.5 + i * 0.5, Math.cos(i) * 0.15]));
  g.add(toMesh(p, { thin: true }), toMesh(sm, { outline: false }));
  const gl = glow(0xff8a30, 1.6, 0.6); gl.position.set(vx, 1.1, 0); g.add(gl);
  return g;
}
function deadVentMuito() {
  const g = new THREE.Group(), add = adder(g), bark = std(0xffffff, { map: TEX.bark([2, 2]), bumpMap: TEX.bark([2, 2]), bumpScale: 4, color: 0x5a4a44, roughness: 1 });
  add(taper([[0, 0, 0], [0.1, 1.2, 0], [-0.1, 2.4, 0.05], [0.05, 3.2, 0]], [0.32, 0.22, 0.16, 0.08], 24, 16), bark);
  [[0.6, 1.6, 0.9, 1], [2.2, 2.0, 0.8, -1], [4.0, 2.6, 0.6, 1], [1.4, 2.8, 0.5, -1]].forEach(([a, y, len, s]) => { const t = [Math.cos(a) * len, y + 0.6, Math.sin(a) * len]; add(taper([[0, y, 0], [t[0] * 0.5, y + 0.4, t[2] * 0.5], t], [0.1, 0.07, 0.03], 16, 10), bark); add(taper([[t[0] * 0.7, y + 0.5, t[2] * 0.7], [t[0] * 0.9 + s * 0.2, y + 0.9, t[2] * 0.9], [t[0] + s * 0.3, y + 1.1, t[2]]], [0.04, 0.03, 0.01], 12, 8), bark); });
  [0, 2.1, 4.2].forEach((a) => add(taper([[0, 0.4, 0], [Math.cos(a) * 0.4, 0.08, Math.sin(a) * 0.4], [Math.cos(a) * 0.7, -0.02, Math.sin(a) * 0.7]], [0.14, 0.09, 0.03], 12, 10), bark));
  const vx = 2.6, lt = lavaTex('vent', 4, 1);
  add(L([[1.2, 0], [1.0, 0.4], [0.5, 1.0], [0.38, 1.15], [0.3, 1.0], [0.0001, 1.0]], 64), new THREE.MeshStandardMaterial({ map: lt, emissiveMap: lt, emissive: 0xffffff, emissiveIntensity: 0.6, roughness: 0.9 }), [vx, 0, 0]);
  add(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 32), std(0xff8a1f, { emissive: 0xff6a10, emissiveIntensity: 3 }), [vx, 1.02, 0]);
  const smoke = new THREE.MeshStandardMaterial({ color: 0x9a9fab, roughness: 1, transparent: true, opacity: 0.55, depthWrite: false });
  for (let i = 0; i < 14; i++) { const m = add(new THREE.SphereGeometry(0.3 + i * 0.07, 20, 14), smoke.clone(), [vx + Math.sin(i * 1.4) * 0.25 + i * 0.08, 1.4 + i * 0.3, Math.cos(i) * 0.2]); m.castShadow = false; m.material.opacity = 0.55 - i * 0.03; }
  const pl = new THREE.PointLight(0xff6a20, 12, 5); pl.position.set(vx, 1.4, 0); g.add(pl);
  return g;
}

// =================================================================== OBSTÁCULO: PEDRA DE LAVA
function lavarockAlta() {
  const g = new THREE.Group(), p = [];
  p.push(P(rockGeo(0.62, 3.1, 0.25, 26, 18), 0x4a3a3a, [0, 0.38, 0], [0, 0.4, 0], [1.1, 0.8, 0.9]), P(rockGeo(0.4, 5.3, 0.25, 20, 14), 0x5a4646, [0.5, 0.26, 0.15], [0, 0.2, 0], [1, 0.8, 0.9]));
  // rachaduras brilhantes que serpenteiam na frente da pedra
  [[[-0.5, 0.2, -0.45], [-0.25, 0.45, -0.52], [-0.05, 0.4, -0.55], [0.15, 0.65, -0.5]], [[0.1, 0.15, -0.52], [0.3, 0.3, -0.48], [0.5, 0.2, -0.4]], [[-0.3, 0.7, -0.38], [-0.1, 0.8, -0.35], [0.1, 0.75, -0.42]]].forEach((c) => { p.push(P(taper(c, c.map(() => 0.035), 16, 6), 0xff8a1f)); p.push(P(taper(c.map(([x, y, z]) => [x, y, z - 0.012]), c.map(() => 0.016), 16, 6), 0xffe066)); });
  for (let i = 0; i < 3; i++) p.push(P(rockGeo(0.1, i + 7, 0.2, 10, 8), 0x3a2e2e, [-0.6 + i * 0.5, 0.05, -0.65]));
  g.add(toMesh(p, { thin: true }));
  return g;
}
export function lavarockMuito() {
  const g = new THREE.Group(), add = adder(g), lt = lavaTex('rock', 4, 1.2);
  const m = new THREE.MeshStandardMaterial({ map: lt, emissiveMap: lt, emissive: 0xffffff, emissiveIntensity: 0.6, roughness: 0.85, bumpMap: lt, bumpScale: 4 });
  add(rockGeo(0.62, 3.1, 0.25, 40, 28), m, [0, 0.38, 0], [0, 0.4, 0], [1.1, 0.8, 0.9]); add(rockGeo(0.4, 5.3, 0.25, 32, 24), m, [0.5, 0.26, 0.15], [0, 0.2, 0], [1, 0.8, 0.9]);
  const pl = new THREE.PointLight(0xff6a20, 6, 3); pl.position.set(0, 0.6, -0.9); g.add(pl);
  return g;
}

export const HQ7 = {
  lava: { alta: lavaAlta, muito: lavaMuito },
  lavaisle: { alta: islandAlta, muito: islandMuito },
  hut: { alta: hutAlta, muito: hutMuito },
  deadvent: { alta: deadVentAlta, muito: deadVentMuito },
  lavarock: { alta: lavarockAlta, muito: lavarockMuito },
};
