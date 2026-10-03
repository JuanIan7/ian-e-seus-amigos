// Personagem infantil personalizável (origem = pés, voltado para a direita).
// Tudo desenhado por código: tons de pele, rostos, 8 penteados, cores e 10 roupas.
import { load, DEFAULT_LOOK } from './save.js';
import { og } from './outline.js';

export const SKINS = [0xffe0c2, 0xf5c9a0, 0xe0a370, 0xc68642, 0x9a6233, 0x6e4426, 0x4a2c17];
export const HAIR_COLORS = [0x1a1410, 0x4a2c17, 0x8a5a35, 0xe6c04c, 0xb5502a, 0x9aa0a8, 0x3f7fd9, 0xff7eb6];
export const EYE_COLORS = [0x3a2a1a, 0x15110d, 0x2f6fd0, 0x3f9b5a, 0xb8860b, 0x7a8794];
export const FACES = ['Redondo', 'Oval', 'Quadrado'];
export const HAIR_STYLES = ['Curto liso', 'Longo liso', 'Ondulado', 'Cacheado', 'Crespo', 'Rabo de cavalo', 'Trança', 'Coquinhos'];
export const OUTFITS = [
  { id: 'bombeiro', name: 'Bombeiro' },
  { id: 'equipe', name: 'Equipe de resgate' },
  { id: 'dino', name: 'Dinossauro' },
  { id: 'explorador', name: 'Explorador' },
  { id: 'piloto', name: 'Piloto de resgate' },
  { id: 'guarda', name: 'Guarda-florestal' },
  { id: 'astronauta', name: 'Astronauta' },
  { id: 'heroi', name: 'Super-herói' },
  { id: 'esporte', name: 'Esportivo' },
  { id: 'casual', name: 'Casual' },
];

const shade = (c, f) => {
  const r = Math.min(255, ((c >> 16) & 255) * f), g = Math.min(255, ((c >> 8) & 255) * f), b = Math.min(255, (c & 255) * f);
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b);
};

// Parâmetros de cada roupa: calça/manga/sapato e acessórios
const O = {
  bombeiro:   { top: 0xe53935, pants: 0x1f3b73, shoes: 0x2b2b2b, sleeve: 0xe53935, head: 'helmet' },
  equipe:     { top: 0xf6ead0, pants: 0x1b5e6e, shoes: 0xffffff, sleeve: 0x1fa8a0, head: 'dogcap' },
  dino:       { top: 0x58b947, pants: 0x58b947, shoes: 0x7ed56f, sleeve: 0x58b947, head: 'dino', tail: true },
  explorador: { top: 0xf3ead2, pants: 0x9a8450, shoes: 0x6b4a2b, sleeve: 0xf3ead2, head: 'safari', pack: 0x8a5a35 },
  piloto:     { top: 0x2f6fd0, pants: 0x2f6fd0, shoes: 0xffffff, sleeve: 0x2f6fd0, glove: 0xffffff, head: 'pilot' },
  guarda:     { top: 0x5b7d3a, pants: 0x6b4e2e, shoes: 0x3b2a1a, sleeve: 0x5b7d3a, head: 'ranger' },
  astronauta: { top: 0xf2f4f8, pants: 0xf2f4f8, shoes: 0x9aa0a8, sleeve: 0xf2f4f8, glove: 0xffffff, head: 'astro', pack: 0xdfe3ea },
  heroi:      { top: 0x7b3fd0, pants: 0x7b3fd0, shoes: 0xe0408a, sleeve: 0x7b3fd0, glove: 0xe0408a, head: 'mask', cape: 0xe0408a },
  esporte:    { top: 0x3aa0e8, pants: 0x1f3b73, shoes: 0xffffff, sleeve: 0x3aa0e8, head: 'headband' },
  casual:     { top: 0xffd23f, pants: 0x4a78b8, shoes: 0xe53935, sleeve: 0xffd23f, short: true, shortSleeve: true, head: 'cap' },
};

