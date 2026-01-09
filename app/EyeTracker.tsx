"use client";
import { useEffect, useState } from "react";
import { motion, useSpring } from "framer-motion";

export default function EyeTracker() {
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
        // Calculate tracked position
        // Default centers are roughly center of screen, but we want relative movement
        // We can just imply the eyes are looking at the mouse by moving pupils towards it
        // relative to the center of the viewport or the component itself.
        // Ideally we reference the component's position, but global mouse tracking works well for "watching" effect

        // Using window center as reference point for now
        const x = (mousePos.x - window.innerWidth / 2) / 25;
        const y = (mousePos.y - window.innerHeight / 2) / 25;

        translateX.set(x);
        translateY.set(y);
    }, [mousePos, translateX, translateY]);

    return (
        <div className="flex gap-4 justify-center mb-6 z-20 relative">
            {[1, 2].map((i) => (
                <div
                    key={i}
                    className="w-16 h-16 bg-white rounded-full border-4 border-coffee-dark flex items-center justify-center shadow-lg relative overflow-hidden"
                >
                    <motion.div
                        style={{ x: translateX, y: translateY }}
                        className="w-7 h-7 bg-coffee-dark rounded-full relative"
                    >
                        {/* White reflection for cuteness/realism */}
                        <div className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full opacity-60" />
                    </motion.div>
                </div>
            ))}
        </div>
    );
}
