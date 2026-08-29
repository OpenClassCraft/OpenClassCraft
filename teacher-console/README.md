# OpenClassCraft Teacher Console

The Teacher Console is the local-first classroom control, lesson-authoring, assessment, and recovery application for OpenClassCraft. Version 0.2.0 targets Fedora/Linux first and does not require an Internet connection for classroom operation or license verification.

> **Distribution status:** this remains a controlled Founding School Beta component. It is marked `UNLICENSED`; choose and document an owner-approved license before redistributing School Edition builds beyond releases made by the project owner.

## Included workflows

### Classroom safety

- Student, Observer, and Educator roster roles with exact game-username matching.
- Six-character classroom join code and recent connection presence.
- Class-scoped chat history for rostered players who joined the current assignment and session.
- Base assignment permissions plus stage-specific Place, Dig, World Edit Wand, block-ID, and tool-ID restrictions.
- Educator elevation is never granted from a join code alone; the host must already be an educator or explicitly use `/occ_set_role`.
- Destructive Console actions require typed confirmation, and managed-world reset/restore archives the previous world instead of deleting it.

### Lesson authoring

- Objectives and ordered checkpoints.
- Attached Guide, Dialogue, Chalkboard, Flag, Chemistry, Robot, Build, and Quiz activity descriptions.
- Multi-stage lessons with different checkpoint sets and world policies.
- Draft/published state, duplication, up to 25 local versions, and rollback that preserves the current version first.
- Portable curriculum pack import/export without roster, progress, or portfolio data.

### Assessment and portfolios

- Manual checkpoint records and teacher notes.
- Automatic LAN progress, robot result, chemistry result, build-submission, and class-message events.
- Reusable rubrics, criterion scoring, feedback, and pending/reviewed queues.
- Screenshot/document evidence copied into protected local app data and fingerprinted with SHA-256.
- Group dashboard plus CSV and printable PDF reports.
- A visible audit trail and a reconciliation queue for unknown game usernames.

### Recovery, privacy, and updates

- Atomic workspace saves, checksum validation, a last-known-good backup, and ten rolling recovery points.
- Optional AES-256-GCM workspace and backup encryption with scrypt key derivation. Passphrases are never stored and cannot be recovered.
- A dedicated Chat history view, filtered by classroom assignment, with an explicit clear action and a 5,000-message local safety cap.
- Explicit encrypted folder sync suitable for a mounted Nextcloud, Dropbox, Google Drive, network share, or USB folder. The Console does not contact those services itself.
- Opt-in local crash notes and performance consent controls; nothing is uploaded automatically.
- Redacted diagnostics export.
- Local update-manifest verification for platform, architecture, SHA-256, and a pinned Ed25519 owner signature when the release public key is installed. The Console never auto-executes packages.

## Four starter lesson worlds

Assignments can install clean, playable managed worlds under the Console data directory:

| World | Core activity | Evidence |
| --- | --- | --- |
| Coding | Program a robot through a marked route | Robot result and debugging explanation |
| Chemistry | Model a water reaction at group benches | Reaction record and H2O explanation |
| Science | Compare sand, gravel, and clay model zones | Consistent observations and evidence-backed claim |
| Environmental Studies | Compare water, dry-soil, and habitat zones | Low-impact improvement proposal |

Each installed world contains `TEACHER_NOTES.md`. Use **Snapshot** before an open build stage. **Reset** creates an archived copy next to the managed world before rebuilding the template.

## LAN classroom bridge

1. In **Classroom**, assign a lesson to a group and select **Use live**.
2. Start the session and export `openclasscraft-teacher-bridge.conf`.
3. Copy its settings into the teacher host's `minetest.conf`, then restart the host.
4. An educator runs `/occ_teacher_sync` in the hosted world.
5. Students connect to the host and run `/occ_join CODE`, using the code shown in the Console.

The bridge binds only to `127.0.0.1` because the game host and Console run on the same teacher computer. Student devices connect to the Luanti game server, not directly to the Console. Requests use a random 192-bit token. The selected group roster, active lesson/stage, and policy remain on the local host. Chat is stored only when the sender is rostered, has joined with the current code, and the assignment and unique session ID match. Messages from other assignments, expired sessions, unmatched usernames, and ordinary non-class worlds are rejected.

Saved class messages are student records. Tell learners that class chat is retained, use approved aliases, enable workspace encryption, and clear history according to the school's retention policy. Clearing the active workspace does not immediately remove older rolling recovery copies.

Useful in-game commands:

```text
/occ_teacher_sync                 educator: apply the selected Console assignment
/occ_join ABC123                 student: join after exact roster matching
/occ_submit_build Short note     student: submit a build for review
/occ_role                        show the current classroom role
```

## Run on Fedora from source

Node.js 22.12 or newer is required:

```bash
cd teacher-console
npm install
npm run validate
npm start
```

The application uses project-local Electron and stores data in Electron's per-user application-data directory. The exact location is shown in **Operations → Diagnostics**.

## Build the Fedora/Linux AppImage

```bash
cd teacher-console
npm run package:linux
chmod +x dist/OpenClassCraft-Teacher-Console-0.2.0-linux-x86_64.AppImage
./dist/OpenClassCraft-Teacher-Console-0.2.0-linux-x86_64.AppImage
```

`package:linux` runs syntax and automated core tests before packaging. It creates the AppImage plus an unpacked staging directory; distribute the named AppImage, not the staging directory. The AppImage is not OS code-signed yet.

## Test student flow locally

1. Start the Console, create an assignment, choose **Use live**, and start the bridge.
2. Export the host config and apply it to the local OpenClassCraft configuration.
3. Start a hosted world and run `/occ_teacher_sync`.
4. Connect one or two disposable student accounts whose game usernames exactly match the Console roster.
5. Run `/occ_join CODE`, complete a checkpoint, create a chemistry item or run a robot program, and use `/occ_submit_build`.
6. Send class chat from a joined student and confirm it appears only under the matching assignment in **Chat history**.
7. Confirm presence, progress, submissions, policy denials, and audit events in the Console.

See [QA_CHECKLIST.md](QA_CHECKLIST.md) for the release matrix and [release/README.md](release/README.md) for update signing.

## Important limitations before a school release

- The project owner must choose the Teacher Console's redistribution license.
- A real two-device Fedora LAN rehearsal and a classroom pilot cannot be completed by automated tests.
- Install the project owner's Ed25519 update public key before advertising signed updates.
- Treat the starter activities as classroom models; they do not replace supervised physical science or chemistry safety procedures.
