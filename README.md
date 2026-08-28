# OpenClassCraft

<p align="center">
  <img src="games/luanti_edu/menu/icon.png" alt="OpenClassCraft logo" width="220">
</p>

<p align="center">
  <a href="https://github.com/OpenClassCraft/OpenClassCraft/tree/Latest"><img alt="Development branch: Latest" src="https://img.shields.io/badge/branch-Latest-4f8f55"></a>
  <a href="https://github.com/OpenClassCraft/OpenClassCraft/actions/workflows/release-build.yml?query=branch%3ALatest"><img alt="Release builds" src="https://github.com/OpenClassCraft/OpenClassCraft/actions/workflows/release-build.yml/badge.svg?branch=Latest"></a>
  <a href="https://github.com/OpenClassCraft/OpenClassCraft/releases"><img alt="GitHub release" src="https://img.shields.io/github/v/release/OpenClassCraft/OpenClassCraft?include_prereleases"></a>
  <a href="https://github.com/OpenClassCraft/OpenClassCraft/issues"><img alt="Open issues" src="https://img.shields.io/github/issues/OpenClassCraft/OpenClassCraft"></a>
</p>

OpenClassCraft is an offline-first, open-source voxel learning world. Students arrange programming blocks and run a nearby robot, investigate habitats and persistent wildlife, grow plants, and build working classroom circuits with batteries, switches, lamps, and motors.

