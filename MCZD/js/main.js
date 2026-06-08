import './render';
import LEVELS from './config/levels.config';
import DataBus from './databus';
import Particles from './base/particles';
import Animations from './base/animations';
import GameUI from './runtime/gameui';
import Sfx from './runtime/sfx';

const ctx = canvas.getContext('2d');

GameGlobal.databus = new DataBus();
GameGlobal.particles = new Particles();
GameGlobal.animations = new Animations();
GameGlobal.sfx = new Sfx();

export default class Main {
  aniId = 0;
  lastTs = 0;
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

  update(dt = 1) {
    GameGlobal.databus.tick();
    GameGlobal.particles.update(dt);
    GameGlobal.animations.update(dt);
  }

  render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.ui.render(ctx);
  }

  loop(ts = 0) {
    const dt = this.lastTs ? Math.min(2.5, (ts - this.lastTs) / 16.667) : 1;
    this.lastTs = ts;
    this.update(dt);
    this.render();
    this.aniId = requestAnimationFrame(this.loop.bind(this));
  }
}
