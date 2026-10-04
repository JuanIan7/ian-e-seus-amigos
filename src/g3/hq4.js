// Comparação de qualidade — fase 4 (resgate nas alturas).
import { THREE, P, sph, box, cyl, cone, cap, tor, dome, lathe, taper, slab, rockGeo, toMesh, hex } from './kit.js';
import { TEX } from './hq.js';

const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, ...o });
const paint = (c) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.3, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.08 });
const chrome = () => std(0xdfe4ec, { metalness: 1, roughness: 0.2 });
const glassM = () => new THREE.MeshPhysicalMaterial({ color: 0xaee0ff, roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.55, envMapIntensity: 2 });
function adder(g) { return (geo, m, p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1]) => { const x = new THREE.Mesh(geo, m); x.position.set(...p); x.rotation.set(...r); x.scale.set(...s); x.castShadow = x.receiveShadow = true; g.add(x); return x; }; }
const L = (pts, seg = 40) => new THREE.LatheGeometry(pts.map(([a, b]) => new THREE.Vector2(Math.max(0.0001, a), b)), seg);
let glowT = null;
function glow(col, size, op = 0.8) {
  if (!glowT) { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, '#fff'); gr.addColorStop(0.35, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); glowT = new THREE.CanvasTexture(c); }
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowT, color: col, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: op })); s.scale.setScalar(size); return s;
}
// corpo aerodinâmico do helicóptero (perfil de gota visto de lado, girado no eixo Z)
const HELI_BODY = [[0.0001, -1.45], [0.35, -1.38], [0.62, -1.15], [0.82, -0.75], [0.9, -0.2], [0.88, 0.3], [0.75, 0.75], [0.5, 1.05], [0.3, 1.2], [0.0001, 1.25]];

