"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Volume2, VolumeX } from "lucide-react"
import { setVolume as setSoundVolume, playSound, testSound } from "@/utils/sounds"

interface VolumeControlProps {
  isMuted: boolean
  onToggle: () => void
}

export function VolumeControl({ isMuted, onToggle }: VolumeControlProps) {
  const [volume, setVolume] = useState(50)
  const [soundAvailable, setSoundAvailable] = useState(false)

  // Test sound availability on mount
  useEffect(() => {
    const available = testSound()
    setSoundAvailable(available)
  }, [])

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number.parseInt(e.target.value)
    setVolume(newVolume)
    setSoundVolume(newVolume / 100)
  }

  const handleTestSound = () => {
    const available = testSound()
    setSoundAvailable(available)
    if (available && !isMuted) {
      playSound("move", isMuted, volume / 100)
    }
  }

  return (
    <div className="flex flex-col items-center gap-2 bg-gray-800 p-3 rounded-lg">
      <div className="flex items-center gap-2">
        <Button
          onClick={onToggle}
          variant="outline"
          size="sm"
          className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 border-none"
          aria-label={isMuted ? "Unmute sounds" : "Mute sounds"}
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          {isMuted ? "Unmute" : "Mute"}
        </Button>

        <Button
          onClick={handleTestSound}
          variant="outline"
          size="sm"
          className="bg-gray-700 hover:bg-gray-600 border-none"
        >
          Test Sound
        </Button>
      </div>

      {!soundAvailable && (
        <p className="text-yellow-400 text-xs mt-1">
          Sound requires user interaction and may not be available in all environments.
        </p>
      )}

      {!isMuted && (
        <div className="flex items-center gap-2 w-full">
          <span className="text-white text-xs">Volume:</span>
          <input type="range" min="0" max="100" value={volume} onChange={handleVolumeChange} className="w-full" />
          <span className="text-white text-xs">{volume}%</span>
        </div>
      )}
    </div>
  )
}
