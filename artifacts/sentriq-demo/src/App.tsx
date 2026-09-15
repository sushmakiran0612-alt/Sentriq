import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { HeadlessSimulation } from '@/components/headless-simulation';
import { AdminCockpit, type AdminRole, type ClientKey } from '@/components/admin-cockpit';
import { OnboardingScreen, type OnboardingAudience } from '@/components/onboarding';
import { Launchpad, type LaunchpadTarget } from '@/components/launchpad';
import { initialPolicies, PolicyCenter, type PolicyRecord } from '@/components/policy-center';
import { useMspData, type Prospect } from '@/hooks/use-msp-data';
import { ProspectsWorkspace } from '@/components/msp/prospects-workspace';
import { PackagesWorkspace } from '@/components/msp/packages-workspace';
import { VendorsWorkspace } from '@/components/msp/vendors-workspace';
import { GovernanceWorkspace, type GovernanceConfig } from '@/components/msp/governance-workspace';
import { ActivationWorkspace } from '@/components/msp/activation-workspace';
import { AuditWorkspace } from '@/components/msp/audit-workspace';
import { initialActionRequests, toAudit, requestAction, reviewAction, modifyAction, executeAction, type ActionRequest, type ActionAudit, DEMO_TIME } from '@/lib/demo-action-requests';
import { ClientIntakeWorkspace } from '@/components/client/intake-workspace';
import { ProposalWorkspace } from '@/components/client/proposal-workspace';
import { ClientJourneyWorkspace } from '@/components/client/client-journey';
import {
  getClientImpacts,
  getProjectedImpact,
  policyImpactProfiles,
  type ClientImpact,
  type PolicyImpact,
} from '@/lib/policy-impact';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

export const CLIENT_IDENTITY_STORAGE_KEY = 'sentriq:client-demo-identity:v1';
export const MSP_PROSPECT_CONTEXT_STORAGE_KEY = 'sentriq:msp-prospect-context:v1';

import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bot,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileText,
  Gauge,
  Info,
  Network,
  RefreshCcw,
  Search,
  Server,
  Share2,
  ShieldCheck,
  Sparkles,
  X,
  UserPlus,
  Package as PackageIcon,
  Store,
  ClipboardList,
  FileCheck
  ,PlugZap
} from 'lucide-react';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';

const queryClient = new QueryClient();

type View = 'overview' | 'clients' | 'capacity' | 'policies' | 'governance' | 'activation' | 'audit' | 'onboarding' | 'prospects' | 'packages' | 'vendors' | 'intake' | 'proposal' | 'journey';
type AlertStatus = 'pending' | 'handled' | 'dismissed' | 'approved';
type ConfidenceBand = 'low' | 'medium' | 'high';
type DecisionType = 'isolate_endpoint' | 'quarantine_process' | 'quarantine_driver' | 'revoke_sessions';
type Alert = {
  id: number;
  title: string;
  decisionType: DecisionType;
  severity: 'critical' | 'high' | 'medium';
  client: string;
  endpoint: string;
  age: string;
  status: AlertStatus;
  description: string;
  action: string;
  evidence: { key: string; value: string; tone?: string }[];
  rationale: string;
  confidence: string;
};

const AUTOMATION_THRESHOLD = 90;

type AnalyticsData = Record<string, string | number | boolean>;

// Replit injects Umami only after analytics is enabled and the app is published.
// Its absence in development is intentional, so event delivery must stay optional.
declare global {
  interface Window {
    umami?: {
      track(name: string, data?: AnalyticsData): void;
    };
  }
}

function trackEvent(name: string, data?: AnalyticsData): void {
  if (typeof window === 'undefined') return;

  try {
    window.umami?.track(name, data);
  } catch {
    // Analytics must never break the app.
  }
}

const confidenceProfiles: Record<number, { similarActions: number; positiveOutcomes: number }> = {
  1: { similarActions: 42, positiveOutcomes: 41 },
  2: { similarActions: 38, positiveOutcomes: 36 },
  3: { similarActions: 17, positiveOutcomes: 16 },
  4: { similarActions: 19, positiveOutcomes: 14 },
};

const confidenceExamples: { label: string; score: number; detail: string }[] = [
  { label: 'High confidence', score: 98.4, detail: '41 of 42 similar actions produced a positive outcome' },
  { label: 'Medium confidence', score: 84.2, detail: '16 of 19 similar actions produced a positive outcome' },
  { label: 'Low confidence', score: 73.5, detail: '14 of 19 similar actions produced a positive outcome' },
];

function confidenceBand(score: number): ConfidenceBand {
  if (score >= 90) return 'high';
  if (score >= 80) return 'medium';
  return 'low';
}

function confidenceLabel(band: ConfidenceBand) {
  return band === 'high' ? 'High confidence' : band === 'medium' ? 'Medium confidence' : 'Low confidence';
}

const initialAlerts: Alert[] = [
  {
    id: 1,
    title: 'Credential dumping attempt',
    decisionType: 'isolate_endpoint',
    severity: 'critical',
    client: 'Redwood Legal',
    endpoint: 'RWL-FIN-07',
    age: '8 min ago',
    status: 'pending',
    description: 'LSASS access was blocked after a signed utility spawned an unsigned child process.',
    action: 'Isolate endpoint from network',
    confidence: '98.4%',
    evidence: [
      { key: 'process', value: 'rundll32.exe → procdump.exe', tone: 'red' },
      { key: 'target', value: 'C:\\Windows\\System32\\lsass.exe', tone: 'gold' },
      { key: 'rule', value: 'T1003.001 / OS Credential Dumping', tone: 'cyan' },
      { key: 'observed', value: '10:42:18 UTC' },
    ],
    rationale: 'The process chain matches a known credential access pattern. Network isolation limits lateral movement while preserving the endpoint for forensic review.',
  },
  {
    id: 2,
    title: 'Suspicious PowerShell activity',
    decisionType: 'quarantine_process',
    severity: 'high',
    client: 'Northstar Dental',
    endpoint: 'NSD-RECEP-02',
    age: '24 min ago',
    status: 'handled',
    description: 'Encoded PowerShell was decoded and blocked before making an outbound connection.',
    action: 'Block process and quarantine file',
    confidence: '96.1%',
    evidence: [
      { key: 'process', value: 'powershell.exe -enc [redacted]', tone: 'red' },
      { key: 'destination', value: '185.199.110.42:443', tone: 'gold' },
      { key: 'rule', value: 'T1059.001 / PowerShell', tone: 'cyan' },
      { key: 'observed', value: '10:26:03 UTC' },
    ],
    rationale: 'The payload was blocked at execution and the file hash is now contained across the Northstar fleet.',
  },
  {
    id: 5,
    title: 'Endpoint isolation requested',
    decisionType: 'isolate_endpoint',
    severity: 'critical',
    client: 'Northstar Dental',
    endpoint: 'NSD-CLINIC-11',
    age: '12 min ago',
    status: 'pending',
    description: 'A confirmed lateral-movement pattern requires a named human reviewer before simulated endpoint isolation.',
    action: 'Isolate endpoint from network',
    confidence: '98.0%',
    evidence: [
      { key: 'process', value: 'wmic.exe → remote service', tone: 'red' },
      { key: 'target', value: 'NSD-CLINIC-11', tone: 'gold' },
      { key: 'rule', value: 'T1021 / Remote Services', tone: 'cyan' },
      { key: 'observed', value: '10:38:07 UTC' },
    ],
    rationale: 'The action is high impact, so the configured Northstar security lead must explicitly approve it before the execution-time policy recheck.',
  },
  {
    id: 3,
    title: 'Unsigned driver loaded',
    decisionType: 'quarantine_driver',
    severity: 'high',
    client: 'Pine & Co. Manufacturing',
    endpoint: 'PCM-PLANT-14',
    age: '41 min ago',
    status: 'pending',
    description: 'A new kernel driver appeared on an engineering workstation outside the maintenance window.',
    action: 'Quarantine driver and stop service',
    confidence: '91.8%',
    evidence: [
      { key: 'driver', value: 'acmeio64.sys / unsigned', tone: 'red' },
      { key: 'service', value: 'AcmeIOController', tone: 'gold' },
      { key: 'rule', value: 'T1547.006 / Kernel Modules', tone: 'cyan' },
      { key: 'observed', value: '10:09:44 UTC' },
    ],
    rationale: 'The driver has no trusted signature and has not been seen on this client before. Stopping the service is reversible and prevents persistence.',
  },
  {
    id: 4,
    title: 'Impossible travel sign-in',
    decisionType: 'revoke_sessions',
    severity: 'medium',
    client: 'Redwood Legal',
    endpoint: 'Identity / M. Chen',
    age: '1 hr ago',
    status: 'dismissed',
    description: 'A successful sign-in from Austin followed a sign-in from Dublin 22 minutes earlier.',
    action: 'Revoke active sessions',
    confidence: '73.5%',
    evidence: [
      { key: 'origin a', value: 'Dublin, IE', tone: 'gold' },
      { key: 'origin b', value: 'Austin, US', tone: 'gold' },
      { key: 'factor', value: 'FIDO2 verified', tone: 'cyan' },
      { key: 'observed', value: '09:19:12 UTC' },
    ],
    rationale: 'The FIDO2 challenge and known device fingerprint lower the likelihood of account takeover. No action was taken.',
  },
];

const navItems: { id: View; label: string; icon: any; mspOnly?: boolean; clientOnly?: boolean; prospectOnly?: boolean }[] = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'clients', label: 'Clients & fleet', icon: Network, mspOnly: true },
  { id: 'capacity', label: 'Impact & capacity', icon: Gauge, mspOnly: true },
  { id: 'prospects', label: 'Prospect pipeline', icon: UserPlus, mspOnly: true },
  { id: 'packages', label: 'Packages', icon: PackageIcon, mspOnly: true },
  { id: 'vendors', label: 'Vendor catalog', icon: Store, mspOnly: true },
  { id: 'governance', label: 'Governance', icon: ShieldCheck, mspOnly: true },
  { id: 'activation', label: 'Activation', icon: PlugZap, mspOnly: true },
  { id: 'audit', label: 'Audit & history', icon: FileText, mspOnly: true },
];

