// Comparação de qualidade — fase 3 (floresta).
import { THREE, P, sph, box, cyl, cone, cap, tor, dome, lathe, taper, slab, rockGeo, toMesh, hex } from './kit.js';
import { buildBunny } from './creatures.js';
import { TEX, leafN, leafS } from './hq.js';
import { withLevel } from './hq2.js';

const R0 = (seed) => { let s = seed * 9301 + 49297; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, ...o });
function adder(g) { return (geo, m, p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1]) => { const x = new THREE.Mesh(geo, m); x.position.set(...p); x.rotation.set(...r); x.scale.set(...s); x.castShadow = x.receiveShadow = true; g.add(x); return x; }; }
const texCache = {};
function ctex(key, w, h, draw, rep = [1, 1]) {
  const k = key + rep; if (texCache[k]) return texCache[k];
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); t.anisotropy = 8; return (texCache[k] = t);
}
// texturas da floresta
const TX = {
  needles: () => ctex('needles', 128, 128, (x, w, h) => { x.clearRect(0, 0, w, h); x.strokeStyle = '#fff'; x.lineCap = 'round'; for (let i = 0; i < 46; i++) { const t = i / 46, y = 6 + t * 116; x.lineWidth = 3; x.beginPath(); x.moveTo(64, y); x.lineTo(64 - 40 * (1 - t * 0.5), y + 16); x.stroke(); x.beginPath(); x.moveTo(64, y); x.lineTo(64 + 40 * (1 - t * 0.5), y + 16); x.stroke(); } x.lineWidth = 5; x.beginPath(); x.moveTo(64, 2); x.lineTo(64, 126); x.stroke(); }),
  fern: () => ctex('fern', 64, 256, (x, w, h) => { x.clearRect(0, 0, w, h); x.fillStyle = '#fff'; x.fillRect(30, 0, 4, h); for (let i = 0; i < 26; i++) { const y = 8 + i * 9.4, L = 28 * Math.sin((1 - i / 26) * Math.PI * 0.9 + 0.2); [-1, 1].forEach((s) => { x.beginPath(); x.ellipse(32 + s * L / 2, y + 3, L / 2, 3.6, s * 0.35, 0, Math.PI * 2); x.fill(); }); } }),
  leafBig: () => ctex('leafbig', 256, 256, (x, w, h) => { const g = x.createRadialGradient(128, 128, 10, 128, 128, 150); g.addColorStop(0, '#6fe07a'); g.addColorStop(1, '#2a9a48'); x.fillStyle = g; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(220,255,200,.75)'; x.lineWidth = 6; x.beginPath(); x.moveTo(128, 0); x.lineTo(128, h); x.stroke(); x.lineWidth = 3; for (let i = 0; i < 9; i++) { const y = 20 + i * 26; [-1, 1].forEach((s) => { x.beginPath(); x.moveTo(128, y); x.quadraticCurveTo(128 + s * 60, y + 10, 128 + s * 120, y + 40); x.stroke(); }); } for (let i = 0; i < 500; i++) { x.fillStyle = `rgba(0,60,0,${Math.random() * 0.06})`; x.fillRect(Math.random() * w, Math.random() * h, 3, 3); } }),
  rock: (rep = [2, 2]) => ctex('rock', 128, 128, (x, w, h) => { x.fillStyle = '#9aa1ad'; x.fillRect(0, 0, w, h); for (let i = 0; i < 2600; i++) { const v = Math.random(); x.fillStyle = `rgba(${v < 0.5 ? '50,55,65' : '230,232,238'},${Math.random() * 0.14})`; const s = 1 + Math.random() * 4; x.fillRect(Math.random() * w, Math.random() * h, s, s); } x.strokeStyle = 'rgba(40,44,52,.35)'; x.lineWidth = 1.5; for (let i = 0; i < 8; i++) { x.beginPath(); let px = Math.random() * w, py = Math.random() * h; x.moveTo(px, py); for (let k = 0; k < 5; k++) { px += (Math.random() - 0.5) * 30; py += (Math.random() - 0.5) * 30; x.lineTo(px, py); } x.stroke(); } }, rep),
  moss: (rep = [2, 2]) => ctex('moss', 128, 128, (x, w, h) => { x.fillStyle = '#4f9a3a'; x.fillRect(0, 0, w, h); for (let i = 0; i < 3000; i++) { x.fillStyle = `rgba(${Math.random() < 0.5 ? '120,200,80' : '30,80,30'},${Math.random() * 0.4})`; x.fillRect(Math.random() * w, Math.random() * h, 2, 2); } }, rep),
  rings: () => ctex('rings', 128, 128, (x, w, h) => { x.fillStyle = '#e8c48c'; x.fillRect(0, 0, w, h); for (let r = 6; r < 64; r += 5 + Math.random() * 3) { x.strokeStyle = `rgba(150,95,45,${0.35 + Math.random() * 0.3})`; x.lineWidth = 1.5; x.beginPath(); x.arc(64 + Math.random() * 2, 64 + Math.random() * 2, r, 0, Math.PI * 2); x.stroke(); } x.fillStyle = '#7a4e2c'; x.beginPath(); x.arc(64, 64, 60, 0, Math.PI * 2); x.lineWidth = 8; x.strokeStyle = '#6a4024'; x.stroke(); }),
};

// =================================================================== PINHEIRO
function pineAlta() {
  const p = [P(taper([[0, 0, 0], [0.04, 2.5, 0], [0, 4.9, 0]], [0.32, 0.2, 0.06], 12, 14), 0x7a4e2a)];
  [0, 2.1, 4.2].forEach((a) => p.push(P(taper([[0, 0.3, 0], [Math.cos(a) * 0.35, 0.05, Math.sin(a) * 0.35], [Math.cos(a) * 0.55, -0.02, Math.sin(a) * 0.55]], [0.14, 0.09, 0.03], 10, 10), 0x6e4426)));
  // camadas com borda ondulada (galhos caídos), mais claras em cima
  for (let i = 0; i < 6; i++) {
    const k = 1 - i * 0.15, y = 1.0 + i * 0.68, R = 1.75 * k, H = 1.25 * k;
    const g = new THREE.LatheGeometry([[0.0001, H], [R * 0.25, H * 0.75], [R * 0.75, H * 0.25], [R, 0], [R * 0.92, -0.12], [R * 0.5, 0.1], [0.0001, 0.2]].reverse().map(([a, b]) => new THREE.Vector2(a, b)), 48);
    const pos = g.attributes.position; for (let v = 0; v < pos.count; v++) { const x = pos.getX(v), z = pos.getZ(v), r = Math.hypot(x, z); if (r < 0.01) continue; const a = Math.atan2(z, x), w = (r / R) ** 2 * 0.12 * Math.sin(a * 9 + i); pos.setXYZ(v, x * (1 + w), pos.getY(v) - Math.abs(Math.sin(a * 9 + i)) * 0.14 * (r / R) ** 2, z * (1 + w)); }
    g.computeVertexNormals(); p.push(P(g, hex(0x1f9a52, 0.82 + i * 0.07), [0, y, 0]));
  }
  for (let i = 0; i < 5; i++) { const a = i * 1.9; p.push(P(lathe([[0.0001, 0], [0.07, 0.04], [0.08, 0.14], [0.0001, 0.22]], 10), 0x8a5a2e, [Math.cos(a) * 1.1, 1.5 + (i % 3) * 0.8, Math.sin(a) * 1.1], [Math.PI, 0, 0])); }
  return toMesh(p, { thin: true });
}
export function pineMuito() {
  const g = new THREE.Group(), add = adder(g), r = R0(4);
  add(taper([[0, 0, 0], [0.04, 2.5, 0], [0, 5.2, 0]], [0.32, 0.2, 0.05], 24, 18), std(0xffffff, { map: TEX.bark([3, 2]), bumpMap: TEX.bark([3, 2]), bumpScale: 3, roughness: 0.95 }));
  // núcleo escuro em camadas + ~2600 raminhos de agulhas
  const core = std(0x0f4a24, { roughness: 1 });
  for (let i = 0; i < 6; i++) { const k = 1 - i * 0.15; add(new THREE.ConeGeometry(1.4 * k, 1.1 * k, 24), core, [0, 1.45 + i * 0.68, 0]); }
  const geo = new THREE.PlaneGeometry(0.42 * leafS(), 0.6 * leafS()); geo.translate(0, 0.28 * leafS(), 0);
  const mat = std(0xffffff, { map: TX.needles(), alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.7 });
  const N = leafN(2600), inst = new THREE.InstancedMesh(geo, mat, N), d = new THREE.Object3D(), col = new THREE.Color();
  for (let i = 0; i < N; i++) {
    const t = Math.pow(r(), 1.3), y = 0.95 + t * 4.2, R = (1 - t) * 1.85 + 0.04, a = r() * Math.PI * 2, rr = R * (0.55 + r() * 0.5);
    d.position.set(Math.cos(a) * rr, y - (rr / 1.85) * 0.25, Math.sin(a) * rr); d.rotation.set(0, -a + Math.PI / 2, 0); d.rotateX(-1.2 - r() * 0.5); d.rotateY((r() - 0.5) * 0.8);
    d.scale.setScalar((0.8 + r() * 0.6) * (1 - t * 0.55)); d.updateMatrix(); inst.setMatrixAt(i, d.matrix);
    col.set(0x2a8a46).multiplyScalar(0.6 + 0.55 * t + (r() - 0.5) * 0.2); inst.setColorAt(i, col);
  }
  inst.castShadow = inst.receiveShadow = true; inst.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: TX.needles(), alphaTest: 0.45 }); g.add(inst);
  for (let i = 0; i < 6; i++) { const a = i * 1.9; add(new THREE.LatheGeometry([[0.0001, 0], [0.07, 0.04], [0.08, 0.14], [0.0001, 0.22]].map(([a2, b]) => new THREE.Vector2(a2, b)), 16), std(0x7a4a26, { roughness: 0.9 }), [Math.cos(a) * 1.0, 1.6 + (i % 3) * 0.8, Math.sin(a) * 1.0], [Math.PI, 0, 0]); }
  return g;
}

