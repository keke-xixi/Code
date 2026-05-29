import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render';

export { SCREEN_WIDTH, SCREEN_HEIGHT };

export const FPS = 60;

// 玩家
export const PLAYER_SIZE = 36;
export const PLAYER_SPEED = 8;
export const PLAYER_MAX_HP = 100;
export const PLAYER_SHOOT_INTERVAL = 8;

// 敌机
export const ENEMY_TYPES = {
  SCOUT: { hp: 1, speed: 3, score: 10, size: 28, color: '#ff6b6b' },
  FIGHTER: { hp: 3, speed: 2.5, score: 30, size: 36, color: '#ffa502' },
  TANK: { hp: 8, speed: 1.5, score: 80, size: 48, color: '#a55eea' },
  ELITE: { hp: 15, speed: 2, score: 150, size: 44, color: '#ff4757' },
};

// 背景
export const STAR_COUNT = 80;
export const BG_SCROLL_SPEED = 2;

// 技能冷却（帧数，60fps）
export const SKILL_COOLDOWN = {
  LASER: 360,    // 6秒
  MISSILE: 480,  // 8秒
  SHIELD: 600,   // 10秒
  BOMB: 900,     // 15秒
  OVERDRIVE: 720 // 12秒
};
