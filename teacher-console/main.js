"use strict";

const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const crypto = require("crypto");
const fsNative = require("fs");
const fs = require("fs/promises");
const http = require("http");
const os = require("os");
const path = require("path");
const core = require("./console-core.cjs");

const APP_VERSION = require("./package.json").version;
const MAX_BRIDGE_EVENT_BYTES = 64 * 1024;
const MAX_EVIDENCE_BYTES = 25 * 1024 * 1024;
const RECOVERY_LIMIT = 10;

let activePassphrase = "";
let activeState = null;
let bridgeServer = null;
let bridgePort = 0;
let mainWindow = null;
let pendingRestorePath = "";

function statePath() { return path.join(app.getPath("userData"), "teacher-console.json"); }
function stateBackupPath() { return `${statePath()}.backup`; }
function recoveryDirectory() { return path.join(app.getPath("userData"), "recovery"); }
function managedWorldsDirectory() { return path.join(app.getPath("userData"), "managed-worlds"); }
function evidenceDirectory() { return path.join(app.getPath("userData"), "portfolio-evidence"); }

function ensureBridgeToken(state) {
  if (!state.bridge.token) state.bridge.token = crypto.randomBytes(24).toString("hex");
  if (state.bridge.enabled && !state.bridge.sessionId) state.bridge.sessionId = crypto.randomBytes(16).toString("hex");
}

async function writeAtomic(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const temporary = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  const handle = await fs.open(temporary, "wx", 0o600);
  try {
    await handle.writeFile(data);
    await handle.sync();
    await handle.close();
    await fs.rename(temporary, filePath);
  }
  catch (error) {
    await handle.close().catch(() => {});
    await fs.unlink(temporary).catch(() => {});
    throw error;
  }
}

async function readWorkspaceFile(filePath, passphrase = activePassphrase) {
  return core.readStateEnvelope(await fs.readFile(filePath, "utf8"), passphrase);
}

async function readState(passphrase = activePassphrase) {
  try {
    return await readWorkspaceFile(statePath(), passphrase);
  }
  catch (error) {
    if (error.code === "ENOENT") return core.defaultState();
    if (["PASSPHRASE_REQUIRED", "INVALID_PASSPHRASE"].includes(error.code)) throw error;
    console.error("[Teacher Console] primary workspace read failed:", error.message);
    try {
      const recovered = await readWorkspaceFile(stateBackupPath(), passphrase);
      core.pushAudit(recovered, "Automatic recovery", "Loaded the last verified workspace backup after the primary file failed validation.");
      return recovered;
    }
    catch (backupError) {
      console.error("[Teacher Console] backup workspace read failed:", backupError.message);
      throw error;
    }
  }
}

