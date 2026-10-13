extends CanvasLayer
## 矿井标题屏：玻璃五彩按钮 + 矿石绕整块菜单公转

@onready var _panel: PanelContainer = $Root/Center/Panel
@onready var _mascot_host: CenterContainer = $Root/Center/Panel/Margin/VBox/MascotHost
@onready var _title_block: VBoxContainer = $Root/Center/Panel/Margin/VBox/TitleBlock
@onready var _title_cn: Label = $Root/Center/Panel/Margin/VBox/TitleBlock/TitleCn
@onready var _title_sub: Label = $Root/Center/Panel/Margin/VBox/TitleBlock/TitleSub
@onready var _ore_orbit: Control = $Root/Center/Panel/OreOrbit

var _sub_tween: Tween
var _sub_shown: bool = false
## 上线前改 false 即可隐藏右下角测试入口
const SHOW_DEV_TEST := true

@onready var _btn_continue: Button = $Root/Center/Panel/Margin/VBox/Continue
@onready var _btn_new: Button = $Root/Center/Panel/Margin/VBox/HeroStage/NewGame
@onready var _btn_test: Button = $Root/Center/Panel/Margin/VBox/TestAccount
@onready var _dev_gap: Control = $Root/Center/Panel/Margin/VBox/DevGap
@onready var _btn_quit: Button = $Root/Center/Panel/Margin/VBox/Quit


## 标题吉祥物：沿用局内矿工剪影，略放大 + 拾光柔光
class MinerMascot extends Control:
	const INK := Color("#1a2332")
	const SUIT := Color("#3d5a80")
	const SUIT_L := Color("#5c7a9e")
	const HELMET := Color("#f0a020")
	const VISOR := Color("#7ee8ff")
	const HANDLE := Color("#6b4f3a")
	const PICK_HEAD := Color("#8a9098")
	const PICK_EDGE := Color("#c8cdd4")

	var _t: float = 0.0

	func _ready() -> void:
		custom_minimum_size = Vector2(128, 140)
		set_process(true)

	func _process(delta: float) -> void:
		_t += delta
		queue_redraw()

	func _draw() -> void:
		var bob: float = sin(_t * 2.2) * 3.5
		var origin := Vector2(size.x * 0.5, size.y * 0.62 + bob)
		var s: float = 1.85
		# 拾光光晕
		var pulse: float = 0.5 + 0.5 * sin(_t * 1.6)
		draw_circle(origin + Vector2(0, 8.0 * s), 28.0 * s, Color("#7ec8ff", 0.07 + 0.04 * pulse))
		draw_circle(origin + Vector2(0, 2.0 * s), 18.0 * s, Color("#c9a0ff", 0.05 + 0.03 * pulse))
		# 阴影
		draw_circle(origin + Vector2(0, 16.0 * s), 11.0 * s, Color(0, 0, 0, 0.22))
		# 腿
		draw_line(origin + Vector2(-5.5 * s, 11.0 * s), origin + Vector2(-6.5 * s, 20.0 * s), INK, 4.2 * s, true)
		draw_line(origin + Vector2(5.5 * s, 11.0 * s), origin + Vector2(6.5 * s, 20.0 * s), INK, 4.2 * s, true)
		# 身体（描边 + 填充）
		draw_rect(Rect2(origin + Vector2(-10.0 * s, -2.0 * s), Vector2(20.0 * s, 18.0 * s)), INK)
		draw_rect(Rect2(origin + Vector2(-8.5 * s, -1.0 * s), Vector2(17.0 * s, 15.5 * s)), SUIT)
		draw_rect(Rect2(origin + Vector2(-6.5 * s, 3.0 * s), Vector2(13.0 * s, 8.5 * s)), SUIT_L)
		# 头盔
		var head := origin + Vector2(0, -11.0 * s)
		draw_circle(head, 12.0 * s, INK)
		draw_circle(head, 10.8 * s, HELMET)
		draw_arc(head + Vector2(0, -1.0 * s), 8.5 * s, 0.0, PI, 14, VISOR, 2.6 * s, true)
		draw_rect(Rect2(head + Vector2(-11.0 * s, -5.0 * s), Vector2(22.0 * s, 4.5 * s)), HELMET)
		# 帽灯微光
		var lamp := head + Vector2(0, -9.5 * s)
		draw_circle(lamp, 3.2 * s, Color("#ffe566", 0.85 + 0.15 * pulse))
		draw_circle(lamp, 6.0 * s, Color("#7ee8ff", 0.12 + 0.08 * pulse))
		# 闲置挥镐（朝右下）
		var swing: float = 0.5 + 0.5 * sin(_t * 2.8)
		var face_ang: float = PI * 0.28
		var arm_ang: float = face_ang + lerpf(-1.15, 0.55, swing)
		var grip: Vector2 = origin + Vector2(-2.0 * s, 2.0 * s)
		var tip: Vector2 = grip + Vector2(cos(arm_ang), sin(arm_ang)) * (22.0 * s)
		draw_line(grip, tip, INK, 5.2 * s, true)
		draw_line(grip, tip, HANDLE, 3.6 * s, true)
		var head_ang: float = arm_ang + PI * 0.5
		var head_w: float = 12.0 * s
		var head_c: Vector2 = tip + Vector2(cos(arm_ang), sin(arm_ang)) * (4.5 * s)
		var p1: Vector2 = head_c + Vector2(cos(head_ang), sin(head_ang)) * head_w * 0.5
		var p2: Vector2 = head_c - Vector2(cos(head_ang), sin(head_ang)) * head_w * 0.5
		var p3: Vector2 = head_c + Vector2(cos(arm_ang), sin(arm_ang)) * (7.5 * s)
		var pts := PackedVector2Array([p1, p2, p3])
		draw_colored_polygon(pts, PICK_HEAD)
		draw_polyline(pts, PICK_EDGE, 1.8 * s, true)
		if swing > 0.72:
			var sa: float = (swing - 0.72) / 0.28
			draw_circle(p3, (3.0 + sa * 5.0) * s, Color(1, 0.9, 0.55, 0.35 * sa))


