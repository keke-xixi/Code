extends CanvasLayer

signal request_main_menu

@onready var shell: Control = $Center/Shell
@onready var panel: PanelContainer = $Center/Shell/Panel
@onready var ore_check: CheckButton = $Center/Shell/Panel/Margin/VBox/ShowOre
@onready var instant_check: CheckButton = $Center/Shell/Panel/Margin/VBox/InstantMine
@onready var sfx_check: CheckButton = $Center/Shell/Panel/Margin/VBox/Sfx
@onready var music_check: CheckButton = $Center/Shell/Panel/Margin/VBox/Music
@onready var shake_check: CheckButton = $Center/Shell/Panel/Margin/VBox/Shake
@onready var back_menu: Button = $Center/Shell/Panel/Margin/VBox/BackMenu
@onready var close_btn: Button = $Center/Shell/Close


func _ready() -> void:
	visible = false
	panel.add_theme_stylebox_override("panel", UiStyle.glass_panel(UiStyle.CYAN))
	panel.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	# 返回主菜单改到局内右上角图标，设置里去掉旧按钮以免占高
	if back_menu != null:
		back_menu.get_parent().remove_child(back_menu)
		back_menu.queue_free()
		back_menu = null
	var sep: Control = panel.get_node_or_null("Margin/VBox/Sep") as Control
	if sep != null:
		sep.get_parent().remove_child(sep)
		sep.queue_free()
	_style_close_btn()
	# Shell 高度跟着内容走，Close 才能钉在右上角
	call_deferred("_fit_shell_later")
	_sync_from_settings()
	GameEvents.settings_changed.connect(_sync_from_settings)


var _fitting_shell: bool = false


func _fit_shell_to_panel() -> void:
	if shell == null or panel == null or _fitting_shell:
		return
	_fitting_shell = true
	# 先清掉可能残留的偏大高度（隐藏返回按钮后第一次打开容易虚高）
	panel.size = Vector2(420.0, 0.0)
	panel.reset_size()
	var min_sz: Vector2 = panel.get_combined_minimum_size()
	var w: float = maxf(420.0, min_sz.x)
	var h: float = maxf(min_sz.y, 1.0)
	panel.set_size(Vector2(w, h))
	panel.position = Vector2.ZERO
	shell.custom_minimum_size = Vector2(w, h)
	shell.size = Vector2(w, h)
	if close_btn != null:
		close_btn.position = Vector2(w - 34.0, 2.0)
		close_btn.size = Vector2(30.0, 30.0)
		close_btn.move_to_front()
	_fitting_shell = false


func _fit_shell_later() -> void:
	_fit_shell_to_panel()
	if not is_inside_tree():
		return
	get_tree().process_frame.connect(_fit_shell_to_panel, CONNECT_ONE_SHOT)


func _style_close_btn() -> void:
	if close_btn == null:
		return
	UiStyle.apply_corner_close_button(close_btn)
	close_btn.move_to_front()
	call_deferred("_fit_shell_to_panel")


func toggle() -> void:
	if visible:
		close_panel()
	else:
		open_panel()


func open_panel() -> void:
	_sync_from_settings()
	UiJuice.bring_canvas_front(self)
	visible = true
	call_deferred("_fit_shell_later")


func close_panel() -> void:
	visible = false


func _sync_from_settings() -> void:
	for cb in [ore_check, instant_check, sfx_check, music_check, shake_check]:
		cb.set_block_signals(true)
	ore_check.button_pressed = UserSettings.show_ore_preview
	instant_check.button_pressed = UserSettings.instant_mine_on_break
	sfx_check.button_pressed = UserSettings.sfx_enabled
	music_check.button_pressed = UserSettings.music_enabled
	shake_check.button_pressed = UserSettings.screen_shake
	for cb in [ore_check, instant_check, sfx_check, music_check, shake_check]:
		cb.set_block_signals(false)


func _on_show_ore_toggled(toggled: bool) -> void:
	UserSettings.set_show_ore_preview(toggled)
	GameEvents.toast.emit("透视矿层 %s（调试）" % ("开" if toggled else "关"), "ok")


func _on_instant_mine_toggled(toggled: bool) -> void:
	UserSettings.set_instant_mine(toggled)
	GameEvents.toast.emit("即挖 %s" % ("开" if toggled else "关"), "ok")


func _on_sfx_toggled(toggled: bool) -> void:
	UserSettings.set_sfx_enabled(toggled)
	GameEvents.toast.emit("音效 %s" % ("开" if toggled else "关"), "ok")


func _on_music_toggled(toggled: bool) -> void:
	UserSettings.set_music_enabled(toggled)
	GameEvents.toast.emit("环境 %s" % ("开" if toggled else "关"), "ok")


func _on_shake_toggled(toggled: bool) -> void:
	UserSettings.set_screen_shake(toggled)
	GameEvents.toast.emit("震屏 %s" % ("开" if toggled else "关"), "ok")


func _on_close_pressed() -> void:
	close_panel()


func _on_back_menu_pressed() -> void:
	close_panel()
	request_main_menu.emit()


func _unhandled_input(event: InputEvent) -> void:
	if not visible:
		return
	if event is InputEventKey and event.pressed and event.keycode == KEY_ESCAPE:
		close_panel()
		get_viewport().set_input_as_handled()
	elif event is InputEventMouseButton:
		var mb := event as InputEventMouseButton
		if mb.button_index == MOUSE_BUTTON_WHEEL_UP or mb.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			get_viewport().set_input_as_handled()
