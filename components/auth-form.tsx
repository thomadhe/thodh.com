"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { announceAccountChange } from "@/lib/auth/client";

export function AuthForm({ signup = false, next, linkError = false }: { signup?: boolean; next: string; linkError?: boolean }) {
  const [magic, setMagic] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(linkError ? "Lenken er utløpt eller åpnet i en annen nettleser. Be om en ny lenke her." : "");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/auth", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: signup ? "signup" : magic ? "magic" : "login", email: fields.get("email"), ...(magic ? {} : { password: fields.get("password") }), next }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Prøv igjen om litt.");
      if (data.signedIn) {
        announceAccountChange();
        window.location.assign(data.next);
      } else { setMessage(data.message); }
    } catch (error) { setError(error instanceof Error ? error.message : "Kunne ikke koble til. Prøv igjen."); }
    finally { setBusy(false); }
  }

  const inputClass = "mt-2 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-base outline-none focus:border-neutral-600 focus:ring-2 focus:ring-neutral-200";
  return <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-9">
    <p className="mb-3 font-mono text-xs uppercase tracking-widest text-neutral-500">Én konto, flere prosjekter</p>
    <h1 className="text-3xl font-semibold tracking-tight">{signup ? "Opprett konto" : magic ? "Få en innloggingslenke" : "Velkommen tilbake"}</h1>
    <p className="mt-4 leading-relaxed text-neutral-600">Har du konto hos Karrierepiloten? Bruk samme e-post og passord her. Otsjoba-fremgangen din er privat og følger kontoen.</p>
    <form onSubmit={submit} className="mt-7 space-y-5">
      <label className="block text-sm font-medium">E-post<input className={inputClass} name="email" type="email" autoComplete="email" required maxLength={254} /></label>
      {!magic && <label className="block text-sm font-medium">Passord<input className={inputClass} name="password" type="password" autoComplete={signup ? "new-password" : "current-password"} required minLength={signup ? 8 : 1} maxLength={1024} />{signup && <span className="mt-2 block text-xs text-neutral-500">Minst 8 tegn. Kontoen kan også brukes i Karrierepiloten.</span>}</label>}
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {message && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">{message} Åpne lenken i denne nettleseren.</p>}
      <button disabled={busy} className="w-full rounded-xl bg-neutral-900 px-5 py-3 font-medium text-white hover:bg-neutral-700 disabled:opacity-50">{busy ? "Et øyeblikk…" : signup ? "Opprett konto" : magic ? "Send innloggingslenke" : "Logg inn"}</button>
    </form>
    {!signup && <button type="button" onClick={() => { setMagic(!magic); setMessage(""); setError(""); }} className="mt-5 text-sm text-neutral-600 underline underline-offset-4">{magic ? "Bruk passord i stedet" : "Glemt passord? Logg inn med en lenke"}</button>}
    <p className="mt-6 border-t border-neutral-100 pt-5 text-sm text-neutral-600">{signup ? "Har du allerede konto? " : "Første gang her? "}<Link href={`${signup ? "/logg-inn" : "/registrer"}?neste=${encodeURIComponent(next)}`} className="font-medium text-neutral-900 underline underline-offset-4">{signup ? "Logg inn" : "Opprett konto"}</Link></p>
  </div>;
}
