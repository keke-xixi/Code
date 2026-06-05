import { SCREEN_WIDTH } from '../render';

function getGrid(level) {
  const perLayer = Math.ceil(level.tileCount / level.layers);
  const cols = level.gridCols || Math.ceil(Math.sqrt(perLayer * 1.15));
  const rows = level.gridRows || Math.ceil(perLayer / cols);
  return { cols, rows, perLayer };
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
  return positions.map((p) => ({ ...p, x: p.x + dx, y: p.y + dy }));
}

export function getPlateBounds(area) {
  const cx = area.x + area.w / 2;
  const cy = area.y + area.h * 0.5;
  const rx = Math.min(area.w * 0.48, area.h * 0.4);
  const ry = rx * 0.72;
  return { cx, cy, rx, ry };
}

export function calcPlateTileSize(level, plate) {
  const { cols, rows, perLayer } = getGrid(level);
  const fitW = (plate.rx * 1.6) / Math.max(cols - 1, 1);
  const fitH = (plate.ry * 1.55) / Math.max(rows - 1, 1);
  const cap = level.tileSize || 92;
  const floor = perLayer <= 20 ? 68 : perLayer <= 40 ? 52 : 40;
  return Math.max(floor, Math.floor(Math.min(fitW, fitH, cap)));
}

export function buildPlatePositions(level, plate, tileSize) {
  const { cols, rows, perLayer } = getGrid(level);
  const spreadW = plate.rx * 1.55;
  const spreadH = plate.ry * 1.45;
  const stepX = spreadW / Math.max(cols - 1, 1);
  const stepY = spreadH / Math.max(rows - 1, 1);
  const gridW = (cols - 1) * stepX;
  const gridH = (rows - 1) * stepY;
  const positions = [];

  for (let L = 0; L < level.layers; L += 1) {
    const count = L === level.layers - 1
      ? level.tileCount - perLayer * (level.layers - 1)
      : perLayer;
    const ox = (L % 2) * stepX * 0.46;
    const oy = (L % 2) * stepY * 0.46;
    const baseX = plate.cx - gridW / 2;
    const baseY = plate.cy - gridH / 2;
    let placed = 0;

    for (let r = 0; r < rows && placed < count; r += 1) {
      for (let c = 0; c < cols && placed < count; c += 1) {
        positions.push({
          x: baseX + c * stepX + ox,
          y: baseY + r * stepY + oy,
          layer: L,
          rot: 0,
        });
        placed += 1;
      }
    }
  }

  return centerPositions(positions, plate);
}

export function drawPlate(ctx, plate) {
  const { cx, cy, rx, ry } = plate;

  ctx.save();

  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + ry * 0.55, rx * 0.88, ry * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();

  const rim = ctx.createLinearGradient(cx, cy - ry, cx, cy + ry);
  rim.addColorStop(0, '#ECEFF1');
  rim.addColorStop(0.15, '#FFFFFF');
  rim.addColorStop(0.85, '#F5F5F5');
  rim.addColorStop(1, '#CFD8DC');
  ctx.fillStyle = rim;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();

  const inner = ctx.createRadialGradient(cx, cy - ry * 0.35, rx * 0.05, cx, cy, rx * 0.95);
  inner.addColorStop(0, '#FFFFFF');
  inner.addColorStop(0.6, '#FAFAFA');
  inner.addColorStop(1, '#EEEEEE');
  ctx.fillStyle = inner;
  ctx.beginPath();
  ctx.ellipse(cx, cy + ry * 0.04, rx * 0.9, ry * 0.82, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#B0BEC5';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx, cy - ry * 0.72, rx * 0.82, ry * 0.22, 0, 0, Math.PI * 2);
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
