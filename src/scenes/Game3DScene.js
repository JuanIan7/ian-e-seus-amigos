// Ponte entre o menu (Phaser) e o jogo 3D (Three.js): esconde o canvas do Phaser enquanto o 3D roda e devolve ao sair.
import Phaser from 'phaser';
import { Game3D } from '../g3/game3d.js';

export default class Game3DScene extends Phaser.Scene {
  constructor() { super('Game3D'); }
  init(data) { this.d = data || {}; }
  create() {
    const canvas = this.game.canvas;
    canvas.style.display = 'none';
    this.game.loop.sleep();
    const back = () => { canvas.style.display = ''; this.game.loop.wake(); this.scene.start('Menu'); };
    this.engine = new Game3D({ root: document.body, mode: this.d.mode, phase: this.d.phase, seed: this.d.seed, manual: this.d.manual, onExit: back });
    this.events.once('shutdown', () => { if (this.engine) { this.engine.destroy(); this.engine = null; } canvas.style.display = ''; });
  }
}
