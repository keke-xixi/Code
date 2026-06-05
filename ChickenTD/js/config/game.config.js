/**
 * ============================================================
 *  鸡窝保卫战 — 全局数值与配置
 *  换塔、换怪、调难度只改这个文件（记得同步注释）
 * ============================================================
 */

export default {
  /** 基础规则 */
  game: {
    title: '鸡窝保卫战',
    initialLives: 15,        // 鸡窝生命值（漏怪扣 1）
    initialCoins: 180,       // 开局金币
    maxStar: 3,              // 防御鸡最高星级
    nestName: '神圣鸡窝',     // 终点名称
    uiHeight: 0.22,          // 底部操作栏占屏幕高度比例
    hudHeight: 0.08,         // 顶部 HUD 高度比例
  },

  /** 地图路径：怪物从 path[0] 出生，沿折线走向终点（比例坐标 0~1） */
  path: [
    { x: 0.02, y: 0.52 },
    { x: 0.18, y: 0.52 },
    { x: 0.18, y: 0.22 },
    { x: 0.42, y: 0.22 },
    { x: 0.42, y: 0.62 },
    { x: 0.62, y: 0.62 },
    { x: 0.62, y: 0.32 },
    { x: 0.82, y: 0.32 },
    { x: 0.82, y: 0.48 },
    { x: 0.96, y: 0.48 },
  ],

  /** 可放置防御鸡的槽位（比例坐标） */
  slots: [
    { x: 0.10, y: 0.42 },
    { x: 0.28, y: 0.30 },
    { x: 0.28, y: 0.62 },
    { x: 0.50, y: 0.14 },
    { x: 0.50, y: 0.48 },
    { x: 0.50, y: 0.74 },
    { x: 0.72, y: 0.22 },
    { x: 0.72, y: 0.52 },
    { x: 0.88, y: 0.38 },
  ],

  /**
   * 防御鸡配置
   * - cost: 建造费用
   * - starUpgradeCost: 升到 2 星 / 3 星所需金币
   * - stars[n]: 各星级战斗属性
   *   - damage: 单次伤害
   *   - range: 攻击半径（像素，运行时按屏宽缩放）
   *   - interval: 攻击间隔（帧，60帧≈1秒）
   *   - special: 特殊效果参数
   */
  towers: {
    chick: {
      id: 'chick',
      name: '小黄鸡',
      desc: '便宜好用，啄啄啄！',
      color: '#FFE066',
      cost: 50,
      starUpgradeCost: { 2: 60, 3: 120 },
      stars: {
        1: { damage: 10, range: 72, interval: 38 },
        2: { damage: 18, range: 82, interval: 32 },
        3: { damage: 28, range: 92, interval: 26 },
      },
    },
    rooster: {
      id: 'rooster',
      name: '大公鸡',
      desc: '喔喔叫！范围减速敌人',
      color: '#FF6B35',
      cost: 110,
      starUpgradeCost: { 2: 90, 3: 180 },
      stars: {
        1: { damage: 6, range: 88, interval: 50, special: { slow: 0.25, aoe: 36 } },
        2: { damage: 10, range: 98, interval: 44, special: { slow: 0.35, aoe: 42 } },
        3: { damage: 16, range: 108, interval: 38, special: { slow: 0.45, aoe: 50 } },
      },
    },
    kungfu: {
      id: 'kungfu',
      name: '功夫鸡',
      desc: '快拳连击，近身爆发',
      color: '#C0392B',
      cost: 140,
      starUpgradeCost: { 2: 100, 3: 200 },
      stars: {
        1: { damage: 14, range: 68, interval: 18 },
        2: { damage: 22, range: 74, interval: 15 },
        3: { damage: 34, range: 80, interval: 12, special: { crit: 0.25, critMul: 2 } },
      },
    },
    kun: {
      id: 'kun',
      name: '坤行者',
      desc: '鸡你太美！范围内敌人易伤',
      color: '#9B59B6',
      cost: 190,
      starUpgradeCost: { 2: 130, 3: 260 },
      stars: {
        1: { damage: 8, range: 95, interval: 42, special: { vuln: 0.2 } },
        2: { damage: 12, range: 105, interval: 36, special: { vuln: 0.32 } },
        3: { damage: 18, range: 115, interval: 30, special: { vuln: 0.45 } },
      },
    },
    fighter: {
      id: 'fighter',
      name: '歼鸡号',
      desc: '远程导弹，专打高血量',
      color: '#3498DB',
      cost: 260,
      starUpgradeCost: { 2: 180, 3: 360 },
      stars: {
        1: { damage: 45, range: 130, interval: 65 },
        2: { damage: 72, range: 145, interval: 55 },
        3: { damage: 110, range: 160, interval: 45, special: { armorPierce: 0.3 } },
      },
    },
    satellite: {
      id: 'satellite',
      name: '天眼鸡',
      desc: '卫星制导，周期性全图减速',
      color: '#1ABC9C',
      cost: 320,
      starUpgradeCost: { 2: 220, 3: 440 },
      stars: {
        1: { damage: 20, range: 100, interval: 90, special: { pulseSlow: 0.35, pulseInterval: 200, pulseDmg: 15 } },
        2: { damage: 30, range: 110, interval: 80, special: { pulseSlow: 0.45, pulseInterval: 170, pulseDmg: 25 } },
        3: { damage: 45, range: 120, interval: 70, special: { pulseSlow: 0.55, pulseInterval: 140, pulseDmg: 40 } },
      },
    },
  },

  /** 塔建造栏显示顺序 */
  towerOrder: ['chick', 'rooster', 'kungfu', 'kun', 'fighter', 'satellite'],

  /**
   * 进攻怪兽
   * - hp: 生命值
   * - speed: 每帧沿路径移动像素（会乘 scale）
   * - reward: 击杀金币
   * - armor: 减伤比例 0~1
   */
  enemies: {
    eagle: {
      id: 'eagle',
      name: '老鹰',
      color: '#5D6D7E',
      hp: 55,
      speed: 2.8,
      reward: 12,
      armor: 0,
    },
    snake: {
      id: 'snake',
      name: '毒蛇',
      color: '#27AE60',
      hp: 80,
      speed: 2.0,
      reward: 18,
      armor: 0,
      special: { poison: 3, poisonTicks: 40 },
    },
    weasel: {
      id: 'weasel',
      name: '黄鼠狼',
      color: '#D4AC0D',
      hp: 45,
      speed: 3.6,
      reward: 15,
      armor: 0,
    },
    fox: {
      id: 'fox',
      name: '狐狸',
      color: '#E67E22',
      hp: 180,
      speed: 1.6,
      reward: 35,
      armor: 0.15,
    },
    demon: {
      id: 'demon',
      name: '黄梅老妖',
      color: '#8E44AD',
      hp: 1200,
      speed: 0.9,
      reward: 200,
      armor: 0.25,
      special: { regen: 0.4, boss: true },
    },
  },

  /**
   * 波次配置
   * - delay: 本波开始前的等待帧数
   * - groups: 每组 { type, count, gap } gap=每只间隔帧数
   * - reward: 波次完成额外奖励（可选）
   */
  waves: [
    { delay: 120, groups: [{ type: 'eagle', count: 6, gap: 55 }] },
    { delay: 90, groups: [{ type: 'eagle', count: 8, gap: 45 }, { type: 'weasel', count: 4, gap: 40 }] },
    { delay: 90, groups: [{ type: 'snake', count: 6, gap: 50 }, { type: 'eagle', count: 6, gap: 35 }] },
    { delay: 90, groups: [{ type: 'fox', count: 3, gap: 80 }, { type: 'weasel', count: 8, gap: 30 }] },
    { delay: 90, groups: [{ type: 'snake', count: 10, gap: 40 }, { type: 'fox', count: 4, gap: 70 }] },
    { delay: 120, groups: [{ type: 'fox', count: 6, gap: 55 }, { type: 'eagle', count: 10, gap: 25 }] },
    { delay: 150, groups: [{ type: 'weasel', count: 12, gap: 22 }, { type: 'snake', count: 8, gap: 45 }] },
    { delay: 180, groups: [{ type: 'demon', count: 1, gap: 0 }, { type: 'fox', count: 4, gap: 60 }] },
    { delay: 120, groups: [{ type: 'eagle', count: 15, gap: 20 }, { type: 'demon', count: 1, gap: 300 }] },
  ],

  /** 视觉缩放：以 375 宽为基准 */
  scale: {
    baseWidth: 375,
    pathWidth: 28,
    slotRadius: 22,
    towerRadius: 18,
  },
}
