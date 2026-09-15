import { describe, expect, test } from 'vitest';
import { enforceDemoExecution } from './demo-enforcement';
import { initialActionRequests, toAudit, reviewAction, executeAction, modifyAction } from './demo-action-requests';

const scope = { version: 4, clientKey: 'northstar', allowedActions: ['quarantine_process', 'isolate_endpoint'], routineAutomation: true, routineLimit: 8, approvalRoles: ['MSP administrator'], delegatedClientRole: 'Northstar security lead' };
describe('session action request and audit scenarios', () => {
  test('seeds isolated six scenarios and complete audit fields', () => {
    expect(initialActionRequests).toHaveLength(6);
    expect(new Set(initialActionRequests.map(request => request.workspaceId))).toEqual(new Set(['cedarline', 'northbridge']));
    const denial = toAudit(initialActionRequests.find(request => request.id === 'req-revoked')!, 'execution denial');
    expect(denial).toMatchObject({ requester: 'Casey Morgan', approver: 'Not applicable', policyId: 'aster-automation', executionOutcome: 'denied before execution' });
  });
  test('high impact cannot use automation and delegated role is explicit', () => {
    const result = enforceDemoExecution({ actionId: 'x', action: 'isolate_endpoint', clientKey: 'northstar', impact: 'high_impact', requestedBy: 'client', confidence: 99, scopeVersion: 4 }, scope);
    expect(result.decision).toBe('pending_approval');
    const approved = enforceDemoExecution({ actionId: 'x', action: 'isolate_endpoint', clientKey: 'northstar', impact: 'high_impact', requestedBy: 'client', confidence: 99, scopeVersion: 4, approval: { actor: 'Northstar security lead', role: 'Northstar security lead', scopeVersion: 4 } }, scope);
    expect(approved.executed).toBe(true);
  });
  test('rejection remains unexecuted and low confidence escalates', () => {
    const rejected = initialActionRequests.find(request => request.id === 'req-impact')!;
    expect(rejected.executionOutcome).toContain('not executed');
    const low = initialActionRequests.find(request => request.id === 'req-low')!;
    expect(low.status).toBe('escalated');
  });
  test('unauthorized client and technician cannot approve', () => {
    const pending = { ...initialActionRequests.find(request => request.id === 'req-impact')!, status: 'pending' as const };
    expect(reviewAction(pending, 'approve', 'Jordan Reyes', 'Client contact', scope).status).toBe('escalated');
    expect(reviewAction(pending, 'approve', 'Casey Morgan', 'MSP technician/security analyst', scope).status).toBe('escalated');
  });
  test('delegated and MSP approvals execute only with current context', () => {
    const pending = { ...initialActionRequests.find(request => request.id === 'req-delegated')!, status: 'pending' as const };
    const delegated = reviewAction(pending, 'approve', 'Northstar security lead', 'Northstar security lead', scope);
    expect(executeAction(delegated, scope).status).toBe('completed');
    const admin = reviewAction({ ...pending, impact: 'high_impact' }, 'approve', 'Jordan Reyes', 'MSP administrator', scope);
    expect(executeAction(admin, scope).status).toBe('completed');
    expect(executeAction(modifyAction(admin, 'revoke_sessions', 5), scope).status).toBe('denied');
  });
  test('stale action, record context, or policy version is denied before execution', () => {
    const pending = { ...initialActionRequests.find(request => request.id === 'req-delegated')!, status: 'pending' as const };
    const approved = reviewAction({ ...pending, impact: 'high_impact' }, 'approve', 'Jordan Reyes', 'MSP administrator', scope);
    expect(executeAction({ ...approved, actionFingerprint: 'changed-after-approval' }, scope)).toMatchObject({ status: 'denied', executionOutcome: 'denied before execution' });
    expect(executeAction({ ...approved, contextVersion: approved.contextVersion + 1 }, scope)).toMatchObject({ status: 'denied', executionOutcome: 'denied before execution' });
    expect(executeAction(approved, { ...scope, version: scope.version + 1 })).toMatchObject({ status: 'denied', executionOutcome: 'denied before execution' });
  });
  test('rejection never executes', () => {
    const pending = { ...initialActionRequests.find(request => request.id === 'req-impact')!, status: 'pending' as const };
    const rejected = reviewAction(pending, 'reject', 'Jordan Reyes', 'MSP administrator', scope);
    expect(rejected.executionOutcome).toContain('not executed');
    expect(executeAction(rejected, scope).executionOutcome).toContain('not executed');
  });
  test('routine limit and nonreversible policy block execution', () => {
    const routine = { ...initialActionRequests[0], status: 'pending' as const, reversible: true };
    expect(executeAction(routine, { ...scope, routineLimit: 1 }, 1).status).toBe('escalated');
    expect(executeAction({ ...routine, reversible: false }, scope, 0).status).toBe('escalated');
  });
  test('terminal requests cannot be reviewed or executed again', () => {
    const terminal = { ...initialActionRequests[0], status: 'rejected' as const };
    expect(reviewAction(terminal, 'approve', 'Jordan', 'MSP administrator', scope)).toEqual(terminal);
    expect(executeAction(terminal, scope)).toEqual(terminal);
  });
});