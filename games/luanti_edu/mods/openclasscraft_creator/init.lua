-- The desktop OpenClassCraft Creator is the only supported authoring surface.
-- These definitions remain registered, but hidden, so existing lesson worlds
-- containing old Creator Lab blocks continue to load without unknown nodes.
local legacy_styles = {
	grass = {
		label = "Garden",
		node = "openclasscraft_creator:block_grass",
		texture = "openclasscraft_creator_garden.png",
	},
	stone = {
		label = "Stone",
		node = "openclasscraft_creator:block_stone",
		texture = "openclasscraft_creator_stone.png",
	},
	wood = {
		label = "Wood",
		node = "openclasscraft_creator:block_wood",
		texture = "openclasscraft_creator_wood.png",
	},
	glass = {
		label = "Glass",
		node = "openclasscraft_creator:block_glass",
		texture = "openclasscraft_creator_glass.png^[opacity:165",
	},
}

local world_edit_selections = {}

local function get_local_role(player)
	if not player or not player:is_player() then
		return "student"
	end
	if player_api and player_api.get_openclasscraft_role then
		return player_api.get_openclasscraft_role(player)
	end
	local name = player:get_player_name()
	if minetest.check_player_privs(name, {server = true}) then
		return "educator"
	end
	return "student"
end

local function permission_denied(player, action)
	local name = player:get_player_name()
	if openclasscraft_classroom and openclasscraft_classroom.world_policy_message then
		openclasscraft_classroom.world_policy_message(player, action)
	else
		minetest.chat_send_player(name, "[World Edit] This action is not available in the current class lesson policy.")
	end
end

local function can_perform_place(player, item_name)
	local role = get_local_role(player)
	if role == "educator" then
		return true
	end
	if openclasscraft_classroom and openclasscraft_classroom.policy_can then
		return openclasscraft_classroom.policy_can("place", player, item_name)
	end
	return false
end

local function can_use_world_edit_wand(player)
	local role = get_local_role(player)
	if role == "educator" then
		return true
	end
	if openclasscraft_classroom and openclasscraft_classroom.policy_can then
		return openclasscraft_classroom.policy_can(
			"world_edit_wand", player, "openclasscraft_creator:world_edit_wand")
	end
	return false
end

local function run_block_program(pos, player)
	local meta = minetest.get_meta(pos)
	local script = minetest.deserialize(meta:get_string("creator_script")) or {"say"}
	local message = meta:get_string("creator_message")
	local block_name = meta:get_string("creator_name")
	local delay = 0
	for _, action in ipairs(script) do
		if action == "wait" then
			delay = delay + 1
		elseif action == "say" then
			minetest.after(delay, function()
				local display_name = block_name ~= "" and block_name or "Creator Block"
				minetest.chat_send_player(player:get_player_name(),
					"[" .. display_name .. "] " .. message)
			end)
		elseif action == "give_apple" then
			minetest.after(delay, function()
				local stack = ItemStack("default:apple")
				if player:get_inventory():room_for_item("main", stack) then
					player:get_inventory():add_item("main", stack)
				else
					minetest.add_item(vector.offset(player:get_pos(), 0, 1, 0), stack)
				end
			end)
		end
	end
end

local function place_project_block(itemstack, placer, pointed_thing)
	if not can_perform_place(placer, itemstack:get_name()) then
		permission_denied(placer, "place")
		return itemstack
	end
	-- item_place may consume the stack, so keep the project payload before it runs.
	local item_meta = itemstack:get_meta()
	local project_payload = {
		name = item_meta:get_string("creator_name"),
		message = item_meta:get_string("creator_message"),
		script = item_meta:get_string("creator_script"),
	}
	local result = minetest.item_place(itemstack, placer, pointed_thing)
	if pointed_thing.type ~= "node" then
		return result
	end
	local pos = pointed_thing.above
	if minetest.get_node(pos).name ~= itemstack:get_name() then
		return result
	end
	local node_meta = minetest.get_meta(pos)
	node_meta:set_string("creator_name", project_payload.name)
	node_meta:set_string("creator_message", project_payload.message)
	node_meta:set_string("creator_script", project_payload.script)
	node_meta:set_string("owner", placer and placer:get_player_name() or "")
	node_meta:set_string("infotext", project_payload.name)
	return result
end

local function texture_name(tile)
	if type(tile) == "string" then
		return tile
	end
	if type(tile) == "table" then
		return tile.name
	end
	return nil
end

