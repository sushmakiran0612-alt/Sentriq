import { useState } from 'react';
import {
  Archive,
  Bot,
  Check,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  SlidersHorizontal,
  Users,
  Terminal,
  Smartphone,
} from 'lucide-react';
import './onboarding.css';

export type OnboardingAudience = 'client' | 'technician';

type ChecklistItem = {
  id: number;
  title: string;
  detail: string;
  severity: string;
  owner: string;
  status: string;
  aiSuggested?: boolean;
  startsOnApproval?: boolean;
};

export function OnboardingScreen({ audience }: { audience: OnboardingAudience }) {
  const [decision1, setDecision1] = useState<'yes' | 'no' | null>(null);
  const [decision2, setDecision2] = useState<'yes' | 'no' | null>(null);
  const [techTab, setTechTab] = useState<'72hr' | '30day' | '90day'>('72hr');
  const [draftApproved, setDraftApproved] = useState(false);
  const [draftAdjusted, setDraftAdjusted] = useState(false);
  const [draftHasChanges, setDraftHasChanges] = useState(false);
  const [draftStart, setDraftStart] = useState('approval');
  const [draftNote, setDraftNote] = useState('');

  const checklists: Record<'72hr' | '30day' | '90day', ChecklistItem[]> = {
    '72hr': [
      { id: 1, title: 'Restrict 3 flagged inbound ports across legacy warehouse segments', detail: 'Validate service dependencies before ACL enforcement.', severity: 'critical', owner: 'Technician', status: 'queued', aiSuggested: true },
      { id: 2, title: 'Configure protected backups for 3 uncovered warehouse servers', detail: 'Discovery complete; vault policy and restore checks queued.', severity: 'critical', owner: 'Sentriq automated', status: 'queued', startsOnApproval: true, aiSuggested: true },
      { id: 3, title: 'Deploy endpoint protection to 8 unenrolled devices', detail: 'Apply the baseline agent after the draft is approved.', severity: 'high', owner: 'Sentriq automated', status: 'in-progress', startsOnApproval: true, aiSuggested: true },
      { id: 4, title: 'Complete MFA enrollment for 6 remaining user accounts', detail: 'Enrollment prompts scheduled; monitor completion.', severity: 'high', owner: 'Technician', status: 'queued', aiSuggested: true }
    ],
    '30day': [
      { id: 5, title: 'Transition 6 warehouse stations to individual logins', detail: 'Sequence by site after workflow confirmation.', severity: 'medium', owner: 'Client decision', status: 'waiting-on-client' },
      { id: 6, title: 'Run security awareness baseline for 64 employees', detail: 'Assign modules based on initial role grouping.', severity: 'low', owner: 'Sentriq automated', status: 'queued' }
    ],
    '90day': [
      { id: 7, title: 'Quarterly access review and stale account pruning', detail: 'First review spans all 64 employee identities.', severity: 'low', owner: 'Sentriq automated', status: 'queued' },
      { id: 8, title: 'Full disaster recovery failover test', detail: 'Validate recovery for all 5 discovered servers.', severity: 'high', owner: 'Technician', status: 'queued' }
    ]
  };

  const activeChecklist = checklists[techTab].map((item) => ({
    ...item,
    status: item.startsOnApproval && !draftApproved ? 'starts-on-approval' : item.status,
  }));

  return (
    <div className="ob-wrap">
      <div className="ob-header">
        <div className="ob-context-bar">
          <div className="ob-client-context"><span className="ob-client-mark">FL</span><span><strong>Fenwick Logistics</strong><small>Day 0 onboarding · 64 employees · 3 warehouse sites</small></span></div>
          <span className="ob-day-zero-status"><span />Onboarding in progress</span>
        </div>

        {audience === 'client' ? (
          <div className="animate-fade-in">
            <div className="ob-eyebrow">Your Day-0 security brief</div>
            <h1 className="ob-title">Here's where Fenwick stands.</h1>
            <p className="ob-summary">
              We've started securing your three warehouse sites and have a clear plan for the few things still in progress. Your team can keep working while we handle the technical details.
            </p>
          </div>
        ) : (
          <div className="animate-fade-in">
            <div className="ob-eyebrow">Fenwick Logistics · Day 0</div>
            <h1 className="ob-title">Day-0 Onboarding Plan</h1>
            <p className="ob-summary">
              78 assets discovered across 3 sites · 74% baseline posture · 5 critical gaps require action.
            </p>
          </div>
        )}
      </div>

      {audience === 'client' && (
        <div className="animate-fade-in">
          <div className="ob-status-rows">
            <div className="ob-status-row">
              <div className="ob-status-icon warn">
                <Archive size={20} />
              </div>
              <div className="ob-status-info">
                <div className="ob-status-title">Backups</div>
                <div className="ob-status-desc">We've found all five warehouse servers and are preparing protection for the remaining three.</div>
              </div>
              <span className="ob-status-pill pending">Not set up yet</span>
            </div>

            <div className="ob-status-row">
              <div className="ob-status-icon good">
                <Smartphone size={20} />
              </div>
              <div className="ob-status-info">
                <div className="ob-status-title">Device protection</div>
                <div className="ob-status-desc">Protection is active on 70 of 78 devices. We're working through the final eight.</div>
              </div>
              <span className="ob-status-pill in-progress">Turning on now</span>
            </div>

            <div className="ob-status-row">
              <div className="ob-status-icon good">
                <Users size={20} />
              </div>
              <div className="ob-status-info">
                <div className="ob-status-title">Account security</div>
                <div className="ob-status-desc">58 of 64 employee accounts have stronger sign-in protection. The remaining prompts are already scheduled.</div>
              </div>
              <span className="ob-status-pill handled">Looking good</span>
            </div>
          </div>

          <section className="ob-auto-panel" aria-labelledby="already-handling-title">
            <ShieldCheck className="ob-auto-icon" size={22} />
            <div className="ob-auto-text">
              <div className="ob-panel-heading"><div><h2 id="already-handling-title">What we're already handling</h2><p>No action is needed from you for these items.</p></div><span>62% handled automatically</span></div>
              <ul className="ob-handled-list">
                <li><CheckCircle2 size={15} /><span>Baseline device protection is installed on most devices.</span></li>
                <li><CheckCircle2 size={15} /><span>Backup discovery has started on all five warehouse servers.</span></li>
                <li><CheckCircle2 size={15} /><span>Your existing email and file storage settings were checked and confirmed secure.</span></li>
              </ul>
            </div>
          </section>

          <div className="ob-section-intro"><div><h2 className="ob-section-title">Needs your input</h2><p>Two choices affect how your team works. A simple yes or no is all we need.</p></div><span>2 decisions</span></div>
          <div className="ob-decisions">
            <div className="ob-decision-card" data-testid="onboarding-decision-card">
              <div className="ob-decision-info">
                <h3>Set up individual logins for shared warehouse computers?</h3>
                <p>Six warehouse computers are shared today. Individual logins make it easier to keep each person's work secure, but add a quick sign-in step.</p>
              </div>
              <div className="ob-decision-actions">
                <button
                  className={`ob-btn ${decision1 === 'yes' ? 'selected-yes' : ''}`}
                  onClick={() => setDecision1('yes')}
                  type="button"
                  data-testid="button-decision-1-yes"
                >
                  Yes
                </button>
                <button
                  className={`ob-btn ${decision1 === 'no' ? 'selected-no' : ''}`}
                  onClick={() => setDecision1('no')}
                  type="button"
                  data-testid="button-decision-1-no"
                >
                  No
                </button>
              </div>
            </div>

            <div className="ob-decision-card" data-testid="onboarding-decision-card">
              <div className="ob-decision-info">
                <h3>Reach out to owners of unenrolled devices?</h3>
                <p>Eight devices have not connected yet. With your approval, your technician can contact their owners directly and help them finish setup.</p>
              </div>
              <div className="ob-decision-actions">
                <button
                  className={`ob-btn ${decision2 === 'yes' ? 'selected-yes' : ''}`}
                  onClick={() => setDecision2('yes')}
                  type="button"
                  data-testid="button-decision-2-yes"
                >
                  Yes
                </button>
                <button
                  className={`ob-btn ${decision2 === 'no' ? 'selected-no' : ''}`}
                  onClick={() => setDecision2('no')}
                  type="button"
                  data-testid="button-decision-2-no"
                >
                  No
                </button>
              </div>
            </div>
          </div>

          <h2 className="ob-section-title">What happens next</h2>
          <div className="ob-timeline">
            <div className="ob-timeline-step active">
              <div className="ob-timeline-dot"></div>
              <div className="ob-timeline-marker">Day 0</div>
              <div className="ob-timeline-content">Protection is turning on and your technician is reviewing what we found.</div>
            </div>
            <div className="ob-timeline-step">
              <div className="ob-timeline-dot"></div>
              <div className="ob-timeline-marker">Week 1</div>
              <div className="ob-timeline-content">We finish device setup and protect the remaining warehouse servers.</div>
            </div>
            <div className="ob-timeline-step">
              <div className="ob-timeline-dot"></div>
              <div className="ob-timeline-marker">30 days</div>
              <div className="ob-timeline-content">Your team gets simple guidance and we fine-tune protection around daily work.</div>
            </div>
            <div className="ob-timeline-step">
              <div className="ob-timeline-dot"></div>
              <div className="ob-timeline-marker">90 days</div>
              <div className="ob-timeline-content">We test recovery and complete the first full account check.</div>
            </div>
          </div>

          <div className="ob-reassurance">
            <ShieldCheck size={32} />
            <div>
              <strong>Your assigned technician is handling the technical side.</strong>
              <p>They'll keep this plan moving and will only reach out when a business decision is needed from you.</p>
            </div>
          </div>
        </div>
      )}

      {audience === 'technician' && (
        <div className="animate-fade-in">
          {draftApproved ? (
            <section className="ob-draft-banner approved" data-testid="onboarding-draft-banner">
              <div className="ob-draft-icon"><Check size={18} /></div>
              <div className="ob-draft-copy">
                <div className="ob-draft-kicker">Plan approved · brief sent to Fenwick Logistics</div>
                <h2>Day-0 remediation is ready to start.</h2>
                <p>The two AI-grouped protections are now moving into their approved execution states.</p>
              </div>
              <span className="ob-draft-approved-pill">Approved</span>
            </section>
          ) : (
            <section className={`ob-draft-banner${draftAdjusted ? ' adjusting' : ''}`} data-testid="onboarding-draft-banner">
              <div className="ob-draft-icon"><Bot size={19} /></div>
              <div className="ob-draft-copy">
                <div className="ob-draft-kicker">
                  {draftAdjusted
                    ? 'Draft open for adjustment'
                    : draftHasChanges
                      ? 'Adjustments saved · ready for approval'
                      : 'AI-generated draft ready for review'}
                </div>
                <h2>Drafted by Sentriq AI in 41 seconds, from 146 discovered signals across 78 assets.</h2>
                <p>Review the grouping below, then approve to send the client brief and start the 72-hour items.</p>
              </div>
              <div className="ob-draft-actions">
                <button
                  className="ob-draft-adjust"
                  onClick={() => setDraftAdjusted(true)}
                  type="button"
                  data-testid="button-adjust-draft"
                  aria-expanded={draftAdjusted}
                  aria-controls="onboarding-adjustment-panel"
                >
                  <SlidersHorizontal size={14} /> {draftHasChanges ? 'Edit adjustments' : 'Adjust'}
                </button>
                <button className="ob-draft-approve" onClick={() => setDraftApproved(true)} type="button" data-testid="button-approve-draft"><Check size={14} /> Approve &amp; send to client</button>
              </div>
            </section>
          )}

          {!draftApproved && draftAdjusted && (
            <form
              id="onboarding-adjustment-panel"
              className="ob-adjustment-panel"
              data-testid="onboarding-adjustment-panel"
              onSubmit={(event) => {
                event.preventDefault();
                setDraftHasChanges(true);
                setDraftAdjusted(false);
              }}
            >
              <div className="ob-adjustment-head">
                <div>
                  <span>Technician adjustment</span>
                  <h2>Fine-tune the proposed rollout</h2>
                  <p>These changes stay in the draft until you approve and send it to Fenwick Logistics.</p>
                </div>
                <button type="button" onClick={() => setDraftAdjusted(false)} aria-label="Close adjustments">Cancel</button>
              </div>
              <div className="ob-adjustment-fields">
                <label>
                  <span>Start automated 72-hour work</span>
                  <select
                    value={draftStart}
                    onChange={(event) => setDraftStart(event.target.value)}
                    data-testid="select-draft-start"
                  >
                    <option value="approval">Immediately on approval</option>
                    <option value="maintenance-window">Next maintenance window</option>
                    <option value="technician-release">After technician release</option>
                  </select>
                </label>
                <label>
                  <span>Implementation note</span>
                  <textarea
                    value={draftNote}
                    onChange={(event) => setDraftNote(event.target.value)}
                    placeholder="Add client constraints, sequencing guidance, or handoff details."
                    rows={3}
                    data-testid="input-draft-note"
                  />
                </label>
              </div>
              <div className="ob-adjustment-footer">
                <span>
                  Current start: {draftStart === 'approval'
                    ? 'immediately on approval'
                    : draftStart === 'maintenance-window'
                      ? 'next maintenance window'
                      : 'after technician release'}
                </span>
                <button type="submit" data-testid="button-save-draft-adjustments">
                  <Check size={14} /> Save adjustments
                </button>
              </div>
            </form>
          )}

          <div className="ob-metrics">
            <div className="ob-metric-card">
              <div className="ob-metric-val">78</div>
              <div className="ob-metric-label">Assets discovered</div>
              <div className="ob-metric-note">64 endpoints · 6 shared · 5 servers · 3 gateways</div>
            </div>
            <div className="ob-metric-card">
              <div className="ob-metric-val">74%</div>
              <div className="ob-metric-label">Baseline posture</div>
              <div className="ob-metric-note">Day-0 control coverage</div>
            </div>
            <div className="ob-metric-card">
              <div className="ob-metric-val ob-warn">5</div>
              <div className="ob-metric-label">Critical gaps</div>
              <div className="ob-metric-note">3 backup · 1 EDR · 1 network</div>
            </div>
            <div className="ob-metric-card">
              <div className="ob-metric-val">62%</div>
              <div className="ob-metric-label">Auto-remediated</div>
              <div className="ob-metric-note">baseline gaps handled</div>
            </div>
          </div>

          <section className="ob-tech-panel" aria-labelledby="remediation-title">
            <div className="ob-tech-panel-head"><div><h2 id="remediation-title">Onboarding checklist</h2><p>Prioritized work mapped to owner and execution window.</p></div>
          <div className="ob-tech-tabs" role="tablist" aria-label="Remediation phase">
            <button
              className="ob-tech-tab"
              role="tab"
              aria-selected={techTab === '72hr'}
              onClick={() => setTechTab('72hr')}
              type="button"
              data-testid="tab-tech-72hr"
            >
              72 HR
            </button>
            <button
              className="ob-tech-tab"
              role="tab"
              aria-selected={techTab === '30day'}
              onClick={() => setTechTab('30day')}
              type="button"
              data-testid="tab-tech-30day"
            >
              30 DAY
            </button>
            <button
              className="ob-tech-tab"
              role="tab"
              aria-selected={techTab === '90day'}
              onClick={() => setTechTab('90day')}
              type="button"
              data-testid="tab-tech-90day"
            >
              90 DAY
            </button>
          </div></div>

          <div className="ob-checklist">
            {activeChecklist.map((item) => (
              <div className="ob-checklist-item" key={item.id}>
                <div className="ob-checklist-meta">
                  <div className={`ob-severity ${item.severity}`} aria-label={`Severity: ${item.severity}`} />
                  {item.aiSuggested && <span className="ob-ai-tag"><Sparkles size={10} /> AI</span>}
                </div>
                <div className="ob-checklist-title"><strong>{item.title}</strong><span>{item.detail}</span></div>
                <div className={`ob-checklist-owner owner-${item.owner.toLowerCase().replaceAll(' ', '-')}`}>{item.owner}</div>
                <div className={`ob-checklist-status ${item.status}`}>
                  {item.status === 'starts-on-approval' ? 'Starts on approval' : item.status.replaceAll('-', ' ')}
                </div>
              </div>
            ))}
          </div>
          </section>

          <section className="ob-ai-rationale" aria-labelledby="ai-rationale-title" data-testid="panel-ai-rationale">
            <div className="ob-ai-rationale-head">
              <div className="ob-ai-rationale-title"><span className="ob-ai-rationale-icon"><Sparkles size={14} /></span><div><h2 id="ai-rationale-title">Why the AI grouped it this way</h2><p>Plain-language reasoning behind the proposed order.</p></div></div>
              <span className="ob-confidence-pill"><Sparkles size={11} /> 98% match to policy baseline</span>
            </div>
            <div className="ob-ai-rationale-grid">
              <div><strong>Critical protection gaps first</strong><p>Backup and endpoint protection gaps leave data at rest without a compensating control, matching the policy baseline's block-go-live threshold.</p></div>
              <div><strong>Shared logins stay with the client</strong><p>The shared-login change affects how staff sign in day to day, so it is routed to a client decision and owner sign-off.</p></div>
            </div>
          </section>

          <section className="ob-discovery-panel" aria-labelledby="discovery-title">
            <div className="ob-tech-panel-head"><div><h2 id="discovery-title">Discovery notes</h2><p>Raw Day-0 scan summary · read only</p></div><Terminal size={16} /></div>
          <div className="ob-raw-notes">
            <div>[10:42:01] SCAN START: Fenwick Logistics / 3 warehouse sites</div>
            <div><span className="ob-log-cyan">[10:42:08] ASSET:</span> 78 total = 64 employee endpoints + 6 shared stations + 5 servers + 3 gateways</div>
            <div><span className="ob-log-cyan">[10:42:15] NET:</span> Discovered 3 open ports on legacy subnet 192.168.10.x</div>
            <div><span className="ob-log-red">[10:42:28] EDR:</span> 70/78 assets protected; 8 employee devices unenrolled</div>
            <div><span className="ob-log-gold">[10:42:41] IDP:</span> MFA active for 58/64 directory users</div>
            <div><span className="ob-log-red">[10:42:55] BKP:</span> 2/5 critical servers verified in immutable vault</div>
            <div><span className="ob-log-cyan">[10:43:02] AUTO:</span> 62% of identified baseline gaps remediated automatically</div>
            <br/>
            <div>[10:43:03] SUMMARY: posture=74% / critical_gaps=5 / open_ports=3</div>
          </div>
          </section>
        </div>
      )}
    </div>
  );
}