async function archiveVerifiedState() {
  try {
    const current = await fs.readFile(statePath(), "utf8");
    core.readStateEnvelope(current, activePassphrase);
    await writeAtomic(stateBackupPath(), current);
    await fs.mkdir(recoveryDirectory(), { recursive: true });
    const recoveryName = `teacher-console-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    await writeAtomic(path.join(recoveryDirectory(), recoveryName), current);
    const files = (await fs.readdir(recoveryDirectory(), { withFileTypes: true }))
      .filter((entry) => entry.isFile() && entry.name.startsWith("teacher-console-") && entry.name.endsWith(".json"))
      .map((entry) => entry.name).sort().reverse();
    for (const stale of files.slice(RECOVERY_LIMIT)) await fs.unlink(path.join(recoveryDirectory(), stale)).catch(() => {});
  }
  catch {
    // A missing or invalid primary must never replace a known-good backup.
  }
}

async function writeState(input, options = {}) {
  const state = core.normaliseState(input);
  ensureBridgeToken(state);
  state.updatedAt = core.nowIso();
  if (options.passphrase) activePassphrase = String(options.passphrase);
  let envelope;
  if (state.settings.encryptionEnabled) {
    if (!activePassphrase) {
      const error = new Error("Enter the workspace encryption passphrase before saving.");
      error.code = "PASSPHRASE_REQUIRED";
      throw error;
    }
    envelope = core.makeEncryptedEnvelope(state, activePassphrase, "teacher-console");
  }
  else {
    envelope = core.makeStateEnvelope(state, "teacher-console");
  }
  await archiveVerifiedState();
  await writeAtomic(statePath(), JSON.stringify(envelope, null, 2));
  activeState = state;
  await configureBridge(state);
  return state;
}

async function stopBridge() {
  if (!bridgeServer) return;
  const server = bridgeServer;
  bridgeServer = null;
  bridgePort = 0;
  await new Promise((resolve) => server.close(resolve));
}

function bridgeResponse(response, code, body) {
  response.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  response.end(JSON.stringify(body));
}

function validBridgeToken(requestToken, expectedToken) {
  const received = Buffer.from(String(requestToken || ""));
  const expected = Buffer.from(String(expectedToken || ""));
  return received.length === expected.length && received.length > 0 && crypto.timingSafeEqual(received, expected);
}

async function configureBridge(state) {
  activeState = state;
  ensureBridgeToken(activeState);
  if (!activeState.bridge.enabled) {
    await stopBridge();
    return;
  }
  if (bridgeServer && bridgePort === activeState.bridge.port) return;
  if (bridgeServer) await stopBridge();

  bridgeServer = http.createServer((request, response) => {
    if (!validBridgeToken(request.headers["x-openclasscraft-token"], activeState.bridge.token)) {
      bridgeResponse(response, 403, { error: "forbidden" });
      return;
    }
    if (request.method === "GET" && request.url === "/session") {
      bridgeResponse(response, 200, core.bridgeLesson(activeState));
      return;
    }
    if (request.method === "POST" && request.url === "/events") {
      let body = "";
      let tooLarge = false;
      request.setEncoding("utf8");
      request.on("data", (chunk) => {
        body += chunk;
        if (Buffer.byteLength(body) > MAX_BRIDGE_EVENT_BYTES) {
          tooLarge = true;
          request.destroy();
        }
      });
      request.on("end", async () => {
        if (tooLarge) return;
        try {
          const event = JSON.parse(body);
          const result = core.applyClassroomEvent(activeState, event);
          activeState = await writeState(result.state);
          mainWindow?.webContents.send("classroom:event", { state: activeState, matched: result.matched, eventType: event.type });
          bridgeResponse(response, 200, { accepted: true, matched: result.matched });
        }
        catch (error) {
          bridgeResponse(response, 400, { error: error.message });
        }
      });
      request.on("error", () => {
        if (!response.headersSent) bridgeResponse(response, tooLarge ? 413 : 400, { error: tooLarge ? "event_too_large" : "invalid_request" });
      });
      return;
    }
    bridgeResponse(response, 404, { error: "not_found" });
  });
  bridgeServer.requestTimeout = 5000;
  bridgeServer.headersTimeout = 5000;
  await new Promise((resolve, reject) => {
    bridgeServer.once("error", reject);
    bridgeServer.listen(activeState.bridge.port, "127.0.0.1", resolve);
  });
  bridgePort = activeState.bridge.port;
}

function lanAddresses() {
  const addresses = [];
  for (const interfaces of Object.values(os.networkInterfaces())) {
    for (const entry of interfaces || []) if (entry.family === "IPv4" && !entry.internal) addresses.push(entry.address);
  }
  return [...new Set(addresses)];
}

function systemInfo() {
  return {
    version: APP_VERSION,
    platform: process.platform,
    arch: process.arch,
    hostname: os.hostname(),
    lanAddresses: lanAddresses(),
    defaultGamePort: 30000,
    dataPath: app.getPath("userData"),
    managedWorldsPath: managedWorldsDirectory(),
    internetRequired: false,
  };
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function progressReportHtml(input) {
  const state = core.normaliseState(input);
  const summary = core.dashboardSummary(state);
  const studentMap = new Map(state.students.map((student) => [student.id, student]));
  const lessonMap = new Map(state.lessons.map((lesson) => [lesson.id, lesson]));
  const rows = state.progress.map((entry) => {
    const student = studentMap.get(entry.studentId);
    const lesson = lessonMap.get(entry.lessonId);
    const percent = entry.total ? Math.round((entry.complete / entry.total) * 100) : 0;
    return `<tr><td>${escapeHtml(student?.name || "Unknown")}</td><td>${escapeHtml(student?.group || "")}</td><td>${escapeHtml(lesson?.title || "Unknown")}</td><td>${entry.complete}/${entry.total}</td><td>${percent}%</td><td>${escapeHtml(entry.note)}</td></tr>`;
  }).join("");
  const groups = summary.byGroup.map((entry) => `<li><strong>${escapeHtml(entry.group)}</strong>: ${entry.students} students · ${entry.percent}% checkpoint progress</li>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><style>body{font:13px Arial,sans-serif;color:#17251f;margin:36px}h1{color:#155f39;margin-bottom:4px}.meta{color:#587066}.metrics{display:flex;gap:12px;margin:24px 0}.metric{border:1px solid #bed2c4;padding:12px;min-width:120px}.metric strong{display:block;font-size:24px;color:#155f39}table{border-collapse:collapse;width:100%;margin-top:20px}th,td{border:1px solid #ccd9cf;padding:8px;text-align:left}th{background:#edf6ef}footer{margin-top:28px;color:#68786e;font-size:11px}</style></head><body><h1>${escapeHtml(state.schoolName)}</h1><p class="meta">${escapeHtml(state.profile.className)} · ${escapeHtml(state.profile.teacherName)} · Generated ${escapeHtml(new Date().toLocaleString())}</p><div class="metrics"><div class="metric"><strong>${state.students.length}</strong>Students</div><div class="metric"><strong>${summary.complete}/${summary.possible}</strong>Completed records</div><div class="metric"><strong>${summary.pending}</strong>Pending reviews</div></div><h2>Group dashboard</h2><ul>${groups || "<li>No groups yet.</li>"}</ul><h2>Student progress</h2><table><thead><tr><th>Student</th><th>Group</th><th>Lesson</th><th>Checkpoints</th><th>Progress</th><th>Teacher note</th></tr></thead><tbody>${rows || "<tr><td colspan=\"6\">No progress records.</td></tr>"}</tbody></table><footer>OpenClassCraft Teacher Console · Local classroom report</footer></body></html>`;
}

async function renderPdf(html, filePath) {
  const reportWindow = new BrowserWindow({ show: false, webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false } });
  try {
    await reportWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    const pdf = await reportWindow.webContents.printToPDF({ printBackground: true, pageSize: "A4", margins: { top: 0.4, bottom: 0.4, left: 0.4, right: 0.4 } });
    await fs.writeFile(filePath, pdf, { mode: 0o600 });
  }
  finally { reportWindow.destroy(); }
}

async function sha256File(filePath) {
  const digest = crypto.createHash("sha256");
  await new Promise((resolve, reject) => {
    const stream = fsNative.createReadStream(filePath);
    stream.on("data", (chunk) => digest.update(chunk));
    stream.on("error", reject);
    stream.on("end", resolve);
  });
  return digest.digest("hex");
}

function assertManagedPath(targetPath) {
  const root = path.resolve(managedWorldsDirectory());
  const target = path.resolve(String(targetPath || ""));
  if (target === root || !target.startsWith(`${root}${path.sep}`)) throw new Error("Only Console-managed worlds can be changed here.");
  return target;
}

async function readManagedMarker(worldPath) {
  return JSON.parse(await fs.readFile(path.join(worldPath, ".openclasscraft-managed.json"), "utf8"));
}

function templatePath(templateId) {
  const safeId = core.safeFilename(templateId, "");
  if (!safeId || safeId !== templateId) throw new Error("Invalid starter-world template.");
  const curriculumRoot = app.isPackaged
    ? path.join(process.resourcesPath, "curriculum-packs")
    : path.join(__dirname, "curriculum-packs");
  return path.join(curriculumRoot, "worlds", safeId);
}

async function materialiseTemplate(source, target) {
  await fs.cp(source, target, { recursive: true, errorOnExist: true, force: false });
  const curriculumRoot = app.isPackaged
    ? path.join(process.resourcesPath, "curriculum-packs")
    : path.join(__dirname, "curriculum-packs");
  const runtimeSource = path.join(curriculumRoot, "worlds", "_runtime", "openclasscraft_starter");
  const runtimeTarget = path.join(target, "worldmods", "openclasscraft_starter");
  try {
    await fs.access(runtimeTarget);
  }
  catch (error) {
    if (error.code !== "ENOENT") throw error;
    await fs.mkdir(path.dirname(runtimeTarget), { recursive: true });
    await fs.cp(runtimeSource, runtimeTarget, { recursive: true, errorOnExist: true, force: false });
  }
}

async function installWorld({ assignmentId, presetId }) {
  const state = activeState || await readState();
  const preset = state.starterWorldPresets.find((entry) => entry.id === presetId);
  if (!preset?.templateId) throw new Error("This starter preset has no installable template.");
  const source = templatePath(preset.templateId);
  await fs.access(path.join(source, "world.mt"));
  await fs.mkdir(managedWorldsDirectory(), { recursive: true });
  const target = assertManagedPath(path.join(managedWorldsDirectory(), `${core.safeFilename(assignmentId)}-${core.safeFilename(preset.templateId)}`));
  try {
    await fs.access(target);
    throw new Error("This managed world is already installed. Use Snapshot or Reset instead.");
  }
  catch (error) { if (error.code !== "ENOENT") throw error; }
  await materialiseTemplate(source, target);
  await fs.writeFile(path.join(target, ".openclasscraft-managed.json"), JSON.stringify({ assignmentId, presetId, templateId: preset.templateId, installedAt: core.nowIso() }, null, 2), { mode: 0o600 });
  return { path: target, teacherNotesPath: path.join(target, "TEACHER_NOTES.md") };
}

async function snapshotWorld({ assignmentId, worldPath, note = "" }) {
  const source = assertManagedPath(worldPath);
  const marker = await readManagedMarker(source);
  if (marker.assignmentId !== assignmentId) throw new Error("The managed-world ownership marker does not match this assignment.");
  const snapshotsRoot = assertManagedPath(path.join(managedWorldsDirectory(), "snapshots"));
  await fs.mkdir(snapshotsRoot, { recursive: true });
  const target = assertManagedPath(path.join(snapshotsRoot, `${core.safeFilename(assignmentId)}-${Date.now()}`));
  await fs.cp(source, target, { recursive: true, errorOnExist: true, force: false });
  return { id: core.makeId("snapshot", assignmentId), assignmentId, path: target, createdAt: core.nowIso(), note: core.trim(note, 300) };
}

async function duplicateWorld({ sourceAssignmentId, newAssignmentId, worldPath }) {
  const source = assertManagedPath(worldPath);
  const marker = await readManagedMarker(source);
  if (marker.assignmentId !== sourceAssignmentId) throw new Error("The managed-world ownership marker does not match the source assignment.");
  const target = assertManagedPath(path.join(managedWorldsDirectory(), `${core.safeFilename(newAssignmentId)}-${core.safeFilename(marker.templateId || "world")}`));
  await fs.cp(source, target, { recursive: true, errorOnExist: true, force: false });
  await fs.writeFile(path.join(target, ".openclasscraft-managed.json"), JSON.stringify({ ...marker, assignmentId: newAssignmentId, duplicatedFrom: sourceAssignmentId, duplicatedAt: core.nowIso() }, null, 2), { mode: 0o600 });
  return { path: target };
}

async function replaceManagedWorld({ assignmentId, worldPath, sourcePath, archiveReason }) {
  const target = assertManagedPath(worldPath);
  const marker = await readManagedMarker(target);
  if (marker.assignmentId !== assignmentId) throw new Error("The managed-world ownership marker does not match this assignment.");
  const archive = assertManagedPath(`${target}.archive-${Date.now()}`);
  await fs.rename(target, archive);
  try {
    await materialiseTemplate(sourcePath, target);
    await fs.writeFile(path.join(target, ".openclasscraft-managed.json"), JSON.stringify({ ...marker, restoredAt: core.nowIso(), archiveReason, previousWorldArchive: archive }, null, 2), { mode: 0o600 });
  }
  catch (error) {
    await fs.rename(archive, target).catch(() => {});
    throw error;
  }
  return { path: target, archivedPath: archive };
}

async function resetWorld({ assignmentId, worldPath, confirmation }) {
  if (confirmation !== assignmentId) throw new Error("Reset confirmation did not match the assignment.");
  const marker = await readManagedMarker(assertManagedPath(worldPath));
  return replaceManagedWorld({ assignmentId, worldPath, sourcePath: templatePath(marker.templateId), archiveReason: "starter-reset" });
}

async function restoreWorldSnapshot({ assignmentId, worldPath, snapshotPath, confirmation }) {
  if (confirmation !== assignmentId) throw new Error("Restore confirmation did not match the assignment.");
  const snapshot = assertManagedPath(snapshotPath);
  const marker = await readManagedMarker(snapshot);
  if (marker.assignmentId !== assignmentId) throw new Error("That snapshot belongs to another assignment.");
  return replaceManagedWorld({ assignmentId, worldPath, sourcePath: snapshot, archiveReason: "snapshot-restore" });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440, height: 900, minWidth: 1080, minHeight: 700, backgroundColor: "#edf4ef", title: "OpenClassCraft Teacher Console",
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, preload: path.join(__dirname, "preload.js") },
  });
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  mainWindow.webContents.on("will-navigate", (event, url) => { if (!url.startsWith("file://")) event.preventDefault(); });
  mainWindow.loadFile(path.join(__dirname, "app", "index.html"));
}

