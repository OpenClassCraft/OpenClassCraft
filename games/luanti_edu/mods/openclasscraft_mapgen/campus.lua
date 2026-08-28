local mapgen = openclasscraft_mapgen

local function clamp(value, low, high)
	return math.max(low, math.min(high, value))
end

local function round(value)
	return math.floor(value + 0.5)
end

local water_level = tonumber(minetest.get_mapgen_setting("water_level")) or 1
-- Mapgen is not initialized while mods load, so the campus uses a stable
-- elevation relative to sea level instead of querying an unfinished mapgen.
local campus_y = clamp(water_level + 39, water_level + 4, 60)

mapgen.CAMPUS_SURFACE_Y = campus_y
mapgen.CAMPUS_SPAWN = {x = 0, y = campus_y + 1.1, z = 0}

mapgen.TRAIL_DIRECTIONS = {
	{name = "North Field Trail", x = 0, z = 1, approach_y = 51,
		checkpoint_y = {35, 15, 10, 9, 2}},
	{name = "Northeast Field Trail", x = 0.70710678, z = 0.70710678, approach_y = 49,
		checkpoint_y = {47, 47, 26, 2, 8}},
	{name = "East Field Trail", x = 1, z = 0, approach_y = 47,
		checkpoint_y = {46, 35, 40, 30, 8}},
	{name = "Southeast Field Trail", x = 0.70710678, z = -0.70710678, approach_y = 50,
		checkpoint_y = {51, 40, 21, 2, 11}},
	{name = "South Field Trail", x = 0, z = -1, approach_y = 50,
		checkpoint_y = {59, 59, 62, 57, 8}},
	{name = "Southwest Field Trail", x = -0.70710678, z = -0.70710678, approach_y = 57,
		checkpoint_y = {50, 41, 42, 48, 36}},
	{name = "West Field Trail", x = -1, z = 0, approach_y = 55,
		checkpoint_y = {50, 40, 53, 61, 57}},
	{name = "Northwest Field Trail", x = -0.70710678, z = 0.70710678, approach_y = 51,
		checkpoint_y = {44, 36, 24, 13, 7}},
}

local trail_checkpoint_distances = {208, 304, 400, 496, 592}

local pad_defs = {
	{x = 0, z = 24, radius = 7, node = "openclasscraft_mapgen:ecology_pad",
		station = "openclasscraft_mapgen:station_ecology"},
	{x = 24, z = 0, radius = 7, node = "openclasscraft_mapgen:programming_pad",
		station = "openclasscraft_mapgen:station_programming"},
	{x = 0, z = -24, radius = 7, node = "openclasscraft_mapgen:electronics_pad",
		station = "openclasscraft_mapgen:station_electronics"},
	{x = -24, z = 0, radius = 7, node = "openclasscraft_mapgen:classroom_pad",
		station = "openclasscraft_mapgen:station_classroom"},
}

local marker_positions = {}
for route_index, route in ipairs(mapgen.TRAIL_DIRECTIONS) do
	for _, distance in ipairs({112, 208, 304, 400, 496, 592}) do
		local x = round(route.x * distance)
		local z = round(route.z * distance)
		marker_positions[x .. ":" .. z] = route_index
	end
end

local function campus_target(x, z)
	local distance = math.sqrt(x * x + z * z)
	if distance > mapgen.CAMPUS_OUTER_RADIUS then
		return nil
	end
	if distance <= mapgen.CAMPUS_CORE_RADIUS then
		return campus_y
	end
	-- A deterministic one-node rise every four horizontal nodes keeps the
	-- campus transition walkable even when native Valleys terrain has cliffs.
	return campus_y + math.floor((distance - mapgen.CAMPUS_CORE_RADIUS) / 4)
end

local function campus_surface_name(x, z)
	local distance = math.sqrt(x * x + z * z)
	if distance <= 11 then
		return "openclasscraft_mapgen:campus_plaza"
	end
	for _, pad in ipairs(pad_defs) do
		local dx = x - pad.x
		local dz = z - pad.z
		if dx * dx + dz * dz <= pad.radius * pad.radius then
			return pad.node
		end
	end
	if distance >= 34 then
		for _, route in ipairs(mapgen.TRAIL_DIRECTIONS) do
			local projection = x * route.x + z * route.z
			local perpendicular = math.abs(x * route.z - z * route.x)
			if projection >= 0 and perpendicular <= 1.35 then
				return "openclasscraft_mapgen:learning_path"
			end
		end
	end
	if math.abs(x) <= 2 or math.abs(z) <= 2 or math.abs(distance - 35) <= 1.35 then
		return "openclasscraft_mapgen:learning_path"
	end
	return "default:dirt_with_grass"
end

