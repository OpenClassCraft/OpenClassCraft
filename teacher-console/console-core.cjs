"use strict";

const crypto = require("crypto");

const STATE_SCHEMA_VERSION = 4;
const BRIDGE_RESPONSE_VERSION = 4;
const STATE_KIND = "openclasscraft-teacher-console-state";
const ENCRYPTED_STATE_KIND = "openclasscraft-teacher-console-encrypted-state";
const CURRICULUM_PACK_KIND = "openclasscraft-curriculum-pack";

const ROLE_NAMES = ["Student", "Educator", "Observer"];
const ACTIVITY_TYPES = ["Guide", "Dialogue", "Chalkboard", "Flag", "Chemistry", "Robot", "Build", "Quiz"];
const DEFAULT_WORLD_POLICY = Object.freeze({
  studentsCanPlace: false,
  studentsCanDig: false,
  studentsCanUseWorldEditWand: false,
  allowedBlocks: [],
  allowedTools: [],
});

const DEFAULT_STARTER_WORLD_PRESETS = Object.freeze([
  {
    id: "starter-coding-basics",
    templateId: "coding",
    name: "Starter Coding World",
    subject: "Coding",
    worldName: "Coding Basics",
    description: "Program a robot through a marked route with START, MOVE, TURN, and STOP blocks.",
    teacherNotes: "TEACHER_NOTES.md",
    defaultPolicy: {
      studentsCanPlace: true,
      studentsCanDig: false,
      studentsCanUseWorldEditWand: false,
      allowedBlocks: ["luanti_coding:start", "luanti_coding:move_forward", "luanti_coding:turn_left", "luanti_coding:turn_right", "luanti_coding:stop"],
      allowedTools: [],
    },
  },
  {
    id: "starter-chemistry-fundamentals",
    templateId: "chemistry",
    name: "Starter Chemistry Lab",
    subject: "Chemistry",
    worldName: "Chemistry Basics",
    description: "Use the chemistry bench to combine atoms, record observations, and complete a water reaction.",
    teacherNotes: "TEACHER_NOTES.md",
    defaultPolicy: {
      studentsCanPlace: true,
      studentsCanDig: false,
      studentsCanUseWorldEditWand: false,
      allowedBlocks: ["openclasscraft_classroom:chemistry_lab"],
      allowedTools: [],
    },
  },
  {
    id: "starter-science-observations",
    templateId: "science",
    name: "Starter Science World",
    subject: "Science",
    worldName: "Science Essentials",
    description: "Follow an observation trail using a guide, boards, checkpoints, and a controlled build area.",
    teacherNotes: "TEACHER_NOTES.md",
    defaultPolicy: {
      studentsCanPlace: false,
      studentsCanDig: false,
      studentsCanUseWorldEditWand: false,
      allowedBlocks: [],
      allowedTools: [],
    },
  },
  {
    id: "starter-evs-ecology",
    templateId: "evs",
    name: "Starter Environmental Studies",
    subject: "Environmental Studies",
    worldName: "Eco World",
    description: "Compare soil, water, and habitat zones and propose a low-impact environmental improvement.",
    teacherNotes: "TEACHER_NOTES.md",
    defaultPolicy: {
      studentsCanPlace: false,
      studentsCanDig: false,
      studentsCanUseWorldEditWand: false,
      allowedBlocks: [],
      allowedTools: [],
    },
  },
]);

function clone(value) {
  return structuredClone(value);
}

function trim(value, maximum = 1000) {
  return String(value ?? "").trim().slice(0, maximum);
}

function nowIso() {
  return new Date().toISOString();
}

function slug(value) {
  return trim(value, 100).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "item";
}

function makeId(prefix, label = "item") {
  return `${prefix}-${slug(label)}-${crypto.randomBytes(4).toString("hex")}`;
}

function uniqueStrings(values, maximum = 100) {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map((value) => trim(value, 160)).filter(Boolean))].slice(0, maximum);
}

function normaliseRole(value) {
  const role = trim(value, 30).toLowerCase();
  if (role === "teacher" || role === "educator") return "Educator";
  if (role === "observer" || role === "viewer") return "Observer";
  return "Student";
}

function normaliseWorldPolicy(value) {
  return {
    studentsCanPlace: value?.studentsCanPlace === true,
    studentsCanDig: value?.studentsCanDig === true,
    studentsCanUseWorldEditWand: value?.studentsCanUseWorldEditWand === true,
    allowedBlocks: uniqueStrings(value?.allowedBlocks),
    allowedTools: uniqueStrings(value?.allowedTools),
  };
}

function checkpointText(value) {
  return typeof value === "string" ? trim(value, 240) : trim(value?.title || value?.text, 240);
}

function normaliseCheckpoint(value, lessonId, index) {
  const title = checkpointText(value) || `Checkpoint ${index + 1}`;
  return {
    id: trim(value?.id, 100) || `${lessonId}-checkpoint-${index + 1}-${slug(title)}`,
    title,
    kind: trim(value?.kind, 40) || "teacher",
    points: Math.max(0, Math.min(1000, Number(value?.points) || 1)),
  };
}

