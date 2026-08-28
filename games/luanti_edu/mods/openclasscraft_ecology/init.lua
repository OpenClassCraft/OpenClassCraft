-- OpenClassCraft Ecology
-- Persistent classroom-safe wildlife, plant growth, habitat observation, and
-- biome content designed for hands-on ecosystem lessons.

local MODNAME = minetest.get_current_modname()
local GRAVITY = -9.81
local ANIMAL_LIMIT = 6
local OBSERVATION_RADIUS = 10
local TWO_PI = math.pi * 2
local ANIMATIONS = {
	idle = {{x = 0.0, y = 1.9}, 1.0},
	walk = {{x = 2.0, y = 3.0}, 1.0},
	run = {{x = 3.1, y = 4.1}, 1.0},
	sit = {{x = 4.2, y = 5.2}, 1.0},
	graze = {{x = 5.3, y = 6.7}, 1.0},
}

local function protected(pos, player)
	local name = player and player:get_player_name() or ""
	return minetest.is_protected(pos, name)
end

local function consume_one(player, itemstack)
	if not minetest.is_creative_enabled(player:get_player_name()) then
		itemstack:take_item()
	end
	return itemstack
end

local animal_defs = {
	rabbit = {
		description = "Meadow Rabbit",
		mesh = "occ_rabbit.glb",
		textures = {"occ_rabbit_fur.png", "occ_rabbit_accent.png", "occ_rabbit_dark.png", "occ_animal_eyes.png"},
		walk_speed = 1.25,
		run_speed = 2.35,
		acceleration = 8,
		turn_speed = 6.5,
		hop_strength = 3.35,
		hop_interval = 0.62,
		collisionbox = {-0.34, 0, -0.48, 0.34, 1.35, 0.48},
		tameable = true,
		observation = "Rabbits are herbivores. They depend on ground cover for food and shelter.",
	},
	deer = {
		description = "Forest Deer",
		mesh = "occ_deer.glb",
		textures = {"occ_deer_fur.png", "occ_deer_accent.png", "occ_deer_dark.png", "occ_animal_eyes.png"},
		walk_speed = 1.15,
		run_speed = 2.65,
		acceleration = 5,
		turn_speed = 3.4,
		jump_strength = 4.0,
		collisionbox = {-0.40, 0, -0.72, 0.40, 2.30, 0.72},
		tameable = false,
		observation = "Deer are primary consumers. Their browsing can change which plants grow in a forest.",
	},
	fox = {
		description = "Companion Fox",
		mesh = "occ_fox.glb",
		textures = {"occ_fox_fur.png", "occ_fox_accent.png", "occ_fox_dark.png", "occ_animal_eyes.png"},
		walk_speed = 1.5,
		run_speed = 3.0,
		acceleration = 7,
		turn_speed = 5.2,
		jump_strength = 3.8,
		collisionbox = {-0.36, 0, -0.62, 0.36, 1.38, 0.62},
		tameable = true,
		observation = "Foxes are omnivores and predators that connect several levels of a food web.",
	},
}

local function set_animation(self, name)
	if self.animation_state == name then
		return
	end
	local animation = ANIMATIONS[name] or ANIMATIONS.idle
	self.object:set_animation(animation[1], animation[2], 0.18, true)
	self.animation_state = name
end

local function approach(current, target, amount)
	if current < target then
		return math.min(current + amount, target)
	end
	return math.max(current - amount, target)
end

local function smooth_yaw(current, target, amount)
	local difference = math.atan2(math.sin(target - current), math.cos(target - current))
	if math.abs(difference) <= amount then
		return target
	end
	return current + (difference > 0 and amount or -amount)
end

local function node_is_walkable(pos)
	local node = minetest.get_node_or_nil(pos)
	local def = node and minetest.registered_nodes[node.name]
	return def and def.walkable == true
end

local function navigation_ahead(pos, dx, dz)
	local length = math.sqrt(dx * dx + dz * dz)
	if length < 0.001 then
		return true, false
	end
	local ahead = {
		x = pos.x + dx / length * 0.62,
		y = pos.y,
		z = pos.z + dz / length * 0.62,
	}
	local floor = {x = ahead.x, y = ahead.y - 0.55, z = ahead.z}
	if not node_is_walkable(ahead) then
		return node_is_walkable(floor), false
	end
	local above = {x = ahead.x, y = ahead.y + 1.0, z = ahead.z}
	return not node_is_walkable(above), true
