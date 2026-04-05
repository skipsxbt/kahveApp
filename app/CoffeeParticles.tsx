'use client'

import { useEffect, useRef } from 'react'

// ─── Simplex Noise ────────────────────────────────────────────────────
class SimplexNoise {
    private grad3: number[][]
    private perm: number[]

    constructor(seed = Math.random()) {
        this.grad3 = [
            [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
            [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
            [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1],
        ]
        const p: number[] = []
        for (let i = 0; i < 256; i++) p[i] = i
        let s = seed * 2147483647
        for (let i = 255; i > 0; i--) {
            s = (s * 16807) % 2147483647
            const j = Math.floor((s / 2147483647) * (i + 1))
            const tmp = p[i]; p[i] = p[j]; p[j] = tmp
        }
        this.perm = new Array(512)
        for (let i = 0; i < 512; i++) this.perm[i] = p[i & 255]
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
        const x0 = xin - (i - t), y0 = yin - (j - t)
        const i1 = x0 > y0 ? 1 : 0, j1 = x0 > y0 ? 0 : 1
        const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2
        const x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2
        const ii = i & 255, jj = j & 255
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

// ─── Bubble particle type ─────────────────────────────────────────────
interface Bubble {
    x: number
    y: number
    vx: number
    vy: number
    radius: number
    color: string
    highlightColor: string
    glowColor: string
    opacity: number
    baseOpacity: number
    layer: number
    speed: number
    noiseOffsetX: number
    noiseOffsetY: number
    phase: number       // for wobble/pulse animation
    phaseSpeed: number
}

// ─── Coffee bubble colors ─────────────────────────────────────────────
const BUBBLE_COLORS = [
    // Back layer — soft, transparent
    [
        { fill: '#C4A882', highlight: '#E8D5B8', glow: 'rgba(196, 168, 130, 0.3)' },
        { fill: '#D2B48C', highlight: '#F0E0C8', glow: 'rgba(210, 180, 140, 0.25)' },
        { fill: '#BFA67A', highlight: '#E0CDA8', glow: 'rgba(191, 166, 122, 0.25)' },
    ],
    // Mid layer — warm coffee tones
    [
        { fill: '#A0826D', highlight: '#D4B8A0', glow: 'rgba(160, 130, 109, 0.4)' },
        { fill: '#B8956A', highlight: '#E0C8A0', glow: 'rgba(184, 149, 106, 0.4)' },
        { fill: '#9E7B5B', highlight: '#D0AE88', glow: 'rgba(158, 123, 91, 0.35)' },
        { fill: '#C49A6C', highlight: '#E8C89C', glow: 'rgba(196, 154, 108, 0.4)' },
    ],
    // Front layer — rich, vibrant
    [
        { fill: '#8B6F47', highlight: '#C8A878', glow: 'rgba(139, 111, 71, 0.5)' },
        { fill: '#7A5C3E', highlight: '#B8946C', glow: 'rgba(122, 92, 62, 0.45)' },
        { fill: '#D4A574', highlight: '#F0D0A8', glow: 'rgba(212, 165, 116, 0.5)' },
        { fill: '#E8C9A0', highlight: '#FFF0DC', glow: 'rgba(232, 201, 160, 0.4)' },
    ],
]

// ─── Layer config ─────────────────────────────────────────────────────
const LAYER_CONFIG = [
    { speedMul: 0.3, radiusRange: [3, 8],   opacityRange: [0.12, 0.3],  count: 0.35 },
    { speedMul: 0.6, radiusRange: [5, 14],  opacityRange: [0.2, 0.45],  count: 0.4  },
    { speedMul: 1.0, radiusRange: [8, 22],  opacityRange: [0.3, 0.6],   count: 0.25 },
]

export default function CoffeeParticles() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const bubblesRef = useRef<Bubble[]>([])
    const mouseRef = useRef({ x: -9999, y: -9999, active: false })
    const animationRef = useRef<number>(0)
    const timeRef = useRef(0)
    const noiseRef = useRef<SimplexNoise>(new SimplexNoise(42))

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d', { alpha: true })
        if (!ctx) return

        const noise = noiseRef.current
        const dpr = Math.min(window.devicePixelRatio || 1, 2)

        // ─── Resize ────────────────────────────────────────────
        const resizeCanvas = () => {
            const w = window.innerWidth
            const h = window.innerHeight
            canvas.width = w * dpr
            canvas.height = h * dpr
            canvas.style.width = w + 'px'
            canvas.style.height = h + 'px'
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
            initBubbles(w, h)
        }

        // ─── Create bubbles ──────────────────────────────────
        const initBubbles = (w: number, h: number) => {
            const area = w * h
            const baseCount = Math.floor(area / 5000)
            const totalCount = Math.min(baseCount, 500)
            const bubbles: Bubble[] = []

            for (let layer = 0; layer < 3; layer++) {
                const cfg = LAYER_CONFIG[layer]
                const colors = BUBBLE_COLORS[layer]
                const count = Math.floor(totalCount * cfg.count)

                for (let i = 0; i < count; i++) {
                    const colorData = colors[Math.floor(Math.random() * colors.length)]
                    const opacity = cfg.opacityRange[0] + Math.random() * (cfg.opacityRange[1] - cfg.opacityRange[0])
                    const radius = cfg.radiusRange[0] + Math.random() * (cfg.radiusRange[1] - cfg.radiusRange[0])

                    bubbles.push({
                        x: Math.random() * w,
                        y: Math.random() * h,
                        vx: (Math.random() - 0.5) * 0.4,
                        vy: (Math.random() - 0.5) * 0.4,
                        radius,
                        color: colorData.fill,
                        highlightColor: colorData.highlight,
                        glowColor: colorData.glow,
                        opacity,
                        baseOpacity: opacity,
                        layer,
                        speed: (0.2 + Math.random() * 0.6) * cfg.speedMul,
                        noiseOffsetX: Math.random() * 1000,
                        noiseOffsetY: Math.random() * 1000,
                        phase: Math.random() * Math.PI * 2,
                        phaseSpeed: 0.005 + Math.random() * 0.015,
                    })
                }
            }
            bubblesRef.current = bubbles
        }

        // ─── Helper: hex → rgba ──────────────────────────────
        const hexToRgba = (hex: string, alpha: number): string => {
            const r = parseInt(hex.slice(1, 3), 16)
            const g = parseInt(hex.slice(3, 5), 16)
            const b = parseInt(hex.slice(5, 7), 16)
            return `rgba(${r}, ${g}, ${b}, ${alpha})`
        }

        // ─── Draw a coffee bubble ────────────────────────────
        const drawBubble = (
            ctx: CanvasRenderingContext2D,
            b: Bubble,
            time: number
        ) => {
            const wobble = Math.sin(b.phase) * 0.08
            const r = b.radius * (1 + wobble)

            ctx.save()
            ctx.globalAlpha = b.opacity

            // Outer glow
            ctx.shadowColor = b.glowColor
            ctx.shadowBlur = b.layer === 0 ? 6 : b.layer === 1 ? 12 : 20

            // Main bubble body — radial gradient for 3D sphere look
            const bodyGrad = ctx.createRadialGradient(
                b.x - r * 0.3, b.y - r * 0.3, r * 0.1,
                b.x, b.y, r
            )
            bodyGrad.addColorStop(0, hexToRgba(b.highlightColor, 0.9))
            bodyGrad.addColorStop(0.4, hexToRgba(b.color, 0.7))
            bodyGrad.addColorStop(0.8, hexToRgba(b.color, 0.4))
            bodyGrad.addColorStop(1, hexToRgba(b.color, 0.1))

            ctx.beginPath()
            ctx.arc(b.x, b.y, r, 0, Math.PI * 2)
            ctx.fillStyle = bodyGrad
            ctx.fill()

            // Subtle border ring for bubble edge
            ctx.beginPath()
            ctx.arc(b.x, b.y, r, 0, Math.PI * 2)
            ctx.strokeStyle = hexToRgba(b.color, 0.2 + b.layer * 0.05)
            ctx.lineWidth = 0.5 + b.layer * 0.3
            ctx.stroke()

            // Reset shadow for inner details
            ctx.shadowBlur = 0

            // Specular highlight — top-left crescent
            const hlX = b.x - r * 0.3
            const hlY = b.y - r * 0.35
            const hlR = r * 0.45
            const hlGrad = ctx.createRadialGradient(
                hlX, hlY, hlR * 0.05,
                hlX, hlY, hlR
            )
            hlGrad.addColorStop(0, `rgba(255, 255, 255, ${0.5 + b.layer * 0.1})`)
            hlGrad.addColorStop(0.5, `rgba(255, 255, 255, ${0.15 + b.layer * 0.05})`)
            hlGrad.addColorStop(1, 'rgba(255, 255, 255, 0)')

            ctx.beginPath()
            ctx.arc(hlX, hlY, hlR, 0, Math.PI * 2)
            ctx.fillStyle = hlGrad
            ctx.fill()

            // Secondary small highlight — bottom-right shine
            if (b.layer >= 1 && r > 6) {
                const h2X = b.x + r * 0.25
                const h2Y = b.y + r * 0.3
                const h2R = r * 0.15
                ctx.beginPath()
                ctx.arc(h2X, h2Y, h2R, 0, Math.PI * 2)
                ctx.fillStyle = `rgba(255, 255, 255, ${0.15 + b.layer * 0.05})`
                ctx.fill()
            }

            ctx.restore()
        }

        // ─── Main animation loop ─────────────────────────────
        const animate = () => {
            const w = window.innerWidth
            const h = window.innerHeight
            timeRef.current += 0.004

            ctx.clearRect(0, 0, w, h)

            const mouse = mouseRef.current
            const bubbles = bubblesRef.current
            const time = timeRef.current

            // Sort by layer (back first)
            bubbles.sort((a, b) => a.layer - b.layer)

            for (const b of bubbles) {
                // ─── Flow field from noise ─────────────────
                const noiseScale = 0.0012
                const noiseVal = noise.noise2D(
                    b.x * noiseScale + b.noiseOffsetX + time * 0.4,
                    b.y * noiseScale + b.noiseOffsetY + time * 0.25
                )
                const flowAngle = noiseVal * Math.PI * 2

                const turbulence = noise.noise2D(
                    b.x * noiseScale * 2.5 + time * 0.6 + 100,
                    b.y * noiseScale * 2.5 + time * 0.4 + 100
                ) * 0.25

                const flowForce = b.speed * 0.6
                b.vx += Math.cos(flowAngle + turbulence) * flowForce * 0.06
                b.vy += Math.sin(flowAngle + turbulence) * flowForce * 0.06

                // Slight upward float (like real bubbles)
                b.vy -= 0.003 * b.speed

                // ─── Mouse interaction ────────────────────
                if (mouse.active) {
                    const dx = mouse.x - b.x
                    const dy = mouse.y - b.y
                    const dist = Math.sqrt(dx * dx + dy * dy)
                    const influenceRadius = 180 + b.layer * 40

                    if (dist < influenceRadius && dist > 1) {
                        const force = (1 - dist / influenceRadius) * 0.03 * (b.layer + 1)

                        // Push bubbles away from mouse (like disrupting liquid)
                        b.vx -= (dx / dist) * force * 1.5
                        b.vy -= (dy / dist) * force * 1.5

                        // Slight tangential swirl
                        const swirl = force * 0.8
                        b.vx += (-dy / dist) * swirl
                        b.vy += (dx / dist) * swirl

                        // Brighten near mouse
                        b.opacity = Math.min(b.baseOpacity * 1.6, b.opacity + 0.015)
                    }
                }

                // ─── Damping ─────────────────────────────
                b.vx *= 0.97
                b.vy *= 0.97

                // ─── Speed limit ─────────────────────────
                const maxSpeed = 2.0 * b.speed
                const currentSpeed = Math.sqrt(b.vx * b.vx + b.vy * b.vy)
                if (currentSpeed > maxSpeed) {
                    b.vx = (b.vx / currentSpeed) * maxSpeed
                    b.vy = (b.vy / currentSpeed) * maxSpeed
                }

                // ─── Update position ─────────────────────
                b.x += b.vx
                b.y += b.vy

                // ─── Wrap around edges ───────────────────
                const margin = b.radius + 20
                if (b.x < -margin) b.x = w + margin
                if (b.x > w + margin) b.x = -margin
                if (b.y < -margin) b.y = h + margin
                if (b.y > h + margin) b.y = -margin

                // ─── Wobble / pulse phase ────────────────
                b.phase += b.phaseSpeed

                // ─── Fade opacity back to base ──────────
                const pulse = 0.85 + 0.15 * Math.sin(b.phase * 2)
                b.opacity += (b.baseOpacity * pulse - b.opacity) * 0.025

                // ─── Draw ────────────────────────────────
                drawBubble(ctx, b, time)
            }

            animationRef.current = requestAnimationFrame(animate)
        }

        // ─── Events ──────────────────────────────────────────
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
            if (animationRef.current) cancelAnimationFrame(animationRef.current)
        }
    }, [])

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-0"
            style={{ opacity: 0.9 }}
        />
    )
}
