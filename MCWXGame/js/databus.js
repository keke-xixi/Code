import Pool from './base/pool';
import Particle from './runtime/particles';

let instance;

/**
 * 全局状态管理
 */
export default class DataBus {
  bullets = [];
  enemies = [];
  particles = [];
  frame = 0;
  score = 0;
  isGameOver = false;
  pool = new Pool();
  player = null;
  spawner = null;
  hud = null;

  constructor() {
    if (instance) return instance;
    instance = this;
  }

  reset() {
    this.frame = 0;
    this.score = 0;
    this.bullets = [];
    this.enemies = [];
    this.particles = [];
    this.isGameOver = false;
  }

  gameOver() {
    this.isGameOver = true;
  }

  addExplosion(x, y, color, size) {
    this.particles.push(new Particle(x, y, color, size));
  }

  removeEnemy(enemy) {
    const idx = this.enemies.indexOf(enemy);
    if (idx !== -1) {
      this.enemies.splice(idx, 1);
      this.pool.recover('enemy', enemy);
    }
  }

  removeBullet(bullet) {
    const idx = this.bullets.indexOf(bullet);
    if (idx !== -1) {
      this.bullets.splice(idx, 1);
      this.pool.recover('bullet', bullet);
    }
  }
}
