class_name CoinFx
extends Control
## 屏幕空间金币飞入 HUD（兑换/奖励反馈）

var _tex: Texture2D


func _ready() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	z_index = 120
	_tex = UiIcons.texture_coin()


func fly_to_badge(from_global: Vector2, target: Control, coin_amount: int) -> void:
	if target == null:
		return
	var to: Vector2 = target.get_global_rect().get_center()
	var n: int = clampi(3 + int(sqrt(float(maxi(1, coin_amount)))), 4, 14)
	for i in range(n):
		_spawn_one(from_global, to, float(i) * 0.04)


func _spawn_one(from: Vector2, to: Vector2, delay: float) -> void:
	var node: Control
	if _tex != null:
		var tr := TextureRect.new()
		tr.texture = _tex
		tr.custom_minimum_size = Vector2(26, 26)
		tr.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		tr.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		node = tr
	else:
		node = UiIcons.coin(24.0, false)
	node.scale = Vector2(0.3, 0.3)
	node.global_position = from + Vector2(randf_range(-14, 14), randf_range(-10, 10))
	add_child(node)
	var tw: Tween = create_tween()
	if delay > 0.0:
		tw.tween_interval(delay)
	tw.tween_property(node, "scale", Vector2(1.0, 1.0), 0.16).set_trans(Tween.TRANS_BACK)
	tw.tween_property(node, "global_position", to, 0.48).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN)
	tw.parallel().tween_property(node, "scale", Vector2(0.2, 0.2), 0.48)
	tw.parallel().tween_property(node, "modulate:a", 0.0, 0.18).set_delay(0.32)
	tw.chain().tween_callback(node.queue_free)