end

local function grounded(self, moveresult)
	if moveresult and moveresult.touching_ground ~= nil then
		return moveresult.touching_ground
	end
	local velocity = self.object:get_velocity() or {y = 0}
	return math.abs(velocity.y) < 0.08
end

local function stop_horizontal(self, def, dtime)
	local velocity = self.object:get_velocity() or {x = 0, y = 0, z = 0}
	local change = def.acceleration * dtime
	self.object:set_velocity({
		x = approach(velocity.x, 0, change),
		y = velocity.y,
		z = approach(velocity.z, 0, change),
	})
end

local function move_toward(self, def, dx, dz, speed, animation, dtime, moveresult)
	local distance = math.sqrt(dx * dx + dz * dz)
	if distance < 0.01 then
		stop_horizontal(self, def, dtime)
		set_animation(self, "idle")
		return false
	end
	local dir_x, dir_z = dx / distance, dz / distance
	local clear, needs_jump = navigation_ahead(self.object:get_pos(), dir_x, dir_z)
	if not clear then
		stop_horizontal(self, def, dtime)
		set_animation(self, "idle")
		return false
	end

	local velocity = self.object:get_velocity() or {x = 0, y = 0, z = 0}
	local change = def.acceleration * dtime
	velocity.x = approach(velocity.x, dir_x * speed, change)
	velocity.z = approach(velocity.z, dir_z * speed, change)
	local is_grounded = grounded(self, moveresult)
	if needs_jump and is_grounded and def.jump_strength then
		velocity.y = def.jump_strength
	elseif def.hop_strength and is_grounded then
		self.hop_timer = (self.hop_timer or 0) - dtime
		if self.hop_timer <= 0 then
			velocity.y = def.hop_strength
			self.hop_timer = def.hop_interval
		end
	end
	self.object:set_velocity(velocity)

	local target_yaw = math.atan2(dir_z, dir_x) - math.pi / 2
	local current_yaw = self.object:get_yaw() or target_yaw
	self.object:set_yaw(smooth_yaw(current_yaw, target_yaw, def.turn_speed * dtime))
	set_animation(self, animation)
	return true
end

local function teleport_near_owner(self, owner_pos)
	local offsets = {
		{x = 2, z = 0}, {x = -2, z = 0}, {x = 0, z = 2}, {x = 0, z = -2},
		{x = 2, z = 2}, {x = -2, z = 2}, {x = 2, z = -2}, {x = -2, z = -2},
	}
	for _, offset in ipairs(offsets) do
		local candidate = {x = owner_pos.x + offset.x, y = owner_pos.y, z = owner_pos.z + offset.z}
		if not node_is_walkable(candidate)
				and node_is_walkable({x = candidate.x, y = candidate.y - 0.55, z = candidate.z}) then
			self.object:set_pos(candidate)
			self.object:set_velocity({x = 0, y = 0, z = 0})
			return true
		end
	end
	return false
end

local function update_nametag(self)
	local label = ""
	if self.owner and self.owner ~= "" then
		label = animal_defs[self.kind].description .. " · " .. self.owner
		if self.staying then
			label = label .. " · staying"
		end
	end
	self.object:set_properties({nametag = label, nametag_color = "#EAF7EE"})
end

