import CONFIG from '../config/game.config';
import { seededRand } from '../base/math';

const TYPES = [
  { key: 'tree', w: 90, h: 110, weight: 3 },
  { key: 'rock', w: 70, h: 60, weight: 4 },
  { key: 'bone', w: 55, h: 45, weight: 3 },
  { key: 'grave', w: 65, h: 80, weight: 2 },
  { key: 'ruin', w: 85, h: 95, weight: 2 },
];

function pickType(rand) {
  const total = TYPES.reduce((s, t) => s + t.weight, 0);
  let r = rand() * total;
  for (const t of TYPES) {
    r -= t.weight;
    if (r <= 0) return t;
  }
  return TYPES[0];
}

function farFrom(list, x, y, minD, extra = []) {
  const all = [...list, ...extra];
  return all.every((o) => {
    const dx = o.x - x;
    const dy = o.y - y;
    return dx * dx + dy * dy >= minD * minD;
  });
}

export function buildTerrain(modeCfg, enemies) {
  const rand = seededRand(modeCfg.seed + 77);
  const { world } = CONFIG;
  const count = modeCfg.id === 'extreme' ? 100 : 80;
  const props = [];
  const spawnX = world.width * world.spawnRatio;
  const spawnY = world.height * world.spawnRatio;
  const region = world.initialRadius;

  for (let i = 0; i < count; i += 1) {
    const type = pickType(rand);
    let x = 0;
    let y = 0;
    let tries = 0;
    do {
      const angle = rand() * Math.PI * 2;
      const r = rand() * region;
      x = spawnX + Math.cos(angle) * r;
      y = spawnY + Math.sin(angle) * r;
      tries += 1;
    } while (!farFrom(props, x, y, 85, enemies) && tries < 30);

    props.push({
      id: `t${i}`,
      type: type.key,
      x,
      y,
      w: type.w * (0.85 + rand() * 0.3),
      h: type.h * (0.85 + rand() * 0.3),
      rot: (rand() - 0.5) * 0.4,
    });
  }
  return props;
}
