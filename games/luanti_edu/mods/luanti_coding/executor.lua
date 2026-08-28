-- OpenClassCraft: Program Executor
-- Reads the chain of programming blocks starting from a START block,
-- builds a list of instructions, and executes them step-by-step on
-- the nearest luanti_robot entity.

luanti_coding = luanti_coding or {}

local MAX_INSTRUCTIONS = 256
local STEP_DELAY = 0.5
local WAIT_DELAY = 1.0
local WHILE_MAX_REPEAT = 16

local function code_feedback(pos, color)
    if not pos then return end
    minetest.add_particlespawner({
        amount = 10,
        time = 0.16,
        minpos = vector.subtract(pos, 0.35),
        maxpos = vector.add(pos, 0.35),
        minvel = {x = -0.2, y = 0.3, z = -0.2},
        maxvel = {x = 0.2, y = 0.8, z = 0.2},
        minsize = 1,
        maxsize = 2,
        texture = "default_item_smoke.png^[colorize:" .. color .. ":220",
        glow = 5,
    })
end

local function parse_program(start_pos)
    local instructions = {}
    local pos = vector.new(start_pos.x, start_pos.y, start_pos.z)
    local visited = {}

    for _ = 1, MAX_INSTRUCTIONS do
        local key = minetest.pos_to_string(pos)
        if visited[key] then
            break
        end
        visited[key] = true

        local node = minetest.get_node(pos)
        local def = minetest.registered_nodes[node.name]
        if not def then
            break
        end

        local action = def._coding_action
        if action == "stop" then
            table.insert(instructions, { action = "stop", pos = vector.new(pos) })
            break
        elseif action == "loop" then
            local meta = minetest.get_meta(pos)
            local count = meta:get_int("loop_count")
            if count == 0 then
                count = 3
            end
            table.insert(instructions, { action = "loop_start", count = count, pos = vector.new(pos) })
        elseif action then
            table.insert(instructions, { action = action, pos = vector.new(pos) })
        end

        local next_pos = vector.add(pos, vector.new(1, 0, 0))
        local next_node = minetest.get_node(next_pos)
        if next_node.name == "luanti_coding:wire" then
            local wire_pos = vector.new(next_pos.x, next_pos.y, next_pos.z)
            for _ = 1, 32 do
                wire_pos = vector.add(wire_pos, vector.new(1, 0, 0))
                local wn = minetest.get_node(wire_pos)
                if wn.name ~= "luanti_coding:wire" then
                    next_pos = wire_pos
                    break
                end
            end
        end

        local next_def = minetest.registered_nodes[minetest.get_node(next_pos).name]
        if not next_def or not (next_def._coding_action or next_def.groups.coding_stop) then
            break
        end

        pos = next_pos
    end

    return instructions
end

local function find_robot(player)
    local player_pos = player:get_pos()
    local objects = minetest.get_objects_inside_radius(player_pos, 32)
    local closest = nil
    local closest_dist = math.huge
    for _, obj in ipairs(objects) do
        local ent = obj:get_luaentity()
        if ent and ent.name == "luanti_robot:robot" then
            local d = vector.distance(player_pos, obj:get_pos())
            if d < closest_dist then
                closest = obj
                closest_dist = d
            end
        end
    end
    return closest
end

local function get_forward_node(ent)
    local pos = ent.object:get_pos()
    local dir_vec = ent._dir_vecs and ent._dir_vecs[ent._dir]
    if not dir_vec then
        return nil
    end
    return minetest.get_node(vector.add(pos, dir_vec))
end

local function report_program_result(player_name, success, steps, failed_step, message)
    local player = minetest.get_player_by_name(player_name)
    if player and openclasscraft_classroom and openclasscraft_classroom.report_event then
        openclasscraft_classroom.report_event(player, "robot_result", {
            title = success and "Robot program completed" or "Robot program paused",
            summary = message,
            result = {
                success = success,
                instructionCount = steps,
                failedStep = failed_step,
            },
        })
    end
end

