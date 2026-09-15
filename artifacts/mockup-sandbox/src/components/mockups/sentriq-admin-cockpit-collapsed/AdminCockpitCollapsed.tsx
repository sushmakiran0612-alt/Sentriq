import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  FileDown,
  Gauge,
  Layers3,
  ListFilter,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRight,
  ShieldCheck,
  Siren,
  Sparkles,
  UsersRound,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";

import "./AdminCockpitCollapsed.css";

type Role = "msp" | "client";
type NavItem = "cockpit" | "clients" | "capacity" | "queue";
type ClientKey = "redwood" | "northstar" | "pine";

type ClientData = {
  key: ClientKey;
  name: string;
  initials: string;
  mark: "teal" | "amber" | "red";
  sector: string;
  endpoints: number;
  posture: string;
  threats: number;
  detections: number;
  actions: number;
  actionState: string;
  tta: string;
  ttaDelta: string;
  triage: string;
  automation: string;
  routine: number;
  lead: string;
};

type QueueItem = {
  id: number;
  client: ClientKey;
  title: string;
  description: string;
  endpoint: string;
  age: string;
  action: string;
  severity: "critical" | "high";
};

const clients: ClientData[] = [
  { key: "redwood", name: "Redwood Legal", initials: "RL", mark: "red", sector: "Legal services", endpoints: 74, posture: "98.6%", threats: 1, detections: 39, actions: 1, actionState: "1 pending", tta: "11m 42s", ttaDelta: "−4m 18s", triage: "−67%", automation: "94%", routine: 51, lead: "Maya Chen" },
  { key: "northstar", name: "Northstar Dental", initials: "ND", mark: "teal", sector: "Healthcare network", endpoints: 56, posture: "99.1%", threats: 0, detections: 31, actions: 0, actionState: "Clear", tta: "8m 06s", ttaDelta: "−3m 51s", triage: "−71%", automation: "96%", routine: 48, lead: "Eli Ramos" },
  { key: "pine", name: "Pine & Co. Manufacturing", initials: "PM", mark: "amber", sector: "Industrial manufacturing", endpoints: 57, posture: "95.8%", threats: 2, detections: 44, actions: 1, actionState: "1 pending", tta: "14m 27s", ttaDelta: "−2m 16s", triage: "−52%", automation: "89%", routine: 43, lead: "Jon Bell" },
];

const queueSeed: QueueItem[] = [
  { id: 1, client: "redwood", title: "Credential dumping attempt", description: "LSASS access blocked on a finance workstation.", endpoint: "RWL-FIN-07", age: "8 min ago", action: "Isolate endpoint", severity: "critical" },
  { id: 2, client: "pine", title: "Unsigned driver loaded", description: "New kernel driver appeared outside its maintenance window.", endpoint: "PCM-PLANT-14", age: "41 min ago", action: "Quarantine driver", severity: "high" },
];

const navItems: { id: NavItem; label: string; hint: string; icon: LucideIcon }[] = [
  { id: "cockpit", label: "Operations cockpit", hint: "Fleet overview", icon: Activity },
  { id: "clients", label: "Clients & fleet", hint: "3 managed accounts", icon: Network },
  { id: "capacity", label: "Impact & capacity", hint: "18.6 hrs returned", icon: Gauge },
  { id: "queue", label: "Decision queue", hint: "Human review lane", icon: PanelRight },
];

function getClient(key: ClientKey) {
  return clients.find((client) => client.key === key) ?? clients[0];
}

function Status({ children, pending = false }: { children: ReactNode; pending?: boolean }) {
  return <span className={`scc-status${pending ? " pending" : ""}`}>{children}</span>;
}

function PanelHead({ title, subtitle, action, onAction }: { title: string; subtitle?: string; action?: string; onAction?: () => void }) {
  return (
    <div className="scc-panel-head">
      <div><div className="scc-panel-title">{title}</div>{subtitle && <div className="scc-panel-subtitle">{subtitle}</div>}</div>
      {action && <button className="scc-panel-head-link" onClick={onAction} type="button">{action} <ChevronRight size={12} style={{ verticalAlign: -2 }} /></button>}
    </div>
  );
}

