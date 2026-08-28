# OpenClassCraft Education Worlds Plan

This document defines the collection of separate educational worlds that OpenClassCraft should provide. Each world is a focused, reusable classroom environment rather than one enormous map containing every subject.

The world builder creates the terrain treatment, buildings, interiors, signs, activity spaces, and visual landmarks. Game development supplies the working lessons, interactions, reset systems, permissions, evidence collection, and teacher controls.

## 1. Product structure

OpenClassCraft should ship three kinds of world:

| World type | Typical duration | Purpose |
| --- | ---: | --- |
| Starter world | 15-25 minutes | Teach one tool with a tightly guided first success. |
| Lesson world | 35-60 minutes | Support a complete curriculum lesson for five student groups. |
| Project world | 2-6 sessions | Let students investigate, design, test, revise, and present. |

Every subject world should contain all three levels in connected districts:

1. **Learn:** a small guided tutorial close to spawn.
2. **Practise:** five colour-coded group stations with the same task at equal difficulty.
3. **Apply:** a larger challenge where students choose an approach.
4. **Share:** a gallery, evidence wall, checkpoint, or presentation area near the exit.

This creates a consistent student journey across every world:

`Spawn -> briefing -> guided example -> group task -> open challenge -> submit evidence -> reflect`

## 2. Common building standard

Use these requirements in every world so students do not need to relearn navigation.

- Design for five groups of up to six students, plus an educator.
- Place the first usable activity within 30 nodes of spawn.
- Keep normal lesson travel below 90 seconds; long exploration is reserved for the Ecology world.
- Use five permanent group colours and symbols: blue circle, green leaf, gold triangle, purple star, and orange square.
- Provide a visible return route from every activity area.
- Make entrances and main corridors at least three nodes wide, with four nodes of clear internal height.
- Avoid ladders as the only route, one-node doorways, hidden drops, dark dead ends, and decorative collision traps.
- Give every instruction as an icon, a short sentence, and an optional Guide explanation. Do not depend on chat commands.
- Reserve a teacher demonstration position that does not block student movement.
- Mark every resettable activity boundary clearly.
- Include one quiet/accessibility space near spawn.
- Use OpenClassCraft learning materials; do not add ores, dungeons, combat rewards, or survival clutter.
- Avoid constant decorative particles and overlapping sound loops.
- Keep signage ready for English and Malayalam text without rebuilding the structure.
- Use regional examples as replaceable lesson content. The permanent world should work for government and other authorised schools in any region.

## 3. Core world collection

The first complete collection should contain eight worlds. These cover the strongest current game systems and the most useful school subjects without creating an unmaintainable number of maps.

### World 1 — Coding and Robotics Academy

**Purpose:** computational thinking through physical instruction blocks and robots.

**World form:** a compact technology campus with indoor teaching rooms and outdoor robot courses.

**Buildings and areas for the world builder:**

- Arrival and algorithm briefing hall.
- Block library where every instruction has a visual example.
- Five identical beginner robot lanes.
- Sequence and turning arena.
- Loop garden with repeated route patterns.
- Conditions and sensors maze.
- Debugging workshop showing expected, actual, and revised paths.
- Automation yard with doors, lights, bridges, crops, and environmental sensors.
- Robot garage and charging area.
- Student program gallery and finish arena.

**Mission progression:**

1. Move a robot to a nearby flag.
2. Turn through a marked route.
3. Replace repeated moves with a loop.
4. React to a blocked or clear path.
5. Debug a deliberately incorrect program.
6. Use sensing to complete an environmental or engineering task.
7. Design and explain an original automated solution.

**Game work still required:** structured multi-block conditions and loops, named variables, additional sensors, program-step highlighting, pause/step/retry, and reliable multi-robot ownership.

**Existing starting point:** expand the current Starter Coding World into the first tutorial room rather than replacing it.

### World 2 — Living Biomes and Ecology Reserve

**Purpose:** biodiversity, animal behaviour, plant systems, food webs, adaptation, and human impact.

**World form:** the existing deterministic learning campus connected to the eleven curated habitats and field trails.

**Buildings and areas for the world builder:**

- Central field-study headquarters.
- Field journal and equipment room.
- Plant nursery and pollinator garden.
- Managed pet and farm-animal care area inside the spawn-safe campus.
- Wildlife rehabilitation/observation building with no permanent wild-animal cages.
- Wet laboratory near freshwater, but outside the river channel.
- Small observation hides in forest and grassland habitats.
- Raised wetland and mangrove boardwalks.
- Weather stations at low, middle, and high elevations.
- Shore and reef observation base.
- Evidence museum where groups compare habitats.

