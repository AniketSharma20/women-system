/**
 * Enhanced Authentication System
 * Comprehensive authentication handling with validation, pattern locks, and better UX
 */

class AuthSystem {
    constructor() {
        this.currentAuthMethod = 'password';
        this.patternLocks = {};
        this.validationRules = {
            username: {
                required: true,
                minLength: 3,
                maxLength: 20,
                pattern: /^[a-zA-Z0-9_]+$/,
                message: 'Username must be 3-20 characters, letters, numbers, and underscores only'
            },
            email: {
                required: true,
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Please enter a valid email address'
            },
            password: {
                required: true,
                minLength: 8,
                requireUppercase: true,
                requireLowercase: true,
                requireNumbers: true,
                requireSpecial: false,
                message: 'Password must be at least 8 characters with uppercase, lowercase, and numbers'
            },
            firstName: {
                required: true,
                minLength: 2,
                pattern: /^[a-zA-Z\s]+$/,
                message: 'First name must contain only letters and be at least 2 characters'
            },
            lastName: {
                required: true,
                minLength: 2,
                pattern: /^[a-zA-Z\s]+$/,
                message: 'Last name must contain only letters and be at least 2 characters'
            },
            phone: {
                required: false,
                pattern: /^[\+]?[1-9][\d]{0,15}$/,
                message: 'Please enter a valid phone number'
            }
        };
    }

    // Initialize authentication system
    init() {
        this.setupEventListeners();
        this.initializeFormValidation();
        this.setupPasswordStrength();
        this.loadRememberedUsername();
    }

    // Setup event listeners
    setupEventListeners() {
        // Tab switching
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-btn')) {
                const tabName = e.target.textContent.toLowerCase().includes('sign in') ? 'login' : 'register';
                this.switchTab(tabName);
            }
            