## 带彩色光晕的矿石
class BrightOre extends Control:
	var type_id: int = 4
	var _pulse: float = 0.0

	func _init(tid: int = 4) -> void:
		type_id = tid
		custom_minimum_size = Vector2(44, 44)
		mouse_filter = Control.MOUSE_FILTER_IGNORE

	func _ready() -> void:
		var icon := OreBagIcon.new(type_id, 36.0)
		icon.position = Vector2(4, 4)
		icon.mouse_filter = Control.MOUSE_FILTER_IGNORE
		icon.modulate = Color(1.35, 1.35, 1.3, 1.0)
		add_child(icon)
		set_process(true)

	func _process(delta: float) -> void:
		_pulse += delta
		queue_redraw()

	func _draw() -> void:
		var meta: Dictionary = GameData.ore_meta(type_id)
		var col: Color = UiStyle.trade_slot_accent(
			meta.get("color", UiStyle.GOLD),
			meta.get("glow", Color(0, 0, 0, 0))
		)
		var c := size * 0.5
		var a: float = 0.45 + 0.25 * sin(_pulse * 2.8)
		# 外层柔光 + 内层亮核，偏虚幻透明
		draw_circle(c, 24.0, Color(col.lightened(0.35), a * 0.22))
		draw_circle(c, 17.0, Color(col, a * 0.45))
		draw_circle(c, 10.0, Color(col.lightened(0.4), a * 0.7))
		var rim_h: float = fmod(_pulse * 0.35 + float(type_id) * 0.12, 1.0)
		var rim := Color.from_hsv(rim_h, 0.45, 1.0, a * 0.55)
		draw_arc(c, 18.0, 0.0, TAU, 28, rim, 1.6, true)


## 矿石沿正圆绕整块菜单公转
class OreOrbitRing extends Control:
	var _t: float = 0.0
	var _icons: Array[Control] = []

	func _ready() -> void:
		mouse_filter = Control.MOUSE_FILTER_IGNORE
		set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
		set_process(true)
		for tid in [4, 5, 6, 7, 8]:
			var icon := BrightOre.new(tid)
			add_child(icon)
			_icons.append(icon)

	func _process(delta: float) -> void:
		_t += delta
		if _icons.is_empty() or size.x < 8.0:
			return
		var c := size * 0.5
		# 横纵同半径 → 正圆；取较长边，保证包住整块菜单
		var r: float = maxf(size.x, size.y) * 0.5
		var n: int = _icons.size()
		for i in n:
			var ang: float = _t * 0.48 + float(i) * TAU / float(n)
			var p: Vector2 = c + Vector2(cos(ang), sin(ang)) * r
			var ic: Control = _icons[i]
			ic.pivot_offset = ic.size * 0.5
			ic.position = p - ic.size * 0.5
			var depth: float = 0.9 + 0.18 * (0.5 + 0.5 * sin(ang))
			ic.scale = Vector2(depth, depth)
			# 靠后略淡，靠前更亮
			ic.modulate.a = 0.72 + 0.28 * (0.5 + 0.5 * sin(ang))


