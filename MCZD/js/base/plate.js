import { SCREEN_WIDTH } from '../render';

function getGrid(level) {
  const perLayer = Math.ceil(level.tileCount / level.layers);
  const cols = level.gridCols || Math.ceil(Math.sqrt(perLayer * 1.15));
  const rows = level.gridRows || Math.ceil(perLayer / cols);
  return { cols, rows, perLayer };
}

function clampToPlate(p, plate) {
  const rx = plate.rx * 0.86;
  const ry = plate.ry * 0.82;
  const dx = (p.x - plate.cx) / rx;
  const dy = (p.y - plate.cy) / ry;
  const d2 = dx * dx + dy * dy;
  if (d2 <= 1) return p;
  const s = 1 / Math.sqrt(d2);
  return {
    ...p,
    x: plate.cx + dx * s * rx,
    y: plate.cy + dy * s * ry,
  };
}

function centerPositions(positions, plate) {
  if (!positions.length) return positions;
  let mx = 0;
  let my = 0;
  positions.forEach((p) => { mx += p.x; my += p.y; });
  mx /= positions.length;
  my /= positions.length;
  const dx = plate.cx - mx;
  const dy = plate.cy - my;
  return positions.map((p) => clampToPlate({ ...p, x: p.x + dx, y: p.y + dy }, plate));
}

/** 果盘区域：偏下、略扁，水果堆在盘内 */
export function getPlateBounds(area) {
  const cx = area.x + area.w / 2;
  const cy = area.y + area.h * 0.54;
  const rx = Math.min(area.w * 0.5, area.h * 0.4);
  const ry = rx * 0.58;
  return { cx, cy, rx, ry };
}

export function calcPlateTileSize(level, plate) {
  const { cols, rows, perLayer } = getGrid(level);
  const fitW = (plate.rx * 1.35) / Math.max(cols - 1, 1);
  const fitH = (plate.ry * 1.35) / Math.max(rows - 1, 1);
  const cap = level.tileSize || 92;
  const floor = perLayer <= 20 ? 64 : perLayer <= 40 ? 50 : 38;
  return Math.max(floor, Math.floor(Math.min(fitW, fitH, cap)));
}

export function buildPlatePositions(level, plate, tileSize) {
  const { cols, rows, perLayer } = getGrid(level);
  const spreadW = plate.rx * 1.34;
  const spreadH = plate.ry * 1.28;
  const stepX = spreadW / Math.max(cols - 1, 1);
  const stepY = spreadH / Math.max(rows - 1, 1);
  const gridW = (cols - 1) * stepX;
  const gridH = (rows - 1) * stepY;
  const positions = [];

  for (let L = 0; L < level.layers; L += 1) {
    const count = L === level.layers - 1
      ? level.tileCount - perLayer * (level.layers - 1)
      : perLayer;
    const ox = (L % 2) * stepX * 0.38;
    const oy = (L % 2) * stepY * 0.38;
    const baseX = plate.cx - gridW / 2;
    const baseY = plate.cy - gridH / 2;
    let placed = 0;

    for (let r = 0; r < rows && placed < count; r += 1) {
      for (let c = 0; c < cols && placed < count; c += 1) {
        positions.push(clampToPlate({
          x: baseX + c * stepX + ox,
          y: baseY + r * stepY + oy,
          layer: L,
          rot: (L + c) * 0.08,
        }, plate));
        placed += 1;
      }
    }
  }

  return centerPositions(positions, plate);
}

/** 浅口陶瓷果盘，暖色、有厚度 */
export function drawPlate(ctx, plate, frame = 0) {
  const { cx, cy, rx, ry } = plate;
  const bob = Math.sin(frame * 0.025) * 0.4;

  ctx.save();
  ctx.translate(0, bob);

  ctx.fillStyle = 'rgba(40,25,18,0.22)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + ry * 0.62, rx * 0.9, ry * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();

  const outer = ctx.createLinearGradient(cx, cy - ry, cx, cy + ry);
  outer.addColorStop(0, '#EFEBE9');
  outer.addColorStop(0.35, '#F5F0EB');
  outer.addColorStop(1, '#BCAAA4');
  ctx.fillStyle = outer;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();

  const bowl = ctx.createRadialGradient(
    cx - rx * 0.12,
    cy - ry * 0.2,
    rx * 0.06,
    cx,
    cy + ry * 0.08,
    rx * 0.92,
  );
  bowl.addColorStop(0, '#FAF6F2');
  bowl.addColorStop(0.45, '#F0E6DC');
  bowl.addColorStop(0.82, '#E0D2C6');
  bowl.addColorStop(1, '#C9B8A8');
  ctx.fillStyle = bowl;
  ctx.beginPath();
  ctx.ellipse(cx, cy + ry * 0.06, rx * 0.88, ry * 0.78, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#A1887F';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(cx, cy - ry * 0.78, rx * 0.78, ry * 0.18, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(93,64,55,0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(cx, cy + ry * 0.1, rx * 0.72, ry * 0.55, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

export function drawPlayBackground(ctx, area) {
  const g = ctx.createLinearGradient(0, area.y, 0, area.y + area.h);
  g.addColorStop(0, '#FFF8F0');
  g.addColorStop(1, '#F3E5D8');
  ctx.fillStyle = g;
  ctx.fillRect(0, area.y, SCREEN_WIDTH, area.h);
}
