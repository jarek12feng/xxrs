import { defineConfig } from "vite";
import { buildInfo } from "./tools/build-info";
import vue from "@vitejs/plugin-vue";
import { createReadStream, existsSync } from "node:fs";
import { resolve } from "node:path";
export default defineConfig(({ command, mode }) => {
  const info = buildInfo();
  return {
    define: { __BUILD_INFO__: JSON.stringify(info) },
    plugins: [
      vue(),
      {
        name: "build-identity",
        generateBundle() {
          this.emitFile({
            type: "asset",
            fileName: "build-info.json",
            source: JSON.stringify(info, null, 2),
          });
        },
      },
      ...(command === "serve" && mode === "local-music"
        ? [
            {
              name: "local-music-only",
              configureServer(server: import("vite").ViteDevServer) {
                server.middlewares.use((req, res, next) => {
                  const match =
                    /^\/__local-music\/(home|trial|journey|vista|mystery)\.wav$/.exec(
                      req.url || "",
                    );
                  if (!match) return next();
                  const path = resolve(".local-music", `${match[1]}.wav`);
                  if (!existsSync(path)) {
                    res.statusCode = 404;
                    res.end();
                    return;
                  }
                  res.setHeader("Content-Type", "audio/wav");
                  res.setHeader("Cache-Control", "no-store");
                  const stream = createReadStream(path);
                  stream.on("error", () => {
                    res.destroy();
                  });
                  stream.pipe(res);
                });
              },
            },
          ]
        : []),
    ],
  };
});
