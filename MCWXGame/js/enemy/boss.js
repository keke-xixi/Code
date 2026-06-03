import Enemy from './enemy';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../config/constants';

/**
 * Boss 敌机 - 大气外观与专属行动模式
 */
export default class Boss extends Enemy {
  constructor() {
    super();
    this.isBoss = true;
    this.bossKey = '';
    this.bossName = '';
    this.bossTitle = '';
    this.pattern = 'sweep';
    this.patternTimer = 0;
    this.baseX = 0;
    this.accent = '#ffffff';
    this.entered = false;
    this.enterTimer = 0;
    this.phase = 1;
  }

  init(bossCfg) {
    this.isBoss = true;
    this.bossKey = bossCfg.key;
    this.bossName = bossCfg.name;
    this.bossTitle = bossCfg.title || 'BOSS 来袭';
    this.enemyType = 'BOSS';
    this.pattern = bossCfg.pattern;
    this.hp = bossCfg.hp;
    this.maxHp = bossCfg.hp;
    this.speed = bossCfg.speed;
    this.score = bossCfg.score;
    this.color = bossCfg.color;
    this.accent = bossCfg.accent;
    this.width = bossCfg.size;
    this.height = bossCfg.size;
    this.x = SCREEN_WIDTH / 2 - this.width / 2;
    this.y = -this.height - 20;
    this.baseX = this.x;
    this.isActive = true;
    this.visible = true;
    this.patternTimer = 0;
    this.entered = false;
    this.enterTimer = 0;
    this.phase = 1;
    this.wobble = 0;
    GameGlobal.databus.bossActive = true;
    GameGlobal.databus.bossTitle = this.bossTitle;
  }

  update() {
    if (GameGlobal.databus.isGameOver) return;

    this.patternTimer++;
    this.enterTimer++;

    const hpRatio = this.hp / this.maxHp;
    this.phase = hpRatio > 0.5 ? 1 : hpRatio > 0.25 ? 2 : 3;

    if (!this.entered) {
      this.y += 1.2;
      if (this.y >= 55) {
        this.entered = true;
        this.baseX = SCREEN_WIDTH / 2 - this.width / 2;
        this.x = this.baseX;
        GameGlobal.databus.showBossWarning = 150;
        GameGlobal.databus.bossTitle = this.bossTitle;
      }
      return;
    }

    const speedMul = this.phase >= 3 ? 1.4 : this.phase >= 2 ? 1.15 : 1;

    switch (this.pattern) {
      case 'sweep':
        this.x = this.baseX + Math.sin(this.patternTimer * 0.025 * speedMul) * (SCREEN_WIDTH * 0.32);
        this.y = 55 + Math.sin(this.patternTimer * 0.015) * 12;
        break;
      case 'tank':
        this.y = 45 + Math.sin(this.patternTimer * 0.008) * 18;
        this.x = SCREEN_WIDTH / 2 - this.width / 2 + Math.sin(this.patternTimer * 0.018) * 55;
        break;
      case 'zigzag':
        this.x += Math.sin(this.patternTimer * 0.07 * speedMul) * 5;
        this.y = 75 + Math.sin(this.patternTimer * 0.035) * 35;
        break;
      case 'fortress':
        this.y = 35 + Math.sin(this.patternTimer * 0.012) * 12;
        this.x = SCREEN_WIDTH / 2 - this.width / 2;
        if (this.phase >= 2) {
          this.x += Math.sin(this.patternTimer * 0.04) * 30;
        }
        break;
      case 'rage':
        this.x += Math.sin(this.patternTimer * 0.055 * speedMul) * 6;
        this.y = 65 + Math.sin(this.patternTimer * 0.045) * 45;
        break;
      case 'apocalypse':
        this.x = SCREEN_WIDTH / 2 - this.width / 2
          + Math.sin(this.patternTimer * 0.03 * speedMul) * (SCREEN_WIDTH * 0.28);
        this.y = 50 + Math.sin(this.patternTimer * 0.02) * 25;
        if (this.phase >= 3 && this.patternTimer % 90 === 0) {
          GameGlobal.databus.addExplosion(
            this.x + this.width / 2,
            this.y + this.height,
            this.accent,
            25
          );
        }
        break;
      default:
        break;
    }

    this.x = Math.max(5, Math.min(this.x, SCREEN_WIDTH - this.width - 5));
  }

