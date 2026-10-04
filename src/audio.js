// Áudio 100% gerado por código (sem arquivos externos, sem licenças a registrar).
import { load } from './save.js';

let ctx = null, master = null, musicTimer = null;

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  try { ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination); } catch (e) { ctx = null; }
  return ctx;
}
export function unlock() { const c = ensure(); if (c && c.state === 'suspended') c.resume(); }
const on = () => load().sound;

function tone(freq, dur, { type = 'sine', vol = 0.25, slide = 0, delay = 0 } = {}) {
  if (!on()) return;
  const c = ensure(); if (!c) return;
  const t = c.currentTime + delay;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
}
function noise(dur, vol = 0.2, hp = 1500) {
  if (!on()) return;
  const c = ensure(); if (!c) return;
  const n = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  f.type = 'highpass'; f.frequency.value = hp; g.gain.value = vol;
  s.buffer = buf; s.connect(f); f.connect(g); g.connect(master); s.start();
}

export const sfx = {
  jump: () => tone(380, 0.22, { type: 'square', vol: 0.12, slide: 420 }),
  star: () => { tone(880, 0.1, { vol: 0.18 }); tone(1320, 0.14, { vol: 0.18, delay: 0.07 }); },
  hit: () => tone(180, 0.28, { type: 'triangle', vol: 0.3, slide: -120 }),
  splash: () => noise(0.25, 0.18, 2200),
  hose: () => { tone(520, 0.12, { type: 'triangle' }); tone(780, 0.12, { type: 'triangle', delay: 0.1 }); tone(1040, 0.2, { type: 'triangle', delay: 0.2 }); },
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, { type: 'triangle', vol: 0.22, delay: i * 0.11 })),
  bark: () => { tone(330, 0.1, { type: 'sawtooth', vol: 0.1, slide: -140 }); tone(300, 0.12, { type: 'sawtooth', vol: 0.1, slide: -140, delay: 0.15 }); },
  tap: () => tone(600, 0.08, { type: 'triangle', vol: 0.15 }),
};

