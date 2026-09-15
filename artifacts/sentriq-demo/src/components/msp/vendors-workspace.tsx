import { useState } from 'react';
import { VendorProduct } from '@/hooks/use-msp-data';
import { Plus, Store, Search, Pencil, CheckCircle2, AlertCircle } from 'lucide-react';
import '../shared/demo-styles.css';

export function VendorsWorkspace({ vendors, setVendors, notify, activeWorkspaceId = 'cedarline' }: { vendors: VendorProduct[], setVendors: (v: VendorProduct[]) => void, notify: (msg: string) => void, activeWorkspaceId?: string }) {
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<VendorProduct>>({});
  const [capInput, setCapInput] = useState('');

  const workspaceVendors = vendors.filter(v => (v.workspaceId ?? 'cedarline') === activeWorkspaceId);
  const filtered = workspaceVendors.filter(v =>
    v.vendorName.toLowerCase().includes(search.toLowerCase()) || 
    v.productName.toLowerCase().includes(search.toLowerCase()) ||
    v.category.toLowerCase().includes(search.toLowerCase()) ||
    v.capabilities.some(c => c.toLowerCase().includes(search.toLowerCase())) ||
    v.integrationStatus.toLowerCase().includes(search.toLowerCase())
  );

  const startEdit = (v: VendorProduct) => {
    setDraft({ ...v });
    setEditingId(v.id);
  };

  const startNew = () => {
    setDraft({
      vendorName: '',
      productName: '',
      category: '',
      capabilities: [],
      mspRelationship: 'evaluating',
      integrationStatus: 'none',
    });
    setEditingId('new');
  };

  const saveVendor = () => {
    if (!draft.vendorName?.trim()) return notify('Vendor Name is required.');
    if (!draft.productName?.trim()) return notify('Product Name is required.');
    if (!draft.category?.trim()) return notify('Category is required.');

    if (editingId === 'new') {
      const newV: VendorProduct = {
        ...(draft as VendorProduct),
        id: `v${Date.now()}`,
        workspaceId: activeWorkspaceId,
        capabilities: draft.capabilities || []
      };
      setVendors([...vendors, newV]);
      notify('Simulated vendor added.');
    } else {
      setVendors(vendors.map(v => v.id === editingId ? { ...v, ...draft } as VendorProduct : v));
      notify('Vendor updated.');
    }
    setEditingId(null);
  };

  const addCapability = () => {
    if (!capInput.trim()) return;
    const caps = draft.capabilities || [];
    if (!caps.includes(capInput.trim())) {
      setDraft({ ...draft, capabilities: [...caps, capInput.trim()] });
    }
    setCapInput('');
  };

  const removeCapability = (c: string) => {
    setDraft({ ...draft, capabilities: (draft.capabilities || []).filter(x => x !== c) });
  };

  return (
    <div className="sq-workspace-transition" style={{ maxWidth: '1280px', margin: '0 auto' }}>
      <div className="sq-page-head">
        <div>
          <div className="sq-kicker">Supply Chain</div>
          <h1>Vendor Catalog</h1>
          <p>Manage the simulated security products available for your service packages.</p>
        </div>
        <div className="sq-page-head-tools">
          <div className="sq-simulation-banner" style={{ margin: 0, padding: '8px 12px' }}>
            <Store size={14} /> <span>Simulated vendor list</span>
          </div>
        </div>
      </div>

      <div className="sq-detail-panel" style={{ padding: '24px' }}>
        {editingId ? (
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '24px' }}>{editingId === 'new' ? 'Add Vendor Product' : 'Edit Vendor Product'}</h2>
            
            <div className="sq-field-grid" style={{ marginBottom: '16px' }}>
              <div className="sq-field">
                <label>Vendor Name <span style={{color:'var(--sq-red)'}}>*</span></label>
                <input className="sq-input" value={draft.vendorName || ''} onChange={e => setDraft({...draft, vendorName: e.target.value})} data-testid="input-vendor-name" />
              </div>
              <div className="sq-field">
                <label>Product Name <span style={{color:'var(--sq-red)'}}>*</span></label>
                <input className="sq-input" value={draft.productName || ''} onChange={e => setDraft({...draft, productName: e.target.value})} data-testid="input-product-name" />
              </div>
            </div>

            <div className="sq-field-grid" style={{ marginBottom: '16px' }}>
              <div className="sq-field">
                <label>Category <span style={{color:'var(--sq-red)'}}>*</span></label>
                <input className="sq-input" value={draft.category || ''} onChange={e => setDraft({...draft, category: e.target.value})} data-testid="input-vendor-category" />
              </div>
              <div className="sq-field">
                <label>MSP Relationship</label>
                <select className="sq-select-native" value={draft.mspRelationship} onChange={e => setDraft({...draft, mspRelationship: e.target.value as any})} data-testid="select-msp-relationship">
                  <option value="none">None</option>
                  <option value="evaluating">Evaluating</option>
                  <option value="partner">Partner</option>
                </select>
              </div>
            </div>

            <div className="sq-field" style={{ marginBottom: '16px' }}>
              <label>Capabilities</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input className="sq-input" style={{ flex: 1 }} value={capInput} onChange={e => setCapInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCapability()} placeholder="e.g. Email Security" data-testid="input-vendor-capability" />
                <button className="sq-button" onClick={addCapability} data-testid="button-add-capability">Add</button>
              </div>
              <div className="sq-pill-list" style={{ marginTop: '8px' }}>
                {draft.capabilities?.map(c => (
                  <span key={c} className="sq-pill" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {c} <button style={{ background: 'none', border: 'none', color: 'var(--sq-muted)', cursor: 'pointer', padding: 0 }} onClick={() => removeCapability(c)}>&times;</button>
                  </span>
                ))}
              </div>
            </div>

            <div className="sq-field" style={{ marginBottom: '24px' }}>
              <label>Integration Status (Demo)</label>
              <select className="sq-select-native" value={draft.integrationStatus} onChange={e => setDraft({...draft, integrationStatus: e.target.value as any})} data-testid="select-integration-status">
                <option value="none">None</option>
                <option value="simulated_pending">Simulated Pending</option>
                <option value="simulated_active">Simulated Active</option>
              </select>
            </div>

            <div className="sq-action-bar">
              <button className="sq-button primary" onClick={saveVendor} data-testid="button-save-vendor">Save Vendor</button>
              <button className="sq-button" onClick={() => setEditingId(null)} data-testid="button-cancel-vendor">Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
              <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                <Search size={14} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--sq-muted)' }} />
                <input 
                  className="sq-input" 
                  style={{ width: '100%', paddingLeft: '34px' }} 
                  placeholder="Search vendors, products, or categories..." 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  data-testid="input-search-vendors"
                />
              </div>
              <button className="sq-button primary" onClick={startNew} data-testid="button-new-vendor"><Plus size={14} /> Add vendor</button>
            </div>

            <div className="sq-table-wrap">
              <table className="sq-table">
                <thead>
                  <tr>
                    <th>Vendor & Product</th>
                    <th>Category</th>
                    <th>Capabilities</th>
                    <th>Relationship</th>
                    <th>Integration</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(v => (
                    <tr key={v.id} data-testid={`vendor-row-${v.id}`}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--sq-ink)' }}>{v.vendorName}</div>
                        <div style={{ fontSize: '11px', color: 'var(--sq-muted)' }}>{v.productName}</div>
                      </td>
                      <td><span className="sq-badge neutral">{v.category}</span></td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {v.capabilities.map(c => <span key={c} style={{ fontSize: '10px', color: 'var(--sq-muted)', background: '#142527', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--sq-line-soft)' }}>{c}</span>)}
                        </div>
                      </td>
                      <td>
                        {v.mspRelationship === 'partner' ? <span className="sq-badge">Sample partner</span> : 
                        v.mspRelationship === 'evaluating' ? <span className="sq-badge warning">Sample evaluation</span> : 
                        <span className="sq-badge neutral">None</span>}
                      </td>
                      <td>
                        {v.integrationStatus === 'simulated_active' ? <span style={{ color: 'var(--sq-teal)', fontSize: '11px', fontWeight: 600 }}><CheckCircle2 size={12} style={{display:'inline', marginBottom:'-2px'}}/> Simulated Active</span> :
                        v.integrationStatus === 'simulated_pending' ? <span style={{ color: 'var(--sq-amber)', fontSize: '11px', fontWeight: 600 }}><AlertCircle size={12} style={{display:'inline', marginBottom:'-2px'}}/> Simulated Pending</span> :
                        <span style={{ color: 'var(--sq-muted)', fontSize: '11px' }}>None</span>}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="sq-button ghost" onClick={() => startEdit(v)} data-testid={`button-edit-vendor-${v.id}`}><Pencil size={14} /> Edit</button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--sq-muted)' }}>No vendors match your search.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}