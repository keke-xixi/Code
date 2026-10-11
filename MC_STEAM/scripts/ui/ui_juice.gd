class_name UiJuice
extends RefCounted

const GAME_POPUP_PIVOT_FALLBACK := 170.0
## 跨 CanvasLayer 弹窗：后打开的抬到更高 layer（商店/设置默认 25，HUD 默认 10）
const MODAL_LAYER_BASE := 40
const MODAL_LAYER_MAX := 80
static var _modal_layer_seq: int = MODAL_LAYER_BASE


static func bring_canvas_front(host: CanvasLayer) -> void:
	if host == null:
		return
	_modal_layer_seq += 1
	if _modal_layer_seq > MODAL_LAYER_MAX:
		_modal_layer_seq = MODAL_LAYER_BASE + 1
	host.layer = _modal_layer_seq


static func punch(node: Control, peak: float = 1.14) -> void:
	if node == null:
		return
	var tw: Tween = node.create_tween()
	tw.tween_property(node, "scale", Vector2(peak, peak), 0.07).set_trans(Tween.TRANS_QUAD)
	tw.tween_property(node, "scale", Vector2.ONE, 0.22).set_trans(Tween.TRANS_ELASTIC)


static func pop_show(panel: Control) -> void:
	modal_open(panel, null)


## 无动画直接显示（兑换等高频弹窗用，避免「点了才动」的迟滞感）
static func modal_show_instant(panel: Control, backdrop: ColorRect = null) -> void:
	if panel == null:
		return
	panel.visible = true
	panel.scale = Vector2.ONE
	panel.modulate.a = 1.0
	panel.rotation = 0.0
	if backdrop != null:
		backdrop.visible = true
		backdrop.modulate.a = 1.0


static func modal_open(
	panel: Control,
	backdrop: ColorRect = null,
	stagger_body: bool = true,
	fast: bool = false
) -> void:
	if panel == null:
		return
	if fast:
		modal_show_instant(panel, backdrop)
		return
	panel.visible = true
	panel.scale = Vector2(0.78, 0.78)
	panel.modulate.a = 0.0
	panel.rotation = -0.04
	_set_popup_pivot(panel)
	var tw: Tween = panel.create_tween().set_parallel(true)
	tw.tween_property(panel, "scale", Vector2.ONE, 0.34).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	tw.tween_property(panel, "modulate:a", 1.0, 0.22)
	tw.tween_property(panel, "rotation", 0.0, 0.28).set_trans(Tween.TRANS_QUAD)
	if backdrop != null:
		backdrop.visible = true
		backdrop.modulate.a = 0.0
		var bd: Tween = backdrop.create_tween()
		bd.tween_property(backdrop, "modulate:a", 1.0, 0.26).set_trans(Tween.TRANS_SINE)
	if stagger_body:
		var body: Control = _popup_body(panel)
		if body != null:
			stagger_children(body, 0.045, 1)


static func modal_close(panel: Control, backdrop: ColorRect, on_finished: Callable = Callable()) -> void:
	if panel == null or not panel.visible:
		if on_finished.is_valid():
			on_finished.call()
		return
	_set_popup_pivot(panel)
	var tw: Tween = panel.create_tween().set_parallel(true)
	tw.tween_property(panel, "scale", Vector2(0.86, 0.86), 0.16).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN)
	tw.tween_property(panel, "modulate:a", 0.0, 0.14)
	tw.tween_property(panel, "rotation", 0.03, 0.14)
	if backdrop != null and backdrop.visible:
		var bd: Tween = backdrop.create_tween()
		bd.tween_property(backdrop, "modulate:a", 0.0, 0.14)
	tw.chain().tween_callback(func() -> void:
		panel.visible = false
		panel.scale = Vector2.ONE
		panel.modulate.a = 1.0
		panel.rotation = 0.0
		if backdrop != null:
			backdrop.visible = false
		if on_finished.is_valid():
			on_finished.call()
	)


static func stagger_children(container: Control, step: float = 0.04, skip: int = 0) -> void:
	if container == null:
		return
	var idx: int = 0
	for child in container.get_children():
		if not child is Control:
			continue
		var c: Control = child as Control
		if idx < skip:
			idx += 1
			continue
		c.modulate.a = 0.0
		c.scale = Vector2(0.92, 0.92)
		var tw: Tween = c.create_tween()
		tw.tween_interval(float(idx - skip) * step)
		tw.set_parallel(true)
		tw.tween_property(c, "modulate:a", 1.0, 0.2).set_trans(Tween.TRANS_SINE)
		tw.tween_property(c, "scale", Vector2.ONE, 0.26).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
		idx += 1


static func icon_hover_pulse(icon_root: Control) -> void:
	if icon_root == null:
		return
	var target: Node = icon_root
	if icon_root.get_child_count() > 0:
		target = icon_root.get_child(0)
	var tw: Tween = icon_root.create_tween().set_loops()
	tw.tween_property(target, "scale", Vector2(1.1, 1.1), 0.85).set_trans(Tween.TRANS_SINE)
	tw.tween_property(target, "scale", Vector2.ONE, 0.85).set_trans(Tween.TRANS_SINE)


static func idle_float(node: Control, amount: float = 4.0, period: float = 1.6) -> void:
	if node == null:
		return
	var base_y: float = node.position.y
	var tw: Tween = node.create_tween().set_loops()
	tw.tween_property(node, "position:y", base_y - amount, period * 0.5).set_trans(Tween.TRANS_SINE)
	tw.tween_property(node, "position:y", base_y + amount * 0.35, period * 0.5).set_trans(Tween.TRANS_SINE)


static func _set_popup_pivot(panel: Control) -> void:
	if panel.size.length_squared() > 1.0:
		panel.pivot_offset = panel.size * 0.5
	else:
		panel.pivot_offset = Vector2(GAME_POPUP_PIVOT_FALLBACK, GAME_POPUP_PIVOT_FALLBACK)


static func _popup_body(panel: PanelContainer) -> Control:
	var margin: MarginContainer = panel.get_node_or_null("Margin") as MarginContainer
	if margin == null:
		return null
	return margin.get_node_or_null("VBox") as Control
