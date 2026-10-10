extends CanvasLayer
## 全屏暗幕 + 八点环加载（无卡片边框）

class DotSpinner extends Control:
	const DOT_COUNT: int = 8
	var phase: float = 0.0
	var base_color: Color = Color("#4da3ff")
	var hot_color: Color = Color("#73f7ff")

	func _draw() -> void:
		var sz: Vector2 = size
		if sz.x < 2.0 or sz.y < 2.0:
			sz = custom_minimum_size
		var c: Vector2 = sz * 0.5
		var ring_r: float = minf(sz.x, sz.y) * 0.34
		var dot_r: float = minf(sz.x, sz.y) * 0.075
		var active: float = fposmod(phase, float(DOT_COUNT))
		for i in range(DOT_COUNT):
			var ang: float = -PI * 0.5 + TAU * float(i) / float(DOT_COUNT)
			var p: Vector2 = c + Vector2(cos(ang), sin(ang)) * ring_r
			var dist: float = minf(absf(float(i) - active), float(DOT_COUNT) - absf(float(i) - active))
			var w: float = clampf(1.0 - dist * 0.85, 0.0, 1.0)
			var col: Color = base_color.lerp(hot_color, w)
			col.a = lerpf(0.45, 1.0, w)
			var r: float = lerpf(dot_r * 0.85, dot_r * 1.35, w)
			if w > 0.55:
				draw_circle(p, r * 1.55, Color(hot_color, 0.22 * w))
			draw_circle(p, r, col)


@onready var _root: Control = $Root
@onready var _host: Control = $Root/Center/VBox/SpinnerHost
@onready var _label: Label = $Root/Center/VBox/Label

var _spinner: DotSpinner
var _spin_tween: Tween
var _dots_tween: Tween
var _hiding: bool = false
var _base_msg: String = "加载中"
var _dot_step: int = 0


func _ready() -> void:
	layer = 50
	visible = false
	_install_spinner()
	if _label != null:
		_label.add_theme_color_override("font_color", Color("#9ec9ff"))


func _install_spinner() -> void:
	if _host == null:
		return
	for c in _host.get_children():
		c.queue_free()
	_spinner = DotSpinner.new()
	_spinner.name = "Dots"
	_spinner.custom_minimum_size = Vector2(96, 96)
	_spinner.set_anchors_preset(Control.PRESET_FULL_RECT)
	_spinner.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_host.add_child(_spinner)


func show_loading(msg: String = "加载中") -> void:
	_hiding = false
	_base_msg = msg.trim_suffix("…").trim_suffix("...")
	if _base_msg.is_empty():
		_base_msg = "加载中"
	_dot_step = 0
	if _label != null:
		_label.text = _base_msg
	if _spinner != null:
		_spinner.phase = 0.0
		_spinner.queue_redraw()
	visible = true
	_root.modulate.a = 0.0
	var tw: Tween = create_tween()
	tw.tween_property(_root, "modulate:a", 1.0, 0.12)
	_start_motion()


func hide_loading(_on_done: Callable = Callable()) -> void:
	if _hiding:
		return
	_hiding = true
	_kill_motion()
	var tw: Tween = create_tween()
	tw.tween_property(_root, "modulate:a", 0.0, 0.14)
	tw.tween_callback(func() -> void:
		visible = false
		_hiding = false
		_root.modulate.a = 1.0
		if _on_done.is_valid():
			_on_done.call()
	)


func _start_motion() -> void:
	_kill_motion()
	if _spinner != null:
		_spin_tween = create_tween().set_loops()
		_spin_tween.tween_method(_set_phase, 0.0, float(DotSpinner.DOT_COUNT), 0.85).set_trans(Tween.TRANS_LINEAR)
	_dots_tween = create_tween().set_loops()
	_dots_tween.tween_callback(_tick_dots)
	_dots_tween.tween_interval(0.4)


func _set_phase(v: float) -> void:
	if _spinner == null:
		return
	_spinner.phase = v
	_spinner.queue_redraw()


func _tick_dots() -> void:
	if _label == null or _hiding:
		return
	_dot_step = (_dot_step + 1) % 4
	var dots: String = ""
	for _i in range(_dot_step):
		dots += "."
	_label.text = "%s%s" % [_base_msg, dots]


func _kill_motion() -> void:
	for tw in [_spin_tween, _dots_tween]:
		if tw != null and tw.is_valid():
			tw.kill()
	_spin_tween = null
	_dots_tween = null
