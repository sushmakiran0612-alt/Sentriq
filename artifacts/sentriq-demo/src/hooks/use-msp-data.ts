import { useEffect, useState } from 'react';

export type OrganizationSize = '1-10' | '11-50' | '51-200' | '201-500' | '500+';
export type ProspectStatus = 'intake' | 'assessment' | 'proposed_package' | 'ready_for_onboarding';
export type EvidenceState = 'draft' | 'confirmed' | 'uncertain' | 'missing' | 'conflicting';
export type ProposalDecision = 'pending' | 'approved' | 'rejected' | 'changes_requested';
export type IntegrationState = 'awaiting_access' | 'integration_setup' | 'blocked' | 'failed' | 'ready' | 'activated';

/** Session-only workspace data. This is deliberately not an auth or tenant boundary. */
export interface MspWorkspace {
  id: string;
  name: string;
  clients: string[];
  prospects: string[];
  packageIds: string[];
}

export interface InventoryEvidence {
  id: string;
  description: string;
  source: 'manual' | 'questionnaire' | 'spreadsheet' | 'photo' | 'screenshot' | 'simulated_integration';
  state: EvidenceState;
  reviewNote?: string;
  clientClarification?: string;
  mspResolution?: string;
  clarificationStatus?: 'open' | 'responded' | 'resolved';
  assetName?: string;
  assetType?: string;
  assetCount?: number;
  sources?: string[];
}

export interface ManualAsset {
  id: string;
  name: string;
  type: string;
  count: number;
  sources?: string[];
}

export interface IntakeFile {
  id: string;
  name: string;
  type: string; // 'spreadsheet' | 'image' | etc
  size: string;
  status: string; // 'Simulated'
  previewUrl?: string;
  sample?: boolean;
  parsedRows?: number;
  parsedAssets?: ManualAsset[];
}

export interface Prospect {
  id: string;
  key: string;
  name: string;
  size: OrganizationSize;
  industry: string;
  needs: string[];
  requirements: string[];
  status: ProspectStatus;
  internalNotes: string;
  
  businessDetailsSubmitted?: boolean;
  businessDraftSaved?: boolean;
  environmentConfirmed?: boolean;
  // Client Intake
  intakeAnswers: Record<string, string>;
  manualAssets: ManualAsset[];
  intakeFiles: IntakeFile[];
  intakeSubmitted: boolean;
  /** Explicit reviewable evidence; attachments never imply confirmed inventory. */
  inventoryEvidence?: InventoryEvidence[];
  contacts?: { name: string; email: string; role: string }[];
  locations?: string[];
  existingTools?: string[];
  unresolvedGaps?: string[];

  // Proposal
  proposedPackageId?: string;
  proposalOverrideReason?: string;
  proposalShared: boolean;
  sharedProposal?: {
    packageId: string;
    packageName: string;
    description: string;
    services: string[];
    price: number;
    billingBasis: Package['billingBasis'];
    estimatedMonthlyPrice: number;
    needs: string[];
    requirements: string[];
    version?: number;
    confidence?: string;
    rationale?: string;
    gaps?: string[];
  };
  proposalHistory?: {
    packageId: string;
    packageName: string;
    description: string;
    services: string[];
    price: number;
    billingBasis: string;
    estimatedMonthlyPrice: number;
    needs: string[];
    requirements: string[];
    version: number;
    sharedAt: string;
    rationale: string;
    confidence: string;
    gaps: string[];
  }[];
  proposalDecision?: {
    decision: ProposalDecision;
    actor: string;
    timestamp: string;
    proposalVersion: number;
    note?: string;
  };
  integrationState?: IntegrationState;
  integrationIssue?: string;
  integrationOwner?: string;
  integrationRecoveryAttempts?: number;
  integrationRecoveredAt?: string;
  activatedAt?: string;
  workspaceId?: string;
  selectedIntegration?: { id: string; name: string; state: IntegrationState };
  activated?: boolean;
}

export interface Package {
  id: string;
  workspaceId?: string;
  name: string;
  description: string;
  targetedSizes: OrganizationSize[];
  targetedNeeds: string[];
  vendorProductIds: string[];
  services: string[];
  price: number;
  billingBasis: 'per_user' | 'per_endpoint' | 'flat_monthly';
}

