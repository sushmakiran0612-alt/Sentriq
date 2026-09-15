import { useMemo, useState } from "react";
import {
  Activity,
  ArrowLeft,
  Bell,
  ChevronRight,
  Gauge,
  ListFilter,
  Network,
  PanelRight,
  ShieldCheck,
} from "lucide-react";

import "./WorkbenchAlerts.css";

type DestinationId = "queue" | "clients" | "capacity" | "policy" | "status";
type AlertTone = "red" | "amber";

type AlertItem = {
  id: number;
  title: string;
  detail: string;
  time: string;
  tone: AlertTone;
};

const destinations: {
  id: DestinationId;
  label: string;
  detail: string;
  meta: string;
  icon: typeof PanelRight;
  tone: "teal" | "amber" | "violet";
}[] = [
  { id: "queue", label: "Decision queue", detail: "Consequential actions that still need a human call.", meta: "2 waiting", icon: PanelRight, tone: "amber" },
  { id: "clients", label: "Clients & fleet", detail: "Open a client lens across posture, detections, and actions.", meta: "3 managed accounts", icon: Network, tone: "teal" },
  { id: "capacity", label: "Impact & capacity", detail: "See the analyst hours returned by the operating model.", meta: "18.6 hrs returned", icon: Gauge, tone: "violet" },
  { id: "policy", label: "Policy center", detail: "Review the rules that keep routine work in the quiet lane.", meta: "High-confidence policies", icon: ListFilter, tone: "teal" },
  { id: "status", label: "System status", detail: "Confirm telemetry and workspace health at a glance.", meta: "All systems operational", icon: Activity, tone: "violet" },
];

const alertSeed: AlertItem[] = [
  { id: 1, title: "Credential dumping attempt", detail: "Redwood Legal · RWL-FIN-07", time: "8 min", tone: "red" },
  { id: 2, title: "Unsigned driver loaded", detail: "Pine & Co. · PCM-PLANT-14", time: "41 min", tone: "amber" },
  { id: 3, title: "Northstar posture restored", detail: "Northstar Dental · 56 endpoints", time: "1 hr", tone: "amber" },
];

export function WorkbenchAlerts() {
  const [alerts, setAlerts] = useState<AlertItem[]>(alertSeed);
  const [notice, setNotice] = useState("");
  const visibleAlerts = useMemo(() => alerts.slice(0, 3), [alerts]);

  const announce = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  };

  const openDestination = (id: DestinationId) => {
    const item = destinations.find((destination) => destination.id === id);
    announce(`${item?.label ?? "Workspace"} opened — cockpit context ready.`);
  };

  const acknowledge = (id: number) => {
    const alert = alerts.find((item) => item.id === id);
    setAlerts((current) => current.filter((item) => item.id !== id));
    if (alert) announce(`${alert.title} acknowledged and removed from recent alerts.`);
  };

  return (
    <main className="sqa-workbench" aria-label="Sentriq Workbench landing page">
      <div className="sqa-backdrop">
        <div className="sqa-topbar">
          <div className="sqa-brand">
            <span className="sqa-brand-mark"><ShieldCheck size={14} /></span>
            <span><strong>sentriq</strong><small>MSP OPERATIONS</small></span>
          </div>
          <div className="sqa-top-meta">
            <span>Cedarline Security</span>
            <span className="sqa-status"><span className="sqa-live-dot" /> Workspace live</span>
            <button className="sqa-skip" onClick={() => announce("Operations cockpit is ready to open.")} title="Skip to cockpit" type="button"><ArrowLeft size={13} /> Go to cockpit</button>
          </div>
        </div>

        <section className="sqa-panel" aria-labelledby="sqa-title">
          <div className="sqa-heading">
            <div className="sqa-heading-mark"><ShieldCheck size={15} /></div>
            <div className="sqa-kicker">SENTRIQ · MSP OPERATIONS</div>
            <h1 id="sqa-title">Sentriq Workbench</h1>
            <p>Your focused cockpit for fleet posture, human review, and analyst capacity.</p>
            <span className="sqa-live"><span className="sqa-live-dot" /> Cedarline Security · workspace live</span>
          </div>

          <div className="sqa-metrics" aria-label="Current workspace metrics">
            <div className="sqa-metric"><span>Fleet posture</span><strong>97.8%</strong><small>187 endpoints</small></div>
            <div className="sqa-metric"><span>Automation coverage</span><strong>93%</strong><small>high-confidence only</small></div>
            <div className="sqa-metric"><span>Routine handled</span><strong>142</strong><small>events · last 7 days</small></div>
            <div className="sqa-metric"><span>Human lane</span><strong className="attention">2</strong><small>actions awaiting review</small></div>
          </div>

          <div className="sqa-workspace-head">
            <div><span className="sqa-eyebrow">Start with a workspace</span><strong>What needs your attention?</strong></div>
            <span className="sqa-context">Redwood Legal selected</span>
          </div>

          <div className="sqa-content-grid">
            <div className="sqa-destinations" aria-label="Workbench destinations">
              {destinations.map(({ id, label, detail, meta, icon: Icon, tone }) => (
                <button className="sqa-destination" key={id} onClick={() => openDestination(id)} type="button">
                  <span className={`sqa-destination-icon ${tone}`}><Icon size={17} /></span>
                  <strong>{label}</strong>
                  <span>{detail}</span>
                  <small>{meta}<ChevronRight size={12} /></small>
                </button>
              ))}
            </div>

            <aside className="sqa-alerts" aria-labelledby="sqa-alerts-title">
              <div className="sqa-alerts-head">
                <div className="sqa-alerts-title"><Bell size={14} /><span id="sqa-alerts-title">Recent alerts</span></div>
                <span className="sqa-alert-count">{alerts.length}</span>
              </div>
              <div className="sqa-alerts-sub">A short signal line, not another queue.</div>
              <div className="sqa-alert-list">
                {visibleAlerts.length ? visibleAlerts.map((alert) => (
                  <div className="sqa-alert" key={alert.id}>
                    <span className={`sqa-alert-dot ${alert.tone === "amber" ? "amber" : ""}`} />
                    <div className="sqa-alert-main">
                      <div className="sqa-alert-row"><strong>{alert.title}</strong><span className="sqa-alert-time">{alert.time}</span></div>
                      <p>{alert.detail}</p>
                      <button className="sqa-alert-action" onClick={() => acknowledge(alert.id)} type="button">Acknowledge</button>
                    </div>
                  </div>
                )) : <div className="sqa-alert-empty">No recent alerts. Quiet is good.</div>}
              </div>
            </aside>
          </div>

          <div className="sqa-footer">
            <span>Everything stays in the Sentriq operating picture.</span>
            <button className="sqa-primary" onClick={() => announce("Opening operations cockpit…")} type="button">Open operations cockpit <ChevronRight size={15} /></button>
          </div>
          <div className="sqa-hint"><kbd>ESC</kbd> go to cockpit <span className="sqa-hint-divider" /> <kbd>ENTER</kbd> open selected workspace</div>
        </section>
      </div>
      {notice && <div className="sqa-notice" role="status">{notice}</div>}
    </main>
  );
}

export default WorkbenchAlerts;