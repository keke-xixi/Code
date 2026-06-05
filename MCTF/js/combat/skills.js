import CONFIG from '../config/game.config'
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render'

function skillById(id) {
  return CONFIG.skills.find((s) => s.id === id)
}

export function initSkills(db) {
  db.skillCharges = {}
  db.skillCooldowns = {}
  CONFIG.skills.forEach((s) => {
    db.skillCharges[s.id] = s.chargesPerLevel
    db.skillCooldowns[s.id] = 0
  })
  db.pauseTicks = 0
}

export function tickSkillCooldowns(db) {
  Object.keys(db.skillCooldowns).forEach((k) => {
    if (db.skillCooldowns[k] > 0) db.skillCooldowns[k] -= 1
  })
  if (db.pauseTicks > 0) db.pauseTicks -= 1
}

export function canUseSkill(skill, db) {
  if (!skill || db.isGameOver) return false
  if ((db.skillCharges[skill.id] || 0) <= 0) return false
  if ((db.skillCooldowns[skill.id] || 0) > 0) return false
  return true
}

export function useSkill(db, skillId) {
  const skill = skillById(skillId)
  if (!canUseSkill(skill, db)) return false

  db.skillCharges[skillId] -= 1
  db.skillCooldowns[skillId] = skill.cooldown

  switch (skillId) {
    case 'slow':
      db.enemys.forEach((e) => {
        if (e.isActive) e.applySlow(skill.slowRatio, skill.slowDuration)
      })
      GameGlobal.particles?.burst(SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.45, '#4FC3F7', 24)
      break
    case 'pause':
      db.pauseTicks = skill.pauseDuration
      GameGlobal.particles?.burst(SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.45, '#FFD54F', 18)
      break
    case 'massUp': {
      let n = 0
      db.towers.forEach((t) => {
        if (t.forceUpgrade()) n += 1
      })
      if (n === 0) {
        db.skillCharges[skillId] += 1
        db.skillCooldowns[skillId] = 0
        return false
      }
      GameGlobal.musicManager?.playUpgrade()
      GameGlobal.particles?.burst(SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.45, '#FF8A65', 20)
      break
    }
    default:
      return false
  }
  return true
}
