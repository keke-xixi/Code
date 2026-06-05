import CONFIG from '../config/game.config';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render';

export function getHudH() {
  return SCREEN_HEIGHT * CONFIG.hudHeight;
}

export function getFooterH() {
  return SCREEN_HEIGHT * CONFIG.footerHeight;
}

export function getBoardArea() {
  const top = getHudH();
  const bottom = getFooterH();
  return {
    x: CONFIG.boardPad,
    y: top,
    w: SCREEN_WIDTH - CONFIG.boardPad * 2,
    h: SCREEN_HEIGHT - top - bottom,
  };
}

export function getSlotBarLayout() {
  const fh = getFooterH();
  const y = SCREEN_HEIGHT - fh + 6;
  const slotW = Math.min(46, (SCREEN_WIDTH - 24) / CONFIG.slotMax - 4);
  const gap = 4;
  const total = CONFIG.slotMax * slotW + (CONFIG.slotMax - 1) * gap;
  const x0 = (SCREEN_WIDTH - total) / 2;
  const slots = [];
  for (let i = 0; i < CONFIG.slotMax; i += 1) {
    slots.push({ x: x0 + i * (slotW + gap), y, w: slotW, h: slotW * 1.05 });
  }
  return { slots, y, h: fh - 8, barY: y - 8 };
}

export function roundRect(ctx, x, y, w, h, rad) {
  const r = Math.min(rad, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
