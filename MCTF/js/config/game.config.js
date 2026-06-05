/**
 * 鸡窝保卫战 — 横屏版配置
 */

export default {
  game: {
    title: '鸡窝保卫战',
    initialLives: 15,
    initialCoins: 200,
    maxStar: 3,
    hudHeight: 0.11,
    bottomBarHeight: 0.2,
    sellRefundRate: 0.9,
    rewardMul: 2,
    towerDamageMul: 1.44,
    towerRangeMul: 1.5,
  },

  /** 资源路径（images/ 与 audio/） */
  assets: {
    bgGrass: 'images/bg_grass.png',
    bgClouds: 'images/bg_clouds.png',
    nest: 'images/nest.png',
    slotNest: 'images/slot_nest.png',
    menuBg: 'images/level_menu_bg.png',
    levelCards: {
      1: 'images/level_card_1.png',
      2: 'images/level_card_2.png',
      3: 'images/level_card_3.png',
    },
    levelBgs: {
      1: 'images/level_card_1.png',
      2: 'images/level_card_2.png',
      3: 'images/level_card_3.png',
    },
    bullet: 'images/bullet.png',
    towers: {
      chick: 'images/tower_chick.png',
      rooster: 'images/tower_rooster.png',
      kungfu: 'images/tower_kungfu.png',
      kun: 'images/tower_kun.png',
      fighter: 'images/tower_fighter.png',
      satellite: 'images/tower_satellite.png',
    },
    enemies: {
      eagle: 'images/enemy_eagle.png',
      snake: 'images/enemy_snake.png',
      weasel: 'images/enemy_weasel.png',
      fox: 'images/enemy_fox.png',
      demon: 'images/enemy_demon.png',
    },
    audio: {
      bgm: 'audio/bgm.mp3',
      shoot: 'audio/bullet.mp3',
      hit: 'audio/boom.mp3',
      build: 'audio/build.mp3',
      upgrade: 'audio/upgrade.mp3',
    },
  },

  towers: {
    chick: {
      id: 'chick', name: '小黄鸡', desc: '均衡入门', color: '#FFE066',
      cost: 50, starUpgradeCost: { 2: 60, 3: 120 },
      stars: {
        1: { damage: 10, range: 78, interval: 38 },
        2: { damage: 18, range: 88, interval: 32 },
        3: { damage: 28, range: 98, interval: 26 },
      },
    },
    rooster: {
      id: 'rooster', name: '大公鸡', desc: '范围减速', color: '#FF6B35',
      cost: 110, starUpgradeCost: { 2: 90, 3: 180 },
      stars: {
        1: { damage: 6, range: 95, interval: 50, special: { slow: 0.25 } },
        2: { damage: 10, range: 105, interval: 44, special: { slow: 0.35 } },
        3: { damage: 16, range: 115, interval: 38, special: { slow: 0.45 } },
      },
    },
    kungfu: {
      id: 'kungfu', name: '功夫鸡', desc: '快攻暴击', color: '#C0392B',
      cost: 140, starUpgradeCost: { 2: 100, 3: 200 },
      stars: {
        1: { damage: 14, range: 72, interval: 18 },
        2: { damage: 22, range: 78, interval: 15 },
        3: { damage: 34, range: 84, interval: 12, special: { crit: 0.25, critMul: 2 } },
      },
    },
    kun: {
      id: 'kun', name: '坤行者', desc: '易伤光环', color: '#9B59B6',
      cost: 190, starUpgradeCost: { 2: 130, 3: 260 },
      stars: {
        1: { damage: 8, range: 100, interval: 42, special: { vuln: 0.2 } },
        2: { damage: 12, range: 110, interval: 36, special: { vuln: 0.32 } },
        3: { damage: 18, range: 120, interval: 30, special: { vuln: 0.45 } },
      },
    },
    fighter: {
      id: 'fighter', name: '歼鸡号', desc: '远程重炮', color: '#3498DB',
      cost: 260, starUpgradeCost: { 2: 180, 3: 360 },
      stars: {
        1: { damage: 45, range: 135, interval: 65 },
        2: { damage: 72, range: 150, interval: 55 },
        3: { damage: 110, range: 165, interval: 45, special: { armorPierce: 0.3 } },
      },
    },
    satellite: {
      id: 'satellite', name: '天眼鸡', desc: '全图脉冲', color: '#1ABC9C',
      cost: 320, starUpgradeCost: { 2: 220, 3: 440 },
      stars: {
        1: { damage: 20, range: 105, interval: 90, special: { pulseSlow: 0.35, pulseInterval: 200, pulseDmg: 15 } },
        2: { damage: 30, range: 115, interval: 80, special: { pulseSlow: 0.45, pulseInterval: 170, pulseDmg: 25 } },
        3: { damage: 45, range: 125, interval: 70, special: { pulseSlow: 0.55, pulseInterval: 140, pulseDmg: 40 } },
      },
    },
  },

  towerOrder: ['chick', 'rooster', 'kungfu', 'kun', 'fighter', 'satellite'],

  enemies: {
    eagle: { id: 'eagle', name: '老鹰', color: '#5D6D7E', hp: 55, speed: 2.8, reward: 12, armor: 0, size: 36 },
    snake: { id: 'snake', name: '毒蛇', color: '#27AE60', hp: 80, speed: 2.0, reward: 18, armor: 0, size: 34, special: { poison: 3 } },
    weasel: { id: 'weasel', name: '黄鼠狼', color: '#D4AC0D', hp: 45, speed: 3.6, reward: 15, armor: 0, size: 32 },
    fox: { id: 'fox', name: '狐狸', color: '#E67E22', hp: 180, speed: 1.6, reward: 35, armor: 0.15, size: 40 },
    demon: { id: 'demon', name: '黄梅老妖', color: '#8E44AD', hp: 1200, speed: 0.9, reward: 200, armor: 0.25, size: 56, special: { regen: 0.4, boss: true } },
  },

  scale: { baseWidth: 812, pathWidth: 36, pathCornerRadius: 42, slotRadius: 28, slotNestSize: 58, towerSize: 52, towerSitOffset: 14 },
}
