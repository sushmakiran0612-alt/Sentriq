import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';
import { MSP_SESSION_STORAGE_KEY } from './hooks/use-msp-data';

import App, { CLIENT_IDENTITY_STORAGE_KEY } from './App';

function renderApp() {
  return render(<App />);
}

async function openCockpit(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByTestId('button-launchpad-cockpit'));
}

describe('MSP Pre-Onboarding Flows', () => {
  test('MSP can create a package, prospect, and vendor, then share a proposal', async () => {
    const user = userEvent.setup();
    renderApp();
    await openCockpit(user);

    // 1. VENDORS
    await user.click(screen.getByTestId('button-nav-vendors'));
    expect(screen.getByRole('heading', { name: 'Vendor Catalog' })).not.toBeNull();
    await user.click(screen.getByTestId('button-new-vendor'));
    await user.type(screen.getByTestId('input-vendor-name'), 'Test Vendor');
    await user.type(screen.getByTestId('input-product-name'), 'Test Product');
    await user.type(screen.getByTestId('input-vendor-category'), 'Test Category');
    await user.click(screen.getByTestId('button-save-vendor'));
    expect(screen.getByText('Test Vendor')).not.toBeNull();

    // 2. PACKAGES
    await user.click(screen.getByTestId('button-nav-packages'));
    await user.click(screen.getByTestId('button-new-package'));

    // Clear out 'New Package' from draft first
    const nameInput = screen.getByTestId('input-package-name');
    await user.clear(nameInput);
    await user.type(nameInput, 'Demo Package');
    
    await user.type(screen.getByTestId('input-package-price'), '99');
    await user.click(screen.getByTestId('toggle-size-11-50'));
    await user.click(screen.getByTestId('toggle-need-Compliance'));
    await user.type(screen.getByTestId('input-package-service'), 'Demo Service');
    await user.click(screen.getByTestId('button-add-service'));
    
    // Need to select at least one vendor to pass validation. 
    // Wait for vendors to be rendered, find one by test ID and click
    const vCheckbox = await screen.findByTestId('checkbox-vendor-v1');
    await user.click(vCheckbox);
    
    await user.click(screen.getByTestId('button-save-package'));
    await waitFor(() => {
      const els = screen.getAllByText('Demo Package');
      expect(els.length).toBeGreaterThan(0);
    });

    // 3. PROSPECTS (Create)
    await user.click(screen.getByTestId('button-nav-prospects'));
    await user.click(screen.getByTestId('button-new-prospect'));
    await user.type(screen.getByTestId('input-prospect-name'), '!!!');
    await user.type(screen.getByTestId('input-prospect-industry'), 'Retail');
    await user.click(screen.getByTestId('button-save-prospect'));
    expect(screen.getByText('Prospect name must include letters or numbers.')).not.toBeNull();
    await user.clear(screen.getByTestId('input-prospect-name'));
    await user.type(screen.getByTestId('input-prospect-name'), 'Redwood');
    await user.click(screen.getByTestId('button-save-prospect'));
    expect(screen.getByText('That organization name is reserved for a managed client.')).not.toBeNull();
    await user.clear(screen.getByTestId('input-prospect-name'));
    await user.type(screen.getByTestId('input-prospect-name'), 'Acme Corp');
    await user.selectOptions(screen.getByTestId('select-prospect-size'), '11-50');
    await user.type(screen.getByTestId('input-prospect-need'), 'Compliance');
    await user.click(screen.getByTestId('button-add-need'));
    await user.click(screen.getByTestId('button-save-prospect'));
    await waitFor(() => {
      const els = screen.getAllByText('Acme Corp');
      expect(els.length).toBeGreaterThan(0);
    });

    // 4. INTAKE (Client Side)
    await user.click(screen.getByTestId('button-organization-picker'));
    await user.click(screen.getByTestId('button-organization-acme-corp'));
    await user.click(screen.getByTestId('button-sidebar-user'));
    await user.click(screen.getByTestId('button-user-operator'));
    
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Security Onboarding/i })).not.toBeNull();
    });
    expect(screen.queryByTestId('button-nav-prospects')).toBeNull();
    expect(screen.queryByTestId('button-nav-packages')).toBeNull();
    expect(screen.queryByTestId('button-nav-vendors')).toBeNull();
    expect(screen.queryByTestId('button-nav-policies')).toBeNull();

    // Stage: Business Profile
    await user.click(screen.getByTestId('button-save-business'));
    await user.type(screen.getByTestId('input-b-locations'), 'NY');
    await user.type(screen.getByTestId('input-b-contact-name'), 'Alice');
    await user.type(screen.getByTestId('input-b-contact-email'), 'alice@example.com');
    await user.click(screen.getByTestId('button-save-business'));

    // Stage: Assets
    await user.click(screen.getByTestId('button-submit-assets'));
    const selects = screen.getAllByRole('combobox');
    await user.selectOptions(selects[0], 'Yes');
    await user.selectOptions(selects[1], 'No');
    fireEvent.change(screen.getByTestId('input-file-upload'), {
      target: { files: [new File(['name,type,count\nWindows laptops,endpoint,12'], 'acme-assets.csv', { type: 'text/csv' })] },
    });
    await waitFor(() => expect(screen.getByText('1 valid CSV rows ready for review')).not.toBeNull());
    await user.click(screen.getByTestId('button-submit-assets'));

    // Stage: Confirm Environment
    await user.click(screen.getByTestId('button-confirm-environment'));

    // 5. PROSPECTS (Assessment -> Proposal -> Share)
    await user.click(screen.getByTestId('button-sidebar-user'));
    await user.click(screen.getByTestId('button-user-supervisor'));
    await user.click(screen.getByTestId('button-nav-prospects'));
    const acmeBtn = screen.getAllByRole('button', { name: /Acme Corp/ }).find(button => button.classList.contains('sq-list-item'));
    if (!acmeBtn) throw new Error('Acme Corp prospect list item was not rendered.');
    await user.click(acmeBtn);
    expect(screen.getByTestId('button-organization-picker').textContent).toContain('Acme Corp');

    await user.click(screen.getByTestId('button-compute-recommendation'));
    await waitFor(() => {
      expect(screen.getByText('Rules-Based Demo Recommendation')).not.toBeNull();
    });
    expect(screen.getByText(/Estimated coverage:/)).not.toBeNull();

    // Override
    await user.click(screen.getByTestId('button-start-override'));
    await user.selectOptions(screen.getByTestId('select-override-package'), 'p1');
    await user.click(screen.getByTestId('button-apply-override'));
    expect(screen.getByTestId('input-override-reason')).not.toBeNull();
    await user.type(screen.getByTestId('input-override-reason'), 'Client requested specific tier');
    await user.click(screen.getByTestId('button-apply-override'));
    
    await user.click(screen.getByTestId('button-share-proposal'));
    expect(screen.getAllByText(/Proposal shared/).length).toBeGreaterThan(0);

    // 6. PROPOSAL (Client Side)
    await user.click(screen.getByTestId('button-sidebar-user'));
    await user.click(screen.getByTestId('button-user-operator'));
    await user.click(screen.getByTestId('button-organization-picker'));
    fireEvent.click(screen.getByTestId('button-organization-acme-corp'));
    // Client Journey workspace auto-routes to Package stage
    await waitFor(() => {
      expect(screen.getByText(/Shared proposal · version 1/i)).not.toBeNull();
    });
    expect(screen.getByText(/Shared proposal · version 1/i)).not.toBeNull();
    expect(screen.queryByText('Client requested specific tier')).toBeNull();
    expect(screen.queryByText('Vendor Catalog')).toBeNull();
    await user.click(screen.getByTestId('button-approve-package'));
  });

  test('Meridian completes clarification, versioned reapproval, activation, and monitoring', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByTestId('button-launchpad-cockpit'));
    await user.click(screen.getByTestId('button-organization-picker'));
    await user.click(screen.getByTestId('button-organization-meridian'));
    await user.click(screen.getByTestId('button-sidebar-user'));
    await user.click(screen.getByTestId('button-user-operator'));
    expect(screen.getByRole('heading', { name: /Meridian Capital security onboarding/i })).not.toBeNull();
    expect(screen.getByTestId('button-organization-picker').textContent).toContain('Meridian Capital');
    expect(screen.getByTestId('environment-blockers')).not.toBeNull();
    await user.type(screen.getByTestId('input-clarification-e2'), 'United States and Canada only.');
    await user.click(screen.getByTestId('button-send-clarification-e2'));
    expect(screen.getByText(/The MSP must still resolve this item/i)).not.toBeNull();

    await user.click(screen.getByTestId('button-presenter-switch-msp'));
    await user.type(screen.getByTestId('input-msp-resolution-e2'), 'Mapped to the North America residency control set.');
    await user.click(screen.getByTestId('button-msp-resolve-e2'));

    await user.click(screen.getByTestId('button-sidebar-user'));
    await user.click(screen.getByTestId('button-user-operator'));
    await user.click(screen.getByTestId('button-confirm-environment'));

    await user.click(screen.getByTestId('button-presenter-switch-msp'));
    await user.click(screen.getByTestId('button-compute-recommendation'));
    await waitFor(() => expect(screen.getByTestId('button-share-proposal')).not.toBeNull());
    await user.click(screen.getByTestId('button-share-proposal'));

    await user.click(screen.getByTestId('button-sidebar-user'));
    await user.click(screen.getByTestId('button-user-operator'));
    await user.type(screen.getByTestId('input-proposal-decision-note'), 'Please include quarterly access reviews.');
    await user.click(screen.getByTestId('button-request-changes'));

    await user.click(screen.getByTestId('button-presenter-switch-msp'));
    await user.click(screen.getByTestId('button-share-proposal'));
    expect(screen.getByText(/Proposal shared as a snapshot/i)).not.toBeNull();

    await user.click(screen.getByTestId('button-sidebar-user'));
    await user.click(screen.getByTestId('button-user-operator'));
    expect(screen.getByText(/Shared proposal · version 2/i)).not.toBeNull();
    await user.click(screen.getByTestId('button-approve-package'));

    await user.click(screen.getByTestId('button-presenter-switch-msp'));
    await user.click(screen.getByTestId('button-nav-activation'));
    await user.selectOptions(screen.getByTestId('select-activation-integration'), 'failed');
    expect((screen.getByTestId('button-activate-prospect') as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByTestId('integration-owner-blocker').textContent).toContain('Simulated connector check failed');
    await user.selectOptions(screen.getByTestId('select-activation-integration'), 'ready');
    expect((screen.getByTestId('select-activation-integration') as HTMLSelectElement).value).toBe('failed');
    await user.click(screen.getByTestId('button-retry-integration'));
    expect((screen.getByTestId('select-activation-integration') as HTMLSelectElement).value).toBe('integration_setup');
    await user.selectOptions(screen.getByTestId('select-activation-integration'), 'ready');
    await user.click(screen.getByTestId('button-activate-prospect'));
    await user.click(screen.getByTestId('button-nav-clients'));
    expect(screen.getByTestId('card-client-meridian')).not.toBeNull();
    expect(screen.getByText('Newly activated · simulated monitoring')).not.toBeNull();
    expect(screen.getAllByTestId('card-client-meridian')).toHaveLength(1);

    await user.click(screen.getByTestId('button-nav-activation'));
    expect(screen.getByTestId('activation-status')).not.toBeNull();
    expect((screen.getByTestId('button-activate-prospect') as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByTestId('select-activation-integration') as HTMLSelectElement).value).toBe('activated');
    expect(screen.getByTestId('integration-owner-blocker').textContent).toContain('No blocker');

    await user.click(screen.getByTestId('button-brand-launchpad'));
    await user.click(screen.getByTestId('button-launchpad-client-workspace'));
    expect(screen.getByTestId('meridian-monitoring')).not.toBeNull();
    expect(screen.getByText('Meridian Capital is monitored')).not.toBeNull();
    expect(screen.queryByTestId('button-sidebar-user')).toBeNull();
  });

  test('Meridian clarification and current stage survive an app remount in the same browser tab', async () => {
    const user = userEvent.setup();
    window.sessionStorage.setItem(CLIENT_IDENTITY_STORAGE_KEY, 'meridian');
    const firstRender = render(<App />);

    await user.click(screen.getByTestId('button-launchpad-client-workspace'));
    await user.type(screen.getByTestId('input-clarification-e2'), 'Keep records in Canada.');
    await user.click(screen.getByTestId('button-send-clarification-e2'));
    await waitFor(() => expect(window.sessionStorage.getItem(MSP_SESSION_STORAGE_KEY)).toContain('Keep records in Canada.'));

    firstRender.unmount();
    render(<App />);
    await user.click(screen.getByTestId('button-launchpad-client-workspace'));
    expect(screen.getByText('Keep records in Canada.')).not.toBeNull();
    expect(screen.getAllByText('responded').length).toBeGreaterThan(0);
    expect(screen.getByTestId('environment-blockers').textContent).toContain('Cedarline must resolve it');
  });
});