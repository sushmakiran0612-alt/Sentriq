import { useEffect, useState } from 'react';
import { Prospect, Package, OrganizationSize, VendorProduct } from '@/hooks/use-msp-data';
import { UserPlus, Send, CheckCircle2, Calculator, Settings2, ShieldCheck, Pencil, AlertCircle } from 'lucide-react';
import type { ActionAudit } from '@/lib/demo-action-requests';
import '../shared/demo-styles.css';

export function ProspectsWorkspace({ 
  prospects, 
  packages,
  vendors,
  setProspects, 
  notify,
  activeWorkspaceId = 'cedarline',
  onAudit,
  selectedProspectKey,
  onSelectProspect,
}: { 
  prospects: Prospect[], 
  packages: Package[],
  vendors: VendorProduct[],
  setProspects: (p: Prospect[]) => void, 
  notify: (msg: string) => void,
  activeWorkspaceId?: string;
  onAudit: (event: ActionAudit) => void;
  selectedProspectKey: string | null;
  onSelectProspect: (prospect: Prospect | null) => void;
}) {
  const [selectedId, setSelectedId] = useState<string>(() => prospects.find(prospect => prospect.key === selectedProspectKey)?.id || prospects[0]?.id || '');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Partial<Prospect>>({});
  
  // Need/Req inputs
  const [needInput, setNeedInput] = useState('');
  const [reqInput, setReqInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [toolInput, setToolInput] = useState('');
  const [contactInput, setContactInput] = useState('');

  const [overrideMode, setOverrideMode] = useState(false);
  const [overridePkgId, setOverridePkgId] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [clarificationDrafts, setClarificationDrafts] = useState<Record<string, string>>({});
  const [resolutionDrafts, setResolutionDrafts] = useState<Record<string, string>>({});

  const selected = prospects.find(p => p.id === selectedId);
  const isComplete = selected?.intakeSubmitted || (selected?.manualAssets?.length ?? 0) > 0 || (selected?.intakeFiles?.length ?? 0) > 0;

  useEffect(() => {
    if (selectedProspectKey === null) return;
    const selectedFromShell = prospects.find(prospect => prospect.key === selectedProspectKey);
    if (selectedFromShell && selectedFromShell.id !== selectedId) {
      setSelectedId(selectedFromShell.id);
      setEditing(false);
    }
  }, [prospects, selectedId, selectedProspectKey]);

  const startEdit = (p: Prospect) => {
    setDraft({ ...p, needs: [...p.needs], requirements: [...p.requirements] });
    setEditing(true);
  };

  const startNew = () => {
    setDraft({
      name: '',
      size: '1-10',
      industry: '',
      needs: [],
      requirements: [],
      status: 'intake',
      internalNotes: '',
      locations: [],
      existingTools: [],
      contacts: [],
      intakeAnswers: {},
      manualAssets: [],
      intakeFiles: [],
      intakeSubmitted: false,
      proposalShared: false
    });
    setSelectedId('new');
    onSelectProspect(null);
    setEditing(true);
  };

  const saveProspect = () => {
    if (!draft.name?.trim()) return notify('Prospect name is required.');
    if (!draft.industry?.trim()) return notify('Industry is required.');
    const key = draft.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/^-+|-+$/g, '');
    if (!key) return notify('Prospect name must include letters or numbers.');
    const reservedManagedClientKeys = ['redwood', 'northstar', 'pine', 'aster'];
    if (reservedManagedClientKeys.includes(key)) return notify('That organization name is reserved for a managed client.');

    if (selectedId === 'new') {
      if (prospects.some(prospect => prospect.key === key)) return notify('A prospect with that name already exists.');
      const newP = { 
        ...draft, 
        id: `pr${Date.now()}`,
        key,
        workspaceId: activeWorkspaceId,
      } as Prospect;
      setProspects([...prospects, newP]);
      setSelectedId(newP.id);
      onSelectProspect(newP);
      notify('New prospect created.');
    } else {
      setProspects(prospects.map(p => p.id === selectedId ? { ...p, ...draft } as Prospect : p));
      notify('Prospect updated.');
    }
    setEditing(false);
  };

  const addArrayItem = (type: 'need' | 'req') => {
    if (type === 'need' && needInput.trim()) {
      setDraft({ ...draft, needs: [...(draft.needs || []), needInput.trim()] });
      setNeedInput('');
    } else if (type === 'req' && reqInput.trim()) {
      setDraft({ ...draft, requirements: [...(draft.requirements || []), reqInput.trim()] });
      setReqInput('');
    }
  };

  const addProfileItem = (type: 'location' | 'tool' | 'contact') => {
    const value = (type === 'location' ? locationInput : type === 'tool' ? toolInput : contactInput).trim();
    if (!value) return;
    const field = type === 'location' ? 'locations' : type === 'tool' ? 'existingTools' : 'contacts';
    const current = (draft[field] as unknown[] | undefined) ?? [];
    setDraft({ ...draft, [field]: type === 'contact'
      ? [...current, { name: value, email: '', role: 'Prospect contact' }]
      : [...current, value] });
    if (type === 'location') setLocationInput('');
    if (type === 'tool') setToolInput('');
    if (type === 'contact') setContactInput('');
  };

  const removeArrayItem = (type: 'need' | 'req', val: string) => {
    if (type === 'need') {
      setDraft({ ...draft, needs: (draft.needs || []).filter(x => x !== val) });
    } else {
      setDraft({ ...draft, requirements: (draft.requirements || []).filter(x => x !== val) });
    }
  };

  // Deterministic scoring function for recommendation
  const scorePackages = (prospect: Prospect) => {
    const scored = packages.map(pkg => {
      let score = 0;
      let reasons: string[] = [];
      const unmet: string[] = [];
      const missing: string[] = [];

      // Size match
      if (pkg.targetedSizes.includes(prospect.size)) {
        score += 10;
        reasons.push('Matches business size');
      }

      // Needs match
      const matchedNeeds = prospect.needs.filter(n => pkg.targetedNeeds.includes(n));
      score += matchedNeeds.length * 5;
      if (matchedNeeds.length > 0) reasons.push(`Covers needs: ${matchedNeeds.join(', ')}`);

      unmet.push(...prospect.needs.filter(n => !pkg.targetedNeeds.includes(n)));

      const selectedCapabilities = vendors
        .filter(vendor => pkg.vendorProductIds.includes(vendor.id))
        .flatMap(vendor => [vendor.category, ...vendor.capabilities]);
      const coverageText = [
        pkg.description,
        ...pkg.targetedNeeds,
        ...pkg.services,
        ...selectedCapabilities,
      ].join(' ').toLowerCase();
      const matchedRequirements = prospect.requirements.filter(requirement => {
        const terms = requirement.toLowerCase().split(/\s+/).filter(term => term.length > 2);
        return terms.some(term => coverageText.includes(term));
      });
      score += matchedRequirements.length * 3;
      if (matchedRequirements.length > 0) reasons.push(`Addresses requirements: ${matchedRequirements.join(', ')}`);
      unmet.push(...prospect.requirements.filter(requirement => !matchedRequirements.includes(requirement)));

      if (prospect.intakeAnswers.q1 === 'Yes') {
        const handlesRegulatedData = coverageText.includes('compliance') || coverageText.includes('hipaa') || coverageText.includes('soc');
        if (handlesRegulatedData) {
          score += 4;
          reasons.push('Includes controls aligned to regulated-data needs');
        } else {
          unmet.push('Regulated-data controls need confirmation');
        }
      }
      if (prospect.intakeAnswers.q2 === 'No') {
        const includesEndpointProtection = coverageText.includes('edr') || coverageText.includes('ngav') || coverageText.includes('antivirus');
        if (includesEndpointProtection) {
          score += 4;
          reasons.push('Includes baseline endpoint protection');
        } else {
          unmet.push('Endpoint protection coverage');
        }
      }
      if (prospect.manualAssets.length === 0 && prospect.intakeFiles.length === 0) missing.push('Asset inventory');
      if (!prospect.intakeAnswers.q1 || !prospect.intakeAnswers.q2) missing.push('Questionnaire responses');
      if (prospect.needs.length === 0) missing.push('Business needs');

      // Compute price based on asset count (fallback to 1 if empty)
      const userCount = prospect.manualAssets.reduce((sum, a) => sum + (a.type === 'endpoint' || a.type === 'user' ? a.count : 0), 0) || 10;
      let computedPrice = pkg.price;
      if (pkg.billingBasis === 'per_user' || pkg.billingBasis === 'per_endpoint') {
        computedPrice = pkg.price * userCount;
      }

      const criteriaCount = Math.max(1, 1 + prospect.needs.length + prospect.requirements.length + (prospect.intakeAnswers.q1 ? 1 : 0) + (prospect.intakeAnswers.q2 ? 1 : 0));
      const coveredCount = (pkg.targetedSizes.includes(prospect.size) ? 1 : 0) + matchedNeeds.length + matchedRequirements.length + reasons.filter(reason => reason.startsWith('Includes')).length;
      const coveragePercent = Math.min(100, Math.round((coveredCount / criteriaCount) * 100));

      return { pkg, score, reasons, unmet: [...new Set(unmet)], missing, computedPrice, coveragePercent };
    });

    return scored.sort((a, b) => b.score - a.score);
  };

  const computeRecommendation = (prospect: Prospect) => {
    if (!prospect.environmentConfirmed || (prospect.unresolvedGaps ?? []).length > 0 || (prospect.inventoryEvidence ?? []).some(evidence => evidence.state !== 'confirmed')) {
      const blockers = [
        ...(!prospect.environmentConfirmed ? ['client environment confirmation'] : []),
        ...(prospect.unresolvedGaps ?? []),
        ...(prospect.inventoryEvidence ?? []).filter(evidence => evidence.state !== 'confirmed').map(evidence => evidence.description),
      ];
      notify(`Draft recommendation blocked: resolve ${[...new Set(blockers)].join(', ')} before final selection.`);
      return;
    }
    notify('Evaluating rules-based criteria across package catalog...');
    setTimeout(() => {
      const scored = scorePackages(prospect);
      const topMatch = scored[0]?.pkg.id;
      setProspects(prospects.map(p => 
        p.id === prospect.id 
          ? { ...p, status: 'proposed_package', proposedPackageId: topMatch, proposalShared: false } 
          : p
      ));
      onAudit({ id: `recommendation-${prospect.id}`, workspaceId: activeWorkspaceId, clientKey: prospect.key, event: 'recommendation', actionDetails: topMatch ?? 'draft recommendation', requester: 'MSP administrator', approver: 'Not applicable', policyId: 'service-package', policyVersion: 1, decision: 'recommendation recorded', timestamp: '2024-05-14T10:55:00Z', executionOutcome: 'not applicable', internalNote: 'Rules-based demo recommendation.', clientSafeOutcome: 'A package recommendation is ready for review.' });
      notify('Demo rules-based recommendation computed.');
    }, 800);
  };

  const applyOverride = (prospect: Prospect) => {
    if (!overridePkgId) return notify('You must select an alternative package.');
    if (!overrideReason.trim()) return notify('You must provide a reason for the override.');
    setProspects(prospects.map(p => 
      p.id === prospect.id 
        ? { ...p, proposedPackageId: overridePkgId, proposalOverrideReason: overrideReason } 
        : p
    ));
    onAudit({ id: `override-${prospect.id}`, workspaceId: activeWorkspaceId, clientKey: prospect.key, event: 'override', actionDetails: overridePkgId, requester: 'MSP administrator', approver: 'Not applicable', policyId: 'service-package', policyVersion: 1, decision: 'override recorded', timestamp: '2024-05-14T10:55:00Z', executionOutcome: 'not applicable', internalNote: overrideReason, clientSafeOutcome: 'The MSP updated the proposed package.' });
    setOverrideMode(false);
    notify('Recommendation overridden successfully.');
  };

  const requestClarification = (prospect: Prospect, evidenceId: string) => {
    const question = clarificationDrafts[evidenceId]?.trim();
    if (!question) return notify('Enter a question tied to this evidence item.');
    setProspects(prospects.map(item => item.id === prospect.id ? {
      ...item,
      inventoryEvidence: (item.inventoryEvidence ?? []).map(evidence => evidence.id === evidenceId ? {
        ...evidence,
        state: evidence.state === 'confirmed' ? 'uncertain' : evidence.state,
        reviewNote: question,
        clientClarification: undefined,
        mspResolution: undefined,
        clarificationStatus: 'open',
      } : evidence),
      environmentConfirmed: false,
      proposalShared: false,
      status: 'assessment',
      proposalDecision: item.sharedProposal ? { decision: 'pending', actor: 'Pending client', timestamp: new Date().toISOString(), proposalVersion: item.sharedProposal.version ?? 1, note: 'Evidence changed; a new proposal version is required.' } : item.proposalDecision,
      unresolvedGaps: [...new Set([...(item.unresolvedGaps ?? []), item.inventoryEvidence?.find(evidence => evidence.id === evidenceId)?.description ?? 'Clarification'])],
    } : item));
    onAudit({ id: `clarification-request-${prospect.id}-${evidenceId}`, workspaceId: activeWorkspaceId, clientKey: prospect.key, event: 'clarification requested', actionDetails: question, requester: 'MSP administrator', approver: 'Pending client response', policyId: 'client-onboarding', policyVersion: prospect.sharedProposal?.version ?? 1, decision: 'question open', timestamp: new Date().toISOString(), executionOutcome: 'not applicable', internalNote: '', clientSafeOutcome: question });
    setClarificationDrafts(current => ({ ...current, [evidenceId]: '' }));
    notify('Question saved to the client onboarding record.');
  };

  const resolveClarification = (prospect: Prospect, evidenceId: string) => {
    const resolution = resolutionDrafts[evidenceId]?.trim();
    const evidence = prospect.inventoryEvidence?.find(item => item.id === evidenceId);
    if (!evidence?.clientClarification) return notify('Wait for a client response before resolving this question.');
    if (!resolution) return notify('Enter an MSP resolution note.');
    setProspects(prospects.map(item => item.id === prospect.id ? {
      ...item,
      inventoryEvidence: (item.inventoryEvidence ?? []).map(entry => entry.id === evidenceId ? { ...entry, state: 'confirmed', mspResolution: resolution, clarificationStatus: 'resolved' } : entry),
      unresolvedGaps: (item.unresolvedGaps ?? []).filter(gap => gap !== evidence.description),
      environmentConfirmed: false,
      proposalShared: false,
      status: 'assessment',
      proposalDecision: item.sharedProposal ? { decision: 'pending', actor: 'Pending client', timestamp: new Date().toISOString(), proposalVersion: item.sharedProposal.version ?? 1, note: 'Evidence changed; a new proposal version is required.' } : item.proposalDecision,
    } : item));
    onAudit({ id: `clarification-resolved-${prospect.id}-${evidenceId}`, workspaceId: activeWorkspaceId, clientKey: prospect.key, event: 'clarification resolved', actionDetails: `${evidence.description}: ${resolution}`, requester: 'MSP administrator', approver: 'MSP administrator', policyId: 'client-onboarding', policyVersion: prospect.sharedProposal?.version ?? 1, decision: 'resolved', timestamp: new Date().toISOString(), executionOutcome: 'evidence confirmed', internalNote: '', clientSafeOutcome: resolution });
    setResolutionDrafts(current => ({ ...current, [evidenceId]: '' }));
    notify('Clarification resolved with client response retained.');
  };

  const shareProposal = (prospect: Prospect, recommendation: ReturnType<typeof scorePackages>[number]) => {
    const nextVersion = (prospect.sharedProposal?.version ?? 0) + 1;
    setProspects(prospects.map(p => 
      p.id === prospect.id 
        ? (() => {
            const snapshot = {
              packageId: recommendation.pkg.id,
              packageName: recommendation.pkg.name,
              description: recommendation.pkg.description,
              services: [...recommendation.pkg.services],
              price: recommendation.pkg.price,
              billingBasis: recommendation.pkg.billingBasis,
              estimatedMonthlyPrice: recommendation.computedPrice,
              needs: [...p.needs],
              requirements: [...p.requirements],
              version: nextVersion,
              confidence: `${recommendation.coveragePercent}%`,
              rationale: recommendation.reasons.join(' · '),
              gaps: [...new Set([...recommendation.missing, ...recommendation.unmet])],
              sharedAt: new Date().toISOString(),
            };
            return {
            ...p,
            proposedPackageId: recommendation.pkg.id,
            proposalShared: true,
            status: 'ready_for_onboarding',
            proposalDecision: {
              decision: 'pending',
              actor: 'Pending client',
              timestamp: new Date().toISOString(),
              proposalVersion: nextVersion,
              note: 'Fresh approval required for this version.',
            },
            sharedProposal: snapshot,
            proposalHistory: [...(p.proposalHistory ?? []), snapshot],
          };
        })()
        : p
    ));
    onAudit({ id: `proposal-share-${prospect.id}-${recommendation.pkg.id}-${nextVersion}`, workspaceId: activeWorkspaceId, clientKey: prospect.key, event: 'proposal shared', actionDetails: recommendation.pkg.name, requester: 'MSP administrator', approver: 'Pending client', policyId: 'service-package', policyVersion: nextVersion, decision: 'shared', timestamp: new Date().toISOString(), executionOutcome: 'not applicable', internalNote: '', clientSafeOutcome: `Package proposal version ${nextVersion} is ready for your decision.` });
    notify(`Proposal version ${nextVersion} shared with ${prospect.name}. Fresh client approval is required; services are not activated.`);
  };

  const scoredList = selected ? scorePackages(selected) : [];
  const topPackage = selected?.proposalOverrideReason
    ? scoredList.find(s => s.pkg.id === selected.proposedPackageId) || scoredList[0]
    : scoredList[0];

  return (
    <div className="sq-workspace-transition" style={{ maxWidth: '1280px', margin: '0 auto' }}>
      <div className="sq-page-head">
        <div>
          <div className="sq-kicker">Pre-Onboarding</div>
          <h1>Prospect Pipeline</h1>
          <p>Track intake, run rules-based assessments, and share demo proposals with new clients.</p>
        </div>
        <div className="sq-page-head-tools">
          <button className="sq-button primary" onClick={startNew} data-testid="button-new-prospect"><Plus size={14} /> New prospect</button>
        </div>
      </div>

      <div className="sq-split-layout">
        <aside className="sq-list-panel">
          <div className="sq-list-panel-head">
            <span className="sq-list-panel-title">Active Prospects</span>
          </div>
          <div className="sq-list-items">
            {prospects.map(p => (
              <button 
                key={p.id} 
                className={`sq-list-item ${selectedId === p.id && !editing ? 'selected' : ''}`}
                onClick={() => { setSelectedId(p.id); onSelectProspect(p); setEditing(false); }}
                data-testid={`prospect-item-${p.id}`}
              >
                <strong>{p.name}</strong>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  {p.industry}
                  <span className={`sq-badge ${p.status === 'assessment' ? 'warning' : 'neutral'}`} style={{ padding: '2px 6px', fontSize: '9px' }}>
                    {p.status.replace(/_/g, ' ')}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </aside>

        <main className="sq-detail-panel">
          {editing ? (
            <div className="sq-detail-body">
              <h2 style={{ margin: '0 0 20px', font: '600 20px var(--app-font-display)', color: 'var(--sq-ink)' }}>
                {selectedId === 'new' ? 'New Prospect' : 'Edit Prospect'}
              </h2>
              
              <div className="sq-field-grid" style={{ marginBottom: '16px' }}>
                <div className="sq-field">
                  <label>Prospect Name <span style={{color:'var(--sq-red)'}}>*</span></label>
                  <input className="sq-input" value={draft.name || ''} onChange={e => setDraft({...draft, name: e.target.value})} data-testid="input-prospect-name" />
                </div>
                <div className="sq-field">
                  <label>Industry <span style={{color:'var(--sq-red)'}}>*</span></label>
                  <input className="sq-input" value={draft.industry || ''} onChange={e => setDraft({...draft, industry: e.target.value})} data-testid="input-prospect-industry" />
                </div>
                <div className="sq-field">
                  <label>Size</label>
                  <select className="sq-select-native" value={draft.size} onChange={e => setDraft({...draft, size: e.target.value as OrganizationSize})} data-testid="select-prospect-size">
                    <option value="1-10">1-10</option>
                    <option value="11-50">11-50</option>
                    <option value="51-200">51-200</option>
                    <option value="201-500">201-500</option>
                    <option value="500+">500+</option>
                  </select>
                </div>
              </div>

              <div className="sq-field-grid" style={{ marginBottom: '16px' }}>
                <div className="sq-field">
                  <label>Needs</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input className="sq-input" style={{ flex: 1 }} value={needInput} onChange={e => setNeedInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addArrayItem('need')} data-testid="input-prospect-need" />
                    <button className="sq-button" onClick={() => addArrayItem('need')} data-testid="button-add-need">Add</button>
                  </div>
                  <div className="sq-pill-list" style={{ marginTop: '8px' }}>
                    {draft.needs?.map(n => (
                      <span key={n} className="sq-pill">{n} <button style={{ background: 'none', border: 'none', color: 'var(--sq-muted)', cursor: 'pointer' }} onClick={() => removeArrayItem('need', n)}>&times;</button></span>
                    ))}
                  </div>
                </div>
                <div className="sq-field">
                  <label>Requirements</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input className="sq-input" style={{ flex: 1 }} value={reqInput} onChange={e => setReqInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addArrayItem('req')} data-testid="input-prospect-req" />
                    <button className="sq-button" onClick={() => addArrayItem('req')} data-testid="button-add-req">Add</button>
                  </div>
                  <div className="sq-pill-list" style={{ marginTop: '8px' }}>
                    {draft.requirements?.map(r => (
                      <span key={r} className="sq-pill">{r} <button style={{ background: 'none', border: 'none', color: 'var(--sq-muted)', cursor: 'pointer' }} onClick={() => removeArrayItem('req', r)}>&times;</button></span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="sq-field-grid" style={{ marginBottom: '16px' }}>
                {([
                  ['location', 'Locations', locationInput, setLocationInput, 'e.g. Austin, TX'],
                  ['tool', 'Existing tools', toolInput, setToolInput, 'e.g. Legacy antivirus'],
                  ['contact', 'Contacts', contactInput, setContactInput, 'Name or email'],
                ] as const).map(([kind, label, value, setter, placeholder]) => (
                  <div className="sq-field" key={kind}><label>{label}</label><div style={{ display: 'flex', gap: 8 }}><input className="sq-input" value={value} onChange={event => setter(event.target.value)} placeholder={placeholder} /><button className="sq-button" onClick={() => addProfileItem(kind)}>Add</button></div><div className="sq-pill-list">{(draft[kind === 'location' ? 'locations' : kind === 'tool' ? 'existingTools' : 'contacts'] ?? []).map((item) => <span className="sq-pill" key={typeof item === 'string' ? item : item.name}>{typeof item === 'string' ? item : item.name}</span>)}</div></div>
                ))}
              </div>

              <div className="sq-field" style={{ marginBottom: '24px' }}>
                <label>Internal Notes</label>
                <textarea className="sq-textarea" value={draft.internalNotes || ''} onChange={e => setDraft({...draft, internalNotes: e.target.value})} data-testid="input-prospect-notes" />
              </div>

              <div className="sq-action-bar">
                <button className="sq-button primary" onClick={saveProspect} data-testid="button-save-prospect">Save Prospect</button>
                <button className="sq-button" onClick={() => {
                  setEditing(false);
                  if (selectedId === 'new') {
                    const firstProspect = prospects[0];
                    setSelectedId(firstProspect?.id || '');
                    onSelectProspect(firstProspect ?? null);
                  }
                }} data-testid="button-cancel-prospect">Cancel</button>
              </div>
            </div>
          ) : selected ? (
            <>
              <div className="sq-detail-header">
                <div>
                  <h2>{selected.name}</h2>
                  <p>{selected.size} employees · {selected.industry}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="sq-badge" style={{ fontSize: '12px', padding: '6px 12px', marginBottom: '8px' }}>
                    Pipeline: {selected.status.replace(/_/g, ' ').toUpperCase()}
                  </div>
                  <div style={{ fontSize: '11px', color: isComplete ? 'var(--sq-teal)' : 'var(--sq-amber)' }}>
                    {isComplete ? 'Intake Complete' : 'Intake Incomplete'}
                  </div>
                </div>
              </div>

              <div className="sq-detail-body">
                <div className="sq-stepper">
                  <div className={`sq-step ${selected.status === 'intake' ? 'active' : 'completed'}`}>1. Intake</div>
                  <div className="sq-step-divider"></div>
                  <div className={`sq-step ${selected.status === 'assessment' ? 'active' : selected.status === 'proposed_package' || selected.status === 'ready_for_onboarding' ? 'completed' : ''}`}>2. Assessment</div>
                  <div className="sq-step-divider"></div>
                  <div className={`sq-step ${selected.status === 'proposed_package' ? 'active' : selected.status === 'ready_for_onboarding' ? 'completed' : ''}`}>3. Proposal</div>
                  <div className="sq-step-divider"></div>
                  <div className={`sq-step ${selected.status === 'ready_for_onboarding' ? 'active' : ''}`}>4. Onboarding</div>
                </div>

                <div className="sq-field-group">
                  <div className="sq-field-group-title">Intake Data Summary</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', background: '#142527', padding: '20px', borderRadius: '8px', border: '1px solid var(--sq-line-soft)' }}>
                    <div>
                      <div className="sq-label" style={{ marginBottom: '8px' }}>Business Needs & Requirements</div>
                      <div className="sq-pill-list" style={{ marginBottom: '16px' }}>
                        {selected.needs.map(n => <span key={n} className="sq-badge neutral">{n}</span>)}
                        {selected.requirements.map(n => <span key={n} className="sq-badge warning">{n}</span>)}
                        {selected.needs.length === 0 && selected.requirements.length === 0 && <span className="sq-muted">None specified</span>}
                      </div>
                      <div className="sq-label" style={{ marginBottom: '8px', marginTop: '16px' }}>Internal Notes</div>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--sq-muted)' }}>{selected.internalNotes || 'None'}</p>
                    </div>
                    <div>
                      <div className="sq-label" style={{ marginBottom: '8px' }}>Asset Inventory</div>
                      {isComplete ? (
                        <ul style={{ margin: 0, paddingLeft: '16px', color: 'var(--sq-muted)', fontSize: '12px', lineHeight: 1.6 }}>
                          {selected.manualAssets.map(a => <li key={a.id}>{a.count} {a.name} ({a.type})</li>)}
                          {selected.intakeFiles.length > 0 && <li>+ {selected.intakeFiles.length} file attachments</li>}
                          {selected.manualAssets.length === 0 && selected.intakeFiles.length === 0 && <li>No assets reported.</li>}
                        </ul>
                      ) : (
                        <div style={{ color: 'var(--sq-amber)', fontSize: '12px' }}><AlertCircle size={12} style={{display:'inline', marginBottom:'-2px'}}/> Waiting for client intake...</div>
                      )}
                    </div>
                  </div>
                  <div style={{ marginTop: '12px' }}>
                    <button className="sq-button ghost" onClick={() => startEdit(selected)} data-testid="button-edit-prospect"><Pencil size={14}/> Edit Prospect Info</button>
                  </div>
                  <div style={{ marginTop: '18px', borderTop: '1px solid var(--sq-line-soft)', paddingTop: 14 }}>
                    <div className="sq-simulation-banner" data-testid="msp-onboarding-progress">
                      <strong>Onboarding progress:</strong>{' '}
                      {selected.activated ? 'Monitoring active'
                        : selected.proposalDecision?.decision === 'approved' ? `Setup · ${(selected.integrationState ?? 'awaiting_access').replace('_', ' ')}`
                          : selected.proposalShared ? `Client decision · ${selected.proposalDecision?.decision ?? 'pending'}`
                            : selected.intakeSubmitted ? 'Confirm environment / MSP review'
                              : selected.businessDetailsSubmitted ? 'Assets needed' : 'Business details needed'}
                      {' · '}Missing: {(selected.unresolvedGaps ?? []).join(', ') || 'none'}
                      {' · '}Clarifications: {(selected.inventoryEvidence ?? []).filter(item => item.clarificationStatus && item.clarificationStatus !== 'resolved').length}
                    </div>
                    <div className="sq-field-group-title">Evidence review & clarifications</div>
                    {(selected.inventoryEvidence ?? []).map(item => (
                      <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 0', borderBottom: '1px solid var(--sq-line-soft)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                          <span>{item.description} · {(item.sources ?? [item.source]).join(' + ')} · <b style={{color: item.state === 'confirmed' ? 'var(--sq-teal)' : 'var(--sq-amber)'}}>{item.clarificationStatus ?? item.state}</b></span>
                        </div>
                        {item.reviewNote && <div style={{ color: 'var(--sq-amber)', fontSize: 12 }}><strong>Question to client:</strong> {item.reviewNote}</div>}
                        {item.clientClarification && (
                          <div style={{ background: 'var(--sq-teal-wash)', padding: '8px 12px', borderRadius: 6, fontSize: 11, color: 'var(--sq-teal)' }}>
                            <strong>Client says:</strong> {item.clientClarification}
                          </div>
                        )}
                        {item.mspResolution && <div style={{ fontSize: 12 }}><strong>Resolution:</strong> {item.mspResolution}</div>}
                        {item.clarificationStatus !== 'resolved' && (
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {!item.reviewNote && <>
                              <input className="sq-input" placeholder="Ask a specific field or asset question…" value={clarificationDrafts[item.id] ?? ''} onChange={event => setClarificationDrafts(current => ({ ...current, [item.id]: event.target.value }))} data-testid={`input-msp-question-${item.id}`} />
                              <button className="sq-button" onClick={() => requestClarification(selected, item.id)} data-testid={`button-msp-question-${item.id}`}>Ask client</button>
                            </>}
                            {item.clientClarification && <>
                              <input className="sq-input" placeholder="Record how the response resolves this item…" value={resolutionDrafts[item.id] ?? ''} onChange={event => setResolutionDrafts(current => ({ ...current, [item.id]: event.target.value }))} data-testid={`input-msp-resolution-${item.id}`} />
                              <button className="sq-button primary" onClick={() => resolveClarification(selected, item.id)} data-testid={`button-msp-resolve-${item.id}`}>Resolve after response</button>
                            </>}
                          </div>
                        )}
                      </div>
                    ))}
                    {(selected.unresolvedGaps ?? []).length > 0 && <div style={{ color: 'var(--sq-amber)', fontSize: 12 }}>Material gaps block a final recommendation or activation: {(selected.unresolvedGaps ?? []).join(', ')}. Review the source, correct the intake, then confirm each item.</div>}
                  </div>
                </div>

                {selected.status === 'assessment' && (
                  <div className="sq-action-bar" style={{ flexDirection: 'column', alignItems: 'flex-start', background: 'rgba(131, 210, 192, 0.05)', padding: '24px', borderRadius: '8px', border: '1px solid var(--sq-teal)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                      <Settings2 size={24} color="var(--sq-teal)" />
                      <div>
                         <strong style={{ display: 'block', fontSize: '15px', color: 'var(--sq-ink)' }}>{selected.environmentConfirmed ? 'Ready for Rules-Based Assessment' : 'Waiting for client environment confirmation'}</strong>
                         <span style={{ fontSize: '12px', color: 'var(--sq-muted)' }}>{selected.environmentConfirmed ? 'Intake is complete. Run the rules engine to match against your package matrix based on size, needs, and asset counts.' : 'Clarifications are resolved. Switch to the client identity so the client can review and confirm the current environment before recommendation.'}</span>
                      </div>
                    </div>
                     <button className="sq-button primary" disabled={!selected.environmentConfirmed} onClick={() => computeRecommendation(selected)} data-testid="button-compute-recommendation">
                      <Calculator size={14} /> Compute Recommendations
                    </button>
                  </div>
                )}

                {(selected.status === 'proposed_package' || selected.status === 'ready_for_onboarding') && topPackage && (
                  <div className="sq-recommendation-card">
                    <h3><ShieldCheck size={18} /> Rules-Based Demo Recommendation</h3>
                    
                    {overrideMode ? (
                      <div style={{ background: '#101d21', padding: '16px', borderRadius: '8px', marginTop: '16px' }}>
                        <h4 style={{ margin: '0 0 16px', fontSize: '14px', color: 'var(--sq-ink)' }}>Override Recommendation</h4>
                        <div className="sq-field-grid" style={{ marginBottom: '16px' }}>
                          <div className="sq-field">
                            <label>Select alternative package</label>
                            <select className="sq-select-native" value={overridePkgId} onChange={e => setOverridePkgId(e.target.value)} data-testid="select-override-package">
                              <option value="">Select...</option>
                              {packages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                          </div>
                          <div className="sq-field">
                            <label>Reason for override (Required) <span style={{color:'var(--sq-red)'}}>*</span></label>
                            <input className="sq-input" value={overrideReason} onChange={e => setOverrideReason(e.target.value)} placeholder="e.g. Client specifically asked for X" data-testid="input-override-reason" />
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="sq-button primary" onClick={() => applyOverride(selected)} data-testid="button-apply-override">Apply Override</button>
                          <button className="sq-button" onClick={() => setOverrideMode(false)}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ background: '#101d21', border: '1px solid rgba(131, 210, 192, 0.3)', padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div className="sq-kicker">Proposed Package</div>
                            <strong style={{ fontSize: '16px', color: 'var(--sq-ink)', display: 'block', margin: '4px 0' }}>
                              {topPackage.pkg.name}
                            </strong>
                            <div style={{ fontSize: '12px', color: 'var(--sq-muted)', marginTop: '8px' }}>
                              <strong>Rationale:</strong> {topPackage.reasons.length > 0 ? topPackage.reasons.join(' · ') : 'No strong match; review missing information and alternatives'}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--sq-teal)', marginTop: '4px' }}>
                              <strong>Estimated coverage:</strong> {topPackage.coveragePercent}% of recorded criteria
                            </div>
                            {topPackage.unmet.length > 0 && (
                              <div style={{ fontSize: '12px', color: 'var(--sq-amber)', marginTop: '4px' }}>
                                <strong>Unmet Needs:</strong> {topPackage.unmet.join(', ')}
                              </div>
                            )}
                            {topPackage.missing.length > 0 && (
                              <div style={{ fontSize: '12px', color: 'var(--sq-amber)', marginTop: '4px' }}>
                                <strong>Missing Information:</strong> {topPackage.missing.join(', ')}
                              </div>
                            )}
                            {selected.proposalOverrideReason && (
                              <div style={{ fontSize: '12px', color: 'var(--sq-teal)', marginTop: '4px' }}>
                                <strong>Manual Override Reason:</strong> {selected.proposalOverrideReason}
                              </div>
                            )}
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ font: '700 20px var(--app-font-display)', color: 'var(--sq-teal)' }}>
                              ${topPackage.computedPrice}/mo
                            </div>
                            <span style={{ fontSize: '10px', color: 'var(--sq-muted)', textTransform: 'uppercase' }}>
                              Estimated (based on asset counts)
                            </span>
                          </div>
                        </div>

                        <div style={{ marginTop: '16px' }}>
                          <strong style={{ fontSize: '12px', color: 'var(--sq-ink)', display: 'block', marginBottom: '8px' }}>Alternatives Considered</strong>
                          {scoredList.filter(s => s.pkg.id !== topPackage.pkg.id).map(s => (
                            <div key={s.pkg.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--sq-line-soft)', fontSize: '11px', color: 'var(--sq-muted)' }}>
                              <span>{s.pkg.name} ({s.coveragePercent}% coverage · score {s.score})</span>
                              <span>Est. ${s.computedPrice}/mo</span>
                            </div>
                          ))}
                        </div>

                        {(!selected.proposalShared || selected.proposalDecision?.decision === 'changes_requested' || selected.proposalDecision?.decision === 'rejected') && (
                          <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                            <button className="sq-button primary" onClick={() => shareProposal(selected, topPackage)} data-testid="button-share-proposal">
                              <Send size={14} /> {selected.proposalShared ? 'Revise & Share New Version' : 'Explicit Share Proposal'}
                            </button>
                            <button className="sq-button" onClick={() => setOverrideMode(true)} data-testid="button-start-override">
                              Select Different Package
                            </button>
                          </div>
                        )}
                        
                        {selected.proposalShared && (
                          <div style={{ marginTop: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--sq-teal)', fontSize: '12px', fontWeight: 600 }}>
                              <CheckCircle2 size={16} /> Proposal shared as a snapshot. Services are NOT activated or provisioned.
                            </div>
                            <button className="sq-button ghost" style={{ marginTop: '10px' }} onClick={() => computeRecommendation(selected)} data-testid="button-review-current-catalog">
                              Review current intake and catalog
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="sq-empty-state">
              <UserPlus size={32} />
              <p>Select a prospect to view pipeline status</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function Plus(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={props.size||24} height={props.size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M5 12h14"/><path d="M12 5v14"/></svg>;
}