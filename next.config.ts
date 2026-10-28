import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/sjakk", destination: "/sjakk/index.html" }];
  },
  // Anelsesløs reads its word vectors from disk at runtime.
  outputFileTracingIncludes: {
    "/spill/api/anelseslos": ["./features/spill/data/anelseslos/**/*"],
  },
};

export default nextConfig;
