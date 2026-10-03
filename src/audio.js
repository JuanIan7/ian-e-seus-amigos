// Áudio 100% gerado por código (sem arquivos externos, sem licenças a registrar).
import { load } from './save.js';

let ctx = null, master = null, musicTimer = null, step = 0;

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
  tap: () => tone(600, 0.08, { type: 'triangle', vol: 0.15 }),
};

// Música: melodia pentatônica alegre e simples, em loop.
const MELODY = [0, 2, 4, 7, 4, 2, 4, 0, 2, 4, 7, 9, 7, 4, 2, 4];
const SCALE = 261.63; // dó
const hz = (semi) => SCALE * Math.pow(2, semi / 12);
export function startMusic() {
  stopMusic();
  const c = ensure(); if (!c) return;
  musicTimer = setInterval(() => {
    if (!on() || !ctx) return;
    const s = MELODY[step % MELODY.length];
    tone(hz(s + 12), 0.2, { type: 'triangle', vol: 0.07 });
    if (step % 4 === 0) tone(hz(s - 12), 0.34, { type: 'sine', vol: 0.1 });
    step++;
  }, 240);
}
export function stopMusic() { if (musicTimer) { clearInterval(musicTimer); musicTimer = null; } }

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
