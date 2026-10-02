extends CanvasLayer


func _ready() -> void:
	var panel: PanelContainer = $Panel
	panel.add_theme_stylebox_override("panel", UiStyle.pixel_frame(UiStyle.GOLD))
	for btn_name in ["Continue", "NewGame", "Quit"]:
		var btn: Button = panel.get_node("Margin/VBox/%s" % btn_name) as Button
		if btn != null:
			UiStyle.apply_action_button(btn, UiStyle.GOLD)


func show_continue(enabled: bool) -> void:
	$Panel/Margin/VBox/Continue.visible = enabled
