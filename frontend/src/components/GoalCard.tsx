import React from 'react'
import { motion } from 'framer-motion'
import ProgressBar from './ProgressBar'

export interface Goal {
  id: number
  title: string
  deadline: string
  progress: number // 0-100
  note?: string
}

interface GoalCardProps {
  data: Goal
  onUpdate: (id: number, value: number) => void
  onComplete?: (g: Goal) => void
}

const GoalCard: React.FC<GoalCardProps> = ({ data, onUpdate, onComplete }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(0, Math.min(100, Number(e.target.value)))
    onUpdate(data.id, val)
    if (val === 100 && onComplete) onComplete(data)
  }

  return (
    <motion.div
      className="p-4 rounded-xl border bg-slate-50 border-slate-200/60 dark:bg-slate-700/30 dark:border-slate-600/30"
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-slate-900 dark:text-slate-100">{data.title}</h4>
        <span className="text-xs text-slate-500 dark:text-slate-400">{data.deadline}</span>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{data.note || "You're doing great—keep going!"}</p>
      <ProgressBar value={data.progress} colorClass={data.progress === 100 ? 'from-emerald-500 to-green-500' : 'from-blue-500 to-cyan-500'} />
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-slate-600 dark:text-slate-400">{data.progress}%</span>
        <input
          type="range"
          min={0}
          max={100}
          value={data.progress}
          onChange={handleChange}
          className="w-40 accent-blue-600"
          aria-label="Update goal progress"
        />
      </div>
    </motion.div>
  )
}

export default GoalCard
