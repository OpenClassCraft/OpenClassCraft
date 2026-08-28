local mapgen = openclasscraft_mapgen
local default_path = minetest.get_modpath("default")

-- Safety rules apply even when an older world is opened: new chunks never
-- receive ores or dungeons. Existing generated chunks are left untouched.
minetest.set_mapgen_setting("mg_flags", "caves,nodungeons,light,decorations,biomes,noores", true)
minetest.clear_registered_ores()

-- Defaults below shape new Valleys worlds. Existing map metadata remains the
-- authority for terrain noise, avoiding an unexpected terrain seam.
local function setting_default(name, value)
	minetest.set_mapgen_setting(name, tostring(value), false)
end

local function noise_default(name, definition)
	minetest.set_mapgen_setting_noiseparams(name, definition, false)
end

setting_default("mgvalleys_spflags", "altitude_chill,humid_rivers,vary_river_depth,altitude_dry")
setting_default("mgvalleys_altitude_chill", 82)
setting_default("mgvalleys_river_depth", 3)
setting_default("mgvalleys_river_size", 5)
setting_default("mgvalleys_cave_width", 0.16)
setting_default("mgvalleys_small_cave_num_min", 0)
setting_default("mgvalleys_small_cave_num_max", 1)
setting_default("mgvalleys_large_cave_num_min", 0)
setting_default("mgvalleys_large_cave_num_max", 1)
setting_default("mgvalleys_large_cave_depth", -96)
setting_default("mgvalleys_large_cave_flooded", 0.72)
setting_default("mgvalleys_cavern_limit", -512)
setting_default("mgvalleys_cavern_taper", 128)
setting_default("mgvalleys_cavern_threshold", 0.84)

noise_default("mg_biome_np_heat", {
	offset = 50,
	scale = 50,
	spread = {x = 320, y = 320, z = 320},
	seed = 5349,
	octaves = 4,
	persist = 0.55,
	lacunarity = 2.0,
	flags = "eased",
})
noise_default("mg_biome_np_humidity", {
	offset = 50,
	scale = 50,
	spread = {x = 320, y = 320, z = 320},
	seed = 842,
	octaves = 4,
	persist = 0.55,
	lacunarity = 2.0,
	flags = "eased",
})
noise_default("mgvalleys_np_terrain_height", {
	offset = 20,
	scale = 90,
	spread = {x = 900, y = 900, z = 900},
	seed = 5202,
	octaves = 5,
	persist = 0.42,
	lacunarity = 2.0,
	flags = "eased",
})
noise_default("mgvalleys_np_valley_depth", {
	offset = 3,
	scale = 2.6,
	spread = {x = 520, y = 520, z = 520},
	seed = -1914,
	octaves = 2,
	persist = 0.55,
	lacunarity = 2.0,
	flags = "eased",
})
noise_default("mgvalleys_np_inter_valley_slope", {
	offset = 0.38,
	scale = 0.32,
	spread = {x = 180, y = 180, z = 180},
	seed = 746,
	octaves = 2,
	persist = 0.55,
	lacunarity = 2.0,
	flags = "eased",
})

-- The legacy game registered dozens of surface, shore, ocean, and underground
-- variants. OpenClassCraft deliberately uses a smaller teaching vocabulary.
minetest.clear_registered_biomes()
minetest.clear_registered_decorations()

local function register_surface(def)
	def.node_stone = def.node_stone or "default:stone"
	def.node_riverbed = def.node_riverbed or "default:sand"
	def.depth_riverbed = def.depth_riverbed or 2
	def.vertical_blend = def.vertical_blend or 6
	minetest.register_biome(def)
end

register_surface({
	name = "openclasscraft_learning_meadow",
	node_top = "default:dirt_with_grass",
	depth_top = 1,
	node_filler = "default:dirt",
	depth_filler = 3,
	y_min = 1,
	y_max = 68,
	heat_point = 54,
	humidity_point = 52,
})

register_surface({
	name = "openclasscraft_temperate_forest",
	node_top = "default:dirt_with_grass",
	depth_top = 1,
	node_filler = "default:dirt",
	depth_filler = 4,
	y_min = 1,
	y_max = 82,
	heat_point = 43,
	humidity_point = 72,
})

register_surface({
	name = "openclasscraft_freshwater_wetland",
	node_top = "default:dirt_with_grass",
	depth_top = 1,
	node_filler = "default:dirt",
	depth_filler = 5,
	node_riverbed = "default:clay",
	depth_riverbed = 2,
	y_min = 1,
	y_max = 18,
	heat_point = 66,
	humidity_point = 96,
})

