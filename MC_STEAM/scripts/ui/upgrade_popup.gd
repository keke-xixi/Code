extends Control

signal dismissed

@onready var _dim: ColorRect = $Dim
@onready var _panel: PanelContainer = $Panel
@onready var _ribbon: Label = $Panel/Margin/VBox/Ribbon
@onready var _icon: Label = $Panel/Margin/VBox/IconBadge
@onready var _badge: Label = $Panel/Margin/VBox/Badge
@onready var _tagline: Label = $Panel/Margin/VBox/Tagline
@onready var _cost: Label = $Panel/Margin/VBox/Cost
@onready var _ok: Button = $Panel/Margin/VBox/OkBtn

var _anim: Tween


func _ready() -> void:
	visible = false
	mouse_filter = Control.MOUSE_FILTER_STOP
	_ok.pressed.connect(hide_popup)
	_dim.gui_input.connect(_on_dim_input)
	_apply_base_style()


func _apply_base_style() -> void:
	_panel.add_theme_stylebox_override("panel", _game_panel_style(UiStyle.GOLD))
	_ribbon.add_theme_font_size_override("font_size", 22)
	_icon.add_theme_font_size_override("font_size", 56)
	_badge.add_theme_font_size_override("font_size", 26)
	_tagline.add_theme_font_size_override("font_size", 17)
	_cost.add_theme_font_size_override("font_size", 18)
	UiStyle.apply_action_button(_ok, UiStyle.GOLD)
	_ok.text = "好"


func show_info(info: Dictionary) -> void:
	var kind: String = str(info.get("kind", "ok"))
	var accent: Color = UiStyle.GOLD if kind == "ok" else UiStyle.WARN
	_ribbon.text = str(info.get("title", ""))
	_ribbon.add_theme_color_override("font_color", accent)
	_ribbon.add_theme_font_size_override("font_size", 28)
	_icon.text = str(info.get("icon", "⛏"))
	_badge.text = str(info.get("badge", ""))
	_tagline.text = str(info.get("tagline", info.get("hint", "")))
	var cost_line: String = str(info.get("cost_line", ""))
	_cost.text = cost_line
	_cost.visible = not cost_line.is_empty()
	_cost.add_theme_color_override("font_color", UiStyle.COIN if kind == "ok" else UiStyle.TEXT_DIM)
	_badge.add_theme_color_override("font_color", UiStyle.TEXT)
	_tagline.add_theme_color_override("font_color", UiStyle.TEXT_DIM)
	_panel.add_theme_stylebox_override("panel", _game_panel_style(accent))
	visible = true
	_play_in()


func hide_popup() -> void:
	if not visible:
		return
	if _anim != null and _anim.is_valid():
		_anim.kill()
	_anim = create_tween()
	_anim.set_parallel(true)
	_anim.tween_property(_panel, "modulate:a", 0.0, 0.1)
	_anim.tween_property(_panel, "scale", Vector2(0.9, 0.9), 0.1)
	_anim.tween_property(_dim, "modulate:a", 0.0, 0.1)
	_anim.chain().tween_callback(func() -> void:
		visible = false
		dismissed.emit()
	)


func _play_in() -> void:
	if _anim != null and _anim.is_valid():
		_anim.kill()
	_panel.scale = Vector2(0.75, 0.75)
	_panel.modulate.a = 0.0
	_dim.modulate.a = 0.0
	_anim = create_tween()
	_anim.set_parallel(true)
	_anim.tween_property(_dim, "modulate:a", 0.75, 0.15)
	_anim.tween_property(_panel, "modulate:a", 1.0, 0.18)
	_anim.tween_property(_panel, "scale", Vector2.ONE, 0.32).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)


func _on_dim_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		hide_popup()


func _unhandled_input(event: InputEvent) -> void:
	if not visible:
		return
	if event is InputEventKey and event.pressed and event.keycode == KEY_ESCAPE:
		hide_popup()
		get_viewport().set_input_as_handled()
	elif event is InputEventMouseButton:
		var mb := event as InputEventMouseButton
		if mb.button_index == MOUSE_BUTTON_WHEEL_UP or mb.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			get_viewport().set_input_as_handled()


func _game_panel_style(accent: Color) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color("#1a1520")
	sb.border_width_left = 4
	sb.border_width_top = 4
	sb.border_width_right = 4
	sb.border_width_bottom = 6
	sb.border_color = accent
	sb.corner_radius_top_left = 6
	sb.corner_radius_top_right = 6
	sb.corner_radius_bottom_left = 6
	sb.corner_radius_bottom_right = 6
	sb.shadow_color = Color(0, 0, 0, 0.6)
	sb.shadow_size = 14
	sb.content_margin_left = 20
	sb.content_margin_right = 20
	sb.content_margin_top = 16
	sb.content_margin_bottom = 16
	return sb