local function trail_at(x, z)
	local radius = math.sqrt(x * x + z * z)
	-- One node of tolerance includes the rounded endpoint of diagonal routes.
	if radius < mapgen.CAMPUS_OUTER_RADIUS - 2 or radius > mapgen.TRAIL_RADIUS + 1 then
		return nil
	end
	local closest
	for route_index, route in ipairs(mapgen.TRAIL_DIRECTIONS) do
		local projection = x * route.x + z * route.z
		if projection >= mapgen.CAMPUS_OUTER_RADIUS - 2 and
				projection <= mapgen.TRAIL_RADIUS + 1 then
			local perpendicular = math.abs(x * route.z - z * route.x)
			if perpendicular <= 1.35 and (not closest or perpendicular < closest.perpendicular) then
				closest = {
					route = route_index,
					projection = projection,
					perpendicular = perpendicular,
				}
			end
		end
	end
	return closest
end

local content = {}
local function content_id(name)
	if not content[name] then
		content[name] = minetest.get_content_id(name)
	end
	return content[name]
end

local trail_surface_ids = {
	[content_id("default:dirt_with_grass")] = true,
	[content_id("default:dirt_with_rainforest_litter")] = true,
	[content_id("default:dry_dirt_with_dry_grass")] = true,
	[content_id("default:desert_sand")] = true,
	[content_id("default:dirt_with_coniferous_litter")] = true,
	[content_id("default:dirt_with_snow")] = true,
	[content_id("default:sand")] = true,
	[content_id("default:sand_with_kelp")] = true,
	[content_id("default:clay")] = true,
	[content_id("default:gravel")] = true,
}

local function set_column(data, area, minp, maxp, x, z, target_y, surface_name, solid_foundation)
	local air = content_id("air")
	local stone = content_id("default:stone")
	local dirt = content_id("default:dirt")
	local surface = content_id(surface_name)

	for y = minp.y, math.min(target_y, maxp.y) do
		local id
		if y == target_y then
			id = surface
		elseif y >= target_y - 3 then
			id = dirt
		elseif solid_foundation then
			id = stone
		else
			id = data[area:index(x, y, z)]
			if id == air or id == content_id("ignore") or id == content_id("default:water_source") then
				id = stone
			end
		end
		data[area:index(x, y, z)] = id
	end
	for y = math.max(target_y + 1, minp.y), maxp.y do
		data[area:index(x, y, z)] = air
	end
end

local function find_trail_surface(data, area, minp, maxp, x, z)
	-- Include the lower VoxelManip border so an engineered path that rises one
	-- node across a mapchunk boundary is placed by the upper chunk.
	local scan_min_y = math.max(area.MinEdge.y, minp.y - 16)
	for y = maxp.y, scan_min_y, -1 do
		if trail_surface_ids[data[area:index(x, y, z)]] then
			return y
		end
	end
	return nil
end

local campus_rim_y = campus_y + math.floor(
	(mapgen.CAMPUS_OUTER_RADIUS - mapgen.CAMPUS_CORE_RADIUS) / 4)

local function trail_profile_y(route, projection)
	local previous_distance = 128
	local previous_y = route.approach_y
	for index, distance in ipairs(trail_checkpoint_distances) do
		local next_y = route.checkpoint_y[index]
		if projection <= distance then
			local blend = clamp((projection - previous_distance) /
				(distance - previous_distance), 0, 1)
			return round(previous_y * (1 - blend) + next_y * blend)
		end
		previous_distance = distance
		previous_y = next_y
	end
	-- Hold the final surveyed elevation through the short end section. The
	-- checkpoints are tied to the fixed world seed, so every field route stays
	-- continuous without depending on mapchunk generation order.
	return previous_y
end

local function trail_target_y(trail)
	local route = mapgen.TRAIL_DIRECTIONS[trail.route]
	if trail.projection <= 128 then
		local blend = clamp((trail.projection - mapgen.CAMPUS_OUTER_RADIUS) /
			(128 - mapgen.CAMPUS_OUTER_RADIUS), 0, 1)
		return round(campus_rim_y * (1 - blend) + route.approach_y * blend)
	end
	return trail_profile_y(route, trail.projection)
end

local function place_trail_surface(data, area, minp, maxp, x, z, trail)
	-- The deterministic world seed gives each route surveyed elevations. Build
	-- the complete path independently of native ground so cliffs, rivers,
	-- overhangs, and mapchunk boundaries cannot disconnect it.
	local target_y = trail_target_y(trail)

	-- A path can sit at the top or bottom of a vertical mapchunk. Finish its
	-- clearance/support in the adjacent chunk as that chunk generates; without
	-- this, a schematic tree can occupy the first headroom node at the seam.
	if target_y < minp.y then
		if target_y + 3 < minp.y then
			return nil
		end
		for y = minp.y, math.min(target_y + 3, maxp.y) do
			data[area:index(x, y, z)] = content_id("openclasscraft_mapgen:trail_clearance")
		end
		return target_y
	end
	if target_y > maxp.y then
		if target_y - 3 > maxp.y then
			return nil
		end
		for y = math.max(target_y - 3, minp.y), maxp.y do
			data[area:index(x, y, z)] = content_id("default:stone")
		end
		return target_y
	end
	local surface_y = find_trail_surface(data, area, minp, maxp, x, z)
	if surface_y and target_y > surface_y then
		for y = surface_y + 1, target_y - 1 do
			data[area:index(x, y, z)] = content_id("default:stone")
		end
	elseif not surface_y then
		for y = math.max(minp.y, target_y - 3), target_y - 1 do
			data[area:index(x, y, z)] = content_id("default:stone")
		end
	end
	data[area:index(x, target_y, z)] = content_id("openclasscraft_mapgen:learning_path")
	for y = target_y + 1, math.min(target_y + 3, maxp.y) do
		data[area:index(x, y, z)] = content_id("openclasscraft_mapgen:trail_clearance")
	end
	return target_y
