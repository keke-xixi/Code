import CONFIG from './config/game.config';
import { getLevel } from './config/levels.config';
import { setStars, unlock } from './base/progress';
import { syncGameplayAfterWin } from './runtime/gameplaySync';

let instance;

export default class DataBus {
  scene = 'menu';
  levelId = 1;
  frame = 0;

  lives = CONFIG.maxLives;
  hintsLeft = CONFIG.hintsPerLevel;
  found = new Set();
  mistakes = 0;
  elapsed = 0;
  combo = 0;

  hintTarget = null;
  hintUntil = 0;
  wrongMark = null;
  shake = 0;

  isWin = false;
  isOver = false;
  stars = 0;

  menuIndex = 0;
  menuDragX = 0;
  showExitConfirm = false;
  touchStartScene = '';

  constructor() {
    if (instance) return instance;
    instance = this;
  }

  startLevel(id) {
    const lv = getLevel(id);
    this.scene = 'play';
    this.levelId = id;
    this.frame = 0;
    this.lives = CONFIG.maxLives;
    this.hintsLeft = CONFIG.hintsPerLevel;
    this.found = new Set();
    this.mistakes = 0;
    this.elapsed = 0;
    this.combo = 0;
    this.hintTarget = null;
    this.hintUntil = 0;
    this.wrongMark = null;
    this.shake = 0;
    this.isWin = false;
    this.isOver = false;
    this.stars = 0;
    this.showExitConfirm = false;
  }

  tick() {
    if (this.scene === 'menu') {
      this.frame += 1;
      return;
    }
    if (this.scene !== 'play' || this.isOver || this.showExitConfirm) return;
    this.frame += 1;
    this.elapsed += 1;
    if (this.wrongMark) {
      this.wrongMark.life -= 1;
      if (this.wrongMark.life <= 0) this.wrongMark = null;
    }
    if (this.shake > 0) this.shake -= 1;
    if (this.hintUntil > 0) {
      this.hintUntil -= 1;
      if (this.hintUntil <= 0) this.hintTarget = null;
    }
  }

  tryFind(rx, ry) {
    const lv = getLevel(this.levelId);
    for (const d of lv.differences) {
      if (this.found.has(d.id)) continue;
      const dx = rx - d.x;
      const dy = ry - d.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= d.r * (CONFIG.diffHitMul || 1.15)) {
        this.found.add(d.id);
        this.combo += 1;
        if (this.found.size >= lv.differences.length) this.win();
        return { ok: true, diff: d };
      }
    }
    this.mistakes += 1;
    this.combo = 0;
    this.lives -= 1;
    this.shake = 8;
    if (this.lives <= 0) this.fail();
    return { ok: false };
  }

  useHint() {
    if (this.hintsLeft <= 0 || this.isOver) return null;
    const lv = getLevel(this.levelId);
    const remain = lv.differences.filter((d) => !this.found.has(d.id));
    if (!remain.length) return null;
    const pick = remain[Math.floor(Math.random() * remain.length)];
    this.hintsLeft -= 1;
    this.hintTarget = pick.id;
    this.hintUntil = 150;
    this.elapsed += CONFIG.hintPenaltySec * 60;
    return pick;
  }

  win() {
    this.isWin = true;
    this.isOver = true;
    const sec = Math.floor(this.elapsed / 60);
    let stars = 1;
    if (sec <= CONFIG.starTime.three && this.mistakes === 0) stars = 3;
    else if (sec <= CONFIG.starTime.two && this.mistakes <= 1) stars = 2;
    this.stars = stars;
    setStars(this.levelId, stars);
    unlock(this.levelId + 1);
    syncGameplayAfterWin();
  }

  fail() {
    this.isOver = true;
    this.isWin = false;
  }
}