export interface VendorProduct {
  id: string;
  workspaceId?: string;
  vendorName: string;
  productName: string;
  category: string;
  capabilities: string[];
  mspRelationship: 'partner' | 'evaluating' | 'none';
  integrationStatus: 'simulated_active' | 'simulated_pending' | 'none';
}

export const initialVendors: VendorProduct[] = [
  { id: 'v1', vendorName: 'CrowdStrike', productName: 'Falcon Pro', category: 'EDR', capabilities: ['NGAV', 'Threat Intelligence', 'USB Device Control'], mspRelationship: 'partner', integrationStatus: 'simulated_active' },
  { id: 'v2', vendorName: 'Microsoft', productName: 'Defender for Business', category: 'EDR', capabilities: ['NGAV', 'Attack Surface Reduction'], mspRelationship: 'partner', integrationStatus: 'simulated_active' },
  { id: 'v3', vendorName: 'Proofpoint', productName: 'Email Security', category: 'Email', capabilities: ['Spam Filtering', 'Phishing Protection'], mspRelationship: 'evaluating', integrationStatus: 'none' },
  { id: 'v4', vendorName: 'SentinelOne', productName: 'Complete', category: 'EDR', capabilities: ['NGAV', 'EDR', 'Rogue Device Discovery'], mspRelationship: 'partner', integrationStatus: 'simulated_pending' },
  { id: 'v5', vendorName: 'Duo', productName: 'Beyond', category: 'Identity', capabilities: ['MFA', 'SSO', 'Device Trust'], mspRelationship: 'partner', integrationStatus: 'simulated_active' },
  { id: 'v6', workspaceId: 'northbridge', vendorName: 'Sample Secure', productName: 'Endpoint Guard', category: 'EDR', capabilities: ['NGAV', 'Investigation'], mspRelationship: 'evaluating', integrationStatus: 'simulated_pending' },
];

export const initialPackages: Package[] = [
  { id: 'p1', name: 'Sample — Standard Business Protection', description: 'Essential endpoint, identity, monitoring, and reporting coverage for small businesses.', targetedSizes: ['1-10', '11-50'], targetedNeeds: ['Basic Security'], vendorProductIds: ['v2', 'v5'], services: ['24/7 Monitoring', 'Monthly Reporting'], price: 15, billingBasis: 'per_user' },
  { id: 'p2', name: 'Sample — Enterprise Advanced', description: 'Comprehensive baseline protection with Data Residency and SOC 2-oriented compliance coverage, advanced threat hunting, and response.', targetedSizes: ['11-50', '51-200', '201-500'], targetedNeeds: ['Basic Security', 'Zero Trust', 'Compliance', 'Advanced Threat Hunting'], vendorProductIds: ['v1', 'v5'], services: ['24/7 SOC', 'Incident Response', 'Quarterly Review'], price: 35, billingBasis: 'per_user' },
  { id: 'p3', workspaceId: 'northbridge', name: 'Northbridge Response Starter', description: 'Simulated monitored response for the Northbridge demo client.', targetedSizes: ['1-10', '11-50'], targetedNeeds: ['Basic Security'], vendorProductIds: ['v6'], services: ['Queue review', 'Sample reporting'], price: 22, billingBasis: 'per_endpoint' },
];