-- Use each node's actual world faces for its inventory icon. This keeps the
-- catalog honest: a block icon now looks like the block that is placed.
minetest.register_on_mods_loaded(function()
	local solid_tiles = {
		["default:sandstone"] = "openclasscraft_sandstone.png",
		["default:sandstonebrick"] = "openclasscraft_sandstone_brick.png",
		["default:sandstone_block"] = "openclasscraft_sandstone_block.png",
		["default:desert_sandstone"] = "openclasscraft_desert_sandstone.png",
		["default:desert_sandstone_brick"] = "openclasscraft_desert_sandstone_brick.png",
		["default:desert_sandstone_block"] = "openclasscraft_desert_sandstone_block.png",
		["default:desert_cobble"] = "openclasscraft_desert_cobble.png",
		["default:mossycobble"] = "openclasscraft_mossycobble.png",
		["default:brick"] = "openclasscraft_brick.png",
		["default:steelblock"] = "openclasscraft_steelblock.png",
		["default:stonebrick"] = "openclasscraft_stonebrick.png",
		["default:obsidian"] = "openclasscraft_obsidian.png",
		["default:obsidianbrick"] = "openclasscraft_obsidian_brick.png",
		["default:obsidian_block"] = "openclasscraft_obsidian_block.png",
		["default:wood"] = "openclasscraft_wood.png",
		["default:junglewood"] = "openclasscraft_junglewood.png",
		["default:pine_wood"] = "openclasscraft_pine_wood.png",
		["default:acacia_wood"] = "openclasscraft_acacia_wood.png",
		["default:aspen_wood"] = "openclasscraft_aspen_wood.png",
		["default:stone_with_coal"] = "openclasscraft_ore_coal.png",
		["default:stone_with_iron"] = "openclasscraft_ore_iron.png",
		["default:stone_with_copper"] = "openclasscraft_ore_copper.png",
		["default:stone_with_tin"] = "openclasscraft_ore_tin.png",
		["default:stone_with_gold"] = "openclasscraft_ore_gold.png",
		["default:stone_with_mese"] = "openclasscraft_ore_mese.png",
		["default:stone_with_diamond"] = "openclasscraft_ore_diamond.png",
		["default:coral_skeleton"] = "openclasscraft_coral_skeleton.png",
	}
	for name, texture in pairs(solid_tiles) do
		if minetest.registered_nodes[name] then
			minetest.override_item(name, {tiles = {texture}})
		end
	end

	if minetest.registered_nodes["default:cactus"] then
		minetest.override_item("default:cactus", {
			tiles = {"openclasscraft_cactus_top.png", "openclasscraft_cactus_top.png", "openclasscraft_cactus_side.png"},
		})
	end

	local plant_textures = {
		["default:sapling"] = "openclasscraft_sapling_alpha.png",
		["default:junglesapling"] = "openclasscraft_junglesapling_alpha.png",
		["default:emergent_jungle_sapling"] = "openclasscraft_junglesapling_alpha.png",
		["default:pine_sapling"] = "openclasscraft_pine_sapling_alpha.png",
		["default:acacia_sapling"] = "openclasscraft_acacia_sapling_alpha.png",
		["default:aspen_sapling"] = "openclasscraft_aspen_sapling_alpha.png",
		["default:junglegrass"] = "openclasscraft_junglegrass_sprite_alpha.png",
		["default:fern_1"] = "openclasscraft_fern_sprite_alpha.png",
	}
	for index = 1, 5 do
		plant_textures["default:grass_" .. index] = "openclasscraft_grass_sprite_alpha.png"
		plant_textures["default:dry_grass_" .. index] = "openclasscraft_dry_grass_sprite_alpha.png"
	end
	for index = 2, 3 do
		plant_textures["default:fern_" .. index] = "openclasscraft_fern_sprite_alpha.png"
	end
	for name, texture in pairs(plant_textures) do
		if minetest.registered_nodes[name] then
			minetest.override_item(name, {
				tiles = {texture},
				inventory_image = texture,
				wield_image = texture,
			})
		end
	end

	local coral_textures = {
		["default:coral_green"] = "openclasscraft_coral_green_alpha.png",
		["default:coral_pink"] = "openclasscraft_coral_pink_alpha.png",
		["default:coral_cyan"] = "openclasscraft_coral_cyan_alpha.png",
		["default:coral_orange"] = "openclasscraft_coral_orange_alpha.png",
		["default:coral_brown"] = "openclasscraft_coral_brown_alpha.png",
	}
	for name, texture in pairs(coral_textures) do
		if minetest.registered_nodes[name] then
			minetest.override_item(name, {
				tiles = {texture},
				special_tiles = {{name = texture, tileable_vertical = true}},
				inventory_image = texture,
				wield_image = texture,
			})
		end
	end

	local torch_texture = {
		name = "openclasscraft_torch_animated.png",
		animation = {type = "vertical_frames", aspect_w = 1, aspect_h = 1, length = 0.8},
	}
	for _, name in ipairs({"default:torch", "default:torch_wall", "default:torch_ceiling"}) do
		if minetest.registered_nodes[name] then
			minetest.override_item(name, {
				tiles = {torch_texture},
				inventory_image = "openclasscraft_torch_frame_1_alpha.png",
				wield_image = "openclasscraft_torch_frame_1_alpha.png",
			})
		end
	end

	-- Keep unrelated world textures unchanged. Only OpenClassCraft's Chemistry
	-- Lab receives this dedicated classroom material set.
	if minetest.registered_nodes["openclasscraft_classroom:chemistry_lab"] then
		minetest.override_item("openclasscraft_classroom:chemistry_lab", {
			tiles = {
				"openclasscraft_metal.png", "openclasscraft_metal.png",
				"openclasscraft_tech.png", "openclasscraft_tech.png",
				"openclasscraft_chemistry.png", "openclasscraft_chemistry.png",
			},
		})
	end
	if minetest.registered_nodes["openclasscraft_classroom:chalkboard"] then
		minetest.override_item("openclasscraft_classroom:chalkboard", {
			inventory_image = "openclasscraft_board.png^[colorize:#071018:130",
		})
	end

	local item_icons = {
		["openclasscraft_classroom:hydrogen_atom"] = "openclasscraft_icon_hydrogen_atom_alpha.png",
		["openclasscraft_classroom:oxygen_atom"] = "openclasscraft_icon_oxygen_atom_alpha.png",
		["openclasscraft_classroom:carbon_atom"] = "openclasscraft_icon_carbon_atom_alpha.png",
		["openclasscraft_classroom:nitrogen_atom"] = "openclasscraft_icon_nitrogen_atom_alpha.png",
		["openclasscraft_classroom:sodium_atom"] = "openclasscraft_icon_sodium_atom_alpha.png",
		["openclasscraft_classroom:chlorine_atom"] = "openclasscraft_icon_chlorine_atom_alpha.png",
		["openclasscraft_classroom:water_molecule"] = "openclasscraft_icon_water_molecule_alpha.png",
		["openclasscraft_classroom:oxygen_molecule"] = "openclasscraft_icon_oxygen_molecule_alpha.png",
		["openclasscraft_classroom:hydrogen_molecule"] = "openclasscraft_icon_hydrogen_molecule_alpha.png",
		["openclasscraft_classroom:carbon_dioxide"] = "openclasscraft_icon_carbon_dioxide_alpha.png",
		["openclasscraft_classroom:sodium_chloride"] = "openclasscraft_icon_sodium_chloride_alpha.png",
		["openclasscraft_classroom:ammonia"] = "openclasscraft_icon_ammonia_alpha.png",
		["openclasscraft_classroom:methane"] = "openclasscraft_icon_methane_alpha.png",
		["openclasscraft_classroom:lesson_planner"] = "openclasscraft_icon_lesson_planner_alpha.png",
	}
	for name, image in pairs(item_icons) do
		if minetest.registered_items[name] then
			minetest.override_item(name, {inventory_image = image})
		end
	end

	for name, definition in pairs(minetest.registered_nodes) do
		local groups = definition.groups or {}
		local tiles = definition.tiles
		if name ~= "air" and groups.not_in_creative_inventory ~= 1 and
			not definition.inventory_image and type(tiles) == "table" then
			local top = texture_name(tiles[1])
			local front = texture_name(tiles[5]) or texture_name(tiles[6]) or texture_name(tiles[3]) or top
			local side = texture_name(tiles[4]) or texture_name(tiles[2]) or top
			if top and front and side then
				minetest.override_item(name, {
					inventory_image = minetest.inventorycube(top, front, side),
				})
			end
		end
	end
end)