register_surface({
	name = "openclasscraft_monsoon_forest",
	node_top = "default:dirt_with_rainforest_litter",
	depth_top = 1,
	node_filler = "default:dirt",
	depth_filler = 5,
	y_min = 1,
	y_max = 92,
	heat_point = 88,
	humidity_point = 88,
})

register_surface({
	name = "openclasscraft_grassland_savanna",
	node_top = "default:dry_dirt_with_dry_grass",
	depth_top = 1,
	node_filler = "default:dry_dirt",
	depth_filler = 4,
	y_min = 1,
	y_max = 82,
	heat_point = 79,
	humidity_point = 42,
})

register_surface({
	name = "openclasscraft_dry_scrub",
	node_top = "default:desert_sand",
	depth_top = 2,
	node_filler = "default:sandstone",
	depth_filler = 4,
	node_stone = "default:desert_stone",
	node_riverbed = "default:sand",
	y_min = 1,
	y_max = 82,
	heat_point = 94,
	humidity_point = 14,
})

register_surface({
	name = "openclasscraft_montane_conifer",
	node_top = "default:dirt_with_coniferous_litter",
	depth_top = 1,
	node_filler = "default:dirt",
	depth_filler = 3,
	y_min = 24,
	y_max = 126,
	heat_point = 29,
	humidity_point = 66,
})

register_surface({
	name = "openclasscraft_alpine_tundra",
	node_top = "default:dirt_with_snow",
	depth_top = 1,
	node_filler = "default:dirt",
	depth_filler = 2,
	node_riverbed = "default:gravel",
	y_min = 50,
	y_max = 31000,
	heat_point = 10,
	humidity_point = 48,
})

register_surface({
	name = "openclasscraft_mangrove_coast",
	node_top = "default:sand",
	depth_top = 2,
	node_filler = "default:dirt",
	depth_filler = 4,
	node_riverbed = "default:sand",
	y_min = -1,
	y_max = 12,
	heat_point = 81,
	humidity_point = 76,
})

minetest.register_biome({
	name = "openclasscraft_shallow_reef",
	node_top = "default:sand",
	depth_top = 2,
	node_filler = "default:sand",
	depth_filler = 4,
	node_stone = "default:stone",
	node_riverbed = "default:sand",
	depth_riverbed = 2,
	node_cave_liquid = "default:water_source",
	vertical_blend = 2,
	y_min = -9,
	y_max = 0,
	heat_point = 72,
	humidity_point = 72,
})

minetest.register_biome({
	name = "openclasscraft_geology",
	node_stone = "default:stone",
	node_cave_liquid = "default:water_source",
	y_min = -31000,
	y_max = -10,
	heat_point = 50,
	humidity_point = 50,
})

local function schematic_decoration(name, schematic, place_on, biomes, fill_ratio, y_min, y_max)
	minetest.register_decoration({
		name = "openclasscraft_mapgen:" .. name,
		deco_type = "schematic",
		place_on = place_on,
		sidelen = 16,
		fill_ratio = fill_ratio,
		biomes = biomes,
		y_min = y_min or 1,
		y_max = y_max or 31000,
		schematic = default_path .. "/schematics/" .. schematic,
		flags = "place_center_x,place_center_z",
		rotation = "random",
	})
end

local function simple_decoration(name, decoration, place_on, biomes, fill_ratio, y_min, y_max, extra)
	local definition = {
		name = "openclasscraft_mapgen:" .. name,
		deco_type = "simple",
		place_on = place_on,
		sidelen = 8,
		fill_ratio = fill_ratio,
		biomes = biomes,
		y_min = y_min or 1,
		y_max = y_max or 31000,
		decoration = decoration,
	}
	for key, value in pairs(extra or {}) do
		definition[key] = value
	end
	minetest.register_decoration(definition)
end

local meadow = {"openclasscraft_learning_meadow"}
local temperate = {"openclasscraft_temperate_forest"}
local wetland = {"openclasscraft_freshwater_wetland"}
local monsoon = {"openclasscraft_monsoon_forest"}
local savanna = {"openclasscraft_grassland_savanna"}
local dry_scrub = {"openclasscraft_dry_scrub"}
local montane = {"openclasscraft_montane_conifer"}
local alpine = {"openclasscraft_alpine_tundra"}
local mangrove = {"openclasscraft_mangrove_coast"}

