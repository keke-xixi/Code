/**
 * 游戏圈链接配置
 * 来源：MP 后台 → 游戏能力地图 → 游戏圈 → 基础设置 → 游戏圈首页链接
 *
 * 注意：代码里跳转必须用「游戏内打开」的 openlink，不要用 H5 链接。
 */

/** 游戏内打开 — 用于 wx.createPageManager / wx.createGameClubButton */
export const GAME_CLUB_OPENLINK =
  '-SSEykJvFV3pORt5kTNpS0Rk137OVY9mQagcO5TKjTQXm1qF7_BH0-maJz31qzw7SK5m2NAU33T1TzmVU7w8ypNFNVkhPi5fGNOHb6gszuJOlU0iYqKtQZQwVpIin-viH_UO9O3PigT5XezRAve4JBr0E4Fqgd9Hme5uovXUGSXI81Z96PnpO3Vi3jXOe9wjStVkjrVMO9YC8jVulgNuuuRYkMpoXTJjL08mIZYRMC-ibwEdalSvL8ULcQoUaaIMW-vKk-16Xh7hMPKTTpuOzf98LeMPQ0Iur6kC6jNcukLy3putKmn7qfX2W9inBg_7CepQZUtHMIiP7Gss1sMh-Q';

/** 游戏内推荐 — 推荐至游戏圈能力（暂未接入，预留） */
export const GAME_CLUB_RECOMMEND_OPENLINK =
  'FM09ILkjlQxM0OIigsWiuGIdFe7FV0HoNKXS8V9PYRE9XRaSt07V7EIlxqPmpUBEV6D8Cw5BoTFMF-RlOueuqlh2vMFUD2m_lbS97tMOT0z3cob_LCHTpyLRKxTyXkV_ytjTQsVtqX4Msig6dGIMsD3BML217QtH74BQzNPNJRlC4StnAZitB1d6e3vSOgkqT9G4jdeYYphwsSCXdMdiCvad4xz3cRV-4jbQuGrwNs9MUwOX1AmNvwsOuoHHSiGTcgItgfMk8r8NrmGKN8y_J3hX8qrNonUf4oyntyaufHASr5ynNt3DUmlTuTtfbG3gFD_cS_UqCmkiHGTvPHaa-yENpSvaQWtU8LgSQU8KajkB3lZ_aMNSzRoBzq9NqLC4E4pxySIemYvcWssvQOWahQ';

/**
 * MP 后台「游戏玩法」配置的玩法 ID（须与后台完全一致，仅英文字母）
 */
export const GAMEPLAY_KEYS = {
  BEST_SCORE: 'bestScore',
  MAX_LEVEL: 'maxLevel',
  GAME_CLEARED: 'gameCleared',
};
