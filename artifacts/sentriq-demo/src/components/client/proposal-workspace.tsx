import { Prospect, Package } from '@/hooks/use-msp-data';
import { FileCheck, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';
import { useState } from 'react';
import type { ActionAudit } from '@/lib/demo-action-requests';
import '../shared/demo-styles.css';

export function ProposalWorkspace({ 
  prospect, 
  prospects,
  setProspects,
  notify,
  onAudit,
}: { 
  prospect: Prospect,
  packages: Package[],
  prospects: Prospect[],
  setProspects: (prospects: Prospect[]) => void,
  notify: (msg: string) => void,
  onAudit: (event: ActionAudit) => void,
}) {
  const proposal = prospect.proposalShared ? prospect.sharedProposal : undefined;
  const [decisionNote, setDecisionNote] = useState('');
  const decide = (decision: 'approved' | 'rejected' | 'changes_requested', note: string) => {
    if (!proposal) return;
    setProspects(prospects.map(item => item.id === prospect.id ? {
      ...item,
      proposalDecision: { decision, actor: 'Jordan Reyes · client demo', timestamp: '2024-05-14T10:50:00Z', proposalVersion: proposal.version ?? 1, note: decisionNote || note },
    } : item));
    onAudit({ id: `proposal-${prospect.id}-${decision}-${proposal.version ?? 1}`, workspaceId: prospect.workspaceId ?? 'cedarline', clientKey: prospect.key, event: `proposal ${decision}`, actionDetails: proposal.packageName, requester: 'Jordan Reyes · client demo', approver: 'Jordan Reyes · client demo', policyId: 'service-package', policyVersion: proposal.version ?? 1, decision, timestamp: '2024-05-14T10:50:00Z', executionOutcome: 'not applicable', internalNote: '', clientSafeOutcome: decisionNote || note });
    notify(`Package proposal ${decision.replace('_', ' ')}. Security-action approval remains separate.`);
  };

  return (
    <div className="sq-workspace-transition" style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '32px' }}>
      
      {!proposal ? (
        <div className="sq-detail-panel" style={{ padding: '48px 32px', textAlign: 'center' }}>
          <Clock size={48} color="var(--sq-amber)" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ margin: '0 0 12px', font: '600 24px var(--app-font-display)', color: 'var(--sq-ink)' }}>Under Review</h2>
          <p style={{ color: 'var(--sq-muted)', fontSize: '14px', maxWidth: '400px', margin: '0 auto 24px' }}>
            Cedarline Security is reviewing your intake data and preparing a tailored protection plan. Check back soon.
          </p>
        </div>
      ) : proposal ? (
        <div className="sq-detail-panel">
          <div className="sq-detail-header" style={{ padding: '32px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ background: 'var(--sq-teal-wash)', padding: '16px', borderRadius: '12px', color: 'var(--sq-teal)' }}>
              <FileCheck size={32} />
            </div>
            <div>
              <div className="sq-kicker" style={{ color: 'var(--sq-teal)' }}>Proposed Protection Plan</div>
              <h2 style={{ margin: '4px 0 8px', fontSize: '28px' }}>{proposal.packageName}</h2>
              <p style={{ margin: 0, fontSize: '14px' }}>Prepared specially for {prospect.name} based on your requirements.</p>
            </div>
          </div>
          
          <div className="sq-detail-body" style={{ padding: '32px' }}>
            <p style={{ color: 'var(--sq-muted)', fontSize: '14px', lineHeight: 1.6, marginBottom: '32px' }}>
              {proposal.description} This package was shared for the recorded needs of {proposal.needs.join(' and ') || 'your organization'}{proposal.requirements.length > 0 ? ` and the requirements ${proposal.requirements.join(', ')}` : ''}.
            </p>

            <div style={{ background: '#142527', border: '1px solid var(--sq-teal)', borderRadius: '8px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <div>
                <strong style={{ display: 'block', fontSize: '14px', color: 'var(--sq-ink)', marginBottom: '4px' }}>Estimated Investment</strong>
                <span style={{ color: 'var(--sq-muted)', fontSize: '12px' }}>Pricing based on intake asset counts.</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <strong style={{ display: 'block', font: '700 32px var(--app-font-display)', color: 'var(--sq-teal)', letterSpacing: '-.02em' }}>${proposal.estimatedMonthlyPrice}/mo estimated</strong>
                <span style={{ fontSize: '11px', color: 'var(--sq-teal)', textTransform: 'uppercase', letterSpacing: '.05em' }}>${proposal.price} {proposal.billingBasis.replace('_', ' ')}</span>
              </div>
            </div>

            <div className="sq-field-group">
              <div className="sq-field-group-title"><ShieldCheck size={14} /> Included Services & Capabilities</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {proposal.services.map(s => (
                  <li key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--sq-ink)', fontSize: '13px' }}>
                    <CheckCircle2 size={16} color="var(--sq-teal)" /> {s}
                  </li>
                ))}
              </ul>
            </div>

             <div className="sq-action-bar" style={{ marginTop: '40px', paddingTop: '32px', flexDirection: 'column', gap: '12px' }}>
               <textarea className="sq-textarea" value={decisionNote} onChange={event => setDecisionNote(event.target.value)} placeholder="Optional note for the MSP" data-testid="input-proposal-decision-note" />
               <button className="sq-button primary" onClick={() => decide('approved', 'Approved package selection in demo.')} style={{ width: '100%', padding: '16px', fontSize: '15px' }} data-testid="button-acknowledge-proposal">
                 Approve package (demo)
               </button>
               <button className="sq-button" onClick={() => decide('changes_requested', 'Please revise the package selection.')} data-testid="button-request-proposal-changes">Request changes</button>
               <button className="sq-button" onClick={() => decide('rejected', 'Package does not fit current requirements.')} data-testid="button-reject-proposal">Reject package</button>
               {prospect.proposalDecision && <div className="sq-simulation-banner" data-testid="proposal-decision-status">Package decision: {prospect.proposalDecision.decision} · version {prospect.proposalDecision.proposalVersion} · {prospect.proposalDecision.timestamp}</div>}
              <div style={{ textAlign: 'center', color: 'var(--sq-muted)', fontSize: '11px' }}>
                 Demo only. Package approval is not security-action approval, contracting, billing, or provisioning.
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}