function normaliseActivity(value) {
  const rawType = trim(value?.type, 40);
  const type = ACTIVITY_TYPES.find((candidate) => candidate.toLowerCase() === rawType.toLowerCase()) || "Build";
  return {
    id: trim(value?.id, 100) || makeId("activity", value?.title || type),
    type,
    title: trim(value?.title, 120) || `${type} activity`,
    instructions: trim(value?.instructions, 1200),
    config: value?.config && typeof value.config === "object" && !Array.isArray(value.config)
      ? JSON.parse(JSON.stringify(value.config))
      : {},
  };
}

function normaliseStage(value, lessonId, checkpoints, index) {
  const validIds = new Set(checkpoints.map((checkpoint) => checkpoint.id));
  const checkpointIds = uniqueStrings(value?.checkpointIds).filter((id) => validIds.has(id));
  return {
    id: trim(value?.id, 100) || `${lessonId}-stage-${index + 1}`,
    title: trim(value?.title, 100) || `Stage ${index + 1}`,
    checkpointIds: checkpointIds.length ? checkpointIds : checkpoints.map((checkpoint) => checkpoint.id),
    policyMode: value?.policyMode === "override" ? "override" : "inherit",
    policy: normaliseWorldPolicy(value?.policy || DEFAULT_WORLD_POLICY),
  };
}

function lessonSnapshot(value) {
  return {
    title: trim(value?.title, 120) || "Untitled lesson",
    subject: trim(value?.subject, 80) || "General",
    status: ["Draft", "Published", "Archived"].includes(value?.status) ? value.status : "Draft",
    objectives: trim(value?.objectives, 1200),
    checkpoints: clone(value?.checkpoints || []),
    activities: clone(value?.activities || []),
    stages: clone(value?.stages || []),
    activeStageId: trim(value?.activeStageId, 100),
  };
}

function normaliseVersion(value, lesson) {
  const snapshot = value?.snapshot && typeof value.snapshot === "object"
    ? value.snapshot
    : lessonSnapshot(lesson);
  return {
    version: Math.max(1, Number(value?.version) || 1),
    createdAt: trim(value?.createdAt, 60) || nowIso(),
    note: trim(value?.note, 240),
    snapshot,
  };
}

function normaliseLesson(value) {
  const id = trim(value?.id, 100) || makeId("lesson", value?.title || "lesson");
  const rawCheckpoints = Array.isArray(value?.checkpoints) ? value.checkpoints : [];
  const checkpoints = rawCheckpoints.map((entry, index) => normaliseCheckpoint(entry, id, index));
  const stages = Array.isArray(value?.stages) && value.stages.length
    ? value.stages.map((stage, index) => normaliseStage(stage, id, checkpoints, index))
    : [normaliseStage({ title: "All students", checkpointIds: checkpoints.map((entry) => entry.id) }, id, checkpoints, 0)];
  const result = {
    id,
    title: trim(value?.title, 120) || "Untitled lesson",
    subject: trim(value?.subject, 80) || "General",
    status: ["Draft", "Published", "Archived"].includes(value?.status) ? value.status : "Draft",
    objectives: trim(value?.objectives, 1200),
    checkpoints,
    activities: Array.isArray(value?.activities) ? value.activities.map(normaliseActivity) : [],
    stages,
    activeStageId: trim(value?.activeStageId, 100) || stages[0]?.id || "",
    revision: Math.max(1, Number(value?.revision) || 1),
    versions: [],
    updatedAt: trim(value?.updatedAt, 60) || nowIso(),
  };
  result.versions = Array.isArray(value?.versions)
    ? value.versions.slice(-25).map((version) => normaliseVersion(version, result))
    : [];
  return result;
}

function normaliseStudent(value) {
  const name = trim(value?.name, 120) || "Student";
  return {
    id: trim(value?.id, 100) || makeId("student", name),
    name,
    username: trim(value?.username, 80) || name.replace(/\s+/g, ""),
    group: trim(value?.group, 100) || "Ungrouped",
    role: normaliseRole(value?.role),
  };
}

function normaliseStarterPreset(value) {
  return {
    id: trim(value?.id, 100) || makeId("world", value?.name || value?.worldName),
    templateId: trim(value?.templateId, 80),
    name: trim(value?.name, 120) || trim(value?.worldName, 120) || "Starter world",
    subject: trim(value?.subject, 80) || "General",
    worldName: trim(value?.worldName, 120) || trim(value?.name, 120) || "Starter world",
    description: trim(value?.description, 600),
    teacherNotes: trim(value?.teacherNotes, 120) || "TEACHER_NOTES.md",
    defaultPolicy: normaliseWorldPolicy(value?.defaultPolicy),
  };
}

function normaliseAssignment(value, presets, lessons) {
  if (!value || typeof value !== "object") return null;
  const presetId = trim(value.worldPresetId, 100);
  const preset = presets.find((item) => item.id === presetId);
  const lesson = lessons.find((item) => item.id === trim(value.lessonId, 100));
  const activeStageId = trim(value.activeStageId, 100) || lesson?.activeStageId || "";
  return {
    id: trim(value.id, 100) || makeId("assignment", `${value.group}-${value.lessonId}`),
    group: trim(value.group, 100) || "Ungrouped",
    lessonId: trim(value.lessonId, 100),
    world: trim(value.world, 120) || preset?.worldName || "",
    worldPresetId: presetId,
    managedWorldPath: trim(value.managedWorldPath, 1000),
    activeStageId,
    policy: normaliseWorldPolicy({ ...(preset?.defaultPolicy || DEFAULT_WORLD_POLICY), ...(value.policy || {}) }),
  };
}

