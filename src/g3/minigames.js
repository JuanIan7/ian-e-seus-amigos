// Minijogos opcionais de toque: quebra-cabeça e caminho da cobrinha.
// Tudo é desenhado por código (sem imagens externas). O jogo fica pausado enquanto o minijogo está aberto.
// Dificuldade: fácil = poucas peças, ajuda visual e caminho largo; difícil = mais peças e, na cobrinha, barra de tempo.
import { ICONS } from './hud.js';

const css = `
.g3 .mini{position:absolute;inset:0;background:rgba(20,34,64,.62);display:flex;align-items:center;justify-content:center;pointer-events:auto;touch-action:none;z-index:20;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)}
.g3 .mini .card{position:relative;width:min(94vw,1200px);height:min(88vh,640px);background:linear-gradient(#fff6d8,#ffe9a8);border:6px solid #1b2a49;border-radius:30px;box-shadow:0 10px 0 rgba(27,42,73,.5);overflow:hidden;touch-action:none}
.g3 .mini .mhead{position:absolute;left:0;right:0;top:0;height:72px;display:flex;align-items:center;gap:16px;padding:0 16px;pointer-events:none}
.g3 .mini .micon{width:56px;height:56px;border-radius:50%;background:#2f9bff;border:4px solid #1b2a49;display:flex;align-items:center;justify-content:center}
.g3 .mini .micon svg{width:70%;height:70%}
.g3 .mini .mtime{flex:1;height:22px;border-radius:14px;background:rgba(0,0,0,.18);border:4px solid #1b2a49;overflow:hidden;display:none}
.g3 .mini .mtime i{display:block;height:100%;width:100%;background:#3ecb6b;border-radius:10px}
.g3 .mini .mclose{position:absolute;right:14px;top:8px;width:56px;height:56px;border-radius:50%;background:#2f9bff;border:4px solid #1b2a49;display:flex;align-items:center;justify-content:center;pointer-events:auto;cursor:pointer;box-shadow:0 4px 0 rgba(27,42,73,.5)}
.g3 .mini .mclose svg{width:60%;height:60%}
.g3 .mini .mbody{position:absolute;inset:72px 0 0 0;touch-action:none}
.g3 .mini .slot{position:absolute;border:4px dashed rgba(27,42,73,.45);border-radius:10px;box-sizing:border-box;overflow:hidden}
.g3 .mini .slot.hint{animation:minihint .6s ease-in-out infinite;border-color:#ff8a1f}
@keyframes minihint{0%,100%{box-shadow:0 0 0 0 rgba(255,138,31,.0)}50%{box-shadow:0 0 0 10px rgba(255,138,31,.55)}}
.g3 .mini .piece{position:absolute;border:4px solid #1b2a49;border-radius:10px;box-sizing:border-box;cursor:grab;touch-action:none;box-shadow:0 5px 0 rgba(27,42,73,.45);transition:left .25s,top .25s,transform .25s}
.g3 .mini .piece.drag{transition:none;transform:scale(1.06) rotate(0deg)!important;box-shadow:0 12px 0 rgba(27,42,73,.35)}
.g3 .mini .piece.ok{box-shadow:none;cursor:default;border-color:rgba(27,42,73,.35)}
.g3 .mini .piece.pulse{animation:minipulse .8s ease-in-out infinite}
@keyframes minipulse{0%,100%{filter:brightness(1)}50%{filter:brightness(1.25)}}
.g3 .mini .win{position:absolute;inset:0;display:none;align-items:center;justify-content:center;flex-direction:column;gap:10px;background:rgba(255,246,216,.82);font-size:min(14vh,90px);text-align:center;color:#1b2a49}
.g3 .mini .win b{font-size:min(18vh,120px);font-weight:400;animation:miniwin .8s ease-out}
.g3 .mini .win span{font-size:min(7vh,36px)}
@keyframes miniwin{0%{transform:scale(.2) rotate(-20deg);opacity:0}70%{transform:scale(1.2) rotate(6deg);opacity:1}100%{transform:scale(1) rotate(0)}}
.g3 .mini .again{display:none;position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);gap:24px;align-items:center}
.g3 .mini .again .btn{position:static!important;width:min(22vh,110px);height:min(22vh,110px)}
.g3 .mini canvas{position:absolute;left:0;top:0;touch-action:none}
`;

