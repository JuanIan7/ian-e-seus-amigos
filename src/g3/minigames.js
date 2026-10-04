// Desafios de toque (um por fase, 30 segundos): quebra-cabeça 4x4 e 5x5, labirinto, pegar maçãs, mirar a mangueira,
// guiar o barco e esfriar a lava. Tudo é desenhado por código (sem imagens externas). O jogo fica pausado enquanto o
// desafio está aberto. Vencer dentro do tempo vale +1 vida; quando o tempo acaba, a corrida simplesmente continua.
import { ICONS } from './hud.js';

const css = `
.g3 .mini{position:absolute;inset:0;background:rgba(20,34,64,.62);display:flex;align-items:center;justify-content:center;pointer-events:auto;touch-action:none;z-index:20;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)}
.g3 .mini .card{position:relative;width:min(94vw,1200px);height:min(90vh,640px);background:linear-gradient(#fff6d8,#ffe9a8);border:6px solid #1b2a49;border-radius:30px;box-shadow:0 10px 0 rgba(27,42,73,.5);overflow:hidden;touch-action:none}
.g3 .mini .mhead{position:absolute;left:0;right:0;top:0;height:64px;display:flex;align-items:center;gap:14px;padding:0 84px 0 14px;pointer-events:none;z-index:3}
.g3 .mini .micon{flex:none;width:50px;height:50px;border-radius:50%;background:#2f9bff;border:4px solid #1b2a49;display:flex;align-items:center;justify-content:center}
.g3 .mini .micon svg{width:70%;height:70%}
.g3 .mini .mtime{flex:1;height:22px;border-radius:14px;background:rgba(0,0,0,.18);border:4px solid #1b2a49;overflow:hidden;display:none;position:relative}
.g3 .mini .mtime i{display:block;height:100%;width:100%;background:#3ecb6b;border-radius:10px}
.g3 .mini .mprog{flex:none;display:flex;gap:4px;align-items:center;font-size:24px;line-height:1}
.g3 .mini .mprog b{font-weight:400;opacity:.28;filter:grayscale(1)}
.g3 .mini .mprog b.on{opacity:1;filter:none}
.g3 .mini .mclose{position:absolute;right:12px;top:6px;width:52px;height:52px;border-radius:50%;background:#2f9bff;border:4px solid #1b2a49;display:flex;align-items:center;justify-content:center;pointer-events:auto;cursor:pointer;box-shadow:0 4px 0 rgba(27,42,73,.5);z-index:4}
.g3 .mini .mclose svg{width:60%;height:60%}
.g3 .mini .mbody{position:absolute;inset:64px 0 0 0;touch-action:none}
.g3 .mini .slot{position:absolute;border:3px dashed rgba(27,42,73,.35);box-sizing:border-box;overflow:hidden}
.g3 .mini .slot.hint{animation:minihint .6s ease-in-out infinite;border-color:#ff8a1f}
@keyframes minihint{0%,100%{box-shadow:0 0 0 0 rgba(255,138,31,.0)}50%{box-shadow:0 0 0 10px rgba(255,138,31,.55)}}
.g3 .mini .piece{position:absolute;border:3px solid #1b2a49;border-radius:8px;box-sizing:border-box;cursor:grab;touch-action:none;box-shadow:0 5px 0 rgba(27,42,73,.45);transition:left .25s,top .25s,transform .25s}
.g3 .mini .piece.drag{transition:none;transform:scale(1.08) rotate(0deg)!important;box-shadow:0 12px 0 rgba(27,42,73,.35)}
.g3 .mini .piece.ok{box-shadow:none;cursor:default;border-color:rgba(27,42,73,.25);border-radius:0}
.g3 .mini .piece.pulse{animation:minipulse .8s ease-in-out infinite}
@keyframes minipulse{0%,100%{filter:brightness(1)}50%{filter:brightness(1.22)}}
.g3 .mini .win{position:absolute;inset:0;display:none;align-items:center;justify-content:center;flex-direction:column;gap:6px;background:rgba(255,246,216,.6);text-align:center;color:#1b2a49;z-index:5;font-family:'Arial Black',Arial,sans-serif}
.g3 .mini .win b{font-size:min(20vh,120px);font-weight:400;animation:miniwin .8s ease-out}
.g3 .mini .win span{font-size:min(8vh,44px);text-shadow:0 3px 0 #fff}
@keyframes miniwin{0%{transform:scale(.2) rotate(-20deg);opacity:0}70%{transform:scale(1.2) rotate(6deg);opacity:1}100%{transform:scale(1) rotate(0)}}
.g3 .mini canvas{position:absolute;left:0;top:0;touch-action:none}
`;

