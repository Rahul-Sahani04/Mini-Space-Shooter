import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    root: '.',
    publicDir: 'public',
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        sourcemap: true,
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html')
            },
            output: {
                manualChunks: {
                    core: [
                        './src/scripts/core/game.js',
                        './src/scripts/core/renderer.js',
                        './src/scripts/core/assetManager.js'
                    ],
                    entities: [
                        './src/scripts/entities/player.js',
                        './src/scripts/entities/enemy.js',
                        './src/scripts/entities/projectile.js',
                        './src/scripts/entities/powerup.js',
                        './src/scripts/entities/explosion.js'
                    ],
                    states: [
                        './src/scripts/states/gameState.js',
                        './src/scripts/states/menuState.js',
                        './src/scripts/states/playingState.js',
                        './src/scripts/states/gameOverState.js',
                        './src/scripts/states/pausedState.js'
                    ],
                    utils: [
                        './src/scripts/utils/constants.js',
                        './src/scripts/utils/collision.js',
                        './src/scripts/utils/tutorial.js',
                        './src/scripts/utils/audio.js',
                        './src/scripts/utils/storage.js',
                        './src/scripts/utils/achievements.js',
                        './src/scripts/utils/particles.js',
                        './src/scripts/utils/helpers.js'
                    ]
                }
            }
        }
    },
    server: {
        port: 3000,
        open: true,
        cors: true
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
            '@scripts': resolve(__dirname, './src/scripts'),
            '@assets': resolve(__dirname, './public/assets')
        }
    }
});