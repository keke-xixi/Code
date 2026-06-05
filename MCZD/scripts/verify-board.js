/**
 * 本地验证：水果居中、大小、可点击数
 * 运行: node MCZD/scripts/verify-board.js
 */

const area = { x: 8, y: 55, w: 374, h: 696 };

function getPlateBounds(area) {
  const cx = area.x + area.w / 2;
  const cy = area.y + area.h * 0.5;
  const rx = Math.min(area.w * 0.48, area.h * 0.4);
  const ry = rx * 0.72;
  return { cx, cy, rx, ry };
}

function getGrid(level) {
  const perLayer = Math.ceil(level.tileCount / level.layers);
  const cols = level.gridCols || Math.ceil(Math.sqrt(perLayer * 1.15));
  const rows = level.gridRows || Math.ceil(perLayer / cols);
  return { cols, rows, perLayer };
}

function centerPositions(positions, plate) {
  let mx = 0;
  let my = 0;
  positions.forEach((p) => { mx += p.x; my += p.y; });
  mx /= positions.length;
  my /= positions.length;
  const dx = plate.cx - mx;
  const dy = plate.cy - my;
  return positions.map((p) => ({ ...p, x: p.x + dx, y: p.y + dy }));
}

function calcPlateTileSize(level, plate) {
  const { cols, rows, perLayer } = getGrid(level);
  const fitW = (plate.rx * 1.6) / Math.max(cols - 1, 1);
  const fitH = (plate.ry * 1.55) / Math.max(rows - 1, 1);
  const cap = level.tileSize || 92;
  const floor = perLayer <= 20 ? 68 : perLayer <= 40 ? 52 : 40;
  return Math.max(floor, Math.floor(Math.min(fitW, fitH, cap)));
}

function buildPlatePositions(level, plate, tileSize) {
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
        positions.push({ x: baseX + c * stepX + ox, y: baseY + r * stepY + oy, layer: L });
        placed += 1;
      }
    }
  }
  return centerPositions(positions, plate);
}

function overlapRatio(a, b, size) {
  const h = size * 0.34;
  const box = (t) => ({ left: t.x - h, right: t.x + h, top: t.y - h, bottom: t.y + h });
  const A = box(a);
  const B = box(b);
  const ox = Math.max(0, Math.min(A.right, B.right) - Math.max(A.left, B.left));
  const oy = Math.max(0, Math.min(A.bottom, B.bottom) - Math.max(A.top, B.top));
  return (ox * oy) / (size * size * 0.55);
}

function isBlocked(tile, tiles) {
  return tiles.some((other) => {
    if (other.uid === tile.uid) return false;
    if (other.layer <= tile.layer) return false;
    return overlapRatio(tile, other, tile.size) > 0.42;
  });
}

function verifyLevel(level) {
  const plate = getPlateBounds(area);
  const tileSize = calcPlateTileSize(level, plate);
  const positions = buildPlatePositions(level, plate, tileSize);
  const tiles = positions.map((p, i) => ({ uid: i, ...p, size: tileSize }));

  const mx = tiles.reduce((s, t) => s + t.x, 0) / tiles.length;
  const my = tiles.reduce((s, t) => s + t.y, 0) / tiles.length;
  const offX = Math.abs(mx - plate.cx);
  const offY = Math.abs(my - plate.cy);
  const exposed = tiles.filter((t) => !isBlocked(t, tiles)).length;
  const errors = [];

  if (positions.length !== level.tileCount) errors.push(`位置 ${positions.length}!=${level.tileCount}`);
  if (offX > 2) errors.push(`水平偏移 ${offX.toFixed(1)}`);
  if (offY > 2) errors.push(`垂直偏移 ${offY.toFixed(1)}`);
  if (tileSize < 50 && level.id === 1) errors.push(`L1太小 ${tileSize}`);
  if (exposed < Math.min(level.tileCount * 0.15, 8)) errors.push(`可点 ${exposed}`);

  return { id: level.id, tileSize, offX, offY, exposed, pass: !errors.length, errors };
}

const levels = [
  { id: 1, tileCount: 18, layers: 1, tileSize: 92, gridCols: 5, gridRows: 4 },
  { id: 2, tileCount: 60, layers: 4, tileSize: 58, gridCols: 5, gridRows: 3 },
];

console.log('=== MCZD 居中 & 布局验证 ===');
let allPass = true;
levels.forEach((lv) => {
  const r = verifyLevel(lv);
  console.log(r.pass ? 'PASS' : 'FAIL', `L${r.id}`, r);
  if (!r.pass) allPass = false;
});
process.exit(allPass ? 0 : 1);
