extends CharacterBody2D
class_name PlayerController

signal interaction_prompt_changed(prompt_text: String)
signal location_inspected(title: String, subtitle: String, body: String)
signal mounted_state_changed(is_mounted: bool)

@export var walk_speed: float = 88.0
@export var run_speed: float = 158.0
@export var phone_idle_delay: float = 3.5

var facing: String = "down"
var is_mounted: bool = false
var is_sitting: bool = false
var idle_timer: float = 0.0
var gait_phase: float = 0.0
var active_motorcycle: MotorcycleController = null
var nearby_interactables: Array[InteractableObject] = []

@onready var sprite: AnimatedSprite2D = $AnimatedSprite2D
@onready var interaction_area: Area2D = $InteractionArea


func _ready() -> void:
	if interaction_area:
		interaction_area.area_entered.connect(_on_area_entered)
		interaction_area.area_exited.connect(_on_area_exited)


func _physics_process(delta: float) -> void:
	if is_mounted:
		if active_motorcycle:
			global_position = active_motorcycle.global_position
		if Input.is_action_just_pressed("interact"):
			_try_dismount()
		return

	var input_vec := Input.get_vector("move_left", "move_right", "move_up", "move_down")

	if is_sitting:
		if input_vec.length() > 0.1 or Input.is_action_just_pressed("interact"):
			is_sitting = false
			_update_animation(Vector2.ZERO, false)
		return

	if Input.is_action_just_pressed("interact"):
		_handle_interact()

	var is_running := Input.is_action_pressed("run")
	var target_speed := run_speed if is_running else walk_speed

	if input_vec.length() > 0.01:
		velocity = input_vec.normalized() * target_speed
		idle_timer = 0.0
		gait_phase += target_speed * delta * 0.14
		_update_facing(input_vec)
		move_and_slide()
	else:
		velocity = Vector2.ZERO
		idle_timer += delta

	_update_animation(input_vec, is_running)


func _update_facing(dir: Vector2) -> void:
	if absf(dir.x) > absf(dir.y):
		facing = "left" if dir.x < 0.0 else "right"
	else:
		facing = "up" if dir.y < 0.0 else "down"


func _update_animation(dir: Vector2, is_running: bool) -> void:
	if not sprite or not sprite.sprite_frames:
		return
	var anim := "idle_" + facing
	if is_sitting:
		anim = "sit_" + facing
	elif dir.length() > 0.01:
		anim = ("run_" if is_running else "walk_") + facing
	elif idle_timer >= phone_idle_delay:
		anim = "phone_idle"

	if sprite.sprite_frames.has_animation(anim):
		sprite.play(anim)


func _handle_interact() -> void:
	if active_motorcycle and not is_mounted:
		mount_motorcycle(active_motorcycle)
		return

	var nearest := _get_nearest_interactable()
	if nearest:
		if nearest.kind == InteractableObject.Kind.BENCH:
			is_sitting = true
			global_position = nearest.seat_marker_position()
			facing = nearest.seat_facing
		else:
			location_inspected.emit(nearest.title, nearest.district_name, nearest.description)


func mount_motorcycle(moto: MotorcycleController) -> void:
	if is_mounted:
		return
	is_mounted = true
	is_sitting = false
	active_motorcycle = moto
	moto.set_rider_mounted(true)
	visible = false
	$CollisionShape2D.disabled = true
	mounted_state_changed.emit(true)
	interaction_prompt_changed.emit("[E] Get off motorcycle")


func _try_dismount() -> void:
	if not active_motorcycle:
		return
	if absf(active_motorcycle.current_speed) > 95.0:
		return
	is_mounted = false
	active_motorcycle.set_rider_mounted(false)
	var side_offset := Vector2.LEFT.rotated(active_motorcycle.rotation) * 32.0
	global_position = active_motorcycle.global_position + side_offset
	visible = true
	$CollisionShape2D.disabled = false
	mounted_state_changed.emit(false)
	_refresh_prompt()


func _get_nearest_interactable() -> InteractableObject:
	var best: InteractableObject = null
	var best_dist := INF
	for item in nearby_interactables:
		if is_instance_valid(item):
			var d := global_position.distance_squared_to(item.global_position)
			if d < best_dist:
				best_dist = d
				best = item
	return best


func _refresh_prompt() -> void:
	if is_mounted:
		interaction_prompt_changed.emit("[E] Get off motorcycle")
		return
	if active_motorcycle:
		interaction_prompt_changed.emit("[E] Ride Motorcycle")
		return
	var nearest := _get_nearest_interactable()
	if nearest:
		interaction_prompt_changed.emit("[E] " + nearest.prompt_label)
	else:
		interaction_prompt_changed.emit("")


func _on_area_entered(area: Area2D) -> void:
	if area is InteractableObject:
		nearby_interactables.append(area)
		_refresh_prompt()
	elif area.get_parent() is MotorcycleController:
		active_motorcycle = area.get_parent() as MotorcycleController
		_refresh_prompt()


func _on_area_exited(area: Area2D) -> void:
	if area is InteractableObject:
		nearby_interactables.erase(area)
		_refresh_prompt()
	elif area.get_parent() == active_motorcycle and not is_mounted:
		active_motorcycle = null
		_refresh_prompt()