const svgIcon = (body) => `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
export const MINI_ICONS = {
  puzzle: svgIcon('<path d="M14 30 H40 a10 10 0 1 1 20 0 H86 V56 a10 10 0 1 0 0 20 V86 H60 a10 10 0 1 0 -20 0 H14 V60 a10 10 0 1 1 0 -20 Z" fill="#fff" stroke="#1b2a49" stroke-width="5" stroke-linejoin="round"/>'),
  snake: svgIcon('<path d="M12 78 C12 40 44 70 50 44 C56 18 88 40 88 22" fill="none" stroke="#fff" stroke-width="16" stroke-linecap="round"/><circle cx="88" cy="22" r="9" fill="#3ecb6b" stroke="#1b2a49" stroke-width="4"/>'),
  close: svgIcon('<path d="M24 24 L76 76 M76 24 L24 76" stroke="#fff" stroke-width="14" stroke-linecap="round"/>'),
};

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

// ------------------------------------------------------------------ montagem do cartão
function makeCard(root, icon) {
  if (!document.getElementById('g3-mini-css')) { const st = document.createElement('style'); st.id = 'g3-mini-css'; st.textContent = css; document.head.appendChild(st); }
  const wrap = document.createElement('div'); wrap.className = 'mini';
  wrap.innerHTML = `<div class="card"><div class="mhead"><div class="micon">${MINI_ICONS[icon]}</div><div class="mtime"><i></i></div></div><div class="mclose">${MINI_ICONS.close}</div><div class="mbody"></div><div class="win"><b>⭐</b><span></span></div></div>`;
  root.appendChild(wrap);
  return { wrap, card: wrap.querySelector('.card'), body: wrap.querySelector('.mbody'), close: wrap.querySelector('.mclose'), time: wrap.querySelector('.mtime'), timeBar: wrap.querySelector('.mtime i'), win: wrap.querySelector('.win') };
}

export const PUZZLE_COUNTS = { facil: [2, 3, 4], aventura: [4, 5, 6], desafio: [6, 7, 9] };
const GRIDS = { 2: [2, 1, 0], 3: [3, 1, 0], 4: [2, 2, 0], 5: [3, 2, 1], 6: [3, 2, 0], 7: [4, 2, 1], 8: [4, 2, 0], 9: [3, 3, 0] };    // colunas, linhas, peças já colocadas

/** quebra-cabeça: arraste as peças para os encaixes */
export function startPuzzle(root, o) {
  const { mode = 'facil', rng = Math.random, onWin = () => {}, onClose = () => {}, sfx = {}, speak = () => {} } = o;
  const U = makeCard(root, 'puzzle'); let alive = true;
  const counts = PUZZLE_COUNTS[mode], pieces = o.pieces || counts[Math.floor(rng() * counts.length)];
  const [cols, rows, fixed] = GRIDS[pieces];
  const pic = document.createElement('canvas'); pic.width = 600; pic.height = 400; PICTURES[Math.floor(rng() * PICTURES.length)](pic.getContext('2d'), 600, 400);
  const url = pic.toDataURL();
  const ghost = mode === 'facil' ? 0.3 : mode === 'aventura' ? 0.16 : 0.06, snapK = mode === 'facil' ? 0.85 : mode === 'aventura' ? 0.62 : 0.5;
  const api = { pieces, cols, rows, fixed, mode, placed: 0, destroy() { alive = false; clearInterval(hintT); U.wrap.remove(); } };
  let hintT = null;
  const layout = () => {
    const W = U.card.clientWidth, H = U.card.clientHeight - 72;
    const bw = Math.min(W * (pieces <= 4 ? 0.48 : 0.56), (H - 24) * 1.5), bh = bw / 1.5, bx = W * 0.04, by = (H - bh) / 2;
    const cw = bw / cols, ch = bh / rows;
    const trayX = bx + bw + W * 0.03, trayW = W - trayX - W * 0.03, trayY = 6, trayH = H - 12;
    return { W, H, bw, bh, bx, by, cw, ch, trayX, trayW, trayY, trayH };
  };
  let L = layout();
  // encaixes (com a figura esmaecida de fundo, ajuda para os pequenos)
  const slots = [], list = [];
  const cells = []; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.push([c, r]);
  for (let i = 0; i < cells.length; i++) {
    const [c, r] = cells[i]; const s = document.createElement('div'); s.className = 'slot';
    s.style.cssText = `left:${L.bx + c * L.cw}px;top:${L.by + r * L.ch}px;width:${L.cw}px;height:${L.ch}px;background:url(${url});background-size:${L.bw}px ${L.bh}px;background-position:${-c * L.cw}px ${-r * L.ch}px`;
    const veil = document.createElement('div'); veil.style.cssText = `position:absolute;inset:0;background:rgba(255,246,216,${1 - ghost})`; s.appendChild(veil);
    U.body.appendChild(s); slots.push(s);
  }
  // quais peças já nascem no lugar (modos com 5 ou 7 peças)
  const order = cells.map((_, i) => i); for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  const fixedSet = new Set(order.slice(0, fixed));
  cells.forEach(([c, r], i) => {
    const p = document.createElement('div'); p.className = 'piece'; p.dataset.i = i;
    p.style.cssText = `width:${L.cw}px;height:${L.ch}px;background:url(${url});background-size:${L.bw}px ${L.bh}px;background-position:${-c * L.cw}px ${-r * L.ch}px`;
    p.homeX = 0; p.homeY = 0; p.ok = false; p.cell = i; U.body.appendChild(p); list.push(p);
    if (fixedSet.has(i)) { snap(p, true); }
  });
  function snap(p, silent) {
    const [c, r] = cells[p.cell]; p.style.left = (L.bx + c * L.cw) + 'px'; p.style.top = (L.by + r * L.ch) + 'px'; p.style.transform = 'none'; p.classList.add('ok'); p.classList.remove('drag', 'pulse'); p.ok = true; p.style.zIndex = 1;
    slots[p.cell].classList.remove('hint'); if (!silent) { api.placed++; sfx.star && sfx.star(); }
  }
  const loose = list.filter((p) => !p.ok);
  const scatter = () => {
    // as peças soltas ficam menores na bandeja (e crescem ao serem seguradas) para caberem sem se sobrepor
    const n = loose.length; let sc = 1, nx = 1, rowsN = n;
    for (sc = 1; sc > 0.3; sc -= 0.04) { nx = Math.max(1, Math.floor(L.trayW / (L.cw * sc + 8))); rowsN = Math.ceil(n / nx); if (rowsN * (L.ch * sc + 8) <= L.trayH && nx * (L.cw * sc + 8) <= L.trayW + 1) break; }
    const cellW = L.trayW / nx, cellH = L.trayH / rowsN; api.trayScale = sc;
    loose.forEach((p, k) => {
      const cx = k % nx, cy = Math.floor(k / nx);
      const px = L.trayX + cellW * (cx + 0.5) + (rng() - 0.5) * Math.max(0, cellW - L.cw * sc) * 0.5, py = L.trayY + cellH * (cy + 0.5) + (rng() - 0.5) * Math.max(0, cellH - L.ch * sc) * 0.5;
      p.homeX = px - L.cw / 2; p.homeY = py - L.ch / 2; p.rot = (rng() - 0.5) * 12; p.sc = sc;
      p.style.left = p.homeX + 'px'; p.style.top = p.homeY + 'px'; p.style.transform = `rotate(${p.rot}deg) scale(${sc})`; p.style.zIndex = 2 + k; p.classList.add('pulse');
    });
  };
  scatter();
  let z = 100;
  list.forEach((p) => {
    if (p.ok) return;
    let drag = null;
    p.addEventListener('pointerdown', (e) => {
      if (p.ok || drag) return; e.preventDefault(); e.stopPropagation(); const br = U.body.getBoundingClientRect();
      drag = { id: e.pointerId, dx: e.clientX - br.left - parseFloat(p.style.left), dy: e.clientY - br.top - parseFloat(p.style.top) };
      try { p.setPointerCapture(e.pointerId); } catch (x) { /* ok */ }
      p.classList.add('drag'); p.classList.remove('pulse'); p.style.zIndex = ++z; slots[p.cell].classList.remove('hint'); clearTimeout(p.hintT);
    });
    p.addEventListener('pointermove', (e) => { if (!drag || e.pointerId !== drag.id) return; const br = U.body.getBoundingClientRect(); p.style.left = (e.clientX - br.left - drag.dx) + 'px'; p.style.top = (e.clientY - br.top - drag.dy) + 'px'; });
    const up = (e) => {
      if (!drag || e.pointerId !== drag.id) return; drag = null; p.classList.remove('drag');
      const [c, r] = cells[p.cell]; const sx = L.bx + c * L.cw, sy = L.by + r * L.ch, dx = parseFloat(p.style.left) - sx, dy = parseFloat(p.style.top) - sy;
      if (Math.hypot(dx / L.cw, dy / L.ch) < snapK) { snap(p); check(); }
      else { p.style.left = p.homeX + 'px'; p.style.top = p.homeY + 'px'; p.style.transform = `rotate(${p.rot}deg) scale(${p.sc})`; p.classList.add('pulse'); sfx.tap && sfx.tap(); }
    };
    p.addEventListener('pointerup', up); p.addEventListener('pointercancel', up);
  });
  // ajuda: depois de alguns segundos sem mexer, o encaixe da próxima peça pisca
  let idle = 0; hintT = setInterval(() => { if (!alive) return; idle++; const nxt = list.find((p) => !p.ok); if (nxt && idle >= (mode === 'facil' ? 5 : 9)) slots[nxt.cell].classList.add('hint'); }, 1000);
  U.body.addEventListener('pointerdown', () => { idle = 0; });
  function check() {
    idle = 0;
    if (list.every((p) => p.ok) && alive) {
      api.won = true; clearInterval(hintT); sfx.win && sfx.win();
      slots.forEach((s) => { s.style.border = '0'; }); list.forEach((p) => { p.style.borderColor = 'transparent'; p.style.borderRadius = '0'; });
      U.win.style.display = 'flex'; U.win.style.background = 'rgba(255,246,216,0)'; U.win.querySelector('b').textContent = '⭐';
      setTimeout(() => { if (alive) onWin(api, U); }, 1100);
    }
  }
  U.close.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); if (!api.won) { api.destroy(); onClose(api); } });
  speak('Monte a figura!');
  const first = list.find((p) => !p.ok); if (!first) check();
  api.U = U; api.list = list; api.slots = slots; api.layout = () => L;
  return api;
}

// ------------------------------------------------------------------ caminho da cobrinha
const SNAKE = {
  facil: { segs: 3, tol: 74, time: 0, speed: 13 },
  aventura: { segs: 4, tol: 54, time: 0, speed: 13 },
  desafio: { segs: 5, tol: 40, time: 32, speed: 15 },
};
function catmull(pts, n = 18) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t; out.push([0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3), 0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]); }
  }
  out.push(pts[pts.length - 1]); return out;
}

/** cobrinha: arraste a cabeça pelo caminho até a bandeira */
export function startSnake(root, o) {
  const { mode = 'facil', rng = Math.random, onWin = () => {}, onClose = () => {}, sfx = {}, speak = () => {} } = o;
  const cfg = SNAKE[mode], U = makeCard(root, 'snake'); let alive = true, raf = 0;
  const cv = document.createElement('canvas'); U.body.appendChild(cv);
  const api = { mode, cfg, won: false, progress: 0, path: [], destroy() { alive = false; cancelAnimationFrame(raf); U.wrap.remove(); } };
  let W = 0, H = 0, path = [], head = 0, target = 0, dragging = false, stars = [], shake = 0, timeLeft = cfg.time, over = false, collected = 0;
  const build = () => {
    W = U.body.clientWidth; H = U.body.clientHeight; cv.width = W; cv.height = H; cv.style.width = W + 'px'; cv.style.height = H + 'px';
    const n = cfg.segs + 2, pts = [];
    for (let i = 0; i < n; i++) { const x = W * (0.1 + 0.8 * i / (n - 1)); const y = H * (i === 0 ? 0.78 : i === n - 1 ? 0.25 : (i % 2 ? 0.2 + rng() * 0.12 : 0.66 + rng() * 0.12)); pts.push([x, y]); }
    path = catmull(pts); api.path = path; head = 0; target = 0;
    stars = []; for (let i = 20; i < path.length - 10; i += Math.max(14, Math.floor(path.length / 14))) stars.push({ i, got: false });
  };
  build();
  const dist2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
  const pos = (e) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * (cv.width / r.width), (e.clientY - r.top) * (cv.height / r.height)]; };
  let pid = null;
  cv.addEventListener('pointerdown', (e) => {
    if (over || api.won || pid !== null) return; e.preventDefault(); const p = pos(e);
    if (dist2(p, path[Math.floor(head)]) < (cfg.tol * 1.8) ** 2) { pid = e.pointerId; dragging = true; try { cv.setPointerCapture(e.pointerId); } catch (x) { /* ok */ } }
    else shake = 0.4;
  });
  cv.addEventListener('pointermove', (e) => {
    if (!dragging || e.pointerId !== pid) return; const p = pos(e);
    // procura o ponto do caminho mais próximo, só um pouco à frente da cabeça (não dá para "pular" trechos)
    let best = -1, bd = Infinity; const a = Math.max(0, Math.floor(head) - 6), b = Math.min(path.length - 1, Math.floor(head) + 46);
    for (let i = a; i <= b; i++) { const d = dist2(p, path[i]); if (d < bd) { bd = d; best = i; } }
    if (best >= 0 && bd < cfg.tol * cfg.tol) target = Math.max(target, best); else shake = 0.25;
  });
  const up = (e) => { if (e.pointerId !== pid) return; dragging = false; pid = null; };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  const draw = () => {
    const c = cv.getContext('2d'); c.clearRect(0, 0, W, H);
    // estrada da cobrinha
    c.lineCap = 'round'; c.lineJoin = 'round';
    const trace = () => { c.beginPath(); path.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); };
    c.strokeStyle = INK; c.lineWidth = cfg.tol * 2 + 10; trace(); c.stroke();
    c.strokeStyle = '#ffe9a0'; c.lineWidth = cfg.tol * 2 - 2; trace(); c.stroke();
    c.strokeStyle = 'rgba(27,42,73,.22)'; c.lineWidth = 6; c.setLineDash([22, 22]); trace(); c.stroke(); c.setLineDash([]);
    // estrelas ao longo do caminho
    stars.forEach((s) => { if (s.got) return; const [x, y] = path[s.i]; c.save(); c.translate(x, y); c.rotate(Math.sin(performance.now() / 300 + s.i) * 0.2); c.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 9 : 20; k ? c.lineTo(Math.cos(a) * r, Math.sin(a) * r) : c.moveTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fillStyle = '#ffd23f'; c.fill(); stroke(c, 4); c.restore(); });
    // bandeira no fim
    const [ex, ey] = path[path.length - 1]; c.strokeStyle = INK; c.lineWidth = 8; c.beginPath(); c.moveTo(ex, ey + 30); c.lineTo(ex, ey - 54); c.stroke(); c.beginPath(); c.moveTo(ex, ey - 54); c.lineTo(ex + 54, ey - 36); c.lineTo(ex, ey - 18); c.closePath(); c.fillStyle = '#e8352f'; c.fill(); stroke(c, 5);
    // corpo e cabeça
    const hi = Math.floor(head), len = 7;
    for (let k = len; k >= 0; k--) { const i = Math.max(0, hi - k * 4), [x, y] = path[i]; c.beginPath(); c.arc(x, y, 22 - k * 1.2, 0, Math.PI * 2); c.fillStyle = k % 2 ? '#52cf62' : '#3ebd52'; c.fill(); stroke(c, 5); }
    const [hx0, hy0] = path[hi], sh = shake > 0 ? Math.sin(performance.now() / 20) * 5 * shake : 0, hx = hx0 + sh, hy = hy0;
    c.beginPath(); c.arc(hx, hy, 29, 0, Math.PI * 2); c.fillStyle = '#4fd566'; c.fill(); stroke(c, 6);
    const nx = path[Math.min(path.length - 1, hi + 3)], dir = Math.atan2(nx[1] - hy0, nx[0] - hx0);
    [-1, 1].forEach((sgn) => { const ex2 = hx + Math.cos(dir - 0.2 * sgn) * 6 - Math.sin(dir) * 0 + Math.cos(dir + Math.PI / 2) * 10 * sgn, ey2 = hy + Math.sin(dir + Math.PI / 2) * 10 * sgn + Math.sin(dir) * 6; c.beginPath(); c.arc(ex2, ey2, 8, 0, Math.PI * 2); c.fillStyle = '#fff'; c.fill(); stroke(c, 3); c.beginPath(); c.arc(ex2 + Math.cos(dir) * 2, ey2 + Math.sin(dir) * 2, 3.5, 0, Math.PI * 2); c.fillStyle = INK; c.fill(); });
    if (head < 1 && !api.won) { c.beginPath(); c.arc(hx, hy, 40 + Math.sin(performance.now() / 200) * 6, 0, Math.PI * 2); c.strokeStyle = '#ff8a1f'; c.lineWidth = 6; c.stroke(); }
  };
  let last = performance.now();
  const loop = (now) => {
    if (!alive) return; raf = requestAnimationFrame(loop); const dt = Math.min(0.05, (now - last) / 1000); last = now;
    api.step(dt); draw();
  };
  api.step = (dt) => {
    if (shake > 0) shake -= dt;
    if (!api.won && !over) {
      if (target > head) head = Math.min(target, head + cfg.speed * dt * 60 * 0.6 + (target - head) * 0.15);
      stars.forEach((s) => { if (!s.got && head >= s.i) { s.got = true; collected++; sfx.star && sfx.star(); } });
      api.progress = head / (path.length - 1);
      if (cfg.time && head > 0.5 && !over) { timeLeft -= dt; U.timeBar.style.width = Math.max(0, timeLeft / cfg.time * 100) + '%'; U.timeBar.style.background = timeLeft < cfg.time * 0.25 ? '#ff5a3c' : '#3ecb6b'; if (timeLeft <= 0) timeUp(); }
      if (head >= path.length - 2) win();
    }
  };
  function win() {
    if (api.won) return; api.won = true; api.progress = 1; sfx.win && sfx.win();
    U.win.style.display = 'flex'; U.win.style.background = 'rgba(255,246,216,.55)'; setTimeout(() => { if (alive) onWin(api, U); }, 1100);
  }
  function timeUp() {
    over = true; dragging = false; sfx.hit && sfx.hit(); speak('Quase! Vamos de novo?');
    const box = document.createElement('div'); box.className = 'again'; box.style.display = 'flex'; U.body.appendChild(box);
    const mk = (icon, bg, fn) => { const b = document.createElement('div'); b.className = 'btn'; b.style.cssText = `background:${bg};border:5px solid #1b2a49;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 7px 0 rgba(27,42,73,.55)`; b.innerHTML = icon; b.querySelector('svg').style.cssText = 'width:56%;height:56%'; b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); fn(); }); box.appendChild(b); };
    mk(ICONS.play, '#3ecb6b', () => { box.remove(); over = false; timeLeft = cfg.time; U.timeBar.style.width = '100%'; head = 0; target = 0; stars.forEach((s) => { s.got = false; }); });
    mk(ICONS.home, '#2f9bff', () => { api.destroy(); onClose(api); });
  }
  U.close.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); if (!api.won) { api.destroy(); onClose(api); } });
  if (cfg.time) U.time.style.display = 'block';
  speak('Siga o caminho até a bandeira!');
  api.U = U; api.stars = () => collected; api.head = () => head; api.resize = build;
  raf = requestAnimationFrame(loop);
  return api;
}

export function startMinigame(root, kind, o) { return kind === 'snake' ? startSnake(root, o) : startPuzzle(root, o); }
