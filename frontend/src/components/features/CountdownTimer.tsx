'use client'

import { useState, useEffect } from 'react'
import { TimeRemaining } from '@/types'

interface CountdownTimerProps {
  endTime: number
  className?: string
  onTimeUp?: () => void
}

export function CountdownTimer({
  endTime,
  className,
  onTimeUp,
}: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0,
  })

  useEffect(() => {
    const updateTimer = () => {
      const now = Math.floor(Date.now() / 1000)
      const difference = endTime - now

      if (difference <= 0) {
        setTimeRemaining({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          total: 0,
        })
        onTimeUp?.()
        return
      }

      const days = Math.floor(difference / (60 * 60 * 24))
      const hours = Math.floor((difference % (60 * 60 * 24)) / (60 * 60))
      const minutes = Math.floor((difference % (60 * 60)) / 60)
      const seconds = difference % 60

      setTimeRemaining({
        days,
        hours,
        minutes,
        seconds,
        total: difference,
      })
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [endTime, onTimeUp])

  const isUrgent = timeRemaining.total <= 60 // Last minute
  const isExpired = timeRemaining.total <= 0

  if (isExpired) {
    return (
      <div className={`text-center ${className}`}>
        <div className="text-2xl font-bold text-red-500">ROUND ENDED</div>
        <div className="text-sm text-muted-foreground">
          Waiting for resolution...
        </div>
      </div>
    )
  }

  return (
    <div className={`text-center ${className}`}>
      <div className="text-sm text-muted-foreground mb-2">Time Remaining</div>
      <div
        className={`font-mono text-2xl font-bold ${
          isUrgent ? 'text-red-500 animate-pulse' : 'text-foreground'
        }`}
      >
        {timeRemaining.minutes.toString().padStart(2, '0')}:
        {timeRemaining.seconds.toString().padStart(2, '0')}
      </div>
      {isUrgent && (
        <div className="text-xs text-red-500 animate-pulse mt-1">
          FINAL MINUTE!
        </div>
      )}
    </div>
  )
}
