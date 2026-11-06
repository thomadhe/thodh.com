import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sjakk for 1 shows the sections from public/sjakk under its own addresses. Their files stay where they are, so
  // imports, data, the Stockfish worker and /sjakk/api/apninger are the same at both. A hash survives the redirect.
  async redirects() {
    return [
      { source: "/sjakk/oppgaver", destination: "/sjakk-for-1/oppgaver", permanent: true },
      { source: "/sjakk/apninger", destination: "/sjakk-for-1/apninger", permanent: true },
    ];
  },
  async rewrites() {
    return [
      { source: "/sjakk", destination: "/sjakk/index.html" },
      { source: "/sjakk-for-1", destination: "/sjakk-for-1/index.html" },
      { source: "/sjakk-for-1/oppgaver", destination: "/sjakk/oppgaver/index.html" },
      { source: "/sjakk-for-1/apninger", destination: "/sjakk/apninger/index.html" },
    ];
  },
  // Anelsesløs reads its word vectors from disk at runtime.
  outputFileTracingIncludes: {
    "/spill/api/anelseslos": ["./features/spill/data/anelseslos/**/*"],
  },
};

export default nextConfig;
