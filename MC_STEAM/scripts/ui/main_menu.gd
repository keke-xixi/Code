extends CanvasLayer

@onready var _panel: PanelContainer = $Root/Center/Panel
@onready var _title_cn: Label = $Root/Center/Panel/Margin/VBox/Brand/TitleCn
@onready var _icon_host: CenterContainer = $Root/Center/Panel/Margin/VBox/Brand/BrandIconHost
@onready var _ore_row: HBoxContainer = $Root/Center/Panel/Margin/VBox/OreRow
@onready var _btn_continue: Button = $Root/Center/Panel/Margin/VBox/Continue
@onready var _btn_new: Button = $Root/Center/Panel/Margin/VBox/NewGame
@onready var _btn_test: Button = $Root/Center/Panel/Margin/VBox/TestAccount
@onready var _btn_quit: Button = $Root/Center/Panel/Margin/VBox/Quit


class CoreEmblem extends Control:
	var _t: float = 0.0

	func _ready() -> void:
		custom_minimum_size = Vector2(64, 64)
		set_process(true)

	func _process(delta: float) -> void:
		_t += delta
		queue_redraw()

	func _draw() -> void:
		var c := size * 0.5
		var pulse: float = 0.55 + 0.45 * sin(_t * 1.4)
		var amber := UiStyle.MENU_AMBER
		var cyan := UiStyle.MENU_CYAN
		var violet := UiStyle.MENU_VIOLET
		draw_circle(c, 30.0, Color(violet, 0.1 * pulse))
		draw_circle(c, 24.0, Color("#0a0d14", 0.85))
		draw_arc(c, 22.0, 0.0, TAU, 40, Color(cyan, 0.55), 2.0, true)
		draw_arc(c, 22.0, _t * 0.8, _t * 0.8 + PI * 0.7, 20, Color(amber, 0.9), 2.4, true)
		var gem := PackedVector2Array([
			c + Vector2(0, -12),
			c + Vector2(10, 0),
			c + Vector2(0, 14),
			c + Vector2(-10, 0),
		])
		draw_colored_polygon(gem, Color(amber, 0.95))
		draw_colored_polygon(
			PackedVector2Array([c + Vector2(0, -12), c + Vector2(10, 0), c + Vector2(0, 2)]),
			Color(UiStyle.MENU_AMBER_HI, 0.85)
		)
		draw_polyline(gem, Color(cyan, 0.75), 1.5, true)
		draw_circle(c + Vector2(-2, -2), 2.2, Color(1, 1, 1, 0.55))


class OreGlowChip extends Control:
	var type_id: int = 4
	var _t: float = 0.0
	var _phase: float = 0.0

	func _init(tid: int = 4, phase: float = 0.0) -> void:
		type_id = tid
		_phase = phase
		custom_minimum_size = Vector2(38, 38)
		mouse_filter = Control.MOUSE_FILTER_IGNORE

	func _ready() -> void:
		set_process(true)
		var icon := OreBagIcon.new(type_id, 28.0)
		icon.position = Vector2(5, 5)
		add_child(icon)

	func _process(delta: float) -> void:
		_t += delta
		queue_redraw()

	func _draw() -> void:
		var meta: Dictionary = GameData.ore_meta(type_id)
		var col: Color = UiStyle.trade_slot_accent(
			meta.get("color", UiStyle.GOLD),
			meta.get("glow", Color(0, 0, 0, 0))
		)
		var pulse: float = 0.5 + 0.5 * sin(_t * 2.0 + _phase)
		var c := size * 0.5
		draw_circle(c, 16.0, Color(col, 0.1 + 0.07 * pulse))


func _ready() -> void:
	var hud: CanvasLayer = get_parent().get_node_or_null("HUD") as CanvasLayer
	if hud != null:
		hud.visible = false
	_setup_panel()
	_setup_brand()
	_setup_ore_chips()
	_setup_buttons()
	_play_enter_motion()


func _setup_panel() -> void:
	_panel.custom_minimum_size = Vector2(320, 0)


func _setup_brand() -> void:
	if _title_cn != null:
		_title_cn.add_theme_color_override("font_color", UiStyle.MENU_AMBER_HI)
		_title_cn.add_theme_font_size_override("font_size", 30)
		_title_cn.add_theme_color_override("font_shadow_color", Color("#1a1004", 0.8))
		_title_cn.add_theme_constant_override("shadow_offset_x", 0)
		_title_cn.add_theme_constant_override("shadow_offset_y", 2)
		_title_cn.add_theme_constant_override("outline_size", 0)
	if _icon_host != null:
		_icon_host.custom_minimum_size = Vector2(0, 64)
		for c in _icon_host.get_children():
			c.queue_free()
		_icon_host.add_child(CoreEmblem.new())


func _setup_ore_chips() -> void:
	if _ore_row == null:
		return
	for c in _ore_row.get_children():
		c.queue_free()
	var tids: Array[int] = [4, 5, 6, 7, 8]
	for i in tids.size():
		_ore_row.add_child(OreGlowChip.new(tids[i], float(i) * 0.9))


func _setup_buttons() -> void:
	# 宽窄错落的胶囊按钮，更自由
	UiStyle.apply_menu_button(_btn_new, UiStyle.MENU_AMBER, true)
	_fit_pill(_btn_new, 268, 54)

	UiStyle.apply_menu_button(_btn_continue, UiStyle.MENU_AMBER, false)
	_fit_pill(_btn_continue, 232, 46)

	UiStyle.apply_menu_button(_btn_test, UiStyle.MENU_CYAN, false)
	_fit_pill(_btn_test, 210, 44)

	UiStyle.apply_menu_button(_btn_quit, UiStyle.MENU_VIOLET, false)
	_fit_pill(_btn_quit, 168, 42)

	for btn in [_btn_continue, _btn_new, _btn_test, _btn_quit]:
		if btn != null:
			btn.focus_mode = Control.FOCUS_NONE
			_wire_btn_hover(btn)


func _fit_pill(btn: Button, w: float, h: float) -> void:
	if btn == null:
		return
	btn.custom_minimum_size = Vector2(w, h)
	btn.size_flags_horizontal = Control.SIZE_SHRINK_CENTER


func _wire_btn_hover(btn: Button) -> void:
	btn.mouse_entered.connect(func() -> void:
		var tw: Tween = btn.create_tween()
		tw.tween_property(btn, "scale", Vector2(1.045, 1.045), 0.09)
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
	_panel.scale = Vector2(0.96, 0.96)
	call_deferred("_reset_panel_pivot")
	var tw: Tween = create_tween().set_parallel(true)
	tw.tween_property(_panel, "modulate:a", 1.0, 0.3)
	tw.tween_property(_panel, "scale", Vector2.ONE, 0.38).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	var delay: float = 0.12
	for btn in [_btn_continue, _btn_new, _btn_test, _btn_quit]:
		if btn == null or not btn.visible:
			continue
		btn.modulate.a = 0.0
		var btw: Tween = create_tween()
		btw.tween_interval(delay)
		btw.tween_property(btn, "modulate:a", 1.0, 0.18)
		delay += 0.06


func _reset_panel_pivot() -> void:
	if _panel != null:
		_panel.pivot_offset = _panel.size * 0.5


func show_continue(enabled: bool) -> void:
	if _btn_continue != null:
		_btn_continue.visible = enabled