app.whenReady().then(createWindow);
app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
app.on("before-quit", () => { stopBridge().catch(() => {}); });
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });

ipcMain.handle("state:load", async () => {
  try {
    const state = await readState();
    ensureBridgeToken(state);
    activeState = state;
    await configureBridge(state);
    return { locked: false, state, system: systemInfo() };
  }
  catch (error) {
    if (["PASSPHRASE_REQUIRED", "INVALID_PASSPHRASE"].includes(error.code)) return { locked: true, error: error.message, system: systemInfo() };
    throw error;
  }
});

ipcMain.handle("state:unlock", async (_event, passphrase) => {
  try {
    const state = await readState(String(passphrase || ""));
    ensureBridgeToken(state);
    activePassphrase = String(passphrase || "");
    activeState = state;
    await configureBridge(state);
    return { locked: false, state, system: systemInfo() };
  }
  catch (error) { return { locked: true, error: error.message, system: systemInfo() }; }
});

ipcMain.handle("state:save", async (_event, state, options = {}) => {
  try { return { state: await writeState(state, options) }; }
  catch (error) { return { error: error.message, needsPassphrase: ["PASSPHRASE_REQUIRED", "WEAK_PASSPHRASE"].includes(error.code) }; }
});

ipcMain.handle("state:resolve-event", async (_event, state, eventId, studentId, lessonId) => {
  try { return { state: await writeState(core.resolveUnmatchedEvent(state, eventId, studentId, lessonId)) }; }
  catch (error) { return { error: error.message }; }
});