end

local function restore_trail_clearance(data, area)
	if area.MaxEdge.y < -16 or area.MinEdge.y > 80 then
		return false
	end
	local air = content_id("air")
	local ignore = content_id("ignore")
	local stone = content_id("default:stone")
	local water = content_id("default:water_source")
	local river_water = content_id("default:river_water_source")
	local path = content_id("openclasscraft_mapgen:learning_path")
	local marker = content_id("openclasscraft_mapgen:trail_marker")
	local clearance = content_id("openclasscraft_mapgen:trail_clearance")
	local changed = false

	-- Schematic trees can extend from the current mapchunk into an already
	-- generated neighbouring chunk. Inspect the VoxelManip border as well as
	-- the new chunk so the last-generated neighbour always restores the route,
	-- its supports, markers, and clear walking space.
	for z = area.MinEdge.z, area.MaxEdge.z do
		for x = area.MinEdge.x, area.MaxEdge.x do
			local trail = trail_at(x, z)
			if trail then
				local target_y = campus_target(x, z) or trail_target_y(trail)
				if target_y >= area.MinEdge.y and target_y <= area.MaxEdge.y then
					local surface_index = area:index(x, target_y, z)
					if data[surface_index] ~= ignore then
						local expected = marker_positions[x .. ":" .. z] and marker or path
						if data[surface_index] ~= expected then
							data[surface_index] = expected
							changed = true
						end
						for support_y = math.max(target_y - 3, area.MinEdge.y), target_y - 1 do
							local index = area:index(x, support_y, z)
							local id = data[index]
							if id == air or id == water or id == river_water then
								data[index] = stone
								changed = true
							end
						end
						for clear_y = target_y + 1, math.min(target_y + 3, area.MaxEdge.y) do
							local index = area:index(x, clear_y, z)
							if data[index] ~= clearance then
								data[index] = clearance
								changed = true
							end
						end
					end
				end
			end
		end
	end
	return changed
end

minetest.register_on_generated(function(minp, maxp)
	local horizontal_reach = mapgen.TRAIL_RADIUS + 3
	if minp.x > horizontal_reach or maxp.x < -horizontal_reach or
		minp.z > horizontal_reach or maxp.z < -horizontal_reach or
		maxp.y < -16 or minp.y > 80 then
		return
	end

	local vm, emin, emax = minetest.get_mapgen_object("voxelmanip")
	if not vm then
		return
	end
	local area = VoxelArea:new({MinEdge = emin, MaxEdge = emax})
	local data = vm:get_data()
	local changed = false

	for z = minp.z, maxp.z do
		for x = minp.x, maxp.x do
			local target_y = campus_target(x, z)
			if target_y then
				set_column(data, area, minp, maxp, x, z, target_y,
					campus_surface_name(x, z), true)
				changed = true
			else
				local trail = trail_at(x, z)
				if trail then
					target_y = place_trail_surface(data, area, minp, maxp, x, z, trail)
					changed = target_y ~= nil or changed
				end
			end

			if target_y and target_y >= minp.y and target_y <= maxp.y then
				local marker_route = marker_positions[x .. ":" .. z]
				if marker_route then
					data[area:index(x, target_y, z)] = content_id("openclasscraft_mapgen:trail_marker")
				end
			end

			if target_y and target_y + 1 >= minp.y and target_y + 1 <= maxp.y then
				for _, pad in ipairs(pad_defs) do
					if x == pad.x and z == pad.z then
						data[area:index(x, target_y + 1, z)] = content_id(pad.station)
					end
				end
			end
		end
	end
	changed = restore_trail_clearance(data, area) or changed

	if changed then
		vm:set_data(data)
		vm:calc_lighting()
		vm:write_to_map()
	end
end)

local function place_at_campus(player)
	if not player or not player:is_player() then
		return
	end
	player:set_pos(mapgen.CAMPUS_SPAWN)
	player:set_look_horizontal(0)
end

minetest.register_on_newplayer(function(player)
	minetest.after(0.5, function()
		place_at_campus(player)
		if player and player:is_player() then
			minetest.chat_send_player(player:get_player_name(),
				"[OpenClassCraft] Welcome to the learning campus. Follow any marked trail to begin a field study.")
		end
	end)
end)

minetest.register_on_respawnplayer(function(player)
	place_at_campus(player)
	return true
end)

minetest.log("action", string.format(
	"[openclasscraft_mapgen] Learning campus ready at y=%d with eight field trails to radius %d",
	campus_y, mapgen.TRAIL_RADIUS))
