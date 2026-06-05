import Emitter from '../libs/tinyemitter';
import CONFIG from '../config/game.config';
import LEVELS, { getLevel } from '../config/levels.config';
import THEME from '../config/theme.config';
import { drawStartBtn } from '../base/assets';
import { drawFruit3D } from '../base/fruit';
import { drawPlate, drawPlayBackground, getPlateBounds } from '../base/plate';
import { hitExposedTile, isExposed } from '../base/board';
import { getBoardArea, getFooterH, getHudH, getSlotBarLayout, roundRect } from '../base/layout';
import { getStars, isUnlocked } from '../base/progress';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render';

export default class GameUI extends Emitter {
  touchX = 0;
  touchY = 0;
  touchMoved = false;

  bindTouch() {
    wx.onTouchStart(this.onStart.bind(this));
    wx.onTouchMove(this.onMove.bind(this));
    wx.onTouchEnd(this.onEnd.bind(this));
  }

  onStart(e) {
    const t = e.touches[0];
    this.touchX = t.clientX;
    this.touchY = t.clientY;
    this.touchMoved = false;
    const db = GameGlobal.databus;
    db.touchStartScene = db.scene;
    GameGlobal.sfx?.ensureBgm();
  }

  onMove(e) {
    const db = GameGlobal.databus;
    const t = e.touches[0];

    if (db.scene === 'menu') {
      const dx = t.clientX - this.touchX;
      if (Math.abs(dx) > 6) this.touchMoved = true;
      db.menuDragX = dx;
      return;
    }

  }

  onEnd() {
    const db = GameGlobal.databus;

    if (db.scene === 'menu') {
      if (db.touchStartScene !== 'menu') {
        db.touchStartScene = '';
        db.menuDragX = 0;
        return;
      }
      const th = 45;
      if (Math.abs(db.menuDragX) >= th) {
        if (db.menuDragX < 0 && db.menuIndex < LEVELS.length - 1) db.menuIndex += 1;
        else if (db.menuDragX > 0 && db.menuIndex > 0) db.menuIndex -= 1;
      } else if (!this.touchMoved) {
        this.handleMenuTap(this.touchX, this.touchY);
      }
      db.menuDragX = 0;
      return;
    }

    if (db.scene === 'play') {
      this.handlePlayTap(this.touchX, this.touchY);
    }
  }

  handleMenuTap(x, y) {
    const db = GameGlobal.databus;
    if (x < SCREEN_WIDTH * 0.12 && db.menuIndex > 0) { db.menuIndex -= 1; return; }
    if (x > SCREEN_WIDTH * 0.88 && db.menuIndex < LEVELS.length - 1) { db.menuIndex += 1; return; }
    const lv = LEVELS[db.menuIndex];
    if (!isUnlocked(lv.id)) return;
    const btn = this.getStartBtn();
    if (this.hit(x, y, btn) && isUnlocked(lv.id)) this.emit('start', lv.id);
  }

  handlePlayTap(x, y) {
    const db = GameGlobal.databus;

    if (db.showExitConfirm) {
      const c = this.getExitConfirmBtns();
      const dialog = this.getExitConfirmDialog();
      if (this.hit(x, y, c.ok)) {
        db.showExitConfirm = false;
        this.emit('menu');
        return;
      }
      if (this.hit(x, y, c.cancel) || !this.hit(x, y, dialog)) {
        db.showExitConfirm = false;
        return;
      }
      return;
    }

    if (this.hit(x, y, this.getExitBtn()) && !db.isOver) {
      db.showExitConfirm = true;
      return;
    }

    if (db.isOver) {
      const btns = this.getResultBtns();
      if (this.hit(x, y, btns.retry)) this.emit('start', db.levelId);
      if (btns.next && this.hit(x, y, btns.next)) this.emit('start', db.levelId + 1);
      if (this.hit(x, y, btns.menu)) this.emit('menu');
      return;
    }

    const area = this.getPlayBoardArea();
    if (!this.hit(x, y, area)) return;

    const tile = hitExposedTile(db.tiles, x, y);
    if (!tile) return;

    const result = db.pickTile(tile);

    if (result === 'bomb') {
      GameGlobal.particles.burst(tile.x, tile.y, '#FF5252', 18);
      GameGlobal.sfx?.playFind();
    } else if (result === 'clear') {
      GameGlobal.particles.burst(tile.x, tile.y, '#69F0AE', 14);
      GameGlobal.sfx?.playClear();
    } else if (result === 'overflow') {
      GameGlobal.sfx?.playMiss();
    }
  }

  hit(x, y, r) {
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  }

  getPlayBoardArea() {
    return getBoardArea();
  }