function Metric({ label, value, note, trend, featured = false, warning = false }: { label: string; value: string; note: string; trend?: string; featured?: boolean; warning?: boolean }) {
  return (
    <div className={`scc-metric${featured ? " featured" : ""}${warning ? " scc-metric-warning" : ""}`}>
      <div className="scc-kicker">{label}</div><div className="scc-metric-value">{value}</div><div className="scc-metric-note">{note}</div>
      {trend && <div className="scc-metric-trend">{trend.startsWith("−") ? <ArrowDownRight size={11} /> : <ArrowUpRight size={11} />}{trend}</div>}
    </div>
  );
}

function ClientCell({ client }: { client: ClientData }) {
  return <div className="scc-client-cell"><span className={`scc-client-mark ${client.mark}`}>{client.initials}</span><div><strong>{client.name}</strong><span>{client.endpoints} endpoints · {client.sector}</span></div></div>;
}

function FleetTable({ onSelectClient }: { onSelectClient: (client: ClientKey) => void }) {
  return (
    <div className="scc-table-wrap">
      <table className="scc-table">
        <thead><tr><th>Client</th><th>Posture</th><th>Events / 7d</th><th>Automation</th><th>Analyst time</th></tr></thead>
        <tbody>{clients.map((client) => (
          <tr key={client.key}>
            <td><button className="scc-button ghost" onClick={() => onSelectClient(client.key)} type="button" style={{ padding: 0, minHeight: 27 }}><ClientCell client={client} /></button></td>
            <td><span className="scc-number">{client.posture}</span></td><td><span className="scc-number">{client.detections + client.routine}</span></td>
            <td><div style={{ display: "flex", alignItems: "center", gap: 8 }}><div className="scc-progress"><i className={client.key === "pine" ? "amber" : undefined} style={{ width: client.automation }} /></div><span className="scc-number">{client.automation}</span></div></td>
            <td><span className="scc-delta">{client.triage}</span></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

function CapacityPanel() {
  const rows = [{ label: "Redwood Legal", detail: "51 routine events", value: "−67%" }, { label: "Northstar Dental", detail: "48 routine events", value: "−71%" }, { label: "Pine & Co. Manufacturing", detail: "43 routine events", value: "−52%" }];
  return (
    <section className="scc-panel">
      <PanelHead title="Analyst capacity returned" subtitle="Time Sentriq has put back in the week." />
      <div className="scc-capacity-body"><div className="scc-capacity-main"><div><div className="scc-kicker">Across the portfolio</div><strong>18.6 hrs</strong></div><span>this week</span></div>
        <div className="scc-capacity-bar"><i /></div><div className="scc-capacity-foot"><span>26.4 hrs before Sentriq</span><span>68% recovered</span></div>
        <div className="scc-capacity-list">{rows.map((row) => <div className="scc-capacity-row" key={row.label}><div><strong>{row.label}</strong><span>{row.detail}</span></div><div className="scc-progress"><i style={{ width: row.value.replace("−", "") }} /></div><b>{row.value}</b></div>)}</div>
        <div className="scc-capacity-gain"><strong>Northstar gains the most capacity.</strong> Its routine queue is 96% automated, returning 6.8 analyst hours this week.</div>
      </div>
    </section>
  );
}

function ActivityPanel({ client }: { client?: ClientData }) {
  const items = client
    ? [{ icon: Bot, tone: "", title: "Routine event grouped and closed", detail: `${client.name} · ${client.lead}`, time: "09:48" }, { icon: ShieldCheck, tone: "", title: "Endpoint posture check passed", detail: `${client.endpoints} of ${client.endpoints} endpoints reporting`, time: "09:22" }, { icon: Siren, tone: client.actions ? "amber" : "", title: client.actions ? "Consequential action needs review" : "Detection contained automatically", detail: client.actions ? "Sentriq recommendation is ready" : "No analyst intervention required", time: "08:56" }]
    : [{ icon: CheckCircle2, tone: "", title: "142 routine events handled", detail: "High-confidence policies · across 3 clients", time: "10:42" }, { icon: UsersRound, tone: "", title: "Northstar gained 6.8 analyst hours", detail: "Largest capacity return in the portfolio", time: "10:16" }, { icon: PanelRight, tone: "amber", title: "2 consequential actions are waiting", detail: "Human approval remains required", time: "10:09" }];
  return <section className="scc-panel"><PanelHead title={client ? "Recent activity" : "Operator signal"} subtitle={client ? "The events behind this client's numbers." : "The few things worth a human glance."} /><div className="scc-activity-list">{items.map((item) => { const Icon = item.icon; return <div className="scc-activity" key={item.title}><span className={`scc-activity-icon ${item.tone}`}><Icon size={13} /></span><div className="scc-activity-copy"><strong>{item.title}</strong><span>{item.detail}</span></div><time>{item.time}</time></div>; })}</div></section>;
}

function ActionQueue({ queue, onResolve, onClose }: { queue: QueueItem[]; onResolve: (id: number, outcome: "approved" | "deferred") => void; onClose: () => void }) {
  return (
    <aside className="scc-queue-drawer" aria-label="Consequential action queue">
      <div className="scc-queue-drawer-head"><div><strong>Consequential queue</strong><span>Human decisions only · {queue.length} waiting</span></div><button className="scc-icon-button" onClick={onClose} aria-label="Close action queue" type="button"><X size={14} /></button></div>
      {queue.length === 0 ? <div style={{ padding: "26px 17px" }} className="scc-empty-notice"><CheckCircle2 size={15} /> Queue clear. Sentriq is watching.</div> : queue.map((item) => <div className="scc-queue-item" key={item.id}><i className={item.severity === "high" ? "amber" : undefined} /><div><strong>{item.title}</strong><p>{item.description} <span style={{ fontFamily: "DM Mono" }}>{item.endpoint}</span></p><div className="scc-queue-item-actions"><button className="scc-button approve" onClick={() => onResolve(item.id, "approved")} type="button"><Check size={12} /> Approve</button><button className="scc-button defer" onClick={() => onResolve(item.id, "deferred")} type="button"><Clock3 size={12} /> Hold</button></div></div></div>)}
    </aside>
  );
}

function MspView({ queue, onReviewQueue, onSelectClient, onNotice }: { queue: QueueItem[]; onReviewQueue: () => void; onSelectClient: (client: ClientKey) => void; onNotice: (message: string) => void }) {
  const totalEndpoints = clients.reduce((sum, client) => sum + client.endpoints, 0);
  const totalEvents = clients.reduce((sum, client) => sum + client.detections + client.routine, 0);
  return (
    <div className="scc-section-transition">
      <div className="scc-page-head"><div><div className="scc-kicker">Tuesday · 10:50 UTC · MSP overview</div><h1>Good morning, Jordan.</h1><p>The fleet is quiet. Two consequential actions still need your call.</p></div><div className="scc-page-head-tools"><span className="scc-live"><span className="scc-live-dot" /> Fleet telemetry live</span><button className="scc-button primary" onClick={onReviewQueue} type="button"><PanelRight size={13} /> Review queue <span style={{ opacity: .7 }}>{queue.length}</span></button></div></div>
      <div className="scc-metrics"><Metric label="Portfolio posture" value="97.8%" note={`${totalEndpoints} endpoints · 3 clients`} featured /><Metric label="Needs review" value={String(queue.length)} note="high-impact actions waiting" warning /><Metric label="Routine handled" value="142" note="events · last 7 days" trend="↑ 18 vs last week" /><Metric label="Triage time" value="−63%" note="pilot baseline · 7 days" trend="↑ 9 pts this week" /><Metric label="Automation coverage" value="93%" note={`${totalEvents} events observed`} trend="high-confidence only" /></div>
      <div className="scc-grid"><section className="scc-panel"><PanelHead title="Portfolio posture" subtitle="Where the fleet is healthy, noisy, or asking for attention." action="Open client view" onAction={() => onSelectClient("redwood")} /><FleetTable onSelectClient={onSelectClient} /></section><CapacityPanel /></div>
      <div className="scc-bottom-grid"><ActivityPanel /><section className="scc-panel"><PanelHead title="Efficiency, at a glance" subtitle="The operating model behind the numbers." /><div className="scc-strip"><div className="scc-strip-item"><div className="scc-kicker">Decision latency</div><strong className="scc-highlight">11m 42s</strong><span>median time from detection to human-ready recommendation</span></div><div className="scc-strip-item"><div className="scc-kicker">Human lane</div><strong className="scc-attention">{queue.length}</strong><span>actions Sentriq will not take without a person</span></div><div className="scc-strip-item"><div className="scc-kicker">Routine lane</div><strong className="scc-highlight">142</strong><span>events resolved without adding work to the queue</span></div></div><div style={{ display: "flex", gap: 7, alignItems: "center", padding: "0 19px 16px", color: "var(--scc-muted)", fontSize: 9 }}><CircleHelp size={12} /> Policies are scoped per client and can be audited at any time.</div></section></div>
      <button className="scc-button ghost" onClick={() => onNotice("Brief prepared with the current 7-day operating window.")} type="button" style={{ marginTop: 15 }}><FileDown size={13} /> Export operating brief</button>
    </div>
  );
}

function ClientView({ selected, onSelect, queue, onReviewQueue, onNotice }: { selected: ClientData; onSelect: (key: ClientKey) => void; queue: QueueItem[]; onReviewQueue: () => void; onNotice: (message: string) => void }) {
  const clientQueue = queue.filter((item) => item.client === selected.key);
  const latestThreat = selected.key === "redwood" ? "Credential dumping attempt" : selected.key === "pine" ? "Unsigned driver loaded" : "No active threats";
  return (
    <div className="scc-section-transition">
      <div className="scc-page-head"><div><div className="scc-kicker">Tuesday · 10:50 UTC · client operations</div><h1>{selected.name}</h1><p>One client, one operating picture — with the work behind every metric.</p></div><div className="scc-page-head-tools"><div className="scc-client-toolbar"><div className="scc-select-wrap"><select className="scc-select" value={selected.key} onChange={(event) => onSelect(event.target.value as ClientKey)} aria-label="Select a client">{clients.map((client) => <option value={client.key} key={client.key}>{client.name}</option>)}</select><ChevronDown size={14} /></div><button className="scc-button primary" onClick={onReviewQueue} type="button"><PanelRight size={13} /> Queue <span style={{ opacity: .7 }}>{queue.length}</span></button></div></div></div>
      <div className="scc-client-identity"><span className={`scc-client-mark ${selected.mark}`}>{selected.initials}</span><div><strong>{selected.name}</strong><span>{selected.sector} · managed by Cedarline Security</span></div><div className="scc-client-identity-meta"><span><b>{selected.endpoints}</b> endpoints</span><span><b>{selected.lead}</b> owner</span><Status>{selected.posture} posture</Status></div></div>
      <div className="scc-client-kpi-grid"><div className="scc-client-kpi attention"><div className="scc-kicker">Threats</div><strong>{selected.threats}</strong><span>{selected.threats ? latestThreat : "No active threats"}</span></div><div className="scc-client-kpi"><div className="scc-kicker">Detections</div><strong>{selected.detections}</strong><span>observed this week</span></div><div className="scc-client-kpi attention"><div className="scc-kicker">Actions</div><strong>{selected.actions}</strong><span>{selected.actionState}</span></div><div className="scc-client-kpi good"><div className="scc-kicker">Time to action</div><strong>{selected.tta}</strong><span>{selected.ttaDelta} vs baseline</span></div><div className="scc-client-kpi good"><div className="scc-kicker">Efficiency</div><strong>{selected.triage}</strong><span>triage time reduction</span></div></div>
      <div className="scc-client-main-grid"><section className="scc-panel"><PanelHead title="Threats & detections" subtitle="What Sentriq saw and how the operating model responded." /><div className="scc-threat-list">{selected.threats > 0 ? <><div className="scc-threat"><i className="scc-threat-bar" /><div><strong>{latestThreat}</strong><span>{selected.key === "redwood" ? "RWL-FIN-07 · 8 min ago · T1003.001" : "PCM-PLANT-14 · 41 min ago · T1547.006"}</span></div><Status pending>Needs review</Status></div><div className="scc-threat"><i className="scc-threat-bar teal" /><div><strong>Suspicious process contained</strong><span>{selected.name} · signed utility chain · 2 hr ago</span></div><Status>Contained</Status></div><div className="scc-threat"><i className="scc-threat-bar amber" /><div><strong>Identity anomaly triaged</strong><span>{selected.name} · known device fingerprint · yesterday</span></div><Status>Analyst cleared</Status></div></> : <div className="scc-threat"><i className="scc-threat-bar teal" /><div><strong>No active threats</strong><span>Last meaningful detection was contained 6 hours ago.</span></div><Status>Fleet clear</Status></div>}</div></section>
        <div><section className="scc-panel"><PanelHead title="Recommended action" subtitle={clientQueue.length ? "A human decision is the only remaining step." : "No consequential work is waiting."} /><div className="scc-action-card">{clientQueue.length ? <><div className="scc-action-head"><div><div className="scc-kicker">{clientQueue[0].severity} severity</div><h3>{clientQueue[0].action}</h3></div><Status pending>Pending</Status></div><p>{clientQueue[0].description} Sentriq has assembled the evidence and held the action at the human lane.</p><div className="scc-action-meta"><div><span>Endpoint</span><b>{clientQueue[0].endpoint}</b></div><div><span>Confidence</span><b>{selected.key === "redwood" ? "98.4%" : "91.8%"}</b></div></div><div className="scc-action-buttons"><button className="scc-button approve" onClick={onReviewQueue} type="button"><Zap size={12} /> Review action</button><button className="scc-button" onClick={() => onNotice("Evidence summary copied to the operator brief.")} type="button"><FileDown size={12} /> Export evidence</button></div></> : <div className="scc-empty-notice"><CheckCircle2 size={16} /> No consequential actions. Routine work is covered.</div>}</div></section>
          <section className="scc-panel scc-efficiency"><PanelHead title="Efficiency profile" subtitle="Why this client's queue looks the way it does." /><div className="scc-efficiency-body"><div className="scc-efficiency-row"><span>Routine coverage</span><b>{selected.automation}</b></div><div className="scc-efficiency-meter"><i style={{ width: selected.automation }} /></div><div className="scc-efficiency-row"><span>Time returned this week</span><b>{selected.key === "northstar" ? "6.8 hrs" : selected.key === "redwood" ? "6.1 hrs" : "5.7 hrs"}</b></div><div className="scc-efficiency-meter"><i className="amber" style={{ width: selected.key === "northstar" ? "81%" : selected.key === "redwood" ? "73%" : "63%" }} /></div><div className="scc-insight"><Sparkles size={13} /><p><strong>High-confidence automation is doing the quiet work.</strong> {selected.routine} routine events were handled without an analyst opening the queue.</p></div></div></section>
        </div>
      </div>
      <div style={{ marginTop: 14 }}><ActivityPanel client={selected} /></div><button className="scc-button ghost" onClick={() => onNotice(`Client report for ${selected.name} is ready in the operator brief.`)} type="button" style={{ marginTop: 15 }}><FileDown size={13} /> Export client report</button>
    </div>
  );
}

type LaunchpadTarget = NavItem | "policy" | "status";

function Launchpad({ queue, selectedClient, onEnter, onOpen }: { queue: QueueItem[]; selectedClient: ClientData; onEnter: () => void; onOpen: (target: LaunchpadTarget) => void }) {
  const destinations = [
    { id: "queue" as const, label: "Decision queue", detail: "Make the calls Sentriq will not make without a person.", meta: `${queue.length} waiting`, icon: PanelRight, tone: "amber" },
    { id: "clients" as const, label: "Clients & fleet", detail: "Move from portfolio posture into one client operating picture.", meta: "3 managed accounts", icon: Network, tone: "teal" },
    { id: "capacity" as const, label: "Impact & capacity", detail: "See where routine work is returning analyst time.", meta: "18.6 hrs returned", icon: Gauge, tone: "violet" },
    { id: "policy" as const, label: "Operating controls", detail: "Review automation rules and telemetry health.", meta: "Rules & integrations", icon: ListFilter, tone: "teal" },
  ];

  return (
    <div className="scc-launchpad">
      <header className="scc-launchpad-topbar">
        <div className="scc-brand"><span className="scc-brand-mark"><ShieldCheck size={17} /></span><div className="scc-brand-copy visible"><div className="scc-brand-name">sentriq</div><div className="scc-brand-sub">MSP OPERATIONS</div></div></div>
        <div className="scc-launchpad-top-context"><span className="scc-live-dot" /> {selectedClient.name} · workspace live</div>
        <button className="scc-button scc-launchpad-skip" onClick={onEnter} type="button">Go to cockpit <ChevronRight size={13} /></button>
      </header>
      <main className="scc-launchpad-main">
        <div className="scc-launchpad-hero">
          <span className="scc-launchpad-mark"><ShieldCheck size={17} /></span>
          <div className="scc-kicker">SENTRIQ · MSP OPERATIONS</div>
          <h1>Sentriq Launchpad</h1>
          <p>The starting point for the operating picture: posture, decisions, and capacity in one focused place.</p>
          <span className="scc-launchpad-status"><span className="scc-live-dot" /> Cedarline Security · telemetry live</span>
        </div>
        <div className="scc-launchpad-signal">
          <span className="scc-launchpad-signal-icon"><Siren size={15} /></span>
          <div><b>Credential dumping attempt</b><span>Redwood Legal · RWL-FIN-07 · 8 min ago</span></div>
          <strong>{queue.length} human decisions</strong>
          <button onClick={() => onOpen("queue")} type="button">Review <ChevronRight size={12} /></button>
        </div>
        <div className="scc-launchpad-heading"><div><span className="scc-kicker">START HERE</span><h2>Choose an operating lens</h2></div><span>{queue.length} consequential actions awaiting review</span></div>
        <div className="scc-launchpad-grid">
          {destinations.map(({ id, label, detail, meta, icon: Icon, tone }) => (
            <button className="scc-launchpad-card" key={id} onClick={() => onOpen(id)} type="button">
              <span className={`scc-launchpad-card-icon ${tone}`}><Icon size={17} /></span>
              <b>{label}</b>
              <span>{detail}</span>
              <small>{meta}<ChevronRight size={12} /></small>
            </button>
          ))}
        </div>
        <div className="scc-launchpad-footer"><span><Bot size={14} /> Routine work stays in the quiet lane.</span><button className="scc-button primary" onClick={onEnter} type="button">Open operations cockpit <ChevronRight size={14} /></button></div>
        <div className="scc-launchpad-hint"><span>ESC</span> enter cockpit <span>ENTER</span> open cockpit</div>
      </main>
    </div>
  );
}

export function AdminCockpitCollapsed() {
  const [role, setRole] = useState<Role>("msp");
  const [selectedClientKey, setSelectedClientKey] = useState<ClientKey>("redwood");
  const [activeNav, setActiveNav] = useState<NavItem>("cockpit");
  const [queue, setQueue] = useState<QueueItem[]>(queueSeed);
  const [showQueue, setShowQueue] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [notice, setNotice] = useState("");
  const [showLaunchpad, setShowLaunchpad] = useState(true);
  const selectedClient = useMemo(() => getClient(selectedClientKey), [selectedClientKey]);

  const notify = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2800);
  };
  const changeRole = (nextRole: Role) => {
    setRole(nextRole);
    setActiveNav("cockpit");
    notify(nextRole === "msp" ? "MSP Admin view loaded — portfolio context restored." : `${selectedClient.name} client view loaded.`);
  };
  const resolveAction = (id: number, outcome: "approved" | "deferred") => {
    const item = queue.find((action) => action.id === id);
    if (!item) return;
    setQueue((current) => current.filter((action) => action.id !== id));
    setNotice(outcome === "approved" ? `${item.action} approved for ${getClient(item.client).name}.` : `${item.title} held for analyst review.`);
  };
  const handleNav = (item: NavItem) => {
    setActiveNav(item);
    if (item === "queue") { setShowQueue(true); return; }
    if (item === "clients") { setRole("client"); notify("Client Admin view loaded — choose a client to inspect."); }
    else if (item === "cockpit") setRole("msp");
    else notify("Capacity lens is included in the cockpit below.");
  };

  useEffect(() => {
    if (!showLaunchpad) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowLaunchpad(false);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [showLaunchpad]);

  const openLaunchpadTarget = (target: LaunchpadTarget) => {
    setShowLaunchpad(false);
    if (target === "policy") {
      notify("Operating controls opened — policy rules are scoped per client.");
      return;
    }
    if (target === "status") {
      notify("All Sentriq systems are operational.");
      return;
    }
    handleNav(target);
  };
  const openLaunchpad = () => {
    setShowQueue(false);
    setShowLaunchpad(true);
  };

  return (
    <div className="sentriq-cockpit-collapsed">
      {!showLaunchpad && <div className="scc-shell">
        <aside className={`scc-sidebar${expanded ? " expanded" : ""}`} aria-label="Sentriq navigation">
           <button className="scc-brand scc-brand-button" onClick={openLaunchpad} type="button" aria-label="Back to Sentriq Launchpad" title="Back to Sentriq Launchpad"><span className="scc-brand-mark"><ShieldCheck size={17} /></span><div className="scc-brand-copy"><div className="scc-brand-name">sentriq</div><div className="scc-brand-sub">MSP OPERATIONS</div></div></button>
          <button className="scc-rail-toggle" type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded} aria-label={expanded ? "Collapse navigation" : "Expand navigation"} title={expanded ? "Collapse navigation" : "Expand navigation"}>{expanded ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}</button>
          <div className="scc-side-label">Command center</div>
          <nav>{navItems.map(({ id, label, hint, icon: Icon }) => <button className={`scc-side-button${activeNav === id || (id === "queue" && showQueue) ? " active" : ""}`} key={id} onClick={() => handleNav(id)} type="button" aria-label={label} title={expanded ? undefined : `${label} — ${hint}`}><span className="scc-side-icon"><Icon size={15} /></span><span className="scc-side-copy"><strong>{label}</strong><small>{hint}</small></span>{id === "queue" && queue.length > 0 && <span className="scc-side-count" aria-label={`${queue.length} decisions waiting`}>{queue.length}</span>}</button>)}</nav>
          <div className="scc-role-context"><div className="scc-side-label">Viewing as</div><button className="scc-context-card" onClick={() => changeRole(role === "msp" ? "client" : "msp")} type="button" aria-label={`Switch from ${role === "msp" ? "MSP Admin" : "Client Admin"} view`} title={expanded ? undefined : `${role === "msp" ? "MSP Admin" : "Client Admin"} · ${role === "msp" ? "All clients" : selectedClient.name}`}><span className="scc-context-icon">{role === "msp" ? <Layers3 size={14} /> : <PanelRight size={14} />}</span><span className="scc-context-copy"><strong>{role === "msp" ? "MSP Admin" : "Client Admin"}</strong><small>{role === "msp" ? "All clients" : selectedClient.name}</small></span><span className="scc-context-mini">{role === "msp" ? "M" : "C"}</span><ChevronRight size={13} /></button></div>
          <div className="scc-side-label">Workspace</div>
          <button className="scc-side-button" onClick={() => notify("Policy center is available in the pilot workspace.")} type="button" aria-label="Policy center" title={expanded ? undefined : "Policy center"}><span className="scc-side-icon"><ListFilter size={16} /></span><span className="scc-side-copy"><strong>Policy center</strong><small>Scoped controls</small></span></button>
          <button className="scc-side-button" onClick={() => notify("All Sentriq systems are operational.")} type="button" aria-label="System status" title={expanded ? undefined : "System status"}><span className="scc-side-icon"><Activity size={16} /></span><span className="scc-side-copy"><strong>System status</strong><small>All systems operational</small></span><span className="scc-live-dot" style={{ marginLeft: "auto", width: 6, height: 6 }} /></button>
          <div className="scc-side-foot"><div className="scc-side-user"><span className="scc-avatar">JR</span><div className="scc-user-copy"><strong>Jordan Reyes</strong><span>Pilot operator</span></div></div></div>
        </aside>
        <main className="scc-main">
          <header className="scc-topbar"><div className="scc-breadcrumb"><span className="scc-kicker">Cedarline Security</span><ChevronRight size={13} color="var(--scc-muted)" /><strong>{role === "msp" ? "Fleet operations" : selectedClient.name}</strong><span className="scc-topbar-meta">Tuesday, 14 May 2024</span></div><div className="scc-top-actions"><button className="scc-button" onClick={() => notify(`Notifications are clear beyond the ${queue.length} action queue items.`)} type="button"><Bell size={13} /> Notifications</button><button className="scc-icon-button" aria-label="Help and documentation" onClick={() => notify("Sentriq operating guide opened in the pilot workspace.")} type="button"><CircleHelp size={16} /></button></div></header>
          <div className="scc-content"><div className="scc-role-switcher" aria-label="Switch admin role"><button className={role === "msp" ? "selected" : ""} onClick={() => changeRole("msp")} type="button"><Layers3 size={12} /> MSP Admin</button><button className={role === "client" ? "selected" : ""} onClick={() => changeRole("client")} type="button"><PanelRight size={12} /> Client Admin</button></div>{role === "msp" ? <MspView queue={queue} onReviewQueue={() => setShowQueue(true)} onSelectClient={(key) => { setSelectedClientKey(key); changeRole("client"); }} onNotice={notify} /> : <ClientView selected={selectedClient} onSelect={(key) => { setSelectedClientKey(key); notify(`${getClient(key).name} selected.`); }} queue={queue} onReviewQueue={() => setShowQueue(true)} onNotice={notify} />}</div>
        </main>
      </div>}
      {!showLaunchpad && <nav className="scc-mobile-nav" aria-label="Mobile navigation">{navItems.filter(({ id }) => id !== "queue").map(({ id, icon: Icon }) => <button className={activeNav === id ? "active" : ""} key={id} onClick={() => handleNav(id)} type="button"><Icon size={15} /><span>{id === "cockpit" ? "Cockpit" : id === "clients" ? "Clients" : "Capacity"}</span></button>)}<button className={showQueue ? "active" : ""} onClick={() => setShowQueue(true)} type="button"><PanelRight size={15} /><span>Queue {queue.length}</span></button></nav>}
      {showQueue && <ActionQueue queue={queue} onResolve={resolveAction} onClose={() => setShowQueue(false)} />}{notice && <div className="scc-toast" role="status"><CheckCircle2 size={15} color="#8ac9bc" />{notice}</div>}
      {showLaunchpad && <Launchpad queue={queue} selectedClient={selectedClient} onEnter={() => setShowLaunchpad(false)} onOpen={openLaunchpadTarget} />}
    </div>
  );
}