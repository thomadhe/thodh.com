"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { announceAccountChange } from "@/lib/auth/client";
import { useT } from "@/lib/sprak";

export function AuthForm({ signup = false, next, linkError = false }: { signup?: boolean; next: string; linkError?: boolean }) {
  const t = useT();
  const [magic, setMagic] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showLinkError, setShowLinkError] = useState(linkError);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    setBusy(true); setError(""); setShowLinkError(false); setMessage("");
    try {
      const response = await fetch("/api/auth", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: signup ? "signup" : magic ? "magic" : "login", email: fields.get("email"), ...(magic ? {} : { password: fields.get("password") }), next }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t("Prøv igjen om litt.", "Please try again in a moment."));
      if (data.signedIn) {
        announceAccountChange();
        window.location.assign(data.next);
      } else { setMessage(data.message); }
    } catch (error) { setError(error instanceof Error ? error.message : t("Kunne ikke koble til. Prøv igjen.", "Could not connect. Please try again.")); }
    finally { setBusy(false); }
  }

  const displayedError =
    error ||
    (showLinkError
      ? t(
          "Lenken er utløpt eller åpnet i en annen nettleser. Be om en ny lenke her.",
          "This link has expired or was opened in another browser. Request a new link here.",
        )
      : "");

  const inputClass = "mt-2 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-base outline-none focus:border-neutral-600 focus:ring-2 focus:ring-neutral-200";
  return <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-9">
    <p className="mb-3 font-mono text-xs uppercase tracking-widest text-neutral-500">{t("Én konto, flere prosjekter", "One account, multiple projects")}</p>
    <h1 className="text-3xl font-semibold tracking-tight">
      {signup
        ? t("Opprett konto", "Create account")
        : magic
          ? t("Få en innloggingslenke", "Get a sign-in link")
          : t("Velkommen tilbake", "Welcome back")}
    </h1>
    <p className="mt-4 leading-relaxed text-neutral-600">
      {t(
        "Har du konto hos Karrierepiloten? Bruk samme e-post og passord her. Otsjoba-fremgangen din er privat og følger kontoen.",
        "Have a Karrierepiloten account? Use the same email and password here. Your Otsjoba progress stays private and follows your account.",
      )}
    </p>
    <form onSubmit={submit} className="mt-7 space-y-5">
      <label className="block text-sm font-medium">{t("E-post", "Email")}<input className={inputClass} name="email" type="email" autoComplete="email" required maxLength={254} /></label>
      {!magic && (
        <label className="block text-sm font-medium">
          {t("Passord", "Password")}
          <input className={inputClass} name="password" type="password" autoComplete={signup ? "new-password" : "current-password"} required minLength={signup ? 8 : 1} maxLength={1024} />
          {signup && (
            <span className="mt-2 block text-xs text-neutral-500">
              {t("Minst 8 tegn. Kontoen kan også brukes i Karrierepiloten.", "At least 8 characters. This account also works on Karrierepiloten.")}
            </span>
          )}
        </label>
      )}
      {displayedError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{displayedError}</p>}
      {message && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">{message} {t("Åpne lenken i denne nettleseren.", "Open the link in this browser.")}</p>}
      <button disabled={busy} className="w-full rounded-xl bg-neutral-900 px-5 py-3 font-medium text-white hover:bg-neutral-700 disabled:opacity-50">
        {busy
          ? t("Et øyeblikk…", "One moment…")
          : signup
            ? t("Opprett konto", "Create account")
            : magic
              ? t("Send innloggingslenke", "Send sign-in link")
              : t("Logg inn", "Sign in")}
      </button>
    </form>
    {!signup && (
      <button type="button" onClick={() => { setMagic(!magic); setMessage(""); setError(""); setShowLinkError(false); }} className="mt-5 text-sm text-neutral-600 underline underline-offset-4">
        {magic ? t("Bruk passord i stedet", "Use password instead") : t("Glemt passord? Logg inn med en lenke", "Forgot password? Sign in with a link")}
      </button>
    )}
    <p className="mt-6 border-t border-neutral-100 pt-5 text-sm text-neutral-600">
      {signup ? t("Har du allerede konto? ", "Already have an account? ") : t("Første gang her? ", "New here? ")}
      <Link href={`${signup ? "/logg-inn" : "/registrer"}?neste=${encodeURIComponent(next)}`} className="font-medium text-neutral-900 underline underline-offset-4">
        {signup ? t("Logg inn", "Sign in") : t("Opprett konto", "Create account")}
      </Link>
    </p>
  </div>;
}
