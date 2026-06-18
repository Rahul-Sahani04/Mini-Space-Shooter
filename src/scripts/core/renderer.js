export class GameRenderer {
    constructor(canvas, ctx, assetManager) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.assetManager = assetManager;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawStarfield(stars) {
        if (!stars) return;
        this.ctx.fillStyle = '#ffffff';
        stars.forEach(star => {
            this.ctx.globalAlpha = star.alpha;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;
    }

    drawPlayer(player) {
        // Draw dash trail
        if (player.isDashing) {
            this.ctx.globalAlpha = 0.3;
            player.dashTrail.forEach((pos, i) => {
                const alpha = i / player.dashTrail.length;
                this.ctx.globalAlpha = alpha * 0.3;
                this.ctx.drawImage(
                    player.frames[player.currentFrame],
                    pos.x - player.width / 2,
                    pos.y - player.height / 2,
                    player.width,
                    player.height
                );
            });
            this.ctx.globalAlpha = 1;
        }

        // Draw player
        this.ctx.drawImage(
            player.frames[player.currentFrame],
            player.x - player.width / 2,
            player.y - player.height / 2,
            player.width,
            player.height
        );
    }

    drawEnemy(enemy) {
        this.ctx.globalAlpha = 1;
        this.ctx.drawImage(
            enemy.frames[enemy.currentFrame],
            enemy.x - enemy.width / 2,
            enemy.y - enemy.height / 2,
            enemy.width,
            enemy.height
        );
    }

    drawProjectile(projectile) {
        this.ctx.globalAlpha = 1;
        if (!projectile || !projectile.active) return;

        // Defensive: fallback to projectile.image if available, else try assetManager
        let img = projectile.image;
        if (!img && this.assetManager && typeof this.assetManager.getImage === 'function') {
            img = this.assetManager.getImage(
                projectile.type === 'player' ? 'projectile_laser' : 'projectile_plasma'
            );
        }
        if (!img) {
            // Optionally log or handle missing image here
            return;
        }
        this.ctx.drawImage(
            img,
            projectile.x - projectile.width / 2,
            projectile.y - projectile.height / 2,
            projectile.width,
            projectile.height
        );
    }

    drawExplosion(explosion) {
        if (!explosion.isComplete && explosion.frames[explosion.currentFrame]) {
            this.ctx.drawImage(
                explosion.frames[explosion.currentFrame],
                explosion.x - explosion.width / 2,
                explosion.y - explosion.height / 2,
                explosion.width,
                explosion.height
            );
        }
    }

    drawPowerUp(powerup) {
        this.ctx.drawImage(
            powerup.sprite,
            powerup.x - powerup.width / 2,
            powerup.y - powerup.height / 2,
            powerup.width,
            powerup.height
        );

        // Draw powerup glow effect
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(powerup.x, powerup.y, powerup.width * 0.7, 0, Math.PI * 2);
        this.ctx.fillStyle = this.getPowerUpGlowColor(powerup.type);
        this.ctx.globalAlpha = 0.2;
        this.ctx.fill();
        this.ctx.restore();
    }

    getPowerUpGlowColor(type) {
        switch(type) {
            case 'health': return '#4f4';
            case 'shield': return '#44f';
            case 'ammo': return '#f44';
            case 'multishot': return '#ff0';
            case 'novabomb': return '#fff';
            case 'bullettime': return '#4af';
            default: return '#fff';
        }
    }

    drawUI(gameState) {
        // Draw combo counter if active
        if (gameState.comboCount > 1) {
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = '#f4f';
            this.ctx.fillText(`${gameState.comboCount}x COMBO!`, this.canvas.width / 2, 40);
        }
    }

    drawBulletTimeOverlay(gameState) {
        if (!gameState.bulletTimeActive) return;
        this.ctx.save();
        this.ctx.globalAlpha = 0.08;
        this.ctx.fillStyle = '#4af';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
    }

    render(gameState, player, stars) {
        this.clear();

        this.drawStarfield(stars);

        // Draw game entities
        gameState.powerups.forEach(p => this.drawPowerUp(p));
        gameState.projectiles.forEach(p => this.drawProjectile(p));
        gameState.enemies.forEach(e => this.drawEnemy(e));
        gameState.explosions.forEach(e => this.drawExplosion(e));

        // Draw player last so it appears on top
        if (player) {
            this.drawPlayer(player);
        }

        // Bullet time tint
        this.drawBulletTimeOverlay(gameState);

        // Draw UI elements
        this.drawUI(gameState);
    }
}

export default GameRenderer;