ipcMain.handle("bridge:export-config", async (_event, state) => {
  const normalised = core.normaliseState(state);
  ensureBridgeToken(normalised);
  const result = await dialog.showSaveDialog({ title: "Save LAN bridge settings", defaultPath: "openclasscraft-teacher-bridge.conf", filters: [{ name: "Luanti configuration", extensions: ["conf"] }] });
  if (result.canceled) return { canceled: true };
  const content = [
    "# OpenClassCraft Teacher Console local bridge (no Internet required)",
    "secure.http_mods = openclasscraft_classroom",
    `openclasscraft_teacher_bridge_url = http://127.0.0.1:${normalised.bridge.port}/session`,
    `openclasscraft_teacher_bridge_token = ${normalised.bridge.token}`,
    `openclasscraft_teacher_events_url = http://127.0.0.1:${normalised.bridge.port}/events`,
    "# Educator: /occ_teacher_sync    Students: /occ_join CODE", "",
  ].join("\n");
  await fs.writeFile(result.filePath, content, { mode: 0o600 });
  return { canceled: false, path: result.filePath };
});

ipcMain.handle("students:import", async () => {
  const selection = await dialog.showOpenDialog({ title: "Import class list", properties: ["openFile"], filters: [{ name: "CSV", extensions: ["csv"] }] });
  if (selection.canceled) return { canceled: true };
  try { return { canceled: false, students: core.parseCsv(await fs.readFile(selection.filePaths[0], "utf8")) }; }
  catch (error) { return { canceled: false, error: error.message }; }
});

