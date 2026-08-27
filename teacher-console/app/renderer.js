"use strict";

const byId = (id) => document.getElementById(id);
const clone = (value) => JSON.parse(JSON.stringify(value));
const trim = (value) => String(value ?? "").trim();

let state = null;
let system = { lanAddresses: [], defaultGamePort: 30000, internetRequired: false };
let currentView = "dashboard";
let editingLessonId = "";
let editingStudentId = "";
let editingAssignmentId = "";
let dirty = false;

const WORLD_PERMISSION_LABELS = {
  studentsCanPlace: "Build",
  studentsCanDig: "Dig",
  studentsCanUseWorldEditWand: "World Edit Wand",
};

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

function id(prefix) {
  const suffix = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${suffix}`;
}

function nowIso() { return new Date().toISOString(); }
function lessonById(value) { return state.lessons.find((lesson) => lesson.id === value); }
function studentById(value) { return state.students.find((student) => student.id === value); }
function assignmentById(value) { return state.assignments.find((assignment) => assignment.id === value); }
function presetById(value) { return state.starterWorldPresets.find((preset) => preset.id === value); }
function rubricById(value) { return state.rubrics.find((rubric) => rubric.id === value); }
function progressPercent(entry) { return entry.total ? Math.round((entry.complete / entry.total) * 100) : 0; }
function pathName(value) { return trim(value).split(/[\\/]/).filter(Boolean).pop() || "Not installed"; }

function normaliseClientState() {
  state.schemaVersion = 3;
  state.updatedAt ||= nowIso();
  state.profile = { teacherName: "Teacher", className: "Class", ...(state.profile || {}) };
  for (const key of ["groups", "assignments", "lessons", "students", "progress", "starterWorldPresets", "rubrics", "submissions", "portfolios", "presence", "worldSnapshots", "audit", "unmatchedEvents"]) {
    state[key] = Array.isArray(state[key]) ? state[key] : [];
  }
  state.bridge = { enabled: false, port: 31085, token: "", sessionCode: "", assignmentId: "", assignmentIndex: -1, ...(state.bridge || {}) };
  state.settings = state.settings || {};
  state.settings.encryptionEnabled = state.settings.encryptionEnabled === true;
  state.settings.sync = { enabled: false, folder: "", lastSyncAt: "", ...(state.settings.sync || {}) };
  state.settings.updates = { channel: "stable", lastCheckedAt: "", ...(state.settings.updates || {}) };
  state.settings.privacy = { crashReports: false, performanceMetrics: false, ...(state.settings.privacy || {}) };
}

function audit(action, detail) {
  state.audit.unshift({ id: id("audit"), at: nowIso(), actor: state.profile.teacherName || "Teacher Console", action, detail: trim(detail) });
  state.audit = state.audit.slice(0, 500);
}

function setDirty(message = "Unsaved changes") {
  dirty = true;
  byId("saveState").textContent = message;
}

function toast(message, tone = "success") {
  const element = document.createElement("div");
  element.className = `toast ${tone}`;
  element.textContent = message;
  byId("toastRegion").append(element);
  window.setTimeout(() => element.classList.add("show"), 20);
  window.setTimeout(() => {
    element.classList.remove("show");
    window.setTimeout(() => element.remove(), 250);
  }, 4200);
}

function action(label, actionName, identifier = "", tone = "secondary", disabled = false) {
  return `<button class="button compact ${tone}" data-action="${escapeAttribute(actionName)}"${identifier ? ` data-id="${escapeAttribute(identifier)}"` : ""}${disabled ? " disabled" : ""}>${escapeHtml(label)}</button>`;
}

function emptyState(title, text) {
  return `<div class="empty"><strong>${escapeHtml(title)}</strong><p>${escapeHtml(text)}</p></div>`;
}

function statusChip(label, tone = "neutral") {
  return `<span class="status ${tone}">${escapeHtml(label)}</span>`;
}

function policySummary(policy) {
  const active = Object.entries(WORLD_PERMISSION_LABELS).filter(([key]) => policy?.[key]).map(([, label]) => label);
  const restrictions = [];
  if (policy?.allowedBlocks?.length) restrictions.push(`${policy.allowedBlocks.length} block IDs`);
  if (policy?.allowedTools?.length) restrictions.push(`${policy.allowedTools.length} tool IDs`);
  return [...active, ...restrictions].join(" · ") || "Read-only for students";
}

function selectedAssignment() {
  return state.assignments.find((assignment) => assignment.id === state.bridge.assignmentId)
    || state.assignments[state.bridge.assignmentIndex]
    || null;
}

function livePresence() {
  const threshold = Date.now() - 120000;
  return state.presence.filter((entry) => entry.status === "online" && Date.parse(entry.lastSeen) >= threshold);
}

function dashboardSummary() {
  const complete = state.progress.filter((entry) => entry.total > 0 && entry.complete >= entry.total).length;
  const pending = state.submissions.filter((entry) => entry.status !== "Reviewed").length;
  return { complete, pending, online: livePresence().length };
}

function renderDashboard() {
  const summary = dashboardSummary();
  const notices = [];
  if (!state.assignments.length) notices.push(["Create a classroom assignment", "Connect a group, lesson, and starter world before the first session.", "classroom"]);
  if (state.unmatchedEvents.length) notices.push([`${state.unmatchedEvents.length} unmatched classroom event${state.unmatchedEvents.length === 1 ? "" : "s"}`, "Reconcile game usernames so evidence and progress reach the correct student.", "operations"]);
  if (summary.pending) notices.push([`${summary.pending} submission${summary.pending === 1 ? "" : "s"} awaiting review`, "Use a rubric to score robot, chemistry, and build work.", "assessment"]);
  if (!state.settings.encryptionEnabled) notices.push(["Workspace encryption is off", "Turn it on before storing real student records on a shared computer.", "operations"]);

  const groupRows = state.groups.map((group) => {
    const studentIds = new Set(state.students.filter((student) => student.group === group).map((student) => student.id));
    const records = state.progress.filter((entry) => studentIds.has(entry.studentId));
    const complete = records.reduce((sum, entry) => sum + entry.complete, 0);
    const total = records.reduce((sum, entry) => sum + entry.total, 0);
    const percent = total ? Math.round((complete / total) * 100) : 0;
    return `<tr><td><strong>${escapeHtml(group)}</strong></td><td>${studentIds.size}</td><td><div class="progress-control"><div class="progress-bar"><span style="--progress:${percent}%"></span></div><span>${percent}%</span></div></td></tr>`;
  }).join("");
  const recent = state.audit.slice(0, 6).map((entry) => `<li><span>${escapeHtml(entry.action)}</span><small>${escapeHtml(new Date(entry.at).toLocaleString())}</small></li>`).join("");

  byId("dashboard").innerHTML = `
    <div class="metrics four">
      <article class="metric"><span class="eyebrow">Students</span><strong>${state.students.length}</strong><span>local roster records</span></article>
      <article class="metric"><span class="eyebrow">Live now</span><strong>${summary.online}</strong><span>seen in the last 2 minutes</span></article>
      <article class="metric"><span class="eyebrow">Completed</span><strong>${summary.complete}</strong><span>lesson progress records</span></article>
      <article class="metric"><span class="eyebrow">Needs review</span><strong>${summary.pending}</strong><span>student submissions</span></article>
    </div>
    <div class="dashboard-grid">
      <section class="panel"><div class="panel-heading"><div><span class="eyebrow">Readiness</span><h2>Before your next class</h2></div></div><div class="task-list">${notices.map(([title, text, view]) => `<button data-action="go-view" data-id="${view}"><span><strong>${escapeHtml(title)}</strong><small>${escapeHtml(text)}</small></span><b>→</b></button>`).join("") || `<div class="success-banner">Classroom setup is ready.</div>`}</div></section>
      <section class="panel"><div class="panel-heading"><div><span class="eyebrow">Recent activity</span><h2>Audit trail</h2></div>${action("View all", "go-view", "operations")}</div><ul class="activity-list">${recent || "<li><span>No activity recorded yet.</span></li>"}</ul></section>
    </div>
    <div class="section-heading"><div><h2>Group progress</h2><p>Checkpoint completion across recorded lessons.</p></div>${action("Export PDF", "export-pdf", "", "primary")}</div>
    <div class="table-wrap"><table><thead><tr><th>Group</th><th>Students</th><th>Checkpoint progress</th></tr></thead><tbody>${groupRows || "<tr><td colspan=\"3\">No groups yet.</td></tr>"}</tbody></table></div>`;
}

function assignmentRow(assignment) {
  const lesson = lessonById(assignment.lessonId);
  const preset = presetById(assignment.worldPresetId);
  const activeStage = lesson?.stages?.find((stage) => stage.id === assignment.activeStageId) || lesson?.stages?.[0];
  const selected = selectedAssignment()?.id === assignment.id;
  const installed = Boolean(assignment.managedWorldPath);
  return `<tr>
    <td><strong>${escapeHtml(assignment.group)}</strong>${selected ? `<br>${statusChip("Live bridge", "success")}` : ""}</td>
    <td>${escapeHtml(lesson?.title || "Missing lesson")}<br><small>${escapeHtml(activeStage?.title || "No stage")}</small></td>
    <td>${escapeHtml(preset?.name || assignment.world || "Custom world")}<br><small title="${escapeAttribute(assignment.managedWorldPath)}">${escapeHtml(pathName(assignment.managedWorldPath))}</small></td>
    <td>${escapeHtml(policySummary(assignment.policy))}</td>
    <td><div class="row-actions wrap">${action(selected ? "Selected" : "Use live", "select-bridge", assignment.id, selected ? "quiet" : "secondary", selected)}${action("Stage →", "next-stage", assignment.id)}${action("Edit", "edit-assignment", assignment.id)}${installed ? `${action("Duplicate", "duplicate-world", assignment.id)}${action("Snapshot", "snapshot-world", assignment.id)}${action("Restore", "restore-world", assignment.id)}${action("Reset", "reset-world", assignment.id, "danger")}` : action("Install world", "install-world", assignment.id, "primary")}${action("Remove", "delete-assignment", assignment.id, "danger")}</div></td>
  </tr>`;
}

function renderClassroom() {
  const assignment = selectedAssignment();
  const lesson = assignment && lessonById(assignment.lessonId);
  const joinCode = state.bridge.enabled ? (state.bridge.sessionCode || state.bridge.token.slice(0, 6).toUpperCase()) : "------";
  const addresses = system.lanAddresses.length ? system.lanAddresses.map((address) => `${address}:${system.defaultGamePort}`).join(" · ") : `${system.hostname || "this computer"}:${system.defaultGamePort}`;
  const presenceRows = livePresence().map((entry) => {
    const student = studentById(entry.studentId);
    return `<tr><td><span class="presence-dot"></span><strong>${escapeHtml(student?.name || entry.playerName)}</strong></td><td>${escapeHtml(entry.playerName)}</td><td>${escapeHtml(student?.group || "Unmatched")}</td><td>${escapeHtml(student?.role || "Unknown")}</td><td>${escapeHtml(new Date(entry.lastSeen).toLocaleTimeString())}</td></tr>`;
  }).join("");
  const groupRows = state.groups.map((group) => `<tr><td><strong>${escapeHtml(group)}</strong></td><td>${state.students.filter((student) => student.group === group).length}</td><td><div class="row-actions">${action("Rename", "rename-group", group)}${action("Delete", "delete-group", group, "danger")}</div></td></tr>`).join("");

  byId("classroom").innerHTML = `
    <section class="session-hero ${state.bridge.enabled ? "live" : ""}">
      <div><span class="eyebrow">Student join code</span><strong class="join-code">${escapeHtml(joinCode)}</strong><p>${state.bridge.enabled ? `Students connect to ${escapeHtml(addresses)}, then type <code>/occ_join ${escapeHtml(joinCode)}</code>.` : "Select an assignment and start the local bridge. Internet is not required."}</p></div>
      <div class="session-meta"><span>${statusChip(state.bridge.enabled ? "Bridge active" : "Bridge stopped", state.bridge.enabled ? "success" : "neutral")}</span><strong>${escapeHtml(lesson?.title || "No live lesson")}</strong><span>${escapeHtml(assignment?.group || "No group selected")}</span></div>
      <div class="hero-actions">${action(`Bridge port ${state.bridge.port}`, "change-bridge-port")}${action("Export host config", "export-bridge")}${action(state.bridge.enabled ? "Stop session" : "Start session", "toggle-bridge", "", state.bridge.enabled ? "danger" : "primary")}</div>
    </section>
    <div class="section-heading"><div><h2>Assignments and managed worlds</h2><p>Stage-specific restrictions narrow the base policy while the class works.</p></div><div class="row-actions">${action("Edit profile", "edit-profile")}${action("New group", "add-group")}${action("Assign lesson", "new-assignment", "", "primary")}</div></div>
    <div class="table-wrap"><table><thead><tr><th>Group</th><th>Lesson / stage</th><th>World</th><th>Base policy</th><th>Controls</th></tr></thead><tbody>${state.assignments.map(assignmentRow).join("") || "<tr><td colspan=\"5\">No assignments. Assign a lesson to begin.</td></tr>"}</tbody></table></div>
    <div class="split-panels">
      <section class="panel"><div class="panel-heading"><div><span class="eyebrow">Presence</span><h2>Connected students</h2></div>${statusChip(`${livePresence().length} online`, livePresence().length ? "success" : "neutral")}</div><div class="table-wrap"><table><thead><tr><th>Student</th><th>Game name</th><th>Group</th><th>Role</th><th>Last seen</th></tr></thead><tbody>${presenceRows || "<tr><td colspan=\"5\">No students have joined this session yet.</td></tr>"}</tbody></table></div></section>
      <section class="panel"><div class="panel-heading"><div><span class="eyebrow">Roster structure</span><h2>Groups</h2></div></div><div class="table-wrap"><table><thead><tr><th>Group</th><th>Students</th><th></th></tr></thead><tbody>${groupRows}</tbody></table></div></section>
    </div>`;
}

function lessonCard(lesson) {
  const currentStage = lesson.stages?.find((stage) => stage.id === lesson.activeStageId) || lesson.stages?.[0];
  const tone = lesson.status === "Published" ? "success" : lesson.status === "Archived" ? "neutral" : "warning";
  return `<article class="card lesson-card">
    <div class="card-top"><span class="eyebrow">${escapeHtml(lesson.subject)}</span>${statusChip(lesson.status, tone)}</div>
    <h3>${escapeHtml(lesson.title)}</h3><p>${escapeHtml(lesson.objectives || "No learning objective yet.")}</p>
    <div class="lesson-facts"><span><b>${lesson.checkpoints.length}</b> checkpoints</span><span><b>${lesson.activities?.length || 0}</b> activities</span><span><b>${lesson.stages?.length || 0}</b> stages</span><span><b>v${lesson.revision || 1}</b></span></div>
    <div class="stage-line"><small>Active stage</small><strong>${escapeHtml(currentStage?.title || "All students")}</strong></div>
    <div class="card-footer"><div>${action("Edit", "edit-lesson", lesson.id)}${action("Duplicate", "duplicate-lesson", lesson.id)}${action("Save version", "version-lesson", lesson.id)}</div><div>${action(lesson.status === "Published" ? "Unpublish" : "Publish", "publish-lesson", lesson.id, lesson.status === "Published" ? "secondary" : "primary")}${action("Rollback", "rollback-lesson", lesson.id, "secondary", !lesson.versions?.length)}${action("Delete", "delete-lesson", lesson.id, "danger")}</div></div>
  </article>`;
}

function renderLessons() {
  byId("lessons").innerHTML = `
    <div class="section-heading"><div><h2>Lesson library</h2><p>Version, publish, stage, and share reusable classroom activities.</p></div><div class="row-actions">${action("Import pack", "import-curriculum")}${action("Export pack", "export-curriculum")}${action("New lesson", "new-lesson", "", "primary")}</div></div>
    <div class="cards">${state.lessons.map(lessonCard).join("") || emptyState("No lessons", "Create the first lesson in this classroom.")}</div>`;
}

function renderStudents() {
  const rows = state.students.map((student) => {
    const live = livePresence().some((entry) => entry.studentId === student.id);
    return `<tr><td><input class="student-select" type="checkbox" value="${escapeAttribute(student.id)}" aria-label="Select ${escapeAttribute(student.name)}"></td><td><strong>${escapeHtml(student.name)}</strong></td><td><code>${escapeHtml(student.username)}</code></td><td>${escapeHtml(student.group)}</td><td>${statusChip(student.role, student.role === "Educator" ? "warning" : "neutral")}</td><td>${live ? statusChip("Online", "success") : "Offline"}</td><td><div class="row-actions">${action("Edit", "edit-student", student.id)}${action("Remove", "delete-student", student.id, "danger")}</div></td></tr>`;
  }).join("");
  byId("students").innerHTML = `
    <div class="section-heading"><div><h2>Students and roles</h2><p>Game usernames are used to match progress and submissions from LAN worlds.</p></div><div class="row-actions">${action("Move selected", "bulk-move")}${action("Import CSV", "import-students")}${action("Add student", "new-student", "", "primary")}</div></div>
    <div class="callout"><strong>CSV columns</strong><span><code>Name</code> is required. <code>Username</code>, <code>Group</code>, and <code>Role</code> are optional. Roles import correctly as Student, Observer, or Educator.</span></div>
    <div class="table-wrap"><table><thead><tr><th></th><th>Name</th><th>Game username</th><th>Group</th><th>Role</th><th>Presence</th><th></th></tr></thead><tbody>${rows || "<tr><td colspan=\"7\">No students yet.</td></tr>"}</tbody></table></div>`;
}

function progressRows() {
  return state.progress.map((entry) => {
    const percent = progressPercent(entry);
    return `<tr><td>${escapeHtml(studentById(entry.studentId)?.name || "Unknown")}</td><td>${escapeHtml(lessonById(entry.lessonId)?.title || "Unknown")}</td><td><div class="progress-control">${action("−", "progress-down", `${entry.studentId}|${entry.lessonId}`)}<div class="progress-bar"><span style="--progress:${percent}%"></span></div><span>${entry.complete}/${entry.total}</span>${action("+", "progress-up", `${entry.studentId}|${entry.lessonId}`)}</div></td><td>${escapeHtml(entry.note || "—")}</td><td><div class="row-actions">${action("Note", "progress-note", `${entry.studentId}|${entry.lessonId}`)}${action("Remove", "delete-progress", `${entry.studentId}|${entry.lessonId}`, "danger")}</div></td></tr>`;
  }).join("");
}

function submissionRows() {
  return state.submissions.map((submission) => {
    const rubric = rubricById(submission.rubricId);
    const score = rubric ? rubric.criteria.reduce((sum, criterion) => sum + (Number(submission.scores?.[criterion.id]) || 0), 0) : 0;
    const maximum = rubric ? rubric.criteria.reduce((sum, criterion) => sum + criterion.maxPoints, 0) : 0;
    return `<tr><td>${escapeHtml(studentById(submission.studentId)?.name || "Unmatched")}</td><td>${escapeHtml(lessonById(submission.lessonId)?.title || "Unknown")}</td><td>${escapeHtml(submission.type)}</td><td><strong>${escapeHtml(submission.title)}</strong><br><small>${escapeHtml(submission.summary)}</small></td><td>${submission.status === "Reviewed" ? `${statusChip("Reviewed", "success")}<br><small>${score}/${maximum}</small>` : statusChip("Pending", "warning")}</td><td>${action(submission.status === "Reviewed" ? "Review again" : "Review", "review-submission", submission.id, "primary")}${action("Remove", "delete-submission", submission.id, "danger")}</td></tr>`;
  }).join("");
}

function renderAssessment() {
  const rubricCards = state.rubrics.map((rubric) => `<article class="mini-card"><div><span class="eyebrow">${escapeHtml(lessonById(rubric.lessonId)?.title || "Reusable")}</span><h3>${escapeHtml(rubric.title)}</h3><p>${rubric.criteria.length} criteria · ${rubric.criteria.reduce((sum, item) => sum + item.maxPoints, 0)} points</p></div>${action("Delete", "delete-rubric", rubric.id, "danger")}</article>`).join("");
  byId("assessment").innerHTML = `
    <div class="section-heading"><div><h2>Assessment and reports</h2><p>Game results arrive as reviewable submissions; teacher judgements stay editable.</p></div><div class="row-actions">${action("Export CSV", "export-csv")}${action("Export PDF", "export-pdf")}${action("Add progress", "add-progress")}${action("New rubric", "new-rubric", "", "primary")}</div></div>
    <section class="panel"><div class="panel-heading"><div><span class="eyebrow">Checkpoint records</span><h2>Learning progress</h2></div></div><div class="table-wrap"><table><thead><tr><th>Student</th><th>Lesson</th><th>Progress</th><th>Teacher note</th><th></th></tr></thead><tbody>${progressRows() || "<tr><td colspan=\"5\">No progress records.</td></tr>"}</tbody></table></div></section>
    <div class="section-heading"><div><h2>Rubrics</h2><p>Use the same criteria for manual, robot, chemistry, and build evidence.</p></div></div><div class="mini-grid">${rubricCards || emptyState("No rubrics", "Create a rubric before reviewing student work.")}</div>
    <section class="panel"><div class="panel-heading"><div><span class="eyebrow">Evidence queue</span><h2>Submissions</h2></div>${action("Add manual submission", "add-submission")}</div><div class="table-wrap"><table><thead><tr><th>Student</th><th>Lesson</th><th>Type</th><th>Evidence</th><th>Status</th><th></th></tr></thead><tbody>${submissionRows() || "<tr><td colspan=\"6\">No submissions yet. Game results appear here automatically.</td></tr>"}</tbody></table></div></section>`;
}

function renderPortfolios() {
  const evidenceRows = state.portfolios.map((entry) => `<tr><td>${escapeHtml(studentById(entry.studentId)?.name || "Unknown")}</td><td>${escapeHtml(lessonById(entry.lessonId)?.title || "General")}</td><td>${statusChip(entry.type, "neutral")}</td><td><strong>${escapeHtml(entry.title)}</strong><br><small>${escapeHtml(entry.note || pathName(entry.localPath))}</small></td><td>${escapeHtml(new Date(entry.createdAt).toLocaleString())}</td><td>${action("Note", "evidence-note", entry.id)}${action("Remove record", "delete-evidence", entry.id, "danger")}</td></tr>`).join("");
  const snapshotRows = state.worldSnapshots.map((snapshot) => `<tr><td>${escapeHtml(assignmentById(snapshot.assignmentId)?.world || snapshot.assignmentId)}</td><td>${escapeHtml(snapshot.note || "Classroom snapshot")}</td><td>${escapeHtml(new Date(snapshot.createdAt).toLocaleString())}</td><td><code title="${escapeAttribute(snapshot.path)}">${escapeHtml(pathName(snapshot.path))}</code></td></tr>`).join("");
  byId("portfolios").innerHTML = `
    <div class="section-heading"><div><h2>Student portfolios</h2><p>Attach screenshots, reports, JSON results, and other evidence up to 25 MB.</p></div>${action("Attach evidence", "add-evidence", "", "primary")}</div>
    <div class="callout"><strong>Local evidence</strong><span>Files are copied into the Console data directory and fingerprinted with SHA-256. Removing a record does not silently erase the copied file.</span></div>
    <div class="table-wrap"><table><thead><tr><th>Student</th><th>Lesson</th><th>Type</th><th>Evidence</th><th>Added</th><th></th></tr></thead><tbody>${evidenceRows || "<tr><td colspan=\"6\">No portfolio evidence yet.</td></tr>"}</tbody></table></div>
    <div class="section-heading"><div><h2>World snapshots</h2><p>Recoverable copies created from Console-managed worlds.</p></div></div>
    <div class="table-wrap"><table><thead><tr><th>World</th><th>Note</th><th>Created</th><th>Local copy</th></tr></thead><tbody>${snapshotRows || "<tr><td colspan=\"4\">No world snapshots yet.</td></tr>"}</tbody></table></div>`;
}

function auditRows() {
  return state.audit.slice(0, 200).map((entry) => `<tr><td>${escapeHtml(new Date(entry.at).toLocaleString())}</td><td>${escapeHtml(entry.actor || "Teacher Console")}</td><td><strong>${escapeHtml(entry.action)}</strong></td><td>${escapeHtml(entry.detail)}</td></tr>`).join("");
}

function unmatchedRows() {
  return state.unmatchedEvents.map((entry) => `<tr><td>${escapeHtml(new Date(entry.at).toLocaleString())}</td><td><code>${escapeHtml(entry.playerName || "Unknown")}</code></td><td>${escapeHtml(entry.eventType)}</td><td>${escapeHtml(entry.lessonTitle || "—")}</td><td>${action("Reconcile", "resolve-event", entry.id, "primary")}${action("Dismiss", "dismiss-event", entry.id, "danger")}</td></tr>`).join("");
}

function renderOperations() {
  const encryptionTone = state.settings.encryptionEnabled ? "success" : "warning";
  const syncFolder = state.settings.sync.folder || "No folder selected";
  byId("operations").innerHTML = `
    <div class="operations-grid">
      <section class="panel"><div class="panel-heading"><div><span class="eyebrow">Data protection</span><h2>Encryption and recovery</h2></div>${statusChip(state.settings.encryptionEnabled ? "Encrypted" : "Plain local file", encryptionTone)}</div><p>Atomic saves keep the previous verified file plus ten rolling recovery points.</p><div class="stack-actions">${action(state.settings.encryptionEnabled ? "Turn off encryption" : "Turn on encryption", "toggle-encryption", "", state.settings.encryptionEnabled ? "danger" : "primary")}${action("Encrypted backup", "backup-encrypted")}${action("Plain backup", "backup-plain")}${action("Restore backup", "restore-backup")}</div></section>
      <section class="panel"><div class="panel-heading"><div><span class="eyebrow">Opt-in sync</span><h2>Encrypted sync folder</h2></div>${statusChip(state.settings.sync.enabled ? "Enabled" : "Off", state.settings.sync.enabled ? "success" : "neutral")}</div><p>Use a mounted Nextcloud, Dropbox, Google Drive, network, or USB folder. The Console itself makes no Internet connection.</p><code class="path-display">${escapeHtml(syncFolder)}</code><div class="stack-actions">${action("Choose folder", "choose-sync-folder")}${action("Push encrypted copy", "push-sync", "", "primary", !state.settings.sync.folder)}${action("Pull encrypted copy", "pull-sync", "", "secondary", !state.settings.sync.folder)}</div><small>Last sync: ${escapeHtml(state.settings.sync.lastSyncAt ? new Date(state.settings.sync.lastSyncAt).toLocaleString() : "Never")}</small></section>
      <section class="panel"><div class="panel-heading"><div><span class="eyebrow">Updates</span><h2>Verify release package</h2></div><span>v${escapeHtml(system.version || "0.0.0")}</span></div><p>Checks platform, architecture, SHA-256, and the pinned Ed25519 signature when the owner public key is installed. Packages are never auto-executed.</p><div class="stack-actions">${action("Verify local manifest", "verify-update", "", "primary")}</div><small>Channel: ${escapeHtml(state.settings.updates.channel)} · Last checked: ${escapeHtml(state.settings.updates.lastCheckedAt ? new Date(state.settings.updates.lastCheckedAt).toLocaleString() : "Never")}</small></section>
      <section class="panel"><div class="panel-heading"><div><span class="eyebrow">Privacy</span><h2>Support consent</h2></div></div><label class="check"><input type="checkbox" data-setting="crashReports" ${state.settings.privacy.crashReports ? "checked" : ""}> Keep local crash notes after an error</label><label class="check"><input type="checkbox" data-setting="performanceMetrics" ${state.settings.privacy.performanceMetrics ? "checked" : ""}> Allow local performance measurements</label><p>No reports are uploaded. Export a redacted diagnostic file only when support asks for it.</p>${action("Export diagnostics", "export-diagnostics")}</section>
    </div>
    <div class="callout warning"><strong>Distribution status</strong><span>The Console is still marked UNLICENSED. Choose an owner-approved license before distributing School Edition builds beyond project-owner releases.</span></div>
    <div class="section-heading"><div><h2>Unmatched game events</h2><p>Map an unknown game username to the correct roster record; the original event is then replayed safely.</p></div></div>
    <div class="table-wrap"><table><thead><tr><th>Received</th><th>Game username</th><th>Type</th><th>Lesson</th><th></th></tr></thead><tbody>${unmatchedRows() || "<tr><td colspan=\"5\">No unmatched events.</td></tr>"}</tbody></table></div>
    <div class="section-heading"><div><h2>Audit trail</h2><p>Recent classroom, assessment, recovery, and destructive actions.</p></div></div>
    <div class="table-wrap audit-table"><table><thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Detail</th></tr></thead><tbody>${auditRows() || "<tr><td colspan=\"4\">No actions recorded yet.</td></tr>"}</tbody></table></div>`;
}

function render() {
  renderDashboard();
  renderClassroom();
  renderLessons();
  renderStudents();
  renderAssessment();
  renderPortfolios();
  renderOperations();
  const joinCode = state.bridge.enabled ? (state.bridge.sessionCode || state.bridge.token.slice(0, 6).toUpperCase()) : "Not started";
  byId("sidebarJoinCode").textContent = joinCode;
  byId("sidebarNetwork").textContent = state.bridge.enabled ? `${livePresence().length} online · Internet not required` : "Local and offline by default.";
}

function showView(view) {
  currentView = view;
  document.querySelectorAll(".view").forEach((element) => element.classList.toggle("active", element.id === view));
  document.querySelectorAll(".nav-item").forEach((element) => element.classList.toggle("active", element.dataset.view === view));
  const titles = { dashboard: "Dashboard", classroom: "Classroom", lessons: "Lessons", students: "Students", assessment: "Assessment", portfolios: "Portfolios", operations: "Operations" };
  byId("pageTitle").textContent = titles[view] || view;
  const labels = { dashboard: "New lesson", classroom: "Assign lesson", lessons: "New lesson", students: "New student", assessment: "New rubric", portfolios: "Attach evidence" };
  byId("newButton").hidden = view === "operations";
  byId("newButton").textContent = labels[view] || "New";
}

async function save(options = {}) {
  const response = await window.teacherConsole.saveState(state, options);
  if (response.error) {
    if (response.needsPassphrase && !options.passphrase) {
      const passphrase = prompt("Workspace encryption passphrase (at least 10 characters)");
      if (passphrase) return save({ passphrase });
    }
    toast(response.error, "error");
    return false;
  }
  state = response.state;
  normaliseClientState();
  dirty = false;
  byId("saveState").textContent = `Saved locally at ${new Date().toLocaleTimeString()}`;
  render();
  showView(currentView);
  return true;
}

function lessonSnapshot(lesson) {
  return clone({ title: lesson.title, subject: lesson.subject, status: lesson.status, objectives: lesson.objectives, checkpoints: lesson.checkpoints, activities: lesson.activities || [], stages: lesson.stages || [], activeStageId: lesson.activeStageId || "" });
}

function addLessonVersion(lesson, note) {
  lesson.versions ||= [];
  lesson.versions.push({ version: lesson.revision || 1, createdAt: nowIso(), note, snapshot: lessonSnapshot(lesson) });
  lesson.versions = lesson.versions.slice(-25);
}

function parseActivities(text, existing = []) {
  return text.split("\n").map(trim).filter(Boolean).map((line, index) => {
    const [rawType, rawTitle, ...instructions] = line.split("|").map(trim);
    const types = ["Guide", "Dialogue", "Chalkboard", "Flag", "Chemistry", "Robot", "Build", "Quiz"];
    const type = types.find((candidate) => candidate.toLowerCase() === rawType.toLowerCase()) || "Build";
    const previous = existing.find((entry) => entry.type === type && entry.title === (rawTitle || `${type} activity`)) || existing[index];
    return { id: previous?.id || id("activity"), type, title: rawTitle || `${type} activity`, instructions: instructions.join(" | "), config: previous?.config || {} };
  });
}

function parseStages(text, lessonId, checkpoints, existing = []) {
  const lines = text.split("\n").map(trim).filter(Boolean);
  if (!lines.length) return [{ id: existing[0]?.id || `${lessonId}-stage-1`, title: "All students", checkpointIds: checkpoints.map((checkpoint) => checkpoint.id), policyMode: "inherit", policy: { studentsCanPlace: false, studentsCanDig: false, studentsCanUseWorldEditWand: false, allowedBlocks: [], allowedTools: [] } }];
  return lines.map((line, index) => {
    const [rawTitle, rawNumbers, rawPermissions, rawBlocks, rawTools] = line.split("|").map(trim);
    const numbers = rawNumbers.split(",").map((value) => Number(value.trim())).filter((value) => Number.isInteger(value) && value > 0 && value <= checkpoints.length);
    const permissions = rawPermissions.toLowerCase().split(",").map(trim);
    const inherit = !rawPermissions || permissions.includes("inherit");
    const previous = existing.find((entry) => entry.title === rawTitle) || existing[index];
    return {
      id: previous?.id || `${lessonId}-stage-${index + 1}-${Date.now()}`,
      title: rawTitle || `Stage ${index + 1}`,
      checkpointIds: (numbers.length ? numbers : checkpoints.map((_entry, checkpointIndex) => checkpointIndex + 1)).map((number) => checkpoints[number - 1].id),
      policyMode: inherit ? "inherit" : "override",
      policy: {
        studentsCanPlace: permissions.includes("place"),
        studentsCanDig: permissions.includes("dig"),
        studentsCanUseWorldEditWand: permissions.includes("wand"),
        allowedBlocks: rawBlocks ? rawBlocks.split(",").map(trim).filter(Boolean) : [],
        allowedTools: rawTools ? rawTools.split(",").map(trim).filter(Boolean) : [],
      },
    };
  });
}

function openLessonDialog(lesson = null) {
  editingLessonId = lesson?.id || "";
  byId("lessonDialogTitle").textContent = lesson ? "Edit lesson" : "New lesson";
  byId("lessonTitle").value = lesson?.title || "";
  byId("lessonSubject").value = lesson?.subject || "Coding";
  byId("lessonObjectives").value = lesson?.objectives || "";
  byId("lessonCheckpoints").value = (lesson?.checkpoints || []).map((checkpoint) => typeof checkpoint === "string" ? checkpoint : checkpoint.title).join("\n");
  byId("lessonActivities").value = (lesson?.activities || []).map((activity) => `${activity.type} | ${activity.title} | ${activity.instructions || ""}`).join("\n");
  byId("lessonStages").value = (lesson?.stages || []).map((stage) => {
    const numbers = stage.checkpointIds.map((checkpointId) => (lesson?.checkpoints || []).findIndex((checkpoint) => checkpoint.id === checkpointId) + 1).filter((number) => number > 0).join(",");
    const permissions = stage.policyMode === "override" ? [stage.policy?.studentsCanPlace && "place", stage.policy?.studentsCanDig && "dig", stage.policy?.studentsCanUseWorldEditWand && "wand"].filter(Boolean).join(",") || "none" : "inherit";
    return `${stage.title} | ${numbers} | ${permissions} | ${(stage.policy?.allowedBlocks || []).join(",")} | ${(stage.policy?.allowedTools || []).join(",")}`;
  }).join("\n");
  byId("lessonDialog").showModal();
}

function fillSelect(select, entries, selectedValue = "") {
  select.innerHTML = entries.map(([value, label]) => `<option value="${escapeAttribute(value)}"${value === selectedValue ? " selected" : ""}>${escapeHtml(label)}</option>`).join("");
}

function openStudentDialog(student = null) {
  editingStudentId = student?.id || "";
  byId("studentDialogTitle").textContent = student ? "Edit student" : "Add student";
  byId("studentName").value = student?.name || "";
  byId("studentUsername").value = student?.username || "";
  fillSelect(byId("studentGroup"), state.groups.map((group) => [group, group]), student?.group || state.groups[0]);
  byId("studentRole").value = student?.role || "Student";
  byId("studentDialog").showModal();
}

function openAssignmentDialog(assignment = null) {
  if (!state.groups.length || !state.lessons.length || !state.starterWorldPresets.length) return toast("Add a group, lesson, and starter preset first.", "error");
  editingAssignmentId = assignment?.id || "";
  byId("assignmentDialogTitle").textContent = assignment ? "Edit assignment" : "Assign lesson";
  fillSelect(byId("assignmentGroup"), state.groups.map((group) => [group, group]), assignment?.group || state.groups[0]);
  fillSelect(byId("assignmentLesson"), state.lessons.map((lesson) => [lesson.id, `${lesson.title} · ${lesson.status}`]), assignment?.lessonId || state.lessons[0].id);
  fillSelect(byId("assignmentPreset"), state.starterWorldPresets.map((preset) => [preset.id, `${preset.name} · ${preset.subject}`]), assignment?.worldPresetId || state.starterWorldPresets[0].id);
  const preset = presetById(assignment?.worldPresetId || state.starterWorldPresets[0].id);
  byId("assignmentWorld").value = assignment?.world || preset?.worldName || "";
  const policy = assignment?.policy || preset?.defaultPolicy || {};
  byId("policyPlace").checked = policy.studentsCanPlace === true;
  byId("policyDig").checked = policy.studentsCanDig === true;
  byId("policyWand").checked = policy.studentsCanUseWorldEditWand === true;
  byId("policyBlocks").value = (policy.allowedBlocks || []).join("\n");
  byId("policyTools").value = (policy.allowedTools || []).join("\n");
  byId("assignmentDialog").showModal();
}

function openRubricDialog() {
  if (!state.lessons.length) return toast("Create a lesson first.", "error");
  byId("rubricTitle").value = "";
  byId("rubricCriteria").value = "";
  fillSelect(byId("rubricLesson"), [["", "Reusable for any lesson"], ...state.lessons.map((lesson) => [lesson.id, lesson.title])]);
  byId("rubricDialog").showModal();
}

function findProgress(identifier) {
  const [studentId, lessonId] = identifier.split("|");
  return state.progress.find((entry) => entry.studentId === studentId && entry.lessonId === lessonId);
}

function requirePassphrase(message) {
  const first = prompt(message || "Enter an encryption passphrase (at least 10 characters)");
  if (first === null) return "";
  if (first.length < 10) { toast("Passphrase must contain at least 10 characters.", "error"); return ""; }
  return first;
}

async function exportBackup(encrypted) {
  const passphrase = encrypted ? requirePassphrase("Choose the backup passphrase (at least 10 characters). Keep it somewhere safe; it cannot be recovered.") : "";
  if (encrypted && !passphrase) return;
  const result = await window.teacherConsole.exportBackup(state, { encrypted, passphrase });
  if (result.error) return toast(result.error, "error");
  if (!result.canceled) toast(`${result.encrypted ? "Encrypted backup" : "Backup"} saved to ${result.path}`);
}

async function restoreBackup() {
  if (dirty && !confirm("Restore a backup and replace current unsaved changes?")) return;
  let result = await window.teacherConsole.restoreBackup({});
  if (result.needsPassphrase) {
    const passphrase = requirePassphrase("Enter the backup passphrase.");
    if (!passphrase) return;
    result = await window.teacherConsole.restoreBackup({ reuseSelection: true, passphrase });
  }
  if (result.error) return toast(result.error, "error");
  if (!result.canceled) {
    state = result.state;
    normaliseClientState();
    dirty = false;
    render(); showView(currentView);
    toast("Workspace restored and saved locally.");
  }
}

async function importStudents() {
  const result = await window.teacherConsole.importStudents();
  if (result.error) return toast(result.error, "error");
  if (result.canceled) return;
  let added = 0;
  let updated = 0;
  for (const entry of result.students) {
    if (!state.groups.includes(entry.group)) state.groups.push(entry.group);
    const existing = state.students.find((student) => student.username.toLowerCase() === entry.username.toLowerCase() || student.name.toLowerCase() === entry.name.toLowerCase());
    if (existing) { Object.assign(existing, entry); updated += 1; }
    else { state.students.push({ id: id("student"), ...entry }); added += 1; }
  }
  audit("CSV roster import", `${added} added, ${updated} updated`);
  setDirty(`${added} added · ${updated} updated`);
  render(); showView("students");
  await save();
}

async function handleWorldAction(actionName, assignment) {
  if (!assignment) return;
  if (actionName === "install-world") {
    const response = await window.teacherConsole.installWorld({ assignmentId: assignment.id, presetId: assignment.worldPresetId });
    if (response.error) return toast(response.error, "error");
    assignment.managedWorldPath = response.result.path;
    audit("Starter world installed", `${assignment.world}: ${response.result.path}`);
    setDirty(); await save(); toast(`World installed: ${response.result.path}`);
  }
  if (actionName === "snapshot-world") {
    const note = prompt("Snapshot note", `${assignment.world} before class changes`);
    if (note === null) return;
    const response = await window.teacherConsole.snapshotWorld({ assignmentId: assignment.id, worldPath: assignment.managedWorldPath, note });
    if (response.error) return toast(response.error, "error");
    state.worldSnapshots.unshift(response.result);
    audit("World snapshot created", `${assignment.world}: ${response.result.path}`);
    setDirty(); await save(); toast("Recoverable world snapshot created.");
  }
  if (actionName === "duplicate-world") {
    const group = trim(prompt(`Group for the duplicated assignment:\n${state.groups.join("\n")}`, assignment.group));
    if (!state.groups.includes(group)) return toast("Choose an existing group.", "error");
    const worldName = trim(prompt("Name for the duplicated world", `${assignment.world} Copy`));
    if (!worldName) return;
    const newAssignmentId = id("assignment");
    const response = await window.teacherConsole.duplicateWorld({ sourceAssignmentId: assignment.id, newAssignmentId, worldPath: assignment.managedWorldPath });
    if (response.error) return toast(response.error, "error");
    state.assignments.push({ ...clone(assignment), id: newAssignmentId, group, world: worldName, managedWorldPath: response.result.path });
    audit("Managed world duplicated", `${assignment.world} → ${worldName}`);
    setDirty(); await save(); toast("World and assignment duplicated safely.");
  }
  if (actionName === "reset-world") {
    const confirmation = prompt(`Reset ${assignment.world} to its starter template?\n\nThe current world will be archived, not deleted.\nType this assignment ID to continue:\n${assignment.id}`);
    if (confirmation !== assignment.id) return toast("Reset canceled: confirmation did not match.", "error");
    const response = await window.teacherConsole.resetWorld({ assignmentId: assignment.id, worldPath: assignment.managedWorldPath, confirmation });
    if (response.error) return toast(response.error, "error");
    audit("Managed world reset", `${assignment.world}; previous copy archived at ${response.result.archivedPath}`);
    setDirty(); await save(); toast("Starter world restored; previous world was archived.");
  }
  if (actionName === "restore-world") {
    const snapshots = state.worldSnapshots.filter((snapshot) => snapshot.assignmentId === assignment.id);
    if (!snapshots.length) return toast("Create a snapshot for this assignment first.", "error");
    const choice = prompt(`Choose snapshot number:\n${snapshots.map((snapshot, index) => `${index + 1}. ${new Date(snapshot.createdAt).toLocaleString()} · ${snapshot.note}`).join("\n")}`, "1");
    const snapshot = snapshots[Number(choice) - 1];
    if (!snapshot) return;
    const confirmation = prompt(`Restore this snapshot? The current world will be archived.\nType ${assignment.id} to continue.`);
    if (confirmation !== assignment.id) return toast("Restore canceled: confirmation did not match.", "error");
    const response = await window.teacherConsole.restoreWorldSnapshot({ assignmentId: assignment.id, worldPath: assignment.managedWorldPath, snapshotPath: snapshot.path, confirmation });
    if (response.error) return toast(response.error, "error");
    audit("World snapshot restored", `${assignment.world}; previous copy archived at ${response.result.archivedPath}`);
    setDirty(); await save(); toast("Snapshot restored; previous world was archived.");
  }
}

async function handleAction(actionName, identifier) {
  if (actionName === "go-view") return showView(identifier);
  if (actionName === "new-lesson") return openLessonDialog();
  if (actionName === "edit-lesson") return openLessonDialog(lessonById(identifier));
  if (actionName === "new-student") return openStudentDialog();
  if (actionName === "edit-student") return openStudentDialog(studentById(identifier));
  if (actionName === "new-assignment") return openAssignmentDialog();
  if (actionName === "edit-assignment") return openAssignmentDialog(assignmentById(identifier));
  if (actionName === "new-rubric") return openRubricDialog();
  if (["install-world", "duplicate-world", "snapshot-world", "reset-world", "restore-world"].includes(actionName)) return handleWorldAction(actionName, assignmentById(identifier));

  if (actionName === "publish-lesson") {
    const lesson = lessonById(identifier); if (!lesson) return;
    addLessonVersion(lesson, `Before ${lesson.status === "Published" ? "unpublish" : "publish"}`);
    lesson.status = lesson.status === "Published" ? "Draft" : "Published";
    lesson.revision = (lesson.revision || 1) + 1; lesson.updatedAt = nowIso();
    audit(`${lesson.status} lesson`, lesson.title); setDirty(); render(); showView("lessons"); return save();
  }
  if (actionName === "version-lesson") {
    const lesson = lessonById(identifier); if (!lesson) return;
    const note = prompt("Version note", "Teacher checkpoint"); if (note === null) return;
    addLessonVersion(lesson, note); audit("Lesson version saved", `${lesson.title} v${lesson.revision}`); setDirty(); render(); showView("lessons"); return save();
  }
  if (actionName === "rollback-lesson") {
    const lesson = lessonById(identifier); if (!lesson?.versions?.length) return;
    const choice = prompt(`Choose saved version number:\n${lesson.versions.map((version, index) => `${index + 1}. v${version.version} · ${new Date(version.createdAt).toLocaleString()} · ${version.note || "No note"}`).join("\n")}`, String(lesson.versions.length));
    const version = lesson.versions[Number(choice) - 1]; if (!version) return;
    if (!confirm(`Roll ${lesson.title} back to this saved version? The current version will be preserved.`)) return;
    addLessonVersion(lesson, "Before rollback");
    Object.assign(lesson, clone(version.snapshot)); lesson.revision = (lesson.revision || 1) + 1; lesson.updatedAt = nowIso();
    audit("Lesson rolled back", `${lesson.title} to saved v${version.version}`); setDirty(); render(); showView("lessons"); return save();
  }
  if (actionName === "duplicate-lesson") {
    const source = lessonById(identifier); if (!source) return;
    const duplicate = clone(source); duplicate.id = id("lesson"); duplicate.title = `${source.title} (Copy)`; duplicate.status = "Draft"; duplicate.revision = 1; duplicate.versions = [];
    const checkpointIds = new Map();
    duplicate.checkpoints.forEach((checkpoint, index) => { const oldId = checkpoint.id; checkpoint.id = `${duplicate.id}-checkpoint-${index + 1}`; checkpointIds.set(oldId, checkpoint.id); });
    duplicate.stages.forEach((stage, index) => { stage.id = `${duplicate.id}-stage-${index + 1}`; stage.checkpointIds = stage.checkpointIds.map((checkpointId) => checkpointIds.get(checkpointId)).filter(Boolean); });
    duplicate.activeStageId = duplicate.stages[0]?.id || ""; state.lessons.push(duplicate);
    audit("Lesson duplicated", `${source.title} → ${duplicate.title}`); setDirty(); render(); showView("lessons"); return save();
  }
  if (actionName === "delete-lesson") {
    const lesson = lessonById(identifier); if (!lesson) return;
    if (prompt(`This removes related assignments, progress, rubrics, and submissions.\nType the exact lesson title to continue:\n${lesson.title}`) !== lesson.title) return toast("Lesson deletion canceled.", "error");
    state.lessons = state.lessons.filter((entry) => entry.id !== identifier);
    state.assignments = state.assignments.filter((entry) => entry.lessonId !== identifier);
    state.progress = state.progress.filter((entry) => entry.lessonId !== identifier);
    state.rubrics = state.rubrics.filter((entry) => entry.lessonId !== identifier);
    state.submissions = state.submissions.filter((entry) => entry.lessonId !== identifier);
    audit("Lesson deleted", lesson.title); setDirty(); render(); showView("lessons"); return save();
  }
  if (actionName === "delete-student") {
    const student = studentById(identifier); if (!student) return;
    if (prompt(`Type the game username ${student.username} to remove this roster record. Portfolio files will not be erased.`) !== student.username) return toast("Student removal canceled.", "error");
    state.students = state.students.filter((entry) => entry.id !== identifier);
    state.progress = state.progress.filter((entry) => entry.studentId !== identifier);
    state.submissions = state.submissions.filter((entry) => entry.studentId !== identifier);
    state.presence = state.presence.filter((entry) => entry.studentId !== identifier);
    audit("Student roster record removed", `${student.name} (${student.username})`); setDirty(); render(); showView("students"); return save();
  }
  if (actionName === "import-students") return importStudents();
  if (actionName === "bulk-move") {
    const ids = [...document.querySelectorAll(".student-select:checked")].map((checkbox) => checkbox.value);
    if (!ids.length) return toast("Select at least one student.", "error");
    const group = prompt(`Move selected students to one of these groups:\n${state.groups.join("\n")}`);
    if (!state.groups.includes(trim(group))) return toast("Choose an existing group.", "error");
    state.students.filter((student) => ids.includes(student.id)).forEach((student) => { student.group = trim(group); });
    audit("Bulk group move", `${ids.length} students → ${trim(group)}`); setDirty(); render(); showView("students"); return save();
  }
  if (actionName === "edit-profile") {
    const school = prompt("School name", state.schoolName); if (!trim(school)) return;
    const teacher = prompt("Teacher name", state.profile.teacherName); if (!trim(teacher)) return;
    const className = prompt("Class name", state.profile.className); if (!trim(className)) return;
    state.schoolName = trim(school); state.profile.teacherName = trim(teacher); state.profile.className = trim(className);
    audit("Classroom profile updated", `${state.schoolName} · ${state.profile.className}`); setDirty(); render(); showView("classroom"); return save();
  }
  if (actionName === "add-group") {
    const group = trim(prompt("New group name")); if (!group) return;
    if (state.groups.some((entry) => entry.toLowerCase() === group.toLowerCase())) return toast("That group already exists.", "error");
    state.groups.push(group); audit("Group created", group); setDirty(); render(); showView("classroom"); return save();
  }
  if (actionName === "rename-group") {
    const renamed = trim(prompt("Rename group", identifier)); if (!renamed || renamed === identifier) return;
    if (state.groups.includes(renamed)) return toast("That group already exists.", "error");
    state.groups[state.groups.indexOf(identifier)] = renamed;
    state.students.filter((student) => student.group === identifier).forEach((student) => { student.group = renamed; });
    state.assignments.filter((assignment) => assignment.group === identifier).forEach((assignment) => { assignment.group = renamed; });
    audit("Group renamed", `${identifier} → ${renamed}`); setDirty(); render(); showView("classroom"); return save();
  }
  if (actionName === "delete-group") {
    const affected = state.students.filter((student) => student.group === identifier);
    if (affected.length) return toast(`Move ${affected.length} student${affected.length === 1 ? "" : "s"} before deleting this group.`, "error");
    if (!confirm(`Delete the empty group ${identifier}?`)) return;
    state.groups = state.groups.filter((group) => group !== identifier);
    state.assignments = state.assignments.filter((assignment) => assignment.group !== identifier);
    audit("Empty group deleted", identifier); setDirty(); render(); showView("classroom"); return save();
  }
  if (actionName === "delete-assignment") {
    const assignment = assignmentById(identifier); if (!assignment) return;
    if (prompt(`Remove this assignment? Installed world files are preserved.\nType DELETE to continue.`) !== "DELETE") return;
    state.assignments = state.assignments.filter((entry) => entry.id !== identifier);
    if (state.bridge.assignmentId === identifier) { state.bridge.assignmentId = ""; state.bridge.enabled = false; }
    audit("Classroom assignment removed", `${assignment.group}: ${lessonById(assignment.lessonId)?.title || assignment.lessonId}`); setDirty(); render(); showView("classroom"); return save();
  }
  if (actionName === "select-bridge") {
    state.bridge.assignmentId = identifier; state.bridge.assignmentIndex = state.assignments.findIndex((entry) => entry.id === identifier);
    audit("Live assignment selected", `${assignmentById(identifier)?.group}: ${lessonById(assignmentById(identifier)?.lessonId)?.title}`); setDirty(); render(); showView("classroom"); return save();
  }
  if (actionName === "next-stage") {
    const assignment = assignmentById(identifier); const lesson = assignment && lessonById(assignment.lessonId); if (!lesson?.stages?.length) return;
    const current = lesson.stages.findIndex((stage) => stage.id === assignment.activeStageId);
    const next = lesson.stages[(current + 1) % lesson.stages.length]; assignment.activeStageId = next.id;
    audit("Lesson stage advanced", `${assignment.group}: ${next.title}`); setDirty(); render(); showView("classroom"); return save();
  }
  if (actionName === "toggle-bridge") {
    if (!state.bridge.enabled && !selectedAssignment()) return toast("Select a live assignment first.", "error");
    if (!state.bridge.enabled) {
      const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      const bytes = new Uint8Array(6); globalThis.crypto.getRandomValues(bytes);
      state.bridge.sessionCode = [...bytes].map((value) => alphabet[value % alphabet.length]).join("");
    }
    state.bridge.enabled = !state.bridge.enabled; audit(state.bridge.enabled ? "LAN session started" : "LAN session stopped", selectedAssignment()?.group || "No assignment"); setDirty(); await save(); render(); showView("classroom"); return;
  }
  if (actionName === "change-bridge-port") {
    const value = Number(prompt("Local bridge port (1024–65535)", String(state.bridge.port)));
    if (!Number.isInteger(value) || value < 1024 || value > 65535) return toast("Choose a port from 1024 to 65535.", "error");
    state.bridge.port = value; audit("LAN bridge port changed", String(value)); setDirty(); await save(); render(); showView("classroom"); return;
  }
  if (actionName === "export-bridge") {
    const result = await window.teacherConsole.exportBridgeConfig(state); if (!result.canceled) toast(`Host configuration saved to ${result.path}`); return;
  }
  if (["progress-up", "progress-down"].includes(actionName)) {
    const entry = findProgress(identifier); if (!entry) return;
    entry.complete = Math.max(0, Math.min(entry.total, entry.complete + (actionName === "progress-up" ? 1 : -1))); entry.updatedAt = nowIso();
    audit("Progress adjusted", `${studentById(entry.studentId)?.name}: ${lessonById(entry.lessonId)?.title} ${entry.complete}/${entry.total}`); setDirty(); render(); showView("assessment"); return;
  }
  if (actionName === "progress-note") {
    const entry = findProgress(identifier); if (!entry) return;
    const note = prompt("Teacher note", entry.note || ""); if (note === null) return; entry.note = trim(note); entry.updatedAt = nowIso();
    audit("Progress note updated", `${studentById(entry.studentId)?.name}: ${lessonById(entry.lessonId)?.title}`); setDirty(); render(); showView("assessment"); return;
  }
  if (actionName === "delete-progress") {
    if (!confirm("Remove this progress record?")) return;
    const [studentId, lessonId] = identifier.split("|"); state.progress = state.progress.filter((entry) => entry.studentId !== studentId || entry.lessonId !== lessonId);
    audit("Progress record removed", `${studentById(studentId)?.name}: ${lessonById(lessonId)?.title}`); setDirty(); render(); showView("assessment"); return save();
  }
  if (actionName === "add-progress") {
    const username = trim(prompt(`Student game username:\n${state.students.map((student) => student.username).join("\n")}`)); const student = state.students.find((entry) => entry.username.toLowerCase() === username.toLowerCase()); if (!student) return toast("Choose a listed username.", "error");
    const title = trim(prompt(`Lesson title:\n${state.lessons.map((lesson) => lesson.title).join("\n")}`)); const lesson = state.lessons.find((entry) => entry.title.toLowerCase() === title.toLowerCase()); if (!lesson) return toast("Choose a listed lesson.", "error");
    if (state.progress.some((entry) => entry.studentId === student.id && entry.lessonId === lesson.id)) return toast("That progress record already exists.", "error");
    state.progress.push({ studentId: student.id, lessonId: lesson.id, complete: 0, total: lesson.checkpoints.length, completedCheckpointIds: [], note: "", updatedAt: nowIso() });
    audit("Progress record created", `${student.name}: ${lesson.title}`); setDirty(); render(); showView("assessment"); return save();
  }
  if (actionName === "add-submission") {
    const username = trim(prompt(`Student game username:\n${state.students.map((student) => student.username).join("\n")}`)); const student = state.students.find((entry) => entry.username.toLowerCase() === username.toLowerCase()); if (!student) return toast("Choose a listed username.", "error");
    const title = trim(prompt(`Lesson title:\n${state.lessons.map((lesson) => lesson.title).join("\n")}`)); const lesson = state.lessons.find((entry) => entry.title.toLowerCase() === title.toLowerCase()); if (!lesson) return toast("Choose a listed lesson.", "error");
    const summary = prompt("Describe the submitted work"); if (summary === null) return;
    state.submissions.unshift({ id: id("submission"), studentId: student.id, lessonId: lesson.id, type: "Manual", title: `${lesson.title} submission`, summary: trim(summary), payload: {}, createdAt: nowIso(), status: "Pending", rubricId: "", scores: {}, feedback: "" });
    audit("Manual submission added", `${student.name}: ${lesson.title}`); setDirty(); render(); showView("assessment"); return save();
  }
  if (actionName === "review-submission") {
    const submission = state.submissions.find((entry) => entry.id === identifier); if (!submission) return;
    const available = state.rubrics.filter((rubric) => !rubric.lessonId || rubric.lessonId === submission.lessonId); if (!available.length) return toast("Create a rubric for this lesson first.", "error");
    const choice = prompt(`Choose rubric number:\n${available.map((rubric, index) => `${index + 1}. ${rubric.title}`).join("\n")}`, "1"); const rubric = available[Number(choice) - 1]; if (!rubric) return;
    const scores = {}; for (const criterion of rubric.criteria) { const score = prompt(`${criterion.title} (0–${criterion.maxPoints})`, String(submission.scores?.[criterion.id] ?? "")); if (score === null) return; scores[criterion.id] = Math.max(0, Math.min(criterion.maxPoints, Number(score) || 0)); }
    const feedback = prompt("Student feedback", submission.feedback || ""); if (feedback === null) return;
    Object.assign(submission, { status: "Reviewed", rubricId: rubric.id, scores, feedback: trim(feedback) });
    audit("Submission reviewed", `${studentById(submission.studentId)?.name}: ${submission.title}`); setDirty(); render(); showView("assessment"); return save();
  }
  if (actionName === "delete-submission") {
    if (!confirm("Remove this submission record? Linked portfolio files are preserved.")) return;
    state.submissions = state.submissions.filter((entry) => entry.id !== identifier); audit("Submission record removed", identifier); setDirty(); render(); showView("assessment"); return save();
  }
  if (actionName === "delete-rubric") {
    if (state.submissions.some((entry) => entry.rubricId === identifier)) return toast("This rubric is used by reviewed submissions and cannot be deleted.", "error");
    const rubric = rubricById(identifier); if (!rubric || !confirm(`Delete rubric ${rubric.title}?`)) return;
    state.rubrics = state.rubrics.filter((entry) => entry.id !== identifier); audit("Rubric deleted", rubric.title); setDirty(); render(); showView("assessment"); return save();
  }
  if (actionName === "add-evidence") {
    if (!state.students.length) return toast("Add a student first.", "error");
    const username = trim(prompt(`Student game username:\n${state.students.map((student) => student.username).join("\n")}`)); const student = state.students.find((entry) => entry.username.toLowerCase() === username.toLowerCase()); if (!student) return toast("Choose a listed username.", "error");
    const title = trim(prompt(`Lesson title, or leave empty for general evidence:\n${state.lessons.map((lesson) => lesson.title).join("\n")}`)); const lesson = title ? state.lessons.find((entry) => entry.title.toLowerCase() === title.toLowerCase()) : null; if (title && !lesson) return toast("Choose a listed lesson.", "error");
    const result = await window.teacherConsole.addPortfolioFile({ studentId: student.id, lessonId: lesson?.id || "" }); if (result.error) return toast(result.error, "error"); if (result.canceled) return;
    const note = prompt("Evidence note", "") ?? ""; result.evidence.note = trim(note); state.portfolios.unshift(result.evidence);
    audit("Portfolio evidence attached", `${student.name}: ${result.evidence.title}`); setDirty(); render(); showView("portfolios"); return save();
  }
  if (actionName === "evidence-note") {
    const evidence = state.portfolios.find((entry) => entry.id === identifier); if (!evidence) return; const note = prompt("Evidence note", evidence.note || ""); if (note === null) return; evidence.note = trim(note); audit("Portfolio note updated", evidence.title); setDirty(); render(); showView("portfolios"); return;
  }
  if (actionName === "delete-evidence") {
    const evidence = state.portfolios.find((entry) => entry.id === identifier); if (!evidence || !confirm("Remove this portfolio record? The copied file will remain in local evidence storage for recovery.")) return;
    state.portfolios = state.portfolios.filter((entry) => entry.id !== identifier); audit("Portfolio record removed", evidence.title); setDirty(); render(); showView("portfolios"); return save();
  }
  if (actionName === "export-csv") { const result = await window.teacherConsole.exportCsv(state); if (!result.canceled) toast(`CSV saved to ${result.path}`); return; }
  if (actionName === "export-pdf") { const result = await window.teacherConsole.exportPdf(state); if (result.error) return toast(result.error, "error"); if (!result.canceled) toast(`PDF saved to ${result.path}`); return; }
  if (actionName === "export-curriculum") { const result = await window.teacherConsole.exportCurriculum(state, []); if (!result.canceled) toast(`Curriculum pack saved to ${result.path}`); return; }
  if (actionName === "import-curriculum") {
    const result = await window.teacherConsole.importCurriculum(); if (result.error) return toast(result.error, "error"); if (result.canceled) return;
    let imported = 0; const lessonIdMap = new Map();
    for (const lesson of result.pack.lessons) { const original = lesson.id; if (state.lessons.some((entry) => entry.id === lesson.id)) lesson.id = id("lesson"); lesson.title = state.lessons.some((entry) => entry.title === lesson.title) ? `${lesson.title} (Imported)` : lesson.title; lessonIdMap.set(original, lesson.id); state.lessons.push(lesson); imported += 1; }
    for (const rubric of result.pack.rubrics) { rubric.id = state.rubrics.some((entry) => entry.id === rubric.id) ? id("rubric") : rubric.id; rubric.lessonId = lessonIdMap.get(rubric.lessonId) || rubric.lessonId; state.rubrics.push(rubric); }
    audit("Curriculum pack imported", `${imported} lessons`); setDirty(); render(); showView("lessons"); return save();
  }
  if (actionName === "backup-encrypted") return exportBackup(true);
  if (actionName === "backup-plain") { if (!confirm("A plain backup contains readable student records. Continue?")) return; return exportBackup(false); }
  if (actionName === "restore-backup") return restoreBackup();
  if (actionName === "toggle-encryption") {
    if (!state.settings.encryptionEnabled) {
      const passphrase = requirePassphrase("Choose the workspace passphrase (at least 10 characters). It cannot be recovered."); if (!passphrase) return;
      const repeat = prompt("Enter the same passphrase again."); if (repeat !== passphrase) return toast("Passphrases did not match.", "error");
      state.settings.encryptionEnabled = true; audit("Workspace encryption enabled", "AES-256-GCM with scrypt key derivation"); setDirty(); const saved = await save({ passphrase }); if (saved) toast("Workspace encryption is now enabled."); return;
    }
    if (!confirm("Turn off workspace encryption? Future local saves will contain readable student records.")) return;
    state.settings.encryptionEnabled = false; audit("Workspace encryption disabled", "Teacher confirmed plain local storage"); setDirty(); await save(); toast("Workspace encryption turned off.", "error"); return;
  }
  if (actionName === "choose-sync-folder") {
    const result = await window.teacherConsole.chooseSyncFolder(); if (result.canceled) return; state.settings.sync.folder = result.path; state.settings.sync.enabled = true; audit("Encrypted sync folder selected", pathName(result.path)); setDirty(); render(); showView("operations"); return save();
  }
  if (actionName === "push-sync") {
    const passphrase = requirePassphrase("Enter the sync-file passphrase. Use the same passphrase on the other teacher computer."); if (!passphrase) return;
    const result = await window.teacherConsole.pushSync(state, { passphrase }); if (result.error) return toast(result.error, "error"); state.settings.sync.lastSyncAt = result.at; audit("Encrypted folder sync pushed", pathName(result.path)); setDirty(); await save(); toast("Encrypted classroom copy pushed to the sync folder."); return;
  }
  if (actionName === "pull-sync") {
    const passphrase = requirePassphrase("Enter the sync-file passphrase."); if (!passphrase) return;
    const result = await window.teacherConsole.pullSync(state, { passphrase }); if (result.error) return toast(result.error, "error"); if (!confirm("Replace this local workspace with the encrypted sync copy?")) return;
    const folder = state.settings.sync.folder; state = result.state; normaliseClientState(); state.settings.sync.folder = folder; state.settings.sync.enabled = true; state.settings.sync.lastSyncAt = result.at; audit("Encrypted folder sync applied", pathName(result.path)); setDirty(); await save(); render(); showView("operations"); toast("Sync copy restored locally."); return;
  }
  if (actionName === "verify-update") {
    const result = await window.teacherConsole.verifyUpdate(state); if (result.error) return toast(result.error, "error"); if (result.canceled) return;
    state.settings.updates.lastCheckedAt = nowIso(); audit("Update package verified", `v${result.version}; signature ${result.signatureStatus}`); setDirty(); await save();
    toast(`Package checksum verified${result.signatureStatus === "verified" ? " and owner signature verified" : "; owner signature key is not configured"}. ${result.newer ? "This is a newer version." : "It is not newer than this app."}`, result.signatureStatus === "verified" ? "success" : "warning"); return;
  }
  if (actionName === "export-diagnostics") { const result = await window.teacherConsole.exportDiagnostics(state); if (!result.canceled) toast(`Redacted diagnostics saved to ${result.path}`); return; }
  if (actionName === "resolve-event") {
    const event = state.unmatchedEvents.find((entry) => entry.id === identifier); if (!event) return;
    const username = trim(prompt(`Map ${event.playerName || "this event"} to a roster game username:\n${state.students.map((student) => student.username).join("\n")}`)); const student = state.students.find((entry) => entry.username.toLowerCase() === username.toLowerCase()); if (!student) return toast("Choose a listed username.", "error");
    let lessonId = ""; if (event.eventType !== "presence") { const title = trim(prompt(`Map to lesson:\n${state.lessons.map((lesson) => lesson.title).join("\n")}`, event.lessonTitle)); const lesson = state.lessons.find((entry) => entry.title.toLowerCase() === title.toLowerCase()); if (!lesson) return toast("Choose a listed lesson.", "error"); lessonId = lesson.id; }
    const result = await window.teacherConsole.resolveEvent(state, event.id, student.id, lessonId); if (result.error) return toast(result.error, "error"); state = result.state; normaliseClientState(); render(); showView("operations"); toast("Classroom event reconciled."); return;
  }
  if (actionName === "dismiss-event") {
    if (!confirm("Dismiss this unmatched event? It will remain documented in the audit trail.")) return; const event = state.unmatchedEvents.find((entry) => entry.id === identifier); state.unmatchedEvents = state.unmatchedEvents.filter((entry) => entry.id !== identifier); audit("Unmatched event dismissed", `${event?.playerName}: ${event?.eventType}`); setDirty(); render(); showView("operations"); return save();
  }
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button || button.disabled) return;
  handleAction(button.dataset.action, button.dataset.id || "").catch((error) => {
    console.error(error);
    toast(error.message || "The action failed.", "error");
    window.teacherConsole.recordRendererError({ message: error.message }).catch(() => {});
  });
});

document.addEventListener("change", (event) => {
  if (event.target.id === "assignmentPreset") {
    const preset = presetById(event.target.value); if (!preset) return;
    byId("assignmentWorld").value = preset.worldName;
    byId("policyPlace").checked = preset.defaultPolicy.studentsCanPlace;
    byId("policyDig").checked = preset.defaultPolicy.studentsCanDig;
    byId("policyWand").checked = preset.defaultPolicy.studentsCanUseWorldEditWand;
    byId("policyBlocks").value = (preset.defaultPolicy.allowedBlocks || []).join("\n");
    byId("policyTools").value = (preset.defaultPolicy.allowedTools || []).join("\n");
  }
  if (event.target.dataset.setting) {
    state.settings.privacy[event.target.dataset.setting] = event.target.checked;
    audit("Privacy consent changed", `${event.target.dataset.setting}: ${event.target.checked ? "enabled" : "disabled"}`);
    setDirty(); save();
  }
});

document.querySelectorAll(".nav-item").forEach((button) => button.addEventListener("click", () => showView(button.dataset.view)));
byId("saveButton").addEventListener("click", () => save());
byId("backupButton").addEventListener("click", () => exportBackup(true));
byId("restoreButton").addEventListener("click", restoreBackup);
byId("newButton").addEventListener("click", () => {
  if (["dashboard", "lessons"].includes(currentView)) openLessonDialog();
  else if (currentView === "classroom") openAssignmentDialog();
  else if (currentView === "students") openStudentDialog();
  else if (currentView === "assessment") openRubricDialog();
  else if (currentView === "portfolios") handleAction("add-evidence", "");
});

byId("createLesson").addEventListener("click", async (event) => {
  event.preventDefault();
  const title = trim(byId("lessonTitle").value); if (!title) return;
  const existing = lessonById(editingLessonId);
  const lessonId = existing?.id || id("lesson");
  const oldCheckpoints = existing?.checkpoints || [];
  const checkpoints = byId("lessonCheckpoints").value.split("\n").map(trim).filter(Boolean).map((checkpointTitle, index) => ({ id: oldCheckpoints[index]?.id || `${lessonId}-checkpoint-${index + 1}`, title: checkpointTitle, kind: oldCheckpoints[index]?.kind || "teacher", points: oldCheckpoints[index]?.points || 1 }));
  const activities = parseActivities(byId("lessonActivities").value, existing?.activities || []);
  const stages = parseStages(byId("lessonStages").value, lessonId, checkpoints, existing?.stages || []);
  if (existing) {
    addLessonVersion(existing, "Before edit");
    Object.assign(existing, { title, subject: byId("lessonSubject").value, objectives: trim(byId("lessonObjectives").value), checkpoints, activities, stages, activeStageId: stages.some((stage) => stage.id === existing.activeStageId) ? existing.activeStageId : stages[0]?.id || "", revision: (existing.revision || 1) + 1, updatedAt: nowIso() });
    audit("Lesson edited", `${title} v${existing.revision}`);
  }
  else {
    state.lessons.push({ id: lessonId, title, subject: byId("lessonSubject").value, status: "Draft", objectives: trim(byId("lessonObjectives").value), checkpoints, activities, stages, activeStageId: stages[0]?.id || "", revision: 1, versions: [], updatedAt: nowIso() });
    audit("Lesson created", title);
  }
  byId("lessonDialog").close(); setDirty(); render(); showView("lessons"); await save();
});

byId("saveStudent").addEventListener("click", async (event) => {
  event.preventDefault();
  const name = trim(byId("studentName").value); const username = trim(byId("studentUsername").value); if (!name || !username) return;
  const collision = state.students.find((student) => student.username.toLowerCase() === username.toLowerCase() && student.id !== editingStudentId); if (collision) return toast(`Game username already belongs to ${collision.name}.`, "error");
  const existing = studentById(editingStudentId);
  const details = { name, username, group: byId("studentGroup").value, role: byId("studentRole").value };
  if (existing) { Object.assign(existing, details); audit("Student roster record updated", `${name} (${username})`); }
  else { state.students.push({ id: id("student"), ...details }); audit("Student added", `${name} (${username})`); }
  byId("studentDialog").close(); setDirty(); render(); showView("students"); await save();
});

byId("saveAssignment").addEventListener("click", async (event) => {
  event.preventDefault();
  const lesson = lessonById(byId("assignmentLesson").value);
  const details = {
    group: byId("assignmentGroup").value, lessonId: byId("assignmentLesson").value, worldPresetId: byId("assignmentPreset").value,
    world: trim(byId("assignmentWorld").value), activeStageId: lesson?.activeStageId || lesson?.stages?.[0]?.id || "",
    policy: { studentsCanPlace: byId("policyPlace").checked, studentsCanDig: byId("policyDig").checked, studentsCanUseWorldEditWand: byId("policyWand").checked, allowedBlocks: byId("policyBlocks").value.split("\n").map(trim).filter(Boolean), allowedTools: byId("policyTools").value.split("\n").map(trim).filter(Boolean) },
  };
  const existing = assignmentById(editingAssignmentId);
  if (existing) { Object.assign(existing, details); audit("Classroom assignment updated", `${details.group}: ${lesson?.title}`); }
  else { state.assignments.push({ id: id("assignment"), managedWorldPath: "", ...details }); audit("Classroom assignment created", `${details.group}: ${lesson?.title}`); }
  byId("assignmentDialog").close(); setDirty(); render(); showView("classroom"); await save();
});

byId("saveRubric").addEventListener("click", async (event) => {
  event.preventDefault();
  const title = trim(byId("rubricTitle").value); if (!title) return;
  const criteria = byId("rubricCriteria").value.split("\n").map(trim).filter(Boolean).map((line) => { const [criterionTitle, rawPoints, ...description] = line.split("|").map(trim); return { id: id("criterion"), title: criterionTitle || "Criterion", maxPoints: Math.max(1, Math.min(1000, Number(rawPoints) || 4)), description: description.join(" | ") }; });
  if (!criteria.length) return toast("Add at least one rubric criterion.", "error");
  state.rubrics.push({ id: id("rubric"), title, lessonId: byId("rubricLesson").value, criteria });
  audit("Rubric created", title); byId("rubricDialog").close(); setDirty(); render(); showView("assessment"); await save();
});

byId("unlockButton").addEventListener("click", async (event) => {
  event.preventDefault();
  const result = await window.teacherConsole.unlockState(byId("unlockPassphrase").value);
  if (result.locked) { byId("unlockError").textContent = result.error; return; }
  byId("unlockDialog").close(); initialise(result);
});

window.addEventListener("error", (event) => window.teacherConsole.recordRendererError({ message: event.message }).catch(() => {}));
window.addEventListener("unhandledrejection", (event) => window.teacherConsole.recordRendererError({ message: String(event.reason?.message || event.reason) }).catch(() => {}));
window.addEventListener("beforeunload", (event) => { if (dirty) { event.preventDefault(); event.returnValue = ""; } });

window.teacherConsole.onClassroomEvent((payload) => {
  state = payload.state; normaliseClientState(); dirty = false; render(); showView(currentView);
  toast(payload.matched ? "New classroom activity received." : "An unmatched classroom event needs attention.", payload.matched ? "success" : "warning");
});

function initialise(result) {
  state = result.state;
  system = result.system || system;
  normaliseClientState();
  dirty = false;
  render(); showView(currentView);
  byId("saveState").textContent = state.settings.encryptionEnabled ? "Encrypted local data ready" : "Local data ready";
}

(async () => {
  const result = await window.teacherConsole.loadState();
  system = result.system || system;
  if (result.locked) {
    byId("unlockError").textContent = result.error || "Enter the workspace passphrase.";
    byId("unlockDialog").showModal();
    byId("unlockPassphrase").focus();
    return;
  }
  initialise(result);
})().catch((error) => {
  byId("saveState").textContent = "Could not load local data";
  toast(error.message || "The Teacher Console could not start.", "error");
});
