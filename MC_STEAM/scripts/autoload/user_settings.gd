extends Node
## 玩家可改选项（写入 user://mc_steam_settings.json）

const PATH := "user://mc_steam_settings.json"

var show_ore_preview: bool = false
var instant_mine_on_break: bool = true
var sfx_enabled: bool = true
var music_enabled: bool = true
var screen_shake: bool = true
var tutorial_dismissed: bool = false


func _ready() -> void:
	load_settings()


func load_settings() -> void:
	if not FileAccess.file_exists(PATH):
		return
	var f := FileAccess.open(PATH, FileAccess.READ)
	if f == null:
		return
	var parsed: Variant = JSON.parse_string(f.get_as_text())
	f.close()
	if not parsed is Dictionary:
		return
	var d: Dictionary = parsed
	show_ore_preview = bool(d.get("show_ore_preview", false))
	instant_mine_on_break = bool(d.get("instant_mine_on_break", true))
	sfx_enabled = bool(d.get("sfx_enabled", true))
	music_enabled = bool(d.get("music_enabled", true))
	screen_shake = bool(d.get("screen_shake", true))
	tutorial_dismissed = bool(d.get("tutorial_dismissed", false))


func save_settings() -> void:
	var data: Dictionary = {
		"show_ore_preview": show_ore_preview,
		"instant_mine_on_break": instant_mine_on_break,
		"sfx_enabled": sfx_enabled,
		"music_enabled": music_enabled,
		"screen_shake": screen_shake,
		"tutorial_dismissed": tutorial_dismissed,
	}
	var f := FileAccess.open(PATH, FileAccess.WRITE)
	if f == null:
		return
	f.store_string(JSON.stringify(data))
	f.close()


func set_show_ore_preview(v: bool) -> void:
	show_ore_preview = v
	save_settings()
	GameEvents.settings_changed.emit()


func set_instant_mine(v: bool) -> void:
	instant_mine_on_break = v
	save_settings()
	GameEvents.settings_changed.emit()


func set_sfx_enabled(v: bool) -> void:
	sfx_enabled = v
	save_settings()
	GameEvents.settings_changed.emit()


func set_music_enabled(v: bool) -> void:
	music_enabled = v
	save_settings()
	GameEvents.settings_changed.emit()


func set_screen_shake(v: bool) -> void:
	screen_shake = v
	save_settings()
	GameEvents.settings_changed.emit()


func dismiss_tutorial() -> void:
	tutorial_dismissed = true
	save_settings()
