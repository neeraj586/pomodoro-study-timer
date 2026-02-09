"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from './PomodoroTimer.module.css';

type Mode = 'work' | 'shortBreak' | 'longBreak';

const MODES: Record<Mode, { time: number; label: string; color: string }> = {
    work: { time: 25 * 60, label: 'focus', color: '#ff4d4d' },
    shortBreak: { time: 5 * 60, label: 'break', color: '#ff4d4d' },
    longBreak: { time: 15 * 60, label: 'long break', color: '#ff4d4d' },
};

const SOUNDS = {
    madiyan: '/assets/Trimmed_Madiyan.mp3',
    celebration: '/assets/Celebration.mp3',
};

const GIFS = [
    '/gifs/2.gif',
    '/gifs/3.gif',
    '/gifs/4.gif',
    '/gifs/5.gif',
    '/gifs/6.gif',
    '/gifs/7.gif',
    '/gifs/kermit-typing.gif'
];

export default function PomodoroTimer() {
    const [mode, setMode] = useState<Mode>('work');
    const [timeLeft, setTimeLeft] = useState(MODES.work.time);
    const [isActive, setIsActive] = useState(false);
    const [sessionsCompleted, setSessionsCompleted] = useState(0);
    const [isFlashing, setIsFlashing] = useState(false);
    const [message, setMessage] = useState<string>('');
    const [currentGif, setCurrentGif] = useState<string>(GIFS[0]);

    const audioRef = useRef<HTMLAudioElement | null>(null);

    const pickRandomGif = useCallback(() => {
        const randomIndex = Math.floor(Math.random() * GIFS.length);
        setCurrentGif(GIFS[randomIndex]);
    }, []);

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

                            // Completion logic
                            playSound(SOUNDS.celebration);
                            setMessage('NINGALITHU KANUKAAA..YOU ARE A GENIUS. you did not mess it up.');
                            setTimeout(() => setMessage(''), 8000);

                            if (newCount % 4 === 0) {
                                setMode('longBreak');
                                setTimeLeft(MODES.longBreak.time);
                                setMessage('MADIYAN MALA CHUMANNU CHAAKUM.');
                            } else {
                                setMode('shortBreak');
                                setTimeLeft(MODES.shortBreak.time);
                            }
                        } else {
                            setMode('work');
                            setTimeLeft(MODES.work.time);
                            pickRandomGif(); // New GIF for new focus session
                        }

                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [isActive, timeLeft, mode, sessionsCompleted, pickRandomGif]);

    const toggleTimer = () => {
        if (isActive) {
            // Interruption logic
            if (mode === 'work' && timeLeft > 0 && timeLeft < MODES.work.time) {
                playSound(SOUNDS.madiyan);
                setMessage('MADIYAN MALA CHUMAKUM.');
                setIsFlashing(true);
                setTimeout(() => {
                    setIsFlashing(false);
                    setMessage('');
                }, 3000);
            }
            setIsActive(false);
        } else {
            // Resuming or starting
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
            // If starting a fresh focus session
            if (mode === 'work' && timeLeft === MODES.work.time) {
                pickRandomGif();
            }
            setIsActive(true);
            setMessage('');
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

            <div className={styles.timerCircle}>
                {isActive && mode === 'work' && (
                    <img src={currentGif} alt="Focus Background" className={styles.backgroundGif} />
                )}
                <svg className={styles.progressRing}>
                    <circle
                        className={styles.progressPath}
                        cx="152"
                        cy="152"
                        r="150"
                        stroke="#ff4d4d"
                        strokeDasharray="955"
                        strokeDashoffset={strokeDashoffset}
                    />
                </svg>
                <span className={styles.statusText} style={{ position: 'relative', zIndex: 1 }}>{MODES[mode].label}</span>
                <div className={styles.timerDisplay} style={{ position: 'relative', zIndex: 1 }}>
                    {formatTime(timeLeft)}
                </div>
            </div>

            <div className={styles.message}>
                {message}
            </div>

            <div className={styles.controls}>
                <button className={styles.mainButton} onClick={toggleTimer}>
                    {isActive ? 'pause' : 'start'}
                </button>
            </div>

            {sessionsCompleted > 0 && (
                <div style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '1rem' }}>
                    sessions complete: {sessionsCompleted}
                </div>
            )}
        </div>
    );
}
