import Emitter from '../libs/tinyemitter';
import CONFIG from '../config/game.config';
import { drawCover, drawSprite, drawTiled, getImage } from '../base/assets';
import { getSave } from '../base/progress';
import { formatPower, formatTime, radiusFromPower, roundRect } from '../base/math';
import { canUseSkill, useSkill } from '../combat/skills';
import { getUnlockedWeapons } from '../combat/weapons';
import { renderAuras, renderFx, renderWheels } from '../runtime/fx';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render';

const MODES = [CONFIG.modes.normal, CONFIG.modes.extreme];

export default class GameUI extends Emitter {
  touchX = 0;
  touchY = 0;
  touchMoved = false;
  touchStartScene = 'menu';

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
    this.touchStartScene = db.scene;
    if (db.scene === 'menu') return;
    if (db.scene === 'play') this.handlePlayTouch(t.clientX, t.clientY);
  }

  onMove(e) {
    const t = e.touches[0];
    const db = GameGlobal.databus;
    if (db.scene === 'menu') {
      const dx = t.clientX - this.touchX;
      if (Math.abs(dx) > 6) this.touchMoved = true;
      db.menuDragX = dx;
      return;
    }
    if (db.scene === 'play' && !db.isOver && !db.showExitConfirm && !this.inActionZone(t.clientX, t.clientY, db)) {
      this.touchMoved = true;
      this.setMoveTarget(t.clientX, t.clientY);
    }
  }

  onEnd() {
    const db = GameGlobal.databus;
    if (db.scene === 'menu') {
      if (this.touchStartScene !== 'menu') {
        db.menuDragX = 0;
        return;
      }
      const th = 45;
      if (Math.abs(db.menuDragX) >= th) {
        if (db.menuDragX < 0 && db.menuIndex < 1) db.menuIndex += 1;
        else if (db.menuDragX > 0 && db.menuIndex > 0) db.menuIndex -= 1;
      } else if (!this.touchMoved) {
        this.handleMenuTap(this.touchX, this.touchY);
      }
      db.menuDragX = 0;
      return;
    }
    if (db.scene === 'play' && !db.isOver && !db.showExitConfirm) {
      db.player.stopMove();
    }
  }

  handlePlayTouch(x, y) {
    const db = GameGlobal.databus;
    if (db.showExitConfirm) {
      const c = this.getExitConfirmBtns();
      if (this.hit(x, y, c.ok)) { db.showExitConfirm = false; this.emit('menu'); return; }
      if (this.hit(x, y, c.cancel)) { db.showExitConfirm = false; return; }
      return;
    }
    if (db.isOver) {
      this.handleResultTouch(x, y);
      return;
    }
    if (this.hit(x, y, this.getFabBtn(db))) {
      db.actionBarOpen = !db.actionBarOpen;
      db.player.stopMove();
      return;
    }
    if (this.hit(x, y, this.getExitBtn())) {
      db.showExitConfirm = true;
      db.player.stopMove();
      return;
    }
    if (db.actionBarOpen) {
      const skillHit = this.getSkillBtns().find((b) => this.hit(x, y, b));
      if (skillHit) {
        useSkill(db, skillHit.id);
        db.player.stopMove();
        return;
      }
    }
    if (this.inActionZone(x, y, db)) return;
    this.setMoveTarget(x, y);
  }

  getActionH(db) {
    return db.actionBarOpen ? SCREEN_HEIGHT * CONFIG.actionBarHeight : 0;
  }

  getFabBtn(db) {
    const size = 50;
    const margin = 12;
    const barH = this.getActionH(db);
    return {
      x: SCREEN_WIDTH - size - margin,
      y: SCREEN_HEIGHT - barH - size - margin,
      w: size,
      h: size,
    };
  }

  inActionZone(x, y, db) {
    if (this.hit(x, y, this.getFabBtn(db))) return true;
    if (!db.actionBarOpen) return false;
    return y >= SCREEN_HEIGHT * (1 - CONFIG.actionBarHeight);
  }

  setMoveTarget(sx, sy) {
    const db = GameGlobal.databus;
    const hud = SCREEN_HEIGHT * CONFIG.hudHeight;
    if (sy < hud + 6 || this.inActionZone(sx, sy, db)) return;
    db.player.setMoveTarget(sx + db.camX, sy + db.camY - hud);
  }

  handleMenuTap(x, y) {
    const db = GameGlobal.databus;
    if (x < SCREEN_WIDTH * 0.1 && db.menuIndex > 0) { db.menuIndex -= 1; return; }
    if (x > SCREEN_WIDTH * 0.9 && db.menuIndex < 1) { db.menuIndex += 1; return; }
    const card = this.getCardRect(db.menuIndex);
    const btn = this.getStartBtn();
    if (this.hit(x, y, card) || this.hit(x, y, btn)) {
      this.emit('start', MODES[db.menuIndex].id);
    }
  }

  handleResultTouch(x, y) {
    const btns = this.getResultBtns();
    if (this.hit(x, y, btns.retry)) this.emit('start', GameGlobal.databus.mode);
    if (this.hit(x, y, btns.menu)) this.emit('menu');
  }

  hit(x, y, r) {
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  }

  getExitBtn() {
    const h = SCREEN_HEIGHT * CONFIG.hudHeight;
    return { x: 8, y: 6, w: 50, h: h - 12 };
  }

  getExitConfirmBtns() {
    const y = SCREEN_HEIGHT / 2 + 18;
    const w = 88;
    const g = 12;
    return {
      ok: { x: SCREEN_WIDTH / 2 - w - g / 2, y, w, h: 40 },
      cancel: { x: SCREEN_WIDTH / 2 + g / 2, y, w, h: 40 },
    };
  }

  getCardRect(i) {
    const db = GameGlobal.databus;
    const w = SCREEN_WIDTH * 0.48;
    const h = SCREEN_HEIGHT * 0.58;
    const gap = 24;
    const cx = SCREEN_WIDTH / 2 + (i - db.menuIndex) * (w + gap) + db.menuDragX;
    return { x: cx - w / 2, y: SCREEN_HEIGHT * 0.16, w, h };
  }

  getStartBtn() {
    return { x: SCREEN_WIDTH / 2 - 72, y: SCREEN_HEIGHT * 0.82, w: 144, h: 44 };
  }

  getSkillBtns() {
    const barY = SCREEN_HEIGHT * (1 - CONFIG.actionBarHeight);
    const size = 46;
    const gap = 10;
    const total = CONFIG.skills.length * size + (CONFIG.skills.length - 1) * gap;
    let x = 12;
    const y = barY + (SCREEN_HEIGHT * CONFIG.actionBarHeight - size) / 2;
    if (x + total > SCREEN_WIDTH * 0.55) x = 8;
    return CONFIG.skills.map((s, i) => ({
      id: s.id,
      skill: s,
      x: x + i * (size + gap),
      y,
      w: size,
      h: size,
    }));
  }

  getWeaponSlots() {
    const barY = SCREEN_HEIGHT * (1 - CONFIG.actionBarHeight);
    const size = 46;
    const gap = 10;
    const total = CONFIG.weapons.length * size + (CONFIG.weapons.length - 1) * gap;
    let x = SCREEN_WIDTH - total - 12;
    const y = barY + (SCREEN_HEIGHT * CONFIG.actionBarHeight - size) / 2;
    return CONFIG.weapons.map((w, i) => ({
      weapon: w,
      x: x + i * (size + gap),
      y,
      w: size,
      h: size,
    }));
  }

  getResultBtns() {
    const y = SCREEN_HEIGHT / 2 + 36;
    const w = 100;
    const g = 12;
    return {
      retry: { x: SCREEN_WIDTH / 2 - w - g / 2, y, w, h: 40 },
      menu: { x: SCREEN_WIDTH / 2 + g / 2, y, w, h: 40 },
    };
  }

  renderMenu(ctx) {
    const db = GameGlobal.databus;
    const save = getSave();
    const bg = getImage(CONFIG.assets.menuBg);
    if (bg._loaded) {
      drawCover(ctx, CONFIG.assets.menuBg, 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
      ctx.fillStyle = 'rgba(10,6,24,0.5)';
      ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    } else {
      ctx.fillStyle = '#0A0618';
      ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    }

    ctx.textAlign = 'center';
    ctx.fillStyle = '#E1BEE7';
    ctx.font = 'bold 34px sans-serif';
    ctx.shadowColor = 'rgba(156,39,176,0.6)';
    ctx.shadowBlur = 10;
    ctx.fillText(CONFIG.title, SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.1);
    ctx.shadowBlur = 0;
    ctx.font = '12px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText(`最高 ${formatPower(save.normalMaxPower)}`, SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.1 + 28);

    if (db.menuIndex > 0) {
      ctx.font = 'bold 30px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.fillText('‹', SCREEN_WIDTH * 0.05, SCREEN_HEIGHT * 0.45);
    }
    if (db.menuIndex < 1) {
      ctx.fillText('›', SCREEN_WIDTH * 0.95, SCREEN_HEIGHT * 0.45);
    }

    MODES.forEach((m, i) => {
      const card = this.getCardRect(i);
      if (card.x + card.w < -20 || card.x > SCREEN_WIDTH + 20) return;
      const active = i === db.menuIndex;
      const scale = active ? 1 : 0.88;
      const cx = card.x + card.w / 2;
      const cy = card.y + card.h / 2;
      const w = card.w * scale;
      const h = card.h * scale;
      const x = cx - w / 2;
      const y = cy - h / 2;
      const radius = 20;
      ctx.save();
      ctx.globalAlpha = active ? 1 : 0.7;
      roundRect(ctx, x, y, w, h, radius);
      ctx.clip();

      const imgH = h * 0.78;
      ctx.fillStyle = m.accentDark;
      ctx.fillRect(x, y, w, h);
      if (drawCover(ctx, CONFIG.assets.menuBg, x, y, w, imgH)) {
        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        ctx.fillRect(x, y, w, imgH);
      }

      const stripY = y + imgH;
      const stripH = h - imgH;
      ctx.fillStyle = m.accentDark;
      ctx.fillRect(x, stripY, w, stripH);
      ctx.fillStyle = m.accent;
      ctx.fillRect(x, stripY, w, 3);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(m.name, cx, stripY + stripH / 2);
      ctx.textBaseline = 'alphabetic';
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = active ? 1 : 0.7;
      roundRect(ctx, x, y, w, h, radius);
      ctx.strokeStyle = active ? '#FFD54F' : 'rgba(255,255,255,0.25)';
      ctx.lineWidth = active ? 4 : 2;
      ctx.stroke();
      ctx.restore();
    });

    MODES.forEach((_, i) => {
      ctx.beginPath();
      ctx.arc(SCREEN_WIDTH / 2 + (i - 0.5) * 16, SCREEN_HEIGHT * 0.8, i === db.menuIndex ? 5 : 3, 0, Math.PI * 2);
      ctx.fillStyle = i === db.menuIndex ? '#FFD54F' : 'rgba(255,255,255,0.35)';
      ctx.fill();
    });

    const btn = this.getStartBtn();
    roundRect(ctx, btn.x, btn.y, btn.w, btn.h, 12);
    ctx.fillStyle = MODES[db.menuIndex].accentDark;
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('开始', btn.x + btn.w / 2, btn.y + btn.h / 2);
  }

  renderWorld(ctx) {
    const db = GameGlobal.databus;
    const mode = CONFIG.modes[db.mode];
    const hud = SCREEN_HEIGHT * CONFIG.hudHeight;
    const actionH = this.getActionH(db);
    const viewH = SCREEN_HEIGHT - hud - actionH;
    const camX = db.camX;
    const camY = db.camY;
    const pad = 280;
    const unlocked = getUnlockedWeapons(db.player);

    ctx.save();
    ctx.translate(-camX, -camY + hud);

    const vx = camX - pad;
    const vy = camY - pad;
    const vw = SCREEN_WIDTH + pad * 2;
    const vh = viewH + pad * 2;
    if (!drawTiled(ctx, CONFIG.assets.tileGround, vx, vy, vw, vh)) {
      ctx.fillStyle = '#15101F';
      ctx.fillRect(vx, vy, vw, vh);
    }
    ctx.fillStyle = 'rgba(10,6,20,0.18)';
    ctx.fillRect(vx, vy, vw, vh);

    db.terrain.forEach((t) => {
      if (t.x < vx - 200 || t.x > vx + vw + 200 || t.y < vy - 200 || t.y > vy + vh + 200) return;
      const src = CONFIG.assets.terrain[t.type];
      if (src) drawSprite(ctx, src, t.x, t.y, t.w, t.h, { rotation: t.rot });
    });

    renderAuras(ctx, db.player, unlocked);
    db.enemies.forEach((e) => {
      if (e.alive) this.drawEntity(ctx, e.x, e.y, e.power, false, false, e.mobile);
    });
    renderWheels(ctx, db.wheelOrbs);
    this.drawEntity(ctx, db.player.x, db.player.y, db.player.power, false, true, false, db.player.getRadius());
    renderFx(ctx, db.fx, db.player);
    GameGlobal.particles.render(ctx);
    ctx.restore();

    this.renderHud(ctx, mode);
    this.renderMinimap(ctx);
    this.renderActionBar(ctx, db, mode);
    if (db.isOver) this.renderResult(ctx, mode);
    if (db.showExitConfirm) this.renderExitConfirm(ctx);
  }

  drawEntity(ctx, x, y, power, isBoss, isPlayer, mobile = false, radiusOverride = null) {
    const r = radiusOverride ?? radiusFromPower(power, CONFIG.player) * (isBoss ? 1.25 : 1);
    const spriteSrc = isPlayer ? CONFIG.assets.player : isBoss ? CONFIG.assets.boss : CONFIG.assets.enemy;
    const spriteSize = r * 2.1;

    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(x, y + spriteSize * 0.38, r * 0.85, r * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();

    const aura = ctx.createRadialGradient(x, y, r * 0.2, x, y, r * 1.1);
    aura.addColorStop(0, isPlayer ? 'rgba(186,104,200,0.35)' : isBoss ? 'rgba(255,213,79,0.4)' : mobile ? 'rgba(171,71,188,0.42)' : 'rgba(106,27,154,0.3)');
    aura.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(x, y, r * 1.05, 0, Math.PI * 2);
    ctx.fill();

    if (!drawSprite(ctx, spriteSrc, x, y - r * 0.05, spriteSize, spriteSize)) {
      ctx.fillStyle = isPlayer ? '#7E57C2' : isBoss ? '#FF6F00' : '#4A148C';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const label = formatPower(power);
    const badgeW = Math.max(36, label.length * 9 + 14);
    const by = y + r * 0.72;
    roundRect(ctx, x - badgeW / 2, by - 10, badgeW, 20, 8);
    ctx.fillStyle = isPlayer ? 'rgba(49,27,146,0.9)' : isBoss ? 'rgba(191,54,12,0.9)' : 'rgba(26,10,40,0.88)';
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.floor(Math.max(11, Math.min(14, r * 0.38)))}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x, by);
  }

  renderHud(ctx, mode) {
    const db = GameGlobal.databus;
    const h = SCREEN_HEIGHT * CONFIG.hudHeight;
    ctx.fillStyle = 'rgba(14,10,22,0.82)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, h);

    const exit = this.getExitBtn();
    roundRect(ctx, exit.x, exit.y, exit.w, exit.h, 8);
    const eg = ctx.createLinearGradient(exit.x, exit.y, exit.x, exit.y + exit.h);
    eg.addColorStop(0, mode.accent);
    eg.addColorStop(1, mode.accentDark);
    ctx.fillStyle = eg;
    ctx.fill();
    ctx.strokeStyle = 'rgba(186,104,200,0.55)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('退出', exit.x + exit.w / 2, exit.y + exit.h / 2);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#E1BEE7';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(formatPower(db.player.power), SCREEN_WIDTH / 2, h / 2 - 8);
    const infinite = mode.infinite;
    ctx.fillStyle = 'rgba(186,104,200,0.5)';
    ctx.font = '11px sans-serif';
    ctx.fillText(infinite ? '无限' : '100亿', SCREEN_WIDTH / 2, h / 2 + 10);

    if (!infinite) {
      const prog = Math.min(1, db.player.power / CONFIG.winPower);
      const barW = 100;
      const barX = SCREEN_WIDTH / 2 - barW / 2;
      const barY = h - 5;
      roundRect(ctx, barX, barY, barW, 3, 1.5);
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fill();
      if (prog > 0) {
        roundRect(ctx, barX, barY, barW * prog, 3, 1.5);
        ctx.fillStyle = mode.accent;
        ctx.fill();
      }
    }

    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = '15px sans-serif';
    ctx.fillText(formatTime(db.frame), SCREEN_WIDTH - 14, h / 2);
  }

  renderMinimap(ctx) {
    const db = GameGlobal.databus;
    const hud = SCREEN_HEIGHT * CONFIG.hudHeight;
    const mw = 88;
    const mh = 60;
    const mx = SCREEN_WIDTH - mw - 8;
    const my = hud + 4;
    const range = 2400;
    const cx = mx + mw / 2;
    const cy = my + mh / 2;

    roundRect(ctx, mx, my, mw, mh, 6);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fill();
    db.enemies.forEach((e) => {
      if (!e.alive) return;
      const dx = e.x - db.player.x;
      const dy = e.y - db.player.y;
      if (Math.abs(dx) > range || Math.abs(dy) > range) return;
      ctx.fillStyle = e.mobile ? 'rgba(233,30,99,0.75)' : 'rgba(186,104,200,0.65)';
      ctx.beginPath();
      ctx.arc(cx + (dx / range) * (mw / 2 - 4), cy + (dy / range) * (mh / 2 - 4), e.mobile ? 2.5 : 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = '#69F0AE';
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  renderFab(ctx, db, mode) {
    const fab = this.getFabBtn(db);
    roundRect(ctx, fab.x, fab.y, fab.w, fab.h, fab.w / 2);
    const g = ctx.createLinearGradient(fab.x, fab.y, fab.x, fab.y + fab.h);
    g.addColorStop(0, mode.accent);
    g.addColorStop(1, mode.accentDark);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(186,104,200,0.65)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(db.actionBarOpen ? '收' : '技', fab.x + fab.w / 2, fab.y + fab.h / 2);

    const hasReady = db.actionBarOpen ? false : CONFIG.skills.some(
      (s) => db.player.power >= s.unlockPower && canUseSkill(s, db.player, db.skillCooldowns),
    );
    if (hasReady) {
      ctx.fillStyle = '#FFD54F';
      ctx.beginPath();
      ctx.arc(fab.x + fab.w - 6, fab.y + 6, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  renderActionBar(ctx, db, mode) {
    this.renderFab(ctx, db, mode);
    if (!db.actionBarOpen) return;

    const h = SCREEN_HEIGHT * CONFIG.actionBarHeight;
    const y = SCREEN_HEIGHT - h;
    ctx.fillStyle = 'rgba(10,6,22,0.9)';
    ctx.fillRect(0, y, SCREEN_WIDTH, h);
    ctx.strokeStyle = 'rgba(126,87,194,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(SCREEN_WIDTH, y);
    ctx.stroke();

    this.getSkillBtns().forEach((b) => {
      const s = b.skill;
      const ready = canUseSkill(s, db.player, db.skillCooldowns);
      const unlocked = db.player.power >= s.unlockPower;
      roundRect(ctx, b.x, b.y, b.w, b.h, 10);
      const g = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
      if (!unlocked) {
        ctx.fillStyle = 'rgba(40,30,60,0.7)';
      } else if (ready) {
        g.addColorStop(0, s.color);
        g.addColorStop(1, mode.accentDark);
        ctx.fillStyle = g;
      } else {
        ctx.fillStyle = 'rgba(69,39,160,0.45)';
      }
      ctx.fill();
      ctx.strokeStyle = unlocked ? 'rgba(186,104,200,0.5)' : 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = unlocked ? '#fff' : 'rgba(255,255,255,0.25)';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(s.short, b.x + b.w / 2, b.y + b.h / 2 - 4);
      if (unlocked) {
        ctx.font = '9px sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillText(formatPower(s.cost), b.x + b.w / 2, b.y + b.h - 8);
      }
      const cd = db.skillCooldowns[s.id];
      if (cd > 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(String(Math.ceil(cd / 60)), b.x + b.w / 2, b.y + b.h / 2);
      }
    });

    this.getWeaponSlots().forEach((slot) => {
      const w = slot.weapon;
      const on = db.player.power >= w.unlockPower;
      roundRect(ctx, slot.x, slot.y, slot.w, slot.h, 10);
      if (on) {
        const g = ctx.createLinearGradient(slot.x, slot.y, slot.x, slot.y + slot.h);
        g.addColorStop(0, w.color);
        g.addColorStop(1, 'rgba(26,10,40,0.9)');
        ctx.fillStyle = g;
      } else {
        ctx.fillStyle = 'rgba(30,20,50,0.55)';
      }
      ctx.fill();
      ctx.strokeStyle = on ? w.color : 'rgba(255,255,255,0.1)';
      ctx.lineWidth = on ? 2 : 1;
      ctx.stroke();
      ctx.fillStyle = on ? '#fff' : 'rgba(255,255,255,0.2)';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(w.short, slot.x + slot.w / 2, slot.y + slot.h / 2);
    });
  }

  renderExitConfirm(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    roundRect(ctx, SCREEN_WIDTH / 2 - 110, SCREEN_HEIGHT / 2 - 50, 220, 100, 12);
    ctx.fillStyle = 'rgba(30,20,50,0.95)';
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('退出？', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 18);
    const c = this.getExitConfirmBtns();
    const drawBtn = (b, label, color) => {
      roundRect(ctx, b.x, b.y, b.w, b.h, 8);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(label, b.x + b.w / 2, b.y + b.h / 2);
    };
    drawBtn(c.ok, '确定', '#4527A0');
    drawBtn(c.cancel, '继续', 'rgba(69,39,160,0.55)');
  }

  renderResult(ctx, mode) {
    const db = GameGlobal.databus;
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText(db.isWin ? '胜利' : '阵亡', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 40);
    ctx.fillStyle = '#FFD54F';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(formatPower(db.peakPower), SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 2);
    const btns = this.getResultBtns();
    const drawBtn = (b, label, color) => {
      roundRect(ctx, b.x, b.y, b.w, b.h, 8);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(label, b.x + b.w / 2, b.y + b.h / 2);
    };
    drawBtn(btns.retry, '重来', mode.accentDark);
    drawBtn(btns.menu, '返回', '#455A64');
  }

  render(ctx) {
    const db = GameGlobal.databus;
    if (db.scene === 'menu') this.renderMenu(ctx);
    else this.renderWorld(ctx);
  }
}
