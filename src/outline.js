// Contorno escuro em toda forma preenchida (estilo "desenho animado", como nos jogos de corrida de referência).
// Formas pequenas e translúcidas (sombras, brilhos, olhos) ficam sem contorno.
export const OUT = 0x1b2a49;

export function outline(g, w = 3, col = OUT, alpha = 1) {
  const solid = () => (g.defaultFillAlpha === undefined || g.defaultFillAlpha >= 0.9);
  const stroke = () => { g.lineStyle(w, col, alpha); };
  const f = {
    fillRoundedRect: g.fillRoundedRect.bind(g), fillCircle: g.fillCircle.bind(g), fillEllipse: g.fillEllipse.bind(g),
    fillTriangle: g.fillTriangle.bind(g), fillRect: g.fillRect.bind(g),
  };
  g.fillRoundedRect = (x, y, W, H, r) => { f.fillRoundedRect(x, y, W, H, r); if (solid() && Math.min(W, H) >= 9) { stroke(); g.strokeRoundedRect(x, y, W, H, r); } return g; };
  g.fillCircle = (x, y, r) => { f.fillCircle(x, y, r); if (solid() && r >= 7) { stroke(); g.strokeCircle(x, y, r); } return g; };
  g.fillEllipse = (x, y, W, H, s) => { f.fillEllipse(x, y, W, H, s); if (solid() && Math.min(W, H) >= 14) { stroke(); g.strokeEllipse(x, y, W, H, s); } return g; };
  g.fillTriangle = (x0, y0, x1, y1, x2, y2) => { f.fillTriangle(x0, y0, x1, y1, x2, y2); if (solid()) { stroke(); g.strokeTriangle(x0, y0, x1, y1, x2, y2); } return g; };
  g.fillRect = (x, y, W, H) => { f.fillRect(x, y, W, H); if (solid() && Math.min(W, H) >= 9) { stroke(); g.strokeRect(x, y, W, H); } return g; };
  return g;
}
export const og = (scene, w = 3, col = OUT, alpha = 1) => outline(scene.add.graphics(), w, col, alpha);