function normaliseProgress(value, students, lessons) {
  const student = students.find((entry) => entry.id === trim(value?.studentId, 100));
  const lesson = lessons.find((entry) => entry.id === trim(value?.lessonId, 100));
  if (!student || !lesson) return null;
  const total = Math.max(0, Math.min(1000, Number(value?.total) || lesson.checkpoints.length));
  const complete = Math.max(0, Math.min(total, Number(value?.complete) || 0));
  const completedCheckpointIds = uniqueStrings(value?.completedCheckpointIds)
    .filter((id) => lesson.checkpoints.some((checkpoint) => checkpoint.id === id));
  return {
    studentId: student.id,
    lessonId: lesson.id,
    complete: Math.max(complete, completedCheckpointIds.length),
    total,
    completedCheckpointIds,
    note: trim(value?.note, 600),
    updatedAt: trim(value?.updatedAt, 60) || nowIso(),
  };
}

function normaliseAudit(value, maximum = 500) {
  if (!Array.isArray(value)) return [];
  return value.filter((entry) => entry && typeof entry === "object").map((entry) => ({
    id: trim(entry.id, 100) || makeId("audit", entry.action),
    at: trim(entry.at, 60) || nowIso(),
    actor: trim(entry.actor, 100) || "Teacher Console",
    action: trim(entry.action, 160) || "Unknown",
    detail: trim(entry.detail, 1000),
  })).slice(0, maximum);
}

function normaliseRubric(value) {
  return {
    id: trim(value?.id, 100) || makeId("rubric", value?.title),
    title: trim(value?.title, 120) || "Untitled rubric",
    lessonId: trim(value?.lessonId, 100),
    criteria: (Array.isArray(value?.criteria) ? value.criteria : []).map((criterion) => ({
      id: trim(criterion?.id, 100) || makeId("criterion", criterion?.title),
      title: trim(criterion?.title, 120) || "Criterion",
      maxPoints: Math.max(1, Math.min(1000, Number(criterion?.maxPoints) || 4)),
      description: trim(criterion?.description, 500),
    })).slice(0, 30),
  };
}

function normaliseSubmission(value) {
  return {
    id: trim(value?.id, 100) || makeId("submission", value?.type),
    studentId: trim(value?.studentId, 100),
    lessonId: trim(value?.lessonId, 100),
    type: trim(value?.type, 60) || "Manual",
    title: trim(value?.title, 160) || "Student submission",
    summary: trim(value?.summary, 1200),
    payload: value?.payload && typeof value.payload === "object" ? JSON.parse(JSON.stringify(value.payload)) : {},
    createdAt: trim(value?.createdAt, 60) || nowIso(),
    status: value?.status === "Reviewed" ? "Reviewed" : "Pending",
    rubricId: trim(value?.rubricId, 100),
    scores: value?.scores && typeof value.scores === "object" ? { ...value.scores } : {},
    feedback: trim(value?.feedback, 1200),
  };
}

function normaliseEvidence(value) {
  return {
    id: trim(value?.id, 100) || makeId("evidence", value?.title),
    studentId: trim(value?.studentId, 100),
    lessonId: trim(value?.lessonId, 100),
    type: trim(value?.type, 60) || "File",
    title: trim(value?.title, 160) || "Evidence",
    note: trim(value?.note, 1200),
    localPath: trim(value?.localPath, 1000),
    originalName: trim(value?.originalName, 255),
    sha256: trim(value?.sha256, 128),
    createdAt: trim(value?.createdAt, 60) || nowIso(),
  };
}

function normaliseChatMessage(value) {
  return {
    id: trim(value?.id, 100) || makeId("chat", value?.playerName),
    assignmentId: trim(value?.assignmentId, 100),
    sessionId: trim(value?.sessionId, 100),
    group: trim(value?.group, 100),
    world: trim(value?.world, 120),
    lessonId: trim(value?.lessonId, 100),
    lessonTitle: trim(value?.lessonTitle, 160),
    studentId: trim(value?.studentId, 100),
    playerName: trim(value?.playerName, 100),
    message: trim(value?.message, 300),
    channel: "class",
    createdAt: trim(value?.createdAt, 60) || nowIso(),
  };
}

function classroomEventTime(value) {
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds > 0) {
    const date = new Date(seconds * 1000);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  return nowIso();
}