local function register_animal(kind)
	local def = animal_defs[kind]
	local entity_name = MODNAME .. ":" .. kind
	minetest.register_entity(entity_name, {
		initial_properties = {
			physical = true,
			collide_with_objects = true,
			collisionbox = def.collisionbox,
			selectionbox = def.collisionbox,
			visual = "mesh",
			mesh = def.mesh,
			textures = def.textures,
			visual_size = {x = 1, y = 1},
			static_save = true,
			stepheight = 1.1,
			hp_max = 10,
			makes_footstep_sound = true,
			backface_culling = true,
		},
		kind = kind,
		owner = "",
		staying = false,
		decision_timer = 0,
		move_dir_x = 0,
		move_dir_z = 0,
		idle_animation = "idle",
		animation_state = "",
		hop_timer = 0,

		on_activate = function(self, staticdata)
			self.object:set_armor_groups({immortal = 1})
			self.object:set_acceleration({x = 0, y = GRAVITY, z = 0})
			local data = staticdata ~= "" and minetest.deserialize(staticdata) or nil
			if type(data) == "table" then
				self.owner = type(data.owner) == "string" and data.owner or ""
				self.staying = data.staying == true
			end
			self.decision_timer = 0.4 + math.random() * 1.6
			update_nametag(self)
			set_animation(self, self.staying and "sit" or "idle")
		end,

		get_staticdata = function(self)
			return minetest.serialize({owner = self.owner, staying = self.staying})
		end,

		on_step = function(self, dtime, moveresult)
			local pos = self.object:get_pos()
			if not pos then
				return
			end
			if self.staying then
				stop_horizontal(self, def, dtime)
				set_animation(self, "sit")
				return
			end

			if self.owner and self.owner ~= "" then
				local owner = minetest.get_player_by_name(self.owner)
				local owner_pos = owner and owner:get_pos()
				if owner_pos then
					local dx = owner_pos.x - pos.x
					local dz = owner_pos.z - pos.z
					local distance = math.sqrt(dx * dx + dz * dz)
					if distance > 28 and teleport_near_owner(self, owner_pos) then
						set_animation(self, "idle")
						return
					elseif distance > 2.8 then
						local running = distance > 7
						move_toward(self, def, dx, dz,
							running and def.run_speed or def.walk_speed,
							running and "run" or "walk", dtime, moveresult)
						return
					elseif distance <= 2.8 then
						stop_horizontal(self, def, dtime)
						set_animation(self, "idle")
						return
					end
				end
			end

			self.decision_timer = self.decision_timer - dtime
			if self.decision_timer <= 0 then
				self.decision_timer = 2.2 + math.random() * 3.8
				local choice = math.random()
				if choice < 0.42 then
					self.move_dir_x, self.move_dir_z = 0, 0
					self.idle_animation = kind == "deer" and math.random() < 0.55 and "graze" or "idle"
				else
					local angle = math.random() * TWO_PI
					self.move_dir_x = math.cos(angle)
					self.move_dir_z = math.sin(angle)
					self.idle_animation = "idle"
				end
			end
			if self.move_dir_x ~= 0 or self.move_dir_z ~= 0 then
				if not move_toward(self, def, self.move_dir_x, self.move_dir_z,
						def.walk_speed * 0.72, "walk", dtime, moveresult) then
					self.move_dir_x, self.move_dir_z = 0, 0
					self.decision_timer = 0
				end
			else
				stop_horizontal(self, def, dtime)
				set_animation(self, self.idle_animation)
			end
		end,

		on_rightclick = function(self, clicker)
			local player_name = clicker:get_player_name()
			local itemstack = clicker:get_wielded_item()
			if def.tameable and itemstack:get_name() == MODNAME .. ":pet_treat" then
				if self.owner == "" or self.owner == player_name then
					self.owner = player_name
					self.staying = false
					clicker:set_wielded_item(consume_one(clicker, itemstack))
					update_nametag(self)
					minetest.chat_send_player(player_name,
						"[Ecology] " .. def.description .. " trusts you and will follow. Right-click again to ask it to stay.")
				else
					minetest.chat_send_player(player_name, "[Ecology] This companion already belongs to " .. self.owner .. ".")
				end
				return
			end
			if self.owner == player_name then
				self.staying = not self.staying
				update_nametag(self)
				minetest.chat_send_player(player_name,
					self.staying and "[Ecology] Companion will stay here." or "[Ecology] Companion will follow you.")
				return
			end
			minetest.chat_send_player(player_name, "[Field note] " .. def.observation)
		end,
	})

	minetest.register_craftitem(MODNAME .. ":spawn_" .. kind, {
		description = def.description .. " Habitat Egg\nPlace on open ground to introduce one animal",
		inventory_image = "occ_spawn_" .. kind .. ".png",
		groups = {craftitem = 1, ecology = 1, occ_classroom_safe = 1},
		on_place = function(itemstack, placer, pointed_thing)
			if not pointed_thing or pointed_thing.type ~= "node" then
				return itemstack
			end
			local pos = vector.add(pointed_thing.above, {x = 0, y = 0.2, z = 0})
			if protected(pos, placer) or minetest.get_node(pos).name ~= "air" then
				return itemstack
			end
			if minetest.add_entity(pos, entity_name) then
				return consume_one(placer, itemstack)
			end
			return itemstack
		end,
	})
end

for kind in pairs(animal_defs) do
	register_animal(kind)
end

minetest.register_craftitem(MODNAME .. ":pet_treat", {
	description = "Companion Treat\nUse on a rabbit or fox to make it your persistent companion",
	inventory_image = "default_apple.png^[colorize:#F0A84A:80",
	groups = {craftitem = 1, ecology = 1, occ_classroom_safe = 1},
})

