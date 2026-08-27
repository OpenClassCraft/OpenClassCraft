local worldpath = minetest.get_worldpath()
local config_path = worldpath .. "/starter_config.lua"
local config = dofile(config_path)
local storage = minetest.get_mod_storage()

local function registered_node(name, fallback)
	if minetest.registered_nodes[name] then
		return name
	end
	return fallback or "air"
end

local function put(pos, name, param2)
	minetest.set_node(pos, {name = registered_node(name), param2 = param2 or 0})
end

local function write_board(entry)
	local pos = vector.new(entry.x, entry.y, entry.z)
	put(pos, entry.name or "openclasscraft_classroom:chalkboard", entry.param2 or 0)
	local meta = minetest.get_meta(pos)
	meta:set_string("title", entry.title or config.title)
	meta:set_string("message", entry.message or config.goal)
	meta:set_string("owner", "Teacher Console")
	meta:set_string("board_name", entry.name == "openclasscraft_classroom:whiteboard" and "Large Whiteboard" or "Large Blackboard")
	meta:set_string("infotext", entry.title or config.title)
	minetest.get_node_timer(pos):start(0.2)
end

local build_in_progress = false

local function build_arena_nodes()
	if storage:get_int("starter_built") == 1 then
		return
	end
	local radius = config.radius or 15
	for x = -radius, radius do
		for z = -radius, radius do
			put({x = x, y = -1, z = z}, config.foundation or "default:stone")
			put({x = x, y = 0, z = z}, config.surface or "default:dirt_with_grass")
			for y = 1, 7 do
				put({x = x, y = y, z = z}, "air")
			end
		end
	end

	for coordinate = -radius, radius do
		put({x = coordinate, y = 1, z = -radius}, config.border or "default:stonebrick")
		put({x = coordinate, y = 1, z = radius}, config.border or "default:stonebrick")
		put({x = -radius, y = 1, z = coordinate}, config.border or "default:stonebrick")
		put({x = radius, y = 1, z = coordinate}, config.border or "default:stonebrick")
	end

	for _, entry in ipairs(config.nodes or {}) do
		put({x = entry.x, y = entry.y, z = entry.z}, entry.name, entry.param2)
		if entry.meta then
			local meta = minetest.get_meta({x = entry.x, y = entry.y, z = entry.z})
			for key, value in pairs(entry.meta) do
				meta:set_string(key, value)
			end
		end
	end
	for _, board in ipairs(config.boards or {}) do
		write_board(board)
	end

	for _, position in ipairs({{-12, -12}, {12, -12}, {-12, 12}, {12, 12}}) do
		put({x = position[1], y = 1, z = position[2]}, "default:meselamp")
	end
	storage:set_int("starter_built", 1)
	storage:set_string("starter_id", config.id or "unknown")
	minetest.set_timeofday(config.timeofday or 0.36)
	minetest.log("action", "[OpenClassCraft] Built starter lesson world: " .. (config.title or config.id or "unknown"))
end

local function build_arena()
	if storage:get_int("starter_built") == 1 or build_in_progress then
		return
	end
	build_in_progress = true
	local radius = config.radius or 15
	minetest.emerge_area(
		{x = -radius - 1, y = -2, z = -radius - 1},
		{x = radius + 1, y = 8, z = radius + 1},
		function(_blockpos, _action, calls_remaining)
			if calls_remaining ~= 0 then return end
			build_arena_nodes()
			build_in_progress = false
		end
	)
end

local function welcome_player_when_ready(player, attempts)
	if not player or not player:is_player() then return end
	if storage:get_int("starter_built") ~= 1 then
		if attempts < 100 then
			minetest.after(0.1, welcome_player_when_ready, player, attempts + 1)
		end
		return
	end
	local spawn = config.spawn or {x = 0, y = 2, z = 11}
	player:set_pos(spawn)
	minetest.chat_send_player(player:get_player_name(), "[OpenClassCraft] " .. (config.welcome or config.goal or config.title))
	minetest.chat_send_player(player:get_player_name(), "[OpenClassCraft] Open the Lesson Planner, or use /occ_join CODE during a Teacher Console session.")
end

minetest.register_on_mods_loaded(function()
	-- Map access is forbidden while the mods-loaded callbacks themselves are
	-- running. Schedule the clean arena for the first server tick instead.
	minetest.after(0, build_arena)
end)

minetest.register_on_joinplayer(function(player)
	minetest.after(0.2, function()
		if not player or not player:is_player() then return end
		build_arena()
		welcome_player_when_ready(player, 0)
	end)
end)

minetest.register_chatcommand("occ_starter_info", {
	description = "Show the goal for this starter lesson world",
	func = function(name)
		minetest.chat_send_player(name, "[OpenClassCraft] " .. (config.title or "Starter lesson"))
		minetest.chat_send_player(name, "[OpenClassCraft] " .. (config.goal or "Follow the lesson checkpoints."))
		return true
	end,
})
