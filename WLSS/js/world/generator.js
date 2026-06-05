import CONFIG from '../config/game.config';
import { seededRand } from '../base/math';

const { world } = CONFIG;

function isFar(x, y, list, minD) {
  return list.every((e) => {
    const dx = e.x - x;
    const dy = e.y - y;
    return dx * dx + dy * dy >= minD * minD;
  });
}

function dist(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

function placeNear(list, sx, sy, minR, maxR, minGap, rand, tries = 35) {
  for (let t = 0; t < tries; t += 1) {
    const angle = rand() * Math.PI * 2;
    const r = minR + rand() * (maxR - minR);
    const x = Math.max(120, Math.min(world.width - 120, sx + Math.cos(angle) * r));
    const y = Math.max(120, Math.min(world.height - 120, sy + Math.sin(angle) * r));
    if (isFar(x, y, list, minGap)) return { x, y };
  }
  return null;
}

function powerAtDistance(d, maxDist, rand) {
  const t = Math.min(1, d / maxDist);
  const logP = t * 9.6 + rand() * 0.45;
  const base = 10 ** logP;
  return Math.max(1, Math.floor(base * (0.55 + rand() * 0.9)));
}

export function getSpawnPoint() {
  return {
    x: world.width * world.spawnRatio,
    y: world.height * world.spawnRatio,
  };
}

export function buildWorld(modeCfg, startPower = 1) {
  const rand = seededRand(modeCfg.seed);
  const enemies = [];
  const { x: spawnX, y: spawnY } = getSpawnPoint();
  const region = world.initialRadius;
  const maxDist = Math.min(world.width, world.height) * 0.72;
  const low = Math.max(1, startPower);

  const starterCount = modeCfg.id === 'extreme' ? 12 : 20;
  for (let i = 0; i < starterCount; i += 1) {
    const pos = placeNear(enemies, spawnX, spawnY, 100, 420, 56, rand);
    if (!pos) continue;
    const power = i < starterCount * 0.8 ? low : Math.max(1, low - 1);
    enemies.push({
      id: `s${i}`,
      x: pos.x,
      y: pos.y,
      power,
      mobile: false,
      angle: rand() * Math.PI * 2,
      alive: true,
    });
  }

  for (let i = 0; i < modeCfg.enemyCount; i += 1) {
    let x = 0;
    let y = 0;
    let tries = 0;
    do {
      const angle = rand() * Math.PI * 2;
      const r = 500 + rand() * (region - 500);
      x = spawnX + Math.cos(angle) * r;
      y = spawnY + Math.sin(angle) * r;
      x = Math.max(200, Math.min(world.width - 200, x));
      y = Math.max(200, Math.min(world.height - 200, y));
      tries += 1;
    } while (!isFar(x, y, enemies, 75) && tries < 40);

    const nearSpawn = dist(x, y, spawnX, spawnY);
    let power = powerAtDistance(nearSpawn, maxDist, rand);
    if (nearSpawn < 600) {
      power = Math.min(power, Math.max(1, low + 2));
    }

    enemies.push({
      id: `e${i}`,
      x,
      y,
      power,
      mobile: false,
      angle: rand() * Math.PI * 2,
      alive: true,
    });
  }

  return enemies;
}
