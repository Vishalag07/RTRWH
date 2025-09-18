import React from 'react';
import { motion } from 'framer-motion';
import { SoilLayer } from './types';

interface SoilCardsProps {
  soilLayers: SoilLayer[];
}

const SoilCards: React.FC<SoilCardsProps> = ({ soilLayers }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
    {soilLayers.map((s, idx) => (
      <motion.div
        key={s.type + idx}
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="p-3 rounded-lg shadow-md bg-white flex items-center gap-3"
      >
        <div className="w-12 h-12 rounded-md flex-shrink-0" style={{ background: s.color }} />
        <div>
          <div className="font-semibold">{s.type}</div>
          <div className="text-xs text-gray-500">Thickness: {s.thickness.toFixed(1)} m</div>
        </div>
      </motion.div>
    ))}
  </div>
);

export default SoilCards;