            if (e.target.classList.contains('method-tab') || e.target.closest('.method-tab')) {
                const method = e.target.textContent.toLowerCase().includes('pattern') ? 'pattern' : 'password';
                this.switchAuthMethod(method, e);
            }
        });

        // Form submissions
        document.addEventListener('submit', (e) => {
            if (e.target.classList.contains('auth-form-content')) {
                e.preventDefault();
                this.handleFormSubmission(e);
            }
        });

        // Real-time validation
        document.addEventListener('input', (e) => {
            if (e.target.matches('input[required]')) {
                this.validateField(e.target);
            }
        });

        // Password toggle
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('password-toggle') || e.target.closest('.password-toggle')) {
                const button = e.target.classList.contains('password-toggle') ? e.target : e.target.closest('.password-toggle');
                const inputId = button.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
                if (inputId) {
                    this.togglePassword(inputId);
                }
            }
        });
    }

    // Switch between login and register tabs
    switchTab(tabName) {
        // Hide all forms
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.remove('active');
        });
        
        // Remove active class from all tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected form
        const selectedForm = document.getElementById(tabName + 'Form');
        if (selectedForm) {
            selectedForm.classList.add('active');
        }
        
        // Add active class to clicked tab
        const activeTab = Array.from(document.querySelectorAll('.tab-btn')).find(btn => 
            btn.textContent.toLowerCase().includes(tabName === 'login' ? 'sign in' : 'sign up')
        );
        if (activeTab) {
            activeTab.classList.add('active');
        }

        // Clear messages
        this.clearMessage();
        
        // Initialize pattern locks if switching to forms with pattern locks
        if (tabName === 'register' || tabName === 'login') {
            setTimeout(() => this.initializePatternLocks(), 100);
        }
    }

    // Switch between password and pattern authentication methods
    switchAuthMethod(method, event) {
        this.currentAuthMethod = method;
        
        // Update active tab
        document.querySelectorAll('.method-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        if (event && event.target) {
            event.target.classList.add('active');
        }

        // Show/hide appropriate sections
        this.updateAuthMethodSections(method);
    }

    // Update form sections based on authentication method
    updateAuthMethodSections(method) {
        const loginPasswordFields = document.querySelectorAll('#loginForm .form-group');
        const loginPatternSection = document.getElementById('loginPatternSection') || document.getElementById('modalLoginPatternSection');
        
        const registerPasswordFields = document.querySelectorAll('#registerForm .form-group:not(.auth-method-toggle):not(.pattern-lock-section)');
        const registerPatternSection = document.getElementById('registerPatternSection') || document.getElementById('modalRegisterPatternSection');

        if (method === 'pattern') {
            // Hide password fields, show pattern
            loginPasswordFields.forEach(field => {
                if (field.querySelector('input[type="password"]') || field.querySelector('input[name="password"]')) {
                    field.style.display = 'none';
                }
            });
            if (loginPatternSection) loginPatternSection.style.display = 'block';
            
            registerPasswordFields.forEach(field => {
                if (field.querySelector('input[type="password"]') || field.querySelector('input[name="password"]')) {
                    field.style.display = 'none';
                }
            });
            if (registerPatternSection) registerPatternSection.style.display = 'block';
            
        } else {
            // Show password fields, hide pattern
            loginPasswordFields.forEach(field => {
                field.style.display = 'block';
            });
            if (loginPatternSection) loginPatternSection.style.display = 'none';
            
            registerPasswordFields.forEach(field => {
                field.style.display = 'block';
            });
            if (registerPatternSection) registerPatternSection.style.display = 'none';
        }
    }

    // Initialize pattern locks
    initializePatternLocks() {
        // Check if SimpleWorkingPatternLock is available
        if (typeof SimpleWorkingPatternLock === 'undefined') {
            console.warn('SimpleWorkingPatternLock not found');
            return;
        }

        // Initialize login pattern lock
        const loginContainer = document.getElementById('loginPatternLock') || document.getElementById('modalLoginPatternLock');
        if (loginContainer && !this.patternLocks.login) {
            this.patternLocks.login = new SimpleWorkingPatternLock(loginContainer.id, {
                title: 'Enter Pattern Lock',
                subtitle: 'Draw your pattern to sign in',
                minDots: 4,
                onComplete: (pattern) => this.handlePatternLogin(pattern)
            });
        }

        // Initialize register pattern lock
        const registerContainer = document.getElementById('registerPatternLock') || document.getElementById('modalRegisterPatternLock');
        if (registerContainer && !this.patternLocks.register) {
            this.patternLocks.register = new SimpleWorkingPatternLock(registerContainer.id, {
                title: 'Set Pattern Lock',
                subtitle: 'Create your security pattern',
                minDots: 4,
                onComplete: (pattern) => this.handlePatternSet(pattern)
            });
        }
    }

    // Handle pattern set for registration
    handlePatternSet(pattern) {
        window.registerPattern = pattern;
        this.showMessage('Pattern set successfully! You can now submit the registration.', 'success');
    }

    // Handle pattern login
    async handlePatternLogin(pattern) {
        const username = this.getActiveForm().querySelector('input[name="username"]')?.value;
        
        if (!username) {
            this.showMessage('Please enter your username first', 'error');
            return;
        }

        try {
            this.showLoading('Signing in with pattern...');
            
            const response = await fetch('/login-pattern', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, pattern })
            });

            const result = await response.json();
            
            if (result.success) {
                this.showMessage(result.message, 'success');
                setTimeout(() => window.location.href = '/dashboard', 1500);
            } else {
                this.showMessage(result.message, 'error');
            }
        } catch (error) {
            this.showMessage('Network error. Please try again.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    // Get currently active form
    getActiveForm() {
        return document.querySelector('.auth-form.active') || document.querySelector('#loginForm') || document.querySelector('#registerForm');
    }

    // Handle form submission
    async handleFormSubmission(event) {
        const form = event.target;
        const formData = new FormData(form);
        const isLogin = form.closest('.auth-form').id === 'loginForm';
        
        // Validate form
        if (!this.validateForm(form)) {
            return;
        }

        // Check authentication method
        if (this.currentAuthMethod === 'pattern' && isLogin) {
            // Pattern login is handled by pattern lock completion
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn?.innerHTML;
        
        try {
            // Show loading state
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
                submitBtn.disabled = true;
            }

            // Prepare data
            const data = this.prepareFormData(formData, isLogin);
            
            // Submit form
            const endpoint = isLogin ? '/login' : '/register';
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            
            if (result.success) {
                this.handleSuccess(result, isLogin, data.username);
            } else {
                this.showMessage(result.message, 'error');
            }
        } catch (error) {
            this.showMessage('Network error. Please try again.', 'error');
        } finally {
            // Reset button state
            if (submitBtn) {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
            this.hideLoading();
        }
    }

    // Prepare form data based on authentication method
    prepareFormData(formData, isLogin) {
        const data = {
            username: formData.get('username'),
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            phone: formData.get('phone')
        };

        if (isLogin) {
            data.password = formData.get('password');
        } else {
            if (this.currentAuthMethod === 'password') {
                data.password = formData.get('password');
            } else if (this.currentAuthMethod === 'pattern') {
                data.pattern = window.registerPattern;
                if (!data.pattern || data.pattern.length < 4) {
                    this.showMessage('Please set up your pattern lock first!', 'error');
                    return null;
                }
            }
        }

        return data;
    }

    // Handle successful authentication
    handleSuccess(result, isLogin, username) {
        this.showMessage(result.message, 'success');
        
        if (isLogin) {
            // Store remember me preference
            const rememberMe = document.getElementById('rememberMe') || document.getElementById('modalRememberMe');
            if (rememberMe && rememberMe.checked) {
                localStorage.setItem('rememberUsername', username);
            }
            
            setTimeout(() => window.location.href = '/dashboard', 1500);
        } else {
            // Switch to login tab and pre-fill username
            setTimeout(() => {
                this.switchTab('login');
                const loginUsername = document.getElementById('loginUsername') || document.getElementById('modalLoginUsername');
                if (loginUsername) {
                    loginUsername.value = username;
                }
            }, 2000);
        }
    }

    // Initialize form validation
    initializeFormValidation() {
        document.querySelectorAll('input[required]').forEach(input => {
            this.createValidationUI(input);
        });
    }

    // Create validation UI for a field
    createValidationUI(input) {
        const formGroup = input.closest('.form-group');
        if (!formGroup) return;

        // Add validation message container
        const validationDiv = document.createElement('div');
        validationDiv.className = 'validation-message';
        validationDiv.id = input.id + 'Validation';
        formGroup.appendChild(validationDiv);

        // Add input validation styling
        input.classList.add('needs-validation');
    }

    // Validate individual field
    validateField(input) {
        const rules = this.validationRules[input.name];
        if (!rules) return true;

        const value = input.value.trim();
        let isValid = true;
        let message = '';

        // Required validation
        if (rules.required && !value) {
            isValid = false;
            message = `${this.getFieldLabel(input)} is required`;
        }
        // Pattern validation
        else if (value && rules.pattern && !rules.pattern.test(value)) {
            isValid = false;
            message = rules.message;
        }
        // Length validation
        else if (value && rules.minLength && value.length < rules.minLength) {
            isValid = false;
            message = `${this.getFieldLabel(input)} must be at least ${rules.minLength} characters`;
        }
        // Custom validations
        else if (value && input.type === 'password') {
            isValid = this.validatePassword(value);
            if (!isValid) message = rules.message;
        }

        // Update UI
        this.updateFieldValidation(input, isValid, message);
        return isValid;
    }

    // Validate password strength
    validatePassword(password) {
        const rules = this.validationRules.password;
        
        if (password.length < rules.minLength) return false;
        if (rules.requireUppercase && !/[A-Z]/.test(password)) return false;
        if (rules.requireLowercase && !/[a-z]/.test(password)) return false;
        if (rules.requireNumbers && !/\d/.test(password)) return false;
        if (rules.requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false;
        
        return true;
    }

    // Update field validation UI
    updateFieldValidation(input, isValid, message) {
        const validationDiv = document.getElementById(input.id + 'Validation');
        const inputWrapper = input.closest('.input-wrapper');
        
        // Remove previous validation classes
        input.classList.remove('valid', 'invalid');
        
        if (isValid && input.value.trim()) {
            input.classList.add('valid');
            if (validationDiv) {
                validationDiv.innerHTML = '<i class="fas fa-check"></i>';
                validationDiv.className = 'validation-message valid';
            }
        } else if (!isValid && input.value.trim()) {
            input.classList.add('invalid');
            if (validationDiv) {
                validationDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
                validationDiv.className = 'validation-message invalid';
            }
        } else {
            if (validationDiv) {
                validationDiv.innerHTML = '';
                validationDiv.className = 'validation-message';
            }
        }
    }

    // Get field label text
    getFieldLabel(input) {
        const label = document.querySelector(`label[for="${input.id}"]`);
        return label ? label.textContent.replace(/[*\s]+$/, '') : input.name;
    }

    // Setup password strength indicator
    setupPasswordStrength() {
        const passwordInputs = document.querySelectorAll('input[type="password"][name="password"]');
        passwordInputs.forEach(input => {
            this.createPasswordStrengthIndicator(input);
        });
    }

    // Create password strength indicator
    createPasswordStrengthIndicator(input) {
        const formGroup = input.closest('.form-group');
        if (!formGroup) return;

        const strengthDiv = document.createElement('div');
        strengthDiv.className = 'password-strength';
        strengthDiv.innerHTML = `
            <div class="strength-bar">
                <div class="strength-fill"></div>
            </div>
            <span class="strength-text">Password strength</span>
        `;
        
        formGroup.appendChild(strengthDiv);

        input.addEventListener('input', () => {
            this.updatePasswordStrength(input, strengthDiv);
        });
    }

    // Update password strength indicator
    updatePasswordStrength(input, strengthDiv) {
        const password = input.value;
        const strengthFill = strengthDiv.querySelector('.strength-fill');
        const strengthText = strengthDiv.querySelector('.strength-text');
        
        let strength = 0;
        let strengthLabel = 'Weak';
        let strengthColor = '#e74c3c';
        
        if (password.length >= 8) strength += 1;
        if (/[a-z]/.test(password)) strength += 1;
        if (/[A-Z]/.test(password)) strength += 1;
        if (/\d/.test(password)) strength += 1;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 1;
        
        const percentage = (strength / 5) * 100;
        
        if (strength >= 4) {
            strengthLabel = 'Strong';
            strengthColor = '#27ae60';
        } else if (strength >= 3) {
            strengthLabel = 'Good';
            strengthColor = '#f39c12';
        }
        
        strengthFill.style.width = percentage + '%';
        strengthFill.style.backgroundColor = strengthColor;
        strengthText.textContent = `Password strength: ${strengthLabel}`;
    }

    // Validate entire form
    validateForm(form) {
        let isValid = true;
        const requiredFields = form.querySelectorAll('input[required]');
        
        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        // Additional validations
        if (form.id === 'registerForm' || form.closest('.auth-form').id === 'registerForm') {
            isValid = this.validateRegisterForm(form) && isValid;
        }

        return isValid;
    }

    // Validate registration form specifically
    validateRegisterForm(form) {
        let isValid = true;
        
        // Password confirmation
        const password = form.querySelector('input[name="password"]');
        const confirmPassword = form.querySelector('input[name="confirmPassword"]');
        
        if (password && confirmPassword) {
            if (password.value !== confirmPassword.value) {
                this.showMessage('Passwords do not match', 'error');
                confirmPassword.classList.add('invalid');
                isValid = false;
            } else {
                confirmPassword.classList.remove('invalid');
            }
        }

        // Terms agreement
        const agreeTerms = form.querySelector('#agreeTerms') || form.querySelector('#modalAgreeTerms');
        if (agreeTerms && !agreeTerms.checked) {
            this.showMessage('You must agree to the Terms of Service and Privacy Policy', 'error');
            isValid = false;
        }

        return isValid;
    }

    // Toggle password visibility
    togglePassword(fieldId) {
        const field = document.getElementById(fieldId);
        const button = field.nextElementSibling;
        const icon = button.querySelector('i');
        
        if (field.type === 'password') {
            field.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            field.type = 'password';
            icon.className = 'fas fa-eye';
        }
    }

    // Load remembered username
    loadRememberedUsername() {
        const rememberedUsername = localStorage.getItem('rememberUsername');
        if (rememberedUsername) {
            const loginUsername = document.getElementById('loginUsername') || document.getElementById('modalLoginUsername');
            const rememberMe = document.getElementById('rememberMe') || document.getElementById('modalRememberMe');
            if (loginUsername) loginUsername.value = rememberedUsername;
            if (rememberMe) rememberMe.checked = true;
        }
    }

    // Show loading state
    showLoading(message = 'Processing...') {
        const loadingOverlay = document.getElementById('loadingOverlay') || this.createLoadingOverlay();
        const loadingText = loadingOverlay.querySelector('p') || loadingOverlay.querySelector('.loading-content p');
        if (loadingText) loadingText.textContent = message;
        loadingOverlay.style.display = 'flex';
    }

    // Hide loading state
    hideLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }

    // Create loading overlay if it doesn't exist
    createLoadingOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'loadingOverlay';
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-content">
                <div class="spinner">
                    <div class="shield-spinner">
                        <i class="fas fa-shield-alt"></i>
                    </div>
                </div>
                <h3>Secure Login in Progress</h3>
                <p>Processing...</p>
            </div>
        `;
        document.body.appendChild(overlay);
        return overlay;
    }

    // Show message to user
    showMessage(message, type = 'info') {
        const messageDiv = document.getElementById('authMessage') || document.getElementById('modalAuthMessage') || this.createMessageDiv();
        if (messageDiv) {
            messageDiv.innerHTML = `
                <div class="message ${type}">
                    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                    <span>${message}</span>
                    <button class="message-close" onclick="authSystem.clearMessage()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            messageDiv.style.display = 'block';
            
            // Auto-hide after 5 seconds
            setTimeout(() => this.clearMessage(), 5000);
        }
    }

    // Create message div if it doesn't exist
    createMessageDiv() {
        const messageDiv = document.createElement('div');
        messageDiv.id = 'authMessage';
        messageDiv.className = 'auth-message';
        const authCard = document.querySelector('.auth-card');
        if (authCard) {
            authCard.appendChild(messageDiv);
        }
        return messageDiv;
    }

    // Clear message
    clearMessage() {
        const messageDiv = document.getElementById('authMessage') || document.getElementById('modalAuthMessage');
        if (messageDiv) {
            messageDiv.style.display = 'none';
        }
    }
}

// Initialize authentication system
const authSystem = new AuthSystem();

// Make functions globally available
window.switchTab = (tabName) => authSystem.switchTab(tabName);
window.togglePassword = (fieldId) => authSystem.togglePassword(fieldId);
window.showAuthMessage = (message, type) => authSystem.showMessage(message, type);
window.clearMessage = () => authSystem.clearMessage();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    authSystem.init();
});