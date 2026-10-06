extends Control
class_name OreBagIcon

var ore_type_id: int = 1:
	set(v):
		ore_type_id = v
		queue_redraw()


func _init(type_id: int = 1, side: float = 34.0) -> void:
	ore_type_id = type_id
	custom_minimum_size = Vector2(side, side)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	clip_contents = false


func _draw() -> void:
	OreVisual.draw_ui_icon(self, Rect2(Vector2.ZERO, size), ore_type_id)
