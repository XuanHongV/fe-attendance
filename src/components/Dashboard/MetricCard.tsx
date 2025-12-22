import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  color: 'blue' | 'green' | 'yellow' | 'purple';
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'bg-blue-500',
    text: 'text-blue-600'
  },
  green: {
    bg: 'bg-green-50',
    icon: 'bg-green-500',
    text: 'text-green-600'
  },
  yellow: {
    bg: 'bg-yellow-50',
    icon: 'bg-yellow-500',
    text: 'text-yellow-600'
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'bg-purple-500',
    text: 'text-purple-600'
  }
};

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  color
}) => {
  const colors = colorClasses[color];
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
          <p className={`text-sm ${
            changeType === 'positive' 
              ? 'text-green-600' 
              : changeType === 'negative' 
                ? 'text-red-600' 
                : 'text-gray-500'
          }`}>
            {change}
          </p>
        </div>
        <div className={`${colors.bg} p-3 rounded-xl`}>
          <div className={`${colors.icon} p-2 rounded-lg`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
};