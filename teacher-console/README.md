# OpenClassCraft Teacher Console

The Teacher Console is a local desktop application for classroom planning and assessment. It is separate from the Luanti-derived game code and stores its data on the teacher's computer.

> **Distribution status:** This is a controlled Founding School Beta component, not a Community Edition release. Automated packaging requires the owner-authorised `build_school_console` workflow option, and the public release job excludes every Console artifact. Source visibility does not override the `UNLICENSED` notice below.

## Current workflows

- Create lessons with objectives and checkpoints.
- Maintain students, groups, and group-to-lesson/world assignments.
- Import a CSV class list with a required `Name` column and optional `Group` column.
- Track checkpoints, add teacher notes, export CSV reports, and create JSON backups.
- Share the selected lesson with a local OpenClassCraft host through a loopback-only bridge.

## LAN lesson bridge

1. In **Classroom**, create a lesson assignment and choose it under **LAN lesson bridge**.
2. Click **Start bridge**, then click **Export settings**.
3. Copy the generated `openclasscraft-teacher-bridge.conf` entries into the teacher host's `minetest.conf`.
4. Restart the OpenClassCraft host.
5. In the hosted world, an educator runs `/occ_teacher_sync`.

The bridge listens only on `127.0.0.1`, requires the generated token, and returns the active lesson plan only. The game can also post a player's name, lesson title, and completed/total task counts to the Console using the same token. It does not transmit student records, reports, or backups.

## Run from source

Install Node.js 22.12 or newer, then run these commands from `teacher-console`:

```bash
npm install
npm start
```

`npm start` uses the project-local Electron dependency and works on Linux and Windows. The former `.electron-runtime` machine-local path is not required. Linux systems need a graphical desktop session.

## Package the desktop app

Create a Linux AppImage on a Linux machine:

```bash
npm run package:linux
```

For an x64 build, the distributable is:

```text
dist/OpenClassCraft-Teacher-Console-0.1.0-linux-x86_64.AppImage
```

Run it on Ubuntu or Fedora with:

```bash
chmod +x dist/OpenClassCraft-Teacher-Console-0.1.0-linux-x86_64.AppImage
./dist/OpenClassCraft-Teacher-Console-0.1.0-linux-x86_64.AppImage
```

Create a portable Windows executable on Windows, or on a Linux host configured with Wine:

```bash
npm run package:win
```

For an x64 build, the distributable is:

```text
dist/OpenClassCraft-Teacher-Console-0.1.0-windows-x64.exe
```

Both commands also create an unpacked staging directory under `dist/`. Release the named `.AppImage` or `.exe`, not the staging directory. Packaging is unsigned, so Windows may display a SmartScreen warning until releases are code-signed.

## Local data and backups

The application stores its workspace in Electron's per-user application-data directory as `teacher-console.json`. Use **Back up** before moving computers or installing an experimental build. Reports are exported as CSV, and backups are exported as JSON, only to locations selected by the teacher.

The bridge token grants access to the selected local lesson session. Do not publish the generated configuration file, and regenerate the workspace or token if it is exposed. The bridge deliberately binds to loopback, so the OpenClassCraft host and Teacher Console must run on the same computer.

## Development notes

- `main.js` manages local persistence, CSV/JSON import and export, and the loopback lesson bridge.
- `preload.js` exposes a narrow IPC API to the isolated renderer.
- `app/renderer.js` implements the classroom workflows.
- `app/index.html` and `app/style.css` define the interface.

Before a release, validate JavaScript syntax, exercise backup restore and CSV import with disposable data, and package on the destination operating systems. Test the LAN bridge with an OpenClassCraft host before classroom deployment.

## License status

The original Teacher Console code is currently marked `UNLICENSED`; no standalone permission to copy, modify, or redistribute it has been granted. See [`NOTICE`](NOTICE). Electron and other dependencies keep their own licenses. Choose and document an owner-approved license before redistributing this component beyond builds published by the project owner.
