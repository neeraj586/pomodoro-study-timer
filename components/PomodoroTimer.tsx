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

// Free royalty-free lofi music - you can replace these with your own tracks
// To add your own music: place MP3 files in public/assets/music/ and reference them here
const FOCUS_MUSIC = [
    'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3', // Lofi Study
    'https://cdn.pixabay.com/audio/2022/08/02/audio_4f0b29c9b7.mp3', // Chill Abstract
    'https://cdn.pixabay.com/audio/2022/03/15/audio_c8a7d0d1e8.mp3', // Lofi Chill
];

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
    const [isPaused, setIsPaused] = useState(false); // New state to track explicit pause
    const [isMusicMuted, setIsMusicMuted] = useState(false);
    const [currentMusicIndex, setCurrentMusicIndex] = useState(0);

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
        if (typeof window !== 'undefined' && !isMusicMuted) {
            if (musicRef.current) {
                musicRef.current.pause();
            }
            const randomIndex = Math.floor(Math.random() * FOCUS_MUSIC.length);
            setCurrentMusicIndex(randomIndex);
            musicRef.current = new Audio(FOCUS_MUSIC[randomIndex]);
            musicRef.current.loop = true;
            musicRef.current.volume = 0.3; // Set to 30% volume
            musicRef.current.play().catch(() => console.log('Music playback blocked'));
        }
    }, [isMusicMuted]);

    const stopBackgroundMusic = useCallback(() => {
        if (musicRef.current) {
            musicRef.current.pause();
            musicRef.current = null;
        }
    }, []);

    const toggleMusicMute = () => {
        setIsMusicMuted(!isMusicMuted);
        if (!isMusicMuted) {
            stopBackgroundMusic();
        } else if (isActive && mode === 'work') {
            playBackgroundMusic();
        }
    };

    // Effect to toggle body class for Red/Green background
    useEffect(() => {
        if (typeof document !== 'undefined') {
            if (isPaused) {
                document.body.classList.add('state-paused');
            } else {
                document.body.classList.remove('state-paused');
            }
        }
    }, [isPaused]);

    // Effect to control background music
    useEffect(() => {
        if (isActive && mode === 'work' && !isMusicMuted) {
            playBackgroundMusic();
        } else {
            stopBackgroundMusic();
        }

        return () => {
            stopBackgroundMusic();
        };
    }, [isActive, mode, isMusicMuted, playBackgroundMusic, stopBackgroundMusic]);


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

                            // Special message for first session
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
            // Interruption/Pause logic
            if (mode === 'work' && timeLeft > 0 && timeLeft < MODES.work.time) {
                playSound(SOUNDS.madiyan);
                setMessage('tragic focus drop.');
                setIsFlashing(true);
                setTimeout(() => {
                    setIsFlashing(false);
                    setMessage('');
                }, 3000);
            }
            setIsActive(false);
            setIsPaused(true); // Manually paused
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
            setIsPaused(false);
            setMessage('');
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
            if (!isActive && timeLeft < MODES.work.time) return "tragic focus drop"; // Paused
        }
        if (mode === 'shortBreak' || mode === 'longBreak') return "we move";
        return "locked in";
    };

    const getCharacterImage = () => {
        if (mode === 'work') {
            if (!isActive && timeLeft === MODES.work.time) return '/assets/frog_energy.png'; // Start: energetic
            if (!isActive && timeLeft < MODES.work.time) return '/assets/frog_tired.png'; // Paused: tired/annoyed

            // During focus: switch from focused to tired in last 20%
            const progress = (1 - timeLeft / MODES.work.time);
            if (progress > 0.8) return '/assets/frog_tired.png'; // Last 20%: tired
            return '/assets/frog_focused.png'; // Main focus state
        }
        return '/assets/frog_melted.png'; // Break: melted
    };

    const progress = (1 - timeLeft / MODES[mode].time) * 100;
    const strokeDashoffset = 955 - (955 * progress) / 100; // 955 is approx circumference

    return (
        <div className={`${styles.container} animate-fade-in ${isFlashing ? 'animate-flash-red' : ''}`}>

            <div className={styles.timerCircle}>
                {/* Character Image */}
                <img
                    src={getCharacterImage()}
                    alt="Character Status"
                    className={styles.backgroundGif}
                    style={{ opacity: 0.8 }}
                />

                {/* SVG Ring */}
                <svg className={styles.progressRing}>
                    <circle
                        className={styles.progressPath}
                        cx="152"
                        cy="152"
                        r="150"
                        stroke="#fff" /* Made white for better visibility on green/red */
                        strokeDasharray="955"
                        strokeDashoffset={strokeDashoffset}
                    />
                </svg>

                {/* Content Overlay */}
                <div className={styles.contentOverlay}>
                    <span className={styles.statusText}>{getCharacterStatus()}</span>
                    <div className={styles.timerDisplay}>
                        {formatTime(timeLeft)}
                    </div>

                    {/* Integrated Control Button (Icon) */}
                    <button className={styles.iconButton} onClick={toggleTimer} aria-label={isActive ? 'Pause' : 'Start'}>
                        {isActive ? (
                            // Pause Icon
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="6" y="4" width="4" height="16"></rect>
                                <rect x="14" y="4" width="4" height="16"></rect>
                            </svg>
                        ) : (
                            // Play Icon
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="5 3 19 12 5 21 5 3"></polygon>
                            </svg>
                        )}
                    </button>

                    {/* Session Counter Small */}
                    {sessionsCompleted > 0 && (
                        <div style={{ fontSize: '0.7rem', opacity: 0.8, marginTop: '0.5rem' }}>
                            DONE: {sessionsCompleted}
                        </div>
                    )}
                </div>
            </div>

            {/* Music Control Button */}
            <button
                className={styles.musicButton}
                onClick={toggleMusicMute}
                aria-label={isMusicMuted ? 'Unmute Music' : 'Mute Music'}
                title={isMusicMuted ? 'Unmute Music' : 'Mute Music'}
            >
                {isMusicMuted ? (
                    // Muted Icon
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                        <line x1="23" y1="9" x2="17" y2="15"></line>
                        <line x1="17" y1="9" x2="23" y2="15"></line>
                    </svg>
                ) : (
                    // Unmuted Icon
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                    </svg>
                )}
            </button>

            <div className={styles.message}>
                {message}
            </div>
        </div>
    );
}
