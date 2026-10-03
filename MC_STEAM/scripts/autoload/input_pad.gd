extends Node
## 为 InputMap 补充手柄 D-Pad / 左摇杆（可重复执行，会去重）

const _PAD_BINDS: Array = [
	["move_up", JOY_BUTTON_DPAD_UP],
	["move_down", JOY_BUTTON_DPAD_DOWN],
	["move_left", JOY_BUTTON_DPAD_LEFT],
	["move_right", JOY_BUTTON_DPAD_RIGHT],
	["toggle_shop", JOY_BUTTON_Y],
	["absorb", JOY_BUTTON_X],
	["toggle_settings", JOY_BUTTON_BACK],
	["save_game", JOY_BUTTON_START],
]

const _AXIS_BINDS: Array = [
	["move_left", JOY_AXIS_LEFT_X, -1.0],
	["move_right", JOY_AXIS_LEFT_X, 1.0],
	["move_up", JOY_AXIS_LEFT_Y, -1.0],
	["move_down", JOY_AXIS_LEFT_Y, 1.0],
]


func _ready() -> void:
	_apply_pad_binds()


func _apply_pad_binds() -> void:
	for row in _PAD_BINDS:
		_add_button_if_missing(str(row[0]), int(row[1]))
	for axis_row in _AXIS_BINDS:
		_add_axis_if_missing(str(axis_row[0]), int(axis_row[1]), float(axis_row[2]))


func _add_button_if_missing(action: String, button: int) -> void:
	if not InputMap.has_action(action):
		return
	for ev in InputMap.action_get_events(action):
		if ev is InputEventJoypadButton and (ev as InputEventJoypadButton).button_index == button:
			return
	var jb := InputEventJoypadButton.new()
	jb.button_index = button
	InputMap.action_add_event(action, jb)


func _add_axis_if_missing(action: String, axis: int, axis_value: float) -> void:
	if not InputMap.has_action(action):
		return
	for ev in InputMap.action_get_events(action):
		if ev is InputEventJoypadMotion:
			var jm: InputEventJoypadMotion = ev as InputEventJoypadMotion
			if jm.axis == axis and is_equal_approx(jm.axis_value, axis_value):
				return
	var jm := InputEventJoypadMotion.new()
	jm.axis = axis
	jm.axis_value = axis_value
	InputMap.action_add_event(action, jm)
