extends Node

const SAVE_PATH := "user://mc_steam_save.json"


func has_save() -> bool:
	return FileAccess.file_exists(SAVE_PATH)


func load_session() -> Dictionary:
	if not has_save():
		return {}
	var f := FileAccess.open(SAVE_PATH, FileAccess.READ)
	if f == null:
		return {}
	var text := f.get_as_text()
	f.close()
	var parsed: Variant = JSON.parse_string(text)
	if not parsed is Dictionary:
		return {}
	return parsed as Dictionary


func save_session(data: Dictionary) -> void:
	var f := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if f == null:
		push_warning("Save failed: cannot open %s" % SAVE_PATH)
		return
	f.store_string(JSON.stringify(data))
	f.close()


func delete_save() -> void:
	if has_save():
		DirAccess.remove_absolute(SAVE_PATH)
