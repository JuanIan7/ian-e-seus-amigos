// Construtor do personagem infantil (reutilizável na tela de personalização da etapa 3).
// Origem do container = pés. Voltado para a direita.
import { COLORS } from './config.js';

export const DEFAULT_LOOK = { skin: 0xc68642, hair: 0x3b2314, eyes: 0x3a2a1a, outfit: 'bombeiro' };

export function buildChild(scene, look = DEFAULT_LOOK) {
  const c = scene.add.container(0, 0);
  const g = () => scene.add.graphics();

  // pernas (pivô no quadril)
  const mkLeg = (x, shade) => {
    const l = g(); l.x = x; l.y = -38;
    l.fillStyle(0x1f3b73, 1); l.fillRoundedRect(-8, 0, 16, 28, 5);
    l.fillStyle(shade, 1); l.fillRoundedRect(-9, 24, 24, 14, 6); // bota
    return l;
  };
  const legB = mkLeg(-7, 0x3a3a3a), legF = mkLeg(9, 0x4a4a4a);
  // braços (pivô no ombro)
  const mkArm = (x) => {
    const a = g(); a.x = x; a.y = -80;
    a.fillStyle(COLORS.red, 1); a.fillRoundedRect(-7, -4, 14, 30, 6);
    a.fillStyle(look.skin, 1); a.fillCircle(0, 30, 8);
    return a;
  };
  const armB = mkArm(-18), armF = mkArm(19);

  // corpo
  const body = g();
  body.fillStyle(COLORS.red, 1); body.fillRoundedRect(-22, -86, 44, 52, 12);
  body.fillStyle(COLORS.yellow, 1); body.fillRect(-22, -62, 44, 8); body.fillRect(-22, -48, 44, 5);
  body.fillStyle(0x1f3b73, 1); body.fillRect(-22, -38, 44, 6);

  // cabeça
  const head = g();
  head.fillStyle(look.skin, 1); head.fillCircle(0, -108, 25);
  head.fillStyle(look.hair, 1); head.fillCircle(-14, -122, 10); head.fillCircle(0, -128, 11); head.fillCircle(14, -122, 10); // cachos sob o capacete
  head.fillStyle(0xffffff, 1); head.fillCircle(7, -110, 7); head.fillCircle(-9, -110, 6);
  head.fillStyle(look.eyes, 1); head.fillCircle(9, -110, 4); head.fillCircle(-7, -110, 3.5);
  head.fillStyle(0xffffff, 1); head.fillCircle(10.5, -111.5, 1.4);
  head.lineStyle(3, 0x7a3b22, 1); head.beginPath(); head.arc(2, -102, 9, 0.25, Math.PI - 0.25); head.strokePath();
  head.fillStyle(0xff8a80, 0.55); head.fillCircle(15, -100, 5);
  // capacete (símbolo fictício da equipe do jogo: estrela)
  head.fillStyle(COLORS.red, 1); head.slice(0, -112, 29, Math.PI, 0, false); head.fillPath();
  head.fillRoundedRect(-33, -114, 66, 8, 4);
  head.fillStyle(COLORS.yellow, 1); head.fillCircle(2, -128, 7);

  // mangueira nas costas / bocal na mão (aparecem quando pega o equipamento)
  const hoseBack = g(); hoseBack.visible = false;
  hoseBack.lineStyle(7, COLORS.red, 1); hoseBack.strokeCircle(-30, -62, 14); hoseBack.lineStyle(4, COLORS.red, 1); hoseBack.strokeCircle(-30, -62, 7);
  const nozzle = g(); nozzle.visible = false;
  nozzle.fillStyle(COLORS.yellow, 1); nozzle.fillRoundedRect(0, -7, 34, 14, 5); nozzle.fillStyle(0x555555, 1); nozzle.fillRect(30, -5, 8, 10);

  c.add([hoseBack, legB, armB, body, legF, head, armF, nozzle]);
  c.parts = { legB, legF, armB, armF, head, body, hoseBack, nozzle };
  c.setScale(0.9);
  return c;
}

/** Animações: correr / pular / parado com o bocal. */
export function poseChild(c, state, phase) {
  const { legB, legF, armB, armF, head, nozzle } = c.parts;
  nozzle.visible = false;
  if (state === 'run') {
    const s = Math.sin(phase);
    legF.rotation = s * 0.9; legB.rotation = -s * 0.9;
    armF.rotation = -s * 0.9; armB.rotation = s * 0.9;
    head.y = Math.abs(Math.cos(phase)) * -2;
  } else if (state === 'jump') {
    legF.rotation = 0.7; legB.rotation = -0.4; armF.rotation = -2.5; armB.rotation = -2.2; head.y = 0;
  } else if (state === 'spray') {
    legF.rotation = 0.15; legB.rotation = -0.15; head.y = 0;
    armF.rotation = -1.45; armB.rotation = -1.2;
    nozzle.visible = true; nozzle.x = armF.x + 26; nozzle.y = armF.y + 3;
  } else { // idle
    legF.rotation = legB.rotation = 0; armF.rotation = armB.rotation = 0; head.y = 0;
  }
}
