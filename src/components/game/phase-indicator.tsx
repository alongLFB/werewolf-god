'use client'

import { GamePhase } from '@/types'
import { getPhaseText, getStepText } from '@/lib/utils'
import { Moon, Sun, Clock } from 'lucide-react'

interface PhaseIndicatorProps {
  phase: GamePhase
  round: number
  step: string
  className?: string
}

export function PhaseIndicator({ phase, round, step, className = '' }: PhaseIndicatorProps) {
  const Icon = phase === 'night' ? Moon : Sun
  
  return (
    <div className={`game-phase-indicator ${phase} ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Icon className="w-6 h-6" />
          <div>
            <h2 className="text-xl font-bold">
              {getPhaseText(phase, round)}
            </h2>
            <p className="text-sm opacity-90">
              {getStepText(step)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 text-sm opacity-75">
          <Clock className="w-4 h-4" />
          <span>{new Date().toLocaleTimeString('zh-CN', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}</span>
        </div>
      </div>
      
      {/* 进度条 */}
      <div className="mt-3">
        <PhaseProgress phase={phase} step={step} />
      </div>
    </div>
  )
}

function PhaseProgress({ phase, step }: { phase: GamePhase; step: string }) {
  const nightSteps = ['guard', 'werewolf', 'seer', 'witch', 'hunter_status']
  const daySteps = ['dawn', 'discussion', 'vote', 'execution']
  
  const steps = phase === 'night' ? nightSteps : daySteps
  const currentIndex = steps.indexOf(step)
  const progress = ((currentIndex + 1) / steps.length) * 100
  
  return (
    <div className="w-full bg-white/20 rounded-full h-2">
      <div 
        className="bg-white h-2 rounded-full transition-all duration-500"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}