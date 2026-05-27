/**
 * @deprecated 请使用 @/services/game/world.js 与 @/config/game.js
 * 保留此文件以兼容旧引用
 */
export {
  getRange,
  generateOreType,
  initializeWorldOres,
  extendWorldOres,
  createOreCell,
  getOreMeta,
} from '@/services/game/world.js'

export { ORE_TYPES as type_map } from '@/config/game.js'
