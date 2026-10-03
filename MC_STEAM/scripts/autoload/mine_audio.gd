extends Node
## 程序化挖矿音效（无需外部音频文件）

const HIT_POOL: int = 10
const SAMPLE_RATE: int = 22050

var _hit_players: Array[AudioStreamPlayer] = []
var _hit_idx: int = 0
var _break_player: AudioStreamPlayer
var _level_player: AudioStreamPlayer
var _hit_streams: Array[AudioStreamWAV] = []
var _break_streams: Array[AudioStreamWAV] = []
var _level_stream: AudioStreamWAV
var _amb_a: AudioStreamPlayer
var _amb_b: AudioStreamPlayer
var _amb_front: AudioStreamPlayer
var _amb_layer_idx: int = -1


func _ready() -> void:
	for i in range(3):
		_hit_streams.append(_build_pick_hit(0.85 + float(i) * 0.08))
	for i in range(2):
		_break_streams.append(_build_break(0.9 + float(i) * 0.15))
	for _i in range(HIT_POOL):
		var p := AudioStreamPlayer.new()
		p.bus = &"Master"
		add_child(p)
		_hit_players.append(p)
	_break_player = AudioStreamPlayer.new()
	_break_player.bus = &"Master"
	add_child(_break_player)
	_level_stream = _build_level_up()
	_level_player = AudioStreamPlayer.new()
	_level_player.bus = &"Master"
	add_child(_level_player)
	if not GameEvents.mining_pick_hit.is_connected(_on_pick_hit):
		GameEvents.mining_pick_hit.connect(_on_pick_hit)
	if not GameEvents.cell_mined.is_connected(_on_cell_mined):
		GameEvents.cell_mined.connect(_on_cell_mined)
	if not GameEvents.layer_changed.is_connected(_on_layer_changed):
		GameEvents.layer_changed.connect(_on_layer_changed)
	if not GameEvents.settings_changed.is_connected(_sync_ambience_enabled):
		GameEvents.settings_changed.connect(_sync_ambience_enabled)
	_amb_a = _make_amb_player()
	_amb_b = _make_amb_player()
	_amb_front = _amb_a
	_set_ambience_layer(0, true)


func _on_pick_hit(_grid_pos: Vector2i, strength: float) -> void:
	play_pick_hit(strength)


func _on_cell_mined(_grid_pos: Vector2i, _ore_color: Color, _ore_glow: Color, gain: int) -> void:
	var w: float = clampf(float(gain) / 120.0, 0.35, 1.0)
	play_break(w)


func play_pick_hit(strength: float = 0.7) -> void:
	if not UserSettings.sfx_enabled:
		return
	var player: AudioStreamPlayer = _hit_players[_hit_idx % _hit_players.size()]
	_hit_idx += 1
	var si: int = int(clampf(strength, 0.0, 1.0) * float(_hit_streams.size() - 1))
	player.stream = _hit_streams[si]
	player.volume_db = lerpf(-11.0, -2.0, strength)
	player.pitch_scale = lerpf(0.92, 1.12, strength)
	player.play()


func play_level_up() -> void:
	if not UserSettings.sfx_enabled:
		return
	_level_player.stream = _level_stream
	_level_player.volume_db = -4.0
	_level_player.pitch_scale = 1.0
	_level_player.play()


func _make_amb_player() -> AudioStreamPlayer:
	var p := AudioStreamPlayer.new()
	p.bus = &"Master"
	p.volume_db = -22.0
	add_child(p)
	return p


func _on_layer_changed(title: String, _progress: float) -> void:
	var idx: int = _layer_index_for_title(title)
	if idx == _amb_layer_idx:
		return
	_set_ambience_layer(idx, false)


func _layer_index_for_title(title: String) -> int:
	for i in range(GameData.DEPTH_RANGES.size()):
		if str(GameData.DEPTH_RANGES[i].get("title", "")) == title:
			return i
	return GameData.DEPTH_RANGES.size() - 1


func _set_ambience_layer(layer_idx: int, instant: bool) -> void:
	_amb_layer_idx = layer_idx
	if not UserSettings.music_enabled:
		_amb_a.stop()
		_amb_b.stop()
		return
	var stream: AudioStream = _resolve_ambience_stream(layer_idx)
	var back: AudioStreamPlayer = _amb_b if _amb_front == _amb_a else _amb_a
	back.stream = stream
	back.volume_db = -22.0
	back.play()
	if instant:
		_amb_front.stop()
		_amb_front = back
		_amb_front.volume_db = -22.0
		return
	var front: AudioStreamPlayer = _amb_front
	var tw := create_tween()
	tw.set_parallel(true)
	tw.tween_property(front, "volume_db", -40.0, 0.7)
	tw.tween_property(back, "volume_db", -22.0, 0.7)
	tw.chain().tween_callback(func() -> void:
		front.stop()
		_amb_front = back
	)


func _sync_ambience_enabled() -> void:
	if UserSettings.music_enabled:
		_set_ambience_layer(maxi(_amb_layer_idx, 0), true)
	else:
		_amb_a.stop()
		_amb_b.stop()


