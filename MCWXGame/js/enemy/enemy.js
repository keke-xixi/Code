import Entity from '../base/entity';
import { ENEMY_TYPES } from '../config/enemies';
import { getCurrentLevelCfg } from '../config/levels';
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../config/constants';

export default class Enemy extends Entity {
  constructor() {
    super(0, 0, 28, 28);
    this.hp = 1;
    this.maxHp = 1;
    this.speed = 3;
    this.score = 10;
    this.color = '#ff6b6b';
    this.accent = '#ffffff';
    this.enemyType = 'SCOUT';
    this.behavior = 'straight';
    this.shape = 'triangle';
    this.shootTimer = 0;
    this.wobble = Math.random() * Math.PI * 2;
    this.isBoss = false;
    this.swoopDir = Math.random() > 0.5 ? 1 : -1;
    this.baseX = 0;
  }

  init(typeKey = 'SCOUT') {
    this.isBoss = false;
    const cfg = ENEMY_TYPES[typeKey] || ENEMY_TYPES.SCOUT;
    const lvCfg = getCurrentLevelCfg();
    const hpScale = lvCfg.enemyHpScale || 1;
    const spdScale = lvCfg.enemySpeedScale || 1;

    this.enemyType = typeKey;
    this.behavior = cfg.behavior || 'straight';
    this.shape = cfg.shape || 'triangle';
    this.hp = Math.max(1, Math.round(cfg.hp * hpScale));
    this.maxHp = this.hp;
    this.speed = cfg.speed * spdScale + Math.random() * 0.3;
    this.score = cfg.score;
    this.color = cfg.color;
    this.accent = cfg.accent || '#ffffff';
    this.width = cfg.size;
    this.height = cfg.size;
    this.x = Math.random() * (SCREEN_WIDTH - this.width);
    this.y = -this.height;
    this.baseX = this.x;
    this.isActive = true;
    this.visible = true;
    this.wobble = Math.random() * Math.PI * 2;
    this.swoopDir = Math.random() > 0.5 ? 1 : -1;
  }

  takeDamage(dmg) {
    this.hp -= dmg;
    if (this.hp <= 0) this.destroy();
  }

  update() {
    if (GameGlobal.databus.isGameOver) return;

    this.wobble += 0.04;
    this.y += this.speed;

    switch (this.behavior) {
      case 'wobble':
        this.x += Math.sin(this.wobble) * 1.5;
        break;
      case 'zigzag':
        this.x += Math.sin(this.wobble * 2.5) * 2.8;
        break;
      case 'drift':
        this.x = this.baseX + Math.sin(this.wobble * 0.8) * 50;
        break;
      case 'swoop':
        if (this.y > SCREEN_HEIGHT * 0.15) {
          this.x += this.swoopDir * 2.5;
        }
        break;
      case 'hunt': {
        const player = GameGlobal.databus.player;
        if (player && this.y > 0) {
          const px = player.x + player.width / 2;
          const cx = this.x + this.width / 2;
          this.x += px > cx ? 1.2 : -1.2;
        }
        break;
      }
      default:
        break;
    }

    this.x = Math.max(0, Math.min(this.x, SCREEN_WIDTH - this.width));

    if (this.y > SCREEN_HEIGHT + this.height) {
      this.remove();
    }
  }

  draw(ctx) {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const s = this.width / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.PI);

    if (this.shape === 'ghost') {
      ctx.globalAlpha = 0.55 + Math.sin(this.wobble * 2) * 0.2;
    }

    switch (this.shape) {
      case 'circle':
        this.drawCircle(ctx, s);
        break;
      case 'wasp':
        this.drawWasp(ctx, s);
        break;
      case 'dart':
        this.drawDart(ctx, s);
        break;
      case 'bomber':
        this.drawBomber(ctx, s);
        break;
      case 'ghost':
        this.drawGhost(ctx, s);
        break;
      case 'hex':
        this.drawHex(ctx, s);
        break;
      case 'elite':
        this.drawElite(ctx, s);
        break;
      default:
        this.drawTriangle(ctx, s);
        break;
    }

    ctx.restore();

    if (this.maxHp > 1) {
      const barW = this.width;
      const ratio = this.hp / this.maxHp;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(this.x, this.y - 8, barW, 4);
      ctx.fillStyle = ratio > 0.5 ? '#2ed573' : '#ff4757';
      ctx.fillRect(this.x, this.y - 8, barW * ratio, 4);
    }
  }

  drawTriangle(ctx, s) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(-s, s);
    ctx.lineTo(s, s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = this.accent;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  drawCircle(ctx, s) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.75, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = this.accent;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }

  drawWasp(ctx, s) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.5, s * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2d3436';
    ctx.fillRect(-s * 0.4, -s * 0.3, s * 0.8, s * 0.12);
    ctx.fillRect(-s * 0.4, s * 0.05, s * 0.8, s * 0.12);
    [-1, 1].forEach((side) => {
      ctx.fillStyle = this.accent;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.ellipse(side * s * 0.55, 0, s * 0.25, s * 0.5, side * 0.4, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  drawDart(ctx, s) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(-s * 0.35, s * 0.3);
    ctx.lineTo(0, s * 0.6);
    ctx.lineTo(s * 0.35, s * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = this.accent;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  drawBomber(ctx, s) {
    ctx.fillStyle = this.color;
    ctx.fillRect(-s * 0.7, -s * 0.4, s * 1.4, s * 0.9);
    ctx.fillStyle = this.accent;
    ctx.fillRect(-s * 0.25, -s * 0.55, s * 0.5, s * 0.25);
    ctx.fillStyle = '#2d3436';
    ctx.beginPath();
    ctx.arc(0, s * 0.35, s * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  drawGhost(ctx, s) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, -s * 0.1, s * 0.6, Math.PI, 0);
    ctx.lineTo(s * 0.6, s * 0.5);
    ctx.lineTo(s * 0.2, s * 0.3);
    ctx.lineTo(0, s * 0.55);
    ctx.lineTo(-s * 0.2, s * 0.3);
    ctx.lineTo(-s * 0.6, s * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-s * 0.2, -s * 0.1, s * 0.12, 0, Math.PI * 2);
    ctx.arc(s * 0.2, -s * 0.1, s * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }

  drawHex(ctx, s) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
      const px = Math.cos(a) * s * 0.85;
      const py = Math.sin(a) * s * 0.85;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = this.accent;
    ctx.fillRect(-s * 0.2, -s * 0.15, s * 0.4, s * 0.35);
  }

  drawElite(ctx, s) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(-s * 0.85, s * 0.2);
    ctx.lineTo(-s * 0.5, s);
    ctx.lineTo(s * 0.5, s);
    ctx.lineTo(s * 0.85, s * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = this.accent;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, -s * 0.15, s * 0.18, 0, Math.PI * 2);
    ctx.fill();
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
    if (!this.isBoss) {
      GameGlobal.databus.spawner?.onEnemyKilled();
      GameGlobal.databus.trySpawnDrop(
        this.x + this.width / 2,
        this.y + this.height / 2
      );
    }
    this.remove();
  }

  remove() {
    this.isActive = false;
    this.visible = false;
    GameGlobal.databus.removeEnemy(this);
  }
}
