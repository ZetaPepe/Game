"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

interface BinaryBackgroundProps {
  count?: number
  speed?: number
  opacity?: number
}

export function BinaryBackground({ count = 50, speed = 15, opacity = 0.1 }: BinaryBackgroundProps) {
  const [binaryStreams, setBinaryStreams] = useState<
    Array<{
      id: number
      x: number
      y: number
      length: number
      speed: number
      binary: string
    }>
  >([])

  // Generate random binary string
  const generateBinary = (length: number) => {
    return Array.from({ length }, () => Math.round(Math.random())).join("")
  }

  useEffect(() => {
    const streams = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100, // random x position as percentage
      y: Math.random() * -100, // start above the viewport
      length: 10 + Math.floor(Math.random() * 20), // binary length
      speed: (0.5 + Math.random()) * speed, // random speed factor
      binary: generateBinary(10 + Math.floor(Math.random() * 20)),
    }))

    setBinaryStreams(streams)
  }, [count, speed])

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {binaryStreams.map((stream) => (
        <motion.div
          key={stream.id}
          initial={{ y: stream.y + "%" }}
          animate={{
            y: "200%", // Move beyond the bottom of the screen
          }}
          transition={{
            duration: stream.speed,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "loop",
            ease: "linear",
          }}
          className="absolute text-xs sm:text-sm font-mono"
          style={{
            left: `${stream.x}%`,
            color: `rgba(0, 255, 170, ${opacity})`,
            textShadow: `0 0 5px rgba(0, 255, 170, ${opacity * 2})`,
            writingMode: "vertical-rl",
          }}
        >
          {stream.binary}
        </motion.div>
      ))}
    </div>
  )
}