export const initialProspects: Prospect[] = [
  {
    id: 'pr1',
    key: 'meridian',
    name: 'Meridian Capital',
    size: '11-50',
    industry: 'Financial Services',
    needs: ['Compliance', 'Zero Trust', 'Basic Security'],
    requirements: ['Data Residency', 'SOC 2'],
    status: 'assessment',
    internalNotes: 'High priority. Met at conference. Looking to replace legacy AV.',
    intakeAnswers: { 'q1': 'Yes', 'q2': 'No' },
    manualAssets: [{ id: 'a1', name: 'Windows Laptops', type: 'endpoint', count: 45, sources: ['manual'] }],
    intakeFiles: [{ id: 'f1', name: 'software_inventory.xlsx', type: 'spreadsheet', size: '1.2 MB', status: 'Simulated Session Data' }],
    intakeSubmitted: true,
    workspaceId: 'cedarline',
    locations: ['Austin, TX'],
    existingTools: ['Legacy antivirus'],
    contacts: [{ name: 'Maya Chen', email: 'maya@example.test', role: 'IT lead' }],
    inventoryEvidence: [
      { id: 'e1', description: '45 Windows laptops', source: 'manual', state: 'confirmed', assetName: 'Windows Laptops', assetType: 'endpoint', assetCount: 45, sources: ['manual'] },
      { id: 'e2', description: 'Data residency control mapping', source: 'questionnaire', state: 'uncertain', reviewNote: 'Which regions must store Meridian customer records?', clarificationStatus: 'open' },
    ],
    unresolvedGaps: ['Data residency control mapping'],
    proposedPackageId: undefined,
    proposalShared: false,
  },
  {
    id: 'pr2',
    key: 'valiant',
    name: 'Valiant Healthcare',
    size: '51-200',
    industry: 'Healthcare',
    needs: ['HIPAA Compliance', 'Basic Security'],
    requirements: ['BAA Agreement'],
    status: 'intake',
    internalNotes: 'Needs BAA before proceeding.',
    intakeAnswers: {},
    manualAssets: [],
    intakeFiles: [],
    intakeSubmitted: false,
    workspaceId: 'northbridge',
    inventoryEvidence: [],
    unresolvedGaps: ['Asset inventory', 'Questionnaire responses', 'Primary contact'],
    proposedPackageId: undefined,
    proposalShared: false,
  }
];

export const initialMspWorkspaces: MspWorkspace[] = [
  { id: 'cedarline', name: 'Cedarline Security', clients: ['redwood', 'northstar', 'pine'], prospects: ['meridian'], packageIds: ['p1', 'p2'] },
  { id: 'northbridge', name: 'Northbridge Cyber', clients: ['aster'], prospects: ['valiant'], packageIds: ['p3'] },
];

export const MSP_SESSION_STORAGE_KEY = 'sentriq:msp-demo-session:v1';

type PersistedMspData = {
  vendors: VendorProduct[];
  packages: Package[];
  prospects: Prospect[];
};

function loadSessionData(): PersistedMspData {
  if (typeof window === 'undefined') return { vendors: initialVendors, packages: initialPackages, prospects: initialProspects };
  try {
    const raw = window.sessionStorage.getItem(MSP_SESSION_STORAGE_KEY);
    if (!raw) return { vendors: initialVendors, packages: initialPackages, prospects: initialProspects };
    const parsed = JSON.parse(raw) as Partial<PersistedMspData>;
    if (!Array.isArray(parsed.vendors) || !Array.isArray(parsed.packages) || !Array.isArray(parsed.prospects)) {
      throw new Error('Invalid saved demo data');
    }
    return { vendors: parsed.vendors, packages: parsed.packages, prospects: parsed.prospects };
  } catch {
    window.sessionStorage.removeItem(MSP_SESSION_STORAGE_KEY);
    return { vendors: initialVendors, packages: initialPackages, prospects: initialProspects };
  }
}

export function useMspData() {
  const [sessionData] = useState(loadSessionData);
  const [vendors, setVendors] = useState<VendorProduct[]>(sessionData.vendors);
  const [packages, setPackages] = useState<Package[]>(sessionData.packages);
  const [prospects, setProspects] = useState<Prospect[]>(sessionData.prospects);

  useEffect(() => {
    const safeProspects = prospects.map(prospect => ({
      ...prospect,
      intakeFiles: prospect.intakeFiles.map(file => ({ ...file, previewUrl: undefined })),
    }));
    window.sessionStorage.setItem(MSP_SESSION_STORAGE_KEY, JSON.stringify({ vendors, packages, prospects: safeProspects }));
  }, [vendors, packages, prospects]);

  const resetMspData = () => {
    window.sessionStorage.removeItem(MSP_SESSION_STORAGE_KEY);
    setVendors(initialVendors);
    setPackages(initialPackages);
    setProspects(initialProspects);
  };

  return { vendors, setVendors, packages, setPackages, prospects, setProspects, resetMspData };
}
