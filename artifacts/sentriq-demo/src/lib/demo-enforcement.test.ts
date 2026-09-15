import { describe, expect, test } from 'vitest';
import { enforceDemoExecution, type DemoScope } from './demo-enforcement';

const scope: DemoScope = {
  version: 3,
  clientKey: 'redwood',
  allowedActions: ['quarantine_process', 'isolate_endpoint'],
  routineAutomation: true,
  routineLimit: 10,
  approvalRoles: ['msp_admin'],
};

describe('demo enforcement (session simulation only)', () => {
  test('holds high-impact work even when routine automation is enabled', () => {
    const result = enforceDemoExecution({
      actionId: 'a1',
      action: 'isolate_endpoint',
      clientKey: 'redwood',
      impact: 'high_impact',
      requestedBy: 'msp_technician',
      confidence: 99,
      scopeVersion: 3,
    }, scope);
    expect(result.executed).toBe(false);
    expect(result.decision).toBe('pending_approval');
  });

  test('rechecks revoked authority at execution', () => {
    const result = enforceDemoExecution({
      actionId: 'a2',
      action: 'quarantine_process',
      clientKey: 'redwood',
      impact: 'routine_reversible',
      requestedBy: 'msp_technician',
      confidence: 96,
      scopeVersion: 2,
    }, scope);
    expect(result.executed).toBe(false);
    expect(result.reason).toContain('stale');
  });

  test('routes out-of-scope actions and rejects low confidence', () => {
    const outOfScope = enforceDemoExecution({
      actionId: 'a3',
      action: 'revoke_sessions',
      clientKey: 'redwood',
      impact: 'routine_reversible',
      requestedBy: 'client',
      confidence: 98,
      scopeVersion: 3,
    }, scope);
    expect(outOfScope.decision).toBe('escalated');

    const uncertain = enforceDemoExecution({
      actionId: 'a4',
      action: 'quarantine_process',
      clientKey: 'redwood',
      impact: 'routine_reversible',
      requestedBy: 'msp_technician',
      confidence: 72,
      scopeVersion: 3,
    }, scope);
    expect(uncertain.executed).toBe(false);
  });

  test('requires a named current reviewer for high-impact execution', () => {
    const result = enforceDemoExecution({
      actionId: 'a5',
      action: 'isolate_endpoint',
      clientKey: 'redwood',
      impact: 'high_impact',
      requestedBy: 'msp_technician',
      confidence: 99,
      scopeVersion: 3,
      approval: { actor: 'Jordan Reyes', role: 'msp_admin', scopeVersion: 3 },
    }, scope);
    expect(result).toMatchObject({ decision: 'execute', executed: true });
  });
});