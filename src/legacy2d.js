import Phaser from 'phaser';
import { W, H } from './config.js';
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import CharacterScene from './scenes/CharacterScene.js';
import Game3DScene from './scenes/Game3DScene.js';

// Versão 2D antiga (Phaser). ?renderer=canvas serve para testes em computadores sem GPU; no celular usa WebGL automaticamente.
const forceCanvas = new URLSearchParams(location.search).get('renderer') === 'canvas';
const game = new Phaser.Game({
  type: forceCanvas ? Phaser.CANVAS : Phaser.AUTO,
  parent: 'game',
  width: W,
  height: H,
  backgroundColor: '#1b2a49',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  input: { activePointers: 3 },
  render: { antialias: true, powerPreference: 'low-power' }, // poupa bateria
  fps: { target: 60 },
  scene: [BootScene, MenuScene, CharacterScene, GameScene, Game3DScene],
});
window.__ian = { game };

// Impede menu de contexto / rolagem acidental
window.addEventListener('contextmenu', (e) => e.preventDefault());
