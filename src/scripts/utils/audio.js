export class AudioManager {
    constructor() {
        this.sounds = new Map();
        this.musicVolume = 0.2;
        this.sfxVolume = 0.5;
        this.isMuted = false;

        // Load stored volume settings
        this.loadSettings();
    }

    loadSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('audioSettings')) || {};
            this.musicVolume = settings.musicVolume ?? 0.2;
            this.sfxVolume = settings.sfxVolume ?? 0.5;
            this.isMuted = settings.isMuted ?? false;
        } catch (error) {
            console.warn('Failed to load audio settings:', error);
        }
    }

    saveSettings() {
        try {
            const settings = {
                musicVolume: this.musicVolume,
                sfxVolume: this.sfxVolume,
                isMuted: this.isMuted
            };
            localStorage.setItem('audioSettings', JSON.stringify(settings));
        } catch (error) {
            console.warn('Failed to save audio settings:', error);
        }
    }

    registerSound(key, element) {
        if (!(element instanceof HTMLAudioElement)) {
            throw new Error('Sound element must be an HTMLAudioElement');
        }
        
        this.sounds.set(key, element);
        
        // Apply current volume settings
        if (key.includes('Music')) {
            element.volume = this.isMuted ? 0 : this.musicVolume;
        } else {
            element.volume = this.isMuted ? 0 : this.sfxVolume;
        }
    }

    play(key, options = {}) {
        const sound = this.sounds.get(key);
        if (!sound) return;

        try {
            if (options.loop) {
                sound.loop = true;
            }
            
            if (options.restart || !options.overlap) {
                sound.currentTime = 0;
            }

            // Create a new audio instance for overlapping sounds
            if (options.overlap && !sound.paused) {
                const clone = sound.cloneNode();
                clone.volume = sound.volume;
                clone.play().catch(err => console.warn('Audio autoplay prevented:', err));
                return;
            }

            sound.play().catch(err => console.warn('Audio autoplay prevented:', err));
        } catch (error) {
            console.warn('Failed to play sound:', key, error);
        }
    }

    stop(key) {
        const sound = this.sounds.get(key);
        if (!sound) return;

        try {
            sound.pause();
            sound.currentTime = 0;
        } catch (error) {
            console.warn('Failed to stop sound:', key, error);
        }
    }

    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        this.sounds.forEach((sound, key) => {
            if (key.includes('Music')) {
                sound.volume = this.isMuted ? 0 : this.musicVolume;
            }
        });
        this.saveSettings();
    }

    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        this.sounds.forEach((sound, key) => {
            if (!key.includes('Music')) {
                sound.volume = this.isMuted ? 0 : this.sfxVolume;
            }
        });
        this.saveSettings();
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        this.sounds.forEach((sound, key) => {
            if (key.includes('Music')) {
                sound.volume = this.isMuted ? 0 : this.musicVolume;
            } else {
                sound.volume = this.isMuted ? 0 : this.sfxVolume;
            }
        });
        this.saveSettings();
        return this.isMuted;
    }

    pauseAll() {
        this.sounds.forEach(sound => {
            try {
                sound.pause();
            } catch (error) {
                console.warn('Failed to pause sound:', error);
            }
        });
    }

    resumeAll() {
        this.sounds.forEach(sound => {
            if (sound.dataset.wasPlaying) {
                try {
                    sound.play().catch(err => console.warn('Audio autoplay prevented:', err));
                } catch (error) {
                    console.warn('Failed to resume sound:', error);
                }
            }
        });
    }

    // Save playing state before pause
    savePlayingState() {
        this.sounds.forEach(sound => {
            sound.dataset.wasPlaying = !sound.paused;
        });
    }
}

// Create singleton instance
const audioManager = new AudioManager();
export default audioManager;