  getCardMetrics() {
    const h = SCREEN_HEIGHT * 0.4;
    return { w: SCREEN_WIDTH * 0.8, h, gap: 14, y: SCREEN_HEIGHT * 0.5 - h / 2 - 50 };
  }

  getCardRect(i) {
    const db = GameGlobal.databus;
    const m = this.getCardMetrics();
    const spacing = m.w + m.gap;
    const cx = SCREEN_WIDTH / 2 + (i - db.menuIndex) * spacing + db.menuDragX;
    return { x: cx - m.w / 2, y: m.y, w: m.w, h: m.h };
  }

  getStartBtn() {
    const m = this.getCardMetrics();
    const w = Math.min(168, SCREEN_WIDTH * 0.48);
    const h = w * 0.44;
    return {
      x: SCREEN_WIDTH / 2 - w / 2,
      y: m.y + m.h + 24,
      w,
      h,
    };
  }

  getExitBtn() {
    const h = getHudH();
    return { x: 8, y: 6, w: 40, h: h - 12 };
  }

  getExitConfirmDialog() {
    const w = 210;
    const hh = 118;
    return { x: SCREEN_WIDTH / 2 - w / 2, y: SCREEN_HEIGHT / 2 - hh / 2, w, h: hh };
  }

  getExitConfirmBtns() {
    const d = this.getExitConfirmDialog();
    const size = 50;
    const gap = 28;
    const y = d.y + d.h - size - 18;
    const cx = SCREEN_WIDTH / 2;
    return {
      ok: { x: cx - gap / 2 - size, y, w: size, h: size },
      cancel: { x: cx + gap / 2, y, w: size, h: size },
    };
  }

  getResultBtns() {
    const db = GameGlobal.databus;
    const y = SCREEN_HEIGHT / 2 + 50;
    const h = 42;
    const hasNext = db.isWin && db.levelId < LEVELS.length && isUnlocked(db.levelId + 1);
    if (hasNext) {
      const w = 110;
      const g = 10;
      const total = w * 3 + g * 2;
      const sx = SCREEN_WIDTH / 2 - total / 2;
      return {
        retry: { x: sx, y, w, h },
        next: { x: sx + w + g, y, w, h },
        menu: { x: sx + (w + g) * 2, y, w, h },
      };
    }
    const w = 130;
    const g = 14;
    return {
      retry: { x: SCREEN_WIDTH / 2 - w - g / 2, y, w, h },
      next: null,
      menu: { x: SCREEN_WIDTH / 2 + g / 2, y, w, h },
    };
  }

