import React from 'react'
import { motion } from 'framer-motion'

interface ProgressBarProps {
  value: number
  className?: string
  colorClass?: string
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value, className = '', colorClass = 'from-blue-500 to-cyan-500' }) => {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div className={`w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden ${className}`} aria-label={`Progress ${pct}%`}>
      <motion.div
        className={`h-full rounded-full bg-gradient-to-r ${colorClass}`}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6 }}
      />
    </div>
  )
}

export default ProgressBar
