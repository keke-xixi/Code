extends Node2D

const FX_LAYER := preload("res://scripts/game/mine_fx_layer.gd")
const CHUNK_SCENE := preload("res://scripts/game/mine_chunk.gd")

var session: GameSession

var _fx: Node2D
var _redraw_pending: bool = false
var _chunks: Dictionary = {}
var _view_redraw: bool = false
var _paint: CanvasItem


func setup(game_session: GameSession) -> void:
	session = game_session
	_clear_chunks()
	if session == null:
		return
	if not session.state_changed.is_connected(_schedule_redraw):
		session.state_changed.connect(_schedule_redraw)
	if not GameEvents.settings_changed.is_connected(_on_settings_changed):
		GameEvents.settings_changed.connect(_on_settings_changed)
	if _fx == null:
		_fx = FX_LAYER.new()
		_fx.name = "MineFx"
		add_child(_fx)
		_fx.setup(self)
	set_process(false)
	call_deferred("mark_view_dirty")


func mark_view_dirty() -> void:
	_view_redraw = true
	_schedule_redraw()


func _on_settings_changed() -> void:
	_view_redraw = true
	_schedule_redraw()


func _schedule_redraw() -> void:
	if _redraw_pending:
		return
	_redraw_pending = true
	call_deferred("_flush_redraw")


func _flush_redraw() -> void:
	_redraw_pending = false
	if session == null:
		return
	var dirty: Dictionary = session.take_map_dirty()
	if _view_redraw or bool(dirty.get("full", false)):
		_view_redraw = false
		_redraw_visible_chunks()
		return
	var keys: Array = dirty.get("keys", [])
	if keys.is_empty():
		_redraw_visible_chunks()
		return
	for key in keys:
		var pos: Vector2i = WorldGen.parse_key(str(key))
		_redraw_chunk_for_cell(pos)


func render_cell(canvas: CanvasItem, x: int, y: int, cs: int, chunk: Vector2i) -> void:
	if session == null or canvas == null:
		return
	_paint = canvas
	var key := WorldGen.cell_key(x, y)
	if not session.ores.has(key):
		_paint = null
		return
	var cell: Dictionary = session.ores[key]
	var pos := Vector2i(x, y)
	var n: int = CHUNK_SCENE.CHUNK_CELLS
	var lx: int = x - chunk.x * n
	var ly: int = y - chunk.y * n
	var rect := Rect2(Vector2(lx, ly) * cs, Vector2(cs, cs))
	var inner := rect.grow(-3)
	var fx: Dictionary = session.effects()
	var show_from: String = str(fx.get("show_rarity_from", "legendary"))
	var det_r: int = int(fx.get("detector_radius", 0))
	var player: Vector2i = session.player

	if bool(cell.get("taken", false)):
		OreVisual.draw_mined_pit(_paint, inner)
		_paint = null
		return

	var type_id: int = int(cell.get("type", 1))
	var meta: Dictionary = GameData.ore_meta(type_id)
	var ore_rarity: String = str(meta.get("rarity", "common"))

	if not bool(cell.get("broken", false)):
		OreVisual.draw_rock_shell(
			_paint,
			inner,
			pos,
			type_id,
			meta,
			UserSettings.show_ore_preview,
			show_from,
			ore_rarity,
			det_r,
			player,
		)
	else:
		OreVisual.draw_exposed(_paint, inner, meta, type_id, pos)
	_paint = null


func _view_grid_rect(cs: int) -> Rect2i:
	var cam: Camera2D = get_viewport().get_camera_2d()
	# 无相机时绝不能回退超大矩形，否则会创建海量 chunk 卡死
	if cam == null:
		return Rect2i(-24, -16, 48, 32)
	var zoom: float = maxf(cam.zoom.x, 0.35)
	var half: Vector2 = get_viewport().get_visible_rect().size / zoom * 0.55
	# 限制视野跨度，防止异常 zoom/位置拖垮主线程
	half.x = minf(half.x, float(cs * 28))
	half.y = minf(half.y, float(cs * 20))
	var center: Vector2 = cam.global_position
	var x0: int = int(floor((center.x - half.x) / cs)) - 2
	var y0: int = int(floor((center.y - half.y) / cs)) - 2
	var x1: int = int(ceil((center.x + half.x) / cs)) + 2
	var y1: int = int(ceil((center.y + half.y) / cs)) + 2
	return Rect2i(x0, y0, maxi(1, x1 - x0), maxi(1, y1 - y0))


func _chunk_index(cell: Vector2i) -> Vector2i:
	var n: int = CHUNK_SCENE.CHUNK_CELLS
	return Vector2i(int(floori(float(cell.x) / float(n))), int(floori(float(cell.y) / float(n))))


func _get_chunk(idx: Vector2i) -> Node2D:
	if _chunks.has(idx):
		return _chunks[idx] as Node2D
	var node: Node2D = CHUNK_SCENE.new()
	node.chunk_coord = idx
	node.world = self
	var cs: int = GameData.CELL_SIZE
	var n: int = CHUNK_SCENE.CHUNK_CELLS
	node.position = Vector2(idx.x * n * cs, idx.y * n * cs)
	add_child(node)
	if _fx != null:
		move_child(_fx, -1)
	_chunks[idx] = node
	return node


func _redraw_chunk_for_cell(cell: Vector2i) -> void:
	_get_chunk(_chunk_index(cell)).queue_redraw()
	# 探测器高亮随玩家移动，邻块可能需刷新
	if session != null:
		var det_r: int = int(session.effects().get("detector_radius", 0))
		if det_r > 0:
			var n: int = CHUNK_SCENE.CHUNK_CELLS
			for off in [Vector2i(-1, 0), Vector2i(1, 0), Vector2i(0, -1), Vector2i(0, 1)]:
				_get_chunk(_chunk_index(cell + off * n)).queue_redraw()


func _redraw_visible_chunks() -> void:
	var cs: int = GameData.CELL_SIZE
	var view: Rect2i = _view_grid_rect(cs)
	var n: int = CHUNK_SCENE.CHUNK_CELLS
	var cx0: int = int(floor(float(view.position.x) / float(n)))
	var cy0: int = int(floor(float(view.position.y) / float(n)))
	var cx1: int = int(floor(float(view.position.x + view.size.x - 1) / float(n)))
	var cy1: int = int(floor(float(view.position.y + view.size.y - 1) / float(n)))
	# 硬上限：避免异常情况下一次生成过多 chunk
	const MAX_SPAN: int = 14
	if cx1 - cx0 > MAX_SPAN:
		var mid: int = int((cx0 + cx1) / 2)
		cx0 = mid - MAX_SPAN / 2
		cx1 = cx0 + MAX_SPAN
	if cy1 - cy0 > MAX_SPAN:
		var midy: int = int((cy0 + cy1) / 2)
		cy0 = midy - MAX_SPAN / 2
		cy1 = cy0 + MAX_SPAN
	for cy in range(cy0, cy1 + 1):
		for cx in range(cx0, cx1 + 1):
			_get_chunk(Vector2i(cx, cy)).queue_redraw()


func _clear_chunks() -> void:
	for node in _chunks.values():
		if is_instance_valid(node):
			(node as Node).queue_free()
	_chunks.clear()


func grid_from_global(global_pos: Vector2) -> Vector2i:
	var local: Vector2 = get_global_transform().affine_inverse() * global_pos
	var cs: int = GameData.CELL_SIZE
	return Vector2i(int(floor(local.x / float(cs))), int(floor(local.y / float(cs))))


func _manhattan(a: Vector2i, b: Vector2i) -> int:
	return absi(a.x - b.x) + absi(a.y - b.y)
