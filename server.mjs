import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const siteRoot = path.join(__dirname, "agentic-security");

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8"
};

function resolveRequestPath(urlPath) {
  const requestedPath = urlPath === "/" ? "/index.html" : urlPath;
  const safePath = path.normalize(requestedPath).replace(/^(\.\.[/\\])+/, "");
  return path.join(siteRoot, safePath);
}

export function createStaticSiteServer() {
  return createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url || "/", "http://localhost");
      const filePath = resolveRequestPath(requestUrl.pathname);

      if (!filePath.startsWith(siteRoot) || !existsSync(filePath)) {
        response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("Not found");
        return;
      }

      const content = await readFile(filePath);
      const extension = path.extname(filePath).toLowerCase();
      const contentType = mimeTypes[extension] || "application/octet-stream";

      response.writeHead(200, { "Content-Type": contentType });
      response.end(content);
    } catch (error) {
      response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Internal server error");
    }
  });
}

export async function startServer(port = Number(process.env.PORT) || 3000) {
  if (port === 0) {
    const server = createStaticSiteServer();
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, () => {
        server.off("error", reject);
        resolve();
      });
    });
    return server;
  }

  let lastError;

  for (let offset = 0; offset < 10; offset += 1) {
    const candidatePort = port + offset;
    const server = createStaticSiteServer();

    try {
      await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(candidatePort, () => {
          server.off("error", reject);
          resolve();
        });
      });

      return server;
    } catch (error) {
      lastError = error;
      if (error.code !== "EADDRINUSE") {
        throw error;
      }
    }
  }

  throw lastError;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const server = await startServer();
  const address = server.address();
  const activePort = typeof address === "object" && address ? address.port : 3000;
  console.log(`OWASP Agentic Security site running at http://127.0.0.1:${activePort}`);
}
