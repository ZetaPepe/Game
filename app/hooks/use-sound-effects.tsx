"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"

export function useSoundEffects() {
  // Store sound state in refs to avoid re-renders
  const soundsEnabledRef = useRef<boolean>(true)
  const [soundsEnabled, setSoundsEnabled] = useState(true)
  const [soundsLoaded, setSoundsLoaded] = useState(false)

  const interfaceSoundRef = useRef<HTMLAudioElement | null>(null)
  const levelUpSoundRef = useRef<HTMLAudioElement | null>(null)
  const matchSoundRef = useRef<HTMLAudioElement | null>(null)
  const wrongMatchSoundRef = useRef<HTMLAudioElement | null>(null)
  const gameOverSoundRef = useRef<HTMLAudioElement | null>(null)
  const introSoundRef = useRef<HTMLAudioElement | null>(null)
  const achievementSoundRef = useRef<HTMLAudioElement | null>(null)
  const atmosphereSoundRef = useRef<HTMLAudioElement | null>(null)

  // Track if atmosphere sound is playing
  const isAtmospherePlayingRef = useRef<boolean>(false)

  // Load sounds only on client side
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Set initial state from localStorage if available
      try {
        const savedSoundsEnabled = localStorage.getItem("satoshiMatchSoundsEnabled")
        if (savedSoundsEnabled !== null) {
          const parsedValue = JSON.parse(savedSoundsEnabled)
          setSoundsEnabled(parsedValue)
          soundsEnabledRef.current = parsedValue
        }
      } catch (e) {
        console.warn("Failed to load sound settings:", e)
      }

      // Create audio elements with error handling
      const createAudio = (src: string, options?: { loop?: boolean; volume?: number }) => {
        try {
          const audio = new Audio(src)
          audio.preload = "auto"
          if (options?.loop) audio.loop = true
          if (options?.volume !== undefined) audio.volume = options.volume
          audio.addEventListener("error", (e) => {
            console.warn(`Error loading sound: ${src}`, e)
          })
          return audio
        } catch (e) {
          console.warn(`Failed to create audio for ${src}:`, e)
          return null
        }
      }

      // Create all audio elements
      interfaceSoundRef.current = createAudio("/sounds/sci-fi-interface.mp3")
      levelUpSoundRef.current = createAudio("/sounds/data-processing.mp3")
      matchSoundRef.current = createAudio("/sounds/robotic-gun.mp3")
      wrongMatchSoundRef.current = createAudio("/sounds/futuristic-radio.mp3")
      gameOverSoundRef.current = createAudio("/sounds/systems-failure.mp3")
      introSoundRef.current = createAudio("/sounds/advertising-futuristic.mp3")
      achievementSoundRef.current = createAudio("/sounds/8-bit-achievement-epic-stock-media-1-00-00.mp3")
      atmosphereSoundRef.current = createAudio("/sounds/atmosphere-synth-pad.mp3", { loop: true, volume: 0.3 })

      // Mark sounds as loaded
      setSoundsLoaded(true)
    }

    return () => {
      // Cleanup audio elements
      const cleanupAudio = (audioRef: React.RefObject<HTMLAudioElement>) => {
        if (audioRef.current) {
          audioRef.current.pause()
          audioRef.current.src = ""
        }
      }

      cleanupAudio(interfaceSoundRef)
      cleanupAudio(levelUpSoundRef)
      cleanupAudio(matchSoundRef)
      cleanupAudio(wrongMatchSoundRef)
      cleanupAudio(gameOverSoundRef)
      cleanupAudio(introSoundRef)
      cleanupAudio(achievementSoundRef)
      cleanupAudio(atmosphereSoundRef)
    }
  }, [])

  // Update ref when state changes to avoid stale closures
  useEffect(() => {
    soundsEnabledRef.current = soundsEnabled

    // Handle atmosphere sound when sound setting changes
    if (soundsEnabled && !isAtmospherePlayingRef.current) {
      playAtmosphereSound()
    } else if (!soundsEnabled && isAtmospherePlayingRef.current) {
      stopAtmosphereSound()
    }

    // Save to localStorage
    try {
      localStorage.setItem("satoshiMatchSoundsEnabled", JSON.stringify(soundsEnabled))
    } catch (e) {
      console.warn("Failed to save sound settings:", e)
    }
  }, [soundsEnabled])

  // Play sound with fallback and error handling
  const playSound = useCallback(
    (audioRef: React.RefObject<HTMLAudioElement>, fallbackFreq = 440, fallbackDuration = 200) => {
      if (!soundsEnabledRef.current) return false

      // Try to play the audio
      if (audioRef.current) {
        try {
          // Clone to allow overlapping sounds
          const sound = audioRef.current.cloneNode() as HTMLAudioElement
          sound.volume = 0.7

          // Use promise with timeout to handle both success and failure
          const playPromise = sound.play()

          if (playPromise !== undefined) {
            playPromise.catch((error) => {
              console.warn("Error playing sound:", error)
              // Try fallback on failure
              playFallbackBeep(fallbackFreq, fallbackDuration)
            })
          }

          return true
        } catch (error) {
          console.warn("Error playing sound:", error)
          // Try fallback on failure
          playFallbackBeep(fallbackFreq, fallbackDuration)
          return false
        }
      }

      // If no audio element, try fallback
      playFallbackBeep(fallbackFreq, fallbackDuration)
      return false
    },
    [],
  )

  // Fallback sound using Web Audio API
  const playFallbackBeep = useCallback((frequency = 440, duration = 200, type = "sine") => {
    if (!soundsEnabledRef.current) return false

    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContext) return false

      const audioContext = new AudioContext()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.type = type as OscillatorType
      oscillator.frequency.value = frequency
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      gainNode.gain.value = 0.1 // Lower volume
      oscillator.start()

      setTimeout(() => {
        oscillator.stop()
        audioContext.close().catch((e) => console.warn("Error closing audio context:", e))
      }, duration)

      return true
    } catch (error) {
      console.warn("Failed to play fallback sound:", error)
      return false
    }
  }, [])

  // Play atmosphere sound continuously
  const playAtmosphereSound = useCallback(() => {
    if (!soundsEnabledRef.current || isAtmospherePlayingRef.current) return false

    if (atmosphereSoundRef.current) {
      try {
        atmosphereSoundRef.current.currentTime = 0
        atmosphereSoundRef.current.volume = 0.3 // Keep volume lower than other sounds
        atmosphereSoundRef.current.loop = true

        const playPromise = atmosphereSoundRef.current.play()

        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              isAtmospherePlayingRef.current = true
            })
            .catch((error) => {
              console.warn("Error playing atmosphere sound:", error)
              isAtmospherePlayingRef.current = false
            })
        }

        return true
      } catch (error) {
        console.warn("Error playing atmosphere sound:", error)
        isAtmospherePlayingRef.current = false
        return false
      }
    }

    return false
  }, [])

  // Stop atmosphere sound
  const stopAtmosphereSound = useCallback(() => {
    if (atmosphereSoundRef.current && isAtmospherePlayingRef.current) {
      try {
        atmosphereSoundRef.current.pause()
        isAtmospherePlayingRef.current = false
        return true
      } catch (error) {
        console.warn("Error stopping atmosphere sound:", error)
        return false
      }
    }
    return false
  }, [])

  // Toggle sounds without causing re-renders
  const toggleSounds = useCallback(() => {
    setSoundsEnabled((prev) => !prev)
  }, [])

  // Sound functions with stable references
  const playInterfaceSound = useCallback(() => {
    return playSound(interfaceSoundRef, 880, 100)
  }, [playSound])

  const playLevelUpSound = useCallback(() => {
    return playSound(levelUpSoundRef, 660, 300)
  }, [playSound])

  const playMatchSound = useCallback(() => {
    return playSound(matchSoundRef, 440, 200)
  }, [playSound])

  const playWrongMatchSound = useCallback(() => {
    return playSound(wrongMatchSoundRef, 220, 200)
  }, [playSound])

  const playGameOverSound = useCallback(() => {
    return playSound(gameOverSoundRef, 110, 500)
  }, [playSound])

  const playIntroSound = useCallback(() => {
    return playSound(introSoundRef, 550, 400)
  }, [playSound])

  const playAchievementSound = useCallback(() => {
    return playSound(achievementSoundRef, 880, 800)
  }, [playSound])

  return {
    playInterfaceSound,
    playLevelUpSound,
    playMatchSound,
    playWrongMatchSound,
    playGameOverSound,
    playIntroSound,
    playAchievementSound,
    playAtmosphereSound,
    stopAtmosphereSound,
    soundsLoaded,
    soundsEnabled,
    toggleSounds,
  }
}
