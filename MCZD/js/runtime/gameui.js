import Emitter from '../libs/tinyemitter';
import CONFIG from '../config/game.config';
import LEVELS, { getLevel } from '../config/levels.config';
import THEME from '../config/theme.config';
import { drawStartBtn } from '../base/assets';
import { drawMenuScene, drawPlayScene } from '../base/scene';
import { drawFruit3D, drawFruitLite } from '../base/fruit';
import { drawPlate, getPlateBounds } from '../base/plate';
import { hitExposedTile } from '../base/board';
import { getBoardArea, getFooterH, getHudH, getSlotBarLayout, roundRect } from '../base/layout';
import { isUnlocked } from '../base/progress';
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

    const tile = hitExposedTile(db.tiles, x, y, db.getBoardPartition());
    if (!tile) return;

    const pending = db.pickTile(tile);
    if (!pending) return;

    const layout = getSlotBarLayout();

    if (pending.action === 'bomb') {
      GameGlobal.animations.bombFound(tile.x, tile.y);
      GameGlobal.particles.burst(tile.x, tile.y, '#FF5252', 22);
      GameGlobal.particles.sparkle(tile.x, tile.y, '#FF8A80', 10);
      GameGlobal.sfx?.playFind();
      return;
    }

    const slot = layout.slots[pending.insertAt] || layout.slots[layout.slots.length - 1];
    const tx = slot.x + slot.w / 2;
    const ty = slot.y + slot.h / 2;

    GameGlobal.animations.flyToSlot(
      pending.tile,
      tile.x,
      tile.y,
      tx,
      ty,
      () => {
        const result = db.commitFruitPick(pending);
        GameGlobal.animations.slotPop(tx, ty, pending.tile.color || '#FFB74D');
        if (result === 'clear') {
          GameGlobal.animations.tripleClear(tx, ty, pending.tile.color || '#69F0AE');
          GameGlobal.particles.burst(tx, ty, '#69F0AE', 16);
          GameGlobal.particles.emojiBurst(tx, ty, pending.tile.emoji, 4);
          GameGlobal.sfx?.playClear();
        } else if (result === 'overflow') {
          GameGlobal.sfx?.playMiss();
        } else {
          GameGlobal.particles.sparkle(tx, ty, pending.tile.color || '#FFD54F', 5);
          GameGlobal.sfx?.playFind();
        }
      },
    );
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
    const w = Math.min(180, SCREEN_WIDTH * 0.5);
    const h = 48;
    return {
      x: SCREEN_WIDTH / 2 - w / 2,
      y: m.y + m.h + 32,
      w,
      h,
    };
  }

  getExitBtn() {
    const size = 40;
    return { x: 12, y: 10, w: size, h: size };
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
    const frame = db.frame;

    drawMenuScene(ctx, frame);

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
      const scale = active ? 1 : 0.9;
      const floatY = active ? Math.sin(frame * 0.04) * 1.5 : 0;
      const cx = card.x + card.w / 2;
      const cy = card.y + card.h / 2 + floatY;
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
      ctx.strokeStyle = active
        ? `rgba(255,245,157,${0.82 + Math.sin(frame * 0.05) * 0.1})`
        : 'rgba(255,255,255,0.35)';
      ctx.lineWidth = active ? 4 : 2;
      ctx.stroke();

      ctx.textAlign = 'center';
      const fruitY = y + h * 0.36 + (active ? Math.sin(frame * 0.05) * 1.2 : 0);
      ctx.font = '44px sans-serif';
      ctx.fillText('🍎🍊🍇🍌🍉', cx, fruitY);
      ctx.font = 'bold 32px sans-serif';
      ctx.fillStyle = '#fff';
      ctx.fillText('💣×3', cx, y + h * 0.54);
      ctx.font = 'bold 20px sans-serif';
      ctx.fillStyle = '#fff';
      ctx.fillText(lv.name, cx, y + h * 0.72);
      const diff = lv.difficulty || 1;
      ctx.font = 'bold 24px sans-serif';
      ctx.fillStyle = '#FFD54F';
      ctx.fillText('★'.repeat(diff) + '☆'.repeat(3 - diff), cx, y + h * 0.86);

      if (!unlocked) {
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        roundRect(ctx, x, y, w, h, 16);
        ctx.fill();
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
    drawStartBtn(ctx, btn.x, btn.y, btn.w, btn.h, frame, isUnlocked(cur.id));
    ctx.globalAlpha = 1;
  }

  drawTile(ctx, tile, exposed, frame, lite) {
    if (exposed) drawFruit3D(ctx, tile, true, frame);
    else if (lite) drawFruitLite(ctx, tile);
    else drawFruit3D(ctx, tile, false, frame);
  }

  renderPlay(ctx) {
    const db = GameGlobal.databus;
    const lv = getLevel(db.levelId);
    const frame = db.frame;
    const fh = getFooterH();
    const partition = db.getBoardPartition();
    const liteScene = partition.liveCount > 90;

    ctx.save();
    drawPlayScene(ctx, frame, lv.accent, fh, liteScene);
    this.renderBoard(ctx, lv, frame);
    GameGlobal.particles.render(ctx);
    GameGlobal.animations.render(ctx);
    this.renderHud(ctx);
    this.renderFooter(ctx, frame);
    if (db.isOver) this.renderResult(ctx, lv);
    if (db.showExitConfirm) this.renderExitConfirm(ctx);
    ctx.restore();
  }

  renderHud(ctx) {
    const exit = this.getExitBtn();
    ctx.save();
    ctx.shadowColor = 'rgba(62,39,35,0.25)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 2;
    this.drawIconBtn(ctx, exit.x, exit.y, exit.w, exit.h, 'rgba(255,255,255,0.92)');
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    this.drawIconBrown(ctx, 'exit', exit.x + exit.w / 2, exit.y + exit.h / 2, exit.w * 0.32);
    ctx.restore();
  }

  drawIconBrown(ctx, type, cx, cy, s) {
    ctx.strokeStyle = '#5D4037';
    ctx.fillStyle = '#5D4037';
    ctx.lineWidth = 2.2;
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
    }
  }

  renderBoard(ctx, lv, frame) {
    const db = GameGlobal.databus;
    const area = this.getPlayBoardArea();
    const plate = getPlateBounds(area);
    const { blocked, exposed, liveCount } = db.getBoardPartition();
    const liteDraw = liveCount > 60;

    drawPlate(ctx, plate, frame);

    blocked.forEach((tile) => this.drawTile(ctx, tile, false, frame, liteDraw));
    exposed.forEach((tile) => this.drawTile(ctx, tile, true, frame, liteDraw));
  }

  renderSlotBar(ctx, frame) {
    const db = GameGlobal.databus;
    const layout = getSlotBarLayout();
    const fh = getFooterH();
    const y = SCREEN_HEIGHT - fh;
    const last = layout.slots[layout.slots.length - 1];
    const barW = last.x + last.w - layout.slots[0].x + 20;

    ctx.save();
    ctx.shadowColor = 'rgba(62,39,55,0.4)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 3;

    const barGrad = ctx.createLinearGradient(layout.slots[0].x - 12, layout.barY, layout.slots[0].x - 12, layout.barY + layout.slots[0].h + 18);
    barGrad.addColorStop(0, 'rgba(255,253,248,0.97)');
    barGrad.addColorStop(0.45, 'rgba(255,243,224,0.95)');
    barGrad.addColorStop(1, 'rgba(255,224,178,0.93)');
    ctx.fillStyle = barGrad;
    roundRect(ctx, layout.slots[0].x - 12, layout.barY, barW, layout.slots[0].h + 18, 18);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(161,136,127,0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    layout.slots.forEach((slot, i) => {
      const filled = i < db.slots.length;
      const glow = filled && Math.sin(frame * 0.08 + i) > 0.92;

      ctx.fillStyle = filled ? '#FFFFFF' : 'rgba(255,255,255,0.55)';
      roundRect(ctx, slot.x, slot.y, slot.w, slot.h, 10);
      ctx.fill();
      ctx.strokeStyle = glow ? '#FF8F00' : '#BCAAA4';
      ctx.lineWidth = glow ? 2.5 : 2;
      ctx.stroke();

      const tile = db.slots[i];
      if (!tile) return;

      const mini = {
        ...tile,
        x: slot.x + slot.w / 2,
        y: slot.y + slot.h / 2,
        size: slot.w * 0.92,
      };
      drawFruit3D(ctx, mini, true, frame);
    });

    const filled = db.slots.length;
    const dotY = y + fh - 8;
    const dotGap = 10;
    const dotStart = SCREEN_WIDTH / 2 - ((CONFIG.slotMax - 1) * dotGap) / 2;
    for (let i = 0; i < CONFIG.slotMax; i += 1) {
      ctx.beginPath();
      ctx.arc(dotStart + i * dotGap, dotY, i < filled ? 3.5 : 2.5, 0, Math.PI * 2);
      ctx.fillStyle = i < filled ? '#FFB300' : 'rgba(255,255,255,0.25)';
      ctx.fill();
    }
  }

  renderFooter(ctx, frame) {
    this.renderSlotBar(ctx, frame);
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
