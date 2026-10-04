// Kit 3D: materiais "cartoon" (toon + contorno), formas básicas, mesclagem de peças com cor por vértice,
// sombras de contato e partículas. Todos os modelos do jogo são montados por código (sem arquivos externos).
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export { THREE };

// ---- materiais ----
// sombreamento "cartoon suave": três faixas de luz com transições macias (sem o aspecto facetado/pixelado)
const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const gradient = (() => {
  const n = 64, d = new Uint8Array(n);
  for (let i = 0; i < n; i++) { const x = i / (n - 1); d[i] = Math.round((0.5 + 0.34 * ss(0.24, 0.44, x) + 0.16 * ss(0.64, 0.86, x)) * 255); }
  const t = new THREE.DataTexture(d, n, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.LinearFilter; t.generateMipmaps = false; t.needsUpdate = true;
  return t;
})();
/** brilho suave na borda (luz de recorte), dá volume e acabamento aos modelos */
function withRim(m, k = 0.2) {
  m.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <dithering_fragment>',
      `float rimF = 1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0);\n gl_FragColor.rgb += vec3(1.0, 0.96, 0.88) * pow(rimF, 2.6) * ${k.toFixed(2)};\n#include <dithering_fragment>`);
  };
  m.customProgramCacheKey = () => 'rim' + k;
  return m;
}
export const toon = withRim(new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: gradient }));
export const toonFlat = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: gradient });          // cenário distante (sem brilho de borda)
export const toonGlass = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: gradient, transparent: true, opacity: 0.42, depthWrite: false });
export { gradient as toonGradient };
export const glow = new THREE.MeshBasicMaterial({ vertexColors: true });                          // chamas, estrelas, brilhos (sem sombreamento)
export const glowSoft = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.8, depthWrite: false });

const OUT_COL = 0x1b2a49;
export function outlineMaterial(thick = 0.028) {
  const m = new THREE.MeshBasicMaterial({ color: OUT_COL, side: THREE.BackSide });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.th = { value: thick };
    sh.vertexShader = 'uniform float th;\n' + sh.vertexShader.replace('#include <begin_vertex>', 'vec3 transformed = position + normalize(normal) * th;');
  };
  m.customProgramCacheKey = () => 'outline';
  return m;
}
const OUT_MAT = outlineMaterial(0.03);
const OUT_MAT_THIN = outlineMaterial(0.02);

