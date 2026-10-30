import Link from "next/link";
import { HeroIllustration } from "../components/HeroIllustration";
import { ImpactMap } from "../components/ImpactMap";
import { LiveIncidentBoard } from "../components/LiveIncidentBoard";
import {
  ArrowRightIcon, BuildingIcon, CloudIcon, EyeOffIcon, HandIcon, LockIcon,
  MegaphoneIcon, ShieldCheckIcon, SparkIcon, TrainIcon,
} from "../components/Icons";

const disruptions = [
  { icon: <TrainIcon size={26} />, title: "The elevator is out", body: "A step-free station closes. For a wheelchair user the clinic is now effectively unreachable, and nobody tells them until they arrive." },
  { icon: <CloudIcon size={26} />, title: "A storm warning hits", body: "A severe weather alert covers the area around a treatment center. Is the facility affected? Who needs to know first?" },
  { icon: <BuildingIcon size={26} />, title: "A facility is unreachable", body: "An entrance is blocked or a pharmacy has closed, while the directory still lists it as open." },
];

const steps = [
  { icon: <MegaphoneIcon size={26} />, title: "A signal comes in", body: "A person reports a barrier anonymously, or an official source such as the National Weather Service publishes an alert." },
  { icon: <ShieldCheckIcon size={26} />, title: "Status stays honest", body: "Everything starts as “community reported”. Volume never makes a report true; only official evidence does." },
  { icon: <SparkIcon size={26} />, title: "AI investigates", body: "An NVIDIA open model served by Nebius maps which facilities and routes are affected and drafts options." },
  { icon: <HandIcon size={26} />, title: "A human decides", body: "Coordinators review every proposed action. LASTLINE never sends messages or raises alerts on its own." },
];

const ladder = [
  { name: "Community reported", cls: "s-community", body: "Someone told us. Treat as a lead, not a fact." },
  { name: "Under investigation", cls: "s-investigating", body: "We are matching it against official sources." },
  { name: "Officially confirmed", cls: "s-confirmed", body: "A named official source supports it." },
  { name: "Resolved", cls: "s-resolved", body: "The barrier is gone and the record is closed." },
];

export default function Home() {
  return (
    <main>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <p className="eyebrow">Critical-service access, in real time</p>
            <h1>Know when the route to care is broken, before someone misses treatment.</h1>
            <p className="lede">
              LASTLINE turns community reports and official alerts into clear, verified status for the elevators,
              roads, and facilities people rely on to reach dialysis, pharmacies, and hospitals.
            </p>
            <div className="actions">
              <Link className="button" href="/report">Report a problem <ArrowRightIcon size={18} /></Link>
              <Link className="button button-ghost" href="#map">See it working</Link>
            </div>
            <ul className="trust-row" aria-label="Principles">
              <li><LockIcon size={18} /> Anonymous, no account</li>
              <li><ShieldCheckIcon size={18} /> Unverified until proven</li>
              <li><HandIcon size={18} /> Humans approve every action</li>
            </ul>
          </div>
          <HeroIllustration />
        </div>
      </section>

      <section className="section section-tint" id="map" aria-labelledby="map-title">
        <div className="container">
          <p className="eyebrow">See it working · real data</p>
          <h2 id="map-title">Every dialysis facility in the US, and what is happening around them right now.</h2>
          <p className="lede narrow">
            This map uses the official CMS directory of Medicare dialysis facilities and live National Weather Service
            alerts. Pick an alert, or simulate an outage, and watch how LASTLINE turns a signal into a reviewed decision.
          </p>
          <ImpactMap />
        </div>
      </section>

      <section className="section">
        <div className="container">
          <p className="eyebrow">Why it matters</p>
          <h2>Some trips cannot be skipped.</h2>
          <p className="lede narrow">
            People on in-center dialysis typically travel to treatment about three times a week, and missing sessions
            is dangerous. For them, and for anyone who depends on step-free transit or a specific pharmacy, a single
            broken link in the route can cut off care. Today that information is scattered across transit feeds,
            weather alerts, facility phone lines, and word of mouth.
          </p>
          <div className="card-grid">
            {disruptions.map((item) => (
              <article className="card" key={item.title}>
                <span className="icon-badge">{item.icon}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
          <p className="callout">
            <strong>LASTLINE is the missing last line:</strong> one place that collects the signals, says plainly what
            is known and what is not, and helps a coordinator act before the missed appointment.
          </p>
        </div>
      </section>

      <section className="section section-tint" id="how">
        <div className="container">
          <p className="eyebrow">How it works</p>
          <h2>From a rumor to a reviewed decision, in four steps.</h2>
          <ol className="steps">
            {steps.map((step, index) => (
              <li key={step.title}>
                <span className="step-num" aria-hidden="true">{index + 1}</span>
                <span className="icon-badge">{step.icon}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section">
        <div className="container split">
          <div>
            <p className="eyebrow">Built to be trusted</p>
            <h2>Every incident shows exactly how sure we are.</h2>
            <p className="lede">
              Misinformation during an outage can be as harmful as the outage. So each incident carries a status that
              only moves forward when evidence does.
            </p>
            <ul className="check-list">
              <li><EyeOffIcon size={20} /> Reporter details and exact personal locations are never made public.</li>
              <li><LockIcon size={20} /> A private tracking token lets you follow your report with no account.</li>
              <li><ShieldCheckIcon size={20} /> Official sources are named and linked, never paraphrased into fact.</li>
            </ul>
          </div>
          <ol className="ladder" aria-label="Verification statuses">
            {ladder.map((item) => (
              <li key={item.name} className={item.cls}>
                <strong>{item.name}</strong>
                <span>{item.body}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <LiveIncidentBoard />

      <section className="section cta-band">
        <div className="container cta-inner">
          <div>
            <h2>Seen a barrier to care? Tell us in under a minute.</h2>
            <p>No account, no personal details required.</p>
          </div>
          <Link className="button button-light" href="/report">Report a problem <ArrowRightIcon size={18} /></Link>
        </div>
      </section>
    </main>
  );
}