// =================================================================== ÁRVORE GRANDE (folhagem)
function bigCanopy(r) { const out = []; for (let i = 0; i < 34; i++) { const u = 1 - 2 * (i + 0.5) / 34, th = i * 2.4, s = Math.sqrt(1 - u * u); if (u < -0.7) continue; out.push([Math.cos(th) * s * 2.6, 5.2 + u * 1.6, Math.sin(th) * s * 2.3, 0.7 + r() * 0.35]); } out.push([0, 5.2, 0, 1.9]); return out; }
const BIG_TRUNK = { pts: [[0, 0, 0], [0.15, 1.6, 0], [-0.1, 3.2, 0], [0, 4.2, 0]], r: [0.75, 0.5, 0.4, 0.3] };
const bigBranches = () => [0.5, 2.6, 4.4, 1.5].map((a, i) => ({ pts: [[0, 2.8 + i * 0.25, 0], [Math.cos(a) * 1.0, 3.6 + i * 0.2, Math.sin(a) * 1.0], [Math.cos(a) * 1.9, 4.6, Math.sin(a) * 1.7]], r: [0.24, 0.15, 0.08] }));
const bigRoots = () => [0, 1, 2, 3, 4].map((i) => { const a = i / 5 * 6.28 + 0.3; return { pts: [[0, 0.7, 0], [Math.cos(a) * 0.7, 0.15, Math.sin(a) * 0.7], [Math.cos(a) * 1.25, -0.03, Math.sin(a) * 1.25]], r: [0.3, 0.2, 0.06] }; });
function bigtreeAlta() {
  const r = R0(7), wood = [], leaf = [];
  [BIG_TRUNK, ...bigRoots(), ...bigBranches()].forEach((b) => wood.push(P(taper(b.pts, b.r, 16, 16), 0x8a5a35)));
  wood.push(P(cyl(0.18, 0.2, 0.06, 18), 0x3a2410, [0.12, 1.5, -0.62], [Math.PI / 2 - 0.1, 0, 0])); // buraco no tronco
  const pf = bigCanopy(r);
  pf.forEach(([x, y, z, rr], i) => leaf.push(P(rockGeo(rr, i * 1.3, 0.1, 18, 13), hex(0x2fb55a, Math.max(0.6, Math.min(1.2, 0.72 + 0.45 * (y - 3.8) / 3))), [x, y, z])));
  pf.filter((q) => q[1] > 6.0).forEach(([x, y, z, rr], i) => leaf.push(P(rockGeo(rr * 0.55, i + 4, 0.1), hex(0x2fb55a, 1.28), [x - 0.1, y + rr * 0.5, z - 0.1])));
  for (let i = 0; i < 6; i++) { const a = i * 1.1; leaf.push(P(taper([[Math.cos(a) * 2.2, 4.4, Math.sin(a) * 2.0], [Math.cos(a) * 2.3, 3.6, Math.sin(a) * 2.1], [Math.cos(a) * 2.25, 2.9, Math.sin(a) * 2.05]], [0.03, 0.025, 0.02], 10, 6), 0x3f9a3a)); } // cipós
  const g = new THREE.Group(); g.add(toMesh(wood, { thin: true }), toMesh(leaf, { outline: false })); return g;
}
export function bigtreeMuito() {
  const r = R0(7), g = new THREE.Group(), add = adder(g), bark = std(0xffffff, { map: TEX.bark([4, 2]), bumpMap: TEX.bark([4, 2]), bumpScale: 4, roughness: 0.95 });
  [BIG_TRUNK, ...bigRoots(), ...bigBranches()].forEach((b) => add(taper(b.pts, b.r, 28, 22), bark));
  const pf = bigCanopy(r), core = std(0x16502a, { roughness: 1 });
  pf.forEach(([x, y, z, rr], i) => add(rockGeo(rr * 0.82, i * 1.3, 0.12, 16, 12), core, [x, y, z]));
  const geo = new THREE.PlaneGeometry(0.4 * leafS(), 0.4 * leafS()); geo.translate(0, 0.16 * leafS(), 0);
  const mat = std(0xffffff, { map: TEX.leaf(), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.6 });
  const N = leafN(6000), inst = new THREE.InstancedMesh(geo, mat, N), d = new THREE.Object3D(), col = new THREE.Color(), n = new THREE.Vector3();
  for (let i = 0; i < N; i++) {
    const [px, py, pz, rr0] = pf[i % pf.length], u = r() * 2 - 1, th = r() * 6.28, s = Math.sqrt(1 - u * u); n.set(Math.cos(th) * s, u, Math.sin(th) * s);
    const rr = rr0 * (0.85 + r() * 0.25); d.position.set(px + n.x * rr, py + n.y * rr, pz + n.z * rr); d.lookAt(d.position.x + n.x + (r() - 0.5), d.position.y + n.y + 0.6, d.position.z + n.z + (r() - 0.5)); d.rotateZ(r() * 6.28);
    d.scale.setScalar(0.75 + r() * 0.6); d.updateMatrix(); inst.setMatrixAt(i, d.matrix);
    col.set(0x2f9a4a).multiplyScalar(Math.max(0.45, Math.min(1.3, 0.62 + 0.4 * (d.position.y - 3.6) / 3.2 + n.y * 0.12 + (r() - 0.5) * 0.25))); col.offsetHSL((r() - 0.5) * 0.05, 0, 0); inst.setColorAt(i, col);
  }
  inst.castShadow = inst.receiveShadow = true; inst.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: TEX.leaf(), alphaTest: 0.5 }); g.add(inst);
  const vine = std(0x3f8a34); for (let i = 0; i < 6; i++) { const a = i * 1.1; add(taper([[Math.cos(a) * 2.2, 4.4, Math.sin(a) * 2.0], [Math.cos(a) * 2.3, 3.6, Math.sin(a) * 2.1], [Math.cos(a) * 2.25, 2.9, Math.sin(a) * 2.05]], [0.03, 0.025, 0.02], 12, 8), vine); }
  return g;
}

