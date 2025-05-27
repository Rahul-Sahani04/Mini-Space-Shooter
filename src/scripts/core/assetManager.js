import { ASSETS } from '../utils/constants.js';

class AssetLoadingError extends Error {
    constructor(assetType, assetKey, originalError) {
        super(`Failed to load ${assetType}: ${assetKey}`);
        this.name = 'AssetLoadingError';
        this.assetType = assetType;
        this.assetKey = assetKey;
        this.originalError = originalError;
    }
}

class ErrorUIManager {
    constructor() {
        this.errorContainer = document.createElement('div');
        this.errorContainer.className = 'error-container';
        document.body.appendChild(this.errorContainer);

        this.addStyles();
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .error-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 2000;
                max-width: 400px;
            }

            .error-message {
                background: rgba(220, 38, 38, 0.9);
                color: white;
                padding: 1rem;
                margin-bottom: 0.5rem;
                border-radius: 4px;
                font-size: 14px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .error-message button {
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: white;
                padding: 0.25rem 0.5rem;
                border-radius: 2px;
                cursor: pointer;
                margin-left: 1rem;
            }

            .error-message button:hover {
                background: rgba(255, 255, 255, 0.3);
            }
        `;
        document.head.appendChild(style);
    }

    showError(error, retryCallback = null) {
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        
        const messageText = document.createElement('span');
        messageText.textContent = error.message;
        errorElement.appendChild(messageText);

        if (retryCallback) {
            const retryButton = document.createElement('button');
            retryButton.textContent = 'Retry';
            retryButton.onclick = () => {
                errorElement.remove();
                retryCallback();
            };
            errorElement.appendChild(retryButton);
        }

        this.errorContainer.appendChild(errorElement);

        if (!retryCallback) {
            setTimeout(() => errorElement.remove(), 5000);
        }
    }
}

export class AssetManager {
    constructor() {
        this.assets = {
            images: new Map(),
            audio: new Map(),
            sprites: new Map()
        };
        this.loadingPromises = [];
        this.totalAssets = 0;
        this.loadedAssets = 0;
        this.errorUI = new ErrorUIManager();
        this.failedAssets = new Set();
    }

    async loadImage(key, src, retryCount = 3) {
        try {
            const img = await this._loadImageWithRetry(key, src, retryCount);
            this.assets.images.set(key, img);
            this.loadedAssets++;
            this.updateLoadingProgress();
            this.failedAssets.delete(key);
            return img;
        } catch (error) {
            this.failedAssets.add(key);
            throw new AssetLoadingError('image', key, error);
        }
    }

    async _loadImageWithRetry(key, src, retriesLeft) {
        try {
            return await new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
                img.src = src;
            });
        } catch (error) {
            if (retriesLeft > 0) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                return this._loadImageWithRetry(key, src, retriesLeft - 1);
            }
            throw error;
        }
    }

    async loadAudio(key, src, retryCount = 3) {
        try {
            const audio = await this._loadAudioWithRetry(key, src, retryCount);
            this.assets.audio.set(key, audio);
            this.loadedAssets++;
            this.updateLoadingProgress();
            this.failedAssets.delete(key);
            return audio;
        } catch (error) {
            this.failedAssets.add(key);
            throw new AssetLoadingError('audio', key, error);
        }
    }

    async _loadAudioWithRetry(key, src, retriesLeft) {
        try {
            return await new Promise((resolve, reject) => {
                const audio = new Audio();
                audio.oncanplaythrough = () => resolve(audio);
                audio.onerror = () => reject(new Error(`Failed to load audio: ${src}`));
                audio.src = src;
            });
        } catch (error) {
            if (retriesLeft > 0) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                return this._loadAudioWithRetry(key, src, retriesLeft - 1);
            }
            throw error;
        }
    }

    async loadSpriteSheet(key, src, frameWidth, frameHeight, frameCount) {
        const img = await this.loadImage(`${key}_sheet`, src);
        const frames = [];
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = frameWidth;
        canvas.height = frameHeight;

        for (let i = 0; i < frameCount; i++) {
            ctx.clearRect(0, 0, frameWidth, frameHeight);
            ctx.drawImage(
                img,
                i * frameWidth, 0,
                frameWidth, frameHeight,
                0, 0,
                frameWidth, frameHeight
            );
            
            const frameCanvas = document.createElement('canvas');
            frameCanvas.width = frameWidth;
            frameCanvas.height = frameHeight;
            frameCanvas.getContext('2d').drawImage(canvas, 0, 0);
            frames.push(frameCanvas);
        }

        this.assets.sprites.set(key, frames);
        return frames;
    }

    updateLoadingProgress() {
        const progress = (this.loadedAssets / this.totalAssets) * 100;
        const loadingProgress = document.getElementById('loadingProgress');
        const loadingText = document.getElementById('loadingText');
        
        if (loadingProgress && loadingText) {
            loadingProgress.style.width = `${progress}%`;
            loadingText.textContent = `Loading assets... ${Math.round(progress)}%`;
        }
    }

    async loadAll() {
        this.loadingPromises = [];
        this.loadedAssets = 0;

        // Load projectile images
        for (const [key, src] of Object.entries(ASSETS.projectiles)) {
            this.loadingPromises.push(
                this.loadImage(`projectile_${key}`, src)
                    .catch(error => {
                        this.errorUI.showError(error, () => this.retryLoadAsset('image', key, src));
                        return null;
                    })
            );
        }

        // Load player sprite sheets
        // Load player frames as individual images
        const playerBlueFrames = [];
        ASSETS.player.blue.forEach((src, idx) => {
            this.loadingPromises.push(
                this.loadImage(`playerBlue_${idx + 1}`, src)
                    .then(img => { playerBlueFrames[idx] = img; })
                    .catch(error => {
                        this.errorUI.showError(error, () => this.retryLoadAsset('image', `playerBlue_${idx + 1}`, src));
                        return null;
                    })
            );
        });
        // After all frames loaded, store in sprites
        Promise.all(this.loadingPromises).then(() => {
            if (playerBlueFrames.length > 0) {
                this.assets.sprites.set('playerBlue', playerBlueFrames);
            }
        });

        // Load enemy sprite sheets
        // Load enemy frames as individual images
        for (const [type, frames] of Object.entries(ASSETS.enemies)) {
            const enemyFrames = [];
            frames.forEach((src, idx) => {
                this.loadingPromises.push(
                    this.loadImage(`enemy${type}_${idx + 1}`, src)
                        .then(img => { enemyFrames[idx] = img; })
                        .catch(error => {
                            this.errorUI.showError(error, () => this.retryLoadAsset('image', `enemy${type}_${idx + 1}`, src));
                            return null;
                        })
                );
            });
            // After all frames loaded, store in sprites
            Promise.all(this.loadingPromises).then(() => {
                if (enemyFrames.length > 0) {
                    this.assets.sprites.set(`enemy${type}`, enemyFrames);
                }
            });
        }

        // Load explosion frames as individual images
        ASSETS.explosions.forEach((src, idx) => {
            this.loadingPromises.push(
            this.loadImage(`explosion_${idx + 1}`, src)
                .catch(error => {
                this.errorUI.showError(error, () => this.retryLoadAsset('image', `explosion_${idx + 1}`, src));
                return null;
                })
            );
        });

        // Load powerup sprite sheets
        for (const [type, src] of Object.entries(ASSETS.powerups)) {
            this.loadingPromises.push(
            this.loadSpriteSheet(`powerup_${type}`, src, 128, 128, 1)
                .catch(error => {
                this.errorUI.showError(error, () => this.retryLoadAsset('sprite', `powerup_${type}`, src));
                return null;
                })
            );
        }


        // Load audio files
        const audioFiles = {
            'laser': 'assets/laserSound.wav',
            'explosion': 'assets/explosionSound.wav',
            'powerup': 'assets/powerupSound.wav',
            'startMissionSound': 'assets/SpaceMusicPack/fx/startLevel.wav',
            'bgMusic': 'assets/SpaceMusicPack/battle.wav',
            'bgMenuMusic': 'assets/SpaceMusicPack/menu.wav'
        };

        for (const [key, src] of Object.entries(audioFiles)) {
            this.loadingPromises.push(
                this.loadAudio(key, src)
                    .catch(error => {
                        this.errorUI.showError(error, () => this.retryLoadAsset('audio', key, src));
                        return null;
                    })
            );
        }

        this.totalAssets = this.loadingPromises.length;
        
        try {
            await Promise.all(this.loadingPromises);

            // Aggregate explosion frames into a sprite array under 'explosions'
            const explosionFrames = [];
            let idx = 1;
            while (this.assets.images.has(`explosion_${idx}`)) {
                explosionFrames.push(this.assets.images.get(`explosion_${idx}`));
                idx++;
            }
            if (explosionFrames.length > 0) {
                this.assets.sprites.set('explosions', explosionFrames);
            }

            if (this.failedAssets.size > 0) {
                const criticalAssets = ['playerBlue', 'projectile_laser'];
                const missingCritical = criticalAssets.some(asset => this.failedAssets.has(asset));
                
                if (missingCritical) {
                    throw new Error('Critical assets failed to load. Please refresh the page.');
                }
            }

            return this.assets;
        } catch (error) {
            console.error('Asset loading failed:', error);
            this.errorUI.showError(error);
            throw error;
        }
    }

    async retryLoadAsset(type, key, src) {
        try {
            if (type === 'image') {
                await this.loadImage(key, src);
            } else if (type === 'audio') {
                await this.loadAudio(key, src);
            } else if (type === 'sprite') {
                await this.loadSpriteSheet(key, src, 128, 128, 3);
            }
            this.errorUI.showError({
                message: `Successfully reloaded ${type}: ${key}`,
            });
        } catch (error) {
            this.errorUI.showError(error, () => this.retryLoadAsset(type, key, src));
        }
    }

    getImage(key) {
        const image = this.assets.images.get(key);
        if (!image) {
            this.errorUI.showError(new Error(`Image not found: ${key}`));
            return null;
        }
        return image;
    }

    getAudio(key) {
        const audio = this.assets.audio.get(key);
        if (!audio) {
            this.errorUI.showError(new Error(`Audio not found: ${key}`));
            return null;
        }
        return audio;
    }

    getSprite(key) {
        const sprite = this.assets.sprites.get(key);
        console.log(`Fetching sprite: ${key}`, sprite);
        if (!sprite) {
            this.errorUI.showError(new Error(`Sprite not found: ${key}`));
            return null;
        }
        return sprite;
    }
}

export default AssetManager;