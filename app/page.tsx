'use client'
import EyeTracker from './EyeTracker'
import CoffeeParticles from './CoffeeParticles'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useSendTransaction, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import confetti from 'canvas-confetti'
import { motion, AnimatePresence } from 'framer-motion'

const RECEIVER_ADDRESS = '0x9778F9D4F521BaB5e7E5c74576d88c83cD407EFF' as `0x${string}`

export default function Home() {
  const [expression, setExpression] = useState<'neutral' | 'smile' | 'big-smile' | 'laugh' | 'excited'>('neutral')
  const [selectedAmount, setSelectedAmount] = useState<string>('')
  const [buttonText, setButtonText] = useState<string>('Bağış Yap')
  const [isSuccess, setIsSuccess] = useState<boolean>(false)
  const confettiTriggered = useRef<boolean>(false)

  const amounts = [
    { value: '1', label: '1 ETH', emoji: '☕', desc: 'Bir yudum' },
    { value: '2', label: '2 ETH', emoji: '☕☕', desc: 'Bir fincan' },
    { value: '5', label: '5 ETH', emoji: '☕☕☕', desc: 'Tam kahvaltı' },
  ]

  const {
    data: hash,
    sendTransaction,
    isPending: isSending,
    isSuccess: isSendSuccess,
  } = useSendTransaction()

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
  } = useWaitForTransactionReceipt({
    hash,
  })

  const triggerConfetti = useCallback(() => {
    const duration = 3000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min
    }

    const interval: NodeJS.Timeout = setInterval(function () {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      })
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      })
    }, 250)
  }, [])

  useEffect(() => {
    if (isSending || isConfirming) {
      setButtonText('Gönderiliyor...')
    } else if (isConfirmed) {
      setButtonText('Teşekkürler! ☕')
      setIsSuccess(true)
      if (!confettiTriggered.current) {
        triggerConfetti()
        confettiTriggered.current = true
      }
    } else if (isSendSuccess && !isConfirming) {
      setButtonText('Onaylanıyor...')
    } else {
      if (!isSuccess) {
        setButtonText('Bağış Yap')
      }
    }
  }, [isSending, isConfirming, isConfirmed, isSendSuccess, isSuccess, triggerConfetti])

  useEffect(() => {
    if (hash) {
      confettiTriggered.current = false
    }
  }, [hash])

  const handleDonate = async () => {
    if (selectedAmount && !isSending && !isConfirming) {
      try {
        sendTransaction({
          to: RECEIVER_ADDRESS,
          value: parseEther(selectedAmount),
        })
      } catch (error) {
        console.error('Transaction error:', error)
        setButtonText('Bağış Yap')
      }
    }
  }

  const handleReset = () => {
    setSelectedAmount('')
    setButtonText('Bağış Yap')
    setIsSuccess(false)
    confettiTriggered.current = false
  }

  const adjustAmount = (delta: number) => {
    const current = parseFloat(selectedAmount) || 0;
    const nextAmount = Math.max(0, current + delta);
    if (nextAmount === 0) {
      setSelectedAmount('');
    } else {
      setSelectedAmount(parseFloat(nextAmount.toFixed(3)).toString());
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 relative z-10 overflow-visible">
      {/* Coffee Particles Background Animation */}
      <CoffeeParticles />

      {/* Connect Wallet Button - top right */}
      <motion.div
        className="absolute top-4 right-4 sm:top-8 sm:right-8 z-20"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <ConnectButton />
      </motion.div>

      {/* ===== MAIN GLASS PANEL ===== */}
      <motion.div
        className="glass-panel px-6 py-10 sm:px-12 sm:py-14 max-w-2xl w-full relative z-10 overflow-visible"
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex flex-col items-center justify-center space-y-8 sm:space-y-10 overflow-visible">

          {/* Eye Tracker */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <EyeTracker expression={expression} />
          </motion.div>

          {/* Title */}
          <div className="text-center space-y-2">
            <motion.h1
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-coffee-dark text-glow flex justify-center items-center gap-1 px-4 whitespace-nowrap overflow-visible"
              variants={{
                hidden: {
                  transition: { staggerChildren: 0.04 },
                },
                visible: {
                  transition: { staggerChildren: 0.04 },
                },
              }}
              initial="hidden"
              animate="visible"
            >
              {'Bana kahve ısmarla ☕'.split('').map((char, index) => {
                const letterVariants = {
                  hidden: {
                    x: '-100vw',
                    opacity: 0,
                  },
                  visible: {
                    x: 0,
                    opacity: 1,
                    transition: {
                      duration: 0.8,
                      ease: [0.0, 0.0, 0.2, 1] as [number, number, number, number],
                    },
                  },
                }

                return (
                  <motion.span
                    key={index}
                    className="inline-block"
                    variants={letterVariants}
                    style={{ willChange: 'transform, opacity' }}
                  >
                    {char === ' ' ? '\u00A0' : char}
                  </motion.span>
                )
              })}
            </motion.h1>
            <motion.p
              className="text-coffee-medium text-sm sm:text-base font-light tracking-wide"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              transition={{ duration: 0.8, delay: 1.2 }}
            >
              Web3 ile kahve bağışı yap
            </motion.p>
          </div>

          {/* Decorative divider */}
          <div className="divider-ornament w-full max-w-xs">
            <span className="text-coffee-light text-xs">✦</span>
          </div>

          {/* Donation Amount Cards */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            {amounts.map((amount, i) => (
              <motion.button
                key={amount.value}
                onMouseEnter={() => {
                  if (amount.value === '1') setExpression('smile')
                  if (amount.value === '2') setExpression('big-smile')
                  if (amount.value === '5') setExpression('laugh')
                }}
                onMouseLeave={() => setExpression('neutral')}
                onClick={() => setSelectedAmount(amount.value)}
                className={`
                  glass-card px-4 py-5 sm:px-6 sm:py-6 cursor-pointer
                  flex flex-col items-center gap-2
                  ${selectedAmount === amount.value ? 'glass-card-selected' : ''}
                `}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 + i * 0.1 }}
              >
                <span className="text-2xl sm:text-3xl mb-1">{amount.emoji}</span>
                <span className={`font-bold text-base sm:text-lg ${selectedAmount === amount.value ? 'text-white' : 'text-coffee-dark'
                  }`}>
                  {amount.label}
                </span>
                <span className={`text-xs font-light ${selectedAmount === amount.value ? 'text-white/70' : 'text-coffee-medium/60'
                  }`}>
                  {amount.desc}
                </span>
              </motion.button>
            ))}
          </motion.div>

          {/* Custom Amount Input */}
          <motion.div
            className="w-full flex justify-center mt-2 relative z-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <div className="relative flex items-center justify-center gap-3 w-full max-w-xs sm:max-w-md">
              <button
                onClick={() => adjustAmount(-1)}
                onMouseEnter={() => setExpression('smile')}
                onMouseLeave={() => setExpression('neutral')}
                className="w-12 h-12 shrink-0 flex items-center justify-center rounded-2xl glass-card text-2xl text-coffee-dark font-bold hover:bg-white/50 active:scale-95 transition-all focus:outline-none"
              >
                -
              </button>
              <div className="relative flex-1">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="Özel miktar..."
                  value={selectedAmount}
                  onChange={(e) => setSelectedAmount(e.target.value)}
                  onMouseEnter={() => setExpression('smile')}
                  onMouseLeave={() => setExpression('neutral')}
                  onFocus={() => setExpression('excited')}
                  onBlur={() => setExpression('neutral')}
                  className="glass-input no-spinners w-full px-4 py-4 text-center text-lg sm:text-xl font-bold placeholder:font-normal placeholder:text-sm"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-coffee-medium font-bold pointer-events-none">
                  ETH
                </span>
              </div>
              <button
                onClick={() => adjustAmount(1)}
                onMouseEnter={() => setExpression('smile')}
                onMouseLeave={() => setExpression('neutral')}
                className="w-12 h-12 shrink-0 flex items-center justify-center rounded-2xl glass-card text-2xl text-coffee-dark font-bold hover:bg-white/50 active:scale-95 transition-all focus:outline-none"
              >
                +
              </button>
            </div>
          </motion.div>

          {/* Selected Amount Badge */}
          <AnimatePresence>
            {selectedAmount && (
              <motion.div
                className="amount-badge px-6 py-3 text-center"
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-coffee-medium text-xs font-medium uppercase tracking-widest mb-1">
                  Seçilen Miktar
                </p>
                <p className="text-coffee-dark text-xl sm:text-2xl font-bold">
                  {selectedAmount} ETH
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Donate / Success Button */}
          <motion.button
            onMouseEnter={() => setExpression('excited')}
            onMouseLeave={() => setExpression('neutral')}
            onClick={isSuccess ? handleReset : handleDonate}
            disabled={!selectedAmount || (isSending || isConfirming)}
            className={`
              px-8 py-4 sm:px-14 sm:py-5 text-base sm:text-xl w-full sm:w-auto
              ${isSuccess ? 'btn-success' : 'btn-premium'}
            `}
            whileHover={selectedAmount && !isSending && !isConfirming ? { scale: 1.04 } : {}}
            whileTap={selectedAmount && !isSending && !isConfirming ? { scale: 0.97 } : {}}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
          >
            {buttonText}
          </motion.button>

        </div>
      </motion.div>

      {/* Footer */}
      <motion.p
        className="mt-8 text-coffee-medium/40 text-xs font-light tracking-widest"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.5 }}
      >
        Powered by Ethereum ◆ Base Network
      </motion.p>
    </main>
  )
}