The project combines a customized [Luanti](https://www.luanti.org/) engine, an educational game derived from Minetest Game, in-world lesson tools, a visual mod creator, and an offline-first Teacher Console.

> **Project status:** OpenClassCraft is an early Community preview and is preparing a controlled Founding School Beta. Public source or a development tag is not a production release. Use only validated files attached to the Releases page, and review [Known limitations](#known-limitations) before using the project for an assessed lesson.

## Contents

- [What is included](#what-is-included)
- [Editions and founding beta](#editions-and-founding-beta)
- [Download and play](#download-and-play)
- [First coding lesson](#first-coding-lesson)
- [Robot programming reference](#robot-programming-reference)
- [Ecology and companion animals](#ecology-and-companion-animals)
- [Electronics and mechanisms](#electronics-and-mechanisms)
- [Classroom and lesson tools](#classroom-and-lesson-tools)
- [Local classroom multiplayer](#local-classroom-multiplayer)
- [Accessibility](#accessibility)
- [Creator tools](#creator-tools)
- [Teacher Console and lesson bridge](#teacher-console-and-lesson-bridge)
- [Build from source](#build-from-source)
- [Developer guide](#developer-guide)
- [Known limitations](#known-limitations)
- [Contributing and security](#contributing-and-security)
- [License and credits](#license-and-credits)

## Editions and founding beta

The launch model keeps learner access open while giving schools a supported adoption path:

| Edition | Availability | Price decision |
| --- | --- | --- |
| Community game | Public, free, and open source | ₹0; no student subscription |
| Desktop Creator | Developer preview until its generation and packaging gates pass | No paid promise yet |
| School Console beta | Separately licensed and supplied only to selected pilot schools | First three qualified private-school pilots free for 90 days; additional guided beta ₹4,999 for eight weeks |
| Founding annual school plan | Offered only after the paid-readiness gates pass | Proposed ₹12,499 for the first campus year, then ₹24,999 per campus/year |

The planned school price covers onboarding, the operational Console, teacher training, curriculum delivery, updates, and support—not a paywall around the Community game. Eligible, properly authorised government schools in any region may apply for sponsored licences, but OpenClassCraft cannot grant the local approvals required by a school or education authority.

- [Launch operating plan](docs/launch/README.md)
- [School offer and commercial guardrails](docs/launch/SCHOOL_OFFER.md)
- [Founding beta playbook](docs/launch/PILOT_PLAYBOOK.md)
- [30-day school and community outreach kit](docs/launch/OUTREACH_KIT.md)
- [Release and paid-readiness gates](docs/launch/RELEASE_CHECKLIST.md)
- [English teacher quickstart](docs/launch/TEACHER_QUICKSTART.en.md) · [Malayalam teacher quickstart](docs/launch/TEACHER_QUICKSTART.ml.md)
- [Launch-site source](website/)

## What is included

| Area | Current implementation |
| --- | --- |
| Physical block coding | A `START` block reads a line of programming blocks and drives a nearby robot. Movement, turning, bounded repetition, conditions, sensing, waiting, placing, digging, variables, and stopping are represented in-world. |
| Programmable robot | A persistent robot entity can move, rotate, inspect the node ahead, place stone, and dig. |
| Ecology and habitats | Meadow, monsoon-forest, and freshwater-wetland biome content supports growable pollinator plants, bounded wildlife spawning, farm animals, persistent real-life pets, predator–prey behavior, and measurable habitat surveys. |
| Classroom electronics | Deterministic, bounded power networks connect batteries, switches, wires, lamps, and rotating motors. A multimeter reports component state. |
| Lesson authoring | Placeable Guides, blackboards, whiteboards, a Lesson Planner, and checkpoint flags let an educator build instructions and progress tasks into a world. |
| Chemistry activities | A Chemistry Lab combines H, O, C, N, Na, and Cl atom items into seven supported molecules, including water, oxygen, carbon dioxide, salt, ammonia, and methane. |
| Creative catalog | An unlimited, searchable catalog is organized into All, Nodes, Tools, Items, Classroom, Programming, Chemistry, Ecology, and Electronics tabs. The normal crafting grid is intentionally absent from the classroom inventory. |
| Classroom presentation | Custom menus, loading and pause screens, student/educator skins, sky and cloud settings, ambient music, classroom textures, and learning-themed generated plants and trees. |
| Local multiplayer | A teacher can host from the simplified start screen. Students discover the class on the local network or use the host's private LAN address as a fallback, then join with a name and optional password. |
| Accessibility switches | Dyslexia-friendly font, larger UI, stronger form contrast, a more distinct selected-item color, simplified HUD, and screen-reader-friendly helper chat. See the exact behavior [below](#accessibility). |
| Creator Lab | An in-game, form-based editor creates reusable behavior blocks and includes a flat-area World Edit Wand. |
| Desktop Creator | A separate Electron and Blockly prototype exports an OpenClassCraft mod folder containing Lua, `mod.conf`, and project JSON. |
| School Console beta | A separately licensed local Electron app manages lessons, students, groups, assignments, manual progress, CSV reports, JSON backups, and an optional loopback lesson bridge. It is not part of a public Community release. |

OpenClassCraft is a focused game distribution, not a replacement name for the general-purpose Luanti engine. The engine lineage and upstream notices remain important parts of the project.

## Download and play

Use only files published on the [OpenClassCraft Releases page](https://github.com/OpenClassCraft/OpenClassCraft/releases). Release assets, when available for a tag, use these platform labels:

| Platform | Release asset | Start it |
| --- | --- | --- |
| Fedora 44 x64 | `OpenClassCraft-Fedora-44-x86_64.rpm` | Install with `sudo dnf install ./OpenClassCraft-Fedora-44-x86_64.rpm`, then run `openclasscraft`. |
| Ubuntu 24.04 x64 | `OpenClassCraft-Ubuntu-24.04-x86_64.tar.gz` | Deferred compatibility build: extract it, enter its package root, and run `bin/openclasscraft`. |
| Windows x64 | `OpenClassCraft-Windows-x64.zip` | `bin\openclasscraft.exe` |

Public GitHub Releases contain only the Community game archives and their checksums. The workflow creates separately named Creator preview artifacts for developer testing. School Console packages require an explicit, owner-authorised manual build option and are never selected by the public release job. Neither desktop tool is required to play the Community game.

Download the matching `.sha256` file as well and verify the archive before opening it. Extract ZIP/TGZ archives completely so that the game, textures, sounds, fonts, and runtime libraries stay beside the executable. If an asset is not attached for your platform, follow [Build from source](#build-from-source); an asset name in this table is not a promise that every release contains all three builds.

### Create a world

1. Open **Start Game** and choose **Singleplayer**.
2. Select **New World**, name it, and create it with the OpenClassCraft game.
3. Select the world and choose **Play Game**.
4. Open the inventory (the default key is <kbd>I</kbd>) and choose **Programming**, **Classroom**, **Chemistry**, **Ecology**, or **Electronics**.

New players intentionally start with an empty hotbar. The unlimited catalog contains the lesson items; `/givetools` is also available when a quick teaching kit is useful.

Default movement follows Luanti conventions: <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> to move, <kbd>Space</kbd> to jump, left click to dig/use, right click to place/interact, and <kbd>Esc</kbd> for the pause menu. Keys can be changed in Settings.

## First coding lesson

1. Take a **Robot Spawner**, **START**, **Move Forward**, **Turn Right**, and **Stop** from the Programming catalog.
2. Use the spawner on clear ground.
3. Place `START`, then place instructions immediately to its east (world `+X`) in the order they should execute. Coding Wire can bridge gaps.
4. Stay within 32 nodes of the robot and right-click `START`.
5. Change one instruction and run the chain again. This is a useful first debugging exercise because the program is visible in the world.

The reader follows at most 256 instructions. A continuous wire segment is bounded to 32 nodes, and circular chains stop instead of running forever.

## Robot programming reference

The current executor is deliberately small. A loop or condition acts on the next instruction rather than on a nested visual block body.

| Block | Current behavior |
| --- | --- |
| START | Reads the connected chain and starts the nearest robot found within 32 nodes of the player. |
| Move Forward | Moves the robot forward by one node. |
| Turn Left / Turn Right | Rotates the robot 90 degrees. |
| Loop | Repeats the next instruction 1–99 times; the placed block defaults to 3. |
| IF Clear | Continues through the next instruction when the robot's front is clear; skips it when blocked. |
| ELSE | An alternate marker is registered, but its branch behavior is experimental. Test it before teaching with it. |
| WHILE Clear | Bounded repetition of the next instruction while the front is clear, with a safety limit of 16 iterations. This path is experimental. |
| Variable | Increments one run-local counter and reports its value. It is not yet a named-variable system. |
| Sensor | Reports the node in front and skips the next instruction when that space is blocked. |
| Wait | Pauses the sequence for one second. |
| Place Block | Places stone in the space immediately ahead when possible. |
| Dig Block | Digs the node immediately ahead when possible. |
| Stop | Ends the sequence. |
| Coding Wire | Extends the linear connection between instruction blocks. |

The closest robot is chosen relative to the player who starts the program. Keep only the intended robot nearby when several groups work in the same area.

## Ecology and companion animals

Open the **Ecology** catalog for the Field Journal, seeds, companion treats, plants, and habitat eggs.

1. Plant **Learning Garden Seeds** on a soil node. A seedling grows into a pollinator flower when it has enough light.
2. Place a habitat or farm token for a rabbit, deer, fox, squirrel, duck, cow, or chicken. New terrain can also spawn a bounded mix of appropriate wildlife naturally.
3. Place a dog or cat **Adoption Token**, then use a **Companion Treat** to set persistent ownership. Rabbits and foxes can also become companions. The companion follows its owner; right-click it again to toggle follow/stay. Other species remain observation animals.
4. Use the **Ecosystem Field Journal** to count nearby plants, tree nodes, water, animals, and animal species and calculate a repeatable habitat score.

All nine species use lightweight rigged models, species-appropriate scales, and distinct movement. Rabbits and squirrels freeze before bounding away; deer watch from farther off and then run; ducks waddle on land, float and swim in water, and forage near wetlands; cows calmly graze and step away when crowded; chickens peck and flee sudden danger. Wild foxes stalk and chase rabbits, squirrels, ducks, and chickens, while prey use evasive escape paths. These chases remain classroom-safe and do not damage either animal. Unowned dogs greet players socially, while cats tend to observe before approaching. A held Companion Treat attracts tameable animals, and owned companions follow or stay for their owner. Movement accelerates and turns smoothly, avoids unsafe drops, preserves momentum through hops, and steers around blocked routes.

Newly generated terrain can include pollinator meadow, monsoon forest, and freshwater wetland biome content. Existing explored map chunks are not regenerated, so use a new world or travel into new terrain to see map-generation changes.

## Electronics and mechanisms

Open the **Electronics** catalog for a classroom battery, switch, wire, lamp, motor, and multimeter.

1. Place a battery and right-click it to enable its simplified safe output.
2. Connect adjacent wire nodes from the battery to a lamp or motor. Add a switch anywhere in the path.
3. Close the switch. Powered wires glow, the lamp lights, and the motor rotates. Opening the switch or disabling the battery updates the network immediately.
4. Use the **Classroom Multimeter** on any component to report whether the source, switch, or device is powered.

Circuit traversal is capped at 512 connected components to protect classroom servers from accidental unbounded networks. This is a conceptual low-voltage learning model, not an electrical engineering simulator and not guidance for wiring physical hardware.

## Classroom and lesson tools

### Guides and boards

- A **Class Guide** is a placeable NPC with a title, dialogue, and optional reference text. It looks toward nearby players and can satisfy a “talk to guide” lesson task.
- **Large Blackboard** and **Large Whiteboard** nodes display an educator-authored title, lesson text, and optional reference text. Reading one can satisfy a board task.
- Normal interaction shows the content. Sneak-interaction opens the editor for the owner or a player with server authority.
- References are shown in game chat; they are not opened automatically in a browser.

### Lesson Planner and checkpoints

The Lesson Planner stores one active plan in the world. A plan has a title and up to four ordered tasks. Supported task types are:

- read a chalkboard or whiteboard;
- talk to a Guide;
- reach a checkpoint flag;
- make water in the Chemistry Lab; and
- teacher check, which is completed manually.

Progress is sequential and stored per player. The editor can see connected-player progress, revise or reset the plan, and manually mark a teacher-check task complete. Because ownership and permission rules are still being hardened, make a backup before letting an untrusted group edit a shared lesson world.

### Chemistry Lab

The catalog provides hydrogen, oxygen, carbon, nitrogen, sodium, and chlorine atoms. Put the requested atoms in a Chemistry Lab and select a supported result:

| Result | Formula |
| --- | --- |
| Water | H₂O |
| Oxygen | O₂ |
| Hydrogen | H₂ |
| Carbon dioxide | CO₂ |
| Salt | NaCl |
| Ammonia | NH₃ |
| Methane | CH₄ |

The lab consumes the atom items and creates the molecule in front of the lab. A water molecule can place a water source. Of these reactions, making water is currently the reaction connected to Lesson Planner progress.

### World presentation

Newly generated chunks receive OpenClassCraft's bright sky, clouds, chunky trees, grass, learning flowers, small stones, and sand details. Existing generated terrain is not retroactively rebuilt. Ambient classroom music starts per player; `/music` restarts it and `/sky` reapplies the custom sky.

## Local classroom multiplayer

### Host

1. Create or select a world under **Singleplayer**.
2. Enable **Host Server** and, if wanted, **Educator**.
3. Enter the teacher name, port, and optional password, then choose **Host Game**.
4. Allow the chosen game port and UDP port `29999` through the host firewall only on the trusted classroom network.
5. Keep the host running while students search from the Local Servers view.

### Join

1. Open **Start Game → Local Servers**.
2. Select **Refresh**, then select the teacher's classroom from the discovered server list.
3. Enter a player name and password, if required, then choose **Join Server**.

OpenClassCraft discovers hosts with a local UDP broadcast; it does not publish the classroom to the public server list. Discovery can be disabled with `enable_lan_discovery = false`. If network isolation or a firewall blocks broadcasts, students can still enter the teacher's private LAN address and game port manually. A short classroom join-code flow is not implemented yet.

The Educator option controls host presentation and educator metadata; it is not yet a complete role-based permission system. Classroom tools and the unlimited catalog are not strictly separated by student/teacher role. Use a trusted LAN, set a password, and review server privileges before a classroom session.

## Accessibility

Settings are available in the OpenClassCraft/Luanti settings interface and can also be written to `minetest.conf`.

| Setting | What it does today |
| --- | --- |
| `openclasscraft_dyslexia_font` | Selects bundled Cousine regular/bold/italic fonts for menus and in-game text. Restart after changing it. |
| `openclasscraft_large_ui` | Raises GUI/HUD scaling, enlarges forms, and uses a six-slot hotbar. A restart is recommended. |
| `openclasscraft_high_contrast` | Uses stronger background, text, and inventory-list contrast in OpenClassCraft forms. |
| `openclasscraft_colorblind_support` | Changes the selected inventory/list highlight to a more distinct blue. It is not a full texture recoloring system. |
| `openclasscraft_simplified_controls` | Hides nonessential minimap/radar/debug/wield HUD elements and reduces the hotbar to five slots. It does not remap movement keys. |
| `openclasscraft_read_aloud` | Duplicates supported OpenClassCraft helper messages with a `[Read aloud]` chat label so a screen reader can identify them. It does not contain a speech-synthesis engine. |

These options are aids, not certifications against a particular accessibility standard. Feedback and tested improvements are welcome.

## Creator tools

OpenClassCraft currently has two different creator experiences.

### In-game Creator Lab

The Creator Lab is a forms-based editor stored inside each world, per player. It creates a shared custom block using one of four styles—Garden, Stone, Wood, or Glass—and a reorderable action list. Implemented actions are **Say**, **Wait 1 second**, and **Give apple**. Right-clicking the created block runs its stored actions.

This is not yet drag-and-drop and it does not write a standalone Lua mod. The associated **World Edit Wand** selects two flat corners and removes one layer of nodes plus nearby non-player entities, with a 4,096-node limit. The operation has no undo and should be restricted to backed-up teaching worlds.

### Desktop OpenClassCraft Creator

[`creator-app/`](creator-app/) is an Electron/Blockly prototype. Its palette contains placement/proximity events, say/give/change/wait actions, logic, sensors, loops, and variables. Export creates:

```text
openclasscraft_<project-id>/
├── init.lua
├── mod.conf
└── project.openclasscraft.json
```

Copy an export into a world's `worldmods/` directory and restart the world. Exported blocks currently use textures supplied by the bundled OpenClassCraft game, so exports are not fully portable to an unrelated Luanti installation.

Install Node.js 22.12 or newer, then run the editor from source:

```bash
cd creator-app
npm install
npm start
```

Build an AppImage on Linux or a portable executable on Windows:

```bash
cd creator-app
npm install
npm run package:linux
```

```powershell
cd creator-app
npm install
npm run package:win
```

See [`creator-app/README.md`](creator-app/README.md) for the current output names and usage notes. Linux AppImages are usable on supported Ubuntu and Fedora desktops; packaging remains unsigned.

The desktop Creator is a prototype: some palette labels and generated behavior do not yet match completely, and condition/wait sequencing needs validation. Inspect and test generated Lua before sharing a mod with students.

## Teacher Console and lesson bridge

[`teacher-console/`](teacher-console/) is a separate, offline-first desktop application. Current workflows include:

- school, teacher, and class profile fields;
- lessons with a subject, objectives, and checkpoints;
- student and group records, including CSV import (`Name` required, `Group` optional);
- group-to-lesson/world assignments;
- manual checkpoint percentages and teacher notes;
- CSV progress reports;
- JSON backup and restore; and
- a token-protected loopback bridge to one local OpenClassCraft host.

The app stores its state as `teacher-console.json` in Electron's platform-specific user-data directory. That file and exported backups are plain JSON, not encrypted. Keep the computer account, bridge settings, reports, and backups private. Do not enter sensitive student data unless your school's policies allow this storage model.

For the Founding School Beta, use classroom aliases only and follow the [privacy and classroom-safety rules](docs/launch/PRIVACY_AND_SAFETY.md). The Console source is visible in this repository, but its `UNLICENSED` notice grants no standalone redistribution permission. Project-built packages remain a controlled pilot deliverable rather than a Community release asset.

### Connect a lesson to a LAN host

The Teacher Console and the hosted OpenClassCraft process must run on the same computer because the bridge binds to `127.0.0.1`.

1. In the Console, create an assignment and select it under **LAN lesson bridge**.
2. Choose **Start bridge**, then **Export settings**.
3. Copy the generated `openclasscraft-teacher-bridge.conf` settings into the host's `minetest.conf`.
4. Keep its generated token secret and restart the OpenClassCraft host.
5. In the hosted world, a player with the `server` privilege runs `/occ_teacher_sync`.

The bridge returns only the selected lesson plan. The game may post the player name, lesson title, and completed/total task counts back to the Console. It does not send the Console's full student records, notes, reports, or backups. Imported bridge tasks currently become manual teacher-check tasks in game.

For source development, install Node.js 22.12 or newer and the app dependencies:

```powershell
cd teacher-console
npm install
npm start
```

The app can be packaged as a Linux AppImage with `npm run package:linux` on Linux or as a portable Windows executable with `npm run package:win` on Windows. See [`teacher-console/README.md`](teacher-console/README.md) for output names and platform notes. Packaging is unsigned.

## Build from source

OpenClassCraft uses CMake, C++17, and the dependencies inherited from Luanti. The commands below build the `Latest` branch in run-in-place mode, which keeps the executable and game data together in the checkout.

### Ubuntu

```bash
sudo apt update
sudo apt install git g++ make libc6-dev cmake libpng-dev libjpeg-dev \
  libgl1-mesa-dev libsqlite3-dev libogg-dev libvorbis-dev libopenal-dev \
  libcurl4-gnutls-dev libfreetype6-dev zlib1g-dev libgmp-dev \
  libjsoncpp-dev libzstd-dev libluajit-5.1-dev gettext libsdl2-dev

git clone --branch Latest https://github.com/OpenClassCraft/OpenClassCraft.git
cd OpenClassCraft
cmake -S . -B build -DCMAKE_BUILD_TYPE=Release -DRUN_IN_PLACE=TRUE \
  -DENABLE_POSTGRESQL=OFF
cmake --build build --parallel "$(nproc)"
./bin/openclasscraft
```

### Fedora

```bash
sudo dnf install git make gcc-c++ cmake libcurl-devel openal-soft-devel \
  libpng-devel libjpeg-turbo-devel libvorbis-devel libogg-devel \
  freetype-devel mesa-libGL-devel zlib-ng-compat-devel jsoncpp-devel \
  gmp-devel sqlite-devel luajit-devel ncurses-devel libzstd-devel gettext \
  sdl2-compat-devel openssl-devel

git clone --branch Latest https://github.com/OpenClassCraft/OpenClassCraft.git
cd OpenClassCraft
cmake -S . -B build -DCMAKE_BUILD_TYPE=Release -DRUN_IN_PLACE=TRUE \
  -DENABLE_POSTGRESQL=OFF
cmake --build build --parallel "$(nproc)"
./bin/openclasscraft
```

Package a run-in-place Linux build as a tar archive:

```bash
cpack --config build/CPackConfig.cmake -G TGZ -B Package
```

Distribution package names can vary between releases. See [`doc/compiling/linux.md`](doc/compiling/linux.md) if a dependency name has changed on your distribution.

The Fedora release workflow instead configures an installed layout with `-DRUN_IN_PLACE=FALSE -DCMAKE_INSTALL_PREFIX=/usr` and runs CPack with `-G RPM`. Its RPM should be built and validated inside the Fedora version named by the release asset.

### Windows with Visual Studio and vcpkg

Install Git, CMake, a current Visual Studio with the **Desktop development with C++** workload, and [vcpkg](https://github.com/microsoft/vcpkg). The repository's `vcpkg.json` is the dependency manifest.

In a Developer PowerShell, replace the toolchain path if vcpkg is elsewhere:

```powershell
git clone --branch Latest https://github.com/OpenClassCraft/OpenClassCraft.git
cd OpenClassCraft

cmake -S . -B build -A x64 `
  -DCMAKE_TOOLCHAIN_FILE=C:/vcpkg/scripts/buildsystems/vcpkg.cmake `
  -DRUN_IN_PLACE=TRUE -DENABLE_POSTGRESQL=OFF
cmake --build build --config Release --parallel
.\bin\Release\openclasscraft.exe
```

The source-build executable is `bin\Release\openclasscraft.exe`; keep its generated DLLs beside it. Create a ZIP package with:

```powershell
cpack --config build\CPackConfig.cmake -C Release -G ZIP -B Package
```

More compiler detail is available in [`doc/compiling/windows_msvc.md`](doc/compiling/windows_msvc.md). Those inherited engine notes may still use the upstream `luanti` name; the OpenClassCraft client executable is `openclasscraft`.

### Verify a build

Run the inherited engine unit tests:

```bash
./bin/openclasscraft --run-unittests
```

On Windows, use `bin\Release\openclasscraft.exe --run-unittests`. Then manually create a fresh OpenClassCraft world and check the robot sequence, Ecology pet/growth/survey loop, Electronics battery/switch/lamp/motor loop, catalog, Guide/board editing, Lesson Planner, Chemistry Lab, accessibility settings, and LAN join flow. The custom game and Electron apps do not yet have complete automated end-to-end coverage.

## Developer guide

### Repository layout

| Path | Purpose |
| --- | --- |
| [`src/`](src/) | Customized C++ Luanti client/server engine. |
| [`builtin/`](builtin/) | Engine Lua and the simplified OpenClassCraft main menu. |
| [`games/luanti_edu/`](games/luanti_edu/) | Bundled educational game and its media. |
| [`games/luanti_edu/mods/luanti_coding/`](games/luanti_edu/mods/luanti_coding/) | Programming nodes, chain parser, and executor. |
| [`games/luanti_edu/mods/luanti_robot/`](games/luanti_edu/mods/luanti_robot/) | Robot entity, spawner, movement, sensing, placing, and digging. |
| [`games/luanti_edu/mods/openclasscraft_ecology/`](games/luanti_edu/mods/openclasscraft_ecology/) | Habitats, plants, wildlife, farm animals, persistent pets, and field surveys. |
| [`util/generate_ecology_animals.py`](util/generate_ecology_animals.py) | Reproducibly generates all lightweight rigged animal meshes and their shared animation timeline. |
| [`games/luanti_edu/mods/openclasscraft_electronics/`](games/luanti_edu/mods/openclasscraft_electronics/) | Bounded classroom power networks, batteries, switches, wires, lamps, motors, and meters. |
| [`games/luanti_edu/mods/openclasscraft_classroom/`](games/luanti_edu/mods/openclasscraft_classroom/) | Guides, boards, lesson plans, checkpoints, chemistry, and Teacher Console bridge. |
| [`games/luanti_edu/mods/openclasscraft_creator/`](games/luanti_edu/mods/openclasscraft_creator/) | In-game Creator Lab, custom material styles, and World Edit Wand. |
| [`games/luanti_edu/mods/openclasscraft_world/`](games/luanti_edu/mods/openclasscraft_world/) | Sky, music, vegetation, and classroom world styling. |
| [`creator-app/`](creator-app/) | Desktop Blockly Creator. |
| [`teacher-console/`](teacher-console/) | Local Teacher Console and loopback bridge service. |
| [`docs/launch/`](docs/launch/) | Release gates, pricing, pilot operations, press/award copy, privacy rules, and bilingual teacher material. |
| [`website/`](website/) | Zero-dependency Founding School Beta landing page and Pages build. |
| [`doc/`](doc/) | Engine API, protocol, compilation, and contributor reference inherited from Luanti. |
| [`.github/workflows/`](.github/workflows/) | CI and release automation. |

### Release automation

The `release-build` workflow uses Fedora 44 as the default CI and public-alpha target. It builds the RPM, checks its contents, installs it in the Fedora container, runs the packaged engine tests, starts a fresh headless OpenClassCraft world, and generates SHA-256 files. Ubuntu 24.04 and Windows x64 builds remain available only through an explicit manual `all-community` run while those platforms are deferred. A manual publish run requires an existing tag that points to the exact built commit and refuses to replace an existing release.

The same workflow clean-installs and checks the Linux Creator and School Console. Creator preview packages are separate CI artifacts. School Console packaging is disabled unless an owner-authorised manual run enables it, uses an internal artifact name and short retention, and is excluded by the Community release allow-list. Public publishing defaults to the Fedora-only alpha scope; a later explicit `all-community` scope can include validated Ubuntu and Windows assets. Either scope refuses every unexpected filename.

### Useful chat commands

| Command | Purpose |
| --- | --- |
| `/givetools` | Give the current programming, classroom, ecology, and electronics teaching kit. |
| `/student_skin` | Select the student skin. |
| `/educator_skin` | Select the educator skin. |
| `/professor_skin` | Select the professor-style skin; this is a skin alias, not a separate permission role. |
| `/music` | Restart ambient classroom music. |
| `/sky` | Reapply OpenClassCraft sky settings. |
| `/occ_teacher_sync` | Fetch the selected lesson from a configured local Teacher Console bridge; requires `server`. |

### Data and configuration

- The engine configuration file is `minetest.conf`, retaining the upstream filename for compatibility.
- Standard installed builds normally use `~/.minetest` on Linux and `%APPDATA%\Minetest` on Windows unless `LUANTI_USER_PATH` is set.
- A run-in-place source build keeps user data with the checkout. Do not commit personal worlds, names, bridge tokens, or classroom records.
- The Teacher Console uses Electron's user-data directory, separate from game worlds.

## Known limitations

- The project is at version `0.1.0` and the delivery checklist still marks platform releases and several workflows as needing verification.
- `ELSE` and `WHILE Clear` robot behavior needs additional correctness tests. Loops and conditions operate only on the next instruction.
- The Educator toggle is not a hardened student/teacher authorization boundary. The creative catalog and several editing tools are available broadly.
- The in-game World Edit Wand is destructive, has no undo, and does not yet enforce a classroom-specific protection policy.
- The desktop Creator's event labels, condition generation, wait sequencing, item identifiers, and texture portability need further work.
- Teacher Console storage and backups are not encrypted. The bridge is local and token-protected, but is not a school identity or compliance system.
- LAN broadcast discovery requires UDP port `29999` and may be blocked by guest-network isolation or host firewalls. There is no classroom join-code flow yet.
- Starter lesson worlds, rubrics, portfolios, PDF reports, encrypted storage, opt-in cloud sync, and an update manager are roadmap items, not current features.
- Some inherited Luanti documentation and desktop metadata still use upstream names. Verify packaging and branding on every target platform.

See [`PROJECT_CHECKLIST.md`](PROJECT_CHECKLIST.md) for the current implementation checklist and [`docs/launch/RELEASE_CHECKLIST.md`](docs/launch/RELEASE_CHECKLIST.md) for candidate gates. These are roadmap and operating documents, not a release guarantee.

## Contributing and security

Issues, lesson ideas, accessibility feedback, and focused pull requests are welcome:

- [Read the contribution guide](.github/CONTRIBUTING.md)
- [Open an issue](https://github.com/OpenClassCraft/OpenClassCraft/issues/new/choose)
- [Browse current issues](https://github.com/OpenClassCraft/OpenClassCraft/issues)
- [Browse or open a pull request](https://github.com/OpenClassCraft/OpenClassCraft/pulls)

Before a pull request, build the affected platform, run the engine unit tests, and manually test any changed classroom flow. Keep a change focused and document user-visible behavior. The engine subtree retains Luanti's coding and translation conventions; project-specific expectations are in the contribution guide above.

Follow the [OpenClassCraft security policy](.github/SECURITY.md). Report security-sensitive problems privately through [GitHub's private vulnerability reporting page](https://github.com/OpenClassCraft/OpenClassCraft/security/advisories/new) when it is available. Do not put student names, world files, bridge tokens, or other private classroom information in a public issue.

## License and credits

OpenClassCraft was created by **Sivadarsh P Dinesh** as an educational coding experience.

The engine is derived from Luanti and retains its upstream developers, contributors, and license notices. The bundled game is derived from Minetest Game and includes additional OpenClassCraft code and media. This repository contains multiple licenses:

- [`COPYING.LESSER`](COPYING.LESSER) and [`LICENSE.txt`](LICENSE.txt) describe engine source and bundled-media licensing;
- [`games/luanti_edu/LICENSE.txt`](games/luanti_edu/LICENSE.txt) describes the game layer;
- [`creator-app/LICENSE`](creator-app/LICENSE) licenses the Creator application under GPL-2.0-only;
- [`teacher-console/NOTICE`](teacher-console/NOTICE) records that the Teacher Console is currently `UNLICENSED` and has no standalone redistribution grant; and
- individual asset or dependency directories may contain additional attribution and license files.

Do not assume every file uses the same license. Preserve the relevant copyright, attribution, and license notices when redistributing a build or an extracted component.

Project repository: <https://github.com/OpenClassCraft/OpenClassCraft>
