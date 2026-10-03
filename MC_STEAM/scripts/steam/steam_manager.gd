extends Node
## Steamworks 占位：深度里程碑 → 成就 ID（接入 GodotSteam 后 unlock）

var steam_enabled := false

const DEPTH_ACHIEVEMENTS: Dictionary = {
	100: "DEPTH_100",
	500: "DEPTH_500",
	1000: "DEPTH_1000",
	2000: "DEPTH_2000",
	5000: "DEPTH_5000",
	7000: "DEPTH_7000",
	9000: "DEPTH_9000",
}

var _unlocked: Dictionary = {}


func _ready() -> void:
	_load_local_unlocks()
	if not GameEvents.depth_changed.is_connected(_on_depth_changed):
		GameEvents.depth_changed.connect(_on_depth_changed)
	# if Engine.has_singleton("Steam"):
	#     steam_enabled = Steam.steamInit()


func _on_depth_changed(_current: int, max_depth: int) -> void:
	report_max_depth(max_depth)


func report_max_depth(max_depth: int) -> void:
	for threshold in DEPTH_ACHIEVEMENTS.keys():
		if max_depth < int(threshold):
			continue
		var ach_id: String = str(DEPTH_ACHIEVEMENTS[threshold])
		if bool(_unlocked.get(ach_id, false)):
			continue
		_unlocked[ach_id] = true
		unlock_achievement(ach_id)
		GameEvents.toast.emit("里程碑 %d" % int(threshold), "ok")
		_save_local_unlocks()


func unlock_achievement(id: String) -> void:
	if not steam_enabled:
		return
	pass


func _load_local_unlocks() -> void:
	var path := "user://mc_steam_steam_achievements.json"
	if not FileAccess.file_exists(path):
		return
	var parsed: Variant = JSON.parse_string(FileAccess.get_file_as_string(path))
	if parsed is Dictionary:
		_unlocked = parsed


func _save_local_unlocks() -> void:
	var f := FileAccess.open("user://mc_steam_steam_achievements.json", FileAccess.WRITE)
	if f == null:
		return
	f.store_string(JSON.stringify(_unlocked))