for _, style in pairs(legacy_styles) do
	minetest.register_node(style.node, {
		description = "Legacy Learning Block (" .. style.label .. ")",
		tiles = {style.texture},
		groups = {
			crumbly = 2,
			oddly_breakable_by_hand = 2,
			not_in_creative_inventory = 1,
		},
		is_ground_content = false,
		drop = "",
		on_place = place_project_block,
		on_rightclick = function(pos, node, clicker)
			run_block_program(pos, clicker)
		end,
	})
end

-- Old Creator Lab items turn into an ordinary book. No authoring form or
-- creator item is registered in the game anymore.
minetest.register_alias("openclasscraft_creator:lab", "default:book")

local function world_edit_marker(player, message)
	minetest.chat_send_player(player:get_player_name(), "[World Edit] " .. message)
end

local function selected_node_pos(pointed_thing)
	if not pointed_thing or pointed_thing.type ~= "node" then
		return nil
	end
	return vector.round(pointed_thing.under)
end

local function remove_entities_in_flat_area(minp, maxp)
	local center = vector.new((minp.x + maxp.x) / 2, minp.y + 4, (minp.z + maxp.z) / 2)
	local radius = math.max(maxp.x - minp.x, maxp.z - minp.z) / 2 + 8
	local removed = 0
	for _, object in ipairs(minetest.get_objects_inside_radius(center, radius)) do
		if not object:is_player() then
			local pos = object:get_pos()
			if pos and pos.x >= minp.x and pos.x <= maxp.x and
					pos.z >= minp.z and pos.z <= maxp.z and
					pos.y >= minp.y - 2 and pos.y <= minp.y + 12 then
				object:remove()
				removed = removed + 1
			end
		end
	end
	return removed
