extends Node
## 程序化挖矿音效（无需外部音频文件）

const HIT_POOL: int = 6
const SAMPLE_RATE: int = 22050

var _hit_players: Array[AudioStreamPlayer] = []
var _hit_idx: int = 0
var _break_player: AudioStreamPlayer
var _hit_streams: Array[AudioStreamWAV] = []
var _break_streams: Array[AudioStreamWAV] = []


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
	if not GameEvents.mining_pick_hit.is_connected(_on_pick_hit):
		GameEvents.mining_pick_hit.connect(_on_pick_hit)
	if not GameEvents.cell_mined.is_connected(_on_cell_mined):
		GameEvents.cell_mined.connect(_on_cell_mined)


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


func play_break(weight: float = 0.6) -> void:
	if not UserSettings.sfx_enabled:
		return
	var si: int = int(clampf(weight, 0.0, 1.0) * float(_break_streams.size() - 1))
	_break_player.stream = _break_streams[si]
	_break_player.volume_db = lerpf(-10.0, -2.0, weight)
	_break_player.pitch_scale = lerpf(0.88, 1.05, weight)
	_break_player.play()


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
