# India Game Awards submission worksheet

Deadline shown in the 2026 application portal: **30 August 2026**. Verify every live field, rule, category name, word limit, and attachment immediately before submitting. This worksheet prepares truthful copy; it does not replace the official rules.

## The release-status answer

If the form asks whether the game has been released, select **No / Upcoming / Unreleased** (use the exact available label).

Why: OpenClassCraft has public source and development previews, but it has not launched a production game or production School Edition. A repository, local build, CI artifact, old tag, demo, or prerelease candidate does not by itself make the planned game “released.” The target production decision is April 2027, subject to classroom, safety, technical, and business gates.

If a free validated public alpha is published before submission, disclose it as an **early public alpha** in the notes while retaining **Upcoming** for the production release—provided the official award rules allow prerelease public builds.

## Core fields

| Form field | Draft answer | Verify before submitting |
| --- | --- | --- |
| Applicant type | Game Developer | Matches the selected role in the portal |
| Game name | OpenClassCraft | Exact capitalisation |
| Developer | Sivadarsh P Dinesh / OpenClassCraft | Use the legal/credited form the applicant owns |
| Publisher | Self-published / OpenClassCraft | Do not name another organisation |
| Country | India | Applicant/entity rule |
| Release status | Upcoming / Unreleased | Official eligibility definition |
| Target release | April 2027 | State “subject to readiness gates” where notes permit |
| Platform | PC — Windows and GNU/Linux | Select only exact portal options |
| Genre | Educational game; voxel sandbox; programming puzzle | Choose the closest allowed taxonomy |
| Business model | Free and open-source Community game; optional per-campus school services | Avoid “free-to-play” if it implies microtransactions |
| Primary audience | Grades 5–8 learners, teachers, coding clubs, and schools | Age/ratings field may need separate review |
| Website | Use the deployed official landing page when live | Until then use the repository URL |
| Store page | None yet | Do not substitute a CI artifact |
| Repository | https://github.com/OpenClassCraft/OpenClassCraft | Public source preview |
| Engine/technology | Customised Luanti-derived C++/Lua engine with original educational game systems | Preserve upstream credit |

## Category choice

The portal allows a maximum of three award categories. Use exact live category names and select only categories whose eligibility text clearly fits. Priority order:

1. **Upcoming Game** or the equivalent unreleased-game category.
2. **Debut Game** only if the rules treat this developer/project as eligible.
3. **Educational / Serious / Impact Game** only if such an official category exists and accepts an upcoming build.

Do not enter a platform, esports, student-team, studio-size, or released-year category merely because it sounds useful. Save a copy of the eligibility text with the submission record.

## 50-word pitch

OpenClassCraft turns programming into a place students can build and explore. Learners arrange instruction blocks inside a bright voxel world, predict the result, run the sequence through a robot, and debug it together. The open-source game is offline-first and designed for teacher-hosted Grades 5–8 classrooms.

## 100-word description

OpenClassCraft is an educational voxel sandbox where programming becomes physical. Students place START, movement, turning, loop, condition, sensor, wait, place, dig, and stop blocks in the world, then run the sequence through a nearby robot. When the result differs from their prediction, the program is visible, shared, and ready to change. Teachers can shape local lessons with Guides, boards, checkpoints, plans, and chemistry activities, and host a class on a trusted LAN without student cloud accounts. The Community game is free and open source; a controlled Kerala school beta will test onboarding, classroom reliability, and teacher operations.

## Longer description

Most beginner coding tools keep the program on one screen and the result on another. OpenClassCraft puts both in the same shared space. A team lays out its instructions as blocks, predicts the robot’s route, runs it, walks around the result, and changes one decision at a time. This makes sequence, repetition, sensing, conditions, and debugging available for discussion—not only for the learner holding the keyboard.

The current game also includes editable Guides and boards, lesson checkpoints, a chemistry activity, creative building, accessibility switches, singleplayer, and teacher-hosted local multiplayer. The classroom flow is offline-first: students can join on a trusted LAN without creating cloud accounts. A separate Teacher Console prototype keeps lesson, group, manual progress, report, and backup workflows on the teacher’s computer.

OpenClassCraft is built from a customised Luanti-derived engine and an educational game layer derived from Minetest Game, with original programming, classroom, Creator, presentation, and operational work. Its Community game remains free and open source. The commercial plan charges schools per campus for a dependable rollout—training, operational tooling, curriculum delivery, and support—rather than charging every student.

The project is an upcoming game in early preview, not a finished school product. Its first structured market is Grades 5–8 in Kerala, with English software and English/Malayalam teacher material. Founding pilots will test the 45-minute lesson, local-network setup, permissions, backup/recovery, teacher usefulness, and support cost before a production release decision.

## Gameplay loop

1. Choose a classroom challenge or target checkpoint.
2. Place a robot and arrange the visible instruction sequence.
3. Predict the final position, direction, or result.
4. Run the sequence and observe each action.
5. Locate the difference between intent and result.
6. Change one block, explain the reason, and run again.
7. Create or exchange a challenge with another team.

## Differentiators

- Code and outcome share one walkable 3D space.
- Debugging is visible and collaborative rather than hidden in an error message.
- The current classroom flow works locally without student cloud accounts.
- Teachers can combine coding with Guides, boards, checkpoints, chemistry, and creative building.
- The core game is open source; the school model funds implementation and support instead of a student paywall.
- The initial pilot is designed around Kerala school constraints and bilingual teacher onboarding.

## Honest current status

Implemented: core robot sequence, bounded loops and conditions, sensing, world lesson tools, chemistry activity, local host/join with LAN discovery, accessibility switches, Creator prototypes, and local Teacher Console workflows.

Still in validation: production packaging, classroom-scale testing, hardened teacher/student permissions, experimental `ELSE`/`WHILE` behaviour, destructive-tool recovery, Creator code generation, encrypted Console storage, starter lesson worlds, automated application tests, and production commercial/legal readiness.

## Team and credit answer

OpenClassCraft was created and is led by **Sivadarsh P Dinesh**. Describe the current project team truthfully as a solo-led project unless additional named contributors have explicitly joined the entry.

The engine is derived from Luanti and the bundled educational game from Minetest Game. Do not present the upstream open-source community as employees or members of the entrant’s studio. Preserve their project names, licences, and contribution credit in the build and supporting material.

## Links and evidence

Use only links that exist and are suitable for judges:

- Repository and detailed feature status: <https://github.com/OpenClassCraft/OpenClassCraft>
- Public releases, when validated: <https://github.com/OpenClassCraft/OpenClassCraft/releases>
- Current project checklist: <https://github.com/OpenClassCraft/OpenClassCraft/blob/Latest/PROJECT_CHECKLIST.md>

Do not upload or link a private School Console build, school workspace, bridge configuration, token, student data, local world with names, or unverified Actions artifact.

## Submission evidence checklist

- [ ] Exact category eligibility saved and checked.
- [ ] Release status agrees across form, website, repository, video, and press copy.
- [ ] A judge can launch the exact submitted build using a one-page instruction.
- [ ] Build checksum and source/third-party notices are included.
- [ ] Three current screenshots show actual gameplay and are labelled accurately.
- [ ] Illustrative voxel artwork is not described as an in-game screenshot.
- [ ] Video shows real interaction and does not promise unimplemented features.
- [ ] No school/student personal information appears in screenshots, worlds, logs, or filenames.
- [ ] Founder/team, engine lineage, and media credits are correct.
- [ ] All claims have been checked against the current build.
- [ ] A copy of the completed submission and uploaded files is retained.
