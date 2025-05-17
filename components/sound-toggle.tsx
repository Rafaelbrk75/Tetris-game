"use client"

import { Button } from "@/components/ui/button"
import { Volume2, VolumeX } from "lucide-react"

interface SoundToggleProps {
  isMuted: boolean
  onToggle: () => void
}

export function SoundToggle({ isMuted, onToggle }: SoundToggleProps) {
  return (
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
  )
}
