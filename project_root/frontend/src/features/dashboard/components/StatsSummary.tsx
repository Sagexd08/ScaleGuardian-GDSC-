import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface StatsSummaryProps {
  labels: string[];
  data: number[];
  title?: string;
}

const StatsSummary: React.FC<StatsSummaryProps> = ({ 
  labels, 
  data, 
  title = 'Activity Level' 
}) => {
  const chartData: ChartData<'line'> = {
    labels,
    datasets: [
      {
        label: title,
        data: data,
        fill: false,
        borderColor: 'rgb(75, 192, 192)', // Example color (Tailwind's teal-500 often works)
        tension: 0.1,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false, // Title is handled outside in the Dashboard component
        text: 'Monthly Activity',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
        y: {
            beginAtZero: true,
            grid: {
                color: '#e5e7eb',
            }
        },
        x: {
            grid: {
                display: false,
            }
        }
    },
    interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
      {/* Set explicit height for the chart container */}
      <div className="relative h-64 md:h-80">
        <Line options={options} data={chartData} />
      </div>
    </div>
  );
};


export default StatsSummary;
