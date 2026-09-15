import { enforceDemoExecution, type DemoExecutionRequest, type DemoScope } from './demo-enforcement';

export type RequestStatus = 'pending' | 'escalated' | 'approved' | 'rejected' | 'completed' | 'denied' | 'failed';
export interface ActionRequest {
  id: string; alertId?: number; workspaceId: string; clientKey: string; action: string; impact: 'routine_reversible' | 'high_impact';
  reversible: boolean; confidence: number; requesterRole: 'client' | 'msp_technician' | 'msp_admin'; requester: string;
  approverRole?: string; approvedActionFingerprint?: string; approvedContextVersion?: number; approvedPolicyVersion?: number;
  actionFingerprint: string; contextVersion: number; policyId: string; policyVersion: number; status: RequestStatus;
  decision: string; executionOutcome: string; internalNote: string; clientSafeOutcome: string; approver: string;
}
export type ActionRequestEvent = 'request' | 'approve' | 'reject' | 'modify' | 'escalate' | 'execute';
export function requestAction(request: ActionRequest): ActionRequest {
  const low = request.confidence < 80;
  const outOfScope = request.decision === 'out-of-scope';
  return { ...request, status: low || outOfScope ? 'escalated' : 'pending', decision: low ? 'low confidence' : outOfScope ? 'out-of-scope' : 'pending human review', executionOutcome: 'not executed', clientSafeOutcome: low ? 'Sent to your MSP because evidence is uncertain.' : 'Waiting for review.' };
}
export function reviewAction(request: ActionRequest, decision: 'approve' | 'reject' | 'escalate', approver: string, reviewerRole = 'MSP administrator', scope?: DemoScope): ActionRequest {
  if (['completed', 'rejected', 'denied', 'failed'].includes(request.status)) return request;
  if (decision === 'reject') return { ...request, status: 'rejected', decision: 'rejected by reviewer', approver, executionOutcome: 'rejected — not executed', clientSafeOutcome: 'Your MSP rejected this action; it was not run.' };
  if (decision === 'escalate') return { ...request, status: 'escalated', decision: 'escalated for review', approver, executionOutcome: 'not executed', clientSafeOutcome: 'Sent to your MSP for review.' };
  const authorized = !scope || scope.approvalRoles.includes(reviewerRole) || scope.delegatedClientRole === reviewerRole;
  if (!authorized) return { ...request, status: 'escalated', decision: 'reviewer is not authorized', approver: 'Pending', executionOutcome: 'not executed', clientSafeOutcome: 'Sent to your MSP for authorized review.' };
  return { ...request, status: 'approved', decision: 'approved; execution recheck required', approver, approverRole: reviewerRole, approvedActionFingerprint: request.actionFingerprint, approvedContextVersion: request.contextVersion, approvedPolicyVersion: scope?.version ?? request.policyVersion, executionOutcome: 'pending execution recheck', clientSafeOutcome: 'Approved by an authorized reviewer; execution is being checked.' };
}
export function modifyAction(request: ActionRequest, action: string, contextVersion: number): ActionRequest {
  return { ...request, action, actionFingerprint: `fp-${request.id}-${action}`, contextVersion, status: 'pending', decision: 'modified; reapproval required', executionOutcome: 'not executed' };
}
export function executeAction(request: ActionRequest, scope: DemoScope, currentRoutineCount = 0): ActionRequest {
  if (['completed', 'rejected', 'denied', 'failed'].includes(request.status)) return request;
  if (request.status !== 'approved' && request.impact === 'high_impact') return { ...request, status: 'denied', decision: 'approval required', executionOutcome: 'denied before execution' };
  if (request.impact === 'routine_reversible' && (!request.reversible || !scope.routineAutomation || currentRoutineCount >= scope.routineLimit)) return { ...request, status: 'escalated', decision: 'routine policy does not permit execution', executionOutcome: 'not executed' };
  if (request.impact === 'high_impact' && (!request.approverRole || request.approvedActionFingerprint !== request.actionFingerprint || request.approvedContextVersion !== request.contextVersion || request.approvedPolicyVersion !== scope.version)) {
    return { ...request, status: 'denied', decision: 'approval or policy context is stale', executionOutcome: 'denied before execution', clientSafeOutcome: 'Action was not run because approval or current policy changed.' };
  }
  const evaluated = evaluateAction({ ...request, approval: { actor: request.approver ?? '', role: request.approverRole, scopeVersion: request.approvedPolicyVersion } } as ActionRequest, scope);
  return evaluated.status === 'completed' ? evaluated : { ...evaluated, status: evaluated.status === 'denied' ? 'denied' : 'failed' };
}
export interface ActionAudit {
  id: string; workspaceId: string; clientKey: string; event: string; actionDetails: string; requester: string;
  approver: string; policyId: string; policyVersion: number; decision: string; timestamp: string;
  executionOutcome: string; internalNote?: string; clientSafeOutcome: string;
}
export const DEMO_TIME = '2024-05-14T10:55:00Z';
export const initialActionRequests: ActionRequest[] = [
  { id: 'req-routine', workspaceId: 'cedarline', clientKey: 'redwood', action: 'quarantine_process', impact: 'routine_reversible', reversible: true, confidence: 97, requesterRole: 'client', requester: 'Maya Chen', actionFingerprint: 'fp-routine-1', contextVersion: 2, policyId: 'redwood-automation', policyVersion: 2, status: 'completed', decision: 'auto-permitted', executionOutcome: 'simulated complete', internalNote: 'Routine sample action within limit.', clientSafeOutcome: 'Routine protection action completed.', approver: 'Not applicable' },
  { id: 'req-scope', workspaceId: 'cedarline', clientKey: 'northstar', action: 'revoke_sessions', impact: 'routine_reversible', reversible: true, confidence: 96, requesterRole: 'client', requester: 'Eli Ramos', actionFingerprint: 'fp-scope-1', contextVersion: 4, policyId: 'northstar-automation', policyVersion: 4, status: 'escalated', decision: 'out-of-scope', executionOutcome: 'not executed', internalNote: 'Client requested identity action outside configured scope.', clientSafeOutcome: 'Sent to your MSP for review.', approver: 'Pending MSP' },
  { id: 'req-impact', workspaceId: 'cedarline', clientKey: 'redwood', action: 'isolate_endpoint', impact: 'high_impact', reversible: true, confidence: 99, requesterRole: 'msp_technician', requester: 'Casey Morgan', actionFingerprint: 'fp-impact-1', contextVersion: 2, policyId: 'redwood-automation', policyVersion: 2, status: 'pending', decision: 'human approval required', executionOutcome: 'not executed', internalNote: 'Automation never approves containment.', clientSafeOutcome: 'Waiting for MSP human approval.', approver: 'Pending MSP' },
  { id: 'req-delegated', alertId: 5, workspaceId: 'cedarline', clientKey: 'northstar', action: 'isolate_endpoint', impact: 'high_impact', reversible: true, confidence: 98, requesterRole: 'client', requester: 'Morgan Lee', actionFingerprint: 'fp-delegated-1', contextVersion: 4, policyId: 'northstar-automation', policyVersion: 4, status: 'pending', decision: 'named client approval required', executionOutcome: 'not executed', internalNote: 'Named client role is configured.', clientSafeOutcome: 'Waiting for the configured Northstar security lead.', approver: 'Pending client' },
  { id: 'req-revoked', workspaceId: 'northbridge', clientKey: 'aster', action: 'quarantine_process', impact: 'routine_reversible', reversible: true, confidence: 95, requesterRole: 'msp_technician', requester: 'Casey Morgan', actionFingerprint: 'fp-revoked-1', contextVersion: 1, policyId: 'aster-automation', policyVersion: 1, status: 'denied', decision: 'stale authority', executionOutcome: 'denied before execution', internalNote: 'Permission was revoked before the attempt.', clientSafeOutcome: 'Action was not run because current policy changed.', approver: 'Not applicable' },
  { id: 'req-low', workspaceId: 'northbridge', clientKey: 'aster', action: 'revoke_sessions', impact: 'routine_reversible', reversible: true, confidence: 62, requesterRole: 'client', requester: 'Nia Brooks', actionFingerprint: 'fp-low-1', contextVersion: 3, policyId: 'aster-automation', policyVersion: 3, status: 'escalated', decision: 'low confidence', executionOutcome: 'not executed', internalNote: 'Needs investigation.', clientSafeOutcome: 'Sent to your MSP because evidence is uncertain.', approver: 'Pending MSP' },
];
export function evaluateAction(request: ActionRequest, scope: DemoScope): ActionRequest {
  const result = enforceDemoExecution({ actionId: request.id, action: request.action, clientKey: request.clientKey, impact: request.impact, requestedBy: request.requesterRole, confidence: request.confidence, scopeVersion: request.contextVersion, approval: request.approverRole ? { actor: request.approver ?? '', role: request.approverRole, scopeVersion: request.approvedPolicyVersion ?? request.policyVersion } : undefined }, scope);
  const status: RequestStatus = result.decision === 'execute' ? 'completed' : result.decision === 'pending_approval' ? 'pending' : result.decision;
  return { ...request, status, decision: result.reason, executionOutcome: result.executed ? 'simulated complete' : result.reason, clientSafeOutcome: result.executed ? 'Action completed in the demo.' : 'Action was not executed; review is required.' };
}
export function toAudit(request: ActionRequest, event = 'action request'): ActionAudit {
  return { id: `audit-${request.id}-${event}`, workspaceId: request.workspaceId, clientKey: request.clientKey, event, actionDetails: request.action, requester: request.requester, approver: request.approver, policyId: request.policyId, policyVersion: request.policyVersion, decision: request.decision, timestamp: DEMO_TIME, executionOutcome: request.executionOutcome, internalNote: request.internalNote, clientSafeOutcome: request.clientSafeOutcome };
}