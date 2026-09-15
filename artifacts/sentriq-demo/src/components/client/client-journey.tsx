import { ChangeEvent, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock,
  DownloadCloud,
  Eye,
  FileText,
  ShieldCheck,
  X,
} from 'lucide-react';

import type {
  InventoryEvidence,
  ManualAsset,
  IntakeFile,
  OrganizationSize,
  Package,
  Prospect,
} from '@/hooks/use-msp-data';
import type { ActionAudit } from '@/lib/demo-action-requests';
import '../shared/demo-styles.css';

type StageId = 'business' | 'assets' | 'confirm' | 'package' | 'setup' | 'monitoring';
type FileDraft = {
  id: string;
  file: File;
  previewUrl?: string;
  parsedAssets?: ManualAsset[];
  error?: string;
};

const STAGES: { id: StageId; label: string }[] = [
  { id: 'business', label: 'Business details' },
  { id: 'assets', label: 'Assets' },
  { id: 'confirm', label: 'Confirm environment' },
  { id: 'package', label: 'Service package' },
  { id: 'setup', label: 'Setup' },
  { id: 'monitoring', label: 'Monitoring' },
];

function firstStage(prospect: Prospect): StageId {
  if (prospect.activated) return 'monitoring';
  if (prospect.proposalDecision?.decision === 'approved') return 'setup';
  if (prospect.proposalShared) return 'package';
  if (prospect.intakeSubmitted) return 'confirm';
  if (prospect.businessDetailsSubmitted) return 'assets';
  return 'business';
}

function reachedStage(prospect: Prospect) {
  if (prospect.activated) return 5;
  if (prospect.proposalDecision?.decision === 'approved') return 4;
  if (prospect.proposalShared) return 3;
  if (prospect.intakeSubmitted) return 2;
  if (prospect.businessDetailsSubmitted) return 1;
  return 0;
}

function sourceLabel(source: InventoryEvidence['source']) {
  return {
    manual: 'Manual entry',
    questionnaire: 'Questionnaire',
    spreadsheet: 'CSV import',
    photo: 'Photo · manual review',
    screenshot: 'Screenshot · manual review',
    simulated_integration: 'Sample discovery · simulated',
  }[source];
}

function mergeAssets(assets: ManualAsset[]) {
  return assets.reduce<ManualAsset[]>((result, asset) => {
    const existing = result.find(item =>
      item.name.trim().toLowerCase() === asset.name.trim().toLowerCase()
      && item.type.trim().toLowerCase() === asset.type.trim().toLowerCase());
    if (!existing) {
      result.push({ ...asset, sources: asset.sources?.length ? [...asset.sources] : ['manual'] });
      return result;
    }
    existing.count = Math.max(existing.count, asset.count);
    existing.sources = [...new Set([...(existing.sources ?? []), ...(asset.sources ?? [])])];
    return result;
  }, []);
}