  drawIconBtn(ctx, x, y, w, h, bg) {
    roundRect(ctx, x, y, w, h, 10);
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  drawIcon(ctx, type, cx, cy, s) {
    ctx.strokeStyle = '#fff';
    ctx.fillStyle = '#fff';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    if (type === 'exit') {
      ctx.strokeRect(cx - s * 0.22, cy - s * 0.28, s * 0.44, s * 0.56);
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.08, cy);
      ctx.lineTo(cx - s * 0.38, cy);
      ctx.moveTo(cx - s * 0.28, cy - s * 0.12);
      ctx.lineTo(cx - s * 0.38, cy);
      ctx.lineTo(cx - s * 0.28, cy + s * 0.12);
      ctx.stroke();
    } else if (type === 'check') {
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.28, cy + s * 0.02);
      ctx.lineTo(cx - s * 0.06, cy + s * 0.26);
      ctx.lineTo(cx + s * 0.32, cy - s * 0.24);
      ctx.stroke();
    } else if (type === 'close') {
      const d = s * 0.24;
      ctx.beginPath();
      ctx.moveTo(cx - d, cy - d);
      ctx.lineTo(cx + d, cy + d);
      ctx.moveTo(cx + d, cy - d);
      ctx.lineTo(cx - d, cy + d);
      ctx.stroke();
    }
  }

  renderMenu(ctx) {
    const db = GameGlobal.databus;
    const g = ctx.createLinearGradient(0, 0, 0, SCREEN_HEIGHT);
    g.addColorStop(0, THEME.menuBg[0]);
    g.addColorStop(0.5, THEME.menuBg[1]);
    g.addColorStop(1, THEME.menuBg[2]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    const cardMid = this.getCardMetrics().y + this.getCardMetrics().h / 2;
    if (db.menuIndex > 0) {
      ctx.font = 'bold 36px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('‹', SCREEN_WIDTH * 0.08, cardMid);
    }
    if (db.menuIndex < LEVELS.length - 1) {
      ctx.fillText('›', SCREEN_WIDTH * 0.92, cardMid);
    }

    LEVELS.forEach((lv, i) => {
      const card = this.getCardRect(i);
      if (card.x + card.w < -30 || card.x > SCREEN_WIDTH + 30) return;
      const active = i === db.menuIndex;
      const unlocked = isUnlocked(lv.id);
      const stars = getStars(lv.id);
      const scale = active ? 1 : 0.9;
      const cx = card.x + card.w / 2;
      const cy = card.y + card.h / 2;
      const w = card.w * scale;
      const h = card.h * scale;
      const x = cx - w / 2;
      const y = cy - h / 2;

      ctx.save();
      ctx.globalAlpha = active ? 1 : 0.72;
      roundRect(ctx, x, y, w, h, 16);
      const cg = ctx.createLinearGradient(x, y, x, y + h);
      cg.addColorStop(0, lv.accent);
      cg.addColorStop(1, lv.accentDark);
      ctx.fillStyle = cg;
      ctx.fill();
      ctx.strokeStyle = active ? '#FFF59D' : 'rgba(255,255,255,0.35)';
      ctx.lineWidth = active ? 4 : 2;
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.font = '52px sans-serif';
      ctx.fillText('🍎🍊🍇', cx, y + h * 0.36);
      ctx.font = 'bold 32px sans-serif';
      ctx.fillStyle = '#fff';
      ctx.fillText('💣×3', cx, y + h * 0.56);

      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(lv.name, cx, y + h - 62);
      ctx.font = '13px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillText(lv.desc, cx, y + h - 38);
      ctx.font = '16px sans-serif';
      ctx.fillText(stars ? '★'.repeat(stars) + '☆'.repeat(3 - stars) : '未完成', cx, y + h - 16);

      if (!unlocked) {
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        roundRect(ctx, x, y, w, h, 16);
        ctx.fill();
        ctx.textAlign = 'center';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillStyle = '#ECEFF1';
        ctx.fillText('🔒 通关上一关解锁', cx, cy);
      }
      ctx.restore();
    });

    const m = this.getCardMetrics();
    LEVELS.forEach((_, i) => {
      ctx.beginPath();
      ctx.arc(SCREEN_WIDTH / 2 + (i - (LEVELS.length - 1) / 2) * 12, m.y + m.h + 10, i === db.menuIndex ? 5 : 3, 0, Math.PI * 2);
      ctx.fillStyle = i === db.menuIndex ? '#FFD54F' : 'rgba(255,255,255,0.35)';
      ctx.fill();
    });

    const cur = LEVELS[db.menuIndex];
    const btn = this.getStartBtn();
    ctx.globalAlpha = isUnlocked(cur.id) ? 1 : 0.45;
    drawStartBtn(ctx, btn.x, btn.y, btn.w, btn.h);
    ctx.globalAlpha = 1;
  }

  renderPlay(ctx) {
    const db = GameGlobal.databus;
    const lv = getLevel(db.levelId);

    ctx.save();
    this.renderHud(ctx, lv);
    this.renderBoard(ctx);
    GameGlobal.particles.render(ctx);
    this.renderFooter(ctx);
    if (db.isOver) this.renderResult(ctx, lv);
    if (db.showExitConfirm) this.renderExitConfirm(ctx);
    ctx.restore();
  }

  renderHud(ctx, lv) {
    const db = GameGlobal.databus;
    const h = getHudH();
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, THEME.hudBg[0]);
    g.addColorStop(1, THEME.hudBg[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, SCREEN_WIDTH, h);

    const exit = this.getExitBtn();
    this.drawIconBtn(ctx, exit.x, exit.y, exit.w, exit.h, '#795548');
    this.drawIcon(ctx, 'exit', exit.x + exit.w / 2, exit.y + exit.h / 2, exit.w * 0.34);

    ctx.textBaseline = 'middle';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = THEME.textLight;
    ctx.fillText(lv.name, exit.x + exit.w + 8, h / 2);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFAB91';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`💣 ${db.bombsFound}/3`, SCREEN_WIDTH / 2, h / 2);

    ctx.textAlign = 'right';
    ctx.fillStyle = THEME.textWarm;
    ctx.font = '13px sans-serif';
    ctx.fillText(`${db.remainingTiles()}`, SCREEN_WIDTH - 14, h / 2);

    if (db.flashMsg) {
      ctx.fillStyle = '#FFCDD2';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(db.flashMsg, SCREEN_WIDTH / 2, h - 4);
    }
  }

  drawTile(ctx, tile, tiles, exposed) {
    drawFruit3D(ctx, tile, exposed);
  }

  renderBoard(ctx) {
    const db = GameGlobal.databus;
    const area = this.getPlayBoardArea();
    const plate = getPlateBounds(area);
    const live = [...db.tiles].filter((t) => !t.removed);

    drawPlayBackground(ctx, area);
    drawPlate(ctx, plate);

    const blocked = live
      .filter((t) => !isExposed(t, db.tiles))
      .sort((a, b) => a.layer - b.layer || a.uid - b.uid);
    const exposed = live
      .filter((t) => isExposed(t, db.tiles))
      .sort((a, b) => a.layer - b.layer || a.uid - b.uid);

    blocked.forEach((tile) => this.drawTile(ctx, tile, db.tiles, false));
    exposed.forEach((tile) => this.drawTile(ctx, tile, db.tiles, true));
  }

  renderSlotBar(ctx) {
    const db = GameGlobal.databus;
    const layout = getSlotBarLayout();
    const fh = getFooterH();
    const y = SCREEN_HEIGHT - fh;
    const last = layout.slots[layout.slots.length - 1];
    const barW = last.x + last.w - layout.slots[0].x + 16;

    ctx.fillStyle = THEME.footerBg;
    ctx.fillRect(0, y, SCREEN_WIDTH, fh);

    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    roundRect(ctx, layout.slots[0].x - 10, layout.barY, barW, layout.slots[0].h + 16, 14);
    ctx.fill();
    ctx.strokeStyle = '#A1887F';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    layout.slots.forEach((slot, i) => {
      ctx.fillStyle = '#FFFFFF';
      roundRect(ctx, slot.x, slot.y, slot.w, slot.h, 8);
      ctx.fill();
      ctx.strokeStyle = '#A1887F';
      ctx.lineWidth = 2;
      ctx.stroke();

      const tile = db.slots[i];
      if (!tile) return;
      ctx.font = `${Math.floor(slot.w * 0.85)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = 1;
      ctx.fillText(tile.emoji, slot.x + slot.w / 2, slot.y + slot.h / 2);
    });

    const filled = db.slots.length;
    const dotY = y + fh - 8;
    const dotGap = 10;
    const dotStart = SCREEN_WIDTH / 2 - ((CONFIG.slotMax - 1) * dotGap) / 2;
    for (let i = 0; i < CONFIG.slotMax; i += 1) {
      ctx.beginPath();
      ctx.arc(dotStart + i * dotGap, dotY, i < filled ? 3.5 : 2.5, 0, Math.PI * 2);
      ctx.fillStyle = i < filled ? '#FF8F00' : 'rgba(161,136,127,0.35)';
      ctx.fill();
    }
  }

  renderFooter(ctx) {
    this.renderSlotBar(ctx);
  }

  renderExitConfirm(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    const d = this.getExitConfirmDialog();
    roundRect(ctx, d.x, d.y, d.w, d.h, 14);
    ctx.fillStyle = 'rgba(78,52,46,0.98)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = THEME.textLight;
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('返回', d.x + d.w / 2, d.y + 38);
    const c = this.getExitConfirmBtns();
    this.drawIconBtn(ctx, c.ok.x, c.ok.y, c.ok.w, c.ok.h, '#E65100');
    this.drawIcon(ctx, 'check', c.ok.x + c.ok.w / 2, c.ok.y + c.ok.h / 2, c.ok.w * 0.34);
    this.drawIconBtn(ctx, c.cancel.x, c.cancel.y, c.cancel.w, c.cancel.h, '#546E7A');
    this.drawIcon(ctx, 'close', c.cancel.x + c.cancel.w / 2, c.cancel.y + c.cancel.h / 2, c.cancel.w * 0.34);
  }

  renderResult(ctx, lv) {
    const db = GameGlobal.databus;
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(db.isWin ? '🎉 炸弹全部找到！' : '💥 槽位已满', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 56);
    if (db.isWin) {
      ctx.font = '22px sans-serif';
      ctx.fillStyle = '#FFD54F';
      ctx.fillText('★'.repeat(db.stars) + '☆'.repeat(3 - db.stars), SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 16);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = '14px sans-serif';
      ctx.fillText(`三消 ${db.cleared} 次 · 找出 3 颗炸弹`, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 12);
    } else {
      ctx.font = '14px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillText(`已找到 ${db.bombsFound}/3 颗炸弹`, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 8);
    }
    const btns = this.getResultBtns();
    const drawBtn = (b, label, color) => {
      roundRect(ctx, b.x, b.y, b.w, b.h, 10);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(label, b.x + b.w / 2, b.y + b.h / 2);
    };
    drawBtn(btns.retry, '再试一次', lv.accentDark);
    if (btns.next) drawBtn(btns.next, '下一关', '#1976D2');
    drawBtn(btns.menu, '选关', '#455A64');
  }

  render(ctx) {
    const db = GameGlobal.databus;
    if (db.scene === 'menu') this.renderMenu(ctx);
    else this.renderPlay(ctx);
  }
}
