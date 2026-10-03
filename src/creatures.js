// Criaturas e veículos originais, desenhados por código (rosto/cores/uniformes próprios).
// Todos voltados para a DIREITA, origem = pés no chão. Use scaleX = -1 para virar.
import { og } from './outline.js';

const shade = (c, f) => {
  const r = Math.min(255, ((c >> 16) & 255) * f), g = Math.min(255, ((c >> 8) & 255) * f), b = Math.min(255, (c & 255) * f);
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b);
};

// ------------------------------------------------------------------ cães de resgate
export const DOGS = {
  bolota: { name: 'Bolota', role: 'bombeiro', coat: 0xd9944a, patch: 0x7a4a22, belly: 0xfff3dc, gear: 0xff8a1f, hat: 'fire', ears: 'floppy', say: 'Au au!' },
  trovao: { name: 'Trovão', role: 'guarda-florestal', coat: 0x4a3a2a, patch: 0xc98b3f, belly: 0xc98b3f, gear: 0x3f8f4a, hat: 'ranger', ears: 'pointy', say: 'Au!' },
  pipoca: { name: 'Pipoca', role: 'piloto', coat: 0xffffff, patch: 0x222222, belly: 0xffffff, gear: 0x8a4fd9, hat: 'aviator', ears: 'floppyspot', say: 'Au au au!' },
};

export function buildDog(scene, key, scale = 1) {
  const d = DOGS[key] || DOGS.bolota;
  const c = scene.add.container(0, 0);
  const g = () => og(scene);
  const leg = (x, front) => { const l = g(); l.x = x; l.y = -30; l.fillStyle(d.coat, 1); l.fillRoundedRect(-6, 0, 12, 28, 5); l.fillStyle(front ? d.belly : shade(d.coat, 0.85), 1); l.fillRoundedRect(-7, 22, 17, 9, 4); return l; };
  const legs = [leg(-24, false), leg(-10, false), leg(14, true), leg(28, true)];
  const tail = g(); tail.x = -32; tail.y = -46; tail.fillStyle(d.coat, 1); tail.fillEllipse(-10, -8, 30, 11); tail.fillStyle(d.belly, 1); tail.fillCircle(-22, -12, 6);
  const body = g();
  body.fillStyle(d.coat, 1); body.fillEllipse(0, -42, 76, 40);
  if (d.coat === 0xffffff) { body.fillStyle(0x222222, 1); [[-18, -48, 6], [4, -38, 5], [14, -52, 5], [-6, -34, 4], [-26, -38, 4]].forEach(([x, y, r]) => body.fillCircle(x, y, r)); }
  else { body.fillStyle(d.patch, 1); body.fillEllipse(-4, -52, 56, 20); }
  body.fillStyle(d.belly, 1); body.fillEllipse(8, -30, 40, 14);
  body.fillStyle(d.gear, 1); body.fillRoundedRect(-14, -62, 30, 36, 8); body.fillStyle(0xffd23f, 1); body.fillCircle(1, -46, 6);
  body.fillStyle(0xffffff, 1); body.fillCircle(1, -45, 2.4);
  const head = g(); head.x = 38; head.y = -66;
  head.fillStyle(d.coat, 1); head.fillCircle(0, 0, 23);
  if (d.coat === 0xffffff) { head.fillStyle(0x222222, 1); head.fillCircle(-9, -12, 5); head.fillCircle(10, 6, 3.5); }
  else { head.fillStyle(d.patch, 1); head.fillEllipse(-4, -8, 36, 20); }
  head.fillStyle(d.belly, 1); head.fillEllipse(17, 8, 30, 20);
  head.fillStyle(0x222222, 1); head.fillCircle(30, 2, 5.5);
  head.fillStyle(0xffffff, 1); head.fillCircle(8, -6, 6.5); head.fillStyle(0x222222, 1); head.fillCircle(10, -5, 3.6); head.fillStyle(0xffffff, 1); head.fillCircle(11.2, -6.4, 1.3);
  head.lineStyle(2.5, 0x222222, 1); head.beginPath(); head.arc(22, 8, 8, 0.3, 2.4); head.strokePath();
  head.fillStyle(0xff7d8a, 1); head.fillEllipse(24, 14, 10, 7);
  const ear = g(); ear.x = 38; ear.y = -66;
  if (d.ears === 'pointy') { ear.fillStyle(d.coat, 1); ear.fillTriangle(-16, -12, -2, -42, 8, -14); ear.fillStyle(d.patch, 1); ear.fillTriangle(-12, -14, -3, -34, 3, -15); }
  else { ear.fillStyle(d.ears === 'floppyspot' ? 0x222222 : d.patch, 1); ear.fillEllipse(-14, 4, 16, 34); }
  const hat = g(); hat.x = 38; hat.y = -66;
  if (d.hat === 'fire') { hat.fillStyle(0xff8a1f, 1); hat.slice(-2, -14, 24, Math.PI, 0, false); hat.fillPath(); hat.fillRoundedRect(-28, -16, 52, 7, 3); hat.fillStyle(0xffd23f, 1); hat.fillCircle(-2, -26, 5); }
  if (d.hat === 'ranger') { hat.fillStyle(0x3f8f4a, 1); hat.fillEllipse(-2, -18, 56, 11); hat.slice(-2, -18, 17, Math.PI, 0, false); hat.fillPath(); hat.fillStyle(0xffd23f, 1); hat.fillRect(-18, -22, 32, 3.5); }
  if (d.hat === 'aviator') { hat.fillStyle(0x8a4fd9, 1); hat.slice(-2, -12, 24, Math.PI, 0, false); hat.fillPath(); hat.fillStyle(0x2b2b2b, 1); hat.fillRoundedRect(-14, -24, 28, 10, 5); hat.fillStyle(0x4db8ff, 1); hat.fillRoundedRect(-11, -22, 22, 6, 3); }
  c.add([tail, legs[0], legs[1], body, legs[2], legs[3], ear, head, hat]);
  c.dog = { legs, tail, head, hat, ear, body, key, d };
  c.setScale(scale);
  return c;
}
export function poseDog(c, state, phase, t) {
  const { legs, tail, head, hat, ear, body } = c.dog;
  if (state === 'run') {
    const s = Math.sin(phase);
    legs[0].rotation = s * 0.9; legs[1].rotation = -s * 0.9; legs[2].rotation = -s * 0.9; legs[3].rotation = s * 0.9;
    body.y = Math.abs(Math.cos(phase)) * -3; tail.rotation = Math.sin(t * 16) * 0.35;
  } else if (state === 'jump') {
    legs[0].rotation = 0.7; legs[1].rotation = 0.5; legs[2].rotation = -0.8; legs[3].rotation = -0.6; body.y = 0; tail.rotation = -0.2;
  } else { legs.forEach((l) => { l.rotation = 0; }); body.y = 0; tail.rotation = Math.sin(t * 18) * 0.5; }
  head.y = -66 + body.y; ear.y = head.y; hat.y = head.y;
}