// =================================================================== PLANTAS DO CHÃO (samambaia, cogumelos, pedra)
function frond(p, a, len, lean, col) {
  // haste curva com folíolos dos dois lados, diminuindo até a ponta
  const pts = [[0, 0.05, 0], [Math.cos(a) * len * 0.35, len * 0.45, Math.sin(a) * len * 0.35], [Math.cos(a) * len * 0.75, len * 0.5 - lean, Math.sin(a) * len * 0.75], [Math.cos(a) * len, len * 0.25 - lean, Math.sin(a) * len]];
  p.push(P(taper(pts, [0.025, 0.02, 0.015, 0.005], 16, 6), hex(col, 0.8)));
  const curve = new THREE.CatmullRomCurve3(pts.map((q) => new THREE.Vector3(...q)));
  for (let i = 2; i < 16; i++) { const t = i / 16, q = curve.getPoint(t), tg = curve.getTangent(t), L = 0.22 * Math.sin((1 - t) * Math.PI * 0.85 + 0.15);
    [-1, 1].forEach((s) => { const side = new THREE.Vector3(-tg.z, 0, tg.x).normalize().multiplyScalar(s); p.push(P(new THREE.SphereGeometry(0.1, 10, 6), hex(col, 0.9 + t * 0.25), [q.x + side.x * L * 0.5, q.y, q.z + side.z * L * 0.5], [0, -Math.atan2(side.z, side.x), 0], [L * 5.0, 0.16, 0.5])); }); }
}
function groundAlta() {
  const p = [], fp = [], r = R0(2);
  for (let i = 0; i < 9; i++) frond(fp, i / 9 * 6.28 + r() * 0.3, 1.3 + r() * 0.4, 0.4, 0x3fbf5a);
  // cogumelos: chapéu com lamelas, pintas em relevo e anel no caule
  [[1.6, 0, 0.3, 1.0], [2.1, 0.3, 0.8, 0.65], [1.3, -0.4, 0.5, 0.55]].forEach(([x, z, , s]) => {
    p.push(P(lathe([[0.16, 0], [0.13, 0.25], [0.12, 0.45], [0.0001, 0.48]], 20), 0xfff3dc, [x, 0, z], [0, 0, 0], [s, s, s]), P(lathe([[0.2, 0], [0.24, -0.04], [0.0001, -0.06]], 20), 0xf2e2c4, [x, 0.33 * s, z], [0, 0, 0], [s, s, s]));
    p.push(P(lathe([[0.0001, 0.38], [0.5, 0.36], [0.6, 0.42], [0.55, 0.6], [0.35, 0.82], [0.0001, 0.9]], 32), 0xe8352f, [x, 0, z], [0, 0, 0], [s, s, s]), P(lathe([[0.12, 0.42], [0.5, 0.37], [0.0001, 0.37]], 32), 0xf5d9b8, [x, 0, z], [0, 0, 0], [s, s, s]));
    for (let k = 0; k < 7; k++) { const a = k * 2.2, rr = k === 0 ? 0 : 0.3 + (k % 2) * 0.12; p.push(P(dome(0.075, 0, 1.4), 0xffffff, [x + Math.cos(a) * rr * s, (0.88 - rr * 0.55) * s, z + Math.sin(a) * rr * s], [Math.sin(a) * rr * 1.6, 0, -Math.cos(a) * rr * 1.6], [s, s * 0.6, s])); }
  });
  // pedra com musgo e pedrinhas
  p.push(P(rockGeo(0.75, 3.3, 0.22, 22, 16), 0x9aa3b5, [-1.9, 0.38, 0.2], [0, 0.4, 0], [1.2, 0.7, 1.0]), P(rockGeo(0.45, 7.1, 0.25, 18, 14), 0xa9b1c4, [-1.2, 0.22, 0.5], [0, 0, 0], [1, 0.7, 1]), P(rockGeo(0.5, 2.2, 0.2, 16, 12), 0x5fb84a, [-2.0, 0.78, 0.25], [0, 0, 0], [1.4, 0.35, 1.1]));
  for (let i = 0; i < 6; i++) p.push(P(rockGeo(0.09 + r() * 0.06, i, 0.2, 10, 8), 0x8f98ab, [-1.6 + r() * 1.2, 0.05, -0.4 - r() * 0.4]));
  for (let i = 0; i < 40; i++) { const a = r() * 6.28, rr = 0.5 + r() * 2.2; fp.push(P(cone(0.03, 0.3, 5), hex(0x3fbf5a, 0.8 + r() * 0.4), [Math.cos(a) * rr, 0.14, Math.sin(a) * rr - 0.6], [r() * 0.4 - 0.2, 0, r() * 0.4 - 0.2])); }
  const g = new THREE.Group(); g.add(toMesh(p, { thin: true }), toMesh(fp, { outline: false })); return g;
}
export function groundMuito() {
  const g = new THREE.Group(), add = adder(g), r = R0(2);
  // samambaia: 12 folhas recortadas (textura), curvadas
  const fg = new THREE.PlaneGeometry(0.42, 1.6, 1, 12); fg.translate(0, 0.8, 0);
  const pos = fg.attributes.position; for (let i = 0; i < pos.count; i++) { const y = pos.getY(i), t = y / 1.6; pos.setZ(i, -Math.pow(t, 2) * 0.7); pos.setY(i, y * (1 - t * 0.25)); } fg.computeVertexNormals();
  const fm = std(0x3aa84a, { map: TX.fern(), alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.6 });
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28 + r() * 0.3; const m = add(fg, fm, [0, 0.02, 0], [0, -a, 0]); m.rotateX(-0.7 - r() * 0.3); m.scale.setScalar(1.4 + r() * 0.4); m.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: TX.fern(), alphaTest: 0.4 }); }
  const L = (pts, seg = 40) => new THREE.LatheGeometry(pts.map(([a, b]) => new THREE.Vector2(a, b)), seg);
  const capM = new THREE.MeshPhysicalMaterial({ color: 0xd92a22, roughness: 0.35, clearcoat: 0.8, clearcoatRoughness: 0.25 }), stemM = new THREE.MeshPhysicalMaterial({ color: 0xfff1da, roughness: 0.6, sheen: 0.6, sheenColor: new THREE.Color(0xffffff) }), dot = std(0xfffaf0, { roughness: 0.8 }), gill = std(0xf0d4ae, { roughness: 0.9 });
  [[1.6, 0, 1.0], [2.1, 0.3, 0.65], [1.3, -0.4, 0.55]].forEach(([x, z, s]) => {
    add(L([[0.16, 0], [0.13, 0.25], [0.12, 0.45], [0.0001, 0.48]]), stemM, [x, 0, z], [0, 0, 0], [s, s, s]); add(L([[0.2, 0], [0.24, -0.04], [0.0001, -0.06]]), stemM, [x, 0.33 * s, z], [0, 0, 0], [s, s, s]);
    add(L([[0.0001, 0.38], [0.5, 0.36], [0.6, 0.42], [0.55, 0.6], [0.35, 0.82], [0.0001, 0.9]], 48), capM, [x, 0, z], [0, 0, 0], [s, s, s]); add(L([[0.12, 0.42], [0.5, 0.37], [0.0001, 0.37]], 48), gill, [x, 0, z], [0, 0, 0], [s, s, s]);
    for (let k = 0; k < 7; k++) { const a = k * 2.2, rr = k === 0 ? 0 : 0.3 + (k % 2) * 0.12; add(new THREE.SphereGeometry(0.075, 16, 8, 0, 6.28, 0, 1.4), dot, [x + Math.cos(a) * rr * s, (0.88 - rr * 0.55) * s, z + Math.sin(a) * rr * s], [Math.sin(a) * rr * 1.6, 0, -Math.cos(a) * rr * 1.6], [s, s * 0.6, s]); }
  });
  const rockM = std(0xffffff, { map: TX.rock(), bumpMap: TX.rock(), bumpScale: 4, roughness: 0.9 }), mossM = std(0xffffff, { map: TX.moss(), roughness: 1 });
  add(rockGeo(0.75, 3.3, 0.22, 32, 24), rockM, [-1.9, 0.38, 0.2], [0, 0.4, 0], [1.2, 0.7, 1.0]); add(rockGeo(0.45, 7.1, 0.25, 24, 18), rockM, [-1.2, 0.22, 0.5], [0, 0, 0], [1, 0.7, 1]); add(rockGeo(0.5, 2.2, 0.2, 24, 16), mossM, [-2.0, 0.78, 0.25], [0, 0, 0], [1.4, 0.35, 1.1]);
  for (let i = 0; i < 6; i++) add(rockGeo(0.09 + r() * 0.06, i, 0.2, 12, 10), rockM, [-1.6 + r() * 1.2, 0.05, -0.4 - r() * 0.4]);
  return g;
}

