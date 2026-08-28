-- OpenClassCraft Electronics
-- A deterministic low-voltage classroom circuit model. Power travels from an
-- enabled battery through connected wires, switches, and devices. Networks are
-- bounded so accidental large builds cannot stall a classroom server.

local MODNAME = minetest.get_current_modname()
local NETWORK_LIMIT = 512
local directions = {
	{x = 1, y = 0, z = 0},
	{x = -1, y = 0, z = 0},
	{x = 0, y = 1, z = 0},
	{x = 0, y = -1, z = 0},
	{x = 0, y = 0, z = 1},
	{x = 0, y = 0, z = -1},
}

local variants = {
	[MODNAME .. ":wire"] = MODNAME .. ":wire_powered",
	[MODNAME .. ":wire_powered"] = MODNAME .. ":wire",
	[MODNAME .. ":lamp"] = MODNAME .. ":lamp_powered",
	[MODNAME .. ":lamp_powered"] = MODNAME .. ":lamp",
	[MODNAME .. ":motor"] = MODNAME .. ":motor_powered",
	[MODNAME .. ":motor_powered"] = MODNAME .. ":motor",
}

local powered_names = {
	[MODNAME .. ":wire_powered"] = true,
	[MODNAME .. ":lamp_powered"] = true,
	[MODNAME .. ":motor_powered"] = true,
}

local off_names = {
	[MODNAME .. ":wire_powered"] = MODNAME .. ":wire",
	[MODNAME .. ":lamp_powered"] = MODNAME .. ":lamp",
	[MODNAME .. ":motor_powered"] = MODNAME .. ":motor",
}

local on_names = {
	[MODNAME .. ":wire"] = MODNAME .. ":wire_powered",
	[MODNAME .. ":lamp"] = MODNAME .. ":lamp_powered",
	[MODNAME .. ":motor"] = MODNAME .. ":motor_powered",
}

local function position_key(pos)
	return minetest.hash_node_position(pos)
end

local function is_conductor(name)
	return minetest.get_item_group(name, "occ_conductor") > 0
end

local function is_source(name)
	return name == MODNAME .. ":battery_on"
end

