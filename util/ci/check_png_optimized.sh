#!/bin/bash -e

# Only warn if decrease is more than 3%
optimization_requirement=3

if (( $# > 0 )); then
	printf '%s\n' "$@"
else
	git ls-files "*.png"
fi | sort -u | (
	optimized=1
	temp_file=$(mktemp)
	echo "Optimizing png files:"
	while IFS= read -r file; do
		# Does only run a fuzzy check without -o7 -zm1-9 since it would be too slow otherwise
		decrease_output="$(optipng -nc -strip all -out "$temp_file" -clobber "$file" |& \
			sed -n 's/.*(\([0-9]\{1,\}\) bytes\? = \([0-9]\{1,\}\)\.[0-9]\{2\}% decrease).*/\1 \2/p')"
		read -r -a decrease <<< "$decrease_output"
		if [[ -n "${decrease[*]}" ]]; then
			if [ "${decrease[1]}" -ge "$optimization_requirement" ]; then
				echo -en "\033[31m"
				optimized=0
			else
				echo -en "\033[32m"
			fi
			echo -e "Decrease: ${decrease[0]}B ${decrease[1]}%\033[0m $file"
		fi
	done
	rm "$temp_file"

	if [ "$optimized" -eq 0 ]; then
		echo -e "\033[1;31mWarning: Could optimized png file(s) by more than $optimization_requirement%.\033[0m" \
			"Apply 'optipng -o7 -zm1-9 -nc -strip all -clobber <filename>'"
		exit 1
	fi
)
