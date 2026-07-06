import './render';
import CONFIG from './config/game.config';
import LEVELS from './config/levels.config';
import DataBus from './databus';
import Particles from './base/particles';
import { preloadAssets, waitForAssets } from './base/assets';
import GameUI from './runtime/gameui';
import Sfx from './runtime/sfx';
import GameClubButton from './runtime/gameClub';

const ctx = canvas.getContext('2d');

GameGlobal.databus = new DataBus();
GameGlobal.particles = new Particles();
GameGlobal.sfx = new Sfx();

const assetList = [
  CONFIG.assets.menuBg,
  ...LEVELS.map((l) => l.image),
];

export default class Main {
  aniId = 0;
  ui = new GameUI();
  loading = true;

  constructor() {
    GameGlobal.gameClub = new GameClubButton();
    this.ui.on('start', (id) => this.startLevel(id));
    this.ui.on('menu', () => this.showMenu());
    this.ui.bindTouch();
    waitForAssets(assetList).then(() => {
      this.loading = false;
      this.showMenu();
    });
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
    GameGlobal.gameClub?.hide();
    GameGlobal.databus.startLevel(id);
    GameGlobal.sfx?.refreshBgm();
  }

  update() {
    if (this.loading) return;
    GameGlobal.databus.tick();
    GameGlobal.particles.update();
  }

  render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (this.loading) {
      ctx.fillStyle = '#1A237E';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#E8EAF6';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('镜像双生 加载中…', canvas.width / 2, canvas.height / 2);
      return;
    }
    this.ui.render(ctx);
  }

  loop() {
    this.update();
    this.render();
    this.aniId = requestAnimationFrame(this.loop.bind(this));
  }
}
