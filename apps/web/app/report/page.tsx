"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "../../lib/api";
import { EyeOffIcon, LockIcon, ShieldCheckIcon } from "../../components/Icons";

export default function Report() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const payload = {
      description: form.get("description"),
      location_text: form.get("location"),
      category: form.get("category") || null,
    };
    try {
      const response = await fetch(`${API_BASE}/v1/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("We could not submit this report. Please review the information and try again.");
      const receipt = await response.json();
      sessionStorage.setItem(`lastline-receipt-${receipt.report_id}`, JSON.stringify(receipt));
      router.push(`/report/success?report=${receipt.report_id}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to submit report.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="container page report-layout">
      <div>
        <p className="eyebrow">Report a problem</p>
        <h1 className="h1-small">What is getting in the way?</h1>
        <p className="lede">
          Tell us about a broken elevator, blocked entrance, closed pharmacy, or anything else that keeps someone from
          reaching essential care. It takes about a minute.
        </p>
        <form onSubmit={submit} aria-describedby="privacy">
          <label htmlFor="description">What is happening? <span aria-hidden="true">*</span></label>
          <textarea id="description" name="description" minLength={10} maxLength={4000} required placeholder="For example: The elevator at this station appears unavailable." />

          <label htmlFor="location">Where is the problem? <span aria-hidden="true">*</span></label>
          <input id="location" name="location" required minLength={3} placeholder="Station, facility, or street address" />
          <p className="hint">Use a public facility or address. Do not enter a home address.</p>

          <label htmlFor="category">Category (optional)</label>
          <select id="category" name="category" defaultValue="">
            <option value="">Choose a category</option>
            <option value="transit">Transit access</option>
            <option value="facility">Facility access</option>
            <option value="dialysis">Dialysis access</option>
            <option value="pharmacy">Pharmacy access</option>
          </select>

          {error && <p className="error" role="alert">{error}</p>}
          <button disabled={sending}>{sending ? "Submitting…" : "Submit report"}</button>
        </form>
      </div>

      <aside className="side-panel" id="privacy" aria-label="How your report is handled">
        <h2>How your report is handled</h2>
        <ul className="check-list">
          <li><LockIcon size={20} /> No account. You get a private tracking token to follow your report.</li>
          <li><EyeOffIcon size={20} /> Your text, contact details, and exact location are never shown publicly.</li>
          <li><ShieldCheckIcon size={20} /> It starts as an unverified allegation until corroborated by evidence.</li>
        </ul>
        <p className="hint">Please do not include private health records or information that is not needed to describe the barrier.</p>
        <p className="note"><strong>Emergency?</strong> Call your local emergency number. LASTLINE is not monitored around the clock.</p>
      </aside>
    </main>
  );
}
