"use client";
import { useEffect, useState } from "react";
import { motion, useSpring } from "framer-motion";

export type Expression = 'neutral' | 'smile' | 'big-smile' | 'laugh' | 'excited';

interface EyeTrackerProps {
    expression?: Expression;
}

export default function EyeTracker({ expression = 'neutral' }: EyeTrackerProps) {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    const springConfig = { damping: 25, stiffness: 150 };
    const translateX = useSpring(0, springConfig);
    const translateY = useSpring(0, springConfig);

    useEffect(() => {
        const x = (mousePos.x - window.innerWidth / 2) / 30;
        const y = (mousePos.y - window.innerHeight / 2) / 30;
        translateX.set(x);
        translateY.set(y);
    }, [mousePos, translateX, translateY]);

    // --- Animasyon Değerleri ---
    const eyebrowVariants = {
        neutral: { y: 0, rotate: 0 },
        smile: { y: -5, rotate: 5 },
        'big-smile': { y: -8, rotate: 10 },
        laugh: { y: -12, rotate: 15 },
        excited: { y: -15, rotate: [0, -5, 5, -5, 0] }
    };

    const mouthPaths = {
        neutral: "M 10 15 Q 50 15 90 15",
        smile: "M 10 15 Q 50 40 90 15",
        'big-smile': "M 5 15 Q 50 60 95 15",
        laugh: "M 10 15 Q 50 70 90 15 L 90 25 Q 50 40 10 25 Z",
        excited: "M 5 20 Q 50 80 95 20 L 95 10 Q 50 70 5 10 Z"
    };

    return (
        <div className="flex flex-col items-center gap-4 mb-8">

            {/* Gözler ve Kaşlar */}
            <div className="flex gap-8 justify-center items-end h-24">
                {[1, 2].map((i) => {
                    // Kaşın dönüş açısını hesapla (i === 1 ise sol kaş için negatifi al)
                    const rawRotate = eyebrowVariants[expression].rotate;
                    const finalRotate = i === 1
                        ? (Array.isArray(rawRotate) ? rawRotate.map(r => -r) : -rawRotate)
                        : rawRotate;

                    return (
                        <div key={i} className="relative flex flex-col items-center">
                            {/* Kaş (SVG ile daha oval ve gerçekçi) */}
                            <motion.div
                                className="mb-1"
                                animate={{
                                    y: eyebrowVariants[expression].y,
                                    rotate: finalRotate
                                }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                style={{
                                    transformOrigin: i === 1 ? "90% 50%" : "10% 50%" // Kaşların iç kısımlarından dönmesi için
                                }}
                            >
                                <svg width="60" height="20" viewBox="0 0 60 20">
                                    <path
                                        d="M 5 15 Q 30 0 55 15"
                                        fill="transparent"
                                        stroke="#27272a" // zinc-800
                                        strokeWidth="5"
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </motion.div>

                            {/* Göz */}
                            <div className="w-16 h-16 bg-white rounded-full border-2 border-zinc-200 flex items-center justify-center shadow-inner overflow-hidden">
                                <motion.div
                                    style={{ x: translateX, y: translateY }}
                                    className="w-7 h-7 bg-zinc-900 rounded-full"
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Ağız */}
            <div className="h-20 flex items-center justify-center">
                <svg width="120" height="80" viewBox="0 0 100 80">
                    <motion.path
                        d={mouthPaths[expression]}
                        fill={expression === 'laugh' || expression === 'excited' ? "#333" : "transparent"}
                        stroke="#333"
                        strokeWidth="4"
                        strokeLinecap="round"
                        animate={expression === 'excited' ? {
                            scale: [1, 1.1, 1],
                            rotate: [0, -2, 2, -2, 0]
                        } : { scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    />
                </svg>
            </div>

        </div>
    );
}
