/**
 * 五关关卡配置 + 难度曲线
 * 目标通过率: 1关90% | 2关30% | 3关70% | 4关50% | 5关10%
 */
export const LEVELS = [
  {
    id: 1,
    name: '星云边境',
    killsToBoss: 20,
    spawnInterval: 62,
    enemyHpScale: 0.65,
    enemySpeedScale: 0.78,
    contactDamage: 10,
    bossContactDamage: 18,
    dropRate: 0.42,
    bg: {
      top: '#060818', mid: '#12103a', bottom: '#0a1628',
      nebula: ['rgba(108,92,231,0.15)', 'rgba(162,155,254,0.08)'],
      starSpeed: 1,
    },
    enemies: { SCOUT: 0.45, DRONE: 0.35, WASP: 0.1, FIGHTER: 0.1 },
    boss: {
      key: 'FALCON', name: '猎鹰号 · 先锋',
      hp: 45, speed: 1.8, score: 500, size: 68,
      color: '#e17055', accent: '#fab1a0', pattern: 'sweep', title: 'BOSS 来袭',
    },
  },
  {
    id: 2,
    name: '小行星带',
    killsToBoss: 52,
    spawnInterval: 30,
    enemyHpScale: 1.4,
    enemySpeedScale: 1.22,
    contactDamage: 26,
    bossContactDamage: 32,
    dropRate: 0.10,
    bg: {
      top: '#0a0810', mid: '#1a1208', bottom: '#120a04',
      nebula: ['rgba(253,203,110,0.12)', 'rgba(225,112,85,0.08)'],
      starSpeed: 1.2,
    },
    enemies: { WASP: 0.25, STRIKER: 0.25, FIGHTER: 0.25, BOMBER: 0.15, SCOUT: 0.1 },
    boss: {
      key: 'METEOR', name: '陨石巨兽 · 碾压者',
      hp: 210, speed: 1.4, score: 800, size: 90,
      color: '#636e72', accent: '#fdcb6e', pattern: 'tank', title: '巨兽苏醒',
    },
  },
  {
    id: 3,
    name: '电离层',
    killsToBoss: 24,
    spawnInterval: 54,
    enemyHpScale: 0.78,
    enemySpeedScale: 0.82,
    contactDamage: 13,
    bossContactDamage: 22,
    dropRate: 0.36,
    bg: {
      top: '#020810', mid: '#041828', bottom: '#062038',
      nebula: ['rgba(0,206,201,0.14)', 'rgba(116,185,255,0.1)'],
      starSpeed: 1.4,
    },
    enemies: { DRONE: 0.3, SCOUT: 0.25, GHOST: 0.2, FIGHTER: 0.15, WASP: 0.1 },
    boss: {
      key: 'PHANTOM', name: '幻影机 · 幽影',
      hp: 60, speed: 2.6, score: 1000, size: 64,
      color: '#74b9ff', accent: '#a29bfe', pattern: 'zigzag', title: '幽影现身',
    },
  },
  {
    id: 4,
    name: '深空要塞',
    killsToBoss: 38,
    spawnInterval: 38,
    enemyHpScale: 1.08,
    enemySpeedScale: 1.02,
    contactDamage: 19,
    bossContactDamage: 28,
    dropRate: 0.22,
    bg: {
      top: '#080410', mid: '#180818', bottom: '#100410',
      nebula: ['rgba(255,71,87,0.12)', 'rgba(165,94,234,0.1)'],
      starSpeed: 1.6,
    },
    enemies: { FIGHTER: 0.25, BOMBER: 0.2, TANK: 0.2, RAIDER: 0.15, STRIKER: 0.1, GHOST: 0.1 },
    boss: {
      key: 'FORTRESS', name: '要塞核心 · 铁壁',
      hp: 130, speed: 0.85, score: 1500, size: 96,
      color: '#a55eea', accent: '#ff4757', pattern: 'fortress', title: '要塞启动',
    },
  },
  {
    id: 5,
    name: '终极禁区',
    killsToBoss: 85,
    spawnInterval: 26,
    enemyHpScale: 1.55,
    enemySpeedScale: 1.28,
    contactDamage: 30,
    bossContactDamage: 42,
    dropRate: 0.07,
    bg: {
      top: '#100008', mid: '#200010', bottom: '#180008',
      nebula: ['rgba(255,71,87,0.18)', 'rgba(253,121,168,0.12)', 'rgba(108,92,231,0.08)'],
      starSpeed: 2,
    },
    enemies: { ELITE: 0.22, TANK: 0.22, RAIDER: 0.2, BOMBER: 0.16, STRIKER: 0.12, GHOST: 0.08 },
    boss: {
      key: 'DESTROYER', name: '毁灭者 · 终焉',
      hp: 2000, speed: 1.7, score: 5000, size: 128,
      color: '#1a1a2e', accent: '#ff4757', pattern: 'apocalypse', title: '⚠ 终焉降临',
    },
  },
];

export const MAX_LEVEL = LEVELS.length;

export function getCurrentLevelCfg() {
  const lv = GameGlobal?.databus?.currentLevel || 1;
  return LEVELS[lv - 1] || LEVELS[0];
}
