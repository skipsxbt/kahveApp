'use client'

import { useEffect, useRef, useState } from 'react'

interface Particle {
    x: number
    y: number
    baseX: number
    baseY: number
    size: number
    color: string
    velocity: { x: number; y: number }
}

const COFFEE_COLORS = [
    '#6F4E37', // Dark coffee
    '#8B6F47', // Medium coffee
    '#A0826D', // Light coffee
    '#D2B48C', // Tan/cream
    '#3D2817', // Espresso
    '#C4A77D', // Latte
]

export default function CoffeeParticles() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const particlesRef = useRef<Particle[]>([])
    const mouseRef = useRef({ x: -1000, y: -1000 })
    const animationRef = useRef<number>()

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Set canvas size
        const resizeCanvas = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
            initParticles()
        }

        // Initialize particles
        const initParticles = () => {
            const particles: Particle[] = []
            const numberOfParticles = Math.floor((window.innerWidth * window.innerHeight) / 8000)

            for (let i = 0; i < numberOfParticles; i++) {
                const x = Math.random() * canvas.width
                const y = Math.random() * canvas.height
                particles.push({
                    x,
                    y,
                    baseX: x,
                    baseY: y,
                    size: Math.random() * 4 + 2,
                    color: COFFEE_COLORS[Math.floor(Math.random() * COFFEE_COLORS.length)],
                    velocity: { x: 0, y: 0 }
                })
            }
            particlesRef.current = particles
        }

        // Draw coffee droplet shape
        const drawCoffeeDroplet = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) => {
            ctx.save()
            ctx.beginPath()

            // Create droplet shape
            ctx.moveTo(x, y - size * 1.5)
            ctx.bezierCurveTo(
                x + size, y - size * 0.5,
                x + size, y + size * 0.5,
                x, y + size
            )
            ctx.bezierCurveTo(
                x - size, y + size * 0.5,
                x - size, y - size * 0.5,
                x, y - size * 1.5
            )

            // Fill with gradient for 3D effect
            const gradient = ctx.createRadialGradient(
                x - size * 0.3, y - size * 0.3, 0,
                x, y, size * 1.5
            )
            gradient.addColorStop(0, lightenColor(color, 30))
            gradient.addColorStop(0.5, color)
            gradient.addColorStop(1, darkenColor(color, 20))

            ctx.fillStyle = gradient
            ctx.fill()

            // Add highlight
            ctx.beginPath()
            ctx.arc(x - size * 0.3, y - size * 0.5, size * 0.3, 0, Math.PI * 2)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
            ctx.fill()

            ctx.restore()
        }

        // Helper functions for color manipulation
        const lightenColor = (color: string, percent: number): string => {
            const num = parseInt(color.replace('#', ''), 16)
            const amt = Math.round(2.55 * percent)
            const R = Math.min(255, (num >> 16) + amt)
            const G = Math.min(255, ((num >> 8) & 0x00ff) + amt)
            const B = Math.min(255, (num & 0x0000ff) + amt)
            return `rgb(${R}, ${G}, ${B})`
        }

        const darkenColor = (color: string, percent: number): string => {
            const num = parseInt(color.replace('#', ''), 16)
            const amt = Math.round(2.55 * percent)
            const R = Math.max(0, (num >> 16) - amt)
            const G = Math.max(0, ((num >> 8) & 0x00ff) - amt)
            const B = Math.max(0, (num & 0x0000ff) - amt)
            return `rgb(${R}, ${G}, ${B})`
        }

        // Animation loop
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            const mouse = mouseRef.current
            const particles = particlesRef.current

            particles.forEach(particle => {
                // Calculate distance from mouse
                const dx = mouse.x - particle.x
                const dy = mouse.y - particle.y
                const distance = Math.sqrt(dx * dx + dy * dy)
                const maxDistance = 300 // Influence radius - increased for wider effect

                if (distance < maxDistance) {
                    // Move particles away from mouse (repel effect) or towards mouse (attract effect)
                    // Using attract effect like in the reference
                    const force = (maxDistance - distance) / maxDistance
                    const angle = Math.atan2(dy, dx)

                    // Particles move towards mouse position - slower, pudding-like viscosity
                    particle.velocity.x += Math.cos(angle) * force * 0.15
                    particle.velocity.y += Math.sin(angle) * force * 0.15
                }

                // Return to base position with spring effect - very slow return like pudding
                const returnForce = 0.008
                particle.velocity.x += (particle.baseX - particle.x) * returnForce
                particle.velocity.y += (particle.baseY - particle.y) * returnForce

                // Apply friction - high friction for viscous pudding-like movement
                particle.velocity.x *= 0.92
                particle.velocity.y *= 0.92

                // Update position
                particle.x += particle.velocity.x
                particle.y += particle.velocity.y

                // Draw the coffee droplet
                drawCoffeeDroplet(ctx, particle.x, particle.y, particle.size, particle.color)
            })

            animationRef.current = requestAnimationFrame(animate)
        }

        // Mouse move handler
        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current = { x: e.clientX, y: e.clientY }
        }

        // Mouse leave handler
        const handleMouseLeave = () => {
            mouseRef.current = { x: -1000, y: -1000 }
        }

        // Initialize
        resizeCanvas()
        window.addEventListener('resize', resizeCanvas)
        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseleave', handleMouseLeave)
        animate()

        return () => {
            window.removeEventListener('resize', resizeCanvas)
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseleave', handleMouseLeave)
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
        }
    }, [])

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-0"
            style={{ opacity: 0.7 }}
        />
    )
}
