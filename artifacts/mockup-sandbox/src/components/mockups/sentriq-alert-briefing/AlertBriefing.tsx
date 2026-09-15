import { useMemo, useState } from "react";
import {
  Archive,
  ArrowRight,
  Bell,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  FileSearch,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UserRound,
} from "lucide-react";

import "./AlertBriefing.css";

type Filter = "all" | "critical" | "review";
type Tone = "red" | "amber";

type Alert = {
  id: number;
  title: string;
  detail: string;
  account: string;
  endpoint: string;
  age: string;
  tone: Tone;
  severity: string;
  summary: string;
  confidence: string;
  impact: string;
};

const alertSeed: Alert[] = [
  {
    id: 1,
    title: "Credential dumping attempt",
    detail: "Redwood Legal · RWL-FIN-07",
    account: "Redwood Legal",
    endpoint: "RWL-FIN-07",
    age: "8 min ago",
    tone: "red",
    severity: "Critical signal",
    summary: "A process accessed LSASS memory after a suspicious archive was opened. No lateral movement has been observed yet.",
    confidence: "98.4%",
    impact: "1 endpoint",
  },
  {
    id: 2,
    title: "Unsigned driver loaded",
    detail: "Pine & Co. · PCM-PLANT-14",
    account: "Pine & Co.",
    endpoint: "PCM-PLANT-14",
    age: "41 min ago",
    tone: "amber",
    severity: "Review signal",
    summary: "A newly installed driver is unsigned, but its publisher matches a known manufacturing tool. Context is needed before containment.",
    confidence: "74.1%",
    impact: "3 related events",
  },
  {
    id: 3,
    title: "Northstar posture restored",
    detail: "Northstar Dental · 56 endpoints",
    account: "Northstar Dental",
    endpoint: "Fleet posture",
    age: "1 hr ago",
    tone: "amber",
    severity: "Review signal",
    summary: "The fleet returned to its expected posture after a policy sync. Confirm the recovery before closing the human lane.",
    confidence: "91.7%",
    impact: "56 endpoints",
  },
];

