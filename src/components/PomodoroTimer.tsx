"use client";

import React, { useState, useEffect, useCallback } from 'react';
import styles from './PomodoroTimer.module.css';

type Mode = 'work' | 'shortBreak' | 'longBreak';

const MODES: Record<Mode, { time: number; label: string; color: string }> = {
    work: { time: 25 * 60, label: 'Focus', color: 'var(--primary)' },
    shortBreak: { time: 5 * 60, label: 'Short Break', color: 'var(--secondary)' },
    longBreak: { time: 15 * 60, label: 'Long Break', color: '#8e2de2' },
};

export default function PomodoroTimer() {
    const [mode, setMode] = useState<Mode>('work');
    const [timeLeft, setTimeLeft] = useState(MODES.work.time);
    const [isActive, setIsActive] = useState(false);

    const switchMode = useCallback((newMode: Mode) => {
        setMode(newMode);
        setTimeLeft(MODES[newMode].time);
        setIsActive(false);
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        setIsActive(false);
                        // Play sound notification
                        if (typeof window !== 'undefined') {
                            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                            audio.play().catch(() => console.log('Audio playback blocked'));
                        }
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [isActive, timeLeft]);


    const toggleTimer = () => setIsActive(!isActive);

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(MODES[mode].time);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = (1 - timeLeft / MODES[mode].time) * 100;
    const strokeDashoffset = 955 - (955 * progress) / 100; // 955 is approx circumference of 304px circle (r=152)

    return (
        <div className={`${styles.container} glass animate-fade-in`}>
            <div className={styles.modeSelector}>
                {(Object.keys(MODES) as Mode[]).map((m) => (
                    <button
                        key={m}
                        className={`${styles.modeButton} ${mode === m ? styles.modeButtonActive : ''}`}
                        onClick={() => switchMode(m)}
                    >
                        {MODES[m].label}
                    </button>
                ))}
            </div>

            <div
                className={styles.timerCircle}
                style={{
                    borderColor: `${MODES[mode].color}33`,
                    boxShadow: `0 0 60px ${MODES[mode].color}22`
                }}
            >
                <svg className={styles.progressRing}>
                    <circle
                        className={styles.progressPath}
                        cx="152"
                        cy="152"
                        r="150"
                        stroke={MODES[mode].color}
                        strokeDasharray="955"
                        strokeDashoffset={strokeDashoffset}
                    />
                </svg>
                <span className={styles.statusText}>{MODES[mode].label}</span>
                <div className={styles.timerDisplay}>
                    {formatTime(timeLeft)}
                </div>
            </div>

            <div className={styles.controls}>
                <button className={styles.mainButton} onClick={toggleTimer}>
                    {isActive ? 'Pause' : 'Start'}
                </button>
                <button className={styles.secondaryButton} onClick={resetTimer} title="Reset">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 4v6h-6" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

