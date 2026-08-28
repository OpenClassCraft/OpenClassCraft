-- OpenClassCraft map generation
-- A focused learning world built on Luanti's native Valleys terrain.

openclasscraft_mapgen = rawget(_G, "openclasscraft_mapgen") or {}

local modpath = minetest.get_modpath(minetest.get_current_modname())

dofile(modpath .. "/nodes.lua")
dofile(modpath .. "/biomes.lua")
dofile(modpath .. "/campus.lua")

minetest.log("action", string.format(
	"[OpenClassCraft Mapgen] Loaded %d curated habitats, learning campus, and field trails",
	openclasscraft_mapgen.habitat_count or 0))