  draw(ctx) {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const s = this.width / 2;

    this.drawBossAura(ctx, cx, cy, s);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.PI);

    switch (this.bossKey) {
      case 'FALCON': this.drawFalcon(ctx, s); break;
      case 'METEOR': this.drawMeteor(ctx, s); break;
      case 'PHANTOM': this.drawPhantom(ctx, s); break;
      case 'FORTRESS': this.drawFortress(ctx, s); break;
      case 'DESTROYER': this.drawDestroyer(ctx, s); break;
      default: this.drawDefaultBoss(ctx, s); break;
    }

    ctx.restore();
    this.drawBossBar(ctx);
  }

  drawBossAura(ctx, cx, cy, s) {
    const pulse = 1 + Math.sin(this.patternTimer * 0.06) * 0.08;
    const rings = this.bossKey === 'DESTROYER' ? 3 : 2;

    for (let i = 0; i < rings; i++) {
      ctx.save();
      ctx.strokeStyle = this.accent;
      ctx.globalAlpha = 0.08 + (rings - i) * 0.05;
      ctx.lineWidth = this.bossKey === 'DESTROYER' ? 3 : 2;
      ctx.beginPath();
      ctx.arc(cx, cy, s * (1.1 + i * 0.18) * pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (this.phase >= 3) {
      ctx.save();
      ctx.fillStyle = `${this.accent}15`;
      ctx.beginPath();
      ctx.arc(cx, cy, s * 1.3 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  drawFalcon(ctx, s) {
    ctx.shadowColor = this.accent;
    ctx.shadowBlur = 12;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(-s * 0.85, s * 0.15);
    ctx.lineTo(-s * 0.55, s);
    ctx.lineTo(s * 0.55, s);
    ctx.lineTo(s * 0.85, s * 0.15);
    ctx.closePath();
    ctx.fill();
    [-1, 1].forEach((side) => {
      ctx.fillStyle = this.accent;
      ctx.beginPath();
      ctx.moveTo(side * s * 0.5, s * 0.1);
      ctx.lineTo(side * s, s * 0.45);
      ctx.lineTo(side * s * 0.4, s * 0.35);
      ctx.closePath();
      ctx.fill();
    });
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-s * 0.12, -s * 0.35, s * 0.24, s * 0.45);
    ctx.shadowBlur = 0;
  }

  drawMeteor(ctx, s) {
    ctx.shadowColor = this.accent;
    ctx.shadowBlur = 18;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.88, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = this.accent;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + this.patternTimer * 0.02;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * s * 0.55, Math.sin(a) * s * 0.55, s * 0.14, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#2d3436';
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  drawPhantom(ctx, s) {
    ctx.globalAlpha = 0.65 + Math.sin(this.patternTimer * 0.08) * 0.2;
    ctx.shadowColor = this.accent;
    ctx.shadowBlur = 20;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(-s * 0.95, s * 0.45);
    ctx.lineTo(-s * 0.2, s * 0.15);
    ctx.lineTo(0, s * 0.55);
    ctx.lineTo(s * 0.2, s * 0.15);
    ctx.lineTo(s * 0.95, s * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = this.accent;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  drawFortress(ctx, s) {
    ctx.shadowColor = this.accent;
    ctx.shadowBlur = 14;
    ctx.fillStyle = this.color;
    ctx.fillRect(-s * 0.85, -s * 0.55, s * 1.7, s * 1.1);
    ctx.fillStyle = this.accent;
    ctx.fillRect(-s * 0.35, -s * 0.75, s * 0.7, s * 0.35);
    ctx.fillStyle = '#2d3436';
    [-0.55, 0.3].forEach((ox) => {
      ctx.fillRect(ox * s, s * 0.05, s * 0.28, s * 0.35);
    });
    ctx.fillStyle = '#ff4757';
    ctx.beginPath();
    ctx.arc(0, -s * 0.15, s * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  drawDestroyer(ctx, s) {
    const pulse = 1 + Math.sin(this.patternTimer * 0.1) * 0.05;
    ctx.shadowColor = this.accent;
    ctx.shadowBlur = 25;

    // 外装甲
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(0, -s * pulse);
    ctx.lineTo(-s * 0.95, -s * 0.15);
    ctx.lineTo(-s * 0.75, s * 0.95);
    ctx.lineTo(-s * 0.25, s * 0.7);
    ctx.lineTo(0, s);
    ctx.lineTo(s * 0.25, s * 0.7);
    ctx.lineTo(s * 0.75, s * 0.95);
    ctx.lineTo(s * 0.95, -s * 0.15);
    ctx.closePath();
    ctx.fill();

    // 侧翼炮塔
    [-1, 1].forEach((side) => {
      ctx.fillStyle = '#2d3436';
      ctx.fillRect(side * s * 0.65, s * 0.1, s * 0.3, s * 0.45);
      ctx.fillStyle = this.accent;
      ctx.beginPath();
      ctx.arc(side * s * 0.8, s * 0.55, s * 0.1, 0, Math.PI * 2);
      ctx.fill();
    });

    // 核心能量
    const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 0.35);
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.4, this.accent);
    coreGrad.addColorStop(1, 'rgba(255,71,87,0.3)');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(0, -s * 0.05, s * 0.3 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // 头冠
    ctx.fillStyle = this.accent;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.95);
    ctx.lineTo(-s * 0.15, -s * 0.65);
    ctx.lineTo(s * 0.15, -s * 0.65);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = this.accent;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  drawDefaultBoss(ctx, s) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(-s, s);
    ctx.lineTo(s, s);
    ctx.closePath();
    ctx.fill();
  }

  drawBossBar(ctx) {
    const barW = SCREEN_WIDTH - 32;
    const barX = 16;
    const barY = 62;
    const barH = this.bossKey === 'DESTROYER' ? 12 : 9;
    const ratio = this.hp / this.maxHp;

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);

    const grad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    const barColor = this.phase >= 3 ? '#ff3838' : this.phase >= 2 ? '#ff6b35' : '#ff4757';
    grad.addColorStop(0, barColor);
    grad.addColorStop(Math.max(0.01, ratio), barColor);
    grad.addColorStop(Math.max(0.01, ratio), 'rgba(40,40,50,0.8)');
    grad.addColorStop(1, 'rgba(40,40,50,0.8)');
    ctx.fillStyle = grad;
    ctx.fillRect(barX, barY, barW, barH);

    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.bossName, SCREEN_WIDTH / 2, barY - 6);

    if (this.maxHp >= 500) {
      ctx.font = '10px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText(`${Math.ceil(this.hp)} / ${this.maxHp}`, SCREEN_WIDTH / 2, barY + barH + 12);
    }

    if (this.phase >= 2) {
      ctx.fillStyle = '#ff4757';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText(`阶段 ${this.phase}`, SCREEN_WIDTH / 2, barY + barH + (this.maxHp >= 500 ? 24 : 12));
    }
    ctx.textAlign = 'left';
  }

  destroy() {
    if (!this.isActive) return;
    this.isActive = false;
    GameGlobal.databus.score += this.score;
    GameGlobal.databus.bossActive = false;

    const bx = this.x + this.width / 2;
    const by = this.y + this.height / 2;
    GameGlobal.databus.addExplosion(bx, by, this.accent, this.width * 1.2);
    GameGlobal.databus.addExplosion(bx - 25, by + 10, this.color, this.width * 0.7);
    GameGlobal.databus.addExplosion(bx + 25, by - 10, this.accent, this.width * 0.7);

    GameGlobal.musicManager.playExplosion();
    wx.vibrateShort({ type: 'heavy' });
    GameGlobal.databus.trySpawnBossDrops(
      this.x + this.width / 2,
      this.y + this.height / 2
    );
    this.remove();
    GameGlobal.databus.spawner?.onBossDefeated();
  }

  remove() {
    this.isActive = false;
    this.visible = false;
    GameGlobal.databus.removeEnemy(this);
  }
}
