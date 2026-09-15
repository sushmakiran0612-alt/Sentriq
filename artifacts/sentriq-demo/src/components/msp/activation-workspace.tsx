import { useState } from 'react';
import { CheckCircle2, Circle, PlugZap } from 'lucide-react';
import { Prospect } from '@/hooks/use-msp-data';
import type { ActionAudit } from '@/lib/demo-action-requests';
import '../shared/demo-styles.css';

export function ActivationWorkspace({ prospect, prospects, setProspects, notify, onAudit }: {
  prospect?: Prospect;
  prospects: Prospect[];
  setProspects: (prospects: Prospect[]) => void;
  notify: (message: string) => void;
  onAudit: (event: ActionAudit) => void;
}) {
  const [integration, setIntegration] = useState(prospect?.selectedIntegration ?? { id: 'sim-edr', name: 'Sample EDR connector', state: prospect?.integrationState ?? 'awaiting_access' as const });
  if (!prospect) return <div className="sq-empty-state">Select a prospect before opening activation readiness.</div>;
  const needsRecovery = integration.state === 'failed' || integration.state === 'blocked';
  const confirmed = (prospect.inventoryEvidence ?? []).length > 0 && (prospect.inventoryEvidence ?? []).every(item => item.state === 'confirmed');
  const noGaps = (prospect.unresolvedGaps ?? []).length === 0 && (prospect.sharedProposal?.gaps ?? []).length === 0;
  const selected = Boolean(prospect.proposedPackageId && prospect.proposalShared);
  const approved = prospect.proposalDecision?.decision === 'approved'
    && prospect.proposalDecision.proposalVersion === (prospect.sharedProposal?.version ?? 0);
  const integrationReady = integration.state === 'ready' || integration.state === 'activated';
  const ready = Boolean(prospect.environmentConfirmed) && confirmed && noGaps && selected && approved && integrationReady;
  const activate = () => {
    if (prospect.activated) return notify('Activation already completed for this prospect; duplicate promotion blocked.');
    if (!ready) {
      onAudit({ id: `activation-blocked-${prospect.id}`, workspaceId: prospect.workspaceId ?? 'cedarline', clientKey: prospect.key, event: 'activation blocked', actionDetails: integration.name, requester: 'MSP administrator', approver: 'Not applicable', policyId: 'service-package', policyVersion: prospect.sharedProposal?.version ?? 1, decision: 'blocked', timestamp: '2024-05-14T10:55:00Z', executionOutcome: 'not executed', internalNote: 'Readiness prerequisite failed.', clientSafeOutcome: 'Activation is waiting for intake, approval, or integration readiness.' });
      return notify('Activation blocked: complete every readiness prerequisite first.');
    }
    setProspects(prospects.map(item => item.id === prospect.id ? { ...item, activated: true, activatedAt: new Date().toISOString(), integrationState: 'activated', selectedIntegration: { ...integration, state: 'activated' } } : item));
    onAudit({ id: `activation-success-${prospect.id}`, workspaceId: prospect.workspaceId ?? 'cedarline', clientKey: prospect.key, event: 'activation success', actionDetails: `${prospect.sharedProposal?.packageName ?? 'package'} · ${integration.name}`, requester: 'MSP administrator', approver: prospect.proposalDecision?.actor ?? 'Pending', policyId: 'service-package', policyVersion: prospect.sharedProposal?.version ?? 1, decision: 'activated', timestamp: '2024-05-14T10:55:00Z', executionOutcome: 'simulated monitored client promoted', internalNote: 'No real connection or provisioning.', clientSafeOutcome: 'Your monitored demo workspace is ready.' });
    notify(`${prospect.name} promoted into monitored clients in this MSP demo workspace.`);
  };
  const checks = [
    ['Client confirmed the current environment', Boolean(prospect.environmentConfirmed)],
    ['Confirmed intake evidence', confirmed],
    ['No material gaps', noGaps],
    ['Current MSP selection shared', selected],
    ['Client approved current proposal version', approved],
    ['Selected simulated integration is ready', integrationReady],
  ] as const;
  const updateIntegration = (state: typeof integration.state, changes: Partial<Prospect> = {}) => {
    const next = { ...integration, state };
    setIntegration(next);
    setProspects(prospects.map(item => item.id === prospect.id ? { ...item, integrationState: state, selectedIntegration: next, ...changes } : item));
  };
  const beginRecovery = () => {
    updateIntegration('integration_setup', {
      integrationIssue: undefined,
      integrationOwner: 'MSP administrator',
      integrationRecoveryAttempts: (prospect.integrationRecoveryAttempts ?? 0) + 1,
      integrationRecoveredAt: new Date().toISOString(),
    });
    onAudit({ id: `integration-recovery-${prospect.id}-${Date.now()}`, workspaceId: prospect.workspaceId ?? 'cedarline', clientKey: prospect.key, event: 'integration recovery started', actionDetails: integration.name, requester: 'MSP administrator', approver: 'Not applicable', policyId: 'client-onboarding', policyVersion: prospect.sharedProposal?.version ?? 1, decision: 'retrying simulated readiness checks', timestamp: new Date().toISOString(), executionOutcome: 'recovery in progress', internalNote: 'Simulated retry only; no live connector call occurred.', clientSafeOutcome: 'Your MSP is retrying the setup check.' });
    notify('Recovery started. Complete the simulated readiness check when setup is healthy.');
  };
  return <div className="sq-workspace-transition" style={{ maxWidth: 900, margin: '0 auto' }}>
    <div className="sq-page-head"><div><div className="sq-kicker">Activation · demo session</div><h1>{prospect.name} readiness</h1><p>Admin-controlled promotion into monitored clients. No real connector or provisioning is performed.</p></div></div>
    <div className="sq-detail-panel"><div className="sq-detail-body">
      <div className="sq-field-group"><div className="sq-field-group-title">Readiness checklist</div>{checks.map(([label, pass]) => <div key={label} style={{ display: 'flex', gap: 10, padding: 9, borderBottom: '1px solid var(--sq-line-soft)' }}>{pass ? <CheckCircle2 color="var(--sq-teal)" size={16} /> : <Circle color="var(--sq-amber)" size={16} />}<span>{label}</span></div>)}</div>
      <div className="sq-field-group"><div className="sq-field-group-title"><PlugZap size={14} /> Selected integration · simulated</div><select className="sq-select-native" value={integration.state} disabled={prospect.activated} onChange={event => {
        const state = event.target.value as typeof integration.state;
        if (state === 'ready' && needsRecovery) {
          notify('Start recovery before marking a failed or blocked setup ready.');
          return;
        }
        const issue = state === 'failed' ? 'Simulated connector check failed.' : state === 'blocked' ? 'Waiting for required access or configuration.' : undefined;
        updateIntegration(state, { integrationIssue: issue, integrationOwner: state === 'awaiting_access' ? 'Client contact' : 'MSP administrator' });
        onAudit({ id: `integration-${prospect.id}-${state}`, workspaceId: prospect.workspaceId ?? 'cedarline', clientKey: prospect.key, event: 'integration state changed', actionDetails: `${integration.name}: ${state}`, requester: 'MSP administrator', approver: 'Not applicable', policyId: 'client-onboarding', policyVersion: prospect.sharedProposal?.version ?? 1, decision: state, timestamp: new Date().toISOString(), executionOutcome: 'simulated setup state', internalNote: 'No real connection or credentials.', clientSafeOutcome: `Setup is ${state.replace('_', ' ')}.` });
      }} data-testid="select-activation-integration"><option value="awaiting_access">Awaiting client access</option><option value="integration_setup">Integration setup in progress</option><option value="blocked">Blocked</option><option value="failed">Failed</option><option value="ready">Ready (simulated)</option><option value="activated">Activated (simulated)</option></select>
        <p className="sq-muted">Sample EDR connector state only; no live EDR, authentication, credentials, or network connection exists.</p>
        <div className="sq-simulation-banner" data-testid="integration-owner-blocker">Owner: {prospect.integrationOwner ?? (integration.state === 'awaiting_access' ? 'Client contact' : 'MSP administrator')} · {prospect.integrationIssue ?? (integrationReady ? 'No blocker' : 'Complete the next simulated setup step')}</div>
        {needsRecovery && <button className="sq-button" onClick={beginRecovery} data-testid="button-retry-integration">Retry simulated setup check</button>}
      </div>
      <button className="sq-button primary" disabled={!ready || prospect.activated} onClick={activate} data-testid="button-activate-prospect">{prospect.activated ? 'Already activated' : 'Activate monitored client (demo)'}</button>
      {prospect.activated && <div className="sq-simulation-banner" data-testid="activation-status">Activated at {prospect.activatedAt} · package, inventory, and decision context retained.</div>}
    </div></div>
  </div>;
}