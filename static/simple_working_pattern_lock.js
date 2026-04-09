/**
 * Simple Working Pattern Lock
 * A lightweight, functional pattern lock implementation
 */

class SimpleWorkingPatternLock {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            throw new Error(`Container '${containerId}' not found`);
        }

        this.options = {
            title: options.title || 'Pattern Lock',
            subtitle: options.subtitle || 'Draw your pattern',
            minDots: options.minDots || 4,
            onComplete: options.onComplete || function() {},
            ...options
        };

        this.selectedDots = [];
        this.isDrawing = false;
        this.currentPattern = [];

        this.init();
    }

    init() {
        this.createHTML();
        this.bindEvents();
    }

    createHTML() {
        this.container.innerHTML = `
            <div class="simple-pattern-lock">
                <div class="pattern-header">
                    <h4>${this.options.title}</h4>
                    <p>${this.options.subtitle}</p>
                </div>
                <div class="pattern-grid" id="patternGrid">
                    ${this.createDots()}
                </div>
                <div class="pattern-message" id="patternMessage"></div>
                <div class="pattern-actions">
                    <button class="pattern-btn secondary" id="clearPatternBtn">Clear</button>
                </div>
            </div>
        `;
    }

    createDots() {
        let dots = '';
        for (let i = 0; i < 9; i++) {
            dots += `<div class="pattern-dot" data-index="${i}"></div>`;
        }
        return dots;
    }

    bindEvents() {
        const grid = this.container.querySelector('.pattern-grid');
        const dots = this.container.querySelectorAll('.pattern-dot');
        const clearBtn = this.container.querySelector('#clearPatternBtn');

        // Mouse events
        grid.addEventListener('mousedown', this.handleStart.bind(this));
        grid.addEventListener('mousemove', this.handleMove.bind(this));
        grid.addEventListener('mouseup', this.handleEnd.bind(this));
        grid.addEventListener('mouseleave', this.handleEnd.bind(this));

        // Touch events
        grid.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        grid.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        grid.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });

        // Click events for accessibility
        dots.forEach(dot => {
            dot.addEventListener('click', this.handleDotClick.bind(this));
        });

        // Clear button
        if (clearBtn) {
            clearBtn.addEventListener('click', this.clearPattern.bind(this));
        }
    }

    handleStart(e) {
        this.isDrawing = true;
        this.selectedDots = [];
        this.clearMessage();
        this.handleMove(e);
    }

    handleMove(e) {
        if (!this.isDrawing) return;

        const rect = this.container.querySelector('.pattern-grid').getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const dots = this.container.querySelectorAll('.pattern-dot');
        dots.forEach((dot, index) => {
            const dotRect = dot.getBoundingClientRect();
            const dotX = dotRect.left - rect.left + dotRect.width / 2;
            const dotY = dotRect.top - rect.top + dotRect.height / 2;

            const distance = Math.sqrt(Math.pow(x - dotX, 2) + Math.pow(y - dotY, 2));

            if (distance < 30 && !this.selectedDots.includes(index)) {
                this.selectDot(index);
            }
        });
    }

    handleEnd() {
        if (!this.isDrawing) return;
        this.isDrawing = false;

        if (this.selectedDots.length >= this.options.minDots) {
            this.validatePattern();
        } else {
            this.showMessage(`Pattern too short! Minimum ${this.options.minDots} dots required.`, 'error');
            this.animateError();
            setTimeout(() => this.clearPattern(), 1000);
        }
    }

    handleTouchStart(e) {
        e.preventDefault();
        this.handleStart(e.touches[0]);
    }

    handleTouchMove(e) {
        e.preventDefault();
        if (this.isDrawing) {
            this.handleMove(e.touches[0]);
        }
    }

    handleTouchEnd(e) {
        e.preventDefault();
        this.handleEnd();
    }

    handleDotClick(e) {
        if (this.isDrawing) return;
        
        const index = parseInt(e.target.dataset.index);
        if (!this.selectedDots.includes(index)) {
            this.selectDot(index);
            
            // Auto-complete if enough dots selected
            if (this.selectedDots.length >= this.options.minDots) {
                setTimeout(() => this.validatePattern(), 500);
            }
        }
    }

    selectDot(index) {
        this.selectedDots.push(index);
        const dot = this.container.querySelector(`[data-index="${index}"]`);
        dot.classList.add('selected');

        // Add visual feedback
        dot.style.transform = 'scale(1.1)';
        setTimeout(() => {
            dot.style.transform = 'scale(1)';
        }, 200);
    }

    validatePattern() {
        if (this.selectedDots.length >= this.options.minDots) {
            this.showMessage('Pattern validated!', 'success');
            setTimeout(() => {
                this.options.onComplete([...this.selectedDots]);
            }, 500);
        } else {
            this.showMessage('Pattern too short!', 'error');
            this.animateError();
            setTimeout(() => this.clearPattern(), 1000);
        }
    }

    showMessage(message, type) {
        const messageDiv = this.container.querySelector('.pattern-message');
        if (messageDiv) {
            messageDiv.textContent = message;
            messageDiv.className = `pattern-message ${type}`;
            messageDiv.style.display = 'block';
        }
    }

    clearMessage() {
        const messageDiv = this.container.querySelector('.pattern-message');
        if (messageDiv) {
            messageDiv.style.display = 'none';
        }
    }

    animateError() {
        const grid = this.container.querySelector('.pattern-grid');
        grid.classList.add('error');
        setTimeout(() => {
            grid.classList.remove('error');
        }, 500);
    }

    clearPattern() {
        this.selectedDots = [];
        const dots = this.container.querySelectorAll('.pattern-dot');
        dots.forEach(dot => {
            dot.classList.remove('selected', 'error');
        });
        this.clearMessage();
    }

    reset() {
        this.clearPattern();
        this.currentPattern = [];
    }
}

// Export for global use
window.SimpleWorkingPatternLock = SimpleWorkingPatternLock;