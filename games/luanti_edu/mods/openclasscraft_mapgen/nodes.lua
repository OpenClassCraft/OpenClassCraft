local mapgen = openclasscraft_mapgen
local esc = minetest.formspec_escape

mapgen.HABITATS = {
	openclasscraft_learning_meadow = {
		title = "Learning Meadow",
		lesson = "Pollination, plant growth, soil observation, and a safe introduction to field study.",
		wildlife = "Rabbits and visiting squirrels; farm animals and pets stay in managed learning areas.",
	},
	openclasscraft_temperate_forest = {
		title = "Temperate Forest",
		lesson = "Predator-prey relationships, seasonal woodland plants, seed dispersal, and forest succession.",
		wildlife = "Foxes, deer, rabbits, and squirrels.",
	},
	openclasscraft_freshwater_wetland = {
		title = "Freshwater River and Wetland",
		lesson = "Watersheds, freshwater flow, wetland filtration, aquatic plants, and changing water levels.",
		wildlife = "Ducks, rabbits, and visiting deer.",
	},
	openclasscraft_monsoon_forest = {
		title = "Monsoon Forest",
		lesson = "Rainfall, biodiversity, canopy structure, decomposition, and nutrient cycling.",
		wildlife = "Deer and squirrels, with occasional foxes and rabbits.",
	},
	openclasscraft_grassland_savanna = {
		title = "Grassland and Savanna",
		lesson = "Grazing, food webs, seasonal drought, scattered tree cover, and grass adaptation.",
		wildlife = "Deer, rabbits, and foxes.",
	},
	openclasscraft_dry_scrub = {
		title = "Dry Scrub and Desert",
		lesson = "Water conservation, heat adaptation, sparse vegetation, and solar-energy investigations.",
		wildlife = "Sparse rabbit and fox populations.",
	},
	openclasscraft_montane_conifer = {
		title = "Montane Conifer Forest",
		lesson = "Altitude, cooling, watersheds, erosion, conifer adaptation, and mountain soils.",
		wildlife = "Deer, squirrels, and foxes.",
	},
	openclasscraft_alpine_tundra = {
		title = "Alpine Tundra and Snow",
		lesson = "Cold adaptation, seasonal snow, exposed rock, short growing seasons, and climate change.",
		wildlife = "Small, sparse rabbit and fox populations.",
	},
	openclasscraft_mangrove_coast = {
		title = "Coast and Mangrove",
		lesson = "Salinity, shoreline erosion, mangrove roots, nursery habitats, and land-water boundaries.",
		wildlife = "Ducks near sheltered water and rabbits above the shoreline.",
	},
	openclasscraft_shallow_reef = {
		title = "Shallow Reef",
		lesson = "Marine habitats, sunlight zones, coral communities, coastal protection, and water quality.",
		wildlife = "Aquatic animal populations will use this habitat as the marine-life system expands.",
	},
	openclasscraft_geology = {
		title = "Controlled Geology Zone",
		lesson = "Rock layers, groundwater, erosion, and rare deep caves without mining or survival progression.",
		wildlife = "No routine wildlife spawning underground.",
	},
}

mapgen.habitat_count = 0
for _ in pairs(mapgen.HABITATS) do
	mapgen.habitat_count = mapgen.habitat_count + 1
end

mapgen.CAMPUS_CORE_RADIUS = 44
mapgen.CAMPUS_OUTER_RADIUS = 96
mapgen.TRAIL_RADIUS = 640

function mapgen.is_campus(pos)
	return pos.x * pos.x + pos.z * pos.z <= mapgen.CAMPUS_OUTER_RADIUS ^ 2
end

function mapgen.get_habitat_name(pos)
	if pos.y < -10 then
		return "openclasscraft_geology"
	end
	if mapgen.is_campus(pos) then
		return "openclasscraft_learning_meadow"
	end
	local data = minetest.get_biome_data(pos)
	local name = data and minetest.get_biome_name(data.biome) or nil
	if name and mapgen.HABITATS[name] then
		return name
	end
	return "openclasscraft_learning_meadow"
end

local function show_habitat(player, habitat_name, heading)
	local habitat = mapgen.HABITATS[habitat_name] or mapgen.HABITATS.openclasscraft_learning_meadow
	local formspec = table.concat({
		"formspec_version[6]",
		"size[11,6.2]",
		"bgcolor[#F5F8F2;true]",
		"box[0,0;11,0.78;#173D31]",
		"label[0.55,0.39;", esc(heading or "OPENCLASSCRAFT FIELD STATION"), "]",
		"style_type[label;font_size=18;textcolor=#17251F]",
		"label[0.65,1.35;", esc(habitat.title), "]",
		"style_type[textarea;font_size=15;textcolor=#40574D;border=false]",
		"textarea[0.6,1.85;9.8,1.35;;WHAT TO INVESTIGATE;", esc(habitat.lesson), "]",
		"textarea[0.6,3.25;9.8,1.15;;ANIMAL COMMUNITY;", esc(habitat.wildlife), "]",
		"button_exit[7.9,5.15;2.4,0.65;close;Continue exploring]",
	})
	minetest.show_formspec(player:get_player_name(), "openclasscraft_mapgen:habitat", formspec)
end

local function hidden_groups(extra)
	local groups = {cracky = 2, oddly_breakable_by_hand = 2, not_in_creative_inventory = 1}
	for key, value in pairs(extra or {}) do
		groups[key] = value
	end
	return groups
