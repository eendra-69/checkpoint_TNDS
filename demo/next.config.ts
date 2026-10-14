import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Demo app uses cookies/session on most routes — keep classic dynamic rendering.
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei"],
  turbopack: {
    // The app lives in demo/, but the parent folder is also a git root and
    // carries its own package.json. Without an explicit root, Turbopack walks
    // upward, adopts that unrelated lockfile as the workspace, and warns about
    // it on every boot. Pin the root to this directory so resolution and file
    // watching stay scoped to the app itself.
    root: here,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;