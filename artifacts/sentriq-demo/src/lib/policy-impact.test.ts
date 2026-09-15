import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getClientImpacts,
  getProjectedImpact,
  type PolicyAlert,
} from './policy-impact';

const initialPolicies: PolicyAlert[] = [
  { id: 1, client: 'Redwood Legal' },
  { id: 2, client: 'Northstar Dental' },
  { id: 3, client: 'Pine & Co. Manufacturing' },
  { id: 4, client: 'Redwood Legal' },
];

test('enabling policies updates each client and the projected totals', () => {
  const enabledPolicies = initialPolicies.slice(0, 2);
  const clientImpacts = getClientImpacts(enabledPolicies);

  assert.deepEqual(clientImpacts, [
    {
      client: 'Northstar Dental',
      policyCount: 1,
      projectedReviewsAvoided: 24,
      estimatedHoursReturned: 6,
    },
    {
      client: 'Redwood Legal',
      policyCount: 1,
      projectedReviewsAvoided: 18,
      estimatedHoursReturned: 4.5,
    },
  ]);
  assert.deepEqual(getProjectedImpact(clientImpacts), {
    projectedReviewsAvoided: 42,
    estimatedHoursReturned: 10.5,
  });
});

test('client rows remain additive when one client has multiple enabled policies', () => {
  const clientImpacts = getClientImpacts([initialPolicies[0], initialPolicies[3], initialPolicies[2]]);

  assert.deepEqual(clientImpacts, [
    {
      client: 'Redwood Legal',
      policyCount: 2,
      projectedReviewsAvoided: 27,
      estimatedHoursReturned: 6.75,
    },
    {
      client: 'Pine & Co. Manufacturing',
      policyCount: 1,
      projectedReviewsAvoided: 12,
      estimatedHoursReturned: 3,
    },
  ]);
  assert.deepEqual(getProjectedImpact(clientImpacts), {
    projectedReviewsAvoided: 39,
    estimatedHoursReturned: 9.75,
  });
});

test('disabling a policy removes only that policy from client and headline impact', () => {
  const enabledPolicies = initialPolicies.slice(0, 2);
  const clientImpactsAfterDisable = getClientImpacts(enabledPolicies.filter((policy) => policy.id !== 1));

  assert.deepEqual(clientImpactsAfterDisable, [
    {
      client: 'Northstar Dental',
      policyCount: 1,
      projectedReviewsAvoided: 24,
      estimatedHoursReturned: 6,
    },
  ]);
  assert.deepEqual(getProjectedImpact(clientImpactsAfterDisable), {
    projectedReviewsAvoided: 24,
    estimatedHoursReturned: 6,
  });
});

test('resetting the demo removes all client impact', () => {
  assert.deepEqual(getClientImpacts([]), []);
  assert.deepEqual(getProjectedImpact([]), {
    projectedReviewsAvoided: 0,
    estimatedHoursReturned: 0,
  });
});