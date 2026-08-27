return {
	id = "chemistry",
	title = "Starter Chemistry Lab",
	goal = "Model a water reaction, record the input atoms, and explain why the product is H2O.",
	welcome = "Chemistry mission: use the lab benches to make water and record a balanced particle explanation.",
	surface = "default:silver_sandstone_block",
	border = "default:stonebrick",
	spawn = {x = 0, y = 2, z = 11},
	nodes = {
		{x = -5, y = 1, z = 2, name = "openclasscraft_classroom:chemistry_lab"},
		{x = 0, y = 1, z = 2, name = "openclasscraft_classroom:chemistry_lab"},
		{x = 5, y = 1, z = 2, name = "openclasscraft_classroom:chemistry_lab"},
		{x = -5, y = 1, z = -6, name = "openclasscraft_classroom:lesson_marker"},
		{x = 0, y = 1, z = -6, name = "openclasscraft_classroom:lesson_marker"},
		{x = 5, y = 1, z = -6, name = "openclasscraft_classroom:lesson_marker"},
		{x = -8, y = 1, z = 5, name = "default:glass"},
		{x = 8, y = 1, z = 5, name = "default:glass"},
	},
	boards = {
		{x = -8, y = 1, z = 11, param2 = 2, title = "WATER LAB", message = "Select two hydrogen atoms and one oxygen atom. Observe the product and record the ratio."},
		{x = 8, y = 1, z = 11, param2 = 2, name = "openclasscraft_classroom:whiteboard", title = "LAB SAFETY", message = "Use only the assigned benches and do not remove another group's evidence."},
	},
}
