# 全局配置目录 `src/global`

存放游戏常量、主题、存储键等**与 UI 无关的配置**，业务逻辑放在 `src/services` 与 `src/composables`。

## 后台（MCBack）是否需要？

| 能力 | 纯前端 | 需要 Node 后台 |
|------|--------|----------------|
| 单机挖矿、本地存档 | ✅ `uni.setStorageSync` | 否 |
| 换机恢复存档 | ❌ | ✅ 云存档 + 微信 openid |
| 排行榜 / 好友对比 | ❌ | ✅ |
| 防作弊（金币校验） | ❌ | ✅ |
| 运营活动、礼包码 | ❌ | ✅ |

**当前阶段建议：不建 MCBack**，先把玩法与 UI 做稳；上架微信小游戏后若要做**云存档或排行榜**，再在 `MCBack` 增加轻量 API（建议：Express/Koa + 微信 `code2Session` + 存档表）。

本仓库已预留 `src/global/config/storage.js` 键名，后续对接后台时只需在 `src/services/gameSync.js` 增加上传/下载即可。
