import Entity from '../base/entity';
import { WEAPON_CONFIG, WEAPON_TYPES } from '../config/weapons';
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../config/constants';

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
    this.hitEnemies = new Set();
    this.life = 0;
    this.maxLife = 600;
  }

  init(x, y, type, options = {}) {
    const cfg = WEAPON_CONFIG[type];
    this.type = type;
    this.x = x;
    this.y = y;
    this.damage = cfg.damage;
    this.speed = cfg.speed;
    this.color = cfg.color;
    this.pierce = cfg.pierce || false;
    this.homing = cfg.homing || false;
    this.width = cfg.size || 6;
    this.height = cfg.width || cfg.size || 6;
    this.radius = this.width / 2;
    this.vx = options.vx || 0;
    this.vy = options.vy || -cfg.speed;
    this.isActive = true;
    this.visible = true;
    this.hitEnemies = new Set();
    this.life = 0;
    this.maxLife = type === WEAPON_TYPES.LASER ? 45 : 600;
    this.beamHeight = options.beamHeight || this.height;
    this.target = null;
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
      if (dist < minDist && ey < cy) {
        minDist = dist;
        nearest = enemy;
      }
    });
    return nearest;
  }

  update() {
    if (GameGlobal.databus.isGameOver) return;

    this.life++;

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
        const turnSpeed = 0.08;
        this.vx += (dx / len) * turnSpeed * this.speed;
        this.vy += (dy / len) * turnSpeed * this.speed;
        const vlen = Math.sqrt(this.vx ** 2 + this.vy ** 2) || 1;
        this.vx = (this.vx / vlen) * this.speed;
        this.vy = (this.vy / vlen) * this.speed;
      }
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
      ctx.fillRect(this.x + 2, this.y - beamH, this.width - 4, beamH);
      ctx.restore();
      return;
    }

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
      ctx.fillStyle = '#ff7675';
      ctx.fillRect(-2, this.height / 2 - 2, 4, 4);
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 6;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(cx, cy, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  destroy() {
    this.isActive = false;
    this.visible = false;
    GameGlobal.databus.removeBullet(this);
  }
}
