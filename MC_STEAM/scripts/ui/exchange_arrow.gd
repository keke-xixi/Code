extends Control
class_name ExchangeArrow

enum Style { CHEVRON, CHECK }

const CHECK_GREEN := Color("#34d058")

var tint: Color = CHECK_GREEN
var style: Style = Style.CHECK


func _init(w: float = 28.0, h: float = 18.0, style_mode: Style = Style.CHECK) -> void:
	style = style_mode
	if style == Style.CHEVRON:
		tint = UiStyle.COIN
	custom_minimum_size = Vector2(w, h)
	mouse_filter = Control.MOUSE_FILTER_IGNORE


func _draw() -> void:
	if style == Style.CHECK:
		_draw_check()
	else:
		_draw_chevron()


func _draw_check() -> void:
	var w: float = size.x
	var h: float = size.y
	var body: Color = tint
	var sw: float = maxf(2.6, minf(w, h) * 0.13)
	var p1 := Vector2(w * 0.16, h * 0.5)
	var p2 := Vector2(w * 0.4, h * 0.76)
	var p3 := Vector2(w * 0.84, h * 0.24)
	draw_line(p1, p2, body.darkened(0.12), sw + 0.6)
	draw_line(p2, p3, body.darkened(0.12), sw + 0.6)
	draw_line(p1, p2, body, sw)
	draw_line(p2, p3, body, sw)
	draw_line(p1, p2, Color(1, 1, 1, 0.35), sw * 0.45)


func _draw_chevron() -> void:
	var w: float = size.x
	var h: float = size.y
	var cy: float = h * 0.5
	var body: Color = tint
	var shine: Color = Color(1, 1, 1, 0.55)
	for i in range(2):
		var ox: float = 4.0 + float(i) * 9.0
		var tip := Vector2(w - 4.0 - float(i) * 2.0, cy)
		var top := Vector2(ox, cy - 5.0)
		var bot := Vector2(ox, cy + 5.0)
		draw_colored_polygon(PackedVector2Array([top, tip, bot]), body)
		draw_line(top, tip, shine, 1.2)
		draw_line(bot, tip, Color(body, 0.65), 1.0)
	draw_line(Vector2(2, cy), Vector2(w * 0.38, cy), Color(body, 0.85), 2.0)