end

local function register_ground(name, description, color)
	minetest.register_node("openclasscraft_mapgen:" .. name, {
		description = description,
		tiles = {"default_stone.png^[colorize:" .. color .. ":155"},
		groups = hidden_groups({learning_world = 1}),
		drop = "",
		sounds = default.node_sound_stone_defaults(),
	})
end

register_ground("learning_path", "Learning Trail", "#CBAE72")
register_ground("campus_plaza", "Learning Campus Plaza", "#E8E1CE")
register_ground("ecology_pad", "Ecology Learning Pad", "#4EAD68")
register_ground("programming_pad", "Programming Learning Pad", "#377FC8")
register_ground("electronics_pad", "Electronics Learning Pad", "#DBA83B")
register_ground("classroom_pad", "Classroom Learning Pad", "#8763B6")

minetest.register_node("openclasscraft_mapgen:trail_clearance", {
	description = "Protected Trail Clearance",
	drawtype = "airlike",
	paramtype = "light",
	sunlight_propagates = true,
	walkable = false,
	pointable = false,
	diggable = false,
	buildable_to = false,
	floodable = false,
	is_ground_content = false,
	groups = {not_in_creative_inventory = 1, learning_world = 1},
	drop = "",
})

minetest.register_node("openclasscraft_mapgen:trail_marker", {
	description = "Habitat Trail Marker\nRight-click for information about the surrounding habitat",
	drawtype = "nodebox",
	tiles = {
		"default_stone.png^[colorize:#CBAE72:155",
		"default_stone.png^[colorize:#A88953:160",
		"default_wood.png^[colorize:#173D31:95",
		"default_wood.png^[colorize:#173D31:95",
		"default_wood.png^[colorize:#2A7B59:120",
		"default_wood.png^[colorize:#2A7B59:120",
	},
	paramtype = "light",
	sunlight_propagates = false,
	walkable = true,
	node_box = {
		type = "fixed",
		fixed = {
			{-0.5, -0.5, -0.5, 0.5, 0.5, 0.5},
			{-0.09, 0.5, -0.09, 0.09, 1.24, 0.09},
			{-0.34, 1.04, -0.08, 0.34, 1.32, 0.08},
		},
	},
	selection_box = {type = "fixed", fixed = {-0.5, -0.5, -0.5, 0.5, 1.33, 0.5}},
	groups = hidden_groups({learning_world = 1}),
	drop = "",
	on_rightclick = function(pos, node, clicker)
		show_habitat(clicker, mapgen.get_habitat_name(pos), "OPENCLASSCRAFT HABITAT TRAIL")
	end,
})

local station_defs = {
	ecology = {
		title = "Ecology Field Station",
		color = "#4EAD68",
		habitat = "openclasscraft_learning_meadow",
	},
	programming = {
		title = "Programming Field Station",
		color = "#377FC8",
		habitat = "openclasscraft_learning_meadow",
	},
	electronics = {
		title = "Electronics Field Station",
		color = "#DBA83B",
		habitat = "openclasscraft_learning_meadow",
	},
	classroom = {
		title = "Classroom Field Station",
		color = "#8763B6",
		habitat = "openclasscraft_learning_meadow",
	},
}

for name, def in pairs(station_defs) do
	local station = def
	minetest.register_node("openclasscraft_mapgen:station_" .. name, {
		description = station.title,
		drawtype = "nodebox",
		tiles = {"default_wood.png^[colorize:" .. station.color .. ":155"},
		paramtype = "light",
		sunlight_propagates = true,
		node_box = {
			type = "fixed",
			fixed = {
				{-0.36, -0.5, -0.36, 0.36, 0.02, 0.36},
				{-0.13, 0.02, -0.13, 0.13, 0.5, 0.13},
			},
		},
		groups = hidden_groups({learning_world = 1}),
		drop = "",
		on_rightclick = function(pos, node, clicker)
			show_habitat(clicker, station.habitat, string.upper(station.title))
		end,
	})
end

minetest.register_node("openclasscraft_mapgen:alpine_lichen", {
	description = "Alpine Lichen",
	drawtype = "plantlike",
	waving = 1,
	tiles = {"default_dry_shrub.png^[colorize:#8FC3A3:150"},
	inventory_image = "default_dry_shrub.png^[colorize:#8FC3A3:150",
	wield_image = "default_dry_shrub.png^[colorize:#8FC3A3:150",
	paramtype = "light",
	sunlight_propagates = true,
	walkable = false,
	buildable_to = true,
	selection_box = {type = "fixed", fixed = {-0.3, -0.5, -0.3, 0.3, -0.28, 0.3}},
	groups = hidden_groups({snappy = 3, flora = 1, attached_node = 1}),
	drop = "",
})

minetest.register_node("openclasscraft_mapgen:mangrove_roots", {
	description = "Mangrove Roots",
	drawtype = "nodebox",
	tiles = {"default_jungletree.png^[colorize:#54331E:55"},
	paramtype = "light",
	sunlight_propagates = true,
	walkable = false,
	buildable_to = true,
	node_box = {
		type = "fixed",
		fixed = {
			{-0.07, -0.5, -0.45, 0.07, 0.35, 0.45},
			{-0.45, -0.5, -0.07, 0.45, 0.35, 0.07},
		},
	},
	groups = hidden_groups({snappy = 2, flora = 1}),
	drop = "",
})

mapgen.show_habitat = show_habitat