// ------------------------------------------------------------------ dinossauros (interpretação infantil própria)
export const DINOS = {
  trex: { name: 'Tiranossauro', say: 'Tiranossauro!' },
  tricera: { name: 'Tricerátopo', say: 'Tricerátopo!' },
  stego: { name: 'Estegossauro', say: 'Estegossauro!' },
  brachio: { name: 'Dinossauro de pescoço longo', say: 'Pescoço longo!' },
  baby: { name: 'Filhote', say: 'Filhote!' },
};

export function buildDino(scene, species) {
  const g = og(scene);
  const eye = (x, y, r = 7) => { g.fillStyle(0xffffff, 1); g.fillCircle(x, y, r); g.fillStyle(0x222222, 1); g.fillCircle(x + r * 0.25, y, r * 0.55); g.fillStyle(0xffffff, 1); g.fillCircle(x + r * 0.4, y - r * 0.25, r * 0.22); };
  const legs4 = (col, h, xs) => { xs.forEach((x, i) => { g.fillStyle(i % 2 ? shade(col, 0.82) : col, 1); g.fillRoundedRect(x - 14, -h, 28, h, 10); g.fillStyle(0xf1e6b3, 1); g.fillRoundedRect(x - 16, -9, 34, 10, 5); }); };
  if (species === 'trex') {
    const col = 0x5fb54a;
    g.fillStyle(col, 1); g.fillTriangle(-60, -120, -190, -58, -50, -62);
    g.fillStyle(shade(col, 0.82), 1); g.fillRoundedRect(-8, -86, 34, 86, 12); g.fillRoundedRect(-30, -78, 34, 78, 12);
    g.fillStyle(0xf1e6b3, 1); g.fillRoundedRect(-36, -9, 46, 10, 5); g.fillRoundedRect(-6, -9, 46, 10, 5);
    g.fillStyle(col, 1); g.fillEllipse(0, -100, 150, 96);
    g.fillStyle(0xe9f2b8, 1); g.fillEllipse(14, -84, 90, 56);
    g.fillStyle(col, 1); g.fillTriangle(40, -128, 70, -112, 62, -92); g.fillRoundedRect(50, -112, 24, 10, 5);
    g.fillStyle(shade(col, 0.8), 1); g.fillRoundedRect(72, -102, 16, 7, 3); g.fillRoundedRect(76, -92, 12, 7, 3);
    g.fillStyle(col, 1); g.fillEllipse(86, -150, 104, 66); g.fillStyle(0xe9f2b8, 1); g.fillEllipse(96, -134, 82, 28);
    g.fillStyle(0xffffff, 1); for (let x = 64; x < 130; x += 12) g.fillTriangle(x, -138, x + 8, -138, x + 4, -127);
    g.fillStyle(0x2d6f2a, 1); g.fillCircle(124, -160, 3.5); eye(90, -163, 8.5);
    g.fillStyle(0xff8a1f, 1); [-30, -10, 10, 30].forEach((x) => g.fillTriangle(x - 6, -141, x + 6, -141, x, -153));
  } else if (species === 'tricera') {
    const col = 0x4a9ad8;
    g.fillStyle(col, 1); g.fillTriangle(-70, -92, -150, -40, -56, -54);
    legs4(col, 52, [-48, -20, 28, 56]);
    g.fillStyle(col, 1); g.fillEllipse(0, -84, 150, 80);
    g.fillStyle(0xdbeeff, 1); g.fillEllipse(8, -66, 100, 36);
    g.fillStyle(0xff8a1f, 1); g.fillCircle(78, -112, 54); g.fillStyle(0xffd23f, 1); for (let a = -2.6; a < 0.3; a += 0.42) g.fillCircle(78 + Math.cos(a) * 44, -112 + Math.sin(a) * 44, 6.5);
    g.fillStyle(col, 1); g.fillEllipse(96, -96, 70, 52);
    g.fillStyle(0xfff3dc, 1); g.fillTriangle(86, -126, 100, -164, 108, -124); g.fillTriangle(106, -122, 128, -158, 124, -118); g.fillTriangle(124, -96, 148, -92, 124, -84);
    g.fillStyle(0xf1e6b3, 1); g.fillTriangle(120, -92, 140, -84, 118, -78);
    eye(108, -104, 8);
  } else if (species === 'stego') {
    const col = 0x3fb6a8;
    g.fillStyle(col, 1); g.fillTriangle(-70, -90, -165, -46, -56, -52);
    g.fillStyle(0xffd23f, 1); [[-130, -62], [-108, -58], [-150, -52]].forEach(([x, y]) => g.fillTriangle(x - 5, y, x + 5, y, x + 8, y - 26));
    legs4(col, 50, [-56, -26, 26, 56]);
    g.fillStyle(col, 1); g.fillEllipse(0, -86, 160, 82);
    g.fillStyle(0xe4fbf6, 1); g.fillEllipse(8, -68, 100, 32);
    g.fillStyle(0xff8a1f, 1); [-60, -34, -8, 18, 44].forEach((x, i) => { const h = 50 + (i === 2 ? 18 : 0) - Math.abs(i - 2) * 6; g.fillTriangle(x - 18, -118 + Math.abs(i - 2) * 6, x + 18, -118 + Math.abs(i - 2) * 6, x, -118 - h); });
    g.fillStyle(col, 1); g.fillEllipse(86, -66, 56, 38); g.fillRoundedRect(60, -90, 28, 30, 12);
    eye(98, -72, 6.5);
  } else if (species === 'brachio') {
    const col = 0x7dc86a;
    g.fillStyle(col, 1); g.fillTriangle(-66, -86, -190, -30, -56, -52);
    legs4(col, 62, [-48, -18, 30, 58]);
    g.fillStyle(col, 1); g.fillEllipse(0, -90, 150, 76);
    g.fillStyle(0xeaf8d9, 1); g.fillEllipse(8, -70, 100, 34);
    g.fillStyle(col, 1); g.fillTriangle(40, -110, 76, -118, 118, -250); g.fillTriangle(40, -110, 118, -250, 92, -258); g.fillTriangle(40, -90, 72, -96, 52, -130);
    g.fillEllipse(112, -262, 62, 38); g.fillStyle(0xeaf8d9, 1); g.fillEllipse(122, -254, 40, 16);
    g.fillStyle(0x3f9a30, 1); [-40, -20, 0, 20].forEach((x) => g.fillCircle(x, -126, 6));
    eye(118, -268, 7.5);
  } else if (species === 'baby') {
    const col = 0x9be564;
    g.fillStyle(col, 1); g.fillTriangle(-24, -34, -58, -14, -20, -18);
    g.fillStyle(shade(col, 0.82), 1); g.fillRoundedRect(-14, -18, 14, 18, 6); g.fillRoundedRect(8, -18, 14, 18, 6);
    g.fillStyle(col, 1); g.fillEllipse(0, -34, 62, 52);
    g.fillStyle(0xf4fbd6, 1); g.fillEllipse(6, -26, 36, 26);
    g.fillStyle(col, 1); g.fillCircle(22, -62, 26);
    g.fillStyle(0xffffff, 1); g.fillTriangle(-2, -76, 8, -92, 14, -78); g.fillTriangle(10, -80, 24, -96, 30, -80); g.fillTriangle(24, -82, 38, -94, 44, -78); g.fillRect(-2, -80, 46, 6);
    eye(30, -64, 9.5); g.fillStyle(0xff8a80, 0.7); g.fillCircle(38, -52, 5);
    g.lineStyle(2.5, 0x2d6f2a, 1); g.beginPath(); g.arc(34, -52, 7, 0.3, 2.3); g.strokePath();
  }
  return g;
}

