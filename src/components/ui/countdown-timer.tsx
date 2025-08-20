'use client'

import { useState, useEffect } from 'react'
import { Button } from './button'
import { Play, Pause, RotateCcw } from 'lucide-react'

interface CountdownTimerProps {
  initialSeconds: number
  autoStart?: boolean
  onTimeUp?: () => void
  className?: string
}

export function CountdownTimer({ 
  initialSeconds, 
  autoStart = false, 
  onTimeUp,
  className = ''
}: CountdownTimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds)
  const [isRunning, setIsRunning] = useState(autoStart)
  const [isFinished, setIsFinished] = useState(false)

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isRunning && seconds > 0) {
      interval = setInterval(() => {
        setSeconds(prev => {
          if (prev <= 1) {
            setIsRunning(false)
            setIsFinished(true)
            onTimeUp?.()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isRunning, seconds, onTimeUp])

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const handleStart = () => {
    if (seconds > 0) {
      setIsRunning(true)
      setIsFinished(false)
    }
  }

  const handlePause = () => {
    setIsRunning(false)
  }

  const handleReset = () => {
    setSeconds(initialSeconds)
    setIsRunning(false)
    setIsFinished(false)
  }

  const getColorClass = () => {
    if (isFinished) return 'text-red-600'
    if (seconds <= 10) return 'text-red-500'
    if (seconds <= 30) return 'text-orange-500'
    return 'text-blue-600'
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`text-2xl font-bold ${getColorClass()}`}>
        {formatTime(seconds)}
      </div>
      
      <div className="flex gap-1">
        {!isRunning ? (
          <Button
            onClick={handleStart}
            size="sm"
            variant="outline"
            disabled={seconds === 0}
          >
            <Play className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={handlePause}
            size="sm"
            variant="outline"
          >
            <Pause className="w-4 h-4" />
          </Button>
        )}
        
        <Button
          onClick={handleReset}
          size="sm"
          variant="outline"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      {isFinished && (
        <span className="text-red-600 font-medium">时间到！</span>
      )}
    </div>
  )
}