extends Node
## Steamworks 占位：接入 GodotSteam 或 steam-gdplugin 后在此初始化成就/云存档。
## 开发阶段可忽略；导出 Steam 前再实现。

var steam_enabled := false


func _ready() -> void:
	# if Engine.has_singleton("Steam"):
	#     steam_enabled = Steam.steamInit()
	pass


func unlock_achievement(_id: String) -> void:
	if not steam_enabled:
		return
	pass
