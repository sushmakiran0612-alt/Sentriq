import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  Bell,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  FileDown,
  Gauge,
  Info,
  Layers3,
  ListFilter,
  Network,
  PanelRight,
  ShieldCheck,
  Siren,
  Sparkles,
  UsersRound,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";

import "./AdminCockpit.css";

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
  confidence: string;
  rationale: string;
  similarActions: number;
  positiveOutcomes: number;
  evidence: { key: string; value: string; tone: "teal" | "amber" | "red" }[];
};

const clients: ClientData[] = [
  {
    key: "redwood",
    name: "Redwood Legal",
    initials: "RL",
    mark: "red",
    sector: "Legal services",
    endpoints: 74,
    posture: "98.6%",
    threats: 1,
    detections: 39,
    actions: 1,
    actionState: "1 pending",
    tta: "11m 42s",
    ttaDelta: "−4m 18s",
    triage: "−67%",
    automation: "94%",
    routine: 51,
    lead: "Maya Chen",
  },
  {
    key: "northstar",
    name: "Northstar Dental",
    initials: "ND",
    mark: "teal",
    sector: "Healthcare network",
    endpoints: 56,
    posture: "99.1%",
    threats: 0,
    detections: 31,
    actions: 0,
    actionState: "Clear",
    tta: "8m 06s",
    ttaDelta: "−3m 51s",
    triage: "−71%",
    automation: "96%",
    routine: 48,
    lead: "Eli Ramos",
  },
  {
    key: "pine",
    name: "Pine & Co. Manufacturing",
    initials: "PM",
    mark: "amber",
    sector: "Industrial manufacturing",
    endpoints: 57,
    posture: "95.8%",
    threats: 2,
    detections: 44,
    actions: 1,
    actionState: "1 pending",
    tta: "14m 27s",
    ttaDelta: "−2m 16s",
    triage: "−52%",
    automation: "89%",
    routine: 43,
    lead: "Jon Bell",
  },
];

const queueSeed: QueueItem[] = [
  {
    id: 1,
    client: "redwood",
    title: "Credential dumping attempt",
    description: "LSASS access blocked on a finance workstation.",
    endpoint: "RWL-FIN-07",
    age: "8 min ago",
    action: "Isolate endpoint",
    severity: "critical",
    confidence: "98.4%",
    rationale: "The process chain matches a known credential access pattern. Network isolation limits lateral movement while preserving the endpoint for forensic review.",
    similarActions: 42,
    positiveOutcomes: 41,
    evidence: [
      { key: "process", value: "rundll32 → lsass", tone: "red" },
      { key: "user", value: "svc-finance", tone: "amber" },
      { key: "control", value: "credential guard", tone: "teal" },
      { key: "scope", value: "single endpoint", tone: "teal" },
    ],
  },
  {
    id: 2,
    client: "pine",
    title: "Unsigned driver loaded",
    description: "New kernel driver appeared outside its maintenance window.",
    endpoint: "PCM-PLANT-14",
    age: "41 min ago",
    action: "Quarantine driver",
    severity: "high",
    confidence: "91.8%",
    rationale: "The driver signature is absent from the client's allowlist and its load path is outside the maintenance window. Quarantine limits persistence while the client confirms the change.",
    similarActions: 19,
    positiveOutcomes: 17,
    evidence: [
      { key: "driver", value: "acme-kmd.sys", tone: "red" },
      { key: "signature", value: "not trusted", tone: "amber" },
      { key: "window", value: "outside change", tone: "amber" },
      { key: "scope", value: "single endpoint", tone: "teal" },
    ],
  },
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
  return <span className={`sq-status${pending ? " pending" : ""}`}>{children}</span>;
}

