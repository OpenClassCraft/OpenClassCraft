# OpenClassCraft map generation

This mod turns Luanti's native Valleys map generator into a bounded learning landscape. New worlds use a fixed seed and open at a safe campus whose surface is generated independently of nearby cliffs. Four subject stations sit inside the campus, and eight three-node-wide field trails connect its ring to marked checkpoints out to 592 nodes. Every trail uses a surveyed, deterministic elevation profile with cuttings and supported crossings, so cliffs, rivers, overhangs, and mapchunk boundaries cannot break the route.

## Curated habitats

| Habitat | Learning focus |
| --- | --- |
| Learning meadow | Pollination, plant growth, soil, and introductory observation |
| Temperate forest | Foxes, deer, rabbits, squirrels, succession, and predator-prey systems |
| Freshwater river and wetland | Watersheds, wetland filtration, aquatic plants, ducks, frogs, and otters |
| Monsoon forest | Rainfall, biodiversity, decomposition, deer, boar, squirrels, and frogs |
| Grassland and savanna | Grazing, food webs, scattered trees, and seasonal drought |
| Dry scrub and desert | Water conservation, heat adaptation, and solar-energy lessons |
| Montane conifer forest | Altitude, temperature, watersheds, erosion, tahr, and mountain soils |
| Alpine tundra and snow | Climate, seasons, tahr, exposed rock, and cold adaptation |
| Coast and mangrove | Salinity, shoreline erosion, otters, turtles, roots, and nursery habitat |
| Shallow reef | Turtles, sunlight zones, coral communities, coastal protection, and water quality |
| Controlled geology zone | Rock layers, groundwater, erosion, and rare deep caves |

## Safety and predictability

- The game locks new worlds to Valleys and uses a fixed seed.
- The campus core is level and its transition rises by no more than one node between adjacent columns.
- Every field trail is generated as a connected, walkable route, including across water and overhangs.
- Ores and dungeons are disabled at both configuration and registration levels.
- Small and large caves are rare; large caves begin below `y = -96`, and caverns are restricted much deeper.
- The map limit is 2,047 nodes in each direction, while designed field routes stop at radius 640.
- Existing chunks are never rewritten. Create a fresh world to validate changes to terrain, biomes, or decorations.
