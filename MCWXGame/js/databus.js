import Pool from './base/pool';
import Particle from './runtime/particles';
import WeaponPickup from './item/weaponPickup';
import EquipmentPickup from './item/equipmentPickup';
import { getCurrentLevelCfg } from './config/levels';
import { PICKUP_TYPE_LIST } from './config/pickupWeapons';
import { EQUIP_TYPE_LIST } from './config/equipment';
import ScoreBoard from './runtime/scoreBoard';
import ReviveStorage from './runtime/reviveStorage';

let instance;

export default class DataBus {
  bullets = [];
  enemies = [];
  particles = [];
  pickups = [];
  frame = 0;
  score = 0;
  isGameOver = false;
  isPaused = false;
  scoreSaved = false;
  topScores = [];
  pool = new Pool();
  player = null;
  spawner = null;
  hud = null;

  constructor() {
    if (instance) return instance;
    instance = this;
    this.topScores = ScoreBoard.load();
    this.storedReviveCount = ReviveStorage.load();
  }

  reset() {
    this.frame = 0;
    this.score = 0;
    this.bullets = [];
    this.enemies = [];
    this.particles = [];
    this.pickups = [];
    this.isGameOver = false;
    this.gameCleared = false;
    this.isPaused = false;
    this.scoreSaved = false;
    this.topScores = ScoreBoard.load();
    this.currentLevel = 1;
    this.levelKillCount = 0;
    this.bossActive = false;
    this.showBossWarning = 0;
    this.levelClearTimer = 0;
    this.levelClearMsg = '';
    this.weaponSwitchTimer = 0;
    this.weaponSwitchMsg = '';
    this.bossTitle = '';
    this.reviveUsed = false;
    this.scoreBonusClaimed = false;
  }

  gameOver() {
    this.isGameOver = true;
    this.isPaused = false;
    this.saveRunScore(false);
    GameGlobal.adManager?.tryShowGameOverInterstitial?.();
  }

  canRevive() {
    return this.isGameOver && !this.reviveUsed && !this.gameCleared;
  }

  canUseStoredRevive() {
    return this.isGameOver && !this.gameCleared && this.storedReviveCount > 0;
  }

  addStoredRevive(amount = 1) {
    this.storedReviveCount = ReviveStorage.add(amount);
    return this.storedReviveCount;
  }

  applyReviveState() {
    this.isGameOver = false;
    this.scoreSaved = false;

    const p = this.player;
    if (!p) return false;

    p.isActive = true;
    p.visible = true;
    p.hp = Math.max(35, Math.floor(p.maxHp * 0.45));
    p.invincibleTimer = 150;
    return true;
  }

  revivePlayer() {
    if (!this.canRevive()) return false;
    this.reviveUsed = true;
    return this.applyReviveState();
  }

  useStoredRevive() {
    if (!this.canUseStoredRevive()) return false;
    if (!ReviveStorage.consume()) return false;
    this.storedReviveCount = ReviveStorage.load();
    return this.applyReviveState();
  }

  applyScoreBonus(ratio = 0.5) {
    if (this.scoreBonusClaimed || !this.gameCleared) return 0;
    const added = Math.floor(this.score * ratio);
    this.score += added;
    this.scoreBonusClaimed = true;
    this.scoreSaved = false;
    this.saveRunScore(true);
    return added;
  }

  /** 失败或通关时保存积分到排行榜 */
  saveRunScore(cleared = false) {
    if (this.scoreSaved) return this.topScores;
    this.scoreSaved = true;
    this.topScores = ScoreBoard.save(this.score, this.currentLevel, cleared);
    return this.topScores;
  }

  togglePause() {
    if (this.isGameOver || this.gameCleared) return;
    this.isPaused = !this.isPaused;
  }

  addExplosion(x, y, color, size) {
    this.particles.push(new Particle(x, y, color, size));
  }

  removeEnemy(enemy) {
    const idx = this.enemies.indexOf(enemy);
    if (idx !== -1) {
      this.enemies.splice(idx, 1);
      const poolKey = enemy.isBoss ? 'boss' : 'enemy';
      this.pool.recover(poolKey, enemy);
    }
  }

  /** 标记子弹待回收（帧末批量 compact，避免 forEach 中 splice 卡顿） */
  removeBullet(bullet) {
    if (!bullet.isActive) return;
    bullet.isActive = false;
    bullet.visible = false;
  }

  /** 帧末批量回收失效子弹，O(n) 单次遍历替代多次 splice */
  compactBullets() {
    const bullets = this.bullets;
    let write = 0;
    for (let i = 0; i < bullets.length; i++) {
      const bullet = bullets[i];
      if (bullet.isActive) {
        bullets[write++] = bullet;
      } else {
        this.pool.recover('bullet', bullet);
      }
    }
    bullets.length = write;
  }

  removePickup(pickup) {
    const idx = this.pickups.indexOf(pickup);
    if (idx !== -1) {
      this.pickups.splice(idx, 1);
      const poolKey = pickup.pickupKind === 'equip' ? 'equipPickup' : 'pickup';
      this.pool.recover(poolKey, pickup);
    }
  }

  /** 敌机击毁掉落：武器 / 装备随机 */
  /** Boss 掉落：必出武器 + 随机装备 */
  trySpawnBossDrops(x, y) {
    const wType = PICKUP_TYPE_LIST[Math.floor(Math.random() * PICKUP_TYPE_LIST.length)];
    const weapon = this.pool.getItemByClass('pickup', WeaponPickup);
    weapon.init(wType, x - 20, y);
    this.pickups.push(weapon);

    const eType = EQUIP_TYPE_LIST[Math.floor(Math.random() * EQUIP_TYPE_LIST.length)];
    const equip = this.pool.getItemByClass('equipPickup', EquipmentPickup);
    equip.init(eType, x + 20, y);
    this.pickups.push(equip);
  }

  trySpawnDrop(x, y, force = false) {
    const lvCfg = getCurrentLevelCfg();
    const rate = lvCfg.dropRate ?? 0.28;
    if (!force && Math.random() > rate) return;

    const roll = Math.random();
    if (roll < 0.55 || force) {
      const type = PICKUP_TYPE_LIST[Math.floor(Math.random() * PICKUP_TYPE_LIST.length)];
      const pickup = this.pool.getItemByClass('pickup', WeaponPickup);
      pickup.init(type, x, y);
      this.pickups.push(pickup);
    } else {
      const type = EQUIP_TYPE_LIST[Math.floor(Math.random() * EQUIP_TYPE_LIST.length)];
      const pickup = this.pool.getItemByClass('equipPickup', EquipmentPickup);
      pickup.init(type, x, y);
      this.pickups.push(pickup);
    }
  }

  /** @deprecated 兼容旧调用 */
  trySpawnWeaponPickup(x, y, force = false) {
    this.trySpawnDrop(x, y, force);
  }
}
