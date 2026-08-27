import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const siteDir = resolve(process.argv[2] || resolve(scriptDir, "dist"));
const indexPath = resolve(siteDir, "index.html");

function fail(message) {
	console.error(`Site validation failed: ${message}`);
	process.exitCode = 1;
}

if (!existsSync(indexPath)) {
	fail(`missing ${indexPath}`);
} else {
	const html = readFileSync(indexPath, "utf8");
	const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
	const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);

	if (duplicateIds.length > 0)
		fail(`duplicate id attributes: ${[...new Set(duplicateIds)].join(", ")}`);

	for (const match of html.matchAll(/\shref="#([^"]+)"/g)) {
		if (!ids.includes(match[1]))
			fail(`fragment link #${match[1]} has no target`);
	}

	for (const match of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
		const target = match[1];
		if (target.startsWith("#") || target.startsWith("https://") ||
				target.startsWith("http://") || target.startsWith("mailto:"))
			continue;

		const localPath = resolve(siteDir, target.split(/[?#]/, 1)[0]);
		if (!existsSync(localPath) || !statSync(localPath).isFile())
			fail(`local asset does not exist: ${target}`);
	}

	const images = [...html.matchAll(/<img\b[^>]*>/g)].map(match => match[0]);
	for (const image of images) {
		if (!/\salt="[^"]*"/.test(image))
			fail(`image is missing alt text: ${image}`);
	}

	const requirements = [
		[/<html\s+lang="en">/, "document language"],
		[/<meta\s+name="viewport"/, "viewport metadata"],
		[/<title>[^<]+<\/title>/, "page title"],
		[/class="skip-link"/, "keyboard skip link"],
		[/prefers-reduced-motion/, "reduced-motion CSS"],
		[/template=school_pilot\.yaml/, "school beta application link"],
		[/early Community preview/i, "honest preview status"],
		[/Do not include student names/i, "application privacy warning"]
	];

	const css = existsSync(resolve(siteDir, "styles.css"))
		? readFileSync(resolve(siteDir, "styles.css"), "utf8")
		: "";
	const combined = `${html}\n${css}`;
	for (const [pattern, label] of requirements) {
		if (!pattern.test(combined))
			fail(`missing ${label}`);
	}

	if (/TODO|REPLACE_ME|example\.com/i.test(combined))
		fail("placeholder text remains in the generated site");
}

if (!process.exitCode)
	console.log(`Validated static site at ${siteDir}`);
