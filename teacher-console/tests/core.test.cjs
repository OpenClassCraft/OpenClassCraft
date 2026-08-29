"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const core = require("../console-core.cjs");

test("schema v2 data migrates to schema v4 without losing checkpoints", () => {
  const state = core.normaliseState({
    schemaVersion: 2,
    schoolName: "Migration School",
    groups: ["7A"],
    lessons: [{ id: "old", title: "Old lesson", checkpoints: ["One", "Two"] }],
    students: [{ id: "s1", name: "Learner", group: "7A", role: "teacher" }],
    progress: [{ studentId: "s1", lessonId: "old", complete: 1, total: 2 }],
  });
  assert.equal(state.schemaVersion, 4);
  assert.equal(state.lessons[0].checkpoints[0].title, "One");
  assert.equal(state.students[0].role, "Educator");
  assert.equal(state.progress[0].complete, 1);
  assert.equal(state.lessons[0].stages[0].policyMode, "inherit");
  assert.deepEqual(state.chatMessages, []);
});

test("CSV imports Role from the Role column and supports quoted multiline values", () => {
  const students = core.parseCsv('Name,Username,Group,Role\n"Asha Rao",asha,7A,Observer\n"Dev",dev,7B,Educator\n"Mia\nK",mia,7B,Student');
  assert.deepEqual(students[0], { name: "Asha Rao", username: "asha", group: "7A", role: "Observer" });
  assert.equal(students[1].role, "Educator");
  assert.equal(students[2].name, "Mia\nK");
});

test("checksummed workspace detects corruption", () => {
  const envelope = core.makeStateEnvelope(core.defaultState());
  envelope.payload.schoolName = "Changed after checksum";
  assert.throws(() => core.readStateEnvelope(envelope), /checksum mismatch/i);
});

test("encrypted workspace round-trips and rejects a wrong passphrase", () => {
  const state = core.defaultState();
  state.schoolName = "Encrypted School";
  const envelope = core.makeEncryptedEnvelope(state, "a strong classroom passphrase");
  assert.equal(core.readStateEnvelope(envelope, "a strong classroom passphrase").schoolName, "Encrypted School");
  assert.throws(() => core.readStateEnvelope(envelope), (error) => error.code === "PASSPHRASE_REQUIRED");
  assert.throws(() => core.readStateEnvelope(envelope, "wrong passphrase here"), (error) => error.code === "INVALID_PASSPHRASE");
});

test("bridge publishes only the selected group and enforces override stage policy", () => {
  const state = core.defaultState();
  const lesson = state.lessons[0];
  lesson.stages = [{
    id: "locked-stage", title: "Lab stage", checkpointIds: [lesson.checkpoints[1].id], policyMode: "override",
    policy: { studentsCanPlace: true, studentsCanDig: false, studentsCanUseWorldEditWand: false, allowedBlocks: ["default:glass"], allowedTools: [] },
  }];
  const assignment = {
    id: "assignment-a", group: "Group A", lessonId: lesson.id, world: "Lab", worldPresetId: "starter-chemistry-fundamentals",
    activeStageId: "locked-stage", policy: { studentsCanPlace: false, studentsCanDig: false, studentsCanUseWorldEditWand: false, allowedBlocks: [], allowedTools: [] },
  };
  state.assignments = [assignment];
  state.bridge = { enabled: true, port: 31085, token: "abcdef123456", sessionId: "session-a", assignmentId: assignment.id, assignmentIndex: 0 };
  const payload = core.bridgeLesson(state);
  assert.equal(payload.active, true);
  assert.equal(payload.sessionCode, "ABCDEF");
  assert.equal(payload.sessionId, "session-a");
  assert.deepEqual(payload.roster.map((entry) => entry.name), ["Aarav", "Maya"]);
  assert.equal(payload.lesson.tasks.length, 1);
  assert.equal(payload.policy.studentsCanPlace, true);
  assert.deepEqual(payload.policy.allowedBlocks, ["default:glass"]);
});

