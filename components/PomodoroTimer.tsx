"use client";

import React, { useState, useEffect, useCallback } from 'react';
import styles from './PomodoroTimer.module.css';

type Mode = 'work' | 'shortBreak' | 'longBreak';

const MODES: Record<Mode, { time: number; label: string; color: string }> = {
    work: { time: 25 * 60, label: 'Focus', color: 'var(--primary)' },
    shortBreak: { time: 5 * 60, label: 'Break', color: 'var(--secondary)' },
    longBreak: { time: 15 * 60, label: 'Long Break', color: '#8e2de2' },
};

export default function PomodoroTimer() {
    const [mode, setMode] = useState<Mode>('work');
    const [timeLeft, setTimeLeft] = useState(MODES.work.time);
    const [isActive, setIsActive] = useState(false);
    const [sessionsCompleted, setSessionsCompleted] = useState(0);

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

                        // Determine next mode
                        if (mode === 'work') {
                            const newCount = sessionsCompleted + 1;
                            setSessionsCompleted(newCount);
                            if (newCount % 4 === 0) {
                                setMode('longBreak');
                                setTimeLeft(MODES.longBreak.time);
                            } else {
                                setMode('shortBreak');
                                setTimeLeft(MODES.shortBreak.time);
                            }
                        } else {
                            setMode('work');
                            setTimeLeft(MODES.work.time);
                        }

                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [isActive, timeLeft, mode, sessionsCompleted]);

    const toggleTimer = () => setIsActive(!isActive);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = (1 - timeLeft / MODES[mode].time) * 100;
    const strokeDashoffset = 955 - (955 * progress) / 100;

    return (
        <div className={`${styles.container} glass animate-fade-in`}>
            {/* Mode selection is hidden as per user request */}

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
                    {isActive ? 'pause' : 'start'}
                </button>
            </div>

            {/* Added a small indicator for session progress */}
            {sessionsCompleted > 0 && (
                <div style={{ fontSize: '0.8rem', opacity: 0.4 }}>
                    Sessions completed: {sessionsCompleted}
                </div>
            )}
        </div>
    );
}
