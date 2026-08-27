# Founding School Beta playbook

This playbook keeps a school pilot small enough for one founder to support and structured enough to produce a real product decision. It applies to both the free 90-day founding pilots and the paid eight-week guided beta unless the written agreement says otherwise.

## Pilot outcome

By the end, the school and OpenClassCraft should be able to answer:

1. Can one teacher set up and deliver the starter lesson reliably in this lab?
2. Do students understand the build–run–observe–debug loop?
3. Can local multiplayer, worlds, backups, and progress records be operated safely?
4. What blocks the next lesson or wider rollout?
5. Is the school willing to pay the proposed campus price for continued support and operations?

The pilot is not a feature wishlist, an accreditation study, or permission for an unlimited production rollout.

## Cohort and scope

- One campus
- One teacher champion and one backup staff member where possible
- One Grade 5–8 class or club
- Up to ten student clients for the first technical classroom test; raise this only after the lab proves stable
- Three or four 45-minute sessions
- One starter coding world and one optional chemistry/creative follow-up
- Classroom aliases and aggregated evaluation only

## Stage 1 — qualify the school

Complete a 20-minute call before promising a place.

| Question | Proceed when |
| --- | --- |
| Who can approve beta software? | A named school role can approve in writing |
| Who will lead the lesson? | One teacher can attend onboarding and run three sessions |
| Which learners? | A specific Grade 5–8 cohort or club exists |
| Which lab? | Device/OS count and a trusted LAN are known |
| When? | Three realistic class periods fit in the pilot term |
| Why now? | The school states one measurable learning or teacher goal |
| Can it use aliases? | The school accepts the data-minimisation rules |

Do not accept a pilot solely for logo value. Decline or defer when approval is unclear, the school expects production guarantees, the lab cannot be tested, or sensitive student data is required.

## Stage 2 — 30-minute technical check

Run this at least three working days before the first lesson.

- Record exact Community and School Console versions and checksums.
- Start the game on the teacher machine and two representative student machines.
- Create a disposable world, host it with a password, and test LAN discovery.
- Test manual private-address join as the fallback.
- Confirm the selected game port and discovery UDP port 29999 are allowed only on the trusted LAN.
- Run a short robot sequence from a student device.
- Save, close, reopen, back up, and restore a disposable world.
- If using the Console, test local workspace, backup/restore, CSV export, and wrong-token bridge rejection with aliases.
- Record startup time, join time, frame-rate concerns, crashes, warnings, and workarounds.

Stop and reschedule if the target package fails to start consistently, the network cannot support the agreed class, or a critical privacy/permission problem appears.

## Stage 3 — teacher onboarding

Use [TEACHER_QUICKSTART.en.md](TEACHER_QUICKSTART.en.md) or [TEACHER_QUICKSTART.ml.md](TEACHER_QUICKSTART.ml.md). Keep onboarding to 60 minutes:

1. **10 min — purpose and boundaries:** beta status, aliases, trusted LAN, backups, limitations.
2. **15 min — teacher hosts:** create a world, enable Host Server and Educator, set a password, discover/join.
3. **20 min — teach the starter activity:** build START → MOVE → TURN → STOP, predict, run, debug.
4. **10 min — recover:** backup, restart, manual-address fallback, stop-session rules.
5. **5 min — confirm the plan:** dates, participants, support channel, next check-in.

The teacher rehearses once without students. The pilot does not proceed until the teacher can host, join from another device, run the robot task, and close safely.

## Stage 4 — classroom sessions

### Session 1: sequence and prediction

- Goal: explain that order changes the result.
- Student task: build and run a four-instruction robot path.
- Evidence: teams predict final direction before the run and correct one sequence.

### Session 2: repetition and obstacles

- Goal: replace repeated steps with a loop and reason about clear/blocked space.
- Student task: reach a checkpoint with fewer instruction blocks.
- Evidence: teams explain the loop count and one failed path.

### Session 3: design and explain

- Goal: create, test, and explain a short challenge for another team.
- Student task: build a path or guided mini-world using the supported tools.
- Evidence: peer team completes or debugs it; teacher records aggregated completion.

### Optional Session 4: chemistry connection

- Goal: use a structured recipe and checkpoint to connect digital making with a science discussion.
- Student task: create a supported molecule, beginning with water.
- Evidence: group explains the required atoms and result.

## Every-session run sheet

### Before students enter

- [ ] Approved build/version and known limitations are unchanged.
- [ ] Teacher account, host password, and bridge token are private.
- [ ] World backup completed and restore location known.
- [ ] Student aliases/group names prepared; no real class list imported.
- [ ] Host and two clients passed a join check.
- [ ] Manual join address is available privately to the class as fallback.
- [ ] One offline backup activity is ready if the software must stop.

### During the lesson

- [ ] State the learning goal and make students predict before running.
- [ ] Keep the group on a trusted LAN and supervise editing/destructive tools.
- [ ] Record issue time, affected device role, app version, action, expected result, actual result, and safe workaround.
- [ ] Stop for private-data exposure, data loss, uncontrolled permissions, or repeated blocking crashes.

### After the lesson

- [ ] Save and close the hosted world cleanly.
- [ ] Export only the approved aggregated progress record.
- [ ] Ask the teacher the five-minute feedback questions below.
- [ ] Log founder support time, including preparation and recovery.
- [ ] Back up or delete the disposable session data according to the school plan.

## Five-minute teacher pulse

Use the same questions every session:

1. Did the planned learning activity finish? **Yes / Partly / No**
2. How easy was today’s setup? **1–10**
3. How useful was the activity for the learning goal? **1–10**
4. What consumed the most teacher attention?
5. What single change matters before the next session?

Do not ask for praise. Evidence is more credible when failures and changes are recorded alongside successes.

## Issue and support log

| Date | School alias | Build | Session | Severity | Problem | Workaround | Owner | Next decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  | Critical / Blocking / Major / Minor |  |  |  |  |

Severity rules:

- **Critical:** privacy/security exposure, data loss, unsafe permissions, package compromise.
- **Blocking:** lesson cannot continue and no reasonable offline fallback exists.
- **Major:** key task fails but the session can continue with a workaround.
- **Minor:** confusion, cosmetic problem, or low-impact defect.

Critical issues stop the affected pilot flow. Fix blocking defects before adding unrelated features.

## Closeout and conversion

Run a 30-minute review within seven days of the last session.

- Compare planned and completed sessions.
- Review setup time, support time, critical/blocking issues, and workarounds.
- Ask the teacher for a 1–10 usefulness score and the reason.
- Ask the decision-maker whether the school would pay ₹12,499 for a supported first campus year after readiness gates pass. Record the answer and conditions; do not pressure for an immediate payment.
- Agree on continue, extend, pause, or exit.
- Complete the data/export/removal steps in [PRIVACY_AND_SAFETY.md](PRIVACY_AND_SAFETY.md).

Request a testimonial or case-study interview only after a useful pilot. Give the school the final words, context, attribution, screenshot, and publication channel for written approval. Never publish student faces, names, work, or quotations without the school’s documented process.