// ---- formas (todas suaves; baixa contagem de polígonos) ----
export const sph = (r = 0.5, w = 16, h = 12) => LOW ? new THREE.SphereGeometry(r, Math.min(Math.max(w, 10), 12), Math.min(Math.max(h, 7), 9)) : r < 0.04 ? new THREE.SphereGeometry(r, 8, 6) : r < 0.1 ? new THREE.SphereGeometry(r, 12, 9) : new THREE.SphereGeometry(r, Math.max(w, 16), Math.max(h, 12));
// nível de detalhe: o cenário de fundo é montado com menos segmentos (não aparece de perto)
let LOW = false;
export function lowDetail(fn) { const prev = LOW; LOW = true; try { return fn(); } finally { LOW = prev; } }
export const box = (w = 1, h = 1, d = 1, r = 0.06) => {
  const rr = Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001);
  if (rr <= 0.004 || (LOW && rr < 0.1)) return new THREE.BoxGeometry(w, h, d);   // cantos vivos (ou cenário distante): 12 triângulos
  return new RoundedBoxGeometry(w, h, d, rr < 0.12 ? 1 : 2, rr);           // bordas pequenas: 1 segmento basta
};
export const cyl = (rt = 0.5, rb = 0.5, h = 1, seg = 18) => new THREE.CylinderGeometry(rt, rb, h, seg >= 8 ? (LOW ? Math.min(Math.max(seg, 10), 14) : Math.max(seg, 18)) : seg);
export const cone = (r = 0.5, h = 1, seg = 16) => new THREE.ConeGeometry(r, h, seg >= 7 ? (LOW ? Math.min(Math.max(seg, 10), 14) : Math.max(seg, 16)) : seg);
export const cap = (r = 0.2, len = 0.5, seg = 6, rad = 14) => new THREE.CapsuleGeometry(r, len, Math.max(seg, 6), Math.max(rad, 14));
export const tor = (R = 0.5, r = 0.1, rs = 8, ts = 20, arc = Math.PI * 2) => new THREE.TorusGeometry(R, r, Math.max(rs, 8), ts >= 10 ? Math.max(ts, 22) : ts, arc);
/** sólido de revolução: perfil [[raio, altura], ...] de baixo para cima */
export const lathe = (profile, seg = 24) => LOW ? new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(Math.max(0.0001, r), y)), Math.min(seg, 12)) : new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(Math.max(0.0001, r), y)), seg);
/** tubo curvo e afinado (caudas, pescoços, patas, orelhas): pontos 3D e raios ao longo do caminho */
export function taper(points, radii, tubular = 22, radial = 14) {
  if (LOW) { tubular = Math.min(tubular, 6); radial = Math.min(radial, 8); }
  const curve = new THREE.CatmullRomCurve3(points.map((q) => new THREE.Vector3(q[0], q[1], q[2])));
  const fr = curve.computeFrenetFrames(tubular, false), pos = [], idx = [];
  const rAt = (t) => { const f = t * (radii.length - 1), i = Math.min(radii.length - 2, Math.floor(f)), k = f - i; return radii[i] + (radii[i + 1] - radii[i]) * k; };
  for (let i = 0; i <= tubular; i++) {
    const t = i / tubular, c = curve.getPointAt(t), r = rAt(t), N = fr.normals[i], B = fr.binormals[i];
    for (let j = 0; j <= radial; j++) { const a = j / radial * Math.PI * 2, cs = Math.cos(a), sn = -Math.sin(a); pos.push(c.x + r * (cs * N.x + sn * B.x), c.y + r * (cs * N.y + sn * B.y), c.z + r * (cs * N.z + sn * B.z)); }
  }
  for (let i = 0; i < tubular; i++) for (let j = 0; j < radial; j++) { const a = i * (radial + 1) + j, b = (i + 1) * (radial + 1) + j; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  // tampas arredondadas nas pontas
  [0, tubular].forEach((i, e) => { const c = curve.getPointAt(i / tubular), ci = pos.length / 3; pos.push(c.x, c.y, c.z); for (let j = 0; j < radial; j++) { const a = i * (radial + 1) + j; e ? idx.push(ci, a + 1, a) : idx.push(ci, a, a + 1); } });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
/** pedra orgânica: esfera com relevo suave (o relevo depende só da posição, então não abre frestas) */
export function rockGeo(r = 1, seed = 1, amp = 0.18, w = 18, h = 13) {
  if (LOW) { w = Math.min(w, 11); h = Math.min(h, 8); }
  const g = new THREE.SphereGeometry(r, w, h), pos = g.attributes.position, v = new THREE.Vector3();
  const n3 = (x, y, z) => { const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719 + seed * 3.17) * 43758.5453; return s - Math.floor(s); };
  const noise = (x, y, z) => { let t = 0, a = 1, f = 1.3; for (let o = 0; o < 3; o++) { t += a * (Math.sin(x * f + seed) * Math.sin(y * f * 1.3 + seed * 2) * Math.sin(z * f * 0.9 + seed * 3)); a *= 0.5; f *= 2.1; } return t + (n3(Math.round(x * 20), Math.round(y * 20), Math.round(z * 20)) - 0.5) * 0.15; };
  for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i); const k = 1 + amp * noise(v.x / r * 2.2, v.y / r * 2.2, v.z / r * 2.2); v.multiplyScalar(k); pos.setXYZ(i, v.x, v.y, v.z); }
  g.computeVertexNormals(); return g;
}
/** forma plana extrudada com bordas arredondadas (placas, folhas, asas, telhados) */
export function slab(pts, depth = 0.1, bevel = 0.04) {
  const sh = new THREE.Shape(); pts.forEach(([x, y], i) => (i ? sh.lineTo(x, y) : sh.moveTo(x, y))); sh.closePath();
  const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 10 });
  g.translate(0, 0, -depth / 2); return g;
}
export const plane = (w = 1, h = 1) => new THREE.PlaneGeometry(w, h);
export const dome = (r = 0.5, from = 0, len = Math.PI / 2, w = 16, h = 10) => new THREE.SphereGeometry(r, w, h, 0, Math.PI * 2, from, len);

/** peça: geometria + cor + posição/rotação/escala */
export const P = (geo, color, p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1]) => ({ geo, color, p, r, s });

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color();
/** mescla várias peças numa geometria só (uma chamada de desenho), com cor por vértice */
export function mergeParts(parts) {
  const geos = parts.map(({ geo, color, p, r, s }) => {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    if (g.attributes.uv) g.deleteAttribute('uv');
    if (g.attributes.uv1) g.deleteAttribute('uv1');
    if (!g.attributes.normal) g.computeVertexNormals();
    _e.set(r[0], r[1], r[2]); _q.setFromEuler(_e); _v.set(p[0], p[1], p[2]); _s.set(s[0], s[1], s[2]);
    _m.compose(_v, _q, _s); g.applyMatrix4(_m);
    _c.set(color);
    const n = g.attributes.position.count, col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { col[i * 3] = _c.r; col[i * 3 + 1] = _c.g; col[i * 3 + 2] = _c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return g;
  });
  const out = mergeGeometries(geos, false);
  geos.forEach((g) => g.dispose());
  return out;
}

const outCache = new WeakMap();
function outlineGeo(geo) {
  let o = outCache.get(geo);
  if (!o) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', geo.attributes.position.clone());
    const m = mergeVertices(g, 0.002); m.computeVertexNormals();
    o = m; outCache.set(geo, o);
  }
  return o;
}

