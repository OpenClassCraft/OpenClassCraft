"use strict";

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("teacherConsole", {
  loadState: () => ipcRenderer.invoke("state:load"),
  unlockState: (passphrase) => ipcRenderer.invoke("state:unlock", passphrase),
  saveState: (state, options) => ipcRenderer.invoke("state:save", state, options),
  resolveEvent: (state, eventId, studentId, lessonId) => ipcRenderer.invoke("state:resolve-event", state, eventId, studentId, lessonId),
  importStudents: () => ipcRenderer.invoke("students:import"),
  exportBridgeConfig: (state) => ipcRenderer.invoke("bridge:export-config", state),
  exportBackup: (state, options) => ipcRenderer.invoke("backup:export", state, options),
  restoreBackup: (options) => ipcRenderer.invoke("backup:restore", options),
  exportCsv: (state) => ipcRenderer.invoke("reports:export-csv", state),
  exportPdf: (state) => ipcRenderer.invoke("reports:export-pdf", state),
  addPortfolioFile: (details) => ipcRenderer.invoke("portfolio:add-file", details),
  installWorld: (details) => ipcRenderer.invoke("world:install", details),
  snapshotWorld: (details) => ipcRenderer.invoke("world:snapshot", details),
  duplicateWorld: (details) => ipcRenderer.invoke("world:duplicate", details),
  resetWorld: (details) => ipcRenderer.invoke("world:reset", details),
  restoreWorldSnapshot: (details) => ipcRenderer.invoke("world:restore-snapshot", details),
  chooseSyncFolder: () => ipcRenderer.invoke("sync:choose-folder"),
  pushSync: (state, options) => ipcRenderer.invoke("sync:push", state, options),
  pullSync: (state, options) => ipcRenderer.invoke("sync:pull", state, options),
  exportCurriculum: (state, lessonIds) => ipcRenderer.invoke("curriculum:export", state, lessonIds),
  importCurriculum: () => ipcRenderer.invoke("curriculum:import"),
  verifyUpdate: (state) => ipcRenderer.invoke("updates:verify", state),
  exportDiagnostics: (state) => ipcRenderer.invoke("diagnostics:export", state),
  recordRendererError: (details) => ipcRenderer.invoke("diagnostics:renderer-error", details),
  onClassroomEvent: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on("classroom:event", listener);
    return () => ipcRenderer.removeListener("classroom:event", listener);
  },
});
