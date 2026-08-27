# OpenClassCraft launch operating plan

Status date: **27 August 2026** · Owner: OpenClassCraft project lead · Initial market: Kerala, India · Initial learners: Grades 5–8

This is the decision record for launching OpenClassCraft. It distinguishes a public source repository, a Community alpha, a controlled school beta, and a production School Edition so that publicity never gets ahead of product safety.

## Launch pack

- [Fedora school delivery and offline licensing implementation plan (PDF)](FEDORA_SCHOOL_DELIVERY_AND_LICENSING_PLAN.pdf)
- [School offer and pricing boundaries](SCHOOL_OFFER.md)
- [Release and paid-readiness checklist](RELEASE_CHECKLIST.md)
- [Founding School Beta playbook](PILOT_PLAYBOOK.md)
- [Privacy and classroom-safety rules](PRIVACY_AND_SAFETY.md)
- [English teacher quickstart](TEACHER_QUICKSTART.en.md) and [Malayalam teacher quickstart](TEACHER_QUICKSTART.ml.md)
- [30-day outreach kit](OUTREACH_KIT.md)
- [Press kit](PRESS_KIT.md)
- [India Game Awards submission worksheet](AWARD_SUBMISSION_WORKSHEET.md)

## Product and revenue decision

OpenClassCraft uses an **open-core school-service model**:

- The **Community game remains free and open source**. It includes the voxel world, robot coding, chemistry, lesson tools, singleplayer, and local multiplayer.
- The **Desktop Creator remains a separate developer preview** until its generated code and packaging pass their gates.
- The **School Console is a separately licensed, controlled beta**. Schools pay for onboarding, training, operational tooling, curriculum delivery, and support—not for taking the Community game away from learners.
- There is **no student subscription**. Commercial pricing is per campus and includes all students.
- There are no student cloud accounts, behavioural advertising, or required telemetry in the founding beta.

See [SCHOOL_OFFER.md](SCHOOL_OFFER.md) for the owner-approved offer and price boundaries.

## What “released” means

| State | Meaning | Public wording |
| --- | --- | --- |
| Source preview | Code is visible on GitHub and can be built by developers. | “Early Community preview” |
| Release candidate | A tagged package is being tested against the checklist. | Do not announce a download yet. |
| Community alpha | A validated Community game package is attached to a GitHub Release with checksums and limitations. | “Public alpha” |
| Founding School Beta | Selected schools use a separately supplied School Console under a pilot agreement. | “Controlled school beta” |
| School Edition 1.0 | Paid-readiness, legal, security, support, and pilot gates have all passed. | “Production school release” |

A Git tag by itself is not a release. A local build, Actions artifact, repository source, or school demo is also not a production release.

## Release channels

| Channel | Audience | Distribution | Publication rule |
| --- | --- | --- | --- |
| Community | Students, families, clubs, teachers, contributors | Public GitHub Release | Community game archives and SHA-256 files only |
| Creator preview | Lesson/mod authors and technical testers | CI artifact or explicitly named prerelease | Never imply classroom readiness |
| School Console beta | Selected pilot schools | Controlled owner-provided build | Written pilot terms and privacy briefing required |

The release workflow enforces this boundary. Its default `fedora-alpha` public scope downloads only the Fedora Community RPM and checksum. A later `all-community` scope can add validated Ubuntu and Windows packages. School Console packages require an explicit manual workflow option and are never selected by the public publish job.

## August 2026 launch sprint

The deadline is deliberately a gate, not a promise to ship unsafe software.

| Date | Deliverable | Exit condition |
| --- | --- | --- |
| 26–27 Aug | Freeze public-alpha scope; finish landing page, offer, press copy, quickstarts, and release checklist | No unreviewed feature is added to the candidate |
| 27–28 Aug | Build the Fedora 44 candidate and run automated tests, RPM installation, fresh-world smoke test, first lesson, backup/restore, and two-device LAN test | Every Community alpha blocker is checked |
| 29 Aug | Owner release review | Exact tag, checksums, limitations, licences, and rollback copy approved |
| 29–30 Aug | Publish `v0.1.0-alpha.1` only if the gates pass | Release page contains Community assets only |
| By 30 Aug | Submit India Game Awards entry as an upcoming PC game | Copy and evidence reviewed; no claim of production release |
| 31 Aug | Open Founding School Beta applications | Application route and private follow-up process tested |

