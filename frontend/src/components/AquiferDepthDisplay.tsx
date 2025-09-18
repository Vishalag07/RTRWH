import React from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartTooltip, ResponsiveContainer } from 'recharts';
import { AquiferProfilePoint } from './types';

interface AquiferDepthDisplayProps {
  aquiferDepth: number;
  aquiferProfile: AquiferProfilePoint[];
}

const AquiferDepthDisplay: React.FC<AquiferDepthDisplayProps> = ({ aquiferDepth, aquiferProfile }) => (
  <div className="w-full h-56 p-3 bg-gradient-to-b from-blue-50 to-white rounded-lg shadow-sm">
    <div className="flex justify-between items-start">
      <div>
        <div className="text-sm text-gray-600">Aquifer Depth</div>
        <div className="text-2xl font-bold">{aquiferDepth} m</div>
      </div>
      <div className="w-48 h-20">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={aquiferProfile} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorDepth" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" tick={{ fontSize: 10 }} />
            <YAxis hide domain={[0, 'dataMax + 10']} />
            <RechartTooltip />
            <Area type="monotone" dataKey="depth" stroke="#3b82f6" fillOpacity={1} fill="url(#colorDepth)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
    <div className="mt-3 h-28 relative flex items-end">
      <div className="flex-1 h-full flex items-end gap-2 pr-2">
        <motion.div
          className="w-full rounded-t-lg bg-gradient-to-t from-blue-600 to-blue-400 shadow-inner"
          initial={{ height: '0%' }}
          animate={{ height: `${Math.min(100, (aquiferDepth / 120) * 100)}%` }}
          transition={{ duration: 1.2 }}
          title={`Aquifer depth: ${aquiferDepth} m`}
        />
      </div>
    </div>
  </div>
);

export default AquiferDepthDisplay;
