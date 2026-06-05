import Emitter from '../libs/tinyemitter';
import CONFIG from '../config/game.config';
import LEVELS, { getLevel } from '../config/levels.config';
import { drawCover, getImage } from '../base/assets';
import { drawDifference, drawFoundMark, drawHintRing, drawWrongMark } from '../base/diff';
import { diffToPixel, getFooterH, getHudH, getPanels, roundRect, tapToRelative } from '../base/layout';
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
    if (db.scene === 'menu') return;
    if (db.scene === 'play') this.handlePlayTouch(t.clientX, t.clientY);
  }

  onMove(e) {
    const db = GameGlobal.databus;
    if (db.scene !== 'menu') return;
    const t = e.touches[0];
    const dx = t.clientX - this.touchX;
    if (Math.abs(dx) > 6) this.touchMoved = true;
    db.menuDragX = dx;
  }

  onEnd() {
    const db = GameGlobal.databus;
    if (db.scene !== 'menu') return;
    const th = 45;
    if (Math.abs(db.menuDragX) >= th) {
      if (db.menuDragX < 0 && db.menuIndex < LEVELS.length - 1) db.menuIndex += 1;
      else if (db.menuDragX > 0 && db.menuIndex > 0) db.menuIndex -= 1;
    } else if (!this.touchMoved) {
      this.handleMenuTap(this.touchX, this.touchY);
    }
    db.menuDragX = 0;
  }

  handleMenuTap(x, y) {
    const db = GameGlobal.databus;
    if (x < SCREEN_WIDTH * 0.12 && db.menuIndex > 0) { db.menuIndex -= 1; return; }
    if (x > SCREEN_WIDTH * 0.88 && db.menuIndex < LEVELS.length - 1) { db.menuIndex += 1; return; }
    const lv = LEVELS[db.menuIndex];
    if (!isUnlocked(lv.id)) return;
    const btn = this.getStartBtn();
    const card = this.getCardRect(db.menuIndex);
    if (this.hit(x, y, btn) || this.hit(x, y, card)) this.emit('start', lv.id);
  }

  handlePlayTouch(x, y) {
    const db = GameGlobal.databus;
    if (db.isOver) {
      const btns = this.getResultBtns();
      if (this.hit(x, y, btns.retry)) this.emit('start', db.levelId);
      if (btns.next && this.hit(x, y, btns.next)) this.emit('start', db.levelId + 1);
      if (this.hit(x, y, btns.menu)) this.emit('menu');
      return;
    }
    if (this.hit(x, y, this.getHintBtn())) {
      db.useHint();
      return;
    }
    const tap = tapToRelative(x, y);
    if (!tap) return;
    const result = db.tryFind(tap.rx, tap.ry);
    if (result.ok) {
      const panel = getPanels()[tap.panel];
      const pos = diffToPixel(result.diff, panel);
      GameGlobal.particles.burst(pos.x, pos.y, '#69F0AE', 16);
      GameGlobal.particles.ring(pos.x, pos.y);
      try { wx.vibrateShort({ type: 'light' }); } catch (e) { /* ignore */ }
    } else {
      db.wrongMark = { x: tap.px, y: tap.py, life: 30 };
      try { wx.vibrateShort({ type: 'medium' }); } catch (e) { /* ignore */ }
    }
  }

  hit(x, y, r) {
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  }

  getCardMetrics() {
    return { w: SCREEN_WIDTH * 0.42, h: SCREEN_HEIGHT * 0.55, gap: 24, y: SCREEN_HEIGHT * 0.18 };
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
    return { x: SCREEN_WIDTH / 2 - 96, y: m.y + m.h + 16, w: 192, h: 44 };
  }

  getHintBtn() {
    const fh = getFooterH();
    return { x: SCREEN_WIDTH / 2 - 60, y: SCREEN_HEIGHT - fh + 8, w: 120, h: fh - 16 };
  }

  getResultBtns() {
    const db = GameGlobal.databus;
    const y = SCREEN_HEIGHT / 2 + 50;
    const h = 42;
    const hasNext = db.isWin && db.levelId < 3 && isUnlocked(db.levelId + 1);
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

  renderMenu(ctx) {
    const db = GameGlobal.databus;
    const bg = getImage(CONFIG.assets.menuBg);
    if (bg._loaded) {
      drawCover(ctx, CONFIG.assets.menuBg, 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
      ctx.fillStyle = 'rgba(20,12,48,0.45)';
      ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    } else {
      const g = ctx.createLinearGradient(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
      g.addColorStop(0, '#311B92');
      g.addColorStop(1, '#0D1B3E');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#E8EAF6';
    ctx.font = 'bold 30px sans-serif';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 8;
    ctx.fillText(CONFIG.title, SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.09);
    ctx.shadowBlur = 0;
    ctx.font = '13px sans-serif';
    ctx.fillStyle = 'rgba(232,234,246,0.8)';
    ctx.fillText(CONFIG.subtitle, SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.09 + 30);
    ctx.fillText('左右滑动 · 在镜像中找到不同之处', SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.09 + 52);

    if (db.menuIndex > 0) {
      ctx.font = 'bold 32px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText('‹', SCREEN_WIDTH * 0.05, SCREEN_HEIGHT * 0.46);
    }
    if (db.menuIndex < LEVELS.length - 1) {
      ctx.fillText('›', SCREEN_WIDTH * 0.95, SCREEN_HEIGHT * 0.46);
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
      ctx.globalAlpha = active ? 1 : 0.7;
      roundRect(ctx, x, y, w, h, 16);
      ctx.save();
      ctx.clip();
      drawCover(ctx, lv.image, x, y, w, h);
      const overlay = ctx.createLinearGradient(x, y, x, y + h);
      overlay.addColorStop(0, 'rgba(0,0,0,0.05)');
      overlay.addColorStop(1, 'rgba(0,0,0,0.8)');
      ctx.fillStyle = overlay;
      ctx.fillRect(x, y, w, h);
      ctx.restore();

      roundRect(ctx, x, y, w, h, 16);
      ctx.strokeStyle = active ? lv.accent : 'rgba(255,255,255,0.3)';
      ctx.lineWidth = active ? 4 : 2;
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.textAlign = 'left';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(lv.name, x + 14, y + h - 52);
      ctx.font = '12px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillText(`${lv.desc} · ${lv.differences.length}处差异`, x + 14, y + h - 30);
      ctx.textAlign = 'right';
      ctx.fillText(stars ? '★'.repeat(stars) + '☆'.repeat(3 - stars) : '未完成', x + w - 14, y + h - 30);

      if (!unlocked) {
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        roundRect(ctx, x, y, w, h, 16);
        ctx.fill();
        ctx.textAlign = 'center';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillStyle = '#ECEFF1';
        ctx.fillText('🔒 通关上一关解锁', cx, cy);
      }
      ctx.restore();
    });

    LEVELS.forEach((_, i) => {
      ctx.beginPath();
      ctx.arc(SCREEN_WIDTH / 2 + (i - 1) * 14, this.getCardMetrics().y + this.getCardMetrics().h + 6, i === db.menuIndex ? 5 : 3.5, 0, Math.PI * 2);
      ctx.fillStyle = i === db.menuIndex ? '#FFD54F' : 'rgba(255,255,255,0.4)';
      ctx.fill();
    });

    const cur = LEVELS[db.menuIndex];
    const btn = this.getStartBtn();
    roundRect(ctx, btn.x, btn.y, btn.w, btn.h, 12);
    ctx.fillStyle = isUnlocked(cur.id) ? cur.accentDark : '#546E7A';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(isUnlocked(cur.id) ? '进入镜界' : '尚未解锁', btn.x + btn.w / 2, btn.y + btn.h / 2);
  }

  renderPlay(ctx) {
    const db = GameGlobal.databus;
    const lv = getLevel(db.levelId);
    const panels = getPanels();
    const shakeX = db.shake > 0 ? (Math.random() - 0.5) * db.shake * 0.6 : 0;

    ctx.save();
    ctx.translate(shakeX, 0);

    this.renderHud(ctx, lv);
    this.renderPanel(ctx, panels.left, lv, false);
    this.renderPanel(ctx, panels.right, lv, true);

    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(panels.dividerX - 1, panels.left.y, 2, panels.left.h);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('VS', panels.dividerX, panels.left.y + panels.left.h / 2);

    GameGlobal.particles.render(ctx);
    lv.differences.forEach((d) => {
      if (!db.found.has(d.id)) return;
      ['left', 'right'].forEach((key) => {
        const pos = diffToPixel(d, panels[key]);
        drawFoundMark(ctx, pos.x, pos.y, pos.r, db.frame);
      });
    });
    if (db.hintTarget) {
      const d = lv.differences.find((x) => x.id === db.hintTarget);
      if (d && !db.found.has(d.id)) {
        const pos = diffToPixel(d, panels.right);
        drawHintRing(ctx, pos.x, pos.y, pos.r, db.frame);
      }
    }
    if (db.wrongMark) {
      drawWrongMark(ctx, db.wrongMark.x, db.wrongMark.y, 30 - db.wrongMark.life, db.wrongMark.life / 30);
    }
    this.renderFooter(ctx, lv);
    if (db.isOver) this.renderResult(ctx, lv);
    ctx.restore();
  }

  renderHud(ctx, lv) {
    const db = GameGlobal.databus;
    const h = getHudH();
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(26,35,126,0.92)');
    g.addColorStop(1, 'rgba(13,27,62,0.95)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, SCREEN_WIDTH, h);

    ctx.textBaseline = 'middle';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = lv.accent;
    ctx.fillText(lv.name, 14, h / 2);

    const sec = Math.floor(db.elapsed / 60);
    ctx.fillStyle = '#E8EAF6';
    ctx.textAlign = 'center';
    ctx.fillText(`⏱ ${sec}s`, SCREEN_WIDTH / 2, h / 2);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#FF8A80';
    ctx.fillText('❤'.repeat(db.lives) + '🖤'.repeat(CONFIG.maxLives - db.lives), SCREEN_WIDTH - 14, h / 2 - 8);
    ctx.fillStyle = '#69F0AE';
    ctx.font = '12px sans-serif';
    ctx.fillText(`已找到 ${db.found.size}/${lv.differences.length}`, SCREEN_WIDTH - 14, h / 2 + 10);
    if (db.combo >= 2) {
      ctx.fillStyle = '#FFD54F';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`连击 x${db.combo}`, SCREEN_WIDTH / 2, h - 6);
    }
  }

  renderPanel(ctx, panel, lv, isMirror) {
    roundRect(ctx, panel.x, panel.y, panel.w, panel.h, 12);
    ctx.save();
    ctx.clip();
    drawCover(ctx, lv.image, panel.x, panel.y, panel.w, panel.h);
    if (isMirror) {
      lv.differences.forEach((d) => {
        if (!GameGlobal.databus.found.has(d.id)) drawDifference(ctx, d, panel.x, panel.y, panel.w, panel.h);
      });
    }
    ctx.restore();
    roundRect(ctx, panel.x, panel.y, panel.w, panel.h, 12);
    ctx.strokeStyle = isMirror ? 'rgba(126,87,192,0.8)' : 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    roundRect(ctx, panel.x + 8, panel.y + 8, 52, 22, 6);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(panel.label, panel.x + 34, panel.y + 19);
  }

  renderFooter(ctx, lv) {
    const db = GameGlobal.databus;
    const fh = getFooterH();
    const y = SCREEN_HEIGHT - fh;
    ctx.fillStyle = 'rgba(13,27,62,0.92)';
    ctx.fillRect(0, y, SCREEN_WIDTH, fh);
    const btn = this.getHintBtn();
    roundRect(ctx, btn.x, btn.y, btn.w, btn.h, 10);
    ctx.fillStyle = db.hintsLeft > 0 ? lv.accentDark : '#455A64';
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(db.hintsLeft > 0 ? `提示 (${db.hintsLeft})` : '提示已用完', btn.x + btn.w / 2, btn.y + btn.h / 2);
    ctx.font = '11px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillText('点击左右任意一侧对应位置', SCREEN_WIDTH / 2, y + fh - 8);
  }

  renderResult(ctx, lv) {
    const db = GameGlobal.databus;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(db.isWin ? '✨ 镜界归一！' : '💫 镜像破碎…', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 56);
    if (db.isWin) {
      ctx.font = '22px sans-serif';
      ctx.fillStyle = '#FFD54F';
      ctx.fillText('★'.repeat(db.stars) + '☆'.repeat(3 - db.stars), SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 16);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = '14px sans-serif';
      ctx.fillText(`用时 ${Math.floor(db.elapsed / 60)} 秒 · 失误 ${db.mistakes} 次`, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 12);
    } else {
      ctx.font = '14px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillText('再仔细观察镜像中的细节', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 4);
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
