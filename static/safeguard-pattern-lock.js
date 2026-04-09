/**
 * SafeGuard Professional Pattern Lock System
 * A comprehensive, secure pattern lock implementation for women security applications
 * 
 * Features:
 * - Multi-layer validation and security
 * - Comprehensive error handling
 * - Accessibility support
 * - Touch and mouse optimization
 * - Visual feedback and animations
 * - Security breach detection
 * - Pattern strength analysis
 */

class SafeGuardPatternLock {
    constructor(containerId, options = {}) {
        // Validate container exists
        this.container = document.getElementById(containerId);
        if (!this.container) {
            throw new Error(`SafeGuard Pattern Lock: Container '${containerId}' not found`);
        }

        // Configuration with security defaults
        this.config = {
            minDots: Math.max(options.minDots || 4, 3), // Minimum 3 for security
            maxDots: Math.min(options.maxDots || 9, 9), // Maximum 9
            mode: options.mode || 'setup', // 'setup', 'confirm', 'verify'
            attempts: {
                max: options.maxAttempts || 5,
                lockoutDuration: options.lockoutDuration || 30000 // 30 seconds
            },
            security: {
                enableAntiBruteForce: options.enableAntiBruteForce !== false,
                enablePatternStrength: options.enablePatternStrength !== false,
                enableSessionTracking: options.enableSessionTracking !== false
            },
            ui: {
                title: options.title || 'Pattern Lock',
                subtitle: options.subtitle || 'Draw your security pattern',
                theme: options.theme || 'default', // 'default', 'dark', 'minimal'
                animations: options.animations !== false
            },
            callbacks: {
                onComplete: options.onComplete || function() {},
                onError: options.onError || function() {},
                onAttempt: options.onAttempt || function() {},
                onLockout: options.onLockout || function() {}
            }
        };

        // Internal state management
        this.state = {
            selectedDots: [],
            isDrawing: false,
            attempts: 0,
            isLocked: false,
            lockoutTimer: null,
            patternHistory: [],
            sessionStart: Date.now(),
            touchStartTime: 0,
            lastActivity: Date.now()
        };

        // Security tracking
        this.security = {
            failedAttempts: [],
            patternVelocity: [],
            suspiciousActivity: false
        };

        // Initialize the pattern lock
        this.init();
    }

    /**
     * Initialize the pattern lock system
     */
    init() {
        try {
            this.injectStyles();
            this.createUI();
            this.bindEvents();
            this.setupAccessibility();
            this.validateConfiguration();
            
            console.log('SafeGuard Pattern Lock initialized successfully');
            this.logEvent('PATTERN_LOCK_INITIALIZED', { mode: this.config.mode });
            
        } catch (error) {
            console.error('SafeGuard Pattern Lock initialization failed:', error);
            this.config.callbacks.onError({
                type: 'INITIALIZATION_ERROR',
                message: 'Failed to initialize pattern lock',
                error: error
            });
        }
    }

