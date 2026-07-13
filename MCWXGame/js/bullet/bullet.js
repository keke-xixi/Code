import Entity from '../base/entity';
import { WEAPON_CONFIG, WEAPON_TYPES } from '../config/weapons';
import { PICKUP_TYPES, PICKUP_WEAPON_CONFIG } from '../config/pickupWeapons';
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../config/constants';

function getCfg(type) {
  return PICKUP_WEAPON_CONFIG[type] || WEAPON_CONFIG[type];
}

export default class Bullet extends Entity {
  constructor() {
    super(0, 0, 6, 6);
    this.type = WEAPON_TYPES.PULSE;
    this.damage = 1;
    this.speed = 10;
    this.vx = 0;
    this.vy = -10;
    this.color = '#ffe066';
    this.pierce = false;
    this.homing = false;
    this.explodeRadius = 0;
    this.hitEnemies = new Set();
    this.life = 0;
    this.maxLife = 600;
    this.rotation = 0;
    this.noShadow = false;
  }

  init(x, y, type, options = {}) {
    const cfg = getCfg(type);
    this.type = type;
    this.x = x;
    this.y = y;
    this.damage = cfg.damage;
    this.speed = cfg.speed;
    this.color = cfg.color;
    this.pierce = cfg.pierce || false;
    this.homing = cfg.homing || false;
    this.explodeRadius = cfg.explodeRadius || 0;
    this.width = cfg.size || 6;
    this.height = cfg.height || cfg.width || cfg.size || 6;
    this.radius = Math.max(this.width, this.height) / 2;
    this.vx = options.vx ?? 0;
    this.vy = options.vy ?? -cfg.speed;
    this.isActive = true;
    this.visible = true;
    this.hitEnemies.clear();
    this.life = 0;
    this.maxLife = type === WEAPON_TYPES.LASER ? 45 : 600;
    this.beamHeight = options.beamHeight || this.height;
    this.target = null;
    this.rotation = 0;
    this.noShadow = type === PICKUP_TYPES.SHOTGUN || type === WEAPON_TYPES.PULSE;
  }

  findNearestEnemy() {
    let nearest = null;
    let minDist = Infinity;
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;

    GameGlobal.databus.enemies.forEach((enemy) => {
      if (!enemy.isActive) return;
      const ex = enemy.x + enemy.width / 2;
      const ey = enemy.y + enemy.height / 2;
      const dist = (ex - cx) ** 2 + (ey - cy) ** 2;
      if (dist < minDist) {
        minDist = dist;
        nearest = enemy;
      }
    });
    return nearest;
  }

  explode() {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    GameGlobal.databus.addExplosion(cx, cy, this.color, this.explodeRadius);
    GameGlobal.musicManager.playExplosion();

    GameGlobal.databus.enemies.forEach((enemy) => {
      if (!enemy.isActive) return;
      const ex = enemy.x + enemy.width / 2;
      const ey = enemy.y + enemy.height / 2;
      const dx = ex - cx;
      const dy = ey - cy;
      if (dx * dx + dy * dy <= this.explodeRadius * this.explodeRadius) {
        enemy.takeDamage(this.damage);
      }
    });
    this.destroy();
  }

  update() {
    if (!this.isActive || GameGlobal.databus.isGameOver) return;

    this.life++;
    if (this.type === PICKUP_TYPES.BLADE) {
      this.rotation += 0.25;
    }

    if (this.homing) {
      if (!this.target || !this.target.isActive) {
        this.target = this.findNearestEnemy();
      }
      if (this.target) {
        const tx = this.target.x + this.target.width / 2;
        const ty = this.target.y + this.target.height / 2;
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        const dx = tx - cx;
        const dy = ty - cy;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const turnSpeed = this.type === PICKUP_TYPES.BLADE ? 0.12 : 0.08;
        this.vx += (dx / len) * turnSpeed * this.speed;
        this.vy += (dy / len) * turnSpeed * this.speed;
        const vlen = Math.sqrt(this.vx ** 2 + this.vy ** 2) || 1;
        this.vx = (this.vx / vlen) * this.speed;
        this.vy = (this.vy / vlen) * this.speed;
      }
    }

    if (this.type === WEAPON_TYPES.LASER) {
      const player = GameGlobal.databus.player;
      if (player) {
        this.x = player.x + player.width / 2 - this.width / 2;
        this.y = player.y - 10;
        this.beamHeight = player.y + 20;
      }
      if (this.life > this.maxLife) this.destroy();
      return;
    }

    this.x += this.vx;
    this.y += this.vy;

    if (
      this.y < -this.height ||
      this.y > SCREEN_HEIGHT + this.height ||
      this.x < -this.width ||
      this.x > SCREEN_WIDTH + this.width ||
      this.life > this.maxLife
    ) {
      this.destroy();
    }
  }

