extends PanelContainer
## 主菜单光晕：竖向胶囊柔光，不再是方框弹窗

var _t: float = 0.0

const RIM_COLORS: Array[Color] = [
	Color("#e8a825"),
	Color("#ffe08a"),
	Color("#6ec8ff"),
	Color("#8b7cf8"),
]


func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_STOP
	var pad := StyleBoxEmpty.new()
	pad.content_margin_left = 4
	pad.content_margin_right = 4
	pad.content_margin_top = 4
	pad.content_margin_bottom = 4
	add_theme_stylebox_override("panel", pad)
	set_process(true)


func _process(delta: float) -> void:
	_t += delta
	queue_redraw()


func _draw() -> void:
	var r := Rect2(Vector2.ZERO, size)
	if r.size.x < 8.0 or r.size.y < 8.0:
		return
	# 竖向胶囊：左右全圆角
	var rad: float = minf(r.size.x * 0.5, 48.0)

	# 外扩柔光层
	_draw_capsule(r.grow(18.0), Color("#8b7cf8", 0.1), rad + 10.0)
	_draw_capsule(r.grow(10.0), Color("#e8a825", 0.08), rad + 6.0)
	_draw_capsule(r.grow(2.0), Color("#07090f", 0.55), rad + 1.0)

	# 中心更亮一点的核
	var core := r.grow_individual(-r.size.x * 0.12, -r.size.y * 0.06, -r.size.x * 0.12, -r.size.y * 0.06)
	_draw_capsule(core, Color("#0c121c", 0.35), minf(core.size.x * 0.5, 36.0))

	# 漂浮彩点
	for i in 6:
		var u: float = float(i) / 6.0
		var col: Color = RIM_COLORS[i % RIM_COLORS.size()]
		var px: float = r.position.x + r.size.x * (0.22 + 0.56 * u)
		var py: float = r.position.y + r.size.y * (0.12 + 0.12 * sin(_t * 1.1 + u * 5.0) + u * 0.7)
		var pulse: float = 0.4 + 0.6 * sin(_t * 2.0 + float(i))
		draw_circle(Vector2(px, py), 2.0 + pulse, Color(col, 0.22 * pulse))


func _draw_capsule(rect: Rect2, col: Color, rad: float) -> void:
	var sb := StyleBoxFlat.new()
	sb.bg_color = col
	var rr: int = int(rad)
	sb.corner_radius_top_left = rr
	sb.corner_radius_top_right = rr
	sb.corner_radius_bottom_left = rr
	sb.corner_radius_bottom_right = rr
	sb.draw(get_canvas_item(), rect)
