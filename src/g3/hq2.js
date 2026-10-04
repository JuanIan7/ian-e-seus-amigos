// Comparação de qualidade — fase 2 (praça / equipe de resgate).
// Bichinhos: o mesmo modelo do jogo, refeito em dois níveis:
//  - 'alta': pelagem em tufos (silhueta fofinha) e sombreado suave de cima para baixo, ainda no estilo cartoon;
//  - 'muito': materiais físicos + pelo de verdade (camadas de fios), sombras projetadas.
import { THREE, P, sph, box, cyl, cone, cap, tor, dome, lathe, taper, slab, rockGeo, toMesh, hex, PART_HOOK, toon } from './kit.js';
import { buildDog, buildCat } from './creatures.js';
import { TEX } from './hq.js';

// ------------------------------------------------------------------ ruído 3D simples (para tufos)
function hash3(x, y, z) { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); }
function noise3(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  const L = (a, b, t) => a + (b - a) * t; const h = (a, b, c) => hash3(xi + a, yi + b, zi + c);
  return L(L(L(h(0, 0, 0), h(1, 0, 0), u), L(h(0, 1, 0), h(1, 1, 0), u), v), L(L(h(0, 0, 1), h(1, 0, 1), u), L(h(0, 1, 1), h(1, 1, 1), u), v), w);
}
/** tufos: desloca a superfície em mechinhas arredondadas (pelo de pelúcia) */
function tuft(geo, amp, freq, part = null, feats = []) {
  let g = geo;
  if (g.type === 'SphereGeometry') { const q = g.parameters; g = new THREE.SphereGeometry(q.radius, 44, 30, q.phiStart, q.phiLength, q.thetaStart, q.thetaLength); }
  else g = g.clone();
  g.computeBoundingSphere(); const R = g.boundingSphere.radius, a = amp * R;
  if (!g.attributes.normal) g.computeVertexNormals();
  const pos = g.attributes.position, nor = g.attributes.normal, v = new THREE.Vector3();
  const M = part ? partMatrix(part) : null;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), f = freq / R;
    const n = noise3(x * f, y * f, z * f); let d = a * Math.pow(Math.max(0, n * 1.3 - 0.25), 1.6);
    if (M && feats.length) { v.set(x, y, z).applyMatrix4(M); d *= maskAt(v, feats); }
    pos.setXYZ(i, x + nor.getX(i) * d, y + nor.getY(i) * d, z + nor.getZ(i) * d);
  }
  g.computeVertexNormals(); return g;
}
function partMatrix(p) { return new THREE.Matrix4().compose(new THREE.Vector3(...p.p), new THREE.Quaternion().setFromEuler(new THREE.Euler(...p.r)), new THREE.Vector3(...p.s)); }
/** 0 perto dos olhos/nariz/boca (o pelo não cobre o rosto), 1 longe */
function maskAt(v, feats) { let k = 1; for (const f of feats) { const d = v.distanceTo(f.c) - f.r; k = Math.min(k, Math.max(0, Math.min(1, (d - 0.01) / 0.07))); } return k; }
const isFur = (fur, p) => fur.has(p.color) && radOf(p) > 0.11;
function featuresOf(parts, fur) { return parts.filter((p) => !isFur(fur, p) && radOf(p) < 0.2).map((p) => { const g = p.geo; g.computeBoundingSphere(); return { c: g.boundingSphere.center.clone().applyMatrix4(partMatrix(p)), r: radOf(p) }; }); }
const radOf = (p) => { const g = p.geo; if (!g.boundingSphere) g.computeBoundingSphere(); return g.boundingSphere.radius * Math.max(...p.s); };

// ------------------------------------------------------------------ alta: tufos + degradê
function hookAlta(fur) {
  return (parts, opts) => {
    const feats = featuresOf(parts, fur), main = [...fur][0]; const np = parts.map((p) => (isFur(fur, p) ? { ...p, geo: tuft(p.geo, p.color === main ? 0.1 : 0.2, 3.2, p, feats) } : p));
    PART_HOOK.fn = null; const g = toMesh(np, opts); PART_HOOK.fn = hookAlta(fur);
    // sombreado de volume: parte de baixo um pouco mais escura, topo mais claro
    const geo = g.userData.main.geometry; geo.computeBoundingBox(); const bb = geo.boundingBox, h = Math.max(0.001, bb.max.y - bb.min.y);
    const pos = geo.attributes.position, col = geo.attributes.color;
    for (let i = 0; i < pos.count; i++) { const k = 0.84 + 0.24 * (pos.getY(i) - bb.min.y) / h; col.setXYZ(i, col.getX(i) * k, col.getY(i) * k, col.getZ(i) * k); }
    return g;
  };
}