// =================================================================== OBSTÁCULOS DA FLORESTA (tronco, pedra, cogumelo)
function obsAlta() {
  const g = new THREE.Group(), lg = [], r = R0(9);
  // tronco caído: casca com sulcos, anéis no corte, galhinho e musgo
  const t = taper([[-0.95, 0.34, 0], [0, 0.37, 0.02], [0.95, 0.34, 0]], [0.34, 0.37, 0.33], 24, 28); const ps = t.attributes.position;
  for (let i = 0; i < ps.count; i++) { const y = ps.getY(i) - 0.35, z = ps.getZ(i), a = Math.atan2(z, y), k = 1 + 0.06 * Math.abs(Math.sin(a * 11)); ps.setY(i, 0.35 + y * k); ps.setZ(i, z * k); } t.computeVertexNormals();
  lg.push(P(t, 0x8f5f33));
  [-0.96, 0.96].forEach((x) => { lg.push(P(cyl(0.345, 0.345, 0.05, 28), 0xe9c58f, [x, 0.34, 0], [0, 0, Math.PI / 2])); [0.09, 0.17, 0.25].forEach((rr) => lg.push(P(tor(rr, 0.012, 6, 24), 0xc7955a, [x * 1.016, 0.34, 0], [0, Math.PI / 2, 0]))); lg.push(P(tor(0.34, 0.03, 6, 28), 0x6a4024, [x * 1.01, 0.34, 0], [0, Math.PI / 2, 0])); });
  lg.push(P(rockGeo(0.2, 2.2, 0.15), 0x59c24a, [0.2, 0.68, 0], [0, 0, 0], [2.2, 0.45, 1.3]), P(taper([[-0.3, 0.62, 0.1], [-0.4, 0.95, 0.15], [-0.5, 1.08, 0.1]], [0.06, 0.04, 0.02], 10, 8), 0x8a5a2e), P(sph(0.08), 0x3fbf5a, [-0.5, 1.1, 0.1], [0, 0, 0], [1.6, 0.5, 1]));
  for (let k = 0; k < 3; k++) lg.push(P(lathe([[0.0001, 0], [0.12, 0.02], [0.14, 0.06], [0.0001, 0.08]], 16), 0xd9a066, [0.5 + k * 0.15, 0.25 + k * 0.08, -0.32], [Math.PI / 2, 0, 0]));
  const m1 = toMesh(lg, { thin: true }); m1.position.x = -2.4; g.add(m1);
  const rk = [P(rockGeo(0.62, 3.1, 0.24, 26, 20), 0x9aa3b5, [0, 0.38, 0], [0, 0.4, 0], [1.1, 0.8, 0.9]), P(rockGeo(0.4, 5.3, 0.24, 20, 16), 0xb2bacb, [0.5, 0.26, 0.15], [0, 0.2, 0], [1, 0.8, 0.9]), P(rockGeo(0.3, 7.7, 0.2, 16, 12), 0x59c24a, [-0.15, 0.78, 0], [0, 0, 0], [1.6, 0.4, 1.3])];
  for (let i = 0; i < 4; i++) rk.push(P(rockGeo(0.08, i + 2, 0.2, 10, 8), 0x8f98ab, [-0.6 + i * 0.4, 0.05, -0.55]));
  const m2 = toMesh(rk, { thin: true }); m2.position.x = 0; g.add(m2);
  const mu = [P(lathe([[0.22, 0], [0.19, 0.3], [0.17, 0.5], [0.0001, 0.52]], 24), 0xfff3dc), P(lathe([[0.26, 0.28], [0.3, 0.24], [0.0001, 0.22]], 24), 0xf2e2c4), P(lathe([[0.0001, 0.42], [0.58, 0.4], [0.62, 0.46], [0.55, 0.62], [0.35, 0.86], [0.0001, 0.95]], 32), 0xe8352f), P(lathe([[0.17, 0.46], [0.56, 0.41], [0.0001, 0.41]], 32), 0xf5d9b8)];
  for (let k = 0; k < 8; k++) { const a = k * 2.3, rr = k === 0 ? 0 : 0.3 + (k % 2) * 0.13; mu.push(P(dome(0.08, 0, 1.4), 0xffffff, [Math.cos(a) * rr, 0.93 - rr * 0.6, Math.sin(a) * rr], [Math.sin(a) * rr * 1.6, 0, -Math.cos(a) * rr * 1.6], [1, 0.6, 1])); }
  mu.push(P(lathe([[0.1, 0], [0.08, 0.2], [0.0001, 0.22]], 14), 0xfff3dc, [0.45, 0, -0.2]), P(lathe([[0.0001, 0.16], [0.2, 0.15], [0.17, 0.25], [0.0001, 0.32]], 20), 0xe8352f, [0.45, 0, -0.2]));
  const m3 = toMesh(mu, { thin: true }); m3.position.x = 2.2; g.add(m3);
  return g;
}
export function obs3Muito() {
  const g = new THREE.Group(), add = adder(g), barkM = std(0xffffff, { map: TEX.bark([4, 1]), bumpMap: TEX.bark([4, 1]), bumpScale: 4, roughness: 0.95 }), ringM = std(0xffffff, { map: TX.rings(), roughness: 0.85 });
  add(taper([[-0.95, 0.34, 0], [0, 0.37, 0.02], [0.95, 0.34, 0]], [0.34, 0.37, 0.33], 28, 32), barkM, [-2.4, 0, 0]);
  [-0.96, 0.96].forEach((x) => add(new THREE.CircleGeometry(0.345, 32), ringM, [-2.4 + x, 0.34, 0], [0, Math.sign(x) * Math.PI / 2, 0]));
  add(rockGeo(0.2, 2.2, 0.15), std(0xffffff, { map: TX.moss(), roughness: 1 }), [-2.2, 0.68, 0], [0, 0, 0], [2.2, 0.45, 1.3]);
  const rockM = std(0xffffff, { map: TX.rock(), bumpMap: TX.rock(), bumpScale: 4, roughness: 0.9 });
  add(rockGeo(0.62, 3.1, 0.24, 32, 24), rockM, [0, 0.38, 0], [0, 0.4, 0], [1.1, 0.8, 0.9]); add(rockGeo(0.4, 5.3, 0.24, 24, 18), rockM, [0.5, 0.26, 0.15], [0, 0.2, 0], [1, 0.8, 0.9]); add(rockGeo(0.3, 7.7, 0.2, 20, 14), std(0xffffff, { map: TX.moss() }), [-0.15, 0.78, 0], [0, 0, 0], [1.6, 0.4, 1.3]);
  const L = (pts, seg = 40) => new THREE.LatheGeometry(pts.map(([a, b]) => new THREE.Vector2(a, b)), seg);
  const capM = new THREE.MeshPhysicalMaterial({ color: 0xd92a22, roughness: 0.35, clearcoat: 0.8 }), stemM = new THREE.MeshPhysicalMaterial({ color: 0xfff1da, roughness: 0.6, sheen: 0.6, sheenColor: new THREE.Color(0xffffff) });
  add(L([[0.22, 0], [0.19, 0.3], [0.17, 0.5], [0.0001, 0.52]]), stemM, [2.2, 0, 0]); add(L([[0.0001, 0.42], [0.58, 0.4], [0.62, 0.46], [0.55, 0.62], [0.35, 0.86], [0.0001, 0.95]], 56), capM, [2.2, 0, 0]); add(L([[0.17, 0.46], [0.56, 0.41], [0.0001, 0.41]], 56), std(0xf0d4ae, { roughness: 0.9 }), [2.2, 0, 0]);
  for (let k = 0; k < 8; k++) { const a = k * 2.3, rr = k === 0 ? 0 : 0.3 + (k % 2) * 0.13; add(new THREE.SphereGeometry(0.08, 16, 8, 0, 6.28, 0, 1.4), std(0xfffaf0, { roughness: 0.8 }), [2.2 + Math.cos(a) * rr, 0.93 - rr * 0.6, Math.sin(a) * rr], [Math.sin(a) * rr * 1.6, 0, -Math.cos(a) * rr * 1.6], [1, 0.6, 1]); }
  return g;
}

