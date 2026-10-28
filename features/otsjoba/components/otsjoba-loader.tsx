"use client";
import dynamic from "next/dynamic";

// Learning-day boundaries use the learner's timezone. Render in the browser so
// the server's UTC timezone cannot produce a different day during hydration.
const Otsjoba = dynamic(() => import("./otsjoba"), {
  ssr: false,
  loading: () => <main className="account-notice" role="status">Åpner språkrommet ditt…</main>,
});
export default Otsjoba;