ipcMain.handle("backup:export", async (_event, state, options = {}) => {
  try {
    const encrypted = options.encrypted !== false;
    const extension = encrypted ? "occbackup" : "json";
    const result = await dialog.showSaveDialog({ title: "Back up teacher workspace", defaultPath: `openclasscraft-teacher-backup.${extension}`, filters: [{ name: "OpenClassCraft backup", extensions: [extension, "json"] }] });
    if (result.canceled) return { canceled: true };
    const envelope = encrypted ? core.makeEncryptedEnvelope(state, String(options.passphrase || activePassphrase), "teacher-console-backup-export") : core.makeStateEnvelope(state, "teacher-console-backup-export");
    await writeAtomic(result.filePath, JSON.stringify(envelope, null, 2));
    return { canceled: false, path: result.filePath, encrypted };
  }
  catch (error) { return { canceled: false, error: error.message, needsPassphrase: ["WEAK_PASSPHRASE", "PASSPHRASE_REQUIRED"].includes(error.code) }; }
});

ipcMain.handle("backup:restore", async (_event, options = {}) => {
  if (!options.reuseSelection || !pendingRestorePath) {
    const selection = await dialog.showOpenDialog({ title: "Restore teacher workspace", properties: ["openFile"], filters: [{ name: "OpenClassCraft backup", extensions: ["occbackup", "json"] }] });
    if (selection.canceled) return { canceled: true };
    pendingRestorePath = selection.filePaths[0];
  }
  try {
    const parsed = JSON.parse(await fs.readFile(pendingRestorePath, "utf8"));
    const encrypted = parsed.kind === core.ENCRYPTED_STATE_KIND;
    const passphrase = String(options.passphrase || "");
    const restored = core.readStateEnvelope(parsed, passphrase);
    if (encrypted) { activePassphrase = passphrase; restored.settings.encryptionEnabled = true; }
    core.pushAudit(restored, "Workspace restored", `Restored from ${path.basename(pendingRestorePath)}`);
    const saved = await writeState(restored);
    pendingRestorePath = "";
    return { canceled: false, state: saved };
  }
  catch (error) {
    if (["PASSPHRASE_REQUIRED", "INVALID_PASSPHRASE"].includes(error.code)) return { canceled: false, needsPassphrase: true, error: error.message };
    pendingRestorePath = "";
    return { canceled: false, error: error.message };
  }
});

