// Public project coordinates. This is the same identity provider as Karrierepiloten.
// A publishable key never bypasses Row Level Security.
export function supabaseConfig() {
  return {
    url: process.env.SUPABASE_URL || "https://beikvwnttqnebwuticgv.supabase.co",
    key: process.env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_6Dx1GnX4jmwWJT6Qz_EbcQ_Czr7SViP",
  };
}

export const authCookieOptions = {
  name: "thodh-auth",
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production" && process.env.VERCEL === "1",
};