// ------------------------------------------------------------------ muito alta: pelo em camadas (shell fur)
const furMats = [];
function furMaterial(shell, frac) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 });
  m.userData.u = { uShell: { value: shell }, uFrac: { value: frac } };
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, m.userData.u);
    sh.vertexShader = 'uniform float uShell; attribute float furLen; varying vec3 vLp; varying float vFl;\n' + sh.vertexShader.replace('#include <begin_vertex>', 'vec3 transformed = position + normal * uShell * furLen; vLp = position; vFl = furLen;');
    sh.fragmentShader = 'uniform float uFrac; varying vec3 vLp; varying float vFl;\n' + sh.fragmentShader
      .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
        vec3 cc = floor(vLp * 95.0); float hh = fract(sin(dot(cc, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
        if (uFrac > 0.0 && (hh < uFrac || vFl < 0.3)) discard;`)
      .replace('#include <color_fragment>', '#include <color_fragment>\n diffuseColor.rgb *= mix(1.0, mix(0.55, 1.08, clamp(uFrac * 1.25, 0.0, 1.0)), clamp(vFl, 0.0, 1.0));');
  };
  m.customProgramCacheKey = () => 'fur-shell';
  return m;
}
function hookMuito(fur) {
  return (parts) => {
    const g = new THREE.Group();
    const feats = featuresOf(parts, fur); const furP = parts.filter((p) => isFur(fur, p)).map((p) => ({ ...p, geo: tuft(p.geo, 0.07, 3.2, p, feats) }));
    const rest = parts.filter((p) => !isFur(fur, p));
    PART_HOOK.fn = null;
    if (rest.length) { const m = new THREE.Mesh(toMesh(rest, { outline: false }).userData.main.geometry, new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.2 })); m.castShadow = m.receiveShadow = true; g.add(m); }
    if (furP.length) {
      const geo = toMesh(furP, { outline: false }).userData.main.geometry;
      const pa = geo.attributes.position, fl = new Float32Array(pa.count), v = new THREE.Vector3();
      for (let i = 0; i < pa.count; i++) fl[i] = maskAt(v.fromBufferAttribute(pa, i), feats);
      geo.setAttribute('furLen', new THREE.BufferAttribute(fl, 1));
      const base = new THREE.Mesh(geo, furMaterial(0, 0)); base.castShadow = base.receiveShadow = true; g.add(base);
      const N = 14, L = 0.045;
      for (let i = 1; i <= N; i++) { const s = new THREE.Mesh(geo, furMaterial(L * i / N, i / (N + 1))); s.renderOrder = 1; s.receiveShadow = true; g.add(s); }
    }
    PART_HOOK.fn = hookMuito(fur);
    g.userData.main = g.children[0];
    return g;
  };
}
export function withLevel(level, fur, fn) { PART_HOOK.fn = level === 'alta' ? hookAlta(fur) : hookMuito(fur); try { return fn(); } finally { PART_HOOK.fn = null; } }

// ------------------------------------------------------------------ cães e gato
const DOG_FUR = { bolota: [0xe0a35a, 0x9a5a2a, 0xfff1d8], trovao: [0x5a4430, 0xd29a52, 0xe8b878], pipoca: [0xfafafa, 0x2a2a2a, 0xffffff] };
function dogs(level) {
  const g = new THREE.Group();
  ['bolota', 'trovao', 'pipoca'].forEach((k, i) => {
    const d = level === 'atual' ? buildDog(k) : withLevel(level, new Set(DOG_FUR[k]), () => buildDog(k));
    d.scale.setScalar(1.6); d.position.x = (i - 1) * 1.6; d.rotation.y = (1 - i) * 0.25; g.add(d);
  });
  return g;
}
function cat(level) {
  const c = level === 'atual' ? buildCat() : withLevel(level, new Set([0xffa043, 0xd9711f, 0xfff0d6]), () => buildCat());
  c.scale.setScalar(2.2); return c;
}

// =================================================================== LOJA
function shopAlta() {
  const g = new THREE.Group(), p = [], wall = 0xffcf9a, aw = 0x2f9b6a, fz = -2.0;
  p.push(P(box(5.2, 3.2, 4, 0.14), wall, [0, 1.6, 0]), P(box(5.6, 0.4, 4.4, 0.1), 0xffffff, [0, 3.4, 0]), P(box(5.4, 0.35, 4.2, 0.1), 0xc4704a, [0, 0.17, 0]));
  for (let i = 0; i < 9; i++) p.push(P(box(0.08, 3.0, 0.04, 0.02), hex(wall, 0.92), [-2.4 + i * 0.6, 1.65, fz - 0.01]));
  // toldo listrado com bordinha ondulada
  for (let i = 0; i < 8; i++) { p.push(P(box(0.66, 0.08, 1.3, 0.03), i % 2 ? 0xffffff : aw, [-2.31 + i * 0.66, 2.35, fz - 0.55], [0.42, 0, 0])); p.push(P(cyl(0.33, 0.33, 0.06, 18, 1), i % 2 ? 0xffffff : aw, [-2.31 + i * 0.66, 2.04, fz - 1.15], [Math.PI / 2, 0, 0], [1, 1, 0.55])); }
  // vitrine com prateleiras e produtos (frutas e pães), porta com sininho, letreiro com ícone
  p.push(P(box(2.3, 1.6, 0.12, 0.06), 0xffffff, [-1.2, 1.2, fz - 0.03]), P(box(2.1, 1.4, 0.06, 0.03), 0xbfe6ff, [-1.2, 1.2, fz - 0.06]));
  [0.75, 1.25].forEach((y) => { p.push(P(box(2.0, 0.05, 0.3, 0.02), 0x9a6a3a, [-1.2, y, fz + 0.1])); for (let k = 0; k < 6; k++) p.push(P(sph(0.1), [0xff4d4d, 0xffd23f, 0x3ecb6b, 0xff8a1f][(k + (y > 1 ? 1 : 0)) % 4], [-2.0 + k * 0.32, y + 0.1, fz + 0.05])); });
  p.push(P(box(1.1, 2.0, 0.12, 0.05), 0xffffff, [1.4, 1.05, fz - 0.03]), P(box(0.92, 1.85, 0.08, 0.04), 0x2f9b6a, [1.4, 1.0, fz - 0.06]), P(box(0.6, 0.8, 0.04, 0.02), 0xbfe6ff, [1.4, 1.35, fz - 0.1]), P(sph(0.06), 0xffd23f, [1.7, 0.95, fz - 0.12]));
  p.push(P(box(2.6, 0.7, 0.14, 0.1), 0xffd23f, [0, 2.95, fz - 0.08]), P(box(2.4, 0.5, 0.04, 0.06), 0xfff4c2, [0, 2.95, fz - 0.15]));
  p.push(P(sph(0.18), 0xff4d4d, [-0.6, 2.95, fz - 0.2], [0, 0, 0], [1, 1, 0.5]), P(cap(0.02, 0.08, 4, 6), 0x5a3a1a, [-0.6, 3.13, fz - 0.2]), P(sph(0.15), 0xff8a1f, [-0.2, 2.95, fz - 0.2], [0, 0, 0], [1, 1, 0.5]), P(box(0.7, 0.24, 0.05, 0.04), 0x2f9b6a, [0.45, 2.95, fz - 0.19]));
  // caixotes de frutas na calçada e vasinhos
  [-2.0, -0.9].forEach((x, j) => { p.push(P(box(0.8, 0.45, 0.6, 0.04), 0xc98a42, [x, 0.25, fz - 0.9])); for (let k = 0; k < 6; k++) p.push(P(sph(0.13), j ? 0xff4d4d : 0x9bd64a, [x - 0.25 + (k % 3) * 0.25, 0.55, fz - 1.02 + Math.floor(k / 3) * 0.24])); });
  [2.25].forEach((x) => p.push(P(cyl(0.25, 0.2, 0.45, 16), 0xc4704a, [x, 0.25, fz - 0.4]), P(rockGeo(0.35, 4, 0.14), 0x3bc65e, [x, 0.7, fz - 0.4])));
  g.add(toMesh(p, { thin: true }));
  return g;
}
function shopMuito() {
  const g = new THREE.Group(), fz = -2.0, std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...o });
  const mesh = (geo, m, p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1]) => { const x = new THREE.Mesh(geo, m); x.position.set(...p); x.rotation.set(...r); x.scale.set(...s); x.castShadow = x.receiveShadow = true; g.add(x); return x; };
  const wallM = std(0xffffff, { map: TEX.plaster('#ffcf9a', [3, 2]), bumpMap: TEX.plaster('#ffcf9a', [3, 2]), bumpScale: 1, roughness: 0.9 });
  mesh(new THREE.BoxGeometry(5.2, 3.2, 4), wallM, [0, 1.6, 0]); mesh(new THREE.BoxGeometry(5.6, 0.4, 4.4), std(0xf6f6f6), [0, 3.4, 0]); mesh(new THREE.BoxGeometry(5.4, 0.35, 4.2), std(0xffffff, { map: TEX.brick([6, 1]) }), [0, 0.17, 0]);
  const aw = std(0xffffff, { map: TEX.stripes('#2f9b6a', '#ffffff', 10), roughness: 0.85, side: THREE.DoubleSide }); aw.map.center.set(0.5, 0.5); aw.map.rotation = Math.PI / 2;
  mesh(new THREE.PlaneGeometry(5.3, 1.35), aw, [0, 2.32, fz - 0.55], [-Math.PI / 2 + 0.42, 0, 0]);
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xcfeaff, roughness: 0.04, metalness: 0, transmission: 0.6, transparent: true, opacity: 0.35, envMapIntensity: 1.8 });
  mesh(new THREE.BoxGeometry(2.3, 1.6, 0.1), std(0xffffff, { roughness: 0.4 }), [-1.2, 1.2, fz + 0.02]);
  [0.75, 1.25].forEach((y) => { mesh(new THREE.BoxGeometry(2.0, 0.05, 0.3), std(0xffffff, { map: TEX.wood([2, 1]) }), [-1.2, y, fz - 0.08]); for (let k = 0; k < 6; k++) mesh(new THREE.SphereGeometry(0.1, 20, 14), std([0xe0302a, 0xffcf2a, 0x3ecb3b, 0xff8a1f][(k + (y > 1 ? 1 : 0)) % 4], { roughness: 0.35 }), [-2.0 + k * 0.32, y + 0.1, fz - 0.12]); });
  const win = mesh(new THREE.BoxGeometry(2.1, 1.4, 0.03), glass, [-1.2, 1.2, fz - 0.3]); win.castShadow = false;
  mesh(new THREE.BoxGeometry(1.1, 2.0, 0.1), std(0xf4f4f4, { roughness: 0.4 }), [1.4, 1.05, fz - 0.03]); mesh(new THREE.BoxGeometry(0.92, 1.85, 0.08), new THREE.MeshPhysicalMaterial({ color: 0x2f9b6a, roughness: 0.3, clearcoat: 1 }), [1.4, 1.0, fz - 0.06]);
  mesh(new THREE.BoxGeometry(0.6, 0.8, 0.03), glass, [1.4, 1.35, fz - 0.12]); mesh(new THREE.SphereGeometry(0.06, 16, 12), std(0xe0b030, { metalness: 1, roughness: 0.25 }), [1.7, 0.95, fz - 0.14]);
  mesh(new THREE.BoxGeometry(2.6, 0.7, 0.14), std(0xffd23f, { emissive: 0xffd23f, emissiveIntensity: 0.25 }), [0, 2.95, fz - 0.08]);
  mesh(new THREE.SphereGeometry(0.18, 20, 14), std(0xe0302a, { roughness: 0.3 }), [-0.6, 2.95, fz - 0.2], [0, 0, 0], [1, 1, 0.5]); mesh(new THREE.BoxGeometry(0.7, 0.24, 0.05), std(0x2f9b6a), [0.45, 2.95, fz - 0.19]);
  [-2.0, -0.9].forEach((x, j) => { mesh(new THREE.BoxGeometry(0.8, 0.45, 0.6), std(0xffffff, { map: TEX.wood([1, 1], '#c98a42') }), [x, 0.25, fz - 0.9]); for (let k = 0; k < 6; k++) mesh(new THREE.SphereGeometry(0.13, 20, 14), std(j ? 0xd92a24 : 0x8bd03a, { roughness: 0.3 }), [x - 0.25 + (k % 3) * 0.25, 0.55, fz - 1.02 + Math.floor(k / 3) * 0.24]); });
  mesh(new THREE.CylinderGeometry(0.25, 0.2, 0.45, 24), std(0xb5603a), [2.25, 0.25, fz - 0.4]); mesh(rockGeo(0.35, 4, 0.14), std(0x2f9b4a, { roughness: 0.9 }), [2.25, 0.7, fz - 0.4]);
  const lamp = new THREE.PointLight(0xffe2a0, 6, 5); lamp.position.set(-1.2, 1.4, fz + 0.6); g.add(lamp);
  return g;
}

// =================================================================== CHAFARIZ
function fountainAlta() {
  const p = [], g = new THREE.Group();
  p.push(P(lathe([[0.0001, 0], [2.0, 0], [2.05, 0.1], [1.95, 0.55], [2.05, 0.62], [1.85, 0.66], [1.7, 0.3], [0.0001, 0.3]], 48), 0xd9dde6));
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; p.push(P(box(0.5, 0.42, 0.12, 0.04), i % 2 ? 0xcfd5e0 : 0xe1e5ec, [Math.cos(a) * 1.98, 0.3, Math.sin(a) * 1.98], [0, -a + Math.PI / 2, 0])); }
  p.push(P(lathe([[0.3, 0.3], [0.22, 0.8], [0.3, 1.1], [0.18, 1.5], [0.2, 1.7]], 32), 0xd9dde6));
  p.push(P(lathe([[0.0001, 1.65], [0.95, 1.7], [1.05, 1.86], [0.9, 1.9], [0.0001, 1.8]], 40), 0xd9dde6));
  p.push(P(lathe([[0.12, 1.9], [0.08, 2.3], [0.14, 2.5], [0.0001, 2.7]], 24), 0xd9dde6));
  g.add(toMesh(p, { thin: true }));
  // água: espelho d'água com ondinhas, cascata da bacia de cima, jatinho
  const w = [P(cyl(1.82, 1.82, 0.05, 48), 0x56c7ff, [0, 0.56, 0]), P(cyl(0.88, 0.88, 0.05, 40), 0x56c7ff, [0, 1.84, 0])];
  for (let i = 0; i < 3; i++) w.push(P(tor(0.5 + i * 0.4, 0.02, 6, 48), 0xb8ecff, [0.2, 0.6, 0.1], [Math.PI / 2, 0, 0]));
  w.push(P(lathe([[0.92, 1.88], [1.05, 1.4], [1.3, 0.95], [1.45, 0.58], [1.38, 0.58], [1.22, 0.95], [0.98, 1.4], [0.85, 1.88]], 40), 0x8ee0ff));
  w.push(P(lathe([[0.0001, 2.6], [0.06, 2.75], [0.04, 3.1], [0.0001, 3.25]], 16), 0xb8ecff));
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; w.push(P(sph(0.05), 0xffffff, [Math.cos(a) * 0.35, 3.0 + (i % 2) * 0.12, Math.sin(a) * 0.35])); }
  const wm = toMesh(w, { outline: false }); wm.userData.main.material = new THREE.MeshToonMaterial({ vertexColors: true, transparent: true, opacity: 0.82 }); g.add(wm);
  return g;
}
function fountainMuito() {
  const g = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ color: 0xffffff, map: TEX.plaster('#dfe2e8', [4, 1]), bumpMap: TEX.plaster('#dfe2e8', [4, 1]), bumpScale: 2, roughness: 0.85 });
  const add = (geo, m, p = [0, 0, 0], r = [0, 0, 0]) => { const x = new THREE.Mesh(geo, m); x.position.set(...p); x.rotation.set(...r); x.castShadow = x.receiveShadow = true; g.add(x); return x; };
  const L = (pts, seg) => new THREE.LatheGeometry(pts.map(([a, b]) => new THREE.Vector2(a, b)), seg);
  add(L([[0.0001, 0], [2.0, 0], [2.05, 0.1], [1.95, 0.55], [2.05, 0.62], [1.85, 0.66], [1.7, 0.3], [0.0001, 0.3]], 72), stone);
  add(L([[0.3, 0.3], [0.22, 0.8], [0.3, 1.1], [0.18, 1.5], [0.2, 1.7]], 48), stone);
  add(L([[0.0001, 1.65], [0.95, 1.7], [1.05, 1.86], [0.9, 1.9], [0.0001, 1.8]], 64), stone);
  add(L([[0.12, 1.9], [0.08, 2.3], [0.14, 2.5], [0.0001, 2.7]], 32), stone);
  const water = new THREE.MeshPhysicalMaterial({ color: 0x4fb8e8, roughness: 0.05, metalness: 0, transmission: 0.5, transparent: true, opacity: 0.78, clearcoat: 1, envMapIntensity: 2,
    normalMap: (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); const im = x.createImageData(128, 128); for (let j = 0; j < 128; j++) for (let i = 0; i < 128; i++) { const k = (j * 128 + i) * 4, a = Math.sin(i * 0.3 + Math.sin(j * 0.21) * 2) * 0.5, b = Math.cos(j * 0.27 + Math.sin(i * 0.17) * 2) * 0.5; im.data[k] = 128 + a * 60; im.data[k + 1] = 128 + b * 60; im.data[k + 2] = 255; im.data[k + 3] = 255; } x.putImageData(im, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3); return t; })() });
  const w1 = add(new THREE.CircleGeometry(1.82, 64), water, [0, 0.58, 0], [-Math.PI / 2, 0, 0]); w1.castShadow = false;
  const w2 = add(new THREE.CircleGeometry(0.9, 48), water, [0, 1.86, 0], [-Math.PI / 2, 0, 0]); w2.castShadow = false;
  const fall = new THREE.MeshPhysicalMaterial({ color: 0xbfe9ff, roughness: 0.1, transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false });
  const f = add(L([[0.92, 1.88], [1.05, 1.4], [1.3, 0.95], [1.45, 0.6]], 64), fall); f.castShadow = false;
  const jet = add(L([[0.0001, 2.6], [0.06, 2.75], [0.04, 3.1], [0.0001, 3.25]], 24), fall); jet.castShadow = false;
  // gotinhas brilhantes
  const dg = new THREE.SphereGeometry(0.035, 10, 8), dm = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0, transmission: 0.8, transparent: true, opacity: 0.8 });
  for (let i = 0; i < 40; i++) { const a = i * 2.4, r = 0.2 + (i % 7) * 0.12, y = 3.1 - (r * r) * 1.2; const d = new THREE.Mesh(dg, dm); d.position.set(Math.cos(a) * r, y, Math.sin(a) * r); g.add(d); }
  return g;
}

// =================================================================== BANCO + CANTEIRO DE FLORES
function flowerCluster(p, cx, cz, n, R, seed) {
  let s = seed; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < n; i++) {
    const a = rnd() * 6.28, rr = Math.sqrt(rnd()) * R, x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr, h = 0.35 + rnd() * 0.25, c = [0xff5d8f, 0xffd23f, 0xff8a1f, 0xffffff, 0xb18cff, 0xff4d4d][Math.floor(rnd() * 6)];
    p.push(P(cyl(0.015, 0.015, h, 6), 0x2fa84a, [x, 0.22 + h / 2, z]));
    for (let k = 0; k < 5; k++) { const b = k / 5 * 6.28; p.push(P(sph(0.055), c, [x + Math.cos(b) * 0.06, 0.24 + h, z + Math.sin(b) * 0.06], [0, 0, 0], [1, 0.45, 1])); }
    p.push(P(sph(0.035), 0xffd23f, [x, 0.26 + h, z]));
    p.push(P(sph(0.06), 0x3ecb6b, [x + 0.05, 0.22 + h * 0.4, z], [0, 0, 0.6], [1.6, 0.35, 0.8]));
  }
}
function plazaAlta() {
  const g = new THREE.Group(), p = [];
  // banco de praça: ripas de madeira, pés de ferro curvos, apoio de braço
  for (let i = 0; i < 4; i++) p.push(P(box(2.0, 0.07, 0.14, 0.03), i % 2 ? 0xc98a42 : 0xd69a52, [0, 0.5, -0.24 + i * 0.16]));
  for (let i = 0; i < 3; i++) p.push(P(box(2.0, 0.14, 0.06, 0.03), i % 2 ? 0xc98a42 : 0xd69a52, [0, 0.72 + i * 0.18, 0.32], [-0.2, 0, 0]));
  [-0.85, 0.85].forEach((x) => { p.push(P(taper([[x, 0, -0.3], [x, 0.3, -0.25], [x, 0.48, -0.2], [x, 0.5, 0.15], [x, 0.48, 0.28], [x, 1.1, 0.42]], [0.04, 0.04, 0.04, 0.04, 0.04, 0.035], 30, 8), 0x2f3a4f), P(taper([[x, 0, 0.3], [x, 0.3, 0.25], [x, 0.48, 0.2]], [0.04, 0.04, 0.04], 12, 8), 0x2f3a4f), P(taper([[x, 0.5, -0.25], [x, 0.72, -0.28], [x, 0.74, 0.1]], [0.03, 0.03, 0.03], 12, 8), 0x2f3a4f)); });
  // canteiro redondo de tijolinho, terra e flores variadas
  p.push(P(cyl(1.0, 1.05, 0.3, 32), 0xc4704a, [2.6, 0.15, 0]), P(cyl(0.92, 0.92, 0.04, 32), 0x7a4e2c, [2.6, 0.3, 0]));
  for (let i = 0; i < 16; i++) { const a = i / 16 * 6.28; p.push(P(box(0.36, 0.1, 0.18, 0.03), i % 2 ? 0xb5603a : 0xd07a4a, [2.6 + Math.cos(a) * 1.0, 0.32, Math.sin(a) * 1.0], [0, -a, 0])); }
  flowerCluster(p, 2.6, 0, 22, 0.8, 5);
  // canteiro de grama com flores à esquerda
  p.push(P(box(1.3, 0.25, 0.8, 0.06), 0xc4704a, [-2.4, 0.12, 0]), P(box(1.2, 0.05, 0.7, 0.03), 0x7a4e2c, [-2.4, 0.25, 0]));
  flowerCluster(p, -2.4, 0, 14, 0.4, 9);
  g.add(toMesh(p, { thin: true }));
  return g;
}
function plazaMuito() {
  const g = new THREE.Group(), std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...o });
  const add = (geo, m, p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1]) => { const x = new THREE.Mesh(geo, m); x.position.set(...p); x.rotation.set(...r); x.scale.set(...s); x.castShadow = x.receiveShadow = true; g.add(x); return x; };
  const wood = std(0xffffff, { map: TEX.wood([2, 1], '#c98a42'), roughness: 0.6 }), iron = std(0x1f2633, { metalness: 0.8, roughness: 0.35 });
  for (let i = 0; i < 4; i++) add(new THREE.BoxGeometry(2.0, 0.07, 0.14), wood, [0, 0.5, -0.24 + i * 0.16]);
  for (let i = 0; i < 3; i++) add(new THREE.BoxGeometry(2.0, 0.14, 0.06), wood, [0, 0.72 + i * 0.18, 0.32], [-0.2, 0, 0]);
  [-0.85, 0.85].forEach((x) => { add(taper([[x, 0, -0.3], [x, 0.3, -0.25], [x, 0.48, -0.2], [x, 0.5, 0.15], [x, 0.48, 0.28], [x, 1.1, 0.42]], [0.04, 0.04, 0.04, 0.04, 0.04, 0.035], 40, 10), iron); add(taper([[x, 0, 0.3], [x, 0.3, 0.25], [x, 0.48, 0.2]], [0.04, 0.04, 0.04], 16, 10), iron); add(taper([[x, 0.5, -0.25], [x, 0.72, -0.28], [x, 0.74, 0.1]], [0.03, 0.03, 0.03], 16, 10), iron); });
  const brick = std(0xffffff, { map: TEX.brick([8, 1]), bumpMap: TEX.brick([8, 1]), bumpScale: 2, roughness: 0.9 });
  add(new THREE.CylinderGeometry(1.0, 1.05, 0.3, 48, 1, true), brick, [2.6, 0.15, 0]); add(new THREE.CylinderGeometry(0.98, 0.98, 0.04, 48), std(0x5a3a22, { roughness: 1 }), [2.6, 0.3, 0]);
  add(new THREE.BoxGeometry(1.3, 0.25, 0.8), brick, [-2.4, 0.12, 0]); add(new THREE.BoxGeometry(1.2, 0.05, 0.7), std(0x5a3a22, { roughness: 1 }), [-2.4, 0.25, 0]);
  // flores: pétalas com material de "veludo" (sheen) e folhagem
  const petal = new THREE.SphereGeometry(0.055, 14, 10), stem = new THREE.CylinderGeometry(0.012, 0.015, 1, 6), leaf = new THREE.SphereGeometry(0.06, 12, 8);
  const pm = {}; const PM = (c) => pm[c] || (pm[c] = new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.55, sheen: 1, sheenColor: new THREE.Color(0xffffff), sheenRoughness: 0.4 }));
  const green = std(0x2f9a3e, { roughness: 0.6 }), center = std(0xffc22a, { roughness: 0.5 });
  [[2.6, 0, 26, 0.8, 5], [-2.4, 0, 14, 0.4, 9]].forEach(([cx, cz, n, R, seed]) => {
    let s = seed; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < n; i++) {
      const a = rnd() * 6.28, rr = Math.sqrt(rnd()) * R, x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr, h = 0.35 + rnd() * 0.25, c = [0xff5d8f, 0xffd23f, 0xff8a1f, 0xffffff, 0xb18cff, 0xff4d4d][Math.floor(rnd() * 6)];
      add(stem, green, [x, 0.22 + h / 2, z], [0, 0, 0], [1, h, 1]);
      for (let k = 0; k < 6; k++) { const b = k / 6 * 6.28; add(petal, PM(c), [x + Math.cos(b) * 0.06, 0.24 + h, z + Math.sin(b) * 0.06], [0, -b, 0.3], [1.3, 0.35, 0.8]); }
      add(new THREE.SphereGeometry(0.035, 12, 8), center, [x, 0.26 + h, z]);
      add(leaf, green, [x + 0.05, 0.22 + h * 0.4, z], [0, a, 0.6], [1.6, 0.3, 0.8]);
    }
  });
  return g;
}

// =================================================================== OBSTÁCULOS DA PRAÇA (banco, arbusto)
function obsAlta() {
  const g = new THREE.Group(), b = [];
  for (let i = 0; i < 3; i++) b.push(P(box(1.6, 0.06, 0.15, 0.03), i % 2 ? 0xc98a42 : 0xd69a52, [0, 0.42, -0.17 + i * 0.17]));
  for (let i = 0; i < 2; i++) b.push(P(box(1.6, 0.14, 0.06, 0.03), i % 2 ? 0xc98a42 : 0xd69a52, [0, 0.6 + i * 0.17, 0.24], [-0.15, 0, 0]));
  [-0.68, 0.68].forEach((x) => b.push(P(taper([[x, 0, -0.22], [x, 0.4, -0.18], [x, 0.42, 0.22], [x, 0.9, 0.3]], [0.035, 0.035, 0.035, 0.03], 20, 8), 0x2f3a4f), P(taper([[x, 0, 0.22], [x, 0.4, 0.2]], [0.035, 0.035], 8, 8), 0x2f3a4f)));
  const m1 = toMesh(b, { thin: true }); m1.position.x = -1.2; g.add(m1);
  const s = []; let sd = 3; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 14; i++) { const a = i * 2.4, rr = 0.15 + rnd() * 0.42, y = 0.35 + rnd() * 0.4; s.push(P(rockGeo(0.24 + rnd() * 0.12, i * 3.1, 0.15, 16, 12), hex(0x34c25e, 0.78 + 0.45 * (y - 0.35) / 0.4), [Math.cos(a) * rr, y, Math.sin(a) * rr * 0.75])); }
  for (let i = 0; i < 7; i++) { const a = i * 0.9 + 0.3; s.push(P(sph(0.05), 0xffffff, [Math.cos(a) * 0.5, 0.75 + (i % 3) * 0.08, -0.3 + Math.sin(a) * 0.1]), P(sph(0.075), [0xff5d8f, 0xffd23f, 0xff5d8f][i % 3], [Math.cos(a) * 0.5, 0.76 + (i % 3) * 0.08, -0.32 + Math.sin(a) * 0.1], [0, 0, 0], [1, 0.5, 1])); }
  const m2 = toMesh(s, { outline: false }); m2.position.x = 1.2; g.add(m2);
  return g;
}
function obsMuito() {
  const g = new THREE.Group(), std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...o });
  const add = (geo, m, p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1]) => { const x = new THREE.Mesh(geo, m); x.position.set(...p); x.rotation.set(...r); x.scale.set(...s); x.castShadow = x.receiveShadow = true; g.add(x); return x; };
  const wood = std(0xffffff, { map: TEX.wood([2, 1], '#c98a42'), roughness: 0.6 }), iron = std(0x1f2633, { metalness: 0.8, roughness: 0.35 });
  for (let i = 0; i < 3; i++) add(new THREE.BoxGeometry(1.6, 0.06, 0.15), wood, [-1.2, 0.42, -0.17 + i * 0.17]);
  for (let i = 0; i < 2; i++) add(new THREE.BoxGeometry(1.6, 0.14, 0.06), wood, [-1.2, 0.6 + i * 0.17, 0.24], [-0.15, 0, 0]);
  [-0.68, 0.68].forEach((x) => { add(taper([[x - 1.2, 0, -0.22], [x - 1.2, 0.4, -0.18], [x - 1.2, 0.42, 0.22], [x - 1.2, 0.9, 0.3]], [0.035, 0.035, 0.035, 0.03], 24, 10), iron); add(taper([[x - 1.2, 0, 0.22], [x - 1.2, 0.4, 0.2]], [0.035, 0.035], 8, 10), iron); });
  // arbusto: miolo escuro + 1600 folhinhas + flores
  const core = std(0x1f6a2e, { roughness: 1 });
  [[0, 0.45, 0, 0.45], [-0.3, 0.38, 0.05, 0.32], [0.32, 0.4, -0.02, 0.34]].forEach(([x, y, z, r], i) => add(rockGeo(r, i + 2, 0.15, 18, 12), core, [x + 1.2, y, z]));
  const lg = new THREE.PlaneGeometry(0.16, 0.16); lg.translate(0, 0.07, 0);
  const lm = new THREE.MeshStandardMaterial({ map: TEX.leaf(), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.6 });
  const N = 1600, inst = new THREE.InstancedMesh(lg, lm, N), d = new THREE.Object3D(), col = new THREE.Color(), n = new THREE.Vector3(); let sd = 11; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  const blobs = [[0, 0.45, 0, 0.5], [-0.3, 0.38, 0.05, 0.38], [0.32, 0.4, -0.02, 0.4]];
  for (let i = 0; i < N; i++) {
    const [bx, by, bz, br] = blobs[i % 3], u = rnd() * 2 - 1, th = rnd() * 6.28, s = Math.sqrt(1 - u * u); n.set(Math.cos(th) * s, Math.max(-0.2, u), Math.sin(th) * s).normalize();
    const rr = br * (0.88 + rnd() * 0.18); d.position.set(bx + 1.2 + n.x * rr, Math.max(0.05, by + n.y * rr), bz + n.z * rr); d.lookAt(d.position.x + n.x, d.position.y + n.y + 0.5, d.position.z + n.z); d.rotateZ(rnd() * 6.28); d.scale.setScalar(0.8 + rnd() * 0.5); d.updateMatrix(); inst.setMatrixAt(i, d.matrix);
    col.set(0x2f9e45).multiplyScalar(0.7 + 0.5 * (d.position.y / 0.9) + (rnd() - 0.5) * 0.2); inst.setColorAt(i, col);
  }
  inst.castShadow = inst.receiveShadow = true; inst.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: TEX.leaf(), alphaTest: 0.5 }); g.add(inst);
  const pm = new THREE.MeshPhysicalMaterial({ color: 0xff5d8f, roughness: 0.5, sheen: 1, sheenColor: new THREE.Color(0xffffff) });
  for (let i = 0; i < 9; i++) { const a = i * 0.7 + 0.2; add(new THREE.SphereGeometry(0.06, 14, 10), i % 3 === 1 ? std(0xffd23f, { roughness: 0.5 }) : pm, [1.2 + Math.cos(a) * 0.5, 0.78 + (i % 3) * 0.08, -0.38 + Math.sin(a) * 0.12], [0, 0, 0], [1, 0.55, 1]); }
  return g;
}

export const HQ2 = {
  dogs: { alta: () => dogs('alta'), muito: () => dogs('muito'), atual: () => dogs('atual') },
  cat: { alta: () => cat('alta'), muito: () => cat('muito'), atual: () => cat('atual') },
  shop: { alta: shopAlta, muito: shopMuito },
  fountain: { alta: fountainAlta, muito: fountainMuito },
  plaza: { alta: plazaAlta, muito: plazaMuito },
  obs2: { alta: obsAlta, muito: obsMuito },
};
