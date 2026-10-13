extends Control
## 主菜单背景：完整泥土层 / 石层网格，无挖空缺格

const CELL := 40.0

var _t: float = 0.0
var _glints: Array[Dictionary] = []


func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_rebuild()
	resized.connect(_rebuild)


func _process(delta: float) -> void:
	_t += delta
	queue_redraw()


func _rebuild() -> void:
	_glints.clear()
	var rng := RandomNumberGenerator.new()
	rng.seed = 0xDEC0DE
	var cols: int = maxi(8, int(size.x / CELL) + 2)
	var rows: int = maxi(8, int(size.y / CELL) + 2)
	for i in 36:
		var gx: int = rng.randi_range(0, cols - 1)
		var gy: int = rng.randi_range(int(rows * 0.2), rows - 1)
		var tid: int = [1, 2, 3, 4, 5, 6, 7][rng.randi_range(0, 6)]
		_glints.append({"x": gx, "y": gy, "tid": tid, "phase": rng.randf() * TAU})


func _dirt_color(gx: int, gy: int, row_t: float) -> Color:
	var base := Color("#5a3a22").lerp(Color("#3d2818"), clampf(row_t / 0.28, 0.0, 1.0))
	var band: float = 0.04 if (gy % 3) == 0 else 0.0
	base = base.lightened(band)
	var n: float = fposmod(sin(float(gx * 13 + gy * 29)) * 0.5 + 0.5, 1.0)
	base = base.lerp(base.darkened(0.18), n * 0.4)
	if ((gx + gy) % 2) == 0:
		base = base.lightened(0.03)
	return base


func _stone_color(gx: int, gy: int, row_t: float) -> Color:
	var u: float = clampf((row_t - 0.28) / 0.72, 0.0, 1.0)
	var base := Color("#3a3e48").lerp(Color("#1a1e28"), u)
	base = base.lerp(Color("#12101c"), u * 0.35)
	var n: float = fposmod(sin(float(gx * 19 + gy * 7)) * 0.5 + 0.5, 1.0)
	base = base.lerp(base.darkened(0.15), n * 0.45)
	if (gy % 4) == 0:
		base = base.lightened(0.04)
	return base


func _draw() -> void:
	var w: float = size.x
	var h: float = size.y
	if w < 8.0 or h < 8.0:
		return

	var cols: int = int(ceil(w / CELL)) + 1
	var rows: int = int(ceil(h / CELL)) + 1
	var mid: int = cols / 2

	for gy in rows:
		var row_t: float = float(gy) / float(maxi(rows - 1, 1))
		for gx in cols:
			var px: float = float(gx) * CELL
			var py: float = float(gy) * CELL
			var rect := Rect2(px, py, CELL - 1.0, CELL - 1.0)
			var c: Color
			if row_t < 0.28:
				c = _dirt_color(gx, gy, row_t)
			else:
				c = _stone_color(gx, gy, row_t)
			# 中央略压暗，暗示矿脉方向，但仍是完整格子
			if abs(gx - mid) <= 1 and gy >= int(rows * 0.14):
				c = c.darkened(0.08)
			draw_rect(rect, c)
			if row_t < 0.28 and ((gx * 3 + gy * 5) % 11) == 0:
				draw_circle(Vector2(px + CELL * 0.35, py + CELL * 0.4), 1.6, Color("#2a1c10", 0.55))
			elif row_t >= 0.28 and ((gx + gy * 2) % 17) == 0:
				draw_line(
					Vector2(px + 4, py + CELL * 0.4),
					Vector2(px + CELL - 6, py + CELL * 0.55),
					Color(1, 1, 1, 0.04),
					1.0,
					true
				)

	# 中央柔光，不挖格
	var mid_x: float = float(mid) * CELL + CELL * 0.5
	var shaft_top: float = h * 0.14
	var beam_w: float = CELL * 3.2
	draw_rect(
		Rect2(mid_x - beam_w * 0.5, shaft_top, beam_w, h - shaft_top),
		Color("#7ee8ff", 0.04 + 0.015 * sin(_t * 1.3))
	)
	draw_rect(
		Rect2(mid_x - beam_w * 0.18, shaft_top, beam_w * 0.36, h - shaft_top),
		Color("#ffe566", 0.03 + 0.012 * sin(_t * 2.0))
	)

	for g in _glints:
		var gx: int = int(g["x"])
		var gy: int = int(g["y"])
		var px: float = float(gx) * CELL + CELL * 0.5
		var py: float = float(gy) * CELL + CELL * 0.5
		var tid: int = int(g["tid"])
		var meta: Dictionary = GameData.ore_meta(tid)
		var col: Color = meta.get("glow", meta.get("color", Color.WHITE))
		var pulse: float = 0.4 + 0.6 * (0.5 + 0.5 * sin(_t * 2.0 + float(g["phase"])))
		var rr: float = 2.8 + pulse * 1.8
		draw_circle(Vector2(px, py), rr + 2.5, Color(col, 0.1 * pulse))
		draw_circle(Vector2(px, py), rr, Color(col, 0.5 * pulse))

	draw_rect(Rect2(0, 0, w, h * 0.08), Color(0.02, 0.03, 0.05, 0.35))
	draw_rect(Rect2(0, h * 0.85, w, h * 0.15), Color(0.02, 0.02, 0.05, 0.4))
