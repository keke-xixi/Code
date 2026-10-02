extends CanvasLayer

@onready var panel: PanelContainer = $Panel
@onready var ore_check: CheckButton = $Panel/Margin/VBox/ShowOre
@onready var instant_check: CheckButton = $Panel/Margin/VBox/InstantMine
@onready var sfx_check: CheckButton = $Panel/Margin/VBox/Sfx
@onready var shake_check: CheckButton = $Panel/Margin/VBox/Shake


func _ready() -> void:
	visible = false
	panel.add_theme_stylebox_override("panel", UiStyle.frame_panel(UiStyle.CYAN, 12))
	_sync_from_settings()
	GameEvents.settings_changed.connect(_sync_from_settings)


func toggle() -> void:
	if visible:
		close_panel()
	else:
		open_panel()


func open_panel() -> void:
	_sync_from_settings()
	visible = true


func close_panel() -> void:
	visible = false


func _sync_from_settings() -> void:
	for cb in [ore_check, instant_check, sfx_check, shake_check]:
		cb.set_block_signals(true)
	ore_check.button_pressed = UserSettings.show_ore_preview
	instant_check.button_pressed = UserSettings.instant_mine_on_break
	sfx_check.button_pressed = UserSettings.sfx_enabled
	shake_check.button_pressed = UserSettings.screen_shake
	for cb in [ore_check, instant_check, sfx_check, shake_check]:
		cb.set_block_signals(false)


func _on_show_ore_toggled(toggled: bool) -> void:
	UserSettings.set_show_ore_preview(toggled)
	GameEvents.toast.emit("矿脉预览 %s" % ("开" if toggled else "关"), "ok")


func _on_instant_mine_toggled(toggled: bool) -> void:
	UserSettings.set_instant_mine(toggled)
	GameEvents.toast.emit("一挖即得 %s" % ("开" if toggled else "关"), "ok")


func _on_sfx_toggled(toggled: bool) -> void:
	UserSettings.set_sfx_enabled(toggled)
	GameEvents.toast.emit("音效 %s" % ("开" if toggled else "关"), "ok")


func _on_shake_toggled(toggled: bool) -> void:
	UserSettings.set_screen_shake(toggled)
	GameEvents.toast.emit("震屏 %s" % ("开" if toggled else "关"), "ok")


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
