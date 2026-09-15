import { useMemo, useState } from 'react';
import { Check, ChevronDown, FileText, LockKeyhole, Pencil, Plus, Save, ShieldCheck, Trash2, X } from 'lucide-react';

import type { AdminRole, ClientKey } from './admin-cockpit';

import './policy-center.css';

export type PolicyStatus = 'active' | 'draft';
export type PolicyScope = 'msp' | 'client';

export type PolicyRecord = {
  id: string;
  scope: PolicyScope;
  workspaceId?: string;
  clientKey?: ClientKey;
  name: string;
  description: string;
  trigger: string;
  action: string;
  threshold: string;
  status: PolicyStatus;
  updatedAt: string;
};

export const initialPolicies: PolicyRecord[] = [
  {
    id: 'policy-1',
    scope: 'msp',
    workspaceId: 'cedarline',
    name: 'High-confidence credential access',
    description: 'Keep credential access actions in the human lane until evidence and confidence are reviewed.',
    trigger: 'Credential access signal · confidence ≥ 90%',
    action: 'Assemble evidence and require human approval',
    threshold: '90%',
    status: 'active',
    updatedAt: 'Today, 09:42 UTC',
  },
  {
    id: 'policy-2',
    scope: 'msp',
    workspaceId: 'cedarline',
    name: 'Unsigned driver guardrail',
    description: 'Prevent new kernel drivers from persisting outside an approved maintenance window.',
    trigger: 'Unsigned driver · outside maintenance window',
    action: 'Quarantine driver and notify the assigned analyst',
    threshold: '85%',
    status: 'active',
    updatedAt: 'Yesterday, 16:18 UTC',
  },
  {
    id: 'policy-5',
    scope: 'msp',
    workspaceId: 'northbridge',
    name: 'Northbridge reversible containment',
    description: 'Keep only reversible, in-scope containment eligible for simulated routine execution.',
    trigger: 'Confirmed process threat · approved Northbridge client',
    action: 'Quarantine process and retain a human escalation path',
    threshold: '90%',
    status: 'active',
    updatedAt: 'Today, 09:10 UTC',
  },
  {
    id: 'policy-3',
    scope: 'client',
    clientKey: 'redwood',
    name: 'Redwood identity escalation',
    description: 'Prioritize identity anomalies for the legal team while preserving a human decision on session changes.',
    trigger: 'Identity anomaly · privileged user',
    action: 'Escalate to Redwood Legal owner and hold session action',
    threshold: '80%',
    status: 'active',
    updatedAt: 'Today, 08:56 UTC',
  },
  {
    id: 'policy-4',
    scope: 'client',
    clientKey: 'northstar',
    name: 'Northstar clinical workstation',
    description: 'Keep clinical reception workstations available while isolating high-confidence process threats.',
    trigger: 'Process threat · clinical workstation',
    action: 'Isolate endpoint and preserve the active session',
    threshold: '90%',
    status: 'draft',
    updatedAt: 'Monday, 13:05 UTC',
  },
];

type PolicyDraft = Omit<PolicyRecord, 'id' | 'scope' | 'workspaceId' | 'clientKey' | 'updatedAt'>;

const emptyDraft: PolicyDraft = {
  name: '',
  description: '',
  trigger: '',
  action: '',
  threshold: '90%',
  status: 'draft',
};

