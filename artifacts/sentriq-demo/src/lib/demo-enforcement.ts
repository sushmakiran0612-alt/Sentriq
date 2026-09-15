/**
 * Pure, session-local enforcement helpers for the interactive demo.
 * These are intentionally not production authorization or immutable audit.
 */
export type DemoRole = 'msp_admin' | 'msp_technician' | 'client';
export type Impact = 'routine_reversible' | 'high_impact';
export type ExecutionDecision = 'execute' | 'pending_approval' | 'denied' | 'escalated';

export interface DemoScope {
  version: number;
  clientKey: string;
  allowedActions: string[];
  routineAutomation: boolean;
  routineLimit: number;
  approvalRoles: string[];
  delegatedClientRole?: string;
}

export interface DemoExecutionRequest {
  actionId: string;
  action: string;
  clientKey: string;
  impact: Impact;
  requestedBy: DemoRole;
  confidence: number;
  scopeVersion: number;
  approval?: { actor: string; role: string; scopeVersion: number };
}

export interface DemoExecutionResult {
  decision: ExecutionDecision;
  executed: boolean;
  reason: string;
}

export function enforceDemoExecution(request: DemoExecutionRequest, scope: DemoScope): DemoExecutionResult {
  if (request.clientKey !== scope.clientKey) {
    return { decision: 'denied', executed: false, reason: 'Client scope does not match the current demo policy.' };
  }
  if (request.scopeVersion !== scope.version) {
    return { decision: 'denied', executed: false, reason: 'Policy version is stale or authority was revoked.' };
  }
  if (!scope.allowedActions.includes(request.action)) {
    return { decision: 'escalated', executed: false, reason: 'Action is outside the current client scope; routed to the MSP.' };
  }
  if (request.confidence < 80) {
    return { decision: 'escalated', executed: false, reason: 'Low-confidence recommendation requires human investigation.' };
  }
  if (request.impact === 'high_impact') {
    const approval = request.approval;
    const validApproval = approval
      && approval.scopeVersion === scope.version
      && (scope.approvalRoles.includes(approval.role)
        || approval.role === scope.delegatedClientRole);
    if (!validApproval) {
      return { decision: 'pending_approval', executed: false, reason: 'High-impact action requires an explicit named human approval.' };
    }
  } else if (!scope.routineAutomation) {
    return { decision: 'pending_approval', executed: false, reason: 'Routine automation is disabled by the current client policy.' };
  }
  return { decision: 'execute', executed: true, reason: 'Demo policy permitted this simulated, reversible execution.' };
}

export interface DemoAuditEvent {
  id: string;
  kind: 'recommendation' | 'proposal_decision' | 'request' | 'action';
  actor: string;
  approver?: string;
  policyVersion?: number;
  decision: string;
  timestamp: string;
  executionOutcome?: string;
  internalNote?: string;
}