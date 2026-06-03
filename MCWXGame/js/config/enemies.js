/**
 * 敌机类型配置
 * behavior: straight | wobble | zigzag | swoop | drift | hunt
 */
export const ENEMY_TYPES = {
  SCOUT: {
    hp: 1, speed: 3, score: 10, size: 28, color: '#ff6b6b',
    accent: '#ffa8a8', behavior: 'wobble', shape: 'triangle',
  },
  DRONE: {
    hp: 1, speed: 4.8, score: 12, size: 22, color: '#00cec9',
    accent: '#81ecec', behavior: 'straight', shape: 'circle',
  },
  WASP: {
    hp: 2, speed: 3.8, score: 18, size: 26, color: '#fdcb6e',
    accent: '#ffeaa7', behavior: 'zigzag', shape: 'wasp',
  },
  FIGHTER: {
    hp: 3, speed: 2.5, score: 30, size: 36, color: '#ffa502',
    accent: '#ffcc80', behavior: 'straight', shape: 'triangle',
  },
  STRIKER: {
    hp: 4, speed: 3.2, score: 35, size: 32, color: '#a29bfe',
    accent: '#6c5ce7', behavior: 'swoop', shape: 'dart',
  },
  BOMBER: {
    hp: 5, speed: 1.6, score: 45, size: 44, color: '#e17055',
    accent: '#fab1a0', behavior: 'straight', shape: 'bomber',
  },
  GHOST: {
    hp: 2, speed: 2.6, score: 25, size: 30, color: '#74b9ff',
    accent: '#a8d8ff', behavior: 'drift', shape: 'ghost',
  },
  TANK: {
    hp: 8, speed: 1.5, score: 80, size: 48, color: '#a55eea',
    accent: '#d6a2e8', behavior: 'straight', shape: 'hex',
  },
  RAIDER: {
    hp: 6, speed: 2.2, score: 55, size: 38, color: '#636e72',
    accent: '#b2bec3', behavior: 'hunt', shape: 'triangle',
  },
  ELITE: {
    hp: 15, speed: 2, score: 150, size: 44, color: '#ff4757',
    accent: '#ff6b81', behavior: 'hunt', shape: 'elite',
  },
};

export const ENEMY_TYPE_KEYS = Object.keys(ENEMY_TYPES);