// ---------------------------------------------------------------------------------------------
// Música: uma trilha própria para cada fase, sintetizada na hora (sem arquivos, sem licenças).
// Cada trilha tem andamento, escala, melodia, baixo, timbre e percussão diferentes; ao mudar de fase a música muda junto.
// Notação: números = semitons a partir da tônica; null = pausa. 16 passos por compasso (semicolcheias agrupadas de 2 em 2).
// ---------------------------------------------------------------------------------------------
const N = null;
export const TRACKS = {
  menu:     { bpm: 104, root: 60, lead: 'triangle', vol: 0.06, bassWave: 'sine', swing: 0, perc: 'soft',
    mel: [0, N, 4, N, 7, N, 4, N, 9, N, 7, N, 4, N, 2, N, 0, N, 4, N, 7, N, 12, N, 11, N, 9, N, 7, N, N, N],
    bass: [0, 0, 5, 5, 7, 7, 0, 0], chords: [[0, 4, 7], [5, 9, 12], [7, 11, 14], [0, 4, 7]] },
  bairro:   { bpm: 132, root: 60, lead: 'square', vol: 0.045, bassWave: 'triangle', swing: 0, perc: 'march',            // marchinha de bombeiro, alegre
    mel: [0, 4, 7, 12, 7, 4, 7, N, 5, 9, 12, 9, 7, N, N, N, 4, 7, 12, 16, 14, 12, 11, 12, 7, N, 4, N, 0, N, N, N],
    bass: [0, 7, 5, 7, 0, 7, 5, 0], chords: [[0, 4, 7], [5, 9, 12], [7, 11, 14], [0, 4, 7]] },
  praca:    { bpm: 118, root: 65, lead: 'triangle', vol: 0.06, bassWave: 'sine', swing: 0.18, perc: 'claps',            // balanço de pracinha
    mel: [7, N, 9, 7, 4, N, 2, N, 4, 7, N, 9, 12, N, N, N, 9, N, 7, 4, 2, N, 4, N, 7, N, 4, 2, 0, N, N, N],
    bass: [0, 0, 7, 7, 5, 5, 7, 0], chords: [[0, 4, 7], [7, 11, 14], [5, 9, 12], [0, 4, 7]] },
  floresta: { bpm: 100, root: 62, lead: 'flute', vol: 0.07, bassWave: 'sine', swing: 0.1, perc: 'wood',                  // flauta da mata (modo dórico)
    mel: [0, N, 3, 5, 7, N, 10, N, 9, N, 7, 5, 3, N, N, N, 5, N, 7, 10, 12, N, 10, 9, 7, N, 5, N, 3, N, 2, N],
    bass: [0, 0, 10, 10, 5, 5, 7, 7], chords: [[0, 3, 7], [10, 14, 17], [5, 9, 12], [7, 10, 14]] },
  altura:   { bpm: 140, root: 67, lead: 'pluck', vol: 0.06, bassWave: 'triangle', swing: 0, perc: 'drive',              // arpejos lá no alto
    mel: [0, 7, 12, 7, 4, 7, 12, 7, 2, 9, 14, 9, 5, 9, 14, 9, 0, 7, 12, 7, 4, 7, 12, 16, 14, 12, 11, 9, 7, N, N, N],
    bass: [0, 0, 2, 2, 5, 5, 7, 7], chords: [[0, 4, 7], [2, 5, 9], [5, 9, 12], [7, 11, 14]] },
  pre:      { bpm: 96, root: 57, lead: 'marimba', vol: 0.08, bassWave: 'sine', swing: 0.12, perc: 'tribal',             // tambores pré-históricos e marimba
    mel: [0, N, 3, N, 5, 7, N, 5, 3, N, 0, N, N, N, N, N, 7, N, 10, N, 12, 10, N, 7, 5, N, 3, N, 0, N, N, N],
    bass: [0, 0, 0, 3, 5, 5, 7, 3], chords: [[0, 3, 7], [5, 8, 12], [3, 7, 10], [7, 10, 14]] },
  agua:     { bpm: 112, root: 63, lead: 'steel', vol: 0.07, bassWave: 'sine', swing: 0.2, perc: 'shaker',               // tambor de aço, clima de praia
    mel: [0, 4, 7, N, 9, 7, 4, N, 2, 5, 9, N, 7, N, N, N, 4, 7, 11, N, 12, 11, 9, 7, 4, N, 2, N, 0, N, N, N],
    bass: [0, 7, 5, 9, 7, 2, 0, 7], chords: [[0, 4, 7], [5, 9, 12], [7, 11, 14], [0, 4, 9]] },
  vulcao:   { bpm: 126, root: 62, lead: 'square', vol: 0.04, bassWave: 'sawtooth', swing: 0, perc: 'boom',              // aventura no vulcão (menor harmônico, sem susto)
    mel: [0, N, 3, 7, 8, N, 7, N, 3, N, 2, 3, 7, N, N, N, 0, N, 3, 7, 11, N, 12, N, 8, 7, 3, N, 2, N, 0, N],
    bass: [0, 0, 8, 8, 5, 5, 7, 7], chords: [[0, 3, 7], [8, 12, 15], [5, 8, 12], [7, 11, 14]] },
};
let curTrack = null, nextAt = 0, stepN = 0;
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
function voice(freq, t, dur, kind, vol) {
  const c = ctx; if (!c) return;
  const o = c.createOscillator(), g = c.createGain(); let o2 = null;
  const wave = kind === 'flute' || kind === 'marimba' || kind === 'steel' ? 'sine' : kind === 'pluck' ? 'triangle' : kind;
  o.type = wave; o.frequency.setValueAtTime(freq, t);
  if (kind === 'flute') { const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 5.5; lg.gain.value = freq * 0.012; lfo.connect(lg); lg.connect(o.frequency); lfo.start(t); lfo.stop(t + dur + 0.1); }
  if (kind === 'steel' || kind === 'marimba') { o2 = c.createOscillator(); o2.type = 'sine'; o2.frequency.setValueAtTime(freq * (kind === 'steel' ? 2.01 : 4), t); const g2 = c.createGain(); g2.gain.setValueAtTime(vol * 0.35, t); g2.gain.exponentialRampToValueAtTime(0.0008, t + dur * 0.5); o2.connect(g2); g2.connect(master); o2.start(t); o2.stop(t + dur + 0.05); }
  const att = kind === 'flute' ? 0.04 : 0.008, rel = kind === 'marimba' || kind === 'pluck' || kind === 'steel' ? dur * 0.9 : dur;
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + att); g.gain.exponentialRampToValueAtTime(0.0008, t + rel);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
}
function drum(t, type, vol = 1) {
  const c = ctx; if (!c) return;
  if (type === 'kick' || type === 'tom' || type === 'boom') {
    const o = c.createOscillator(), g = c.createGain(); const f0 = type === 'kick' ? 120 : type === 'boom' ? 90 : 180;
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(type === 'tom' ? 90 : 42, t + 0.18);
    g.gain.setValueAtTime(0.22 * vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.22); o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.25); return;
  }
  // ruído: chimbal, palmas, chocalho, bloco de madeira
  const dur = type === 'clap' ? 0.12 : type === 'wood' ? 0.05 : 0.05;
  const n = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, type === 'clap' ? 2 : 3);
  const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  f.type = type === 'wood' ? 'bandpass' : 'highpass'; f.frequency.value = type === 'wood' ? 1600 : type === 'clap' ? 1200 : type === 'shaker' ? 5000 : 7000; if (type === 'wood') f.Q.value = 8;
  g.gain.value = (type === 'clap' ? 0.12 : type === 'wood' ? 0.35 : 0.05) * vol;
  s.buffer = buf; s.connect(f); f.connect(g); g.connect(master); s.start(t);
}
const PERC = {
  soft:   (i) => [i % 8 === 0 && 'kick', i % 4 === 2 && ['hat', 0.5]],
  march:  (i) => [i % 4 === 0 && 'kick', i % 8 === 4 && 'clap', i % 2 === 1 && ['hat', 0.7]],
  claps:  (i) => [i % 8 === 0 && 'kick', i % 8 === 4 && 'clap', i % 4 === 2 && ['hat', 0.8]],
  wood:   (i) => [i % 8 === 0 && ['kick', 0.7], (i % 8 === 3 || i % 8 === 6) && 'wood'],
  drive:  (i) => [i % 4 === 0 && 'kick', i % 8 === 4 && 'clap', 'hat'],
  tribal: (i) => [i % 8 === 0 && 'boom', (i % 8 === 3 || i % 8 === 5) && 'tom', i % 16 === 14 && 'tom'],
  shaker: (i) => [i % 8 === 0 && 'kick', i % 8 === 6 && ['kick', 0.6], 'shaker'],
  boom:   (i) => [i % 4 === 0 && 'boom', i % 8 === 4 && 'clap', i % 2 === 1 && ['hat', 0.6]],
};
function schedule() {
  if (!ctx || !curTrack) return;
  const T = TRACKS[curTrack], stepDur = 60 / T.bpm / 2;               // colcheias
  while (nextAt < ctx.currentTime + 0.25) {
    const i = stepN, t = nextAt + (i % 2 ? T.swing * stepDur : 0);
    if (on()) {
      const m = T.mel[i % T.mel.length];
      if (m !== null && m !== undefined) voice(mtof(T.root + 12 + m), t, stepDur * (T.lead === 'flute' ? 1.8 : 1.4), T.lead, T.vol);
      const bar = Math.floor(i / 4) % T.bass.length;
      if (i % 4 === 0) voice(mtof(T.root - 12 + T.bass[bar]), t, stepDur * 3.2, T.bassWave, T.bassWave === 'sawtooth' ? 0.035 : 0.09);
      if (i % 16 === 0) { const ch = T.chords[Math.floor(i / 16) % T.chords.length]; ch.forEach((n, k) => voice(mtof(T.root + n), t + k * 0.012, stepDur * 7, 'sine', 0.022)); }
      PERC[T.perc](i % 16).forEach((x) => { if (x) { const [k, v] = Array.isArray(x) ? x : [x, 1]; drum(t, k, v); } });
    }
    nextAt += stepDur; stepN++;
  }
}
/** começa (ou troca) a música; name = tema da fase ou 'menu' */
export function startMusic(name = 'menu') {
  const c = ensure(); if (!c) return;
  if (!TRACKS[name]) name = 'menu';
  if (musicTimer && curTrack === name) return;
  stopMusic(); curTrack = name; nextAt = c.currentTime + 0.12; stepN = 0;
  musicTimer = setInterval(schedule, 60); schedule();
}
export function stopMusic() { if (musicTimer) { clearInterval(musicTimer); musicTimer = null; } curTrack = null; }
export function currentTrack() { return curTrack; }

export function speak(text) {
  if (!on() || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'pt-BR'; u.rate = 0.9; u.pitch = 1.3; u.volume = 0.9;
    window.speechSynthesis.speak(u);
  } catch (e) { /* sem voz: segue só com o visual */ }
}
export function silenceVoice() { try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) {} }
