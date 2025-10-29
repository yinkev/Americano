'use client';

import BayesianITSDashboard from '@/components/research/BayesianITSDashboard';

export default function ResearchAnalyticsPage() {
  const userId = 'test-user-001';
  const interventionDate = '2025-10-01';
  const outcomeMetric = 'sessionPerformanceScore';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-2 text-4xl font-bold">Research Analytics Dashboard</h1>
        <p className="text-gray-600">Bayesian Interrupted Time Series Analysis</p>
        
        <BayesianITSDashboard
          userId={userId}
          interventionDate={interventionDate}
          outcomeMetric={outcomeMetric}
          autoRun={false}
        />
      </div>
    </div>
  );
}
