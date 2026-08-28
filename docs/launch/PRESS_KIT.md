# OpenClassCraft press kit

Updated: 26 August 2026

## One-line description

OpenClassCraft is an offline, open-source voxel coding classroom where Grades 5–8 students build programs as blocks, run them through a robot, and debug the result together.

## Short description

OpenClassCraft turns code into a place students can build, walk through, run, and debug. In a bright 3D voxel world, learners arrange physical instruction blocks for a nearby robot, then observe how sequence, repetition, conditions, and sensing change what it does. Teachers can host a class on a trusted local network without student cloud accounts and can shape activities with Guides, boards, checkpoints, lesson plans, chemistry tools, and local progress records.

The Community game is free and open source. OpenClassCraft is preparing a small Founding School Beta in Kerala for Grades 5–8, with English software and English/Malayalam teacher material.

## Boilerplate

OpenClassCraft is an independent educational game project created in India by Sivadarsh P Dinesh. It combines a customised Luanti-derived engine, an educational game layer derived from Minetest Game, original classroom and programming tools, a visual Creator prototype, and a separate offline-first Teacher Console. The project is in early preview: public alpha and controlled school-beta packages are released only after their separate quality and safety gates pass.

OpenClassCraft is not affiliated with, endorsed by, or approved by KITE, Little KITEs, the Government of Kerala, Mojang, Microsoft, or Minecraft Education.

## Key facts

| Item | Fact |
| --- | --- |
| Project | OpenClassCraft |
| Founder | Sivadarsh P Dinesh |
| Country | India |
| Initial school market | Kerala |
| Learners | Grades 5–8 |
| Genre | Educational voxel sandbox / programming puzzle |
| Core loop | Build instructions → predict → run robot → observe → debug |
| Initial public platform being validated | Fedora 44 x64; Windows and Ubuntu are deferred compatibility targets |
| Classroom model | Offline-first, teacher-hosted trusted LAN |
| Student cloud accounts | Not required for the current classroom flow |
| Community game price | Free and open source |
| School offer | Per-campus onboarding, console, training, curriculum operations, and support |
| Current release description | Early Community preview / Founding School Beta preparation |
| Repository | <https://github.com/OpenClassCraft/OpenClassCraft> |

## What is implemented now

- World-based programming blocks for movement, turning, bounded repetition, conditions, sensing, waiting, placing, digging, variables, and stopping
- A persistent programmable robot
- Guides, boards, lesson planning, checkpoint flags, and a chemistry activity
- Singleplayer and teacher-hosted local multiplayer with LAN discovery plus manual-address fallback
- Accessibility switches for font, scale, form contrast, selection colour, simplified HUD, and screen-reader-labelled helper text
- A separate Blockly/Electron Creator for custom blocks, models, animations, and behavior
- A separate local Teacher Console for lessons, groups, assignments, manual progress, CSV reports, JSON backups, and an optional loopback lesson bridge

Do not describe every item as production-ready. Permissions, experimental robot branches, destructive-tool recovery, Creator generation, storage encryption, packaging, and classroom-scale validation remain active work.

## Approved message pillars

1. **Code becomes observable.** Students can point to the sequence, watch its result, and change it together.
2. **The lesson can stay local.** A teacher hosts on the school LAN; the current flow does not require a student cloud account.
3. **The open game remains free.** Schools pay for a dependable rollout and support, not a student paywall.
4. **India-first classroom feedback.** The founding cohort starts with Grades 5–8 schools in Kerala and bilingual teacher material.
5. **Preview means preview.** The project publishes limitations and readiness gates instead of presenting a prototype as a finished school system.

## Claims not to make yet

Do not say OpenClassCraft is:

- “officially approved”, “KITE approved”, “government partnered”, or “used across Kerala”;
- a released production School Edition;
- compliant or certified against a privacy, accessibility, curriculum, or security standard;
- safe for identifiable student records;
- a hardened teacher/student permission system;
- compatible with every school computer or a 30-device class;
- a replacement for a complete computer-science curriculum; or
- proven to improve learning outcomes without a properly designed study.

## Founder quote guidance

No founder or teacher quotation is pre-approved in this kit. Do not invent one. Draft quotes in the speaker’s natural voice, then obtain their written approval for the exact words, attribution, image, context, and publication channel.

## Visual assets

| Asset | Repository path | Correct use |
| --- | --- | --- |
| Square project art | `games/luanti_edu/menu/icon.png` | Project tile or social avatar |
| Wide voxel school artwork | `games/luanti_edu/menu/background.png` | Hero or illustrative background; do not label it as a gameplay screenshot |
| Current in-game screenshot | `games/luanti_edu/screenshot.png` | Development reference; replace with a deliberate current-build capture for media use |

Before distributing an asset, preserve applicable attribution and share-alike requirements from `games/luanti_edu/LICENSE.txt` and any asset-specific notice. The project contains mixed licences; do not assume the repository-wide copyright line is enough.

Still required before active press outreach:

- three current-build, 1920×1080 gameplay screenshots showing the robot sequence, a teacher-hosted class, and one lesson/chemistry activity;
- a 30–45 second uncut gameplay clip showing build → run → debug;
- a transparent, owner-approved wordmark; and
- one school-approved teacher testimonial or an anonymised pilot case study.

## Public-alpha announcement draft

Use only after Gate A in `RELEASE_CHECKLIST.md` passes and the actual release page is live.

> OpenClassCraft `v0.1.0-alpha.1` is now available as an early Windows Community alpha. It lets students build a visible program in a voxel world, run it through a robot, and debug the result—alone or on a trusted classroom LAN. The core game is free and open source. This is not a finished school release: read the limitations, verify the download checksum, back up worlds, and use aliases rather than student records. We are also inviting a small number of Kerala schools to apply for the controlled Founding School Beta.

Attach one real gameplay screenshot and link directly to the release, release checklist/limitations, quickstart, and pilot application. Never link an unverified Actions artifact as the public download.

## Interview prompts

- Why make programming instructions physical inside a 3D world?
- What did classroom constraints change about the design?
- Why keep the Community game free and charge per campus for implementation?
- What still needs to be proven in the founding beta?
- How will school feedback change the April 2027 production decision?

## Contact route

Until an owner-controlled business email and private enquiry form are configured, use the repository’s public Issues route only for non-sensitive enquiries. School applications must not contain personal or student information. Security reports belong in private vulnerability reporting.

- Project: <https://github.com/OpenClassCraft/OpenClassCraft>
- School beta application: <https://github.com/OpenClassCraft/OpenClassCraft/issues/new?template=school_pilot.yaml>
- Private security report: <https://github.com/OpenClassCraft/OpenClassCraft/security/advisories/new>
