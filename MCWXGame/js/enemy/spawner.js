import Enemy from './enemy';

const SPAWN_INTERVAL_BASE = 45;

/**
 * 敌机生成器 - 随波次递增难度
 */
export default class EnemySpawner {
  constructor() {
    this.wave = 1;
    this.spawnTimer = 0;
  }

  reset() {
    this.wave = 1;
    this.spawnTimer = 0;
  }

  getSpawnInterval() {
    return Math.max(20, SPAWN_INTERVAL_BASE - this.wave * 2);
  }

  pickEnemyType() {
    const roll = Math.random();
    const w = this.wave;

    if (w >= 8 && roll < 0.08) return 'ELITE';
    if (w >= 5 && roll < 0.15) return 'TANK';
    if (w >= 3 && roll < 0.35) return 'FIGHTER';
    return 'SCOUT';
  }

  update() {
    if (GameGlobal.databus.isGameOver) return;

    // 每500分升一波
    const newWave = Math.floor(GameGlobal.databus.score / 500) + 1;
    if (newWave > this.wave) this.wave = newWave;

    this.spawnTimer++;
    if (this.spawnTimer >= this.getSpawnInterval()) {
      this.spawnTimer = 0;
      this.spawn();
    }
  }

  spawn() {
    const enemy = GameGlobal.databus.pool.getItemByClass('enemy', Enemy);
    enemy.init(this.pickEnemyType());
    GameGlobal.databus.enemies.push(enemy);
  }
}
