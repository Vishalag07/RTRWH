import React from 'react';

interface LegendItemProps {
  color: string;
  label: string;
}

const LegendItem: React.FC<LegendItemProps> = ({ color, label }) => (
  <div className="flex items-center space-x-2">
    <div className="w-4 h-4 rounded-sm" style={{ background: color }} />
    <div className="text-sm">{label}</div>
  </div>
);

export default LegendItem;
