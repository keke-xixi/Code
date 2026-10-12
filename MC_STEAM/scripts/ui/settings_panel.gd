extends CanvasLayer

signal request_main_menu

@onready var panel: PanelContainer = $Center/Panel
@onready var ore_check: CheckButton = $Center/Panel/Margin/VBox/ShowOre
@onready var instant_check: CheckButton = $Center/Panel/Margin/VBox/InstantMine
@onready var sfx_check: CheckButton = $Center/Panel/Margin/VBox/Sfx
@onready var music_check: CheckButton = $Center/Panel/Margin/VBox/Music
@onready var shake_check: CheckButton = $Center/Panel/Margin/VBox/Shake
@onready var back_menu: Button = $Center/Panel/Margin/VBox/BackMenu


func _ready() -> void:
	visible = false
	panel.add_theme_stylebox_override("panel", UiStyle.glass_panel(UiStyle.CYAN))
	# 高度随内容，避免底部大块空白
	panel.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	if back_menu != null:
		UiStyle.apply_action_button(back_menu, UiStyle.CYAN)
		back_menu.add_theme_font_size_override("font_size", 17)
	_sync_from_settings()
	GameEvents.settings_changed.connect(_sync_from_settings)


func toggle() -> void:
	if visible:
		close_panel()
	else:
		open_panel()


func open_panel() -> void:
	_sync_from_settings()
	UiJuice.bring_canvas_front(self)
	visible = true


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
