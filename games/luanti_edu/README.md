# OpenClassCraft Educational Game

This directory contains the game layer bundled with [OpenClassCraft](https://github.com/OpenClassCraft/OpenClassCraft). It is derived from Minetest Game and adds physical block programming, a robot, classroom authoring tools, chemistry activities, accessibility-aware forms, a creative teaching catalog, and the OpenClassCraft world style.

For downloads, complete platform build instructions, Teacher Console setup, privacy notes, and project status, read the [main project documentation](https://github.com/OpenClassCraft/OpenClassCraft/blob/Latest/README.md).

## Game features

- A visible programming chain made from START, movement, turn, loop, condition, sensor, variable, wait, place, dig, stop, and wire nodes.
- A programmable robot entity and spawner.
- A searchable unlimited inventory with Classroom, Programming, and Chemistry categories.
- Editable Class Guide NPCs, blackboards, and whiteboards.
- A four-task Lesson Planner, per-player progress, teacher checks, and checkpoint flags.
- A Chemistry Lab supporting H₂O, O₂, H₂, CO₂, NaCl, NH₃, and CH₄.
- An in-game Creator Lab with four material styles and simple stored actions.
- A flat-area World Edit Wand intended for backed-up lesson worlds.
- Student and educator presentation, custom sky and music, learning-themed vegetation, and classroom textures.
- A branded class-chat card using Atkinson Hyperlegible Mono and a clickable <kbd>/</kbd> Actions center.
- Optional larger UI, stronger contrast, distinct selection color, simplified HUD, and helper chat settings.
- An optional HTTP bridge to a Teacher Console running on the same host computer.

## Start a robot program

1. Open the inventory and take a Robot Spawner and programming blocks.
2. Spawn one robot nearby.
3. Place START, then place instructions in a line to its east (world `+X`). Coding Wire can bridge gaps.
4. Right-click START to run the nearest robot within 32 nodes of the player.

Programs are linear and limited to 256 instructions. Loop, IF, and WHILE nodes act on the next instruction rather than a nested block body. ELSE and WHILE behavior is still experimental and should be tested before use in a lesson.

## Classroom authoring

- Interact with a Guide or board to read it; sneak-interact to edit it when ownership/server permissions allow.
- Use the Lesson Planner to create up to four ordered tasks: read a board, talk to a Guide, reach a checkpoint, make water, or receive a teacher check.
- Place atom items in the Chemistry Lab and choose a supported molecule.
- Press <kbd>/</kbd> to open the clickable Actions center for a starter kit, appearance, role, class joining, submissions, sky, music, and educator controls.
- Press <kbd>T</kbd> to open the larger OpenClassCraft class-chat card.
- New-player hotbars start empty; the inventory provides the curated Build, Classroom, Programming, Chemistry, Ecology, and Electronics catalogs.

The current creative catalog and editing tools are not strictly role-gated. Use trusted classroom servers and backed-up worlds.

## Main mods

| Mod | Responsibility |
| --- | --- |
| `luanti_coding` | Programming blocks, wires, parsing, and execution. |
| `luanti_robot` | Robot entity, spawner, movement, sensing, placing, and digging. |
| `openclasscraft_classroom` | Guides, boards, lesson progress, checkpoints, chemistry, and Teacher Console bridge. |
| `openclasscraft_creator` | Creator Lab materials/actions and World Edit Wand. |
| `openclasscraft_world` | Sky, music, vegetation, and generated world details. |
| `openclasscraft_interface` | Class chat, clickable Actions, class joining, submissions, and host role controls. |
| `creative` / `sfinv` | Searchable, categorized unlimited inventory. |
| `player_api` | Student/educator skins and presentation metadata. |
| `default` | Base nodes, tools, accessibility forms, and shared game behavior. |

## Configuration

The bundled defaults enable creative mode, disable player damage, prefer peaceful play, and stop automatic time progression. The game-level `disabled_settings` rule forces damage off. Server operators should still review `minetest.conf`, privileges, passwords, and firewall rules before hosting students.

Accessibility keys are declared in `settingtypes.txt`:

```text
openclasscraft_dyslexia_font
openclasscraft_read_aloud
openclasscraft_high_contrast
openclasscraft_colorblind_support
openclasscraft_simplified_controls
openclasscraft_large_ui
openclasscraft_visual_chat
openclasscraft_visual_commands
```

The read-aloud option emits labeled helper chat for screen-reader use; it does not synthesize speech. Colorblind support currently changes the selected-list highlight rather than recoloring every texture.

The Teacher Console bridge is disabled unless its URL, token, and HTTP-mod permission are added to `minetest.conf`. Its **Sync** action is visible only to the classroom host. Never commit an exported bridge token.

## Use with another Luanti build

The supported experience is the game bundled with the matching OpenClassCraft engine. For development, the `luanti_edu` folder can also be copied into the `games/` directory of a compatible Luanti 5.8-or-newer installation.

Stock Luanti will load the Lua game, but OpenClassCraft's customized main menu, loading screen, pause screen, font integration, and engine defaults live outside this directory and will not all be present.

## Development notes

- Lua source is under `mods/`; textures, models, and sounds live in each mod's media directories.
- Newly generated chunks receive the OpenClassCraft vegetation and decoration pass without survival ores. Existing generated terrain is not rewritten.
- Creator desktop exports use textures supplied by `openclasscraft_creator`, so they are not fully self-contained outside this game.
- The nested `.github/` directory came from the game lineage; repository CI workflows must live in the root `.github/workflows/` directory to run on GitHub.
- Custom game logic does not yet have complete automated end-to-end tests. Validate a fresh world, robot chain, lesson sequence, chemistry reaction, and multiplayer permission model after changes.

## Lineage and licensing

This game is derived from Minetest Game and retains its upstream notices. OpenClassCraft adds educational code and media on top of that base.

See [`LICENSE.txt`](LICENSE.txt) here and the repository's [`LICENSE.txt`](../../LICENSE.txt) and [`COPYING.LESSER`](../../COPYING.LESSER). Individual mods and assets may carry additional notices; preserve all applicable attribution when redistributing the game.