local function execute_step(robot, instructions, index, player_name, state)
    state = state or { variables = {}, while_counts = {} }

    if index > #instructions then
        local ent = robot and robot:get_luaentity()
        if ent and ent.object then
            code_feedback(ent.object:get_pos(), "#44ff77")
        end
        minetest.chat_send_player(player_name, "[OpenClassCraft] Program finished!")
        report_program_result(player_name, true, #instructions, nil, "Program finished after all instructions ran.")
        return
    end

    local inst = instructions[index]
    local ent = robot:get_luaentity()
    if not ent then
        minetest.chat_send_player(player_name, "[OpenClassCraft] Robot not found!")
        return
    end

    local action = inst.action
    code_feedback(inst.pos, "#55ddff")

    if action == "move_forward" then
        if not ent:move_forward() then
            code_feedback(inst.pos, "#ff3344")
            minetest.chat_send_player(player_name, "[OpenClassCraft] Robot blocked at step " .. index .. ". Program paused.")
            report_program_result(player_name, false, #instructions, index, "Robot was blocked while moving forward.")
            return
        end
        minetest.chat_send_player(player_name, "[OpenClassCraft] Step " .. index .. ": Move Forward")

    elseif action == "turn_left" then
        ent:turn_left()
        minetest.chat_send_player(player_name, "[OpenClassCraft] Step " .. index .. ": Turn Left")

    elseif action == "turn_right" then
        ent:turn_right()
        minetest.chat_send_player(player_name, "[OpenClassCraft] Step " .. index .. ": Turn Right")

    elseif action == "place_block" then
        if not ent:place_block() then
            code_feedback(inst.pos, "#ff3344")
            minetest.chat_send_player(player_name, "[OpenClassCraft] Cannot place a block at step " .. index .. ". Program paused.")
            report_program_result(player_name, false, #instructions, index, "Robot could not place a block.")
            return
        end
        minetest.chat_send_player(player_name, "[OpenClassCraft] Step " .. index .. ": Place Block")

    elseif action == "dig_block" then
        if not ent:dig_block() then
            code_feedback(inst.pos, "#ff3344")
            minetest.chat_send_player(player_name, "[OpenClassCraft] Nothing to dig at step " .. index .. ". Program paused.")
            report_program_result(player_name, false, #instructions, index, "Robot found nothing to dig.")
            return
        end
        minetest.chat_send_player(player_name, "[OpenClassCraft] Step " .. index .. ": Dig Block")

    elseif action == "if_clear" then
        local is_clear = ent:is_forward_clear()
        minetest.chat_send_player(player_name,
            "[OpenClassCraft] Step " .. index .. ": IF Clear -> " ..
            (is_clear and "YES (run next)" or "NO (skip next)"))
        if not is_clear then
            index = index + 1
        end

    elseif action == "else_block" then
        minetest.chat_send_player(player_name,
            "[OpenClassCraft] Step " .. index .. ": ELSE -> skipping alternate block")
        index = index + 1

    elseif action == "while_clear" then
        local is_clear = ent:is_forward_clear()
        local repeats = state.while_counts[index] or 0
        minetest.chat_send_player(player_name,
            "[OpenClassCraft] Step " .. index .. ": WHILE Clear -> " ..
            (is_clear and "YES" or "NO") .. " (" .. repeats .. "/" .. WHILE_MAX_REPEAT .. ")")

        local next_inst = instructions[index + 1]
        if is_clear and next_inst and repeats < WHILE_MAX_REPEAT then
            state.while_counts[index] = repeats + 1
            local jump = instructions[index + 2]
            if jump and jump.action == "while_jump" and jump.target == index then
                minetest.after(STEP_DELAY, function()
                    execute_step(robot, instructions, index + 1, player_name, state)
                end)
            else
                local expanded = {}
                for i = 1, #instructions do
                    table.insert(expanded, instructions[i])
                    if i == index + 1 then
                        table.insert(expanded, { action = "while_jump", target = index })
                    end
                end
                minetest.after(STEP_DELAY, function()
                    execute_step(robot, expanded, index + 1, player_name, state)
                end)
            end
            return
        else
            state.while_counts[index] = 0
            if next_inst then
                local jump = instructions[index + 2]
                if jump and jump.action == "while_jump" and jump.target == index then
                    index = index + 2
                else
                    index = index + 1
                end
            end
        end

    elseif action == "while_jump" then
        minetest.after(STEP_DELAY, function()
            execute_step(robot, instructions, inst.target, player_name, state)
        end)
        return

    elseif action == "variable_inc" then
        state.variables.counter = (state.variables.counter or 0) + 1
        minetest.chat_send_player(player_name,
            "[OpenClassCraft] Step " .. index .. ": Variable counter = " .. state.variables.counter)

    elseif action == "sensor_clear" then
        local node = get_forward_node(ent)
        local is_clear = ent:is_forward_clear()
        local node_name = node and node.name or "unknown"
        minetest.chat_send_player(player_name,
            "[OpenClassCraft] Step " .. index .. ": Sensor sees " .. node_name ..
            " -> " .. (is_clear and "clear" or "blocked"))
        if not is_clear then
            index = index + 1
        end

    elseif action == "wait" then
        minetest.chat_send_player(player_name, "[OpenClassCraft] Step " .. index .. ": Wait")
        minetest.after(WAIT_DELAY, function()
            execute_step(robot, instructions, index + 1, player_name, state)
        end)
        return

    elseif action == "loop_start" then
        minetest.chat_send_player(player_name,
            "[OpenClassCraft] Step " .. index .. ": LOOP x" .. inst.count)
        local next_inst = instructions[index + 1]
        if next_inst then
            local expanded = {}
            for i = 1, #instructions do
                table.insert(expanded, instructions[i])
                if i == index then
                    for _ = 2, inst.count do
                        table.insert(expanded, next_inst)
                    end
                end
            end
            minetest.after(STEP_DELAY, function()
                execute_step(robot, expanded, index + 1, player_name, state)
            end)
            return
        end

    elseif action == "stop" then
        local stop_ent = robot and robot:get_luaentity()
        if stop_ent and stop_ent.object then
            code_feedback(stop_ent.object:get_pos(), "#44ff77")
        end
        minetest.chat_send_player(player_name, "[OpenClassCraft] Program complete!")
        report_program_result(player_name, true, #instructions, nil, "Program reached its STOP block.")
        return
    end

    minetest.after(STEP_DELAY, function()
        execute_step(robot, instructions, index + 1, player_name, state)
    end)
end

function luanti_coding.run_program(start_pos, player)
    local player_name = player:get_player_name()
    local robot = find_robot(player)

    if not robot then
        minetest.chat_send_player(player_name,
            "[OpenClassCraft] No robot found nearby! Place a Robot Spawner and right-click it first.")
        return
    end

    local instructions = parse_program(start_pos)

    if #instructions == 0 then
        minetest.chat_send_player(player_name,
            "[OpenClassCraft] No instructions found! Connect some blocks to the right of the START block.")
        return
    end

    minetest.chat_send_player(player_name,
        "[OpenClassCraft] Starting program with " .. #instructions .. " instruction(s)...")

    execute_step(robot, instructions, 1, player_name)
end
