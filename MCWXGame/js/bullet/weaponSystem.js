import Bullet from './bullet';
import { WEAPON_CONFIG, WEAPON_TYPES, SKILL_CONFIG } from '../config/weapons';
import { PICKUP_TYPES, PICKUP_WEAPON_CONFIG } from '../config/pickupWeapons';
import { MAX_BULLETS, SHOTGUN_MAX_PELLETS_PER_VOLLEY } from '../config/constants';

export default class WeaponSystem {
  constructor(player) {
    this.player = player;
    this.pickupWeapon = null;
    this.shootTimer = 0;
    this.skillCooldowns = {
      laser: 0, missile: 0, shield: 0, bomb: 0, overdrive: 0,
    };
    this.shieldActive = false;
    this.shieldTimer = 0;
    this.overdriveActive = false;
    this.overdriveTimer = 0;
  }

  reset() {
    this.pickupWeapon = null;
    this.shootTimer = 0;
    Object.keys(this.skillCooldowns).forEach((k) => { this.skillCooldowns[k] = 0; });
    this.shieldActive = false;
    this.shieldTimer = 0;
    this.overdriveActive = false;
    this.overdriveTimer = 0;
  }

  setPickupWeapon(type) {
    this.pickupWeapon = type;
    const name = PICKUP_WEAPON_CONFIG[type]?.name || '';
    GameGlobal.databus.weaponSwitchMsg = `获得 ${name}`;
    GameGlobal.databus.weaponSwitchTimer = 100;
  }

  getActiveWeapon() {
    return this.pickupWeapon || WEAPON_TYPES.PULSE;
  }

  getWeaponName() {
    const w = this.getActiveWeapon();
    if (PICKUP_WEAPON_CONFIG[w]) return PICKUP_WEAPON_CONFIG[w].name;
    return WEAPON_CONFIG[w]?.name || '脉冲弹';
  }

  /** 根据火力等级生成横向弹道偏移（最多6条） */
  getLaneOffsets() {
    const lanes = 1 + Math.min(5, this.player.attackLevel);
    if (lanes === 1) return [0];
    const spacing = 12;
    const total = (lanes - 1) * spacing;
    return Array.from({ length: lanes }, (_, i) => -total / 2 + i * spacing);
  }

  getShootInterval() {
    const w = this.getActiveWeapon();
    const cfg = PICKUP_WEAPON_CONFIG[w] || WEAPON_CONFIG[w] || WEAPON_CONFIG[WEAPON_TYPES.PULSE];
    const base = cfg.interval || 8;
    return this.overdriveActive ? Math.max(3, Math.floor(base / 2)) : base;
  }

  spawnBullet(x, y, type, options = {}) {
    if (GameGlobal.databus.bullets.length >= MAX_BULLETS) return;
    const bullet = GameGlobal.databus.pool.getItemByClass('bullet', Bullet);
    bullet.init(x, y, type, options);
    GameGlobal.databus.bullets.push(bullet);
  }

  /** 按弹道数发射 */
  firePattern(shootFn) {
    this.getLaneOffsets().forEach((offset) => shootFn(offset));
  }

