# MC 后端说明（MCBack）

## 当前结论：**暂不需要 Node 后台**

你的挖矿小游戏目前是 **单机 + 本地存档**，使用 `uni.setStorageSync` / 微信的 `wx.setStorageSync` 即可满足：

- 金币、位置、移动轨迹
- 地图矿石数据（`MC_WORLD_ORES`）

这类玩法在 **微信小游戏 MVP 阶段建议保持纯前端**，审核与部署更简单，也无需服务器成本。

---

## 什么时候才需要后台？

| 需求 | 是否需要后台 | 说明 |
|------|----------------|------|
| 本地单机存档 | 否 | 已实现 `src/services/game/save.js` |
| 换设备云存档 | **是** | 需用户 openid + 云数据库或自建 API |
| 全服排行榜 | **是** | 需防作弊校验与持久化 |
| 多人同屏 / 交易 | **是** | 需 WebSocket 或房间服务 |
| 内购 / 广告统计 | **是** | 需服务端校验订单 |
| 运营后台改配置 | 可选 | 可用微信云开发配置，不一定非要 Node |

若仅做 **「能玩、能存盘、能发微信小游戏」**，继续纯前端即可。

---

## 若未来要加后台，推荐形态

```
MC（uni-app 微信端）
    ↓ HTTPS
MCBack（Node.js + Koa/Express/Fastify）
    ↓
MySQL / Redis（存档、排行榜）
```

建议接口（示例）：

- `POST /api/auth/wx-login` — code 换 openid
- `GET/PUT /api/save` — 云存档
- `GET /api/leaderboard` — 排行榜

可在本目录初始化，例如：

```bash
cd MCBack
npm init -y
npm i express cors dotenv
```

当前仓库 **未包含可运行服务代码**，避免增加你尚未使用的维护成本。确定要做云存档或排行榜时，再在此目录实现即可。

---

## 微信小游戏注意点（无后台）

1. 包体限制：控制资源体积，矿石逻辑放代码里即可。
2. 存档：优先本地；重要进度可再接 [微信云开发](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html) 而无需自建 Node。
3. 审核：避免未备案的外链 API；纯本地游戏通过率更高。

如需我下一步在 `MCBack`  scaffold 一个最小 Express + 云存档 API，说明你要 **云存档** 还是 **排行榜** 即可。
