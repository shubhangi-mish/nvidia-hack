"use client";
import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function SuccessContent() {
  const params = useSearchParams();
  const report = params.get("report");
  const receipt = report ? sessionStorage.getItem(`lastline-receipt-${report}`) : null;
  const data = receipt ? JSON.parse(receipt) : null;

  return (
    <main className="container page narrow-page">
      <p className="eyebrow">Thank you</p>
      <h1 className="h1-small">Report received</h1>
      <p className="lede" role="status">This report is community-reported and has not yet been verified.</p>
      {data ? (
        <>
          <h2>Save this private tracking token</h2>
          <code>{data.tracking_token}</code>
          <p>Keep it private. It is required to follow your report without an account.</p>
          <Link className="button" href={`/incidents/${data.incident_id}`}>View public incident status</Link>
        </>
      ) : (
        <p className="notice">Your receipt is only available in the browser used to submit it. Submit a new report if you need a new tracking token.</p>
      )}
    </main>
  );
}

export default function Success() {
  return (
    <Suspense fallback={null}>
      <SuccessContent />
    </Suspense>
  );
}
