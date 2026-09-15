import { useState } from 'react';
import { Package, Prospect, OrganizationSize, VendorProduct } from '@/hooks/use-msp-data';
import { Plus, Package as PackageIcon, Pencil, CheckCircle2, Copy, Search, ShieldCheck } from 'lucide-react';
import '../shared/demo-styles.css';

export function PackagesWorkspace({ packages, setPackages, vendors, notify, activeWorkspaceId = 'cedarline' }: { packages: Package[], setPackages: (p: Package[]) => void, vendors: VendorProduct[], notify: (msg: string) => void, activeWorkspaceId?: string }) {
  const [selectedId, setSelectedId] = useState<string>(packages[0]?.id || '');
  const [editing, setEditing] = useState<boolean>(false);
  const [draft, setDraft] = useState<Partial<Package>>({});
  const [svcInput, setSvcInput] = useState('');

  const workspacePackages = packages.filter(p => (p.workspaceId ?? 'cedarline') === activeWorkspaceId);
  const workspaceVendors = vendors.filter(v => (v.workspaceId ?? 'cedarline') === activeWorkspaceId);
  const selected = workspacePackages.find(p => p.id === selectedId);

  const startEdit = (pkg: Package) => {
    setDraft({ ...pkg, targetedNeeds: [...pkg.targetedNeeds], targetedSizes: [...pkg.targetedSizes], vendorProductIds: [...pkg.vendorProductIds], services: [...pkg.services] });
    setEditing(true);
  };

  const startNew = () => {
    setDraft({
      name: 'New Package',
      description: '',
      targetedSizes: ['1-10'],
      targetedNeeds: [],
      vendorProductIds: [],
      services: [],
      price: 0,
      billingBasis: 'per_user'
    });
    setSelectedId('new');
    setEditing(true);
  };

  const duplicatePackage = (pkg: Package) => {
    const newPkg = { ...pkg, id: `p${Date.now()}`, workspaceId: activeWorkspaceId, name: `${pkg.name} (Copy)` };
    setPackages([...packages, newPkg]);
    notify(`Duplicated ${pkg.name}`);
    setSelectedId(newPkg.id);
  };

  const savePackage = () => {
    if (!draft.name?.trim()) return notify('Package name is required.');
    if ((draft.price ?? 0) <= 0) return notify('Price must be greater than 0.');
    if (!draft.targetedSizes || draft.targetedSizes.length === 0) return notify('Select at least one target organization size.');
    if (!draft.vendorProductIds || draft.vendorProductIds.length === 0) return notify('Select at least one vendor product.');
    if (!draft.services || draft.services.length === 0) return notify('Add at least one service.');

    if (selectedId === 'new') {
      const newPkg = { ...draft, id: `p${Date.now()}`, workspaceId: activeWorkspaceId } as Package;
      setPackages([...packages, newPkg]);
      setSelectedId(newPkg.id);
      notify('New package created');
    } else {
      setPackages(packages.map(p => p.id === selectedId ? { ...p, ...draft } as Package : p));
      notify('Package updated');
    }
    setEditing(false);
  };

  const addService = () => {
    if (!svcInput.trim()) return;
    setDraft({ ...draft, services: [...(draft.services || []), svcInput.trim()] });
    setSvcInput('');
  };
  const removeService = (s: string) => setDraft({ ...draft, services: (draft.services || []).filter(x => x !== s) });

  const ALL_SIZES: OrganizationSize[] = ['1-10', '11-50', '51-200', '201-500', '500+'];
  const COMMON_NEEDS = ['Basic Security', 'Compliance', 'Zero Trust', 'Advanced Threat Hunting', 'HIPAA Compliance'];

  return (
    <div className="sq-workspace-transition" style={{ maxWidth: '1280px', margin: '0 auto' }}>
      <div className="sq-page-head">
        <div>
          <div className="sq-kicker">Service Catalog</div>
          <h1>Packages</h1>
          <p>Define reusable service bundles targeted by size, needs, and capabilities.</p>
        </div>
        <div className="sq-page-head-tools">
          <button className="sq-button primary" onClick={startNew} data-testid="button-new-package"><Plus size={14} /> Create package</button>
        </div>
      </div>

      <div className="sq-split-layout">
        <aside className="sq-list-panel">
          <div className="sq-list-panel-head">
            <span className="sq-list-panel-title">Available packages</span>
          </div>
          <div className="sq-list-items">
            {workspacePackages.map(pkg => (
              <button 
                key={pkg.id} 
                className={`sq-list-item ${selectedId === pkg.id && !editing ? 'selected' : ''}`}
                onClick={() => { setSelectedId(pkg.id); setEditing(false); }}
                data-testid={`package-item-${pkg.id}`}
              >
                <strong>{pkg.name}</strong>
                <span>${pkg.price} {pkg.billingBasis.replace('_', ' ')} · {pkg.vendorProductIds.length} products</span>
              </button>
            ))}
          </div>
        </aside>

        <main className="sq-detail-panel">
          {editing ? (
            <div className="sq-detail-body">
              <h2 style={{ margin: '0 0 20px', font: '600 20px var(--app-font-display)', color: 'var(--sq-ink)' }}>
                {selectedId === 'new' ? 'New package' : 'Edit package'}
              </h2>
              <div className="sq-field-group">
                <div className="sq-field-grid">
                  <div className="sq-field">
                    <label>Package name <span style={{color:'var(--sq-red)'}}>*</span></label>
                    <input className="sq-input" value={draft.name || ''} onChange={e => setDraft({...draft, name: e.target.value})} data-testid="input-package-name" />
                  </div>
                  <div className="sq-field">
                    <label>Base price <span style={{color:'var(--sq-red)'}}>*</span></label>
                    <input type="number" className="sq-input" value={draft.price || ''} onChange={e => setDraft({...draft, price: Number(e.target.value)})} data-testid="input-package-price" />
                  </div>
                  <div className="sq-field">
                    <label>Billing basis</label>
                    <select className="sq-select-native" value={draft.billingBasis} onChange={e => setDraft({...draft, billingBasis: e.target.value as any})} data-testid="select-package-billing">
                      <option value="per_user">Per User / Month</option>
                      <option value="per_endpoint">Per Endpoint / Month</option>
                      <option value="flat_monthly">Flat Monthly</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="sq-field-group">
                <div className="sq-field">
                  <label>Description & Coverage</label>
                  <textarea className="sq-textarea" value={draft.description || ''} onChange={e => setDraft({...draft, description: e.target.value})} data-testid="input-package-description" />
                </div>
              </div>

              <div className="sq-field-group">
                <div className="sq-field-grid">
                  <div className="sq-field">
                    <label>Targeted Sizes <span style={{color:'var(--sq-red)'}}>*</span></label>
                    <div className="sq-pill-list">
                      {ALL_SIZES.map(s => {
                        const active = draft.targetedSizes?.includes(s);
                        return (
                          <button key={s} type="button" className={`sq-pill ${active ? 'active-pill' : ''}`} style={{ background: active ? 'var(--sq-teal)' : '#18282a', color: active ? '#101d21' : 'var(--sq-ink)' }}
                            onClick={() => {
                              const sz = draft.targetedSizes || [];
                              setDraft({ ...draft, targetedSizes: active ? sz.filter(x=>x!==s) : [...sz, s] });
                            }}
                            data-testid={`toggle-size-${s}`}
                          >{s}</button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="sq-field">
                    <label>Targeted Needs</label>
                    <div className="sq-pill-list">
                      {COMMON_NEEDS.map(n => {
                        const active = draft.targetedNeeds?.includes(n);
                        return (
                          <button key={n} type="button" className={`sq-pill ${active ? 'active-pill' : ''}`} style={{ background: active ? 'var(--sq-amber)' : '#18282a', color: active ? '#101d21' : 'var(--sq-ink)' }}
                            onClick={() => {
                              const nd = draft.targetedNeeds || [];
                              setDraft({ ...draft, targetedNeeds: active ? nd.filter(x=>x!==n) : [...nd, n] });
                            }}
                            data-testid={`toggle-need-${n}`}
                          >{n}</button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="sq-field-group">
                <div className="sq-field">
                  <label>Included Vendor Products (Simulated) <span style={{color:'var(--sq-red)'}}>*</span></label>
                  <div className="sq-pill-list" style={{ marginTop: '8px' }}>
                              {workspaceVendors.map(v => (
                      <label key={v.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#18282a', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--sq-line-soft)', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={draft.vendorProductIds?.includes(v.id) || false}
                          onChange={(e) => {
                            const ids = draft.vendorProductIds || [];
                            setDraft({...draft, vendorProductIds: e.target.checked ? [...ids, v.id] : ids.filter(i => i !== v.id)});
                          }}
                          data-testid={`checkbox-vendor-${v.id}`}
                        />
                        <span style={{ fontSize: '12px', color: 'var(--sq-ink)' }}>{v.productName} <span style={{color:'var(--sq-muted)'}}>({v.vendorName})</span></span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="sq-field-group">
                <div className="sq-field">
                  <label>Services <span style={{color:'var(--sq-red)'}}>*</span></label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input className="sq-input" style={{ flex: 1 }} value={svcInput} onChange={e => setSvcInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addService()} placeholder="e.g. 24/7 SOC" data-testid="input-package-service" />
                    <button className="sq-button" onClick={addService} data-testid="button-add-service">Add</button>
                  </div>
                  <div className="sq-pill-list" style={{ marginTop: '8px' }}>
                    {draft.services?.map(s => (
                      <span key={s} className="sq-pill" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {s} <button type="button" style={{ background: 'none', border: 'none', color: 'var(--sq-muted)', cursor: 'pointer', padding: 0 }} onClick={() => removeService(s)}>&times;</button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="sq-action-bar">
                <button className="sq-button primary" onClick={savePackage} data-testid="button-save-package">Save changes</button>
                <button className="sq-button" onClick={() => { setEditing(false); if(selectedId==='new') setSelectedId(packages[0]?.id || ''); }} data-testid="button-cancel-package">Cancel</button>
              </div>
            </div>
          ) : selected ? (
            <>
              <div className="sq-detail-header">
                <div>
                  <h2>{selected.name}</h2>
                  <p>{selected.description}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ font: '700 24px var(--app-font-display)', color: 'var(--sq-teal)' }}>${selected.price}</div>
                  <div style={{ fontSize: '11px', color: 'var(--sq-muted)' }}>{selected.billingBasis.replace('_', ' ')}</div>
                </div>
              </div>
              <div className="sq-detail-body">
                <div className="sq-field-group">
                  <div className="sq-field-group-title"><ShieldCheck size={14} /> Included Products</div>
                  <div className="sq-pill-list">
                    {selected.vendorProductIds.map(vid => {
                      const v = workspaceVendors.find(v => v.id === vid);
                      return v ? <span key={vid} className="sq-pill">{v.vendorName} {v.productName}</span> : null;
                    })}
                    {selected.vendorProductIds.length === 0 && <span className="sq-muted">No products selected</span>}
                  </div>
                </div>

                <div className="sq-field-group">
                  <div className="sq-field-group-title"><PackageIcon size={14} /> Target Profile</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <div className="sq-label" style={{marginBottom: '8px'}}>Organization Sizes</div>
                      <div className="sq-pill-list">
                        {selected.targetedSizes.map(s => <span key={s} className="sq-badge neutral">{s}</span>)}
                      </div>
                    </div>
                    <div>
                      <div className="sq-label" style={{marginBottom: '8px'}}>Business Needs</div>
                      <div className="sq-pill-list">
                        {selected.targetedNeeds.map(n => <span key={n} className="sq-badge neutral">{n}</span>)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="sq-action-bar">
                  <button className="sq-button" onClick={() => startEdit(selected)} data-testid="button-edit-package"><Pencil size={14} /> Edit package</button>
                  <button className="sq-button" onClick={() => duplicatePackage(selected)} data-testid="button-duplicate-package"><Copy size={14} /> Duplicate</button>
                </div>
              </div>
            </>
          ) : (
            <div className="sq-empty-state">
              <PackageIcon size={32} />
              <p>Select a package to view details</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}