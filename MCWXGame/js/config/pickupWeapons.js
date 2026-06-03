/**
 * 可拾取的五种武器子弹
 * 拾取后永久生效，直到捡到其他类型
 */
export const PICKUP_TYPES = {
  LASER: 'pickup_laser',
  EXPLODE: 'pickup_explode',
  BLADE: 'pickup_blade',
  QI: 'pickup_qi',
  SHOTGUN: 'pickup_shotgun',
};

export const PICKUP_WEAPON_CONFIG = {
  [PICKUP_TYPES.LASER]: {
    name: '激光',
    label: '激',
    color: '#00cec9',
    dropColor: '#00cec9',
    damage: 2,
    speed: 18,
    size: 3,
    width: 5,
    interval: 5,
    pierce: true,
  },
  [PICKUP_TYPES.EXPLODE]: {
    name: '爆炸蛋',
    label: '爆',
    color: '#fab1a0',
    dropColor: '#e17055',
    damage: 4,
    speed: 7,
    size: 10,
    interval: 18,
    explodeRadius: 55,
  },
  [PICKUP_TYPES.BLADE]: {
    name: '跟踪飞刃',
    label: '刃',
    color: '#fd79a8',
    dropColor: '#e84393',
    damage: 3,
    speed: 9,
    size: 10,
    interval: 12,
    homing: true,
  },
  [PICKUP_TYPES.QI]: {
    name: '气功波',
    label: '气',
    color: '#a29bfe',
    dropColor: '#6c5ce7',
    damage: 3,
    speed: 9,
    size: 44,
    height: 22,
    interval: 18,
    pierce: true,
  },
  [PICKUP_TYPES.SHOTGUN]: {
    name: '散弹',
    label: '散',
    color: '#ffe066',
    dropColor: '#fdcb6e',
    damage: 1,
    speed: 10,
    size: 5,
    interval: 16,
    pelletCount: 5,
    spreadAngle: 0.5,
  },
};

export const PICKUP_TYPE_LIST = Object.values(PICKUP_TYPES);

/** 合并配置供 bullet 读取 */
export function getWeaponCfg(type) {
  return PICKUP_WEAPON_CONFIG[type] || null;
}
