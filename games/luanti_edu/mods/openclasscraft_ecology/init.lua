-- OpenClassCraft Ecology
-- Persistent classroom-safe wildlife, plant growth, habitat observation, and
-- biome content designed for hands-on ecosystem lessons.

local MODNAME = minetest.get_current_modname()
local GRAVITY = -9.81
local ANIMAL_LIMIT = 6
local OBSERVATION_RADIUS = 10
local directions = {
	{x = 1, y = 0, z = 0},
	{x = -1, y = 0, z = 0},
	{x = 0, y = 0, z = 1},
	{x = 0, y = 0, z = -1},
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

local function register_model_node(name, description, color, boxes)
	local texture = "default_clay.png^[colorize:" .. color .. ":175"
	minetest.register_node(MODNAME .. ":" .. name .. "_model", {
		description = description,
		drawtype = "nodebox",
		tiles = {texture},
		paramtype = "light",
		sunlight_propagates = true,
		walkable = false,
		groups = {not_in_creative_inventory = 1},
		node_box = {type = "fixed", fixed = boxes},
	})
end

register_model_node("rabbit", "Rabbit Model", "#C99A70", {
	{-0.34, -0.35, -0.26, 0.22, 0.08, 0.26},
	{0.12, -0.18, -0.24, 0.46, 0.18, 0.24},
	{0.20, 0.12, -0.20, 0.31, 0.48, -0.05},
	{0.20, 0.12, 0.05, 0.31, 0.48, 0.20},
	{-0.38, -0.44, -0.22, -0.16, -0.30, -0.05},
	{-0.38, -0.44, 0.05, -0.16, -0.30, 0.22},
	{-0.48, -0.18, -0.13, -0.31, 0.00, 0.13},
})

register_model_node("deer", "Deer Model", "#9B6B43", {
	{-0.38, -0.10, -0.22, 0.28, 0.28, 0.22},
	{0.22, 0.10, -0.16, 0.46, 0.40, 0.16},
	{0.34, 0.34, -0.20, 0.46, 0.48, -0.04},
	{0.34, 0.34, 0.04, 0.46, 0.48, 0.20},
	{-0.30, -0.48, -0.18, -0.17, -0.08, -0.05},
	{-0.30, -0.48, 0.05, -0.17, -0.08, 0.18},
	{0.12, -0.48, -0.18, 0.25, -0.08, -0.05},
	{0.12, -0.48, 0.05, 0.25, -0.08, 0.18},
})

register_model_node("fox", "Fox Model", "#D56D32", {
	{-0.34, -0.28, -0.24, 0.26, 0.12, 0.24},
	{0.20, -0.14, -0.22, 0.48, 0.16, 0.22},
	{0.29, 0.12, -0.20, 0.43, 0.40, -0.06},
	{0.29, 0.12, 0.06, 0.43, 0.40, 0.20},
	{-0.28, -0.46, -0.18, -0.13, -0.26, -0.04},
	{-0.28, -0.46, 0.04, -0.13, -0.26, 0.18},
	{0.08, -0.46, -0.18, 0.23, -0.26, -0.04},
	{0.08, -0.46, 0.04, 0.23, -0.26, 0.18},
	{-0.50, -0.16, -0.13, -0.28, 0.04, 0.13},
})

local animal_defs = {
	rabbit = {
		description = "Meadow Rabbit",
		speed = 1.5,
		size = {x = 0.8, y = 0.8},
		collisionbox = {-0.32, -0.5, -0.28, 0.32, 0.2, 0.28},
		tameable = true,
		observation = "Rabbits are herbivores. They depend on ground cover for food and shelter.",
	},
	deer = {
		description = "Forest Deer",
		speed = 1.2,
		size = {x = 1.05, y = 1.45},
		collisionbox = {-0.38, -0.5, -0.28, 0.38, 0.75, 0.28},
		tameable = false,
		observation = "Deer are primary consumers. Their browsing can change which plants grow in a forest.",
	},
	fox = {
		description = "Companion Fox",
		speed = 1.65,
		size = {x = 0.95, y = 0.95},
		collisionbox = {-0.36, -0.5, -0.26, 0.36, 0.28, 0.26},
		tameable = true,
		observation = "Foxes are omnivores and predators that connect several levels of a food web.",
	},
}

local function set_horizontal_velocity(self, x, z)
	local velocity = self.object:get_velocity() or {x = 0, y = 0, z = 0}
	self.object:set_velocity({x = x, y = velocity.y, z = z})
end

local function safe_ground_ahead(pos, dx, dz)
	local ahead = {x = pos.x + dx, y = pos.y, z = pos.z + dz}
	local floor = {x = ahead.x, y = ahead.y - 0.55, z = ahead.z}
	local body = minetest.get_node_or_nil(ahead)
	local below = minetest.get_node_or_nil(floor)
	if not body or not below then
		return false
	end
	local body_def = minetest.registered_nodes[body.name]
	local floor_def = minetest.registered_nodes[below.name]
	return body_def and not body_def.walkable and floor_def and floor_def.walkable
end

local function update_nametag(self)
	local label = animal_defs[self.kind].description
	if self.owner and self.owner ~= "" then
		label = label .. " · " .. self.owner
	end
	if self.staying then
		label = label .. " · staying"
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
			visual = "wielditem",
			wield_item = MODNAME .. ":" .. kind .. "_model",
			visual_size = def.size,
			static_save = true,
			stepheight = 1.1,
			hp_max = 10,
		},
		kind = kind,
		owner = "",
		staying = false,
		decision_timer = 0,
		move_x = 0,
		move_z = 0,

		on_activate = function(self, staticdata)
			self.object:set_armor_groups({immortal = 1})
			self.object:set_acceleration({x = 0, y = GRAVITY, z = 0})
			local data = staticdata ~= "" and minetest.deserialize(staticdata) or nil
			if type(data) == "table" then
				self.owner = type(data.owner) == "string" and data.owner or ""
				self.staying = data.staying == true
			end
			self.decision_timer = math.random() * 2
			update_nametag(self)
		end,

		get_staticdata = function(self)
			return minetest.serialize({owner = self.owner, staying = self.staying})
		end,

		on_step = function(self, dtime)
			local pos = self.object:get_pos()
			if not pos then
				return
			end
			if self.staying then
				set_horizontal_velocity(self, 0, 0)
				return
			end

			if self.owner and self.owner ~= "" then
				local owner = minetest.get_player_by_name(self.owner)
				local owner_pos = owner and owner:get_pos()
				if owner_pos then
					local dx = owner_pos.x - pos.x
					local dz = owner_pos.z - pos.z
					local distance = math.sqrt(dx * dx + dz * dz)
					if distance > 2.2 and distance < 24 then
						local move_x = dx / distance * def.speed
						local move_z = dz / distance * def.speed
						if safe_ground_ahead(pos, move_x * 0.5, move_z * 0.5) then
							set_horizontal_velocity(self, move_x, move_z)
							self.object:set_yaw(math.atan2(move_z, move_x) - math.pi / 2)
						else
							set_horizontal_velocity(self, 0, 0)
						end
						return
					elseif distance <= 2.2 then
						set_horizontal_velocity(self, 0, 0)
						return
					end
				end
			end

			self.decision_timer = self.decision_timer - dtime
			if self.decision_timer <= 0 then
				self.decision_timer = 2.5 + math.random() * 3.5
				if math.random() < 0.35 then
					self.move_x, self.move_z = 0, 0
				else
					local direction = directions[math.random(1, #directions)]
					self.move_x = direction.x * def.speed * 0.55
					self.move_z = direction.z * def.speed * 0.55
				end
			end
			if safe_ground_ahead(pos, self.move_x * 0.5, self.move_z * 0.5) then
				set_horizontal_velocity(self, self.move_x, self.move_z)
				if self.move_x ~= 0 or self.move_z ~= 0 then
					self.object:set_yaw(math.atan2(self.move_z, self.move_x) - math.pi / 2)
				end
			else
				self.move_x, self.move_z = 0, 0
				self.decision_timer = 0
				set_horizontal_velocity(self, 0, 0)
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
		inventory_image = "default_mese_crystal.png^[colorize:#78C56A:150",
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
