"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import Image from "next/image"
import { useSoundEffects } from "@/hooks/use-sound-effects"

type MemoryCard = {
  id: number
  image: string
  isMatched: boolean
}

const createCards = () => {
  const cryptoImages = [
    "/images/x-logo.png",
    "/images/tron-logo.png",
    "/images/ethereum-logo.png",
    "/images/solana-logo.png",
    "/images/bitcoin-logo.png",
    "/images/binance-logo.png",
  ]

  const cards: MemoryCard[] = []

  cryptoImages.forEach((image, index) => {
    cards.push({ id: index * 2, image, isMatched: false }, { id: index * 2 + 1, image, isMatched: false })
  })

  return cards.sort(() => Math.random() - 0.5)
}

export default function MemoryGame() {
  const [cards, setCards] = useState<MemoryCard[]>(createCards())
  const [flippedIndexes, setFlippedIndexes] = useState<number[]>([])
  const [matches, setMatches] = useState(0)
  const [isChecking, setIsChecking] = useState(false)
  const [exp, setExp] = useState(0)
  const [level, setLevel] = useState(1)
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [showExpGain, setShowExpGain] = useState<{ show: boolean; position: { x: number; y: number } }>({
    show: false,
    position: { x: 0, y: 0 },
  })
  const [timeLeft, setTimeLeft] = useState(30)
  const [gameActive, setGameActive] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [firstVisit, setFirstVisit] = useState(true)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const {
    playInterfaceSound,
    playLevelUpSound,
    playMatchSound,
    playWrongMatchSound,
    playGameOverSound,
    playIntroSound,
  } = useSoundEffects()

  // Play intro sound on first visit
  useEffect(() => {
    if (firstVisit) {
      playIntroSound()
      setFirstVisit(false)
    }
  }, [firstVisit, playIntroSound])

  // Timer logic
  useEffect(() => {
    if (gameActive && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (gameActive && timeLeft === 0) {
      // Game over
      setGameActive(false)
      setGameOver(true)
      playGameOverSound()
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [gameActive, timeLeft, playGameOverSound])

  // Check for game completion
  useEffect(() => {
    if (matches === cards.length / 2 && matches > 0) {
      setGameActive(false)
      toast("🎉 Congratulations! You've found all the matches! 🎈", {
        className: "bg-purple-900 text-purple-100 border-purple-700",
      })
    }
  }, [matches, cards.length])

  const handleCardClick = (clickedIndex: number) => {
    // Don't allow clicks if game is over or not active
    if (gameOver || !gameActive) return

    // Prevent clicking if already checking or card is already matched
    if (isChecking || cards[clickedIndex].isMatched) return
    // Prevent clicking if card is already flipped
    if (flippedIndexes.includes(clickedIndex)) return
    // Prevent clicking if two cards are already flipped
    if (flippedIndexes.length === 2) return

    // Add clicked card to flipped cards
    const newFlipped = [...flippedIndexes, clickedIndex]
    setFlippedIndexes(newFlipped)

    // If we now have two cards flipped, check for a match
    if (newFlipped.length === 2) {
      setIsChecking(true)
      const [firstIndex, secondIndex] = newFlipped
      const firstCard = cards[firstIndex]
      const secondCard = cards[secondIndex]

      if (firstCard.image === secondCard.image) {
        // Match found
        setTimeout(() => {
          // Play match sound
          playMatchSound()

          // Get the position of the matched card for the EXP popup
          const cardElement = document.getElementById(`card-${secondIndex}`)
          const rect = cardElement?.getBoundingClientRect()
          const position = rect
            ? {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
              }
            : { x: 0, y: 0 }

          setCards(
            cards.map((card, index) =>
              index === firstIndex || index === secondIndex ? { ...card, isMatched: true } : card,
            ),
          )
          setFlippedIndexes([])
          setMatches((m) => m + 1)

          // Add EXP and show popup
          const expGain = 50
          setExp((currentExp) => {
            const newExp = currentExp + expGain
            // Level up if exp reaches 250
            if (newExp >= 250) {
              setLevel((l) => l + 1)
              setShowLevelUp(true)
              playLevelUpSound()
              setTimeout(() => setShowLevelUp(false), 2000)
              return newExp - 250 // Keep remainder EXP
            }
            return newExp
          })

          // Show EXP gain popup
          setShowExpGain({ show: true, position })
          setTimeout(() => setShowExpGain({ show: false, position: { x: 0, y: 0 } }), 1000)

          setIsChecking(false)
        }, 500)
      } else {
        // No match - reset after delay
        setTimeout(() => {
          playWrongMatchSound()
          setFlippedIndexes([])
          setIsChecking(false)
        }, 1000)
      }
    }
  }

  const startGame = () => {
    playInterfaceSound()
    setCards(createCards())
    setFlippedIndexes([])
    setMatches(0)
    setIsChecking(false)
    setExp(0)
    setLevel(1)
    setTimeLeft(30)
    setGameActive(true)
    setGameOver(false)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 space-y-8 bg-gradient-to-br from-purple-950 via-indigo-950 to-slate-950">
      <div className="fixed top-4 left-0 right-0 flex flex-col items-center space-y-2 z-10">
        <div className="flex items-center space-x-2">
          <span className="text-white font-bold">Level {level}</span>
          <div className="w-64 h-4 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-400 to-yellow-500"
              initial={{ width: 0 }}
              animate={{ width: `${(exp / 250) * 100}%` }}
              transition={{ type: "spring", stiffness: 100 }}
            />
          </div>
          <span className="text-white text-sm">{exp}/250 EXP</span>
        </div>

        {gameActive && (
          <div className="flex items-center space-x-2 mt-2">
            <span className="text-white font-bold">Time:</span>
            <div className="w-64 h-4 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${timeLeft > 10 ? "bg-green-500" : "bg-red-500"}`}
                initial={{ width: "100%" }}
                animate={{ width: `${(timeLeft / 30) * 100}%` }}
                transition={{ type: "spring", stiffness: 100 }}
              />
            </div>
            <span className={`text-white text-sm ${timeLeft <= 10 ? "text-red-400 animate-pulse" : ""}`}>
              {timeLeft}s
            </span>
          </div>
        )}
      </div>

      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-indigo-300 text-transparent bg-clip-text">
          Crypto Memory Game
        </h1>
        <p className="text-indigo-200">
          Matches found: {matches} of {cards.length / 2}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 md:gap-6 p-6 rounded-xl bg-indigo-950/50 backdrop-blur-sm">
        {cards.map((card, index) => (
          <motion.div
            key={card.id}
            initial={{ rotateY: 0 }}
            animate={{
              rotateY: card.isMatched || flippedIndexes.includes(index) ? 180 : 0,
            }}
            transition={{ duration: 0.3 }}
            className="perspective-1000"
          >
            <Card
              id={`card-${index}`}
              className={`relative w-24 h-24 md:w-32 md:h-32 cursor-pointer transform-style-3d transition-all duration-300 ${
                card.isMatched
                  ? "bg-indigo-900/50 border-indigo-400/50"
                  : flippedIndexes.includes(index)
                    ? "bg-indigo-800/50 border-indigo-500/50"
                    : "bg-indigo-950 border-indigo-800 hover:border-indigo-600 hover:bg-indigo-900/80"
              } ${!gameActive || gameOver ? "opacity-70 pointer-events-none" : ""}`}
              onClick={() => handleCardClick(index)}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-indigo-500/5 to-white/5" />
              <AnimatePresence>
                {(card.isMatched || flippedIndexes.includes(index)) && (
                  <motion.div
                    initial={{ opacity: 0, rotateY: 180 }}
                    animate={{ opacity: 1, rotateY: 180 }}
                    exit={{ opacity: 0, rotateY: 180 }}
                    className="absolute inset-0 flex items-center justify-center backface-hidden"
                  >
                    <div className="relative w-16 h-16 md:w-20 md:h-20 flex items-center justify-center">
                      <Image
                        src={card.image || "/placeholder.svg"}
                        alt="Crypto logo"
                        width={80}
                        height={80}
                        className={`${card.isMatched ? "filter drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" : ""}`}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        ))}
      </div>

      {!gameActive && !gameOver && (
        <Button
          onClick={startGame}
          variant="outline"
          size="lg"
          className="bg-indigo-950 border-indigo-700 hover:bg-indigo-900 hover:border-indigo-500 text-indigo-200 hover:text-indigo-100"
        >
          Start Game
        </Button>
      )}

      {gameOver && (
        <>
          <motion.h2
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            className="text-5xl font-extrabold text-red-500 drop-shadow-[0_0_10px_rgba(220,38,38,0.7)]"
          >
            GAME OVER
          </motion.h2>
          <Button
            onClick={startGame}
            variant="outline"
            size="lg"
            className="bg-indigo-950 border-indigo-700 hover:bg-indigo-900 hover:border-indigo-500 text-indigo-200 hover:text-indigo-100"
          >
            Retry
          </Button>
        </>
      )}

      {gameActive && (
        <Button
          onClick={startGame}
          variant="outline"
          size="lg"
          className="bg-indigo-950 border-indigo-700 hover:bg-indigo-900 hover:border-indigo-500 text-indigo-200 hover:text-indigo-100"
        >
          Restart
        </Button>
      )}

      {/* EXP Gain Popup */}
      <AnimatePresence>
        {showExpGain.show && (
          <motion.div
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: 1, y: -50 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed text-xl font-bold text-yellow-300 z-20"
            style={{
              left: showExpGain.position.x,
              top: showExpGain.position.y,
              textShadow: "0 0 5px rgba(0,0,0,0.7)",
            }}
          >
            +50 EXP
          </motion.div>
        )}
      </AnimatePresence>

      {/* Level Up Animation */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 flex items-center justify-center z-30 pointer-events-none"
          >
            <motion.h1
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 2, -2, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "loop",
              }}
              className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 drop-shadow-[0_0_15px_rgba(251,191,36,0.7)]"
            >
              LEVEL UP!
            </motion.h1>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