**Mission progression:**

1. Identify living and non-living parts of a habitat.
2. Observe one animal without changing its behaviour.
3. Compare plant growth or soil in two places.
4. Map a simple food web.
5. Investigate water, shade, altitude, or rainfall as an environmental factor.
6. Explain predator-prey, grazing, pollination, or decomposition evidence.
7. Propose and test a small, reversible habitat improvement.

**Game work still required:** fish, insects, pollinators and decomposers; plant life cycles; population and seasonal change; water-quality measurements; and stronger ecosystem cause-and-effect simulation.

**Existing starting point:** this world uses the current 11-habitat map generator, eight trails, 14 animals, weather, ambience, and controlled wildlife spawning.

### World 3 — Circuits, Energy and Machines Workshop

**Purpose:** electrical circuits, measurement, motors, mechanisms, energy transfer, and engineering design.

**World form:** an industrial learning workshop with a large outdoor renewable-energy yard.

**Buildings and areas for the world builder:**

- Circuit safety and symbol gallery.
- Five battery-switch-lamp workbenches.
- Fault-finding room with visibly broken circuits.
- Motor laboratory.
- Gears, axles, pulley, lever, and linkage hall.
- Measurement room for voltage, current, resistance, speed, load, and efficiency.
- Solar and wind testing yard.
- Water-lifting and irrigation mechanism.
- Small model house for energy-use investigations.
- Design-test-improve maker floor.
- Working-machine exhibition gallery.

**Mission progression:**

1. Complete a battery-switch-lamp circuit.
2. Find and repair an open circuit.
3. Measure and compare two circuit states.
4. Power a motor safely.
5. Transfer motion through a mechanism.
6. Compare renewable-energy inputs and loads.
7. Build a machine that completes a useful classroom task.

**Game work still required:** series and parallel circuits, real measurement values, safe fault explanations, gears, axles, pulleys, generators, solar panels, logic gates, and robot-electronics integration.

**Existing starting point:** battery, switch, wire, lamp, motor, and simplified multimeter components already provide the first lesson.

### World 4 — Investigation Science Centre

**Purpose:** scientific method, fair testing, observation, measurement, forces, motion, light, sound, heat, and materials.

**World form:** a modular science museum where every gallery contains a working investigation rather than a static display.

**Buildings and areas for the world builder:**

- Question and hypothesis hall.
- Five fair-test benches.
- Materials testing room.
- Forces and motion track.
- Ramps, friction, mass, and collision gallery.
- Light, reflection, colour, and shadow room.
- Sound and vibration studio.
- Heat and insulation room.
- Magnetism station.
- Measurement and uncertainty room.
- Evidence court where students defend conclusions.

**Mission progression:**

1. Observe without guessing.
2. Compare sand, gravel, clay, or another material using the same questions.
3. Change one variable while controlling the others.
4. Record a result with units.
5. Repeat a test and discuss variation.
6. Choose evidence that supports or challenges a claim.
7. Design a fair investigation for another group to reproduce.

**Game work still required:** measurement instruments, graphing, physical-property data, reliable force/motion experiments, light and sound interactions, and reusable experiment-reset logic.

**Existing starting point:** retain the current Starter Science Observation World as the Learn district.

### World 5 — Chemistry and Materials Laboratory

**Purpose:** atoms, molecules, ratios, reactions, states of matter, solutions, acids/bases, and material properties.

**World form:** a bright laboratory campus with controlled experiment rooms and a large molecular modelling hall.

**Buildings and areas for the world builder:**

- Laboratory safety and equipment entrance.
- Atom and element gallery.
- Walk-through periodic table.
- Five molecule-building benches.
- Reaction-ratio laboratory.
- States-of-matter room.
- Solutions and separation laboratory.
- Acids, bases, and indicators room.
- Materials testing workshop.
- Water chemistry and treatment room.
- Molecular model gallery and evidence wall.

**Mission progression:**

1. Build water from the correct atom ratio.
2. Distinguish an atom, molecule, element, and compound.
3. Compare models of several supported molecules.
4. Balance a visual particle reaction.
5. Separate a model mixture.
6. Test and classify a model solution safely.
7. Choose or design a material for a stated purpose.