function defaultState() {
  const lessons = [
    normaliseLesson({
      id: "water-lab",
      title: "Make Water",
      subject: "Chemistry",
      status: "Published",
      objectives: "Combine elements and record observations.",
      checkpoints: ["Find the Chemistry Lab", "Create water", "Record your result"],
      activities: [{ type: "Chemistry", title: "Water reaction", instructions: "Combine two hydrogen atoms and one oxygen atom." }],
    }),
    normaliseLesson({
      id: "robot-route",
      title: "Robot Route",
      subject: "Coding",
      status: "Draft",
      objectives: "Use sequence and turns to guide a robot to the flag.",
      checkpoints: ["Place a robot", "Build a program", "Reach the flag"],
      activities: [{ type: "Robot", title: "Route challenge", instructions: "Create a program that reaches the finish marker." }],
    }),
  ];
  const students = [
    normaliseStudent({ id: "student-001", name: "Aarav", username: "Aarav", group: "Group A", role: "Student" }),
    normaliseStudent({ id: "student-002", name: "Maya", username: "Maya", group: "Group A", role: "Student" }),
    normaliseStudent({ id: "student-003", name: "Noah", username: "Noah", group: "Group B", role: "Student" }),
  ];
  return {
    schemaVersion: STATE_SCHEMA_VERSION,
    updatedAt: nowIso(),
    schoolName: "My OpenClassCraft Classroom",
    profile: { teacherName: "Teacher", className: "Class 7A" },
    groups: ["Group A", "Group B"],
    assignments: [],
    bridge: { enabled: false, port: 31085, token: "", sessionCode: "", sessionId: "", assignmentId: "", assignmentIndex: -1 },
    lessons,
    students,
    progress: [
      normaliseProgress({ studentId: "student-001", lessonId: "water-lab", complete: 3, total: 3, note: "Completed independently" }, students, lessons),
      normaliseProgress({ studentId: "student-002", lessonId: "water-lab", complete: 2, total: 3, note: "Needs observation note" }, students, lessons),
      normaliseProgress({ studentId: "student-003", lessonId: "robot-route", complete: 1, total: 3, note: "Started program" }, students, lessons),
    ].filter(Boolean),
    starterWorldPresets: DEFAULT_STARTER_WORLD_PRESETS.map((preset) => normaliseStarterPreset(preset)),
    rubrics: [],
    submissions: [],
    portfolios: [],
    presence: [],
    chatMessages: [],
    worldSnapshots: [],
    audit: [],
    unmatchedEvents: [],
    settings: {
      encryptionEnabled: false,
      sync: { enabled: false, folder: "", lastSyncAt: "" },
      updates: { channel: "stable", lastCheckedAt: "" },
      privacy: { crashReports: false, performanceMetrics: false },
    },
  };
}

function normaliseState(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  const fallback = defaultState();
  const presets = Array.isArray(source.starterWorldPresets) && source.starterWorldPresets.length
    ? source.starterWorldPresets.map(normaliseStarterPreset)
    : fallback.starterWorldPresets;
  const lessons = Array.isArray(source.lessons) && source.lessons.length
    ? source.lessons.map(normaliseLesson)
    : fallback.lessons;
  const students = Array.isArray(source.students) && source.students.length
    ? source.students.map(normaliseStudent)
    : fallback.students;
  const assignments = Array.isArray(source.assignments)
    ? source.assignments.map((assignment) => normaliseAssignment(assignment, presets, lessons)).filter(Boolean)
    : [];
  const groups = uniqueStrings(Array.isArray(source.groups) ? source.groups : students.map((student) => student.group));
  const bridgeIndex = Number.isInteger(source.bridge?.assignmentIndex) ? source.bridge.assignmentIndex : -1;
  const legacyAssignment = assignments[bridgeIndex];
  const state = {
    schemaVersion: STATE_SCHEMA_VERSION,
    updatedAt: trim(source.updatedAt, 60) || nowIso(),
    schoolName: trim(source.schoolName, 160) || fallback.schoolName,
    profile: {
      teacherName: trim(source.profile?.teacherName, 120) || fallback.profile.teacherName,
      className: trim(source.profile?.className, 120) || fallback.profile.className,
    },
    groups: groups.length ? groups : ["Ungrouped"],
    assignments,
    bridge: {
      enabled: source.bridge?.enabled === true,
      port: Math.max(1024, Math.min(65535, Number(source.bridge?.port) || 31085)),
      token: trim(source.bridge?.token, 128),
      sessionCode: trim(source.bridge?.sessionCode, 12).toUpperCase(),
      sessionId: trim(source.bridge?.sessionId, 100),
      assignmentId: trim(source.bridge?.assignmentId, 100) || legacyAssignment?.id || "",
      assignmentIndex: bridgeIndex,
    },
    lessons,
    students,
    progress: Array.isArray(source.progress)
      ? source.progress.map((entry) => normaliseProgress(entry, students, lessons)).filter(Boolean)
      : [],
    starterWorldPresets: presets,
    rubrics: Array.isArray(source.rubrics) ? source.rubrics.map(normaliseRubric) : [],
    submissions: Array.isArray(source.submissions) ? source.submissions.map(normaliseSubmission).slice(0, 2000) : [],
    portfolios: Array.isArray(source.portfolios) ? source.portfolios.map(normaliseEvidence).slice(0, 2000) : [],
    presence: Array.isArray(source.presence) ? source.presence.filter(Boolean).map((entry) => ({
      studentId: trim(entry.studentId, 100),
      playerName: trim(entry.playerName, 100),
      status: entry.status === "left" ? "left" : "online",
      lastSeen: trim(entry.lastSeen, 60) || nowIso(),
    })).slice(0, 500) : [],
    chatMessages: Array.isArray(source.chatMessages)
      ? source.chatMessages.map(normaliseChatMessage).filter((entry) => entry.message).slice(0, 5000)
      : [],
    worldSnapshots: Array.isArray(source.worldSnapshots) ? source.worldSnapshots.filter(Boolean).map((entry) => ({
      id: trim(entry.id, 100) || makeId("snapshot", entry.assignmentId),
      assignmentId: trim(entry.assignmentId, 100),
      path: trim(entry.path, 1000),
      createdAt: trim(entry.createdAt, 60) || nowIso(),
      note: trim(entry.note, 300),
    })).slice(0, 500) : [],
    audit: normaliseAudit(source.audit),
    unmatchedEvents: Array.isArray(source.unmatchedEvents) ? source.unmatchedEvents.filter(Boolean).map((entry) => ({
      id: trim(entry.id, 100) || makeId("unmatched", entry.playerName),
      at: trim(entry.at, 60) || nowIso(),
      playerName: trim(entry.playerName, 100),
      lessonTitle: trim(entry.lessonTitle, 160),
      eventType: trim(entry.eventType, 60) || "lesson_progress",
      payload: entry.payload && typeof entry.payload === "object" ? JSON.parse(JSON.stringify(entry.payload)) : {},
    })).slice(0, 500) : [],
    settings: {
      encryptionEnabled: source.settings?.encryptionEnabled === true,
      sync: {
        enabled: source.settings?.sync?.enabled === true,
        folder: trim(source.settings?.sync?.folder, 1000),
        lastSyncAt: trim(source.settings?.sync?.lastSyncAt, 60),
      },
      updates: {
        channel: ["stable", "beta"].includes(source.settings?.updates?.channel) ? source.settings.updates.channel : "stable",
        lastCheckedAt: trim(source.settings?.updates?.lastCheckedAt, 60),
      },
      privacy: {
        crashReports: source.settings?.privacy?.crashReports === true,
        performanceMetrics: source.settings?.privacy?.performanceMetrics === true,
      },
    },
  };
  return state;
}

