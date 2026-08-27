# Teacher quickstart: first OpenClassCraft lesson

Audience: teacher-led Founding School Beta, Grades 5–8 · Session length: 45 minutes

Learning goal: students predict, run, and debug an ordered robot program.

## Before the lesson

Use a school-approved package on a trusted local network. The founding beta uses classroom aliases only. Do not enter real student names or sensitive records in player names, chat, boards, Guides, world names, projects, or the Teacher Console.

You need:

- one teacher computer and at least one tested student computer;
- the same approved OpenClassCraft version on each device;
- a trusted school LAN;
- the teacher’s selected game port plus UDP port `29999` allowed on that LAN;
- a private server password; and
- a disposable or backed-up lesson world.

Keep the manual private LAN address and selected game port available as a fallback. Do not post them in a public issue.

## 1. Create and test the world

1. Open **Start Game → Singleplayer**.
2. Select **New World**, give it a non-personal name such as `Robot Paths 01`, and create it with OpenClassCraft.
3. Select the world and choose **Play Game** once.
4. Open the catalog with <kbd>I</kbd>. Confirm that **Programming** contains Robot Spawner, START, Move Forward, Turn Right, and Stop.
5. Close the world cleanly, then make the school-approved backup.

## 2. Host the class

1. Select the tested world under **Singleplayer**.
2. Enable **Host Server** and **Educator**.
3. Enter the teacher’s classroom alias, selected port, and a private password.
4. Choose **Host Game** and keep the host running.
5. On one student computer, open **Start Game → Local Servers** and choose **Refresh**.
6. Select the teacher’s class, enter a student alias and the password, then choose **Join Server**.
7. If discovery does not find it, enter the teacher computer’s private LAN address and selected game port manually.

LAN discovery uses UDP port `29999`; the game itself uses the port selected by the teacher. Guest-network isolation and host firewalls can block discovery even when manual join works.

## 3. Build the starter program

On clear ground:

1. Take a **Robot Spawner**, **START**, **Move Forward**, **Turn Right**, and **Stop** from the Programming catalog.
2. Use the Robot Spawner on clear ground.
3. Place `START`.
4. Immediately east of START (world `+X`), place `Move Forward`, then `Turn Right`, then `Stop` in one line.
5. Stay within 32 nodes of the robot and right-click START.
6. Observe each robot action.

Keep only the intended robot near a group because START chooses the nearest robot relative to the student who runs it.

## 4. Teach the 45-minute lesson

| Time | Teacher move | Student move |
| --- | --- | --- |
| 0–5 min | Show the goal and controls | Join using aliases and move to the work area |
| 5–10 min | Demonstrate START → MOVE → TURN → STOP | Predict the robot’s final position and direction |
| 10–22 min | Give teams a short target path | Build and run one sequence |
| 22–32 min | Introduce one wrong or missing block | Explain the observed result and change one block |
| 32–40 min | Ask teams to swap a challenge | Run or debug another team’s program |
| 40–45 min | Ask for one explanation and close | Save work, leave the server, share what changed |

Use this discussion pattern:

1. **Predict:** What will the robot do?
2. **Run:** What actually happened?
3. **Locate:** Which instruction caused the difference?
4. **Change:** Change one block only.
5. **Explain:** Why should the next run be different?

## 5. Close safely

1. Ask students to stop editing and leave the server.
2. Save and close the hosted world cleanly.
3. Back up the world to the school-approved location.
4. Record only aggregated progress, such as “three of four teams reached the checkpoint.”
5. Note the app version, affected device role, action, expected result, actual result, and workaround for any issue. Remove usernames, tokens, IP addresses, and private paths before sharing a report.

## Stop and ask for help when

- the world does not save or becomes corrupted;
- a learner can access teacher records or uncontrolled destructive actions;
- private student, school, network, password, or bridge-token information appears unexpectedly;
- the same crash prevents the class from continuing; or
- a package checksum does not match its published file.

Use an offline backup activity while the session is stopped. Security-sensitive software problems belong in the project’s private vulnerability reporting route, not a public issue.

## Current limitations to tell the class

- The Educator switch is not yet a hardened teacher permission boundary.
- `ELSE` and `WHILE Clear` behaviour is experimental; loops and conditions currently act on the next instruction.
- The World Edit Wand is destructive and has no undo.
- LAN discovery can be blocked by the school network; manual join remains the fallback.
- This is beta/alpha software. A workaround or rescheduled session may sometimes be necessary.

More detail: [main README](../../README.md), [pilot playbook](PILOT_PLAYBOOK.md), and [privacy and safety rules](PRIVACY_AND_SAFETY.md).
