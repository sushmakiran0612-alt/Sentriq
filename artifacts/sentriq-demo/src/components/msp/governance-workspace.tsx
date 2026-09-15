import { useState } from 'react';
import { Check, ShieldCheck } from 'lucide-react';
import '../shared/demo-styles.css';

export interface GovernanceConfig {
  clientKey: string;
  allowedActions: string[];
  routineAutomation: boolean;
  routineLimit: number;
  approvalRoles: string[];
  delegatedClientRole?: string;
  version: number;
}

export function GovernanceWorkspace({ configs, setConfigs, notify }: {
  configs: GovernanceConfig[];
  setConfigs: (configs: GovernanceConfig[]) => void;
  notify: (message: string) => void;
}) {
  const [selected, setSelected] = useState(configs[0]?.clientKey ?? '');
  const current = configs.find((config) => config.clientKey === selected) ?? configs[0];
  if (!current) return <div className="sq-empty-state">No client governance is available in this MSP workspace.</div>;
  const save = (patch: Partial<GovernanceConfig>) => {
    setConfigs(configs.map((config) => config.clientKey === current.clientKey
      ? { ...config, ...patch, version: config.version + 1 }
      : config));
    notify('Demo governance saved; policy version incremented.');
  };
  return <div className="sq-workspace-transition" style={{ maxWidth: '980px', margin: '0 auto' }}>
    <div className="sq-page-head"><div><div className="sq-kicker">MSP governance · demo session</div><h1>Permissions & approvals</h1><p>Configure client-scoped authority. This editable session state is not production authorization.</p></div></div>
    <div className="sq-split-layout">
      <aside className="sq-list-panel"><div className="sq-list-panel-head"><span className="sq-list-panel-title">Client policies</span></div><div className="sq-list-items">
        {configs.map((config) => <button className={`sq-list-item ${config.clientKey === current.clientKey ? 'selected' : ''}`} key={config.clientKey} onClick={() => setSelected(config.clientKey)} type="button" data-testid={`governance-client-${config.clientKey}`}>{config.clientKey}<span>Policy v{config.version}</span></button>)}
      </div></aside>
      <main className="sq-detail-panel"><div className="sq-detail-body">
        <div className="sq-field-group"><div className="sq-field-group-title"><ShieldCheck size={14} /> {current.clientKey} · current authority</div>
          <label className="sq-field" style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" checked={current.routineAutomation} onChange={(event) => save({ routineAutomation: event.target.checked })} data-testid="checkbox-governance-automation" /> Allow routine reversible automation (never high-impact)</label>
          <div className="sq-field"><label>Routine limit per session</label><input className="sq-input" type="number" min={0} value={current.routineLimit} onChange={(event) => save({ routineLimit: Number(event.target.value) })} data-testid="input-governance-limit" /></div>
          <div className="sq-field"><label>Named approval roles</label><div className="sq-pill-list">{current.approvalRoles.map((role) => <span className="sq-pill" key={role}><Check size={11} /> {role}</span>)}</div></div>
          <div className="sq-field"><label>Delegated client role</label><input className="sq-input" value={current.delegatedClientRole ?? ''} onChange={(event) => save({ delegatedClientRole: event.target.value || undefined })} data-testid="input-governance-delegated-role" placeholder="e.g. Client security lead" /></div>
          <div className="sq-simulation-banner">Policy version {current.version}. Every attempted execution rechecks this version and the action context.</div>
        </div>
      </div></main>
    </div>
  </div>;
}