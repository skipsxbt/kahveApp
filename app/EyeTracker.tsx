"use client";
import { useEffect, useState } from "react";
import { motion, useSpring } from "framer-motion";

// Geçerli ifadelerin listesi
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

    // Ağız şekillerini tanımlıyoruz (SVG Path olarak)
    const mouthPaths = {
        neutral: "M 10 10 Q 30 10 50 10",
        smile: "M 10 10 Q 30 25 50 10",
        'big-smile': "M 5 10 Q 30 40 55 10",
        laugh: "M 10 10 Q 30 45 50 10 L 50 15 Q 30 25 10 15 Z",
        excited: "M 5 15 Q 30 50 55 15 L 55 10 Q 30 45 5 10 Z"
    };

    return (
        <div className="flex flex-col items-center gap-2 mb-6">
            {/* Gözler */}
            <div className="flex gap-4 justify-center">
                {[1, 2].map((i) => (
                    <div key={i} className="w-16 h-16 bg-white rounded-full border-4 border-coffee-dark flex items-center justify-center shadow-lg relative overflow-hidden">
                        <motion.div
                            style={{ x: translateX, y: translateY }}
                            className="w-7 h-7 bg-coffee-dark rounded-full relative"
                        >
                            {/* White reflection for cute/realism */}
                            <div className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full opacity-60" />
                        </motion.div>
                    </div>
                ))}
            </div>

            {/* Ağız (Yeni Eklenen Kısım) */}
            <div className="h-10 flex items-center justify-center">
                <svg width="60" height="40" viewBox="0 0 60 40">
                    <motion.path
                        d={mouthPaths[expression]}
                        fill={expression === 'laugh' || expression === 'excited' ? "#4A3B32" : "transparent"}
                        stroke="#4A3B32"
                        strokeWidth="4"
                        strokeLinecap="round"
                        animate={expression === 'excited' ? { x: [0, -1, 1, -1, 0], y: [0, 1, -1, 1, 0] } : {}}
                        transition={expression === 'excited' ? { repeat: Infinity, duration: 0.1 } : {}}
                    />
                </svg>
            </div>
        </div>
    );
}