// =================================================================== HELICÓPTERO
function heliAlta() {
  const g = new THREE.Group(), p = [], C = 0x8a4fd9, D = 0x6a35b5, W = 0xffffff, Y = 0xffd23f, M = 0x59616e;
  p.push(P(L(HELI_BODY, 36), C, [0, 0, 0], [Math.PI / 2, 0, 0], [1, 1, 0.92]));
  p.push(P(box(1.86, 0.12, 2.2, 0.05), W, [0, -0.15, 0.1]), P(box(1.88, 0.06, 2.0, 0.03), Y, [0, -0.32, 0.1]));
  // cabine de vidro em bolha com moldura
  p.push(P(sph(0.62), 0x9fdcff, [0, 0.24, -0.98], [0, 0, 0], [0.95, 0.85, 0.9]), P(box(0.05, 0.9, 0.05, 0.02), D, [0, 0.3, -1.38], [0.55, 0, 0]));
  p.push(P(sph(0.16), 0xffffff, [-0.3, 0.45, -1.25], [0, 0, 0], [1, 0.6, 0.3])); // reflexo
  // porta lateral, janelas, faixa de resgate com cruz
  [-1, 1].forEach((s) => { p.push(P(box(0.06, 0.62, 0.7, 0.04), D, [s * 0.86, 0.05, 0.25]), P(box(0.06, 0.36, 0.42, 0.04), 0x9fdcff, [s * 0.88, 0.2, 0.25]), P(box(0.05, 0.05, 0.22, 0.02), M, [s * 0.9, -0.05, 0.05])); p.push(P(box(0.04, 0.3, 0.1, 0.01), 0xe8352f, [s * 0.9, 0.02, 0.75]), P(box(0.04, 0.1, 0.3, 0.01), 0xe8352f, [s * 0.9, 0.02, 0.75])); });
  // cauda curva, deriva, rotor traseiro
  p.push(P(taper([[0, 0.25, 0.95], [0, 0.32, 1.9], [0, 0.45, 2.85], [0, 0.55, 3.25]], [0.34, 0.2, 0.13, 0.11], 18, 16), C), P(slab([[0, 0], [0.5, 0], [0.75, 0.9], [0.35, 0.95]], 0.08, 0.035), Y, [0.04, 0.45, 3.0], [0, Math.PI / 2, 0]), P(slab([[0, -0.15], [0.55, -0.1], [0.55, 0.1], [0, 0.15]], 0.06, 0.02), C, [-0.55, 0.45, 3.0], [-Math.PI / 2, 0, 0]));
  p.push(P(cyl(0.07, 0.07, 0.16, 12), M, [0.18, 0.95, 3.15], [0, 0, Math.PI / 2]));
  for (let i = 0; i < 3; i++) p.push(P(box(0.03, 0.62, 0.08, 0.015), 0xdfe6f1, [0.26, 0.95, 3.15], [i * 1.05, 0, 0]));
  // mastro, cubo e esquis com suportes curvos
  p.push(P(lathe([[0.32, 0], [0.26, 0.18], [0.12, 0.3], [0.1, 0.45]], 24), D, [0, 0.82, 0]), P(cyl(0.18, 0.18, 0.14, 18), M, [0, 1.3, 0]));
  [-1, 1].forEach((s) => { p.push(P(taper([[s * 0.68, -1.0, -1.25], [s * 0.68, -1.02, 0.4], [s * 0.68, -0.98, 0.9], [s * 0.68, -0.85, 1.05]], [0.06, 0.06, 0.06, 0.05], 20, 10), M)); [-0.5, 0.45].forEach((z) => p.push(P(taper([[s * 0.68, -0.98, z], [s * 0.6, -0.75, z], [s * 0.45, -0.55, z]], [0.04, 0.04, 0.04], 10, 8), M))); });
  p.push(P(sph(0.09), 0xfff2a8, [0, -0.45, -1.32]), P(sph(0.06), 0xff3b3b, [0, 0.6, 3.3]));
  g.add(toMesh(p, { thin: true }));
  const rotor = toMesh([P(box(4.5, 0.05, 0.26, 0.025), 0xdfe6f1, [0, 1.4, 0]), P(box(0.26, 0.05, 4.5, 0.025), 0xdfe6f1, [0, 1.4, 0]), P(sph(0.1), Y, [2.25, 1.4, 0]), P(sph(0.1), Y, [-2.25, 1.4, 0]), P(sph(0.1), Y, [0, 1.4, 2.25]), P(sph(0.1), Y, [0, 1.4, -2.25])], { thin: true });
  rotor.rotation.y = 0.5; g.add(rotor);
  return g;
}
function heliMuito() {
  const g = new THREE.Group(), add = adder(g), C = paint(0x7a3fd0), D = paint(0x55279a), W = paint(0xf6f6f6), Y = paint(0xffcc22), M = std(0x3a404c, { metalness: 0.8, roughness: 0.3 }), CH = chrome();
  add(L(HELI_BODY, 64), C, [0, 0, 0], [Math.PI / 2, 0, 0], [1, 1, 0.92]);
  add(box(1.86, 0.12, 2.2, 0.05), W, [0, -0.15, 0.1]); add(box(1.88, 0.06, 2.0, 0.03), Y, [0, -0.32, 0.1]);
  const bubble = add(new THREE.SphereGeometry(0.66, 40, 28), glassM(), [0, 0.18, -0.82], [0, 0, 0], [1.05, 0.92, 1.0]); bubble.castShadow = false;
  add(new THREE.TorusGeometry(0.62, 0.04, 12, 48, Math.PI), D, [0, 0.18, -0.75], [0, Math.PI / 2, 0], [1, 1, 1.05]);
  // painel e assentos visíveis através do vidro
  add(box(0.9, 0.2, 0.2, 0.04), std(0x22252c), [0, -0.05, -1.05]); add(new THREE.SphereGeometry(0.03, 10, 8), std(0x40ff80, { emissive: 0x40ff80, emissiveIntensity: 2 }), [0.2, 0.06, -1.12]); add(new THREE.SphereGeometry(0.03, 10, 8), std(0xff5050, { emissive: 0xff5050, emissiveIntensity: 2 }), [-0.2, 0.06, -1.12]);
  [-0.3, 0.3].forEach((x) => add(box(0.35, 0.45, 0.15, 0.06), std(0x2b2f3a, { roughness: 0.8 }), [x, 0.05, -0.55]));
  [-1, 1].forEach((s) => { add(box(0.06, 0.62, 0.7, 0.04), D, [s * 0.86, 0.05, 0.25]); add(box(0.04, 0.36, 0.42, 0.04), glassM(), [s * 0.89, 0.2, 0.25]); add(box(0.05, 0.05, 0.22, 0.02), CH, [s * 0.9, -0.05, 0.05]); add(box(0.03, 0.3, 0.1, 0.01), paint(0xe02a22), [s * 0.9, 0.02, 0.75]); add(box(0.03, 0.1, 0.3, 0.01), paint(0xe02a22), [s * 0.9, 0.02, 0.75]); });
  add(taper([[0, 0.25, 0.95], [0, 0.32, 1.9], [0, 0.45, 2.85], [0, 0.55, 3.25]], [0.34, 0.2, 0.13, 0.11], 32, 24), C);
  add(slab([[0, 0], [0.5, 0], [0.75, 0.9], [0.35, 0.95]], 0.08, 0.035), Y, [0.04, 0.45, 3.0], [0, Math.PI / 2, 0]); add(slab([[0, -0.15], [0.55, -0.1], [0.55, 0.1], [0, 0.15]], 0.06, 0.02), C, [-0.55, 0.45, 3.0], [-Math.PI / 2, 0, 0]);
  add(cyl(0.07, 0.07, 0.16, 16), M, [0.18, 0.95, 3.15], [0, 0, Math.PI / 2]);
  // rotor traseiro e principal desfocados pelo giro (disco translúcido) + pás
  const blur = new THREE.MeshBasicMaterial({ color: 0xdfe6f1, transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide });
  const tb = add(new THREE.CircleGeometry(0.34, 32), blur, [0.27, 0.95, 3.15], [0, Math.PI / 2, 0]); tb.castShadow = false;
  add(L([[0.32, 0], [0.26, 0.18], [0.12, 0.3], [0.1, 0.45]], 32), D, [0, 0.82, 0]); add(cyl(0.18, 0.18, 0.14, 24), CH, [0, 1.3, 0]);
  const md = add(new THREE.CircleGeometry(2.3, 64), blur, [0, 1.42, 0], [-Math.PI / 2, 0, 0]); md.castShadow = false;
  [0.5, 0.5 + Math.PI / 2].forEach((a) => add(new THREE.BoxGeometry(4.5, 0.04, 0.24), std(0xc8ced8, { metalness: 0.6, roughness: 0.35 }), [0, 1.4, 0], [0, a, 0]));
  [-1, 1].forEach((s) => { add(taper([[s * 0.68, -1.0, -1.25], [s * 0.68, -1.02, 0.4], [s * 0.68, -0.98, 0.9], [s * 0.68, -0.85, 1.05]], [0.06, 0.06, 0.06, 0.05], 32, 12), CH); [-0.5, 0.45].forEach((z) => add(taper([[s * 0.68, -0.98, z], [s * 0.6, -0.75, z], [s * 0.45, -0.55, z]], [0.04, 0.04, 0.04], 12, 10), M)); });
  // farol e luzes de navegação com brilho e luz real
  add(new THREE.SphereGeometry(0.09, 16, 12), std(0xfff6d0, { emissive: 0xfff6d0, emissiveIntensity: 3 }), [0, -0.45, -1.32]); const hl = glow(0xfff2c0, 0.9); hl.position.set(0, -0.45, -1.4); g.add(hl);
  const sl = new THREE.SpotLight(0xfff2c0, 30, 12, 0.5, 0.6); sl.position.set(0, -0.45, -1.35); sl.target.position.set(0, -4, -3); g.add(sl, sl.target);
  [[0.92, 0x30ff60], [-0.92, 0xff3030]].forEach(([x, c]) => { add(new THREE.SphereGeometry(0.05, 12, 8), std(c, { emissive: c, emissiveIntensity: 3 }), [x, -0.15, -0.1]); const s = glow(c, 0.5); s.position.set(x, -0.15, -0.1); g.add(s); });
  add(new THREE.SphereGeometry(0.06, 12, 8), std(0xff3b3b, { emissive: 0xff3b3b, emissiveIntensity: 3 }), [0, 0.6, 3.3]);
  return g;
}

