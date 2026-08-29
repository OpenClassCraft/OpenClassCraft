# Teacher Console 0.2.0 release checklist

Use disposable student accounts and test worlds. Never use a production class roster for release testing.

## Automated gate

- [x] Schema-v2 data migrates to schema v4.
- [x] CSV `Role` is read from the correct column; quoted and multiline values parse.
- [x] Plain workspace checksum corruption is rejected.
- [x] AES-256-GCM encrypted workspace round-trips; missing/wrong passphrases fail closed.
- [x] Selected bridge payload includes only the assigned group.
- [x] Stage override policy and block whitelist reach the bridge payload.
- [x] Presence, progress, chemistry, robot, and build event models are accepted.
- [x] Unknown player events enter reconciliation and can be replayed.
- [x] Chat messages are accepted only for the matching active assignment, session ID, lesson, group, and rostered username.
- [x] Curriculum packs omit roster/progress data.
- [x] Coding, Chemistry, Science, and EVS template files and runtime exist.
- [x] Main, preload, renderer, core, release-script JavaScript syntax passes.
- [x] Classroom bridge, coding executor, and starter-world Lua syntax passes.

Run the gate:

```bash
cd teacher-console
npm run validate
```

## Fedora desktop smoke test

- [x] Start the current build under a Fedora graphical session; all eight views, including Chat history, render with no reload exceptions.
- [ ] Create/edit/duplicate/publish/version/rollback a lesson.
- [ ] Author at least two lesson stages and switch the active assignment stage.
- [ ] Import `Name,Username,Group,Role` CSV and verify all three roles.
- [ ] Rename a group, bulk-move students, and confirm non-empty group deletion is refused.
- [ ] Create a rubric, review a submission, and export CSV/PDF.
- [ ] Attach a screenshot to a student portfolio and verify its SHA-256 is stored.
- [ ] Enable workspace encryption, restart, reject a wrong passphrase, then unlock correctly.
- [ ] Export and restore encrypted and plain backups with disposable data.
- [ ] Push/pull an encrypted sync copy through a temporary folder.
- [ ] Export/import a curriculum pack and confirm no students are included.
- [ ] Export redacted diagnostics and inspect for student names.

## Managed-world recovery

- [ ] Install each of the four starter worlds.
- [ ] Launch each world with game ID `luanti_edu`; confirm the arena, boards, markers, and spawn.
- [x] Create a snapshot from a disposable Console-managed world.
- [x] Reset the world and verify the previous world was renamed to `.archive-<timestamp>`.
- [x] Restore a snapshot and verify the pre-restore world was also archived.
- [x] Duplicate a managed world into an independent assignment-owned copy.
- [x] Load the generated Coding world in the real OpenClassCraft server; arena emergence completes without map-access or missing-block errors.
- [ ] Confirm the Console refuses reset/restore for a path outside its managed-world directory.

## Two-device LAN and role matrix

- [ ] Host OpenClassCraft and the Teacher Console on Fedora device A.
- [ ] Connect student device B to the displayed IPv4 address and game port.
- [ ] Reject an incorrect class code.
- [ ] Reject a valid code for a username absent from the assigned group.
- [ ] Match a Student username and enforce current stage Place/Dig/block whitelist.
- [ ] Match an Observer username and deny world changes.
- [ ] Confirm a roster `Educator` is not elevated by join code alone.
- [ ] Grant Educator explicitly with `/occ_set_role`; confirm educator controls.
- [ ] Observe presence online/left transitions in the Console.
- [ ] Send messages through normal chat and the visual Actions window; confirm both appear only in the selected classroom's Chat history.
- [ ] Reject chat from an unjoined player, a different assigned group, and an expired session.
- [ ] Clear one classroom's history and confirm other classroom histories remain.
- [ ] Complete a checkpoint and verify the correct student/lesson record.
- [ ] Run one successful and one blocked robot program; review both submissions.
- [ ] Create a chemistry result and submit a build; review with a rubric.
- [ ] Deliberately mismatch one username; reconcile the event in Operations.
- [ ] Disconnect the Internet during the complete workflow; confirm it still works.

## Fedora package gate

- [x] Build `OpenClassCraft-Teacher-Console-0.2.0-linux-x86_64.AppImage`.
- [x] Confirm the AppImage contains `console-core.cjs`, all four unpacked curriculum packs, and release documentation.
- [x] Launch the AppImage on the build Fedora machine.
- [x] Launch it with a clean isolated Fedora application profile.
- [x] Verify the final packaged loopback session payload, assigned-group roster, rotating code, block whitelist, presence event, renderer update, and audit entry.
- [x] Generate and verify the AppImage SHA-256 manifest.
- [ ] Install the owner public key and verify an Ed25519-signed update manifest.
- [ ] Archive the checksum, manifest, test log, and exact Git commit for the release.

## Owner/legal gate

- [ ] Choose and record the Teacher Console license; replace `UNLICENSED` only with owner approval.
- [ ] Install only the owner-approved update public key; never commit the private key.
- [ ] Approve student-data retention, consent text, privacy notice, and school support process.
- [ ] Complete one supervised pilot and document issues before general School Edition availability.
