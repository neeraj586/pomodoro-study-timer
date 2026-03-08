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
    fahhhh: '/assets/fahhhh.mp3',
    wow: '/assets/wow.mp3',
    drumroll: '/assets/drumroll.mp3',
};

const FOCUS_MUSIC = [
    'https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3',
    'https://assets.mixkit.co/music/preview/mixkit-dreaming-big-31.mp3',
    'https://assets.mixkit.co/music/preview/mixkit-a-very-happy-christmas-897.mp3',
    'https://assets.mixkit.co/music/preview/mixkit-hip-hop-02-738.mp3',
    'https://assets.mixkit.co/music/preview/mixkit-lofi-study-112.mp3',
];

const BREAK_MUSIC = '/assets/heavenly.mp3';

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
    const [isPaused, setIsPaused] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const musicRef = useRef<HTMLAudioElement | null>(null);

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

    const playBackgroundMusic = useCallback(() => {
        if (musicRef.current) {
            const randomIndex = Math.floor(Math.random() * FOCUS_MUSIC.length);
            musicRef.current.src = FOCUS_MUSIC[randomIndex];
            musicRef.current.load();
            musicRef.current.play().catch((err) => console.error('❌ Work music failed:', err));
        }
    }, []);

    const playBreakMusic = useCallback(() => {
        if (musicRef.current) {
            musicRef.current.src = BREAK_MUSIC;
            musicRef.current.load();
            musicRef.current.play().catch((err) => console.error('❌ Break music failed:', err));
        }
    }, []);

    const pauseBackgroundMusic = useCallback(() => {
        if (musicRef.current && !musicRef.current.paused) {
            musicRef.current.pause();
        }
    }, []);

    useEffect(() => {
        if (typeof document !== 'undefined') {
            if (isPaused) {
                document.body.classList.add('state-paused');
            } else {
                document.body.classList.remove('state-paused');
            }
        }
    }, [isPaused]);

    useEffect(() => {
        if (isActive && mode === 'work') {
            playBackgroundMusic();
        } else if (isActive && (mode === 'shortBreak' || mode === 'longBreak')) {
            playBreakMusic();
        } else if (!isActive) {
            pauseBackgroundMusic();
        }
    }, [isActive, mode, playBackgroundMusic, playBreakMusic, pauseBackgroundMusic]);

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        setIsActive(false);

                        if (mode === 'work') {
                            const newCount = sessionsCompleted + 1;
                            setSessionsCompleted(newCount);

                            playSound(SOUNDS.wow);

                            if (newCount === 1) {
                                setMessage("ok that actually counts. continue.");
                            } else {
                                setMessage('you cooked.');
                            }

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
                            playSound(SOUNDS.drumroll);
                            setMode('work');
                            setTimeLeft(MODES.work.time);
                            pickRandomGif();
                            setMessage("drum roll... time to lock in again!");
                            setTimeout(() => setMessage(''), 5000);
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
            if (mode === 'work' && timeLeft > 0 && timeLeft < MODES.work.time) {
                playSound(SOUNDS.fahhhh);
                setMessage('tragic focus drop.');
                setIsFlashing(true);
                setTimeout(() => {
                    setIsFlashing(false);
                    setMessage('');
                }, 3000);
            }
            setIsActive(false);
            setIsPaused(true);
        } else {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
            if (mode === 'work' && timeLeft === MODES.work.time) {
                pickRandomGif();
            }
            setIsActive(true);
            setIsPaused(false);
            setMessage('');

            if (mode === 'work') {
                playBackgroundMusic();
            } else if (mode === 'shortBreak' || mode === 'longBreak') {
                playBreakMusic();
            }
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getCharacterStatus = () => {
        if (mode === 'work') {
            if (!isActive && timeLeft === MODES.work.time) return "locked in";
            if (isActive) return "locked in";
            if (!isActive && timeLeft < MODES.work.time) return "tragic focus drop";
        }
        if (mode === 'shortBreak' || mode === 'longBreak') return "we move";
        return "locked in";
    };

    const getCharacterImage = () => {
        if (mode === 'work') {
            if (!isActive && timeLeft === MODES.work.time) return '/assets/frog_energy.png';
            if (!isActive && timeLeft < MODES.work.time) return '/assets/frog_tired.png';

            const progress = (1 - timeLeft / MODES.work.time);
            if (progress > 0.8) return '/assets/frog_tired.png';
            return '/assets/frog_focused.png';
        }
        return '/assets/frog_melted.png';
    };

    const progress = (1 - timeLeft / MODES[mode].time) * 100;
    const strokeDashoffset = 955 - (955 * progress) / 100;

    return (
        <div className={`${styles.container} animate-fade-in ${isFlashing ? 'animate-flash-red' : ''}`}>

            <div className={styles.timerCircle}>
                <img
                    src={getCharacterImage()}
                    alt="Character Status"
                    className={styles.backgroundGif}
                    style={{ opacity: 0.8 }}
                />

                <svg className={styles.progressRing}>
                    <circle
                        className={styles.progressPath}
                        cx="152"
                        cy="152"
                        r="150"
                        stroke="#fff"
                        strokeDasharray="955"
                        strokeDashoffset={strokeDashoffset}
                    />
                </svg>

                <div className={styles.contentOverlay}>
                    <span className={styles.statusText}>{getCharacterStatus()}</span>
                    <div className={styles.timerDisplay}>
                        {formatTime(timeLeft)}
                    </div>

                    <button className={styles.iconButton} onClick={toggleTimer} aria-label={isActive ? 'Pause' : 'Start'}>
                        {isActive ? (
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="6" y="4" width="4" height="16"></rect>
                                <rect x="14" y="4" width="4" height="16"></rect>
                            </svg>
                        ) : (
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="5 3 19 12 5 21 5 3"></polygon>
                            </svg>
                        )}
                    </button>

                    {sessionsCompleted > 0 && (
                        <div style={{ fontSize: '0.7rem', opacity: 0.8, marginTop: '0.5rem' }}>
                            DONE: {sessionsCompleted}
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.message}>
                {message}
            </div>

            <audio
                ref={musicRef}
                loop
                style={{ display: 'none' }}
                onError={(e) => console.error('❌ Audio error:', e)}
            />
        </div>
    );
}
