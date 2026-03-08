import React from 'react';
import { motion } from 'motion/react';

interface ThinkingIndicatorProps {
  /** Optional phase-specific status (e.g. "Drafting...", "Reviewing..."). */
  status?: string;
}

export const ThinkingIndicator: React.FC<ThinkingIndicatorProps> = ({ status }) => (
    <div className="flex items-center gap-1 h-6">
        {[0, 1, 2].map((i) => (
            <motion.div
                key={i}
                className="w-2 h-2 bg-blue-500 rounded-full"
                animate={{
                    y: ["0%", "-50%", "0%"],
                    opacity: [0.4, 1, 0.4]
                }}
                transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut"
                }}
            />
        ))}
        <span className="text-xs font-semibold text-blue-500 uppercase tracking-wider ml-2 animate-pulse">
            {status ?? "Designing Strategy..."}
        </span>
    </div>
);
