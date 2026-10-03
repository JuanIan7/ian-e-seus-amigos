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

// Deixa as cores mais vivas (saturação maior) em texturas de cenário.
function boost(c, k) {
  let r = ((c >> 16) & 255) / 255, g = ((c >> 8) & 255) / 255, b = (c & 255) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (d < 0.001) return c;
  let sat = d / (1 - Math.abs(2 * l - 1)); let h;
  if (mx === r) h = ((g - b) / d) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4;
  h *= 60; if (h < 0) h += 360;
  sat = Math.min(1, sat * k);
  const cc = (1 - Math.abs(2 * l - 1)) * sat, x = cc * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - cc / 2;
  let rr, gg, bb;
  if (h < 60) [rr, gg, bb] = [cc, x, 0]; else if (h < 120) [rr, gg, bb] = [x, cc, 0]; else if (h < 180) [rr, gg, bb] = [0, cc, x];
  else if (h < 240) [rr, gg, bb] = [0, x, cc]; else if (h < 300) [rr, gg, bb] = [x, 0, cc]; else [rr, gg, bb] = [cc, 0, x];
  return (Math.round((rr + m) * 255) << 16) | (Math.round((gg + m) * 255) << 8) | Math.round((bb + m) * 255);
}
export function vivid(g, k = 1.35) {
  const f = g.fillStyle.bind(g);
  g.fillStyle = (color, alpha) => f(boost(color, k), alpha);
  return g;
}
