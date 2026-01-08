'use client'
// Trigger Vercel redeploy

import { useState, useEffect, useCallback, useRef } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useSendTransaction, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import confetti from 'canvas-confetti'
import { motion } from 'framer-motion'

const RECEIVER_ADDRESS = '0x9778F9D4F521BaB5e7E5c74576d88c83cD407EFF' as `0x${string}`

export default function Home() {
  const [selectedAmount, setSelectedAmount] = useState<string>('')
  const [buttonText, setButtonText] = useState<string>('Bağış Yap')
  const [isSuccess, setIsSuccess] = useState<boolean>(false)
  const confettiTriggered = useRef<boolean>(false)


  const amounts = [
    { value: '0.001', label: '0.001 ETH' },
    { value: '0.002', label: '0.002 ETH' },
    { value: '0.005', label: '0.005 ETH' },
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

  // İşlem durumunu takip et
  useEffect(() => {
    if (isSending || isConfirming) {
      setButtonText('Gönderiliyor...')
    } else if (isConfirmed) {
      setButtonText('Teşekkürler! ☕')
      setIsSuccess(true)
      // Konfetiler yağdır (sadece bir kez)
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

  // Reset confetti flag when transaction hash changes
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

  // Başarılı işlemden sonra formu sıfırla
  const handleReset = () => {
    setSelectedAmount('')
    setButtonText('Bağış Yap')
    setIsSuccess(false)
    confettiTriggered.current = false
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 relative z-10 overflow-visible">
      {/* Connect Wallet Button */}
      <div className="absolute top-4 right-4 sm:top-8 sm:right-8 z-20">
        <ConnectButton />
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center space-y-6 sm:space-y-12 max-w-2xl w-full relative z-10 overflow-visible">
        {/* Title */}
        <motion.h1
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-center text-[#F5E6D3] flex justify-center items-center gap-1 px-4 whitespace-nowrap overflow-visible"
          variants={{
            hidden: {
              transition: {
                staggerChildren: 0.04, // Staggered delay between each letter
              },
            },
            visible: {
              transition: {
                staggerChildren: 0.04,
              },
            },
          }}
          initial="hidden"
          animate="visible"
        >
          {'Bana kahve ısmarla ☕'.split('').map((char, index) => {
            // Optimized letter animation: left entry with brake effect
            const letterVariants = {
              hidden: {
                x: '-100vw', // Start from left outside of screen
                opacity: 0,
              },
              visible: {
                x: 0,
                opacity: 1,
                transition: {
                  duration: 0.8,
                  // Cubic bezier for "brake" effect: fast start, slow end
                  ease: [0.0, 0.0, 0.2, 1] as [number, number, number, number], // Strong ease-out
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

        {/* Donation Amount Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 justify-center w-full px-4">
          {amounts.map((amount) => (
            <button
              key={amount.value}
              onClick={() => setSelectedAmount(amount.value)}
              className={`
                px-4 py-3 sm:px-8 sm:py-4 rounded-lg font-semibold text-base sm:text-lg
                transition-all duration-300 transform hover:scale-105 w-full sm:w-auto
                ${selectedAmount === amount.value
                  ? 'bg-coffee-dark text-white shadow-coffee-lg border-2 border-coffee-medium'
                  : 'bg-white text-coffee-dark border-2 border-coffee-light hover:shadow-coffee hover:border-coffee-medium'
                }
              `}
            >
              {amount.label}
            </button>
          ))}
        </div>

        {/* Selected Amount Display */}
        {selectedAmount && (
          <div className="text-center px-4">
            <p className="text-coffee-medium text-base sm:text-xl mb-2">Seçilen Miktar:</p>
            <p className="text-coffee-dark text-2xl sm:text-3xl font-bold">
              {selectedAmount} ETH
            </p>
          </div>
        )}

        {/* Donate Button */}
        <button
          onClick={isSuccess ? handleReset : handleDonate}
          disabled={!selectedAmount || (isSending || isConfirming)}
          className={`
            px-6 py-3 sm:px-12 sm:py-5 rounded-lg font-bold text-base sm:text-xl
            transition-all duration-300 transform hover:scale-105 w-full sm:w-auto
            ${isSuccess
              ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-coffee-lg hover:from-green-500 hover:to-green-600'
              : selectedAmount && !isSending && !isConfirming
                ? 'bg-coffee-gradient text-white shadow-coffee-lg hover:shadow-coffee'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          {buttonText}
        </button>
      </div>
    </main>
  )
}

