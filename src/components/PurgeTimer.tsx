import { useState, useEffect } from 'react';

export function PurgeTimer() {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            // Convert to IST
            const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
            const istOffset = 5.5 * 60 * 60 * 1000;
            const istTime = new Date(utc + istOffset);

            const tomorrow = new Date(istTime);
            tomorrow.setHours(24, 0, 0, 0);

            const diff = tomorrow.getTime() - istTime.getTime();

            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeLeft(
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            );
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex items-center space-x-3 bg-white/5 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
            <span className="text-[10px] font-bold uppercase tracking-widest text-secondary animate-pulse">Purge In</span>
            <span className="font-mono font-bold text-sm text-white">{timeLeft}</span>
        </div>
    );
}
