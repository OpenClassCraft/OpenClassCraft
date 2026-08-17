# OpenClassCraft Security Policy

## Supported code

Security fixes are developed for the current `Latest` branch and, when practical, the most recent release published at [OpenClassCraft Releases](https://github.com/OpenClassCraft/OpenClassCraft/releases). Older source snapshots and release assets may no longer receive fixes. The repository is an early community preview and does not currently promise a long-term support window.

## Report a vulnerability privately

Do **not** open a public issue for a suspected vulnerability or include an exploit, bridge token, student record, private world, or unredacted configuration in a public discussion.

Use [GitHub private vulnerability reporting for OpenClassCraft](https://github.com/OpenClassCraft/OpenClassCraft/security/advisories/new). Include, when available:

- the affected commit, release, and component;
- operating system and installation source;
- impact and realistic classroom threat scenario;
- minimal reproduction steps or a proof of concept;
- whether the issue crosses a LAN, local-user, world-owner, or student/educator boundary;
- suggested remediation; and
- whether the problem is also reproducible in an unmodified Luanti installation.

Remove unrelated personal information from logs and test data. If sensitive files are essential, begin with a written description and coordinate a safe transfer method through the private advisory.

Maintainers will assess the report, ask for any required detail, coordinate a correction, and agree on disclosure after affected users have a reasonable opportunity to update. No response-time or bounty commitment is currently offered.

## Upstream Luanti vulnerabilities

OpenClassCraft contains a customized Luanti-derived engine. If a vulnerability is reproducible in an unmodified supported Luanti release, follow [Luanti's security policy](https://github.com/luanti-org/luanti/security/policy) as well. That link is for the upstream engine—not for OpenClassCraft's educational game, Creator apps, Teacher Console, packaging, or classroom bridge.

If ownership is unclear, report privately to OpenClassCraft first and state that upstream impact is possible. Do not file the same vulnerability publicly in either project.

## Current security and privacy boundaries

- The Teacher Console stores its database and exported backups as unencrypted JSON in the local user account.
- The optional lesson bridge binds to `127.0.0.1` and requires a generated token, but the token is stored in configuration text. Treat it as a secret.
- Bridge events can include a player name, lesson title, and progress counts. Full Teacher Console records, notes, reports, and backups are not sent by the implemented bridge.
- LAN hosting uses normal Luanti server networking. Use a trusted network, a password, firewall rules, reviewed privileges, and current operating-system updates.
- Educator presentation is not a hardened authorization boundary; classroom tools and the creative catalog need additional role/permission hardening.
- Desktop Creator output is generated Lua. Inspect it and test it in a disposable world before distribution.
- OpenClassCraft has not been certified for a particular education, privacy, accessibility, or security compliance framework.

These disclosures describe the present design; they do not make security defects in those areas out of scope.