function PolicyEditor({ draft, isNew, onChange, onCancel, onSave }: {
  draft: PolicyDraft;
  isNew: boolean;
  onChange: (draft: PolicyDraft) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const update = (field: keyof PolicyDraft, value: string) => onChange({ ...draft, [field]: value });

  return (
    <section className="policy-editor panel" data-testid="panel-policy-editor">
      <div className="policy-editor-head">
        <div>
          <div className="eyebrow">{isNew ? 'New policy' : 'Maintain policy'}</div>
          <h2>{isNew ? 'Write a policy' : 'Edit policy'}</h2>
        </div>
        <button className="icon-button" onClick={onCancel} type="button" aria-label="Close policy editor" data-testid="button-close-policy-editor"><X size={15} /></button>
      </div>
      <div className="policy-form">
        <label>
          <span>Policy name</span>
          <input value={draft.name} onChange={(event) => update('name', event.target.value)} placeholder="e.g. Privileged identity guardrail" data-testid="input-policy-name" />
        </label>
        <label>
          <span>What should this policy protect?</span>
          <textarea value={draft.description} onChange={(event) => update('description', event.target.value)} placeholder="Describe the company or role-specific intent." rows={3} data-testid="input-policy-description" />
        </label>
        <div className="policy-form-grid">
          <label>
            <span>Trigger</span>
            <input value={draft.trigger} onChange={(event) => update('trigger', event.target.value)} placeholder="Signal or condition" data-testid="input-policy-trigger" />
          </label>
          <label>
            <span>Response</span>
            <input value={draft.action} onChange={(event) => update('action', event.target.value)} placeholder="What Sentriq should do" data-testid="input-policy-action" />
          </label>
        </div>
        <div className="policy-form-grid">
          <label>
            <span>Confidence threshold</span>
            <span className="policy-select-wrap"><select value={draft.threshold} onChange={(event) => update('threshold', event.target.value)} data-testid="select-policy-threshold"><option>70%</option><option>80%</option><option>85%</option><option>90%</option><option>95%</option></select><ChevronDown size={14} /></span>
          </label>
          <label>
            <span>State</span>
            <span className="policy-select-wrap"><select value={draft.status} onChange={(event) => update('status', event.target.value as PolicyStatus)} data-testid="select-policy-status"><option value="draft">Draft</option><option value="active">Active</option></select><ChevronDown size={14} /></span>
          </label>
        </div>
      </div>
      <div className="policy-editor-actions">
        <button className="button" onClick={onCancel} type="button">Cancel</button>
        <button className="button teal" onClick={onSave} disabled={!draft.name.trim() || !draft.description.trim() || !draft.trigger.trim() || !draft.action.trim()} type="button" data-testid="button-save-policy"><Save size={14} /> Save policy</button>
      </div>
    </section>
  );
}

export function PolicyCenter({ role, workspaceId, selectedClientKey, clientName, policies, onPoliciesChange, notify }: {
  role: AdminRole;
  workspaceId: string;
  selectedClientKey: ClientKey;
  clientName: string;
  policies: PolicyRecord[];
  onPoliciesChange: (policies: PolicyRecord[]) => void;
  notify: (message: string) => void;
}) {
  const isMsp = role === 'msp';
  const visiblePolicies = useMemo(
    () => policies.filter((policy) => isMsp ? policy.scope === 'msp' && policy.workspaceId === workspaceId : policy.scope === 'client' && policy.clientKey === selectedClientKey),
    [isMsp, policies, selectedClientKey, workspaceId],
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PolicyDraft>(emptyDraft);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openNewPolicy = () => {
    setDeletingId(null);
    setEditingId('new');
    setDraft(emptyDraft);
  };

  const openEditPolicy = (policy: PolicyRecord) => {
    setDeletingId(null);
    setEditingId(policy.id);
    setDraft({
      name: policy.name,
      description: policy.description,
      trigger: policy.trigger,
      action: policy.action,
      threshold: policy.threshold,
      status: policy.status,
    });
  };

  const savePolicy = () => {
    if (!draft.name.trim() || !draft.description.trim() || !draft.trigger.trim() || !draft.action.trim()) return;
    if (editingId === 'new') {
      const nextNumber = policies.reduce((highest, policy) => Math.max(highest, Number(policy.id.replace('policy-', '')) || 0), 0) + 1;
      onPoliciesChange([...policies, {
        ...draft,
        id: `policy-${nextNumber}`,
        scope: isMsp ? 'msp' : 'client',
        ...(isMsp ? { workspaceId } : { clientKey: selectedClientKey }),
        updatedAt: 'Just now',
      }]);
      notify(isMsp ? 'MSP policy created' : `${clientName} policy created`);
    } else {
      onPoliciesChange(policies.map((policy) => policy.id === editingId ? { ...policy, ...draft, updatedAt: 'Just now' } : policy));
      notify('Policy changes saved');
    }
    setEditingId(null);
  };

  const deletePolicy = (id: string) => {
    onPoliciesChange(policies.filter((policy) => policy.id !== id));
    setDeletingId(null);
    if (editingId === id) setEditingId(null);
    notify('Policy deleted');
  };

  return (
    <div className="policy-center sq-section-transition">
      <div className="view-head animate-rise">
        <div>
          <div className="eyebrow">{isMsp ? 'MSP policy space' : `${clientName} policy space`}</div>
          <h1 data-testid="text-page-title">Policy center</h1>
          <p>{isMsp ? 'Define the operating rules this MSP workspace carries across its managed fleet.' : `Write and maintain policies for ${clientName}. This space is isolated from MSP-wide rules.`}</p>
        </div>
        <button className="button teal" onClick={openNewPolicy} type="button" data-testid="button-new-policy"><Plus size={14} /> New policy</button>
      </div>

      <div className="policy-access-banner" data-testid="policy-access-banner">
        <span className="policy-access-icon">{isMsp ? <ShieldCheck size={16} /> : <LockKeyhole size={16} />}</span>
        <div><strong>{isMsp ? 'MSP administrator access' : 'Organization-scoped access'}</strong><span>{isMsp ? 'You are editing MSP policies. Client policy spaces remain separately owned and scoped.' : `You can edit ${clientName} policies only. MSP-wide rules are managed by the MSP administrator.`}</span></div>
      </div>

      <div className={`policy-layout ${editingId ? 'with-editor' : ''}`}>
        <section className="policy-list panel" data-testid="panel-policy-list">
          <div className="panel-head">
            <div><div className="panel-title">{isMsp ? 'MSP policies' : `${clientName} policies`}</div><div className="panel-subtitle">{visiblePolicies.length} {visiblePolicies.length === 1 ? 'policy' : 'policies'} in this space</div></div>
            <span className="policy-count">{visiblePolicies.length}</span>
          </div>
          {visiblePolicies.length === 0 ? <div className="policy-empty"><FileText size={18} /><strong>No policies yet</strong><span>Write the first rule for this policy space.</span></div> : <div className="policy-items">
            {visiblePolicies.map((policy) => (
              <article className="policy-item" key={policy.id} data-testid={`policy-item-${policy.id}`}>
                <div className="policy-item-main">
                  <div className="policy-item-title"><span className={`policy-state ${policy.status}`}>{policy.status === 'active' ? <Check size={10} /> : null}{policy.status}</span><h3>{policy.name}</h3></div>
                  <p>{policy.description}</p>
                  <div className="policy-meta"><span><b>When</b>{policy.trigger}</span><span><b>Then</b>{policy.action}</span><span><b>Threshold</b>{policy.threshold}</span></div>
                  <small className="policy-updated">Updated {policy.updatedAt}</small>
                </div>
                <div className="policy-item-actions">
                  <button className="icon-button" onClick={() => openEditPolicy(policy)} type="button" aria-label={`Edit ${policy.name}`} data-testid={`button-edit-policy-${policy.id}`}><Pencil size={14} /></button>
                  {deletingId === policy.id ? <div className="policy-delete-confirm"><span>Delete?</span><button onClick={() => deletePolicy(policy.id)} type="button" data-testid={`button-confirm-delete-policy-${policy.id}`}>Yes</button><button onClick={() => setDeletingId(null)} type="button">No</button></div> : <button className="icon-button danger-icon" onClick={() => setDeletingId(policy.id)} type="button" aria-label={`Delete ${policy.name}`} data-testid={`button-delete-policy-${policy.id}`}><Trash2 size={14} /></button>}
                </div>
              </article>
            ))}
          </div>}
        </section>
        {editingId && <PolicyEditor draft={draft} isNew={editingId === 'new'} onChange={setDraft} onCancel={() => setEditingId(null)} onSave={savePolicy} />}
      </div>
    </div>
  );
}