    /**
     * Inject professional CSS styles
     */
    injectStyles() {
        if (document.getElementById('safeguard-pattern-lock-styles')) return;

        const styles = `
        <style id="safeguard-pattern-lock-styles">
        .safeguard-pattern-lock {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            text-align: center;
            padding: 24px;
            background: linear-gradient(145deg, #ffffff, #f8f9fa);
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            max-width: 320px;
            margin: 0 auto;
            position: relative;
            overflow: hidden;
        }

        .safeguard-pattern-lock::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #667eea, #764ba2, #f093fb);
            border-radius: 16px 16px 0 0;
        }

        .safeguard-pattern-header {
            margin-bottom: 24px;
        }

        .safeguard-pattern-title {
            font-size: 1.5rem;
            font-weight: 600;
            color: #2d3748;
            margin: 0 0 8px 0;
            letter-spacing: -0.025em;
        }

        .safeguard-pattern-subtitle {
            font-size: 0.875rem;
            color: #718096;
            margin: 0;
            line-height: 1.5;
        }

        .safeguard-pattern-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            width: 240px;
            height: 240px;
            margin: 24px auto;
            position: relative;
            touch-action: none;
            user-select: none;
        }

        .safeguard-pattern-dot {
            width: 64px;
            height: 64px;
            border: 3px solid #e2e8f0;
            border-radius: 50%;
            background: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            color: #a0aec0;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            cursor: pointer;
            position: relative;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .safeguard-pattern-dot::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            background: radial-gradient(circle, rgba(102, 126, 234, 0.3) 0%, transparent 70%);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            transition: all 0.3s ease;
            z-index: -1;
        }

        .safeguard-pattern-dot:hover {
            border-color: #667eea;
            color: #667eea;
            transform: scale(1.05);
        }

        .safeguard-pattern-dot:hover::before {
            width: 120%;
            height: 120%;
        }

        .safeguard-pattern-dot.selected {
            background: linear-gradient(135deg, #667eea, #764ba2);
            border-color: #667eea;
            color: #ffffff;
            transform: scale(1.1);
            box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
        }

        .safeguard-pattern-dot.selected::before {
            width: 150%;
            height: 150%;
            background: radial-gradient(circle, rgba(102, 126, 234, 0.6) 0%, transparent 70%);
        }

        .safeguard-pattern-dot.error {
            background: linear-gradient(135deg, #fc8181, #f56565);
            border-color: #fc8181;
            color: #ffffff;
            animation: safeguard-shake 0.5s ease-in-out;
        }

        .safeguard-pattern-grid.drawing {
            border: 2px solid #667eea;
            border-radius: 20px;
            background: rgba(102, 126, 234, 0.05);
            box-shadow: 0 0 30px rgba(102, 126, 234, 0.2);
        }

        .safeguard-pattern-grid.locked {
            opacity: 0.6;
            pointer-events: none;
            filter: grayscale(0.5);
        }

        .safeguard-pattern-message {
            margin: 20px 0;
            padding: 16px;
            border-radius: 12px;
            font-size: 0.875rem;
            font-weight: 500;
            display: none;
            animation: safeguard-slideIn 0.3s ease-out;
        }

        .safeguard-pattern-message.success {
            background: linear-gradient(135deg, #48bb78, #38a169);
            color: #ffffff;
            box-shadow: 0 4px 16px rgba(72, 187, 120, 0.3);
        }

        .safeguard-pattern-message.error {
            background: linear-gradient(135deg, #fc8181, #f56565);
            color: #ffffff;
            box-shadow: 0 4px 16px rgba(252, 129, 129, 0.3);
        }

        .safeguard-pattern-message.warning {
            background: linear-gradient(135deg, #ed8936, #dd6b20);
            color: #ffffff;
            box-shadow: 0 4px 16px rgba(237, 137, 54, 0.3);
        }

        .safeguard-pattern-message.info {
            background: linear-gradient(135deg, #4299e1, #3182ce);
            color: #ffffff;
            box-shadow: 0 4px 16px rgba(66, 153, 225, 0.3);
        }

        .safeguard-pattern-actions {
            margin-top: 24px;
            display: flex;
            gap: 12px;
            justify-content: center;
        }

        .safeguard-pattern-btn {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-size: 0.875rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            min-width: 80px;
        }

        .safeguard-pattern-btn.primary {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: #ffffff;
            box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
        }

        .safeguard-pattern-btn.primary:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
        }

        .safeguard-pattern-btn.secondary {
            background: #f7fafc;
            color: #4a5568;
            border: 1px solid #e2e8f0;
        }

        .safeguard-pattern-btn.secondary:hover {
            background: #edf2f7;
            border-color: #cbd5e0;
        }

        .safeguard-pattern-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none !important;
        }

        .safeguard-pattern-strength {
            margin: 16px 0;
            padding: 12px;
            background: rgba(0, 0, 0, 0.05);
            border-radius: 8px;
            font-size: 0.75rem;
        }

        .safeguard-pattern-strength-bar {
            width: 100%;
            height: 4px;
            background: #e2e8f0;
            border-radius: 2px;
            margin: 8px 0;
            overflow: hidden;
        }

        .safeguard-pattern-strength-fill {
            height: 100%;
            border-radius: 2px;
            transition: all 0.3s ease;
            background: linear-gradient(90deg, #fc8181, #ed8936, #48bb78);
        }

        .safeguard-pattern-attempts {
            font-size: 0.75rem;
            color: #718096;
            margin-top: 8px;
        }

        .safeguard-pattern-lockout {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            color: #ffffff;
            display: none;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            border-radius: 16px;
            z-index: 10;
        }

        .safeguard-pattern-lockout.show {
            display: flex;
            animation: safeguard-fadeIn 0.3s ease-out;
        }

        .safeguard-pattern-lockout-timer {
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 8px;
        }

        /* Animations */
        @keyframes safeguard-slideIn {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes safeguard-shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }

        @keyframes safeguard-fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        @keyframes safeguard-pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }

        /* Accessibility */
        @media (prefers-reduced-motion: reduce) {
            .safeguard-pattern-dot,
            .safeguard-pattern-btn,
            .safeguard-pattern-message {
                transition: none;
                animation: none;
            }
        }

        /* Responsive Design */
        @media (max-width: 480px) {
            .safeguard-pattern-lock {
                padding: 20px;
                margin: 16px;
            }
            
            .safeguard-pattern-grid {
                width: 200px;
                height: 200px;
                gap: 12px;
            }
            
            .safeguard-pattern-dot {
                width: 52px;
                height: 52px;
                font-size: 16px;
            }
            
            .safeguard-pattern-title {
                font-size: 1.25rem;
            }
        }

        /* Dark theme support */
        .safeguard-pattern-lock.dark {
            background: linear-gradient(145deg, #1a202c, #2d3748);
            color: #ffffff;
        }

        .safeguard-pattern-lock.dark .safeguard-pattern-title {
            color: #ffffff;
        }

        .safeguard-pattern-lock.dark .safeguard-pattern-subtitle {
            color: #a0aec0;
        }

        .safeguard-pattern-lock.dark .safeguard-pattern-dot {
            background: #2d3748;
            border-color: #4a5568;
            color: #a0aec0;
        }
        </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    }

    /**
     * Create the UI structure
     */
    createUI() {
        this.container.innerHTML = `
            <div class="safeguard-pattern-lock ${this.config.ui.theme === 'dark' ? 'dark' : ''}">
                <div class="safeguard-pattern-header">
                    <h3 class="safeguard-pattern-title">${this.config.ui.title}</h3>
                    <p class="safeguard-pattern-subtitle">${this.config.ui.subtitle}</p>
                </div>

                <div class="safeguard-pattern-grid" id="safeguardPatternGrid">
                    ${this.createPatternDots()}
                </div>

                ${this.config.security.enablePatternStrength ? `
                    <div class="safeguard-pattern-strength" id="safeguardPatternStrength" style="display: none;">
                        <div>Pattern Strength: <span id="safeguardPatternStrengthText">Unknown</span></div>
                        <div class="safeguard-pattern-strength-bar">
                            <div class="safeguard-pattern-strength-fill" id="safeguardPatternStrengthFill" style="width: 0%;"></div>
                        </div>
                    </div>
                ` : ''}

                <div class="safeguard-pattern-message" id="safeguardPatternMessage"></div>

                <div class="safeguard-pattern-actions">
                    <button class="safeguard-pattern-btn secondary" id="safeguardClearBtn">Clear</button>
                    ${this.config.mode === 'setup' ? '<button class="safeguard-pattern-btn secondary" id="safeguardCancelBtn">Cancel</button>' : ''}
                </div>

                <div class="safeguard-pattern-attempts" id="safeguardPatternAttempts" style="display: none;">
                    Attempts remaining: <span id="safeguardAttemptsRemaining">${this.config.attempts.max}</span>
                </div>

                <div class="safeguard-pattern-lockout" id="safeguardPatternLockout">
                    <div class="safeguard-pattern-lockout-timer" id="safeguardLockoutTimer">30</div>
                    <div>Account temporarily locked</div>
                </div>
            </div>
        `;

        // Cache DOM elements
        this.elements = {
            grid: this.container.querySelector('#safeguardPatternGrid'),
            message: this.container.querySelector('#safeguardPatternMessage'),
            clearBtn: this.container.querySelector('#safeguardClearBtn'),
            cancelBtn: this.container.querySelector('#safeguardCancelBtn'),
            attempts: this.container.querySelector('#safeguardPatternAttempts'),
            attemptsRemaining: this.container.querySelector('#safeguardAttemptsRemaining'),
            lockout: this.container.querySelector('#safeguardPatternLockout'),
            lockoutTimer: this.container.querySelector('#safeguardLockoutTimer'),
            strength: this.container.querySelector('#safeguardPatternStrength'),
            strengthText: this.container.querySelector('#safeguardPatternStrengthText'),
            strengthFill: this.container.querySelector('#safeguardPatternStrengthFill')
        };

        // Get pattern dots
        this.patternDots = Array.from(this.container.querySelectorAll('.safeguard-pattern-dot'));
    }

    /**
     * Create pattern dots with security considerations
     */
    createPatternDots() {
        let dotsHTML = '';
        for (let i = 0; i < 9; i++) {
            // Add security attributes
            dotsHTML += `
                <div class="safeguard-pattern-dot" 
                     data-index="${i}" 
                     tabindex="0"
                     role="button"
                     aria-label="Pattern dot ${i + 1}"
                     aria-describedby="safeguardPatternInstructions">
                    <i class="fas fa-circle" aria-hidden="true"></i>
                </div>
            `;
        }
        return dotsHTML;
    }

    /**
     * Bind event listeners with security considerations
     */
    bindEvents() {
        // Mouse events
        this.elements.grid.addEventListener('mousedown', this.handleStart.bind(this));
        this.elements.grid.addEventListener('mousemove', this.handleMove.bind(this));
        this.elements.grid.addEventListener('mouseup', this.handleEnd.bind(this));
        this.elements.grid.addEventListener('mouseleave', this.handleEnd.bind(this));

        // Touch events
        this.elements.grid.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.elements.grid.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.elements.grid.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });

        // Button events
        if (this.elements.clearBtn) {
            this.elements.clearBtn.addEventListener('click', this.clearPattern.bind(this));
        }
        if (this.elements.cancelBtn) {
            this.elements.cancelBtn.addEventListener('click', this.cancelPattern.bind(this));
        }

        // Keyboard accessibility
        this.patternDots.forEach((dot, index) => {
            dot.addEventListener('keydown', this.handleKeyDown.bind(this));
            dot.addEventListener('click', this.handleDotClick.bind(this));
        });

        // Security monitoring
        if (this.config.security.enableSessionTracking) {
            this.setupSecurityMonitoring();
        }
    }

    /**
     * Setup accessibility features
     */
    setupAccessibility() {
        // Add instructions
        const instructions = document.createElement('div');
        instructions.id = 'safeguardPatternInstructions';
        instructions.className = 'sr-only';
        instructions.textContent = `Draw a pattern connecting at least ${this.config.minDots} dots. Use mouse or touch to draw, or use arrow keys and Enter to select dots.`;
        this.container.appendChild(instructions);

        // Announce state changes
        this.announce = (message) => {
            const announcement = document.createElement('div');
            announcement.setAttribute('aria-live', 'polite');
            announcement.setAttribute('aria-atomic', 'true');
            announcement.className = 'sr-only';
            announcement.textContent = message;
            this.container.appendChild(announcement);
            setTimeout(() => announcement.remove(), 1000);
        };
    }

    /**
     * Validate configuration
     */
    validateConfiguration() {
        if (this.config.minDots < 3) {
            throw new Error('Minimum dots must be at least 3 for security');
        }
        if (this.config.attempts.max < 1) {
            throw new Error('Maximum attempts must be at least 1');
        }
        if (this.config.attempts.lockoutDuration < 5000) {
            throw new Error('Lockout duration must be at least 5 seconds');
        }
    }

    /**
     * Security monitoring setup
     */
    setupSecurityMonitoring() {
        // Monitor for suspicious patterns
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
                this.detectSecurityBreach('Developer tools detected');
            }
        });

        // Monitor visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.logEvent('PATTERN_LOCK_HIDDEN', { timestamp: Date.now() });
            } else {
                this.logEvent('PATTERN_LOCK_VISIBLE', { timestamp: Date.now() });
            }
        });
    }

    /**
     * Handle touch start
     */
    handleTouchStart(e) {
        e.preventDefault();
        this.state.touchStartTime = Date.now();
        this.handleStart(e.touches[0]);
    }

    /**
     * Handle touch move
     */
    handleTouchMove(e) {
        e.preventDefault();
        if (this.state.isDrawing) {
            this.handleMove(e.touches[0]);
        }
    }

    /**
     * Handle touch end
     */
    handleTouchEnd(e) {
        e.preventDefault();
        this.handleEnd();
    }

    /**
     * Handle pattern start
     */
    handleStart(e) {
        if (this.state.isLocked) return;

        this.state.isDrawing = true;
        this.state.touchStartTime = Date.now();
        this.elements.grid.classList.add('drawing');
        this.clearMessage();
        this.hideAttempts();

        this.handleMove(e);
        this.logEvent('PATTERN_START', { timestamp: Date.now() });
    }

    /**
     * Handle pattern drawing
     */
    handleMove(e) {
        if (!this.state.isDrawing) return;

        const rect = this.elements.grid.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Check which dot is being touched
        for (let i = 0; i < this.patternDots.length; i++) {
            const dot = this.patternDots[i];
            const dotRect = dot.getBoundingClientRect();
            const dotX = dotRect.left - rect.left + dotRect.width / 2;
            const dotY = dotRect.top - rect.top + dotRect.height / 2;

            const distance = Math.sqrt(Math.pow(x - dotX, 2) + Math.pow(y - dotY, 2));
            
            if (distance < 32 && !this.state.selectedDots.includes(i)) {
                this.selectDot(i);
                break;
            }
        }

        // Update pattern strength if enabled
        if (this.config.security.enablePatternStrength) {
            this.updatePatternStrength();
        }
    }

    /**
     * Handle pattern end
     */
    handleEnd() {
        if (!this.state.isDrawing) return;

        this.state.isDrawing = false;
        this.elements.grid.classList.remove('drawing');

        const duration = Date.now() - this.state.touchStartTime;
        this.logEvent('PATTERN_END', { 
            dots: this.state.selectedDots.length, 
            duration: duration 
        });

        if (this.state.selectedDots.length >= this.config.minDots) {
            this.validatePattern();
        } else {
            this.showMessage(`Pattern too short! Minimum ${this.config.minDots} dots required.`, 'error');
            this.animateError();
        }
    }

    /**
     * Handle keyboard navigation
     */
    handleKeyDown(e) {
        const index = parseInt(e.target.dataset.index);
        
        switch (e.key) {
            case 'Enter':
            case ' ':
                e.preventDefault();
                this.handleDotClick(e);
                break;
            case 'ArrowUp':
            case 'ArrowDown':
            case 'ArrowLeft':
            case 'ArrowRight':
                e.preventDefault();
                this.navigateWithArrows(e.key, index);
                break;
        }
    }

    /**
     * Handle dot selection via click
     */
    handleDotClick(e) {
        if (this.state.isLocked || this.state.isDrawing) return;

        const index = parseInt(e.target.dataset.index);
        if (!this.state.selectedDots.includes(index)) {
            this.selectDot(index);
            this.announce(`Dot ${index + 1} selected`);
        }
    }

    /**
     * Navigate pattern dots with arrow keys
     */
    navigateWithArrows(direction, currentIndex) {
        const row = Math.floor(currentIndex / 3);
        const col = currentIndex % 3;
        let newIndex = currentIndex;

        switch (direction) {
            case 'ArrowUp':
                if (row > 0) newIndex = (row - 1) * 3 + col;
                break;
            case 'ArrowDown':
                if (row < 2) newIndex = (row + 1) * 3 + col;
                break;
            case 'ArrowLeft':
                if (col > 0) newIndex = row * 3 + (col - 1);
                break;
            case 'ArrowRight':
                if (col < 2) newIndex = row * 3 + (col + 1);
                break;
        }

        if (newIndex !== currentIndex) {
            this.patternDots[newIndex].focus();
        }
    }

    /**
     * Select a pattern dot
     */
    selectDot(index) {
        if (this.state.selectedDots.includes(index)) return;

        this.state.selectedDots.push(index);
        const dot = this.patternDots[index];
        dot.classList.add('selected');
        dot.setAttribute('aria-selected', 'true');

        // Visual feedback
        dot.style.transform = 'scale(1.1)';
        setTimeout(() => {
            dot.style.transform = 'scale(1)';
        }, 200);

        this.logEvent('DOT_SELECTED', { index: index, total: this.state.selectedDots.length });
    }

    /**
     * Validate the pattern
     */
    validatePattern() {
        try {
            // Check for brute force attempts
            if (this.config.security.enableAntiBruteForce) {
                this.checkBruteForce();
            }

            // Validate pattern length
            if (this.state.selectedDots.length < this.config.minDots) {
                throw new Error(`Pattern must contain at least ${this.config.minDots} dots`);
            }

            // Check for repeated patterns
            if (this.isRepeatedPattern()) {
                throw new Error('Pattern too simple. Please choose a more complex pattern.');
            }

            // Analyze pattern strength
            const strength = this.analyzePatternStrength();
            if (strength.score < 30 && this.config.mode === 'setup') {
                this.showMessage('Pattern too weak. Please choose a more complex pattern.', 'warning');
                this.updateStrengthDisplay(strength);
                return;
            }

            // Pattern is valid
            this.onPatternComplete();
            
        } catch (error) {
            this.handleValidationError(error);
        }
    }

    /**
     * Check for brute force attempts
     */
    checkBruteForce() {
        const now = Date.now();
        const recentAttempts = this.security.failedAttempts.filter(
            attempt => now - attempt.timestamp < 60000 // Last minute
        );

        if (recentAttempts.length > 10) {
            this.detectSecurityBreach('Multiple rapid attempts detected');
        }
    }

    /**
     * Check if pattern is repeated
     */
    isRepeatedPattern() {
        const pattern = this.state.selectedDots.join(',');
        const recentPatterns = this.state.patternHistory.slice(-5);
        return recentPatterns.includes(pattern);
    }

    /**
     * Analyze pattern strength
     */
    analyzePatternStrength() {
        const pattern = this.state.selectedDots;
        let score = 0;

        // Length factor
        score += Math.min(pattern.length * 10, 30);

        // Complexity factor (number of direction changes)
        let directionChanges = 0;
        for (let i = 1; i < pattern.length - 1; i++) {
            const prev = pattern[i - 1];
            const curr = pattern[i];
            const next = pattern[i + 1];
            
            const prevRow = Math.floor(prev / 3), prevCol = prev % 3;
            const currRow = Math.floor(curr / 3), currCol = curr % 3;
            const nextRow = Math.floor(next / 3), nextCol = next % 3;
            
            const prevAngle = Math.atan2(currRow - prevRow, currCol - prevCol);
            const nextAngle = Math.atan2(nextRow - currRow, nextCol - currCol);
            
            if (Math.abs(prevAngle - nextAngle) > Math.PI / 4) {
                directionChanges++;
            }
        }
        score += directionChanges * 5;

        // Coverage factor (dots used vs available)
        const coverage = pattern.length / 9;
        score += coverage * 20;

        // Determine strength level
        let level = 'Weak';
        if (score >= 70) level = 'Strong';
        else if (score >= 50) level = 'Medium';
        else if (score >= 30) level = 'Fair';

        return { score: Math.min(score, 100), level, coverage, directionChanges };
    }

    /**
     * Update pattern strength display
     */
    updatePatternStrength() {
        if (!this.config.security.enablePatternStrength) return;

        const strength = this.analyzePatternStrength();
        this.updateStrengthDisplay(strength);
    }

    /**
     * Update strength display UI
     */
    updateStrengthDisplay(strength) {
        if (!this.elements.strength) return;

        this.elements.strength.style.display = 'block';
        this.elements.strengthText.textContent = `${strength.level} (${strength.score}%)`;
        this.elements.strengthFill.style.width = `${strength.score}%`;
        
        // Update color based on strength
        const color = strength.score >= 70 ? '#48bb78' : 
                     strength.score >= 50 ? '#ed8936' : '#fc8181';
        this.elements.strengthFill.style.background = color;
    }

    /**
     * Handle pattern completion
     */
    onPatternComplete() {
        const pattern = [...this.state.selectedDots];
        const duration = Date.now() - this.state.touchStartTime;

        this.logEvent('PATTERN_COMPLETE', { 
            pattern: pattern, 
            duration: duration,
            strength: this.config.security.enablePatternStrength ? this.analyzePatternStrength() : null
        });

        this.showMessage('Pattern validated successfully!', 'success');
        
        setTimeout(() => {
            this.config.callbacks.onComplete(pattern, {
                duration: duration,
                strength: this.analyzePatternStrength(),
                timestamp: Date.now()
            });
        }, 500);
    }

    /**
     * Handle validation errors
     */
    handleValidationError(error) {
        this.state.attempts++;
        this.security.failedAttempts.push({
            timestamp: Date.now(),
            pattern: this.state.selectedDots.join(','),
            error: error.message
        });

        this.logEvent('PATTERN_VALIDATION_ERROR', { 
            error: error.message, 
            attempts: this.state.attempts 
        });

        this.showMessage(error.message, 'error');
        this.animateError();
        this.showAttempts();

        // Check if should lock out
        if (this.state.attempts >= this.config.attempts.max) {
            this.triggerLockout();
        } else {
            this.config.callbacks.onError({
                type: 'VALIDATION_ERROR',
                message: error.message,
                attemptsRemaining: this.config.attempts.max - this.state.attempts
            });
        }

        // Clear pattern after error
        setTimeout(() => this.clearPattern(), 1000);
    }

    /**
     * Trigger account lockout
     */
    triggerLockout() {
        this.state.isLocked = true;
        this.elements.grid.classList.add('locked');
        this.elements.lockout.classList.add('show');

        let remainingTime = Math.ceil(this.config.attempts.lockoutDuration / 1000);
        this.elements.lockoutTimer.textContent = remainingTime;

        const timer = setInterval(() => {
            remainingTime--;
            this.elements.lockoutTimer.textContent = remainingTime;

            if (remainingTime <= 0) {
                clearInterval(timer);
                this.clearLockout();
            }
        }, 1000);

        this.state.lockoutTimer = timer;

        this.logEvent('PATTERN_LOCKOUT_TRIGGERED', { 
            duration: this.config.attempts.lockoutDuration 
        });

        this.config.callbacks.onLockout({
            duration: this.config.attempts.lockoutDuration,
            attempts: this.state.attempts
        });
    }

    /**
     * Clear lockout state
     */
    clearLockout() {
        this.state.isLocked = false;
        this.state.attempts = 0;
        this.elements.grid.classList.remove('locked');
        this.elements.lockout.classList.remove('show');
        this.hideAttempts();

        if (this.state.lockoutTimer) {
            clearInterval(this.state.lockoutTimer);
            this.state.lockoutTimer = null;
        }

        this.logEvent('PATTERN_LOCKOUT_CLEARED');
    }

    /**
     * Show attempts remaining
     */
    showAttempts() {
        if (this.config.attempts.max <= 1) return;

        const remaining = this.config.attempts.max - this.state.attempts;
        this.elements.attempts.style.display = 'block';
        this.elements.attemptsRemaining.textContent = remaining;
    }

    /**
     * Hide attempts display
     */
    hideAttempts() {
        this.elements.attempts.style.display = 'none';
    }

    /**
     * Show message to user
     */
    showMessage(message, type = 'info') {
        this.elements.message.textContent = message;
        this.elements.message.className = `safeguard-pattern-message ${type}`;
        this.elements.message.style.display = 'block';

        // Auto-hide after 5 seconds for success messages
        if (type === 'success') {
            setTimeout(() => this.clearMessage(), 5000);
        }
    }

    /**
     * Clear message
     */
    clearMessage() {
        this.elements.message.style.display = 'none';
    }

    /**
     * Animate error state
     */
    animateError() {
        this.elements.grid.classList.add('error');
        setTimeout(() => {
            this.elements.grid.classList.remove('error');
        }, 500);

        // Animate individual dots
        this.patternDots.forEach((dot, index) => {
            if (this.state.selectedDots.includes(index)) {
                dot.classList.add('error');
                setTimeout(() => dot.classList.remove('error'), 500);
            }
        });
    }

    /**
     * Clear the current pattern
     */
    clearPattern() {
        this.state.selectedDots = [];
        this.patternDots.forEach(dot => {
            dot.classList.remove('selected', 'error');
            dot.setAttribute('aria-selected', 'false');
        });
        this.clearMessage();
        this.hideAttempts();

        if (this.config.security.enablePatternStrength && this.elements.strength) {
            this.elements.strength.style.display = 'none';
        }

        this.logEvent('PATTERN_CLEARED');
    }

    /**
     * Cancel pattern setup
     */
    cancelPattern() {
        this.clearPattern();
        this.logEvent('PATTERN_CANCELLED');
        this.config.callbacks.onError({
            type: 'USER_CANCELLED',
            message: 'Pattern setup cancelled by user'
        });
    }

    /**
     * Detect security breach
     */
    detectSecurityBreach(reason) {
        this.security.suspiciousActivity = true;
        this.logEvent('SECURITY_BREACH_DETECTED', { reason: reason });

        this.showMessage('Security breach detected. Pattern lock temporarily disabled.', 'error');
        this.elements.grid.style.pointerEvents = 'none';

        // Re-enable after 5 minutes
        setTimeout(() => {
            this.elements.grid.style.pointerEvents = 'auto';
            this.security.suspiciousActivity = false;
        }, 300000);
    }

    /**
     * Log security events
     */
    logEvent(event, data = {}) {
        const logEntry = {
            event: event,
            timestamp: Date.now(),
            sessionId: this.sessionId || 'unknown',
            userAgent: navigator.userAgent,
            ...data
        };

        console.log(`SafeGuard Pattern Lock: ${event}`, logEntry);

        // Store in pattern history for analysis
        if (event === 'PATTERN_COMPLETE') {
            this.state.patternHistory.push(data.pattern?.join(',') || '');
            // Keep only last 20 patterns
            if (this.state.patternHistory.length > 20) {
                this.state.patternHistory.shift();
            }
        }
    }

    /**
     * Get pattern lock statistics
     */
    getStatistics() {
        return {
            totalAttempts: this.state.attempts,
            patternsCreated: this.state.patternHistory.length,
            sessionDuration: Date.now() - this.state.sessionStart,
            securityBreaches: this.security.suspiciousActivity ? 1 : 0,
            failedAttempts: this.security.failedAttempts.length
        };
    }

    /**
     * Reset pattern lock state
     */
    reset() {
        this.clearPattern();
        this.clearLockout();
        this.state.patternHistory = [];
        this.security.failedAttempts = [];
        this.security.suspiciousActivity = false;
        this.state.sessionStart = Date.now();

        this.logEvent('PATTERN_LOCK_RESET');
    }

    /**
     * Destroy pattern lock instance
     */
    destroy() {
        // Clear timers
        if (this.state.lockoutTimer) {
            clearInterval(this.state.lockoutTimer);
        }

        // Remove event listeners
        if (this.elements) {
            this.elements.grid.removeEventListener('mousedown', this.handleStart);
            this.elements.grid.removeEventListener('mousemove', this.handleMove);
            this.elements.grid.removeEventListener('mouseup', this.handleEnd);
            this.elements.grid.removeEventListener('mouseleave', this.handleEnd);
            this.elements.grid.removeEventListener('touchstart', this.handleTouchStart);
            this.elements.grid.removeEventListener('touchmove', this.handleTouchMove);
            this.elements.grid.removeEventListener('touchend', this.handleTouchEnd);
        }

        // Clear container
        this.container.innerHTML = '';

        this.logEvent('PATTERN_LOCK_DESTROYED');
    }
}

// Export for global use
window.SafeGuardPatternLock = SafeGuardPatternLock;

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('SafeGuard Professional Pattern Lock System loaded');
});