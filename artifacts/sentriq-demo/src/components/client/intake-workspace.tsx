import { useState } from 'react';
import { Prospect } from '@/hooks/use-msp-data';
import { UploadCloud, CheckCircle2, ShieldCheck, FileSpreadsheet, Lock, Camera, Pencil, FileText } from 'lucide-react';
import '../shared/demo-styles.css';

export function ClientIntakeWorkspace({ 
  prospect, 
  setProspects, 
  prospects,
  notify 
}: { 
  prospect: Prospect,
  setProspects: (p: Prospect[]) => void,
  prospects: Prospect[],
  notify: (msg: string) => void 
}) {
  const [assetName, setAssetName] = useState('');
  const [assetType, setAssetType] = useState('endpoint');
  const [assetCount, setAssetCount] = useState(1);
  const [q1, setQ1] = useState(prospect.intakeAnswers?.['q1'] || '');
  const [q2, setQ2] = useState(prospect.intakeAnswers?.['q2'] || '');
  const [showMetadataSuggestion, setShowMetadataSuggestion] = useState(true);

  // We check if submitted, but we allow editing if the user explicitly wants to correct it
  const [isEditing, setIsEditing] = useState(!prospect.intakeSubmitted);

  const addAsset = () => {
    if (!assetName) return notify('Asset name is required.');
    if (assetCount <= 0) return notify('Asset count must be greater than 0.');
    const updated = { ...prospect, manualAssets: [...prospect.manualAssets, { id: `ma${Date.now()}`, name: assetName, type: assetType, count: assetCount }] };
    setProspects(prospects.map(p => p.id === prospect.id ? updated : p));
    setAssetName('');
    setAssetCount(1);
    notify('Asset added to inventory');
  };

  const removeAsset = (id: string) => {
    const updated = { ...prospect, manualAssets: prospect.manualAssets.filter(a => a.id !== id) };
    setProspects(prospects.map(p => p.id === prospect.id ? updated : p));
  };

  const removeFile = (id: string) => {
    const updated = { ...prospect, intakeFiles: prospect.intakeFiles.filter(a => a.id !== id) };
    setProspects(prospects.map(p => p.id === prospect.id ? updated : p));
  };

  const simulateUpload = (type: 'spreadsheet' | 'photo' | 'screenshot') => {
    if (prospect.intakeFiles.length >= 5) return notify('This demo supports up to 5 attachments per intake.');
    const files = {
      spreadsheet: { id: `f${Date.now()}`, name: 'device_export.csv', type: 'spreadsheet', size: '420 KB', status: 'Simulated attachment · not parsed' },
      photo: { id: `f${Date.now()}`, name: 'server_rack_photo.jpg', type: 'photo', size: '2.1 MB', status: 'Simulated attachment · not analyzed' },
      screenshot: { id: `f${Date.now()}`, name: 'device_console_screenshot.png', type: 'screenshot', size: '1.4 MB', status: 'Simulated attachment · not analyzed' },
    };
    const file = files[type];
      
    const updated = { 
      ...prospect, 
      intakeFiles: [...prospect.intakeFiles, file] 
    };
    setProspects(prospects.map(p => p.id === prospect.id ? updated : p));
    notify(`Sample ${type} attachment added to this browser session.`);
  };

  const submitIntake = () => {
    if (!q1 || !q2) return notify('Please answer all questionnaire items.');
    if (prospect.manualAssets.length === 0 && prospect.intakeFiles.length === 0) return notify('Please add at least one asset or file.');
    
    const updated = { 
      ...prospect, 
      intakeSubmitted: true,
      intakeAnswers: { q1, q2 },
      inventoryEvidence: [
        ...prospect.manualAssets.map(asset => ({ id: `e-${asset.id}`, description: `${asset.count} ${asset.name}`, source: 'manual' as const, state: 'confirmed' as const })),
        ...prospect.intakeFiles.map(file => ({ id: `e-${file.id}`, description: file.name, source: file.type === 'spreadsheet' ? 'spreadsheet' as const : file.type === 'photo' ? 'photo' as const : 'screenshot' as const, state: 'uncertain' as const, reviewNote: 'Attachment is simulated and was not parsed or analyzed.' })),
        { id: `e-questionnaire-${prospect.id}`, description: 'Questionnaire responses', source: 'questionnaire' as const, state: 'confirmed' as const },
      ],
      unresolvedGaps: [...(prospect.unresolvedGaps ?? [])],
      status: prospect.status === 'intake' ? 'assessment' : prospect.status // don't revert status if already further along
    } as Prospect;
    setProspects(prospects.map(p => p.id === prospect.id ? updated : p));
    setIsEditing(false);
    notify('Intake recorded. Demo state updated.');
  };

  const applyMetadataSuggestion = () => {
    const updated = { ...prospect, manualAssets: [...prospect.manualAssets, { id: `ma${Date.now()}`, name: 'Detected Endpoints', type: 'endpoint', count: 15 }] };
    setProspects(prospects.map(p => p.id === prospect.id ? updated : p));
    setShowMetadataSuggestion(false);
    notify('Suggested assets added.');
  };

  return (
    <div className="sq-workspace-transition" style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '32px' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <ShieldCheck size={48} color="var(--sq-teal)" style={{ margin: '0 auto 16px' }} />
        <h1 style={{ margin: '0 0 8px', font: '600 32px var(--app-font-display)', letterSpacing: '-.03em', color: 'var(--sq-ink)' }}>Security Intake</h1>
        <p style={{ margin: 0, color: 'var(--sq-muted)', fontSize: '14px' }}>Provide your environment details so Cedarline Security can prepare your protection plan.</p>
        {prospect.activated && <div className="sq-simulation-banner" data-testid="client-activation-status">Stage: monitored · next step: review the first sample report · package context retained · {prospect.selectedIntegration?.name ?? 'Simulated integration'} ({prospect.selectedIntegration?.state ?? 'ready'}) · Plain-language health: reporting normally in this demo.</div>}
      </div>

      {!isEditing ? (
        <div className="sq-detail-panel" style={{ padding: '48px 32px', textAlign: 'center' }}>
          <CheckCircle2 size={48} color="var(--sq-teal)" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ margin: '0 0 12px', font: '600 24px var(--app-font-display)', color: 'var(--sq-ink)' }}>Intake Recorded</h2>
          <p style={{ color: 'var(--sq-muted)', fontSize: '14px', maxWidth: '400px', margin: '0 auto 24px' }}>
            Your environment details have been saved in this demo session. Your MSP is assessing your needs.
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(131, 210, 192, 0.1)', color: 'var(--sq-teal)', padding: '8px 16px', borderRadius: '99px', fontSize: '12px', fontWeight: 600, marginBottom: '24px' }}>
            <Lock size={14} /> Submitted for review
          </div>
          <br/>
          <button className="sq-button ghost" onClick={() => setIsEditing(true)} data-testid="button-correct-intake"><Pencil size={14} /> Review / Correct Submission</button>
        </div>
      ) : (
        <div className="sq-detail-panel">
          <div className="sq-detail-header" style={{ padding: '20px 32px' }}>
            <h2 style={{ fontSize: '18px' }}>Asset Inventory & Questionnaire</h2>
          </div>
          <div className="sq-detail-body">
            
            <div className="sq-field-group">
              <div className="sq-field-group-title">1. Questionnaire</div>
              <div className="sq-field" style={{ marginBottom: '16px' }}>
                <label>Do you handle payment cards or sensitive healthcare data? <span style={{color:'var(--sq-red)'}}>*</span></label>
                <select className="sq-select-native" value={q1} onChange={e => setQ1(e.target.value)} data-testid="select-q1">
                  <option value="">Select...</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div className="sq-field">
                <label>Do you currently have active antivirus or security software? <span style={{color:'var(--sq-red)'}}>*</span></label>
                <select className="sq-select-native" value={q2} onChange={e => setQ2(e.target.value)} data-testid="select-q2">
                  <option value="">Select...</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>

            <div className="sq-field-group" style={{ marginTop: '32px' }}>
              <div className="sq-field-group-title">2. Asset Inventory <span style={{color:'var(--sq-red)'}}>*</span></div>
              <p style={{ fontSize: '12px', color: 'var(--sq-muted)', margin: '0 0 16px' }}>
                List your major assets manually, or add simulated attachments for review. Attachments are not uploaded, parsed, scanned, or analyzed.
              </p>
              
              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <input className="sq-input" placeholder="e.g. Windows Laptops" value={assetName} onChange={e => setAssetName(e.target.value)} style={{ flex: 2 }} data-testid="input-asset-name" />
                <input type="number" className="sq-input" value={assetCount} onChange={e => setAssetCount(Number(e.target.value))} min={1} style={{ flex: 1 }} data-testid="input-asset-count" />
                <select className="sq-select-native" value={assetType} onChange={e => setAssetType(e.target.value)} style={{ flex: 1 }} data-testid="select-asset-type">
                  <option value="endpoint">Endpoint</option>
                  <option value="server">Server</option>
                  <option value="network">Network Device</option>
                </select>
                <button className="sq-button" onClick={addAsset} data-testid="button-add-asset">Add</button>
              </div>

              {prospect.manualAssets.length > 0 && (
                <div style={{ marginBottom: '24px', background: '#142527', border: '1px solid var(--sq-line-soft)', borderRadius: '6px', padding: '12px' }}>
                  {prospect.manualAssets.map(a => (
                    <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--sq-line-soft)' }}>
                      <div>
                        <span style={{ fontSize: '13px', color: 'var(--sq-ink)', display: 'block' }}>{a.name}</span>
                        <span style={{ fontSize: '12px', color: 'var(--sq-muted)' }}>{a.count} x {a.type}</span>
                      </div>
                      <button className="sq-button ghost" onClick={() => removeAsset(a.id)} style={{ padding: '4px 8px' }}>Remove</button>
                    </div>
                  ))}
                </div>
              )}

              <div className="sq-upload-grid">
                <div className="sq-file-upload" onClick={() => simulateUpload('spreadsheet')} data-testid="button-upload-spreadsheet">
                  <FileSpreadsheet size={24} style={{ margin: '0 auto 8px', color: 'var(--sq-teal)' }} />
                  <strong style={{ display: 'block', color: 'var(--sq-ink)', fontSize: '13px', marginBottom: '2px' }}>Add Sample Spreadsheet</strong>
                  <span style={{ color: 'var(--sq-muted)', fontSize: '11px' }}>.csv, .xlsx (max 10MB)</span>
                </div>
                <div className="sq-file-upload" onClick={() => simulateUpload('photo')} data-testid="button-upload-photo">
                  <Camera size={24} style={{ margin: '0 auto 8px', color: 'var(--sq-teal)' }} />
                  <strong style={{ display: 'block', color: 'var(--sq-ink)', fontSize: '13px', marginBottom: '2px' }}>Add Photo</strong>
                  <span style={{ color: 'var(--sq-muted)', fontSize: '11px' }}>.jpg, .jpeg, .png (max 5MB)</span>
                </div>
                <div className="sq-file-upload" onClick={() => simulateUpload('screenshot')} data-testid="button-upload-screenshot">
                  <FileText size={24} style={{ margin: '0 auto 8px', color: 'var(--sq-teal)' }} />
                  <strong style={{ display: 'block', color: 'var(--sq-ink)', fontSize: '13px', marginBottom: '2px' }}>Add Screenshot</strong>
                  <span style={{ color: 'var(--sq-muted)', fontSize: '11px' }}>.png, .jpg (max 5MB)</span>
                </div>
              </div>
              <p style={{ color: 'var(--sq-muted)', fontSize: '10px', margin: '0 0 24px' }}>Demo limit: 5 attachments total. These controls add sample file records only; no file leaves your browser.</p>

              {prospect.intakeFiles.some(f => f.type === 'spreadsheet') && showMetadataSuggestion && (
                <div style={{ background: 'rgba(229, 179, 111, 0.1)', border: '1px solid rgba(229, 179, 111, 0.3)', borderRadius: '6px', padding: '12px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '12px' }}>
                    <strong style={{ color: 'var(--sq-amber)', display: 'block' }}>Example suggestion · review required</strong>
                    <span style={{ color: 'var(--sq-muted)' }}>This demo proposes 15 endpoint records without reading the sample CSV. Add them to manual assets?</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="sq-button primary" onClick={applyMetadataSuggestion} style={{ padding: '4px 8px', fontSize: '11px' }}>Accept</button>
                    <button className="sq-button" onClick={() => setShowMetadataSuggestion(false)} style={{ padding: '4px 8px', fontSize: '11px' }}>Dismiss</button>
                  </div>
                </div>
              )}

              {prospect.intakeFiles.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  {prospect.intakeFiles.map(f => (
                    <div key={f.id} className="sq-file-item">
                      <div className="sq-file-item-info">
                        {f.type === 'spreadsheet' ? <FileText size={16} className="sq-file-icon" /> : f.type === 'photo' ? <Camera size={16} className="sq-file-icon" /> : <FileText size={16} className="sq-file-icon" />}
                        <div>
                          <strong style={{ display: 'block', fontSize: '13px', color: 'var(--sq-ink)' }}>{f.name}</strong>
                          <span style={{ fontSize: '11px', color: 'var(--sq-muted)' }}>{f.size} · {f.status}</span>
                        </div>
                      </div>
                      <button className="sq-button ghost" onClick={() => removeFile(f.id)} style={{ padding: '4px 8px' }}>Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="sq-action-bar">
              <button className="sq-button primary" onClick={submitIntake} style={{ width: '100%', padding: '12px', fontSize: '14px' }} data-testid="button-submit-intake">
                Submit Intake Demo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}