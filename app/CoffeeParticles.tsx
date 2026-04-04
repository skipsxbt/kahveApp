'use client'

import { useEffect, useRef } from 'react'

interface Particle {
    x: number
    y: number
    baseX: number
    baseY: number
    size: number
    color: string
    opacity: number
    velocity: { x: number; y: number }
}

// Softer coffee colors suited for cream background
const COFFEE_COLORS = [
    '#8B6F47', // Medium coffee
    '#A0826D', // Light coffee
    '#C4A77D', // Latte
    '#D2B48C', // Tan/cream
    '#B8956A', // Caramel
    '#9E7B5B', // Mocha
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

        const resizeCanvas = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
            initParticles()
        }

        const initParticles = () => {
            const particles: Particle[] = []
            const numberOfParticles = Math.floor((window.innerWidth * window.innerHeight) / 10000)

            for (let i = 0; i < numberOfParticles; i++) {
                const x = Math.random() * canvas.width
                const y = Math.random() * canvas.height
                particles.push({
                    x,
                    y,
                    baseX: x,
                    baseY: y,
                    size: Math.random() * 3.5 + 1.5,
                    color: COFFEE_COLORS[Math.floor(Math.random() * COFFEE_COLORS.length)],
                    opacity: Math.random() * 0.3 + 0.1,
                    velocity: { x: 0, y: 0 }
                })
            }
            particlesRef.current = particles
        }

        const drawCoffeeDroplet = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, opacity: number) => {
            ctx.save()
            ctx.globalAlpha = opacity
            ctx.beginPath()

            // Softer droplet shape
            ctx.moveTo(x, y - size * 1.3)
            ctx.bezierCurveTo(
                x + size * 0.9, y - size * 0.4,
                x + size * 0.9, y + size * 0.4,
                x, y + size * 0.8
            )
            ctx.bezierCurveTo(
                x - size * 0.9, y + size * 0.4,
                x - size * 0.9, y - size * 0.4,
                x, y - size * 1.3
            )

            const gradient = ctx.createRadialGradient(
                x - size * 0.2, y - size * 0.2, 0,
                x, y, size * 1.2
            )
            gradient.addColorStop(0, lightenColor(color, 25))
            gradient.addColorStop(0.6, color)
            gradient.addColorStop(1, darkenColor(color, 15))

            ctx.fillStyle = gradient
            ctx.fill()

            // Subtle highlight
            ctx.beginPath()
            ctx.arc(x - size * 0.2, y - size * 0.4, size * 0.2, 0, Math.PI * 2)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.35)'
            ctx.fill()

            ctx.restore()
        }

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

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            const mouse = mouseRef.current
            const particles = particlesRef.current

            particles.forEach(particle => {
                const dx = mouse.x - particle.x
                const dy = mouse.y - particle.y
                const distance = Math.sqrt(dx * dx + dy * dy)
                const maxDistance = 250

                if (distance < maxDistance) {
                    const force = (maxDistance - distance) / maxDistance
                    const angle = Math.atan2(dy, dx)
                    particle.velocity.x += Math.cos(angle) * force * 0.12
                    particle.velocity.y += Math.sin(angle) * force * 0.12
                }

                const returnForce = 0.008
                particle.velocity.x += (particle.baseX - particle.x) * returnForce
                particle.velocity.y += (particle.baseY - particle.y) * returnForce

                particle.velocity.x *= 0.93
                particle.velocity.y *= 0.93

                particle.x += particle.velocity.x
                particle.y += particle.velocity.y

                drawCoffeeDroplet(ctx, particle.x, particle.y, particle.size, particle.color, particle.opacity)
            })

            animationRef.current = requestAnimationFrame(animate)
        }

        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current = { x: e.clientX, y: e.clientY }
        }

        const handleMouseLeave = () => {
            mouseRef.current = { x: -1000, y: -1000 }
        }

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
            style={{ opacity: 0.5 }}
        />
    )
}