function computeStateChecksum(state) {
  return crypto.createHash("sha256").update(JSON.stringify(state)).digest("hex");
}

function makeStateEnvelope(state, createdBy = "teacher-console") {
  const payload = normaliseState(state);
  return {
    kind: STATE_KIND,
    schemaVersion: STATE_SCHEMA_VERSION,
    createdBy,
    createdAt: nowIso(),
    checksumAlgorithm: "sha256",
    checksum: computeStateChecksum(payload),
    payload,
  };
}

function makeEncryptedEnvelope(state, passphrase, createdBy = "teacher-console") {
  if (trim(passphrase, 1000).length < 10) {
    const error = new Error("Use an encryption passphrase with at least 10 characters.");
    error.code = "WEAK_PASSPHRASE";
    throw error;
  }
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = crypto.scryptSync(passphrase, salt, 32, { N: 16384, r: 8, p: 1 });
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const plaintext = Buffer.from(JSON.stringify(makeStateEnvelope(state, createdBy)), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return {
    kind: ENCRYPTED_STATE_KIND,
    schemaVersion: STATE_SCHEMA_VERSION,
    createdBy,
    createdAt: nowIso(),
    encryption: "aes-256-gcm",
    kdf: "scrypt",
    kdfParameters: { N: 16384, r: 8, p: 1 },
    salt: salt.toString("base64"),
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
    ciphertext: ciphertext.toString("base64"),
  };
}

function readStateEnvelope(text, passphrase = "") {
  const parsed = typeof text === "string" ? JSON.parse(text) : text;
  if (!parsed || typeof parsed !== "object") throw new Error("Invalid state file format.");
  if (parsed.kind === ENCRYPTED_STATE_KIND) {
    if (!passphrase) {
      const error = new Error("This workspace is encrypted. Enter its passphrase.");
      error.code = "PASSPHRASE_REQUIRED";
      throw error;
    }
    try {
      const parameters = parsed.kdfParameters || {};
      const key = crypto.scryptSync(passphrase, Buffer.from(parsed.salt, "base64"), 32, {
        N: Number(parameters.N) || 16384,
        r: Number(parameters.r) || 8,
        p: Number(parameters.p) || 1,
      });
      const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(parsed.iv, "base64"));
      decipher.setAuthTag(Buffer.from(parsed.authTag, "base64"));
      const plaintext = Buffer.concat([
        decipher.update(Buffer.from(parsed.ciphertext, "base64")),
        decipher.final(),
      ]).toString("utf8");
      return readStateEnvelope(plaintext);
    }
    catch (cause) {
      const error = new Error("The passphrase is incorrect or the encrypted file is damaged.");
      error.code = "INVALID_PASSPHRASE";
      error.cause = cause;
      throw error;
    }
  }
  if (parsed.kind === STATE_KIND && parsed.payload) {
    if (parsed.checksum && computeStateChecksum(parsed.payload) !== parsed.checksum) {
      const error = new Error("State checksum mismatch. The workspace file is corrupted.");
      error.code = "CHECKSUM_MISMATCH";
      throw error;
    }
    return normaliseState(parsed.payload);
  }
  return normaliseState(parsed);
}