## 主按钮：胶囊极光 —— 透亮、轻边、彩色流光
class DigPlaqueButton extends Button:
	var _t: float = 0.0

	func _ready() -> void:
		flat = true
		focus_mode = Control.FOCUS_NONE
		var empty := StyleBoxEmpty.new()
		empty.content_margin_left = 22
		empty.content_margin_right = 22
		empty.content_margin_top = 12
		empty.content_margin_bottom = 12
		add_theme_stylebox_override("normal", empty)
		add_theme_stylebox_override("hover", empty)
		add_theme_stylebox_override("pressed", empty)
		add_theme_stylebox_override("focus", empty)
		add_theme_color_override("font_color", Color(0, 0, 0, 0))
		add_theme_color_override("font_hover_color", Color(0, 0, 0, 0))
		add_theme_color_override("font_pressed_color", Color(0, 0, 0, 0))
		add_theme_font_size_override("font_size", 22)
		resized.connect(queue_redraw)
		mouse_entered.connect(queue_redraw)
		mouse_exited.connect(queue_redraw)
		button_down.connect(queue_redraw)
		button_up.connect(queue_redraw)
		set_process(true)

	func _process(delta: float) -> void:
		_t += delta
		queue_redraw()

	func _capsule(rect: Rect2, col: Color) -> void:
		var rad: float = minf(rect.size.y * 0.5, rect.size.x * 0.5)
		var sb := StyleBoxFlat.new()
		sb.bg_color = col
		sb.corner_radius_top_left = int(rad)
		sb.corner_radius_top_right = int(rad)
		sb.corner_radius_bottom_left = int(rad)
		sb.corner_radius_bottom_right = int(rad)
		sb.draw(get_canvas_item(), rect)

	func _draw() -> void:
		var r := Rect2(Vector2.ZERO, size)
		var hover: bool = is_hovered()
		var down: bool = is_pressed()
		var pulse: float = 0.5 + 0.5 * sin(_t * 2.4)
		var rad: float = minf(r.size.y * 0.5, r.size.x * 0.5)

		# 背后极光晕（青→品红→淡紫）
		var glow_a: float = (0.22 if hover else 0.14) + 0.06 * pulse
		for i in 4:
			var h: float = fmod(_t * 0.18 + float(i) * 0.22, 1.0)
			_capsule(r.grow(10.0 - float(i) * 2.2), Color.from_hsv(h, 0.5, 1.0, glow_a * (1.0 - float(i) * 0.18)))

		# 透亮芯：很轻的冷色玻璃，按下略深
		var fill_a: float = 0.38 if down else (0.26 if not hover else 0.34)
		_capsule(r, Color(0.1, 0.16, 0.28, fill_a))

		# 上半高光条（玻璃反光）
		var hl := StyleBoxFlat.new()
		hl.bg_color = Color(1, 1, 1, 0.16 if hover else 0.1)
		hl.corner_radius_top_left = int(rad)
		hl.corner_radius_top_right = int(rad)
		hl.corner_radius_bottom_left = 4
		hl.corner_radius_bottom_right = 4
		hl.draw(get_canvas_item(), Rect2(r.position.x + 8, r.position.y + 3, r.size.x - 16, r.size.y * 0.42))

		# 细流光描边
		var edge_h: float = fmod(_t * 0.2, 1.0)
		var edge := StyleBoxFlat.new()
		edge.bg_color = Color(0, 0, 0, 0)
		edge.border_width_left = 2
		edge.border_width_top = 2
		edge.border_width_right = 2
		edge.border_width_bottom = 2
		edge.border_color = Color.from_hsv(edge_h, 0.35, 1.0, 0.9 if hover else 0.7)
		edge.corner_radius_top_left = int(rad)
		edge.corner_radius_top_right = int(rad)
		edge.corner_radius_bottom_left = int(rad)
		edge.corner_radius_bottom_right = int(rad)
		edge.draw(get_canvas_item(), r)

		# 内侧淡彩弧线
		var cx := r.get_center()
		draw_arc(cx, minf(r.size.x, r.size.y) * 0.38, -2.2, -0.6, 16, Color.from_hsv(fmod(edge_h + 0.33, 1.0), 0.4, 1.0, 0.35), 1.4, true)

		# 左侧小星芒代替镐
		var star := Vector2(r.position.x + 34, cx.y)
		var sc := Color.from_hsv(fmod(edge_h + 0.1, 1.0), 0.3, 1.0, 0.95)
		draw_line(star + Vector2(-7, 0), star + Vector2(7, 0), sc, 2.0, true)
		draw_line(star + Vector2(0, -7), star + Vector2(0, 7), sc, 2.0, true)
		draw_line(star + Vector2(-5, -5), star + Vector2(5, 5), Color(sc, 0.55), 1.4, true)
		draw_line(star + Vector2(-5, 5), star + Vector2(5, -5), Color(sc, 0.55), 1.4, true)

		var font: Font = get_theme_default_font()
		var label := text if not text.is_empty() else "开始挖掘"
		var fs: int = 19
		var sz: Vector2 = font.get_string_size(label, HORIZONTAL_ALIGNMENT_LEFT, -1, fs)
		var tp := Vector2(cx.x - sz.x * 0.5 + 8.0, cx.y + fs * 0.35)
		draw_string_outline(font, tp, label, HORIZONTAL_ALIGNMENT_LEFT, -1, fs, 4, Color("#061018", 0.9))
		draw_string(font, tp, label, HORIZONTAL_ALIGNMENT_LEFT, -1, fs, Color("#f5faff"))


