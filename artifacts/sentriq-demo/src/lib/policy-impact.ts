export type PolicyImpact = {
  projectedReviewsAvoided: number;
  estimatedHoursReturned: number;
};

export type PolicyAlert = {
  id: number;
  client: string;
};

export type ClientImpact = PolicyImpact & {
  client: string;
  policyCount: number;
};

export const policyImpactProfiles: Record<number, PolicyImpact> = {
  1: { projectedReviewsAvoided: 18, estimatedHoursReturned: 4.5 },
  2: { projectedReviewsAvoided: 24, estimatedHoursReturned: 6 },
  3: { projectedReviewsAvoided: 12, estimatedHoursReturned: 3 },
  4: { projectedReviewsAvoided: 9, estimatedHoursReturned: 2.25 },
};

const emptyImpact: PolicyImpact = {
  projectedReviewsAvoided: 0,
  estimatedHoursReturned: 0,
};

export function getClientImpacts(enabledPolicies: PolicyAlert[]): ClientImpact[] {
  const byClient = new Map<string, ClientImpact>();

  enabledPolicies.forEach((alert) => {
    const impact = policyImpactProfiles[alert.id] ?? emptyImpact;
    const current = byClient.get(alert.client) ?? {
      client: alert.client,
      policyCount: 0,
      ...emptyImpact,
    };

    byClient.set(alert.client, {
      ...current,
      policyCount: current.policyCount + 1,
      projectedReviewsAvoided: current.projectedReviewsAvoided + impact.projectedReviewsAvoided,
      estimatedHoursReturned: current.estimatedHoursReturned + impact.estimatedHoursReturned,
    });
  });

  return Array.from(byClient.values()).sort((a, b) =>
    b.estimatedHoursReturned - a.estimatedHoursReturned ||
    b.projectedReviewsAvoided - a.projectedReviewsAvoided ||
    a.client.localeCompare(b.client),
  );
}

export function getProjectedImpact(clientImpacts: ClientImpact[]): PolicyImpact {
  return clientImpacts.reduce<PolicyImpact>((total, clientImpact) => ({
    projectedReviewsAvoided: total.projectedReviewsAvoided + clientImpact.projectedReviewsAvoided,
    estimatedHoursReturned: total.estimatedHoursReturned + clientImpact.estimatedHoursReturned,
  }), { ...emptyImpact });
}