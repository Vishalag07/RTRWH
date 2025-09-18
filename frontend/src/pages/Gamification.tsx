import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../components/ThemeProvider'
import { Link } from 'react-router-dom'
import AchievementCard, { Achievement } from '../components/AchievementCard'
import GoalCard, { Goal } from '../components/GoalCard'

const GamificationPage: React.FC = () => {
  const { isDark } = useTheme()
  const [selected, setSelected] = useState<Achievement | null>(null)
  const [goals, setGoals] = useState<Goal[]>([
    { id: 1, title: 'Finish 5 Assessments', deadline: 'This week', progress: 70, note: "You're 70% there! Keep going!" },
    { id: 2, title: 'Reach 95% Prediction Accuracy', deadline: 'This month', progress: 42 },
    { id: 3, title: 'Analyze 10 Heatmaps', deadline: 'Next 10 days', progress: 10 }
  ])

  const achievements: Achievement[] = useMemo(() => ([
    { id: 1, title: 'Water Warrior', description: 'Complete 10 assessments', icon: '🏆', progress: 8, max: 10, unlocked: false },
    { id: 2, title: 'Conservation Champ', description: 'Save 1M liters of water', icon: '💧', progress: 750000, max: 1000000, unlocked: false },
    { id: 3, title: 'Data Detective', description: 'Analyze 50 groundwater sources', icon: '🔍', progress: 50, max: 50, unlocked: true },
    { id: 4, title: 'Prediction Master', description: 'Achieve 95% rainfall accuracy', icon: '🌧️', progress: 94, max: 95, unlocked: false },
  ]), [])

  const updateGoal = (id: number, value: number) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, progress: value } : g))
  }

  const onGoalComplete = (g: Goal) => {
    // Simple confetti-like animation placeholder
    alert(`🎉 Goal completed: ${g.title}`)
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-slate-50 via-white to-blue-50'}`}>
      {/* Navbar */}
      <div className={`fixed top-0 left-0 right-0 z-40 backdrop-blur-md border-b ${isDark ? 'bg-slate-900/70 border-slate-800/50' : 'bg-white/70 border-slate-200/60'}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className={`text-lg font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>RTRWH</Link>
          <Link to="/dashboard" className={`text-sm ${isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>Back to Dashboard</Link>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 pt-24 pb-12">
        {/* Hero */}
        <section className="mb-8">
          <motion.h1 className={`text-3xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            Gamification: Achievements & Goals
          </motion.h1>
          <motion.p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} mt-2`} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
            Stay motivated and track your impact. Earn badges, complete goals, and celebrate progress.
          </motion.p>
        </section>

        {/* Achievements */}
        <section className="mb-10">
          <h2 className={`text-xl font-semibold mb-3 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Your Achievements</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map(a => (
              <AchievementCard key={a.id} data={a} onClick={setSelected} />
            ))}
          </div>
        </section>

        {/* Goals */}
        <section>
          <h2 className={`text-xl font-semibold mb-3 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Your Goals</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map(g => (
              <GoalCard key={g.id} data={g} onUpdate={updateGoal} onComplete={onGoalComplete} />
            ))}
          </div>
        </section>
      </main>

      {/* Achievement Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/50" onClick={() => setSelected(null)} />
            <motion.div className={`relative w-full max-w-md rounded-2xl border backdrop-blur-md ${isDark ? 'bg-slate-800/95 border-slate-700/50' : 'bg-white/95 border-slate-200/50'}`} initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-3xl">{selected.icon}</div>
                  <h3 className={`text-lg font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{selected.title}</h3>
                </div>
                <p className={`${isDark ? 'text-slate-300' : 'text-slate-600'} text-sm mb-4`}>{selected.description}</p>
                <div className={`${isDark ? 'text-slate-400' : 'text-slate-600'} text-xs`}>Progress: {Math.round((selected.progress / selected.max) * 100)}%</div>
                <div className="mt-4 flex justify-end">
                  <button onClick={() => setSelected(null)} className={`px-4 py-2 rounded-xl text-sm ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'}`}>Close</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default GamificationPage
