# OpenClassCraft Delivery Checklist

Status: `[x]` delivered and verified, `[-] partly implemented or needs verification`, `[ ] planned`.

## Community Edition

### Core Game
- [-] Fedora 44 RPM release build and physical validation
- [ ] Windows release build and launcher
- [ ] Linux compatibility build and test on Ubuntu
- [ ] macOS release build and test
- [-] LAN host and join workflow
- [-] Educator and student roles
- [-] Local worlds, backups, and basic permissions
- [-] OpenClassCraft branding, textures, skins, menus, and accessibility settings
- [-] Inventory, building, breaking, tools, crafting, day/night, weather, and sound reliability pass

### Learning Tools
- [-] Robot programming: movement, conditions, loops, variables, sensors, and wait
- [-] Class Guides: dialogue bubbles, instructions, and reference links
- [-] Editable chalkboards
- [-] Checkpoint flags
- [-] Chemistry Lab recipes and spawned results
- [-] Desktop Creator visual editor (Blockly behavior editor plus generic WebGL cube modeling, hierarchy rigging, per-face pixel painting/PNG UV export, keyframe animation, glTF export, state-mapped mob AI, and project reopen workflow; core export and game-runtime loading verified, wider cross-platform validation remains)
- [x] Starter lesson worlds: coding, chemistry, science, and environmental studies, with generated arenas, policies, and teacher notes

### Educator Workflow
- [-] Educator mode selection
- [-] Place and edit Guides, boards, flags, robots, and chemistry labs
- [-] Save and load local lesson worlds
- [x] Student-safe item use and per-world build permissions (place/dig/tool/block/world-edit policy enforced by role and lesson stage)
- [-] Local progress checkpoints

### Open Source and Release
- [-] Luanti-derived notices and source availability workflow
- [-] Community documentation and installer scripts
- [x] Separate Community, Creator preview, and controlled School Console release artifacts
- [x] Public release asset allow-list and checksum guard
- [ ] Community lesson examples and contributor guide refresh

## Launch and Adoption

### Public Launch Surface
- [x] Founding School Beta landing page source and static build
- [x] GitHub Pages deployment workflow
- [x] Privacy-safe public school application template
- [x] Honest Community preview / school beta / production release definitions
- [ ] Enable GitHub Pages with GitHub Actions as the publishing source
- [ ] Configure an owner-controlled business email and private school enquiry route
- [ ] Capture three current-build 1920×1080 gameplay screenshots
- [ ] Record a 30–45 second build → run → debug gameplay clip

### Offer and Pilot Operations
- [x] Community-free, campus-supported product model
- [x] Founding pilot and annual pricing proposal
- [x] Pilot qualification, technical check, session, feedback, issue, and closeout playbook
- [x] Operational privacy, alias, retention, incident, and pilot-exit rules
- [x] English teacher quickstart
- [x] Malayalam teacher quickstart
- [x] Press kit and India Game Awards submission worksheet
- [x] 30-day school, teacher, community, press, and launch outreach kit
- [ ] Obtain owner-approved Indian legal/accounting review before annual payments
- [ ] Approve School Console redistribution/licence terms
- [ ] Execute written pilot agreement and data-responsibility schedule
- [ ] Submit the India Game Awards application

### Release Gates
- [x] Document Community alpha, Creator preview, School Console beta, and paid-production gates
- [ ] Validate the Fedora 44 RPM on a clean physical/test account
- [ ] Complete a two-device trusted-LAN release-candidate test
- [ ] Publish a checksum-verified Community alpha release
- [ ] Validate Windows 10 and Windows 11 before adding Windows release assets
- [ ] Validate Ubuntu 22.04 on target hardware for an authorised KITE evaluation
- [ ] Complete three school pilots with at least 80% of sessions delivered
- [ ] Obtain two school willingness-to-pay statements and two approved evidence assets
- [ ] Reach zero open critical defects and under two support hours/school/month

## Teacher Console

### Classroom Management
- [-] School and teacher profile
- [-] Student records and manual groups
- [-] CSV class-list import
- [-] Assign groups to worlds and lessons
- [-] Student-friendly LAN join-code workflow (rotating code, roster match, presence, and offline loopback bridge verified locally; two-device rehearsal pending)
- [-] Educator permission controls (Student/Observer/Educator gates implemented; physical two-device role matrix pending)

### Lesson Workflow
- [x] Create, edit, duplicate, publish, delete, save, and restore lesson plans
- [x] Lesson versions and rollback
- [x] Starter-world assignment for coding, chemistry, science, and EVS
- [x] Attach Guide/dialogue, Chalkboard, Flag, Chemistry, Robot, Build, and Quiz activities
- [x] Lock/unlock tools and blocks by lesson stage
- [x] Install, duplicate, snapshot, reset, and restore a managed lesson world with archive-before-replace recovery

### Assessment
- [x] Checkpoint progress and teacher notes
- [x] Robot program completion, chemistry results, and build submissions
- [x] Reusable rubrics, criterion scoring, and feedback
- [x] Student portfolios with SHA-256 evidence records and recoverable world snapshots
- [x] CSV reports
- [x] Printable PDF reports and class/group/student dashboards

### School Operations
- [x] Offline-first local storage and JSON backups with atomic writes, checksums, and a recoverable previous-state snapshot
- [x] Optional AES-256-GCM encrypted local storage and encrypted backups
- [x] Local SHA-256/platform/architecture update verification with optional pinned Ed25519 signature verification
- [x] Teacher action audit log
- [x] Opt-in encrypted folder sync for mounted cloud, network, or removable storage
- [x] Privacy-safe diagnostics, explicit local error-log consent, and curriculum-pack import/export workflow

## Integration and Quality Gates
- [x] Document the local LAN integration protocol between the game and Teacher Console
- [-] Authenticate educator-issued session data (random 192-bit loopback token and rotating join code verified locally; two-device validation pending)
- [x] Synchronize only assigned roster, lesson policy, presence, progress, and approved evidence events
- [x] Automated core tests for migration, CSV, checksums, encryption, bridge scope, permissions, reports/events, and curriculum packs
- [x] Opt-in local renderer error logs and redacted diagnostic export; no automatic upload
- [ ] Performance profiling for classroom-size worlds
- [ ] Run a pilot with 1-3 schools and record feedback

## Current implementation checklist (2026-08-27)

- [x] Versioned Teacher Console state schema with migration-safe normalization.
- [x] Atomic state writes (temporary file, flush/sync, rename) to avoid partial classroom records.
- [x] Automatic `.backup` snapshot of the last known-good state before each save.
- [x] Checksum-validated state and backup envelopes with fallback recovery when the primary file is corrupt.
- [x] Per-assignment world policy for student place, dig, and world-edit-wand access.
- [x] Role-aware game gates: students cannot open educator tools or bypass assignment policy.
- [x] Destructive assignment removal confirmation and bridge selection cleanup.
- [x] CSV role import updates existing student records as well as new records.
- [x] Starter lesson preset catalog exposed to the console and LAN bridge.
- [x] Author and package the four playable starter worlds and their teacher notes.
- [x] Build and launch the Fedora AppImage with a clean isolated profile.
- [x] Exercise checksum corruption rejection, encrypted round-trip, managed-world snapshot/reset/restore, and packaged bridge integration.
- [ ] Run the physical Fedora two-device LAN and role/policy matrix rehearsal.
