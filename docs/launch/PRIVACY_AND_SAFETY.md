# Founding beta privacy and classroom-safety rules

Status: operational pilot rules, not a final legal privacy notice. The school remains responsible for approving its use of beta software and complying with applicable policy and law. Obtain qualified review before production or collection of identifiable student data.

## Founding-beta rule: aliases only

Use a short classroom alias or group name such as `Banyan-2`, not a student’s real name. During the founding beta, do not enter or import:

- full student names;
- personal or parent email addresses or phone numbers;
- dates of birth, home addresses, photos, or government identifiers;
- health, disability, behaviour, safeguarding, or financial information;
- formal grades, disciplinary notes, or protected school records;
- passwords, network credentials, bridge tokens, or private IP/network details in public issues; or
- any information the school has not explicitly approved for this pilot.

If a workflow seems to require one of these fields, stop and use a non-identifying placeholder or group-level record instead.

## Where information lives today

The current game and Teacher Console are offline-first:

- game worlds and player records are stored on the host computer;
- the Teacher Console workspace is stored as a local `teacher-console.json` file;
- messages from rostered players who joined the active classroom session are stored in that workspace and separated by assignment and session;
- reports are exported as CSV to a teacher-selected location;
- backups are exported to a teacher-selected location; and
- the optional lesson bridge binds to `127.0.0.1` and uses a local token.

The Teacher Console supports optional AES-256-GCM encryption for its workspace, backups, and opt-in folder sync. Encryption is not automatic: when it is disabled, the local workspace and any deliberately exported plain backup are readable JSON. Anyone with access to the operating-system account, disk, backup location, passphrase, or unencrypted export may be able to read student records and chat history.

## Minimum school controls

Before the first session:

1. Use a school-approved teacher computer and a password-protected operating-system account.
2. Store the workspace and backup only in an approved location; do not use a personal messaging app or unapproved cloud drive.
3. Limit device login and file access to the teacher and authorised school staff.
4. Use a trusted school LAN, set a game-server password, and avoid public Wi-Fi.
5. Keep the Teacher Console bridge token private. Never paste it into a public issue, screenshot, lesson document, or chat.
6. Back up the disposable pilot world before every session involving editing or destructive tools.
7. Explain to students that aliases are used and that they must not type personal information into chat, boards, Guides, project names, or notes.
8. Tell students and the responsible school staff that joined-session class chat is retained in the Console. Enable workspace encryption and agree on a short retention period before using chat history.

## Data-minimised pilot record

The useful pilot record is intentionally small:

| Record | Allowed example | Avoid |
| --- | --- | --- |
| Participant | `River-3` or `Team River` | Student’s full name |
| Session | Date, grade band, planned/completed count | Attendance sheet with personal identifiers |
| Progress | `3 of 4 checkpoints` | Formal marks or sensitive teacher judgement |
| Class chat | Short lesson discussion using approved aliases | Personal information, safeguarding disclosures, passwords, or unrelated private conversation |
| Feedback | Anonymised observation | Quoted child without school/guardian approval |
| Technical log | App version, device OS, error message | Username, token, full local path, IP address |

The project team should request aggregated counts and anonymised observations by default. World files, Console backups, reports, and debug logs stay with the school unless a specific, minimised diagnostic extract is approved.

## Retention and pilot exit

At pilot kickoff, the school names the person responsible for the workspace and backup. At the end of the pilot:

1. Export any approved aggregated report the school wants to keep.
2. Clear class-message history that the school no longer needs. Remember that rolling recovery files and device backups may retain older copies until they rotate or are removed under school policy.
3. Confirm whether the school is continuing, extending, or leaving.
4. If leaving, remove the School Console package, local workspace, exported backups, bridge configuration, and token from the pilot device according to school policy.
5. Keep only the minimum contract, invoice, support, and anonymised evaluation record the project is legally and operationally required to retain.
6. Record completion of the exit without copying student-level content to the project team.

Deletion of a local file may not remove copies from device backups. The school should follow its normal managed-device and backup process.

## Classroom safety boundaries

- Treat the Educator switch as presentation metadata, not a hardened permission role.
- Use a trusted, supervised cohort. Do not expose the founding beta to an untrusted public server.
- Review server privileges before each session.
- Use a copy of a world for any World Edit Wand activity; the tool has no undo.
- Keep chat, Guide, board, project, and world names free of personal information. Class chat from joined roster members is a retained school record until cleared.
- Stop the session if a learner can access teacher-only records, destructive controls cannot be contained, the world corrupts, or private data appears unexpectedly.

## Incident response

For a suspected privacy, security, or safety problem:

1. Stop the affected session and disconnect the host from the classroom network if needed.
2. Preserve the minimum evidence needed to understand the incident; do not broadly copy student data.
3. Inform the school’s responsible person through its approved channel.
4. Rotate the bridge token and game password if either may be exposed.
5. Report a software vulnerability privately through the project security route, not a public issue.
6. Do not resume until the school and project owner agree on containment and a safe test.

Private software reports: <https://github.com/OpenClassCraft/OpenClassCraft/security/advisories/new>

## Government-school note

Installation on government-managed school systems must follow the applicable school, education-authority, privacy, security, network, procurement, and software procedures in that region. A free OpenClassCraft sponsorship does not provide those approvals and should never be presented as doing so.
