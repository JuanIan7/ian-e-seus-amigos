// Kit 3D: materiais "cartoon" (toon + contorno), formas básicas, mesclagem de peças com cor por vértice,
// sombras de contato e partículas. Todos os modelos do jogo são montados por código (sem arquivos externos).
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export { THREE };

// ---- materiais ----
const gradient = (() => {
  const d = new Uint8Array([96, 178, 255]);
  const t = new THREE.DataTexture(d, 3, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true;
  return t;
})();
export const toon = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: gradient });
export const toonGlass = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: gradient, transparent: true, opacity: 0.42, depthWrite: false });
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
export const sph = (r = 0.5, w = 14, h = 10) => new THREE.SphereGeometry(r, w, h);
export const box = (w = 1, h = 1, d = 1, r = 0.06) => {
  const rr = Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001);
  if (rr <= 0.004) return new THREE.BoxGeometry(w, h, d);                 // cantos vivos: 12 triângulos (era 300)
  return new RoundedBoxGeometry(w, h, d, rr < 0.12 ? 1 : 2, rr);           // bordas pequenas: 1 segmento basta
};
export const cyl = (rt = 0.5, rb = 0.5, h = 1, seg = 14) => new THREE.CylinderGeometry(rt, rb, h, seg);
export const cone = (r = 0.5, h = 1, seg = 14) => new THREE.ConeGeometry(r, h, seg);
export const cap = (r = 0.2, len = 0.5, seg = 6, rad = 12) => new THREE.CapsuleGeometry(r, len, seg, rad);
export const tor = (R = 0.5, r = 0.1, rs = 8, ts = 20, arc = Math.PI * 2) => new THREE.TorusGeometry(R, r, rs, ts, arc);
export const plane = (w = 1, h = 1) => new THREE.PlaneGeometry(w, h);
export const dome = (r = 0.5, from = 0, len = Math.PI / 2, w = 16, h = 10) => new THREE.SphereGeometry(r, w, h, 0, Math.PI * 2, from, len);

/** peça: geometria + cor + posição/rotação/escala */
export const P = (geo, color, p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1]) => ({ geo, color, p, r, s });

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color();
/** mescla várias peças numa geometria só (uma chamada de desenho), com cor por vértice */
export function mergeParts(parts) {
  const geos = parts.map(({ geo, color, p, r, s }) => {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    g.deleteAttribute('uv');
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
    this.mesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false }), n);
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
    this.mesh.setColorAt(this.p.indexOf(p), _c.set(p.col)); this.colorDirty = true;
  }
  burst(x, y, z, n, o = {}) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, b = (Math.random() - 0.3) * Math.PI, sp = (o.speed ?? 2) * (0.5 + Math.random());
      this.emit(x, y, z, { ...o, vx: Math.cos(a) * Math.cos(b) * sp, vy: Math.sin(b) * sp + (o.up ?? 0), vz: Math.sin(a) * Math.cos(b) * sp, life: (o.life ?? 0.6) * (0.7 + Math.random() * 0.6) });
    }
  }
  update(dt, shift = 0) {
    const d = this.dummy;
    for (let i = 0; i < this.n; i++) {
      const p = this.p[i];
      if (p.life > 0) {
        p.life -= dt; p.vy -= p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt + shift;
        const k = Math.max(0, p.life / p.max), sc = p.s * (p.grow ? (1 + (1 - k) * p.grow) : k);
        d.position.set(p.x, p.y, p.z); d.scale.setScalar(Math.max(0.0001, sc * (p.life > 0 ? 1 : 0)));
      } else d.scale.setScalar(0);
      d.updateMatrix(); this.mesh.setMatrixAt(i, d.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.colorDirty && this.mesh.instanceColor) { this.mesh.instanceColor.needsUpdate = true; this.colorDirty = false; }
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