function parseCsv(text) {
  const source = String(text).replace(/^\uFEFF/, "");
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (character === '"' && quoted && source[index + 1] === '"') {
      value += '"';
      index += 1;
    }
    else if (character === '"') {
      quoted = !quoted;
    }
    else if (character === "," && !quoted) {
      row.push(value.trim());
      value = "";
    }
    else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && source[index + 1] === "\n") index += 1;
      row.push(value.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      value = "";
    }
    else {
      value += character;
    }
  }
  row.push(value.trim());
  if (row.some(Boolean)) rows.push(row);
  if (quoted) throw new Error("The CSV has an unclosed quoted field.");
  if (rows.length < 2) throw new Error("The CSV needs a header row and at least one student.");
  const headers = rows[0].map((header) => header.toLowerCase());
  const indexFor = (aliases) => headers.findIndex((header) => aliases.includes(header));
  const nameIndex = indexFor(["name", "student", "student name"]);
  const usernameIndex = indexFor(["username", "player", "player name", "game name"]);
  const groupIndex = indexFor(["group", "class", "section"]);
  const roleIndex = indexFor(["role"]);
  if (nameIndex < 0) throw new Error("The CSV must include a Name column.");
  return rows.slice(1).map((cells) => ({
    name: trim(cells[nameIndex], 120),
    username: usernameIndex >= 0 ? trim(cells[usernameIndex], 80) : trim(cells[nameIndex], 80).replace(/\s+/g, ""),
    group: groupIndex >= 0 ? trim(cells[groupIndex], 100) || "Ungrouped" : "Ungrouped",
    role: roleIndex >= 0 ? normaliseRole(cells[roleIndex]) : "Student",
  })).filter((student) => student.name);
}

