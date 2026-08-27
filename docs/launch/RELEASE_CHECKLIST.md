# Release and paid-readiness checklist

Use a new copy of this checklist for every candidate. Record the tag, commit, tester, date, device, and evidence link. A checked box means the exact candidate passed—not that an older build once worked.

## Candidate record

- Candidate tag:
- Full commit SHA:
- Intended channel: Community alpha / Creator preview / School Console beta
- Release owner:
- Independent tester:
- Test date:
- Rollback owner:

## Gate A — public Community Fedora alpha

All items block `v0.1.0-alpha.1` publication.

### Provenance and package

- [ ] The tag exists, points to the tested commit, and follows the approved prerelease name.
- [ ] The Fedora 44 x64 RPM was produced by the release workflow, not assembled manually.
- [ ] The RPM contains the game, engine, builtin files, media, desktop metadata, icons, and required licence notices.
- [ ] The SHA-256 file verifies against the final uploaded RPM.
- [ ] The RPM and checksum names match the documented release names exactly.
- [ ] The public asset directory contains no Teacher Console, school data, token, local config, world, debug log, or credential.
- [ ] Release notes identify the build as an alpha and link to known limitations.
- [ ] The checked-in Community release preamble is still accurate for this candidate.

### Clean-device checks

- [ ] Install and start on a clean Fedora 44 x64 user account.
- [ ] The RPM installs with `sudo dnf install ./OpenClassCraft-Fedora-44-x86_64.rpm`.
- [ ] Unsigned-package limitations are described accurately until RPM signing is implemented.
- [ ] The desktop entry, icon, AppStream metadata, terminal command, and non-administrator launch work.
- [ ] Update and uninstall/removal instructions are accurate for the RPM.

### Automated and smoke checks

- [ ] `openclasscraft --version` exits successfully.
- [ ] `openclasscraft --run-unittests` passes, including LAN discovery tests.
- [ ] A fresh headless world starts and the log contains the coding-mod and server-listening markers.
- [ ] The fresh-world log contains no `ERROR[` entry.
- [ ] A second fresh world can be created, saved, closed, and reopened.

### Core learning flow

- [ ] The catalog opens and exposes Programming, Classroom, and Chemistry items.
- [ ] Place a robot, `START`, `MOVE`, `TURN`, and `STOP`; the robot follows the sequence.
- [ ] A loop and a clear/blocked condition are tested with the limitations explained.
- [ ] A Guide, board, checkpoint, and Lesson Planner task work in a fresh world.
- [ ] The Chemistry Lab creates water and advances its supported lesson task.
- [ ] Accessibility switches are exercised and do not prevent starting a lesson.
- [ ] A world backup is created and restored before destructive-tool testing.

### Local classroom flow

- [ ] One Fedora host and a second physical device join on a trusted LAN.
- [ ] LAN discovery finds the host through UDP 29999 where the network permits broadcast.
- [ ] Manual private-address join works when discovery is disabled or blocked.
- [ ] A password-protected host works.
- [ ] Discovery does not add the class to the public server list.
- [ ] Firewall instructions distinguish the selected game port from discovery port 29999.
- [ ] The host and client logs contain no unexplained error or private credential.

### Documentation, licence, and recovery

- [ ] README steps match the candidate UI.
- [ ] The release notes link the source for the exact tag and retain required licence/notices.
- [ ] Known limitations include permissions, experimental robot behaviour, destructive tools, and missing join code.
- [ ] The issue and security-reporting routes work.
- [ ] A previous known-good package and release notes remain available for rollback.
- [ ] The release owner signs: ____________________ Date: __________

## Gate B — Creator developer preview

- [ ] Creator packages are separate from Community and School Console packages.
- [ ] Node/Electron dependencies install from the locked package file and high-severity audit policy passes.
- [ ] Main, preload, and renderer JavaScript syntax checks pass.
- [ ] A starter project exports a complete mod folder and project JSON.
- [ ] Exported Lua is reviewed for the documented event/action/logic cases.
- [ ] Exported content loads in a disposable OpenClassCraft world without an error.
- [ ] Generated conditions, waits, item identifiers, and texture dependencies match the UI labels.
- [ ] The preview states that generated content needs adult review before student use.
- [ ] Creator licences and bundled dependency notices are present.

Until these items pass, Creator packages remain CI artifacts or explicitly named developer previews—not recommended teacher downloads.

## Gate C — controlled School Console pilot

All items block delivery to a pilot school.

### School approval and scope