// =================================================================== TELHADO (caixa d'água, outdoor, antena, grade)
function roofAlta() {
  const g = new THREE.Group(), p = [];
  // caixa d'água sobre torre treliçada com escadinha
  p.push(P(cyl(1.0, 1.0, 1.8, 32), 0xdfe6f1, [0, 2.4, 0]));
  for (let i = 0; i < 5; i++) p.push(P(tor(1.01, 0.03, 6, 40), 0xb5bfcf, [0, 1.6 + i * 0.4, 0], [Math.PI / 2, 0, 0]));
  p.push(P(lathe([[1.1, 0], [0.95, 0.25], [0.5, 0.7], [0.08, 0.95], [0.0001, 1.0]], 32), 0xc2573a, [0, 3.3, 0]), P(sph(0.1), 0xffd23f, [0, 4.35, 0]));
  [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]].forEach(([x, z]) => p.push(P(box(0.1, 1.5, 0.1, 0.02), 0x59616e, [x, 0.75, z])));
  [0.4, 1.1].forEach((y) => { p.push(P(box(1.5, 0.05, 0.05, 0.01), 0x59616e, [0, y, -0.7]), P(box(1.5, 0.05, 0.05, 0.01), 0x59616e, [0, y, 0.7]), P(box(0.05, 0.05, 1.5, 0.01), 0x59616e, [-0.7, y, 0]), P(box(0.05, 0.05, 1.5, 0.01), 0x59616e, [0.7, y, 0])); });
  [-1, 1].forEach((s) => p.push(P(box(1.9, 0.05, 0.05, 0.01), 0x59616e, [0, 0.75, -0.7], [0, 0, s * 0.68])));
  p.push(P(box(0.04, 3.2, 0.04, 0.01), 0x8b94a6, [-0.15, 1.6, -1.02]), P(box(0.04, 3.2, 0.04, 0.01), 0x8b94a6, [0.15, 1.6, -1.02]));
  for (let i = 0; i < 10; i++) p.push(P(box(0.3, 0.03, 0.03, 0.01), 0x8b94a6, [0, 0.2 + i * 0.32, -1.02]));
  // outdoor com moldura, luzes e desenho de um cachorrinho/sol
  const bx = 3.6; p.push(P(box(0.18, 3.2, 0.18, 0.04), 0x59616e, [bx - 1.6, 1.6, 0.3]), P(box(0.18, 3.2, 0.18, 0.04), 0x59616e, [bx + 1.6, 1.6, 0.3]), P(box(4.0, 2.2, 0.2, 0.06), 0xffffff, [bx, 3.5, 0.2]), P(box(3.8, 2.0, 0.1, 0.04), 0x5cc8ff, [bx, 3.5, 0.08]));
  p.push(P(sph(0.45), 0xffd23f, [bx + 1.1, 3.95, 0.02], [0, 0, 0], [1, 1, 0.2]), P(box(3.8, 0.5, 0.06, 0.03), 0x5ccf6b, [bx, 2.72, 0.02]));
  p.push(P(slab([[-0.6, 0], [0.6, 0], [0.4, 0.5], [-0.3, 0.6]], 0.04, 0.01), 0xffffff, [bx - 0.8, 3.6, 0.01]), P(slab([[-0.4, 0], [0.5, 0], [0.3, 0.35], [-0.2, 0.4]], 0.04, 0.01), 0xffffff, [bx + 0.2, 3.95, 0.01]));
  for (let i = 0; i < 4; i++) p.push(P(lathe([[0.0001, 0], [0.12, 0.05], [0.14, 0.12], [0.0001, 0.14]], 14), 0x2f3a4f, [bx - 1.5 + i, 4.72, -0.2], [0.9, 0, 0]));
  p.push(P(box(4.2, 0.08, 0.6, 0.02), 0x59616e, [bx, 2.35, -0.1]));
  // antena com prato e grade de segurança
  p.push(P(cyl(0.05, 0.05, 2.5, 10), 0x8b94a6, [-2.4, 1.25, 0.8]), P(dome(0.5, 0, 1.2, 24, 10), 0xdfe6f1, [-2.4, 2.0, 0.5], [-1.2, 0, 0]), P(sph(0.07), 0xe8352f, [-2.4, 2.55, 0.8]));
  for (let i = 0; i < 13; i++) p.push(P(cyl(0.03, 0.03, 1.0, 8), 0xffd23f, [-3.2 + i * 0.6, 0.5, -2.2]));
  p.push(P(cap(0.045, 7.2, 4, 8), 0xffd23f, [0.4, 1.0, -2.2], [0, 0, Math.PI / 2]), P(cap(0.035, 7.2, 4, 8), 0xffd23f, [0.4, 0.55, -2.2], [0, 0, Math.PI / 2]));
  g.add(toMesh(p, { thin: true }));
  const bulbs = new THREE.Group(); for (let i = 0; i < 4; i++) { const s = glow(0xfff2c0, 0.6, 0.6); s.position.set(bx - 1.5 + i, 4.65, -0.3); bulbs.add(s); } g.add(bulbs);
  return g;
}
function roofMuito() {
  const g = new THREE.Group(), add = adder(g), metal = std(0x59616e, { metalness: 0.7, roughness: 0.4 }), yel = paint(0xffc61a);
  const tankM = std(0xffffff, { map: (() => { const c = document.createElement('canvas'); c.width = 128; c.height = 64; const x = c.getContext('2d'); x.fillStyle = '#e4e9f0'; x.fillRect(0, 0, 128, 64); for (let i = 0; i < 16; i++) { x.fillStyle = 'rgba(120,130,150,.25)'; x.fillRect(i * 8, 0, 2, 64); } for (let i = 0; i < 600; i++) { x.fillStyle = `rgba(140,100,60,${Math.random() * 0.08})`; x.fillRect(Math.random() * 128, Math.random() * 64, 2, 3); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.repeat.set(3, 1); return t; })(), metalness: 0.5, roughness: 0.45 });
  add(new THREE.CylinderGeometry(1.0, 1.0, 1.8, 48), tankM, [0, 2.4, 0]);
  for (let i = 0; i < 5; i++) add(new THREE.TorusGeometry(1.01, 0.03, 8, 64), metal, [0, 1.6 + i * 0.4, 0], [Math.PI / 2, 0, 0]);
  add(L([[1.1, 0], [0.95, 0.25], [0.5, 0.7], [0.08, 0.95], [0.0001, 1.0]], 48), paint(0xb8462c), [0, 3.3, 0]);
  [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]].forEach(([x, z]) => add(new THREE.BoxGeometry(0.1, 1.5, 0.1), metal, [x, 0.75, z]));
  [0.4, 1.1].forEach((y) => { add(new THREE.BoxGeometry(1.5, 0.05, 0.05), metal, [0, y, -0.7]); add(new THREE.BoxGeometry(1.5, 0.05, 0.05), metal, [0, y, 0.7]); add(new THREE.BoxGeometry(0.05, 0.05, 1.5), metal, [-0.7, y, 0]); add(new THREE.BoxGeometry(0.05, 0.05, 1.5), metal, [0.7, y, 0]); });
  [-1, 1].forEach((s) => add(new THREE.BoxGeometry(1.9, 0.05, 0.05), metal, [0, 0.75, -0.7], [0, 0, s * 0.68]));
  [-0.15, 0.15].forEach((x) => add(new THREE.BoxGeometry(0.04, 3.2, 0.04), metal, [x, 1.6, -1.02])); for (let i = 0; i < 10; i++) add(new THREE.BoxGeometry(0.3, 0.03, 0.03), metal, [0, 0.2 + i * 0.32, -1.02]);
  // outdoor com imagem desenhada (sol, nuvens, morros) e iluminação real
  const bx = 3.6, art = (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d'); const gr = x.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, '#3fa9ff'); gr.addColorStop(1, '#bfe8ff'); x.fillStyle = gr; x.fillRect(0, 0, 256, 128); x.fillStyle = '#ffd23f'; x.beginPath(); x.arc(200, 40, 22, 0, 6.28); x.fill(); x.fillStyle = '#fff'; [[60, 40, 18], [80, 36, 22], [100, 42, 16]].forEach(([a, b, r]) => { x.beginPath(); x.arc(a, b, r, 0, 6.28); x.fill(); }); x.fillStyle = '#4fc85f'; x.beginPath(); x.ellipse(70, 130, 110, 40, 0, 0, 6.28); x.fill(); x.fillStyle = '#3aae4f'; x.beginPath(); x.ellipse(200, 135, 100, 35, 0, 0, 6.28); x.fill(); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  [bx - 1.6, bx + 1.6].forEach((x) => add(new THREE.BoxGeometry(0.18, 3.2, 0.18), metal, [x, 1.6, 0.3]));
  add(new THREE.BoxGeometry(4.0, 2.2, 0.2), std(0xf2f2f2, { roughness: 0.4 }), [bx, 3.5, 0.2]); add(new THREE.PlaneGeometry(3.8, 2.0), std(0xffffff, { map: art, roughness: 0.5 }), [bx, 3.5, 0.09], [0, Math.PI, 0]);
  add(new THREE.BoxGeometry(4.2, 0.08, 0.6), metal, [bx, 2.35, -0.1]);
  for (let i = 0; i < 4; i++) { add(L([[0.0001, 0], [0.12, 0.05], [0.14, 0.12], [0.0001, 0.14]], 20), metal, [bx - 1.5 + i, 4.72, -0.2], [0.9, 0, 0]); const sp = new THREE.SpotLight(0xfff0c8, 8, 4, 0.7, 0.5); sp.position.set(bx - 1.5 + i, 4.65, -0.3); sp.target.position.set(bx - 1.5 + i, 3.0, 0.1); g.add(sp, sp.target); }
  add(new THREE.CylinderGeometry(0.05, 0.05, 2.5, 12), metal, [-2.4, 1.25, 0.8]); add(new THREE.SphereGeometry(0.5, 40, 16, 0, 6.28, 0, 1.2), std(0xf0f2f6, { metalness: 0.3, roughness: 0.3, side: THREE.DoubleSide }), [-2.4, 2.0, 0.5], [-1.2, 0, 0]);
  add(new THREE.SphereGeometry(0.07, 12, 8), std(0xff3030, { emissive: 0xff3030, emissiveIntensity: 3 }), [-2.4, 2.55, 0.8]);
  for (let i = 0; i < 13; i++) add(new THREE.CylinderGeometry(0.03, 0.03, 1.0, 10), yel, [-3.2 + i * 0.6, 0.5, -2.2]);
  add(cap(0.045, 7.2, 4, 10), yel, [0.4, 1.0, -2.2], [0, 0, Math.PI / 2]); add(cap(0.035, 7.2, 4, 10), yel, [0.4, 0.55, -2.2], [0, 0, Math.PI / 2]);
  return g;
}

// =================================================================== OBSTÁCULOS DO TELHADO (ar-condicionado, cano)
function obsAlta() {
  const g = new THREE.Group(), a = [];
  a.push(P(box(1.3, 0.85, 0.9, 0.1), 0xdfe6f1, [0, 0.47, 0]), P(box(1.4, 0.08, 1.0, 0.03), 0xb5bfcf, [0, 0.04, 0]));
  for (let i = 0; i < 9; i++) a.push(P(box(1.0, 0.035, 0.05, 0.01), 0x8b94a6, [-0.05, 0.2 + i * 0.065, -0.46], [0.4, 0, 0]));
  a.push(P(cyl(0.34, 0.34, 0.05, 28), 0x59616e, [0, 0.9, 0]), P(tor(0.34, 0.03, 6, 28), 0x3a404c, [0, 0.92, 0], [Math.PI / 2, 0, 0]));
  for (let i = 0; i < 4; i++) a.push(P(box(0.6, 0.02, 0.1, 0.01), 0xb5bfcf, [0, 0.95, 0], [0, i * Math.PI / 4, 0.25]));
  a.push(P(box(0.25, 0.12, 0.04, 0.02), 0x5ccf6b, [0.5, 0.75, -0.46]), P(taper([[0.65, 0.3, 0.2], [0.85, 0.3, 0.25], [0.95, 0.05, 0.3]], [0.035, 0.035, 0.035], 10, 8), 0x8b94a6));
  const m1 = toMesh(a, { thin: true }); m1.position.x = -1.3; g.add(m1);
  const c = [P(cyl(0.3, 0.3, 1.6, 28), 0x4db8ff, [0, 0.36, 0], [0, 0, Math.PI / 2])];
  [-0.82, 0.82].forEach((x) => { c.push(P(cyl(0.36, 0.36, 0.16, 28), 0x2f78e0, [x, 0.36, 0], [0, 0, Math.PI / 2])); for (let k = 0; k < 6; k++) { const an = k / 6 * 6.28; c.push(P(cyl(0.035, 0.035, 0.18, 6), 0x8b94a6, [x, 0.36 + Math.cos(an) * 0.3, Math.sin(an) * 0.3], [0, 0, Math.PI / 2])); } c.push(P(box(0.1, 0.36, 0.5, 0.03), 0x59616e, [x, 0.13, 0]), P(box(0.4, 0.06, 0.6, 0.02), 0x59616e, [x, 0.03, 0])); });
  c.push(P(cyl(0.1, 0.1, 0.25, 16), 0x2f78e0, [0, 0.72, 0]), P(cyl(0.18, 0.18, 0.05, 6), 0xe8352f, [0, 0.86, 0]), P(box(0.36, 0.04, 0.04, 0.02), 0xe8352f, [0, 0.9, 0]));
  c.push(P(box(0.8, 0.18, 0.02, 0.02), 0xffd23f, [0, 0.36, -0.305]));
  const m2 = toMesh(c, { thin: true }); m2.position.x = 1.3; g.add(m2);
  return g;
}
function obsMuito() {
  const g = new THREE.Group(), add = adder(g), white = std(0xe8ecf2, { metalness: 0.4, roughness: 0.35 }), metal = std(0x59616e, { metalness: 0.8, roughness: 0.3 });
  add(box(1.3, 0.85, 0.9, 0.1), white, [-1.3, 0.47, 0]); add(new THREE.BoxGeometry(1.4, 0.08, 1.0), metal, [-1.3, 0.04, 0]);
  for (let i = 0; i < 9; i++) add(new THREE.BoxGeometry(1.0, 0.035, 0.05), metal, [-1.35, 0.2 + i * 0.065, -0.46], [0.4, 0, 0]);
  add(new THREE.CylinderGeometry(0.34, 0.34, 0.05, 40), std(0x2a2e36, { metalness: 0.6, roughness: 0.4 }), [-1.3, 0.9, 0]);
  for (let i = 0; i < 4; i++) add(new THREE.BoxGeometry(0.6, 0.02, 0.1), chrome(), [-1.3, 0.94, 0], [0, i * Math.PI / 4, 0.25]);
  add(new THREE.SphereGeometry(0.03, 10, 8), std(0x40ff80, { emissive: 0x40ff80, emissiveIntensity: 3 }), [-0.8, 0.75, -0.46]);
  const pipe = paint(0x3aa8f0), flange = paint(0x2468d0);
  add(new THREE.CylinderGeometry(0.3, 0.3, 1.6, 40), pipe, [1.3, 0.36, 0], [0, 0, Math.PI / 2]);
  [-0.82, 0.82].forEach((x) => { add(new THREE.CylinderGeometry(0.36, 0.36, 0.16, 40), flange, [1.3 + x, 0.36, 0], [0, 0, Math.PI / 2]); for (let k = 0; k < 6; k++) { const an = k / 6 * 6.28; add(new THREE.CylinderGeometry(0.035, 0.035, 0.18, 6), chrome(), [1.3 + x, 0.36 + Math.cos(an) * 0.3, Math.sin(an) * 0.3], [0, 0, Math.PI / 2]); } add(new THREE.BoxGeometry(0.1, 0.36, 0.5), metal, [1.3 + x, 0.13, 0]); });
  add(new THREE.CylinderGeometry(0.1, 0.1, 0.25, 20), flange, [1.3, 0.72, 0]); add(new THREE.CylinderGeometry(0.18, 0.18, 0.05, 6), paint(0xe02a22), [1.3, 0.86, 0]);
  return g;
}

// =================================================================== PLATAFORMA ELEVADA + CESTA DE RESGATE
function platAlta() {
  const g = new THREE.Group(), p = [], w = 2.4, len = 3.0;
  p.push(P(box(w, 0.3, len, 0.12), 0x7b828c, [0, -0.15, 0]), P(box(w + 0.1, 0.08, len + 0.1, 0.04), 0xffd23f, [0, 0.0, 0]));
  for (let i = 0; i < 8; i++) p.push(P(box(0.18, 0.09, len + 0.12, 0.02), i % 2 ? 0xffd23f : 0x2b3350, [-w / 2 + 0.15 + i * (w - 0.3) / 7, 0.03, 0], [0, 0, 0], [1, 1, 0.08]));
  for (let i = 0; i < 10; i++) p.push(P(box(0.24, 0.1, 0.2, 0.02), i % 2 ? 0xffd23f : 0x2b3350, [-w / 2 + 0.12 + i * (w - 0.24) / 9, 0.05, -len / 2 + 0.12], [0, 0, 0.6]));
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { p.push(P(cyl(0.09, 0.09, 4, 14), 0x586380, [a * (w / 2 - 0.2), -2.1, b * (len / 2 - 0.2)])); });
  for (let k = 0; k < 3; k++) [-1, 1].forEach((b) => p.push(P(cyl(0.035, 0.035, Math.hypot(w - 0.4, 1.3), 8), 0x586380, [0, -0.7 - k * 1.3, b * (len / 2 - 0.2)], [0, 0, (k % 2 ? 1 : -1) * Math.atan2(1.3, w - 0.4) + Math.PI / 2])));
  // corrimão em três lados
  [-1, 1].forEach((s) => { p.push(P(cap(0.04, len - 0.2, 4, 8), 0xffd23f, [s * (w / 2 - 0.05), 0.9, 0], [Math.PI / 2, 0, 0])); for (let k = 0; k < 4; k++) p.push(P(cyl(0.035, 0.035, 0.9, 8), 0xffd23f, [s * (w / 2 - 0.05), 0.45, -len / 2 + 0.15 + k * (len - 0.3) / 3])); });
  p.push(P(cap(0.04, w - 0.1, 4, 8), 0xffd23f, [0, 0.9, len / 2 - 0.05], [0, 0, Math.PI / 2]));
  // cesta de resgate com cabos e gancho
  const bk = [P(lathe([[0.42, -0.22], [0.5, 0.22], [0.46, 0.24], [0.38, -0.18], [0.0001, -0.18]], 32), 0xff8a1f), P(tor(0.5, 0.05, 8, 32), 0xffd23f, [0, 0.22, 0], [Math.PI / 2, 0, 0])];
  for (let k = 0; k < 12; k++) { const a = k / 12 * 6.28; bk.push(P(cyl(0.015, 0.015, 0.44, 6), 0xffd23f, [Math.cos(a) * 0.46, 0.0, Math.sin(a) * 0.46])); }
  for (let k = 0; k < 3; k++) { const a = k / 3 * 6.28; bk.push(P(cyl(0.012, 0.012, 1.0, 6), 0xdfe6f1, [Math.cos(a) * 0.25, 0.68, Math.sin(a) * 0.25], [Math.sin(a) * 0.45, 0, -Math.cos(a) * 0.45])); }
  bk.push(P(tor(0.08, 0.025, 6, 16, 4.5), 0x59616e, [0, 1.22, 0]), P(cyl(0.02, 0.02, 1.6, 6), 0xdfe6f1, [0, 2.05, 0]), P(tor(0.4, 0.04, 8, 28), 0xffffff, [0, 0.0, 0], [Math.PI / 2, 0, 0]));
  p.forEach((q) => { q.p = [q.p[0] - 1.4, q.p[1] + 4, q.p[2]]; });
  g.add(toMesh(p, { thin: true }));
  const b = toMesh(bk, { thin: true }); b.position.set(1.9, 4.2, 0); g.add(b);
  return g;
}
function platMuito() {
  const g = new THREE.Group(), add = adder(g), w = 2.4, len = 3.0, X = -1.4, Y = 4;
  const plate = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); x.fillStyle = '#8b929c'; x.fillRect(0, 0, 128, 128); for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) { x.fillStyle = 'rgba(255,255,255,.25)'; x.save(); x.translate(i * 16 + 8, j * 16 + 8); x.rotate((i + j) % 2 ? 0.7 : -0.7); x.fillRect(-5, -1.5, 10, 3); x.restore(); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 4); return t; })();
  const plateM = std(0xffffff, { map: plate, bumpMap: plate, bumpScale: 2, metalness: 0.8, roughness: 0.35 }), yel = paint(0xffc61a), steel = std(0x586380, { metalness: 0.8, roughness: 0.35 });
  add(new THREE.BoxGeometry(w, 0.3, len), plateM, [X, Y - 0.15, 0]);
  const hz = std(0xffffff, { map: TEX.stripes('#ffc61a', '#1e2230', 10), roughness: 0.5 }); hz.map.rotation = 0.6; add(new THREE.BoxGeometry(w + 0.1, 0.08, 0.3), hz, [X, Y + 0.02, -len / 2 + 0.1]);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => add(new THREE.CylinderGeometry(0.09, 0.09, 4, 20), steel, [X + a * (w / 2 - 0.2), Y - 2.1, b * (len / 2 - 0.2)]));
  [-1, 1].forEach((s) => { add(cap(0.04, len - 0.2, 4, 10), yel, [X + s * (w / 2 - 0.05), Y + 0.9, 0], [Math.PI / 2, 0, 0]); for (let k = 0; k < 4; k++) add(new THREE.CylinderGeometry(0.035, 0.035, 0.9, 10), yel, [X + s * (w / 2 - 0.05), Y + 0.45, -len / 2 + 0.15 + k * (len - 0.3) / 3]); });
  add(cap(0.04, w - 0.1, 4, 10), yel, [X, Y + 0.9, len / 2 - 0.05], [0, 0, Math.PI / 2]);
  // cesta: rede de cabos (tubos) sobre aro, laranja de resgate
  const bx = 1.9, by = 4.2, orange = paint(0xff7a12);
  add(L([[0.42, -0.22], [0.48, 0.12], [0.44, 0.14], [0.38, -0.18], [0.0001, -0.18]], 48), orange, [bx, by, 0]);
  for (let k = 0; k < 16; k++) { const a = k / 16 * 6.28; add(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 6), std(0xffffff, { roughness: 0.8 }), [bx + Math.cos(a) * 0.49, by + 0.25, Math.sin(a) * 0.49]); }
  add(new THREE.TorusGeometry(0.5, 0.04, 12, 48), yel, [bx, by + 0.38, 0], [Math.PI / 2, 0, 0]);
  for (let k = 0; k < 3; k++) { const a = k / 3 * 6.28; add(new THREE.CylinderGeometry(0.012, 0.012, 1.05, 6), steel, [bx + Math.cos(a) * 0.25, by + 0.82, Math.sin(a) * 0.25], [Math.sin(a) * 0.42, 0, -Math.cos(a) * 0.42]); }
  add(new THREE.TorusGeometry(0.08, 0.025, 10, 20, 4.5), chrome(), [bx, by + 1.35, 0]); add(new THREE.CylinderGeometry(0.02, 0.02, 1.6, 8), std(0xdfe6f1, { roughness: 0.8 }), [bx, by + 2.2, 0]);
  return g;
}

export const HQ4 = {
  heli: { alta: heliAlta, muito: heliMuito },
  roof: { alta: roofAlta, muito: roofMuito },
  obs4: { alta: obsAlta, muito: obsMuito },
  plat: { alta: platAlta, muito: platMuito },
};