ipcMain.handle("reports:export-csv", async (_event, state) => {
  const result = await dialog.showSaveDialog({ title: "Export progress CSV", defaultPath: "openclasscraft-progress.csv", filters: [{ name: "CSV", extensions: ["csv"] }] });
  if (result.canceled) return { canceled: true };
  await fs.writeFile(result.filePath, core.createProgressCsv(state), { mode: 0o600 });
  return { canceled: false, path: result.filePath };
});

ipcMain.handle("reports:export-pdf", async (_event, state) => {
  const result = await dialog.showSaveDialog({ title: "Export classroom dashboard PDF", defaultPath: "openclasscraft-class-dashboard.pdf", filters: [{ name: "PDF", extensions: ["pdf"] }] });
  if (result.canceled) return { canceled: true };
  try { await renderPdf(progressReportHtml(state), result.filePath); return { canceled: false, path: result.filePath }; }
  catch (error) { return { canceled: false, error: error.message }; }
});

ipcMain.handle("portfolio:add-file", async (_event, { studentId, lessonId }) => {
  const selection = await dialog.showOpenDialog({ title: "Attach portfolio evidence", properties: ["openFile"], filters: [{ name: "Evidence", extensions: ["png", "jpg", "jpeg", "webp", "pdf", "txt", "json", "zip"] }] });
  if (selection.canceled) return { canceled: true };
  try {
    const source = selection.filePaths[0];
    const stat = await fs.stat(source);
    if (!stat.isFile()) throw new Error("Choose a file.");
    if (stat.size > MAX_EVIDENCE_BYTES) throw new Error("Evidence files must be 25 MB or smaller.");
    const targetDirectory = path.join(evidenceDirectory(), core.safeFilename(studentId));
    await fs.mkdir(targetDirectory, { recursive: true });
    const target = path.join(targetDirectory, `${Date.now()}-${core.safeFilename(path.basename(source))}`);
    await fs.copyFile(source, target, fsNative.constants.COPYFILE_EXCL);
    return { canceled: false, evidence: {
      id: core.makeId("evidence", path.basename(source)), studentId, lessonId,
      type: /\.(png|jpe?g|webp)$/i.test(source) ? "Screenshot" : "File",
      title: path.basename(source), originalName: path.basename(source), localPath: target,
      sha256: await sha256File(target), createdAt: core.nowIso(), note: "",
    } };
  }
  catch (error) { return { canceled: false, error: error.message }; }
});

