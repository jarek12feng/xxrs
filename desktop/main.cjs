const {
  app,
  BrowserWindow,
  dialog,
  net,
  protocol,
  session,
} = require("electron");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { resolveAsset } = require("./paths.cjs");

app.setName("长生未央");

// Keep this identity and origin stable: IndexedDB belongs to this profile/origin.
app.setPath("userData", path.join(app.getPath("appData"), "cultivation-life"));
app.setAppUserModelId("com.xxrs.cultivationlife");
protocol.registerSchemesAsPrivileged([
  {
    scheme: "xxrs",
    privileges: { standard: true, secure: true, supportFetchAPI: true },
  },
]);
let window;
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on("second-instance", () => {
    if (window) {
      if (window.isMinimized()) window.restore();
      window.focus();
    }
  });
  app.whenReady().then(async () => {
    const root = path.join(__dirname, "../dist");
    protocol.handle("xxrs", (request) => {
      const file = resolveAsset(root, request.url);
      return file
        ? net.fetch(pathToFileURL(file).href)
        : new Response("Not found", { status: 404 });
    });
    session.defaultSession.setPermissionRequestHandler(
      (_wc, _permission, callback) => callback(false),
    );
    session.defaultSession.setPermissionCheckHandler(() => false);
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          "Content-Security-Policy": [
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-src 'none'",
          ],
        },
      });
    });
    window = new BrowserWindow({
      width: 1440,
      height: 960,
      minWidth: 1000,
      minHeight: 700,
      title: "长生未央 · 试玩版",
      backgroundColor: "#f4efe3",
      show: false,
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
      },
    });
    window.removeMenu();
    window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    window.webContents.on("will-navigate", (event, url) => {
      if (url !== "xxrs://game/") event.preventDefault();
    });
    window.once("ready-to-show", () => window.show());
    try {
      await window.loadURL("xxrs://game/");
    } catch (error) {
      dialog.showErrorBox(
        "启动失败",
        `游戏资源加载失败，请重新安装。存档会保留。\n${error.message}`,
      );
      app.quit();
    }
  });
  app.on("window-all-closed", () => app.quit());
}
