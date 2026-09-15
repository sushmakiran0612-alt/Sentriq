import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';

import App, { CLIENT_IDENTITY_STORAGE_KEY } from './App';

function renderApp() {
  return render(<App />);
}

function expectText(element: HTMLElement, text: string) {
  expect(element.textContent).toContain(text);
}

async function openCockpit(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByTestId('button-launchpad-cockpit'));
}

describe('role-specific admin action flows', () => {
  test('starts at Sentriq Launchpad and hands off to the operations cockpit', async () => {
    const user = userEvent.setup();
    renderApp();

    expect(screen.getByRole('heading', { name: 'Sentriq' })).not.toBeNull();
    expect(screen.getByTestId('button-launchpad-prospects')).not.toBeNull();
    expect(screen.getByTestId('button-launchpad-active-clients')).not.toBeNull();
    expect(screen.getByTestId('button-launchpad-client-workspace')).not.toBeNull();
    expect(screen.queryByTestId('button-launchpad-fenwick')).toBeNull();
    expect(screen.queryByTestId('button-launchpad-meridian')).toBeNull();
    expect(screen.queryByTestId('button-launchpad-redwood')).toBeNull();
    expect(screen.getByTestId('button-launchpad-cockpit')).not.toBeNull();
    expect(screen.getByRole('heading', { name: 'MSP' })).not.toBeNull();
    expect(screen.getByRole('heading', { name: 'Clients' })).not.toBeNull();

    await openCockpit(user);

    expect(screen.getByTestId('sidebar-navigation')).not.toBeNull();
    expect(screen.getByText('MSP administrator (demo)')).not.toBeNull();
    expect(screen.getByRole('heading', { name: 'Good morning, Jordan.' })).not.toBeNull();
  });

  test('supports keyboard entry into the primary MSP workspace action', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.tab();
    expect(document.activeElement).toBe(screen.getByTestId('button-launchpad-cockpit'));
    await user.keyboard('{Enter}');

    expect(screen.getByTestId('sidebar-navigation')).not.toBeNull();
    expect(screen.getByRole('heading', { name: 'Good morning, Jordan.' })).not.toBeNull();
  });

  test('routes each launchpad entry to the intended scoped workspace', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByTestId('button-launchpad-prospects'));
    expect(screen.getByRole('heading', { name: 'Prospect Pipeline' })).not.toBeNull();
    expectText(screen.getByTestId('button-sidebar-user'), 'MSP administrator');
    expectText(screen.getByTestId('button-organization-picker'), 'Meridian Capital');
    expect(screen.getByTestId('sidebar-queue-list').textContent).toContain('Queue clear');

    await user.click(screen.getByTestId('button-brand-launchpad'));
    await user.click(screen.getByTestId('button-launchpad-active-clients'));
    expect(screen.getByRole('heading', { name: 'Clients & fleet' })).not.toBeNull();
    expectText(screen.getByTestId('button-sidebar-user'), 'MSP administrator');
    expectText(screen.getByTestId('button-organization-picker'), 'Cedarline Security portfolio');
    await user.click(screen.getByTestId('button-open-client-redwood'));
    expect(screen.getByRole('heading', { name: 'Redwood Legal' })).not.toBeNull();
    expectText(screen.getByTestId('button-organization-picker'), 'Redwood Legal');
    expect(screen.queryByTestId('button-queue-action-5')).toBeNull();

    await user.click(screen.getByTestId('button-brand-launchpad'));
    await user.click(screen.getByTestId('button-launchpad-client-workspace'));
    expect(screen.getByRole('heading', { name: 'Redwood Legal' })).not.toBeNull();
    expectText(screen.getByTestId('client-organization-summary'), 'Redwood Legal');
    expect(screen.queryByTestId('button-sidebar-user')).toBeNull();
    expect(screen.queryByTestId('button-nav-prospects')).toBeNull();
  });

  test('routes client entry by persisted lifecycle and rejects invalid identity', async () => {
    const user = userEvent.setup();
    window.sessionStorage.setItem(CLIENT_IDENTITY_STORAGE_KEY, 'valiant');
    const incomplete = renderApp();
    await user.click(screen.getByTestId('button-launchpad-client-workspace'));
    expect(screen.getByRole('heading', { name: /Valiant Healthcare security onboarding/i })).not.toBeNull();
    expect(screen.getByTestId('button-journey-stage-business').textContent).toContain('current');
    incomplete.unmount();

    window.sessionStorage.setItem(CLIENT_IDENTITY_STORAGE_KEY, 'meridian');
    const waiting = renderApp();
    await user.click(screen.getByTestId('button-launchpad-client-workspace'));
    expect(screen.getByRole('heading', { name: /Meridian Capital security onboarding/i })).not.toBeNull();
    expect(screen.getByTestId('environment-blockers')).not.toBeNull();
    expect(screen.getByTestId('journey-next-actor').textContent).toContain('Meridian Capital');
    waiting.unmount();

    window.sessionStorage.setItem(CLIENT_IDENTITY_STORAGE_KEY, 'not-authorized');
    renderApp();
    await user.click(screen.getByTestId('button-launchpad-client-workspace'));
    expect(screen.getByTestId('client-access-state')).not.toBeNull();
    expect(screen.getByText(/did not fall back to another client/i)).not.toBeNull();
    expect(screen.queryByTestId('sidebar-navigation')).toBeNull();
  });

  test('returns to the Launchpad when the sidebar shield is clicked', async () => {
    const user = userEvent.setup();
    renderApp();
    await openCockpit(user);

    await user.click(screen.getByTestId('button-brand-launchpad'));

    expect(screen.getByRole('heading', { name: 'Sentriq' })).not.toBeNull();
    expect(screen.queryByTestId('sidebar-navigation')).toBeNull();
  });

  test('keeps MSP and organization policy spaces isolated by persona', async () => {
    const user = userEvent.setup();
    renderApp();
    await openCockpit(user);

    await user.click(screen.getByTestId('button-nav-policies'));
    expect(screen.getByRole('heading', { name: 'Policy center' })).not.toBeNull();
    expect(screen.getByText('MSP policy space')).not.toBeNull();
    expect(screen.getByTestId('policy-item-policy-1')).not.toBeNull();
    expect(screen.queryByTestId('policy-item-policy-3')).toBeNull();

    await user.click(screen.getByTestId('button-sidebar-user'));
    await user.click(screen.getByTestId('button-user-operator'));
    await user.click(screen.getByTestId('button-nav-policies'));

    expect(screen.getByText('Redwood Legal policy space')).not.toBeNull();
    expect(screen.getByTestId('policy-item-policy-3')).not.toBeNull();
    expect(screen.queryByTestId('policy-item-policy-1')).toBeNull();
    expectText(screen.getByTestId('policy-access-banner'), 'You can edit Redwood Legal policies only.');
  });

  test('lets analysts create, edit, and delete a policy in their own space', async () => {
    const user = userEvent.setup();
    renderApp();
    await openCockpit(user);

    await user.click(screen.getByTestId('button-sidebar-user'));
    await user.click(screen.getByTestId('button-user-operator'));
    await user.click(screen.getByTestId('button-nav-policies'));
    await user.click(screen.getByTestId('button-new-policy'));

    await user.type(screen.getByTestId('input-policy-name'), 'Redwood executive identity');
    await user.type(screen.getByTestId('input-policy-description'), 'Protect executive accounts with an explicit human review lane.');
    await user.type(screen.getByTestId('input-policy-trigger'), 'Privileged identity anomaly');
    await user.type(screen.getByTestId('input-policy-action'), 'Escalate to the account owner');
    await user.click(screen.getByTestId('button-save-policy'));

    expect(screen.getByText('Redwood executive identity')).not.toBeNull();
    const newPolicy = screen.getByText('Redwood executive identity').closest('[data-testid^="policy-item-"]') as HTMLElement;
    expect(newPolicy).not.toBeNull();
    const newPolicyId = newPolicy.getAttribute('data-testid')?.replace('policy-item-', '');
    expect(newPolicyId).toBeTruthy();

    await user.click(screen.getByTestId(`button-edit-policy-${newPolicyId}`));
    await user.clear(screen.getByTestId('input-policy-name'));
    await user.type(screen.getByTestId('input-policy-name'), 'Redwood executive identity v2');
    await user.click(screen.getByTestId('button-save-policy'));
    expect(screen.getByText('Redwood executive identity v2')).not.toBeNull();

    await user.click(screen.getByTestId(`button-delete-policy-${newPolicyId}`));
    await user.click(screen.getByTestId(`button-confirm-delete-policy-${newPolicyId}`));
    expect(screen.queryByTestId(`policy-item-${newPolicyId}`)).toBeNull();
  });

  test('shows a read-only headless stream and restores the prior hosted view', async () => {
    const user = userEvent.setup();
    renderApp();
    await openCockpit(user);

    await user.click(screen.getByTestId('button-nav-policies'));
    expect(screen.getByRole('heading', { name: 'Policy center' })).not.toBeNull();

    await user.click(screen.getByRole('checkbox', { name: 'Show Headless' }));

    await waitFor(() => expect(screen.getByTestId('headless-simulation')).not.toBeNull());
    expect(screen.getByText('stdout — OCSF NDJSON Stream')).not.toBeNull();
    expect(screen.getByText('Local data simulation — no active connections')).not.toBeNull();
    expect(screen.queryByTestId('sidebar-navigation')).toBeNull();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.getAllByRole('checkbox')).toHaveLength(1);
    await waitFor(() => expect(screen.getByTestId('headless-stream-container').querySelectorAll('[data-testid^="stream-row-"]').length).toBeGreaterThan(0));
    await waitFor(() => expect((screen.getByRole('checkbox', { name: 'Show Headless' }) as HTMLInputElement).disabled).toBe(false));

    await user.click(screen.getByRole('checkbox', { name: 'Show Headless' }));

    await waitFor(() => expect(screen.queryByTestId('headless-simulation')).toBeNull());
    expect(screen.getByRole('heading', { name: 'Policy center' })).not.toBeNull();
    expect(screen.getByTestId('sidebar-navigation')).not.toBeNull();
  });

  test('switches between MSP and Client Admin and scopes metrics to the selected client', async () => {
    const user = userEvent.setup();
    renderApp();
    await openCockpit(user);

    expectText(screen.getByTestId('text-admin-pending-count'), '3');
    await user.click(screen.getByTestId('button-sidebar-user'));
    expect(screen.getByTestId('button-user-supervisor').classList.contains('selected')).toBe(true);

    await user.click(screen.getByTestId('button-organization-picker'));
    await user.click(screen.getByTestId('button-organization-northstar'));
    await user.click(screen.getByTestId('button-sidebar-user'));
    await user.click(screen.getByTestId('button-user-operator'));

    expect(screen.getByRole('heading', { name: 'Northstar Dental' })).not.toBeNull();
    expectText(screen.getByTestId('text-client-admin-actions'), '1');
    expect(screen.getByText('Northstar security lead (demo)')).not.toBeNull();
    expect(screen.queryByTestId('button-nav-clients')).toBeNull();
    expect(screen.queryByTestId('button-nav-capacity')).toBeNull();

    await user.click(screen.getByTestId('button-organization-picker'));
    expect(screen.getByTestId('menu-organizations').querySelectorAll('[role="menuitem"]')).toHaveLength(1);

    expect(screen.getByRole('heading', { name: 'Northstar Dental' })).not.toBeNull();
    expectText(screen.getByTestId('text-client-admin-detections'), '31');
    expectText(screen.getByTestId('text-client-admin-actions'), '1');
    expect(screen.getByTestId('button-queue-action-5')).not.toBeNull();
  });

  test('keeps the selected organization visible when switching back to supervisor', async () => {
    const user = userEvent.setup();
    renderApp();
    await openCockpit(user);

    await user.click(screen.getByTestId('button-workspace-picker'));
    await user.click(screen.getByTestId('button-workspace-northbridge'));
    await user.click(screen.getByTestId('button-organization-picker'));
    await user.click(screen.getByTestId('button-organization-aster'));
    await user.click(screen.getByTestId('button-sidebar-user'));
    await user.click(screen.getByTestId('button-user-operator'));
    expect(screen.getByRole('heading', { name: 'Aster House Studio' })).not.toBeNull();

    await user.click(screen.getByTestId('button-sidebar-user'));
    await user.click(screen.getByTestId('button-user-supervisor'));

    expect(screen.getByTestId('button-organization-picker').textContent).toContain('Northbridge Cyber portfolio');
    expect(screen.getByText('MSP administrator (demo)')).not.toBeNull();
    expect(screen.getByRole('heading', { name: 'Good morning, Jordan.' })).not.toBeNull();
  });

  test('keeps Northbridge branding, clients, policies, capacity, and onboarding isolated', async () => {
    const user = userEvent.setup();
    renderApp();
    await openCockpit(user);

    await user.click(screen.getByTestId('button-workspace-picker'));
    await user.click(screen.getByTestId('button-workspace-northbridge'));

    expect(screen.getAllByText('Northbridge Cyber').length).toBeGreaterThan(0);
    expect(screen.queryByText('Fenwick Logistics')).toBeNull();
    expect(screen.getByTestId('button-nav-overview').textContent).not.toContain('2');

    await user.click(screen.getByTestId('button-nav-clients'));
    expect(screen.getByRole('heading', { name: 'Aster House Studio' })).not.toBeNull();
    expect(screen.getByText('Fleet / 1 client / 28 endpoints')).not.toBeNull();
    expect(screen.queryByText('Redwood Legal')).toBeNull();
    expect(screen.queryByText('Northstar Dental')).toBeNull();

    await user.click(screen.getByTestId('button-nav-policies'));
    expect(screen.getByTestId('policy-item-policy-5')).not.toBeNull();
    expect(screen.queryByTestId('policy-item-policy-1')).toBeNull();

    await user.click(screen.getByTestId('button-nav-capacity'));
    expect(screen.getByText('28 endpoints reporting')).not.toBeNull();
    expect(screen.queryByText('Redwood Legal')).toBeNull();
  });

  test('does not let an ordinary client inherit a delegated approval role', async () => {
    const user = userEvent.setup();
    renderApp();
    await openCockpit(user);

    await user.click(screen.getByTestId('button-sidebar-user'));
    expectText(screen.getByTestId('button-user-operator'), 'Jordan Reyes');
    expectText(screen.getByTestId('button-user-operator'), 'Client contact');
    await user.click(screen.getByTestId('button-user-operator'));
    await user.click(screen.getByTestId('button-queue-action-1'));
    await user.click(screen.getByTestId('button-request-approve'));
    expectText(screen.getByTestId('text-request-status'), 'escalated');

    await user.click(screen.getByTestId('button-sidebar-user'));
    await user.click(screen.getByTestId('button-user-supervisor'));
    await user.click(screen.getByTestId('button-organization-picker'));
    await user.click(screen.getByTestId('button-organization-northstar'));
    await user.click(screen.getByTestId('button-sidebar-user'));
    expectText(screen.getByTestId('button-user-operator'), 'Morgan Lee');
    expectText(screen.getByTestId('button-user-operator'), 'Northstar security lead');
    await user.click(screen.getByTestId('button-user-operator'));
    expectText(screen.getByTestId('button-sidebar-user'), 'Morgan Lee');
    expectText(screen.getByTestId('button-sidebar-user'), 'Northstar security lead');
    await user.click(screen.getByTestId('button-queue-action-5'));
    await user.click(screen.getByTestId('button-request-approve'));
    expectText(screen.getByTestId('text-request-status'), 'approved');
    await user.click(screen.getByTestId('button-request-execute'));
    expectText(screen.getByTestId('text-request-status'), 'completed');
    await user.click(screen.getByTestId('button-nav-audit'));
    expect(screen.getAllByText(/Morgan Lee/).length).toBeGreaterThan(0);
  });

  test('opens the existing decision-action screen from a client action', async () => {
    const user = userEvent.setup();
    renderApp();
    await openCockpit(user);

    await user.click(screen.getByTestId('button-sidebar-user'));
    await user.click(screen.getByTestId('button-user-operator'));
    await user.click(screen.getByRole('button', { name: 'Review action' }));

    expect(screen.getByTestId('panel-decision-action')).not.toBeNull();
    expectText(screen.getByTestId('text-page-title'), 'Credential dumping attempt');
    expect(screen.getByText('Isolate endpoint from network')).not.toBeNull();
  });

  test('lists queued events in the sidebar and opens the selected decision action', async () => {
    const user = userEvent.setup();
    renderApp();
    await openCockpit(user);

    expect(screen.queryByText('Workspace')).toBeNull();
    expect(screen.getByTestId('sidebar-queue-list').querySelectorAll('button')).toHaveLength(3);
    expectText(screen.getByTestId('button-queue-action-1'), 'Credential dumping attempt');
    expectText(screen.getByTestId('button-queue-action-1'), 'Redwood Legal · RWL-FIN-07');
    expectText(screen.getByTestId('button-queue-action-3'), 'Unsigned driver loaded');
    expectText(screen.getByTestId('button-queue-action-3'), 'Pine & Co. Manufacturing · PCM-PLANT-14');
    expectText(screen.getByTestId('button-queue-action-5'), 'Endpoint isolation requested');
    expectText(screen.getByTestId('button-queue-action-5'), 'Northstar Dental · NSD-CLINIC-11');
    expect(screen.queryByTestId('button-nav-queue')).toBeNull();
    expect(screen.queryByRole('complementary', { name: 'Consequential action queue' })).toBeNull();

    await user.click(screen.getByTestId('button-queue-action-1'));

    expect(screen.getByTestId('panel-decision-action')).not.toBeNull();
    expectText(screen.getByTestId('text-page-title'), 'Credential dumping attempt');
    expect(screen.queryByRole('complementary', { name: 'Consequential action queue' })).toBeNull();
  });

  test('opens Fenwick onboarding from presenter-only cockpit controls and switches between plans', async () => {
    const user = userEvent.setup();
    renderApp();
    await openCockpit(user);
    await user.click(screen.getByTestId('button-sidebar-user'));
    await user.click(screen.getByTestId('button-user-technician'));
    await user.click(screen.getByTestId('button-nav-onboarding'));
    await user.click(screen.getByTestId('tab-view-technician'));
    expect(screen.getByRole('heading', { name: 'Day-0 Onboarding Plan' })).not.toBeNull();
    await user.click(screen.getByTestId('tab-view-client'));

    expect(screen.getByRole('heading', { name: "Here's where Fenwick stands." })).not.toBeNull();
    expect(screen.getByText('Not set up yet')).not.toBeNull();
    expect(screen.getByText('Turning on now')).not.toBeNull();
    expect(screen.getByText('Looking good')).not.toBeNull();
    expect(screen.getAllByTestId('onboarding-decision-card')).toHaveLength(2);

    await user.click(screen.getByTestId('button-decision-1-yes'));
    await user.click(screen.getByTestId('button-decision-2-no'));
    expect(screen.getByTestId('button-decision-1-yes').classList.contains('selected-yes')).toBe(true);
    expect(screen.getByTestId('button-decision-2-no').classList.contains('selected-no')).toBe(true);

    await user.click(screen.getByTestId('tab-view-technician'));
    expect(screen.getByRole('heading', { name: 'Day-0 Onboarding Plan' })).not.toBeNull();
    expect(screen.getByText('Assets discovered')).not.toBeNull();
    expect(screen.getByText('Auto-remediated')).not.toBeNull();
    expect(screen.getByText('78 total = 64 employee endpoints + 6 shared stations + 5 servers + 3 gateways')).not.toBeNull();
    expect(screen.getByText('Restrict 3 flagged inbound ports across legacy warehouse segments')).not.toBeNull();
    expect(screen.getByTestId('onboarding-draft-banner')).not.toBeNull();
    expect(screen.getAllByText('Starts on approval')).toHaveLength(2);
    expect(screen.getByText('Why the AI grouped it this way')).not.toBeNull();
    expect(screen.getByText('98% match to policy baseline')).not.toBeNull();

    await user.click(screen.getByTestId('button-adjust-draft'));
    expect(screen.getByText('Draft open for adjustment')).not.toBeNull();
    expect(screen.getByTestId('onboarding-adjustment-panel')).not.toBeNull();
    await user.selectOptions(screen.getByTestId('select-draft-start'), 'maintenance-window');
    await user.type(screen.getByTestId('input-draft-note'), 'Confirm the 8 PM warehouse change window.');
    await user.click(screen.getByTestId('button-save-draft-adjustments'));
    expect(screen.queryByTestId('onboarding-adjustment-panel')).toBeNull();
    expect(screen.getByText('Adjustments saved · ready for approval')).not.toBeNull();
    await user.click(screen.getByTestId('button-approve-draft'));
    expect(screen.getByText('Plan approved · brief sent to Fenwick Logistics')).not.toBeNull();
    expect(screen.getByText('Approved')).not.toBeNull();
    expect(screen.getByTestId('onboarding-draft-banner').textContent).toContain('Day-0 remediation is ready to start.');
    expect(screen.getByTestId('onboarding-draft-banner').textContent).not.toContain('Approve & send to client');
    expect(screen.getAllByText('queued').length).toBeGreaterThan(0);
    expect(screen.getAllByText('in progress').length).toBeGreaterThan(0);
    expect(screen.queryAllByText('Starts on approval')).toHaveLength(0);

    await user.click(screen.getByTestId('tab-tech-30day'));
    expect(screen.getByText('Transition 6 warehouse stations to individual logins')).not.toBeNull();
    expect(screen.queryByText('Restrict 3 flagged inbound ports across legacy warehouse segments')).toBeNull();
  });

  test('reset restores the MSP Admin starting state after a client action', async () => {
    const user = userEvent.setup();
    renderApp();
    await openCockpit(user);

    await user.click(screen.getByTestId('button-organization-picker'));
    await user.click(screen.getByTestId('button-organization-pine'));
    await user.click(screen.getByTestId('button-sidebar-user'));
    await user.click(screen.getByTestId('button-user-operator'));
    expectText(screen.getByTestId('button-queue-action-3'), 'PCM-PLANT-14');
    await user.click(screen.getByTestId('button-queue-action-3'));
    expectText(screen.getByTestId('text-page-title'), 'Unsigned driver loaded');

    await user.click(screen.getByTestId('button-reset-demo'));

    expect(screen.getByRole('heading', { name: 'Sentriq' })).not.toBeNull();
    await openCockpit(user);
    expect(screen.getByText('MSP administrator (demo)')).not.toBeNull();
    expect(screen.getByRole('heading', { name: 'Good morning, Jordan.' })).not.toBeNull();
    expectText(screen.getByTestId('text-admin-pending-count'), '3');
    expect(screen.getByTestId('sidebar-queue-list').querySelectorAll('button')).toHaveLength(3);
    expect(screen.queryByTestId('select-client-admin')).toBeNull();
    expect(screen.queryByRole('complementary', { name: 'Consequential action queue' })).toBeNull();
  });
});