function PanelHead({
  title,
  subtitle,
  action,
  onAction,
}: {
  title: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="sq-panel-head">
      <div>
        <div className="sq-panel-title">{title}</div>
        {subtitle && <div className="sq-panel-subtitle">{subtitle}</div>}
      </div>
      {action && (
        <button className="sq-panel-head-link" onClick={onAction} type="button">
          {action} <ChevronRight size={12} style={{ verticalAlign: -2 }} />
        </button>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  note,
  trend,
  featured = false,
  warning = false,
}: {
  label: string;
  value: string;
  note: string;
  trend?: string;
  featured?: boolean;
  warning?: boolean;
}) {
  return (
    <div className={`sq-metric${featured ? " featured" : ""}${warning ? " sq-metric-warning" : ""}`}>
      <div className="sq-kicker">{label}</div>
      <div className="sq-metric-value">{value}</div>
      <div className="sq-metric-note">{note}</div>
      {trend && <div className="sq-metric-trend">{trend.startsWith("−") ? <ArrowDownRight size={11} /> : <ArrowUpRight size={11} />}{trend}</div>}
    </div>
  );
}

function ClientCell({ client }: { client: ClientData }) {
  return (
    <div className="sq-client-cell">
      <span className={`sq-client-mark ${client.mark}`}>{client.initials}</span>
      <div>
        <strong>{client.name}</strong>
        <span>{client.endpoints} endpoints · {client.sector}</span>
      </div>
    </div>
  );
}

function FleetTable({ onSelectClient }: { onSelectClient: (client: ClientKey) => void }) {
  return (
    <div className="sq-table-wrap">
      <table className="sq-table">
        <thead>
          <tr>
            <th>Client</th>
            <th>Posture</th>
            <th>Events / 7d</th>
            <th>Automation</th>
            <th>Analyst time</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr key={client.key}>
              <td><button className="sq-button ghost" onClick={() => onSelectClient(client.key)} type="button" style={{ padding: 0, minHeight: 27 }}><ClientCell client={client} /></button></td>
              <td><span className="sq-number">{client.posture}</span></td>
              <td><span className="sq-number">{client.detections + client.routine}</span></td>
              <td>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div className="sq-progress"><i className={client.key === "pine" ? "amber" : undefined} style={{ width: client.automation }} /></div>
                  <span className="sq-number">{client.automation}</span>
                </div>
              </td>
              <td><span className="sq-delta">{client.triage}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CapacityPanel() {
  const capacityRows = [
    { label: "Redwood Legal", detail: "51 routine events", value: "−67%" },
    { label: "Northstar Dental", detail: "48 routine events", value: "−71%" },
    { label: "Pine & Co. Manufacturing", detail: "43 routine events", value: "−52%" },
  ];
  return (
    <section className="sq-panel">
      <PanelHead title="Analyst capacity returned" subtitle="Time Sentriq has put back in the week." />
      <div className="sq-capacity-body">
        <div className="sq-capacity-main"><div><div className="sq-kicker">Across the portfolio</div><strong>18.6 hrs</strong></div><span>this week</span></div>
        <div className="sq-capacity-bar"><i /></div>
        <div className="sq-capacity-foot"><span>26.4 hrs before Sentriq</span><span>68% recovered</span></div>
        <div className="sq-capacity-list">
          {capacityRows.map((row) => (
            <div className="sq-capacity-row" key={row.label}>
              <div><strong>{row.label}</strong><span>{row.detail}</span></div>
              <div className="sq-progress"><i style={{ width: row.value.replace("−", "") }} /></div>
              <b>{row.value}</b>
            </div>
          ))}
        </div>
        <div className="sq-capacity-gain"><strong>Northstar gains the most capacity.</strong> Its routine queue is 96% automated, returning 6.8 analyst hours this week.</div>
      </div>
    </section>
  );
}

function ActivityPanel({ client }: { client?: ClientData }) {
  const items = client
    ? [
        { icon: Bot, tone: "", title: "Routine event grouped and closed", detail: `${client.name} · ${client.lead}`, time: "09:48" },
        { icon: ShieldCheck, tone: "", title: "Endpoint posture check passed", detail: `${client.endpoints} of ${client.endpoints} endpoints reporting`, time: "09:22" },
        { icon: Siren, tone: client.actions ? "amber" : "", title: client.actions ? "Consequential action needs review" : "Detection contained automatically", detail: client.actions ? "Sentriq recommendation is ready" : "No analyst intervention required", time: "08:56" },
      ]
    : [
        { icon: CheckCircle2, tone: "", title: "142 routine events handled", detail: "High-confidence policies · across 3 clients", time: "10:42" },
        { icon: UsersRound, tone: "", title: "Northstar gained 6.8 analyst hours", detail: "Largest capacity return in the portfolio", time: "10:16" },
        { icon: PanelRight, tone: "amber", title: "2 consequential actions are waiting", detail: "Human approval remains required", time: "10:09" },
      ];
  return (
    <section className="sq-panel">
      <PanelHead title={client ? "Recent activity" : "Operator signal"} subtitle={client ? "The events behind this client's numbers." : "The few things worth a human glance."} />
      <div className="sq-activity-list">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div className="sq-activity" key={item.title}>
              <span className={`sq-activity-icon ${item.tone}`}><Icon size={13} /></span>
              <div className="sq-activity-copy"><strong>{item.title}</strong><span>{item.detail}</span></div>
              <time>{item.time}</time>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ActionQueue({
  queue,
  onOpen,
  onClose,
}: {
  queue: QueueItem[];
  onOpen: (id: number) => void;
  onClose: () => void;
}) {
  return (
    <aside className="sq-queue-drawer" aria-label="Consequential action queue">
      <div className="sq-queue-drawer-head">
        <div><strong>Consequential queue</strong><span>Human decisions only · {queue.length} waiting</span></div>
        <button className="sq-icon-button" onClick={onClose} aria-label="Close action queue" type="button"><X size={14} /></button>
      </div>
      {queue.length === 0 ? (
        <div style={{ padding: "26px 17px" }} className="sq-empty-notice"><CheckCircle2 size={15} /> Queue clear. Sentriq is watching.</div>
      ) : queue.map((item) => (
        <div className="sq-queue-item" key={item.id}>
          <i className={item.severity === "high" ? "amber" : undefined} />
          <div>
            <strong>{item.title}</strong>
            <p>{item.description} <span style={{ fontFamily: "var(--sq-font-mono)" }}>{item.endpoint}</span></p>
            <div className="sq-queue-item-actions">
              <button className="sq-button approve" onClick={() => onOpen(item.id)} type="button"><Zap size={12} /> Review action</button>
            </div>
          </div>
        </div>
      ))}
    </aside>
  );
}

const decisionExamples = [
  { label: "High confidence", score: 98.4, detail: "41 of 42 similar actions produced a positive outcome", tone: "high" },
  { label: "Medium confidence", score: 84.2, detail: "16 of 19 similar actions produced a positive outcome", tone: "medium" },
  { label: "Low confidence", score: 73.5, detail: "14 of 19 similar actions produced a positive outcome", tone: "low" },
];

function DecisionAction({
  item,
  feedbackNote,
  automationEnabled,
  onBack,
  onNotice,
  onResolve,
  onSetAutomation,
}: {
  item: QueueItem;
  feedbackNote: string;
  automationEnabled: boolean;
  onBack: () => void;
  onNotice: (message: string) => void;
  onResolve: (id: number, outcome: "approved" | "no_action", automate: boolean, reasoning: string) => void;
  onSetAutomation: (id: number, enabled: boolean) => void;
}) {
  const score = Number.parseFloat(item.confidence);
  const band = score >= 90 ? "high" : score >= 80 ? "medium" : "low";
  const canAutomate = score >= 90;
  const [automationChoice, setAutomationChoice] = useState<boolean | null>(automationEnabled && canAutomate ? true : null);
  const [draftReasoning, setDraftReasoning] = useState(feedbackNote);
  const [reasonError, setReasonError] = useState(false);

  const saveDecision = (outcome: "approved" | "no_action", automate = false) => {
    const reasoning = draftReasoning.trim();
    if (!reasoning) {
      setReasonError(true);
      onNotice("Add an operator reason before saving this decision.");
      return;
    }
    onResolve(item.id, outcome, automate, reasoning);
  };

  const chooseAutomation = (enabled: boolean) => {
    setAutomationChoice(enabled);
    setReasonError(false);
    if (!enabled) onSetAutomation(item.id, false);
  };

  return (
    <div className="sq-section-transition sq-decision-view">
      <div className="sq-page-head">
        <div>
          <div className="sq-kicker">Decision action · {getClient(item.client).name} · {item.endpoint}</div>
          <h1>{item.title}</h1>
          <p>Make the call once, then teach Sentriq which decisions it can safely handle for you.</p>
        </div>
        <button className="sq-button ghost" onClick={onBack} type="button"><ArrowLeft size={13} /> Back to queue</button>
      </div>

      <div className="sq-decision-grid">
        <div className="sq-decision-main">
          <section className="sq-panel sq-decision-hero">
            <div className="sq-decision-hero-top">
              <div>
                <div className="sq-kicker">{item.severity} severity · recommended response</div>
                <h2>{item.action}</h2>
                <p>{item.description}</p>
              </div>
              <Status pending>Awaiting decision</Status>
            </div>
            <div className="sq-decision-context">
              <div><span>Client</span><strong>{getClient(item.client).name}</strong><small>{item.endpoint}</small></div>
              <div><span>Observed</span><strong>{item.age}</strong><small>decision queue</small></div>
              <div><span>Model read</span><strong>{band === "high" ? "High confidence" : band === "medium" ? "Medium confidence" : "Low confidence"}</strong><small>{item.confidence} match confidence</small></div>
            </div>
          </section>

          <section className="sq-panel" aria-labelledby="sq-confidence-title">
            <div className="sq-panel-head">
              <div><div className="sq-panel-title" id="sq-confidence-title">Machine-learned confidence</div><div className="sq-panel-subtitle">How strongly Sentriq recommends this remediation based on prior outcomes.</div></div>
              <span className={`sq-confidence-pill ${band}`}>{band === "high" ? "High confidence" : band === "medium" ? "Medium confidence" : "Low confidence"}</span>
            </div>
            <div className="sq-decision-confidence-body">
              <div className="sq-decision-score-row"><div><span className="sq-kicker">Current decision score</span><strong>{item.confidence}</strong></div><span>Automation threshold <b>90%</b></span></div>
              <div className="sq-confidence-meter-wrap">
                <div className="sq-confidence-meter" role="meter" aria-label={`${item.confidence} confidence`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={score}>
                  <span className="sq-confidence-threshold" style={{ left: "90%" }} />
                  <i style={{ left: `${score}%` }} />
                </div>
                <div className="sq-confidence-scale"><span>Low</span><span>Medium</span><span>High</span></div>
              </div>
              <div className="sq-decision-explainer"><Info size={15} /><p><strong>Why this score?</strong> Based on {item.similarActions} previous similar actions, {item.positiveOutcomes} produced a positive outcome without analyst rollback.</p></div>
              <div className="sq-decision-examples">
                <div className="sq-kicker">See the decision pattern</div>
                <div className="sq-confidence-example-grid">
                  {decisionExamples.map((example) => (
                    <div className={`sq-confidence-example ${example.tone}`} key={example.label}>
                      <div><strong>{example.label}</strong><span>{example.score}%</span></div>
                      <div className="sq-confidence-mini-meter"><i style={{ width: `${example.score}%` }} /></div>
                      <p>{example.detail}</p>
                      <small>{example.score >= 90 ? "Turn on automation" : "Keep human review"}</small>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="sq-panel" aria-labelledby="sq-evidence-title">
            <div className="sq-panel-head"><div><div className="sq-panel-title" id="sq-evidence-title">Evidence & rationale</div><div className="sq-panel-subtitle">The record behind this recommendation stays visible before you act.</div></div></div>
            <div className="sq-decision-evidence-body">
              <div className="sq-evidence-box">
                <div className="sq-evidence-label"><span>Observed evidence</span><span>{item.confidence} confidence</span></div>
                <div className="sq-evidence-code">
                  {item.evidence.map((entry) => <div key={entry.key}><span>{entry.key.padEnd(12, " ")}</span><b className={entry.tone}>{entry.value}</b></div>)}
                </div>
              </div>
              <div className="sq-decision-rationale"><Sparkles size={13} /><p><strong>Sentriq recommendation</strong>{item.rationale}</p></div>
            </div>
          </section>
        </div>

        <aside className="sq-decision-side">
          <section className={`sq-panel sq-automation-panel ${canAutomate ? "eligible" : "locked"} ${automationChoice === false ? "collapsed" : ""}`}>
            {automationChoice === false ? (
              <div className="sq-automation-collapsed"><div><CheckCircle2 size={15} /><strong>Automation: No</strong><span>Human review selected</span></div><button onClick={() => { setAutomationChoice(null); setReasonError(false); }} type="button">Undo</button></div>
            ) : (
              <>
                <div className="sq-panel-head"><div><div className="sq-panel-title">Turn on automation?</div><div className="sq-panel-subtitle">{automationChoice ? "Approve this action and apply the policy going forward." : "Choose whether Sentriq should handle future matching decisions."}</div></div><Bot size={18} color="var(--sq-teal)" /></div>
                <div className="sq-automation-body">
                  <div className="sq-automation-status"><span className={automationChoice ? "selected" : ""} /><div><strong>{automationChoice ? (automationEnabled ? "Automation is on" : "Yes selected — ready to approve") : "No automation decision yet"}</strong><small>{automationEnabled ? `Future matching ${item.title.toLowerCase()} decisions will be handled automatically.` : canAutomate ? "This decision type clears the 90% safety threshold." : "This score is below the 90% threshold, so Sentriq will ask you each time."}</small></div></div>
                  <div className="sq-automation-question"><span>For future matching decisions</span><strong>Should Sentriq take this action automatically?</strong></div>
                  <div className="sq-automation-choice" role="group" aria-label="Choose whether to turn on automation">
                    <button className={automationChoice === true ? "selected yes" : "yes"} onClick={() => chooseAutomation(true)} disabled={!canAutomate} type="button"><CheckCircle2 size={15} /><span><b>Yes</b><small>Turn on automation</small></span></button>
                    <button className="no" onClick={() => chooseAutomation(false)} type="button"><X size={15} /><span><b>No</b><small>Keep human review</small></span></button>
                  </div>
                  <div className="sq-automation-lock"><Info size={13} />{canAutomate ? "Choose Yes to approve and automate, or No to keep human review." : "Yes is locked until confidence reaches 90%. Choose No to keep human review."}</div>
                  {automationChoice === true && canAutomate && (
                    <div className="sq-automation-approval">
                      <label htmlFor="sq-automation-reasoning">Reason for automation <span>Required</span></label>
                      <textarea id="sq-automation-reasoning" value={draftReasoning} onChange={(event) => { setDraftReasoning(event.target.value); setReasonError(false); }} placeholder="e.g. The evidence pattern is stable across prior reviews." aria-describedby={reasonError ? "sq-reason-error" : undefined} />
                      {reasonError && <small className="sq-reason-error" id="sq-reason-error">Add a short reason to save this decision.</small>}
                      <button className="sq-button approve" onClick={() => saveDecision("approved", true)} type="button"><Check size={13} /> Approve action and automate</button>
                    </div>
                  )}
                </div>
              </>
            )}
          </section>

          {automationChoice === false && (
            <section className="sq-panel sq-decision-controls">
              <div className="sq-panel-head"><div><div className="sq-panel-title">Your decision</div><div className="sq-panel-subtitle">Approve the action now or leave the endpoint unchanged.</div></div></div>
              <div className="sq-decision-controls-body">
                <div className="sq-proposed-action"><span className="sq-kicker">Proposed remediation</span><strong>{item.action}</strong></div>
                <label htmlFor="sq-decision-reasoning">Reason for decision <span>Required</span></label>
                <textarea id="sq-decision-reasoning" value={draftReasoning} onChange={(event) => { setDraftReasoning(event.target.value); setReasonError(false); }} placeholder="e.g. Keep this in human review because the client context is still ambiguous." aria-describedby={reasonError ? "sq-reason-error-human" : undefined} />
                {reasonError && <small className="sq-reason-error" id="sq-reason-error-human">Add a short reason to save this decision.</small>}
                <div className="sq-decision-actions"><button className="sq-button approve" onClick={() => saveDecision("approved")} type="button"><Check size={13} /> Approve action</button><button className="sq-button no-action" onClick={() => saveDecision("no_action")} type="button"><X size={13} /> No Action</button></div>
                <div className="sq-decision-note"><ShieldCheck size={13} />Approve runs the simulated remediation. No Action leaves the endpoint unchanged.</div>
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

function MspView({
  queue,
  onReviewQueue,
  onSelectClient,
  onNotice,
}: {
  queue: QueueItem[];
  onReviewQueue: () => void;
  onSelectClient: (client: ClientKey) => void;
  onNotice: (message: string) => void;
}) {
  const totalEndpoints = clients.reduce((sum, client) => sum + client.endpoints, 0);
  const totalEvents = clients.reduce((sum, client) => sum + client.detections + client.routine, 0);
  return (
    <div className="sq-section-transition">
      <div className="sq-page-head">
        <div>
          <div className="sq-kicker">Tuesday · 10:50 UTC · MSP overview</div>
          <h1>Good morning, Jordan.</h1>
          <p>The fleet is quiet. Two consequential actions still need your call.</p>
        </div>
        <div className="sq-page-head-tools">
          <span className="sq-live"><span className="sq-live-dot" /> Fleet telemetry live</span>
          <button className="sq-button primary" onClick={onReviewQueue} type="button"><PanelRight size={13} /> Review queue <span style={{ opacity: .7 }}>{queue.length}</span></button>
        </div>
      </div>

      <div className="sq-metrics">
        <Metric label="Portfolio posture" value="97.8%" note={`${totalEndpoints} endpoints · 3 clients`} featured />
        <Metric label="Needs review" value={String(queue.length)} note="high-impact actions waiting" warning />
        <Metric label="Routine handled" value="142" note="events · last 7 days" trend="↑ 18 vs last week" />
        <Metric label="Triage time" value="−63%" note="pilot baseline · 7 days" trend="↑ 9 pts this week" />
        <Metric label="Automation coverage" value="93%" note={`${totalEvents} events observed`} trend="high-confidence only" />
      </div>

      <div className="sq-grid">
        <section className="sq-panel">
          <PanelHead title="Portfolio posture" subtitle="Where the fleet is healthy, noisy, or asking for attention." action="Open client view" onAction={() => onSelectClient("redwood")} />
          <FleetTable onSelectClient={onSelectClient} />
        </section>
        <CapacityPanel />
      </div>

      <div className="sq-bottom-grid">
        <ActivityPanel />
        <section className="sq-panel">
          <PanelHead title="Efficiency, at a glance" subtitle="The operating model behind the numbers." />
          <div className="sq-strip">
            <div className="sq-strip-item"><div className="sq-kicker">Decision latency</div><strong className="sq-highlight">11m 42s</strong><span>median time from detection to human-ready recommendation</span></div>
            <div className="sq-strip-item"><div className="sq-kicker">Human lane</div><strong className="sq-attention">2</strong><span>actions Sentriq will not take without a person</span></div>
            <div className="sq-strip-item"><div className="sq-kicker">Routine lane</div><strong className="sq-highlight">142</strong><span>events resolved without adding work to the queue</span></div>
          </div>
          <div style={{ display: "flex", gap: 7, alignItems: "center", padding: "0 19px 16px", color: "var(--sq-muted)", fontSize: 9 }}><CircleHelp size={12} /> Policies are scoped per client and can be audited at any time.</div>
        </section>
      </div>
      <button className="sq-button ghost" onClick={() => onNotice("Brief prepared with the current 7-day operating window.")} type="button" style={{ marginTop: 15 }}><FileDown size={13} /> Export operating brief</button>
    </div>
  );
}

function ClientView({
  selected,
  onSelect,
  queue,
  onReviewQueue,
  onNotice,
}: {
  selected: ClientData;
  onSelect: (key: ClientKey) => void;
  queue: QueueItem[];
  onReviewQueue: () => void;
  onNotice: (message: string) => void;
}) {
  const clientQueue = queue.filter((item) => item.client === selected.key);
  const latestThreat = selected.key === "redwood" ? "Credential dumping attempt" : selected.key === "pine" ? "Unsigned driver loaded" : "No active threats";
  return (
    <div className="sq-section-transition">
      <div className="sq-page-head">
        <div>
          <div className="sq-kicker">Tuesday · 10:50 UTC · client operations</div>
          <h1>{selected.name}</h1>
          <p>One client, one operating picture — with the work behind every metric.</p>
        </div>
        <div className="sq-page-head-tools">
          <div className="sq-client-toolbar">
            <div className="sq-select-wrap">
              <select className="sq-select" value={selected.key} onChange={(event) => onSelect(event.target.value as ClientKey)} aria-label="Select a client">
                {clients.map((client) => <option value={client.key} key={client.key}>{client.name}</option>)}
              </select>
              <ChevronDown size={14} />
            </div>
            <button className="sq-button primary" onClick={onReviewQueue} type="button"><PanelRight size={13} /> Queue <span style={{ opacity: .7 }}>{queue.length}</span></button>
          </div>
        </div>
      </div>

      <div className="sq-client-identity">
        <span className={`sq-client-mark ${selected.mark}`}>{selected.initials}</span>
        <div><strong>{selected.name}</strong><span>{selected.sector} · managed by Cedarline Security</span></div>
        <div className="sq-client-identity-meta"><span><b>{selected.endpoints}</b> endpoints</span><span><b>{selected.lead}</b> owner</span><Status>{selected.posture} posture</Status></div>
      </div>

      <div className="sq-client-kpi-grid">
        <div className="sq-client-kpi attention"><div className="sq-kicker">Threats</div><strong>{selected.threats}</strong><span>{selected.threats ? latestThreat : "No active threats"}</span></div>
        <div className="sq-client-kpi"><div className="sq-kicker">Detections</div><strong>{selected.detections}</strong><span>observed this week</span></div>
        <div className="sq-client-kpi attention"><div className="sq-kicker">Actions</div><strong>{selected.actions}</strong><span>{selected.actionState}</span></div>
        <div className="sq-client-kpi good"><div className="sq-kicker">Time to action</div><strong>{selected.tta}</strong><span>{selected.ttaDelta} vs baseline</span></div>
        <div className="sq-client-kpi good"><div className="sq-kicker">Efficiency</div><strong>{selected.triage}</strong><span>triage time reduction</span></div>
      </div>

      <div className="sq-client-main-grid">
        <section className="sq-panel">
          <PanelHead title="Threats & detections" subtitle="What Sentriq saw and how the operating model responded." />
          <div className="sq-threat-list">
            {selected.threats > 0 ? (
              <>
                <div className="sq-threat"><i className="sq-threat-bar" /><div><strong>{latestThreat}</strong><span>{selected.key === "redwood" ? "RWL-FIN-07 · 8 min ago · T1003.001" : "PCM-PLANT-14 · 41 min ago · T1547.006"}</span></div><Status pending>Needs review</Status></div>
                <div className="sq-threat"><i className="sq-threat-bar teal" /><div><strong>Suspicious process contained</strong><span>{selected.name} · signed utility chain · 2 hr ago</span></div><Status>Contained</Status></div>
                <div className="sq-threat"><i className="sq-threat-bar amber" /><div><strong>Identity anomaly triaged</strong><span>{selected.name} · known device fingerprint · yesterday</span></div><Status>Analyst cleared</Status></div>
              </>
            ) : (
              <div className="sq-threat"><i className="sq-threat-bar teal" /><div><strong>No active threats</strong><span>Last meaningful detection was contained 6 hours ago.</span></div><Status>Fleet clear</Status></div>
            )}
          </div>
        </section>
        <div>
          <section className="sq-panel">
            <PanelHead title="Recommended action" subtitle={clientQueue.length ? "A human decision is the only remaining step." : "No consequential work is waiting."} />
            <div className="sq-action-card">
              {clientQueue.length ? (
                <>
                  <div className="sq-action-head"><div><div className="sq-kicker">{clientQueue[0].severity} severity</div><h3>{clientQueue[0].action}</h3></div><Status pending>Pending</Status></div>
                  <p>{clientQueue[0].description} Sentriq has assembled the evidence and held the action at the human lane.</p>
                  <div className="sq-action-meta"><div><span>Endpoint</span><b>{clientQueue[0].endpoint}</b></div><div><span>Confidence</span><b>{selected.key === "redwood" ? "98.4%" : "91.8%"}</b></div></div>
                  <div className="sq-action-buttons"><button className="sq-button approve" onClick={onReviewQueue} type="button"><Zap size={12} /> Review action</button><button className="sq-button" onClick={() => onNotice("Evidence summary copied to the operator brief.")} type="button"><FileDown size={12} /> Export evidence</button></div>
                </>
              ) : (
                <div className="sq-empty-notice"><CheckCircle2 size={16} /> No consequential actions. Routine work is covered.</div>
              )}
            </div>
          </section>
          <section className="sq-panel sq-efficiency">
            <PanelHead title="Efficiency profile" subtitle="Why this client's queue looks the way it does." />
            <div className="sq-efficiency-body">
              <div className="sq-efficiency-row"><span>Routine coverage</span><b>{selected.automation}</b></div>
              <div className="sq-efficiency-meter"><i style={{ width: selected.automation }} /></div>
              <div className="sq-efficiency-row"><span>Time returned this week</span><b>{selected.key === "northstar" ? "6.8 hrs" : selected.key === "redwood" ? "6.1 hrs" : "5.7 hrs"}</b></div>
              <div className="sq-efficiency-meter"><i className="amber" style={{ width: selected.key === "northstar" ? "81%" : selected.key === "redwood" ? "73%" : "63%" }} /></div>
              <div className="sq-insight"><Sparkles size={13} /><p><strong>High-confidence automation is doing the quiet work.</strong> {selected.routine} routine events were handled without an analyst opening the queue.</p></div>
            </div>
          </section>
        </div>
      </div>
      <div style={{ marginTop: 14 }}><ActivityPanel client={selected} /></div>
      <button className="sq-button ghost" onClick={() => onNotice(`Client report for ${selected.name} is ready in the operator brief.`)} type="button" style={{ marginTop: 15 }}><FileDown size={13} /> Export client report</button>
    </div>
  );
}

type WorkbenchTarget = "queue" | "clients" | "capacity" | "policy" | "status";

function WorkbenchEntry({
  queueCount,
  selectedClient,
  onEnter,
  onClose,
  onOpen,
}: {
  queueCount: number;
  selectedClient: ClientData;
  onEnter: () => void;
  onClose: () => void;
  onOpen: (target: WorkbenchTarget) => void;
}) {
  const destinations: {
    id: WorkbenchTarget;
    label: string;
    detail: string;
    meta: string;
    icon: LucideIcon;
    tone: "teal" | "amber" | "violet";
  }[] = [
    {
      id: "queue",
      label: "Decision queue",
      detail: "Consequential actions that still need a human call.",
      meta: queueCount ? `${queueCount} waiting` : "Queue clear",
      icon: PanelRight,
      tone: "amber",
    },
    {
      id: "clients",
      label: "Clients & fleet",
      detail: "Open a client lens across posture, detections, and actions.",
      meta: "3 managed accounts",
      icon: Network,
      tone: "teal",
    },
    {
      id: "capacity",
      label: "Impact & capacity",
      detail: "See the analyst hours returned by the operating model.",
      meta: "18.6 hrs returned",
      icon: Gauge,
      tone: "violet",
    },
    {
      id: "policy",
      label: "Policy center",
      detail: "Review the rules that keep routine work in the quiet lane.",
      meta: "High-confidence policies",
      icon: ListFilter,
      tone: "teal",
    },
    {
      id: "status",
      label: "System status",
      detail: "Confirm telemetry and workspace health at a glance.",
      meta: "All systems operational",
      icon: Activity,
      tone: "violet",
    },
  ];

  return (
    <main className="sq-workbench-backdrop" aria-label="Sentriq Workbench landing page">
      <div className="sq-workbench-landing-bar">
        <div className="sq-workbench-landing-brand">
          <span className="sq-workbench-landing-mark"><ShieldCheck size={14} /></span>
          <span><strong>sentriq</strong><small>MSP OPERATIONS</small></span>
        </div>
        <div className="sq-workbench-landing-meta">
          <span>Cedarline Security</span>
          <span className="sq-workbench-landing-status"><span className="sq-live-dot" /> Workspace live</span>
          <button className="sq-workbench-skip" onClick={onClose} title="Skip to cockpit (Esc)" type="button"><ArrowLeft size={13} /> Go to cockpit</button>
        </div>
      </div>
      <section className="sq-workbench-panel" aria-labelledby="sq-workbench-title">
        <div className="sq-workbench-heading">
          <div className="sq-workbench-mark"><ShieldCheck size={15} /></div>
          <div className="sq-workbench-kicker">SENTRIQ · MSP OPERATIONS</div>
          <h1 id="sq-workbench-title">Sentriq Workbench</h1>
          <p>Your focused cockpit for fleet posture, human review, and analyst capacity.</p>
          <span className="sq-workbench-live"><span className="sq-live-dot" /> Cedarline Security · workspace live</span>
        </div>

        <div className="sq-workbench-metrics" aria-label="Current workspace metrics">
          <div className="sq-workbench-metric"><span>Fleet posture</span><strong>97.8%</strong><small>187 endpoints</small></div>
          <div className="sq-workbench-metric"><span>Automation coverage</span><strong>93%</strong><small>high-confidence only</small></div>
          <div className="sq-workbench-metric"><span>Routine handled</span><strong>142</strong><small>events · last 7 days</small></div>
          <div className="sq-workbench-metric"><span>Human lane</span><strong className="attention">{queueCount}</strong><small>actions awaiting review</small></div>
        </div>

        <div className="sq-workbench-destination-head">
          <div><span className="sq-workbench-eyebrow">Start with a workspace</span><strong>What needs your attention?</strong></div>
          <span className="sq-workbench-context">{selectedClient.name} selected</span>
        </div>
        <div className="sq-workbench-destinations">
          {destinations.map(({ id, label, detail, meta, icon: Icon, tone }) => (
            <button className="sq-workbench-destination" key={id} onClick={() => onOpen(id)} type="button">
              <span className={`sq-workbench-destination-icon ${tone}`}><Icon size={17} /></span>
              <strong>{label}</strong>
              <span>{detail}</span>
              <small>{meta}<ChevronRight size={12} /></small>
            </button>
          ))}
        </div>

        <div className="sq-workbench-footer">
          <span>Everything stays in the Sentriq operating picture.</span>
          <button className="sq-workbench-primary" onClick={onEnter} type="button">Open operations cockpit <ChevronRight size={15} /></button>
        </div>
        <div className="sq-workbench-hint"><span>ESC</span> go to cockpit <span className="sq-workbench-hint-divider" /> <span>ENTER</span> open selected workspace</div>
      </section>
    </main>
  );
}

export function AdminCockpit() {
  const isActionPreview = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("state") === "action";
  const [role, setRole] = useState<Role>("msp");
  const [selectedClientKey, setSelectedClientKey] = useState<ClientKey>("redwood");
  const [activeNav, setActiveNav] = useState<NavItem>("cockpit");
  const [queue, setQueue] = useState<QueueItem[]>(queueSeed);
  const [showQueue, setShowQueue] = useState(false);
  const [actionReviewId, setActionReviewId] = useState<number | null>(() => isActionPreview ? queueSeed[0]?.id ?? null : null);
  const [automationPolicies, setAutomationPolicies] = useState<Record<number, boolean>>({});
  const [feedbackNotes, setFeedbackNotes] = useState<Record<number, string>>({});
  const [notice, setNotice] = useState("");
  const [showWorkbench, setShowWorkbench] = useState(!isActionPreview);
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

  const resolveAction = (id: number, outcome: "approved" | "no_action", automate = false, reasoning = "") => {
    const item = queue.find((action) => action.id === id);
    if (!item) return;
    setQueue((current) => current.filter((action) => action.id !== id));
    if (reasoning) setFeedbackNotes((current) => ({ ...current, [id]: reasoning }));
    if (automate) setAutomationPolicies((current) => ({ ...current, [id]: true }));
    setActionReviewId(null);
    setShowQueue(false);
    setNotice(outcome === "approved" ? `${item.action} approved${automate ? " and automation enabled" : ""} for ${getClient(item.client).name}.` : `No Action recorded for ${getClient(item.client).name}.`);
  };

  const handleNav = (item: NavItem) => {
    setActionReviewId(null);
    setActiveNav(item);
    if (item === "queue") {
      setShowQueue(true);
      return;
    }
    if (item === "clients") {
      setRole("client");
      notify("Client Admin view loaded — choose a client to inspect.");
    } else if (item === "cockpit") {
      setRole("msp");
    } else {
      notify("Capacity lens is included in the cockpit below.");
    }
  };

  const openActionReview = (id: number) => {
    setActionReviewId(id);
    setShowQueue(false);
    setActiveNav("queue");
  };

  const actionReviewItem = actionReviewId === null ? undefined : queue.find((item) => item.id === actionReviewId);

  useEffect(() => {
    if (!showWorkbench) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowWorkbench(false);
        setNotice("Workbench closed — operations cockpit ready.");
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [showWorkbench]);

  const openWorkbenchDestination = (target: WorkbenchTarget) => {
    setShowWorkbench(false);
    if (target === "policy") {
      notify("Policy center is available in the pilot workspace.");
      return;
    }
    if (target === "status") {
      notify("All Sentriq systems are operational.");
      return;
    }
    handleNav(target);
  };

  return (
    <div className="sentriq-cockpit">
      {showWorkbench ? (
        <WorkbenchEntry queueCount={queue.length} selectedClient={selectedClient} onEnter={() => setShowWorkbench(false)} onClose={() => { setShowWorkbench(false); notify("Workbench skipped — operations cockpit ready."); }} onOpen={openWorkbenchDestination} />
      ) : (
        <>
          <div className="sq-shell">
            <aside className="sq-sidebar" aria-label="Sentriq navigation">
          <div className="sq-brand"><span className="sq-brand-mark"><ShieldCheck size={17} /></span><div><div className="sq-brand-name">sentriq</div><div className="sq-brand-sub">MSP OPERATIONS</div></div></div>
          <div className="sq-side-label">Command center</div>
          <nav>
            {navItems.map(({ id, label, hint, icon: Icon }) => (
              <button className={`sq-side-button${activeNav === id || (id === "queue" && showQueue) ? " active" : ""}`} key={id} onClick={() => handleNav(id)} type="button">
                <span className="sq-side-icon"><Icon size={15} /></span>
                <span className="sq-side-copy"><strong>{label}</strong><small>{hint}</small></span>
                {id === "queue" && queue.length > 0 && <span className="sq-side-count">{queue.length}</span>}
              </button>
            ))}
          </nav>
           <div className="sq-side-label sq-workspace-label"><span>Workspace</span><small>Operating controls</small></div>
           <button className="sq-side-button sq-workspace-button" title="Review automation rules" onClick={() => notify("Policy center: review automation rules and thresholds in the pilot workspace.")} type="button">
             <span className="sq-side-icon"><ListFilter size={15} /></span>
             <span className="sq-side-copy"><strong>Policy center</strong><small>Automation rules</small></span>
             <ChevronRight size={13} />
           </button>
           <button className="sq-side-button sq-workspace-button" title="Check telemetry and integrations" onClick={() => notify("System status: all Sentriq telemetry is operational.")} type="button">
             <span className="sq-side-icon"><Activity size={15} /></span>
             <span className="sq-side-copy"><strong>System status</strong><small>Telemetry &amp; integrations</small></span>
             <span className="sq-workspace-status"><span className="sq-live-dot" /><ChevronRight size={13} /></span>
           </button>
          <div className="sq-side-foot"><div className="sq-side-user"><span className="sq-avatar">JR</span><div><strong>Jordan Reyes</strong><span>Pilot operator</span></div></div></div>
            </aside>

            <main className="sq-main">
          <header className="sq-topbar">
            <div className="sq-breadcrumb"><span className="sq-kicker">Cedarline Security</span><ChevronRight size={13} color="var(--sq-muted)" /><strong>{role === "msp" ? "Fleet operations" : selectedClient.name}</strong><span className="sq-topbar-meta">Tuesday, 14 May 2024</span></div>
            <div className="sq-top-actions">
               <button className="sq-user-role" onClick={() => changeRole(role === "msp" ? "client" : "msp")} aria-label={`Signed in as ${role === "msp" ? "MSP Admin" : "Client Admin"}. Switch role context`} title="Switch role context" type="button">
                 <span className="sq-user-role-avatar">{role === "msp" ? <Layers3 size={14} /> : <PanelRight size={14} />}</span>
                 <span className="sq-user-role-copy"><small>Signed in as</small><strong>{role === "msp" ? "MSP Admin" : "Client Admin"}</strong></span>
                 <ChevronDown size={13} />
               </button>
              <button className="sq-button" onClick={() => notify("Notifications are clear beyond the 2 action queue items.")} type="button"><Bell size={13} /> Notifications</button>
              <button className="sq-icon-button" aria-label="Help and documentation" onClick={() => notify("Sentriq operating guide opened in the pilot workspace.")} type="button"><CircleHelp size={16} /></button>
            </div>
          </header>

          <div className="sq-content">
            {actionReviewItem ? (
              <DecisionAction
                key={actionReviewItem.id}
                item={actionReviewItem}
                feedbackNote={feedbackNotes[actionReviewItem.id] ?? ""}
                automationEnabled={automationPolicies[actionReviewItem.id] ?? false}
                onBack={() => { setActionReviewId(null); setShowQueue(true); }}
                onNotice={notify}
                onResolve={resolveAction}
                onSetAutomation={(id, enabled) => setAutomationPolicies((current) => ({ ...current, [id]: enabled }))}
              />
            ) : role === "msp" ? (
              <MspView queue={queue} onReviewQueue={() => setShowQueue(true)} onSelectClient={(key) => { setSelectedClientKey(key); changeRole("client"); }} onNotice={notify} />
            ) : (
              <ClientView selected={selectedClient} onSelect={(key) => { setSelectedClientKey(key); notify(`${getClient(key).name} selected.`); }} queue={queue} onReviewQueue={() => setShowQueue(true)} onNotice={notify} />
            )}
          </div>
            </main>
          </div>

          <nav className="sq-mobile-nav" aria-label="Mobile navigation">
        {navItems.filter(({ id }) => id !== "queue").map(({ id, label, icon: Icon }) => (
          <button className={activeNav === id ? "active" : ""} key={id} onClick={() => handleNav(id)} type="button"><Icon size={15} /><span>{id === "cockpit" ? "Cockpit" : id === "clients" ? "Clients" : "Capacity"}</span></button>
        ))}
        <button onClick={() => setShowQueue(true)} type="button"><PanelRight size={15} /><span>Queue {queue.length}</span></button>
          </nav>
          {showQueue && <ActionQueue queue={queue} onOpen={openActionReview} onClose={() => setShowQueue(false)} />}
        </>
      )}
      {notice && <div className="sq-toast" role="status"><CheckCircle2 size={15} color="#8ac9bc" />{notice}</div>}
    </div>
  );
}