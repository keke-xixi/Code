extends Control
## 主菜单背景：剖面矿层 + 竖井光柱，贴合局内挖矿观感

const CELL := 36.0

var _t: float = 0.0
var _glints: Array[Dictionary] = []


func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_rebuild_glints()
	resized.connect(_rebuild_glints)


func _process(delta: float) -> void:
	_t += delta
	queue_redraw()


func _rebuild_glints() -> void:
	_glints.clear()
	var rng := RandomNumberGenerator.new()
	rng.seed = 0xDEC0DE
	var cols: int = maxi(8, int(size.x / CELL) + 2)
	var rows: int = maxi(8, int(size.y / CELL) + 2)
	for i in 28:
		var gx: int = rng.randi_range(0, cols - 1)
		var gy: int = rng.randi_range(int(rows * 0.22), rows - 1)
		var tid: int = [4, 5, 6, 7, 3][rng.randi_range(0, 4)]
		_glints.append({"x": gx, "y": gy, "tid": tid, "phase": rng.randf() * TAU})


func _layer_color(row_t: float) -> Color:
	# 0=地表土 → 1=深核（深处偏五彩黑）
	if row_t < 0.18:
		return Color("#3d2a1a").lerp(Color("#5a3a22"), row_t / 0.18)
	if row_t < 0.42:
		return Color("#4a4038").lerp(Color("#2a3038"), (row_t - 0.18) / 0.24)
	if row_t < 0.68:
		var t: float = (row_t - 0.42) / 0.26
		return Color("#1e2430").lerp(Color("#161428"), t)
	if row_t < 0.86:
		var t2: float = (row_t - 0.68) / 0.18
		return Color("#12101c").lerp(Color("#0e1020"), t2).lerp(Color("#1a1030"), 0.25)
	return Color("#0a0814").lerp(Color("#0c1022"), 0.4).lerp(Color("#140c1c"), 0.3)


func _draw() -> void:
	var w: float = size.x
	var h: float = size.y
	if w < 8.0 or h < 8.0:
		return

	# 穹顶暗空
	draw_rect(Rect2(0, 0, w, h * 0.16), Color("#07090f"))
	var sky_grad := Color("#0c1420")
	draw_rect(Rect2(0, h * 0.08, w, h * 0.1), Color(sky_grad, 0.55))

	var cols: int = int(ceil(w / CELL)) + 1
	var rows: int = int(ceil(h / CELL)) + 1
	var shaft_cx: float = w * 0.5
	var shaft_half: float = minf(72.0, w * 0.07)

	for gy in rows:
		var row_t: float = float(gy) / float(maxi(rows - 1, 1))
		var base: Color = _layer_color(row_t)
		for gx in cols:
			var px: float = float(gx) * CELL
			var py: float = float(gy) * CELL
			# 竖井挖空带：两侧略亮
			var dx: float = absf(px + CELL * 0.5 - shaft_cx)
			var in_shaft: bool = dx < shaft_half and row_t > 0.12
			var c: Color = base
			if in_shaft:
				c = Color("#0a0c12").lerp(Color("#1a2430"), 0.35)
			else:
				# 格子明暗交错，矿层感
				var checker: float = 0.0 if ((gx + gy) % 2) == 0 else 0.06
				c = c.lightened(checker)
				# 颗粒噪点
				var n: float = fposmod(sin(float(gx * 17 + gy * 31)) * 0.5 + 0.5, 1.0)
				c = c.lerp(c.darkened(0.12), n * 0.35)
			draw_rect(Rect2(px, py, CELL - 1.0, CELL - 1.0), c)
			# 浅描边
			if not in_shaft and row_t > 0.14:
				draw_rect(Rect2(px, py, CELL - 1.0, CELL - 1.0), Color(1, 1, 1, 0.03), false, 1.0)

	# 竖井光柱
	var shaft_top: float = h * 0.14
	var beam := Color("#7ee8ff", 0.07 + 0.03 * sin(_t * 1.4))
	draw_rect(Rect2(shaft_cx - shaft_half, shaft_top, shaft_half * 2.0, h - shaft_top), beam)
	var core := Color("#ffe566", 0.05 + 0.02 * sin(_t * 2.1 + 1.0))
	draw_rect(Rect2(shaft_cx - shaft_half * 0.35, shaft_top, shaft_half * 0.7, h - shaft_top), core)

	# 矿石闪光
	for g in _glints:
		var gx: int = int(g["x"])
		var gy: int = int(g["y"])
		var px: float = float(gx) * CELL + CELL * 0.5
		var py: float = float(gy) * CELL + CELL * 0.5
		if absf(px - shaft_cx) < shaft_half * 0.85:
			continue
		var tid: int = int(g["tid"])
		var meta: Dictionary = GameData.ore_meta(tid)
		var col: Color = meta.get("glow", meta.get("color", Color.WHITE))
		var pulse: float = 0.35 + 0.65 * (0.5 + 0.5 * sin(_t * 2.2 + float(g["phase"])))
		var r: float = 3.5 + pulse * 2.0
		draw_circle(Vector2(px, py), r + 3.0, Color(col, 0.12 * pulse))
		draw_circle(Vector2(px, py), r, Color(col, 0.55 * pulse))

	# 上下暗角
	draw_rect(Rect2(0, 0, w, h * 0.12), Color(0.02, 0.03, 0.05, 0.55))
	draw_rect(Rect2(0, h * 0.78, w, h * 0.22), Color(0.02, 0.02, 0.06, 0.62))