func _ready() -> void:
	var hud: CanvasLayer = get_parent().get_node_or_null("HUD") as CanvasLayer
	if hud != null:
		hud.visible = false
	_setup_brand()
	_setup_mascot()
	_setup_ore_orbit()
	_setup_buttons()
	_play_enter_motion()


func _setup_mascot() -> void:
	if _mascot_host == null:
		return
	for c in _mascot_host.get_children():
		c.queue_free()
	_mascot_host.add_child(MinerMascot.new())


func _setup_brand() -> void:
	if _title_cn != null:
		_title_cn.text = "拾光"
		_title_cn.add_theme_color_override("font_color", Color("#e8f4ff"))
		_title_cn.add_theme_font_size_override("font_size", 54)
		_title_cn.add_theme_color_override("font_shadow_color", Color("#5ec8ff", 0.35))
		_title_cn.add_theme_constant_override("shadow_offset_x", 0)
		_title_cn.add_theme_constant_override("shadow_offset_y", 3)
		_title_cn.add_theme_color_override("font_outline_color", Color("#0a1220", 0.92))
		_title_cn.add_theme_constant_override("outline_size", 7)
	if _title_sub != null:
		_title_sub.text = "深岩之下 · 拾取星芒"
		_title_sub.add_theme_color_override("font_color", Color("#a8c4e0", 0.9))
		_title_sub.add_theme_font_size_override("font_size", 15)
		_title_sub.add_theme_color_override("font_outline_color", Color("#061018", 0.7))
		_title_sub.add_theme_constant_override("outline_size", 2)
		# 默认隐藏，悬停标题区再惊喜亮出
		_title_sub.modulate.a = 0.0
		_title_sub.scale = Vector2(0.72, 0.72)
		call_deferred("_reset_sub_pivot")
	if _title_block != null:
		_title_block.mouse_filter = Control.MOUSE_FILTER_STOP
		_title_block.mouse_entered.connect(_on_title_hover_enter)
		_title_block.mouse_exited.connect(_on_title_hover_exit)


func _reset_sub_pivot() -> void:
	if _title_sub == null:
		return
	_title_sub.pivot_offset = _title_sub.size * 0.5


func _on_title_hover_enter() -> void:
	_reveal_subtitle(true)


func _on_title_hover_exit() -> void:
	_reveal_subtitle(false)


