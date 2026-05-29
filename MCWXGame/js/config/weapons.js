/**
 * 五种子弹/武器配置
 * 前三种为自动射击，后两种为技能释放
 */
export const WEAPON_TYPES = {
  PULSE: 'pulse',       // 1. 脉冲单发 - 基础直线弹
  TWIN: 'twin',         // 2. 双联射击 - 平行双发
  SPREAD: 'spread',     // 3. 扇形散射 - 三向散射
  LASER: 'laser',       // 4. 穿透镭射 - 技能：贯穿敌机
  MISSILE: 'missile',   // 5. 追踪导弹 - 技能：自动追踪
};

export const WEAPON_CONFIG = {
  [WEAPON_TYPES.PULSE]: {
    name: '脉冲弹',
    color: '#ffe066',
    damage: 1,
    speed: 12,
    size: 6,
    interval: 8,
    auto: true,
  },
  [WEAPON_TYPES.TWIN]: {
    name: '双联弹',
    color: '#74b9ff',
    damage: 1,
    speed: 11,
    size: 5,
    interval: 10,
    auto: true,
    offset: 14,
  },
  [WEAPON_TYPES.SPREAD]: {
    name: '散射弹',
    color: '#55efc4',
    damage: 1,
    speed: 9,
    size: 5,
    interval: 14,
    auto: true,
    angles: [-0.25, 0, 0.25],
  },
  [WEAPON_TYPES.LASER]: {
    name: '穿透镭射',
    color: '#00cec9',
    damage: 5,
    speed: 18,
    size: 4,
    width: 8,
    pierce: true,
    auto: false,
    skillKey: 'laser',
  },
  [WEAPON_TYPES.MISSILE]: {
    name: '追踪导弹',
    color: '#fd79a8',
    damage: 3,
    speed: 7,
    size: 8,
    homing: true,
    auto: false,
    skillKey: 'missile',
    count: 5,
  },
};

/** 五种技能配置 */
export const SKILL_CONFIG = {
  laser: {
    name: '雷霆镭射',
    desc: '发射穿透全屏的镭射束',
    weapon: WEAPON_TYPES.LASER,
    cooldown: 360,
    color: '#00cec9',
  },
  missile: {
    name: '导弹风暴',
    desc: '发射5枚追踪导弹',
    weapon: WEAPON_TYPES.MISSILE,
    cooldown: 480,
    color: '#fd79a8',
  },
  shield: {
    name: '能量护盾',
    desc: '3秒内免疫伤害',
    cooldown: 600,
    duration: 180,
    color: '#a29bfe',
  },
  bomb: {
    name: '全屏轰炸',
    desc: '清除屏幕内所有敌机',
    cooldown: 900,
    damage: 999,
    color: '#fab1a0',
  },
  overdrive: {
    name: '超速射击',
    desc: '5秒内射击速度翻倍',
    cooldown: 720,
    duration: 300,
    color: '#fdcb6e',
  },
};

export const AUTO_WEAPONS = [
  WEAPON_TYPES.PULSE,
  WEAPON_TYPES.TWIN,
  WEAPON_TYPES.SPREAD,
];
