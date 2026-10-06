extends Control
class_name ExchangeArrow

var tint: Color = UiStyle.COIN


func _init(w: float = 28.0, h: float = 18.0) -> void:
	custom_minimum_size = Vector2(w, h)
	mouse_filter = Control.MOUSE_FILTER_IGNORE


func _draw() -> void:
	var w: float = size.x
	var h: float = size.y
	var cy: float = h * 0.5
	var body: Color = tint
	var shine: Color = Color(1, 1, 1, 0.55)
	# 双 chevron →
	for i in range(2):
		var ox: float = 4.0 + float(i) * 9.0
		var tip := Vector2(w - 4.0 - float(i) * 2.0, cy)
		var top := Vector2(ox, cy - 5.0)
		var bot := Vector2(ox, cy + 5.0)
		draw_colored_polygon(PackedVector2Array([top, tip, bot]), body)
		draw_line(top, tip, shine, 1.2)
		draw_line(bot, tip, Color(body, 0.65), 1.0)
	draw_line(Vector2(2, cy), Vector2(w * 0.38, cy), Color(body, 0.85), 2.0)
