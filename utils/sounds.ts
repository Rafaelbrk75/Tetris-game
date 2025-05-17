let audioContext: AudioContext | null = null
let soundsAvailable = false

// Initialize audio context with user interaction
export const initAudio = (): boolean => {
  try {
    // Create audio context
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    soundsAvailable = true
    return true
  } catch (err) {
    console.error("Web Audio API not supported:", err)
    soundsAvailable = false
    return false
  }
}

// Generate a simple tone
const generateTone = (frequency: number, duration: number, volume = 0.5, type: OscillatorType = "sine") => {
  if (!audioContext || !soundsAvailable) return

  try {
    // Create oscillator
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    // Set properties
    oscillator.type = type
    oscillator.frequency.value = frequency
    gainNode.gain.value = volume

    // Connect nodes
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    // Start and stop
    oscillator.start()

    // Fade out to avoid clicks
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration)

    // Stop after duration
    setTimeout(() => {
      oscillator.stop()
      oscillator.disconnect()
      gainNode.disconnect()
    }, duration * 1000)
  } catch (err) {
    console.error("Error generating tone:", err)
  }
}

// Different sound types
export const playSound = (sound: string, isMuted = false, volume = 0.5) => {
  if (isMuted || !soundsAvailable) return

  try {
    switch (sound) {
      case "move":
        generateTone(330, 0.1, volume * 0.3, "sine")
        break
      case "rotate":
        generateTone(440, 0.1, volume * 0.3, "sine")
        break
      case "drop":
        generateTone(220, 0.2, volume * 0.4, "square")
        break
      case "clearLine":
        // Play a simple ascending arpeggio
        generateTone(440, 0.1, volume * 0.4, "sine")
        setTimeout(() => generateTone(550, 0.1, volume * 0.4, "sine"), 100)
        setTimeout(() => generateTone(660, 0.1, volume * 0.4, "sine"), 200)
        break
      case "clearTetris":
        // Play a more complex sound for Tetris
        generateTone(440, 0.1, volume * 0.4, "sine")
        setTimeout(() => generateTone(550, 0.1, volume * 0.4, "sine"), 100)
        setTimeout(() => generateTone(660, 0.1, volume * 0.4, "sine"), 200)
        setTimeout(() => generateTone(880, 0.2, volume * 0.4, "sine"), 300)
        break
      case "gameOver":
        // Descending tones for game over
        generateTone(440, 0.2, volume * 0.4, "sawtooth")
        setTimeout(() => generateTone(330, 0.2, volume * 0.4, "sawtooth"), 200)
        setTimeout(() => generateTone(220, 0.3, volume * 0.4, "sawtooth"), 400)
        break
      case "hold":
        generateTone(660, 0.1, volume * 0.3, "sine")
        break
      case "start":
        // Simple startup sound
        generateTone(440, 0.1, volume * 0.3, "sine")
        setTimeout(() => generateTone(660, 0.1, volume * 0.3, "sine"), 150)
        break
      default:
        generateTone(440, 0.1, volume * 0.3, "sine")
    }
  } catch (err) {
    console.error(`Error playing sound ${sound}:`, err)
    soundsAvailable = false
  }
}

// Test if sound is available
export const testSound = (): boolean => {
  if (!soundsAvailable) {
    initAudio()
  }

  if (soundsAvailable) {
    playSound("move")
  }

  return soundsAvailable
}

// Set volume (stored for future use)
let currentVolume = 0.5
export const setVolume = (volume: number) => {
  currentVolume = volume
}

// No need for these with the new approach
export const preloadSounds = () => {
  // Try to initialize audio
  initAudio()
}
export const cleanupSounds = () => {}
