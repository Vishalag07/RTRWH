import React from 'react';
import { motion } from 'framer-motion';
import { BoreWell } from './types';

interface BoreWellDiagramProps {
  boreWells: BoreWell[];
}

const BoreWellDiagram: React.FC<BoreWellDiagramProps> = ({ boreWells }) => (
  <div className="p-3 bg-white rounded-lg shadow-sm h-full">
    <div className="flex items-center justify-between mb-3">
      <div className="font-semibold">Bore Wells & Shafts</div>
      <div className="text-sm text-gray-500">Connections</div>
    </div>
    <div className="w-full h-56 relative">
      <svg viewBox="0 0 600 280" className="w-full h-full">
        <line x1={0} y1={40} x2={600} y2={40} stroke="#333" strokeWidth={1} />
        {boreWells.map((bw, i) => {
          const x = 80 + i * 180;
          const wellTopY = 42;
          const wellBottomY = 42 + Math.min(180, bw.waterLevel * 3);
          return (
            <g key={bw.id}>
              <motion.rect
                x={x - 12}
                y={wellTopY}
                width={24}
                height={wellBottomY - wellTopY}
                fill="#1f2937"
                initial={{ height: 0 }}
                animate={{ height: wellBottomY - wellTopY }}
                transition={{ type: 'spring', stiffness: 80, damping: 12 }}
              />
              <motion.line
                x1={x - 16}
                x2={x + 16}
                y1={wellTopY + (wellBottomY - wellTopY) * 0.5}
                y2={wellTopY + (wellBottomY - wellTopY) * 0.5}
                stroke="#3b82f6"
                strokeWidth={4}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              />
              <text x={x} y={wellTopY - 8} textAnchor="middle" fontSize="12" fill="#111">
                {bw.id}
              </text>
              {bw.connectedShafts.map((s: any, j: number) => {
                const sx = x + (j % 2 === 0 ? -40 : 40);
                const sy = wellTopY + 20 + j * 30;
                return (
                  <g key={s.id}>
                    <motion.line
                      x1={x}
                      x2={sx}
                      y1={wellTopY + 12}
                      y2={sy}
                      stroke="#9ca3af"
                      strokeWidth={2}
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.8 + j * 0.2 }}
                    />
                    <motion.circle
                      cx={sx}
                      cy={sy}
                      r={8}
                      fill="#ef4444"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 120 }}
                    />
                    <text x={sx + 12} y={sy + 4} fontSize="10" fill="#111">
                      {s.id} ({s.depth}m)
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  </div>
);

export default BoreWellDiagram;
