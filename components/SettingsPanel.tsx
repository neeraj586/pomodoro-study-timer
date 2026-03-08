"use client";

import React, { useRef } from 'react';
import styles from './SettingsPanel.module.css';

export type SoundKey = 'wow' | 'fahhhh' | 'heavenly' | 'drumroll';

const SOUND_LABELS: Record<SoundKey, { label: string; description: string }> = {
    wow:      { label: 'session complete',  description: 'plays when 25 min is done' },
    fahhhh:   { label: 'stopped early',     description: 'plays when you quit mid-session' },
    heavenly: { label: 'break music',       description: 'loops during your break' },
    drumroll: { label: 'back to work',      description: 'plays when break ends' },
};

export const DEFAULT_SOUND_NAMES: Record<SoundKey, string> = {
    wow:      'wow.mp3',
    fahhhh:   'fahhhh.mp3',
    heavenly: 'heavenly.mp3',
    drumroll: 'drumroll.mp3',
};

interface SettingsPanelProps {
    soundNames: Record<SoundKey, string>;
    onSoundChange: (key: SoundKey, file: File) => void;
    onSoundReset: (key: SoundKey) => void;
    onClose: () => void;
}

export default function SettingsPanel({ soundNames, onSoundChange, onSoundReset, onClose }: SettingsPanelProps) {
    const fileInputRefs = useRef<Partial<Record<SoundKey, HTMLInputElement | null>>>({});

    const handleFileChange = (key: SoundKey, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) onSoundChange(key, file);
        e.target.value = '';
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.panel} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>customize sounds</h2>
                    <button className={styles.closeBtn} onClick={onClose}>✕</button>
                </div>

                <div className={styles.soundList}>
                    {(Object.keys(SOUND_LABELS) as SoundKey[]).map((key) => {
                        const { label, description } = SOUND_LABELS[key];
                        const isCustom = soundNames[key] !== DEFAULT_SOUND_NAMES[key];
                        return (
                            <div key={key} className={styles.soundRow}>
                                <div className={styles.soundInfo}>
                                    <span className={styles.soundLabel}>{label}</span>
                                    <span className={styles.soundDesc}>{description}</span>
                                    <span className={`${styles.fileName} ${isCustom ? styles.fileNameCustom : ''}`}>
                                        {soundNames[key]}
                                    </span>
                                </div>
                                <div className={styles.soundActions}>
                                    <button
                                        className={styles.chooseBtn}
                                        onClick={() => fileInputRefs.current[key]?.click()}
                                    >
                                        choose
                                    </button>
                                    {isCustom && (
                                        <button
                                            className={styles.resetBtn}
                                            onClick={() => onSoundReset(key)}
                                        >
                                            reset
                                        </button>
                                    )}
                                    <input
                                        ref={el => { fileInputRefs.current[key] = el; }}
                                        type="file"
                                        accept="audio/*"
                                        style={{ display: 'none' }}
                                        onChange={e => handleFileChange(key, e)}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
