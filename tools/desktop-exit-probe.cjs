// Diagnostic only. No game, profile, protocol, storage, or renderer probe.
// Run with node_modules/.bin/electron tools/desktop-exit-probe.cjs
const { app, BrowserWindow } = require("electron");
app.whenReady().then(async () => {
  const window = new BrowserWindow({ show: false });
  await window.loadURL("data:text/html,<h1>Electron exit diagnostic</h1>");
  app.quit();
});
