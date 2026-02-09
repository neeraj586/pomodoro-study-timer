"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from './PomodoroTimer.module.css';

type Mode = 'work' | 'shortBreak' | 'longBreak';

const MODES: Record<Mode, { time: number; label: string; color: string }> = {
    work: { time: 25 * 60, label: 'Focus', color: 'var(--primary)' },
    shortBreak: { time: 5 * 60, label: 'Break', color: 'var(--secondary)' },
    longBreak: { time: 15 * 60, label: 'Long Break', color: '#8b0000' }, // Darker red
};

const SOUNDS = {
    firetruck: '/assets/freesound_community-firetruck-78910.mp3',
    anthem: '/assets/liverpool_anthem_-_you_ll_never_walk_alone_(mp3.pm).mp3'
};

export default function PomodoroTimer() {
    const [mode, setMode] = useState<Mode>('work');
    const [timeLeft, setTimeLeft] = useState(MODES.work.time);
    const [isActive, setIsActive] = useState(false);
    const [sessionsCompleted, setSessionsCompleted] = useState(0);
    const [isFlashing, setIsFlashing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);

    const playSound = (src: string) => {
        if (typeof window !== 'undefined') {
            if (audioRef.current) {
                audioRef.current.pause();
            }
            audioRef.current = new Audio(src);
            audioRef.current.play().catch(() => console.log('Audio playback blocked'));
        }
    };

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        setIsActive(false);

                        // Determine next mode
                        if (mode === 'work') {
                            const newCount = sessionsCompleted + 1;
                            setSessionsCompleted(newCount);

                            // 25 mins Focus complete logic
                            playSound(SOUNDS.anthem);
                            setShowSuccess(true);
                            setTimeout(() => setShowSuccess(false), 5000);

                            if (newCount % 4 === 0) {
                                setMode('longBreak');
                                setTimeLeft(MODES.longBreak.time);
                                // Long break starts: play fire engine
                                playSound(SOUNDS.firetruck);
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

    const toggleTimer = () => {
        if (isActive) {
            // Stopping before completion
            if (mode === 'work' && timeLeft > 0 && timeLeft < MODES.work.time) {
                playSound(SOUNDS.firetruck);
                setIsFlashing(true);
                setTimeout(() => setIsFlashing(false), 1000);
            }
            setIsActive(false);
        } else {
            setIsActive(true);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = (1 - timeLeft / MODES[mode].time) * 100;
    const strokeDashoffset = 955 - (955 * progress) / 100;

    return (
        <div className={`${styles.container} glass animate-fade-in ${isFlashing ? 'animate-flash-red' : ''}`}>

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

            {showSuccess && (
                <div style={{ color: 'var(--accent)', fontWeight: 'bold', margin: '1rem 0' }}>
                    GOALLLLL! FOCUS COMPLETE!
                </div>
            )}

            <div className={styles.controls}>
                <button className={styles.mainButton} onClick={toggleTimer}>
                    {isActive ? 'pause' : 'start'}
                </button>
            </div>

            {sessionsCompleted > 0 && (
                <div style={{ fontSize: '0.8rem', opacity: 0.4 }}>
                    Sessions completed: {sessionsCompleted}
                </div>
            )}
        </div>
    );
}
