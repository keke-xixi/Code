extends Control

signal dismissed

@onready var _dim: ColorRect = $Dim
@onready var _panel: PanelContainer = $Center/Panel
@onready var _ribbon_wrap: PanelContainer = $Center/Panel/Margin/VBox/RibbonWrap
@onready var _ribbon: Label = $Center/Panel/Margin/VBox/RibbonWrap/Ribbon
@onready var _icon_wrap: PanelContainer = $Center/Panel/Margin/VBox/IconWrap
@onready var _icon: Label = $Center/Panel/Margin/VBox/IconWrap/IconBadge
@onready var _badge: Label = $Center/Panel/Margin/VBox/Badge
@onready var _tagline: Label = $Center/Panel/Margin/VBox/Tagline
@onready var _cost_row: HBoxContainer = $Center/Panel/Margin/VBox/CostRow
@onready var _cost_icon_host: CenterContainer = $Center/Panel/Margin/VBox/CostRow/CostIconHost
@onready var _cost: Label = $Center/Panel/Margin/VBox/CostRow/Cost
@onready var _ok: Button = $Center/Panel/Margin/VBox/OkBtn

var _anim: Tween


func _ready() -> void:
	visible = false
	mouse_filter = Control.MOUSE_FILTER_STOP
	_ok.pressed.connect(hide_popup)
	_dim.gui_input.connect(_on_dim_input)
	_apply_base_style()


func _apply_base_style() -> void:
	_panel.add_theme_stylebox_override("panel", UiStyle.favour_popup_frame(UiStyle.GOLD))
	_ribbon_wrap.add_theme_stylebox_override("panel", UiStyle.favour_popup_title_soft())
	_icon_wrap.add_theme_stylebox_override("panel", _icon_plate_style(UiStyle.GOLD))
	_ribbon.add_theme_font_size_override("font_size", 22)
	_ribbon.add_theme_color_override("font_color", UiStyle.COIN)
	_icon.add_theme_font_size_override("font_size", 52)
	_badge.add_theme_font_size_override("font_size", 22)
	_tagline.add_theme_font_size_override("font_size", 15)
	_cost.add_theme_font_size_override("font_size", 16)
	UiStyle.apply_action_button(_ok, UiStyle.GOLD)
	_ok.custom_minimum_size = Vector2(200, 44)
	_ok.text = "好的"


func show_info(info: Dictionary) -> void:
	var kind: String = str(info.get("kind", "ok"))
	var accent: Color = UiStyle.GOLD if kind == "ok" else UiStyle.WARN
	var title: String = str(info.get("title", ""))
	if kind == "ok" and (title.is_empty() or title == "LEVEL UP"):
		title = "升级成功"
	elif kind != "ok" and (title.is_empty() or title == "买不了"):
		title = "还不能买"
	_ribbon.text = title
	_ribbon.add_theme_color_override("font_color", UiStyle.COIN if kind == "ok" else UiStyle.WARN)
	_ribbon_wrap.add_theme_stylebox_override("panel", UiStyle.favour_popup_title_soft())
	if kind == "ok":
		MineAudio.play_level_up()
	_icon.text = str(info.get("icon", "⛏"))
	_badge.text = str(info.get("badge", ""))
	_tagline.text = str(info.get("tagline", info.get("hint", "")))
	_badge.add_theme_color_override("font_color", UiStyle.TEXT)
	_tagline.add_theme_color_override("font_color", UiStyle.TEXT_DIM)
	_panel.add_theme_stylebox_override("panel", UiStyle.favour_popup_frame(accent))
	_icon_wrap.add_theme_stylebox_override("panel", _icon_plate_style(accent))
	UiStyle.apply_action_button(_ok, accent)
	_ok.text = "好的" if kind == "ok" else "知道了"
	_fill_cost_row(info, kind)
	visible = true
	_play_in()


func _fill_cost_row(info: Dictionary, kind: String) -> void:
	for c in _cost_icon_host.get_children():
		c.queue_free()
	var paid_ore: int = int(info.get("paid_ore", 0))
	var cost_coins: int = int(info.get("cost", 0))
	var cost_line: String = str(info.get("cost_line", ""))
	var show: bool = not cost_line.is_empty() or paid_ore > 0 or cost_coins > 0
	_cost_row.visible = show
	if not show:
		return
	if paid_ore > 0:
		_cost_icon_host.add_child(OreBagIcon.new(paid_ore, 26.0))
		var ore_name: String = str(GameData.ore_meta(paid_ore).get("name", ""))
		_cost.text = ("-1×%s" if kind == "ok" else "需要 1×%s") % ore_name
	elif cost_coins > 0:
		_cost_icon_host.add_child(UiIcons.money_hud(22.0, false))
		_cost.text = ("-%s" if kind == "ok" else "需要 %s") % UpgradeSystem.fmt_coins(cost_coins)
	else:
		_cost.text = cost_line
	_cost.add_theme_color_override("font_color", UiStyle.COIN if kind == "ok" else UiStyle.TEXT_DIM)


func hide_popup() -> void:
	if not visible:
		return
	if _anim != null and _anim.is_valid():
		_anim.kill()
	_anim = create_tween()
	_anim.set_parallel(true)
	_anim.tween_property(_panel, "modulate:a", 0.0, 0.1)
	_anim.tween_property(_panel, "scale", Vector2(0.92, 0.92), 0.1)
	_anim.tween_property(_dim, "modulate:a", 0.0, 0.1)
	_anim.chain().tween_callback(func() -> void:
		visible = false
		_panel.scale = Vector2.ONE
		_panel.modulate.a = 1.0
		dismissed.emit()
	)


func _play_in() -> void:
	if _anim != null and _anim.is_valid():
		_anim.kill()
	_panel.scale = Vector2(0.86, 0.86)
	_panel.modulate.a = 0.0
	_dim.modulate.a = 0.0
	if _panel.size.x > 1.0:
		_panel.pivot_offset = _panel.size * 0.5
	else:
		_panel.pivot_offset = Vector2(170, 140)
	_anim = create_tween()
	_anim.set_parallel(true)
	_anim.tween_property(_dim, "modulate:a", 1.0, 0.14)
	_anim.tween_property(_panel, "modulate:a", 1.0, 0.16)
	_anim.tween_property(_panel, "scale", Vector2.ONE, 0.28).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)


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


func _icon_plate_style(accent: Color) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color("#121820", 0.95)
	sb.border_width_left = 2
	sb.border_width_top = 2
	sb.border_width_right = 2
	sb.border_width_bottom = 2
	sb.border_color = Color(accent, 0.55)
	sb.corner_radius_top_left = 14
	sb.corner_radius_top_right = 14
	sb.corner_radius_bottom_left = 14
	sb.corner_radius_bottom_right = 14
	sb.content_margin_left = 10
	sb.content_margin_right = 10
	sb.content_margin_top = 8
	sb.content_margin_bottom = 8
	return sb