// =================================================================== FOLHA GIGANTE + PLATAFORMA DE IMPULSO
function leafShape(w, len) { const pts = []; for (let i = 0; i <= 24; i++) { const t = i / 24; pts.push([Math.sin(t * Math.PI) ** 0.75 * w / 2 * (1 + 0.05 * Math.sin(t * 40)), -len / 2 + t * len]); } for (let i = 23; i > 0; i--) { const t = i / 24; pts.push([-(Math.sin(t * Math.PI) ** 0.75) * w / 2 * (1 + 0.05 * Math.sin(t * 40 + 1)), -len / 2 + t * len]); } return pts; }
function bendLeaf(geo, len) { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, p.getY(i) + 0.12 * x * x - 0.05 * (z / len) ** 2 * 4); } geo.computeVertexNormals(); return geo; }
export function leafPadAlta() {
  const g = new THREE.Group(), w = 2.2, len = 3.4, col = 0x3fcf5a;
  const sl = slab(leafShape(w, len), 0.1, 0.05); sl.rotateX(Math.PI / 2); bendLeaf(sl, len);
  const p = [P(sl, col, [0, -0.05, 0]), P(cap(0.045, len * 0.9, 4, 8), hex(col, 1.3), [0, 0.06, 0], [Math.PI / 2, 0, 0])];
  for (let k = 0; k < 7; k++) { const z = -len * 0.38 + k * len * 0.12; [-1, 1].forEach((s) => p.push(P(cap(0.022, w * 0.32, 4, 8), hex(col, 1.2), [s * w * 0.17, 0.06 + 0.02 * k / 7, z + 0.15], [Math.PI / 2, 0, s * 1.0]))); }
  for (let k = 0; k < 5; k++) p.push(P(sph(0.06), 0xd8f6ff, [(k % 2 ? 0.4 : -0.5) + k * 0.05, 0.12, -1 + k * 0.45], [0, 0, 0], [1, 0.6, 1]));
  p.push(P(taper([[0, -0.1, len * 0.35], [0.1, -1.5, len * 0.4], [0, -3.2, len * 0.2], [0, -5, 0]], [0.12, 0.14, 0.18, 0.22], 18, 12), 0x7a5a2a));
  const leaf = toMesh(p, { thin: true }); leaf.position.set(-1.6, 3, 0); g.add(leaf);
  // plataforma de impulso: mola aparente, tampa almofadada com setas
  const q = [P(lathe([[0.95, 0], [1.0, 0.08], [0.85, 0.3], [0.0001, 0.3]], 36), 0x59616e)];
  for (let i = 0; i < 5; i++) q.push(P(tor(0.55, 0.05, 8, 30), 0xffd23f, [0, 0.38 + i * 0.1, 0], [Math.PI / 2, 0, i * 0.1]));
  q.push(P(lathe([[0.0001, 0.85], [0.9, 0.85], [0.98, 0.95], [0.9, 1.08], [0.0001, 1.12]], 36), 0xff5d8f), P(tor(0.75, 0.06, 8, 36), 0xffffff, [0, 1.1, 0], [Math.PI / 2, 0, 0]));
  [0, 1].forEach((k) => q.push(P(slab([[-0.22, 0], [0.22, 0], [0, 0.26]], 0.04, 0.015), 0xffffff, [0, 1.13, -0.15 + k * 0.3], [-Math.PI / 2, 0, 0])));
  const pad = toMesh(q, { thin: true }); pad.position.set(2.2, 0, 0); g.add(pad);
  return g;
}
function leafPadMuito() {
  const g = new THREE.Group(), add = adder(g), w = 2.2, len = 3.4;
  const sh = new THREE.Shape(); leafShape(w, len).forEach(([x, y], i) => (i ? sh.lineTo(x, y) : sh.moveTo(x, y)));
  const lg = new THREE.ShapeGeometry(sh, 24); lg.rotateX(-Math.PI / 2);
  const uv = lg.attributes.uv, ps = lg.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, ps.getX(i) / w + 0.5, ps.getZ(i) / len + 0.5);
  bendLeaf(lg, len);
  const lm = new THREE.MeshPhysicalMaterial({ map: TX.leafBig(), color: 0x7fd07a, roughness: 0.8, side: THREE.DoubleSide, envMapIntensity: 0.3 });
  add(lg, lm, [-1.6, 3, 0]);
  add(taper([[0, -0.1, len * 0.35], [0.1, -1.5, len * 0.4], [0, -3.2, len * 0.2], [0, -5, 0]], [0.12, 0.14, 0.18, 0.22], 24, 14), std(0xffffff, { map: TEX.bark([1, 3]) }), [-1.6, 3, 0]);
  const drop = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0, transmission: 1, thickness: 0.1, ior: 1.33, transparent: true });
  for (let k = 0; k < 6; k++) add(new THREE.SphereGeometry(0.06, 16, 12), drop, [-1.6 + (k % 2 ? 0.4 : -0.5) + k * 0.05, 3.08 + 0.12 * ((k % 2 ? 0.45 : -0.45) ** 2), -1 + k * 0.4], [0, 0, 0], [1, 0.55, 1]);
  const L = (pts, seg = 48) => new THREE.LatheGeometry(pts.map(([a, b]) => new THREE.Vector2(a, b)), seg);
  add(L([[0.95, 0], [1.0, 0.08], [0.85, 0.3], [0.0001, 0.3]]), std(0x3a404c, { metalness: 0.7, roughness: 0.35 }), [2.2, 0, 0]);
  const spring = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(Array.from({ length: 80 }, (_, i) => new THREE.Vector3(Math.cos(i / 80 * Math.PI * 10) * 0.55, 0.32 + i / 80 * 0.52, Math.sin(i / 80 * Math.PI * 10) * 0.55))), 200, 0.045, 10);
  add(spring, std(0xe0e4ea, { metalness: 1, roughness: 0.2 }), [2.2, 0, 0]);
  add(L([[0.0001, 0.85], [0.9, 0.85], [0.98, 0.95], [0.9, 1.08], [0.0001, 1.12]]), new THREE.MeshPhysicalMaterial({ color: 0xff4d86, roughness: 0.5, sheen: 1, sheenColor: new THREE.Color(0xffc0d8) }), [2.2, 0, 0]);
  add(new THREE.TorusGeometry(0.75, 0.06, 12, 48), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.3, clearcoat: 1 }), [2.2, 1.1, 0], [Math.PI / 2, 0, 0]);
  return g;
}

// =================================================================== COELHINHO
export const bunny = (level) => { const b = level === 'atual' ? buildBunny() : withLevel(level, new Set([0xf4f0ee, 0xffffff]), () => buildBunny()); b.scale.setScalar(2.4); return b; };

export const HQ3 = {
  pine: { alta: pineAlta, muito: pineMuito },
  bigtree: { alta: bigtreeAlta, muito: bigtreeMuito },
  ground: { alta: groundAlta, muito: groundMuito },
  obs3: { alta: obsAlta, muito: obs3Muito },
  leafpad: { alta: leafPadAlta, muito: leafPadMuito },
  bunny: { atual: () => bunny('atual'), alta: () => bunny('alta'), muito: () => bunny('muito') },
};