  draw(ctx) {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;

    // 技能镭射
    if (this.type === WEAPON_TYPES.LASER) {
      const beamH = this.beamHeight;
      ctx.save();
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 16;
      const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y - beamH);
      grad.addColorStop(0, 'rgba(0,206,201,0.3)');
      grad.addColorStop(0.5, this.color);
      grad.addColorStop(1, '#ffffff');
      ctx.fillStyle = grad;
      ctx.fillRect(this.x, this.y - beamH, this.width, beamH);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(this.x + 1, this.y - beamH, this.width - 2, beamH);
      ctx.restore();
      return;
    }

    // 拾取：激光
    if (this.type === PICKUP_TYPES.LASER) {
      ctx.save();
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 8;
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x, this.y, this.width, this.height * 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(this.x + 1, this.y, this.width - 2, this.height * 2);
      ctx.restore();
      return;
    }

    // 拾取：爆炸蛋
    if (this.type === PICKUP_TYPES.EXPLODE) {
      ctx.save();
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(cx, cy, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e17055';
      ctx.beginPath();
      ctx.arc(cx, cy - 2, this.radius * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    // 拾取：跟踪飞刃
    if (this.type === PICKUP_TYPES.BLADE) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(this.rotation);
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.moveTo(0, -this.radius);
      ctx.lineTo(this.radius * 0.6, 0);
      ctx.lineTo(0, this.radius);
      ctx.lineTo(-this.radius * 0.6, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
      return;
    }

    // 拾取：气功波 - 向前弯月形
    if (this.type === PICKUP_TYPES.QI) {
      const r = this.width / 2;
      const h = this.height;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 12;

      ctx.beginPath();
      // 外弧：弯月外缘（朝飞行方向鼓起）
      ctx.arc(0, -h * 0.1, r, Math.PI * 0.82, Math.PI * 0.18, false);
      // 内弧：新月内缘
      ctx.arc(0, h * 0.35, r - 12, Math.PI * 0.22, Math.PI * 0.78, true);
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, h * 0.4, 0, -h * 0.5);
      grad.addColorStop(0, 'rgba(108,92,231,0.35)');
      grad.addColorStop(0.45, this.color);
      grad.addColorStop(1, '#dfe6ff');
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
      return;
    }

    // 技能导弹
    if (this.type === WEAPON_TYPES.MISSILE) {
      const angle = Math.atan2(this.vy, this.vx) + Math.PI / 2;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.moveTo(0, -this.height / 2);
      ctx.lineTo(-this.width / 2, this.height / 2);
      ctx.lineTo(this.width / 2, this.height / 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      return;
    }

    // 默认圆形弹 / 散弹（散弹禁用 shadowBlur，避免同屏大量绘制卡顿）
    ctx.save();
    if (!this.noShadow) {
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 5;
    }
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(cx, cy, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  isLaserHit(enemy) {
    if (this.type !== WEAPON_TYPES.LASER) return false;
    const ex = enemy.x + enemy.width / 2;
    const ey = enemy.y + enemy.height / 2;
    return (
      ex >= this.x &&
      ex <= this.x + this.width &&
      ey >= this.y - this.beamHeight &&
      ey <= this.y
    );
  }

  isCollideWith(other) {
    if (this.type === WEAPON_TYPES.LASER) return this.isLaserHit(other);
    return super.isCollideWith(other);
  }

  isCircleCollideWith(other) {
    if (this.type === WEAPON_TYPES.LASER) return this.isLaserHit(other);
    return super.isCircleCollideWith(other);
  }

  /** 命中后处理（爆炸蛋等） */
  onHitEnemy(enemy) {
    if (this.type === PICKUP_TYPES.EXPLODE) {
      this.explode();
      return true;
    }
    return false;
  }

  destroy() {
    GameGlobal.databus.removeBullet(this);
  }
}