local function network_seeds(pos)
	local seeds = {}
	local node = minetest.get_node_or_nil(pos)
	if node and is_conductor(node.name) then
		seeds[#seeds + 1] = vector.new(pos)
	end
	for _, direction in ipairs(directions) do
		local neighbor = vector.add(pos, direction)
		local neighbor_node = minetest.get_node_or_nil(neighbor)
		if neighbor_node and is_conductor(neighbor_node.name) then
			seeds[#seeds + 1] = neighbor
		end
	end
	return seeds
end

local function collect_network(seed)
	local queue = {vector.new(seed)}
	local head = 1
	local visited = {}
	local network = {}
	local powered = false

	while head <= #queue and #network < NETWORK_LIMIT do
		local pos = queue[head]
		head = head + 1
		local key = position_key(pos)
		if not visited[key] then
			visited[key] = true
			local node = minetest.get_node_or_nil(pos)
			if node and is_conductor(node.name) then
				network[#network + 1] = pos
				for _, direction in ipairs(directions) do
					local neighbor = vector.add(pos, direction)
					local neighbor_node = minetest.get_node_or_nil(neighbor)
					if neighbor_node then
						if is_source(neighbor_node.name) then
							powered = true
						elseif is_conductor(neighbor_node.name) and not visited[position_key(neighbor)] then
							queue[#queue + 1] = neighbor
						end
					end
				end
			end
		end
	end

	return network, powered
end

local function set_device_state(pos, powered)
	local node = minetest.get_node_or_nil(pos)
	if not node then
		return
	end
	local target
	if powered then
		target = on_names[node.name]
	else
		target = off_names[node.name]
	end
	if target and target ~= node.name then
		minetest.swap_node(pos, {name = target, param2 = node.param2})
		node.name = target
	end
	local meta = minetest.get_meta(pos)
	if node.name == MODNAME .. ":motor_powered" then
		meta:set_string("infotext", "Classroom Motor · powered · 120 RPM model")
		minetest.get_node_timer(pos):start(0.5)
	elseif node.name == MODNAME .. ":motor" then
		meta:set_string("infotext", "Classroom Motor · no power")
		minetest.get_node_timer(pos):stop()
	elseif node.name == MODNAME .. ":lamp_powered" then
		meta:set_string("infotext", "Circuit Lamp · powered")
	elseif node.name == MODNAME .. ":lamp" then
		meta:set_string("infotext", "Circuit Lamp · no power")
	end
end

local function refresh_from(pos)
	local refreshed = {}
	for _, seed in ipairs(network_seeds(pos)) do
		local seed_key = position_key(seed)
		if not refreshed[seed_key] then
			local network, powered = collect_network(seed)
			for _, network_pos in ipairs(network) do
				refreshed[position_key(network_pos)] = true
				set_device_state(network_pos, powered)
			end
		end
	end
end

local function refresh_later(pos)
	local copy = vector.new(pos)
	minetest.after(0, function()
		refresh_from(copy)
	end)
end

local function circuit_callbacks()
	return {
		after_place_node = function(pos)
			refresh_later(pos)
		end,
		after_destruct = function(pos)
			refresh_later(pos)
		end,
	}
end

local wire_box = {
	type = "connected",
	fixed = {-0.13, -0.13, -0.13, 0.13, 0.13, 0.13},
	connect_front = {-0.13, -0.13, -0.5, 0.13, 0.13, -0.13},
	connect_back = {-0.13, -0.13, 0.13, 0.13, 0.13, 0.5},
	connect_left = {-0.5, -0.13, -0.13, -0.13, 0.13, 0.13},
	connect_right = {0.13, -0.13, -0.13, 0.5, 0.13, 0.13},
	connect_top = {-0.13, 0.13, -0.13, 0.13, 0.5, 0.13},
	connect_bottom = {-0.13, -0.5, -0.13, 0.13, -0.13, 0.13},
}

local function register_wire(name, description, texture, powered)
	local callbacks = circuit_callbacks()
	minetest.register_node(MODNAME .. ":" .. name, {
		description = description,
		drawtype = "nodebox",
		tiles = {texture},
		inventory_image = "default_copper_block.png^[resize:32x32",
		wield_image = "default_copper_block.png^[resize:32x32",
		paramtype = "light",
		sunlight_propagates = true,
		walkable = false,
		connects_to = {"group:occ_conductor", "group:occ_power_source"},
		node_box = wire_box,
		selection_box = {type = "fixed", fixed = {-0.22, -0.22, -0.22, 0.22, 0.22, 0.22}},
		groups = {
			dig_immediate = 3,
			electronics = 1,
			occ_conductor = 1,
			occ_powered = powered and 1 or 0,
			not_in_creative_inventory = powered and 1 or 0,
		},
		light_source = powered and 4 or 0,
		drop = MODNAME .. ":wire",
		after_place_node = callbacks.after_place_node,
		after_destruct = callbacks.after_destruct,
		sounds = default.node_sound_metal_defaults(),
	})
end

register_wire("wire", "Circuit Wire\nCarries power between adjacent components", "default_copper_block.png", false)
register_wire("wire_powered", "Powered Circuit Wire", "default_copper_block.png^[brighten^[colorize:#55DDFF:80", true)

local function battery_rightclick(pos, node, clicker)
	if minetest.is_protected(pos, clicker:get_player_name()) then
		return
	end
	local enabled = node.name == MODNAME .. ":battery_off"
	local target = enabled and MODNAME .. ":battery_on" or MODNAME .. ":battery_off"
	minetest.swap_node(pos, {name = target, param2 = node.param2})
	minetest.get_meta(pos):set_string("infotext", enabled and
		"Classroom Battery · output on · simplified 9 V model" or "Classroom Battery · output off")
	minetest.sound_play("default_place_node_metal", {pos = pos, gain = 0.35, max_hear_distance = 12}, true)
	refresh_later(pos)
end

local function register_battery(name, description, texture, enabled)
	minetest.register_node(MODNAME .. ":" .. name, {
		description = description,
		tiles = {texture},
		paramtype2 = "facedir",
		groups = {
			cracky = 2,
			electronics = 1,
			occ_power_source = 1,
			not_in_creative_inventory = enabled and 1 or 0,
		},
		light_source = enabled and 5 or 0,
		drop = MODNAME .. ":battery_off",
		on_construct = function(pos)
			minetest.get_meta(pos):set_string("infotext", enabled and
				"Classroom Battery · output on · simplified 9 V model" or "Classroom Battery · output off")
		end,
		on_rightclick = battery_rightclick,
		after_destruct = function(pos)
			refresh_later(pos)
		end,
		sounds = default.node_sound_metal_defaults(),
	})
end

register_battery("battery_off", "Classroom Battery\nRight-click to switch its safe circuit output on",
	"default_steel_block.png^[colorize:#E5B94D:95", false)
register_battery("battery_on", "Classroom Battery · On",
	"default_steel_block.png^[brighten^[colorize:#FFE05C:120", true)

local function switch_rightclick(pos, node, clicker)
	if minetest.is_protected(pos, clicker:get_player_name()) then
		return
	end
	local enabled = node.name == MODNAME .. ":switch_off"
	local target = enabled and MODNAME .. ":switch_on" or MODNAME .. ":switch_off"
	minetest.swap_node(pos, {name = target, param2 = node.param2})
	minetest.get_meta(pos):set_string("infotext", enabled and "Circuit Switch · closed" or "Circuit Switch · open")
	minetest.sound_play("default_dig_metal", {pos = pos, gain = 0.25, max_hear_distance = 10}, true)
	refresh_later(pos)
end

local function register_switch(name, description, texture, enabled)
	minetest.register_node(MODNAME .. ":" .. name, {
		description = description,
		tiles = {texture},
		paramtype2 = "facedir",
		groups = {
			cracky = 2,
			electronics = 1,
			occ_conductor = enabled and 1 or 0,
			not_in_creative_inventory = enabled and 1 or 0,
		},
		drop = MODNAME .. ":switch_off",
		on_construct = function(pos)
			minetest.get_meta(pos):set_string("infotext", enabled and "Circuit Switch · closed" or "Circuit Switch · open")
		end,
		on_rightclick = switch_rightclick,
		after_place_node = function(pos)
			refresh_later(pos)
		end,
		after_destruct = function(pos)
			refresh_later(pos)
		end,
		sounds = default.node_sound_metal_defaults(),
	})
end

register_switch("switch_off", "Circuit Switch · Open\nRight-click to close the circuit",
	"default_steel_block.png^[colorize:#B84E48:90", false)
register_switch("switch_on", "Circuit Switch · Closed\nRight-click to open the circuit",
	"default_steel_block.png^[colorize:#4DB66A:90", true)

local function register_device(name, description, tiles, powered, light_source, on_timer)
	local callbacks = circuit_callbacks()
	minetest.register_node(MODNAME .. ":" .. name, {
		description = description,
		tiles = tiles,
		paramtype = "light",
		paramtype2 = "facedir",
		groups = {
			cracky = 2,
			electronics = 1,
			occ_conductor = 1,
			occ_powered = powered and 1 or 0,
			not_in_creative_inventory = powered and 1 or 0,
		},
		light_source = light_source or 0,
		drop = MODNAME .. ":" .. name:gsub("_powered$", ""),
		after_place_node = callbacks.after_place_node,
		after_destruct = callbacks.after_destruct,
		on_timer = on_timer,
		sounds = default.node_sound_metal_defaults(),
	})
end

register_device("lamp", "Circuit Lamp\nLights when connected to an enabled battery",
	{"default_glass.png^[colorize:#879CA8:85"}, false, 0)
register_device("lamp_powered", "Circuit Lamp · Powered",
	{"default_meselamp.png^[brighten^[colorize:#FFF0A0:50"}, true, 14)

local motor_tiles_off = {
	"default_steel_block.png^[colorize:#4E82A8:55",
	"default_steel_block.png^[colorize:#4E82A8:55",
	"default_steel_block.png^[colorize:#4E82A8:55",
	"default_steel_block.png^[colorize:#4E82A8:55",
	"default_furnace_front.png^[colorize:#4E82A8:70",
	"default_steel_block.png^[colorize:#4E82A8:55",
}
local motor_tiles_on = {
	"default_mese_block.png^[colorize:#4EAEE8:55",
	"default_mese_block.png^[colorize:#4EAEE8:55",
	"default_steel_block.png^[brighten^[colorize:#4EAEE8:90",
	"default_steel_block.png^[brighten^[colorize:#4EAEE8:90",
	"default_furnace_front_active.png^[colorize:#55DDFF:65",
	"default_steel_block.png^[brighten^[colorize:#4EAEE8:90",
}

register_device("motor", "Classroom Motor\nRotates while its circuit is powered", motor_tiles_off, false, 0)
register_device("motor_powered", "Classroom Motor · Powered", motor_tiles_on, true, 6, function(pos)
	local node = minetest.get_node(pos)
	if node.name ~= MODNAME .. ":motor_powered" then
		return false
	end
	node.param2 = (node.param2 + 1) % 4
	minetest.swap_node(pos, node)
	return true
end)

minetest.register_tool(MODNAME .. ":multimeter", {
	description = "Classroom Multimeter\nUse on a component to inspect its circuit state",
	inventory_image = "default_tool_steelpick.png^[colorize:#F2C14E:80",
	groups = {tool = 1, electronics = 1},
	on_use = function(itemstack, user, pointed_thing)
		if not pointed_thing or pointed_thing.type ~= "node" then
			minetest.chat_send_player(user:get_player_name(), "[Multimeter] Point at a circuit component.")
			return itemstack
		end
		local node = minetest.get_node(pointed_thing.under)
		local state = "not a circuit component"
		if node.name == MODNAME .. ":battery_on" then
			state = "battery output ON · simplified 9 V source"
		elseif node.name == MODNAME .. ":battery_off" then
			state = "battery output OFF · 0 V"
		elseif node.name == MODNAME .. ":switch_on" then
			state = "switch CLOSED · current path available"
		elseif node.name == MODNAME .. ":switch_off" then
			state = "switch OPEN · current path interrupted"
		elseif variants[node.name] then
			state = powered_names[node.name] and "POWERED" or "not powered"
		end
		minetest.chat_send_player(user:get_player_name(), "[Multimeter] " .. minetest.pos_to_string(pointed_thing.under) .. " · " .. state)
		return itemstack
	end,
})

minetest.register_craft({
	output = MODNAME .. ":wire 8",
	recipe = {{"default:copper_ingot", "default:copper_ingot", "default:copper_ingot"}},
})

minetest.register_craft({
	output = MODNAME .. ":battery_off",
	recipe = {
		{"default:copper_ingot", "default:steel_ingot"},
		{"default:mese_crystal_fragment", "default:steel_ingot"},
	},
})

minetest.register_craft({
	output = MODNAME .. ":switch_off",
	recipe = {{"default:stick"}, {MODNAME .. ":wire"}},
})

minetest.register_craft({
	output = MODNAME .. ":lamp",
	recipe = {{"default:glass"}, {"default:mese_crystal_fragment"}, {MODNAME .. ":wire"}},
})

minetest.register_craft({
	output = MODNAME .. ":motor",
	recipe = {
		{"default:steel_ingot", "default:copper_ingot", "default:steel_ingot"},
		{"", MODNAME .. ":wire", ""},
	},
})

minetest.register_craft({
	output = MODNAME .. ":multimeter",
	recipe = {{"default:mese_crystal_fragment"}, {"default:copper_ingot"}, {"default:stick"}},
})

minetest.register_lbm({
	label = "Refresh OpenClassCraft classroom circuits",
	name = MODNAME .. ":refresh_circuits",
	nodenames = {"group:occ_power_source", "group:occ_conductor"},
	run_at_every_load = true,
	action = function(pos)
		refresh_later(pos)
	end,
})

minetest.log("action", "[OpenClassCraft Electronics] Loaded bounded battery, switch, wire, lamp, motor, and meter circuits")
