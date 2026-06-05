import './render';
import LEVELS from './config/levels.config';
import DataBus from './databus';
import Particles from './base/particles';
import GameUI from './runtime/gameui';
import Sfx from './runtime/sfx';

const ctx = canvas.getContext('2d');

GameGlobal.databus = new DataBus();
GameGlobal.particles = new Particles();
GameGlobal.sfx = new Sfx();

export default class Main {
  aniId = 0;
  ui = new GameUI();

  constructor() {
    this.ui.on('start', (id) => this.startLevel(id));
    this.ui.on('menu', () => this.showMenu());
    this.ui.bindTouch();
    this.showMenu();
    this.loop();
  }

  showMenu() {
    const db = GameGlobal.databus;
    const fromLevel = db.levelId;
    db.scene = 'menu';
    db.isOver = false;
    db.isWin = false;
    db.showExitConfirm = false;
    db.touchStartScene = '';
    db.menuIndex = Math.min(LEVELS.length - 1, Math.max(0, fromLevel - 1));
    GameGlobal.sfx?.refreshBgm();
  }

  startLevel(id) {
    GameGlobal.databus.startLevel(id);
    GameGlobal.sfx?.refreshBgm();
  }

  update() {
    GameGlobal.databus.tick();
    GameGlobal.particles.update();
  }

  render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.ui.render(ctx);
  }

  loop() {
    this.update();
    this.render();
    this.aniId = requestAnimationFrame(this.loop.bind(this));
  }
}