local function register_plant(name, description, texture, groups, selection_box)
	groups = groups or {}
	groups.snappy = 3
	groups.flora = 1
	groups.attached_node = 1
	groups.dig_immediate = 3
	groups.ecology = 1
	minetest.register_node(MODNAME .. ":" .. name, {
		description = description,
		drawtype = "plantlike",
		waving = 1,
		tiles = {texture},
		inventory_image = texture,
		wield_image = texture,
		paramtype = "light",
		sunlight_propagates = true,
		walkable = false,
		buildable_to = true,
		groups = groups,
		sounds = default.node_sound_leaves_defaults(),
		selection_box = {type = "fixed", fixed = selection_box or {-0.3, -0.5, -0.3, 0.3, 0.35, 0.3}},
	})
end

register_plant("pollinator_flower", "Pollinator Flower", "openclasscraft_flower_yellow.png", {flower = 1})
register_plant("meadow_clover", "Meadow Clover", "openclasscraft_flower_pink.png^[resize:32x32", {grass = 1},
	{-0.38, -0.5, -0.38, 0.38, -0.12, 0.38})
register_plant("wetland_reed", "Wetland Reed", "default_papyrus.png^[colorize:#58A96B:45", {grass = 1},
	{-0.28, -0.5, -0.28, 0.28, 0.5, 0.28})

minetest.register_node(MODNAME .. ":seedling", {
	description = "Learning Garden Seedling",
	drawtype = "plantlike",
	tiles = {"default_grass_2.png^[colorize:#71C968:70"},
	inventory_image = "default_grass_2.png^[colorize:#71C968:70",
	wield_image = "default_grass_2.png^[colorize:#71C968:70",
	paramtype = "light",
	sunlight_propagates = true,
	walkable = false,
	buildable_to = true,
	groups = {snappy = 3, attached_node = 1, dig_immediate = 3, ecology = 1},
	on_construct = function(pos)
		minetest.get_node_timer(pos):start(math.random(35, 55))
	end,
	on_timer = function(pos)
		local light = minetest.get_node_light(pos, 0.5) or 0
		local below = minetest.get_node_or_nil(vector.add(pos, {x = 0, y = -1, z = 0}))
		if below and minetest.get_item_group(below.name, "soil") > 0 and light >= 11 then
			minetest.swap_node(pos, {name = MODNAME .. ":pollinator_flower"})
			return false
		end
		return true
	end,
})

minetest.register_craftitem(MODNAME .. ":learning_seeds", {
	description = "Learning Garden Seeds\nPlant on soil and observe light-dependent growth",
	inventory_image = "default_grass_1.png^[colorize:#E4B64B:120",
	groups = {craftitem = 1, ecology = 1, occ_classroom_safe = 1},
	on_place = function(itemstack, placer, pointed_thing)
		if not pointed_thing or pointed_thing.type ~= "node" then
			return itemstack
		end
		local soil = minetest.get_node_or_nil(pointed_thing.under)
		local pos = pointed_thing.above
		if not soil or minetest.get_item_group(soil.name, "soil") == 0 or protected(pos, placer) then
			return itemstack
		end
		local target = minetest.get_node_or_nil(pos)
		if target and target.name == "air" then
			minetest.set_node(pos, {name = MODNAME .. ":seedling"})
			minetest.get_node_timer(pos):start(math.random(35, 55))
			return consume_one(placer, itemstack)
		end
		return itemstack
	end,
})

