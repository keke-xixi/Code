import './render';
import CONFIG from './config/game.config';
import DataBus from './databus';
import Particles from './base/particles';
import { getAssetList, waitForAssets } from './base/assets';
import GameUI from './runtime/gameui';
import AudioMgr from './runtime/audio';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from './render';

const ctx = canvas.getContext('2d');

GameGlobal.databus = new DataBus();
GameGlobal.particles = new Particles();
GameGlobal.screenW = SCREEN_WIDTH;
GameGlobal.screenH = SCREEN_HEIGHT;

export default class Main {
  aniId = 0;
  ui = new GameUI();
  loading = true;

  constructor() {
    this.ui.on('start', (mode) => this.startMode(mode));
    this.ui.on('menu', () => this.showMenu());
    this.ui.bindTouch();
    waitForAssets(getAssetList(CONFIG)).then(() => {
      this.loading = false;
      GameGlobal.audio = new AudioMgr();
      this.showMenu();
    });
    this.loop();
  }

  showMenu() {
    const db = GameGlobal.databus;
    db.scene = 'menu';
    db.isOver = false;
    db.isWin = false;
    db.showExitConfirm = false;
    db.actionBarOpen = false;
  }

  startMode(mode) {
    GameGlobal.databus.startMode(mode);
  }

  update() {
    if (this.loading) return;
    GameGlobal.databus.tick();
    GameGlobal.particles.update();
  }

  render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (this.loading) {
      ctx.fillStyle = '#1A1035';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#E1BEE7';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${CONFIG.title} 加载中…`, canvas.width / 2, canvas.height / 2);
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