If the Fedora gate fails, keep the source preview public, publish the school-beta landing page, record the blocker, and move the alpha date. Do not weaken the checklist to meet the month-end date.

## 90-day adoption sequence

### September 2026 — find the first proof

- Qualify up to three private schools for a free 90-day founding pilot.
- Qualify additional schools for an eight-week guided beta at ₹4,999.
- Run a 30-minute technical check before any teacher workshop.
- Run the 45-minute starter lesson with classroom aliases and backed-up worlds.
- Record setup time, session success, teacher effort, support time, and blockers after every session.

### October–November 2026 — convert learning into evidence

- Complete at least three sessions per active school.
- Fix critical classroom blockers before adding major features.
- Ask for a testimonial only after the school reviews the exact wording and grants permission.
- Produce one anonymised case study showing the lesson, number of sessions, teacher feedback, and what changed.
- Begin an Ubuntu 22.04 compatibility track for authorised KITE evaluations; do not imply KITE approval.

### December 2026–March 2027 — earn paid readiness

- Complete the permissions, encrypted-storage, backup, update, starter-world, and automated-test items in the paid gate.
- Set up the business payment, invoice, tax, contract, support, and privacy processes with qualified Indian legal/accounting review.
- Validate that support remains below two founder hours per school per month.
- Convert willing private pilots to written founding annual agreements only after the paid gate passes.

Target for a production School Edition decision: **April 2027**, subject to the gates below.

## Success gates

The School Edition is not production-ready until all of these are true:

- Three school pilots have completed their agreed programme.
- At least 80% of planned pilot sessions were successfully delivered.
- Teacher usefulness averages at least 8/10 in the closing survey.
- At least two schools give written willingness to pay the proposed campus price.
- Two approved, accurately attributed testimonials or one testimonial plus one case study exist.
- No open critical safety, data-loss, permission, or installation defect remains.
- Support effort averages less than two hours per school per month after onboarding.
- The owner-approved licence, pilot agreement, privacy notice, invoice/tax process, refund/cancellation terms, and support scope are ready.

The detailed technical gates are in [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md).

## Founder dashboard

Update these numbers every Friday. Blank means unknown—not zero.

| Metric | Target | Current |
| --- | ---: | ---: |
| Qualified school conversations | 12 by 30 Sep |  |
| Technical checks completed | 5 by 15 Oct |  |
| Active pilots | 3 by 31 Oct |  |
| Successful sessions / planned sessions | ≥80% |  |
| Median teacher setup time | ≤30 min after onboarding |  |
| Teacher usefulness score | ≥8/10 |  |
| Critical defects open | 0 at paid release |  |
| Founder support hours / school / month | <2 |  |
| Written willingness to pay | ≥2 schools |  |
| Approved evidence assets | 2 |  |

## Founder time and cash limits

This plan assumes 10–15 founder hours per week and a cash ceiling below ₹25,000 before revenue.

| Workstream | Weekly time | Cash ceiling | Notes |
| --- | ---: | ---: | --- |
| Product, QA, packaging | 5–6 h | ₹5,000 | Prefer existing CI and borrowed test devices |
| School conversations and demos | 3–4 h | ₹8,000 | Kerala first; batch travel by district |
| Teacher material and support | 2–3 h | ₹4,000 | Reuse one starter lesson and two languages |
| Legal/accounting/business setup | 1–2 h | ₹6,000 | Spend before taking paid annual contracts |
| Contingency | — | ₹2,000 | Do not use for broad paid ads |

Avoid broad consumer advertising, Steam launch fees, cloud infrastructure, and custom curriculum work until the first pilot evidence exists. The initial growth engine is one good lesson, teacher referrals, a clear public story, and demonstrable classroom reliability.

The ready-to-personalise school, teacher, community, press, and launch messages are in [OUTREACH_KIT.md](OUTREACH_KIT.md).

## Source notes for the Kerala track

- KITE publishes its current GNU/Linux distribution and ICT guidance at <https://kite.kerala.gov.in/KITE/index.php/welcome/downloads> and <https://kite.kerala.gov.in/KITE/index.php/welcome/ict/7>.
- Little KITEs programme information is at <https://littlekites.kite.kerala.gov.in/>.

OpenClassCraft is independent. These references inform compatibility and approval planning; they do not indicate endorsement, procurement, certification, or permission to install the software.
