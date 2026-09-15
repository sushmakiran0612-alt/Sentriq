import { useMemo, type ReactNode } from 'react';
import {
  ArrowDownRight,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  FileDown,
  PanelRight,
  ShieldCheck,
  Siren,
  Sparkles,
  UsersRound,
  Zap,
} from 'lucide-react';

import './admin-cockpit.css';

export type AdminRole = 'msp' | 'technician' | 'client';
export type ClientKey = string;

export type CockpitAlert = {
  id: number;
  title: string;
  client: string;
  endpoint: string;
  age: string;
  action: string;
  severity: 'critical' | 'high' | 'medium';
  status: string;
  confidence: string;
  description: string;
};

type ClientProfile = {
  key: ClientKey;
  name: string;
  initials: string;
  mark: 'teal' | 'amber' | 'red';
  sector: string;
  endpoints: number;
  posture: string;
  detections: number;
  tta: string;
  ttaDelta: string;
  triage: string;
  automation: string;
  routine: number;
  lead: string;
};

const clientProfiles: ClientProfile[] = [
  {
    key: 'redwood',
    name: 'Redwood Legal',
    initials: 'RL',
    mark: 'red',
    sector: 'Legal services',
    endpoints: 86,
    posture: '99.1%',
    detections: 39,
    tta: '11m 42s',
    ttaDelta: '−4m 18s',
    triage: '−67%',
    automation: '94%',
    routine: 51,
    lead: 'Maya Chen',
  },
  {
    key: 'northstar',
    name: 'Northstar Dental',
    initials: 'ND',
    mark: 'teal',
    sector: 'Healthcare network',
    endpoints: 42,
    posture: '98.4%',
    detections: 31,
    tta: '8m 06s',
    ttaDelta: '−3m 51s',
    triage: '−71%',
    automation: '96%',
    routine: 48,
    lead: 'Eli Ramos',
  },
  {
    key: 'pine',
    name: 'Pine & Co. Manufacturing',
    initials: 'PC',
    mark: 'amber',
    sector: 'Industrial manufacturing',
    endpoints: 31,
    posture: '94.2%',
    detections: 44,
    tta: '14m 27s',
    ttaDelta: '−2m 16s',
    triage: '−52%',
    automation: '89%',
    routine: 43,
    lead: 'Jon Bell',
  },
  {
    key: 'aster',
    name: 'Aster House Studio',
    initials: 'AH',
    mark: 'teal',
    sector: 'Professional services',
    endpoints: 28,
    posture: '100%',
    detections: 18,
    tta: '6m 24s',
    ttaDelta: '−5m 09s',
    triage: '−76%',
    automation: '98%',
    routine: 32,
    lead: 'Nia Brooks',
  },
];

function getClient(key: ClientKey) {
  return clientProfiles.find((client) => client.key === key) ?? clientProfiles[0];
}

function clientKeyForName(name: string): ClientKey {
  return clientProfiles.find((client) => client.name === name)?.key ?? 'redwood';
}

function Status({ children, pending = false }: { children: ReactNode; pending?: boolean }) {
  return <span className={`sq-status${pending ? ' pending' : ''}`}>{children}</span>;
}

function PanelHead({ title, subtitle, action, onAction }: {
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
      {action && <button className="sq-panel-head-link" onClick={onAction} type="button">{action} <ChevronRight size={12} /></button>}
    </div>
  );
}

function Metric({ label, value, note, trend, context, featured = false, warning = false, testId }: {
  label: string;
  value: string;
  note: string;
  trend?: string;
  context?: string;
  featured?: boolean;
  warning?: boolean;
  testId?: string;
}) {
  return (
    <div className={`sq-metric${featured ? ' featured' : ''}${warning ? ' sq-metric-warning' : ''}`} data-testid={testId}>
      <div className="sq-kicker">{label}</div>
      <div className="sq-metric-value">{value}</div>
      <div className="sq-metric-note">{note}</div>
      {(trend || context) && <div className={`sq-metric-trend${context ? ' static' : ''}`}>{trend && <ArrowDownRight size={11} />}{trend ?? context}</div>}
    </div>
  );
}