export function buildPtero(scene) {
  const c = scene.add.container(0, 0);
  const g = og(scene);
  g.fillStyle(0xb18cff, 1); g.fillTriangle(-70, 0, 70, 0, 0, -48);               // asa de cima (simplificada)
  g.fillStyle(0x8a62e0, 1); g.fillTriangle(-70, 0, 0, 0, -30, 30); g.fillTriangle(70, 0, 0, 0, 30, 30);
  g.fillStyle(0xd6c0ff, 1); g.fillEllipse(0, 4, 54, 28);
  g.fillStyle(0xd6c0ff, 1); g.fillEllipse(-46, 2, 40, 16);
  g.fillStyle(0xff8a1f, 1); g.fillTriangle(-70, -8, -40, -8, -62, -26);           // crista
  g.fillStyle(0xffd23f, 1); g.fillTriangle(-70, 0, -112, 8, -70, 12);            // bico
  g.fillStyle(0xffffff, 1); g.fillCircle(-56, -2, 6); g.fillStyle(0x222222, 1); g.fillCircle(-58, -2, 3);
  c.add(g); c.wing = g;
  return c;
}

export function buildEgg(scene) {
  const g = og(scene);
  g.fillStyle(0xfff3dc, 1); g.fillEllipse(0, -28, 40, 52);
  g.fillStyle(0x7fcb8c, 1); g.fillCircle(-7, -36, 5); g.fillCircle(8, -24, 6); g.fillCircle(-3, -14, 4);
  return g;
}
export function buildNest(scene) {
  const g = og(scene);
  g.fillStyle(0x8a5a35, 1); g.fillEllipse(0, -10, 130, 36); g.fillStyle(0xc2864a, 1); g.fillEllipse(0, -16, 112, 26);
  g.lineStyle(3, 0x6e4527, 1); for (let i = -50; i <= 50; i += 14) g.lineBetween(i, -22, i + 10, -6);
  return g;
}

