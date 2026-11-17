extends Node2D
class_name WeatherSystem

@export var rain_particles_path: NodePath
@export var night_modulate_path: NodePath
@export var lightning_min_interval: float = 20.0
@export var lightning_max_interval: float = 38.0

var _lightning_timer: float = 22.0
var _flash_alpha: float = 0.0
var _base_night_color := Color(0.38, 0.44, 0.66, 1.0)

@onready var rain_particles: GPUParticles2D = get_node_or_null(rain_particles_path)
@onready var night_modulate: CanvasModulate = get_node_or_null(night_modulate_path)


func _ready() -> void:
	if night_modulate:
		night_modulate.color = _base_night_color


func _process(delta: float) -> void:
	_lightning_timer -= delta
	if _lightning_timer <= 0.0:
		_lightning_timer = randf_range(lightning_min_interval, lightning_max_interval)
		_flash_alpha = 0.55

	if _flash_alpha > 0.0:
		_flash_alpha = maxf(0.0, _flash_alpha - delta * 1.5)
		if night_modulate:
			night_modulate.color = _base_night_color.lerp(Color(0.88, 0.92, 1.0, 1.0), _flash_alpha)
