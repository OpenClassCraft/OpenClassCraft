-- OpenClassCraft catalog setup.
-- New players start with an empty hotbar and choose unlimited items from the
-- categorized inventory catalog. /givetools remains available for testing.

local STARTER_ITEMS = {
    -- Starter tools. These use diamond-level capabilities but appear as normal tools.
    "default:pick_diamond",
    "default:axe_diamond",
    "default:shovel_diamond",

    -- Robot Spawner
    "luanti_robot:spawner",
    "openclasscraft_classroom:guide_npc_spawner",
    "openclasscraft_classroom:chalkboard",
    "openclasscraft_classroom:whiteboard",
    "openclasscraft_classroom:chemistry_lab",
	"openclasscraft_classroom:hydrogen_atom 16",
	"openclasscraft_classroom:oxygen_atom 12",
	"openclasscraft_classroom:carbon_atom 8",
	"openclasscraft_classroom:nitrogen_atom 8",
	"openclasscraft_classroom:sodium_atom 8",
	"openclasscraft_classroom:chlorine_atom 8",
    "openclasscraft_classroom:lesson_planner",
    "openclasscraft_classroom:lesson_marker 3",
    "openclasscraft_creator:world_edit_wand",
	"openclasscraft_ecology:field_journal",
	"openclasscraft_ecology:learning_seeds 8",
	"openclasscraft_ecology:pet_treat 4",
	"openclasscraft_ecology:spawn_rabbit 2",
	"openclasscraft_ecology:spawn_deer",
	"openclasscraft_ecology:spawn_fox",
	"openclasscraft_electronics:battery_off 2",
	"openclasscraft_electronics:switch_off 2",
	"openclasscraft_electronics:wire 16",
	"openclasscraft_electronics:lamp 2",
	"openclasscraft_electronics:motor 2",
	"openclasscraft_electronics:multimeter",

    -- All Coding Blocks (5 of each)
    "luanti_coding:start",
    "luanti_coding:move_forward 5",
    "luanti_coding:turn_left 5",
    "luanti_coding:turn_right 5",
    "luanti_coding:loop 5",
    "luanti_coding:if_clear 5",
    "luanti_coding:else_block 5",
    "luanti_coding:while_clear 5",
    "luanti_coding:variable 5",
    "luanti_coding:sensor 5",
    "luanti_coding:wait 5",
    "luanti_coding:place_block 5",
    "luanti_coding:dig_block 5",
    "luanti_coding:stop 5",
    "luanti_coding:wire 16",
}

local function give_stuff(player)
    local inv = player:get_inventory()
    for _, item in ipairs(STARTER_ITEMS) do
        local stack = ItemStack(item)
        if inv:room_for_item("main", stack) then
            inv:add_item("main", stack)
        end
    end
    minetest.chat_send_player(player:get_player_name(),
        "=== Welcome to OpenClassCraft! ===\n" ..
        "You have been given:\n" ..
        "  - Pickaxe, Axe, and Shovel\n" ..
        "  - A Robot Spawner\n" ..
        "  - Guide NPC, Classroom Boards, Chemistry Lab, and Lesson Planner\n" ..
        "  - All Programming Blocks\n" ..
		"  - Ecology field kit, animals, pets, seeds, and habitat tools\n" ..
		"  - Battery, switch, wires, lamps, motors, and multimeter\n" ..
        "Place the Robot Spawner, right-click to spawn your robot,\n" ..
        "then place a START block and connect programming blocks to the right!\n" ..
        "Right-click the START block to run your program."
    )
end

minetest.register_on_joinplayer(function(player)
	local meta = player:get_meta()
	minetest.after(1, function()
		if player and player:is_player() then
			if meta:get_int("openclasscraft_catalog_welcome") == 0 then
				meta:set_int("openclasscraft_catalog_welcome", 1)
				minetest.chat_send_player(player:get_player_name(),
					"[OpenClassCraft] Your hotbar starts empty. Open inventory to choose items from the unlimited catalog.")
			end
		end
	end)
end)

-- Optional command for teachers who prefer a preselected kit.
minetest.register_chatcommand("givetools", {
    description = "Give starter tools and coding blocks",
    func = function(name)
        local player = minetest.get_player_by_name(name)
        if player then
            give_stuff(player)
            return true, "Starter items given!"
        end
        return false, "Player not found"
    end,
})

minetest.log("action", "[give_initial_stuff] Loaded!")
