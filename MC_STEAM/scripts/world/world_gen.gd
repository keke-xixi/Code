class_name WorldGen
extends RefCounted


static func get_range(y: int) -> Dictionary:
	for row in GameData.DEPTH_RANGES:
		var band: Dictionary = row
		if y >= int(band.get("min", 0)) and y <= int(band.get("max", 0)):
			return band
	return {"min": 0, "max": 0, "title": "地表", "leave": 1, "rate": [1.0]}


static func generate_ore_type(y: int) -> int:
	var range_row: Dictionary = get_range(y)
	var rates: Array = range_row.get("rate", [1.0])
	var leave: int = int(range_row.get("leave", 1))
	var roll: float = randf()
	var cumulative: float = 0.0
	for level in range(1, leave + 1):
		var p: float = float(rates[level - 1]) if level - 1 < rates.size() else 0.0
		cumulative += p
		if roll < cumulative:
			return level
	return 1


static func create_cell(ore_type: int) -> Dictionary:
	var meta: Dictionary = GameData.ore_meta(ore_type)
	return {
		"type": ore_type,
		"broken": false,
		"taken": false,
		"price": int(meta.get("price", 0)),
	}


static func cell_key(x: int, y: int) -> String:
	return "%d,%d" % [x, y]


static func parse_key(key: String) -> Vector2i:
	var parts: PackedStringArray = key.split(",")
	return Vector2i(int(parts[0]), int(parts[1]))


static func fill_bounds(bounds: Dictionary, existing: Dictionary) -> Dictionary:
	var ores: Dictionary = existing.duplicate(true)
	var left: int = int(bounds.get("left", 0))
	var right: int = int(bounds.get("right", 0))
	var top: int = int(bounds.get("top", 0))
	var bottom: int = int(bounds.get("bottom", 0))
	for x in range(left, right):
		for y in range(top, bottom):
			var key := cell_key(x, y)
			if not ores.has(key):
				ores[key] = create_cell(generate_ore_type(y))
	return ores
