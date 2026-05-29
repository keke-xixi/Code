/** 装备道具类型 */
export const EQUIP_TYPES = {
  HP: 'equip_hp',
  ATTACK: 'equip_attack',
  SPEED: 'equip_speed',
};

export const EQUIP_CONFIG = {
  [EQUIP_TYPES.HP]: {
    name: '生命核心',
    label: '命',
    color: '#2ed573',
    dropColor: '#26de81',
    hpBonus: 30,
    maxLevel: 5,
  },
  [EQUIP_TYPES.ATTACK]: {
    name: '火力模块',
    label: '攻',
    color: '#ff4757',
    dropColor: '#ff6b81',
    maxLevel: 5,
  },
  [EQUIP_TYPES.SPEED]: {
    name: '推进器',
    label: '速',
    color: '#74b9ff',
    dropColor: '#48dbfb',
    maxLevel: 3,
  },
};

export const EQUIP_TYPE_LIST = Object.values(EQUIP_TYPES);

/** 战机外观随生命等级变化 */
export const SHIP_SKINS = [
  { body: '#0984e3', accent: '#74b9ff', wing: null, glow: null },
  { body: '#00b894', accent: '#55efc4', wing: '#00cec9', glow: null },
  { body: '#6c5ce7', accent: '#a29bfe', wing: '#fd79a8', glow: null },
  { body: '#e17055', accent: '#fab1a0', wing: '#fdcb6e', glow: 'rgba(253,203,110,0.3)' },
  { body: '#d63031', accent: '#ff7675', wing: '#ffeaa7', glow: 'rgba(255,118,117,0.35)' },
  { body: '#fdcb6e', accent: '#ffffff', wing: '#ff4757', glow: 'rgba(253,203,110,0.45)' },
];
