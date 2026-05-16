import React from 'react';

const colorClasses = {
  green: 'bg-green-100 text-green-700 border border-green-200',
  yellow: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  red: 'bg-red-100 text-red-700 border border-red-200',
  blue: 'bg-blue-100 text-blue-700 border border-blue-200',
  gray: 'bg-gray-100 text-gray-700 border border-gray-200',
  purple: 'bg-purple-100 text-purple-700 border border-purple-200',
  orange: 'bg-orange-100 text-orange-700 border border-orange-200',
  indigo: 'bg-indigo-100 text-indigo-700 border border-indigo-200'
};

const Badge = ({ label, color = 'gray', className = '' }) => {
  const classes = colorClasses[color] || colorClasses.gray;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${classes} ${className}`}>
      {label}
    </span>
  );
};

export default Badge;
