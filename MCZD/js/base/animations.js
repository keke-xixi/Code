import { drawFruit3D } from './fruit';

function easeOutCubic(t) {
  return 1 - (1 - t) ** 3;
}

export default class Animations {
  list = [];

  flyToSlot(tile, fromX, fromY, toX, toY, onDone) {
    this.list.push({
      type: 'fly',
      tile: { ...tile },
      x: fromX,
      y: fromY,
      x0: fromX,
      y0: fromY,
      tx: toX,
      ty: toY,
      progress: 0,
      duration: 16,
      onDone,
    });
  }

  slotPop(x, y, color) {
    this.list.push({
      type: 'pop',
      x,
      y,
      color,
      progress: 0,
      duration: 14,
    });
  }

  tripleClear(cx, cy, color) {
    this.list.push({
      type: 'clear',
      x: cx,
      y: cy,
      color,
      progress: 0,
      duration: 22,
    });
  }

  bombFound(x, y) {
    this.list.push({
      type: 'bomb',
      x,
      y,
      progress: 0,
      duration: 28,
    });
  }

  update(dt = 1) {
    this.list = this.list.filter((a) => {
      a.progress += dt;
      const t = Math.min(1, a.progress / a.duration);

      if (a.type === 'fly') {
        const e = easeOutCubic(t);
        const arc = Math.sin(t * Math.PI) * 10;
        a.x = a.x0 + (a.tx - a.x0) * e;
        a.y = a.y0 + (a.ty - a.y0) * e - arc;
        a.tile.size = a.tile.size * (0.92 + t * 0.08);
        if (t >= 1) {
          a.onDone?.();
          return false;
        }
      } else if (a.type === 'pop' || a.type === 'clear' || a.type === 'bomb') {
        if (t >= 1) return false;
      }
      return true;
    });
  }

  render(ctx) {
    this.list.forEach((a) => {
      const t = Math.min(1, a.progress / a.duration);
      if (a.type === 'fly') {
        const scale = 0.92 + easeOutCubic(t) * 0.08;
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.scale(scale, scale);
        drawFruit3D(ctx, { ...a.tile, x: 0, y: 0 }, true, GameGlobal.databus?.frame || 0);
        ctx.restore();
      } else if (a.type === 'pop') {
        const r = 8 + t * 22;
        ctx.save();
        ctx.globalAlpha = 1 - t;
        ctx.strokeStyle = a.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(a.x, a.y, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else if (a.type === 'clear') {
        ctx.save();
        ctx.globalAlpha = 1 - t * 0.85;
        for (let i = 0; i < 8; i += 1) {
          const ang = (Math.PI * 2 * i) / 8 + t * 2;
          const dist = 12 + t * 36;
          ctx.fillStyle = a.color;
          ctx.beginPath();
          ctx.arc(a.x + Math.cos(ang) * dist, a.y + Math.sin(ang) * dist, 4 - t * 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.font = `${Math.floor(18 + t * 8)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✨', a.x, a.y - t * 18);
        ctx.restore();
      } else if (a.type === 'bomb') {
        const pulse = 1 + Math.sin(t * Math.PI * 3) * 0.06;
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.scale(pulse, pulse);
        ctx.globalAlpha = 1 - t * 0.35;
        ctx.font = `${Math.floor(36 + t * 20)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💣', 0, 0);
        ctx.strokeStyle = '#FF5252';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 24 + t * 30, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    });
  }
}