func _resolve_ambience_stream(layer_idx: int) -> AudioStream:
	var title: String = str(GameData.DEPTH_RANGES[mini(layer_idx, GameData.DEPTH_RANGES.size() - 1)].get("title", ""))
	var candidates: PackedStringArray = PackedStringArray([
		"res://audio/layers/%02d.ogg" % layer_idx,
		"res://audio/layers/%02d.wav" % layer_idx,
		"res://audio/layers/%s.ogg" % title,
		"res://audio/ambience.ogg",
		"res://audio/ambience.wav",
	])
	for path in candidates:
		if not ResourceLoader.exists(path):
			continue
		var loaded: Resource = load(path)
		if loaded is AudioStream:
			return loaded as AudioStream
	return _build_ambience_loop(layer_idx)


func _build_ambience_loop(layer_idx: int) -> AudioStreamWAV:
	var depth_t: float = 1.0 - float(layer_idx) / float(maxi(GameData.DEPTH_RANGES.size() - 1, 1))
	var base_hz: float = lerpf(42.0, 92.0, depth_t)
	var duration: float = 3.0
	var n: int = int(SAMPLE_RATE * duration)
	var pcm := PackedFloat32Array()
	pcm.resize(n)
	var rng := RandomNumberGenerator.new()
	rng.seed = layer_idx * 991 + 17
	for i in range(n):
		var t: float = float(i) / float(SAMPLE_RATE)
		var wobble: float = sin(TAU * 0.07 * t + float(layer_idx)) * 3.0
		var f: float = base_hz + wobble
		var hum: float = sin(TAU * f * t) * 0.22
		var sub: float = sin(TAU * f * 0.5 * t) * 0.12
		var noise: float = rng.randf_range(-1.0, 1.0) * 0.04
		pcm[i] = hum + sub + noise
	var wav := _float_to_wav(pcm)
	wav.loop_mode = AudioStreamWAV.LOOP_FORWARD
	return wav


func play_break(weight: float = 0.6) -> void:
	if not UserSettings.sfx_enabled:
		return
	var si: int = int(clampf(weight, 0.0, 1.0) * float(_break_streams.size() - 1))
	_break_player.stream = _break_streams[si]
	_break_player.volume_db = lerpf(-10.0, -2.0, weight)
	_break_player.pitch_scale = lerpf(0.88, 1.05, weight)
	_break_player.play()


func _build_level_up() -> AudioStreamWAV:
	var duration: float = 0.35
	var n: int = int(SAMPLE_RATE * duration)
	var pcm := PackedFloat32Array()
	pcm.resize(n)
	for i in range(n):
		var t: float = float(i) / float(SAMPLE_RATE)
		var env: float = exp(-t * 8.0)
		var f0: float = lerpf(320.0, 880.0, clampf(t / 0.28, 0.0, 1.0))
		var wave: float = sin(TAU * f0 * t) * 0.55 + sin(TAU * f0 * 2.0 * t) * 0.15
		pcm[i] = wave * env
	return _float_to_wav(pcm)


func _build_pick_hit(tone: float) -> AudioStreamWAV:
	var duration: float = 0.07
	var n: int = int(SAMPLE_RATE * duration)
	var pcm := PackedFloat32Array()
	pcm.resize(n)
	var rng := RandomNumberGenerator.new()
	rng.seed = int(tone * 1000.0)
	for i in range(n):
		var t: float = float(i) / float(SAMPLE_RATE)
		var env: float = exp(-t * 55.0)
		var noise: float = rng.randf_range(-1.0, 1.0)
		var ping: float = sin(TAU * (180.0 + tone * 120.0) * t) * 0.35
		pcm[i] = (noise * 0.55 + ping) * env * 0.85
	return _float_to_wav(pcm)


func _build_break(weight: float) -> AudioStreamWAV:
	var duration: float = 0.22 + weight * 0.12
	var n: int = int(SAMPLE_RATE * duration)
	var pcm := PackedFloat32Array()
	pcm.resize(n)
	var rng := RandomNumberGenerator.new()
	rng.seed = int(weight * 777.0)
	for i in range(n):
		var t: float = float(i) / float(SAMPLE_RATE)
		var env: float = exp(-t * (12.0 + weight * 8.0))
		var noise: float = rng.randf_range(-1.0, 1.0)
		var rumble: float = sin(TAU * (60.0 + weight * 40.0) * t) * 0.25
		pcm[i] = (noise * 0.7 + rumble) * env
	return _float_to_wav(pcm)


func _float_to_wav(samples: PackedFloat32Array) -> AudioStreamWAV:
	var wav := AudioStreamWAV.new()
	wav.mix_rate = SAMPLE_RATE
	wav.format = AudioStreamWAV.FORMAT_16_BITS
	wav.stereo = false
	var bytes := PackedByteArray()
	bytes.resize(samples.size() * 2)
	for i in range(samples.size()):
		var s: int = int(clampf(samples[i], -1.0, 1.0) * 32767.0)
		if s < 0:
			s += 65536
		bytes[i * 2] = s & 0xFF
		bytes[i * 2 + 1] = (s >> 8) & 0xFF
	wav.data = bytes
	return wav