const clientProspectItems: { id: View; label: string; icon: any }[] = [
  { id: 'journey', label: 'Onboarding journey', icon: ClipboardList },
  { id: 'audit', label: 'Request history', icon: FileText },
];

type SidebarPickerOption = {
  value: string;
  label: string;
  description: string;
  leading: ReactNode;
  testId: string;
};

function SidebarPicker({ value, label, options, trigger, triggerTestId, menuTestId, open, onOpenChange, onSelect }: {
  value: string;
  label: string;
  options: SidebarPickerOption[];
  trigger: ReactNode;
  triggerTestId: string;
  menuTestId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="sidebar-picker">
      <button className="sidebar-picker-trigger" onClick={() => onOpenChange(!open)} type="button" aria-expanded={open} aria-haspopup="menu" data-testid={triggerTestId}>
        {trigger}
        <ChevronDown size={14} className={open ? 'open' : ''} />
      </button>
      {open && <div className="sidebar-picker-menu" role="menu" aria-label={label} data-testid={menuTestId}>
        <div className="sidebar-picker-menu-label">{label}</div>
        {options.map((option) => (
          <button className={`sidebar-picker-option ${option.value === value ? 'selected' : ''}`} onClick={() => { onSelect(option.value); onOpenChange(false); }} type="button" role="menuitem" key={option.value} data-testid={option.testId}>
            {option.leading}
            <span><strong>{option.label}</strong><small>{option.description}</small></span>
            {option.value === value && <Check size={14} />}
          </button>
        ))}
      </div>}
    </div>
  );
}

