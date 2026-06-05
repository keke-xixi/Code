export default {
  title: '镜界双生',
  hudHeight: 0.11,
  footerHeight: 0.11,
  maxLives: 30,
  diffHitMul: 1.35,
  hintsPerLevel: 2,
  hintPenaltySec: 8,
  starTime: { three: 75, two: 120 },
  audioVol: {
    find: 0.26,
    miss: 0.14,
    bgm: 0.18,
  },
  assets: {
    menuBg: 'images/menu_bg.png',
    audio: {
      find: 'audio/find.wav',
      miss: 'audio/miss.wav',
      bgmMenu: 'audio/bgm_menu.wav',
      bgmWarm: 'audio/bgm_warm.wav',
      bgmCool: 'audio/bgm_cool.wav',
    },
  },
};