test("classroom presence, progress, and result events update the right records", () => {
  let state = core.defaultState();
  let result = core.applyClassroomEvent(state, { type: "presence", playerName: "Aarav", status: "online" });
  state = result.state;
  assert.equal(result.matched, true);
  assert.equal(state.presence[0].status, "online");
  const auditLength = state.audit.length;
  state = core.applyClassroomEvent(state, { type: "presence", playerName: "Aarav", status: "online" }).state;
  assert.equal(state.audit.length, auditLength, "presence heartbeat must not flood the audit trail");
  result = core.applyClassroomEvent(state, { type: "lesson_progress", playerName: "Aarav", lessonTitle: "Make Water", complete: 2, total: 3 });
  state = result.state;
  assert.equal(state.progress.find((entry) => entry.studentId === "student-001" && entry.lessonId === "water-lab").complete, 2);
  result = core.applyClassroomEvent(state, { type: "chemistry_result", playerName: "Aarav", lessonTitle: "Make Water", title: "Water", result: { formula: "H2O" } });
  assert.equal(result.state.submissions[0].type, "Chemistry result");
  assert.equal(result.state.submissions[0].payload.formula, "H2O");
});

test("class chat history is saved only for the matching active classroom session", () => {
  const state = core.defaultState();
  const lesson = state.lessons[0];
  const assignment = {
    id: "assignment-chat-a",
    group: "Group A",
    lessonId: lesson.id,
    world: "Chemistry Room A",
    worldPresetId: "starter-chemistry-fundamentals",
    policy: {},
  };
  state.assignments = [assignment];
  state.bridge = {
    enabled: true,
    port: 31085,
    token: "abcdef123456",
    sessionCode: "ABC123",
    sessionId: "session-chat-a",
    assignmentId: assignment.id,
    assignmentIndex: 0,
  };
  const event = {
    type: "chat_message",
    playerName: "Aarav",
    assignmentId: assignment.id,
    sessionId: "session-chat-a",
    lessonId: lesson.id,
    message: "  Our water model uses two hydrogen atoms.  ",
    at: 1700000000,
  };
  const result = core.applyClassroomEvent(state, event);
  assert.equal(result.matched, true);
  assert.equal(result.state.chatMessages.length, 1);
  assert.deepEqual(result.state.chatMessages[0], {
    id: result.state.chatMessages[0].id,
    assignmentId: assignment.id,
    sessionId: "session-chat-a",
    group: "Group A",
    world: "Chemistry Room A",
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    studentId: "student-001",
    playerName: "Aarav",
    message: "Our water model uses two hydrogen atoms.",
    channel: "class",
    createdAt: "2023-11-14T22:13:20.000Z",
  });
  assert.throws(() => core.applyClassroomEvent(state, { ...event, sessionId: "old-session" }), /different or expired/i);
  assert.throws(() => core.applyClassroomEvent(state, { ...event, playerName: "Noah" }), /active classroom roster/i);
  assert.throws(() => core.applyClassroomEvent(state, { ...event, assignmentId: "assignment-other" }), /different or expired/i);
});

test("unmatched events can be reconciled and replayed", () => {
  let state = core.applyClassroomEvent(core.defaultState(), { type: "lesson_progress", playerName: "unknown", lessonTitle: "unknown", complete: 1, total: 2 }).state;
  assert.equal(state.unmatchedEvents.length, 1);
  state = core.resolveUnmatchedEvent(state, state.unmatchedEvents[0].id, "student-001", "water-lab");
  assert.equal(state.unmatchedEvents.length, 0);
  assert.equal(state.progress.find((entry) => entry.studentId === "student-001" && entry.lessonId === "water-lab").complete, 1);
});

test("curriculum packs omit roster and assessment records", () => {
  const pack = core.createCurriculumPack(core.defaultState());
  assert.equal(pack.kind, core.CURRICULUM_PACK_KIND);
  assert.equal("students" in pack, false);
  assert.equal("progress" in pack, false);
  assert.equal(core.readCurriculumPack(pack).lessons.length, 2);
});

test("all four starter templates contain world settings, configuration, and teacher notes", () => {
  const root = path.join(__dirname, "..", "curriculum-packs", "worlds");
  for (const template of ["coding", "chemistry", "science", "evs"]) {
    for (const file of ["world.mt", "starter_config.lua", "TEACHER_NOTES.md"]) {
      assert.equal(fs.existsSync(path.join(root, template, file)), true, `${template}/${file}`);
    }
  }
  assert.equal(fs.existsSync(path.join(root, "_runtime", "openclasscraft_starter", "init.lua")), true);
});

test("semantic version comparison handles patch versions", () => {
  assert.equal(core.compareVersions("0.2.0", "0.1.9"), 1);
  assert.equal(core.compareVersions("0.2.0", "0.2.0"), 0);
  assert.equal(core.compareVersions("0.1.9", "0.2.0"), -1);
});
