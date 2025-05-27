import { random, randomInt, lerp } from './helpers.js';

class Particle {
    constructor(x, y, options = {}) {
        this.x = x;
        this.y = y;
        this.vx = options.vx || random(-2, 2);
        this.vy = options.vy || random(-2, 2);
        this.gravity = options.gravity || 0;
        this.life = options.life || random(30, 60);
        this.maxLife = this.life;
        this.color = options.color || '#fff';
        this.size = options.size || random(2, 4);
        this.alpha = 1;
        this.rotation = random(0, Math.PI * 2);
        this.rotationSpeed = options.rotationSpeed || random(-0.1, 0.1);
        this.shape = options.shape || 'circle';
        this.fromPool = options.fromPool || false;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.life--;
        this.alpha = this.life / this.maxLife;
        this.rotation += this.rotationSpeed;
        return this.life > 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        switch (this.shape) {
            case 'square':
                ctx.fillStyle = this.color;
                ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
                break;
            case 'star':
                this.drawStar(ctx, 0, 0, 5, this.size, this.size/2);
                break;
            case 'spark':
                this.drawSpark(ctx);
                break;
            default: // circle
                ctx.beginPath();
                ctx.arc(0, 0, this.size, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();
        }

        ctx.restore();
    }

    drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
        ctx.beginPath();
        ctx.fillStyle = this.color;
        
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / spikes;
            const x = cx + Math.cos(angle) * radius;
            const y = cy + Math.sin(angle) * radius;
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        
        ctx.closePath();
        ctx.fill();
    }

    drawSpark(ctx) {
        ctx.beginPath();
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.size / 2;
        ctx.moveTo(-this.size, 0);
        ctx.lineTo(this.size, 0);
        ctx.moveTo(0, -this.size);
        ctx.lineTo(0, this.size);
        ctx.stroke();
    }

    reset(x, y, options = {}) {
        Object.assign(this, new Particle(x, y, { ...options, fromPool: true }));
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
        this.pool = [];
        this.maxPoolSize = 1000;
    }

    getFromPool() {
        return this.pool.pop();
    }

    returnToPool(particle) {
        if (this.pool.length < this.maxPoolSize) {
            this.pool.push(particle);
        }
    }

    emit(x, y, options = {}) {
        const count = options.count || 1;
        for (let i = 0; i < count; i++) {
            const particle = this.getFromPool() || new Particle(x, y, options);
            if (particle.fromPool) {
                particle.reset(x, y, options);
            }
            this.particles.push(particle);
        }
    }

    createExplosion(x, y, options = {}) {
        const defaultOptions = {
            count: 20,
            color: '#ff0',
            size: random(2, 4),
            speed: 5,
            gravity: 0.1,
            life: random(30, 60)
        };

        const finalOptions = { ...defaultOptions, ...options };
        
        for (let i = 0; i < finalOptions.count; i++) {
            const angle = (i / finalOptions.count) * Math.PI * 2;
            const speed = finalOptions.speed * random(0.5, 1);
            
            this.emit(x, y, {
                ...finalOptions,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed
            });
        }
    }

    createTrail(x, y, options = {}) {
        const defaultOptions = {
            count: 1,
            color: '#4af',
            size: random(1, 2),
            gravity: -0.05,
            life: random(20, 30)
        };

        this.emit(x, y, { ...defaultOptions, ...options });
    }

    createPowerupSparkles(x, y, color) {
        const options = {
            count: 3,
            color: color,
            shape: 'star',
            size: random(2, 3),
            gravity: -0.02,
            life: random(40, 60)
        };

        this.emit(x, y, options);
    }

    update() {
        this.particles = this.particles.filter(particle => {
            const isAlive = particle.update();
            if (!isAlive && particle.fromPool) {
                this.returnToPool(particle);
            }
            return isAlive;
        });
    }

    draw(ctx) {
        this.particles.forEach(particle => particle.draw(ctx));
    }

    clear() {
        this.particles = [];
    }
}

// Create singleton instance
const particleSystem = new ParticleSystem();
export default particleSystem;

// Export Particle class for direct usage if needed
export { Particle };