schematic_decoration("meadow_aspen", "aspen_tree.mts", {"default:dirt_with_grass"}, meadow, 0.0018)
schematic_decoration("temperate_apple", "apple_tree.mts", {"default:dirt_with_grass"}, temperate, 0.008)
schematic_decoration("temperate_aspen", "aspen_tree.mts", {"default:dirt_with_grass"}, temperate, 0.006)
schematic_decoration("wetland_tree", "apple_tree.mts", {"default:dirt_with_grass"}, wetland, 0.002, 1, 18)
schematic_decoration("monsoon_jungle", "jungle_tree.mts", {"default:dirt_with_rainforest_litter"}, monsoon, 0.014)
schematic_decoration("monsoon_emergent", "emergent_jungle_tree.mts", {"default:dirt_with_rainforest_litter"}, monsoon, 0.0015)
schematic_decoration("savanna_acacia", "acacia_tree.mts", {"default:dry_dirt_with_dry_grass"}, savanna, 0.004)
schematic_decoration("montane_pine", "pine_tree.mts", {"default:dirt_with_coniferous_litter"}, montane, 0.011, 24, 126)
schematic_decoration("alpine_pine", "small_pine_tree.mts", {"default:dirt_with_snow"}, alpine, 0.0015, 50, 88)
schematic_decoration("mangrove_canopy", "jungle_tree.mts", {"default:sand"}, mangrove, 0.004, 0, 12)

simple_decoration("meadow_grass", {"default:grass_3", "default:grass_4", "default:grass_5"},
	{"default:dirt_with_grass"}, meadow, 0.12)
simple_decoration("meadow_flowers", {
	"openclasscraft_world:flower_yellow", "openclasscraft_world:flower_pink",
	"openclasscraft_world:flower_blue", "openclasscraft_world:flower_orange",
}, {"default:dirt_with_grass"}, meadow, 0.035)
simple_decoration("temperate_ferns", {"default:fern_1", "default:fern_2", "default:fern_3"},
	{"default:dirt_with_grass"}, temperate, 0.075)
simple_decoration("wetland_papyrus", "default:papyrus", {"default:dirt_with_grass"}, wetland, 0.045, 1, 18,
	{height = 2, height_max = 4, spawn_by = "default:water_source", num_spawn_by = 1})
simple_decoration("monsoon_grass", "default:junglegrass", {"default:dirt_with_rainforest_litter"}, monsoon, 0.11)
simple_decoration("savanna_grass", {"default:dry_grass_3", "default:dry_grass_4", "default:dry_grass_5"},
	{"default:dry_dirt_with_dry_grass"}, savanna, 0.16)
simple_decoration("dry_cactus", "default:cactus", {"default:desert_sand"}, dry_scrub, 0.0025, 1, 82,
	{height = 2, height_max = 4})
simple_decoration("dry_shrubs", "default:dry_shrub", {"default:desert_sand"}, dry_scrub, 0.014)
simple_decoration("montane_ferns", {"default:fern_1", "default:fern_2"},
	{"default:dirt_with_coniferous_litter"}, montane, 0.055, 24, 126)
simple_decoration("alpine_lichen", "openclasscraft_mapgen:alpine_lichen", {"default:dirt_with_snow"}, alpine, 0.035, 50)
simple_decoration("mangrove_roots", "openclasscraft_mapgen:mangrove_roots", {"default:sand"}, mangrove, 0.025, 0, 12,
	{spawn_by = "default:water_source", num_spawn_by = 1})

simple_decoration("shallow_corals", {
	"default:coral_green", "default:coral_pink", "default:coral_cyan",
	"default:coral_brown", "default:coral_orange", "default:coral_skeleton",
}, {"default:sand"}, {"openclasscraft_shallow_reef"}, 0.08, -8, -2,
	{place_offset_y = -1, flags = "force_placement"})
simple_decoration("shallow_kelp", "default:sand_with_kelp", {"default:sand"},
	{"openclasscraft_shallow_reef"}, 0.025, -9, -4,
	{place_offset_y = -1, flags = "force_placement", param2 = 48, param2_max = 80})

mapgen.BIOME_NAMES = {
	"openclasscraft_learning_meadow",
	"openclasscraft_temperate_forest",
	"openclasscraft_freshwater_wetland",
	"openclasscraft_monsoon_forest",
	"openclasscraft_grassland_savanna",
	"openclasscraft_dry_scrub",
	"openclasscraft_montane_conifer",
	"openclasscraft_alpine_tundra",
	"openclasscraft_mangrove_coast",
	"openclasscraft_shallow_reef",
	"openclasscraft_geology",
}
