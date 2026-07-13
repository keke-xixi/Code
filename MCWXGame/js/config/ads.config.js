/**
 * 流量主广告位配置
 * 路径：微信公众平台 → 流量主 → 广告管理 → 新建广告位
 * 将 adunit-xxxx 填入下方
 * 注意：真实广告只能在手机微信中播放，电脑开发者工具模拟器无法展示
 */

/** 是否启用广告（关闭后所有广告入口隐藏） */
export const AD_ENABLED = true;

export const AD_UNITS = {
  /** 激励视频：对局随机技能 / 通关加分 / 死亡即时复活 */
  rewardedVideo: 'adunit-75603c3f5807e330',
  /** 激励视频：暂停弹窗看广告累积复活次数 */
  reviveRewardedVideo: 'adunit-8702040da9770932',
  /** 插屏：游戏结束（暂停入口已隐藏） */
  interstitial: 'adunit-ec3c730818cb4c3c',
};

/** 通关看广告积分加成比例 */
export const SCORE_BONUS_RATIO = 0.5;