ipcMain.handle("world:install", async (_event, options) => { try { return { result: await installWorld(options) }; } catch (error) { return { error: error.message }; } });
ipcMain.handle("world:snapshot", async (_event, options) => { try { return { result: await snapshotWorld(options) }; } catch (error) { return { error: error.message }; } });
ipcMain.handle("world:duplicate", async (_event, options) => { try { return { result: await duplicateWorld(options) }; } catch (error) { return { error: error.message }; } });
ipcMain.handle("world:reset", async (_event, options) => { try { return { result: await resetWorld(options) }; } catch (error) { return { error: error.message }; } });
ipcMain.handle("world:restore-snapshot", async (_event, options) => { try { return { result: await restoreWorldSnapshot(options) }; } catch (error) { return { error: error.message }; } });

ipcMain.handle("sync:choose-folder", async () => {
  const selection = await dialog.showOpenDialog({ title: "Choose an encrypted sync folder", properties: ["openDirectory", "createDirectory"] });
  return selection.canceled ? { canceled: true } : { canceled: false, path: selection.filePaths[0] };
});

ipcMain.handle("sync:push", async (_event, state, options = {}) => {
  try {
    const folderText = String(state.settings?.sync?.folder || "");
    if (!folderText) throw new Error("Choose a sync folder first.");
    const folder = path.resolve(folderText);
    await fs.access(folder);
    const envelope = core.makeEncryptedEnvelope(state, String(options.passphrase || activePassphrase), "teacher-console-folder-sync");
    const filePath = path.join(folder, "OpenClassCraft-Classroom-Sync.occbackup");
    await writeAtomic(filePath, JSON.stringify(envelope, null, 2));
    return { path: filePath, at: core.nowIso() };
  }
  catch (error) { return { error: error.message, needsPassphrase: true }; }
});

ipcMain.handle("sync:pull", async (_event, state, options = {}) => {
  try {
    const folderText = String(state.settings?.sync?.folder || "");
    if (!folderText) throw new Error("Choose a sync folder first.");
    const filePath = path.join(path.resolve(folderText), "OpenClassCraft-Classroom-Sync.occbackup");
    const restored = core.readStateEnvelope(await fs.readFile(filePath, "utf8"), String(options.passphrase || activePassphrase));
    core.pushAudit(restored, "Encrypted folder sync restored", `Pulled ${path.basename(filePath)}`);
    return { state: restored, path: filePath, at: core.nowIso() };
  }
  catch (error) { return { error: error.message, needsPassphrase: ["PASSPHRASE_REQUIRED", "INVALID_PASSPHRASE"].includes(error.code) }; }
});

ipcMain.handle("curriculum:export", async (_event, state, lessonIds = []) => {
  const result = await dialog.showSaveDialog({ title: "Export curriculum pack", defaultPath: "openclasscraft-curriculum.occpack.json", filters: [{ name: "OpenClassCraft curriculum", extensions: ["json"] }] });
  if (result.canceled) return { canceled: true };
  await writeAtomic(result.filePath, JSON.stringify(core.createCurriculumPack(state, lessonIds), null, 2));
  return { canceled: false, path: result.filePath };
});

ipcMain.handle("curriculum:import", async () => {
  const selection = await dialog.showOpenDialog({ title: "Import curriculum pack", properties: ["openFile"], filters: [{ name: "OpenClassCraft curriculum", extensions: ["json"] }] });
  if (selection.canceled) return { canceled: true };
  try { return { canceled: false, pack: core.readCurriculumPack(await fs.readFile(selection.filePaths[0], "utf8")) }; }
  catch (error) { return { canceled: false, error: error.message }; }
});