function ClientCell({ client }: { client: ClientProfile }) {
  return (
    <div className="sq-client-cell">
      <span className={`sq-client-mark ${client.mark}`}>{client.initials}</span>
      <div><strong>{client.name}</strong><span>{client.endpoints} endpoints · {client.sector}</span></div>
    </div>
  );
}

function FleetTable({ alerts, onSelectClient, allowedClientKeys }: { alerts: CockpitAlert[]; onSelectClient: (key: ClientKey) => void; allowedClientKeys: ClientKey[] }) {
  return (
    <div className="sq-table-wrap">
      <table className="sq-table">
        <thead><tr><th>Client</th><th>Posture</th><th>Events / 7d</th><th>Automation</th><th>Open actions</th></tr></thead>
        <tbody>
          {clientProfiles.filter(client => allowedClientKeys.includes(client.key)).map((client) => {
            const openActions = alerts.filter((alert) => clientKeyForName(alert.client) === client.key && alert.status === 'pending').length;
            return (
              <tr key={client.key}>
                <td><button className="sq-button ghost sq-table-client" onClick={() => onSelectClient(client.key)} type="button"><ClientCell client={client} /></button></td>
                <td><span className="sq-number">{client.posture}</span></td>
                <td><span className="sq-number">{client.detections + client.routine}</span></td>
                <td><div className="sq-inline-meter"><div className="sq-progress"><i className={client.key === 'pine' ? 'amber' : undefined} style={{ width: client.automation }} /></div><span className="sq-number">{client.automation}</span></div></td>
                <td><span className={`sq-delta${openActions ? ' warn' : ''}`}>{openActions || 'Clear'}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CapacityPanel({ clients }: { clients: ClientProfile[] }) {
  const recoveryByClient: Record<ClientKey, number> = { redwood: 67, northstar: 71, pine: 52, aster: 64 };
  const hoursByClient: Record<ClientKey, number> = { redwood: 6.1, northstar: 6.8, pine: 5.7, aster: 3.4 };
  const rows = clients.map(client => ({
    label: client.name,
    detail: `${client.routine} routine events`,
    value: `−${recoveryByClient[client.key]}%`,
  }));
  const totalHours = clients.reduce((total, client) => total + hoursByClient[client.key], 0);
  const topClient = [...clients].sort((a, b) => hoursByClient[b.key] - hoursByClient[a.key])[0];
  return (
    <section className="sq-panel">
      <PanelHead title="Analyst capacity returned" subtitle="Time Sentriq has put back in the week." />
      <div className="sq-capacity-body">
        <div className="sq-capacity-main"><div><div className="sq-kicker">Across the portfolio</div><strong>{totalHours.toFixed(1)} hrs</strong></div><span>this week</span></div>
        <div className="sq-capacity-bar"><i /></div>
        <div className="sq-capacity-foot"><span>26.4 hrs before Sentriq</span><span>68% recovered</span></div>
        <div className="sq-capacity-list">
          {rows.map((row) => <div className="sq-capacity-row" key={row.label}><div><strong>{row.label}</strong><span>{row.detail}</span></div><div className="sq-progress"><i style={{ width: row.value.replace('−', '') }} /></div><b>{row.value}</b></div>)}
        </div>
        {topClient && <div className="sq-capacity-gain"><strong>{topClient.name} gains the most capacity.</strong> Its routine queue is {topClient.automation} automated, returning {hoursByClient[topClient.key].toFixed(1)} analyst hours this week.</div>}
      </div>
    </section>
  );
}

function ActivityPanel({ client, clients = [], queueCount }: { client?: ClientProfile; clients?: ClientProfile[]; queueCount: number }) {
  const topClient = [...clients].sort((a, b) => b.routine - a.routine)[0];
  const routineTotal = clients.reduce((total, item) => total + item.routine, 0);
  const items = client
    ? [
      { icon: Bot, title: 'Routine event grouped and closed', detail: `${client.name} · ${client.lead}`, time: '09:48' },
      { icon: ShieldCheck, title: 'Endpoint posture check passed', detail: `${client.endpoints} of ${client.endpoints} endpoints reporting`, time: '09:22' },
      { icon: Siren, title: queueCount ? 'Consequential action needs review' : 'Detection contained automatically', detail: queueCount ? 'Sentriq recommendation is ready' : 'No analyst intervention required', time: '08:56' },
    ]
    : [
      { icon: CheckCircle2, title: `${routineTotal} routine events handled`, detail: `High-confidence policies · across ${clients.length} ${clients.length === 1 ? 'client' : 'clients'}`, time: '10:42' },
      { icon: UsersRound, title: `${topClient?.name ?? 'Workspace'} leads routine capacity`, detail: 'Largest capacity return in this workspace', time: '10:16' },
      { icon: PanelRight, title: `${queueCount} consequential actions are waiting`, detail: 'Human approval remains required', time: '10:09' },
    ];
  return (
    <section className="sq-panel">
      <PanelHead title={client ? 'Recent activity' : 'Operator signal'} subtitle={client ? "The events behind this client's numbers." : "The few things worth a human glance."} />
      <div className="sq-activity-list">{items.map(({ icon: Icon, title, detail, time }) => <div className="sq-activity" key={title}><span className="sq-activity-icon"><Icon size={13} /></span><div className="sq-activity-copy"><strong>{title}</strong><span>{detail}</span></div><time>{time}</time></div>)}</div>
    </section>
  );
}

function MspView({ alerts, onSelectClient, onNotice, allowedClientKeys }: {
  alerts: CockpitAlert[];
  onSelectClient: (key: ClientKey) => void;
  onNotice: (message: string) => void;
  allowedClientKeys: ClientKey[];
}) {
  const scopedProfiles = clientProfiles.filter(client => allowedClientKeys.includes(client.key));
  const totalEndpoints = scopedProfiles.reduce((sum, client) => sum + client.endpoints, 0);
  const totalEvents = scopedProfiles.reduce((sum, client) => sum + client.detections + client.routine, 0);
  const pendingCount = alerts.filter((alert) => alert.status === 'pending').length;
  return (
    <div className="sq-section-transition">
       <div className="sq-page-head"><div><div className="sq-kicker">Tuesday · 10:50 UTC · MSP overview</div><h1>Good morning, Jordan.</h1><p>The fleet is quiet. {pendingCount} consequential {pendingCount === 1 ? 'action still needs' : 'actions still need'} your call.</p></div><div className="sq-page-head-tools"><span className="sq-live"><span className="sq-live-dot" /> Fleet telemetry live</span></div></div>
       <div className="sq-metrics">
         <Metric label="Portfolio posture" value="97.8%" note={`${totalEndpoints} endpoints · ${scopedProfiles.length} clients`} context="steady across fleet" featured />
          <Metric label="Needs review" value={String(pendingCount)} note="high-impact actions waiting" context="human review lane" warning testId="text-admin-pending-count" />
        <Metric label="Routine handled" value="142" note="events · last 7 days" trend="18 vs last week" />
        <Metric label="Time to action" value="11m 42s" note="median · 7-day window" trend="4m 18s faster" />
        <Metric label="Automation coverage" value="93%" note={`${totalEvents} events observed`} trend="high-confidence only" />
      </div>
      <div className="sq-grid">
         <section className="sq-panel"><PanelHead title="Portfolio posture" subtitle="Where the fleet is healthy, noisy, or asking for attention." action="Open client view" onAction={() => onSelectClient(scopedProfiles[0]?.key ?? '')} /><FleetTable alerts={alerts} onSelectClient={onSelectClient} allowedClientKeys={allowedClientKeys} /></section>
         <CapacityPanel clients={scopedProfiles} />
      </div>
      <div className="sq-bottom-grid">
        <ActivityPanel clients={scopedProfiles} queueCount={pendingCount} />
        <section className="sq-panel"><PanelHead title="Efficiency, at a glance" subtitle="The operating model behind the numbers." /><div className="sq-strip"><div className="sq-strip-item"><div className="sq-kicker">Decision latency</div><strong className="sq-highlight">11m 42s</strong><span>median from detection to recommendation</span></div><div className="sq-strip-item"><div className="sq-kicker">Human lane</div><strong className="sq-attention">{pendingCount}</strong><span>actions Sentriq will not take without a person</span></div><div className="sq-strip-item"><div className="sq-kicker">Routine lane</div><strong className="sq-highlight">142</strong><span>events resolved without adding work to the queue</span></div></div><div className="sq-help-note"><CircleHelp size={12} /> Policies are scoped per client and can be audited at any time.</div></section>
      </div>
      <button className="sq-button ghost sq-export-button" onClick={() => onNotice('Brief prepared with the current 7-day operating window.')} type="button"><FileDown size={13} /> Export operating brief</button>
    </div>
  );
}

function ClientView({ selected, alerts, onOpenAction, onNotice }: {
  selected: ClientProfile;
  alerts: CockpitAlert[];
  onOpenAction: (id: number) => void;
  onNotice: (message: string) => void;
}) {
  const clientAlerts = alerts.filter((alert) => clientKeyForName(alert.client) === selected.key);
  const clientQueue = clientAlerts.filter((alert) => alert.status === 'pending');
  const latestThreat = clientQueue[0]?.title ?? 'No active threats';
  return (
    <div className="sq-section-transition">
      <div className="sq-page-head"><div><div className="sq-kicker">Tuesday · 10:50 UTC · client operations</div><h1>{selected.name}</h1><p>One client, one operating picture — with the work behind every metric.</p></div></div>
      <div className="sq-client-identity"><span className={`sq-client-mark ${selected.mark}`}>{selected.initials}</span><div><strong>{selected.name}</strong><span>{selected.sector} · managed by Cedarline Security</span></div><div className="sq-client-identity-meta"><span><b>{selected.endpoints}</b> endpoints</span><span><b>{selected.lead}</b> owner</span><Status>{selected.posture} posture</Status></div></div>
       <div className="sq-client-kpi-grid">
         <div className="sq-client-kpi attention"><div className="sq-kicker">Threats</div><strong>{clientQueue.length}</strong><span>{clientQueue.length ? latestThreat : 'No active threats'}</span></div>
         <div className="sq-client-kpi" data-testid="text-client-admin-detections"><div className="sq-kicker">Detections</div><strong>{selected.detections}</strong><span>observed this week</span></div>
         <div className="sq-client-kpi attention" data-testid="text-client-admin-actions"><div className="sq-kicker">Actions</div><strong>{clientQueue.length}</strong><span>{clientQueue.length ? 'pending' : 'Clear'}</span></div>
        <div className="sq-client-kpi good"><div className="sq-kicker">Time to action</div><strong>{selected.tta}</strong><span>{selected.ttaDelta} vs baseline</span></div>
        <div className="sq-client-kpi good"><div className="sq-kicker">Efficiency</div><strong>{selected.triage}</strong><span>triage time reduction</span></div>
      </div>
      <div className="sq-client-main-grid">
        <section className="sq-panel"><PanelHead title="Threats & detections" subtitle="What Sentriq saw and how the operating model responded." /><div className="sq-threat-list">{clientQueue.length ? <><div className="sq-threat"><i className="sq-threat-bar" /><div><strong>{latestThreat}</strong><span>{clientQueue[0].endpoint} · {clientQueue[0].age} · high impact</span></div><Status pending>Needs review</Status></div><div className="sq-threat"><i className="sq-threat-bar teal" /><div><strong>Suspicious process contained</strong><span>{selected.name} · signed utility chain · 2 hr ago</span></div><Status>Contained</Status></div><div className="sq-threat"><i className="sq-threat-bar amber" /><div><strong>Identity anomaly triaged</strong><span>{selected.name} · known device fingerprint · yesterday</span></div><Status>Analyst cleared</Status></div></> : <div className="sq-threat"><i className="sq-threat-bar teal" /><div><strong>No active threats</strong><span>Last meaningful detection was contained 6 hours ago.</span></div><Status>Fleet clear</Status></div>}</div></section>
        <div><section className="sq-panel"><PanelHead title="Recommended action" subtitle={clientQueue.length ? 'A human decision is the only remaining step.' : 'No consequential work is waiting.'} /><div className="sq-action-card">{clientQueue.length ? <><div className="sq-action-head"><div><div className="sq-kicker">{clientQueue[0].severity} severity</div><h3>{clientQueue[0].action}</h3></div><Status pending>Pending</Status></div><p>{clientQueue[0].description} Sentriq has assembled the evidence and held the action at the human lane.</p><div className="sq-action-meta"><div><span>Endpoint</span><b>{clientQueue[0].endpoint}</b></div><div><span>Confidence</span><b>{clientQueue[0].confidence}</b></div></div><div className="sq-action-buttons"><button className="sq-button approve" onClick={() => onOpenAction(clientQueue[0].id)} type="button"><Zap size={12} /> Review action</button><button className="sq-button" onClick={() => onNotice('Evidence summary copied to the operator brief.')} type="button"><FileDown size={12} /> Export evidence</button></div></> : <div className="sq-empty-notice"><CheckCircle2 size={16} /> No consequential actions. Routine work is covered.</div>}</div></section>
          <section className="sq-panel sq-efficiency"><PanelHead title="Efficiency profile" subtitle="Why this client's queue looks the way it does." /><div className="sq-efficiency-body"><div className="sq-efficiency-row"><span>Routine coverage</span><b>{selected.automation}</b></div><div className="sq-efficiency-meter"><i style={{ width: selected.automation }} /></div><div className="sq-efficiency-row"><span>Time returned this week</span><b>{selected.key === 'northstar' ? '6.8 hrs' : selected.key === 'redwood' ? '6.1 hrs' : '5.7 hrs'}</b></div><div className="sq-efficiency-meter"><i className="amber" style={{ width: selected.key === 'northstar' ? '81%' : '68%' }} /></div><div className="sq-insight"><Sparkles size={13} /><p><strong>High-confidence automation is doing the quiet work.</strong> {selected.routine} routine events were handled without an analyst opening the queue.</p></div></div></section>
        </div>
      </div>
      <div className="sq-client-activity"><ActivityPanel client={selected} queueCount={clientQueue.length} /></div>
      <button className="sq-button ghost sq-export-button" onClick={() => onNotice(`Client report for ${selected.name} is ready in the operator brief.`)} type="button"><FileDown size={13} /> Export client report</button>
    </div>
  );
}

export function AdminCockpit({ role, selectedClientKey, alerts, onSelectClient, onOpenAction, onNotice, allowedClientKeys = clientProfiles.map(client => client.key) }: {
  role: AdminRole;
  selectedClientKey: ClientKey;
  alerts: CockpitAlert[];
  onSelectClient: (key: ClientKey) => void;
  onOpenAction: (id: number) => void;
  onNotice: (message: string) => void;
  allowedClientKeys?: ClientKey[];
}) {
  const selectedClient = useMemo(() => getClient(selectedClientKey), [selectedClientKey]);

  return (
    <div className="admin-cockpit">
      {role === 'msp'
         ? <MspView alerts={alerts} onSelectClient={onSelectClient} onNotice={onNotice} allowedClientKeys={allowedClientKeys} />
        : <ClientView selected={selectedClient} alerts={alerts} onOpenAction={onOpenAction} onNotice={onNotice} />}
    </div>
  );
}