import CONFIG from '../config/game.config';
import { dist, formatPower } from '../base/math';

function skillById(id) {
  return CONFIG.skills.find((s) => s.id === id);
}

export function canUseSkill(skill, player, cooldowns) {
  if (!skill || player.power < skill.unlockPower) return false;
  if (player.power < skill.cost) return false;
  if (cooldowns[skill.id] > 0) return false;
  return true;
}

function killWeakerInRadius(db, radius) {
  const { player, enemies } = db;
  let gained = 0;
  let kills = 0;
  enemies.forEach((e) => {
    if (!e.alive) return;
    if (dist(player, e) > radius) return;
    if (e.power >= player.power) return;
    e.alive = false;
    gained += e.power;
    kills += 1;
    GameGlobal.particles.burst(e.x, e.y, '#EF5350', 8);
  });
  if (gained > 0) {
    player.power += gained;
    player.kills += kills;
    GameGlobal.particles.floatText(player.x, player.y - 40, `+${formatPower(gained)}`);
    GameGlobal.audio?.playAbsorb();
  }
  return kills;
}

export function useSkill(db, skillId) {
  const skill = skillById(skillId);
  if (!canUseSkill(skill, db.player, db.skillCooldowns)) return false;

  db.player.power -= skill.cost;
  db.skillCooldowns[skillId] = skill.cooldown;

  switch (skillId) {
    case 'rush':
      db.player.rushTimer = skill.duration;
      db.player.rushMul = skill.speedMul;
      db.fx.push({ type: 'rush', life: skill.duration, maxLife: skill.duration });
      break;
    case 'magnet':
      db.player.magnetTimer = skill.duration;
      db.fx.push({ type: 'magnet', life: skill.duration, maxLife: skill.duration, radius: skill.pullRadius });
      break;
    case 'shock':
    case 'purge': {
      const radius = skill.gridRadius * CONFIG.world.gridStep;
      killWeakerInRadius(db, radius);
      db.fx.push({
        type: skillId,
        x: db.player.x,
        y: db.player.y,
        radius,
        life: 50,
        maxLife: 50,
        color: skill.color,
      });
      GameGlobal.audio?.playWin();
      break;
    }
    default:
      return false;
  }
  return true;
}

export function tickSkillCooldowns(cooldowns) {
  Object.keys(cooldowns).forEach((k) => {
    if (cooldowns[k] > 0) cooldowns[k] -= 1;
  });
}

export function tickMagnet(db) {
  const { player } = db;
  if (player.magnetTimer <= 0) return;
  const skill = skillById('magnet');
  const pullR = skill.pullRadius;
  db.enemies.forEach((e) => {
    if (!e.alive || e.power >= player.power) return;
    const d = dist(player, e);
    if (d > pullR || d < 8) return;
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const pull = 2.8 + Math.log10(Math.max(10, player.power)) * 0.2;
    e.x += (dx / d) * pull;
    e.y += (dy / d) * pull;
  });
}
