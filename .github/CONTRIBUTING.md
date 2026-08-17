# Contributing to OpenClassCraft

Thank you for helping make programming lessons more tangible and accessible. Contributions can improve the C++ engine, the bundled Lua game, classroom content, the Creator tools, the Teacher Console, packaging, documentation, or artwork.

Please keep student safety, teacher clarity, offline use, and compatibility with existing worlds in mind throughout a change.

## Before starting

1. Search the [OpenClassCraft issue tracker](https://github.com/OpenClassCraft/OpenClassCraft/issues) for related work.
2. For a behavior change, new feature, file-format change, or large refactor, open a [feature request](https://github.com/OpenClassCraft/OpenClassCraft/issues/new?template=feature_request.yaml) before investing substantial time.
3. Base work on the `Latest` branch unless a maintainer asks for another base.
4. Keep one pull request focused on one problem. Separate unrelated formatting or generated-file churn.

If a defect is reproducible in an unmodified current Luanti build, it may belong in the [upstream Luanti issue tracker](https://github.com/luanti-org/luanti/issues). If it involves OpenClassCraft's game, menus, branding, classroom tools, apps, configuration, or packages—or if you are unsure—report it to OpenClassCraft first.

## Set up the project

Clone your fork and track the project repository:

```bash
git clone --branch Latest https://github.com/YOUR-ACCOUNT/OpenClassCraft.git
cd OpenClassCraft
git remote add upstream https://github.com/OpenClassCraft/OpenClassCraft.git
```

The main [README](../README.md#build-from-source) contains Ubuntu, Fedora, and Windows build instructions. The repository has three development areas:

| Area | Main paths | Typical tools |
| --- | --- | --- |
| Engine and menu | `src/`, `builtin/`, `CMakeLists.txt` | C++17, CMake, Lua |
| Educational game | `games/luanti_edu/` | Lua and Luanti content formats |
| Desktop apps | `creator-app/`, `teacher-console/` | JavaScript, Electron, npm |

The `doc/` tree includes substantial documentation inherited from Luanti. Use [Luanti's official engine documentation](https://docs.luanti.org/) and [Lua API reference](https://github.com/luanti-org/luanti/blob/master/doc/lua_api.md) when working on upstream-compatible engine or mod APIs, while documenting OpenClassCraft-specific behavior in this repository.

## Make a change

- Follow the existing style near the code you change.
- Use the [upstream C++](https://docs.luanti.org/for-engine-devs/code-style-guidelines/) and [Lua](https://docs.luanti.org/for-engine-devs/lua-code-style-guidelines/) conventions in inherited engine/game code.
- Preserve world, lesson, project, and backup data compatibility unless the change includes a reviewed migration.
- Do not commit local worlds, `debug.txt`, user names, Teacher Console records, exported bridge tokens, build output, `node_modules/`, or unrelated lockfile changes.
- Keep classroom copy understandable to students and teachers. Explain destructive actions and privacy boundaries plainly.
- Add or update documentation for user-visible behavior, settings, commands, data formats, and build changes.
- Preserve all applicable upstream copyright, license, and asset-attribution notices.
- Disclose material use of generated code or generated assets in the pull request, and confirm that you reviewed the result and have the right to contribute it.

Use a short, present-tense commit subject. A blank line followed by context is useful when the reason is not obvious. Avoid rewriting shared history after review has started.

## Test the change

Run the checks that match the affected area and describe both successful and unsuccessful results in the pull request.

### Engine

Build the affected platform, then run:

```bash
./bin/openclasscraft --run-unittests
```

On Windows, the run-in-place Release path is `bin\Release\openclasscraft.exe`.

### Educational game and classroom tools

Create a fresh world as well as opening a disposable copy of an existing world. Manually test the changed path and its permissions. Depending on the change, include:

- a robot sequence and its failure/limit cases;
- inventory search and category placement;
- Guide/board ownership and editing;
- Lesson Planner progress and reset behavior;
- Chemistry Lab item consumption/output;
- host and student behavior on a LAN server;
- accessibility modes at different window sizes; and
- Teacher Console bridge startup, sync, invalid token, and stopped-bridge behavior.

Never use real student records in a test fixture or bug report.

### Desktop apps

Install each changed app independently and launch it from its own directory. At minimum, syntax-check changed JavaScript:

```bash
node --check creator-app/main.js
node --check creator-app/preload.js
node --check creator-app/app/renderer.js
node --check teacher-console/main.js
node --check teacher-console/preload.js
node --check teacher-console/app/renderer.js
```

For Creator changes, inspect and load an exported mod in a disposable world. For Teacher Console changes, test create/edit/delete, CSV import/export, JSON backup/restore, and the bridge if they are in scope. Packaging tests must be run on the target operating system.

### Documentation-only changes

Check relative links, commands, platform paths, headings, tables, and rendered Markdown. Do not describe a planned feature as implemented.

## Open a pull request

Push your topic branch and [open a pull request](https://github.com/OpenClassCraft/OpenClassCraft/pulls) against `OpenClassCraft/OpenClassCraft:Latest`. Complete the template with:

- the problem and the user-visible result;
- the components and platforms affected;
- exact test commands and manual scenarios;
- screenshots for visible UI changes;
- privacy, permission, accessibility, data-migration, and compatibility impact; and
- related issues, documentation, and release-note needs.

A change is ready to merge when it is scoped, understandable, licensed for inclusion, tested in proportion to its risk, documented, and reviewed. A maintainer may request narrower scope or more evidence when a change affects classroom data, network access, permissions, saves, releases, or generated Lua.

## Report bugs and request features

Use the project templates:

- [Bug report](https://github.com/OpenClassCraft/OpenClassCraft/issues/new?template=bug_report.yaml)
- [Feature request](https://github.com/OpenClassCraft/OpenClassCraft/issues/new?template=feature_request.yaml)

Include the OpenClassCraft version or commit, operating system, package/source origin, reproduction steps, and a redacted log when relevant. Before attaching `debug.txt`, `minetest.conf`, a world, a CSV, or a backup, remove names, passwords, LAN addresses, access tokens, and student information.

## Security reports

Do not open a public issue for a vulnerability. Follow the [OpenClassCraft security policy](SECURITY.md) and use [GitHub private vulnerability reporting](https://github.com/OpenClassCraft/OpenClassCraft/security/advisories/new).

## Translation and upstream work

OpenClassCraft inherits many translated engine strings from Luanti. Upstream engine translation is managed through [Luanti on Weblate](https://hosted.weblate.org/projects/minetest/minetest/). New OpenClassCraft-specific strings should remain translatable and should be discussed in an OpenClassCraft pull request before bulk-generated translation files are changed.

Changes that are generally useful to the underlying engine may also be good upstream contributions. Submit them upstream separately under Luanti's contribution policy; do not make an OpenClassCraft pull request depend on an unmerged upstream change without explaining the fallback.