// ------------------------------------------------------------------ animais e objetos de resgate
export function buildCat(scene) {
  const g = og(scene);
  g.fillStyle(0xff9a3c, 1); g.fillEllipse(0, -26, 54, 46); g.fillStyle(0xfff0d6, 1); g.fillEllipse(6, -18, 28, 24);
  g.fillStyle(0xff9a3c, 1); g.fillCircle(8, -56, 22); g.fillTriangle(-8, -70, 0, -88, 10, -70); g.fillTriangle(10, -70, 20, -88, 28, -68);
  g.fillStyle(0xcc6a1c, 1); g.fillRect(2, -76, 3, 10); g.fillRect(10, -76, 3, 10);
  g.fillStyle(0xffffff, 1); g.fillCircle(2, -56, 6); g.fillCircle(17, -56, 6); g.fillStyle(0x222222, 1); g.fillCircle(3, -56, 3); g.fillCircle(18, -56, 3);
  g.fillStyle(0xff7d8a, 1); g.fillTriangle(8, -48, 14, -48, 11, -44);
  g.lineStyle(3, 0xff9a3c, 1); g.beginPath(); g.arc(-30, -30, 20, -2.2, 1.2); g.strokePath();
  return g;
}
export function buildBunny(scene) {
  const g = og(scene);
  g.fillStyle(0xf4f1ea, 1); g.fillEllipse(0, -24, 50, 42); g.fillCircle(-26, -22, 9);
  g.fillCircle(14, -50, 19); g.fillEllipse(6, -86, 12, 40); g.fillEllipse(20, -84, 12, 40);
  g.fillStyle(0xffb3c1, 1); g.fillEllipse(6, -86, 6, 28); g.fillEllipse(20, -84, 6, 28);
  g.fillStyle(0x222222, 1); g.fillCircle(20, -52, 3.5); g.fillStyle(0xff7d8a, 1); g.fillCircle(30, -46, 3);
  return g;
}
export function buildCrates(scene, n = 3) {
  const g = og(scene);
  for (let i = 0; i < n; i++) {
    const x = (i % 2) * 8 - 4, y = -i * 40;
    g.fillStyle(0xc99a5b, 1); g.fillRoundedRect(x - 36, y - 40, 72, 40, 4); g.lineStyle(4, 0x8a5a35, 1); g.strokeRoundedRect(x - 36, y - 40, 72, 40, 4);
    g.lineBetween(x - 36, y - 40, x + 36, y); g.lineBetween(x + 36, y - 40, x - 36, y);
  }
  return g;
}
export function buildShelter(scene) {
  const g = og(scene);
  g.fillStyle(0x3ecb6b, 1); g.fillRoundedRect(-52, -120, 104, 120, 10); g.fillStyle(0xffffff, 1); g.fillRect(-8, -102, 16, 66); g.fillRect(-33, -77, 66, 16);
  g.fillStyle(0x2d9a52, 1); g.fillRect(-52, -128, 104, 10);
  return g;
}
export function buildBasketRig(scene) { // cesta de resgate presa a uma corda
  const g = og(scene);
  g.lineStyle(5, 0x555555, 1); g.lineBetween(-22, -10, -14, -60); g.lineBetween(22, -10, 14, -60);
  g.fillStyle(0xff8a1f, 1); g.fillRoundedRect(-30, -10, 60, 34, 8); g.fillStyle(0xffd23f, 1); g.fillRect(-30, 0, 60, 6);
  return g;
}

