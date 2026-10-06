# favour 素材镜像（可选）

开发时 Godot 会 **直接读** `D:\zg\design\favour\public\img`（见 autoload `FavourArt`）。

打包导出前可在项目根执行：

```powershell
.\tools\sync_favour_art.ps1
```

会把 `game/money.png`、`game/zs.png` 等与 Vue 里 `/img/game/*` 相同的文件拷到本目录，供 `UiArt` 的 `res://` 回退路径使用。

映射与 Vue 一致参考：

- 金币：`game/money.png`（`moneyCard.vue`）
- 钻石兑换：`game/zs.png`
- 积分：`game/score.png`
- 按钮：`game/start.png`