function drawTorso(g, id, o) {
  g.fillStyle(o.top, 1); g.fillRoundedRect(-22, -86, 44, 52, 12);
  switch (id) {
    case 'bombeiro':
      g.fillStyle(0xffd23f, 1); g.fillRect(-22, -62, 44, 8); g.fillRect(-22, -48, 44, 5);
      g.fillStyle(0xffd23f, 1); g.fillCircle(-9, -76, 5);
      g.fillStyle(0x1f3b73, 1); g.fillRect(-22, -38, 44, 6); break;
    case 'equipe':
      g.fillStyle(0x1fa8a0, 1); g.fillRoundedRect(-22, -86, 15, 52, 8); g.fillRoundedRect(7, -86, 15, 52, 8);
      g.fillStyle(0xff8a1f, 1); g.fillCircle(0, -66, 10);
      g.fillStyle(0xffffff, 1); g.fillCircle(0, -64, 4.2); [[-5, -71], [0, -73], [5, -71]].forEach(([x, y]) => g.fillCircle(x, y, 2.1));
      g.fillStyle(0x1b5e6e, 1); g.fillRect(-22, -38, 44, 6); break;
    case 'dino':
      g.fillStyle(0xf1e6b3, 1); g.fillEllipse(0, -58, 26, 38);
      g.fillStyle(0x3f9a30, 1); g.fillRect(-22, -38, 44, 6); break;
    case 'explorador':
      g.fillStyle(0xc2a15a, 1); g.fillRoundedRect(-22, -86, 14, 52, 7); g.fillRoundedRect(8, -86, 14, 52, 7);
      g.fillStyle(0xa8863f, 1); g.fillRect(-20, -60, 10, 9); g.fillRect(10, -60, 10, 9);
      g.fillStyle(0x6b4a2b, 1); g.fillRect(-22, -38, 44, 6); g.fillStyle(0xffd23f, 1); g.fillRect(-4, -38, 8, 6); break;
    case 'piloto':
      g.fillStyle(0xff8a1f, 1); g.fillRect(-22, -64, 44, 7); g.fillStyle(0xffffff, 1); g.fillTriangle(-12, -80, -2, -80, -7, -70);
      g.fillStyle(0x1f4a9a, 1); g.fillRect(-22, -38, 44, 6); break;
    case 'guarda':
      g.fillStyle(0x8a5a35, 1); g.fillRect(-14, -86, 7, 52); g.fillRect(7, -86, 7, 52);
      g.fillStyle(0xffd23f, 1); g.fillTriangle(-9, -86, 9, -86, 0, -70);
      g.fillStyle(0x3b2a1a, 1); g.fillRect(-22, -38, 44, 6); break;
    case 'astronauta':
      g.fillStyle(0x4db8ff, 1); g.fillRoundedRect(-11, -76, 22, 16, 4);
      g.fillStyle(0xe53935, 1); g.fillCircle(-5, -68, 3); g.fillStyle(0x3ecb6b, 1); g.fillCircle(3, -68, 3);
      g.fillStyle(0xff8a1f, 1); g.fillRect(-22, -48, 44, 5); g.fillStyle(0x9aa0a8, 1); g.fillRect(-22, -38, 44, 6); break;
    case 'heroi':
      g.fillStyle(0xffd23f, 1); g.fillCircle(0, -66, 10);
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; g.fillTriangle(Math.cos(a - 0.2) * 10, -66 + Math.sin(a - 0.2) * 10, Math.cos(a + 0.2) * 10, -66 + Math.sin(a + 0.2) * 10, Math.cos(a) * 16, -66 + Math.sin(a) * 16); }
      g.fillStyle(0xffd23f, 1); g.fillRect(-22, -42, 44, 8); break;
    case 'esporte':
      g.fillStyle(0xffffff, 1); g.fillRect(-4, -86, 8, 52); g.fillRect(-22, -62, 44, 5);
      g.fillStyle(0x1f3b73, 1); g.fillRect(-22, -38, 44, 6); break;
    case 'casual':
      g.lineStyle(4, 0xe53935, 1); g.beginPath(); g.arc(0, -56, 10, Math.PI, 0, false); g.strokePath();
      g.lineStyle(4, 0x3ecb6b, 1); g.beginPath(); g.arc(0, -56, 6, Math.PI, 0, false); g.strokePath();
      g.fillStyle(0x4a78b8, 1); g.fillRect(-22, -42, 44, 8); break;
    default: break;
  }
}

