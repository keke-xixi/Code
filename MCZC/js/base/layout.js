import CONFIG from '../config/game.config';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render';

export function getHudH() {
  return SCREEN_HEIGHT * CONFIG.hudHeight;
}

export function getFooterH() {
  return SCREEN_HEIGHT * CONFIG.footerHeight;
}

export function getPanels() {
  const top = getHudH();
  const bottom = getFooterH();
  const h = SCREEN_HEIGHT - top - bottom;
  const gap = 10;
  const w = (SCREEN_WIDTH - gap * 3) / 2;
  return {
    left: { x: gap, y: top, w, h, label: '现实' },
    right: { x: gap * 2 + w, y: top, w, h, label: '镜像' },
    dividerX: gap + w + gap / 2,
  };
}

export function tapToRelative(x, y) {
  const panels = getPanels();
  for (const key of ['left', 'right']) {
    const p = panels[key];
    if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) {
      return {
        panel: key,
        rx: (x - p.x) / p.w,
        ry: (y - p.y) / p.h,
        px: x,
        py: y,
      };
    }
  }
  return null;
}

export function diffToPixel(diff, panel) {
  return {
    x: panel.x + diff.x * panel.w,
    y: panel.y + diff.y * panel.h,
    r: diff.r * Math.min(panel.w, panel.h),
  };
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
