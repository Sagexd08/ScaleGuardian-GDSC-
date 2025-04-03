import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "shadcn"; // Updated to use shadcn package
// import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid'; // Or use lucide-react icons often paired with shadcn

interface DashboardCardProps {
  title: string;
  value: string;
  change?: string; // Optional change indicator (e.g., "+5%", "-2")
  icon?: React.ReactNode; // Optional icon
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, change, icon }) => {
  const isPositive = change && change.startsWith('+');
  const isNegative = change && change.startsWith('-');

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className={`text-xs flex items-center mt-1 ${
            isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-muted-foreground'
          }`}>
            {/* Example Icons - uncomment if needed
            {isPositive && <ArrowUpIcon className="h-3 w-3 mr-1" />}
            {isNegative && <ArrowDownIcon className="h-3 w-3 mr-1" />}
            */}
            <span className="font-medium">{change}</span>
            <span className="ml-1 text-muted-foreground">vs last period</span> {/* Example context text */}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default DashboardCard;