- [ ] A school decision-maker approves beta installation and classroom use in writing.
- [ ] The pilot agreement names the campus, teacher champion, term, support scope, price/waiver, exit, and data responsibilities.
- [ ] Government-school deployment has the applicable school, KITE, and departmental approvals for the exact package.
- [ ] The teacher receives [PRIVACY_AND_SAFETY.md](PRIVACY_AND_SAFETY.md) and agrees to the alias-only pilot rule.

### Technical readiness

- [ ] The School Console build was produced by an owner-authorised manual workflow run.
- [ ] Its checksum and version are recorded in the customer register.
- [ ] Package syntax/audit checks pass on the exact build.
- [ ] Workspace create, restart persistence, JSON backup, JSON restore, CSV import, and CSV report export pass with disposable aliases.
- [ ] The loopback bridge binds only to `127.0.0.1`, rejects a wrong token, and returns only the selected lesson data.
- [ ] A leaked or stale bridge token can be replaced and the old token stops working.
- [ ] The Console and host work together on the teacher machine.
- [ ] No student client needs direct access to the Console bridge.

### Classroom readiness

- [ ] The lab check verifies device count, OS, graphics/startup, disk space, trusted LAN, host firewall, and backup location.
- [ ] One teacher can complete setup and the starter lesson rehearsal within 45 minutes using the quickstart alone.
- [ ] Ten simultaneous pilot clients complete join, program run, leave, and rejoin on the target lab—or the written pilot limit is reduced.
- [ ] Educator/student permission limitations are explained and the session uses a trusted supervised group.
- [ ] The World Edit Wand is excluded or used only on a backed-up disposable world.
- [ ] A tested uninstall, workspace export, and pilot-exit process exists.
- [ ] The teacher and founder know the stop-session rule for privacy, data-loss, permissions, or safety incidents.

## Gate D — production paid School Edition

All sections block a production claim or annual paid rollout.

### Product and security

- [ ] Hardened teacher/student authorisation exists for editing, inventory, destructive actions, and assessment controls.
- [ ] School Console local storage and exported backups are encrypted using an owner-reviewed design.
- [ ] Secret/token lifecycle, update authenticity, dependency patching, vulnerability reporting, and supported-version policies are documented.
- [ ] Automated tests cover save/restore, CSV import, permissions, report export, bridge authentication, and data migration.
- [ ] At least one starter coding world is stable, documented, and classroom tested.
- [ ] Fedora 44 is verified on physical target devices; later Windows and Ubuntu/KITE support is verified before those assets are offered.
- [ ] A signed or clearly documented unsigned-update process prevents ambiguous installers.
- [ ] There is no open critical safety, privacy, data-loss, permission, installation, or update defect.

### Evidence and support

- [ ] Three schools completed the agreed pilot.
- [ ] At least 80% of planned pilot sessions succeeded.
- [ ] Average closing teacher usefulness is at least 8/10.
- [ ] Two schools state in writing that they would pay the proposed campus price.
- [ ] Two owner- and school-approved evidence assets exist.
- [ ] Support averages less than two founder hours per school per month after onboarding.
- [ ] Support hours, response target, escalation, exclusions, and service exit are written.

### Business and legal

- [ ] The owner approves a redistributable School Console licence and third-party notice bundle.
- [ ] A qualified Indian adviser reviews the entity, tax/invoice, payment, refund/cancellation, privacy, school agreement, and recordkeeping process.
- [ ] The order form states campus, teachers, term, price, taxes, training, support, updates, renewal, termination, and data/export rights.
- [ ] An invoice and payment reconciliation test is completed without real student data.
- [ ] A customer/build register records agreement, entitlement, delivered version, checksum, training, renewals, and exit.

## Publication procedure

1. Freeze scope and create the candidate tag only after the branch checks pass.
2. Run `release-build` manually with the exact tag commit. Use `release_scope: fedora-alpha` for the initial alpha and leave `publish` disabled for the candidate run.
3. Download and independently verify the Community artifacts and checksums.
4. Complete Gate A on clean devices and attach evidence to the release record.
5. Re-run the same commit with `publish` enabled, `release_scope: fedora-alpha`, and the exact existing tag.
6. Confirm the release contains only approved Community assets before announcing it.
7. Post one canonical announcement linking to the release, limitations, quickstart, and feedback route.

## Rollback triggers

Hide or clearly withdraw the affected download and notify known testers when any of these occur:

- data loss or world corruption;
- an educator/student permission escape that enables harmful classroom actions;
- unintended public exposure of school, student, token, or local-network data;
- package tampering or checksum mismatch;
- a repeatable crash that blocks the starter lesson; or
- an incorrect package/channel, especially a School Console package in a Community release.

Record what was withdrawn, why, who was notified, the safe workaround, and the next decision date. Never silently replace an existing release asset.
