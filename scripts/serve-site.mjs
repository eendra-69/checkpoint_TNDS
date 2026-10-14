/**
 * Zero-dependency static server for the repo root presentation site.
 *
 *   npm run site
 *
 * Serves index.html, site.css, site.js and assets/ straight from disk. Any
 * request under /demo/ is redirected to the Next.js dev server instead of being
 * served as a file, so the presentation site and the running demo behave like
 * one origin during local development — which is exactly what the "Open the
 * demo" call to action assumes.
 */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const PORT = Number(process.env.SITE_PORT ?? 4321);
const DEMO_ORIGIN = process.env.DEMO_ORIGIN ?? "http://localhost:3000";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".md": "text/markdown; charset=utf-8",
};

async function send(res, status, body, type = "text/plain; charset=utf-8") {
  res.writeHead(status, {
    "content-type": type,
    "cache-control": "no-cache",
  });
  res.end(body);
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  const pathname = decodeURIComponent(url.pathname);

  // Hand the whole demo subtree to the Next.js server rather than trying to
  // serve its build output as static files, which it is not.
  if (pathname === "/demo" || pathname.startsWith("/demo/")) {
    const suffix = pathname.replace(/^\/demo/, "") || "/";
    res.writeHead(302, { location: `${DEMO_ORIGIN}${suffix}${url.search}` });
    res.end();
    return;
  }

  const rel = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const target = join(ROOT, normalize(rel));

  // Never serve outside the repo root.
  if (!target.startsWith(ROOT)) {
    await send(res, 403, "Forbidden");
    return;
  }

  try {
    const info = await stat(target);
    const file = info.isDirectory() ? join(target, "index.html") : target;
    const body = await readFile(file);
    await send(res, 200, body, TYPES[extname(file).toLowerCase()] ?? "application/octet-stream");
  } catch {
    await send(res, 404, `Not found: ${pathname}`);
  }
});

server.listen(PORT, () => {
  console.log(`presentation site  http://localhost:${PORT}`);
  console.log(`demo (redirects)   ${DEMO_ORIGIN}`);
});