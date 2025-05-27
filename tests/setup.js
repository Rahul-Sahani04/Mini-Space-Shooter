// Mock canvas and its context
class CanvasRenderingContext2D {
    beginPath() {}
    arc() {}
    fill() {}
    clearRect() {}
    drawImage() {}
    save() {}
    restore() {}
    translate() {}
    rotate() {}
    scale() {}
    fillRect() {}
    strokeRect() {}
    fillText() {}
    strokeText() {}
    createLinearGradient() {
        return {
            addColorStop() {}
        };
    }
    createRadialGradient() {
        return {
            addColorStop() {}
        };
    }
}

class HTMLCanvasElement {
    getContext() {
        return new CanvasRenderingContext2D();
    }
}

// Mock window properties and methods
global.window = {
    requestAnimationFrame: callback => setTimeout(callback, 0),
    addEventListener: () => {},
    removeEventListener: () => {},
    innerWidth: 1024,
    innerHeight: 768,
};

// Mock document
global.document = {
    createElement: (tag) => {
        if (tag === 'canvas') {
            return new HTMLCanvasElement();
        }
        return {
            style: {},
            className: '',
            appendChild: () => {},
            addEventListener: () => {},
            removeEventListener: () => {},
            setAttribute: () => {},
            getElementsByClassName: () => [],
            getElementById: () => null,
        };
    },
    getElementById: () => ({
        style: {},
        appendChild: () => {},
        removeChild: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        getContext: () => new CanvasRenderingContext2D(),
    }),
    body: {
        appendChild: () => {},
        removeChild: () => {},
    },
    addEventListener: () => {},
    removeEventListener: () => {},
};

// Mock localStorage
global.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
};

// Mock Audio
global.Audio = class {
    constructor() {
        this.volume = 1;
        this.currentTime = 0;
        this.paused = true;
        this.src = '';
        this.loop = false;
    }
    play() {
        this.paused = false;
        return Promise.resolve();
    }
    pause() {
        this.paused = true;
    }
};

// Mock Image
global.Image = class {
    constructor() {
        setTimeout(() => {
            this.onload && this.onload();
        });
    }
};

// Mock navigator
global.navigator = {
    userAgent: 'node',
};

// Mock console methods we want to test
global.console = {
    ...console,
    error: vi.fn(),
    warn: vi.fn(),
};

// Cleanup between tests
afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
});