import CONFIG from '../config/game.config';
import { clamp, dist, seededRand } from '../base/math';

const { world, spawner: SP } = CONFIG;

function randNearPlayer(player, rand) {
  const angle = rand() * Math.PI * 2;
  const r = SP.spawnMin + rand() * (SP.spawnMax - SP.spawnMin);
  const margin = 80;
  return {
    x: clamp(player.x + Math.cos(angle) * r, margin, world.width - margin),
    y: clamp(player.y + Math.sin(angle) * r, margin, world.height - margin),
  };
}

function rollPower(playerPower, rand, modeCfg) {
  const strongRate = modeCfg.strongRate || 0.12;
  const roll = rand();
  if (roll < 0.5) {
    return Math.max(1, Math.floor(playerPower * (0.3 + rand() * 0.5)));
  }
  if (roll < 0.85 - strongRate) {
    return Math.max(1, Math.floor(playerPower * (0.75 + rand() * 0.24)));
  }
  if (roll < 0.95 - strongRate) {
    return Math.max(1, playerPower);
  }
  return Math.floor(playerPower * (1.08 + rand() * 0.35));
}

function makeEnemy(id, x, y, power, mobile, angle) {
  return {
    id,
    x,
    y,
    power,
    mobile,
    angle,
    alive: true,
  };
}

export function countBeatables(player, enemies) {
  let n = 0;
  for (const e of enemies) {
    if (!e.alive) continue;
    if (dist(player, e) > SP.beatableRadius) continue;
    if (e.power <= player.power) n += 1;
  }
  return n;
}

export function spawnEnemy(player, id, modeCfg, rand) {
  const pos = randNearPlayer(player, rand);
  const power = rollPower(player.power, rand, modeCfg);
  const mobileRate = modeCfg.mobileRate || 0.4;
  const mobile = player.power >= CONFIG.moveThreshold && rand() < mobileRate;
  return makeEnemy(id, pos.x, pos.y, power, mobile, rand() * Math.PI * 2);
}

export function cullFarEnemies(enemies, player) {
  return enemies.filter((e) => {
    if (!e.alive) return false;
    return dist(player, e) <= SP.cullDist;
  });
}

export function updateEnemies(enemies, player, frame, db) {
  if (player.power < CONFIG.moveThreshold) return;

  const moveBase = 0.9;
  enemies.forEach((e) => {
    if (!e.alive || !e.mobile) return;

    if (frame % 75 === 0) {
      e.angle += (seededRand(e.power + frame)() - 0.5) * 1.4;
    }

    let speed = moveBase + Math.log10(Math.max(10, e.power)) * 0.35;
    if (db) {
      const ice = CONFIG.weapons.find((w) => w.id === 'ice');
      if (player.power >= ice.unlockPower && dist(player, e) <= ice.auraRadius) {
        speed *= ice.slowFactor;
      }
    }
    e.x += Math.cos(e.angle) * speed;
    e.y += Math.sin(e.angle) * speed;

    const r = 40;
    e.x = clamp(e.x, r, world.width - r);
    e.y = clamp(e.y, r, world.height - r);

    if (e.x <= r || e.x >= world.width - r) e.angle = Math.PI - e.angle;
    if (e.y <= r || e.y >= world.height - r) e.angle = -e.angle;
  });
}

export function tickSpawner(db, modeCfg) {
  const { player, enemies, frame, enemySeq } = db;
  const alive = enemies.filter((e) => e.alive);
  const rand = seededRand(modeCfg.seed + frame * 17 + player.power);

  if (frame % SP.interval === 0 && alive.length < SP.maxAlive) {
    const id = `d${enemySeq}`;
    db.enemySeq += 1;
    enemies.push(spawnEnemy(player, id, modeCfg, rand));
  }

  if (frame % 24 === 0) {
    const beatables = countBeatables(player, enemies);
    const need = SP.minBeatables - beatables;
    for (let i = 0; i < need; i += 1) {
      const id = `b${db.enemySeq}`;
      db.enemySeq += 1;
      const pos = randNearPlayer(player, rand);
      const ratio = 0.35 + rand() * 0.55;
      const power = Math.max(1, Math.floor(player.power * ratio));
      const mobile = player.power >= CONFIG.moveThreshold && rand() < 0.35;
      enemies.push(makeEnemy(id, pos.x, pos.y, power, mobile, rand() * Math.PI * 2));
    }
  }

  if (frame % 90 === 0) {
    db.enemies = cullFarEnemies(enemies, player);
  }
}
