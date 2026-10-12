import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Demo app uses cookies/session on most routes — keep classic dynamic rendering.
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
