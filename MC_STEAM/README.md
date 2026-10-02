# MC_STEAM · Deep Core Miner

基于仓库 **MC** 微信挖矿玩法的 **Godot 4.3+ PC / Steam 向** 原型：格子凿矿、拾取、深度分层、连击、动态扩图、工坊升级与本地存档。

## 与 MC 小程序的差异（更偏 Steam）

| 能力 | MC 小程序 | MC_STEAM |
|------|-----------|----------|
| 操作 | 触屏滑动 | WASD / 方向键 + 鼠标点邻格 |
| 镜头 | 手动缩放偏移 | 平滑跟随 + 滚轮缩放 + 稀有矿震屏 |
| 反馈 | Toast | 飘字金币 + 连击 HUD + 层进度条 |
| 成长 | 抽卡页 | **深核工坊**（6 类升级，对齐 MC 商店思路） |
| 存档 | `uni.storage` | `user://mc_steam_save.json`，F5 手动 + 定时自动 |
| 上架 | 微信 | 预留 `scripts/steam/steam_manager.gd`（GodotSteam 接入点） |

核心数值（矿石、深度表、连击）与 `MC/src/config/game.js` 保持一致，便于两边一起调平衡。

## 运行

1. 安装 [Godot 4.3+](https://godotengine.org/)
2. 打开 Godot → **导入** → 选择本目录 `MC_STEAM/project.godot`
3. 运行主场景 `scenes/main.tscn`（已在项目中设为 Main Scene）

### 玩法设置（游戏内 **O** 键）

- **土里显示矿色** / **一挖即得** / **挖矿音效** / **屏幕震动**
- 设置保存在 `user://mc_steam_settings.json`

### 自主优化 Skill

单独发送 **`2`** 可启动约 4 小时的 MC_STEAM 自主优化流程（见 `.cursor/skills/mc-steam-2-autopilot/`），Agent 会分阶段改手感/UI/性能并发送进度条。

### 操作

- **移动**：WASD / 方向键（仅四向一格）
- **鼠标**：左键点击相邻格子移动并凿矿/拾取
- **B**：商店 · **E**：残矿吸纳（需购买升级）
- **滚轮**：缩放 · **F5**：存档
- **Esc**：关闭商店

## 目录结构

```
MC_STEAM/
  project.godot
  scenes/          # 主场景、HUD、商店、菜单
  scripts/
    autoload/      # GameData / SaveManager / GameEvents
    game/          # GameSession、MineWorld 渲染
    world/         # Procgen（深度概率）
    ui/
    steam/         # Steam 占位
```

## 建议的 Steam 后续路线

1. **美术**：TileSet / 粒子 / 矿工 Spine，替换当前矢量占位
2. **音频**：凿岩、拾金、层切换 BGM（按 `GameData.depth_layer_title`）
3. **Meta**：深度里程碑奖励、遗物三选一（替代手游抽卡）
4. **Steam**：GodotSteam 成就（最深 1000/5000/9000）、云存档、Steam Deck 手柄映射
5. **性能**：大地图改 **Chunk + MultiMesh**（当前为可见区 Dictionary + `_draw`）

## 导出

在 Godot 中 **项目 → 导出** 添加 Windows Desktop；Steam 包再叠加 Steamworks SDK / GodotSteam。
