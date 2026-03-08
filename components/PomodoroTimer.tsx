"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from './PomodoroTimer.module.css';
import SettingsPanel, { SoundKey, DEFAULT_SOUND_NAMES } from './SettingsPanel';
import { saveSound, loadAllSounds, deleteSound } from './soundsDb';

type Mode = 'work' | 'shortBreak' | 'longBreak';

const MODES: Record<Mode, { time: number; label: string; color: string }> = {
    work:       { time: 25 * 60, label: 'focus',      color: '#ff4d4d' },
    shortBreak: { time: 5 * 60,  label: 'break',      color: '#ff4d4d' },
    longBreak:  { time: 15 * 60, label: 'long break', color: '#ff4d4d' },
};

const DEFAULT_SOUNDS: Record<SoundKey, string> = {
    wow:      '/assets/wow.mp3',
    fahhhh:   '/assets/fahhhh.mp3',
    heavenly: '/assets/heavenly.mp3',
    drumroll: '/assets/drumroll.mp3',
};

const FOCUS_MUSIC = [
    'https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3',
    'https://assets.mixkit.co/music/preview/mixkit-dreaming-big-31.mp3',
    'https://assets.mixkit.co/music/preview/mixkit-a-very-happy-christmas-897.mp3',
    'https://assets.mixkit.co/music/preview/mixkit-hip-hop-02-738.mp3',
    'https://assets.mixkit.co/music/preview/mixkit-lofi-study-112.mp3',
];

