// Comparação de qualidade — fase 5 (mundo dos dinossauros).
// Dinossauros: o mesmo modelo do jogo em dois níveis de pele:
//  - 'alta': pele com escaminhas em relevo, pintas nas costas e sombreado de volume (cartoon);
//  - 'muito': pele física com escamas desenhadas por sombreador, pintas, brilho suave e olhos envernizados.
import { THREE, P, sph, box, cyl, cone, cap, tor, dome, lathe, taper, slab, rockGeo, toMesh, hex, PART_HOOK } from './kit.js';
import { buildDino, buildEgg, buildNest } from './creatures.js';
import { TEX } from './hq.js';
import { noise3, tuft, radOf } from './hq2.js';

const BELLY = new Set([0xeaf7c6, 0xe0f0ff, 0xfff4c4, 0xdff7ef, 0xf6ffd8, 0xf2a35a]);
const EYEISH = new Set([0xffffff, 0x0d0b0a, 0x1b1b24, 0x3a1d18, 0xff6f8a, 0xfff3dc]);
const isSkin = (p) => radOf(p) > 0.16 && !EYEISH.has(p.color);
const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, ...o });
function adder(g) { return (geo, m, p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1]) => { const x = new THREE.Mesh(geo, m); x.position.set(...p); x.rotation.set(...r); x.scale.set(...s); x.castShadow = x.receiveShadow = true; g.add(x); return x; }; }
const L = (pts, seg = 40) => new THREE.LatheGeometry(pts.map(([a, b]) => new THREE.Vector2(Math.max(0.0001, a), b)), seg);
const R0 = (seed) => { let s = seed * 9301 + 49297; return () => (s = (s * 16807) % 2147483647) / 2147483647; };

// ------------------------------------------------------------------ pele 'alta': escaminhas + pintas por cor de vértice
function hookAlta(parts, opts) {
  const skin = parts.filter(isSkin).map((p) => ({ ...p, geo: tuft(p.geo, BELLY.has(p.color) ? 0.015 : 0.035, 7.5) }));
  const rest = parts.filter((p) => !isSkin(p));
  PART_HOOK.fn = null;
  const g = new THREE.Group();
  if (skin.length) {
    const m = toMesh(skin, opts), geo = m.userData.main.geometry; geo.computeBoundingBox(); const bb = geo.boundingBox, h = Math.max(0.01, bb.max.y - bb.min.y);
    const pos = geo.attributes.position, col = geo.attributes.color, c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i); c.setRGB(col.getX(i), col.getY(i), col.getZ(i));
      const belly = c.r > 0.85 && c.g > 0.85; const t = (y - bb.min.y) / h;
      let k = 0.82 + 0.26 * t;
      if (!belly) { const n = noise3(x * 3.2 + 7, y * 3.2, z * 3.2); if (n > 0.56 && t > 0.4) k *= 0.66; const n2 = noise3(x * 14, y * 14, z * 14); k *= 0.94 + n2 * 0.1; }
      col.setXYZ(i, c.r * k, c.g * k, c.b * k);
    }
    g.add(m);
  }
  if (rest.length) g.add(toMesh(rest, opts));
  PART_HOOK.fn = hookAlta;
  g.userData.main = g.children[0].userData.main;
  return g;
}

