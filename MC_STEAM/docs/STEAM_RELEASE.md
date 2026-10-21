# MC_STEAM（拾光）Steam 上架实操指南

面向本仓库 **Godot 4.7** 项目，从导出 Windows 包到 Steamworks 后台与 **GodotSteam** 接入。按顺序执行即可。

---

## 0. 前置条件

| 项 | 说明 |
|----|------|
| Steamworks 合作伙伴 | [partner.steamgames.com](https://partner.steamgames.com/) 注册并完成 Steam Direct 费用 |
| **App ID** | 后台创建应用后获得（下文用 `YOUR_APP_ID` 占位） |
| Godot | 与 `project.godot` 一致，当前 **4.7.x** |
| Export Templates | 编辑器 → **管理导出模板**，版本与引擎一致 |

---

## 1. 安装 GodotSteam（Godot 4）

1. 打开 [GodotSteam（GitHub）](https://github.com/GodotSteam/GodotSteam) 的 **Releases**，选择与 **Godot 4.7** 匹配的预编译版或按文档自行编译 GDExtension。
2. 将插件放到工程内，例如：
   ```
   MC_STEAM/addons/godotsteam/
   ```
3. **项目 → 项目设置 → 插件**，启用 **GodotSteam**。
4. 确认 `project.godot` 的 `[application]` 中 **config/features** 与引擎版本一致；导出 Windows 时需使用 **与 GodotSteam 匹配的导出模板**（官方文档若要求专用模板，以 GodotSteam 说明为准）。

> 若暂不接 Steam，游戏仍可正常玩；`SteamManager` 会在 `steam_enabled == false` 时跳过 SDK 调用，仅保留本地里程碑 Toast。

---

## 2. Steamworks 后台：成就配置

代码里成就 API 名定义在 `scripts/steam/steam_manager.gd` 的 `DEPTH_ACHIEVEMENTS`，**须与后台 API Name 完全一致**（区分大小写）。

| 游戏内深度阈值 | **Achievement API Name**（Steam 后台填写） | 建议显示名（中文） | 建议描述 |
|----------------|-------------------------------------------|-------------------|----------|
| 100 | `DEPTH_100` | 初探地下 | 到达深度 100 |
| 500 | `DEPTH_500` | 矿井学徒 | 到达深度 500 |
| 1000 | `DEPTH_1000` | 千米之下 | 到达深度 1000 |
| 2000 | `DEPTH_2000` | 深部矿工 | 到达深度 2000 |
| 5000 | `DEPTH_5000` | 富矿带 | 到达深度 5000 |
| 7000 | `DEPTH_7000` | 虚空边缘 | 到达深度 7000 |
| 9000 | `DEPTH_9000` | 接近核心 | 到达深度 9000 |

**操作路径**：Steamworks → 你的 App → **Stats & Achievements** → **Achievements** → 新建，**API Name** 填上表第二列。

图标：各成就 64×64 / 128×128 PNG（未解锁灰度、解锁彩色各一套，按 Steam 规范）。

---

## 3. 接入代码（替换 `steam_manager.gd` 占位）

当前逻辑：`GameEvents.depth_changed` → `report_max_depth` → `unlock_achievement`。接入后只需在 `unlock_achievement` 内调用 Steam API。

### 3.1 开发用 `steam_appid.txt`

在 **游戏 exe 同目录** 放置（仅本地调试；勿把真实 App ID 提交到公开仓库若需保密）：

```
YOUR_APP_ID
```

一行数字，无空格。从 Steam 客户端启动或带 Steam 运行时，SDK 才能初始化。

### 3.2 初始化（`_ready` 示例）

GodotSteam 常见写法（以你安装的插件文档为准，类名可能是 `Steam` 单例）：

```gdscript
func _ready() -> void:
	_load_local_unlocks()
	if not GameEvents.depth_changed.is_connected(_on_depth_changed):
		GameEvents.depth_changed.connect(_on_depth_changed)

	var init: Dictionary = Steam.steamInitEx(true)  # 或 steamInit()，见 GodotSteam 文档
	steam_enabled = init.get("status", 0) == 1  # 以插件返回结构为准
	if not steam_enabled:
		push_warning("Steam 未初始化，成就仅本地记录")
	else:
		_sync_achievements_to_steam()
```

### 3.3 解锁成就

```gdscript
func unlock_achievement(id: String) -> void:
	if steam_enabled:
		if not Steam.getAchievement(id):  # 未解锁再 set，避免重复
			Steam.setAchievement(id)
			Steam.storeStats()
	# 无论是否 Steam，保留现有本地 JSON + Toast（便于无 Steam 环境测试）
```

### 3.4 启动时同步（可选）

若玩家换电脑，Steam 侧已有成就、本地 `_unlocked` 为空，可在 `_sync_achievements_to_steam()` 里 `Steam.getAchievement(id)` 回填 `_unlocked`，避免重复弹 Toast。

---

## 4. Godot 导出 Windows（Release）

`export_presets.cfg` 已在 `.gitignore`，在编辑器里配置一次即可。

### 4.1 添加预设

**项目 → 导出 → 添加 → Windows Desktop**

### 4.2 建议勾选项

| 选项 | 建议 |
|------|------|
| **Export Path** | `MC_STEAM/export/拾光.exe`（或 `DeepCoreMiner.exe`，与 Steam 安装名一致） |
| **Embed PCK** | 可先 **关闭**，得到 `exe + .pck`，便于 Steam 热更 pck；也可 **开启** 单文件 exe |
| **Architecture** | **x86_64**（Steam PC 主流） |
| **Custom Template** | 若 GodotSteam 要求专用 Windows 模板，在此指定 |
| **Debug / 调试** | **关闭**（Release） |
| **Encryption** | 首版可不开；开加密需记密钥 |

### 4.3 导出前检查

- [ ] 主场景 `scenes/main.tscn`，F5 全流程可玩  
- [ ] 存档：`user://mc_steam_save.json`（`SaveManager`）在无编辑器环境可写  
- [ ] `FavourArt` 不依赖本机 `D:\zg\design\...`：发布包应使用 `assets/` 内资源（运行 `tools/sync_favour_art.ps1` 或打包前确认）  
- [ ] 125% 系统缩放 + 1080p 底栏可见（`project.godot` fractional + keep）

### 4.4 导出目录示例（上传 Steam 的「根」）

```
export/
  拾光.exe
  拾光.pck          # 若未 embed
  steam_api64.dll   # GodotSteam / Steamworks _redist（按插件文档复制）
  .                 # 其他依赖 DLL
```

Steam **Depot** 通常指向该文件夹内容（不要多包一层空目录）。

---

## 5. Steamworks：Depot 与上传

### 5.1 创建 Depot

1. App → **Installation** → **Depots** → 新建 **Windows** depot。  
2. 记录 **Depot ID**。

### 5.2 简单 `app_build.vdf` 示例

放在 Steamworks SDK 的 `scripts` 目录，路径按本机修改：

```vdf
"AppBuild"
{
	"AppID" "YOUR_APP_ID"
	"Desc" "拾光 Windows build"
	"BuildOutput" "..\output\"
	"Depots"
	{
		"YOUR_DEPOT_ID"
		{
			"FileMapping"
			{
				"LocalPath" "D:\\zg\\code\\MC\\MC_STEAM\\export\\*"
				"DepotPath" "."
				"recursive" "1"
			}
		}
	}
}
```

### 5.3 上传

```text
steamcmd +login YOUR_STEAM_ACCOUNT +run_app_build ..\scripts\app_build.vdf +quit
```

首次需 Steam Guard。上传后在 Steamworks **Builds** 里设为 **default** 分支。

### 5.4 自测

- Steamworks → **Testing** → 添加自己的 Steam 账号为测试员  
- 或 **Beta** 分支 + 密钥  
- 从 **Steam 客户端库** 安装并启动（不要只双击资源管理器里的 exe，否则 Steam 可能未注入）

---

## 6. 商店页最小清单

| 素材 | 规格提示 |
|------|----------|
| 胶囊图 | 616×353、460×215 等（后台有模板） |
| 头图 / 库页 | 按 Steam 当前规范 |
| 截图 | 至少 5 张，1920×1080 或 1280×720，无 UI 水印为佳 |
| 简短描述 | 1～2 句 |
| 详细描述 | 玩法：格子移动、凿矿、兑换、工坊升级；操作 WASD、B 商店、C 兑换、O 设置 |
| 支持语言 | 至少简体中文；可选英语 |
| 标签 | 独立、休闲、挖矿、像素/2D 等 |

**隐私**：当前仅本地存档，可写「无第三方账号，数据存于本机 user 目录」。

---

## 7. 与本项目文件对照

| 用途 | 路径 |
|------|------|
| Steam 逻辑 | `scripts/steam/steam_manager.gd` |
| 存档 | `scripts/autoload/save_manager.gd` → `user://mc_steam_save.json` |
| 设置 | `scripts/autoload/user_settings.gd` → `user://mc_steam_settings.json` |
| 显示/DPI | `project.godot` → `[display]` |
| 玩法配置 | `scripts/autoload/game_data.gd` |

---

## 8. 可选后续（非首版必须）

| 功能 | 说明 |
|------|------|
| **Steam 云存档** | 将 `SaveManager.SAVE_PATH` 同步到 Steam Remote Storage |
| **Steam Deck** | 已有 `InputPad`；在后台勾选 Deck 兼容并实机测分辨率 |
| **统计** | `report_max_depth` 可同时 `Steam.setStatInt("max_depth", max_depth)` |
| **DRM** | Steam 自带；无需额外加壳 |

---

## 9. 上架前自测 Checklist

- [ ] 干净 Win10/11，**未安装 Godot**，从 Steam 安装可进主菜单并开新局  
- [ ] 存档退出再进、F5 手动存档正常  
- [ ] 成就：深度达到 100 等，Steam 客户端成就页解锁  
- [ ] 无 Steam 环境（或 `steamInit` 失败）游戏不崩溃，仅无 Steam 成就  
- [ ] 商店页 100% → **准备发行** → 审核 → 设定发售日  

---

## 10. 常见问题

**Q：双击 exe 成就没解锁？**  
A：需通过 **Steam 客户端** 启动，且 `steam_appid.txt` 或正式安装包 App ID 正确。

**Q：GodotSteam 与 4.7 不匹配？**  
A：换对应 Release 或略降引擎小版本，与团队统一 Godot 版本。

**Q：上传后玩家看不到更新？**  
A：确认 Build 已设为 **default** 分支并 **Set build live**。

---

文档版本：与 `dev` 分支 MC_STEAM 结构同步；App ID、Depot ID 替换为你的真实数字即可。