end

local function clear_world_edit_area(player)
	local name = player:get_player_name()
	local selection = world_edit_selections[name]
	if not selection or not selection.pos1 or not selection.pos2 then
		world_edit_marker(player, "Select two corners first: left-click corner 1, then left-click corner 2.")
		return
	end

	local pos1 = selection.pos1
	local pos2 = selection.pos2
	local minp = {
		x = math.min(pos1.x, pos2.x),
		y = pos1.y,
		z = math.min(pos1.z, pos2.z),
	}
	local maxp = {
		x = math.max(pos1.x, pos2.x),
		y = pos1.y,
		z = math.max(pos1.z, pos2.z),
	}
	local width = maxp.x - minp.x + 1
	local depth = maxp.z - minp.z + 1
	local nodes = width * depth
	if nodes > 4096 then
		world_edit_marker(player, "Area is too large. Keep flat clears under 4096 blocks.")
		return
	end

	local cleared_nodes = 0
	for x = minp.x, maxp.x do
		for z = minp.z, maxp.z do
			local pos = {x = x, y = minp.y, z = z}
			local node = minetest.get_node(pos)
			if node.name ~= "air" and node.name ~= "ignore" then
				minetest.remove_node(pos)
				cleared_nodes = cleared_nodes + 1
			end
		end
	end

	local removed_entities = remove_entities_in_flat_area(minp, maxp)
	world_edit_selections[name] = nil
	world_edit_marker(player,
		"Cleared " .. cleared_nodes .. " flat blocks and removed " .. removed_entities .. " entities.")
end

local function use_world_edit_wand(player, pointed_thing)
	if not can_use_world_edit_wand(player) then
		permission_denied(player, "world_edit_wand")
		return
	end
	local pos = selected_node_pos(pointed_thing)
	if not pos then
		clear_world_edit_area(player)
		return
	end

	local name = player:get_player_name()
	local selection = world_edit_selections[name] or {}
	if not selection.pos1 then
		world_edit_selections[name] = {pos1 = pos}
		world_edit_marker(player,
			"Corner 1 set at " .. minetest.pos_to_string(pos) .. ". Click another block for corner 2.")
	elseif not selection.pos2 then
		selection.pos2 = pos
		world_edit_selections[name] = selection
		world_edit_marker(player,
			"Corner 2 set at " .. minetest.pos_to_string(pos) .. ". Click once more with the wand to clear.")
	else
		clear_world_edit_area(player)
	end
end

minetest.register_tool("openclasscraft_creator:world_edit_wand", {
	description = "World Edit Wand\nClick two corners, then click again to clear a flat area and entities",
	inventory_image = "openclasscraft_icon_creator_lab_alpha.png^[colorize:#31d7ff:80",
	groups = {classroom = 1},
	on_use = function(itemstack, user, pointed_thing)
		use_world_edit_wand(user, pointed_thing)
		return itemstack
	end,
	on_place = function(itemstack, placer, pointed_thing)
		use_world_edit_wand(placer, pointed_thing)
		return itemstack
	end,
	on_secondary_use = function(itemstack, user)
		use_world_edit_wand(user)
		return itemstack
	end,
})
