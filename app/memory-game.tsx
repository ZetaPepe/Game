"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import Image from "next/image"
import { useSoundEffects } from "./hooks/use-sound-effects"
import { BinaryBackground } from "./components/binary-background"
import {
  Clock,
  Coins,
  ShoppingBag,
  X,
  Snowflake,
  Search,
  Zap,
  ArrowLeftRight,
  Trophy,
  Timer,
  Award,
  Download,
  Lock,
  Volume2,
  VolumeX,
} from "lucide-react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faGithub, faTelegram, faTwitter } from "@fortawesome/free-brands-svg-icons"

type MemoryCard = {
  id: number
  image: string
  isMatched: boolean
  isHinted?: boolean
}

type PowerUp = {
  id: string
  name: string
  description: string
  cost: number
  iconType: string
}

type ActivePowerUp = {
  id: string
  name: string
  iconType: string
  timeLeft?: number
}

type RewardType = "freeze" | "hint" | "multiplier"

// Separate achievement data from UI components to avoid circular references
type AchievementData = {
  id: string
  name: string
  description: string
  iconType: string
  unlocked: boolean
  progress?: number
  total?: number
  nftImage: string
}

type AchievementPopup = {
  achievement: AchievementData
  show: boolean
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

// Helper function to get icon component based on type
const getIconComponent = (iconType: string) => {
  switch (iconType) {
    case "award":
      return <Award className="w-5 h-5" />
    case "zap":
      return <Zap className="w-5 h-5" />
    case "lock":
      return <Lock className="w-5 h-5" />
    case "timer":
      return <Timer className="w-5 h-5" />
    case "shopping-bag":
      return <ShoppingBag className="w-5 h-5" />
    case "coins":
      return <Coins className="w-5 h-5" />
    case "arrow-left-right":
      return <ArrowLeftRight className="w-5 h-5" />
    case "trophy":
      return <Trophy className="w-5 h-5" />
    case "snowflake":
      return <Snowflake className="w-5 h-5" />
    case "search":
      return <Search className="w-5 h-5" />
    default:
      return <Award className="w-5 h-5" />
  }
}

// Get smaller icon for active power-ups
const getSmallIconComponent = (iconType: string) => {
  switch (iconType) {
    case "snowflake":
      return <Snowflake className="w-4 h-4" />
    case "zap":
      return <Zap className="w-4 h-4" />
    case "search":
      return <Search className="w-4 h-4" />
    default:
      return <Zap className="w-4 h-4" />
  }
}

export default function MemoryGame() {
  // Use the sound effects hook
  const {
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
  } = useSoundEffects()

  const [cards, setCards] = useState<MemoryCard[]>(createCards())
  const [flippedIndexes, setFlippedIndexes] = useState<number[]>([])
  const [matches, setMatches] = useState(0)
  const [isChecking, setIsChecking] = useState(false)
  const [exp, setExp] = useState(0)
  const [coins, setCoins] = useState(0)
  const [level, setLevel] = useState(1)
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [showExpGain, setShowExpGain] = useState<{ show: boolean; position: { x: number; y: number } }>({
    show: false,
    position: { x: 0, y: 0 },
  })
  const [showCoinGain, setShowCoinGain] = useState<{ show: boolean; position: { x: number; y: number } }>({
    show: false,
    position: { x: 0, y: 0 },
  })
  const [timeLeft, setTimeLeft] = useState(15)
  const [gameActive, setGameActive] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [firstVisit, setFirstVisit] = useState(true)
  const [showUpgradesMenu, setShowUpgradesMenu] = useState(false)
  const [activePowerUps, setActivePowerUps] = useState<ActivePowerUp[]>([])
  const [ownedPowerUps, setOwnedPowerUps] = useState<string[]>([])
  const [isTimeFrozen, setIsTimeFrozen] = useState(false)
  const [expMultiplier, setExpMultiplier] = useState(1)
  const [coinMultiplier, setCoinMultiplier] = useState(1)
  const [stage, setStage] = useState(1)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [playerName, setPlayerName] = useState("")
  const [showNameInput, setShowNameInput] = useState(false)
  const [leaderboard, setLeaderboard] = useState<{ name: string; coins: number; stage: number; timeSpent: number }[]>(
    [],
  )
  const [gameCompleted, setGameCompleted] = useState(false)
  const [showBitcoinBox, setShowBitcoinBox] = useState(false)
  const [isBoxOpened, setIsBoxOpened] = useState(false)
  const [boxRewards, setBoxRewards] = useState<RewardType[]>([])
  const [stageTransitioning, setStageTransitioning] = useState(false)
  const [timeSpent, setTimeSpent] = useState(0)
  const [totalTimeSpent, setTotalTimeSpent] = useState(0)
  const [showAchievements, setShowAchievements] = useState(false)
  const [achievementPopup, setAchievementPopup] = useState<AchievementPopup>({
    achievement: {} as AchievementData,
    show: false,
  })
  const [showNftReward, setShowNftReward] = useState<{ show: boolean; achievement: AchievementData | null }>({
    show: false,
    achievement: null,
  })

  // Achievement tracking
  const [matchedCardsInRun, setMatchedCardsInRun] = useState(0)
  const [usedUpgradesInRun, setUsedUpgradesInRun] = useState(false)
  const [boxesUnlockedInRun, setBoxesUnlockedInRun] = useState(0)
  const [restartCount, setRestartCount] = useState(0)

  // Define achievements with string icon types instead of React components
  const defaultAchievements: AchievementData[] = [
    {
      id: "crypto-conqueror",
      name: "Crypto Conqueror",
      description: "Reach experience level 10",
      iconType: "award",
      unlocked: false,
      progress: 0,
      total: 10,
      nftImage:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Grab%20the%20Merit%2C%20then%20Chuckle%20as%20legends%20begin_20250324_054437_0000-4SdhlYoSW0G3ujHrLSMo0UoVTIsvvS.png",
    },
    {
      id: "block-buster",
      name: "Block Buster",
      description: "Match 32 cards in a single run",
      iconType: "zap",
      unlocked: false,
      progress: 0,
      total: 32,
      nftImage:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Grab%20the%20Merit%2C%20then%20Chuckle%20as%20legends%20begin_20250324_055707_0000-oqm9h04G0h7LgNsy0oPlxPKo90i5UW.png",
    },
    {
      id: "hodler",
      name: "The HODLer",
      description: "Beat the game without using any upgrades",
      iconType: "lock",
      unlocked: false,
      nftImage:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Grab%20the%20Merit%2C%20then%20Chuckle%20as%20legends%20begin_20250324_055511_0000-RO8pFo5dbvZ58YtZAbmq4tuYuJxplp.png",
    },
    {
      id: "quick-hands",
      name: "Quick Hands",
      description: "Beat the game in under 2 minutes",
      iconType: "timer",
      unlocked: false,
      nftImage:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Grab%20the%20Merit%2C%20then%20Chuckle%20as%20legends%20begin_20250324_054832_0000-GplE21JYzsdJNwfPe3YgMYEtSFPvSf.png",
    },
    {
      id: "miner",
      name: "The Miner",
      description: "Unlock 12 gift boxes from leveling up",
      iconType: "shopping-bag",
      unlocked: false,
      progress: 0,
      total: 12,
      nftImage:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Grab%20the%20Merit%2C%20then%20Chuckle%20as%20legends%20begin_20250324_055029_0000-mFRV9Z1Huw4XZq2jh9vxi8oLA0p4F1.png",
    },
    {
      id: "satoshis-shadow",
      name: "Satoshi's Shadow",
      description: "Have 320 coins at the end of the game",
      iconType: "coins",
      unlocked: false,
      progress: 0,
      total: 320,
      nftImage:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Grab%20the%20Merit%2C%20then%20Chuckle%20as%20legends%20begin_20250324_054631_0000-qqeW64KPA1OyqSorXywaLF6tRTXlTf.png",
    },
    {
      id: "weak-hands",
      name: "Weak Hands",
      description: "Restart or retry the game more than 50 times",
      iconType: "arrow-left-right",
      unlocked: false,
      progress: 0,
      total: 50,
      nftImage:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Grab%20the%20Merit%2C%20then%20Chuckle%20as%20legends%20begin_20250324_055231_0000-GTtMe3VzlKtJKe31HxcMCrgnDFd1N2.png",
    },
    {
      id: "collector",
      name: "The Collector",
      description: "Unlock all other achievements",
      iconType: "trophy",
      unlocked: false,
      nftImage:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Grab%20the%20Merit%2C%20then%20Chuckle%20as%20legends%20begin_20250324_055410_0000-j4OvYbm7JgDv1KxgKchvYi6kLqcihz.png",
    },
  ]

  const [achievements, setAchievements] = useState<AchievementData[]>(defaultAchievements)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const timeSpentRef = useRef<NodeJS.Timeout | null>(null)
  const powerUpTimersRef = useRef<{ [key: string]: NodeJS.Timeout | null }>({})
  const boxAudioRef = useRef<HTMLAudioElement | null>(null)
  const gameStateRef = useRef({
    gameActive: false,
    isTimeFrozen: false,
    showUpgradesMenu: false,
    showBitcoinBox: false,
    stageTransitioning: false,
  })

  // Update the game state ref to avoid stale closures
  useEffect(() => {
    gameStateRef.current = {
      gameActive,
      isTimeFrozen,
      showUpgradesMenu,
      showBitcoinBox,
      stageTransitioning,
    }
  }, [gameActive, isTimeFrozen, showUpgradesMenu, showBitcoinBox, stageTransitioning])

  const powerUps: PowerUp[] = [
    {
      id: "freeze",
      name: "Freeze Time",
      description: "Freezes the timer for 5 seconds",
      cost: 30,
      iconType: "snowflake",
    },
    {
      id: "hint",
      name: "Match Hint",
      description: "Reveals one matching pair",
      cost: 40,
      iconType: "search",
    },
    {
      id: "multiplier",
      name: "2x Rewards",
      description: "Doubles EXP and Coins for 10 seconds",
      cost: 50,
      iconType: "zap",
    },
  ]

  // Initialize box audio
  useEffect(() => {
    if (typeof window !== "undefined") {
      boxAudioRef.current = new Audio("/sounds/data-processing-droid.mp3")

      // Add error handler
      boxAudioRef.current.addEventListener("error", (e) => {
        console.warn("Error loading box audio:", (e.target as HTMLAudioElement).src)
      })
    }

    return () => {
      if (boxAudioRef.current) {
        boxAudioRef.current.pause()
        boxAudioRef.current = null
      }
    }
  }, [])

  // Load saved data from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        // Load leaderboard
        const savedLeaderboard = localStorage.getItem("satoshiMatchLeaderboard")
        if (savedLeaderboard) {
          setLeaderboard(JSON.parse(savedLeaderboard))
        }

        // Load achievements
        const savedAchievements = localStorage.getItem("satoshiMatchAchievements")
        if (savedAchievements) {
          setAchievements(JSON.parse(savedAchievements))
        }

        // Load restart count
        const savedRestartCount = localStorage.getItem("satoshiMatchRestartCount")
        if (savedRestartCount) {
          setRestartCount(Number.parseInt(savedRestartCount, 10))
        }
      } catch (e) {
        console.error("Failed to load saved data:", e)
      }
    }
  }, [])

  // Play intro sound on first visit - only after sounds are loaded
  useEffect(() => {
    if (firstVisit && soundsLoaded && soundsEnabled) {
      // Small delay to ensure browser is ready
      const timer = setTimeout(() => {
        playIntroSound()
        setFirstVisit(false)
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [firstVisit, playIntroSound, soundsLoaded, soundsEnabled])

  // Timer logic - now runs continuously unless frozen or showing bitcoin box
  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }

    // Only start a new timer if conditions are met
    if (gameActive && timeLeft > 0 && !isTimeFrozen && !showUpgradesMenu && !showBitcoinBox && !stageTransitioning) {
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
        timerRef.current = null
      }
    }
  }, [gameActive, timeLeft, isTimeFrozen, showUpgradesMenu, showBitcoinBox, stageTransitioning, playGameOverSound])

  // Time spent tracker
  useEffect(() => {
    // Clear any existing timer
    if (timeSpentRef.current) {
      clearInterval(timeSpentRef.current)
      timeSpentRef.current = null
    }

    // Only start a new timer if conditions are met
    if (gameActive && !showUpgradesMenu && !showBitcoinBox && !stageTransitioning) {
      timeSpentRef.current = setInterval(() => {
        setTimeSpent((prev) => prev + 1)
        setTotalTimeSpent((prev) => prev + 1)
      }, 1000)
    }

    return () => {
      if (timeSpentRef.current) {
        clearInterval(timeSpentRef.current)
        timeSpentRef.current = null
      }
    }
  }, [gameActive, showUpgradesMenu, showBitcoinBox, stageTransitioning])

  // Power-up timers
  useEffect(() => {
    // Clean up all existing timers
    Object.values(powerUpTimersRef.current).forEach((timer) => {
      if (timer) clearTimeout(timer)
    })
    powerUpTimersRef.current = {}

    // Process active power-ups
    activePowerUps.forEach((powerUp) => {
      if (
        powerUp.timeLeft &&
        powerUp.timeLeft > 0 &&
        gameActive &&
        !showUpgradesMenu &&
        !showBitcoinBox &&
        !stageTransitioning
      ) {
        const timerId = setTimeout(() => {
          setActivePowerUps((current) =>
            current.map((p) => (p.id === powerUp.id && p.timeLeft ? { ...p, timeLeft: p.timeLeft - 1 } : p)),
          )
        }, 1000)

        powerUpTimersRef.current[powerUp.id] = timerId
      }
    })

    // Check for expired power-ups
    const expiredPowerUps = activePowerUps.filter((powerUp) => powerUp.timeLeft === 0)
    if (expiredPowerUps.length > 0) {
      // Handle power-up expirations
      expiredPowerUps.forEach((powerUp) => {
        if (powerUp.id === "freeze") {
          setIsTimeFrozen(false)
        } else if (powerUp.id === "multiplier") {
          setExpMultiplier(1)
          setCoinMultiplier(1)
        }
      })

      // Remove expired power-ups
      setActivePowerUps((current) => current.filter((p) => p.timeLeft !== 0))
    }

    return () => {
      // Clean up all timers on unmount
      Object.values(powerUpTimersRef.current).forEach((timer) => {
        if (timer) clearTimeout(timer)
      })
      powerUpTimersRef.current = {}
    }
  }, [activePowerUps, gameActive, showUpgradesMenu, showBitcoinBox, stageTransitioning])

  // Check for game completion
  useEffect(() => {
    if (matches === cards.length / 2 && matches > 0 && !stageTransitioning) {
      // Mark as transitioning to prevent multiple triggers
      setStageTransitioning(true)

      // Short delay before advancing
      setTimeout(() => {
        advanceToNextStage()
      }, 1500)
    }
  }, [matches, cards.length, stageTransitioning])

  // Achievement popup timer
  useEffect(() => {
    if (achievementPopup.show) {
      const timer = setTimeout(() => {
        setAchievementPopup((prev) => ({ ...prev, show: false }))
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [achievementPopup.show])

  // Check for achievements
  useEffect(() => {
    // Only check if game is active or just completed
    if (!gameActive && !gameCompleted) return

    const updatedAchievements = [...achievements]
    let achievementUnlocked = false
    let unlockedAchievement: AchievementData | null = null

    // Crypto Conqueror: Reach level 10
    const cryptoConquerorIndex = updatedAchievements.findIndex((a) => a.id === "crypto-conqueror")
    if (cryptoConquerorIndex >= 0 && !updatedAchievements[cryptoConquerorIndex].unlocked) {
      updatedAchievements[cryptoConquerorIndex].progress = level
      if (level >= 10) {
        updatedAchievements[cryptoConquerorIndex].unlocked = true
        achievementUnlocked = true
        unlockedAchievement = updatedAchievements[cryptoConquerorIndex]
      }
    }

    // Block Buster: Match 32 cards in a single run
    const blockBusterIndex = updatedAchievements.findIndex((a) => a.id === "block-buster")
    if (blockBusterIndex >= 0 && !updatedAchievements[blockBusterIndex].unlocked) {
      updatedAchievements[blockBusterIndex].progress = matchedCardsInRun
      if (matchedCardsInRun >= 32) {
        updatedAchievements[blockBusterIndex].unlocked = true
        achievementUnlocked = true
        unlockedAchievement = updatedAchievements[blockBusterIndex]
      }
    }

    // The HODLer: Beat the game without using upgrades
    const hodlerIndex = updatedAchievements.findIndex((a) => a.id === "hodler")
    if (
      hodlerIndex >= 0 &&
      !updatedAchievements[hodlerIndex].unlocked &&
      gameCompleted &&
      !usedUpgradesInRun &&
      stage === 6
    ) {
      updatedAchievements[hodlerIndex].unlocked = true
      achievementUnlocked = true
      unlockedAchievement = updatedAchievements[hodlerIndex]
    }

    // Quick Hands: Beat the game in under 2 minutes
    const quickHandsIndex = updatedAchievements.findIndex((a) => a.id === "quick-hands")
    if (
      quickHandsIndex >= 0 &&
      !updatedAchievements[quickHandsIndex].unlocked &&
      gameCompleted &&
      timeSpent <= 120 &&
      stage === 6
    ) {
      updatedAchievements[quickHandsIndex].unlocked = true
      achievementUnlocked = true
      unlockedAchievement = updatedAchievements[quickHandsIndex]
    }

    // The Miner: Unlock 12 gift boxes
    const minerIndex = updatedAchievements.findIndex((a) => a.id === "miner")
    if (minerIndex >= 0 && !updatedAchievements[minerIndex].unlocked) {
      updatedAchievements[minerIndex].progress = boxesUnlockedInRun
      if (boxesUnlockedInRun >= 12) {
        updatedAchievements[minerIndex].unlocked = true
        achievementUnlocked = true
        unlockedAchievement = updatedAchievements[minerIndex]
      }
    }

    // Satoshi's Shadow: Have 320 coins at the end
    const satoshiShadowIndex = updatedAchievements.findIndex((a) => a.id === "satoshis-shadow")
    if (satoshiShadowIndex >= 0 && !updatedAchievements[satoshiShadowIndex].unlocked) {
      updatedAchievements[satoshiShadowIndex].progress = coins
      if (gameCompleted && coins >= 320) {
        updatedAchievements[satoshiShadowIndex].unlocked = true
        achievementUnlocked = true
        unlockedAchievement = updatedAchievements[satoshiShadowIndex]
      }
    }

    // Weak Hands: Restart 50+ times
    const weakHandsIndex = updatedAchievements.findIndex((a) => a.id === "weak-hands")
    if (weakHandsIndex >= 0 && !updatedAchievements[weakHandsIndex].unlocked) {
      updatedAchievements[weakHandsIndex].progress = restartCount
      if (restartCount >= 50) {
        updatedAchievements[weakHandsIndex].unlocked = true
        achievementUnlocked = true
        unlockedAchievement = updatedAchievements[weakHandsIndex]
      }
    }

    // The Collector: Get all other achievements
    const collectorIndex = updatedAchievements.findIndex((a) => a.id === "collector")
    if (collectorIndex >= 0 && !updatedAchievements[collectorIndex].unlocked) {
      const allOtherAchievementsUnlocked = updatedAchievements
        .filter((a) => a.id !== "collector")
        .every((a) => a.unlocked)

      if (allOtherAchievementsUnlocked) {
        updatedAchievements[collectorIndex].unlocked = true
        achievementUnlocked = true
        unlockedAchievement = updatedAchievements[collectorIndex]
      }
    }

    // If an achievement was unlocked, show popup and save
    if (achievementUnlocked && unlockedAchievement) {
      // Play achievement sound
      playAchievementSound()

      setAchievementPopup({
        achievement: unlockedAchievement,
        show: true,
      })

      // Save achievements to localStorage - serialize without circular references
      try {
        localStorage.setItem("satoshiMatchAchievements", JSON.stringify(updatedAchievements))
      } catch (e) {
        console.error("Failed to save achievements:", e)
      }
    }

    // Update achievements state
    setAchievements(updatedAchievements)
  }, [
    achievements,
    level,
    matchedCardsInRun,
    usedUpgradesInRun,
    boxesUnlockedInRun,
    restartCount,
    coins,
    gameCompleted,
    gameActive,
    stage,
    timeSpent,
    playAchievementSound,
  ])

  // Play atmosphere sound on game start
  useEffect(() => {
    if (soundsLoaded && soundsEnabled) {
      playAtmosphereSound()
    }
  }, [soundsLoaded, soundsEnabled, playAtmosphereSound])

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const handleCardClick = (clickedIndex: number) => {
    // Don't allow clicks if game is over or not active
    if (gameOver || !gameActive || showUpgradesMenu || showBitcoinBox || stageTransitioning) return

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
          if (soundsEnabled) playMatchSound()

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
              index === firstIndex || index === secondIndex ? { ...card, isMatched: true, isHinted: false } : card,
            ),
          )
          setFlippedIndexes([])
          setMatches((m) => m + 1)

          // Increment matched cards in run (for Block Buster achievement)
          setMatchedCardsInRun((prev) => prev + 1)

          // Add time bonus for correct match
          setTimeLeft((time) => time + 1)

          // Add EXP and show popup
          const expGain = 50 * expMultiplier
          setExp((currentExp) => {
            const newExp = currentExp + expGain
            // Level up if exp reaches 250
            if (newExp >= 250) {
              const newLevel = level + 1
              setLevel(newLevel)
              setShowLevelUp(true)
              if (soundsEnabled) playLevelUpSound()

              // Show Bitcoin Box after a short delay
              setTimeout(() => {
                setShowLevelUp(false)
                showBitcoinBoxReward(newLevel)
              }, 2000)

              return newExp - 250 // Keep remainder EXP
            }
            return newExp
          })

          // Add coins and show popup
          const coinGain = 10 * coinMultiplier
          setCoins((current) => current + coinGain)

          // Show EXP gain popup
          setShowExpGain({ show: true, position })
          setTimeout(() => setShowExpGain({ show: false, position: { x: 0, y: 0 } }), 1000)

          // Show coin gain popup (slightly offset)
          setShowCoinGain({
            show: true,
            position: {
              x: position.x + 20,
              y: position.y + 20,
            },
          })
          setTimeout(() => setShowCoinGain({ show: false, position: { x: 0, y: 0 } }), 1000)

          setIsChecking(false)
        }, 500)
      } else {
        // No match - reset after delay
        setTimeout(() => {
          if (soundsEnabled) playWrongMatchSound()
          setFlippedIndexes([])
          setIsChecking(false)
        }, 1000)
      }
    }
  }

  const startGame = () => {
    if (soundsEnabled) playInterfaceSound()
    setCards(createCards())
    setFlippedIndexes([])
    setMatches(0)
    setIsChecking(false)
    setExp(0) // Reset EXP
    setCoins(0) // Reset coins
    setLevel(1) // Reset level
    setTimeLeft(15)
    setGameActive(true)
    setGameOver(false)
    setActivePowerUps([])
    setOwnedPowerUps([]) // Reset owned power-ups
    setIsTimeFrozen(false)
    setExpMultiplier(1)
    setCoinMultiplier(1)
    setStage(1) // Reset stage
    setGameCompleted(false)
    setStageTransitioning(false)
    setTimeSpent(0) // Reset time spent

    // Reset achievement tracking for this run
    setMatchedCardsInRun(0)
    setUsedUpgradesInRun(false)
    setBoxesUnlockedInRun(0)

    // Increment restart count and save
    const newRestartCount = restartCount + 1
    setRestartCount(newRestartCount)
    try {
      localStorage.setItem("satoshiMatchRestartCount", newRestartCount.toString())
    } catch (e) {
      console.error("Failed to save restart count:", e)
    }

    // Clear all power-up timers
    Object.values(powerUpTimersRef.current).forEach((timer) => {
      if (timer) clearTimeout(timer)
    })
    powerUpTimersRef.current = {}
  }

  const toggleUpgradesMenu = () => {
    if (soundsEnabled) playInterfaceSound()
    setShowUpgradesMenu(!showUpgradesMenu)
  }

  const toggleAchievementsMenu = () => {
    if (soundsEnabled) playInterfaceSound()
    setShowAchievements(!showAchievements)
  }

  const purchasePowerUp = (powerUpId: string) => {
    const powerUp = powerUps.find((p) => p.id === powerUpId)
    if (!powerUp) return

    if (coins >= powerUp.cost) {
      if (soundsEnabled) playInterfaceSound()
      setCoins((current) => current - powerUp.cost)
      setOwnedPowerUps((current) => [...current, powerUpId])

      toast(`Purchased ${powerUp.name}!`, {
        className: "bg-indigo-900 text-indigo-100 border-indigo-700",
      })
    } else {
      toast(`Not enough coins! Need ${powerUp.cost - coins} more.`, {
        className: "bg-red-900 text-red-100 border-red-700",
      })
    }
  }

  const activatePowerUp = (powerUpId: string) => {
    if (soundsEnabled) playInterfaceSound()

    // Mark that upgrades were used in this run (for HODLer achievement)
    setUsedUpgradesInRun(true)

    // Remove from owned
    setOwnedPowerUps((current) => current.filter((id) => id !== powerUpId))

    // Apply power-up effect
    if (powerUpId === "freeze") {
      setIsTimeFrozen(true)
      setActivePowerUps((current) => [
        ...current,
        {
          id: "freeze",
          name: "Time Frozen",
          iconType: "snowflake",
          timeLeft: 5,
        },
      ])

      toast("Time frozen for 5 seconds!", {
        className: "bg-blue-900 text-blue-100 border-blue-700",
      })
    } else if (powerUpId === "hint") {
      // Find a pair that's not matched yet
      const unmatched = cards.filter((card) => !card.isMatched)
      if (unmatched.length >= 2) {
        const image = unmatched[0].image
        const pairIndices = cards
          .map((card, index) => ({ card, index }))
          .filter((item) => item.card.image === image && !item.card.isMatched)
          .map((item) => item.index)
          .slice(0, 2)

        if (pairIndices.length === 2) {
          setCards(cards.map((card, index) => (pairIndices.includes(index) ? { ...card, isHinted: true } : card)))

          toast("Match hint revealed!", {
            className: "bg-purple-900 text-purple-100 border-purple-700",
          })
        }
      }
    } else if (powerUpId === "multiplier") {
      setExpMultiplier(2)
      setCoinMultiplier(2)
      setActivePowerUps((current) => [
        ...current,
        {
          id: "multiplier",
          name: "2x Rewards",
          iconType: "zap",
          timeLeft: 10,
        },
      ])

      toast("2x rewards active for 10 seconds!", {
        className: "bg-yellow-900 text-yellow-100 border-yellow-700",
      })
    }
  }

  const advanceToNextStage = () => {
    const remainingTime = timeLeft

    if (stage < 6) {
      // Advance to next stage
      const nextStage = stage + 1
      setStage(nextStage)
      setCards(createCards())
      setFlippedIndexes([])
      setMatches(0)
      setIsChecking(false)
      setTimeLeft(15 + remainingTime) // Add remaining time to next stage
      setGameActive(true) // Ensure game is active for next stage
      setStageTransitioning(false) // Reset transitioning state

      toast(`Stage ${stage} completed! Moving to Stage ${nextStage}`, {
        className: "bg-green-900 text-green-100 border-green-700",
      })
    } else {
      // Game completed - show final screen
      setGameActive(false)
      setGameCompleted(true)
      setShowNameInput(true)
      setStageTransitioning(false)

      toast("🎊 Congratulations! You've completed all stages! 🎊", {
        className: "bg-purple-900 text-purple-100 border-purple-700",
      })
    }
  }

  const saveScore = () => {
    if (!playerName.trim()) {
      toast("Please enter your name", {
        className: "bg-red-900 text-red-100 border-red-700",
      })
      return
    }

    const newScore = {
      name: playerName,
      coins,
      stage: 6,
      timeSpent: totalTimeSpent,
    }

    const newLeaderboard = [...leaderboard, newScore].sort((a, b) => b.coins - a.coins).slice(0, 10) // Keep only top 10 scores

    setLeaderboard(newLeaderboard)
    try {
      localStorage.setItem("satoshiMatchLeaderboard", JSON.stringify(newLeaderboard))
    } catch (e) {
      console.error("Failed to save leaderboard:", e)
    }
    setShowNameInput(false)
    setShowLeaderboard(true)

    toast("Your score has been saved to the leaderboard!", {
      className: "bg-green-900 text-green-100 border-green-700",
    })
  }

  const showBitcoinBoxReward = (newLevel: number) => {
    // Increment boxes unlocked (for Miner achievement)
    setBoxesUnlockedInRun((prev) => prev + 1)

    // Determine number of rewards based on level
    let numRewards = 1
    if (newLevel === 5 || newLevel === 10) {
      numRewards = 3
    }

    // Generate random rewards
    const rewardTypes: RewardType[] = ["freeze", "hint", "multiplier"]
    const rewards: RewardType[] = []

    for (let i = 0; i < numRewards; i++) {
      const randomIndex = Math.floor(Math.random() * rewardTypes.length)
      rewards.push(rewardTypes[randomIndex])
    }

    setBoxRewards(rewards)
    setIsBoxOpened(false)
    setShowBitcoinBox(true)
  }

  const openBitcoinBox = () => {
    // Play box opening sound
    if (boxAudioRef.current) {
      try {
        boxAudioRef.current.currentTime = 0
        boxAudioRef.current.play().catch((err) => {
          console.warn("Error playing box audio:", err)
          // Continue with animation even if sound fails
        })
      } catch (err) {
        console.warn("Error playing box audio:", err)
        // Continue with animation even if sound fails
      }
    }

    setIsBoxOpened(true)

    // Add rewards to owned power-ups after a delay
    setTimeout(() => {
      setOwnedPowerUps((current) => [...current, ...boxRewards])

      // Show toast with rewards
      const rewardNames = boxRewards.map((id) => {
        const powerUp = powerUps.find((p) => p.id === id)
        return powerUp ? powerUp.name : id
      })

      toast(`You received: ${rewardNames.join(", ")}`, {
        className: "bg-yellow-900 text-yellow-100 border-yellow-700",
      })

      // Close box after showing rewards
      setTimeout(() => {
        setShowBitcoinBox(false)
      }, 2000)
    }, 1500)
  }

  const viewNftReward = (achievement: AchievementData) => {
    if (soundsEnabled) playInterfaceSound()
    setShowNftReward({
      show: true,
      achievement,
    })
  }

  const downloadNft = (achievement: AchievementData) => {
    // Create a temporary link element
    const link = document.createElement("a")
    link.href = achievement.nftImage
    link.download = `${achievement.id}-nft.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast("NFT downloaded successfully!", {
      className: "bg-green-900 text-green-100 border-green-700",
    })
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 space-y-8 bg-gradient-to-br from-purple-950 via-indigo-950 to-slate-950">
      <BinaryBackground count={60} opacity={0.08} />
      <div className="fixed top-4 left-0 right-0 flex flex-col items-center space-y-4 z-10 px-4">
        <div className="flex items-center justify-center w-full max-w-xs sm:max-w-md">
          <div className="flex flex-col items-center space-y-1 w-full">
            <div className="flex items-center justify-between w-full">
              <span className="text-white font-bold text-sm sm:text-base">Level {level}</span>
              <span className="text-white text-xs sm:text-sm">{exp}/250 EXP</span>
            </div>
            <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-400 to-yellow-500"
                initial={{ width: 0 }}
                animate={{ width: `${(exp / 250) * 100}%` }}
                transition={{ type: "spring", stiffness: 100 }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center w-full max-w-xs sm:max-w-md">
          <div className="flex flex-col items-center space-y-1 w-full">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center">
                <Coins className="w-4 h-4 text-yellow-400 mr-1" />
                <span className="text-yellow-300 font-bold text-sm sm:text-base">{coins}</span>
              </div>
              {gameActive && (
                <div className="flex items-center">
                  <Clock className="w-4 h-4 text-white mr-1" />
                  <span
                    className={`text-white text-xs sm:text-sm ${timeLeft <= 5 ? "text-red-400 animate-pulse" : ""}`}
                  >
                    {timeLeft}s
                  </span>
                </div>
              )}
            </div>
            {gameActive && (
              <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${timeLeft > 5 ? "bg-green-500" : "bg-red-500"}`}
                  initial={{ width: "100%" }}
                  animate={{ width: `${(timeLeft / 15) * 100}%` }}
                  transition={{ type: "spring", stiffness: 100 }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Active Power-ups */}
        {activePowerUps.length > 0 && (
          <div className="flex items-center space-x-2 mt-1">
            {activePowerUps.map((powerUp) => (
              <div key={powerUp.id} className="flex items-center bg-indigo-900/70 px-2 py-1 rounded-full text-xs">
                {getSmallIconComponent(powerUp.iconType)}
                <span className="ml-1 text-white">{powerUp.timeLeft}s</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-center space-y-2 mt-32 sm:mt-36">
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-300 text-transparent bg-clip-text">
          Satoshi Match
        </h1>
        <p className="text-indigo-200 text-sm sm:text-base">
          Matches: {matches} / {cards.length / 2}
        </p>
        <p className="text-indigo-200 text-sm sm:text-base mt-1">Stage: {stage}/6</p>
        <p className="text-indigo-200 text-sm sm:text-base mt-1 bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-300 text-transparent bg-clip-text">
          CA：6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN
        </p>
      </div>

      {/* Owned Power-ups */}
      {gameActive && ownedPowerUps.length > 0 && (
        <div className="flex justify-center space-x-2 mb-2">
          {ownedPowerUps.map((powerUpId, index) => {
            const powerUp = powerUps.find((p) => p.id === powerUpId)
            if (!powerUp) return null

            return (
              <Button
                key={`${powerUpId}-${index}`}
                onClick={() => activatePowerUp(powerUpId)}
                className="bg-indigo-800 hover:bg-indigo-700 text-white p-2 h-auto"
                size="sm"
              >
                {getIconComponent(powerUp.iconType)}
                <span className="ml-1 text-xs">{powerUp.name}</span>
              </Button>
            )
          })}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 sm:gap-4 md:gap-6 p-4 sm:p-6 rounded-xl bg-indigo-950/50 backdrop-blur-sm">
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
              className={`relative w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 cursor-pointer transform-style-3d transition-all duration-300 ${
                card.isMatched
                  ? "bg-indigo-900/50 border-indigo-400/50"
                  : flippedIndexes.includes(index)
                    ? "bg-indigo-800/50 border-indigo-500/50"
                    : card.isHinted
                      ? "bg-purple-900/70 border-purple-500 animate-pulse"
                      : "bg-indigo-950 border-indigo-800 hover:border-indigo-600 hover:bg-indigo-900/80"
              } ${!gameActive || gameOver || showUpgradesMenu || showBitcoinBox ? "opacity-70 pointer-events-none" : ""}`}
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
                    <div className="relative w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 flex items-center justify-center">
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

      {/* Time Spent Counter - moved here */}
      <div className="flex items-center bg-indigo-900/70 px-4 py-2 rounded-full mb-2">
        <Timer className="w-5 h-5 text-indigo-200 mr-2" />
        <span className="text-indigo-200 text-sm sm:text-base font-medium">Time Spent: {formatTime(timeSpent)}</span>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {!gameActive && !gameOver && !gameCompleted && (
          <Button
            onClick={startGame}
            variant="outline"
            size="lg"
            className="bg-indigo-950 border-indigo-700 hover:bg-indigo-900 hover:border-indigo-500 text-indigo-200 hover:text-indigo-100"
          >
            Start Game
          </Button>
        )}

        {gameActive && (
          <>
            <Button
              onClick={toggleUpgradesMenu}
              variant="outline"
              size="lg"
              className="bg-indigo-950 border-indigo-700 hover:bg-indigo-900 hover:border-indigo-500 text-indigo-200 hover:text-indigo-100"
            >
              <ShoppingBag className="w-5 h-5 mr-2" />
              Upgrades
            </Button>

            <Button
              onClick={startGame}
              variant="outline"
              size="lg"
              className="bg-indigo-950 border-indigo-700 hover:bg-indigo-900 hover:border-indigo-500 text-indigo-200 hover:text-indigo-100"
            >
              <ArrowLeftRight className="w-5 h-5 mr-2" />
              Restart
            </Button>
          </>
        )}

        {gameOver && (
          <Button
            onClick={startGame}
            variant="outline"
            size="lg"
            className="bg-indigo-950 border-indigo-700 hover:bg-indigo-900 hover:border-indigo-500 text-indigo-200 hover:text-indigo-100"
          >
            Retry
          </Button>
        )}

        <Button
          onClick={toggleAchievementsMenu}
          variant="outline"
          size="lg"
          className="bg-indigo-950 border-indigo-700 hover:bg-indigo-900 hover:border-indigo-500 text-indigo-200 hover:text-indigo-100"
        >
          <Award className="w-5 h-5 mr-2" />
          Achievements
        </Button>
        <Button
          onClick={toggleSounds}
          variant="outline"
          size="lg"
          className="bg-indigo-950 border-indigo-700 hover:bg-indigo-900 hover:border-indigo-500 text-indigo-200 hover:text-indigo-100"
        >
          {soundsEnabled ? (
            <>
              <Volume2 className="w-5 h-5 mr-2" />
              Sound On
            </>
          ) : (
            <>
              <VolumeX className="w-5 h-5 mr-2" />
              Sound Off
            </>
          )}
        </Button>
      </div>

      {/* Achievement Popup */}
      <AnimatePresence>
        {achievementPopup.show && (
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed top-20 right-4 z-50 bg-indigo-900/90 border border-indigo-700 rounded-lg p-3 shadow-lg max-w-xs"
          >
            <div className="flex items-center space-x-3">
              <div className="bg-yellow-500 p-2 rounded-lg">
                {getIconComponent(achievementPopup.achievement.iconType)}
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Achievement Unlocked!</h3>
                <p className="text-indigo-200 text-xs">{achievementPopup.achievement.name}</p>
              </div>
            </div>
            <p className="text-indigo-300 text-xs mt-2">{achievementPopup.achievement.description}</p>
            <Button
              onClick={() => viewNftReward(achievementPopup.achievement)}
              className="mt-2 w-full bg-indigo-800 hover:bg-indigo-700 text-white"
              size="sm"
            >
              <Award className="w-4 h-4 mr-1" />
              View Reward
            </Button>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 5 }}
              className="h-1 bg-indigo-600 mt-2 rounded-full"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upgrades Menu Modal */}
      <AnimatePresence>
        {showUpgradesMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-indigo-950 border border-indigo-800 rounded-xl p-6 max-w-md w-full"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-indigo-200">Power-ups</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleUpgradesMenu}
                  className="text-indigo-300 hover:text-white hover:bg-indigo-900/50"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex items-center mb-6">
                <Coins className="w-5 h-5 text-yellow-400 mr-2" />
                <span className="text-yellow-300 font-bold">{coins} Coins</span>
              </div>

              <div className="space-y-4">
                {powerUps.map((powerUp) => (
                  <div key={powerUp.id} className="bg-indigo-900/50 border border-indigo-700 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="bg-indigo-800 p-2 rounded-lg mr-3">{getIconComponent(powerUp.iconType)}</div>
                        <div>
                          <h3 className="font-bold text-white">{powerUp.name}</h3>
                          <p className="text-indigo-300 text-sm">{powerUp.description}</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => purchasePowerUp(powerUp.id)}
                        disabled={coins < powerUp.cost}
                        className={`ml-2 ${
                          coins >= powerUp.cost
                            ? "bg-yellow-600 hover:bg-yellow-500 text-white"
                            : "bg-gray-700 text-gray-300"
                        }`}
                        size="sm"
                      >
                        <Coins className="w-4 h-4 mr-1" />
                        {powerUp.cost}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Achievements Menu Modal */}
      <AnimatePresence>
        {showAchievements && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-indigo-950 border border-indigo-800 rounded-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4 sticky top-0 bg-indigo-950 pb-2">
                <h2 className="text-2xl font-bold text-indigo-200">Achievements</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleAchievementsMenu}
                  className="text-indigo-300 hover:text-white hover:bg-indigo-900/50"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-4">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`${
                      achievement.unlocked ? "bg-indigo-900/50 border-indigo-700" : "bg-gray-800/50 border-gray-700"
                    } border rounded-lg p-4`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div
                          className={`${achievement.unlocked ? "bg-yellow-600" : "bg-gray-700"} p-2 rounded-lg mr-3`}
                        >
                          {achievement.unlocked ? getIconComponent(achievement.iconType) : <Lock className="w-5 h-5" />}
                        </div>
                        <div>
                          <h3 className={`font-bold ${achievement.unlocked ? "text-white" : "text-gray-400"}`}>
                            {achievement.name}
                          </h3>
                          <p className={`text-sm ${achievement.unlocked ? "text-indigo-300" : "text-gray-500"}`}>
                            {achievement.description}
                          </p>
                        </div>
                      </div>

                      {achievement.unlocked ? (
                        <Button
                          onClick={() => viewNftReward(achievement)}
                          className="ml-2 bg-indigo-800 hover:bg-indigo-700 text-white"
                          size="sm"
                        >
                          <Award className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      ) : achievement.total ? (
                        <div className="text-xs text-gray-400">
                          {achievement.progress || 0}/{achievement.total}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400">Locked</div>
                      )}
                    </div>

                    {achievement.total && !achievement.unlocked && (
                      <div className="mt-2 w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-700"
                          style={{ width: `${((achievement.progress || 0) / achievement.total) * 100}%` }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NFT Reward Modal */}
      <AnimatePresence>
        {showNftReward.show && showNftReward.achievement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-indigo-950 border border-indigo-800 rounded-xl p-6 max-w-md w-full text-center"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-indigo-200">Achievement NFT</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowNftReward({ show: false, achievement: null })}
                  className="text-indigo-300 hover:text-white hover:bg-indigo-900/50"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="mb-4">
                <h3 className="text-xl font-bold text-yellow-400 mb-2">{showNftReward.achievement.name}</h3>
                <p className="text-indigo-300">{showNftReward.achievement.description}</p>
              </div>

              <div className="relative w-64 h-64 mx-auto mb-6 bg-indigo-900/50 rounded-lg overflow-hidden">
                <Image
                  src={showNftReward.achievement.nftImage || "/placeholder.svg"}
                  alt={showNftReward.achievement.name}
                  width={300}
                  height={300}
                  className="object-contain"
                />
              </div>

              <Button
                onClick={() => downloadNft(showNftReward.achievement)}
                className="bg-yellow-600 hover:bg-yellow-500 text-white"
              >
                <Download className="w-5 h-5 mr-2" />
                Download NFT
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bitcoin Box Modal */}
      <AnimatePresence>
        {showBitcoinBox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-indigo-950 border border-indigo-800 rounded-xl p-6 max-w-md w-full text-center"
            >
              <motion.h2
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 mb-6"
              >
                YOU EARNED A BITCOIN BOX!
              </motion.h2>

              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{
                  scale: isBoxOpened ? 1.1 : [0.9, 1, 0.95, 1],
                  opacity: 1,
                  rotate: isBoxOpened ? 0 : [-2, 2, -1, 1, 0],
                }}
                transition={{
                  duration: 0.5,
                  repeat: isBoxOpened ? 0 : Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                }}
                onClick={!isBoxOpened ? openBitcoinBox : undefined}
                className={`relative mx-auto w-48 h-48 ${!isBoxOpened ? "cursor-pointer" : ""}`}
              >
                <Image
                  src={isBoxOpened ? "/images/opened-btc-box.png" : "/images/btc-box.png"}
                  alt={isBoxOpened ? "Opened Bitcoin Box" : "Bitcoin Box"}
                  width={200}
                  height={200}
                  className="object-contain"
                />

                {!isBoxOpened && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.5, 1] }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" }}
                    className="absolute inset-0 flex items-center justify-center text-white font-bold"
                  >
                    Click to Open
                  </motion.div>
                )}
              </motion.div>

              {isBoxOpened && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-6 text-indigo-200"
                >
                  <p className="mb-2">
                    You received {boxRewards.length} power-up{boxRewards.length > 1 ? "s" : ""}!
                  </p>
                  <div className="flex justify-center space-x-3 mt-4">
                    {boxRewards.map((reward, index) => {
                      const powerUp = powerUps.find((p) => p.id === reward)
                      if (!powerUp) return null

                      return (
                        <motion.div
                          key={`reward-${index}`}
                          initial={{ scale: 0, rotate: -10 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ delay: 0.7 + index * 0.2 }}
                          className="bg-indigo-800 p-3 rounded-lg"
                        >
                          {getIconComponent(powerUp.iconType)}
                        </motion.div>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {(gameOver || gameCompleted) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-indigo-950 border border-indigo-800 rounded-xl p-6 max-w-md w-full text-center"
          >
            {gameOver && (
              <>
                <motion.h2
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  className="text-4xl sm:text-5xl font-extrabold text-red-500 drop-shadow-[0_0_10px_rgba(220,38,38,0.7)] mb-6"
                >
                  GAME OVER
                </motion.h2>
                <p className="text-indigo-200 mb-2">You reached Stage {stage}</p>
                <p className="text-indigo-200 mb-6">Total Time: {formatTime(totalTimeSpent)}</p>
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

            {gameCompleted && showNameInput && (
              <>
                <motion.h2
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 drop-shadow-[0_0_15px_rgba(251,191,36,0.7)] mb-6"
                >
                  Congratulations! 🎊
                </motion.h2>
                <p className="text-indigo-200 mb-2">You completed all 6 stages!</p>
                <p className="text-indigo-200 mb-4">Total Time: {formatTime(totalTimeSpent)}</p>
                <div className="flex items-center justify-center mb-4">
                  <Coins className="w-6 h-6 text-yellow-400 mr-2" />
                  <span className="text-yellow-300 font-bold text-xl">{coins} Coins</span>
                </div>
                <div className="mb-6">
                  <p className="text-indigo-200 mb-2">Enter your name for the leaderboard:</p>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    maxLength={15}
                    className="w-full p-2 bg-indigo-900 border border-indigo-700 rounded text-white mb-2"
                    placeholder="Your name"
                  />
                  <Button onClick={saveScore} className="w-full bg-yellow-600 hover:bg-yellow-500 text-white">
                    Save Score
                  </Button>
                </div>
                <Button
                  onClick={startGame}
                  variant="outline"
                  className="bg-indigo-950 border-indigo-700 hover:bg-indigo-900 hover:border-indigo-500 text-indigo-200 hover:text-indigo-100"
                >
                  Play Again
                </Button>
              </>
            )}

            {gameCompleted && !showNameInput && (
              <>
                <motion.h2
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 mb-6"
                >
                  Leaderboard
                </motion.h2>
                <div className="mb-6 max-h-60 overflow-y-auto">
                  <table className="w-full text-left">
                    <thead className="bg-indigo-900/50">
                      <tr>
                        <th className="p-2 text-indigo-200">Rank</th>
                        <th className="p-2 text-indigo-200">Name</th>
                        <th className="p-2 text-indigo-200">Time</th>
                        <th className="p-2 text-indigo-200 text-right">Coins</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((entry, index) => (
                        <tr key={index} className={`${entry.name === playerName ? "bg-indigo-800/50" : ""}`}>
                          <td className="p-2 text-indigo-200">{index + 1}</td>
                          <td className="p-2 text-indigo-200">{entry.name}</td>
                          <td className="p-2 text-indigo-200">{formatTime(entry.timeSpent || 0)}</td>
                          <td className="p-2 text-yellow-300 text-right">{entry.coins}</td>
                        </tr>
                      ))}
                      {leaderboard.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-2 text-center text-indigo-200">
                            No scores yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="flex space-x-4">
                  <Button
                    onClick={() => setShowLeaderboard(false)}
                    variant="outline"
                    className="flex-1 bg-indigo-950 border-indigo-700 hover:bg-indigo-900 hover:border-indigo-500 text-indigo-200 hover:text-indigo-100"
                  >
                    Close
                  </Button>
                  <Button onClick={startGame} className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white">
                    Play Again
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}

      <AnimatePresence>
        {showLeaderboard && !gameCompleted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-indigo-950 border border-indigo-800 rounded-xl p-6 max-w-md w-full"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-indigo-200">Leaderboard</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowLeaderboard(false)}
                  className="text-indigo-300 hover:text-white hover:bg-indigo-900/50"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="mb-6 max-h-60 overflow-y-auto">
                <table className="w-full text-left">
                  <thead className="bg-indigo-900/50">
                    <tr>
                      <th className="p-2 text-indigo-200">Rank</th>
                      <th className="p-2 text-indigo-200">Name</th>
                      <th className="p-2 text-indigo-200">Time</th>
                      <th className="p-2 text-indigo-200 text-right">Coins</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry, index) => (
                      <tr key={index}>
                        <td className="p-2 text-indigo-200">{index + 1}</td>
                        <td className="p-2 text-indigo-200">{entry.name}</td>
                        <td className="p-2 text-indigo-200">{formatTime(entry.timeSpent || 0)}</td>
                        <td className="p-2 text-yellow-300 text-right">{entry.coins}</td>
                      </tr>
                    ))}
                    {leaderboard.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-2 text-center text-indigo-200">
                          No scores yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
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
              className="text-5xl sm:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 drop-shadow-[0_0_15px_rgba(251,191,36,0.7)]"
            >
              LEVEL UP!
            </motion.h1>
          </motion.div>
        )}
      </AnimatePresence>

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
            +{50 * expMultiplier} EXP
          </motion.div>
        )}
      </AnimatePresence>

      {/* Coin Gain Popup */}
      <AnimatePresence>
        {showCoinGain.show && (
          <motion.div
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: 1, y: -50 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed text-lg font-bold text-amber-400 z-20 flex items-center"
            style={{
              left: showCoinGain.position.x,
              top: showCoinGain.position.y,
              textShadow: "0 0 5px rgba(0,0,0,0.7)",
            }}
          >
            <Coins className="w-4 h-4 mr-1" />+{10 * coinMultiplier}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-1 right-4 flex space-x-4 z-50">
        <a href="https://github.com" target="_blank" rel="noopener noreferrer">
          <FontAwesomeIcon icon={faGithub} className="text-white text-2xl hover:text-gray-400 transition" />
        </a>
        <a href="https://telegram.org" target="_blank" rel="noopener noreferrer">
          <FontAwesomeIcon icon={faTelegram} className="text-white text-2xl hover:text-gray-400 transition" />
        </a>
        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
          <FontAwesomeIcon icon={faTwitter} className="text-white text-2xl hover:text-gray-400 transition" />
        </a>
      </div>
    </div>
  )
}