const GIFS = [
    '/gifs/2.gif', '/gifs/3.gif', '/gifs/4.gif',
    '/gifs/5.gif', '/gifs/6.gif', '/gifs/7.gif',
    '/gifs/kermit-typing.gif',
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
    const [showSettings, setShowSettings] = useState(false);

    // Custom sound URLs (blob URLs or default paths)
    const [soundUrls, setSoundUrls] = useState<Record<SoundKey, string>>(DEFAULT_SOUNDS);
    const [soundNames, setSoundNames] = useState<Record<SoundKey, string>>(DEFAULT_SOUND_NAMES);

    // Ref so interval callbacks always read the latest URLs without stale closures
    const soundUrlsRef = useRef(soundUrls);
    useEffect(() => { soundUrlsRef.current = soundUrls; }, [soundUrls]);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const musicRef = useRef<HTMLAudioElement | null>(null);

    // Load persisted custom sounds from IndexedDB on mount
    useEffect(() => {
        loadAllSounds().then(saved => {
            const newUrls = { ...DEFAULT_SOUNDS };
            const newNames = { ...DEFAULT_SOUND_NAMES };
            for (const [key, entry] of Object.entries(saved)) {
                if (key in DEFAULT_SOUNDS) {
                    newUrls[key as SoundKey] = URL.createObjectURL(entry.blob);
                    newNames[key as SoundKey] = entry.name;
                }
            }
            setSoundUrls(newUrls);
            setSoundNames(newNames);
        }).catch(console.error);
    }, []);

    const pickRandomGif = useCallback(() => {
        setCurrentGif(GIFS[Math.floor(Math.random() * GIFS.length)]);
    }, []);

    // One-shot sound effects
    const playSound = (key: SoundKey) => {
        if (typeof window === 'undefined') return;
        if (audioRef.current) audioRef.current.pause();
        audioRef.current = new Audio(soundUrlsRef.current[key]);
        audioRef.current.play().catch(() => {});
    };

    const playBackgroundMusic = useCallback(() => {
        if (!musicRef.current) return;
        const idx = Math.floor(Math.random() * FOCUS_MUSIC.length);
        musicRef.current.src = FOCUS_MUSIC[idx];
        musicRef.current.load();
        musicRef.current.play().catch(() => {});
    }, []);

    const playBreakMusic = useCallback(() => {
        if (!musicRef.current) return;
        musicRef.current.src = soundUrlsRef.current.heavenly;
        musicRef.current.load();
        musicRef.current.play().catch(() => {});
    }, []);

    const pauseBackgroundMusic = useCallback(() => {
        if (musicRef.current && !musicRef.current.paused) musicRef.current.pause();
    }, []);

    // Body class for paused state styling
    useEffect(() => {
        if (typeof document === 'undefined') return;
        document.body.classList.toggle('state-paused', isPaused);
    }, [isPaused]);

    // Drive background music from timer state
    useEffect(() => {
        if (isActive && mode === 'work') {
            playBackgroundMusic();
        } else if (isActive && (mode === 'shortBreak' || mode === 'longBreak')) {
            playBreakMusic();
        } else if (!isActive) {
            pauseBackgroundMusic();
        }
    }, [isActive, mode, playBackgroundMusic, playBreakMusic, pauseBackgroundMusic]);

    // Countdown interval
    useEffect(() => {
        if (!isActive || timeLeft <= 0) return;
        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    setIsActive(false);
                    if (mode === 'work') {
                        const newCount = sessionsCompleted + 1;
                        setSessionsCompleted(newCount);
                        playSound('wow');
                        setMessage(newCount === 1 ? "ok that actually counts. continue." : 'you cooked.');
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
                        playSound('drumroll');
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
        return () => clearInterval(interval);
    }, [isActive, timeLeft, mode, sessionsCompleted, pickRandomGif]);

    const toggleTimer = () => {
        if (isActive) {
            if (mode === 'work' && timeLeft > 0 && timeLeft < MODES.work.time) {
                playSound('fahhhh');
                setMessage('tragic focus drop.');
                setIsFlashing(true);
                setTimeout(() => { setIsFlashing(false); setMessage(''); }, 3000);
            }
            setIsActive(false);
            setIsPaused(true);
        } else {
            if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
            if (mode === 'work' && timeLeft === MODES.work.time) pickRandomGif();
            setIsActive(true);
            setIsPaused(false);
            setMessage('');
            if (mode === 'work') playBackgroundMusic();
            else playBreakMusic();
        }
    };

    // Settings: handle sound file change
    const handleSoundChange = async (key: SoundKey, file: File) => {
        const old = soundUrls[key];
        if (old !== DEFAULT_SOUNDS[key]) URL.revokeObjectURL(old);
        const url = URL.createObjectURL(file);
        setSoundUrls(prev => ({ ...prev, [key]: url }));
        setSoundNames(prev => ({ ...prev, [key]: file.name }));
        await saveSound(key, file);
    };

    // Settings: reset a sound back to default
    const handleSoundReset = async (key: SoundKey) => {
        const old = soundUrls[key];
        if (old !== DEFAULT_SOUNDS[key]) URL.revokeObjectURL(old);
        setSoundUrls(prev => ({ ...prev, [key]: DEFAULT_SOUNDS[key] }));
        setSoundNames(prev => ({ ...prev, [key]: DEFAULT_SOUND_NAMES[key] }));
        await deleteSound(key);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const getCharacterStatus = () => {
        if (mode === 'work') {
            if (isActive) return "locked in";
            if (timeLeft < MODES.work.time) return "tragic focus drop";
            return "locked in";
        }
        return "we move";
    };

    const getCharacterImage = () => {
        if (mode === 'work') {
            if (!isActive && timeLeft === MODES.work.time) return '/assets/frog_energy.png';
            if (!isActive && timeLeft < MODES.work.time) return '/assets/frog_tired.png';
            return (1 - timeLeft / MODES.work.time) > 0.8 ? '/assets/frog_tired.png' : '/assets/frog_focused.png';
        }
        return '/assets/frog_melted.png';
    };

    const progress = (1 - timeLeft / MODES[mode].time) * 100;
    const strokeDashoffset = 955 - (955 * progress) / 100;

    return (
        <div className={`${styles.container} animate-fade-in ${isFlashing ? 'animate-flash-red' : ''}`}>

            {/* Settings gear button */}
            <button
                className={styles.settingsButton}
                onClick={() => setShowSettings(true)}
                aria-label="Sound settings"
                title="Customize sounds"
            >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
            </button>

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
                        cx="152" cy="152" r="150"
                        stroke="#fff"
                        strokeDasharray="955"
                        strokeDashoffset={strokeDashoffset}
                    />
                </svg>
                <div className={styles.contentOverlay}>
                    <span className={styles.statusText}>{getCharacterStatus()}</span>
                    <div className={styles.timerDisplay}>{formatTime(timeLeft)}</div>
                    <button className={styles.iconButton} onClick={toggleTimer} aria-label={isActive ? 'Pause' : 'Start'}>
                        {isActive ? (
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
                            </svg>
                        ) : (
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="5 3 19 12 5 21 5 3"/>
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

            <div className={styles.message}>{message}</div>

            <audio ref={musicRef} loop style={{ display: 'none' }} onError={() => {}} />

            {showSettings && (
                <SettingsPanel
                    soundNames={soundNames}
                    onSoundChange={handleSoundChange}
                    onSoundReset={handleSoundReset}
                    onClose={() => setShowSettings(false)}
                />
            )}
        </div>
    );
}