func _reveal_subtitle(show: bool) -> void:
	if _title_sub == null or _sub_shown == show:
		return
	_sub_shown = show
	if _sub_tween != null:
		_sub_tween.kill()
	_sub_tween = create_tween()
	_reset_sub_pivot()
	if show:
		# 淡入 + 回弹放大 + 一瞬彩色闪
		_title_sub.add_theme_color_override("font_color", Color("#9ef0ff"))
		_sub_tween.set_parallel(true)
		_sub_tween.tween_property(_title_sub, "modulate:a", 1.0, 0.22)
		_sub_tween.tween_property(_title_sub, "scale", Vector2.ONE, 0.32).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
		_sub_tween.set_parallel(false)
		_sub_tween.tween_callback(func() -> void:
			if _title_sub != null:
				_title_sub.add_theme_color_override("font_color", Color("#c8ddf0"))
		)
		_sub_tween.tween_interval(0.12)
		_sub_tween.tween_callback(func() -> void:
			if _title_sub != null:
				_title_sub.add_theme_color_override("font_color", Color("#a8c4e0", 0.95))
		)
	else:
		_sub_tween.set_parallel(true)
		_sub_tween.tween_property(_title_sub, "modulate:a", 0.0, 0.18)
		_sub_tween.tween_property(_title_sub, "scale", Vector2(0.72, 0.72), 0.18)


func _setup_ore_orbit() -> void:
	if _ore_orbit == null:
		return
	for c in _ore_orbit.get_children():
		c.queue_free()
	var ring := OreOrbitRing.new()
	ring.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_ore_orbit.add_child(ring)


func _setup_buttons() -> void:
	_replace_with_plaque(_btn_new)
	if _btn_new != null:
		_btn_new.custom_minimum_size = Vector2(256, 52)

	# 主列：开始 → 继续 → 测试(可关) → 退出；关测试时整行折叠，不影响布局
	_style_chip(_btn_continue, Color("#6ec8ff"))
	if _btn_continue != null:
		_btn_continue.text = "继续游戏"
		_btn_continue.custom_minimum_size = Vector2(220, 40)

	if _btn_test != null:
		_btn_test.visible = SHOW_DEV_TEST
		_btn_test.text = "测试账户"
		_btn_test.custom_minimum_size = Vector2(96, 32)
		_style_chip(_btn_test, Color("#c59bff"))
	if _dev_gap != null:
		_dev_gap.visible = SHOW_DEV_TEST

	_style_quit_link(_btn_quit)

	for btn in [_btn_continue, _btn_new, _btn_quit]:
		if btn != null:
			btn.focus_mode = Control.FOCUS_NONE
			_wire_btn_hover(btn, btn == _btn_new)
	if _btn_test != null and SHOW_DEV_TEST:
		_btn_test.focus_mode = Control.FOCUS_NONE
		_wire_btn_hover(_btn_test, false)


func _replace_with_plaque(old: Button) -> void:
	if old == null:
		return
	var parent: Node = old.get_parent()
	var plaque := DigPlaqueButton.new()
	plaque.name = "NewGame"
	plaque.text = "开始挖掘"
	plaque.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	plaque.offset_left = -128.0
	plaque.offset_top = -26.0
	plaque.offset_right = 128.0
	plaque.offset_bottom = 26.0
	var idx: int = old.get_index()
	old.name = "NewGame_old"
	parent.add_child(plaque)
	parent.move_child(plaque, idx)
	old.queue_free()
	_btn_new = plaque


func _style_chip(btn: Button, accent: Color) -> void:
	if btn == null:
		return
	var n := StyleBoxFlat.new()
	# 次级胶囊：比主按钮略窄、略淡
	n.bg_color = Color(0.08, 0.12, 0.22, 0.36)
	n.border_width_left = 1
	n.border_width_top = 1
	n.border_width_right = 1
	n.border_width_bottom = 1
	n.border_color = Color(accent, 0.7)
	n.corner_radius_top_left = 20
	n.corner_radius_top_right = 20
	n.corner_radius_bottom_left = 20
	n.corner_radius_bottom_right = 20
	n.content_margin_left = 14
	n.content_margin_right = 14
	n.content_margin_top = 8
	n.content_margin_bottom = 8
	n.shadow_color = Color(accent, 0.22)
	n.shadow_size = 6
	var h := n.duplicate() as StyleBoxFlat
	h.bg_color = Color(accent.r, accent.g, accent.b, 0.2)
	h.border_color = Color(accent.lightened(0.3), 1.0)
	h.shadow_color = Color(accent, 0.4)
	h.shadow_size = 10
	btn.add_theme_stylebox_override("normal", n)
	btn.add_theme_stylebox_override("hover", h)
	btn.add_theme_stylebox_override("pressed", h)
	btn.add_theme_color_override("font_color", Color("#f4f8ff"))
	btn.add_theme_color_override("font_hover_color", Color.WHITE)
	btn.add_theme_font_size_override("font_size", 15)
	btn.add_theme_color_override("font_outline_color", Color("#061018", 0.85))
	btn.add_theme_constant_override("outline_size", 3)