function hairBack(g, style, c) {
  g.fillStyle(c, 1);
  if (style === 1) g.fillRoundedRect(-30, -22, 60, 66, 22);                    // longo: massa atrás
  if (style === 4) g.fillCircle(0, -8, 40);                                     // crespo
  if (style === 5) { g.fillCircle(-26, -20, 7); g.fillEllipse(-40, 0, 16, 40); g.fillStyle(0xff6fb5, 1); g.fillCircle(-27, -19, 4); } // rabo
  if (style === 6) { for (let i = 0; i < 6; i++) g.fillCircle(-30 - i * 0.6, -6 + i * 12, 8.5 - i * 0.6); g.fillStyle(0xff6fb5, 1); g.fillCircle(-31, 62, 4); } // trança
  if (style === 7) { g.fillCircle(-26, -30, 13); g.fillCircle(26, -30, 13); }  // coquinhos
  if (style === 3) { for (let i = 0; i < 9; i++) { const a = Math.PI + (i / 8) * Math.PI; g.fillCircle(Math.cos(a) * 29, -4 + Math.sin(a) * 29, 11); } }
}
function hairFront(g, style, c, face) {
  g.fillStyle(c, 1);
  g.slice(0, -6, 28, Math.PI, 0, false); g.fillPath();                          // topo
  g.fillTriangle(-22, -8, 8, -8, -6, 3);                                        // franja
  if (style === 1) { g.fillRoundedRect(-30, -10, 9, 46, 4); g.fillRoundedRect(21, -10, 9, 46, 4); }
  if (style === 2) { for (let i = 0; i < 3; i++) { g.fillCircle(-27, 0 + i * 12, 8); g.fillCircle(27, 0 + i * 12, 8); } }
  if (style === 3) { for (let i = 0; i < 7; i++) { const a = Math.PI + (i / 6) * Math.PI; g.fillCircle(Math.cos(a) * 21, -4 + Math.sin(a) * 21, 9); } }
  if (style === 4) { for (let i = 0; i < 7; i++) { const a = Math.PI + (i / 6) * Math.PI; g.fillCircle(Math.cos(a) * 22, -4 + Math.sin(a) * 22, 9); } }
  if (style === 0 || style === 5 || style === 6 || style === 7) { /* topo já cobre */ }
}

