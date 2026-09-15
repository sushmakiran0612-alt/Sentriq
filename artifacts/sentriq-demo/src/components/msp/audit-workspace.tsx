import { ActionAudit } from '@/lib/demo-action-requests';
import '../shared/demo-styles.css';
export function AuditWorkspace({ events, clientOnly = false, clientKey }: { events: ActionAudit[]; clientOnly?: boolean; clientKey?: string }) {
  const visible = events.filter(event => !clientOnly || event.clientKey === clientKey);
  return <div className="sq-workspace-transition" style={{ maxWidth: 1100, margin: '0 auto' }}>
    <div className="sq-page-head"><div><div className="sq-kicker">History · session-local demo</div><h1>{clientOnly ? 'Request history' : 'Audit & history'}</h1><p>Editable browser-session records only — not immutable production audit and not a security boundary.</p></div></div>
    <div className="sq-detail-panel"><div className="sq-detail-body">{visible.map(event => <div key={event.id} data-testid={`audit-event-${event.id}`} style={{ padding: 14, borderBottom: '1px solid var(--sq-line-soft)' }}><strong>{event.event}: {event.actionDetails}</strong><div className="sq-muted">{event.clientKey} · requester {event.requester} · approver {event.approver} · {event.timestamp}</div><div>Decision: {event.decision} · outcome: {event.executionOutcome} · policy {event.policyId} v{event.policyVersion}</div><div>{event.clientSafeOutcome}</div>{!clientOnly && <small>Internal note: {event.internalNote ?? 'Not applicable'}</small>}</div>)}</div></div>
  </div>;
}