ipcMain.handle("updates:verify", async (_event, state) => {
  const selection = await dialog.showOpenDialog({ title: "Verify an OpenClassCraft update manifest", properties: ["openFile"], filters: [{ name: "Update manifest", extensions: ["json"] }] });
  if (selection.canceled) return { canceled: true };
  try {
    const manifestPath = selection.filePaths[0];
    const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
    if (manifest.kind !== "openclasscraft-update-manifest" || !manifest.version || !manifest.package || !manifest.sha256) throw new Error("Invalid OpenClassCraft update manifest.");
    if (path.basename(manifest.package) !== manifest.package) throw new Error("The update package must be next to the manifest.");
    if (manifest.platform && manifest.platform !== process.platform) throw new Error(`This package is for ${manifest.platform}, not ${process.platform}.`);
    if (manifest.arch && manifest.arch !== process.arch) throw new Error(`This package is for ${manifest.arch}, not ${process.arch}.`);
    const packagePath = path.join(path.dirname(manifestPath), manifest.package);
    const actualSha256 = await sha256File(packagePath);
    const expectedSha256 = String(manifest.sha256).toLowerCase();
    if (actualSha256.length !== expectedSha256.length || !crypto.timingSafeEqual(Buffer.from(actualSha256), Buffer.from(expectedSha256))) throw new Error("Update package checksum does not match the manifest.");
    let signatureStatus = "not-configured";
    const keyPath = path.join(__dirname, "release", "update-public-key.pem");
    try {
      const publicKey = await fs.readFile(keyPath, "utf8");
      if (!manifest.signature) throw new Error("The trusted update key is configured, but the manifest has no signature.");
      const signed = [manifest.version, manifest.platform || "", manifest.arch || "", expectedSha256, manifest.package].join("\n");
      if (!crypto.verify(null, Buffer.from(signed), publicKey, Buffer.from(manifest.signature, "base64"))) throw new Error("Update signature verification failed.");
      signatureStatus = "verified";
    }
    catch (error) { if (error.code !== "ENOENT") throw error; }
    state.settings.updates.lastCheckedAt = core.nowIso();
    return { canceled: false, version: manifest.version, packagePath, checksum: actualSha256, signatureStatus, newer: core.compareVersions(manifest.version, APP_VERSION) > 0 };
  }
  catch (error) { return { canceled: false, error: error.message }; }
});

ipcMain.handle("diagnostics:export", async (_event, state) => {
  const result = await dialog.showSaveDialog({ title: "Export redacted diagnostics", defaultPath: "openclasscraft-support-diagnostics.json", filters: [{ name: "JSON", extensions: ["json"] }] });
  if (result.canceled) return { canceled: true };
  const normalised = core.normaliseState(state);
  const currentSystem = systemInfo();
  const diagnostics = {
    kind: "openclasscraft-redacted-diagnostics", createdAt: core.nowIso(),
    system: {
      version: currentSystem.version,
      platform: currentSystem.platform,
      arch: currentSystem.arch,
      internetRequired: currentSystem.internetRequired,
    },
    counts: { students: normalised.students.length, groups: normalised.groups.length, lessons: normalised.lessons.length, assignments: normalised.assignments.length, progress: normalised.progress.length, submissions: normalised.submissions.length, chatMessages: normalised.chatMessages.length, unmatchedEvents: normalised.unmatchedEvents.length },
    settings: { encryptionEnabled: normalised.settings.encryptionEnabled, syncEnabled: normalised.settings.sync.enabled, updateChannel: normalised.settings.updates.channel, crashReports: normalised.settings.privacy.crashReports, performanceMetrics: normalised.settings.privacy.performanceMetrics },
    recentAudit: normalised.audit.slice(0, 30).map((entry) => ({ at: entry.at, action: entry.action })),
  };
  await fs.writeFile(result.filePath, JSON.stringify(diagnostics, null, 2), { mode: 0o600 });
  return { canceled: false, path: result.filePath };
});

ipcMain.handle("diagnostics:renderer-error", async (_event, details) => {
  if (!activeState?.settings?.privacy?.crashReports) return { recorded: false };
  const record = JSON.stringify({ at: core.nowIso(), message: core.trim(details?.message, 500), source: "renderer", version: APP_VERSION });
  await fs.appendFile(path.join(app.getPath("userData"), "local-crash-reports.jsonl"), `${record}\n`, { mode: 0o600 });
  return { recorded: true };
});
