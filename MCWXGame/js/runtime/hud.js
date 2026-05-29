import Emitter from '../libs/tinyemitter';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../config/constants';
import { SKILL_CONFIG, WEAPON_CONFIG } from '../config/weapons';

const SKILL_KEYS = ['laser', 'missile', 'shield', 'bomb', 'overdrive'];

function drawRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

export default class HUD extends Emitter {
  constructor() {
    super();
    this.skillButtons = this.calcSkillButtons();
    this.restartBtn = {
      x: SCREEN_WIDTH / 2 - 80,
      y: SCREEN_HEIGHT / 2 + 40,
      w: 160,
      h: 44,
    };

    wx.onTouchStart(this.onTouch.bind(this));
  }

  calcSkillButtons() {
    const btnSize = 52;
    const gap = 8;
    const totalW = SKILL_KEYS.length * btnSize + (SKILL_KEYS.length - 1) * gap;
    const startX = (SCREEN_WIDTH - totalW) / 2;
    const y = SCREEN_HEIGHT - btnSize - 16;

    return SKILL_KEYS.map((key, i) => ({
      key,
      x: startX + i * (btnSize + gap),
      y,
      w: btnSize,
      h: btnSize,
    }));
  }

  hitSkillButton(x, y) {
    for (const btn of this.skillButtons) {
      if (
        x >= btn.x &&
        x <= btn.x + btn.w &&
        y >= btn.y &&
        y <= btn.y + btn.h
      ) {
        return btn.key;
      }
    }
    return null;
  }

  onTouch(e) {
    if (!GameGlobal.databus.isGameOver) return;
    const { clientX, clientY } = e.touches[0];
    const b = this.restartBtn;
    if (
      clientX >= b.x &&
      clientX <= b.x + b.w &&
      clientY >= b.y &&
      clientY <= b.y + b.h
    ) {
      this.emit('restart');
    }
  }

  render(ctx) {
    this.renderTopBar(ctx);
    this.renderSkillButtons(ctx);

    if (GameGlobal.databus.isGameOver) {
      this.renderGameOver(ctx);
    }
  }

  renderTopBar(ctx) {
    const player = GameGlobal.databus.player;
    if (!player) return;

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(`得分 ${GameGlobal.databus.score}`, 12, 28);

    const wave = GameGlobal.databus.spawner?.wave || 1;
    ctx.fillStyle = '#fdcb6e';
    ctx.font = '14px sans-serif';
    ctx.fillText(`第 ${wave} 波`, 12, 48);

    const weaponType = player.weaponSystem.autoWeapon;
    const weaponName = WEAPON_CONFIG[weaponType]?.name || '';
    ctx.fillStyle = '#74b9ff';
    ctx.fillText(weaponName, SCREEN_WIDTH - 80, 28);

    const barX = SCREEN_WIDTH / 2 - 60;
    const barY = 12;
    const barW = 120;
    const barH = 10;
    const ratio = player.hp / player.maxHp;

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = ratio > 0.3 ? '#2ed573' : '#ff4757';
    ctx.fillRect(barX, barY, barW * ratio, barH);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.strokeRect(barX, barY, barW, barH);
  }

  renderSkillButtons(ctx) {
    const player = GameGlobal.databus.player;
    if (!player || GameGlobal.databus.isGameOver) return;

    const labels = { laser: '镭', missile: '弹', shield: '盾', bomb: '炸', overdrive: '速' };

    this.skillButtons.forEach((btn) => {
      const cfg = SKILL_CONFIG[btn.key];
      const ratio = player.weaponSystem.getSkillCooldownRatio(btn.key);
      const ready = ratio >= 1;

      ctx.fillStyle = ready ? cfg.color : 'rgba(60,60,80,0.8)';
      drawRoundRect(ctx, btn.x, btn.y, btn.w, btn.h, 8);
      ctx.fill();

      if (!ready) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        const cdH = btn.h * (1 - ratio);
        ctx.fillRect(btn.x, btn.y, btn.w, cdH);
      }

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(labels[btn.key] || '?', btn.x + btn.w / 2, btn.y + btn.h / 2 + 4);
      ctx.textAlign = 'left';

      ctx.strokeStyle = ready ? '#ffffff' : 'rgba(255,255,255,0.2)';
      ctx.lineWidth = ready ? 2 : 1;
      drawRoundRect(ctx, btn.x, btn.y, btn.w, btn.h, 8);
      ctx.stroke();
    });
  }

  renderGameOver(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('游戏结束', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 40);

    ctx.font = '20px sans-serif';
    ctx.fillStyle = '#fdcb6e';
    ctx.fillText(`最终得分: ${GameGlobal.databus.score}`, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);

    const b = this.restartBtn;
    ctx.fillStyle = '#0984e3';
    drawRoundRect(ctx, b.x, b.y, b.w, b.h, 8);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('重新开始', SCREEN_WIDTH / 2, b.y + 28);
    ctx.textAlign = 'left';
  }
}
