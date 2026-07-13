import Emitter from '../libs/tinyemitter';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../config/constants';
import { SKILL_CONFIG } from '../config/weapons';
import { LEVELS } from '../config/levels';
import { AD_ENABLED } from '../config/ads.config';
import ScoreBoard from './scoreBoard';

const SKILL_KEYS = ['laser', 'missile', 'shield', 'bomb', 'overdrive'];
const BTN_R = 16;
const BTN_GAP = 8;
const RIGHT_MARGIN = 10;
const TOGGLE_W = 20;

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
    this.panelExpanded = false;
    this.panelAlpha = 0;
    this.showRankPanel = false;
    this.restartBtn = {
      x: SCREEN_WIDTH / 2 - 80,
      y: SCREEN_HEIGHT - 80,
      w: 160,
      h: 44,
    };
    this.recalcLayout();
  }

  recalcLayout() {
    const btnD = BTN_R * 2;
    const totalH = SKILL_KEYS.length * btnD + (SKILL_KEYS.length - 1) * BTN_GAP;
    const startY = (SCREEN_HEIGHT - totalH) / 2;

    this.skillCenterX = SCREEN_WIDTH - RIGHT_MARGIN - TOGGLE_W - 6 - BTN_R;

    this.pauseBtn = {
      x: 10,
      y: 72,
      w: 46,
      h: 28,
    };

    this.randomSkillAdBtn = {
      x: this.pauseBtn.x + this.pauseBtn.w + 6,
      y: this.pauseBtn.y,
      w: 46,
      h: 28,
    };

    this.resumeBtn = {
      x: SCREEN_WIDTH / 2 - 145,
      y: SCREEN_HEIGHT / 2 - 10,
      w: 130,
      h: 40,
    };

    this.pauseRestartBtn = {
      x: SCREEN_WIDTH / 2 + 15,
      y: SCREEN_HEIGHT / 2 - 10,
      w: 130,
      h: 40,
    };

    this.rankBtn = {
      x: SCREEN_WIDTH / 2 - 70,
      y: SCREEN_HEIGHT / 2 + 45,
      w: 140,
      h: 36,
    };

    this.pauseInterstitialAdBtn = {
      x: SCREEN_WIDTH / 2 - 95,
      y: SCREEN_HEIGHT / 2 + 92,
      w: 190,
      h: 36,
    };

    this.gameClubBtn = {
      x: SCREEN_WIDTH / 2 - 60,
      y: SCREEN_HEIGHT / 2 + 138,
      w: 120,
      h: 34,
    };

    this.gameClubEndBtn = {
      x: SCREEN_WIDTH / 2 - 60,
      y: SCREEN_HEIGHT - 132,
      w: 120,
      h: 34,
    };

    this.reviveAdBtn = {
      x: SCREEN_WIDTH / 2 - 95,
      y: SCREEN_HEIGHT - 186,
      w: 190,
      h: 40,
    };

    this.scoreBonusAdBtn = {
      x: SCREEN_WIDTH / 2 - 95,
      y: SCREEN_HEIGHT - 186,
      w: 190,
      h: 40,
    };

    this.toggleBtn = {
      x: SCREEN_WIDTH - RIGHT_MARGIN - TOGGLE_W,
      y: SCREEN_HEIGHT / 2 - 20,
      w: TOGGLE_W,
      h: 40,
    };

    this.skillButtons = SKILL_KEYS.map((key, i) => ({
      key,
      cx: this.skillCenterX,
      cy: startY + BTN_R + i * (btnD + BTN_GAP),
      r: BTN_R,
    }));
  }

  /** 对局中是否显示「广告/技能」按钮 */
  canShowInGameAdBtn() {
    const db = GameGlobal.databus;
    return AD_ENABLED && db && !db.isGameOver && !db.gameCleared && !db.isPaused;
  }

  hitRect(x, y, r) {
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  }

  hitCircle(x, y, cx, cy, r) {
    const dx = x - cx;
    const dy = y - cy;
    return dx * dx + dy * dy <= (r + 4) * (r + 4);
  }

  handleTouch(x, y) {
    if (GameGlobal.databus.isGameOver || GameGlobal.databus.gameCleared) {
      if (GameGlobal.adManager?.canShowReviveBtn?.() && this.hitRect(x, y, this.reviveAdBtn)) {
        return 'adRevive';
      }
      if (GameGlobal.adManager?.canShowScoreBonusBtn?.() && this.hitRect(x, y, this.scoreBonusAdBtn)) {
        return 'adScoreBonus';
      }
      if (this.hitRect(x, y, this.restartBtn)) return 'restart';
      if (this.hitRect(x, y, this.gameClubEndBtn)) return 'gameClub';
      return null;
    }

    if (GameGlobal.databus.isPaused) {
      if (this.hitRect(x, y, this.resumeBtn)) return 'resume';
      if (this.hitRect(x, y, this.pauseRestartBtn)) return 'restart';
      if (this.hitRect(x, y, this.rankBtn)) return 'rank';
      if (GameGlobal.adManager?.canShowPauseInterstitialBtn?.()
        && this.hitRect(x, y, this.pauseInterstitialAdBtn)) {
        return 'adPauseInterstitial';
      }
      if (this.hitRect(x, y, this.gameClubBtn)) return 'gameClub';
      return 'paused';
    }

    if (this.hitRect(x, y, this.pauseBtn)) return 'pause';
    if (this.canShowInGameAdBtn() && this.hitRect(x, y, this.randomSkillAdBtn)) {
      return 'adRandomSkill';
    }

    const t = this.toggleBtn;
    if (x >= t.x && x <= t.x + t.w && y >= t.y && y <= t.y + t.h) {
      this.panelExpanded = !this.panelExpanded;
      return 'toggle';
    }

    if (!this.panelExpanded) return null;

    for (const btn of this.skillButtons) {
      if (this.hitCircle(x, y, btn.cx, btn.cy, btn.r)) {
        return btn.key;
      }
    }
    return null;
  }

  render(ctx) {
    this.panelAlpha += ((this.panelExpanded ? 1 : 0) - this.panelAlpha) * 0.3;
    this.renderTopBar(ctx);
    this.renderPauseBtn(ctx);
    this.renderSkillPanel(ctx);
    this.renderNotifications(ctx);

    if (GameGlobal.databus.isPaused) {
      this.renderPauseOverlay(ctx);
    } else if (GameGlobal.databus.isGameOver) {
      this.renderGameOver(ctx);
    } else if (GameGlobal.databus.gameCleared) {
      this.renderVictory(ctx);
    }
  }

  renderPauseBtn(ctx) {
    if (GameGlobal.databus.isGameOver || GameGlobal.databus.gameCleared || GameGlobal.databus.isPaused) return;

    const b = this.pauseBtn;
    ctx.fillStyle = 'rgba(20,25,45,0.75)';
    drawRoundRect(ctx, b.x, b.y, b.w, b.h, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    drawRoundRect(ctx, b.x, b.y, b.w, b.h, 6);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('暂停', b.x + b.w / 2, b.y + 19);
    ctx.textAlign = 'left';

    if (this.canShowInGameAdBtn()) {
      const ab = this.randomSkillAdBtn;
      ctx.fillStyle = 'rgba(0,150,110,0.92)';
      drawRoundRect(ctx, ab.x, ab.y, ab.w, ab.h, 6);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 1.5;
      drawRoundRect(ctx, ab.x, ab.y, ab.w, ab.h, 6);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('广告', ab.x + ab.w / 2, ab.y + 19);
      ctx.textAlign = 'left';
    }
  }

  renderTopBar(ctx) {
    const player = GameGlobal.databus.player;
    if (!player) return;

    const level = GameGlobal.databus.currentLevel || 1;
    const levelCfg = LEVELS[level - 1];
    const kills = GameGlobal.databus.levelKillCount || 0;
    const need = levelCfg?.killsToBoss || 15;

    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    drawRoundRect(ctx, 8, 8, SCREEN_WIDTH - 16, 58, 6);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`得分 ${GameGlobal.databus.score}`, 16, 28);

    ctx.fillStyle = '#fdcb6e';
    ctx.font = '12px sans-serif';
    ctx.fillText(`第${level}关 ${levelCfg?.name || ''}`, 16, 44);

    const weaponName = player.weaponSystem.getWeaponName();
    ctx.fillStyle = '#74b9ff';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(weaponName, SCREEN_WIDTH - 16, 28);

    if (!GameGlobal.databus.bossActive) {
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText(`进度 ${kills}/${need}`, SCREEN_WIDTH - 16, 44);
    }
    ctx.textAlign = 'left';

    const barX = SCREEN_WIDTH / 2 - 50;
    const barY = 14;
    const barW = 100;
    const barH = 6;
    const ratio = player.hp / player.maxHp;

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = ratio > 0.3 ? '#2ed573' : '#ff4757';
    ctx.fillRect(barX, barY, barW * ratio, barH);

    ctx.font = '10px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.textAlign = 'center';
    const stats = `命${player.armorLevel} 攻${player.attackLevel} 速${player.speedLevel}`;
    ctx.fillText(stats, SCREEN_WIDTH / 2, 44);
    if (player.armorCharges > 0) {
      ctx.fillStyle = '#2ed573';
      ctx.fillText(`护甲×${player.armorCharges}`, SCREEN_WIDTH / 2, 56);
    }
    ctx.textAlign = 'left';
  }

  renderSkillPanel(ctx) {
    const player = GameGlobal.databus.player;
    if (!player || GameGlobal.databus.isGameOver || GameGlobal.databus.gameCleared || GameGlobal.databus.isPaused) return;

    const labels = { laser: '镭', missile: '弹', shield: '盾', bomb: '炸', overdrive: '速' };
    const t = this.toggleBtn;

    ctx.fillStyle = 'rgba(20,25,45,0.8)';
    drawRoundRect(ctx, t.x, t.y, t.w, t.h, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    drawRoundRect(ctx, t.x, t.y, t.w, t.h, 6);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.panelExpanded ? '›' : '‹', t.x + t.w / 2, t.y + t.h / 2 + 4);
    ctx.textAlign = 'left';

    if (this.panelAlpha < 0.05) return;

    const alpha = this.panelAlpha;
    const first = this.skillButtons[0];
    const last = this.skillButtons[this.skillButtons.length - 1];
    const pad = 6;
    const px = this.skillCenterX - BTN_R - pad;
    const py = first.cy - BTN_R - pad;
    const pw = BTN_R * 2 + pad * 2;
    const ph = last.cy + BTN_R - first.cy + pad * 2;

    ctx.save();
    ctx.globalAlpha = alpha * 0.85;
    ctx.fillStyle = 'rgba(12,15,30,0.75)';
    drawRoundRect(ctx, px, py, pw, ph, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    drawRoundRect(ctx, px, py, pw, ph, 10);
    ctx.stroke();
    ctx.restore();

    this.skillButtons.forEach((btn) => {
      const cfg = SKILL_CONFIG[btn.key];
      const ratio = player.weaponSystem.getSkillCooldownRatio(btn.key);
      const ready = ratio >= 1;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = ready ? cfg.color : 'rgba(45,50,70,0.95)';
      ctx.beginPath();
      ctx.arc(btn.cx, btn.cy, btn.r, 0, Math.PI * 2);
      ctx.fill();

      if (!ready) {
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.beginPath();
        ctx.moveTo(btn.cx, btn.cy);
        ctx.arc(btn.cx, btn.cy, btn.r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - ratio));
        ctx.closePath();
        ctx.fill();
      }

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labels[btn.key], btn.cx, btn.cy);

      if (ready) {
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(btn.cx, btn.cy, btn.r - 1, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    });
  }

  renderNotifications(ctx) {
    if (GameGlobal.databus.isPaused) return;

    if (GameGlobal.databus.showBossWarning > 0) {
      GameGlobal.databus.showBossWarning--;
      const alpha = Math.min(1, GameGlobal.databus.showBossWarning / 40);
      ctx.fillStyle = `rgba(255,71,87,${alpha * 0.9})`;
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(GameGlobal.databus.bossTitle || '⚠ BOSS 来袭', SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.32);
      ctx.textAlign = 'left';
    }

    if (GameGlobal.databus.levelClearTimer > 0) {
      GameGlobal.databus.levelClearTimer--;
      const a = Math.min(1, GameGlobal.databus.levelClearTimer / 30);
      ctx.fillStyle = `rgba(253,203,110,${a})`;
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(GameGlobal.databus.levelClearMsg || '', SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.4);
      ctx.textAlign = 'left';
    }

    if (GameGlobal.databus.weaponSwitchTimer > 0) {
      GameGlobal.databus.weaponSwitchTimer--;
      const a = Math.min(1, GameGlobal.databus.weaponSwitchTimer / 25);
      ctx.fillStyle = `rgba(116,185,255,${a})`;
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(GameGlobal.databus.weaponSwitchMsg || '', SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.48);
      ctx.textAlign = 'left';
    }
  }

  renderPauseOverlay(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('游戏暂停', SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.28);

    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#fdcb6e';
    ctx.fillText(`当前得分 ${GameGlobal.databus.score}`, SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.34);

    this.drawBtn(ctx, this.resumeBtn, '继续游戏', '#0984e3');
    this.drawBtn(ctx, this.pauseRestartBtn, '重新开始', '#e17055');
    this.drawBtn(ctx, this.rankBtn, this.showRankPanel ? '收起排行' : '积分排行', '#6c5ce7');
    if (GameGlobal.adManager?.canShowPauseInterstitialBtn?.()) {
      this.drawAdBtn(ctx, this.pauseInterstitialAdBtn, '看插屏广告', '#00b894');
    }
    this.drawGameClubBtn(ctx, this.gameClubBtn);

    if (this.showRankPanel) {
      this.renderLeaderboard(ctx, SCREEN_HEIGHT * 0.52, GameGlobal.databus.score);
    }

    ctx.textAlign = 'left';
  }

  renderGameOver(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('游戏结束', SCREEN_WIDTH / 2, 72);

    ctx.font = '15px sans-serif';
    ctx.fillStyle = '#fdcb6e';
    ctx.fillText(`本次得分 ${GameGlobal.databus.score}`, SCREEN_WIDTH / 2, 100);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText(`到达第 ${GameGlobal.databus.currentLevel} 关`, SCREEN_WIDTH / 2, 122);

    this.renderLeaderboard(ctx, 138, GameGlobal.databus.score);
    if (GameGlobal.adManager?.canShowReviveBtn?.()) {
      this.drawAdBtn(ctx, this.reviveAdBtn, '看广告 · 复活+随机技能', '#e17055');
    }
    this.drawGameClubBtn(ctx, this.gameClubEndBtn);
    this.drawRestartBtn(ctx);
    ctx.textAlign = 'left';
  }

  renderVictory(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    ctx.fillStyle = '#fdcb6e';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('通关！', SCREEN_WIDTH / 2, 72);

    ctx.fillStyle = '#ffffff';
    ctx.font = '15px sans-serif';
    ctx.fillText(`最终得分 ${GameGlobal.databus.score}`, SCREEN_WIDTH / 2, 100);
    if (GameGlobal.databus.scoreBonusClaimed) {
      ctx.fillStyle = '#55efc4';
      ctx.font = '12px sans-serif';
      ctx.fillText('已领取广告积分加成', SCREEN_WIDTH / 2, 118);
    }

    this.renderLeaderboard(ctx, GameGlobal.databus.scoreBonusClaimed ? 128 : 118, GameGlobal.databus.score);
    if (GameGlobal.adManager?.canShowScoreBonusBtn?.()) {
      this.drawAdBtn(ctx, this.scoreBonusAdBtn, '看广告 · 积分+50%', '#00b894');
    }
    this.drawGameClubBtn(ctx, this.gameClubEndBtn);
    this.drawRestartBtn(ctx);
    ctx.textAlign = 'left';
  }

  /** 当前应显示游戏圈入口的场景与按钮区域（供原生按钮对齐） */
  getGameClubScene() {
    const db = GameGlobal.databus;
    if (db.isPaused) return { scene: 'pause', rect: this.gameClubBtn };
    if (db.isGameOver || db.gameCleared) return { scene: 'end', rect: this.gameClubEndBtn };
    return null;
  }

  drawGameClubBtn(ctx, b) {
    this.drawBtn(ctx, b, '游戏圈', '#6c5ce7');
  }

  drawAdBtn(ctx, b, label, color) {
    ctx.fillStyle = color;
    drawRoundRect(ctx, b.x, b.y, b.w, b.h, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1;
    drawRoundRect(ctx, b.x, b.y, b.w, b.h, 8);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('📺', b.x + 18, b.y + b.h / 2 + 5);
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(label, b.x + b.w / 2 + 8, b.y + b.h / 2 + 5);
    ctx.textAlign = 'left';
  }

  renderLeaderboard(ctx, startY, highlightScore) {
    const list = GameGlobal.databus.topScores || [];
    const panelX = 16;
    const panelW = SCREEN_WIDTH - 32;
    const rowH = 22;
    const panelH = 28 + Math.max(list.length, 1) * rowH + 8;

    ctx.fillStyle = 'rgba(15,18,35,0.9)';
    drawRoundRect(ctx, panelX, startY, panelW, panelH, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    drawRoundRect(ctx, panelX, startY, panelW, panelH, 8);
    ctx.stroke();

    ctx.fillStyle = '#74b9ff';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('积分排行榜 TOP10', SCREEN_WIDTH / 2, startY + 20);
    ctx.textAlign = 'left';

    if (!list.length) {
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('暂无记录，快来挑战吧！', SCREEN_WIDTH / 2, startY + 48);
      ctx.textAlign = 'left';
      return;
    }

    list.forEach((rec, i) => {
      const y = startY + 34 + i * rowH;
      const isCurrent = highlightScore != null && rec.score === Math.floor(highlightScore)
        && rec.time >= Date.now() - 5000;
      const isTop3 = i < 3;

      if (isCurrent) {
        ctx.fillStyle = 'rgba(9,132,227,0.25)';
        ctx.fillRect(panelX + 4, y - 14, panelW - 8, rowH - 2);
      }

      ctx.fillStyle = isTop3 ? '#fdcb6e' : 'rgba(255,255,255,0.85)';
      ctx.font = isTop3 ? 'bold 12px sans-serif' : '12px sans-serif';
      ctx.fillText(`${i + 1}.`, panelX + 12, y);

      ctx.fillStyle = isCurrent ? '#74b9ff' : '#ffffff';
      ctx.fillText(`${rec.score} 分`, panelX + 36, y);

      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      const tag = rec.cleared ? '通关' : `第${rec.level}关`;
      ctx.fillText(tag, panelX + 110, y);

      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(ScoreBoard.formatDate(rec.time), panelX + panelW - 10, y);
      ctx.textAlign = 'left';
    });
  }

  drawBtn(ctx, b, label, color) {
    ctx.fillStyle = color;
    drawRoundRect(ctx, b.x, b.y, b.w, b.h, 8);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, b.x + b.w / 2, b.y + b.h / 2 + 5);
    ctx.textAlign = 'left';
  }

  drawRestartBtn(ctx) {
    this.drawBtn(ctx, this.restartBtn, '重新开始', '#0984e3');
  }
}
