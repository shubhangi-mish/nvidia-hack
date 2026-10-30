import Link from "next/link";

const guardrails = [
  { label: "Incident review", value: "Use the API with an authorized operations token." },
  { label: "AI investigation", value: "Requires Nebius credentials. No substitute model is ever used." },
  { label: "Outbound actions", value: "Proposal and human approval only. Nothing is sent automatically." },
];

export default function Operations() {
  return (
    <main className="container page narrow-page">
      <p className="eyebrow">Coordinator operations</p>
      <h1 className="h1-small">Operations dashboard</h1>
      <p className="lede">
        This workspace requires coordinator authorization. It never sends external messages or publishes urgent alerts
        automatically.
      </p>
      <section className="card">
        <h2 className="h2-flush">System guardrails</h2>
        <dl className="facts">
          {guardrails.map((item) => (
            <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>
          ))}
        </dl>
      </section>
      <p><Link className="button" href="/explore">Open public incident list</Link></p>
    </main>
  );
}
