// Salvamento local (sem contas, sem rede, sem dados pessoais).
const KEY = 'ian-e-seus-amigos:v1';
const DEFAULTS = { mode: 'facil', sound: true, tut: { jump: false, water: false }, bestStars: 0 };

let cache = null;
export function load() {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? { ...DEFAULTS, ...JSON.parse(raw), tut: { ...DEFAULTS.tut, ...(JSON.parse(raw).tut || {}) } } : { ...DEFAULTS, tut: { ...DEFAULTS.tut } };
  } catch (e) { cache = { ...DEFAULTS, tut: { ...DEFAULTS.tut } }; }
  return cache;
}
export function save(patch) {
  const s = Object.assign(load(), patch);
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* sem armazenamento: segue sem salvar */ }
  return s;
}