  autoShoot() {
    const px = this.player.x + this.player.width / 2;
    const py = this.player.y;
    const weapon = this.getActiveWeapon();

    switch (weapon) {
      case PICKUP_TYPES.LASER: {
        const cfg = PICKUP_WEAPON_CONFIG[PICKUP_TYPES.LASER];
        this.firePattern((off) => {
          this.spawnBullet(px + off - cfg.width / 2, py - 10, PICKUP_TYPES.LASER);
        });
        break;
      }
      case PICKUP_TYPES.EXPLODE: {
        const cfg = PICKUP_WEAPON_CONFIG[PICKUP_TYPES.EXPLODE];
        this.firePattern((off) => {
          this.spawnBullet(px + off - cfg.size / 2, py - 10, PICKUP_TYPES.EXPLODE);
        });
        break;
      }
      case PICKUP_TYPES.BLADE: {
        const cfg = PICKUP_WEAPON_CONFIG[PICKUP_TYPES.BLADE];
        this.firePattern((off) => {
          this.spawnBullet(px + off - cfg.size / 2, py - 10, PICKUP_TYPES.BLADE);
        });
        break;
      }
      case PICKUP_TYPES.QI: {
        const cfg = PICKUP_WEAPON_CONFIG[PICKUP_TYPES.QI];
        this.firePattern((off) => {
          this.spawnBullet(px + off - cfg.size / 2, py - 10, PICKUP_TYPES.QI);
        });
        break;
      }
      case PICKUP_TYPES.SHOTGUN: {
        const cfg = PICKUP_WEAPON_CONFIG[PICKUP_TYPES.SHOTGUN];
        const lanes = this.getLaneOffsets();
        const baseCount = cfg.pelletCount || 5;
        // 多弹道时减少每道弹丸数，避免火力升级后同屏子弹暴增
        const count = Math.max(3, Math.min(baseCount, Math.floor(SHOTGUN_MAX_PELLETS_PER_VOLLEY / lanes.length)));
        const spread = cfg.spreadAngle || 0.5;
        lanes.forEach((off) => {
          for (let i = 0; i < count; i++) {
            const angle = count <= 1
              ? 0
              : -spread / 2 + (spread / (count - 1)) * i;
            this.spawnBullet(px + off - cfg.size / 2, py - 10, PICKUP_TYPES.SHOTGUN, {
              vx: Math.sin(angle) * cfg.speed,
              vy: -Math.cos(angle) * cfg.speed,
            });
          }
        });
        break;
      }
      default: {
        const cfg = WEAPON_CONFIG[WEAPON_TYPES.PULSE];
        this.firePattern((off) => {
          this.spawnBullet(px + off - cfg.size / 2, py - 10, WEAPON_TYPES.PULSE);
        });
        break;
      }
    }

    GameGlobal.musicManager.playShoot();
  }

  fireLaser() {
    if (this.skillCooldowns.laser > 0) return false;
    const px = this.player.x + this.player.width / 2;
    const py = this.player.y;
    const cfg = WEAPON_CONFIG[WEAPON_TYPES.LASER];
    this.spawnBullet(px - cfg.width / 2, py - 10, WEAPON_TYPES.LASER, {
      vy: -cfg.speed, vx: 0, beamHeight: py + 20,
    });
    this.skillCooldowns.laser = SKILL_CONFIG.laser.cooldown;
    GameGlobal.musicManager.playShoot();
    return true;
  }

  fireMissiles() {
    if (this.skillCooldowns.missile > 0) return false;
    const px = this.player.x + this.player.width / 2;
    const py = this.player.y;
    const cfg = WEAPON_CONFIG[WEAPON_TYPES.MISSILE];
    for (let i = 0; i < (cfg.count || 5); i++) {
      const spread = (i - 2) * 20;
      this.spawnBullet(px + spread - cfg.size / 2, py - 10, WEAPON_TYPES.MISSILE);
    }
    this.skillCooldowns.missile = SKILL_CONFIG.missile.cooldown;
    GameGlobal.musicManager.playShoot();
    return true;
  }

  activateShield() {
    if (this.skillCooldowns.shield > 0 || this.shieldActive) return false;
    this.shieldActive = true;
    this.shieldTimer = SKILL_CONFIG.shield.duration;
    this.skillCooldowns.shield = SKILL_CONFIG.shield.cooldown;
    return true;
  }

  activateBomb() {
    if (this.skillCooldowns.bomb > 0) return false;
    GameGlobal.databus.enemies.forEach((e) => { if (e.isActive) e.takeDamage(SKILL_CONFIG.bomb.damage); });
    GameGlobal.databus.addExplosion(
      this.player.x + this.player.width / 2,
      this.player.y + this.player.height / 2,
      '#fab1a0', 40
    );
    this.skillCooldowns.bomb = SKILL_CONFIG.bomb.cooldown;
    GameGlobal.musicManager.playExplosion();
    return true;
  }

  activateOverdrive() {
    if (this.skillCooldowns.overdrive > 0 || this.overdriveActive) return false;
    this.overdriveActive = true;
    this.overdriveTimer = SKILL_CONFIG.overdrive.duration;
    this.skillCooldowns.overdrive = SKILL_CONFIG.overdrive.cooldown;
    return true;
  }

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
    this.shootTimer++;
    if (this.shootTimer >= this.getShootInterval()) {
      this.shootTimer = 0;
      this.autoShoot();
    }
  }

  isShielded() { return this.shieldActive; }

  getSkillCooldownRatio(skillKey) {
    const max = SKILL_CONFIG[skillKey]?.cooldown || 1;
    return Math.max(0, 1 - (this.skillCooldowns[skillKey] || 0) / max);
  }
}
