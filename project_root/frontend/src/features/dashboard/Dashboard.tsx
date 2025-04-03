import React, { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  fetchDashboardData,
  selectDashboardStats,
  selectDashboardChartData,
  selectDashboardStatus,
  selectDashboardError
} from '@/store/slices/dashboard.slice';
import DashboardCard from './components/DashboardCard'; // Ensure DashboardCard.tsx exists
import StatsSummary from './components/StatsSummary'; // Ensure StatsSummary.tsx exists
import LoadingSpinner from '@/shared/components/ui/LoadingSpinner'; // Ensure LoadingSpinner exists
import type { DashboardStats, ChartData } from '@/shared/types'; // Import shared types

// Example structure for card data derived from stats
const transformStatsToCards = (stats: DashboardStats | null) => {
    if (!stats) return [];
    return [
        { id: 1, title: 'Active Users', value: stats.activeUsers?.toLocaleString() ?? 'N/A', change: '+5%' }, // Example change
        { id: 2, title: 'Total Proposals', value: stats.totalProposals?.toLocaleString() ?? 'N/A' },
        { id: 3, title: 'Active Proposals', value: stats.activeProposals?.toLocaleString() ?? 'N/A' },
        { id: 4, title: 'Total Votes Cast', value: stats.totalVotesCast?.toLocaleString() ?? 'N/A' },
    ];
}

const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const stats = useAppSelector(selectDashboardStats);
  const chartData = useAppSelector(selectDashboardChartData);
  const status = useAppSelector(selectDashboardStatus);
  const error = useAppSelector(selectDashboardError);

  useEffect(() => {
    // Fetch data only if status is idle (initial load)
    if (status === 'idle') {
      dispatch(fetchDashboardData());
    }
  }, [status, dispatch]);

  const cardData = transformStatsToCards(stats);

  // --- Loading and Error Handling ---
  if (status === 'loading' && !stats) { // Show loading only on initial load
      return <div className="p-6 flex justify-center items-center"><LoadingSpinner /></div>;
  }

  if (status === 'failed') {
      return <div className="p-6 text-center text-red-500">Error loading dashboard data: {error}</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-4 text-gray-800 dark:text-gray-100">Dashboard Overview</h1>

      {/* Grid for Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cardData.map((card) => (
          <DashboardCard
            key={card.id}
            title={card.title}
            value={card.value}
            change={card.change}
            // icon={<UsersIcon className="h-5 w-5" />} // Example icon
          />
        ))}
        {/* Show placeholder cards if data is loading but not initial */}
         {(status === 'loading' && cardData.length === 0) && Array.from({ length: 4 }).map((_, i) => (
             <div key={`skel-${i}`} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow animate-pulse">
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-3"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div>
             </div>
         ))}
      </div>

      {/* Stats Summary/Chart Section */}
      <div>
        <h2 className="text-2xl font-semibold mb-3 text-gray-700 dark:text-gray-300">Activity Summary</h2>
        {chartData ? (
            <StatsSummary labels={chartData.labels} data={chartData.values} />
        ) : (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow animate-pulse h-80 md:h-96">
                {/* Placeholder for chart */}
            </div>
        )}
      </div>

      {/* Add more sections as needed */}
    </div>
  );
};

export default Dashboard;