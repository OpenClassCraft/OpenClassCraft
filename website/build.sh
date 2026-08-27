#!/usr/bin/env bash
set -euo pipefail

site_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_dir="$(cd "$site_dir/.." && pwd)"
output_dir="$site_dir/dist"

if [[ "$output_dir" != "$repo_dir/website/dist" ]]; then
	printf 'Refusing unexpected site output path: %s\n' "$output_dir" >&2
	exit 1
fi

rm -rf "$output_dir"
mkdir -p "$output_dir/assets"

cp "$site_dir/index.html" "$output_dir/index.html"
cp "$site_dir/styles.css" "$output_dir/styles.css"
cp "$site_dir/robots.txt" "$output_dir/robots.txt"
cp "$site_dir/.nojekyll" "$output_dir/.nojekyll"
cp "$repo_dir/games/luanti_edu/menu/background.png" "$output_dir/assets/background.png"
cp "$repo_dir/games/luanti_edu/menu/icon.png" "$output_dir/assets/icon.png"

printf 'Built OpenClassCraft site at %s\n' "$output_dir"
