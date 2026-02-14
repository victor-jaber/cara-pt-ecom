import { type Express } from "express";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import fs from "fs";
import path from "path";
import { nanoid } from "nanoid";
import { createRequire } from "module";

const viteLogger = createLogger();

export async function setupVite(server: Server, app: Express) {
  const require = createRequire(import.meta.url);

  const viteClientEnvDir = (() => {
    try {
      const envPath = require.resolve("vite/dist/client/env.mjs");
      return path.dirname(envPath);
    } catch {
      return null;
    }
  })();

  const baseServerConfig = (viteConfig as any).server ?? {};
  const baseFsConfig = (baseServerConfig as any).fs ?? {};
  const baseAllow: string[] = Array.isArray(baseFsConfig.allow) ? baseFsConfig.allow : [];
  const mergedAllow = Array.from(
    new Set([
      ...baseAllow,
      // Always allow the current repo root (shared/ lives here)
      path.resolve(import.meta.dirname, ".."),
      ...(viteClientEnvDir ? [viteClientEnvDir] : []),
    ]),
  );

  const serverOptions = {
    middlewareMode: true,
    hmr: { server, path: "/vite-hmr" },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: {
      ...baseServerConfig,
      ...serverOptions,
      fs: {
        ...baseFsConfig,
        allow: mergedAllow,
      },
    },
    appType: "custom",
  });

  app.use(vite.middlewares);

  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}
