#!/usr/bin/env bash
set -euo pipefail

asset_dir="${1:-release-assets}"
release_scope="${2:-all-community}"

if [[ ! -d "$asset_dir" ]]; then
	printf 'Release asset directory does not exist: %s\n' "$asset_dir" >&2
	exit 1
fi

case "$release_scope" in
	fedora-alpha)
		expected=(
			OpenClassCraft-Fedora-44-x86_64.rpm
			OpenClassCraft-Fedora-44-x86_64.rpm.sha256
		)
		;;
	all-community)
		expected=(
			OpenClassCraft-Fedora-44-x86_64.rpm
			OpenClassCraft-Fedora-44-x86_64.rpm.sha256
			OpenClassCraft-Ubuntu-24.04-x86_64.tar.gz
			OpenClassCraft-Ubuntu-24.04-x86_64.tar.gz.sha256
			OpenClassCraft-Windows-x64.zip
			OpenClassCraft-Windows-x64.zip.sha256
		)
		;;
	*)
		printf 'Unknown public release scope: %s\n' "$release_scope" >&2
		exit 1
		;;
esac

mapfile -t actual < <(find "$asset_dir" -maxdepth 1 -type f -printf '%f\n' | sort)
mapfile -t expected_sorted < <(printf '%s\n' "${expected[@]}" | sort)

if ! diff -u \
	<(printf '%s\n' "${expected_sorted[@]}") \
	<(printf '%s\n' "${actual[@]}"); then
	printf 'Public release assets do not match the Community Edition allow-list.\n' >&2
	exit 1
fi

if find "$asset_dir" -maxdepth 1 -type f \
	\( -iname '*teacher*' -o -iname '*console*' -o -iname '*creator*' \) \
	-print -quit | grep -q .; then
	printf 'A controlled or developer tool was found in the public asset directory.\n' >&2
	exit 1
fi

(
	cd "$asset_dir"
	sha256sum -c -- ./*.sha256
)

printf 'Verified %s Community Edition release assets for scope %s.\n' \
	"${#actual[@]}" "$release_scope"
