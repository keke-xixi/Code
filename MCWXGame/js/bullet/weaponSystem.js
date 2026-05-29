import Bullet from './bullet';
import {
  WEAPON_CONFIG,
  WEAPON_TYPES,
  AUTO_WEAPONS,
  SKILL_CONFIG,
} from '../config/weapons';

/**
 * 武器系统 - 管理5种子弹的发射逻辑
 */
export default class WeaponSystem {
  constructor(player) {
    this.player = player;
    this.autoWeaponIndex = 0;
    this.autoWeapon = AUTO_WEAPONS[0];
    this.shootTimer = 0;
    this.skillCooldowns = {
      laser: 0,
      missile: 0,
      shield: 0,
      bomb: 0,
      overdrive: 0,
    };
    this.shieldActive = false;
    this.shieldTimer = 0;
    this.overdriveActive = false;
    this.overdriveTimer = 0;
  }

  reset() {
    this.autoWeaponIndex = 0;
    this.autoWeapon = AUTO_WEAPONS[0];
    this.shootTimer = 0;
    Object.keys(this.skillCooldowns).forEach((k) => {
      this.skillCooldowns[k] = 0;
    });
    this.shieldActive = false;
    this.shieldTimer = 0;
    this.overdriveActive = false;
    this.overdriveTimer = 0;
  }

  upgradeWeapon() {
    this.autoWeaponIndex = Math.min(
      this.autoWeaponIndex + 1,
      AUTO_WEAPONS.length - 1
    );
    this.autoWeapon = AUTO_WEAPONS[this.autoWeaponIndex];
  }

  getShootInterval() {
    const cfg = WEAPON_CONFIG[this.autoWeapon];
    const base = cfg.interval || 8;
    return this.overdriveActive ? Math.floor(base / 2) : base;
  }

  spawnBullet(x, y, type, options = {}) {
    const bullet = GameGlobal.databus.pool.getItemByClass('bullet', Bullet);
    bullet.init(x, y, type, options);
    GameGlobal.databus.bullets.push(bullet);
  }

  /** 自动射击 - 前三种武器 */
  autoShoot() {
    const px = this.player.x + this.player.width / 2;
    const py = this.player.y;
    const cfg = WEAPON_CONFIG[this.autoWeapon];

    switch (this.autoWeapon) {
      case WEAPON_TYPES.PULSE:
        this.spawnBullet(px - cfg.size / 2, py - 10, WEAPON_TYPES.PULSE);
        break;

      case WEAPON_TYPES.TWIN: {
        const offset = cfg.offset || 14;
        this.spawnBullet(px - offset, py - 10, WEAPON_TYPES.TWIN);
        this.spawnBullet(px + offset - cfg.size, py - 10, WEAPON_TYPES.TWIN);
        break;
      }

      case WEAPON_TYPES.SPREAD: {
        const angles = cfg.angles || [-0.25, 0, 0.25];
        angles.forEach((angle) => {
          const speed = cfg.speed;
          this.spawnBullet(px - cfg.size / 2, py - 10, WEAPON_TYPES.SPREAD, {
            vx: Math.sin(angle) * speed,
            vy: -Math.cos(angle) * speed,
          });
        });
        break;
      }
      default:
        break;
    }

    GameGlobal.musicManager.playShoot();
  }

  /** 技能1: 穿透镭射 - 从战机位置向上发射宽激光 */
  fireLaser() {
    if (this.skillCooldowns.laser > 0) return false;
    const px = this.player.x + this.player.width / 2;
    const py = this.player.y;
    const cfg = WEAPON_CONFIG[WEAPON_TYPES.LASER];
    this.spawnBullet(px - cfg.width / 2, py - 10, WEAPON_TYPES.LASER, {
      vy: -cfg.speed,
      vx: 0,
      beamHeight: py + 20,
    });
    this.skillCooldowns.laser = SKILL_CONFIG.laser.cooldown;
    GameGlobal.musicManager.playShoot();
    return true;
  }

  /** 技能2: 追踪导弹 */
  fireMissiles() {
    if (this.skillCooldowns.missile > 0) return false;
    const px = this.player.x + this.player.width / 2;
    const py = this.player.y;
    const cfg = WEAPON_CONFIG[WEAPON_TYPES.MISSILE];
    const count = cfg.count || 5;

    for (let i = 0; i < count; i++) {
      const spread = (i - (count - 1) / 2) * 20;
      this.spawnBullet(px + spread - cfg.size / 2, py - 10, WEAPON_TYPES.MISSILE);
    }

    this.skillCooldowns.missile = SKILL_CONFIG.missile.cooldown;
    GameGlobal.musicManager.playShoot();
    return true;
  }

  /** 技能3: 能量护盾 */
  activateShield() {
    if (this.skillCooldowns.shield > 0 || this.shieldActive) return false;
    this.shieldActive = true;
    this.shieldTimer = SKILL_CONFIG.shield.duration;
    this.skillCooldowns.shield = SKILL_CONFIG.shield.cooldown;
    return true;
  }

  /** 技能4: 全屏轰炸 */
  activateBomb() {
    if (this.skillCooldowns.bomb > 0) return false;
    GameGlobal.databus.enemies.forEach((enemy) => {
      if (enemy.isActive) {
        enemy.takeDamage(SKILL_CONFIG.bomb.damage);
      }
    });
    GameGlobal.databus.addExplosion(
      this.player.x + this.player.width / 2,
      this.player.y + this.player.height / 2,
      '#fab1a0',
      40
    );
    this.skillCooldowns.bomb = SKILL_CONFIG.bomb.cooldown;
    GameGlobal.musicManager.playExplosion();
    return true;
  }

  /** 技能5: 超速射击 */
  activateOverdrive() {
    if (this.skillCooldowns.overdrive > 0 || this.overdriveActive) return false;
    this.overdriveActive = true;
    this.overdriveTimer = SKILL_CONFIG.overdrive.duration;
    this.skillCooldowns.overdrive = SKILL_CONFIG.overdrive.cooldown;
    return true;
  }

  /** 尝试释放技能 */
  useSkill(skillKey) {
    switch (skillKey) {
      case 'laser': return this.fireLaser();
      case 'missile': return this.fireMissiles();
      case 'shield': return this.activateShield();
      case 'bomb': return this.activateBomb();
      case 'overdrive': return this.activateOverdrive();
      default: return false;
    }
  }

  update() {
    // 冷却计时
    Object.keys(this.skillCooldowns).forEach((key) => {
      if (this.skillCooldowns[key] > 0) this.skillCooldowns[key]--;
    });

    if (this.shieldActive) {
      this.shieldTimer--;
      if (this.shieldTimer <= 0) this.shieldActive = false;
    }

    if (this.overdriveActive) {
      this.overdriveTimer--;
      if (this.overdriveTimer <= 0) this.overdriveActive = false;
    }

    // 自动射击
    this.shootTimer++;
    if (this.shootTimer >= this.getShootInterval()) {
      this.shootTimer = 0;
      this.autoShoot();
    }
  }

  isShielded() {
    return this.shieldActive;
  }

  getSkillCooldownRatio(skillKey) {
    const max = SKILL_CONFIG[skillKey]?.cooldown || 1;
    const current = this.skillCooldowns[skillKey] || 0;
    return Math.max(0, 1 - current / max);
  }
}
