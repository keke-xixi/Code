extends Node2D

const CHUNK_CELLS: int = 8

var chunk_coord: Vector2i = Vector2i.ZERO
var world: Node2D


func _draw() -> void:
	if world == null or not world.has_method("render_cell"):
		return
	var cs: int = GameData.CELL_SIZE
	var ox: int = chunk_coord.x * CHUNK_CELLS
	var oy: int = chunk_coord.y * CHUNK_CELLS
	for dy in range(CHUNK_CELLS):
		for dx in range(CHUNK_CELLS):
			world.call("render_cell", self, ox + dx, oy + dy, cs, chunk_coord)
