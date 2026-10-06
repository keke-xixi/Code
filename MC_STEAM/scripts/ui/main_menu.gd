extends CanvasLayer


func _ready() -> void:
	var hud: CanvasLayer = get_parent().get_node_or_null("HUD") as CanvasLayer
	if hud != null:
		hud.visible = false
	var panel: PanelContainer = $Root/Center/Panel
	panel.add_theme_stylebox_override("panel", UiStyle.pixel_frame(UiStyle.GOLD))
	for btn_name in ["Continue", "NewGame", "Quit"]:
		var btn: Button = panel.get_node("Margin/VBox/%s" % btn_name) as Button
		if btn != null:
			btn.custom_minimum_size = Vector2(0, 56)
			btn.add_theme_font_size_override("font_size", 18)
			UiStyle.apply_action_button(btn, UiStyle.GOLD)
	var test_btn: Button = panel.get_node("Margin/VBox/TestAccount") as Button
	if test_btn != null:
		test_btn.custom_minimum_size = Vector2(0, 56)
		test_btn.add_theme_font_size_override("font_size", 18)
		UiStyle.apply_action_button(test_btn, UiStyle.CYAN)
	var title: Label = panel.get_node("Margin/VBox/Title") as Label
	if title != null:
		title.add_theme_color_override("font_color", UiStyle.COIN)
		title.visible = true


func show_continue(enabled: bool) -> void:
	$Root/Center/Panel/Margin/VBox/Continue.visible = enabled
