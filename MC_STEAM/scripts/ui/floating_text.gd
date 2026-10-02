extends Node2D

@onready var label: Label = $Label


func spawn(text: String, at: Vector2) -> void:
	global_position = at
	label.text = text
	modulate.a = 1.0
	var tw: Tween = create_tween()
	tw.set_parallel(true)
	tw.tween_property(self, "position:y", position.y - 48, 0.9)
	tw.tween_property(self, "modulate:a", 0.0, 0.9)
	tw.chain().tween_callback(queue_free)