func _style_quit_link(btn: Button) -> void:
	if btn == null:
		return
	btn.flat = true
	var empty := StyleBoxEmpty.new()
	empty.content_margin_left = 10
	empty.content_margin_right = 10
	empty.content_margin_top = 4
	empty.content_margin_bottom = 4
	btn.add_theme_stylebox_override("normal", empty)
	btn.add_theme_stylebox_override("hover", empty)
	btn.add_theme_stylebox_override("pressed", empty)
	btn.add_theme_stylebox_override("focus", empty)
	btn.add_theme_color_override("font_color", Color("#9eb0c4", 0.75))
	btn.add_theme_color_override("font_hover_color", Color("#dce8f5"))
	btn.add_theme_color_override("font_pressed_color", Color("#7a8ea8"))
	btn.add_theme_font_size_override("font_size", 14)
	btn.add_theme_color_override("font_outline_color", Color("#061018", 0.55))
	btn.add_theme_constant_override("outline_size", 2)
	btn.text = "退出"


func _style_dev_chip(btn: Button) -> void:
	if btn == null:
		return
	var n := StyleBoxFlat.new()
	n.bg_color = Color(0.06, 0.08, 0.12, 0.45)
	n.border_width_left = 1
	n.border_width_top = 1
	n.border_width_right = 1
	n.border_width_bottom = 1
	n.border_color = Color("#8a7ab0", 0.45)
	n.corner_radius_top_left = 8
	n.corner_radius_top_right = 8
	n.corner_radius_bottom_left = 8
	n.corner_radius_bottom_right = 8
	n.content_margin_left = 10
	n.content_margin_right = 10
	n.content_margin_top = 4
	n.content_margin_bottom = 4
	btn.add_theme_stylebox_override("normal", n)
	btn.add_theme_stylebox_override("hover", n)
	btn.add_theme_stylebox_override("pressed", n)
	btn.add_theme_color_override("font_color", Color("#b0a8c8", 0.7))
	btn.add_theme_color_override("font_hover_color", Color("#ddd5f0"))
	btn.add_theme_font_size_override("font_size", 12)
	btn.add_theme_color_override("font_outline_color", Color("#061018", 0.6))
	btn.add_theme_constant_override("outline_size", 2)


func _wire_btn_hover(btn: Button, punchy: bool) -> void:
	var s: float = 1.04 if punchy else 1.05
	btn.mouse_entered.connect(func() -> void:
		var tw: Tween = btn.create_tween()
		tw.tween_property(btn, "scale", Vector2(s, s), 0.08)
	)
	btn.mouse_exited.connect(func() -> void:
		var tw: Tween = btn.create_tween()
		tw.tween_property(btn, "scale", Vector2.ONE, 0.1)
	)
	btn.resized.connect(func() -> void:
		btn.pivot_offset = btn.size * 0.5
	)
	btn.pivot_offset = btn.size * 0.5


func _play_enter_motion() -> void:
	if _panel == null:
		return
	_panel.modulate.a = 0.0
	var tw := create_tween()
	tw.tween_property(_panel, "modulate:a", 1.0, 0.35)
	if _btn_new != null:
		_btn_new.scale = Vector2(0.9, 0.9)
		call_deferred("_reset_new_pivot")
		var ntw := create_tween()
		ntw.tween_interval(0.1)
		ntw.tween_property(_btn_new, "scale", Vector2.ONE, 0.34).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)


func _reset_new_pivot() -> void:
	if _btn_new != null:
		_btn_new.pivot_offset = _btn_new.size * 0.5


func show_continue(enabled: bool) -> void:
	if _btn_continue != null:
		_btn_continue.visible = enabled
