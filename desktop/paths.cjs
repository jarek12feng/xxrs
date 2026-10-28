const path = require("node:path");
function resolveAsset(root, address) {
  try {
    const url = new URL(address);
    if (
      url.protocol !== "xxrs:" ||
      url.hostname !== "game" ||
      url.port ||
      url.username ||
      url.password
    )
      return null;
    const pathname = decodeURIComponent(url.pathname);
    if (pathname.includes("\\") || pathname.includes("\0")) return null;
    const file = path.resolve(
      root,
      "." + (pathname === "/" ? "/index.html" : pathname),
    );
    const relative = path.relative(root, file);
    if (
      relative === ".." ||
      relative.startsWith(".." + path.sep) ||
      path.isAbsolute(relative)
    )
      return null;
    return file;
  } catch {
    return null;
  }
}
module.exports = { resolveAsset };
