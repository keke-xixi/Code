# 微信小游戏 AppID：wxdb70767113810f88

## 报错 `game.json 未找到` 的原因

你当前导入的很可能是 **`dist/dev/mp-weixin`**（uni **小程序**：只有 `app.json`，没有 `game.json`）。

小游戏 AppID **只能**打开带 **`game.json` + `game.js`** 的目录，和 uni 小程序目录不是同一个东西。

---

## 正确步骤（AppID 仍是 wxdb70767113810f88）

### 1. 生成/更新小游戏目录

在项目根目录执行：

```bash
npm run dev:wx-game
```

### 2. 微信开发者工具

1. 左侧选 **「小游戏」**
2. **关闭** 现在的 `mp-weixin` 项目
3. **导入** 下面**二选一**（不要选 `dist/dev/mp-weixin`）：

| 推荐目录 |
|----------|
| `c:\zg\code\Code\MC\dist\wxdb707-game` |
| `c:\zg\code\Code\MC\minigame` |

4. AppID：`wxdb70767113810f88`

### 3. 确认导入对了

左侧文件树**必须有**：

- `game.json`
- `game.js`

**不能有** `app.json`、`pages/` 作为主入口。

---

## uni 小程序（完整 Vue 版）另说

若要用 `npm run dev:mp-weixin` 的完整游戏：

- 导入：`dist/dev/mp-weixin`
- AppID：`wx9430aecf60877fad`（小程序账号）
- 模式：**小程序**

小游戏 AppID **不能**用来打开 `mp-weixin` 目录。
