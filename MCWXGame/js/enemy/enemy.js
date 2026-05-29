import Entity from '../base/entity';
import { ENEMY_TYPES, SCREEN_HEIGHT, SCREEN_WIDTH } from '../config/constants';

export default class Enemy extends Entity {
  constructor() {
    super(0, 0, 28, 28);
    this.hp = 1;
    this.maxHp = 1;
    this.speed = 3;
    this.score = 10;
    this.color = '#ff6b6b';
    this.enemyType = 'SCOUT';
    this.shootTimer = 0;
    this.wobble = Math.random() * Math.PI * 2;
  }

  init(typeKey = 'SCOUT') {
    const cfg = ENEMY_TYPES[typeKey] || ENEMY_TYPES.SCOUT;
    this.enemyType = typeKey;
    this.hp = cfg.hp;
    this.maxHp = cfg.hp;
    this.speed = cfg.speed + Math.random() * 0.5;
    this.score = cfg.score;
    this.color = cfg.color;
    this.width = cfg.size;
    this.height = cfg.size;
    this.x = Math.random() * (SCREEN_WIDTH - this.width);
    this.y = -this.height;
    this.isActive = true;
    this.visible = true;
    this.shootTimer = Math.floor(Math.random() * 120);
    this.wobble = Math.random() * Math.PI * 2;
  }

  takeDamage(dmg) {
    this.hp -= dmg;
    if (this.hp <= 0) {
      this.destroy();
    }
  }

  update() {
    if (GameGlobal.databus.isGameOver) return;

    this.wobble += 0.03;
    this.y += this.speed;
    if (this.enemyType === 'SCOUT') {
      this.x += Math.sin(this.wobble) * 1.2;
    }

    if (this.y > SCREEN_HEIGHT + this.height) {
      this.remove();
    }
  }

  draw(ctx) {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.PI);

    // 敌机主体 - 倒三角战机
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(0, -this.height / 2);
    ctx.lineTo(-this.width / 2, this.height / 2);
    ctx.lineTo(this.width / 2, this.height / 2);
    ctx.closePath();
    ctx.fill();

    // 驾驶舱
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc(0, 0, this.width / 6, 0, Math.PI * 2);
    ctx.fill();

    // 血条（非杂兵显示）
    if (this.maxHp > 1) {
      ctx.restore();
      const barW = this.width;
      const ratio = this.hp / this.maxHp;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(this.x, this.y - 8, barW, 4);
      ctx.fillStyle = ratio > 0.5 ? '#2ed573' : '#ff4757';
      ctx.fillRect(this.x, this.y - 8, barW * ratio, 4);
      return;
    }

    ctx.restore();
  }

  destroy() {
    if (!this.isActive) return;
    this.isActive = false;
    GameGlobal.databus.score += this.score;
    GameGlobal.databus.addExplosion(
      this.x + this.width / 2,
      this.y + this.height / 2,
      this.color,
      this.width
    );
    GameGlobal.musicManager.playExplosion();
    this.remove();
  }

  remove() {
    this.isActive = false;
    this.visible = false;
    GameGlobal.databus.removeEnemy(this);
  }
}
