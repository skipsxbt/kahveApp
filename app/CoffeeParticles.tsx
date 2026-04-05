'use client'

import { useEffect, useRef } from 'react'

// ─── Simplex Noise (compact implementation) ───────────────────────────
class SimplexNoise {
    private grad3: number[][]
    private p: number[]
    private perm: number[]

    constructor(seed = Math.random()) {
        this.grad3 = [
            [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
            [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
            [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1],
        ]
        // Initialize with sequential values 0-255
        this.p = []
        for (let i = 0; i < 256; i++) this.p[i] = i
        // Seeded Fisher-Yates shuffle
        let s = seed * 2147483647
        for (let i = 255; i > 0; i--) {
            s = (s * 16807) % 2147483647
            const j = Math.floor((s / 2147483647) * (i + 1))
            const tmp = this.p[i]
            this.p[i] = this.p[j]
            this.p[j] = tmp
        }
        this.perm = new Array(512)
        for (let i = 0; i < 512; i++) this.perm[i] = this.p[i & 255]
    }

    private dot(g: number[], x: number, y: number): number {
        return g[0] * x + g[1] * y
    }

    noise2D(xin: number, yin: number): number {
        const F2 = 0.5 * (Math.sqrt(3) - 1)
        const G2 = (3 - Math.sqrt(3)) / 6
        const s = (xin + yin) * F2
        const i = Math.floor(xin + s)
        const j = Math.floor(yin + s)
        const t = (i + j) * G2
        const X0 = i - t
        const Y0 = j - t
        const x0 = xin - X0
        const y0 = yin - Y0

        let i1: number, j1: number
        if (x0 > y0) { i1 = 1; j1 = 0 }
        else { i1 = 0; j1 = 1 }

        const x1 = x0 - i1 + G2
        const y1 = y0 - j1 + G2
        const x2 = x0 - 1 + 2 * G2
        const y2 = y0 - 1 + 2 * G2

        const ii = i & 255
        const jj = j & 255
        const gi0 = this.perm[ii + this.perm[jj]] % 12
        const gi1 = this.perm[ii + i1 + this.perm[jj + j1]] % 12
        const gi2 = this.perm[ii + 1 + this.perm[jj + 1]] % 12

        let n0 = 0, n1 = 0, n2 = 0
        let t0 = 0.5 - x0 * x0 - y0 * y0
        if (t0 >= 0) { t0 *= t0; n0 = t0 * t0 * this.dot(this.grad3[gi0], x0, y0) }
        let t1 = 0.5 - x1 * x1 - y1 * y1
        if (t1 >= 0) { t1 *= t1; n1 = t1 * t1 * this.dot(this.grad3[gi1], x1, y1) }
        let t2 = 0.5 - x2 * x2 - y2 * y2
        if (t2 >= 0) { t2 *= t2; n2 = t2 * t2 * this.dot(this.grad3[gi2], x2, y2) }

        return 70 * (n0 + n1 + n2)
    }
}

// ─── Types ────────────────────────────────────────────────────────────
interface Particle {
    x: number
    y: number
    vx: number
    vy: number
    size: number          // capsule length
    width: number         // capsule thickness
    color: string
    glowColor: string
    opacity: number
    baseOpacity: number
    layer: number         // 0 = back, 1 = mid, 2 = front
    speed: number
    noiseOffsetX: number
    noiseOffsetY: number
    life: number
    maxLife: number
}

// ─── Premium coffee palette with warm luminous tones ──────────────────
const LAYER_COLORS = [
    // Back layer — subtle, muted
    [
        { color: '#C4A882', glow: 'rgba(196, 168, 130, 0.4)' },
        { color: '#D2B48C', glow: 'rgba(210, 180, 140, 0.35)' },
        { color: '#BFA67A', glow: 'rgba(191, 166, 122, 0.3)' },
    ],
    // Mid layer — richer
    [
        { color: '#A0826D', glow: 'rgba(160, 130, 109, 0.5)' },
        { color: '#B8956A', glow: 'rgba(184, 149, 106, 0.5)' },
        { color: '#9E7B5B', glow: 'rgba(158, 123, 91, 0.45)' },
        { color: '#C49A6C', glow: 'rgba(196, 154, 108, 0.5)' },
    ],
    // Front layer — vibrant accents
    [
        { color: '#8B6F47', glow: 'rgba(139, 111, 71, 0.6)' },
        { color: '#7A5C3E', glow: 'rgba(122, 92, 62, 0.55)' },
        { color: '#D4A574', glow: 'rgba(212, 165, 116, 0.6)' },
        { color: '#E8C9A0', glow: 'rgba(232, 201, 160, 0.5)' },
    ],
]

// ─── Layer configs for parallax depth ─────────────────────────────────
const LAYER_CONFIG = [
    { speedMul: 0.35, sizeMul: 0.7, widthMul: 0.5, opacityRange: [0.2, 0.45], count: 0.3 },
    { speedMul: 0.65, sizeMul: 1.1, widthMul: 0.8, opacityRange: [0.35, 0.65], count: 0.4 },
    { speedMul: 1.0, sizeMul: 1.5, widthMul: 1.0, opacityRange: [0.5, 0.85], count: 0.3 },
]

export default function CoffeeParticles() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const particlesRef = useRef<Particle[]>([])
    const mouseRef = useRef({ x: -9999, y: -9999, active: false })
    const animationRef = useRef<number>(0)
    const timeRef = useRef(0)
    const noiseRef = useRef<SimplexNoise>(new SimplexNoise(42))
    const dprRef = useRef(1)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d', { alpha: true })
        if (!ctx) return

        const noise = noiseRef.current
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        dprRef.current = dpr

        // ─── Resize ──────────────────────────────────────────────
        const resizeCanvas = () => {
            const w = window.innerWidth
            const h = window.innerHeight
            canvas.width = w * dpr
            canvas.height = h * dpr
            canvas.style.width = w + 'px'
            canvas.style.height = h + 'px'
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
            initParticles(w, h)
        }

        // ─── Create particles ────────────────────────────────────
        const initParticles = (w: number, h: number) => {
            const area = w * h
            const baseCount = Math.floor(area / 3200)
            const totalCount = Math.min(baseCount, 800)
            const particles: Particle[] = []

            for (let layer = 0; layer < 3; layer++) {
                const cfg = LAYER_CONFIG[layer]
                const colors = LAYER_COLORS[layer]
                const count = Math.floor(totalCount * cfg.count)

                for (let i = 0; i < count; i++) {
                    const colorData = colors[Math.floor(Math.random() * colors.length)]
                    const opacity = cfg.opacityRange[0] + Math.random() * (cfg.opacityRange[1] - cfg.opacityRange[0])
                    const maxLife = 600 + Math.random() * 1000

                    particles.push({
                        x: Math.random() * w,
                        y: Math.random() * h,
                        vx: (Math.random() - 0.5) * 0.8,
                        vy: (Math.random() - 0.5) * 0.8,
                        size: (5 + Math.random() * 10) * cfg.sizeMul,
                        width: (1.8 + Math.random() * 2.5) * cfg.widthMul,
                        color: colorData.color,
                        glowColor: colorData.glow,
                        opacity,
                        baseOpacity: opacity,
                        layer,
                        speed: (0.3 + Math.random() * 0.7) * cfg.speedMul,
                        noiseOffsetX: Math.random() * 1000,
                        noiseOffsetY: Math.random() * 1000,
                        life: Math.random() * maxLife,
                        maxLife,
                    })
                }
            }
            particlesRef.current = particles
        }

        // ─── Draw a velocity-aligned capsule/pill ────────────────
        const drawCapsule = (
            ctx: CanvasRenderingContext2D,
            x: number, y: number,
            vx: number, vy: number,
            length: number, width: number,
            color: string, glowColor: string,
            opacity: number, layer: number
        ) => {
            const speed = Math.sqrt(vx * vx + vy * vy)
            const angle = Math.atan2(vy, vx)

            // Dynamic length based on velocity
            const dynamicLength = length * (0.6 + Math.min(speed * 1.5, 1.5))
            const halfLen = dynamicLength / 2
            const radius = width / 2

            ctx.save()
            ctx.globalAlpha = opacity
            ctx.translate(x, y)
            ctx.rotate(angle)

            // Glow effect on all layers with increasing intensity
            ctx.shadowColor = glowColor
            ctx.shadowBlur = layer === 0 ? 4 : layer === 1 ? 10 : 18

            // Draw capsule shape
            ctx.beginPath()
            ctx.moveTo(-halfLen, -radius)
            ctx.lineTo(halfLen, -radius)
            ctx.arc(halfLen, 0, radius, -Math.PI / 2, Math.PI / 2)
            ctx.lineTo(-halfLen, radius)
            ctx.arc(-halfLen, 0, radius, Math.PI / 2, -Math.PI / 2)
            ctx.closePath()

            // Gradient fill along the capsule
            const grad = ctx.createLinearGradient(-halfLen, 0, halfLen, 0)
            grad.addColorStop(0, adjustAlpha(color, 0.6))
            grad.addColorStop(0.4, color)
            grad.addColorStop(1, adjustAlpha(color, 0.8))
            ctx.fillStyle = grad
            ctx.fill()

            // Inner highlight for depth
            ctx.beginPath()
            ctx.ellipse(0, -radius * 0.3, halfLen * 0.6, radius * 0.4, 0, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(255, 255, 255, ${0.15 + layer * 0.08})`
            ctx.fill()

            ctx.restore()
        }

        // ─── Helper: adjust alpha of a hex color ─────────────────
        const adjustAlpha = (hex: string, alpha: number): string => {
            const r = parseInt(hex.slice(1, 3), 16)
            const g = parseInt(hex.slice(3, 5), 16)
            const b = parseInt(hex.slice(5, 7), 16)
            return `rgba(${r}, ${g}, ${b}, ${alpha})`
        }

        // ─── Draw connections between nearby front-layer particles ─
        const drawConnections = (ctx: CanvasRenderingContext2D, particles: Particle[]) => {
            const frontParticles = particles.filter(p => p.layer === 2)
            const maxDist = 120

            for (let i = 0; i < frontParticles.length; i++) {
                for (let j = i + 1; j < frontParticles.length; j++) {
                    const a = frontParticles[i]
                    const b = frontParticles[j]
                    const dx = a.x - b.x
                    const dy = a.y - b.y
                    const dist = Math.sqrt(dx * dx + dy * dy)

                    if (dist < maxDist) {
                        const alpha = (1 - dist / maxDist) * 0.08 * Math.min(a.opacity, b.opacity)
                        ctx.beginPath()
                        ctx.moveTo(a.x, a.y)
                        ctx.lineTo(b.x, b.y)
                        ctx.strokeStyle = `rgba(139, 111, 71, ${alpha})`
                        ctx.lineWidth = 0.5
                        ctx.stroke()
                    }
                }
            }
        }

        // ─── Main animation loop ─────────────────────────────────
        const animate = () => {
            const w = window.innerWidth
            const h = window.innerHeight
            timeRef.current += 0.003

            ctx.clearRect(0, 0, w, h)

            const mouse = mouseRef.current
            const particles = particlesRef.current
            const time = timeRef.current

            // Sort by layer so back renders first
            particles.sort((a, b) => a.layer - b.layer)

            // Draw connections first (behind particles)
            drawConnections(ctx, particles)

            for (const p of particles) {
                // ─── Flow field from noise ──────────────────────
                const noiseScale = 0.0015
                const noiseVal = noise.noise2D(
                    p.x * noiseScale + p.noiseOffsetX + time * 0.5,
                    p.y * noiseScale + p.noiseOffsetY + time * 0.3
                )
                const flowAngle = noiseVal * Math.PI * 2

                // Secondary noise for turbulence
                const turbulence = noise.noise2D(
                    p.x * noiseScale * 2 + time * 0.8 + 100,
                    p.y * noiseScale * 2 + time * 0.6 + 100
                ) * 0.3

                const flowForce = p.speed * 0.8
                p.vx += Math.cos(flowAngle + turbulence) * flowForce * 0.08
                p.vy += Math.sin(flowAngle + turbulence) * flowForce * 0.08

                // ─── Mouse interaction: orbit/attract ───────────
                if (mouse.active) {
                    const dx = mouse.x - p.x
                    const dy = mouse.y - p.y
                    const dist = Math.sqrt(dx * dx + dy * dy)
                    const influenceRadius = 200 + p.layer * 50

                    if (dist < influenceRadius && dist > 1) {
                        const force = (1 - dist / influenceRadius) * 0.04 * (p.layer + 1)
                        const toMouseAngle = Math.atan2(dy, dx)

                        // Orbit effect: perpendicular force + slight attraction
                        const orbitAngle = toMouseAngle + Math.PI * 0.5
                        p.vx += Math.cos(orbitAngle) * force * 2.0
                        p.vy += Math.sin(orbitAngle) * force * 2.0

                        // Gentle attraction
                        p.vx += dx / dist * force * 0.5
                        p.vy += dy / dist * force * 0.5

                        // Boost opacity near mouse
                        p.opacity = Math.min(p.baseOpacity * 1.5, p.opacity + 0.01)
                    }
                }

                // ─── Damping ───────────────────────────────────
                const damping = 0.96
                p.vx *= damping
                p.vy *= damping

                // ─── Speed limit ──────────────────────────────
                const maxSpeed = 2.5 * p.speed
                const currentSpeed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
                if (currentSpeed > maxSpeed) {
                    p.vx = (p.vx / currentSpeed) * maxSpeed
                    p.vy = (p.vy / currentSpeed) * maxSpeed
                }

                // ─── Update position ─────────────────────────
                p.x += p.vx
                p.y += p.vy

                // ─── Wrap around edges with margin ───────────
                const margin = 50
                if (p.x < -margin) p.x = w + margin
                if (p.x > w + margin) p.x = -margin
                if (p.y < -margin) p.y = h + margin
                if (p.y > h + margin) p.y = -margin

                // ─── Life cycle for subtle pulsing ──────────
                p.life += 1
                if (p.life > p.maxLife) p.life = 0

                const lifeFraction = p.life / p.maxLife
                const pulse = 0.8 + 0.2 * Math.sin(lifeFraction * Math.PI * 2)

                // ─── Fade opacity back to base ──────────────
                p.opacity += (p.baseOpacity * pulse - p.opacity) * 0.02

                // ─── Draw particle ──────────────────────────
                drawCapsule(
                    ctx, p.x, p.y,
                    p.vx, p.vy,
                    p.size, p.width,
                    p.color, p.glowColor,
                    p.opacity, p.layer
                )
            }

            animationRef.current = requestAnimationFrame(animate)
        }

        // ─── Event handlers ──────────────────────────────────────
        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current = { x: e.clientX, y: e.clientY, active: true }
        }

        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length > 0) {
                mouseRef.current = {
                    x: e.touches[0].clientX,
                    y: e.touches[0].clientY,
                    active: true
                }
            }
        }

        const handleMouseLeave = () => {
            mouseRef.current = { x: -9999, y: -9999, active: false }
        }

        // ─── Init ────────────────────────────────────────────────
        resizeCanvas()
        window.addEventListener('resize', resizeCanvas)
        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('touchmove', handleTouchMove, { passive: true })
        window.addEventListener('mouseleave', handleMouseLeave)
        animate()

        return () => {
            window.removeEventListener('resize', resizeCanvas)
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('touchmove', handleTouchMove)
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
            style={{ opacity: 0.85 }}
        />
    )
}