**Game work still required:** a broader element and molecule set, reaction conservation, states and temperature, solutions, indicators, separation methods, measurement, and automatic checking of molecular models.

**Existing starting point:** expand the current Starter Chemistry Lab and supported molecular items into the first two rooms.

### World 6 — Water, Weather and Earth Systems

**Purpose:** the water cycle, rivers, watersheds, weather, climate, erosion, rocks, soils, coasts, and natural hazards.

**World form:** one connected model catchment from mountain and forest through river, wetland, settlement, mangrove, coast, and shallow sea.

**Buildings and areas for the world builder:**

- Mountain weather observatory.
- Watershed map room.
- River-source field station.
- Erosion and deposition channel.
- Soil profile and infiltration laboratory.
- Wetland filtration station.
- Model settlement and floodplain.
- Water treatment building.
- Mangrove and coastal research base.
- Controlled geology tunnel.
- Climate-data gallery and emergency-planning room.

**Mission progression:**

1. Follow one drop of water through the catchment.
2. Measure rainfall, flow, infiltration, or temperature.
3. Compare erosion under two surface conditions.
4. Explain how wetlands or mangroves affect water and coasts.
5. Read a topographic or weather map.
6. Identify a flood, drought, erosion, or landslide risk.
7. Redesign the model settlement to reduce risk without simply blocking the river.

**Game work still required:** usable weather instruments, rainfall/runoff data, water-quality values, controllable erosion experiments, forecast displays, and resettable flood/drought scenarios.

**Existing starting point:** reuse the current river, wetland, monsoon, montane, alpine, mangrove, reef, and geology habitats where suitable.

### World 7 — Mathematics and Data City

**Purpose:** number, shape, measurement, coordinates, ratio, probability, statistics, patterns, and data reasoning.

**World form:** a walkable city of mathematical puzzles where scale and geometry are visible in the architecture.

**Buildings and areas for the world builder:**

- Number and pattern plaza.
- Coordinate-grid streets.
- Geometry garden.
- Area, perimeter, surface-area, and volume workshop.
- Ratio and scale-model studio.
- Measurement market using length, mass, time, and capacity.
- Fraction and proportion café.
- Probability arcade with transparent outcomes rather than gambling imagery.
- Statistics stadium or survey hall.
- Graphing and field-data centre.
- Architecture challenge plots.

**Mission progression:**

1. Navigate to coordinates.
2. Find and extend a pattern.
3. Measure a structure accurately.
4. Build to a stated scale or ratio.
5. Compare theoretical and observed probability.
6. Collect, graph, and interpret class data.
7. Design a structure that satisfies numerical and geometric constraints.

**Game work still required:** visual measuring tools, coordinate HUD options, numeric input blocks, data tables, graphs, random-event tools, automatic dimension checks, and teacher-configurable values.

### World 8 — Food, Farming and Animal Care

**Purpose:** plant growth, soil, food systems, animal welfare, ecosystems, nutrition, waste, water, and responsible technology.

**World form:** a working educational farm connected to a village market and food-science classroom.

**Buildings and areas for the world builder:**

- Seed and plant nursery.
- Five student crop plots.
- Greenhouse and controlled-growth room.
- Soil, compost, and decomposer station.
- Irrigation and water-conservation yard.
- Separate shelters for cows and chickens.
- Calm pet-care area for dogs and cats.
- Animal observation and welfare classroom.
- Food storage and processing demonstration building.
- Nutrition and food-science kitchen classroom.
- Farm market and supply-chain map.
- Waste, compost, and circular-systems yard.

**Mission progression:**

1. Plant, observe, and record growth.
2. Compare water, light, or soil conditions fairly.
3. Identify an animal's food, water, shelter, space, and social needs.
4. Design a welfare-friendly enclosure that does not trap movement.
5. Build or program an irrigation or monitoring system.
6. Trace food from inputs to consumer and waste.
7. Improve the farm's water, energy, biodiversity, or waste system and justify trade-offs.

**Game work still required:** complete plant life cycles, growth measurements, soil moisture and nutrients, compost/decomposition, animal welfare indicators, feeding records, irrigation, pollination, and food-system data.

**Existing starting point:** current farm animals, pets, plant growth items, animal needs, sounds, and basic behavior form the foundation.

## 4. Expansion worlds

Build these only after the eight core worlds are playable, resettable, and classroom tested.