function csvField(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function createProgressCsv(stateInput) {
  const state = normaliseState(stateInput);
  const lessonNames = new Map(state.lessons.map((lesson) => [lesson.id, lesson.title]));
  const students = new Map(state.students.map((student) => [student.id, student]));
  const rows = [["Student", "Username", "Group", "Lesson", "Completed checkpoints", "Total checkpoints", "Progress", "Teacher note"]];
  for (const entry of state.progress) {
    const student = students.get(entry.studentId);
    rows.push([
      student?.name || "Unknown",
      student?.username || "",
      student?.group || "",
      lessonNames.get(entry.lessonId) || "Unknown",
      entry.complete,
      entry.total,
      `${entry.total ? Math.round((entry.complete / entry.total) * 100) : 0}%`,
      entry.note,
    ]);
  }
  return rows.map((cells) => cells.map(csvField).join(",")).join("\n");
}

function pushAudit(state, action, detail, actor = "Teacher Console") {
  state.audit.unshift({ id: makeId("audit", action), at: nowIso(), actor: trim(actor, 100), action: trim(action, 160), detail: trim(detail, 1000) });
  state.audit = state.audit.slice(0, 500);
}

function findStudentForEvent(state, event) {
  const identifier = trim(event.playerName || event.username, 100).toLowerCase();
  return state.students.find((student) => student.username.toLowerCase() === identifier || student.name.toLowerCase() === identifier);
}

function findLessonForEvent(state, event) {
  return state.lessons.find((lesson) => lesson.id === trim(event.lessonId, 100))
    || state.lessons.find((lesson) => lesson.title.toLowerCase() === trim(event.lessonTitle, 160).toLowerCase());
}

function addUnmatchedEvent(state, event) {
  state.unmatchedEvents.unshift({
    id: makeId("unmatched", event.playerName || event.type),
    at: nowIso(),
    playerName: trim(event.playerName || event.username, 100),
    lessonTitle: trim(event.lessonTitle, 160),
    eventType: trim(event.type, 60),
    payload: JSON.parse(JSON.stringify(event)),
  });
  state.unmatchedEvents = state.unmatchedEvents.slice(0, 500);
  pushAudit(state, "Unmatched classroom event", `${event.playerName || "Unknown player"}: ${event.type || "unknown"}`);
}

function applyClassroomEvent(stateInput, event) {
  const state = normaliseState(stateInput);
  if (!event || typeof event !== "object" || !trim(event.type, 60)) throw new Error("Invalid classroom event.");
  const supported = ["presence", "lesson_progress", "robot_result", "chemistry_result", "build_submission", "chat_message"];
  if (!supported.includes(event.type)) throw new Error("Unsupported classroom event type.");
  const student = findStudentForEvent(state, event);
  if (event.type === "chat_message") {
    const assignment = selectedBridgeAssignment(state);
    const lesson = findLessonForEvent(state, event);
    const assignmentId = trim(event.assignmentId, 100);
    const sessionId = trim(event.sessionId, 100);
    const message = trim(event.message, 300);
    if (!state.bridge.enabled || !assignment || !state.bridge.sessionId) {
      throw new Error("There is no active classroom session for this message.");
    }
    if (assignment.id !== assignmentId || state.bridge.sessionId !== sessionId) {
      throw new Error("This message belongs to a different or expired classroom session.");
    }
    if (!student || student.group !== assignment.group) {
      throw new Error("The message sender is not in the active classroom roster.");
    }
    if (!lesson || lesson.id !== assignment.lessonId) {
      throw new Error("The message lesson does not match the active classroom assignment.");
    }
    if (!message) throw new Error("A classroom message cannot be empty.");
    state.chatMessages.unshift(normaliseChatMessage({
      assignmentId: assignment.id,
      sessionId,
      group: assignment.group,
      world: assignment.world,
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      studentId: student.id,
      playerName: trim(event.playerName, 100) || student.username,
      message,
      createdAt: classroomEventTime(event.at),
    }));
    state.chatMessages = state.chatMessages.slice(0, 5000);
    return { state, matched: true };
  }
  if (event.type === "presence") {
    if (!student) {
      addUnmatchedEvent(state, event);
      return { state, matched: false };
    }
    const current = state.presence.find((entry) => entry.studentId === student.id);
    const update = {
      studentId: student.id,
      playerName: trim(event.playerName, 100) || student.username,
      status: event.status === "left" ? "left" : "online",
      lastSeen: nowIso(),
    };
    const changed = !current || current.status !== update.status;
    if (current) Object.assign(current, update);
    else state.presence.unshift(update);
    if (changed) pushAudit(state, update.status === "online" ? "Student joined" : "Student left", `${student.name} (${update.playerName})`);
    return { state, matched: true };
  }
  const lesson = findLessonForEvent(state, event);
  if (!student || !lesson) {
    addUnmatchedEvent(state, event);
    return { state, matched: false };
  }
  if (event.type === "lesson_progress") {
    const total = Math.max(0, Math.min(1000, Number(event.total) || lesson.checkpoints.length));
    const complete = Math.max(0, Math.min(total, Number(event.complete) || 0));
    let record = state.progress.find((entry) => entry.studentId === student.id && entry.lessonId === lesson.id);
    if (!record) {
      record = normaliseProgress({ studentId: student.id, lessonId: lesson.id, complete: 0, total }, state.students, state.lessons);
      state.progress.push(record);
    }
    record.complete = complete;
    record.total = total;
    record.completedCheckpointIds = lesson.checkpoints.slice(0, complete).map((checkpoint) => checkpoint.id);
    record.updatedAt = nowIso();
    pushAudit(state, "LAN checkpoint", `${student.name}: ${lesson.title} ${complete}/${total}`);
  }
  else {
    const labels = { robot_result: "Robot result", chemistry_result: "Chemistry result", build_submission: "Build submission" };
    state.submissions.unshift(normaliseSubmission({
      studentId: student.id,
      lessonId: lesson.id,
      type: labels[event.type],
      title: trim(event.title, 160) || `${labels[event.type]} · ${lesson.title}`,
      summary: trim(event.summary || event.message, 1200),
      payload: event.result && typeof event.result === "object" ? event.result : event,
    }));
    pushAudit(state, labels[event.type], `${student.name}: ${lesson.title}`);
  }
  return { state, matched: true };
}

function resolveUnmatchedEvent(stateInput, eventId, studentId, lessonId) {
  const state = normaliseState(stateInput);
  const index = state.unmatchedEvents.findIndex((entry) => entry.id === eventId);
  if (index < 0) throw new Error("The unmatched event no longer exists.");
  const event = state.unmatchedEvents[index];
  const student = state.students.find((entry) => entry.id === studentId);
  const lesson = state.lessons.find((entry) => entry.id === lessonId);
  if (!student) throw new Error("Choose a valid student.");
  const payload = { ...event.payload, playerName: student.username || student.name };
  if (event.eventType !== "presence") {
    if (!lesson) throw new Error("Choose a valid lesson.");
    payload.lessonId = lesson.id;
    payload.lessonTitle = lesson.title;
  }
  state.unmatchedEvents.splice(index, 1);
  const result = applyClassroomEvent(state, payload);
  pushAudit(result.state, "Reconciled classroom event", `${student.name}${lesson ? `: ${lesson.title}` : ""}`);
  return result.state;
}

function selectedBridgeAssignment(state) {
  return state.assignments.find((assignment) => assignment.id === state.bridge.assignmentId)
    || state.assignments[state.bridge.assignmentIndex]
    || null;
}

function bridgeLesson(stateInput) {
  const state = normaliseState(stateInput);
  const assignment = selectedBridgeAssignment(state);
  const lesson = assignment && state.lessons.find((entry) => entry.id === assignment.lessonId);
  const preset = assignment && state.starterWorldPresets.find((entry) => entry.id === assignment.worldPresetId);
  const stageId = assignment?.activeStageId || lesson?.activeStageId;
  const stage = lesson?.stages.find((entry) => entry.id === stageId) || lesson?.stages[0];
  const stageCheckpointIds = new Set(stage?.checkpointIds || []);
  const checkpoints = lesson?.checkpoints.filter((checkpoint) => !stage || stageCheckpointIds.has(checkpoint.id)) || [];
  const policy = normaliseWorldPolicy(stage?.policyMode === "override"
    ? { ...DEFAULT_WORLD_POLICY, ...(stage.policy || {}) }
    : { ...DEFAULT_WORLD_POLICY, ...(assignment?.policy || {}) });
  const roster = assignment ? state.students.filter((student) => student.group === assignment.group).map((student) => ({
    id: student.id,
    name: student.name,
    username: student.username,
    role: student.role.toLowerCase(),
  })) : [];
  return {
    version: BRIDGE_RESPONSE_VERSION,
    active: Boolean(state.bridge.enabled && lesson),
    updatedAt: state.updatedAt || nowIso(),
    sessionCode: state.bridge.sessionCode || state.bridge.token.slice(0, 6).toUpperCase(),
    sessionId: state.bridge.sessionId,
    assignment: assignment ? {
      id: assignment.id,
      group: assignment.group,
      world: assignment.world || preset?.worldName || "Starter world",
      worldPresetId: assignment.worldPresetId || null,
      activeStageId: stage?.id || "",
      activeStageTitle: stage?.title || "",
      policy,
    } : null,
    lesson: lesson ? {
      id: lesson.id,
      title: lesson.title,
      goal: lesson.objectives,
      revision: lesson.revision,
      tasks: checkpoints.map((checkpoint) => ({ id: checkpoint.id, kind: checkpoint.kind || "teacher", text: checkpoint.title })),
      activities: lesson.activities,
    } : null,
    roster,
    policy,
  };
}

function dashboardSummary(stateInput) {
  const state = normaliseState(stateInput);
  const complete = state.progress.filter((entry) => entry.total > 0 && entry.complete >= entry.total).length;
  const possible = state.progress.length;
  const reviewed = state.submissions.filter((entry) => entry.status === "Reviewed").length;
  const online = state.presence.filter((entry) => entry.status === "online" && Date.now() - Date.parse(entry.lastSeen) < 120000).length;
  const byGroup = state.groups.map((group) => {
    const studentIds = new Set(state.students.filter((student) => student.group === group).map((student) => student.id));
    const records = state.progress.filter((entry) => studentIds.has(entry.studentId));
    const achieved = records.reduce((sum, entry) => sum + entry.complete, 0);
    const total = records.reduce((sum, entry) => sum + entry.total, 0);
    return { group, students: studentIds.size, percent: total ? Math.round((achieved / total) * 100) : 0 };
  });
  return { complete, possible, reviewed, pending: state.submissions.length - reviewed, online, byGroup };
}

function createCurriculumPack(stateInput, lessonIds = []) {
  const state = normaliseState(stateInput);
  const selected = new Set(lessonIds.length ? lessonIds : state.lessons.map((lesson) => lesson.id));
  const lessons = state.lessons.filter((lesson) => selected.has(lesson.id));
  const includedIds = new Set(lessons.map((lesson) => lesson.id));
  return {
    kind: CURRICULUM_PACK_KIND,
    version: 1,
    createdAt: nowIso(),
    schoolName: state.schoolName,
    lessons,
    rubrics: state.rubrics.filter((rubric) => !rubric.lessonId || includedIds.has(rubric.lessonId)),
  };
}

function readCurriculumPack(value) {
  const parsed = typeof value === "string" ? JSON.parse(value) : value;
  if (!parsed || parsed.kind !== CURRICULUM_PACK_KIND || !Array.isArray(parsed.lessons)) {
    throw new Error("This is not an OpenClassCraft curriculum pack.");
  }
  return {
    lessons: parsed.lessons.map(normaliseLesson),
    rubrics: Array.isArray(parsed.rubrics) ? parsed.rubrics.map(normaliseRubric) : [],
  };
}

function compareVersions(first, second) {
  const a = String(first || "0").split(/[.-]/).map((part) => Number(part) || 0);
  const b = String(second || "0").split(/[.-]/).map((part) => Number(part) || 0);
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    if ((a[index] || 0) > (b[index] || 0)) return 1;
    if ((a[index] || 0) < (b[index] || 0)) return -1;
  }
  return 0;
}

function safeFilename(value, fallback = "openclasscraft") {
  return trim(value, 160).replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/(^[.-]+|[.-]+$)/g, "") || fallback;
}

module.exports = {
  ACTIVITY_TYPES,
  BRIDGE_RESPONSE_VERSION,
  CURRICULUM_PACK_KIND,
  DEFAULT_STARTER_WORLD_PRESETS,
  DEFAULT_WORLD_POLICY,
  ENCRYPTED_STATE_KIND,
  ROLE_NAMES,
  STATE_KIND,
  STATE_SCHEMA_VERSION,
  applyClassroomEvent,
  bridgeLesson,
  checkpointText,
  clone,
  compareVersions,
  computeStateChecksum,
  createCurriculumPack,
  createProgressCsv,
  dashboardSummary,
  defaultState,
  lessonSnapshot,
  makeEncryptedEnvelope,
  makeId,
  makeStateEnvelope,
  normaliseLesson,
  normaliseRole,
  normaliseState,
  normaliseWorldPolicy,
  nowIso,
  parseCsv,
  pushAudit,
  readCurriculumPack,
  readStateEnvelope,
  resolveUnmatchedEvent,
  safeFilename,
  selectedBridgeAssignment,
  slug,
  trim,
};
