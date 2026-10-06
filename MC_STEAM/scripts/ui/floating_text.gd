extends Node2D

@onready var label: Label = $Label


func spawn(text: String, at: Vector2, tint: Color = Color(1, 0.92, 0.45, 1)) -> void:
	global_position = at
	label.text = text
	label.add_theme_color_override("font_color", tint)
	modulate.a = 1.0
	scale = Vector2(0.45, 0.45)
	var tw: Tween = create_tween()
	tw.tween_property(self, "scale", Vector2(1.1, 1.1), 0.14).set_trans(Tween.TRANS_BACK)
	tw.tween_property(self, "scale", Vector2.ONE, 0.07)
	tw.parallel().tween_property(self, "position:y", position.y - 54, 0.9).set_delay(0.05)
	tw.parallel().tween_property(self, "modulate:a", 0.0, 0.55).set_delay(0.45)
	tw.chain().tween_callback(queue_free)
