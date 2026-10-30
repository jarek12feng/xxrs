// Test-only Electron entry, using an isolated profile. No debug hook ships in the app.
const { app, BrowserWindow } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const [profile, phase, bundle, packagedMain] = process.argv.slice(2);
if (!profile || !phase || !bundle)
  throw new Error("profile, phase, probe bundle required");
fs.mkdirSync(profile, { recursive: true });
app.setPath("appData", path.resolve(profile));
require(packagedMain ? path.resolve(packagedMain) : "../desktop/main.cjs");
const timeout = setTimeout(() => {
  console.error("Smoke test timed out");
  app.exit(1);
}, 30000);
app.whenReady().then(async () => {
  try {
    const window = BrowserWindow.getAllWindows()[0];
    if (window.webContents.isLoading())
      await new Promise((resolve, reject) => {
        window.webContents.once("did-finish-load", resolve);
        window.webContents.once("did-fail-load", (_event, code, message) =>
          reject(new Error(`${code}: ${message}`)),
        );
      });
    const ready = await window.webContents.executeJavaScript(
      `(async () => {
        const deadline = Date.now() + 5000;
        while (!document.querySelector('main') && Date.now() < deadline) await new Promise(r => setTimeout(r, 50));
        if (!document.querySelector('main')) throw new Error('App did not finish loading');
        const scene = new Image(); scene.src = getComputedStyle(document.querySelector('.world-wallpaper')).backgroundImage.slice(5,-2); await scene.decode();
        for (const img of document.images) img.loading = 'eager';
        await Promise.race([Promise.all([...document.images].map(i => i.decode())), new Promise((_, reject) => setTimeout(() => reject(new Error('Image decode timeout: ' + JSON.stringify([...document.images].map(i => ({src:i.src, complete:i.complete, width:i.naturalWidth}))))), 5000))]);
        return { title: document.title, text: document.body.innerText, node: typeof require, images: [...document.images].map(i=>({src:i.src, ok:i.complete && i.naturalWidth>0})) };
      })()`,
    );
    if (!ready.text.includes("问道听松") || ready.node !== "undefined")
      throw new Error("Renderer failed or Node exposed");
    if (phase !== "write" && !ready.text.includes("桌面存档验收"))
      throw new Error("App UI did not restore the character");

    if (ready.images.some((i) => !i.ok))
      throw new Error("Missing scene asset: " + JSON.stringify(ready.images));
    await window.webContents.executeJavaScript(fs.readFileSync(bundle, "utf8"));
    const result = await window.webContents.executeJavaScript(
      `desktopProbe(${JSON.stringify(phase)})`,
    );
    console.log(
      JSON.stringify({
        phase,
        title: ready.title,
        origin: window.webContents.getURL(),
        stateVersion: result.version,
        images: ready.images.length,
        passed: true,
      }),
    );
    clearTimeout(timeout);
    app.quit();
  } catch (error) {
    console.error(error);
    clearTimeout(timeout);
    app.exit(1);
  }
});
