import Enemy from './enemy';
import Boss from './boss';
import { LEVELS, MAX_LEVEL } from '../config/levels';

/**
 * 关卡生成器
 */
export default class EnemySpawner {
  constructor() {
    this.level = 1;
    this.levelKills = 0;
    this.spawnTimer = 0;
    this.bossSpawned = false;
    this.waitingBoss = false;
    this.bossDelayTimer = 0;
    this.levelClearTimer = 0;
  }

  reset() {
    this.level = 1;
    this.levelKills = 0;
    this.spawnTimer = 0;
    this.bossSpawned = false;
    this.waitingBoss = false;
    this.bossDelayTimer = 0;
    this.levelClearTimer = 0;
    GameGlobal.databus.currentLevel = 1;
    GameGlobal.databus.levelKillCount = 0;
    GameGlobal.databus.bossActive = false;
    GameGlobal.databus.gameCleared = false;
  }

  getLevelConfig() {
    return LEVELS[this.level - 1] || LEVELS[0];
  }

  getSpawnInterval() {
    const cfg = this.getLevelConfig();
    return cfg.spawnInterval || 45;
  }

  pickEnemyType() {
    const cfg = this.getLevelConfig();
    const pool = cfg.enemies;
    const roll = Math.random();
    let acc = 0;
    for (const [type, weight] of Object.entries(pool)) {
      acc += weight;
      if (roll < acc) return type;
    }
    return 'SCOUT';
  }

  hasBossOnScreen() {
    return GameGlobal.databus.enemies.some((e) => e.isBoss && e.isActive);
  }

  update() {
    if (GameGlobal.databus.isGameOver || GameGlobal.databus.gameCleared) return;

    // 过关提示倒计时
    if (this.levelClearTimer > 0) {
      this.levelClearTimer--;
      return;
    }

    const cfg = this.getLevelConfig();

    // Boss 阶段
    if (this.bossSpawned || this.waitingBoss) {
      if (this.waitingBoss) {
        this.bossDelayTimer--;
        if (this.bossDelayTimer <= 0 && !this.hasBossOnScreen()) {
          this.spawnBoss(cfg.boss);
          this.bossSpawned = true;
          this.waitingBoss = false;
        }
      }
      if (!this.hasBossOnScreen() && this.bossSpawned && !this.waitingBoss) {
        this.bossSpawned = false;
      }
      return;
    }

    // 达到击杀数，准备 Boss
    if (this.levelKills >= cfg.killsToBoss) {
      this.waitingBoss = true;
      this.bossDelayTimer = 120;
      GameGlobal.databus.showBossWarning = 150;
      GameGlobal.databus.bossTitle = cfg.boss.title || 'BOSS 来袭';
      return;
    }

    this.spawnTimer++;
    if (this.spawnTimer >= this.getSpawnInterval()) {
      this.spawnTimer = 0;
      this.spawnMinion();
    }
  }

  spawnMinion() {
    const enemy = GameGlobal.databus.pool.getItemByClass('enemy', Enemy);
    enemy.init(this.pickEnemyType());
    GameGlobal.databus.enemies.push(enemy);
  }

  spawnBoss(bossCfg) {
    const boss = GameGlobal.databus.pool.getItemByClass('boss', Boss);
    boss.init(bossCfg);
    GameGlobal.databus.enemies.push(boss);
    GameGlobal.databus.bossActive = true;
  }

  onEnemyKilled() {
    if (this.bossSpawned || this.waitingBoss) return;
    this.levelKills++;
    GameGlobal.databus.levelKillCount = this.levelKills;
  }

  onBossDefeated() {
    if (this.level >= MAX_LEVEL) {
      GameGlobal.databus.gameCleared = true;
      GameGlobal.databus.isPaused = false;
      GameGlobal.databus.saveRunScore(true);
      GameGlobal.databus.levelClearMsg = '恭喜通关！';
      GameGlobal.databus.levelClearTimer = 300;
      return;
    }

    this.level++;
    GameGlobal.databus.currentLevel = this.level;
    this.levelKills = 0;
    GameGlobal.databus.levelKillCount = 0;
    this.bossSpawned = false;
    this.waitingBoss = false;
    this.spawnTimer = 0;
    this.levelClearTimer = 90;

    const cfg = this.getLevelConfig();
    GameGlobal.databus.levelClearMsg = `第${cfg.id}关 ${cfg.name}`;
    GameGlobal.databus.levelClearTimer = 120;
    GameGlobal.databus.bg?.setLevel(this.level);
  }
}