function drawHead(scene, look, o) {
  const skin = SKINS[look.skin] ?? SKINS[3], hc = HAIR_COLORS[look.hairColor] ?? HAIR_COLORS[1], ec = EYE_COLORS[look.eyes] ?? EYE_COLORS[0];
  const back = og(scene), front = og(scene), hat = og(scene); hat.y = -9; // chapéus sobem um pouco para não cobrir os olhos
  hairBack(back, look.hair, hc);
  const g = front;
  // rosto
  g.fillStyle(skin, 1);
  if (look.face === 1) g.fillEllipse(0, 0, 47, 55); else if (look.face === 2) g.fillRoundedRect(-25, -26, 50, 52, 21); else g.fillCircle(0, 0, 25.5);
  g.fillStyle(shade(skin, 0.9), 1); g.fillCircle(-25, 4, 4.5); g.fillCircle(25, 4, 4.5); // orelhas
  hairFront(g, look.hair, hc, look.face);
  // olhos grandes e brilhantes, sobrancelhas e sorriso aberto (rosto simpático e expressivo)
  const brow = shade(hc, 0.75);
  const eyes = () => {
    g.fillStyle(0xffffff, 1); g.fillEllipse(10, 1, 17, 20); g.fillEllipse(-8, 1, 15, 18);
    g.fillStyle(ec, 1); g.fillCircle(12, 2.5, 5.6); g.fillCircle(-6, 2.5, 5.2);
    g.fillStyle(0x111111, 1); g.fillCircle(12.6, 2.7, 3.1); g.fillCircle(-5.4, 2.7, 2.9);
    g.fillStyle(0xffffff, 1); g.fillCircle(14.2, 0.2, 2.3); g.fillCircle(-3.8, 0.2, 2.1); g.fillCircle(11, 5, 1.1);
    g.lineStyle(3.4, brow, 1);
    g.beginPath(); g.arc(11, -8, 9, Math.PI * 1.12, Math.PI * 1.88); g.strokePath();
    g.beginPath(); g.arc(-8, -8, 8, Math.PI * 1.12, Math.PI * 1.88); g.strokePath();
  };
  const h = o.head;
  if (h === 'mask') {
    g.fillStyle(0x3b1f7a, 1); g.fillRoundedRect(-22, -8, 44, 17, 8); g.fillStyle(0xffd23f, 1); g.fillRect(-22, -9, 44, 3);
  }
  eyes();
  g.fillStyle(0x7a2230, 1); g.slice(3, 11, 10.5, 0.12, Math.PI - 0.12, false); g.fillPath();
  g.fillStyle(0xffffff, 1); g.slice(3, 11, 10.5, 0.12, Math.PI - 0.12, false); g.fillPath();
  g.fillStyle(0x7a2230, 1); g.fillEllipse(3, 15.5, 16, 10);
  g.fillStyle(0xff7d8a, 1); g.fillEllipse(3.5, 17.5, 9, 5);
  g.lineStyle(2.6, 0x4a1420, 1); g.beginPath(); g.arc(3, 11, 10.5, 0.12, Math.PI - 0.12, false); g.closePath(); g.strokePath();
  g.fillStyle(0xff6f7f, 0.6); g.fillCircle(18, 11, 6.5); g.fillCircle(-14, 11, 5.8);
  // acessórios de cabeça
  { const g = (h === 'astro' || h === 'mask' || h === 'headband') ? front : hat;
  switch (h) {
    case 'helmet':
      g.fillStyle(0xe53935, 1); g.slice(0, -4, 30, Math.PI, 0, false); g.fillPath(); g.fillRoundedRect(-34, -6, 68, 9, 4);
      g.fillStyle(0xffd23f, 1); g.fillCircle(3, -22, 7.5); g.fillStyle(0xe53935, 1); g.fillCircle(3, -22, 3.5); break;
    case 'dogcap':
      g.fillStyle(0x1fa8a0, 1); g.slice(0, -4, 29, Math.PI, 0, false); g.fillPath(); g.fillRoundedRect(-33, -6, 66, 8, 4);
      g.fillTriangle(-28, -16, -16, -28, -34, -40); g.fillTriangle(28, -16, 16, -28, 34, -40);
      g.fillStyle(0xff8a1f, 1); g.fillCircle(2, -20, 7); g.fillStyle(0xffffff, 1); g.fillCircle(2, -19, 3); break;
    case 'dino':
      g.fillStyle(0x58b947, 1); g.slice(0, -2, 31, Math.PI, 0, false); g.fillPath(); g.fillRoundedRect(-32, -6, 64, 8, 4);
      g.fillStyle(0xffffff, 1); g.fillCircle(-12, -26, 7); g.fillCircle(12, -26, 7); g.fillStyle(0x111111, 1); g.fillCircle(-11, -26, 3.2); g.fillCircle(13, -26, 3.2);
      g.fillStyle(0x3f9a30, 1); [-18, -6, 6, 18].forEach((x) => g.fillTriangle(x - 5, -30, x + 5, -30, x, -42));
      g.fillStyle(0xffffff, 1); for (let x = -22; x <= 18; x += 10) g.fillTriangle(x, -4, x + 8, -4, x + 4, 3); break;
    case 'safari':
      g.fillStyle(0xc2a15a, 1); g.fillEllipse(0, -6, 82, 14); g.slice(0, -6, 26, Math.PI, 0, false); g.fillPath();
      g.fillStyle(0x6b4a2b, 1); g.fillRect(-26, -12, 52, 6); break;
    case 'pilot':
      g.fillStyle(0xffffff, 1); g.slice(0, -2, 30, Math.PI, 0, false); g.fillPath(); g.fillRoundedRect(-31, -6, 62, 8, 4);
      g.fillStyle(0xff8a1f, 1); g.fillRect(-4, -32, 8, 28);
      g.fillStyle(0x2b2b2b, 1); g.fillRoundedRect(-22, -22, 44, 12, 6); g.fillStyle(0x4db8ff, 0.9); g.fillRoundedRect(-19, -20, 38, 8, 4); break;
    case 'ranger':
      g.fillStyle(0x5b7d3a, 1); g.fillEllipse(0, -8, 74, 13); g.slice(0, -8, 22, Math.PI, 0, false); g.fillPath();
      g.fillStyle(0xffd23f, 1); g.fillRect(-22, -14, 44, 4); g.fillStyle(0x3ecb6b, 1); g.fillCircle(6, -20, 5); break;
    case 'astro':
      g.fillStyle(0xbfe6ff, 0.28); g.fillCircle(0, -1, 36); g.lineStyle(6, 0xffffff, 1); g.strokeCircle(0, -1, 36);
      g.lineStyle(4, 0xffffff, 0.8); g.beginPath(); g.arc(-8, -8, 24, Math.PI * 1.1, Math.PI * 1.45); g.strokePath(); break;
    case 'mask':
      g.fillStyle(0x3b1f7a, 1); g.fillTriangle(-24, -12, -14, -34, -6, -14); g.fillTriangle(24, -12, 14, -34, 6, -14); break;
    case 'headband':
      g.fillStyle(0xe53935, 1); g.fillRect(-26, -15, 52, 8); g.fillTriangle(24, -11, 40, -20, 40, -2); g.fillStyle(0xffffff, 1); g.fillRect(-26, -12, 52, 2); break;
    case 'cap':
      g.fillStyle(0x2f9bff, 1); g.slice(0, -4, 28, Math.PI, 0, false); g.fillPath(); g.fillRoundedRect(8, -10, 34, 8, 4);
      g.fillStyle(0xffffff, 1); g.fillCircle(-4, -18, 4.5); break;
    default: break;
  }
  }
  return { back, front, hat };
}