// ------------------------------------------------------------------ veículos originais
export function buildFireTruck(scene) {
  const c = scene.add.container(0, 0);
  const g = og(scene);
  g.fillStyle(0x000000, 0.2); g.fillEllipse(0, 4, 210, 16);
  g.fillStyle(0xe53935, 1); g.fillRoundedRect(-104, -78, 150, 62, 10);                 // carroceria
  g.fillStyle(0xc62828, 1); g.fillRoundedRect(36, -92, 64, 76, 12);                    // cabine
  g.fillStyle(0x9fdcff, 1); g.fillRoundedRect(58, -84, 36, 34, 6);                     // vidro
  g.fillStyle(0xffd23f, 1); g.fillRect(-104, -50, 150, 7); g.fillRect(-104, -38, 150, 4);
  g.fillStyle(0xdfe3ea, 1); g.fillRoundedRect(-96, -98, 120, 10, 4); g.lineStyle(3, 0x9aa0a8, 1); for (let x = -90; x < 22; x += 14) g.lineBetween(x, -98, x, -88); // escada
  g.fillStyle(0x6c757d, 1); g.fillRoundedRect(-104, -26, 204, 12, 4);
  g.fillStyle(0xffd23f, 1); g.fillCircle(-62, -62, 10); g.fillStyle(0xe53935, 1); g.fillCircle(-62, -62, 4.5);   // símbolo fictício da equipe
  g.fillStyle(0x222222, 1); g.fillCircle(-62, -8, 19); g.fillCircle(66, -8, 19); g.fillStyle(0xbdbdbd, 1); g.fillCircle(-62, -8, 9); g.fillCircle(66, -8, 9);
  const light = og(scene); light.fillStyle(0x4db8ff, 1); light.fillRoundedRect(46, -104, 22, 12, 4); light.fillStyle(0xff3b3b, 1); light.fillRoundedRect(70, -104, 22, 12, 4);
  c.add([g, light]); c.light = light;
  return c;
}
export function buildHeli(scene) {
  const c = scene.add.container(0, 0);
  const g = og(scene);
  g.fillStyle(0x8a4fd9, 1); g.fillEllipse(0, 0, 130, 70); g.fillRoundedRect(-150, -12, 110, 18, 8); g.fillTriangle(-150, -12, -170, -44, -134, -12);
  g.fillStyle(0x9fdcff, 1); g.fillEllipse(26, -8, 56, 38);
  g.fillStyle(0xffd23f, 1); g.fillRect(-30, 10, 60, 6);
  g.lineStyle(5, 0x444444, 1); g.lineBetween(-40, 42, 52, 42); g.lineBetween(-20, 30, -24, 42); g.lineBetween(30, 30, 34, 42);
  const rotor = og(scene); rotor.fillStyle(0x333333, 1); rotor.fillRoundedRect(-110, -46, 220, 8, 4); rotor.fillRect(-3, -40, 6, 12);
  c.add([g, rotor]); c.rotor = rotor;
  return c;
}
