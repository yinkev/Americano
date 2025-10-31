import assert from 'node:assert/strict';
import { test } from 'node:test';

import { getAnalyticsMock } from './analytics';

const expectedDailyInsightPayload = {
  user_id: 'user-123',
  priority_objective_id: 'obj-205',
  priority_objective_name: 'Interpret arrhythmia management algorithms',
  insight_category: 'dangerous_gap',
  title: 'Close the pacing gap',
  description: 'Your pacing decisions fall behind peers despite high confidence.',
  action_items: [
    'Review ACLS pacing indications',
    'Simulate a bradycardia emergency with decision tree',
  ],
  estimated_time_minutes: 35,
  generated_at: '2025-01-03T07:30:00Z',
} as const;

test('getAnalyticsMock returns the DailyInsight payload', () => {
  const payload = getAnalyticsMock<'DailyInsight', typeof expectedDailyInsightPayload>(
    'DailyInsight',
  );

  assert.deepStrictEqual(payload, expectedDailyInsightPayload);
});