/** Constrói o personagem. look = {skin, face, hair, hairColor, eyes, outfit} (índices). */
export function buildChild(scene, look = load().look) {
  look = { ...DEFAULT_LOOK, ...look };
  const outfit = OUTFITS[look.outfit] || OUTFITS[0];
  const o = O[outfit.id];
  const skin = SKINS[look.skin] ?? SKINS[3];
  const c = scene.add.container(0, 0);
  const g = () => og(scene);

  const mkLeg = (x, dark) => {
    const l = g(); l.x = x; l.y = -38;
    const col = dark ? shade(o.pants, 0.82) : o.pants;
    if (o.short) { l.fillStyle(col, 1); l.fillRoundedRect(-8, 0, 16, 14, 5); l.fillStyle(skin, 1); l.fillRect(-6, 12, 12, 14); }
    else { l.fillStyle(col, 1); l.fillRoundedRect(-8, 0, 16, 28, 5); }
    if (outfit.id === 'esporte') { l.fillStyle(0xffffff, 1); l.fillRect(-8, 2, 3, 24); }
    l.fillStyle(dark ? shade(o.shoes, 0.8) : o.shoes, 1); l.fillRoundedRect(-9, 24, 25, 14, 6);
    if (outfit.id === 'dino') { l.fillStyle(0xffffff, 1); [8, 12.5, 17].forEach((x2) => l.fillTriangle(x2, 36, x2 + 3, 36, x2 + 1.5, 40)); }
    return l;
  };
  const legB = mkLeg(-7, true), legF = mkLeg(9, false);

  const mkArm = (x, dark) => {
    const a = g(); a.x = x; a.y = -80;
    const sl = o.shortSleeve ? 13 : 30;
    a.fillStyle(dark ? shade(o.sleeve, 0.82) : o.sleeve, 1); a.fillRoundedRect(-7, -4, 14, sl, 6);
    if (o.shortSleeve) { a.fillStyle(skin, 1); a.fillRect(-5.5, 8, 11, 20); }
    a.fillStyle(o.glove ?? skin, 1); a.fillCircle(0, 30, 8);
    return a;
  };
  const armB = mkArm(-18, true), armF = mkArm(19, false);

  const body = g(); drawTorso(body, outfit.id, o);

  const { back, front, hat } = drawHead(scene, look, o);
  const head = scene.add.container(0, -108, [front, hat]); head.setScale(1.14);
  const hairBackG = back; hairBackG.setPosition(0, -108); hairBackG.setScale(1.14);

  // traseiros: capa, cauda, mochila
  const rear = g();
  if (o.cape) { rear.fillStyle(o.cape, 1); rear.fillTriangle(-16, -82, -62, -20, -12, -34); rear.fillStyle(shade(o.cape, 0.78), 1); rear.fillTriangle(-16, -82, -46, -40, -12, -34); }
  if (o.tail) { rear.fillStyle(0x58b947, 1); rear.fillTriangle(-18, -44, -66, -18, -18, -30); rear.fillStyle(0x3f9a30, 1); [-30, -44, -56].forEach((x) => rear.fillTriangle(x - 5, -30 + (x + 30) * -0.18, x + 5, -30 + (x + 30) * -0.18, x, -40 + (x + 30) * -0.18)); }
  if (o.pack) { rear.fillStyle(o.pack, 1); rear.fillRoundedRect(-36, -84, 20, 42, 8); rear.fillStyle(shade(o.pack, 0.8), 1); rear.fillRect(-36, -66, 20, 4); }

  const hoseBack = g(); hoseBack.visible = false;
  hoseBack.lineStyle(7, 0xe53935, 1); hoseBack.strokeCircle(-30, -62, 14); hoseBack.lineStyle(4, 0xe53935, 1); hoseBack.strokeCircle(-30, -62, 7);
  const nozzle = g(); nozzle.visible = false;
  nozzle.fillStyle(0xffd23f, 1); nozzle.fillRoundedRect(0, -7, 34, 14, 5); nozzle.fillStyle(0x555555, 1); nozzle.fillRect(30, -5, 8, 10);

  c.add([rear, hairBackG, hoseBack, legB, armB, body, legF, head, armF, nozzle]);
  c.parts = { legB, legF, armB, armF, head, body, hoseBack, nozzle, rear, hairBack: hairBackG, hasCape: !!o.cape, hasTail: !!o.tail, ponytail: look.hair === 5 || look.hair === 6, outfit: outfit.id };
  c.setScale(0.9);
  return c;
}

