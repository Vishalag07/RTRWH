import React from 'react'
import { motion } from 'framer-motion'
import ProgressBar from './ProgressBar'

export interface Achievement {
  id: number
  title: string
  description: string
  icon: string
  progress: number
  max: number
  unlocked: boolean
}

interface AchievementCardProps {
  data: Achievement
  onClick: (a: Achievement) => void
}

const AchievementCard: React.FC<AchievementCardProps> = ({ data, onClick }) => {
  const pct = Math.round((data.progress / data.max) * 100)
  return (
    <motion.div
      className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
        data.unlocked
          ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200/60 dark:from-yellow-500/10 dark:to-orange-500/10 dark:border-yellow-500/30'
          : 'bg-slate-50 border-slate-200/60 dark:bg-slate-700/30 dark:border-slate-600/30'
      }`}
      whileHover={{ scale: 1.02 }}
      onClick={() => onClick(data)}
      aria-label={`${data.title} achievement`}
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-white/60 dark:bg-slate-800/60 flex items-center justify-center text-2xl">
          {data.unlocked ? data.icon : '🔒'}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-slate-900 dark:text-slate-100">{data.title}</h4>
            {data.unlocked && (
              <motion.span
                className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-700 dark:text-yellow-300"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                unlocked
              </motion.span>
            )}
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{data.description}</p>
          <ProgressBar value={pct} />
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{pct}% complete</div>
        </div>
      </div>
    </motion.div>
  )
}

export default AchievementCard