### World 9 — Space and Planetary Science

Build mission control, observatory, solar-system scale trail, gravity demonstration hall, rover arena, Moon base, Mars field site, satellite lab, and Earth-observation room. Required game additions include controllable gravity, planetary skies, orbital/scale visualisation, rover sensors, and astronomy instruments.

### World 10 — Language, Arts and Storytelling

Build a multilingual library, story village, theatre, newsroom, recording studio, animation room, gallery, debate chamber, and cultural exhibition plots. Lessons should support reading, writing, speaking, listening, translation, visual storytelling, performance, and media literacy. Content must be teacher-editable so a region can teach its own languages and culture.

### World 11 — Society, Geography and Civic Life

Build a map hall, model neighbourhood, council chamber, public-service centre, transport-planning room, history gallery, archaeology site, trade route, and community interview studio. Avoid presenting one government structure as universal; teachers should be able to replace civic and historical content.

### World 12 — Sustainable Community Capstone

This is the final integrated project world. Build an unfinished settlement with housing plots, school, clinic, farm, river, wetland, transport routes, energy grid, water system, waste system, biodiversity corridor, and civic hall. Student teams combine coding, ecology, electronics, science, mathematics, food systems, communication, and civic reasoning to improve it within a shared resource budget.

The capstone should not prescribe one perfect city. It should expose trade-offs and require evidence for every decision.

## 5. World package requirements

Each finished world package should contain:

- a unique world ID and visible version;
- a clean spawn point and orientation board;
- `TEACHER_NOTES.md` with age range, duration, objectives, setup, and misconceptions;
- at least one 15-25 minute starter lesson;
- at least one complete 35-60 minute group lesson;
- one open project challenge;
- five equal group stations where practical;
- a defined student inventory and role policy;
- checkpoint and evidence events;
- a reset plan for every activity zone;
- a known-good clean snapshot;
- a low-spec performance check;
- an English language pass and space reserved for Malayalam translations;
- a screenshot showing spawn, the principal activity, and the world map.

## 6. Division of work

### World builder

- Terrain shaping inside the lesson area.
- Buildings, interiors, paths, landmarks, signs, group colours, and activity boundaries.
- Safe entrances, exits, sightlines, observation platforms, and animal movement space.
- Visual storytelling and subject identity.
- A clean source copy of each completed map.

### Game development

- Working educational blocks, animals, plants, machines, instruments, and simulations.
- Visual lesson instructions, Guides, checkpoints, and automatic success checks.
- Teacher/student permissions and inventory policy.
- Group assignment, evidence submission, progress events, and Teacher Console integration.
- Reset, snapshot, restore, and version migration.
- Accessibility, localisation, performance, multiplayer, and release validation.

### Educator/curriculum review

- Curriculum alignment and age suitability.
- Scientific and historical accuracy.
- Lesson timing, questions, rubrics, and expected evidence.
- Local-language and local-context content.
- Misconceptions, safeguarding, and accessibility review.

## 7. Recommended development order

Do not build all worlds simultaneously.

1. **Coding and Robotics Academy** — proves the complete build-run-debug learning loop.
2. **Living Biomes and Ecology Reserve** — uses the current map, animals, and environmental systems.
3. **Circuits, Energy and Machines Workshop** — establishes practical engineering.
4. **Investigation Science Centre** — establishes reusable experiment and evidence systems.
5. **Chemistry and Materials Laboratory** — expands the existing chemistry starter.
6. **Water, Weather and Earth Systems** — joins several existing habitats into a strong field lesson.
7. **Mathematics and Data City** — reuses measurement and evidence tools built for science.
8. **Food, Farming and Animal Care** — follows after plant cycles and welfare systems are reliable.
9. Add expansion worlds only after the first eight pass classroom tests.
10. Build **Sustainable Community Capstone** last, because it depends on every other system.

## 8. First construction milestone

For the first milestone, the world builder should create only the following shells:

1. Coding Academy arrival hall, five robot lanes, debugging room, and final arena.
2. Ecology Reserve field headquarters, plant nursery, managed animal-care area, and one observation shelter.
3. Circuits Workshop entrance, five circuit benches, motor room, and outdoor energy yard.
4. Science Centre entrance, five fair-test benches, materials room, and evidence court.

Do not add final decoration yet. First load the maps with 10 test players, confirm movement and sightlines, place the real game activities, and revise the buildings around how lessons actually work.
