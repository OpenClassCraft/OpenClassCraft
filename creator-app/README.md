# OpenClassCraft Creator

OpenClassCraft Creator is the desktop visual-mod editor for OpenClassCraft. It uses Blockly so teachers and learners can assemble a classroom block and its interaction behavior without typing Lua.

The current palette includes placement and proximity events; message, item, block, wait, and variable actions; conditions; loops; and variables. Export creates an `openclasscraft_<project>` folder containing:

- `mod.conf` — the generated mod metadata.
- `init.lua` — Lua generated from the visual workspace.
- `project.openclasscraft.json` — the editable project data and Blockly workspace.

The application works locally and does not require an account or a network connection after dependencies have been installed.

## Run from source

Install Node.js 22.12 or newer, then run these commands from `creator-app`:

```bash
npm install
npm start
```

`npm start` uses the project-local Electron dependency and works on Linux and Windows. Linux systems need a graphical desktop session.

## Package the desktop app

Create a Linux AppImage on a Linux machine:

```bash
npm run package:linux
```

For an x64 build, the distributable is:

```text
dist/OpenClassCraft-Creator-0.1.0-linux-x86_64.AppImage
```

Run it on Ubuntu or Fedora with:

```bash
chmod +x dist/OpenClassCraft-Creator-0.1.0-linux-x86_64.AppImage
./dist/OpenClassCraft-Creator-0.1.0-linux-x86_64.AppImage
```

Create a portable Windows executable on Windows, or on a Linux host configured with Wine:

```bash
npm run package:win
```

For an x64 build, the distributable is:

```text
dist/OpenClassCraft-Creator-0.1.0-windows-x64.exe
```

Both commands also create an unpacked staging directory under `dist/`. Release the named `.AppImage` or `.exe`, not the staging directory. Packaging is unsigned, so Windows may display a SmartScreen warning until releases are code-signed.

## Use the editor

1. Name the project and its custom block.
2. Choose a block style and category.
3. Drag an event into the workspace and connect actions below it.
4. Review the live preview.
5. Select **Export Mod** and choose a destination.
6. Copy the exported folder into the OpenClassCraft game or world `mods` directory, enable it, and restart the world.

**New** clears the current Blockly workspace. Exporting to an existing project folder can replace its generated files, so keep the JSON project file in version control or a backup location.

## Development notes

- `main.js` owns the Electron window and filesystem export.
- `preload.js` exposes the narrow export API to the isolated renderer.
- `app/renderer.js` defines the Blockly blocks and Lua generator.
- `app/index.html` and `app/style.css` define the interface.
- Blockly is bundled from `node_modules`; no CDN is used.

Before a release, validate both JavaScript syntax and both package targets on their destination operating systems. The generated mod should also be opened in a disposable OpenClassCraft world and exercised before classroom use.

## License

OpenClassCraft Creator is distributed under the [GNU General Public License version 2.0 only](LICENSE). Bundled third-party dependencies, including Blockly and Electron, retain their respective licenses.
