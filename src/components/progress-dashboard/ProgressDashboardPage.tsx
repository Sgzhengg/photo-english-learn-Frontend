// =============================================================================
// PhotoEnglish - Progress Dashboard Page
// =============================================================================

import { ProgressDashboard } from '@/sections/progress-dashboard/components/ProgressDashboard';
import progressData from '@/../product/sections/progress-dashboard/data.json';

// Use the types from the product design
import type {
  OverviewStats,
  ChartData,
  WordStats,
  RecentActivity,
  Achievement
} from '@/../product/sections/progress-dashboard/types';

export function ProgressDashboardPage() {
  // Get data from mock data - use type assertions for JSON data
  const overviewStats = progressData.overviewStats as OverviewStats;
  const chartData = progressData.chartData as ChartData;
  const wordStats = progressData.wordStats as WordStats;
  const recentActivity = progressData.recentActivity as RecentActivity[];
  const achievements = progressData.achievements as Achievement[];

  return (
    <ProgressDashboard
      overviewStats={overviewStats}
      chartData={chartData}
      wordStats={wordStats}
      recentActivity={recentActivity}
      achievements={achievements}
    />
  );
}