// ------------------------------------------------------------------ pele 'muito': escamas por sombreador (voronoi 3D)
function skinMaterial(belly) {
  const m = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: belly ? 0.7 : 0.6, sheen: 0.12, sheenColor: new THREE.Color(0xffffff), sheenRoughness: 0.6, clearcoat: belly ? 0.1 : 0.25, clearcoatRoughness: 0.5 });
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = 'varying vec3 vLp;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vLp = position;');
    sh.fragmentShader = 'varying vec3 vLp;\n' + `
      vec3 h33(vec3 p){ p = vec3(dot(p,vec3(127.1,311.7,74.7)), dot(p,vec3(269.5,183.3,246.1)), dot(p,vec3(113.5,271.9,124.6))); return fract(sin(p)*43758.5453); }
      vec2 vor(vec3 x){ vec3 i = floor(x), f = fract(x); float d1 = 8.0, d2 = 8.0;
        for(int a=-1;a<=1;a++) for(int b=-1;b<=1;b++) for(int c=-1;c<=1;c++){ vec3 g = vec3(a,b,c); vec3 o = h33(i+g); vec3 r = g + o - f; float d = dot(r,r); if(d<d1){ d2=d1; d1=d; } else if(d<d2) d2=d; }
        return vec2(sqrt(d1), sqrt(d2)); }
      float vn(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); float n = dot(i, vec3(1.0,57.0,113.0));
        return mix(mix(mix(fract(sin(n)*43758.5),fract(sin(n+1.0)*43758.5),f.x),mix(fract(sin(n+57.0)*43758.5),fract(sin(n+58.0)*43758.5),f.x),f.y),mix(mix(fract(sin(n+113.0)*43758.5),fract(sin(n+114.0)*43758.5),f.x),mix(fract(sin(n+170.0)*43758.5),fract(sin(n+171.0)*43758.5),f.x),f.y),f.z); }
    ` + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
        vec2 vv = vor(vLp * ${belly ? '9.0' : '6.5'}); float edge = smoothstep(0.0, 0.22, vv.y - vv.x);
        diffuseColor.rgb *= mix(0.8, 1.03, edge) * (0.94 + 0.12 * vv.x);
        ${belly ? '' : 'float sp = vn(vLp * 3.0 + 7.0); diffuseColor.rgb *= mix(1.0, 0.68, smoothstep(0.55, 0.65, sp) * smoothstep(0.0, 0.3, vLp.y - 0.4));'}
      `);
  };
  m.customProgramCacheKey = () => 'dino-skin-' + belly;
  return m;
}
function hookMuito(parts) {
  const g = new THREE.Group();
  PART_HOOK.fn = null;
  const sets = [[parts.filter((p) => isSkin(p) && !BELLY.has(p.color)), skinMaterial(false)], [parts.filter((p) => isSkin(p) && BELLY.has(p.color)), skinMaterial(true)], [parts.filter((p) => !isSkin(p)), new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.05 })]];
  sets.forEach(([ps, mat], k) => { if (!ps.length) return; const pp = k < 2 ? ps.map((p) => ({ ...p, geo: tuft(p.geo, 0.012, 7) })) : ps; const m = new THREE.Mesh(toMesh(pp, { outline: false }).userData.main.geometry, mat); m.castShadow = m.receiveShadow = true; g.add(m); });
  PART_HOOK.fn = hookMuito;
  g.userData.main = g.children[0];
  return g;
}
function dinoAt(level, kind) { if (level === 'atual') return buildDino(kind); PART_HOOK.fn = level === 'alta' ? hookAlta : hookMuito; try { return buildDino(kind); } finally { PART_HOOK.fn = null; } }

function bigDinos(level) {
  const g = new THREE.Group();
  [['tricera', -4.2, 0.9], ['trex', 0, 0.9], ['stego', 4.2, 0.9]].forEach(([k, x, s], i) => { const d = dinoAt(level, k); d.scale.setScalar(s); d.position.x = x; d.rotation.y = (i - 1) * -0.35; g.add(d); });
  return g;
}
function tallDinos(level) {
  const g = new THREE.Group();
  const b = dinoAt(level, 'brachio'); b.scale.setScalar(0.55); b.position.x = -1.5; b.rotation.y = 0.4; g.add(b);
  const p = dinoAt(level, 'ptero'); p.scale.setScalar(1.6); p.position.set(2.6, 3.4, 0); p.rotation.y = -0.5; g.add(p);
  return g;
}

// =================================================================== FILHOTE, OVO E NINHO
/** graveto deitado e tangente à borda do ninho (com leve inclinação aleatória) */
function twigRot(a, r) { const o = new THREE.Object3D(); o.lookAt(-Math.sin(a), (r() - 0.5) * 0.5, Math.cos(a)); o.rotateX(Math.PI / 2); o.rotateZ((r() - 0.5) * 0.3); return [o.rotation.x, o.rotation.y, o.rotation.z]; }
function nestAlta() {
  const g = new THREE.Group(), p = [], r = R0(3);
  // ninho de gravetos trançados, palha e folhas
  for (let i = 0; i < 46; i++) { const a = r() * 6.28, rr = 0.72 + r() * 0.16, y = 0.12 + r() * 0.32, l = 0.35 + r() * 0.3; p.push(P(cap(0.03 + r() * 0.015, l, 3, 6), [0x8a5a2e, 0x9a6a3a, 0x7a4e2a, 0xb98a52][i % 4], [Math.cos(a) * rr, y, Math.sin(a) * rr], twigRot(a, r))); }
  p.push(P(cyl(0.85, 0.65, 0.22, 32), 0xe8c97a, [0, 0.14, 0]));
  for (let i = 0; i < 24; i++) { const a = r() * 6.28, rr = r() * 0.7; p.push(P(cap(0.012, 0.3, 2, 4), 0xf2d79a, [Math.cos(a) * rr, 0.27, Math.sin(a) * rr], [Math.PI / 2, a, 0])); }
  for (let i = 0; i < 5; i++) { const a = i * 1.3; p.push(P(sph(0.16), 0x3fbf5a, [Math.cos(a) * 1.0, 0.3, Math.sin(a) * 1.0], [0, a, 0.3], [1.8, 0.2, 0.7])); }
  g.add(toMesh(p, { thin: true }));
  // ovos com pintinhas e um rachado
  [[-0.25, 0.1, 0], [0.25, -0.05, 0.4], [0.05, 0.25, -0.5]].forEach(([x, z, rot], i) => {
    const e = [P(lathe([[0.0001, 0], [0.2, 0.04], [0.27, 0.22], [0.24, 0.48], [0.13, 0.66], [0.0001, 0.7]], 32), 0xf6e6bb)];
    for (let k = 0; k < 7; k++) { const a = k * 2.1, y = 0.15 + (k % 4) * 0.13; const rr = 0.27 - Math.abs(y - 0.3) * 0.25; e.push(P(sph(0.045 + (k % 2) * 0.02), [0x6fcf6a, 0x4aa3e8, 0xff9a3a][i], [Math.cos(a) * rr, y, Math.sin(a) * rr], [0, -a, 0], [0.4, 1, 1])); }
    if (i === 2) e.push(P(slab([[-0.12, 0], [-0.05, 0.05], [0, -0.02], [0.06, 0.06], [0.12, 0]], 0.02, 0.005), 0x5a3a1a, [0, 0.46, -0.24], [0.3, 0, 0]));
    const m = toMesh(e, { thin: true }); m.position.set(x, 0.22, z); m.rotation.z = rot * 0.4; g.add(m);
  });
  const baby = dinoAt('alta', 'baby'); baby.scale.setScalar(1.6); baby.position.set(1.9, 0, -0.2); baby.rotation.y = -0.5; g.add(baby);
  return g;
}
function nestMuito() {
  const g = new THREE.Group(), add = adder(g), r = R0(3);
  const twig = [std(0x7a4a26, { roughness: 0.95 }), std(0x8f5f33, { roughness: 0.95 }), std(0x6a4024, { roughness: 0.95 })];
  for (let i = 0; i < 110; i++) { const a = r() * 6.28, rr = 0.7 + r() * 0.2, y = 0.1 + r() * 0.36, l = 0.35 + r() * 0.35; add(new THREE.CylinderGeometry(0.018 + r() * 0.012, 0.024, l, 6), twig[i % 3], [Math.cos(a) * rr, y, Math.sin(a) * rr], twigRot(a, r)); }
  add(new THREE.CylinderGeometry(0.85, 0.65, 0.22, 48), std(0xffffff, { map: TEX.wood([3, 1], '#d8b670'), roughness: 1 }), [0, 0.14, 0]);
  const straw = std(0xf0d38a, { roughness: 0.9 }); for (let i = 0; i < 60; i++) { const a = r() * 6.28, rr = r() * 0.75; add(new THREE.CylinderGeometry(0.008, 0.008, 0.3, 4), straw, [Math.cos(a) * rr, 0.27, Math.sin(a) * rr], [Math.PI / 2, a, (r() - 0.5) * 0.3]); }
  const shellM = new THREE.MeshPhysicalMaterial({ color: 0xf8ecc8, roughness: 0.35, clearcoat: 0.5, sheen: 0.4, sheenColor: new THREE.Color(0xffffff) });
  [[-0.25, 0.1, 0, 0x5fbf5a], [0.25, -0.05, 0.4, 0x3a8fe0], [0.05, 0.25, -0.5, 0xff8a2a]].forEach(([x, z, rot, sc]) => {
    const e = add(L([[0.0001, 0], [0.2, 0.04], [0.27, 0.22], [0.24, 0.48], [0.13, 0.66], [0.0001, 0.7]], 48), shellM, [x, 0.22, z], [0, 0, rot * 0.4]);
    for (let k = 0; k < 9; k++) { const a = k * 2.1, y = 0.12 + (k % 5) * 0.11, rr = 0.27 - Math.abs(y - 0.3) * 0.3; const s = new THREE.Mesh(new THREE.SphereGeometry(0.04 + (k % 2) * 0.02, 12, 8), std(sc, { roughness: 0.4 })); s.position.set(Math.cos(a) * rr, y, Math.sin(a) * rr); s.scale.set(0.35, 1, 1); s.rotation.y = -a; e.add(s); }
  });
  const baby = dinoAt('muito', 'baby'); baby.scale.setScalar(1.6); baby.position.set(1.9, 0, -0.2); baby.rotation.y = -0.5; g.add(baby);
  return g;
}

// =================================================================== PLANTAS PRÉ-HISTÓRICAS (cicadácea, cavalinha, samambaia-árvore)
function plantsAlta() {
  const g = new THREE.Group(), p = [], leaves = [], r = R0(5);
  // cicadácea: tronco com escamas em losango + coroa de folhas pinadas
  for (let i = 0; i < 12; i++) for (let k = 0; k < 8; k++) { const a = k / 8 * 6.28 + (i % 2) * 0.39; p.push(P(sph(0.1), i % 2 ? 0x8a5a35 : 0x7a4e2a, [Math.cos(a) * 0.28, 0.12 + i * 0.18, Math.sin(a) * 0.28], [0, -a, 0], [0.5, 0.9, 1.4])); }
  p.push(P(cyl(0.26, 0.32, 2.2, 20), 0x6e4426, [0, 1.1, 0]));
  for (let i = 0; i < 10; i++) { const a = i / 10 * 6.28; const pts = [[0, 2.25, 0], [Math.cos(a) * 0.7, 2.7, Math.sin(a) * 0.7], [Math.cos(a) * 1.4, 2.6, Math.sin(a) * 1.4], [Math.cos(a) * 1.8, 2.2, Math.sin(a) * 1.8]];
    leaves.push(P(taper(pts, [0.03, 0.025, 0.02, 0.01], 14, 6), 0x2f9a3e)); const cv = new THREE.CatmullRomCurve3(pts.map((q) => new THREE.Vector3(...q)));
    for (let k = 1; k < 14; k++) { const t = k / 14, q = cv.getPoint(t), tg = cv.getTangent(t); [-1, 1].forEach((s) => { const sd = new THREE.Vector3(-tg.z, 0, tg.x).normalize().multiplyScalar(s * 0.16 * (1 - t * 0.6)); leaves.push(P(new THREE.SphereGeometry(0.1, 8, 6), hex(0x3fcf5a, 0.85 + t * 0.3), [q.x + sd.x, q.y - 0.02, q.z + sd.z], [0, -Math.atan2(sd.z, sd.x), -0.3 * s], [1.8 * (1 - t * 0.5), 0.15, 0.4])); }); } }
  // cavalinhas gigantes (talos segmentados)
  [[2.3, 0.2], [2.7, -0.3], [2.0, -0.5]].forEach(([x, z], j) => { const h = 2.2 + j * 0.5; for (let k = 0; k < 9; k++) { p.push(P(cyl(0.09, 0.1, h / 9 - 0.02, 14), 0x5fae4a, [x, k * h / 9 + h / 18, z])); p.push(P(cyl(0.11, 0.11, 0.04, 14), 0x3a6a2a, [x, (k + 1) * h / 9, z])); for (let w = 0; w < 6; w++) { const a = w / 6 * 6.28; leaves.push(P(cyl(0.008, 0.012, 0.35, 4), 0x4f9a3a, [x + Math.cos(a) * 0.15, (k + 1) * h / 9 - 0.06, z + Math.sin(a) * 0.15], [Math.sin(a) * 1.0, 0, -Math.cos(a) * 1.0])); } } p.push(P(cone(0.08, 0.25, 12), 0x8a6a3a, [x, h + 0.12, z])); });
  // samambaia-árvore
  p.push(P(taper([[-2.4, 0, 0], [-2.35, 1.5, 0], [-2.45, 3.0, 0]], [0.2, 0.17, 0.15], 14, 12), 0x5a3a22));
  for (let i = 0; i < 9; i++) { const a = i / 9 * 6.28; const pts = [[-2.45, 3.0, 0], [-2.45 + Math.cos(a) * 0.8, 3.5, Math.sin(a) * 0.8], [-2.45 + Math.cos(a) * 1.6, 3.2, Math.sin(a) * 1.6], [-2.45 + Math.cos(a) * 2.0, 2.6, Math.sin(a) * 2.0]];
    leaves.push(P(taper(pts, [0.03, 0.025, 0.02, 0.01], 14, 6), 0x2f8a3e)); const cv = new THREE.CatmullRomCurve3(pts.map((q) => new THREE.Vector3(...q)));
    for (let k = 1; k < 16; k++) { const t = k / 16, q = cv.getPoint(t), tg = cv.getTangent(t); [-1, 1].forEach((s) => { const sd = new THREE.Vector3(-tg.z, 0, tg.x).normalize().multiplyScalar(s * 0.2 * Math.sin((1 - t) * 2.8 + 0.2)); leaves.push(P(new THREE.SphereGeometry(0.1, 8, 6), hex(0x2fae4a, 0.8 + t * 0.3), [q.x + sd.x, q.y - 0.03, q.z + sd.z], [0, -Math.atan2(sd.z, sd.x), -0.4 * s], [2.2 * Math.sin((1 - t) * 2.8 + 0.2), 0.14, 0.45])); }); } }
  g.add(toMesh(p, { thin: true }), toMesh(leaves, { outline: false }));
  return g;
}
function plantsMuito() {
  const g = new THREE.Group(), add = adder(g), r = R0(5);
  const fernT = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 256; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(30, 0, 4, 256); for (let i = 0; i < 30; i++) { const y = 6 + i * 8.2, Lw = 29 * Math.sin((1 - i / 30) * Math.PI * 0.9 + 0.2); [-1, 1].forEach((s) => { x.beginPath(); x.ellipse(32 + s * Lw / 2, y + 3, Lw / 2, 3.2, s * 0.3, 0, 6.28); x.fill(); }); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const frondGeo = (len) => { const f = new THREE.PlaneGeometry(0.55, len, 1, 14); f.translate(0, len / 2, 0); const ps = f.attributes.position; for (let i = 0; i < ps.count; i++) { const y = ps.getY(i), t = y / len; ps.setZ(i, -Math.pow(t, 2) * len * 0.45); } f.computeVertexNormals(); return f; };
  const fm = std(0x2f9a3e, { map: fernT, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.6 }), dm = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: fernT, alphaTest: 0.4 });
  // cicadácea com textura de casca em escamas
  const scaleT = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); x.fillStyle = '#5a3a20'; x.fillRect(0, 0, 128, 128); for (let j = 0; j < 9; j++) for (let i = 0; i < 9; i++) { const cx = i * 16 + (j % 2) * 8, cy = j * 16; x.fillStyle = `hsl(28,${35 + Math.random() * 10}%,${30 + Math.random() * 10}%)`; x.beginPath(); x.moveTo(cx, cy - 8); x.lineTo(cx + 8, cy); x.lineTo(cx, cy + 8); x.lineTo(cx - 8, cy); x.fill(); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 4); return t; })();
  add(new THREE.CylinderGeometry(0.26, 0.32, 2.2, 32), std(0xffffff, { map: scaleT, bumpMap: scaleT, bumpScale: 4, roughness: 0.95 }), [0, 1.1, 0]);
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28; const m = add(frondGeo(1.9), fm, [0, 2.2, 0], [0, -a + Math.PI / 2, 0]); m.rotateX(-0.9); m.customDepthMaterial = dm; }
  // cavalinhas
  const stem = std(0x5fae4a, { roughness: 0.5 }), node = std(0x2f5a22, { roughness: 0.7 });
  [[2.3, 0.2], [2.7, -0.3], [2.0, -0.5]].forEach(([x, z], j) => { const h = 2.2 + j * 0.5; for (let k = 0; k < 9; k++) { add(new THREE.CylinderGeometry(0.09, 0.1, h / 9 - 0.02, 18), stem, [x, k * h / 9 + h / 18, z]); add(new THREE.CylinderGeometry(0.11, 0.11, 0.04, 18), node, [x, (k + 1) * h / 9, z]); for (let w = 0; w < 8; w++) { const a = w / 8 * 6.28; add(new THREE.CylinderGeometry(0.006, 0.01, 0.38, 4), stem, [x + Math.cos(a) * 0.16, (k + 1) * h / 9 - 0.06, z + Math.sin(a) * 0.16], [Math.sin(a) * 1.0, 0, -Math.cos(a) * 1.0]); } } add(new THREE.ConeGeometry(0.08, 0.25, 16), std(0x8a6a3a), [x, h + 0.12, z]); });
  // samambaia-árvore com tronco fibroso
  add(taper([[-2.4, 0, 0], [-2.35, 1.5, 0], [-2.45, 3.0, 0]], [0.2, 0.17, 0.15], 20, 16), std(0xffffff, { map: TEX.bark([2, 2]), bumpMap: TEX.bark([2, 2]), bumpScale: 3, color: 0x8a6a5a, roughness: 1 }));
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28; const m = add(frondGeo(2.3), fm, [-2.45, 3.0, 0], [0, -a + Math.PI / 2, 0]); m.rotateX(-1.0 - r() * 0.2); m.customDepthMaterial = dm; }
  return g;
}

// =================================================================== VULCÃO (fundo)
function volcanoAlta() {
  const p = [], r = R0(8);
  const prof = [[14, 0], [12.5, 2], [11, 4], [8.5, 8], [6.5, 11], [4.8, 13.6], [4.4, 14.2], [3.6, 14.4], [3.2, 13.6], [0.0001, 13.6]];
  const geo = new THREE.LatheGeometry(prof.map(([a, b]) => new THREE.Vector2(a, b)), 64); const ps = geo.attributes.position;
  for (let i = 0; i < ps.count; i++) { const x = ps.getX(i), y = ps.getY(i), z = ps.getZ(i), a = Math.atan2(z, x), k = 1 + 0.08 * Math.sin(a * 9) * Math.min(1, y / 4) + (noise3(x * 0.3, y * 0.3, z * 0.3) - 0.5) * 0.12; ps.setXYZ(i, x * k, y, z * k); } geo.computeVertexNormals();
  p.push(P(geo, 0x7a4e40));
  p.push(P(lathe([[3.7, 0], [3.4, 0.4], [0.0001, 0.4]], 32), 0xff6a1a, [0, 13.7, 0]), P(lathe([[2.4, 0], [2.0, 0.45], [0.0001, 0.45]], 32), 0xffd23f, [0, 13.75, 0]));
  // rios de lava descendo, com brilho amarelo no centro
  [[1.2, 1], [1.9, 0.7], [0.6, 0.6]].forEach(([a, w]) => { const pts = []; for (let k = 0; k <= 8; k++) { const y = 14 - k * 1.7, R = prof.reduce((acc, q, i) => (i && prof[i - 1][1] <= y && q[1] >= y ? q[0] : acc), 4 + k * 1.25); pts.push([Math.cos(a + Math.sin(k) * 0.08) * (4 + k * 1.25) * 1.02, y, -Math.sin(a + Math.sin(k) * 0.08) * (4 + k * 1.25) * 1.02]); } p.push(P(taper(pts, pts.map((_, k) => 0.5 * w + k * 0.06), 30, 8), 0xff7a2a)); p.push(P(taper(pts.map(([x, y, z]) => [x * 1.01, y + 0.05, z * 1.01]), pts.map((_, k) => 0.22 * w + k * 0.02), 30, 8), 0xffd23f)); });
  // fumaça em camadas e rochas na base
  [[0.5, 17, 0, 2.2], [1.5, 19.5, 0.5, 2.8], [3.2, 22.5, 0, 3.2], [5.2, 25.5, -0.5, 3.6]].forEach(([x, y, z, s], i) => p.push(P(rockGeo(s, i * 2 + 1, 0.2, 18, 12), [0xd9dde6, 0xc8ccd6, 0xb5bac6, 0xa5aab6][i], [x, y, z], [0, 0, 0], [1.3, 0.8, 1])));
  for (let i = 0; i < 8; i++) { const a = r() * 6.28; p.push(P(rockGeo(0.8 + r() * 0.8, i, 0.25), 0x5a4038, [Math.cos(a) * 13.5, 0.4, Math.sin(a) * 13.5])); }
  return toMesh(p, { thin: true });
}
function volcanoMuito() {
  const g = new THREE.Group(), add = adder(g), r = R0(8);
  const prof = [[14, 0], [12.5, 2], [11, 4], [8.5, 8], [6.5, 11], [4.8, 13.6], [4.4, 14.2], [3.6, 14.4], [3.2, 13.6], [0.0001, 13.6]];
  const geo = new THREE.LatheGeometry(prof.map(([a, b]) => new THREE.Vector2(a, b)), 128, 0, Math.PI * 2); const ps = geo.attributes.position;
  for (let i = 0; i < ps.count; i++) { const x = ps.getX(i), y = ps.getY(i), z = ps.getZ(i), a = Math.atan2(z, x), k = 1 + 0.08 * Math.sin(a * 9) * Math.min(1, y / 4) + (noise3(x * 0.3, y * 0.3, z * 0.3) - 0.5) * 0.14 + (noise3(x * 1.2, y * 1.2, z * 1.2) - 0.5) * 0.04; ps.setXYZ(i, x * k, y, z * k); } geo.computeVertexNormals();
  const rockT = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); x.fillStyle = '#5a3a32'; x.fillRect(0, 0, 256, 256); for (let i = 0; i < 6000; i++) { x.fillStyle = `rgba(${Math.random() < 0.5 ? '30,18,15' : '140,100,85'},${Math.random() * 0.2})`; const s = 1 + Math.random() * 5; x.fillRect(Math.random() * 256, Math.random() * 256, s, s); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 3); return t; })();
  add(geo, std(0xffffff, { map: rockT, bumpMap: rockT, bumpScale: 6, roughness: 0.95 }));
  const lava = std(0xff5a10, { emissive: 0xff5a10, emissiveIntensity: 2.5, roughness: 0.4 }), core = std(0xffd23f, { emissive: 0xffc020, emissiveIntensity: 3 });
  add(L([[3.7, 0], [3.4, 0.4], [0.0001, 0.4]], 48), lava, [0, 13.7, 0]); add(L([[2.4, 0], [2.0, 0.45], [0.0001, 0.45]], 48), core, [0, 13.75, 0]);
  [[1.2, 1], [1.9, 0.7], [0.6, 0.6]].forEach(([a, w]) => { const pts = []; for (let k = 0; k <= 8; k++) pts.push([Math.cos(a + Math.sin(k) * 0.08) * (4 + k * 1.25) * 1.02, 14 - k * 1.7, -Math.sin(a + Math.sin(k) * 0.08) * (4 + k * 1.25) * 1.02]); add(taper(pts, pts.map((_, k) => 0.5 * w + k * 0.06), 40, 10), lava); add(taper(pts.map(([x, y, z]) => [x * 1.01, y + 0.05, z * 1.01]), pts.map((_, k) => 0.22 * w + k * 0.02), 40, 10), core); });
  const pl = new THREE.PointLight(0xff6a20, 120, 18, 1.5); pl.position.set(0, 14.6, 0); g.add(pl);
  // fumaça volumosa (muitas esferas translúcidas com sombreamento)
  const smoke = new THREE.MeshStandardMaterial({ color: 0x8a8f9a, roughness: 1, transparent: true, opacity: 0.55, depthWrite: false });
  for (let i = 0; i < 40; i++) { const t = i / 40, s = 1.2 + t * 2.6; const m = add(new THREE.SphereGeometry(s, 20, 14), smoke, [Math.sin(i * 1.7) * 1.2 + t * 6, 16 + t * 12 + Math.cos(i) * 0.6, Math.cos(i * 2.3) * 1.2]); m.castShadow = false; m.material = smoke.clone(); m.material.color.setHex(i % 3 ? 0x9a9fab : 0x7a7f8a); m.material.opacity = 0.5 - t * 0.25; }
  for (let i = 0; i < 8; i++) { const a = r() * 6.28; add(rockGeo(0.8 + r() * 0.8, i, 0.25, 20, 14), std(0xffffff, { map: rockT, roughness: 0.95 }), [Math.cos(a) * 13.5, 0.4, Math.sin(a) * 13.5]); }
  return g;
}

// =================================================================== OSSOS (obstáculo) E FÓSSIL
function bonesAlta() {
  const g = new THREE.Group(), p = [], ivory = 0xfff3dc, sh = 0xe9dcbc;
  // osso obstáculo: haste com leve curva e cabeças duplas arredondadas
  p.push(P(taper([[-0.55, 0.3, 0], [0, 0.33, 0], [0.55, 0.3, 0]], [0.13, 0.11, 0.13], 16, 16), ivory));
  [[-0.62, 0.12], [-0.62, -0.12], [0.62, 0.12], [0.62, -0.12]].forEach(([x, z]) => p.push(P(sph(0.22), ivory, [x, 0.3, z], [0, 0, 0], [1, 0.95, 1])));
  for (let i = 0; i < 4; i++) p.push(P(cap(0.012, 0.18, 3, 6), sh, [-0.3 + i * 0.2, 0.43, -0.05], [0, 0.3, Math.PI / 2]));
  const m1 = toMesh(p, { thin: true }); m1.position.x = -2.2; g.add(m1);
  // fóssil: costelas saindo da terra, crânio e vértebras
  const f = [P(rockGeo(1.6, 3, 0.12, 22, 14), 0xc9a066, [0, -0.6, 0], [0, 0, 0], [1.4, 0.45, 1])];
  for (let i = 0; i < 6; i++) { const x = -0.9 + i * 0.36, h = 1.1 - Math.abs(i - 2.5) * 0.15; [-1, 1].forEach((s) => f.push(P(taper([[x, 0, s * 0.15], [x, h * 0.6, s * 0.5], [x, h, s * 0.2]], [0.06, 0.05, 0.035], 14, 8), ivory))); }
  for (let i = 0; i < 9; i++) f.push(P(sph(0.1), i % 2 ? ivory : sh, [-1.3 + i * 0.32, 0.15 + Math.sin(i * 0.4) * 0.05, 0], [0, 0, 0], [0.7, 1, 1]));
  f.push(P(sph(0.42), ivory, [1.6, 0.2, 0], [0, 0, 0.2], [1.3, 0.8, 0.9]), P(sph(0.1), 0x5a4030, [1.75, 0.3, -0.3]), P(sph(0.1), 0x5a4030, [1.75, 0.3, 0.3]));
  for (let i = 0; i < 4; i++) f.push(P(cone(0.04, 0.12, 8), ivory, [2.05, 0.02, -0.15 + i * 0.1], [Math.PI, 0, 0]));
  const m2 = toMesh(f, { thin: true }); m2.position.x = 1.6; g.add(m2);
  return g;
}
function bonesMuito() {
  const g = new THREE.Group(), add = adder(g);
  const bone = new THREE.MeshPhysicalMaterial({ color: 0xf6ead0, roughness: 0.55, sheen: 0.3, sheenColor: new THREE.Color(0xffffff), clearcoat: 0.2 });
  add(taper([[-0.55, 0.3, 0], [0, 0.33, 0], [0.55, 0.3, 0]], [0.13, 0.11, 0.13], 24, 20), bone, [-2.2, 0, 0]);
  [[-0.62, 0.12], [-0.62, -0.12], [0.62, 0.12], [0.62, -0.12]].forEach(([x, z]) => add(new THREE.SphereGeometry(0.22, 32, 24), bone, [-2.2 + x, 0.3, z], [0, 0, 0], [1, 0.95, 1]));
  const dirt = std(0xffffff, { map: TEX.plaster('#b48c5a', [3, 2]), bumpMap: TEX.plaster('#b48c5a', [3, 2]), bumpScale: 3, roughness: 1 });
  add(rockGeo(1.6, 3, 0.12, 32, 20), dirt, [1.6, -0.6, 0], [0, 0, 0], [1.4, 0.45, 1]);
  const old = new THREE.MeshStandardMaterial({ color: 0xe8d6b0, roughness: 0.8, map: TEX.plaster('#e8d6b0', [1, 1]), bumpMap: TEX.plaster('#e8d6b0', [1, 1]), bumpScale: 2 });
  for (let i = 0; i < 6; i++) { const x = -0.9 + i * 0.36, h = 1.1 - Math.abs(i - 2.5) * 0.15; [-1, 1].forEach((s) => add(taper([[x, 0, s * 0.15], [x, h * 0.6, s * 0.5], [x, h, s * 0.2]], [0.06, 0.05, 0.035], 18, 10), old, [1.6, 0, 0])); }
  for (let i = 0; i < 9; i++) add(new THREE.SphereGeometry(0.1, 16, 12), old, [1.6 - 1.3 + i * 0.32, 0.15 + Math.sin(i * 0.4) * 0.05, 0], [0, 0, 0], [0.7, 1, 1]);
  add(new THREE.SphereGeometry(0.42, 32, 24), old, [3.2, 0.2, 0], [0, 0, 0.2], [1.3, 0.8, 0.9]); [-0.3, 0.3].forEach((z) => add(new THREE.SphereGeometry(0.1, 16, 12), std(0x3a2a20, { roughness: 1 }), [3.35, 0.3, z]));
  return g;
}

export const HQ5 = {
  dinos: { atual: () => bigDinos('atual'), alta: () => bigDinos('alta'), muito: () => bigDinos('muito') },
  tall: { atual: () => tallDinos('atual'), alta: () => tallDinos('alta'), muito: () => tallDinos('muito') },
  nest: { alta: nestAlta, muito: nestMuito },
  preplants: { alta: plantsAlta, muito: plantsMuito },
  volcano: { alta: volcanoAlta, muito: volcanoMuito },
  bones: { alta: bonesAlta, muito: bonesMuito },
};
