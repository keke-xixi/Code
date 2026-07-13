import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render';

export { SCREEN_WIDTH, SCREEN_HEIGHT };

export const FPS = 60;

// 玩家
export const PLAYER_SIZE = 36;
export const PLAYER_SPEED = 8;
export const PLAYER_MAX_HP = 100;
export const PLAYER_SHOOT_INTERVAL = 8;

// 敌机配置见 js/config/enemies.js

// 背景
export const STAR_COUNT = 80;
export const BG_SCROLL_SPEED = 2;

// 子弹性能上限（防止散弹 + 多弹道同屏过多）
export const MAX_BULLETS = 100;
export const SHOTGUN_MAX_PELLETS_PER_VOLLEY = 18;

// 技能冷却（帧数，60fps）
export const SKILL_COOLDOWN = {
  LASER: 360,    // 6秒
  MISSILE: 480,  // 8秒
  SHIELD: 600,   // 10秒
  BOMB: 900,     // 15秒
  OVERDRIVE: 720 // 12秒
};