function AppShell() {
  const [view, _setView] = useState<View | 'action'>('overview');
  const setView = (v: View | 'action') => {
    console.warn('_setView called with', v);
    _setView(v);
  };
  const [showLaunchpad, setShowLaunchpad] = useState(true);
  const [presenterControls, setPresenterControls] = useState(false);
  const [clientAccessDenied, setClientAccessDenied] = useState(false);
  const [isHeadless, setIsHeadless] = useState(false);
  const [renderedMode, setRenderedMode] = useState<'hosted' | 'headless'>('hosted');
  const [modeTransition, setModeTransition] = useState<'idle' | 'exiting' | 'entering'>('idle');
  const modeTransitionTimers = useRef<number[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);
  const [selectedId, setSelectedId] = useState(1);
  const [actionAlertId, setActionAlertId] = useState(1);
  const [automationPolicies, setAutomationPolicies] = useState<Record<number, boolean>>({});
  const [filter, setFilter] = useState<'all' | 'pending' | 'handled'>('all');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');
  const [adminRole, setAdminRole] = useState<AdminRole>('msp');
  const [mspWorkspaceId, setMspWorkspaceId] = useState('cedarline');
  const [governance, setGovernance] = useState<GovernanceConfig[]>([
    { clientKey: 'redwood', allowedActions: ['isolate_endpoint', 'quarantine_process'], routineAutomation: true, routineLimit: 10, approvalRoles: ['MSP administrator'], version: 2 },
    { clientKey: 'northstar', allowedActions: ['quarantine_process', 'isolate_endpoint'], routineAutomation: true, routineLimit: 8, approvalRoles: ['MSP administrator'], delegatedClientRole: 'Northstar security lead', version: 4 },
    { clientKey: 'aster', allowedActions: ['quarantine_process'], routineAutomation: true, routineLimit: 6, approvalRoles: ['MSP administrator'], version: 3 },
  ]);
  const operationalSession = useMemo(() => {
    try {
      const parsed = JSON.parse(window.sessionStorage.getItem('sentriq:operational-demo-session:v1') ?? '{}') as { actionRequests?: ActionRequest[]; auditEvents?: ActionAudit[] };
      return {
        actionRequests: Array.isArray(parsed.actionRequests) ? parsed.actionRequests : initialActionRequests,
        auditEvents: Array.isArray(parsed.auditEvents) ? parsed.auditEvents : initialActionRequests.map(request => toAudit(request, 'seeded request')),
      };
    } catch {
      window.sessionStorage.removeItem('sentriq:operational-demo-session:v1');
      return { actionRequests: initialActionRequests, auditEvents: initialActionRequests.map(request => toAudit(request, 'seeded request')) };
    }
  }, []);
  const [actionRequests, setActionRequests] = useState<ActionRequest[]>(operationalSession.actionRequests);
  const [auditEvents, setAuditEvents] = useState<ActionAudit[]>(operationalSession.auditEvents);
  const appendAudit = (event: ActionAudit) => {
    setAuditEvents(current => [...current, {
      ...event,
      id: `audit-${current.length + 1}-${event.event}`,
      timestamp: event.timestamp === DEMO_TIME ? new Date().toISOString() : event.timestamp,
    }]);
  };
  const [openSidebarPicker, setOpenSidebarPicker] = useState<'user' | 'organization' | 'workspace' | null>(null);
  const [selectedClientKey, setSelectedClientKey] = useState<ClientKey>(() => (window.sessionStorage.getItem(CLIENT_IDENTITY_STORAGE_KEY) || 'redwood') as ClientKey);
  const [selectedMspProspectKey, setSelectedMspProspectKey] = useState<ClientKey | null>(() => window.sessionStorage.getItem(MSP_PROSPECT_CONTEXT_STORAGE_KEY));
  const [onboardingAudience, setOnboardingAudience] = useState<OnboardingAudience>('client');
  const [policies, setPolicies] = useState<PolicyRecord[]>(initialPolicies);
  const { vendors, setVendors, packages, setPackages, prospects, setProspects, resetMspData } = useMspData();
  useEffect(() => {
    window.sessionStorage.setItem(CLIENT_IDENTITY_STORAGE_KEY, selectedClientKey);
  }, [selectedClientKey]);
  useEffect(() => {
    if (selectedMspProspectKey) {
      window.sessionStorage.setItem(MSP_PROSPECT_CONTEXT_STORAGE_KEY, selectedMspProspectKey);
    } else {
      window.sessionStorage.removeItem(MSP_PROSPECT_CONTEXT_STORAGE_KEY);
    }
  }, [selectedMspProspectKey]);
  useEffect(() => {
    window.sessionStorage.setItem('sentriq:operational-demo-session:v1', JSON.stringify({ actionRequests, auditEvents }));
  }, [actionRequests, auditEvents]);
  const workspaceClients: Record<string, string[]> = {
    cedarline: ['redwood', 'northstar', 'pine', ...prospects.filter(prospect => prospect.workspaceId === 'cedarline' && prospect.activated).map(prospect => prospect.key)],
    northbridge: ['aster', ...prospects.filter(prospect => prospect.workspaceId === 'northbridge' && prospect.activated).map(prospect => prospect.key)],
  };
  const workspacePackages = packages.filter(pkg => (pkg.workspaceId ?? 'cedarline') === mspWorkspaceId);
  const workspaceVendors = vendors.filter(vendor => (vendor.workspaceId ?? 'cedarline') === mspWorkspaceId);

  const filteredAlerts = useMemo(() => alerts.filter((alert) => {
    const matchesFilter = filter === 'all' || (filter === 'pending' ? alert.status === 'pending' : alert.status === 'handled' || alert.status === 'approved');
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || `${alert.title} ${alert.client} ${alert.endpoint}`.toLowerCase().includes(query);
    return matchesFilter && matchesSearch;
  }), [alerts, filter, search]);
  const pendingCount = alerts.filter((alert) => alert.status === 'pending').length;
  const handledCount = alerts.filter((alert) => alert.status === 'handled' || alert.status === 'approved').length;
  const clientNames: Record<string, string> = {
    redwood: 'Redwood Legal',
    northstar: 'Northstar Dental',
    pine: 'Pine & Co. Manufacturing',
    aster: 'Aster House Studio',
  };
  prospects.forEach(p => {
    clientNames[p.key] = `${p.name} (Prospect)`;
  });
  const clientProspect = prospects.find(p => p.key === selectedClientKey && p.workspaceId === mspWorkspaceId);
  const selectedMspProspect = prospects.find(p => p.key === selectedMspProspectKey && p.workspaceId === mspWorkspaceId);
  const isMspProspectDetail = adminRole === 'msp' && (view === 'prospects' || view === 'activation') && Boolean(selectedMspProspect);
  const isProspectContext = adminRole === 'client' ? Boolean(clientProspect) : isMspProspectDetail;
  const selectedProspect = adminRole === 'client' ? clientProspect : selectedMspProspect;
  const selectedProspectIdentity = selectedProspect?.contacts?.[0];
  const clientIdentity = selectedClientKey === 'northstar'
    ? { name: 'Morgan Lee', role: 'Northstar security lead' }
    : selectedProspectIdentity
      ? { name: selectedProspectIdentity.name, role: selectedProspectIdentity.role }
      : { name: 'Jordan Reyes', role: 'Client contact' };
  const activePersona = adminRole === 'msp'
    ? { name: 'Jordan Reyes', role: 'MSP administrator (demo)' }
    : adminRole === 'technician'
      ? { name: 'Casey Morgan', role: 'MSP technician (demo)' }
      : { name: clientIdentity.name, role: `${clientIdentity.role} (demo)` };
  const activePersonaInitials = activePersona.name.split(' ').map(part => part[0]).join('');

  const visibleNavItems: { id: View; label: string; icon: any; mspOnly?: boolean }[] = adminRole === 'client'
    ? (isProspectContext ? clientProspectItems : [...navItems.filter(({ id }) => id === 'overview'), { id: 'audit', label: 'Request history', icon: FileText }])
    : adminRole === 'technician' ? navItems.filter(({ mspOnly }) => !mspOnly) : navItems;
  const mspWorkspaceIds: View[] = ['prospects', 'packages', 'vendors', 'governance', 'activation', 'audit'];
  const securityNavItems = visibleNavItems.filter(({ id }) => !mspWorkspaceIds.includes(id) || (adminRole === 'client' && id === 'audit'));
  const mspWorkspaceItems = visibleNavItems.filter(({ id }) => mspWorkspaceIds.includes(id) && adminRole === 'msp');
  const securityPersonas: SidebarPickerOption[] = [
    { value: 'client', label: `Client identity · ${clientIdentity.name}`, description: `${clientIdentity.role} (demo)`, leading: <span className="role-avatar">{clientIdentity.name.split(' ').map(part => part[0]).join('')}</span>, testId: 'button-user-operator' },
    { value: 'msp', label: 'MSP identity · Jordan Reyes', description: 'MSP administrator (demo)', leading: <span className="role-avatar supervisor">JR</span>, testId: 'button-user-supervisor' },
    { value: 'technician', label: 'MSP identity · Casey Morgan', description: 'Technician / security analyst (demo)', leading: <span className="role-avatar">CM</span>, testId: 'button-user-technician' },
  ];
  const organizations: SidebarPickerOption[] = Object.entries(clientNames)
    .filter(([key]) => adminRole === 'client'
      || (workspaceClients[mspWorkspaceId] ?? []).includes(key)
      || prospects.some((prospect) => prospect.key === key && prospect.workspaceId === mspWorkspaceId))
    .map(([key, name]) => {
    const isProspect = prospects.some(p => p.key === key && p.workspaceId === mspWorkspaceId);
    return {
      value: key,
      label: name,
      description: key === selectedClientKey ? 'Current organization context' : (isProspect ? 'Prospect' : 'Managed organization'),
      leading: <span className="organization-avatar">{name.split(' ').map((word) => word[0]).join('').slice(0, 2)}</span>,
      testId: `button-organization-${key}`,
    };
    });
  const visibleOrganizations = adminRole === 'client'
    ? organizations.filter(({ value }) => value === selectedClientKey)
    : organizations;
  const decisionQueue = alerts.filter((alert) => !isMspProspectDetail && alert.status === 'pending'
    && (adminRole === 'client' ? alert.client === clientNames[selectedClientKey] : (workspaceClients[mspWorkspaceId] ?? []).some(key => clientNames[key] === alert.client)));
  const decisionQueueTarget = decisionQueue[0];
  const workspaceAlerts = alerts.filter(alert => !isMspProspectDetail && (adminRole === 'client'
    ? alert.client === clientNames[selectedClientKey]
    : (workspaceClients[mspWorkspaceId] ?? []).some(key => clientNames[key] === alert.client)));
  const workspaceName = mspWorkspaceId === 'northbridge' ? 'Northbridge Cyber' : 'Cedarline Security';
  const isPortfolioScope = adminRole === 'msp' && !isMspProspectDetail;
  const organizationScopeName = adminRole === 'technician' && view === 'onboarding'
    ? 'Fenwick Logistics'
    : isPortfolioScope
      ? `${workspaceName} portfolio`
      : isMspProspectDetail
        ? selectedMspProspect?.name ?? `${workspaceName} prospect portfolio`
        : clientNames[selectedClientKey];
  const enabledPolicies = alerts.filter((alert) => automationPolicies[alert.id] && workspaceAlerts.some(item => item.id === alert.id));
  const clientImpacts = getClientImpacts(enabledPolicies);
  const projectedImpact = getProjectedImpact(clientImpacts);
  const authorizedAlert = (id: number) => alerts.find((alert) => alert.id === id && (adminRole === 'client'
    ? alert.client === clientNames[selectedClientKey]
    : (workspaceClients[mspWorkspaceId] ?? []).some(key => clientNames[key] === alert.client)));
  const selectedAlert = authorizedAlert(selectedId) ?? decisionQueueTarget;
  const actionAlert = authorizedAlert(actionAlertId) ?? decisionQueueTarget;

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 3200);
  };
  const actionRequest = actionRequests.find(request => request.alertId === actionAlertId)
    ?? actionRequests.find(request => request.id === `req-alert-${actionAlertId}`);
  const actionScope = actionRequest ? {
    version: governance.find(config => config.clientKey === actionRequest.clientKey)?.version ?? actionRequest.policyVersion,
    clientKey: actionRequest.clientKey,
    allowedActions: governance.find(config => config.clientKey === actionRequest.clientKey)?.allowedActions ?? [],
    routineAutomation: governance.find(config => config.clientKey === actionRequest.clientKey)?.routineAutomation ?? false,
    routineLimit: governance.find(config => config.clientKey === actionRequest.clientKey)?.routineLimit ?? 0,
    approvalRoles: governance.find(config => config.clientKey === actionRequest.clientKey)?.approvalRoles ?? [],
    delegatedClientRole: governance.find(config => config.clientKey === actionRequest.clientKey)?.delegatedClientRole,
  } : undefined;
  const transitionRequest = (next: ActionRequest) => {
    const previous = actionRequests.find(request => request.id === next.id);
    if (previous === next) return;
    setActionRequests(current => current.map(request => request.id === next.id ? next : request));
    appendAudit(toAudit(next, next.status === 'completed' ? 'execution success' : next.status === 'denied' ? 'execution denial' : next.status === 'rejected' ? 'rejection' : next.status === 'approved' ? 'approval' : next.status === 'escalated' ? 'escalation' : 'request update'));
    if (next.status === 'completed' || next.status === 'rejected') {
      setAlerts(current => current.map(alert => alert.id === next.alertId ? { ...alert, status: next.status === 'completed' ? 'handled' : 'dismissed' } : alert));
    }
  };

  const openAction = (id: number) => {
    const alert = authorizedAlert(id);
    if (!alert) { notify('This Queue item is outside the current demo workspace or client scope.'); return; }
    if (!actionRequests.some(request => request.alertId === id)) {
      const clientKey = Object.entries(clientNames).find(([, name]) => name === alert.client)?.[0] ?? selectedClientKey;
      const created = requestAction({
        id: `req-alert-${id}`, alertId: id, workspaceId: mspWorkspaceId, clientKey, action: alert.decisionType === 'isolate_endpoint' ? 'isolate_endpoint' : alert.decisionType, impact: alert.severity === 'critical' ? 'high_impact' : 'routine_reversible', reversible: true, confidence: Number.parseFloat(alert.confidence), requesterRole: adminRole === 'client' ? 'client' : adminRole === 'technician' ? 'msp_technician' : 'msp_admin', requester: adminRole === 'client' ? clientIdentity.name : adminRole === 'technician' ? 'Casey Morgan' : 'Jordan Reyes', actionFingerprint: `alert-${id}`, contextVersion: governance.find(config => config.clientKey === clientKey)?.version ?? 1, policyId: `${clientKey}-automation`, policyVersion: governance.find(config => config.clientKey === clientKey)?.version ?? 1, status: 'pending', decision: 'requested', executionOutcome: 'not executed', internalNote: 'Created from Queue in the demo session.', clientSafeOutcome: 'Waiting for review.', approver: 'Pending' });
      setActionRequests(current => [...current, created]);
      appendAudit(toAudit(created, 'action request'));
    }
    setShowLaunchpad(false);
    setSelectedId(id);
    setActionAlertId(id);
    setView('action');
  };

  const returnToLaunchpad = () => {
    setOpenSidebarPicker(null);
    setClientAccessDenied(false);
    setView('overview');
    setShowLaunchpad(true);
  };

  const resetDemo = () => {
    window.sessionStorage.removeItem('sentriq:operational-demo-session:v1');
    setAlerts(initialAlerts);
    setActionRequests(initialActionRequests);
    setAuditEvents(initialActionRequests.map(request => toAudit(request, 'seeded request')));
    setSelectedId(1);
    setActionAlertId(1);
    setAutomationPolicies({});
    setFilter('all');
    setSearch('');
    setView('overview');
    setShowLaunchpad(true);
    setPresenterControls(false);
    setClientAccessDenied(false);
    setAdminRole('msp');
    setOpenSidebarPicker(null);
    setSelectedClientKey('redwood');
    setSelectedMspProspectKey(null);
    setMspWorkspaceId('cedarline');
    setGovernance([
      { clientKey: 'redwood', allowedActions: ['isolate_endpoint', 'quarantine_process'], routineAutomation: true, routineLimit: 10, approvalRoles: ['MSP administrator'], version: 2 },
      { clientKey: 'northstar', allowedActions: ['quarantine_process', 'isolate_endpoint'], routineAutomation: true, routineLimit: 8, approvalRoles: ['MSP administrator'], delegatedClientRole: 'Northstar security lead', version: 4 },
      { clientKey: 'aster', allowedActions: ['quarantine_process'], routineAutomation: true, routineLimit: 6, approvalRoles: ['MSP administrator'], version: 3 },
    ]);
    setOnboardingAudience('client');
    setPolicies(initialPolicies);
    resetMspData();
    notify('Demo state reset to the starting view');
  };

  const changeAdminRole = (role: AdminRole) => {
    const targetClientKey = role === 'client' && selectedMspProspect ? selectedMspProspect.key : selectedClientKey;
    setAdminRole(role);
    if (role === 'client') setMspWorkspaceId(mspWorkspaceId);
    if (role === 'client' && selectedMspProspect) setSelectedClientKey(selectedMspProspect.key);
    if (role === 'client' && !clientNames[targetClientKey]) setSelectedClientKey('redwood');
    if (role === 'client' && Boolean(selectedMspProspect ?? clientProspect)) {
      setView('journey');
    } else {
      setView('overview');
    }
    notify(role === 'msp' ? 'MSP administrator demo view loaded — portfolio context restored.' : role === 'technician' ? 'MSP technician demo view loaded — assigned client authority only.' : `Client workspace demo loaded — ${clientNames[targetClientKey]} context ready.`);
  };

  const launchFromLaunchpad = (target: LaunchpadTarget) => {
    setShowLaunchpad(false);
    setClientAccessDenied(false);
    if (target === 'client-workspace') {
      setPresenterControls(false);
      const prospectIdentity = prospects.find(prospect => prospect.key === selectedClientKey);
      const managedWorkspace = Object.entries(workspaceClients).find(([, keys]) => keys.includes(selectedClientKey))?.[0];
      const clientWorkspace = prospectIdentity?.workspaceId ?? managedWorkspace;
      if (!clientWorkspace || !clientNames[selectedClientKey]) {
        setClientAccessDenied(true);
        return;
      }
      setMspWorkspaceId(clientWorkspace);
      setAdminRole('client');
      setView(prospectIdentity ? 'journey' : 'overview');
      notify(`${clientNames[selectedClientKey]} workspace opened from its saved lifecycle state.`);
      return;
    }
    setPresenterControls(true);
    setAdminRole('msp');
    if (target === 'prospects') {
      const currentProspect = prospects.find(prospect => prospect.key === selectedClientKey && prospect.workspaceId === mspWorkspaceId);
      const persistedProspect = prospects.find(prospect => prospect.key === selectedMspProspectKey && prospect.workspaceId === mspWorkspaceId);
      const prospect = persistedProspect ?? currentProspect ?? prospects.find(item => item.workspaceId === mspWorkspaceId);
      setSelectedMspProspectKey(prospect?.key ?? null);
    }
    setView(target as View);
  };

  const navigateToView = (nextView: View) => {
    if (nextView === 'prospects' && adminRole === 'msp') {
      const currentProspect = prospects.find(prospect => prospect.key === selectedClientKey && prospect.workspaceId === mspWorkspaceId);
      const prospect = currentProspect ?? selectedMspProspect ?? prospects.find(item => item.workspaceId === mspWorkspaceId);
      setSelectedMspProspectKey(prospect?.key ?? null);
    }
    setView(nextView);
  };

  const selectAdminClient = (key: ClientKey) => {
    setSelectedClientKey(key);
    setAdminRole('client');
    const isP = prospects.some(p => p.key === key);
    setView(isP ? 'journey' : 'overview');

    // We already have clientNames up-to-date with prospects in the render scope
    const orgName = clientNames[key] || 'Organization';
    notify(`${orgName} client view loaded.`);
  };

  const shareBrief = async () => {
    const briefUrl = new URL(
      'sentriq_msp_design_partner_one_pager.html',
      window.location.href,
    ).toString();
    const shareData = {
      title: 'Sentriq MSP Design Partner Brief',
      text: 'A one-page overview of the Sentriq MSP design-partner pilot.',
      url: briefUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        notify('Partner brief shared');
        return;
      } catch {
        // A cancelled native share should not open a new tab or show an error.
        return;
      }
    }

    try {
      await navigator.clipboard?.writeText(briefUrl);
    } catch {
      // Clipboard access is optional in preview and private browsing contexts.
    }
    window.open(briefUrl, '_blank', 'noopener,noreferrer');
    notify('Partner brief opened — link copied when available');
  };

  useEffect(() => () => {
    modeTransitionTimers.current.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const changeHeadlessMode = (nextHeadless: boolean) => {
    if (nextHeadless === isHeadless || modeTransition !== 'idle') return;

    modeTransitionTimers.current.forEach((timer) => window.clearTimeout(timer));
    modeTransitionTimers.current = [];

    const reduceMotion = typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const exitDuration = reduceMotion ? 0 : 150;
    const enterDuration = reduceMotion ? 0 : 210;

    setIsHeadless(nextHeadless);
    setModeTransition('exiting');

    const swapTimer = window.setTimeout(() => {
      setRenderedMode(nextHeadless ? 'headless' : 'hosted');
      setModeTransition('entering');

      const settleTimer = window.setTimeout(() => {
        setModeTransition('idle');
        modeTransitionTimers.current = [];
      }, enterDuration);
      modeTransitionTimers.current.push(settleTimer);
    }, exitDuration);
    modeTransitionTimers.current.push(swapTimer);
  };

  if (showLaunchpad) {
    return <Launchpad onLaunch={launchFromLaunchpad} />;
  }

  if (clientAccessDenied) {
    return <main className="launchpad" data-testid="client-access-state">
      <div className="launchpad-content" style={{ maxWidth: 620 }}>
        <section className="launchpad-workspace-card" style={{ minHeight: 0 }}>
          <div className="launchpad-audience">Client access</div>
          <h1 style={{ margin: '10px 0' }}>We could not open a client workspace</h1>
          <p className="sq-muted">No authorized organization is associated with the current demo identity. Sentriq did not fall back to another client.</p>
          <button className="launchpad-action primary" onClick={returnToLaunchpad} data-testid="button-access-return"><span>Return to Launchpad</span><ChevronRight size={15} /></button>
        </section>
      </div>
    </main>;
  }

  return (
    <div className={`app-mode-shell${isHeadless ? ' headless-mode-active' : ''}`}>
      <header className={`topbar mode-topbar${view === 'onboarding' && !isHeadless ? ' onboarding-active' : ''}`}>
        <div className="mode-topbar-context">
          <div className={`mode-topbar-copy${isHeadless ? '' : ' active'}`} aria-hidden={isHeadless}>
            <span className="eyebrow">Pilot workspace</span>
            <span className="topbar-title">{workspaceName}</span>
            <span className="mode-topbar-separator">·</span>
            <span className="mode-topbar-date">Tuesday, 14 May 2024</span>
          </div>
          <div className={`mode-topbar-copy headless-copy${isHeadless ? ' active' : ''}`} aria-hidden={!isHeadless}>
            <span className="eyebrow">Headless Mode</span>
            <span className="topbar-title">Sentriq OCSF Stream</span>
          </div>
        </div>
        <div className="mode-topbar-actions">
          {!isHeadless && view === 'onboarding' && <div className="ob-tabs onboarding-topbar-tabs" role="tablist" aria-label="Onboarding audience view">
            <button className="ob-tab" role="tab" aria-selected={onboardingAudience === 'client'} onClick={() => setOnboardingAudience('client')} type="button" data-testid="tab-view-client">Client brief</button>
            <button className="ob-tab" role="tab" aria-selected={onboardingAudience === 'technician'} onClick={() => setOnboardingAudience('technician')} type="button" data-testid="tab-view-technician">Technician plan</button>
          </div>}
          <label className="headless-toggle-label" data-testid="label-show-headless">
            <input
              type="checkbox"
              className="sr-only"
              checked={isHeadless}
              disabled={modeTransition !== 'idle'}
              onChange={(event) => changeHeadlessMode(event.target.checked)}
              data-testid="toggle-headless"
            />
            <div className="headless-toggle-switch" />
            Show Headless
          </label>
          {!isHeadless && <>
            <div className="mode-topbar-divider" />
            <button className="button small share-button" onClick={shareBrief} data-testid="button-share-brief"><Share2 size={13} /><span>Share brief</span></button>
            <button className="button small reset-button" onClick={resetDemo} data-testid="button-reset-demo"><RefreshCcw size={13} /> Reset demo</button>
          </>}
        </div>
      </header>

      <div className={`mode-content-shell mode-content-${renderedMode}${modeTransition === 'idle' ? '' : ` is-${modeTransition}`}`} key={renderedMode}>
        {renderedMode === 'headless' ? <HeadlessSimulation /> : <div className="app-shell hosted-app-shell">
      <aside className="sidebar" data-testid="sidebar-navigation">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 10px' }}>
          <button className="brand-mark" onClick={returnToLaunchpad} type="button" aria-label="Back to Sentriq Launchpad" data-testid="button-brand-launchpad"><ShieldCheck size={17} /></button>
          <div>
            <div className="font-display" style={{ color: 'hsl(42 43% 99%)', fontWeight: 700, fontSize: 18, letterSpacing: '-.04em' }}>sentriq</div>
            <div className="font-mono" style={{ color: 'hsl(190 50% 64%)', fontSize: 8, letterSpacing: '.13em' }}>{!presenterControls && adminRole === 'client' ? 'CLIENT WORKSPACE' : 'MSP OPERATIONS'}</div>
          </div>
        </div>
        <div className="nav-label">Command center</div>
        <nav aria-label="Primary">
          {securityNavItems.map(({ id, label, icon: Icon }) => (
            <button className={`nav-item ${view === id ? 'active' : ''}`} onClick={() => navigateToView(id)} key={id} data-testid={`button-nav-${id}`}>
              <Icon size={16} /><span>{label}</span>
              {id === 'overview' && decisionQueue.length > 0 && <span style={{ marginLeft: 'auto', fontFamily: 'var(--app-font-mono)', fontSize: 10, color: view === id ? 'inherit' : 'hsl(37 70% 63%)' }}>{decisionQueue.length}</span>}
            </button>
          ))}
          {!isProspectContext && adminRole !== 'technician' && <button className={`nav-item ${view === 'policies' ? 'active' : ''}`} onClick={() => setView('policies')} data-testid="button-nav-policies"><FileText size={16} /><span>Policy center</span></button>}
        </nav>
        {adminRole === 'msp' && mspWorkspaceItems.length > 0 && (
          <>
            <div className="nav-label">MSP workspace</div>
            <nav aria-label="MSP workspace">
              {mspWorkspaceItems.map(({ id, label, icon: Icon }) => (
                <button className={`nav-item ${view === id ? 'active' : ''}`} onClick={() => navigateToView(id)} key={id} data-testid={`button-nav-${id}`}>
                  <Icon size={16} /><span>{label}</span>
                </button>
              ))}
            </nav>
          </>
        )}
        {mspWorkspaceId === 'cedarline' && adminRole === 'technician' && (
          <>
            <div className="nav-label sidebar-onboarding-label">Onboarding</div>
            <button className={`sidebar-onboarding-item ${view === 'onboarding' ? 'active' : ''}`} onClick={() => setView('onboarding')} type="button" data-testid="button-nav-onboarding">
              <span className="sidebar-onboarding-mark"><Building2 size={14} /></span>
              <span className="sidebar-onboarding-copy"><strong>Fenwick Logistics</strong><small>Day 0 · 64 employees</small></span>
              <span className="sidebar-onboarding-status">Active</span>
            </button>
          </>
        )}
        <div className="nav-label">Queue</div>
        <div className="sidebar-queue" aria-label="Consequential action queue" data-testid="sidebar-queue-list">
          {decisionQueue.length > 0 ? decisionQueue.map((alert) => (
            <button className={`sidebar-queue-item ${view === 'action' && actionAlertId === alert.id ? 'active' : ''}`} onClick={() => openAction(alert.id)} type="button" key={alert.id} data-testid={`button-queue-action-${alert.id}`}>
              <span className={`sidebar-queue-severity ${alert.severity}`} />
              <span className="sidebar-queue-copy">
                <strong>{alert.title}</strong>
                <small>{adminRole === 'msp' ? `${alert.client} · ` : ''}{alert.endpoint}</small>
              </span>
              <ChevronRight size={13} />
            </button>
          )) : <div className="sidebar-queue-empty"><CheckCircle2 size={14} /><span>Queue clear</span></div>}
        </div>
        <div className="sidebar-foot">
          {presenterControls ? <SidebarPicker
            value={adminRole}
            label="Presenter demo identities"
            options={securityPersonas}
            triggerTestId="button-sidebar-user"
            menuTestId="menu-security-personas"
            open={openSidebarPicker === 'user'}
            onOpenChange={(open) => setOpenSidebarPicker(open ? 'user' : null)}
            onSelect={(value) => changeAdminRole(value as AdminRole)}
            trigger={<><span className={`operator-dot ${adminRole === 'msp' ? 'supervisor' : ''}`}>{activePersonaInitials}</span><span className="sidebar-picker-copy"><strong>{activePersona.name}</strong><span>{activePersona.role}</span></span></>}
          /> : <div className="sidebar-picker-trigger" data-testid="client-identity-summary"><span className="operator-dot">{activePersonaInitials}</span><span className="sidebar-picker-copy"><strong>{activePersona.name}</strong><span>{activePersona.role}</span></span></div>}
          <div className="sidebar-org-picker">
            {presenterControls && adminRole !== 'client' && <SidebarPicker
              value={mspWorkspaceId}
              label="DEMO MSP workspaces"
              options={[
                { value: 'cedarline', label: 'Cedarline Security', description: `${workspaceClients.cedarline.length} authorized clients · demo workspace`, leading: <span className="organization-avatar">CS</span>, testId: 'button-workspace-cedarline' },
                { value: 'northbridge', label: 'Northbridge Cyber', description: '1 authorized client · demo workspace', leading: <span className="organization-avatar">NC</span>, testId: 'button-workspace-northbridge' },
              ]}
              triggerTestId="button-workspace-picker"
              menuTestId="menu-msp-workspaces"
              open={openSidebarPicker === 'workspace'}
              onOpenChange={(open) => setOpenSidebarPicker(open ? 'workspace' : null)}
              onSelect={(value) => {
                setMspWorkspaceId(value);
                const firstClient = (workspaceClients[value] ?? [])[0];
                if (firstClient) setSelectedClientKey(firstClient);
                const firstWorkspaceAlert = alerts.find(alert => (workspaceClients[value] ?? []).some(key => clientNames[key] === alert.client));
                setSelectedId(firstWorkspaceAlert?.id ?? -1);
                setActionAlertId(firstWorkspaceAlert?.id ?? -1);
                setView('overview');
                notify(`${value === 'cedarline' ? 'Cedarline Security' : 'Northbridge Cyber'} MSP demo workspace loaded; client context reset.`);
              }}
              trigger={<><span className="organization-avatar"><Network size={13} /></span><span className="sidebar-picker-copy"><strong>MSP workspace</strong><span>{mspWorkspaceId === 'cedarline' ? 'Cedarline Security' : 'Northbridge Cyber'}</span></span></>}
            />}
            {presenterControls ? <SidebarPicker
              value={isPortfolioScope ? '__portfolio__' : isMspProspectDetail ? selectedMspProspect?.key ?? '' : selectedClientKey}
              label="Presenter demo organizations"
              options={visibleOrganizations}
              triggerTestId="button-organization-picker"
              menuTestId="menu-organizations"
              open={openSidebarPicker === 'organization'}
              onOpenChange={(open) => setOpenSidebarPicker(open ? 'organization' : null)}
              onSelect={(value) => {
                const key = value as ClientKey;
                setSelectedClientKey(key);
                const prospect = prospects.find(p => p.key === key && p.workspaceId === mspWorkspaceId);
                const isP = Boolean(prospect);
                setSelectedMspProspectKey(prospect?.key ?? null);
                if (adminRole === 'client') {
                  setView(isP ? 'journey' : 'overview');
                }
                notify(`${clientNames[key]} selected.`);
              }}
              trigger={<><span className="organization-avatar"><Network size={13} /></span><span className="sidebar-picker-copy"><strong>{isPortfolioScope ? 'Scope' : 'Organization'}</strong><span>{organizationScopeName}</span></span></>}
            /> : <div className="sidebar-picker-trigger" data-testid="client-organization-summary"><span className="organization-avatar"><Network size={13} /></span><span className="sidebar-picker-copy"><strong>Organization</strong><span>{organizationScopeName}</span></span></div>}
          </div>
        </div>
      </aside>

        <nav className="mobile-nav" aria-label="Mobile navigation">
        {visibleNavItems.map(({ id, label, icon: Icon }) => (
          <button className={`nav-item ${view === id ? 'active' : ''}`} onClick={() => navigateToView(id)} key={id} data-testid={`button-mobile-nav-${id}`}>
            <Icon size={16} /><span className="nav-label-mobile">{label.replace(' & ', ' / ')}</span>
          </button>
        ))}
        {!isProspectContext && adminRole !== 'technician' && <button className={`nav-item ${view === 'policies' ? 'active' : ''}`} onClick={() => setView('policies')} data-testid="button-mobile-nav-policies"><FileText size={16} /><span className="nav-label-mobile">Policy center</span></button>}
        {mspWorkspaceId === 'cedarline' && adminRole === 'technician' && <button className={`nav-item ${view === 'onboarding' ? 'active' : ''}`} onClick={() => setView('onboarding')} data-testid="button-mobile-nav-onboarding"><Building2 size={16} /><span className="nav-label-mobile">Fenwick day-0</span></button>}
        <button className="nav-item" onClick={resetDemo} data-testid="button-mobile-reset"><RefreshCcw size={16} /><span className="nav-label-mobile">Reset</span></button>
      </nav>

      <main className="main-wrap hosted-main-wrap">
        {toast && <div style={{ position: 'fixed', zIndex: 30, right: 22, bottom: 22, display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderRadius: 9, background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', boxShadow: 'var(--shadow-md)', fontSize: 12, animation: 'rise .28s ease both' }} role="status" data-testid="status-toast"><CheckCircle2 size={15} color="hsl(190 72% 55%)" />{toast}</div>}

        <div className="content">
          {view === 'overview' && !isProspectContext && <AdminCockpit role={adminRole === 'technician' ? 'msp' : adminRole} selectedClientKey={selectedClientKey} alerts={workspaceAlerts} allowedClientKeys={workspaceClients[mspWorkspaceId] ?? []} onSelectClient={selectAdminClient} onOpenAction={openAction} onNotice={notify} />}
          {view === 'overview' && isProspectContext && adminRole !== 'client' && <AdminCockpit role="msp" selectedClientKey={selectedClientKey} alerts={workspaceAlerts} allowedClientKeys={workspaceClients[mspWorkspaceId] ?? []} onSelectClient={selectAdminClient} onOpenAction={openAction} onNotice={notify} />}
          {view === 'action' && actionAlert && actionRequest && actionScope && <DecisionAction alert={actionAlert} request={actionRequest} scope={actionScope} routineCount={actionRequests.filter(item => item.workspaceId === actionRequest.workspaceId && item.clientKey === actionRequest.clientKey && item.impact === 'routine_reversible' && item.status === 'completed').length} actorRole={adminRole} reviewerName={adminRole === 'client' ? clientIdentity.name : adminRole === 'technician' ? 'Casey Morgan' : 'Jordan Reyes'} reviewerRole={adminRole === 'client' ? clientIdentity.role : adminRole === 'technician' ? 'MSP technician/security analyst' : 'MSP administrator'} transitionRequest={transitionRequest} setView={setView} notify={notify} />}
          {view === 'clients' && <ClientsView setView={setView} onOpenClient={selectAdminClient} allowedClientKeys={workspaceClients[mspWorkspaceId] ?? []} activatedProspects={prospects.filter(prospect => prospect.workspaceId === mspWorkspaceId && prospect.activated)} />}
          {view === 'capacity' && <CapacityView setView={setView} alerts={workspaceAlerts} enabledPolicies={enabledPolicies} clientImpacts={clientImpacts} projectedImpact={projectedImpact} allowedClientKeys={workspaceClients[mspWorkspaceId] ?? []} />}
          {view === 'policies' && !isProspectContext && adminRole !== 'technician' && <PolicyCenter role={adminRole} workspaceId={mspWorkspaceId} selectedClientKey={selectedClientKey} clientName={clientNames[selectedClientKey]} policies={policies} onPoliciesChange={setPolicies} notify={notify} />}
          {view === 'onboarding' && <OnboardingScreen audience={onboardingAudience} />}
          {view === 'governance' && adminRole === 'msp' && <GovernanceWorkspace configs={governance.filter(config => (workspaceClients[mspWorkspaceId] ?? []).includes(config.clientKey))} setConfigs={(next) => setGovernance(current => current.map(config => next.find(item => item.clientKey === config.clientKey) ?? config))} notify={notify} />}
          {view === 'activation' && adminRole === 'msp' && <ActivationWorkspace key={selectedProspect?.id ?? 'none'} prospect={selectedProspect} prospects={prospects} setProspects={setProspects} notify={notify} onAudit={appendAudit} />}
          {view === 'audit' && adminRole === 'msp' && <AuditWorkspace events={auditEvents.filter(event => event.workspaceId === mspWorkspaceId)} />}
          {view === 'audit' && adminRole === 'client' && <AuditWorkspace clientOnly clientKey={selectedClientKey} events={auditEvents.filter(event => event.workspaceId === mspWorkspaceId)} />}

          {/* New workspaces */}
          {view === 'prospects' && adminRole === 'msp' && <ProspectsWorkspace prospects={prospects.filter(prospect => prospect.workspaceId === mspWorkspaceId)} selectedProspectKey={selectedMspProspect?.key ?? null} onSelectProspect={(prospect) => {
            setSelectedMspProspectKey(prospect?.key ?? null);
          }} setProspects={(next) => setProspects(current => {
            const outsideWorkspace = current.filter(item => item.workspaceId !== mspWorkspaceId);
            const outsideKeys = new Set(outsideWorkspace.map(item => item.key));
            const scopedNext = next.map(item => outsideKeys.has(item.key) ? { ...item, key: `${mspWorkspaceId}-${item.key}` } : item);
            return [...outsideWorkspace, ...scopedNext];
          })} packages={workspacePackages} vendors={workspaceVendors} notify={notify} activeWorkspaceId={mspWorkspaceId} onAudit={appendAudit} />}
          {view === 'packages' && adminRole === 'msp' && <PackagesWorkspace packages={packages} setPackages={setPackages} vendors={vendors} notify={notify} activeWorkspaceId={mspWorkspaceId} />}
          {view === 'vendors' && adminRole === 'msp' && <VendorsWorkspace vendors={vendors} setVendors={setVendors} notify={notify} activeWorkspaceId={mspWorkspaceId} />}
          {view === 'intake' && adminRole === 'client' && selectedProspect && <ClientIntakeWorkspace key={selectedProspect.id} prospect={selectedProspect} setProspects={setProspects} prospects={prospects} notify={notify} />}
          {view === 'proposal' && adminRole === 'client' && selectedProspect && <ProposalWorkspace key={selectedProspect.id} prospect={selectedProspect} prospects={prospects} setProspects={setProspects} packages={packages} notify={notify} onAudit={appendAudit} />}
          {view === 'journey' && adminRole === 'client' && selectedProspect && <ClientJourneyWorkspace key={selectedProspect.id} prospect={selectedProspect} prospects={prospects} setProspects={setProspects} packages={workspacePackages} notify={notify} onAudit={appendAudit} navigateOverview={() => setView('journey')} presenterControls={presenterControls} onPresenterSwitchToMsp={() => { setAdminRole('msp'); setView('prospects'); notify(`Presenter control: ${selectedProspect.name} retained; MSP progress view opened.`); }} />}
        </div>
      </main>
        </div>}
      </div>
    </div>
  );
}

function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="view-head animate-rise"><div><div className="eyebrow">{eyebrow}</div><h1 data-testid="text-page-title">{title}</h1><p>{description}</p></div>{action}</div>;
}

function Overview({ alerts, filteredAlerts, selectedAlert, selectedId, setSelectedId, filter, setFilter, search, setSearch, updateAlert, pendingCount, handledCount, setView, openAction, notify }: {
  alerts: Alert[]; filteredAlerts: Alert[]; selectedAlert: Alert; selectedId: number; setSelectedId: (id: number) => void; filter: 'all' | 'pending' | 'handled'; setFilter: (filter: 'all' | 'pending' | 'handled') => void; search: string; setSearch: (search: string) => void; updateAlert: (id: number, status: AlertStatus) => void; pendingCount: number; handledCount: number; setView: (view: View) => void; openAction: (id: number) => void; notify: (message: string) => void;
}) {
  return <div>
    <PageHeader eyebrow="Tuesday / 10:50 UTC" title="Good morning, Jordan." description="The fleet is quiet. Two consequential actions need your call." action={<span className="live-chip"><span className="pulse" />Fleet telemetry live</span>} />
    <div className="metric-grid">
      <div className="metric-card primary-metric animate-rise"><div className="eyebrow">Fleet posture</div><div className="metric-value">97.8%</div><div className="metric-note">healthy endpoints · 4 clients</div></div>
      <div className="metric-card animate-rise delay-1"><div className="eyebrow">Needs review</div><div className="metric-value" data-testid="text-pending-count">{pendingCount}</div><div className="metric-note">high-impact actions waiting</div></div>
      <div className="metric-card animate-rise delay-2"><div className="eyebrow">AI handled</div><div className="metric-value" data-testid="text-handled-count">{handledCount + 140}</div><div className="metric-note">demo events · last 7 days</div></div>
      <div className="metric-card animate-rise delay-3"><div className="eyebrow">Analyst load</div><div className="metric-value">−63%</div><div className="metric-note">pilot target · triage time</div></div>
    </div>
    <div className="split-grid">
      <section className="panel animate-rise delay-1" data-testid="panel-alert-queue">
        <div className="panel-head"><div><div className="panel-title">Decision queue</div><div className="panel-subtitle">AI has contained the routine. You approve the consequential.</div></div><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ position: 'relative' }}><Search size={14} color="hsl(var(--muted-foreground))" style={{ position: 'absolute', left: 9, top: 8 }} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search queue" aria-label="Search alert queue" data-testid="input-search-alerts" style={{ width: 128, border: '1px solid hsl(var(--border))', borderRadius: 7, padding: '7px 8px 7px 28px', fontSize: 11, color: 'hsl(var(--foreground))', background: 'hsl(var(--background))', outline: 'none' }} /></div></div></div>
        <div className="filter-row">{(['all', 'pending', 'handled'] as const).map((item) => <button className={`filter ${filter === item ? 'selected' : ''}`} key={item} onClick={() => setFilter(item)} data-testid={`button-filter-${item}`}>{item === 'all' ? `All activity (${alerts.length})` : item === 'pending' ? `Needs review (${pendingCount})` : `Handled by AI (${handledCount})`}</button>)}</div>
         {filteredAlerts.length > 0 ? <div className="alert-list">{filteredAlerts.map((alert) => <AlertRow alert={alert} selected={selectedId === alert.id} onSelect={() => setSelectedId(alert.id)} onOpen={() => openAction(alert.id)} key={alert.id} />)}</div> : <div className="empty-state"><Search size={19} /><strong>No matching activity</strong><p>Try a different client, endpoint, or queue filter.</p><button className="button small" onClick={() => { setSearch(''); setFilter('all'); }} style={{ marginTop: 15 }} data-testid="button-clear-alert-filter">Clear filters</button></div>}
      </section>
       <AlertDetail alert={selectedAlert} openAction={() => openAction(selectedAlert.id)} notify={notify} />
    </div>
    <div className="lower-grid">
      <FleetSnapshot setView={setView} notify={notify} />
      <CapacitySummary setView={setView} />
    </div>
  </div>;
}

function AlertRow({ alert, selected, onSelect, onOpen }: { alert: Alert; selected: boolean; onSelect: () => void; onOpen: () => void }) {
  const label = alert.status === 'approved' ? 'Approved' : alert.status === 'handled' ? 'AI handled' : alert.status === 'dismissed' ? 'Dismissed' : 'Needs review';
  return <div className={`alert-row ${selected ? 'selected' : ''}`}>
    <span className={`severity-bar severity-${alert.severity}`} />
    <button className="alert-row-select" onClick={onSelect} data-testid={`button-alert-${alert.id}`}>
      <span style={{ minWidth: 0 }}><span className="alert-name" data-testid={`text-alert-title-${alert.id}`}>{alert.title}</span><span className="alert-meta"><span>{alert.client}</span><span>{alert.endpoint}</span><span>{alert.age}</span></span></span>
      <span className={`status-badge ${alert.status === 'pending' ? 'pending' : alert.status === 'dismissed' ? 'dismissed' : 'handled'}`}><span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />{label}</span>
    </button>
    <button className="queue-open-action" onClick={onOpen} aria-label={`Open action for ${alert.title}`} data-testid={`button-open-action-${alert.id}`}><ArrowRight size={13} /></button>
  </div>;
}

function AlertDetail({ alert, openAction, notify }: { alert: Alert; openAction: () => void; notify: (message: string) => void }) {
  return <section className="panel detail-panel animate-rise delay-2" data-testid="panel-alert-detail">
    <div className="panel-head"><div><div className="panel-title">Evidence & rationale</div><div className="panel-subtitle">A quick summary before you open the action.</div></div><span className={`status-badge ${alert.status === 'pending' ? 'pending' : 'handled'}`}>{alert.status === 'pending' ? 'Awaiting decision' : 'Decision recorded'}</span></div>
    <div className="detail-body">
      <div className="detail-kicker">{alert.severity} severity · {alert.client}</div>
      <div className="detail-title" data-testid="text-selected-alert-title">{alert.title}</div>
      <p className="detail-description">{alert.description}</p>
      <div className="detail-summary"><div><span className="eyebrow">Recommended response</span><strong>{alert.action}</strong></div><div><span className="eyebrow">Model confidence</span><strong>{alert.confidence}</strong></div></div>
      <div className="rationale"><strong><Sparkles size={13} style={{ verticalAlign: 'middle', marginRight: 5, color: 'hsl(var(--accent))' }} />Sentriq recommendation</strong><p>{alert.rationale}</p></div>
      <button className="button teal" onClick={openAction} style={{ marginTop: 17, width: '100%' }} data-testid="button-go-to-action"><ArrowRight size={14} />Go to Action</button>
      <button className="button small" onClick={() => notify('Evidence export prepared for the pilot report')} style={{ marginTop: 9, width: '100%' }} data-testid="button-export-evidence"><FileText size={13} />Export evidence summary</button>
    </div>
  </section>;
}

function DecisionAction({ alert, request, scope, routineCount, actorRole, reviewerName, reviewerRole, transitionRequest, setView, notify }: {
  alert: Alert;
  request: ActionRequest;
  scope: GovernanceConfig;
  routineCount: number;
  actorRole: AdminRole;
  reviewerName: string;
  reviewerRole: string;
  transitionRequest: (request: ActionRequest) => void;
  setView: (view: View | 'action') => void;
  notify: (message: string) => void;
}) {
  const score = Number.parseFloat(alert.confidence);
  const band = confidenceBand(score);
  const profile = confidenceProfiles[alert.id] ?? { similarActions: 20, positiveOutcomes: 16 };
  const canAutomate = score >= AUTOMATION_THRESHOLD;
  const [draftNote, setDraftNote] = useState('');

  useEffect(() => {
    trackEvent('decision_action_opened', {
      confidence_band: band,
      threshold_eligible: canAutomate,
      severity: alert.severity,
      decision_type: alert.decisionType,
    });
  }, [alert.id, alert.decisionType, alert.severity, band, canAutomate]);

  const review = (decision: 'approve' | 'reject' | 'escalate') => {
    if (!draftNote.trim() && decision !== 'approve') return notify('Add a reason for this request decision.');
    transitionRequest(reviewAction(request, decision, reviewerName, reviewerRole, scope));
  };
  const execute = () => {
    const result = executeAction(request, scope, routineCount);
    transitionRequest(result);
    notify(result.status === 'completed' ? 'Simulated execution completed after current-policy recheck.' : `Execution blocked: ${result.executionOutcome}`);
  };

  return <div className="action-view">
    <PageHeader
      eyebrow={`Decision action / ${alert.client} / ${alert.endpoint}`}
      title={alert.title}
      description="Make the call once, then teach Sentriq which decisions it can safely handle for you."
      action={<button className="button" onClick={() => setView('overview')} data-testid="button-action-back"><ArrowLeft size={14} />Back to overview</button>}
    />

    <div className="action-grid">
      <div className="action-main">
        <section className="panel action-hero" data-testid="panel-decision-action">
          <div className="action-hero-top">
            <div>
              <div className="detail-kicker">{alert.severity} severity · recommended response</div>
              <h2>{alert.action}</h2>
              <p>{alert.description}</p>
            </div>
            <span className={`status-badge ${alert.status === 'pending' ? 'pending' : 'handled'}`}>{alert.status === 'pending' ? 'Awaiting decision' : 'Decision recorded'}</span>
          </div>
          <div className="action-context">
            <div><span className="eyebrow">Client</span><strong>{alert.client}</strong><span>{alert.endpoint}</span></div>
            <div><span className="eyebrow">Observed</span><strong>{alert.age}</strong><span>decision queue</span></div>
            <div><span className="eyebrow">Model read</span><strong>{confidenceLabel(band)}</strong><span>{alert.confidence} match confidence</span></div>
          </div>
        </section>

        <section className="panel" data-testid="panel-confidence">
          <div className="panel-head">
            <div><div className="panel-title">Machine-learned confidence</div><div className="panel-subtitle">How strongly Sentriq recommends this remediation based on prior outcomes.</div></div>
            <span className={`confidence-pill ${band}`}>{confidenceLabel(band)}</span>
          </div>
          <div className="confidence-body">
            <div className="confidence-score-row"><div><span className="eyebrow">Current decision score</span><strong>{alert.confidence}</strong></div><span className="confidence-threshold-copy">Automation threshold <b>{AUTOMATION_THRESHOLD}%</b></span></div>
            <div className="confidence-meter-wrap">
              <div className="confidence-meter" aria-label={`${alert.confidence} confidence`} role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={score}>
                <i style={{ width: `${100 - score}%` }} />
              </div>
              <div className="confidence-threshold" style={{ left: `${AUTOMATION_THRESHOLD}%` }}><span>review cue only · non-authorizing</span></div>
            </div>
            <div className="confidence-scale"><span>Low</span><span>Medium</span><span>High</span></div>
            <div className="confidence-explainer"><Info size={15} /><p><strong>Why this score?</strong> Based on {profile.similarActions} previous similar actions, {profile.positiveOutcomes} produced a positive outcome without analyst rollback.</p></div>
            <div className="confidence-examples">
              <div className="eyebrow">See the decision pattern</div>
              <div className="confidence-example-grid">{confidenceExamples.map((example) => {
                const exampleBand = confidenceBand(example.score);
                const eligible = example.score >= AUTOMATION_THRESHOLD;
                return <div className={`confidence-example ${exampleBand}`} key={example.label} data-testid={`confidence-example-${exampleBand}`}>
                  <div className="confidence-example-head"><strong>{example.label}</strong><span>{example.score}%</span></div>
                  <div className="confidence-mini-meter"><i style={{ width: `${100 - example.score}%` }} /></div>
                  <p>{example.detail}</p>
                  <span className={`example-outcome ${eligible ? 'eligible' : 'human'}`}>{eligible ? 'Higher confidence cue' : 'Human review cue'}</span>
                </div>;
              })}</div>
            </div>
          </div>
        </section>

        <section className="panel evidence-panel" data-testid="panel-action-evidence">
          <div className="panel-head"><div><div className="panel-title">Evidence & rationale</div><div className="panel-subtitle">The record behind this recommendation stays visible before you act.</div></div></div>
          <div className="detail-body">
            <div className="evidence-box"><div className="evidence-label"><span>Observed evidence</span><span className="font-mono">{alert.confidence} confidence</span></div><div className="evidence-code">{alert.evidence.map((item) => <div key={item.key}><span style={{ color: 'hsl(215 17% 57%)' }}>{item.key.padEnd(12, ' ')}</span><span className={item.tone}>{item.value}</span></div>)}</div></div>
            <div className="rationale"><strong><Sparkles size={13} style={{ verticalAlign: 'middle', marginRight: 5, color: 'hsl(var(--accent))' }} />Sentriq recommendation</strong><p>{alert.rationale}</p></div>
          </div>
        </section>
      </div>

      <aside className="action-side">
        <section className="panel action-control-panel" data-testid="panel-action-controls">
          <div className="panel-head"><div><div className="panel-title">Queue request</div><div className="panel-subtitle">Every control rechecks current authority. Automation preference never approves high-impact work.</div></div></div>
          <div className="action-control-body">
            <div className="proposed-action"><span className="eyebrow">Status / policy</span><strong data-testid="text-request-status">{request.status}</strong><span>Policy {request.policyId} v{scope.version} · {request.impact} · {request.confidence}% confidence · routine count {routineCount}/{scope.routineLimit}</span></div>
            <div className="decision-reasoning"><label className="reasoning-label" htmlFor="decision-reasoning">Reviewer note</label><textarea id="decision-reasoning" value={draftNote} onChange={event => setDraftNote(event.target.value)} placeholder="Reason for this request decision" data-testid="textarea-decision-reasoning" /></div>
            {['completed', 'rejected', 'denied', 'failed'].includes(request.status) ? <div className="handled-state">Terminal state: {request.status}. Start a new Queue request for another attempt; this record cannot be reopened.</div> : <div className="detail-actions">
              <button className="button teal" onClick={() => review('approve')} data-testid="button-request-approve"><Check size={14} />Approve</button>
              <button className="button danger" onClick={() => review('reject')} data-testid="button-request-reject"><X size={14} />Reject</button>
              <button className="button" onClick={() => review('escalate')} data-testid="button-request-escalate"><ShieldCheck size={14} />Escalate</button>
              {request.status === 'approved' && <button className="button teal" onClick={execute} data-testid="button-request-execute"><CheckCircle2 size={14} />Execute / recheck</button>}
            </div>}
            <div className="action-note"><ShieldCheck size={13} color="hsl(var(--accent))" />{request.clientSafeOutcome}</div>
          </div>
        </section>
      </aside>
    </div>
  </div>;
}

function FleetSnapshot({ setView, notify }: { setView: (view: View) => void; notify: (message: string) => void }) {
  const clients = [{ name: 'Redwood Legal', initials: 'RL', endpoints: 86, health: 99, tone: '' }, { name: 'Northstar Dental', initials: 'ND', endpoints: 42, health: 98, tone: 'alt' }, { name: 'Pine & Co. Mfg.', initials: 'PC', endpoints: 31, health: 94, tone: 'gold' }];
  return <section className="panel" data-testid="panel-fleet-snapshot"><div className="panel-head"><div><div className="panel-title">Fleet snapshot</div><div className="panel-subtitle">3 of 4 active clients</div></div><button className="icon-button" onClick={() => setView('clients')} aria-label="View all clients" data-testid="button-view-clients"><ArrowUpRight size={16} /></button></div><div className="table-wrap"><table className="fleet-table"><thead><tr><th>Client</th><th>Endpoints</th><th>Health</th><th>Open</th></tr></thead><tbody>{clients.map((client, index) => <tr key={client.name}><td><div className="client-name"><span className={`client-avatar ${client.tone}`}>{client.initials}</span>{client.name}</div></td><td className="font-mono">{client.endpoints}</td><td><div className="health" title={`${client.health}% healthy`}>{Array.from({ length: 8 }).map((_, i) => <i className={i > Math.floor(client.health / 13) ? 'dim' : client.health < 96 && i === 7 ? 'warn' : ''} key={i} />)}</div></td><td className="font-mono" style={{ color: client.health < 96 ? 'hsl(33 72% 37%)' : 'hsl(var(--muted-foreground))' }}>{client.health < 96 ? 1 : 0}</td></tr>)}</tbody></table></div><div className="target-note"><strong>Demo data.</strong> Health and volume figures illustrate the pilot workspace, not measured product results.</div></section>;
}

function CapacitySummary({ setView }: { setView: (view: View) => void }) {
  return <section className="panel" data-testid="panel-capacity-summary"><div className="panel-head"><div><div className="panel-title">Analyst capacity</div><div className="panel-subtitle">Where the hours moved this week</div></div><button className="icon-button" onClick={() => setView('capacity')} aria-label="View impact and capacity" data-testid="button-view-capacity"><ArrowUpRight size={16} /></button></div><div className="capacity-card"><div className="eyebrow">Pilot target</div><div className="capacity-line"><strong>18.6 hrs</strong><span>returned to the team</span></div><div className="meter"><i style={{ width: '63%' }} /></div><div className="capacity-foot"><span>triage & enrichment</span><span>63% target</span></div><div className="activity-item" style={{ marginTop: 15, paddingBottom: 0, borderBottom: 0 }}><div className="activity-icon"><Bot size={13} /></div><div className="activity-copy"><strong>142 routine events handled</strong><span>AI action log · last 7 days</span></div></div></div></section>;
}

function ClientsView({ setView, onOpenClient, allowedClientKeys, activatedProspects }: { setView: (view: View) => void; onOpenClient: (key: ClientKey) => void; allowedClientKeys: string[]; activatedProspects: Prospect[] }) {
  const clients = [
    { key: 'redwood', name: 'Redwood Legal', initials: 'RL', segment: 'Legal services', endpointCount: 86, health: '99.1%', open: '1 open action', tone: '' },
    { key: 'northstar', name: 'Northstar Dental', initials: 'ND', segment: 'Healthcare', endpointCount: 42, health: '98.4%', open: '0 open actions', tone: 'alt' },
    { key: 'pine', name: 'Pine & Co. Manufacturing', initials: 'PC', segment: 'Industrial', endpointCount: 31, health: '94.2%', open: '1 open action', tone: 'gold' },
    { key: 'aster', name: 'Aster House Studio', initials: 'AH', segment: 'Professional services', endpointCount: 28, health: '100%', open: '0 open actions', tone: '' },
    ...activatedProspects.map(prospect => ({ key: prospect.key, name: prospect.name, initials: prospect.name.split(/\s+/).map(word => word[0]).slice(0, 2).join(''), segment: 'Newly activated · simulated monitoring', endpointCount: prospect.manualAssets.reduce((total, asset) => total + asset.count, 0), health: '98.0%', open: '0 open actions', tone: 'alt' })),
  ].filter(client => allowedClientKeys.includes(client.key));
  const endpoints = clients.reduce((total, client) => total + client.endpointCount, 0);
  const alignment = clients.some(client => client.key === 'pine') ? '96.4%' : '100%';
  return <div className="clients-view"><PageHeader eyebrow={`Fleet / ${clients.length} ${clients.length === 1 ? 'client' : 'clients'} / ${endpoints} endpoints`} title="Clients & fleet" description="A client-level view of posture, coverage, and the few things that need a human." action={<button className="button" onClick={() => setView('overview')} data-testid="button-back-overview"><Activity size={14} />Back to overview</button>} /><div className="client-cards">{clients.map((client, index) => <div className={`client-card animate-rise delay-${Math.min(index + 1, 3)}`} key={client.name} data-testid={`card-client-${client.key}`}><div className="client-card-top"><span className={`client-avatar ${client.tone}`} style={{ width: 32, height: 32 }}>{client.initials}</span><span className={client.health === '94.2%' ? 'status-badge pending' : 'status-badge handled'}>{client.health} healthy</span></div><h3>{client.name}</h3><p>{client.segment}</p><div className="client-stat"><span>{client.endpointCount} endpoints</span><strong>{client.open}</strong></div><button className="button small" onClick={() => onOpenClient(client.key)} style={{ width: '100%', marginTop: 13 }} data-testid={`button-open-client-${client.key}`}><Server size={13} />Open fleet</button></div>)}</div><section className="panel"><div className="panel-head"><div><div className="panel-title">Coverage across the fleet</div><div className="panel-subtitle">Policy coverage is simulated for this design-partner walkthrough.</div></div><span className="status-badge handled">All sensors reporting</span></div><div className="capacity-card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}><div><div className="eyebrow">Endpoint coverage</div><div className="capacity-line"><strong>{endpoints} / {endpoints}</strong><span>online</span></div><div className="meter"><i style={{ width: '100%' }} /></div></div><div><div className="eyebrow">Policy alignment</div><div className="capacity-line"><strong>{alignment}</strong><span>in policy</span></div><div className="meter"><i className="gold" style={{ width: alignment }} /></div></div></div><div className="target-note"><strong>How to read this:</strong> open actions are intentionally limited to decisions with a material effect on a client endpoint or identity.</div></section></div>;
}

function CapacityView({ setView, alerts, enabledPolicies, clientImpacts, projectedImpact, allowedClientKeys }: { setView: (view: View) => void; alerts: Alert[]; enabledPolicies: Alert[]; clientImpacts: ClientImpact[]; projectedImpact: PolicyImpact; allowedClientKeys: string[] }) {
  const maxClientHours = Math.max(...clientImpacts.map((clientImpact) => clientImpact.estimatedHoursReturned), 1);
  const endpointCounts: Record<string, number> = { redwood: 86, northstar: 42, pine: 31, aster: 28 };
  const endpoints = allowedClientKeys.reduce((total, key) => total + (endpointCounts[key] ?? 0), 0);
  const handled = alerts.filter(alert => alert.status === 'handled' || alert.status === 'approved').length;
  const pending = alerts.filter(alert => alert.status === 'pending').length;

  return <div className="capacity-view"><PageHeader eyebrow="Pilot economics / attention allocation" title="Impact & capacity" description="Make the capacity story visible: routine work handled quietly, attention reserved for consequential moments." action={<button className="button" onClick={() => setView('overview')} data-testid="button-capacity-overview"><Activity size={14} />Back to overview</button>} /><div className="capacity-kpis"><div className="capacity-kpi"><div className="eyebrow">Pilot target</div><div className="metric-value">3.2×</div><p>more endpoints supported per analyst when routine investigation and containment are delegated to Sentriq.</p></div><div className="capacity-kpi"><div className="eyebrow">Demo activity</div><div className="metric-value">{handled}</div><p>routine events represented in this workspace-scoped demo.</p></div><div className="capacity-kpi"><div className="eyebrow">Human decisions</div><div className="metric-value">{pending}</div><p>actions currently waiting for approval in this workspace.</p></div></div><section className="panel learned-impact-panel" data-testid="panel-learned-policy-impact"><div className="panel-head"><div><div className="panel-title">Learned policy impact</div><div className="panel-subtitle">The capacity unlocked by decisions you taught Sentriq in this session.</div></div><span className="status-badge handled"><Bot size={12} />{enabledPolicies.length} {enabledPolicies.length === 1 ? 'policy' : 'policies'} on</span></div><div className="capacity-card"><div className="demo-estimate"><Sparkles size={14} /><div><strong>Demo estimate · not measured customer results</strong><span>Projected from the decision types enabled during this walkthrough; reset the demo to start over.</span></div></div><div className="impact-kpis"><div className="impact-kpi"><span className="eyebrow">Projected reviews avoided</span><strong data-testid="text-projected-reviews-avoided">{projectedImpact.projectedReviewsAvoided}</strong><span>next 30 days</span></div><div className="impact-kpi"><span className="eyebrow">Estimated analyst time returned</span><strong data-testid="text-estimated-hours-returned">{projectedImpact.estimatedHoursReturned.toFixed(1)} hrs</strong><span>next 30 days</span></div></div><div className="client-impact-section" data-testid="panel-client-capacity"><div className="client-impact-heading"><div><div className="eyebrow">Capacity returned by client</div><p>See which accounts gain the most analyst capacity from policies enabled in this session.</p></div><span className="font-mono">sorted by hours</span></div>{clientImpacts.length > 0 ? <div className="client-impact-list">{clientImpacts.map((clientImpact) => <div className="client-impact-row" key={clientImpact.client} data-testid={`client-impact-${clientImpact.client.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}><div className="client-impact-row-head"><div><strong>{clientImpact.client}</strong><span>{clientImpact.policyCount} {clientImpact.policyCount === 1 ? 'policy' : 'policies'} enabled</span></div><span className="client-impact-bar-label">{clientImpact.estimatedHoursReturned.toFixed(1)} hrs returned</span></div><div className="meter"><i style={{ width: `${(clientImpact.estimatedHoursReturned / maxClientHours) * 100}%` }} /></div><div className="client-impact-metrics"><span><strong>{clientImpact.projectedReviewsAvoided}</strong> reviews avoided</span><span><strong>{clientImpact.estimatedHoursReturned.toFixed(1)}</strong> analyst hrs returned</span></div></div>)}</div> : <div className="policy-empty" data-testid="text-no-client-impact">No client impact yet. Enable a learned policy to see which accounts gain analyst capacity.</div>}</div><div className="enabled-policy-list"><div className="eyebrow">Policies enabled this session</div>{enabledPolicies.length > 0 ? enabledPolicies.map((alert) => <div className="enabled-policy" key={alert.id}><div><strong>{alert.title}</strong><span>{alert.client}</span></div><span className="font-mono">+{policyImpactProfiles[alert.id]?.projectedReviewsAvoided ?? 0} reviews avoided</span></div>) : <div className="policy-empty" data-testid="text-no-enabled-policies">No learned policies yet. Turn on automation from a high-confidence decision to see the projected capacity gain.</div>}</div></div></section><div className="lower-grid" style={{ marginTop: 14 }}><section className="panel"><div className="panel-head"><div><div className="panel-title">Attention allocation</div><div className="panel-subtitle">A useful operating model for the design-partner pilot.</div></div></div><div className="capacity-card"><CapacityRow label="Routine triage & enrichment" value="63%" width="63%" detail={`${handled} events represented in this workspace`} /><CapacityRow label="Investigation context" value="24%" width="24%" detail="Evidence assembled before review" /><CapacityRow label="Consequential decisions" value="13%" width="13%" detail={`${pending} actions waiting for a human`} gold /></div><div className="target-note"><strong>Pilot target, not a result.</strong> This view is a narrative aid for discussing where analyst time could move as policy confidence grows.</div></section><section className="panel"><div className="panel-head"><div><div className="panel-title">Activity ledger</div><div className="panel-subtitle">Today in the pilot workspace</div></div></div><div className="activity-list"><ActivityItem icon={<Bot size={13} />} title="Routine events handled" detail={`${handled} represented events`} /><ActivityItem icon={<ShieldCheck size={13} />} title="Evidence packages assembled" detail={`${alerts.length} workspace records`} /><ActivityItem icon={<AlertTriangle size={13} />} title="Human review preserved" detail={`${pending} high-impact actions · open`} /><ActivityItem icon={<CheckCircle2 size={13} />} title="Sensor coverage checked" detail={`${endpoints} endpoints reporting`} /></div></section></div></div>;
}

function CapacityRow({ label, value, width, detail, gold }: { label: string; value: string; width: string; detail: string; gold?: boolean }) {
  return <div style={{ marginBottom: 25 }}><div className="capacity-line" style={{ margin: '0 0 8px' }}><span style={{ fontSize: 12, fontWeight: 700, color: 'hsl(var(--foreground))' }}>{label}</span><strong style={{ fontSize: 16 }}>{value}</strong></div><div className="meter"><i className={gold ? 'gold' : ''} style={{ width }} /></div><div className="capacity-foot"><span>{detail}</span><span>share of attention</span></div></div>;
}

function ActivityItem({ icon, title, detail }: { icon: ReactNode; title: string; detail: string }) {
  return <div className="activity-item"><div className="activity-icon">{icon}</div><div className="activity-copy"><strong>{title}</strong><span>{detail}</span></div></div>;
}

function Router() {
  return <ErrorBoundary resetKey={useLocation()[0]}><Switch><Route path="/" component={AppShell} /><Route component={() => <div style={{ padding: 40 }}>Not found</div>} /></Switch></ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;