export function ClientJourneyWorkspace({
  prospect,
  packages,
  prospects,
  setProspects,
  notify,
  onAudit,
  navigateOverview,
  onPresenterSwitchToMsp,
  presenterControls = false,
}: {
  prospect: Prospect;
  packages: Package[];
  prospects: Prospect[];
  setProspects: (prospects: Prospect[]) => void;
  notify: (message: string) => void;
  onAudit: (event: ActionAudit) => void;
  navigateOverview: () => void;
  onPresenterSwitchToMsp: () => void;
  presenterControls?: boolean;
}) {
  const [stage, setStage] = useState<StageId>(() => firstStage(prospect));
  const [size, setSize] = useState<OrganizationSize>(prospect.size);
  const [locations, setLocations] = useState((prospect.locations ?? []).join(', '));
  const [needs, setNeeds] = useState(prospect.needs.join(', '));
  const [tools, setTools] = useState((prospect.existingTools ?? []).join(', '));
  const [contactName, setContactName] = useState(prospect.contacts?.[0]?.name ?? '');
  const [contactEmail, setContactEmail] = useState(prospect.contacts?.[0]?.email ?? '');
  const [q1, setQ1] = useState(prospect.intakeAnswers.q1 ?? '');
  const [q2, setQ2] = useState(prospect.intakeAnswers.q2 ?? '');
  const [manualAssets, setManualAssets] = useState<ManualAsset[]>(prospect.manualAssets);
  const [assetName, setAssetName] = useState('');
  const [assetType, setAssetType] = useState('endpoint');
  const [assetCount, setAssetCount] = useState(1);
  const [files, setFiles] = useState<FileDraft[]>([]);
  const [savedFiles, setSavedFiles] = useState<IntakeFile[]>(prospect.intakeFiles);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [decisionNote, setDecisionNote] = useState('');
  const reached = reachedStage(prospect);
  const proposal = prospect.proposalShared ? prospect.sharedProposal : undefined;
  const evidence = prospect.inventoryEvidence ?? [];
  const unresolved = evidence.filter(item => item.state !== 'confirmed' || (item.clarificationStatus && item.clarificationStatus !== 'resolved'));
  const currentVersionApproved = prospect.proposalDecision?.decision === 'approved'
    && prospect.proposalDecision.proposalVersion === (proposal?.version ?? 0);

  const stageStatus = useMemo(() => STAGES.map((item, index) => {
    if (index < reached || prospect.activated) return 'complete';
    if (index === reached) {
      if (item.id === 'confirm' && unresolved.length) return 'needs-attention';
      if (item.id === 'package' && !proposal) return 'waiting';
      if (item.id === 'setup' && prospect.integrationState !== 'ready') return 'waiting';
      return 'current';
    }
    return 'waiting';
  }), [prospect.activated, prospect.integrationState, proposal, reached, unresolved.length]);

  const update = (changes: Partial<Prospect>) => {
    setProspects(prospects.map(item => item.id === prospect.id ? { ...item, ...changes } : item));
  };
  const invalidatedProposal = prospect.sharedProposal ? {
    proposalShared: false,
    status: 'assessment' as const,
    environmentConfirmed: false,
    proposalDecision: {
      decision: 'pending' as const,
      actor: 'Pending client',
      timestamp: new Date().toISOString(),
      proposalVersion: prospect.sharedProposal.version ?? 1,
      note: 'Onboarding inputs changed; a new proposal version is required.',
    },
  } : { environmentConfirmed: false };
  const storedDrafts = (drafts: FileDraft[]): IntakeFile[] => drafts.filter(file => !file.error).map(file => ({
    id: file.id,
    name: file.file.name,
    type: file.parsedAssets ? 'spreadsheet' : file.file.type === 'image/png' ? 'screenshot' : 'photo',
    size: `${Math.max(1, Math.round(file.file.size / 1024))} KB`,
    status: file.parsedAssets ? 'Parsed locally · draft rows saved' : 'Attached · manual transcription required',
    previewUrl: file.previewUrl,
    parsedRows: file.parsedAssets?.length,
    parsedAssets: file.parsedAssets,
  }));

  const audit = (event: string, decision: string, details: string) => onAudit({
    id: `${event}-${prospect.id}-${Date.now()}`,
    workspaceId: prospect.workspaceId ?? 'cedarline',
    clientKey: prospect.key,
    event,
    actionDetails: details,
    requester: prospect.contacts?.[0]?.name ?? 'Client demo contact',
    approver: 'Not applicable',
    policyId: 'client-onboarding',
    policyVersion: proposal?.version ?? 1,
    decision,
    timestamp: new Date().toISOString(),
    executionOutcome: 'session-local demo state',
    internalNote: '',
    clientSafeOutcome: decision,
  });

  const saveBusiness = (continueJourney: boolean) => {
    if (!locations.trim()) return notify('Add at least one business location.');
    if (!needs.trim()) return notify('Add at least one security need.');
    if (!contactName.trim()) return notify('Add the primary contact name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) return notify('Enter a valid primary contact email.');
    update({
      ...invalidatedProposal,
      size,
      locations: locations.split(',').map(value => value.trim()).filter(Boolean),
      needs: needs.split(',').map(value => value.trim()).filter(Boolean),
      existingTools: tools.split(',').map(value => value.trim()).filter(Boolean),
      contacts: [{ name: contactName.trim(), email: contactEmail.trim(), role: 'IT lead' }],
      businessDraftSaved: true,
      businessDetailsSubmitted: continueJourney || prospect.businessDetailsSubmitted,
    });
    audit(continueJourney ? 'business details submitted' : 'business draft saved', continueJourney ? 'complete' : 'draft saved', `${size} · ${locations}`);
    notify(continueJourney ? 'Business details saved. Continue with assets.' : 'Draft saved in this browser session.');
    if (continueJourney) setStage('assets');
  };

  const addAsset = () => {
    if (!assetName.trim()) return notify('Enter an asset name.');
    if (!Number.isInteger(assetCount) || assetCount < 1) return notify('Asset count must be a positive whole number.');
    setManualAssets(current => [...current, {
      id: `manual-${Date.now()}`,
      name: assetName.trim(),
      type: assetType,
      count: assetCount,
      sources: ['manual'],
    }]);
    setAssetName('');
    setAssetCount(1);
  };

  const parseFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    for (const file of Array.from(event.target.files ?? [])) {
      const id = `file-${Date.now()}-${Math.random()}`;
      if (file.name.toLowerCase().endsWith('.xlsx')) {
        setFiles(current => [...current, { id, file, error: 'XLSX is not parsed in this demo. Export it as CSV and upload that file.' }]);
        continue;
      }
      if (file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv') {
        if (file.size > 10 * 1024 * 1024) {
          setFiles(current => [...current, { id, file, error: 'CSV exceeds the 10MB demo limit.' }]);
          continue;
        }
        const rows = (await file.text()).split(/\r?\n/).map(line => line.split(',').map(value => value.trim())).filter(row => row.some(Boolean));
        const headers = rows[0]?.map(header => header.toLowerCase()) ?? [];
        const nameIndex = headers.findIndex(header => ['name', 'asset', 'asset name', 'device'].includes(header));
        const typeIndex = headers.findIndex(header => ['type', 'asset type', 'category'].includes(header));
        const countIndex = headers.findIndex(header => ['count', 'quantity', 'qty'].includes(header));
        if (nameIndex < 0 || countIndex < 0) {
          setFiles(current => [...current, { id, file, error: 'CSV needs name and count columns. Type is optional.' }]);
          continue;
        }
        const parsedAssets = rows.slice(1).map((row, index) => ({
          id: `${id}-row-${index}`,
          name: row[nameIndex] ?? '',
          type: row[typeIndex] || 'endpoint',
          count: Number(row[countIndex]),
          sources: [`CSV: ${file.name}`],
        })).filter(item => item.name && Number.isInteger(item.count) && item.count > 0);
        if (parsedAssets.length !== rows.length - 1 || !parsedAssets.length) {
          setFiles(current => [...current, { id, file, error: 'Every CSV row needs a name and positive whole-number count.' }]);
          continue;
        }
        setFiles(current => [...current, { id, file, parsedAssets }]);
        continue;
      }
      if (['image/png', 'image/jpeg'].includes(file.type)) {
        if (file.size > 5 * 1024 * 1024) {
          setFiles(current => [...current, { id, file, error: 'Image exceeds the 5MB demo limit.' }]);
          continue;
        }
        setFiles(current => [...current, { id, file, previewUrl: URL.createObjectURL(file) }]);
        continue;
      }
      setFiles(current => [...current, { id, file, error: 'Unsupported type. Use CSV, XLSX, PNG, JPG, or JPEG.' }]);
    }
    event.target.value = '';
  };

  const saveAssetDraft = () => {
    const persisted = [...savedFiles, ...storedDrafts(files)].filter((file, index, all) => all.findIndex(item => item.id === file.id) === index);
    update({ ...invalidatedProposal, intakeAnswers: { q1, q2 }, manualAssets, intakeFiles: persisted });
    setSavedFiles(persisted);
    setFiles([]);
    audit('asset draft saved', 'draft saved', `${manualAssets.length} manual asset groups · ${persisted.length} saved files`);
    notify('Asset draft saved in this browser session.');
  };

  const submitAssets = () => {
    if (!q1 || !q2) return notify('Answer both questionnaire questions before continuing.');
    const validFiles = files.filter(file => !file.error);
    const persistedFiles = [...savedFiles, ...storedDrafts(validFiles)].filter((file, index, all) => all.findIndex(item => item.id === file.id) === index);
    const combined = mergeAssets([...manualAssets, ...persistedFiles.flatMap(file => file.parsedAssets ?? [])]);
    if (!combined.length) return notify('Add at least one manual asset or valid CSV row.');
    const assetEvidence: InventoryEvidence[] = combined.map(asset => ({
      id: `asset-${asset.id}`,
      description: `${asset.count} ${asset.name} (${asset.type})`,
      source: asset.sources?.some(source => source.startsWith('CSV:')) ? 'spreadsheet' : asset.sources?.includes('sample discovery') ? 'simulated_integration' : 'manual',
      state: 'confirmed',
      assetName: asset.name,
      assetType: asset.type,
      assetCount: asset.count,
      sources: asset.sources,
    }));
    const imageEvidence: InventoryEvidence[] = persistedFiles.filter(file => file.type === 'photo' || file.type === 'screenshot').map(file => ({
      id: `image-${file.id}`,
      description: file.name,
      source: file.type === 'screenshot' ? 'screenshot' : 'photo',
      state: 'uncertain',
      reviewNote: 'No image extraction is performed. Transcribe what this proves or ask your MSP.',
      clarificationStatus: 'open',
    }));
    const retainedQuestions = evidence.filter(item => item.clarificationStatus && !item.assetName);
    const nextEvidence = [
      ...assetEvidence,
      { id: 'questionnaire', description: 'Security questionnaire responses', source: 'questionnaire', state: 'confirmed' } as InventoryEvidence,
      ...imageEvidence,
      ...retainedQuestions,
    ];
    update({
      ...invalidatedProposal,
      intakeAnswers: { q1, q2 },
      manualAssets: combined,
      intakeFiles: persistedFiles,
      inventoryEvidence: nextEvidence,
      intakeSubmitted: true,
      status: 'assessment',
      unresolvedGaps: nextEvidence.filter(item => item.state !== 'confirmed').map(item => item.description),
      environmentConfirmed: false,
    });
    setManualAssets(combined);
    setSavedFiles(persistedFiles);
    setFiles([]);
    audit('asset inventory submitted', 'submitted for review', `${combined.length} reconciled groups · ${persistedFiles.length} files`);
    notify('Assets saved. Review the environment and resolve highlighted items.');
    setStage('confirm');
  };

  const addSampleDiscovery = () => {
    setManualAssets(current => mergeAssets([...current, {
      id: `sample-${Date.now()}`,
      name: 'Windows servers',
      type: 'server',
      count: 3,
      sources: ['sample discovery'],
    }]));
    notify('Explicit sample discovery data added to the draft. No live discovery ran.');
  };

  const updateEvidence = (id: string, changes: Partial<InventoryEvidence>) => {
    const next = evidence.map(item => item.id === id ? { ...item, ...changes } : item);
    update({
      ...invalidatedProposal,
      inventoryEvidence: next,
      unresolvedGaps: next.filter(item => item.state !== 'confirmed' || (item.clarificationStatus && item.clarificationStatus !== 'resolved')).map(item => item.description),
    });
  };

  const sendResponse = (item: InventoryEvidence, response: string) => {
    if (!response.trim()) return notify('Enter a response or choose “I don’t know / Ask my MSP”.');
    updateEvidence(item.id, { clientClarification: response.trim(), clarificationStatus: 'responded' });
    audit('clarification response', 'response sent', `${item.description}: ${response.trim()}`);
    setResponses(current => ({ ...current, [item.id]: '' }));
    notify('Response saved for MSP review. The MSP must still resolve this item.');
  };

  const updateEvidenceCount = (item: InventoryEvidence, count: number) => {
    if (!Number.isInteger(count) || count < 1) return;
    const nextAssets = prospect.manualAssets.map(asset => asset.id === item.id.replace('asset-', '') ? { ...asset, count } : asset);
    update({
      ...invalidatedProposal,
      manualAssets: nextAssets,
      inventoryEvidence: evidence.map(entry => entry.id === item.id ? { ...entry, assetCount: count, description: `${count} ${entry.assetName} (${entry.assetType})`, state: 'confirmed' } : entry),
    });
    audit('environment item corrected', 'count corrected', `${item.assetName}: ${count}`);
  };

  const confirmEnvironment = () => {
    if (unresolved.length) return notify(`Cannot continue: ${unresolved.map(item => item.description).join(', ')} still needs confirmation or MSP resolution.`);
    update({ environmentConfirmed: true, unresolvedGaps: [] });
    audit('environment confirmed', 'confirmed', `${evidence.length} evidence records`);
    notify('Environment confirmed. Cedarline Security can prepare the package.');
    setStage('package');
  };

  const decideProposal = (decision: 'approved' | 'rejected' | 'changes_requested') => {
    if (!proposal) return;
    const actor = prospect.contacts?.[0]?.name ?? 'Client demo contact';
    update({
      proposalDecision: {
        decision,
        actor,
        timestamp: new Date().toISOString(),
        proposalVersion: proposal.version ?? 1,
        note: decisionNote.trim() || undefined,
      },
    });
    onAudit({
      id: `proposal-${decision}-${prospect.id}-${proposal.version}-${Date.now()}`,
      workspaceId: prospect.workspaceId ?? 'cedarline',
      clientKey: prospect.key,
      event: `proposal ${decision}`,
      actionDetails: proposal.packageName,
      requester: actor,
      approver: actor,
      policyId: 'service-package',
      policyVersion: proposal.version ?? 1,
      decision,
      timestamp: new Date().toISOString(),
      executionOutcome: 'not applicable',
      internalNote: '',
      clientSafeOutcome: decisionNote.trim() || decision.replace('_', ' '),
    });
    notify(decision === 'approved'
      ? 'Package approved. This does not approve security actions, contracting, billing, or provisioning.'
      : 'Decision returned to Cedarline Security. A revised version will require a fresh approval.');
    if (decision === 'approved') setStage('setup');
  };

  const nextActor = stage === 'package' && !proposal ? 'Cedarline Security'
    : stage === 'setup' ? 'Cedarline Security'
      : unresolved.some(item => item.clarificationStatus === 'responded') ? 'Cedarline Security'
        : prospect.name;

  return (
    <div className="sq-workspace-transition" style={{ maxWidth: 1100, margin: '0 auto' }} data-testid="client-onboarding-journey">
      <div className="sq-page-head">
        <div>
          <div className="sq-kicker">Client onboarding demo · Cedarline Security</div>
          <h1>{prospect.name} security onboarding</h1>
          <p>One browser-tab journey from business context through monitored service. Structured progress survives refresh in this tab; no live discovery, messaging, provisioning, or credentials are used.</p>
        </div>
        {presenterControls && <button className="sq-button ghost" onClick={onPresenterSwitchToMsp} data-testid="button-presenter-switch-msp">
          Presenter control · view as MSP
        </button>}
      </div>

      <section className="sq-detail-panel" style={{ marginBottom: 18 }}>
        <div className="sq-detail-body" style={{ padding: 18 }}>
          <div className="sq-kicker">Next action</div>
          <strong data-testid="journey-next-actor">{nextActor} acts next</strong>
          <p className="sq-muted" style={{ marginBottom: 0 }}>
            {unresolved.length
              ? `${unresolved.length} item${unresolved.length === 1 ? '' : 's'} need confirmation, response, or MSP resolution.`
              : stage === 'package' && !proposal
                ? 'Your confirmed intake is ready for the MSP to compute and share a package.'
                : stage === 'setup'
                  ? 'The MSP must complete the simulated integration checklist and activate.'
                  : 'Continue the highlighted stage; completed answers remain available when you return.'}
          </p>
        </div>
      </section>

      <div className="sq-stepper" style={{ marginBottom: 24, overflowX: 'auto', justifyContent: 'space-between' }}>
        {STAGES.map((item, index) => (
          <button
            key={item.id}
            className={`sq-step ${stage === item.id ? 'active' : stageStatus[index] === 'complete' ? 'completed' : ''}`}
            disabled={index > reached}
            onClick={() => index <= reached && setStage(item.id)}
            data-testid={`button-journey-stage-${item.id}`}
            style={{ background: 'none', border: 0, cursor: index <= reached ? 'pointer' : 'default', minWidth: 120 }}
          >
            {stageStatus[index] === 'complete' ? <CheckCircle2 size={13} /> : stageStatus[index] === 'needs-attention' ? <AlertCircle size={13} /> : <Circle size={13} />}
            <span>{item.label}</span>
            <small style={{ display: 'block' }}>{stageStatus[index].replace('-', ' ')}</small>
          </button>
        ))}
      </div>

      <section className="sq-detail-panel">
        <div className="sq-detail-body" style={{ padding: 28 }}>
          {stage === 'business' && (
            <div className="animate-fade-in">
              <div className="sq-field-group-title">Business details</div>
              <p className="sq-muted">Known Meridian details are prefilled. Correct them rather than entering the same information again.</p>
              <div className="sq-field-grid">
                <label className="sq-field">Company size<select className="sq-select-native" value={size} onChange={event => setSize(event.target.value as OrganizationSize)} data-testid="input-b-size"><option>1-10</option><option>11-50</option><option>51-200</option><option>201-500</option><option>500+</option></select></label>
                <label className="sq-field">Locations *<input className="sq-input" value={locations} onChange={event => setLocations(event.target.value)} data-testid="input-b-locations" /></label>
                <label className="sq-field">Security needs *<input className="sq-input" value={needs} onChange={event => setNeeds(event.target.value)} data-testid="input-b-needs" /></label>
                <label className="sq-field">Existing security tools<input className="sq-input" value={tools} onChange={event => setTools(event.target.value)} data-testid="input-b-tools" /></label>
                <label className="sq-field">Primary contact *<input className="sq-input" value={contactName} onChange={event => setContactName(event.target.value)} data-testid="input-b-contact-name" /></label>
                <label className="sq-field">Contact email *<input className="sq-input" value={contactEmail} onChange={event => setContactEmail(event.target.value)} data-testid="input-b-contact-email" /></label>
              </div>
              <div className="sq-action-bar">
                <button className="sq-button ghost" onClick={() => saveBusiness(false)} data-testid="button-save-business-draft">Save draft</button>
                <button className="sq-button primary" onClick={() => saveBusiness(true)} data-testid="button-save-business">Continue to Assets <ArrowRight size={14} /></button>
              </div>
            </div>
          )}

          {stage === 'assets' && (
            <div className="animate-fade-in">
              <div className="sq-field-group-title">Assets and questionnaire</div>
              <p className="sq-muted">Manual entry remains available alongside CSV imports and explicitly labeled sample discovery.</p>
              <div className="sq-field-grid">
                <label className="sq-field">Payment cards or healthcare data? *<select className="sq-select-native" value={q1} onChange={event => setQ1(event.target.value)} data-testid="select-q1"><option value="">Select…</option><option>Yes</option><option>No</option></select></label>
                <label className="sq-field">Active antivirus or security software? *<select className="sq-select-native" value={q2} onChange={event => setQ2(event.target.value)} data-testid="select-q2"><option value="">Select…</option><option>Yes</option><option>No</option></select></label>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '20px 0' }}>
                <input className="sq-input" placeholder="Asset name" value={assetName} onChange={event => setAssetName(event.target.value)} data-testid="input-asset-name" />
                <select className="sq-select-native" value={assetType} onChange={event => setAssetType(event.target.value)} data-testid="select-asset-type"><option value="endpoint">Endpoint</option><option value="server">Server</option><option value="network">Network device</option></select>
                <input className="sq-input" type="number" min={1} value={assetCount} onChange={event => setAssetCount(Number(event.target.value))} data-testid="input-asset-count" />
                <button className="sq-button" onClick={addAsset} data-testid="button-add-asset">Add manual asset</button>
              </div>
              {manualAssets.map(asset => <div className="sq-capacity-row" key={asset.id}><div><strong>{asset.name}</strong><span>{asset.count} {asset.type} · {(asset.sources ?? ['manual']).join(' + ')}</span></div><button className="sq-button ghost" onClick={() => setManualAssets(current => current.filter(item => item.id !== asset.id))}>Remove</button></div>)}
              <div style={{ padding: 22, border: '1px dashed var(--sq-teal)', borderRadius: 8, marginTop: 20 }}>
                <input type="file" id="journey-file-input" multiple accept=".csv,.xlsx,image/png,image/jpeg" onChange={parseFiles} data-testid="input-file-upload" style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }} />
                <label htmlFor="journey-file-input" className="sq-button" style={{ cursor: 'pointer' }}><DownloadCloud size={15} /> Choose real files</label>
                <button className="sq-button ghost" onClick={addSampleDiscovery} data-testid="button-add-sample-discovery">Add sample discovery data</button>
                <p className="sq-muted">CSV is parsed locally using name, count, and optional type columns. XLSX is accepted only to explain that conversion to CSV is required. Images are previewed but not extracted.</p>
              </div>
              {files.map(file => <div key={file.id} className="sq-capacity-row" data-testid={`file-draft-${file.id}`}><div>{file.previewUrl ? <img src={file.previewUrl} alt={`Preview of ${file.file.name}`} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 5 }} /> : <FileText size={20} />}<strong>{file.file.name}</strong><span>{file.error ?? (file.parsedAssets ? `${file.parsedAssets.length} valid CSV rows ready for review` : 'Image attached · manual transcription required')}</span>{file.parsedAssets?.map(row => <small key={row.id}>{row.name} · {row.type} · {row.count}</small>)}</div><button className="sq-button ghost" onClick={() => setFiles(current => current.filter(item => item.id !== file.id))}><X size={14} /> Remove</button></div>)}
              {savedFiles.map(file => <div key={file.id} className="sq-capacity-row" data-testid={`saved-file-${file.id}`}><div>{file.previewUrl ? <img src={file.previewUrl} alt={`Saved preview of ${file.name}`} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 5 }} /> : <FileText size={20} />}<strong>{file.name}</strong><span>{file.status}{file.parsedRows ? ` · ${file.parsedRows} rows` : ''}</span>{file.parsedAssets?.map(row => <small key={row.id}>{row.name} · {row.type} · {row.count}</small>)}</div><button className="sq-button ghost" onClick={() => setSavedFiles(current => current.filter(item => item.id !== file.id))}><X size={14} /> Remove from draft</button></div>)}
              <p className="sq-muted">Attachment metadata and parsed CSV rows survive refresh in this browser tab. Selected file bytes and image previews do not; choose the file again to preview it. Reset clears saved demo progress. No file leaves the browser.</p>
              <div className="sq-action-bar">
                <button className="sq-button ghost" onClick={() => setStage('business')}><ArrowLeft size={14} /> Back</button>
                <button className="sq-button ghost" onClick={saveAssetDraft} data-testid="button-save-asset-draft">Save draft</button>
                <button className="sq-button primary" onClick={submitAssets} data-testid="button-submit-assets">Continue to Confirm environment <ArrowRight size={14} /></button>
              </div>
            </div>
          )}

          {stage === 'confirm' && (
            <div className="animate-fade-in">
              <div className="sq-field-group-title">Confirm environment</div>
              <p className="sq-muted">Confirm or correct each record. A response does not resolve an MSP question; the MSP records resolution separately.</p>
              {evidence.map(item => (
                <div key={item.id} style={{ padding: 16, border: `1px solid ${item.state === 'confirmed' ? 'var(--sq-line-soft)' : 'var(--sq-amber)'}`, borderRadius: 8, marginBottom: 12 }} data-testid={`evidence-${item.id}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <div><strong>{item.description}</strong><div className="sq-muted">Source: {(item.sources?.length ? item.sources : [sourceLabel(item.source)]).join(' + ')}</div></div>
                    <span className={`sq-badge ${item.state === 'confirmed' ? 'neutral' : 'warning'}`}>{item.clarificationStatus ?? item.state}</span>
                  </div>
                  {item.sources && item.sources.length > 1 && <div className="sq-simulation-banner">Possible overlap reconciled: the highest reported count is used once; both sources are retained.</div>}
                  {item.assetCount && <label className="sq-field" style={{ maxWidth: 180, marginTop: 10 }}>Confirmed count<input type="number" min={1} className="sq-input" value={item.assetCount} onChange={event => updateEvidenceCount(item, Number(event.target.value))} /></label>}
                  {item.reviewNote && <div style={{ marginTop: 10, color: 'var(--sq-amber)' }}><strong>MSP question:</strong> {item.reviewNote}</div>}
                  {item.clientClarification && <div style={{ marginTop: 8 }}><strong>Your response:</strong> {item.clientClarification}</div>}
                  {item.mspResolution && <div style={{ marginTop: 8, color: 'var(--sq-teal)' }}><strong>MSP resolution:</strong> {item.mspResolution}</div>}
                  {item.state !== 'confirmed' && item.clarificationStatus !== 'responded' && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                      <input className="sq-input" value={responses[item.id] ?? ''} onChange={event => setResponses(current => ({ ...current, [item.id]: event.target.value }))} placeholder="Correction or answer for your MSP" data-testid={`input-clarification-${item.id}`} />
                      <button className="sq-button" onClick={() => sendResponse(item, responses[item.id] ?? '')} data-testid={`button-send-clarification-${item.id}`}>Send response</button>
                      <button className="sq-button ghost" onClick={() => sendResponse(item, 'I do not know. Please help me confirm this.')} data-testid={`button-ask-msp-${item.id}`}>I don’t know / Ask my MSP</button>
                    </div>
                  )}
                </div>
              ))}
              {unresolved.length > 0 && <div className="sq-simulation-banner" data-testid="environment-blockers"><AlertCircle size={14} /> Material blockers: {unresolved.map(item => item.description).join(', ')}. Respond or ask your MSP; after a response, Cedarline must resolve it.</div>}
              <div className="sq-action-bar">
                <button className="sq-button ghost" onClick={() => setStage('assets')}><ArrowLeft size={14} /> Back</button>
                <button className="sq-button primary" onClick={confirmEnvironment} disabled={unresolved.length > 0} data-testid="button-confirm-environment">Continue to Service package <ArrowRight size={14} /></button>
              </div>
            </div>
          )}

          {stage === 'package' && (
            <div className="animate-fade-in">
              {!proposal ? (
                <div className="sq-empty-state">
                  <Clock size={38} />
                  <h2>Waiting on Cedarline Security</h2>
                  <p>Your confirmed environment is saved. The MSP acts next: compute, review, and explicitly share a package.</p>
                  {presenterControls && <button className="sq-button ghost" onClick={onPresenterSwitchToMsp}>Presenter control · continue as MSP</button>}
                </div>
              ) : (
                <>
                  <div className="sq-kicker">Shared proposal · version {proposal.version}</div>
                  <h2>{proposal.packageName}</h2>
                  <p>{proposal.description}</p>
                  <div className="sq-field-grid">
                    <div className="sq-field-group"><strong>Why it fits</strong><p>{proposal.rationale || 'Matched to your confirmed business size, needs, and asset counts.'}</p><p>Coverage: {proposal.confidence}</p>{proposal.gaps?.length ? <p style={{ color: 'var(--sq-amber)' }}>Gaps: {proposal.gaps.join(', ')}</p> : null}</div>
                    <div className="sq-field-group"><strong>Included services</strong><ul>{proposal.services.map(service => <li key={service}>{service}</li>)}</ul><strong>${proposal.estimatedMonthlyPrice}/month estimated</strong><p className="sq-muted">Basis: ${proposal.price} {proposal.billingBasis.replace('_', ' ')}</p></div>
                  </div>
                  <textarea className="sq-textarea" value={decisionNote} onChange={event => setDecisionNote(event.target.value)} placeholder="Optional note for Cedarline Security" data-testid="input-proposal-decision-note" />
                  <div className="sq-action-bar">
                    <button className="sq-button ghost" onClick={() => setStage('confirm')}><ArrowLeft size={14} /> Back</button>
                    <button className="sq-button primary" onClick={() => decideProposal('approved')} data-testid="button-approve-package">Approve package</button>
                    <button className="sq-button" onClick={() => decideProposal('changes_requested')} data-testid="button-request-changes">Request changes</button>
                    <button className="sq-button ghost" onClick={() => decideProposal('rejected')} data-testid="button-reject-package">Reject</button>
                  </div>
                  {prospect.proposalDecision && <div className="sq-simulation-banner" data-testid="proposal-decision-status">Version {prospect.proposalDecision.proposalVersion}: {prospect.proposalDecision.decision.replace('_', ' ')} · {prospect.proposalDecision.actor}</div>}
                  <p className="sq-muted">Package approval is separate from high-impact security approval, contracting, billing, and provisioning.</p>
                </>
              )}
            </div>
          )}

          {stage === 'setup' && (
            <div className="animate-fade-in">
              <div className="sq-field-group-title">Setup and activation</div>
              <p className="sq-muted">Cedarline controls these simulated setup transitions. No credentials or real integration are used.</p>
              {[
                ['Confirmed inventory', prospect.environmentConfirmed && !unresolved.length],
                [`Current package v${proposal?.version ?? 0} approved`, currentVersionApproved],
                ['Simulated integration ready', prospect.integrationState === 'ready' || prospect.integrationState === 'activated'],
                ['Activated into monitoring', Boolean(prospect.activated)],
              ].map(([label, pass]) => <div className="sq-capacity-row" key={String(label)}>{pass ? <CheckCircle2 size={16} color="var(--sq-teal)" /> : <Circle size={16} color="var(--sq-amber)" />}<strong>{label}</strong></div>)}
              <div className="sq-simulation-banner">Current setup state: {(prospect.integrationState ?? 'awaiting_access').replace('_', ' ')}. Cedarline Security acts next.</div>
              <div className="sq-action-bar">
                <button className="sq-button ghost" onClick={() => setStage('package')}><ArrowLeft size={14} /> Back</button>
                {presenterControls && <button className="sq-button ghost" onClick={onPresenterSwitchToMsp} data-testid="button-setup-presenter-msp">Presenter control · continue as MSP</button>}
                {prospect.activated && <button className="sq-button primary" onClick={() => setStage('monitoring')}>Continue to Monitoring <ArrowRight size={14} /></button>}
              </div>
            </div>
          )}

          {stage === 'monitoring' && (
            <div className="animate-fade-in" data-testid="meridian-monitoring">
              <div className="sq-kicker">Activated client · simulated monitoring</div>
              <h2>{prospect.name} is monitored</h2>
              <p>Plain-language health and attention remain scoped to this organization. Existing Queue policy, delegated permission, and high-impact human-review rules still apply.</p>
              <div className="sq-metrics">
                <div className="sq-metric"><span>Health</span><strong>98%</strong><small>Sample posture after setup</small></div>
                <div className="sq-metric"><span>Assets</span><strong>{prospect.manualAssets.reduce((total, asset) => total + asset.count, 0)}</strong><small>Reconciled confirmed inventory</small></div>
                <div className="sq-metric"><span>Attention</span><strong>0</strong><small>No open onboarding blockers</small></div>
              </div>
              <div className="sq-field-grid">
                <div className="sq-field-group"><strong>Current service</strong><p>{proposal?.packageName}</p><p>Approved version {prospect.proposalDecision?.proposalVersion}</p></div>
                <div className="sq-field-group"><strong>Recent activity</strong><p>Simulated integration activated.</p><p>Onboarding history remains available under Request history.</p></div>
              </div>
              <button className="sq-button ghost" onClick={navigateOverview}><Eye size={14} /> Open managed-client health</button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}