minetest.register_tool(MODNAME .. ":field_journal", {
	description = "Ecosystem Field Journal\nUse to survey living things within 10 nodes",
	inventory_image = "default_book_written.png^[colorize:#4DAE68:65",
	groups = {tool = 1, ecology = 1},
	on_use = function(itemstack, user)
		local pos = user:get_pos()
		if not pos then
			return itemstack
		end
		local minp = vector.subtract(pos, OBSERVATION_RADIUS)
		local maxp = vector.add(pos, OBSERVATION_RADIUS)
		local plants = minetest.find_nodes_in_area(minp, maxp, {"group:flora", "group:grass"})
		local trees = minetest.find_nodes_in_area(minp, maxp, {"group:tree"})
		local water = minetest.find_nodes_in_area(minp, maxp, {"group:water"})
		local species = {}
		local animal_count = 0
		for _, object in ipairs(minetest.get_objects_inside_radius(pos, OBSERVATION_RADIUS)) do
			local entity = object:get_luaentity()
			if entity and animal_defs[entity.kind] then
				animal_count = animal_count + 1
				species[entity.kind] = true
			end
		end
		local species_count = 0
		for _ in pairs(species) do
			species_count = species_count + 1
		end
		local score = math.min(100, math.floor(#plants / 4) + math.floor(#trees / 3) +
			math.floor(#water / 8) + species_count * 15)
		minetest.chat_send_player(user:get_player_name(), string.format(
			"[Field survey] Plants: %d · Tree nodes: %d · Water nodes: %d · Animals: %d · Species: %d · Habitat score: %d/100",
			#plants, #trees, #water, animal_count, species_count, score))
		return itemstack
	end,
})

minetest.register_biome({
	name = "openclasscraft_pollinator_meadow",
	node_top = "default:dirt_with_grass",
	depth_top = 1,
	node_filler = "default:dirt",
	depth_filler = 3,
	node_riverbed = "default:sand",
	depth_riverbed = 2,
	y_min = 1,
	y_max = 90,
	heat_point = 58,
	humidity_point = 62,
})

minetest.register_biome({
	name = "openclasscraft_monsoon_forest",
	node_top = "default:dirt_with_rainforest_litter",
	depth_top = 1,
	node_filler = "default:dirt",
	depth_filler = 4,
	node_riverbed = "default:sand",
	depth_riverbed = 3,
	y_min = 1,
	y_max = 110,
	heat_point = 82,
	humidity_point = 88,
})

minetest.register_biome({
	name = "openclasscraft_freshwater_wetland",
	node_top = "default:dirt_with_grass",
	depth_top = 1,
	node_filler = "default:dirt",
	depth_filler = 4,
	node_riverbed = "default:sand",
	depth_riverbed = 3,
	y_min = -1,
	y_max = 12,
	heat_point = 72,
	humidity_point = 96,
})

minetest.register_decoration({
	name = MODNAME .. ":pollinator_patches",
	deco_type = "simple",
	place_on = {"default:dirt_with_grass"},
	sidelen = 16,
	fill_ratio = 0.018,
	biomes = {"openclasscraft_pollinator_meadow"},
	y_min = 1,
	y_max = 90,
	decoration = MODNAME .. ":pollinator_flower",
	spawn_by = "default:dirt_with_grass",
	num_spawn_by = 1,
})

minetest.register_decoration({
	name = MODNAME .. ":wetland_reeds",
	deco_type = "simple",
	place_on = {"default:dirt_with_grass", "default:dirt"},
	sidelen = 16,
	fill_ratio = 0.03,
	biomes = {"openclasscraft_freshwater_wetland"},
	y_min = -1,
	y_max = 12,
	decoration = MODNAME .. ":wetland_reed",
})

local function local_animal_count(pos)
	local count = 0
	for _, object in ipairs(minetest.get_objects_inside_radius(pos, 24)) do
		local entity = object:get_luaentity()
		if entity and animal_defs[entity.kind] then
			count = count + 1
		end
	end
	return count
end

minetest.register_abm({
	label = "OpenClassCraft balanced wildlife spawning",
	nodenames = {"default:dirt_with_grass", "default:dirt_with_rainforest_litter"},
	neighbors = {"air"},
	interval = 45,
	chance = 1800,
	catch_up = false,
	action = function(pos)
		local above = vector.add(pos, {x = 0, y = 1, z = 0})
		if minetest.get_node(above).name ~= "air" or (minetest.get_node_light(above, 0.5) or 0) < 10 or
			local_animal_count(above) >= ANIMAL_LIMIT then
			return
		end
		local biome = minetest.get_biome_data(pos)
		local kind = "rabbit"
		if biome and (biome.humidity or 0) > 78 then
			kind = "deer"
		elseif math.random(1, 8) == 1 then
			kind = "fox"
		end
		minetest.add_entity(vector.add(above, {x = 0, y = 0.2, z = 0}), MODNAME .. ":" .. kind)
	end,
})

minetest.register_craft({
	output = MODNAME .. ":pet_treat 4",
	recipe = {{"default:apple", "default:apple"}},
})

minetest.register_craft({
	output = MODNAME .. ":field_journal",
	recipe = {{"default:book", "default:stick"}},
})

minetest.log("action", "[OpenClassCraft Ecology] Loaded persistent wildlife, plants, habitats, and field tools")