/** Animações: correr / pular / planar / voar / parado com o bocal. phase = fase do ciclo de corrida. */
export function poseChild(c, state, phase, t = 0) {
  const { legB, legF, armB, armF, head, nozzle, rear, hairBack } = c.parts;
  nozzle.visible = false;
  let bob = 0;
  if (state === 'run') {
    const s = Math.sin(phase);
    legF.rotation = s * 0.95; legB.rotation = -s * 0.95;
    armF.rotation = -s * 0.95; armB.rotation = s * 0.95;
    bob = Math.abs(Math.cos(phase)) * -3;
    c.parts.body.y = bob * 0.6;
  } else if (state === 'jump') {
    legF.rotation = 0.7; legB.rotation = -0.4; armF.rotation = -2.5; armB.rotation = -2.2; c.parts.body.y = 0;
  } else if (state === 'glide' || state === 'fly') {
    legF.rotation = 0.2; legB.rotation = -0.2; armF.rotation = -1.9; armB.rotation = 1.9 - 3.8; c.parts.body.y = 0;
  } else if (state === 'spray') {
    legF.rotation = 0.15; legB.rotation = -0.15; armF.rotation = -1.45; armB.rotation = -1.2; c.parts.body.y = 0;
    nozzle.visible = true; nozzle.x = armF.x + 26; nozzle.y = armF.y + 3;
  } else if (state === 'throw') {
    legF.rotation = 0.2; legB.rotation = -0.2; armF.rotation = -2.2 + Math.sin(t * 20) * 0.5; armB.rotation = 0.2; c.parts.body.y = 0;
  } else { // idle
    legF.rotation = legB.rotation = 0; armF.rotation = armB.rotation = Math.sin(t * 3) * 0.05; c.parts.body.y = 0;
  }
  head.y = -108 + bob; hairBack.y = -108 + bob;
  const sway = Math.sin(t * 9 + phase * 0.2) * 0.07;
  if (c.parts.hasCape || c.parts.hasTail) { rear.rotation = sway + (state === 'run' || state === 'fly' ? -0.08 : 0); rear.setPosition(0, 0); }
  if (c.parts.ponytail) hairBack.rotation = sway * 1.4;
}
