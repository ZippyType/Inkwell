
import React, { useEffect, useRef } from 'react';
import { useStudio } from '../context/StudioContext';
import confetti from 'canvas-confetti';

export function WordGoalProgress({ projectId }: { projectId: string }) {
    const { files } = useStudio();
    const triggered = useRef(false);
    
    const projects = JSON.parse(localStorage.getItem('inkwell-projects') || '[]');
    const project = projects.find((p: any) => p.id === projectId);
    const goal = project?.dailyWordCountGoal || 0;
    
    const currentCount = files.reduce((acc, file) => {
        if (file.type === 'chapter' && file.content) {
            return acc + file.content.trim().split(/\s+/).filter(Boolean).length;
        }
        return acc;
    }, 0);

    useEffect(() => {
        if (currentCount >= goal && goal > 0 && !triggered.current) {
            confetti({
                particleCount: 200,
                spread: 100,
                origin: { y: 0.6 },
                duration: 5000,
            });
            triggered.current = true;
            setTimeout(() => { triggered.current = false; }, 7000);
        }
    }, [currentCount, goal]);

    if (!goal) return null;

    const percentage = Math.min(100, (currentCount / goal) * 100);

    return (
        <div className="flex items-center gap-2 text-xs">
            <div className="w-24 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500" style={{ width: `${percentage}%` }} />
            </div>
            <span className="font-mono text-zinc-600 dark:text-zinc-300">{currentCount} / {goal}</span>
        </div>
    );
}
