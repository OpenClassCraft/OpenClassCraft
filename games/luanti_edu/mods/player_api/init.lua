dofile(minetest.get_modpath("player_api") .. "/api.lua")

local OPENCLASSCRAFT_ROLES = { student = true, educator = true, observer = true }

local function normalize_role(value)
	local role = value and value:lower() or "student"
	if role == "teacher" then
		role = "educator"
	end
	if not OPENCLASSCRAFT_ROLES[role] then
		role = "student"
	end
	return role
end

function player_api.get_openclasscraft_role(value)
	if not value then
		return "student"
	end
	if value.get_player_name then
		value = value:get_player_name()
	end
	local player = minetest.get_player_by_name(value)
	if not player then
		return "student"
	end
	local stored = player:get_meta():get_string("openclasscraft_role")
	return normalize_role(stored)
end

function player_api.set_openclasscraft_role(target, role, actor)
	role = normalize_role(role)
	local player = target
	if type(target) == "string" then
		player = minetest.get_player_by_name(target)
	end
	if not player or not player:is_player() then
		return false, "Player is not online."
	end
	player:get_meta():set_string("openclasscraft_role", role)
	player_api.set_textures(player, { role == "educator" and "professor.png" or "character.png" })
	player_api.set_model(player, "character.b3d")
	minetest.log("action", "[OpenClassCraft] " .. player:get_player_name() ..
		"'s classroom role set to " .. role ..
		(actor and (" by " .. actor) or ""))
	return true, "Role updated."
end

-- Default player appearance
player_api.register_model("character.b3d", {
	animation_speed = 34,
	textures = {"character.png"},
	animations = {
		-- Standard animations.
		stand     = {x = 0,   y = 79},
		lay       = {x = 162, y = 166, eye_height = 0.3, override_local = true,
			collisionbox = {-0.6, 0.0, -0.6, 0.6, 0.3, 0.6}},
		walk      = {x = 168, y = 187},
		mine      = {x = 189, y = 198},
		walk_mine = {x = 200, y = 219},
		sit       = {x = 81,  y = 160, eye_height = 0.8, override_local = true,
			collisionbox = {-0.3, 0.0, -0.3, 0.3, 1.0, 0.3}}
	},
	collisionbox = {-0.3, 0.0, -0.3, 0.3, 1.7, 0.3},
	stepheight = 0.6,
	eye_height = 1.47,
})

-- Update appearance when the player joins
minetest.register_on_joinplayer(function(player)
	local name = player:get_player_name()
	local host_name = minetest.settings:get("name") or ""
	local educator_mode = minetest.settings:get_bool("educator_mode") or false
	local role = player_api.get_openclasscraft_role(name)

	if educator_mode and (minetest.is_singleplayer() or name == host_name) then
		role = "educator"
	end

	player_api.set_model(player, "character.b3d")
	player_api.set_openclasscraft_role(player, role)
end)

minetest.register_chatcommand("occ_role", {
	description = "Show the current OpenClassCraft role for a player.",
	params = "[name]",
	func = function(name, param)
		local target = (param and param:match("^%s*(.-)%s*$")) or name
		return true, target .. " is " .. player_api.get_openclasscraft_role(target) .. "."
	end,
})

minetest.register_chatcommand("occ_set_role", {
	description = "Set an OpenClassCraft role for a connected player.",
	params = "<name> <student|educator|observer>",
	privs = {server = true},
	func = function(name, params)
		local target_name, role = params:match("^%s*(%S+)%s+(%S+)%s*$")
		if not target_name or not role then
			return false, "Usage: /occ_set_role <name> <student|educator|observer>"
		end
		return player_api.set_openclasscraft_role(target_name, role, name)
	end,
})

minetest.register_chatcommand("student_skin", {
	description = "Switch to the default Luanti Edu student skin.",
	func = function(name)
		local player = minetest.get_player_by_name(name)
		if not player then
			return false, "Player is not online."
		end
		player_api.set_textures(player, {"character.png"})
		return true, "Student skin applied."
	end,
})

minetest.register_chatcommand("educator_skin", {
	description = "Switch to the Luanti Edu professor skin.",
	func = function(name)
		local player = minetest.get_player_by_name(name)
		if not player then
			return false, "Player is not online."
		end
		player_api.set_textures(player, {"professor.png"})
		return true, "Professor skin applied."
	end,
})

minetest.register_chatcommand("professor_skin", {
	description = "Switch to the Luanti Edu professor skin.",
	func = function(name)
		local player = minetest.get_player_by_name(name)
		if not player then
			return false, "Player is not online."
		end
		player_api.set_textures(player, {"professor.png"})
		return true, "Professor skin applied."
	end,
})
