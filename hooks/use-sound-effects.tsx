"use client"

import type React from "react"

import { useEffect, useRef } from "react"

export function useSoundEffects() {
  const interfaceSoundRef = useRef<HTMLAudioElement | null>(null)
  const levelUpSoundRef = useRef<HTMLAudioElement | null>(null)
  const matchSoundRef = useRef<HTMLAudioElement | null>(null)
  const wrongMatchSoundRef = useRef<HTMLAudioElement | null>(null)
  const gameOverSoundRef = useRef<HTMLAudioElement | null>(null)
  const introSoundRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      interfaceSoundRef.current = new Audio("/sounds/sci-fi-interface.mp3")
      levelUpSoundRef.current = new Audio("/sounds/data-processing.mp3")
      matchSoundRef.current = new Audio("/sounds/robotic-gun.mp3")
      wrongMatchSoundRef.current = new Audio("/sounds/futuristic-radio.mp3")
      gameOverSoundRef.current = new Audio("/sounds/systems-failure.mp3")
      introSoundRef.current = new Audio("/sounds/advertising-futuristic.mp3")
    }

    return () => {
      // Cleanup audio elements
      interfaceSoundRef.current = null
      levelUpSoundRef.current = null
      matchSoundRef.current = null
      wrongMatchSoundRef.current = null
      gameOverSoundRef.current = null
      introSoundRef.current = null
    }
  }, [])

  const playSound = (audioRef: React.RefObject<HTMLAudioElement>) => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch((error) => {
        console.error("Error playing sound:", error)
      })
    }
  }

  const playInterfaceSound = () => playSound(interfaceSoundRef)
  const playLevelUpSound = () => playSound(levelUpSoundRef)
  const playMatchSound = () => playSound(matchSoundRef)
  const playWrongMatchSound = () => playSound(wrongMatchSoundRef)
  const playGameOverSound = () => playSound(gameOverSoundRef)
  const playIntroSound = () => playSound(introSoundRef)

  return {
    playInterfaceSound,
    playLevelUpSound,
    playMatchSound,
    playWrongMatchSound,
    playGameOverSound,
    playIntroSound,
  }
}