const svgIcon = (body) => `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
export const MINI_ICONS = {
  puzzle: svgIcon('<path d="M14 30 H40 a10 10 0 1 1 20 0 H86 V56 a10 10 0 1 0 0 20 V86 H60 a10 10 0 1 0 -20 0 H14 V60 a10 10 0 1 1 0 -20 Z" fill="#fff" stroke="#1b2a49" stroke-width="5" stroke-linejoin="round"/>'),
  snake: svgIcon('<path d="M12 78 C12 40 44 70 50 44 C56 18 88 40 88 22" fill="none" stroke="#fff" stroke-width="16" stroke-linecap="round"/><circle cx="88" cy="22" r="9" fill="#3ecb6b" stroke="#1b2a49" stroke-width="4"/>'),
  maze: svgIcon('<path d="M12 12 H88 V88 H12 Z M30 12 V60 M50 88 V40 M70 12 V62 M30 60 H50" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>'),
  apple: svgIcon('<circle cx="50" cy="58" r="32" fill="#ff4d4d" stroke="#1b2a49" stroke-width="5"/><path d="M50 28 C50 14 58 8 68 8 C68 20 60 28 50 28 Z" fill="#3ecb6b" stroke="#1b2a49" stroke-width="4"/>'),
  hose: svgIcon('<path d="M50 6 C50 6 18 44 18 64 A32 32 0 0 0 82 64 C82 44 50 6 50 6 Z" fill="#fff"/>'),
  boat: svgIcon('<path d="M10 58 H90 L76 84 H24 Z" fill="#fff" stroke="#1b2a49" stroke-width="5" stroke-linejoin="round"/><path d="M50 14 V58 M50 16 L78 50 H50" fill="#ffd23f" stroke="#1b2a49" stroke-width="5" stroke-linejoin="round"/>'),
  lava: svgIcon('<path d="M10 88 L40 22 H60 L90 88 Z" fill="#8a5a3c" stroke="#1b2a49" stroke-width="5" stroke-linejoin="round"/><path d="M40 22 Q50 4 60 22" fill="#ff7a1a" stroke="#1b2a49" stroke-width="5"/>'),
  close: svgIcon('<path d="M24 24 L76 76 M76 24 L24 76" stroke="#fff" stroke-width="14" stroke-linecap="round"/>'),
};
export const PUZZLE_ICON = { jigsaw4: 'puzzle', jigsaw5: 'puzzle', maze: 'maze', apples: 'apple', hose: 'hose', boat: 'boat', lava: 'lava', puzzle: 'puzzle', snake: 'snake' };

// ------------------------------------------------------------------ figuras do quebra-cabeça (desenhadas por código)
const INK = '#1b2a49';
function stroke(c, w = 6) { c.lineWidth = w; c.strokeStyle = INK; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); }
function blob(c, x, y, rx, ry, fill, rot = 0) { c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); c.fillStyle = fill; c.fill(); stroke(c, 5); }
function sky(c, w, h, a, b) { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, a); g.addColorStop(1, b); c.fillStyle = g; c.fillRect(0, 0, w, h); }
function sun(c, x, y, r) { c.fillStyle = '#ffd23f'; for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; c.beginPath(); c.moveTo(x + Math.cos(a) * r * 1.2, y + Math.sin(a) * r * 1.2); c.lineTo(x + Math.cos(a + 0.12) * r * 1.7, y + Math.sin(a + 0.12) * r * 1.7); c.lineTo(x + Math.cos(a + 0.24) * r * 1.2, y + Math.sin(a + 0.24) * r * 1.2); c.fill(); } blob(c, x, y, r, r, '#ffe14a'); }
function cloud(c, x, y, s) { [[0, 0, 40], [38, 8, 30], [-38, 10, 28], [10, -18, 28]].forEach(([dx, dy, r]) => { c.beginPath(); c.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2); c.fillStyle = '#fff'; c.fill(); }); }
export const PICTURES = [
  function dino(c, w, h) {
    sky(c, w, h, '#6cc8ff', '#e6f7ff'); sun(c, w * 0.82, h * 0.2, 34); cloud(c, w * 0.25, h * 0.2, 1);
    blob(c, w * 0.2, h * 0.9, w * 0.5, h * 0.3, '#5fcf6a'); blob(c, w * 0.85, h * 0.95, w * 0.45, h * 0.3, '#47bf5a');
    // vulcão
    c.beginPath(); c.moveTo(w * 0.62, h * 0.78); c.lineTo(w * 0.8, h * 0.4); c.lineTo(w * 0.94, h * 0.78); c.closePath(); c.fillStyle = '#9a6a52'; c.fill(); stroke(c, 5);
    // dino
    blob(c, w * 0.38, h * 0.62, 105, 62, '#7bd957'); blob(c, w * 0.22, h * 0.34, 30, 22, '#7bd957', -0.2);
    c.beginPath(); c.moveTo(w * 0.26, h * 0.4); c.lineTo(w * 0.34, h * 0.56); c.lineTo(w * 0.28, h * 0.62); c.lineTo(w * 0.2, h * 0.42); c.fillStyle = '#7bd957'; c.fill();
    [[w * 0.3, h * 0.78], [w * 0.46, h * 0.8]].forEach(([x, y]) => { c.beginPath(); c.roundRect(x - 16, y - 20, 32, 52, 12); c.fillStyle = '#6cc84c'; c.fill(); stroke(c, 5); });
    c.beginPath(); c.moveTo(w * 0.5, h * 0.56); c.quadraticCurveTo(w * 0.62, h * 0.6, w * 0.64, h * 0.72); c.lineTo(w * 0.5, h * 0.7); c.fillStyle = '#7bd957'; c.fill(); stroke(c, 5);
    [[w * 0.33, h * 0.52], [w * 0.4, h * 0.5], [w * 0.46, h * 0.54]].forEach(([x, y]) => blob(c, x, y, 9, 7, '#ff9a3a'));
    blob(c, w * 0.205, h * 0.32, 8, 8, '#fff'); blob(c, w * 0.2, h * 0.32, 4, 4, '#1b2a49');
    c.beginPath(); c.arc(w * 0.22, h * 0.37, 12, 0.1, Math.PI - 0.1); stroke(c, 4);
  },
  function truck(c, w, h) {
    sky(c, w, h, '#78cdff', '#fff1c8'); sun(c, w * 0.15, h * 0.2, 30); cloud(c, w * 0.6, h * 0.18, 1.1);
    c.fillStyle = '#7a8499'; c.fillRect(0, h * 0.72, w, h * 0.28); c.fillStyle = '#ffd23f'; for (let x = 10; x < w; x += 90) c.fillRect(x, h * 0.86, 50, 8);
    c.fillStyle = '#5fcf6a'; c.fillRect(0, h * 0.68, w, h * 0.05);
    c.beginPath(); c.roundRect(w * 0.12, h * 0.38, w * 0.5, h * 0.3, 18); c.fillStyle = '#e8352f'; c.fill(); stroke(c, 6);
    c.beginPath(); c.roundRect(w * 0.6, h * 0.3, w * 0.24, h * 0.38, 18); c.fillStyle = '#d02a24'; c.fill(); stroke(c, 6);
    c.beginPath(); c.roundRect(w * 0.64, h * 0.34, w * 0.14, h * 0.14, 10); c.fillStyle = '#a8e2ff'; c.fill(); stroke(c, 5);
    c.fillStyle = '#fff'; c.fillRect(w * 0.16, h * 0.28, w * 0.42, 12); stroke(c, 4); for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(w * 0.18 + i * 55, h * 0.28); c.lineTo(w * 0.18 + i * 55, h * 0.28 + 12); stroke(c, 3); }
    c.fillStyle = '#ffd23f'; c.fillRect(w * 0.14, h * 0.55, w * 0.46, 10);
    blob(c, w * 0.72, h * 0.26, 11, 11, '#4db8ff'); blob(c, w * 0.78, h * 0.26, 11, 11, '#ff4040');
    [[w * 0.26, h * 0.7], [w * 0.7, h * 0.7]].forEach(([x, y]) => { blob(c, x, y, 38, 38, '#2b2b35'); blob(c, x, y, 18, 18, '#cfd5e0'); });
  },
  function dog(c, w, h) {
    sky(c, w, h, '#8be0ff', '#fff6cf');
    for (let i = 0; i < 7; i++) { c.save(); c.translate(w * (0.1 + i * 0.14), h * (0.15 + (i % 3) * 0.2)); c.rotate(i); c.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 9 : 20; k ? c.lineTo(Math.cos(a) * r, Math.sin(a) * r) : c.moveTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fillStyle = '#ffd23f'; c.fill(); c.restore(); }
    blob(c, w * 0.27, h * 0.5, 44, 86, '#7a4a22', 0.25); blob(c, w * 0.73, h * 0.5, 44, 86, '#7a4a22', -0.25);
    blob(c, w * 0.5, h * 0.52, 150, 140, '#d9944a'); blob(c, w * 0.5, h * 0.66, 82, 60, '#fff3dc');
    blob(c, w * 0.4, h * 0.45, 22, 26, '#fff'); blob(c, w * 0.6, h * 0.45, 22, 26, '#fff'); blob(c, w * 0.41, h * 0.46, 11, 14, '#1b2a49'); blob(c, w * 0.59, h * 0.46, 11, 14, '#1b2a49');
    blob(c, w * 0.5, h * 0.6, 20, 14, '#1b2a49'); c.beginPath(); c.arc(w * 0.5, h * 0.63, 30, 0.2, Math.PI - 0.2); stroke(c, 5); blob(c, w * 0.5, h * 0.74, 17, 22, '#ff7a9a');
    c.beginPath(); c.arc(w * 0.5, h * 0.3, 118, Math.PI * 1.05, Math.PI * 1.95); c.lineTo(w * 0.5 + 126, h * 0.3); c.lineTo(w * 0.5 - 126, h * 0.3); c.closePath(); c.fillStyle = '#e8352f'; c.fill(); stroke(c, 6);
    c.beginPath(); c.roundRect(w * 0.5 - 150, h * 0.3 - 6, 300, 22, 10); c.fillStyle = '#d02a24'; c.fill(); stroke(c, 5); blob(c, w * 0.5, h * 0.2, 24, 20, '#ffd23f');
  },
];

function catmull(pts, n = 18) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t; out.push([0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3), 0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]); }
  }
  out.push(pts[pts.length - 1]); return out;
}


// ------------------------------------------------------------------ cartão comum (cabeçalho, tempo, X, vitória)
function shell(root, icon, o) {
  let st = document.getElementById('g3-mini-css');
  if (!st) { st = document.createElement('style'); st.id = 'g3-mini-css'; document.head.appendChild(st); }
  st.textContent = css;
  const wrap = document.createElement('div'); wrap.className = 'mini';
  wrap.innerHTML = `<div class="card"><div class="mhead"><div class="micon">${MINI_ICONS[icon] || MINI_ICONS.puzzle}</div><div class="mtime"><i></i></div><div class="mprog"></div></div><div class="mclose">${MINI_ICONS.close}</div><div class="mbody"></div><div class="win"><b>⭐</b><span></span></div></div>`;
  root.appendChild(wrap);
  const U = { wrap, card: wrap.querySelector('.card'), body: wrap.querySelector('.mbody'), close: wrap.querySelector('.mclose'), time: wrap.querySelector('.mtime'), timeBar: wrap.querySelector('.mtime i'), prog: wrap.querySelector('.mprog'), win: wrap.querySelector('.win') };
  const S = (k) => { const f = o.sfx && o.sfx[k]; if (f) f(); };
  const say = (t) => { if (o.speak) o.speak(t); };
  const api = { won: false, over: false, alive: true, mode: o.mode || 'facil', U };
  const steps = []; let raf = 0, last = performance.now(), left = o.time || 0;
  if (o.time) U.time.style.display = 'block';
  api.timeLeft = () => left; api.setTime = (v) => { left = v; };
  api.onStep = (f) => steps.push(f);
  api.tick = (dt) => {
    for (const f of steps) f(dt);
    if (o.time && !api.won && !api.over) {
      left -= dt; U.timeBar.style.width = Math.max(0, left / o.time * 100) + '%';
      U.timeBar.style.background = left < o.time * 0.25 ? '#ff5a3c' : left < o.time * 0.5 ? '#ffb02e' : '#3ecb6b';
      if (left <= 0) api.timeout();
    }
  };
  const loop = (now) => { if (!api.alive) return; raf = requestAnimationFrame(loop); const dt = Math.min(0.05, (now - last) / 1000); last = now; api.tick(dt); };
  api.setProg = (n, total, emoji) => {
    if (total > 8) { U.prog.innerHTML = `<b class="on">${emoji}</b><span style="font-size:22px;color:#1b2a49">${n}/${total}</span>`; return; }
    U.prog.innerHTML = Array.from({ length: total }, (_, i) => `<b class="${i < n ? 'on' : ''}">${emoji}</b>`).join('');
  };
  api.win = () => {
    if (api.won || api.over) return; api.won = true; S('win');
    U.win.querySelector('b').textContent = '⭐'; U.win.querySelector('span').textContent = o.reward || 'Muito bem!'; U.win.style.display = 'flex';
    say(o.rewardSay || 'Muito bem!');
    setTimeout(() => { if (api.alive) (o.onWin || (() => {}))(api); }, 1400);
  };
  api.timeout = () => {
    if (api.won || api.over) return; api.over = true; S('hit');
    U.win.querySelector('b').textContent = '⏰'; U.win.querySelector('span').textContent = 'Acabou o tempo!'; U.win.style.display = 'flex';
    say('O tempo acabou! Vamos continuar a corrida.');
    setTimeout(() => { if (api.alive) (o.onTimeout || o.onClose || (() => {}))(api); }, 1500);
  };
  api.destroy = () => { api.alive = false; cancelAnimationFrame(raf); wrap.remove(); };
  U.close.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); if (!api.won && !api.over) { api.destroy(); (o.onClose || (() => {}))(api); } });
  raf = requestAnimationFrame(loop);
  return { U, api, S, say };
}
/** tela de desenho do tamanho do corpo do cartão, nítida em telas de alta densidade */
function canvasIn(U) {
  const cv = document.createElement('canvas'); U.body.appendChild(cv);
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = U.body.clientWidth || 900, H = U.body.clientHeight || 420;
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.width = W + 'px'; cv.style.height = H + 'px';
  const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const pos = (e) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * (W / r.width), (e.clientY - r.top) * (H / r.height)]; };
  return { cv, c, W, H, pos };
}
const star5 = (c, x, y, r, fill = '#ffd23f') => { c.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * 0.45 : r; k ? c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : c.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); c.fillStyle = fill; c.fill(); stroke(c, 3); };

// ------------------------------------------------------------------ quebra-cabeça (4x4 na fase 1, 5x5 na fase 3)
export function startJigsaw(root, o) {
  const mode = o.mode || 'facil', rng = o.rng || Math.random;
  const cols = o.cols || 4, rows = o.rows || 4, n = cols * rows;
  // ajuda para os pequenos: no Fácil metade das peças já começa no lugar (ajustável)
  const prefill = o.prefill ?? Math.round(n * ({ facil: 0.5, aventura: 0.25, desafio: 0 }[mode] ?? 0));
  const { U, api, S, say } = shell(root, 'puzzle', o);
  const pic = document.createElement('canvas'); pic.width = 600; pic.height = 400;
  const pi = o.picture ?? Math.floor(rng() * PICTURES.length); PICTURES[pi % PICTURES.length](pic.getContext('2d'), 600, 400);
  const url = pic.toDataURL();
  const ghost = mode === 'facil' ? 0.34 : mode === 'aventura' ? 0.2 : 0.08, snapK = mode === 'facil' ? 0.95 : mode === 'aventura' ? 0.75 : 0.6;
  const W = U.body.clientWidth || 900, H = U.body.clientHeight || 420;
  const bw = Math.min(W * 0.55, (H - 20) * 1.5), bh = bw / 1.5, bx = W * 0.03, by = (H - bh) / 2;
  const cw = bw / cols, ch = bh / rows;
  const trayX = bx + bw + W * 0.025, trayW = W - trayX - W * 0.02, trayY = 6, trayH = H - 12;
  const L = { W, H, bw, bh, bx, by, cw, ch, trayX, trayW, trayY, trayH };
  const slots = [], list = [], cells = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.push([c, r]);
  const bg = `background:url(${url});background-size:${bw}px ${bh}px;`;
  cells.forEach(([c, r]) => {
    const s = document.createElement('div'); s.className = 'slot';
    s.style.cssText = `left:${bx + c * cw}px;top:${by + r * ch}px;width:${cw}px;height:${ch}px;${bg}background-position:${-c * cw}px ${-r * ch}px`;
    const veil = document.createElement('div'); veil.style.cssText = `position:absolute;inset:0;background:rgba(255,246,216,${1 - ghost})`; s.appendChild(veil);
    U.body.appendChild(s); slots.push(s);
  });
  const order = cells.map((_, i) => i); for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  const fixedSet = new Set(order.slice(0, prefill));
  let placed = 0; const need = n - prefill;
  const snap = (p, silent) => {
    const [c, r] = cells[p.cell]; p.style.left = (bx + c * cw) + 'px'; p.style.top = (by + r * ch) + 'px'; p.style.transform = 'none';
    p.classList.add('ok'); p.classList.remove('drag', 'pulse'); p.ok = true; p.style.zIndex = 1; slots[p.cell].classList.remove('hint');
    if (!silent) { placed++; S('star'); api.setProg(placed, need, '🧩'); }
  };
  cells.forEach(([c, r], i) => {
    const p = document.createElement('div'); p.className = 'piece'; p.dataset.i = i; p.cell = i; p.ok = false;
    p.style.cssText = `width:${cw}px;height:${ch}px;${bg}background-position:${-c * cw}px ${-r * ch}px`;
    U.body.appendChild(p); list.push(p); if (fixedSet.has(i)) snap(p, true);
  });
  const loose = list.filter((p) => !p.ok);
  // as peças soltas ficam menores na bandeja (crescem quando seguradas) para caberem sem se sobrepor
  let sc = 1, nx = 1, ny = loose.length;
  for (sc = 1; sc > 0.25; sc -= 0.03) { nx = Math.max(1, Math.floor(trayW / (cw * sc + 6))); ny = Math.ceil(loose.length / nx); if (ny * (ch * sc + 6) <= trayH) break; }
  const cellW = trayW / nx, cellH = trayH / Math.max(1, ny); api.trayScale = sc;
  loose.forEach((p, k) => {
    const cx = k % nx, cy = Math.floor(k / nx);
    const px = trayX + cellW * (cx + 0.5), py = trayY + cellH * (cy + 0.5);
    p.homeX = px - cw / 2; p.homeY = py - ch / 2; p.rot = (rng() - 0.5) * 10; p.sc = sc;
    p.style.left = p.homeX + 'px'; p.style.top = p.homeY + 'px'; p.style.transform = `rotate(${p.rot}deg) scale(${sc})`; p.style.zIndex = 2 + k; p.classList.add('pulse');
  });
  api.setProg(0, need, '🧩');
  let z = 200, idle = 0;
  loose.forEach((p) => {
    let drag = null;
    p.addEventListener('pointerdown', (e) => {
      if (p.ok || drag || api.won || api.over) return; e.preventDefault(); e.stopPropagation(); const br = U.body.getBoundingClientRect();
      drag = { id: e.pointerId, dx: e.clientX - br.left - parseFloat(p.style.left), dy: e.clientY - br.top - parseFloat(p.style.top) };
      try { p.setPointerCapture(e.pointerId); } catch (x) { /* ok */ }
      p.classList.add('drag'); p.classList.remove('pulse'); p.style.zIndex = ++z; idle = 0; slots.forEach((s) => s.classList.remove('hint'));
    });
    p.addEventListener('pointermove', (e) => { if (!drag || e.pointerId !== drag.id) return; const br = U.body.getBoundingClientRect(); p.style.left = (e.clientX - br.left - drag.dx) + 'px'; p.style.top = (e.clientY - br.top - drag.dy) + 'px'; });
    const up = (e) => {
      if (!drag || e.pointerId !== drag.id) return; drag = null; p.classList.remove('drag');
      const [c, r] = cells[p.cell]; const dx = parseFloat(p.style.left) - (bx + c * cw), dy = parseFloat(p.style.top) - (by + r * ch);
      if (Math.hypot(dx / cw, dy / ch) < snapK && !api.over) { snap(p); if (list.every((q) => q.ok)) api.win(); }
      else { p.style.left = p.homeX + 'px'; p.style.top = p.homeY + 'px'; p.style.transform = `rotate(${p.rot}deg) scale(${p.sc})`; p.classList.add('pulse'); S('tap'); }
    };
    p.addEventListener('pointerup', up); p.addEventListener('pointercancel', up);
  });
  // ajuda: parado por alguns segundos, o encaixe da próxima peça pisca
  api.onStep((dt) => { idle += dt; if (idle > (mode === 'facil' ? 4 : 8)) { const nxt = list.find((q) => !q.ok); if (nxt) slots[nxt.cell].classList.add('hint'); } });
  say(`Monte a figura! Você tem ${o.time || 30} segundos.`);
  Object.assign(api, { kind: 'jigsaw', cols, rows, prefill, list, slots, layout: () => L, placed: () => placed, need });
  if (!loose.length) api.win();
  return api;
}

// ------------------------------------------------------------------ labirinto (fase 2): leve o cachorrinho até a casinha
const MAZE = { facil: [5, 3], aventura: [7, 4], desafio: [9, 5] };
export function startMaze(root, o) {
  const mode = o.mode || 'facil', rng = o.rng || Math.random;
  const [C, R] = o.size || MAZE[mode];
  const { U, api, S, say } = shell(root, 'maze', o);
  const { cv, c, W, H, pos } = canvasIn(U);
  // labirinto perfeito (sempre há um caminho) gerado por busca em profundidade
  const walls = Array.from({ length: R }, () => Array.from({ length: C }, () => ({ n: true, e: true, s: true, w: true })));
  const seen = Array.from({ length: R }, () => Array(C).fill(false));
  const stack = [[0, R - 1]]; seen[R - 1][0] = true;
  const D = { n: [0, -1, 's'], s: [0, 1, 'n'], e: [1, 0, 'w'], w: [-1, 0, 'e'] };
  while (stack.length) {
    const [x, y] = stack[stack.length - 1];
    const opts = Object.entries(D).filter(([, [dx, dy]]) => { const nx = x + dx, ny = y + dy; return nx >= 0 && ny >= 0 && nx < C && ny < R && !seen[ny][nx]; });
    if (!opts.length) { stack.pop(); continue; }
    const [k, [dx, dy, back]] = opts[Math.floor(rng() * opts.length)];
    walls[y][x][k] = false; walls[y + dy][x + dx][back] = false; seen[y + dy][x + dx] = true; stack.push([x + dx, y + dy]);
  }
  const cs = Math.min((W - 30) / C, (H - 24) / R), ox = (W - cs * C) / 2, oy = (H - cs * R) / 2;
  const goal = [C - 1, 0]; let cur = [0, R - 1], px = cur[0], py = cur[1], idle = 0, trail = [cur.slice()];
  const center = (x, y) => [ox + (x + 0.5) * cs, oy + (y + 0.5) * cs];
  const open = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1]; if (Math.abs(dx) + Math.abs(dy) !== 1) return false; const k = dx === 1 ? 'e' : dx === -1 ? 'w' : dy === 1 ? 's' : 'n'; return !walls[a[1]][a[0]][k]; };
  // caminho até a casinha (para a dica do modo fácil)
  const solve = (from) => { const q = [from], prev = new Map([[from.join(), null]]); while (q.length) { const v = q.shift(); if (v[0] === goal[0] && v[1] === goal[1]) break; for (const [dx, dy] of Object.values(D)) { const nb = [v[0] + dx, v[1] + dy]; if (nb[0] < 0 || nb[1] < 0 || nb[0] >= C || nb[1] >= R || prev.has(nb.join()) || !open(v, nb)) continue; prev.set(nb.join(), v); q.push(nb); } } const out = []; let k = goal; while (k) { out.unshift(k); k = prev.get(k.join()); } return out; };
  const tryMove = (cell) => {
    if (api.won || api.over) return;
    if (open(cur, cell)) { cur = cell; trail.push(cell.slice()); S('tap'); idle = 0; if (cur[0] === goal[0] && cur[1] === goal[1]) setTimeout(() => api.win(), 350); }
  };
  const cellAt = ([x, y]) => [Math.floor((x - ox) / cs), Math.floor((y - oy) / cs)];
  let pid = null;
  const step = (e) => { const cell = cellAt(pos(e)); if (cell[0] < 0 || cell[1] < 0 || cell[0] >= C || cell[1] >= R) return; if (cell[0] === cur[0] && cell[1] === cur[1]) return;
    // arrastar ou tocar: anda uma casa por vez na direção do dedo (sem atravessar paredes)
    const dx = Math.sign(cell[0] - cur[0]), dy = Math.sign(cell[1] - cur[1]);
    const cand = Math.abs(cell[0] - cur[0]) >= Math.abs(cell[1] - cur[1]) ? [[cur[0] + dx, cur[1]], [cur[0], cur[1] + dy]] : [[cur[0], cur[1] + dy], [cur[0] + dx, cur[1]]];
    for (const k of cand) if (k[0] !== cur[0] || k[1] !== cur[1]) { if (open(cur, k)) { tryMove(k); return; } }
  };
  cv.addEventListener('pointerdown', (e) => { e.preventDefault(); pid = e.pointerId; try { cv.setPointerCapture(e.pointerId); } catch (x) { /* ok */ } step(e); });
  cv.addEventListener('pointermove', (e) => { if (pid === e.pointerId) step(e); });
  const up = (e) => { if (pid === e.pointerId) pid = null; };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  const draw = (t) => {
    c.clearRect(0, 0, W, H);
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#8fe08a'); g.addColorStop(1, '#5fc95e'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.fillStyle = '#f6e3b0'; c.beginPath(); c.roundRect(ox, oy, cs * C, cs * R, 14); c.fill();
    // dica: caminho tracejado no fácil depois de alguns segundos parado
    if (mode === 'facil' && idle > 5) { const path = solve(cur); c.strokeStyle = 'rgba(255,138,31,.55)'; c.lineWidth = cs * 0.16; c.setLineDash([cs * 0.2, cs * 0.18]); c.lineCap = 'round'; c.beginPath(); path.forEach((v, i) => { const [x, y] = center(v[0], v[1]); i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke(); c.setLineDash([]); }
    // rastro
    c.fillStyle = 'rgba(160,110,60,.35)'; trail.forEach((v) => { const [x, y] = center(v[0], v[1]); c.beginPath(); c.arc(x, y, cs * 0.08, 0, Math.PI * 2); c.fill(); });
    // casinha do cachorro no destino
    const [gx, gy] = center(goal[0], goal[1]), s = cs * 0.36;
    c.fillStyle = '#e8352f'; c.beginPath(); c.moveTo(gx - s * 1.2, gy - s * 0.1); c.lineTo(gx, gy - s * 1.2); c.lineTo(gx + s * 1.2, gy - s * 0.1); c.closePath(); c.fill(); stroke(c, 4);
    c.fillStyle = '#ffd66b'; c.beginPath(); c.roundRect(gx - s, gy - s * 0.15, s * 2, s * 1.15, 4); c.fill(); stroke(c, 4);
    c.fillStyle = '#5a3a20'; c.beginPath(); c.arc(gx, gy + s * 0.55, s * 0.45, Math.PI, 0); c.lineTo(gx + s * 0.45, gy + s); c.lineTo(gx - s * 0.45, gy + s); c.closePath(); c.fill();
    star5(c, gx + s * 0.9, gy - s * 1.1, s * 0.35);
    // cercas (paredes) arredondadas
    c.strokeStyle = '#2e7d32'; c.lineCap = 'round'; c.lineWidth = Math.max(6, cs * 0.14);
    c.beginPath();
    for (let y = 0; y < R; y++) for (let x = 0; x < C; x++) {
      const w = walls[y][x], x0 = ox + x * cs, y0 = oy + y * cs;
      if (w.n) { c.moveTo(x0, y0); c.lineTo(x0 + cs, y0); }
      if (w.w) { c.moveTo(x0, y0); c.lineTo(x0, y0 + cs); }
      if (y === R - 1 && w.s) { c.moveTo(x0, y0 + cs); c.lineTo(x0 + cs, y0 + cs); }
      if (x === C - 1 && w.e) { c.moveTo(x0 + cs, y0); c.lineTo(x0 + cs, y0 + cs); }
    }
    c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = Math.max(2, cs * 0.04); c.stroke();
    // casas possíveis (fácil)
    if (mode === 'facil' && !api.won) Object.values(D).forEach(([dx, dy]) => { const nb = [cur[0] + dx, cur[1] + dy]; if (nb[0] >= 0 && nb[1] >= 0 && nb[0] < C && nb[1] < R && open(cur, nb)) { const [x, y] = center(nb[0], nb[1]); c.beginPath(); c.arc(x, y, cs * (0.12 + Math.sin(t * 6) * 0.03), 0, Math.PI * 2); c.fillStyle = 'rgba(47,155,255,.45)'; c.fill(); } });
    // cachorrinho
    px += (cur[0] - px) * 0.3; py += (cur[1] - py) * 0.3;
    const [dx0, dy0] = center(px, py), r = cs * 0.3, bob = Math.abs(Math.sin(t * 10)) * (Math.hypot(cur[0] - px, cur[1] - py) > 0.05 ? cs * 0.06 : 0);
    const dyy = dy0 - bob;
    c.fillStyle = '#7a4a22'; c.beginPath(); c.ellipse(dx0 - r * 0.85, dyy - r * 0.1, r * 0.35, r * 0.6, 0.3, 0, Math.PI * 2); c.fill(); stroke(c, 3); c.beginPath(); c.ellipse(dx0 + r * 0.85, dyy - r * 0.1, r * 0.35, r * 0.6, -0.3, 0, Math.PI * 2); c.fill(); stroke(c, 3);
    c.fillStyle = '#d9944a'; c.beginPath(); c.arc(dx0, dyy, r, 0, Math.PI * 2); c.fill(); stroke(c, 4);
    c.fillStyle = '#fff3dc'; c.beginPath(); c.ellipse(dx0, dyy + r * 0.35, r * 0.55, r * 0.42, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = INK; [[-0.35, -0.15], [0.35, -0.15]].forEach(([ex, ey]) => { c.beginPath(); c.arc(dx0 + ex * r, dyy + ey * r, r * 0.13, 0, Math.PI * 2); c.fill(); });
    c.beginPath(); c.ellipse(dx0, dyy + r * 0.18, r * 0.16, r * 0.11, 0, 0, Math.PI * 2); c.fill();
    if (pid === null && idle > 1.5 && !api.won) { c.strokeStyle = '#ff8a1f'; c.lineWidth = 5; c.beginPath(); c.arc(dx0, dyy, r * 1.45 + Math.sin(t * 6) * 4, 0, Math.PI * 2); c.stroke(); }
  };
  let tt = 0; api.onStep((dt) => { tt += dt; idle += dt; draw(tt); });
  say('Leve o cachorrinho até a casinha!');
  Object.assign(api, { kind: 'maze', C, R, cur: () => cur.slice(), goal, open, solve, cellCenter: (x, y) => { const r = cv.getBoundingClientRect(); const [a, b] = center(x, y); return [r.x + a * (r.width / W), r.y + b * (r.height / H)]; } });
  draw(0);
  return api;
}

// ------------------------------------------------------------------ pegar maçãs (fase 4)
const APPLES = { facil: { goal: 8, sp: 150, every: 1.0, rock: 0, bw: 190 }, aventura: { goal: 10, sp: 200, every: 0.85, rock: 0.12, bw: 160 }, desafio: { goal: 12, sp: 250, every: 0.7, rock: 0.22, bw: 140 } };
export function startApples(root, o) {
  const mode = o.mode || 'facil', rng = o.rng || Math.random, cfg = APPLES[mode];
  const { U, api, S, say } = shell(root, 'apple', o);
  const { cv, c, W, H, pos } = canvasIn(U);
  const by = H - 54; let bx = W / 2, tx = W / 2, got = 0, spawnT = 0.4, items = [], shake = 0, pops = [];
  api.setProg(0, cfg.goal, '🍎');
  const setX = (e) => { tx = Math.max(cfg.bw / 2, Math.min(W - cfg.bw / 2, pos(e)[0])); };
  cv.addEventListener('pointerdown', (e) => { e.preventDefault(); setX(e); try { cv.setPointerCapture(e.pointerId); } catch (x) { /* ok */ } });
  cv.addEventListener('pointermove', (e) => { if (e.buttons || e.pointerType === 'touch') setX(e); });
  const draw = (t) => {
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#8fd8ff'); g.addColorStop(1, '#e6f7ff'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.fillStyle = '#5fc95e'; c.fillRect(0, H - 30, W, 30);
    // copa das árvores no alto
    for (let i = 0; i < 9; i++) { const x = (i + 0.5) * W / 9; c.fillStyle = i % 2 ? '#3fb04a' : '#4cc65a'; c.beginPath(); c.ellipse(x, 6, W / 9 * 0.75, 52, 0, 0, Math.PI * 2); c.fill(); }
    for (let i = 0; i < 12; i++) { const x = (i + 0.3) * W / 12; c.fillStyle = '#ff4d4d'; c.beginPath(); c.arc(x, 30 + (i % 3) * 8, 7, 0, Math.PI * 2); c.fill(); }
    items.forEach((it) => {
      c.save(); c.translate(it.x, it.y); c.rotate(it.rot);
      if (it.kind === 'apple') { c.fillStyle = '#ff4d4d'; c.beginPath(); c.arc(0, 0, 20, 0, Math.PI * 2); c.fill(); stroke(c, 4); c.fillStyle = '#ffffff88'; c.beginPath(); c.arc(-7, -7, 6, 0, Math.PI * 2); c.fill(); c.fillStyle = '#3ecb6b'; c.beginPath(); c.ellipse(6, -22, 9, 5, -0.5, 0, Math.PI * 2); c.fill(); stroke(c, 3); }
      else { c.fillStyle = '#8a8f9c'; c.beginPath(); c.moveTo(-20, 6); c.lineTo(-12, -16); c.lineTo(10, -18); c.lineTo(22, 2); c.lineTo(8, 18); c.lineTo(-14, 16); c.closePath(); c.fill(); stroke(c, 4); }
      c.restore();
    });
    pops.forEach((p) => { c.globalAlpha = Math.max(0, p.t); star5(c, p.x, p.y - (1 - p.t) * 40, 12); c.globalAlpha = 1; });
    // cesta
    const sx = bx + (shake > 0 ? Math.sin(t * 60) * 8 * shake : 0), bw = cfg.bw;
    for (let k = 0; k < Math.min(got, 8); k++) { c.fillStyle = '#ff4d4d'; c.beginPath(); c.arc(sx - bw * 0.3 + (k % 4) * bw * 0.2, by - 6 - Math.floor(k / 4) * 12, 13, 0, Math.PI * 2); c.fill(); stroke(c, 3); }
    c.fillStyle = '#c2864a'; c.beginPath(); c.moveTo(sx - bw / 2, by); c.lineTo(sx + bw / 2, by); c.lineTo(sx + bw * 0.38, by + 46); c.lineTo(sx - bw * 0.38, by + 46); c.closePath(); c.fill(); stroke(c, 5);
    c.strokeStyle = '#8a5a2e'; c.lineWidth = 4; for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(sx - bw / 2 + k * 6, by + k * 11); c.lineTo(sx + bw / 2 - k * 6, by + k * 11); c.stroke(); }
  };
  let tt = 0;
  api.onStep((dt) => {
    tt += dt; if (shake > 0) shake -= dt; bx += (tx - bx) * Math.min(1, dt * 14);
    if (!api.won && !api.over) {
      spawnT -= dt;
      if (spawnT <= 0) { spawnT = cfg.every * (0.8 + rng() * 0.4); items.push({ x: 40 + rng() * (W - 80), y: 40, vy: cfg.sp * (0.85 + rng() * 0.3), rot: 0, vr: (rng() - 0.5) * 3, kind: rng() < cfg.rock ? 'rock' : 'apple' }); }
      items.forEach((it) => { it.y += it.vy * dt; it.rot += it.vr * dt;
        if (!it.done && it.y > by - 14 && it.y < by + 30 && Math.abs(it.x - bx) < cfg.bw / 2) { it.done = true; if (it.kind === 'apple') { got++; S('star'); pops.push({ x: it.x, y: by - 20, t: 1 }); api.setProg(got, cfg.goal, '🍎'); if (got >= cfg.goal) api.win(); } else { got = Math.max(0, got - 1); shake = 0.5; S('hit'); api.setProg(got, cfg.goal, '🍎'); } }
        if (it.y > H + 30) it.done = true; });
      items = items.filter((it) => !it.done);
    }
    pops.forEach((p) => { p.t -= dt * 1.6; }); pops = pops.filter((p) => p.t > 0);
    draw(tt);
  });
  say('Pegue as maçãs com a cesta!');
  Object.assign(api, { kind: 'apples', cfg, got: () => got, items: () => items, basket: () => bx, setBasket: (x) => { tx = x; bx = x; }, canvasRect: () => cv.getBoundingClientRect(), W, H });
  draw(0);
  return api;
}

// ------------------------------------------------------------------ mirar a mangueira (fase 5) e esfriar a lava (fase 7)
const AIM = { facil: { goal: 8, life: 2.8, max: 1, every: 1.0, grid: [4, 2], sp: 70 }, aventura: { goal: 10, life: 2.1, max: 2, every: 0.85, grid: [5, 2], sp: 95 }, desafio: { goal: 12, life: 1.6, max: 2, every: 0.7, grid: [5, 3], sp: 120 } };
export function startAim(root, o) {
  const mode = o.mode || 'facil', rng = o.rng || Math.random, cfg = AIM[mode], lava = o.variant === 'lava';
  const { U, api, S, say } = shell(root, lava ? 'lava' : 'hose', o);
  const { cv, c, W, H, pos } = canvasIn(U);
  const [GC, GR] = cfg.grid, fw = Math.min(W * 0.62, 620), fh = H - 70, fx = (W - fw) / 2, fy = 20;
  const win = (i) => { const cx = i % GC, cy = Math.floor(i / GC); const ww = fw / GC, wh = (fh - 60) / GR; return { x: fx + ww * (cx + 0.5), y: fy + 30 + wh * (cy + 0.5), w: ww * 0.62, h: wh * 0.6 }; };
  const nozzle = [W / 2, H - 6];
  let got = 0, spawnT = 0.5, targets = [], shots = [], puffs = [];
  api.setProg(0, cfg.goal, lava ? '🪨' : '🔥');
  const hit = (t) => { t.dead = true; got++; S('star'); api.setProg(got, cfg.goal, lava ? '🪨' : '🔥'); for (let k = 0; k < 8; k++) puffs.push({ x: t.x, y: t.y, vx: (rng() - 0.5) * 120, vy: -40 - rng() * 80, t: 1, col: lava ? '#9aa0a8' : '#e9f3ff' }); if (got >= cfg.goal) api.win(); };
  cv.addEventListener('pointerdown', (e) => {
    e.preventDefault(); if (api.won || api.over) return; const [x, y] = pos(e);
    let best = null, bd = Infinity;
    targets.forEach((t) => { if (t.dead || t.shot) return; const d = Math.hypot(t.x - x, t.y - y); const rad = lava ? 58 : Math.max(52, t.w * 0.75); if (d < rad && d < bd) { bd = d; best = t; } });
    shots.push({ x0: nozzle[0], y0: nozzle[1], x1: best ? best.x : x, y1: best ? best.y : y, t: 0, target: best }); if (best) best.shot = true; S('tap');
  });
  const drawFlame = (x, y, s, t) => { const f = (k, col, sc) => { c.fillStyle = col; c.beginPath(); c.moveTo(x, y - s * sc * (1.2 + Math.sin(t * 14 + k) * 0.12)); c.quadraticCurveTo(x + s * sc * 0.8, y - s * sc * 0.2, x, y + s * sc * 0.5); c.quadraticCurveTo(x - s * sc * 0.8, y - s * sc * 0.2, x, y - s * sc * (1.2 + Math.sin(t * 14 + k) * 0.12)); c.fill(); }; f(0, '#ff5a1f', 1); f(1, '#ffb02e', 0.68); f(2, '#fff27a', 0.38); };
  const draw = (t) => {
    const g = c.createLinearGradient(0, 0, 0, H);
    if (lava) { g.addColorStop(0, '#ff9a6b'); g.addColorStop(1, '#ffd9a0'); } else { g.addColorStop(0, '#7fd0ff'); g.addColorStop(1, '#dff4ff'); }
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    if (lava) {
      // vulcão ao fundo, vila embaixo
      c.fillStyle = '#7a4a34'; c.beginPath(); c.moveTo(W * 0.18, H); c.lineTo(W * 0.43, 40); c.lineTo(W * 0.57, 40); c.lineTo(W * 0.82, H); c.closePath(); c.fill(); stroke(c, 5);
      c.fillStyle = '#ff6a1a'; c.beginPath(); c.ellipse(W / 2, 42, W * 0.07, 14, 0, 0, Math.PI * 2); c.fill(); stroke(c, 4);
      c.fillStyle = '#ff8a2e'; c.beginPath(); c.moveTo(W * 0.47, 44); c.quadraticCurveTo(W * 0.45, H * 0.4, W * 0.4, H * 0.62); c.lineTo(W * 0.44, H * 0.62); c.quadraticCurveTo(W * 0.5, H * 0.35, W * 0.53, 44); c.fill();
      c.fillStyle = '#6fcf6a'; c.fillRect(0, H - 34, W, 34);
      for (let i = 0; i < 5; i++) { const x = W * (0.1 + i * 0.2); c.fillStyle = ['#ffd66b', '#ff9fb2', '#86dcff', '#c6a2ff', '#ffd66b'][i]; c.fillRect(x - 26, H - 70, 52, 40); stroke(c, 3); c.fillStyle = '#e8352f'; c.beginPath(); c.moveTo(x - 34, H - 70); c.lineTo(x, H - 96); c.lineTo(x + 34, H - 70); c.closePath(); c.fill(); stroke(c, 3); }
    } else {
      c.fillStyle = '#c9b8a6'; c.beginPath(); c.roundRect(fx, fy, fw, fh, 10); c.fill(); stroke(c, 5);
      c.fillStyle = '#8a6a5a'; c.fillRect(fx - 10, fy - 6, fw + 20, 18); stroke(c, 4);
      for (let i = 0; i < GC * GR; i++) { const w = win(i); c.fillStyle = '#a8e2ff'; c.beginPath(); c.roundRect(w.x - w.w / 2, w.y - w.h / 2, w.w, w.h, 6); c.fill(); stroke(c, 4); c.strokeStyle = '#ffffff99'; c.lineWidth = 3; c.beginPath(); c.moveTo(w.x, w.y - w.h / 2); c.lineTo(w.x, w.y + w.h / 2); c.stroke(); }
      c.fillStyle = '#7a8499'; c.fillRect(0, H - 22, W, 22);
    }
    targets.forEach((tg) => {
      if (tg.dead) return; const a = Math.min(1, tg.age * 4, tg.left * 3);
      c.globalAlpha = Math.max(0, a);
      if (lava) { c.save(); c.translate(tg.x, tg.y); c.rotate(tg.rot); c.fillStyle = '#ff5a1f'; c.beginPath(); c.arc(0, 0, 26, 0, Math.PI * 2); c.fill(); stroke(c, 4); c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(-6, -6, 9, 0, Math.PI * 2); c.fill(); c.restore(); }
      else drawFlame(tg.x, tg.y + tg.h * 0.2, Math.min(tg.w, tg.h) * 0.55, t + tg.seed);
      c.globalAlpha = 1;
    });
    // mangueira e jatos de água
    c.fillStyle = '#e8352f'; c.beginPath(); c.roundRect(nozzle[0] - 22, nozzle[1] - 34, 44, 40, 8); c.fill(); stroke(c, 4);
    c.fillStyle = '#ffd23f'; c.beginPath(); c.roundRect(nozzle[0] - 10, nozzle[1] - 52, 20, 22, 4); c.fill(); stroke(c, 3);
    shots.forEach((s) => { const u = Math.min(1, s.t / 0.25); c.strokeStyle = 'rgba(80,170,255,.85)'; c.lineWidth = 10; c.lineCap = 'round'; c.beginPath(); c.moveTo(s.x0, s.y0 - 50); const mx = (s.x0 + s.x1) / 2, my = Math.min(s.y0, s.y1) - 80; const ex = s.x0 + (s.x1 - s.x0) * u, ey = (1 - u) * (1 - u) * (s.y0 - 50) + 2 * u * (1 - u) * my + u * u * s.y1; c.quadraticCurveTo(s.x0 + (mx - s.x0) * u, (s.y0 - 50) + (my - (s.y0 - 50)) * u, ex, ey); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 3; c.stroke(); });
    puffs.forEach((p) => { c.globalAlpha = Math.max(0, p.t); c.fillStyle = p.col; c.beginPath(); c.arc(p.x, p.y, 10 + (1 - p.t) * 14, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1; });
  };
  let tt = 0;
  api.onStep((dt) => {
    tt += dt;
    if (!api.won && !api.over) {
      spawnT -= dt;
      const alive = targets.filter((t) => !t.dead && !t.shot);
      if (spawnT <= 0 && alive.length < cfg.max) {
        spawnT = cfg.every * (0.8 + rng() * 0.4);
        if (lava) targets.push({ x: W / 2 + (rng() - 0.5) * 30, y: 46, vx: (rng() - 0.5) * W * 0.5, vy: -60 - rng() * 60, age: 0, left: 99, rot: 0, seed: rng() * 9 });
        else { const used = new Set(targets.filter((t) => !t.dead).map((t) => t.i)); const free = Array.from({ length: GC * GR }, (_, i) => i).filter((i) => !used.has(i)); if (free.length) { const i = free[Math.floor(rng() * free.length)], w = win(i); targets.push({ i, x: w.x, y: w.y, w: w.w, h: w.h, age: 0, left: cfg.life, seed: rng() * 9 }); } }
      }
      targets.forEach((t) => {
        t.age += dt;
        if (lava) { t.vy += cfg.sp * 1.4 * dt; t.vx *= 0.995; t.x += t.vx * dt; t.y += t.vy * dt * 0.6; t.rot += dt * 3; if (t.x < 30 || t.x > W - 30) t.vx *= -1; if (t.y > H - 40 && !t.dead) { t.dead = true; for (let k = 0; k < 5; k++) puffs.push({ x: t.x, y: H - 40, vx: (rng() - 0.5) * 80, vy: -30, t: 0.8, col: '#ff8a2e' }); } }
        else if (!t.shot) { t.left -= dt; if (t.left <= 0) t.dead = true; }
      });
    }
    shots.forEach((s) => { s.t += dt; if (s.t >= 0.25 && !s.done) { s.done = true; if (s.target && !s.target.dead) hit(s.target); } });
    shots = shots.filter((s) => s.t < 0.4); targets = targets.filter((t) => !t.dead);
    puffs.forEach((p) => { p.t -= dt * 1.5; p.x += p.vx * dt; p.y += p.vy * dt; }); puffs = puffs.filter((p) => p.t > 0);
    draw(tt);
  });
  say(lava ? 'Toque nas pedras de lava para esfriar!' : 'Toque no fogo para jogar água!');
  Object.assign(api, { kind: lava ? 'lava' : 'hose', cfg, got: () => got, targets: () => targets, toClient: (x, y) => { const r = cv.getBoundingClientRect(); return [r.x + x * (r.width / W), r.y + y * (r.height / H)]; } });
  draw(0);
  return api;
}

// ------------------------------------------------------------------ caminho (fase 6: guiar o barco até a boia)
const BOAT = { facil: { segs: 3, tol: 76, speed: 13 }, aventura: { segs: 4, tol: 58, speed: 13 }, desafio: { segs: 5, tol: 44, speed: 15 } };
export function startBoat(root, o) {
  const mode = o.mode || 'facil', rng = o.rng || Math.random, cfg = BOAT[mode];
  const { U, api, S, say } = shell(root, 'boat', o);
  const { cv, c, W, H, pos } = canvasIn(U);
  const n = cfg.segs + 2, pts = [];
  for (let i = 0; i < n; i++) { const x = W * (0.09 + 0.8 * i / (n - 1)); const y = H * (i === 0 ? 0.78 : i === n - 1 ? 0.25 : (i % 2 ? 0.2 + rng() * 0.12 : 0.66 + rng() * 0.12)); pts.push([x, y]); }
  const path = catmull(pts);
  let head = 0, target = 0, pid = null, shake = 0;
  const stars = []; for (let i = 20; i < path.length - 10; i += Math.max(14, Math.floor(path.length / 10))) stars.push({ i, got: false });
  const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
  cv.addEventListener('pointerdown', (e) => { if (api.won || api.over || pid !== null) return; e.preventDefault(); const p = pos(e); if (d2(p, path[Math.floor(head)]) < (cfg.tol * 1.9) ** 2) { pid = e.pointerId; try { cv.setPointerCapture(e.pointerId); } catch (x) { /* ok */ } } else shake = 0.4; });
  cv.addEventListener('pointermove', (e) => { if (e.pointerId !== pid) return; const p = pos(e); let best = -1, bd = Infinity; const a = Math.max(0, Math.floor(head) - 6), b = Math.min(path.length - 1, Math.floor(head) + 46); for (let i = a; i <= b; i++) { const d = d2(p, path[i]); if (d < bd) { bd = d; best = i; } } if (best >= 0 && bd < cfg.tol * cfg.tol) target = Math.max(target, best); else shake = 0.25; });
  const up = (e) => { if (e.pointerId === pid) pid = null; };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  const draw = (t) => {
    c.fillStyle = '#7ad36a'; c.fillRect(0, 0, W, H);
    const trace = () => { c.beginPath(); path.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); };
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.strokeStyle = '#e9d29a'; c.lineWidth = cfg.tol * 2 + 22; trace(); c.stroke();
    c.strokeStyle = '#2f8fe0'; c.lineWidth = cfg.tol * 2; trace(); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 4; c.setLineDash([16, 26]); c.lineDashOffset = -t * 40; trace(); c.stroke(); c.setLineDash([]);
    stars.forEach((s) => { if (!s.got) { const [x, y] = path[s.i]; star5(c, x, y + Math.sin(t * 3 + s.i) * 3, 16); } });
    // boia e cachorrinho esperando no fim
    const [ex, ey] = path[path.length - 1];
    c.lineWidth = 12; c.strokeStyle = '#ffffff'; c.beginPath(); c.arc(ex, ey, 30, 0, Math.PI * 2); c.stroke(); c.strokeStyle = '#e8352f'; c.setLineDash([22, 25]); c.beginPath(); c.arc(ex, ey, 30, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
    c.fillStyle = '#d9944a'; c.beginPath(); c.arc(ex, ey - 4, 16, 0, Math.PI * 2); c.fill(); stroke(c, 3); c.fillStyle = INK; c.beginPath(); c.arc(ex - 5, ey - 7, 2.5, 0, Math.PI * 2); c.arc(ex + 5, ey - 7, 2.5, 0, Math.PI * 2); c.fill();
    // barco
    const hi = Math.floor(head), [hx0, hy] = path[hi], hx = hx0 + (shake > 0 ? Math.sin(t * 50) * 5 * shake : 0);
    const nx = path[Math.min(path.length - 1, hi + 3)], dir = Math.atan2(nx[1] - hy, nx[0] - hx0);
    for (let k = 1; k < 6; k++) { const [wx, wy] = path[Math.max(0, hi - k * 5)]; c.globalAlpha = 0.5 - k * 0.08; c.fillStyle = '#ffffff'; c.beginPath(); c.arc(wx, wy, 10 - k, 0, Math.PI * 2); c.fill(); }
    c.globalAlpha = 1;
    c.save(); c.translate(hx, hy); c.rotate(dir);
    c.fillStyle = '#e8352f'; c.beginPath(); c.moveTo(-34, -16); c.lineTo(26, -16); c.lineTo(40, 0); c.lineTo(26, 16); c.lineTo(-34, 16); c.closePath(); c.fill(); stroke(c, 4);
    c.fillStyle = '#fff'; c.beginPath(); c.roundRect(-20, -10, 26, 20, 5); c.fill(); stroke(c, 3);
    c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(-26, 0, 6, 0, Math.PI * 2); c.fill();
    c.restore();
    if (head < 1 && !api.won && pid === null) { c.strokeStyle = '#ff8a1f'; c.lineWidth = 6; c.beginPath(); c.arc(hx, hy, 46 + Math.sin(t * 6) * 6, 0, Math.PI * 2); c.stroke(); }
  };
  let tt = 0, got = 0;
  api.onStep((dt) => {
    tt += dt; if (shake > 0) shake -= dt;
    if (!api.won && !api.over) {
      if (target > head) head = Math.min(target, head + cfg.speed * dt * 60 * 0.6 + (target - head) * 0.15);
      stars.forEach((s) => { if (!s.got && head >= s.i) { s.got = true; got++; S('star'); } });
      if (head >= path.length - 2) api.win();
    }
    draw(tt);
  });
  say('Guie o barco até a boia!');
  Object.assign(api, { kind: 'boat', path, head: () => head, toClient: (x, y) => { const r = cv.getBoundingClientRect(); return [r.x + x * (r.width / W), r.y + y * (r.height / H)]; } });
  draw(0);
  return api;
}

/** abre o desafio da fase. kind: jigsaw4, maze, jigsaw5, apples, hose, boat, lava */
export function startMinigame(root, kind, o) {
  const opt = { time: 30, ...o };
  switch (kind) {
    case 'jigsaw5': return startJigsaw(root, { ...opt, cols: 5, rows: 5 });
    case 'maze': return startMaze(root, opt);
    case 'apples': return startApples(root, opt);
    case 'hose': return startAim(root, { ...opt, variant: 'hose' });
    case 'lava': return startAim(root, { ...opt, variant: 'lava' });
    case 'boat': case 'snake': return startBoat(root, opt);
    case 'jigsaw4': case 'puzzle': default: return startJigsaw(root, { ...opt, cols: 4, rows: 4 });
  }
}