/** malha com contorno escuro (casca invertida). Retorna um Group com 2 malhas. */
export function toMesh(parts, { outline = true, thin = false, material = toon } = {}) {
  const geo = mergeParts(parts);
  const g = new THREE.Group();
  const m = new THREE.Mesh(geo, material); g.add(m);
  if (outline) { const o = new THREE.Mesh(outlineGeo(geo), thin ? OUT_MAT_THIN : OUT_MAT); g.add(o); }
  g.userData.main = m;
  return g;
}

/** Grupo com pivô: filho posicionado em relação à articulação */
export function pivot(x, y, z) { const g = new THREE.Group(); g.position.set(x, y, z); return g; }

// ---- sombra de contato (disco suave) ----
let shadowTex = null;
function getShadowTex() {
  if (shadowTex) return shadowTex;
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d'); const gr = x.createRadialGradient(32, 32, 2, 32, 32, 31);
  gr.addColorStop(0, 'rgba(0,0,0,0.55)'); gr.addColorStop(0.6, 'rgba(0,0,0,0.28)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
  shadowTex = new THREE.CanvasTexture(c); shadowTex.colorSpace = THREE.SRGBColorSpace;
  return shadowTex;
}
const shadowGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
const shadowMat = () => new THREE.MeshBasicMaterial({ map: getShadowTex(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
export function blobShadow(w = 1, d = w) { const m = new THREE.Mesh(shadowGeo, shadowMat()); m.scale.set(w, 1, d); m.position.y = 0.02; m.renderOrder = 1; return m; }

// ---- partículas (uma única chamada de desenho) ----
export class Particles {
  constructor(parent, n = 220) {
    this.n = n;
    this.mesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false }), n);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false; this.mesh.renderOrder = 5;
    this.p = Array.from({ length: n }, () => ({ life: 0, max: 1, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, s: 0.1, g: 0, grow: 0, col: 0xffffff }));
    this.next = 0; this.dummy = new THREE.Object3D();
    for (let i = 0; i < n; i++) { this.dummy.scale.setScalar(0); this.dummy.updateMatrix(); this.mesh.setMatrixAt(i, this.dummy.matrix); this.mesh.setColorAt(i, new THREE.Color(1, 1, 1)); }
    parent.add(this.mesh);
  }
  emit(x, y, z, o = {}) {
    const p = this.p[this.next]; this.next = (this.next + 1) % this.n;
    p.x = x; p.y = y; p.z = z; p.vx = o.vx || 0; p.vy = o.vy || 0; p.vz = o.vz || 0; p.s = o.s ?? 0.1; p.g = o.g ?? 0; p.grow = o.grow ?? 0;
    p.life = p.max = o.life ?? 0.6; p.col = o.col ?? 0xffffff;
  }
  burst(x, y, z, n, o = {}) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, b = (Math.random() - 0.3) * Math.PI, sp = (o.speed ?? 2) * (0.5 + Math.random());
      this.emit(x, y, z, { ...o, vx: Math.cos(a) * Math.cos(b) * sp, vy: Math.sin(b) * sp + (o.up ?? 0), vz: Math.sin(a) * Math.cos(b) * sp, life: (o.life ?? 0.6) * (0.7 + Math.random() * 0.6) });
    }
  }
  update(dt, shift = 0) {
    // só as partículas vivas são desenhadas (compactadas no início da lista)
    const d = this.dummy; let k = 0;
    for (let i = 0; i < this.n; i++) {
      const p = this.p[i];
      if (p.life <= 0) continue;
      p.life -= dt; p.vy -= p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt + shift;
      if (p.life <= 0) continue;
      const q = Math.max(0, p.life / p.max), sc = p.s * (p.grow ? (1 + (1 - q) * p.grow) : q);
      d.position.set(p.x, p.y, p.z); d.scale.setScalar(Math.max(0.0001, sc)); d.updateMatrix();
      this.mesh.setMatrixAt(k, d.matrix); this.mesh.setColorAt(k, _c.set(p.col)); k++;
    }
    this.mesh.count = k;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }
}

export const hex = (c, f) => { _c.set(c); _c.multiplyScalar(f); return _c.getHex(); };
export const mixHex = (a, b, t) => { const ca = new THREE.Color(a), cb = new THREE.Color(b); return ca.lerp(cb, t).getHex(); };

// ---- sorteio com semente (as fases são reproduzíveis nos testes) ----
export function rng(seedStr) {
  let h = 1779033703 ^ String(seedStr).length;
  for (let i = 0; i < String(seedStr).length; i++) { h = Math.imul(h ^ String(seedStr).charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  let a = h >>> 0;
  const f = () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  return { frac: f, between: (a2, b2) => a2 + (b2 - a2) * f(), pick: (arr) => arr[Math.floor(f() * arr.length)], int: (a2, b2) => Math.floor(a2 + f() * (b2 - a2 + 1)) };
}
