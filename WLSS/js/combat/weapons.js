import CONFIG from '../config/game.config';
import { dist, radiusFromPower } from '../base/math';

function weaponById(id) {
  return CONFIG.weapons.find((w) => w.id === id);
}

export function getUnlockedWeapons(player) {
  return CONFIG.weapons.filter((w) => player.power >= w.unlockPower);
}

export function getRangeMul(player) {
  const w = weaponById('range');
  if (player.power >= w.unlockPower) return w.rangeMul;
  return 1;
}

export function getCollisionRadius(player) {
  return radiusFromPower(player.power, CONFIG.player) * getRangeMul(player);
}

function absorbEnemy(db, e) {
  e.alive = false;
  db.player.absorb(e.power);
  GameGlobal.particles.burst(e.x, e.y, '#FFD54F', 6);
}

export function tickWeapons(db, frame) {
  const { player, enemies } = db;
  const unlocked = getUnlockedWeapons(player);

  unlocked.forEach((w) => {
    if (w.id === 'fire' && frame % w.burnInterval === 0) tickFire(db, w);
  });

  db.wheelOrbs = [];
  const wheel = unlocked.find((w) => w.id === 'wheel');
  if (wheel) {
    db.wheelAngle += wheel.orbitSpeed;
    const baseR = wheel.orbitRadius + getCollisionRadius(player) * 0.5;
    for (let i = 0; i < wheel.count; i += 1) {
      const a = db.wheelAngle + (Math.PI * 2 * i) / wheel.count;
      const x = player.x + Math.cos(a) * baseR;
      const y = player.y + Math.sin(a) * baseR;
      db.wheelOrbs.push({ x, y, r: wheel.hitRadius });
      enemies.forEach((e) => {
        if (!e.alive) return;
        if (dist({ x, y }, e) > wheel.hitRadius + radiusFromPower(e.power, CONFIG.player) * 0.5) return;
        if (e.power <= player.power) absorbEnemy(db, e);
      });
    }
  }
}

function tickFire(db, w) {
  const { player, enemies } = db;
  let target = null;
  let weakest = Infinity;
  enemies.forEach((e) => {
    if (!e.alive) return;
    if (dist(player, e) > w.burnRadius) return;
    if (e.power >= player.power) return;
    if (e.power < weakest) {
      weakest = e.power;
      target = e;
    }
  });
  if (target) {
    absorbEnemy(db, target);
    db.fx.push({
      type: 'fire',
      x: target.x,
      y: target.y,
      life: 24,
      maxLife: 24,
    });
  }
}

export function getIceSlowFactor(db, enemy) {
  const w = weaponById('ice');
  if (db.player.power < w.unlockPower) return 1;
  if (dist(db.player, enemy) > w.auraRadius) return 1;
  return w.slowFactor;
}