export function AlertBriefing() {
  const [alerts, setAlerts] = useState<Alert[]>(alertSeed);
  const [selectedId, setSelectedId] = useState(1);
  const [filter, setFilter] = useState<Filter>("all");
  const [notice, setNotice] = useState("");

  const selected = alerts.find((alert) => alert.id === selectedId) ?? alerts[0];
  const visibleAlerts = useMemo(() => {
    if (filter === "critical") return alerts.filter((alert) => alert.tone === "red");
    if (filter === "review") return alerts.filter((alert) => alert.tone === "amber");
    return alerts;
  }, [alerts, filter]);

  const announce = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  };

  const chooseFilter = (nextFilter: Filter) => {
    setFilter(nextFilter);
    const firstMatch = nextFilter === "critical"
      ? alerts.find((alert) => alert.tone === "red")
      : nextFilter === "review"
        ? alerts.find((alert) => alert.tone === "amber")
        : alerts[0];
    if (firstMatch) setSelectedId(firstMatch.id);
  };

  const acknowledge = () => {
    if (!selected) return;
    const title = selected.title;
    setAlerts((current) => current.filter((alert) => alert.id !== selected.id));
    const next = alerts.find((alert) => alert.id !== selected.id);
    if (next) setSelectedId(next.id);
    announce(`${title} acknowledged — decision trail updated.`);
  };

  const snooze = () => announce(`${selected?.title ?? "Signal"} snoozed for 30 minutes.`);
  const escalate = () => announce(`${selected?.title ?? "Signal"} escalated to the response team.`);

  return (
    <main className="sab-shell" aria-label="Sentriq signal briefing">
      <div className="sab-frame">
        <header className="sab-topbar">
          <div className="sab-brand">
            <span className="sab-brand-mark"><ShieldCheck size={14} /></span>
            <span className="sab-brand-lockup"><strong>sentriq</strong><small>MSP OPERATIONS</small></span>
          </div>
          <div className="sab-top-actions">
            <span className="sab-live"><span className="sab-live-dot" /> Workspace live</span>
            <span className="sab-account">Cedarline Security</span>
          </div>
        </header>

        <section className="sab-layout">
          <aside className="sab-rail" aria-label="Signal list">
            <div className="sab-rail-head">
              <span className="sab-crumb"><Bell size={12} /> Human lane</span>
              <h1>Signal briefing</h1>
              <p>One focused decision at a time. Keep routine work out of the queue.</p>
              <div className="sab-filter-row" aria-label="Filter signals">
                <button className={`sab-filter ${filter === "all" ? "active" : ""}`} onClick={() => chooseFilter("all")} type="button">All <b>{alerts.length}</b></button>
                <button className={`sab-filter ${filter === "critical" ? "active" : ""}`} onClick={() => chooseFilter("critical")} type="button">Critical <b>{alerts.filter((alert) => alert.tone === "red").length}</b></button>
                <button className={`sab-filter ${filter === "review" ? "active" : ""}`} onClick={() => chooseFilter("review")} type="button">Review <b>{alerts.filter((alert) => alert.tone === "amber").length}</b></button>
              </div>
            </div>
            <div className="sab-alerts-label"><span>Open signals</span><span>{visibleAlerts.length} shown</span></div>
            <div className="sab-alert-list">
              {visibleAlerts.length ? visibleAlerts.map((alert) => (
                <button
                  className={`sab-alert-item ${selected?.id === alert.id ? "selected" : ""}`}
                  key={alert.id}
                  onClick={() => setSelectedId(alert.id)}
                  type="button"
                >
                  <span className={`sab-alert-dot ${alert.tone === "amber" ? "amber" : ""}`} />
                  <span><strong>{alert.title}</strong><p>{alert.detail}</p></span>
                  <time>{alert.age.replace(" ago", "")}</time>
                </button>
              )) : <div className="sab-empty">No signals in this lane.<br />A quiet queue is a healthy queue.</div>}
            </div>
            <div className="sab-rail-foot">
              <span className="sab-foot-icon"><SlidersHorizontal size={13} /></span>
              <span><strong>Rules are holding</strong><span>142 routine events handled</span></span>
            </div>
          </aside>

          <section className="sab-detail" aria-live="polite">
            <div className="sab-detail-top">
              <div>
                <h2>Decision desk</h2>
                <p>Review context, then leave a traceable call.</p>
              </div>
              <button className="sab-queue-link" onClick={() => announce("Decision queue opened — 2 actions remain.")} type="button">Open full queue <ArrowRight size={12} /></button>
            </div>

            {selected ? (
              <>
                <div className="sab-focus">
                  <div className="sab-heading-meta">
                    <span className="sab-severity">{selected.severity}</span>
                    <span>{selected.age}</span>
                  </div>
                  <h3>{selected.title}</h3>
                  <p className="sab-focus-lead">{selected.summary}</p>
                  <div className="sab-entity">
                    <span className="sab-entity-mark">{selected.account.slice(0, 2).toUpperCase()}</span>
                    <span><strong>{selected.account}</strong><small>{selected.endpoint}</small></span>
                  </div>

                  <div className="sab-signal-grid" aria-label="Signal context">
                    <div className="sab-signal"><span>Detection confidence</span><strong>{selected.confidence}</strong><small>correlated evidence</small></div>
                    <div className="sab-signal"><span>Potential impact</span><strong className="warn">{selected.impact}</strong><small>containment not started</small></div>
                    <div className="sab-signal"><span>Suggested posture</span><strong>Review</strong><small>human call required</small></div>
                  </div>

                  <div className="sab-evidence">
                    <div className="sab-evidence-head"><span>Why this is here</span><FileSearch size={14} /></div>
                    <p>Sentriq held this event because the signal crosses the confidence threshold but the account context is not conclusive enough for an automatic action.</p>
                  </div>
                </div>
                <div className="sab-action-bar">
                  <div className="sab-action-copy"><strong>What should happen next?</strong>Your choice is saved to the audit trail.</div>
                  <div className="sab-actions">
                    <button className="sab-action" onClick={snooze} type="button"><Clock3 size={12} /> Snooze</button>
                    <button className="sab-action danger" onClick={escalate} type="button"><CircleAlert size={12} /> Escalate</button>
                    <button className="sab-action primary" onClick={acknowledge} type="button"><Check size={12} /> Acknowledge</button>
                  </div>
                </div>
              </>
            ) : (
              <div className="sab-focus"><div className="sab-empty">Everything is accounted for. No human decisions waiting.</div></div>
            )}
          </section>
        </section>
      </div>
      {notice && <div className="sab-toast" role="status"><Sparkles size={13} />{notice}</div>}
    </main>
  );
}

export default AlertBriefing;