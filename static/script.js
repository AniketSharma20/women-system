// Global variables
let currentLocation = null;
let locationTrackingInterval = null;
let aiListening = false;
let currentMap = null;
let sheltersMap = null;
let notificationsPanel = null;

// Safety Tip Animation Variables
let currentTipIndex = 0;
let tipInterval = null;
const TIP_DISPLAY_DURATION = 8000; // 8 seconds per tip

// Safety Tips Data
const safetyTips = [
    // Emergency & Critical Safety
    {
        title: "Trust Your Intuition",
        text: "If something feels wrong, it probably is. Don't ignore your gut feelings. Your safety is more important than being polite. Leave immediately if you feel unsafe.",
        icon: "fa-exclamation-triangle",
        type: "tip-emergency"
    },
    {
        title: "Emergency Contacts Ready",
        text: "Keep emergency numbers saved and practice using quick-dial features. Save police (100), ambulance (108), and women helpline (1091) for immediate access.",
        icon: "fa-phone-alt",
        type: "tip-emergency"
    },
    {
        title: "Know Your Exit Points",
        text: "When in any building, always identify exits, emergency routes, and safe areas. Memorize at least two exit routes from every location.",
        icon: "fa-door-open",
        type: "tip-emergency"
    },
    
    // Location & Tracking
    {
        title: "Share Your Location",
        text: "Keep location sharing enabled with trusted contacts. In case of emergency, they can find you quickly. Update your emergency contacts regularly.",
        icon: "fa-map-marker-alt",
        type: "tip-success"
    },
    {
        title: "Use Safe Location Sharing",
        text: "Share your live location only with trusted contacts through the app. Use the 'Share Location' feature when meeting someone new or traveling alone.",
        icon: "fa-share-alt",
        type: "tip-success"
    },
    
    // Situational Awareness
    {
        title: "Stay Aware of Surroundings",
        text: "Avoid distractions like headphones when walking alone. Stay on well-lit, populated paths. Trust your instincts - if a place feels unsafe, leave.",
        icon: "fa-eye",
        type: "tip-info"
    },
    {
        title: "Walk with Confidence",
        text: "Walk with purpose and confidence. Make eye contact with people around you. Avoid looking lost or distracted, especially in isolated areas.",
        icon: "fa-user-secret",
        type: "tip-info"
    },
    {
        title: "Trust But Verify",
        text: "When meeting someone from online or new contacts, meet in public places. Tell a friend where you're going and when you'll be back.",
        icon: "fa-user-check",
        type: "tip-info"
    },
    
    // Digital Safety
    {
        title: "Protect Your Digital Privacy",
        text: "Don't share your phone number or address with strangers online. Keep your social media accounts private and limit personal information.",
        icon: "fa-shield-alt",
        type: "tip-info"
    },
    {
        title: "Secure Your Phone",
        text: "Use strong passwords or biometrics to lock your phone. Enable Find My Device feature. Keep your phone charged when traveling.",
        icon: "fa-mobile-alt",
        type: "tip-info"
    },
    
    // Self Defense & Tools
    {
        title: "Use the Fake Call Feature",
        text: "If you feel unsafe, use the fake call feature to create an excuse to leave a situation quickly. It's a discreet way to extract yourself from danger.",
        icon: "fa-phone-volume",
        type: "tip-info"
    },
    {
        title: "Emergency Siren Awareness",
        text: "The emergency siren can be activated instantly to attract attention and deter attackers. Know where the emergency button is in your app.",
        icon: "fa-bell",
        type: "tip-emergency"
    },
    
    // Travel Safety
    {
        title: "Safe Transportation",
        text: "Use registered taxi or ride-share services. Verify the license plate before entering. Share your ride details with a trusted contact.",
        icon: "fa-taxi",
        type: "tip-info"
    },
    {
        title: "Accommodation Safety",
        text: "When traveling, choose reputable accommodations. Use deadbolts and chain locks. Keep important documents secure and have digital backups.",
        icon: "fa-hotel",
        type: "tip-info"
    },
    
    // Daily Safety Habits
    {
        title: "Plan Your Route",
        text: "Before going out, plan your route and share it with someone you trust. Stick to busy, well-lit areas. Have a backup plan if something goes wrong.",
        icon: "fa-route",
        type: "tip-success"
    },
    {
        title: "Stay Connected",
        text: "Keep your phone charged and have emergency contacts on speed dial. Check in regularly with family or friends, especially when traveling alone.",
        icon: "fa-wifi",
        type: "tip-success"
    },
    {
        title: "Trust Your Network",
        text: "Build a support network of friends, family, and neighbors. Having people who know your routine can help spot when something is wrong.",
        icon: "fa-users",
        type: "tip-success"
    },
    
    // Workplace Safety
    {
        title: "Workplace Security",
        text: "Be aware of emergency exits at work. Don't share sensitive information with colleagues you don't trust well. Report any suspicious behavior.",
        icon: "fa-briefcase",
        type: "tip-info"
    },
    {
        title: "Late Night Safety",
        text: "If working late, let someone know. Use well-lit parking lots and walkways. Consider using escort services if available at your workplace.",
        icon: "fa-moon",
        type: "tip-info"
    },
    
    // Self Care & Awareness
    {
        title: "Trust But Verify Online",
        text: "Be cautious about online relationships. Video chat before meeting in person. Search people's names and photos to verify their identity.",
        icon: "fa-search",
        type: "tip-info"
    },
    {
        title: "Be Prepared, Not Paranoid",
        text: "Safety tips are about preparation, not fear. Being prepared gives you confidence. Review your emergency plan regularly.",
        icon: "fa-clipboard-check",
        type: "tip-success"
    }
];

// Audio context for synthesized sounds
let audioContext = null;
let ringtoneInterval = null;
let sirenOscillator = null;
let sirenGain = null;

// API Base URL
const API_BASE = '';

// Detect mobile device
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
        || (window.innerWidth <= 896 && 'ontouchstart' in window);
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    setupMobileOptimizations();
    showLoadingScreen();
});

function setupMobileOptimizations() {
    // Add touch class to body for mobile-specific styling
    if (isMobile()) {
        document.body.classList.add('is-mobile');
        
        // Prevent pinch zoom on specific elements
        const mapElements = document.querySelectorAll('#map, #shelterMap');
        mapElements.forEach(el => {
            el.addEventListener('touchstart', function(e) {
                if (e.touches.length > 1) {
                    e.preventDefault();
                }
            }, { passive: false });
            
            // Prevent double-tap zoom
            let lastTouchEnd = 0;
            el.addEventListener('touchend', function(e) {
                const now = Date.now();
                if (now - lastTouchEnd <= 300) {
                    e.preventDefault();
                }
                lastTouchEnd = now;
            }, false);
        });
        
        // Improve scroll behavior
        document.body.style.webkitOverflowScrolling = 'touch';
        
        // Hide address bar on load
        setTimeout(() => {
            window.scrollTo(0, 1);
        }, 100);
        
        // Handle orientation change
        window.addEventListener('orientationchange', function() {
            setTimeout(() => {
                if (currentMap) currentMap.invalidateSize();
                if (sheltersMap) sheltersMap.invalidateSize();
            }, 300);
        });
        
        // Optimize notifications for mobile
        optimizeNotificationsPosition();
        
        // Add haptic feedback if available
        if (navigator.vibrate) {
            document.querySelectorAll('.btn, .nav-btn, .emergency-btn, .contact-call-btn').forEach(el => {
                el.addEventListener('click', function() {
                    navigator.vibrate(10);
                });
            });
        }
    }
}

function optimizeNotificationsPosition() {
    const notificationElements = document.querySelectorAll('.notification');
    notificationElements.forEach(notification => {
        notification.style.top = '10px';
        notification.style.left = '10px';
        notification.style.right = '10px';
        notification.style.maxWidth = 'none';
        notification.style.width = 'auto';
    });
}

function initializeApp() {
    // Check if we're on the dashboard page
    if (document.getElementById('dashboard-container') || document.querySelector('.dashboard-container')) {
        setTimeout(() => {
            hideLoadingScreen();
            loadShelters();
            loadTips();
            loadRecommendations();
            loadNotifications();
            initializeMaps();
            
            // Initialize behavior tracking and personalized features
            initBehaviorTracking();
            
            // Initialize safety tip animation
            initSafetyTipBanner();
            
            // Load personalized content after a short delay
            setTimeout(() => {
                loadPersonalizedRecommendations();
                loadSmartNotifications();
            }, 3000);
        }, 2000);
    } else {
        hideLoadingScreen();
    }
}

// Safety Tip Banner Functions
function initSafetyTipBanner() {
    // Check if we're on dashboard and banner container exists
    const overviewSection = document.getElementById('overview');
    if (!overviewSection) return;
    
    // Create banner container if it doesn't exist
    let bannerContainer = document.getElementById('safetyTipBannerContainer');
    if (!bannerContainer) {
        bannerContainer = document.createElement('div');
        bannerContainer.id = 'safetyTipBannerContainer';
        bannerContainer.style.cssText = 'margin-bottom: 30px;';
        
        // Insert at the beginning of overview section, after header
        const header = overviewSection.querySelector('.overview-header');
        if (header && header.nextSibling) {
            overviewSection.insertBefore(bannerContainer, header.nextSibling);
        } else {
            overviewSection.insertBefore(bannerContainer, overviewSection.firstChild);
        }
    }
    
    // Render initial tip
    renderSafetyTip();
    
    // Start auto-rotation
    startTipRotation();
}

function renderSafetyTip() {
    const bannerContainer = document.getElementById('safetyTipBannerContainer');
    if (!bannerContainer) return;
    
    const tip = safetyTips[currentTipIndex];
    
    // Create indicators HTML
    let indicatorsHTML = '';
    safetyTips.forEach((_, index) => {
        indicatorsHTML += `<button class="tip-indicator ${index === currentTipIndex ? 'active' : ''}" onclick="goToTip(${index})"></button>`;
    });
    
    bannerContainer.innerHTML = `
        <div class="safety-tip-banner ${tip.type}" onclick="showSection('tips')">
            <div class="safety-tip-inner">
                <div class="safety-tip-icon-section">
                    <div class="safety-tip-icon">
                        <i class="fas ${tip.icon}"></i>
                    </div>
                </div>
                <div class="safety-tip-content">
                    <div class="safety-tip-label">
                        <i class="fas fa-lightbulb"></i>
                        Safety Tip
                    </div>
                    <h3 class="safety-tip-title">${tip.title}</h3>
                    <p class="safety-tip-text">${tip.text}</p>
                    <div class="safety-tip-nav">
                        <div class="tip-arrows">
                            <button class="tip-arrow" onclick="event.stopPropagation(); previousTip()">
                                <i class="fas fa-chevron-left"></i>
                            </button>
                            <button class="tip-arrow" onclick="event.stopPropagation(); nextTip()">
                                <i class="fas fa-chevron-right"></i>
                            </button>
                        </div>
                        <div class="tip-indicators">
                            ${indicatorsHTML}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function nextTip() {
    currentTipIndex = (currentTipIndex + 1) % safetyTips.length;
    animateTipChange();
}

function previousTip() {
    currentTipIndex = (currentTipIndex - 1 + safetyTips.length) % safetyTips.length;
    animateTipChange();
}

function goToTip(index) {
    currentTipIndex = index;
    animateTipChange();
}

function animateTipChange() {
    const banner = document.querySelector('.safety-tip-banner');
    if (banner) {
        // Add fade out animation
        banner.style.animation = 'tipContentFade 0.3s ease reverse forwards';
        
        setTimeout(() => {
            renderSafetyTip();
        }, 300);
    }
    
    // Reset interval
    startTipRotation();
}

function startTipRotation() {
    // Clear existing interval
    if (tipInterval) {
        clearInterval(tipInterval);
    }
    
    // Start new interval
    tipInterval = setInterval(() => {
        nextTip();
    }, TIP_DISPLAY_DURATION);
}

function stopTipRotation() {
    if (tipInterval) {
        clearInterval(tipInterval);
        tipInterval = null;
    }
}

function initBehaviorTracking() {
    // Track initial page load
    trackUserBehavior('page_load', 'Dashboard loaded');
    
    // Set up behavior tracking for key actions
    setupBehaviorEventListeners();
    
    // Analyze behavior patterns periodically
    setInterval(analyzeBehaviorPatterns, 300000); // Every 5 minutes
}

function setupBehaviorEventListeners() {
    // Track section navigation
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const sectionId = this.onclick.toString().match(/showSection\('([^']+)'\)/);
            if (sectionId && sectionId[1]) {
                trackUserBehavior('navigation', `Navigated to ${sectionId[1]}`);
            }
        });
    });
    
    // Track emergency actions
    const emergencyButtons = document.querySelectorAll('.emergency-btn, .floating-emergency');
    emergencyButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const action = this.querySelector('.btn-title')?.textContent || 'Emergency';
            trackUserBehavior('emergency_activation', `Activated: ${action}`);
        });
    });
    
    // Track location actions
    const locationButtons = document.querySelectorAll('#startTracking, #stopTracking, #shareLocation');
    locationButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const action = this.id;
            trackUserBehavior('location_tracking', `Location action: ${action}`);
        });
    });
    
    // Track AI assistant usage
    const aiButtons = document.querySelectorAll('#startAI, #stopAI, .suggestion-btn');
    aiButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const action = this.id || this.textContent.trim();
            trackUserBehavior('ai_assistant', `AI action: ${action}`);
        });
    });
    
    // Track complaint actions
    const complaintForm = document.getElementById('complaintForm');
    if (complaintForm) {
        complaintForm.addEventListener('submit', function() {
            trackUserBehavior('complaint_filing', 'Submitted new complaint');
        });
    }
    
    // Track shelter search actions
    const shelterButtons = document.querySelectorAll('#shelterSearch, #shelterFilter');
    shelterButtons.forEach(btn => {
        btn.addEventListener('change', function() {
            trackUserBehavior('shelter_search', 'Searched for shelters');
        });
    });
}

function showLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.style.display = 'flex';
    }
}

function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        setTimeout(() => {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }, 2000);
    }
}

function setupEventListeners() {
    // Close notifications panel when clicking outside
    document.addEventListener('click', function(event) {
        const notificationsPanel = document.getElementById('notificationsPanel');
        const notificationBtn = document.querySelector('[onclick="toggleNotifications()"]');
        
        if (notificationsPanel && !notificationsPanel.contains(event.target) && 
            !notificationBtn.contains(event.target)) {
            notificationsPanel.classList.remove('active');
        }
    });

    // Close history modal when clicking outside
    document.addEventListener('click', function(event) {
        const historyModal = document.getElementById('complaintHistoryModal');
        const historyContent = document.querySelector('.history-modal-content');
        
        if (historyModal && historyModal.classList.contains('active')) {
            if (!historyContent.contains(event.target)) {
                historyModal.classList.remove('active');
            }
        }
    });

    // Handle escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            const notificationsPanel = document.getElementById('notificationsPanel');
            const historyModal = document.getElementById('complaintHistoryModal');
            
            if (notificationsPanel) {
                notificationsPanel.classList.remove('active');
            }
            if (historyModal) {
                historyModal.classList.remove('active');
            }
        }
    });
}

// Authentication Functions for index page - DEPRECATED
// These functions are now handled by inline scripts in the HTML templates
// to properly support pattern lock authentication

// Legacy function placeholders to prevent errors
function showLogin() {
    // This function is now handled by inline scripts
    console.log('showLogin called - use inline script instead');
}

function showRegister() {
    // This function is now handled by inline scripts
    console.log('showRegister called - use inline script instead');
}

function switchTab(tab) {
    // This function is now handled by inline scripts
    console.log('switchTab called - use inline script instead');
}

function togglePassword(fieldId) {
    // This function is now handled by inline scripts
    console.log('togglePassword called - use inline script instead');
}

function showMessage(message, type) {
    // This function is now handled by inline scripts
    console.log('showMessage called - use inline script instead');
}

function clearMessage() {
    // This function is now handled by inline scripts
    console.log('clearMessage called - use inline script instead');
}

// Note: handleLogin and handleRegister are now defined inline in HTML templates
// to properly support pattern lock authentication

// Enhanced Dashboard Navigation
function showSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.style.display = 'none';
        section.classList.remove('active');
    });
    
    // Remove active class from all nav buttons
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
        targetSection.classList.add('active');
        
        // Add animation
        targetSection.style.animation = 'none';
        setTimeout(() => {
            targetSection.style.animation = '';
        }, 10);
    }
    
    // Add active class to clicked nav button
    const activeBtn = document.querySelector(`[onclick*="showSection('${sectionId}')"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // Close mobile nav if open
    toggleMobileNav(true);
    
    // Initialize or update content based on section
    switch(sectionId) {
        case 'location':
            setTimeout(() => {
                if (currentMap) {
                    currentMap.invalidateSize();
                    currentMap.setView([28.6139, 77.2090], 10);
                }
                updateLocationStatus();
            }, 200);
            break;
        case 'shelters':
            setTimeout(() => {
                if (sheltersMap) {
                    sheltersMap.invalidateSize();
                    sheltersMap.setView([28.6139, 77.2090], 10);
                }
            }, 200);
            break;
        case 'ai-assistant':
            initializeAIChat();
            break;
        case 'overview':
            updateOverviewStats();
            break;
        case 'sms-gateway':
            // Load SMS history and emergency contacts when SMS gateway section is opened
            if (typeof showSMSHistory === 'function') {
                showSMSHistory();
            }
            if (typeof loadEmergencyContacts === 'function') {
                loadEmergencyContacts();
            }
            break;
        case 'emergency':
            // Load emergency contacts when emergency section is opened
            if (typeof loadEmergencyContacts === 'function') {
                loadEmergencyContacts();
            }
            break;
        case 'complaints':
            // Refresh complaints if needed
            break;
        case 'tips':
            // Refresh tips if needed
            break;
    }
    
    // Update activity log
    addToActivity(`Switched to ${sectionId.replace('-', ' ')} section`);
}

function addToActivity(activity) {
    const activityList = document.getElementById('activityList');
    if (activityList) {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        activityItem.innerHTML = `
            <div class="activity-icon">
                <i class="fas fa-clock"></i>
            </div>
            <div class="activity-content">
                <p>${activity}</p>
                <small>${new Date().toLocaleTimeString()}</small>
            </div>
        `;

        // Insert at the top
        activityList.insertBefore(activityItem, activityList.firstChild);

        // Remove old items if too many
        const items = activityList.children;
        if (items.length > 5) {
            activityList.removeChild(items[items.length - 1]);
        }
    }
    
    // Track user behavior
    trackUserBehavior('activity', activity);
}

// Overview Dashboard Functions
function updateOverviewStats() {
    // Update location status
    const locationStatus = document.getElementById('overviewLocation');
    if (locationStatus) {
        if (currentLocation) {
            locationStatus.textContent = 'Active';
            locationStatus.style.color = '#28a745';
        } else {
            locationStatus.textContent = 'Not Tracking';
            locationStatus.style.color = '#6c757d';
        }
    }

    // Update AI status
    const aiStatus = document.getElementById('overviewAI');
    if (aiStatus) {
        aiStatus.textContent = aiListening ? 'Listening' : 'Ready';
    }
}

// User Behavior Tracking Functions
function trackUserBehavior(actionType, actionDetails = '', latitude = null, longitude = null) {
    console.log('Behavior tracked:', actionType, actionDetails);
}

async function loadPersonalizedRecommendations() {
    try {
        const response = await fetch('/api/personalized-recommendations');
        const data = await response.json();

        if (data.success && data.recommendations && data.recommendations.length > 0) {
            displayPersonalizedRecommendations(data.recommendations);
            
            // Track that user viewed recommendations
            trackUserBehavior('recommendation_view', `Viewed ${data.recommendations.length} recommendations`);
        }
    } catch (error) {
        console.error('Error loading personalized recommendations:', error);
    }
}

function displayPersonalizedRecommendations(recommendations) {
    const recommendationsList = document.getElementById('recommendationsList');
    if (!recommendationsList) return;

    // Clear existing recommendations
    recommendationsList.innerHTML = '';

    recommendations.forEach(rec => {
        const recElement = document.createElement('div');
        recElement.className = 'recommendation-item personalized';
        
        // Add priority indicator
        let priorityIndicator = '';
        if (rec.priority === 'critical') {
            priorityIndicator = '<div class="priority-badge critical">⚠️ Critical</div>';
        } else if (rec.priority === 'high') {
            priorityIndicator = '<div class="priority-badge high">⭐ High Priority</div>';
        }

        recElement.innerHTML = `
            <div class="recommendation-header">
                <div class="recommendation-icon">
                    <i class="fas fa-star"></i>
                </div>
                <div class="recommendation-title">
                    <h4>${rec.title}</h4>
                    ${priorityIndicator}
                </div>
            </div>
            <div class="recommendation-content">
                <p>${rec.description}</p>
                <small class="recommendation-meta">Based on your activity • ${Math.round(rec.confidence * 100)}% match</small>
            </div>
            <div class="recommendation-actions">
                <button class="btn btn-small btn-primary" onclick="applyRecommendation('${rec.title}')">
                    <i class="fas fa-check"></i> Apply
                </button>
                <button class="btn btn-small btn-secondary" onclick="dismissRecommendation('${rec.title}')">
                    <i class="fas fa-times"></i> Dismiss
                </button>
            </div>
        `;
        
        recommendationsList.appendChild(recElement);
    });
}

function applyRecommendation(title) {
    showNotification(`Applied recommendation: ${title}`, 'success');
    trackUserBehavior('recommendation_applied', `Applied: ${title}`);
}

function dismissRecommendation(title) {
    showNotification(`Dismissed recommendation: ${title}`, 'info');
    trackUserBehavior('recommendation_dismissed', `Dismissed: ${title}`);
}

async function loadSmartNotifications() {
    try {
        const response = await fetch('/api/smart-notifications');
        const data = await response.json();

        if (data.success && data.notifications && data.notifications.length > 0) {
            data.notifications.forEach(notif => {
                showSmartNotification(notif.title, notif.message, notif.priority);
            });
            
            // Track that user received smart notifications
            trackUserBehavior('smart_notification_received', `Received ${data.notifications.length} smart notifications`);
        }
    } catch (error) {
        console.error('Error loading smart notifications:', error);
    }
}

function showSmartNotification(title, message, priority = 'medium') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification smart ${priority}`;

    // Add icon based on priority
    let icon = 'robot';
    if (priority === 'critical') {
        icon = 'exclamation-circle';
    } else if (priority === 'high') {
        icon = 'star';
    }

    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${icon}"></i>
            <div class="notification-text">
                <strong>${title}</strong>
                <p>${message}</p>
            </div>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

    // Style the notification
    Object.assign(notification.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '15px 20px',
        borderRadius: '10px',
        color: 'white',
        fontWeight: '500',
        zIndex: '10000',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease',
        maxWidth: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '15px',
        boxShadow: '0 5px 15px rgba(0, 0, 0, 0.2)',
        cursor: 'pointer'
    });

    // Set background color based on priority
    switch (priority) {
        case 'critical':
            notification.style.background = 'linear-gradient(135deg, #dc3545, #fd7e14)';
            break;
        case 'high':
            notification.style.background = 'linear-gradient(135deg, #ffc107, #fd7e14)';
            notification.style.color = '#212529';
            break;
        default:
            notification.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
    }

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    // Auto-remove after 8 seconds
    setTimeout(() => {
        if (document.body.contains(notification)) {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }
    }, 8000);

    // Play notification sound
    const notificationSound = document.getElementById('notificationSound');
    if (notificationSound) {
        notificationSound.play().catch(e => console.log('Notification audio not available:', e.message));
    }
}

async function analyzeBehaviorPatterns() {
    try {
        const response = await fetch('/api/behavior-patterns');
        const data = await response.json();

        if (data.success && data.patterns && data.patterns.length > 0) {
            console.log('Detected behavior patterns:', data.patterns);
            
            // Track that user analyzed patterns
            trackUserBehavior('behavior_analysis', `Analyzed ${data.patterns.length} patterns`);
            
            return data.patterns;
        }
    } catch (error) {
        console.error('Error analyzing behavior patterns:', error);
    }
    return [];
}

async function loadRecommendations() {
    const recommendationsList = document.getElementById('recommendationsList');
    if (!recommendationsList) return;

    try {
        const response = await fetch('/api/recommendations');
        const recommendations = await response.json();

        recommendationsList.innerHTML = ''; // Clear existing recommendations

        if (recommendations.length === 0) {
            recommendationsList.innerHTML = '<p>No recommendations available at the moment.</p>';
            return;
        }

        recommendations.forEach(rec => {
            const recElement = document.createElement('div');
            recElement.className = 'recommendation-item';
            recElement.innerHTML = `
                <div class="recommendation-icon">
                    <i class="fas fa-star"></i>
                </div>
                <div class="recommendation-content">
                    <h4>${rec.title}</h4>
                    <p>${rec.description}</p>
                </div>
            `;
            recommendationsList.appendChild(recElement);
        });
    } catch (error) {
        console.error('Error loading recommendations:', error);
        recommendationsList.innerHTML = '<p>Could not load recommendations.</p>';
    }
}

async function loadNotifications() {
    const notificationsList = document.getElementById('notificationsList');
    if (!notificationsList) return;

    try {
        const response = await fetch('/api/notifications');
        const notifications = await response.json();

        notificationsList.innerHTML = ''; // Clear existing notifications

        if (notifications.length === 0) {
            // Add default notifications if none exist
            const defaultNotifications = [
                {
                    title: 'Welcome to SafeGuard!',
                    message: 'Your personal security companion is now active. We\'re here to keep you safe.',
                    category: 'system',
                    priority: 'medium',
                    created_at: new Date().toISOString()
                },
                {
                    title: 'Enable Location Tracking',
                    message: 'For better emergency response, enable location tracking in the Live Location section.',
                    category: 'location',
                    priority: 'high',
                    created_at: new Date(Date.now() - 3600000).toISOString()
                },
                {
                    title: 'Emergency Contacts',
                    message: 'Consider adding emergency contacts for faster assistance during emergencies.',
                    category: 'safety_tip',
                    priority: 'low',
                    created_at: new Date(Date.now() - 7200000).toISOString()
                }
            ];
            
            defaultNotifications.forEach(notif => {
                addNotificationToPanel(notif.title, notif.message, notif.category, notif.priority, notif.created_at);
            });
            
            // Update tab counts
            updateTabCounts();
            return;
        }

        notifications.forEach(notif => {
            addNotificationToPanel(notif.title, notif.message, notif.category, notif.priority, notif.created_at);
        });

        updateNotificationCount();
        updateTabCounts();

    } catch (error) {
        console.error('Error loading notifications:', error);
        // Add fallback notifications on error
        const fallbackNotifications = [
            {
                title: 'Welcome to SafeGuard!',
                message: 'Your personal security companion is now active.',
                category: 'system',
                priority: 'medium',
                created_at: new Date().toISOString()
            },
            {
                title: 'System Status: Active',
                message: 'All security features are running smoothly.',
                category: 'system',
                priority: 'low',
                created_at: new Date(Date.now() - 1800000).toISOString()
            }
        ];
        
        notificationsList.innerHTML = '';
        fallbackNotifications.forEach(notif => {
            addNotificationToPanel(notif.title, notif.message, notif.category, notif.priority, notif.created_at);
        });
        updateTabCounts();
    }
}

function updateTabCounts() {
    const allCount = document.querySelectorAll('.notification-item').length;
    const unreadCount = document.querySelectorAll('.notification-item.unread').length;
    const importantCount = document.querySelectorAll('.notification-item.important, .notification-item.priority-high').length;
    const emergencyCount = document.querySelectorAll('.notification-item.priority-critical').length;
    
    // Update tab counts in the HTML
    const countAll = document.getElementById('countAll');
    const countUnread = document.getElementById('countUnread');
    const countImportant = document.getElementById('countImportant');
    const countEmergency = document.getElementById('countEmergency');
    
    if (countAll) countAll.textContent = allCount;
    if (countUnread) countUnread.textContent = unreadCount;
    if (countImportant) countImportant.textContent = importantCount;
    if (countEmergency) countEmergency.textContent = emergencyCount;
    
    // Fallback to old method if IDs not found
    const tabCounts = document.querySelectorAll('.tab-count');
    if (tabCounts.length >= 4 && !countAll) {
        tabCounts[0].textContent = allCount;
        tabCounts[1].textContent = unreadCount;
        tabCounts[2].textContent = importantCount;
        tabCounts[3].textContent = emergencyCount;
    }
    
    // Update stats bar
    updateNotificationStats();
}

// Enhanced Location Tracking Functions
function startLocationTracking() {
    if (!navigator.geolocation) {
        showNotification('Geolocation is not supported by this browser.', 'error');
        return;
    }
    
    const startBtn = document.getElementById('startTracking');
    const stopBtn = document.getElementById('stopTracking');
    
    startBtn.disabled = true;
    stopBtn.disabled = false;
    
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            currentLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy
            };
            
            await updateLocationOnMap();
            await sendLocationToServer();
            updateLocationStatus();
            
            // Start continuous tracking
            const interval = parseInt(document.getElementById('trackingInterval').value) || 30000;
            locationTrackingInterval = setInterval(async () => {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        currentLocation = {
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            accuracy: position.coords.accuracy
                        };
                        
                        await updateLocationOnMap();
                        await sendLocationToServer();
                        updateLocationStatus();
                    },
                    (error) => {
                        console.error('Geolocation error:', error);
                    },
                    getGeolocationOptions()
                );
            }, interval);
            
            showNotification('Location tracking started successfully!', 'success');
            addToActivity('Started location tracking');
        },
        (error) => {
            console.error('Geolocation error:', error);
            showNotification('Failed to get location. Please enable location services.', 'error');
            startBtn.disabled = false;
            stopBtn.disabled = true;
        },
        getGeolocationOptions()
    );
}

function stopLocationTracking() {
    if (locationTrackingInterval) {
        clearInterval(locationTrackingInterval);
        locationTrackingInterval = null;
    }
    
    const startBtn = document.getElementById('startTracking');
    const stopBtn = document.getElementById('stopTracking');
    
    startBtn.disabled = false;
    stopBtn.disabled = true;
    
    showNotification('Location tracking stopped.', 'info');
    addToActivity('Stopped location tracking');
    updateLocationStatus();
}

function getGeolocationOptions() {
    const accuracyLevel = document.getElementById('accuracyLevel').value;
    let options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
    };
    
    switch(accuracyLevel) {
        case 'low':
            options.enableHighAccuracy = false;
            options.timeout = 5000;
            break;
        case 'balanced':
            options.enableHighAccuracy = true;
            options.timeout = 10000;
            break;
        case 'high':
            options.enableHighAccuracy = true;
            options.timeout = 20000;
            break;
    }
    
    return options;
}

function updateTrackingInterval() {
    if (locationTrackingInterval) {
        clearInterval(locationTrackingInterval);
        startLocationTracking();
    }
}

function updateAccuracyLevel() {
    if (locationTrackingInterval) {
        // Restart with new accuracy settings
        stopLocationTracking();
        setTimeout(startLocationTracking, 100);
    }
}

function updateLocationStatus() {
    const trackingStatus = document.getElementById('trackingStatus');
    const lastUpdate = document.getElementById('lastUpdate');
    const accuracy = document.getElementById('accuracy');
    const locationStatus = document.getElementById('locationStatus');
    
    if (trackingStatus) {
        trackingStatus.textContent = locationTrackingInterval ? 'Active' : 'Inactive';
        trackingStatus.style.color = locationTrackingInterval ? '#28a745' : '#6c757d';
    }
    
    if (lastUpdate) {
        lastUpdate.textContent = locationTrackingInterval ? new Date().toLocaleTimeString() : 'Never';
    }
    
    if (accuracy && currentLocation) {
        accuracy.textContent = `${Math.round(currentLocation.accuracy)}m`;
    }
    
    if (locationStatus) {
        const statusSpan = locationStatus.querySelector('span');
        if (statusSpan) {
            statusSpan.textContent = `Location: ${locationTrackingInterval ? 'Active' : 'Inactive'}`;
        }
    }
}

async function sendLocationToServer() {
    if (!currentLocation) return;
    
    try {
        const response = await fetch('/api/location', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(currentLocation)
        });
        
        if (!response.ok) {
            console.error('Failed to send location to server');
        }
    } catch (error) {
        console.error('Error sending location:', error);
    }
}

function shareLocation() {
    if (!currentLocation) {
        showNotification('Please start location tracking first.', 'warning');
        return;
    }
    
    const shareText = `My current location: https://maps.google.com/?q=${currentLocation.latitude},${currentLocation.longitude}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'My Location',
            text: shareText
        }).then(() => {
            showNotification('Location shared successfully!', 'success');
            addToActivity('Shared location with contacts');
        }).catch(error => {
            console.error('Error sharing:', error);
            fallbackShareLocation(shareText);
        });
    } else {
        fallbackShareLocation(shareText);
    }
}

function fallbackShareLocation(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Location copied to clipboard!', 'success');
        addToActivity('Copied location to clipboard');
    }).catch(() => {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showNotification('Location copied to clipboard!', 'success');
    });
}

function emergencyShareLocation() {
    if (!currentLocation) {
        showNotification('Starting location tracking...', 'info');
        startLocationTracking();
        setTimeout(() => {
            if (currentLocation) {
                shareLocation();
            }
        }, 3000);
    } else {
        shareLocation();
    }
}

// Enhanced Map Functions
function initializeMaps() {
    // Initialize main location map
    const mapElement = document.getElementById('map');
    if (mapElement) {
        // Set default view with better zoom for mobile
        const defaultZoom = isMobile() ? 12 : 10;
        currentMap = L.map('map', {
            zoomControl: !isMobile(), // Hide zoom control on mobile (use pinch)
            dragging: true,
            tap: true
        }).setView([28.6139, 77.2090], defaultZoom);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(currentMap);
        
        // Add locate control for mobile
        if (isMobile() && navigator.geolocation) {
            L.control.locate({
                position: 'topright',
                drawCircle: true,
                follow: true,
                setView: 'untilPan',
                keepCurrentZoomLevel: true,
                markerStyle: {
                    weight: 3,
                    color: '#667eea',
                    fillColor: '#667eea',
                    fillOpacity: 0.3
                },
                circleStyle: {
                    weight: 2,
                    color: '#667eea',
                    fillColor: '#667eea',
                    fillOpacity: 0.1
                }
            }).addTo(currentMap);
        }
    }
    
    // Initialize shelters map
    const shelterMapElement = document.getElementById('shelterMap');
    if (shelterMapElement) {
        const defaultZoom = isMobile() ? 12 : 10;
        sheltersMap = L.map('shelterMap', {
            zoomControl: !isMobile(),
            dragging: true,
            tap: true
        }).setView([28.6139, 77.2090], defaultZoom);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(sheltersMap);
        
        // Add locate control for mobile
        if (isMobile() && navigator.geolocation) {
            L.control.locate({
                position: 'topright',
                drawCircle: true,
                follow: true,
                setView: 'untilPan',
                keepCurrentZoomLevel: true
            }).addTo(sheltersMap);
        }
    }
    
    // Update map size on window resize (mobile)
    if (isMobile()) {
        window.addEventListener('resize', debounce(() => {
            if (currentMap) currentMap.invalidateSize();
            if (sheltersMap) sheltersMap.invalidateSize();
        }, 250));
    }
}

// Fix map display issues when section becomes visible
function ensureMapVisible(mapId) {
    const mapElement = document.getElementById(mapId);
    if (!mapElement) return;
    
    // Check if parent is visible
    let parent = mapElement.parentElement;
    while (parent) {
        const style = window.getComputedStyle(parent);
        if (style.display === 'none' || style.visibility === 'hidden') {
            return; // Map is hidden, don't invalidate
        }
        parent = parent.parentElement;
    }
    
    // Small delay to ensure DOM is ready
    setTimeout(() => {
        if (mapId === 'map' && currentMap) {
            currentMap.invalidateSize();
            currentMap.setView([28.6139, 77.2090], 10);
        } else if (mapId === 'shelterMap' && sheltersMap) {
            sheltersMap.invalidateSize();
            sheltersMap.setView([28.6139, 77.2090], 10);
        }
    }, 100);
}

// Initialize map when location section is shown
// This function is called from dashboard.html when switching to location section
function initMap() {
    // Check if maps are already initialized
    if (!currentMap) {
        initializeMaps();
    }
    
    // Ensure map is properly sized after section becomes visible
    setTimeout(() => {
        if (currentMap) {
            currentMap.invalidateSize();
            currentMap.setView([28.6139, 77.2090], 10);
        }
    }, 300);
}

// Debounce utility for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

async function updateLocationOnMap() {
    if (!currentMap || !currentLocation) return;
    
    // Clear existing markers
    currentMap.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
            currentMap.removeLayer(layer);
        }
    });
    
    // Add current location marker with custom icon
    const customIcon = L.divIcon({
        className: 'custom-location-marker',
        html: '<div class="location-marker"><i class="fas fa-user"></i></div>',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });
    
    const marker = L.marker([currentLocation.latitude, currentLocation.longitude], { icon: customIcon })
        .addTo(currentMap)
        .bindPopup('Your Current Location')
        .openPopup();
    
    currentMap.setView([currentLocation.latitude, currentLocation.longitude], 13);
    
    // Update location history
    updateLocationHistory(currentLocation);
    
    // Update location info display
    const locationInfo = document.getElementById('locationInfo');
    if (locationInfo) {
        locationInfo.innerHTML = `
            <div class="location-details">
                <h4>Current Location</h4>
                <p><strong>Latitude:</strong> ${currentLocation.latitude.toFixed(6)}</p>
                <p><strong>Longitude:</strong> ${currentLocation.longitude.toFixed(6)}</p>
                <p><strong>Accuracy:</strong> ${currentLocation.accuracy.toFixed(0)}m</p>
                <p><strong>Last Updated:</strong> ${new Date().toLocaleString()}</p>
            </div>
        `;
    }
}

function updateLocationHistory(location) {
    const locationHistory = document.getElementById('locationHistory');
    if (!locationHistory) return;
    
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    historyItem.innerHTML = `
        <div class="history-time">${new Date().toLocaleTimeString()}</div>
        <div class="history-coords">${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}</div>
        <div class="history-accuracy">±${Math.round(location.accuracy)}m</div>
    `;
    
    locationHistory.insertBefore(historyItem, locationHistory.firstChild);
    
    // Remove old items if too many
    const items = locationHistory.children;
    if (items.length > 10) {
        locationHistory.removeChild(items[items.length - 1]);
    }
}

// Enhanced Shelters Functions
async function loadShelters() {
    try {
        const response = await fetch('/api/shelters');
        const shelters = await response.json();
        displayShelters(shelters);
        displaySheltersOnMap(shelters);
    } catch (error) {
        console.error('Error loading shelters:', error);
        showNotification('Failed to load shelters data.', 'error');
    }
}

function displayShelters(shelters) {
    const sheltersList = document.getElementById('sheltersList');
    
    if (!sheltersList) return;
    
    if (shelters.length === 0) {
        sheltersList.innerHTML = '<p>No shelters found.</p>';
        return;
    }
    
    sheltersList.innerHTML = shelters.map(shelter => `
        <div class="shelter-card" onclick="focusOnShelter(${shelter.latitude}, ${shelter.longitude})">
            <h4>${shelter.name}</h4>
            <p><i class="fas fa-map-marker-alt"></i> ${shelter.address}</p>
            <p><i class="fas fa-phone"></i> ${shelter.phone}</p>
            <p><i class="fas fa-users"></i> Capacity: ${shelter.capacity}</p>
            <p><i class="fas fa-star"></i> Rating: ${shelter.rating}/5</p>
            <p><i class="fas fa-concierge-bell"></i> ${shelter.facilities}</p>
            <div class="shelter-actions">
                <button class="btn btn-small btn-primary" onclick="event.stopPropagation(); getDirections(${shelter.latitude}, ${shelter.longitude})">
                    <i class="fas fa-directions"></i> Directions
                </button>
                <button class="btn btn-small btn-success" onclick="event.stopPropagation(); callShelter('${shelter.phone}')">
                    <i class="fas fa-phone"></i> Call
                </button>
            </div>
        </div>
    `).join('');
}

function displaySheltersOnMap(shelters) {
    if (!sheltersMap) return;
    
    shelters.forEach(shelter => {
        const customIcon = L.divIcon({
            className: 'custom-shelter-marker',
            html: '<div class="shelter-marker"><i class="fas fa-home"></i></div>',
            iconSize: [25, 25],
            iconAnchor: [12, 12]
        });
        
        const popupOptions = {
            maxWidth: isMobile() ? '90vw' : '400px',
            maxHeight: '70vh',
            closeButton: true,
            autoPanPadding: [10, 10]
        };
        const marker = L.marker([shelter.latitude, shelter.longitude], { icon: customIcon })
            .addTo(sheltersMap)
            .bindPopup(`
                <div class="shelter-popup">
                    <h4>${shelter.name}</h4>
                    <p><strong>Address:</strong> ${shelter.address}</p>
                    <p><strong>Phone:</strong> ${shelter.phone}</p>
                    <p><strong>Rating:</strong> ${shelter.rating}/5</p>
                    <p><strong>Capacity:</strong> ${shelter.capacity} people</p>
                    <p><strong>Facilities:</strong> ${shelter.facilities}</p>
                    <div class="popup-actions">
                        <button onclick="getDirections(${shelter.latitude}, ${shelter.longitude})" class="btn btn-small btn-primary">
                            <i class="fas fa-directions"></i> Directions
                        </button>
                        <button onclick="callShelter('${shelter.phone}')" class="btn btn-small btn-success">
                            <i class="fas fa-phone"></i> Call
                        </button>
                    </div>
                </div>
            `, popupOptions);
    });
}

function focusOnShelter(lat, lng) {
    if (sheltersMap) {
        sheltersMap.setView([lat, lng], 15);
        showSection('shelters');
    }
}

function getDirections(lat, lng) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
    addToActivity('Got directions to shelter');
}

function callShelter(phone) {
    if (confirm(`Call ${phone}?`)) {
        window.location.href = `tel:${phone}`;
        addToActivity(`Called shelter: ${phone}`);
    }
}

function refreshShelters() {
    loadShelters();
    showNotification('Shelters refreshed', 'success');
    addToActivity('Refreshed shelters list');
}

function showNearbyShelters() {
    if (!currentLocation) {
        showNotification('Please enable location tracking first', 'warning');
        return;
    }
    
    showNotification('Finding nearby shelters...', 'info');
    loadShelters(); // This will show shelters on map
    showSection('shelters');
}

function filterShelters() {
    const searchTerm = document.getElementById('shelterSearch').value.toLowerCase();
    const filterValue = document.getElementById('shelterFilter').value;
    const shelterCards = document.querySelectorAll('.shelter-card');
    
    shelterCards.forEach(card => {
        const name = card.querySelector('h4').textContent.toLowerCase();
        const address = card.querySelector('p').textContent.toLowerCase();
        const facilities = card.textContent.toLowerCase();
        
        let show = name.includes(searchTerm) || address.includes(searchTerm) || facilities.includes(searchTerm);
        
        if (filterValue === 'nearby' && currentLocation) {
            // Filter by distance (simplified)
            show = show && true; // You could implement distance calculation here
        } else if (filterValue === 'available') {
            show = show && true; // You could check availability status here
        } else if (filterValue === 'high-rated') {
            show = show && card.textContent.includes('4'); // Basic rating filter
        }
        
        card.style.display = show ? 'block' : 'none';
    });
}

// Enhanced Emergency Functions
function activateSiren() {
    // Always use Web Audio API for siren (more reliable than corrupted MP3 file)
    playSirenWebAudio();
    
    // Add visual effects
    const sirenBtn = document.querySelector('.siren-btn');
    if (sirenBtn) {
        sirenBtn.classList.add('pulse');
        setTimeout(() => {
            sirenBtn.classList.remove('pulse');
        }, 10000);
    }
    
    showNotification('🚨 SIREN ACTIVATED! Emergency services notified.', 'error');
    addToActivity('Activated emergency siren');
    
    // Flash screen
    flashScreen();
    
    // Notify authorities (simulated)
    setTimeout(() => {
        showNotification('Emergency contacts have been notified of your location', 'warning');
    }, 2000);
    
    // Auto-stop siren after 10 seconds
    setTimeout(() => {
        stopSiren();
        showNotification('Siren auto-stopped after 10 seconds', 'info');
    }, 10000);
}

function playSirenWebAudio() {
    // Web Audio API - Realistic Police Siren (Two-Tone Alternating)
    try {
        // Stop any existing siren first
        if (sirenOscillator) {
            sirenOscillator.stop();
            sirenOscillator = null;
        }
        if (sirenGain) {
            sirenGain.disconnect();
            sirenGain = null;
        }
        
        // Create or resume audio context
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        // Resume audio context if suspended (required by browsers)
        if (audioContext.state === 'suspended') {
            audioContext.resume().then(() => {
                console.log('Audio context resumed successfully');
            }).catch(e => {
                console.log('Failed to resume audio context:', e);
            });
        }
        
        // Create two oscillators for two-tone police siren effect
        const osc1 = audioContext.createOscillator();
        const osc2 = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        const lfo = audioContext.createOscillator();
        const lfoGain = audioContext.createGain();
        
        // Configure oscillators for police siren sound
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(600, audioContext.currentTime); // First tone
        
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(900, audioContext.currentTime); // Second tone (higher)
        
        // Use LFO to create the alternating siren pattern
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(1.5, audioContext.currentTime); // Speed of alternation (1.5 Hz = cycle every ~0.67s)
        
        lfoGain.gain.setValueAtTime(400, audioContext.currentTime);
        
        // Connect LFO to oscillator frequencies for the wailing effect
        lfo.connect(lfoGain);
        lfoGain.connect(osc1.frequency);
        lfoGain.connect(osc2.frequency);
        
        // Add vibrato for more realistic sound
        const vibrato = audioContext.createOscillator();
        const vibratoGain = audioContext.createGain();
        vibrato.type = 'sine';
        vibrato.frequency.setValueAtTime(8, audioContext.currentTime); // 8 Hz vibrato
        vibratoGain.gain.setValueAtTime(15, audioContext.currentTime);
        vibrato.connect(vibratoGain);
        vibratoGain.connect(osc1.frequency);
        vibratoGain.connect(osc2.frequency);
        
        // Main gain control
        gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
        
        // Connect everything
        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Start all oscillators
        osc1.start(audioContext.currentTime);
        osc2.start(audioContext.currentTime);
        lfo.start(audioContext.currentTime);
        vibrato.start(audioContext.currentTime);
        
        // Store references for stopping
        sirenOscillator = {
            stop: function() {
                try {
                    osc1.stop();
                    osc2.stop();
                    lfo.stop();
                    vibrato.stop();
                } catch(e) {
                    // Ignore errors if already stopped
                }
            }
        };
        
        sirenGain = gainNode;
        sirenGain.sirenInterval = null;
        
        console.log('Siren activated via Web Audio API');
        
    } catch (e) {
        console.log('Web Audio API not available for siren:', e.message);
    }
}

function stopSiren() {
    // Stop HTML audio
    const sirenSound = document.getElementById('sirenSound');
    if (sirenSound) {
        sirenSound.pause();
        sirenSound.currentTime = 0;
    }
    
    // Stop Web Audio API siren
    if (sirenOscillator) {
        try {
            sirenOscillator.stop();
        } catch(e) {
            // Ignore errors if already stopped
        }
        sirenOscillator = null;
    }
    if (sirenGain) {
        if (sirenGain.sirenInterval) {
            clearInterval(sirenGain.sirenInterval);
            sirenGain.sirenInterval = null;
        }
        try {
            sirenGain.disconnect();
        } catch(e) {
            // Ignore errors if already disconnected
        }
        sirenGain = null;
    }
    
    showNotification('Siren deactivated', 'info');
    addToActivity('Stopped emergency siren');
}

function flashScreen() {
    const flash = document.createElement('div');
    flash.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: red;
        opacity: 0.3;
        z-index: 10000;
        pointer-events: none;
    `;
    document.body.appendChild(flash);
    
    let flashes = 0;
    const flashInterval = setInterval(() => {
        flash.style.opacity = flash.style.opacity === '0.3' ? '0' : '0.3';
        flashes++;
        if (flashes > 10) {
            clearInterval(flashInterval);
            document.body.removeChild(flash);
        }
    }, 200);
}

function initiateFakeCall() {
    showNotification('📞 Initiating fake call...', 'info');
    addToActivity('Initiated fake call');
    
    // Simulate incoming call
    setTimeout(() => {
        showCallNotification();
    }, 3000);
}

function initiateFakeCall() {
    showNotification('📞 Initiating fake call...', 'info');
    addToActivity('Initiated fake call');
    
    // Simulate incoming call
    setTimeout(() => {
        showCallNotification();
    }, 3000);
}

function showCallNotification() {
    // Play ringtone sound using Web Audio API
    playRingtone();
    
    const callModal = document.createElement('div');
    callModal.className = 'call-modal';
    callModal.innerHTML = `
        <div class="call-content">
            <div class="caller-info">
                <div class="caller-avatar">
                    <i class="fas fa-user-circle"></i>
                </div>
                <h3>Emergency Contact</h3>
                <p class="call-status">Incoming call...</p>
                <div class="caller-number">Mom</div>
            </div>
            <div class="call-actions">
                <button class="call-btn accept" onclick="acceptCall()">
                    <i class="fas fa-phone"></i>
                </button>
                <button class="call-btn decline" onclick="declineCall()">
                    <i class="fas fa-phone-slash"></i>
                </button>
            </div>
        </div>
    `;
    
    // Add call modal styles
    const style = document.createElement('style');
    style.textContent = `
        .call-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .call-content {
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            border-radius: 30px;
            padding: 40px;
            text-align: center;
            max-width: 320px;
            color: white;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }
        .caller-avatar {
            font-size: 5rem;
            color: #4ecca3;
            margin-bottom: 20px;
            animation: pulse-ring 1s infinite;
        }
        @keyframes pulse-ring {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
        .call-status {
            color: #4ecca3;
            font-size: 1.2rem;
            margin-bottom: 10px;
        }
        .caller-number {
            font-size: 1.5rem;
            font-weight: bold;
            color: white;
        }
        .call-actions {
            display: flex;
            gap: 30px;
            justify-content: center;
            margin-top: 40px;
        }
        .call-btn {
            width: 70px;
            height: 70px;
            border: none;
            border-radius: 50%;
            font-size: 1.8rem;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .call-btn.accept {
            background: #28a745;
            color: white;
            box-shadow: 0 5px 20px rgba(40, 167, 69, 0.4);
        }
        .call-btn.decline {
            background: #dc3545;
            color: white;
            box-shadow: 0 5px 20px rgba(220, 53, 69, 0.4);
        }
        .call-btn:hover {
            transform: scale(1.1);
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(callModal);
    
    // Auto-decline after 15 seconds
    setTimeout(() => {
        if (document.body.contains(callModal)) {
            declineCall();
        }
    }, 15000);
}

// Web Audio API for ringtone
let ringtoneOscillators = [];

function playRingtone() {
    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        // Resume audio context if suspended (required by browsers)
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        // Play ringtone pattern: ring-ring...pause...ring-ring
        let pattern = 0;
        ringtoneInterval = setInterval(() => {
            if (pattern % 2 === 0) {
                playRingTone(440, 0.3); // A4
                setTimeout(() => playRingTone(440, 0.3), 400);
            }
            pattern++;
        }, 1200); // Every 1.2 seconds
        
    } catch (e) {
        console.log('Ringtone playback not available:', e.message);
    }
}

function playRingTone(frequency, duration) {
    if (!audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
    
    // Store oscillator to stop it if needed
    ringtoneOscillators.push(oscillator);
}

function stopRingtone() {
    // Clear interval
    if (ringtoneInterval) {
        clearInterval(ringtoneInterval);
        ringtoneInterval = null;
    }
    
    // Stop all ringtone oscillators
    ringtoneOscillators.forEach(osc => {
        try {
            osc.stop();
        } catch (e) {
            // Ignore errors if already stopped
        }
    });
    ringtoneOscillators = [];
    
    // Close audio context
    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }
}

function acceptCall() {
    // Stop ringtone using Web Audio API
    stopRingtone();
    
    // Also try to stop HTML audio element if it exists
    const ringtoneSound = document.getElementById('ringtoneSound');
    if (ringtoneSound) {
        ringtoneSound.pause();
        ringtoneSound.currentTime = 0;
    }
    
    showNotification('✅ Fake call answered. Stay safe!', 'success');
    addToActivity('Accepted fake call');
    closeCallModal();
}

function declineCall() {
    // Stop ringtone using Web Audio API
    stopRingtone();
    
    // Also try to stop HTML audio element if it exists
    const ringtoneSound = document.getElementById('ringtoneSound');
    if (ringtoneSound) {
        ringtoneSound.pause();
        ringtoneSound.currentTime = 0;
    }
    
    showNotification('📞 Call declined. Emergency features remain active.', 'info');
    addToActivity('Declined fake call');
    closeCallModal();
}

function closeCallModal() {
    const callModal = document.querySelector('.call-modal');
    const callStyles = document.querySelectorAll('style');
    if (callModal) {
        callModal.remove();
    }
    // Remove the dynamically added styles
    callStyles.forEach(style => {
        if (style.textContent.includes('.call-modal')) {
            style.remove();
        }
    });
}

function sendEmergencyAlert() {
    showNotification('🚨 EMERGENCY ALERT SENT!', 'error');
    showNotification('Location shared with emergency contacts and authorities', 'warning');
    addToActivity('Sent emergency alert to authorities');
    
    // Simulate emergency alert with multiple notifications
    setTimeout(() => {
        showNotification('Police have been notified of your emergency', 'error');
    }, 3000);
    
    setTimeout(() => {
        showNotification('Emergency contacts have received your location', 'warning');
    }, 5000);
}

function emergencyAlert() {
    if (confirm('🚨 EMERGENCY ALERT 🚨\n\nThis will activate ALL emergency features:\n• Siren alarm\n• Location sharing\n• Emergency notifications\n• Fake call simulation\n\nAre you in immediate danger?')) {
        activateSiren();
        emergencyShareLocation();
        sendEmergencyAlert();
        initiateFakeCall();
        
        // Add emergency banner
        showEmergencyBanner();
    }
}

function showEmergencyBanner() {
    const banner = document.createElement('div');
    banner.className = 'emergency-banner';
    banner.innerHTML = `
        <div class="banner-content">
            <i class="fas fa-exclamation-triangle"></i>
            <span>EMERGENCY MODE ACTIVE - HELP IS ON THE WAY</span>
            <button onclick="closeEmergencyBanner()" class="banner-close">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        .emergency-banner {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            background: linear-gradient(135deg, #dc3545, #fd7e14);
            color: white;
            z-index: 10001;
            animation: slideDown 0.5s ease;
        }
        .banner-content {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
            padding: 15px;
            font-weight: bold;
            font-size: 1.1rem;
        }
        .banner-close {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            font-size: 1.2rem;
            padding: 5px;
        }
        @keyframes slideDown {
            from { transform: translateY(-100%); }
            to { transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(banner);
}

function closeEmergencyBanner() {
    const banner = document.querySelector('.emergency-banner');
    if (banner) {
        banner.remove();
    }
}

function callEmergency(number) {
    // Auto-activate siren when calling police (100)
    if (number === '100') {
        activateSiren();
    }
    
    if (confirm(`Call ${number}?`)) {
        window.location.href = `tel:${number}`;
        addToActivity(`Called emergency number: ${number}`);
    }
}

let recognition;

// Enhanced AI Assistant Functions
function initializeAIChat() {
    const aiStatus = document.getElementById('aiStatus');
    if (aiStatus) {
        aiStatus.textContent = 'Ready';
        aiStatus.className = 'status-indicator';
    }

    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        const startBtn = document.getElementById('startAI');
        if(startBtn) {
            startBtn.disabled = true;
            startBtn.innerHTML = '<i class="fas fa-microphone-slash"></i> Not Supported';
        }
        showNotification('Voice recognition is not supported by your browser.', 'warning');
    } else {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event) => {
            const speechResult = event.results[0][0].transcript;
            addAIMessage(`You said: "${speechResult}"`, 'user');
            // Use the existing function to send the command to the backend
            const input = document.getElementById('aiTextInput');
            input.value = speechResult;
            sendAIMessage();
            stopAIAssistant(); // Stop listening after one command
        };

        recognition.onerror = (event) => {
            showNotification(`Voice recognition error: ${event.error}`, 'error');
            console.error('Speech recognition error', event);
            stopAIAssistant();
        };

        recognition.onend = () => {
            stopAIAssistant();
        };
    }
}

async function startAIAssistant() {
    if (!recognition) {
        showNotification('Voice recognition is not supported or not initialized.', 'error');
        return;
    }
    if (aiListening) return;
    
    aiListening = true;
    recognition.start();
    
    const startBtn = document.getElementById('startAI');
    const stopBtn = document.getElementById('stopAI');
    const voiceIndicator = document.getElementById('voiceIndicator');
    const aiStatus = document.getElementById('aiStatus');
    
    if (startBtn) startBtn.disabled = true;
    if (stopBtn) stopBtn.disabled = false;
    if (voiceIndicator) voiceIndicator.classList.add('active');
    if (aiStatus) {
        aiStatus.textContent = 'Listening';
        aiStatus.className = 'status-indicator listening';
    }
    
    showNotification('🎤 AI Assistant activated! Speak your command.', 'success');
    addToActivity('Started AI voice assistant');
}

function stopAIAssistant() {
    if (!aiListening) return;

    if (recognition) {
        recognition.stop();
    }
    aiListening = false;
    
    const startBtn = document.getElementById('startAI');
    const stopBtn = document.getElementById('stopAI');
    const voiceIndicator = document.getElementById('voiceIndicator');
    const aiStatus = document.getElementById('aiStatus');
    
    if (startBtn) startBtn.disabled = false;
    if (stopBtn) stopBtn.disabled = true;
    if (voiceIndicator) voiceIndicator.classList.remove('active');
    if (aiStatus) {
        aiStatus.textContent = 'Ready';
        aiStatus.className = 'status-indicator';
    }
    
    showNotification('AI Assistant deactivated.', 'info');
    addToActivity('Stopped AI voice assistant');
}

async function sendAIMessage() {
    const input = document.getElementById('aiTextInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message to chat
    addAIMessage(message, 'user');
    input.value = '';
    
    // Show typing indicator
    addAIMessage('Thinking...', 'assistant', true);
    
    // Send to server for processing
    try {
        const response = await fetch('/api/ai-assistant', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ command: message })
        });
        
        const result = await response.json();
        
        // Remove typing indicator and add response
        setTimeout(() => {
            removeTypingIndicator();
            addAIMessage(result.response, 'assistant');
            
            // Execute action based on response type
            if (result.action) {
                executeAIAction(result.action);
            }
        }, 800);
        
    } catch (error) {
        setTimeout(() => {
            removeTypingIndicator();
            addAIMessage('Sorry, I encountered an error. Please try again.', 'assistant');
        }, 800);
    }
}

function executeAIAction(action) {
    // Execute the action returned by the AI assistant
    try {
        // Parse action and execute
        if (action.includes('(') && action.includes(')')) {
            const funcName = action.substring(0, action.indexOf('('));
            const args = action.substring(action.indexOf('(') + 1, action.indexOf(')'));
            
            // Map function names to actual functions
            const actionMap = {
                'emergencyAlert': emergencyAlert,
                'activateSiren': activateSiren,
                'initiateFakeCall': initiateFakeCall,
                'startLocationTracking': startLocationTracking,
                'showSection': (section) => showSection(section.replace(/"/g, ''))
            };
            
            if (actionMap[funcName]) {
                if (args) {
                    actionMap[funcName](args);
                } else {
                    actionMap[funcName]();
                }
            }
        }
    } catch (error) {
        console.error('Error executing AI action:', error);
    }
}

function executeAIResponse(response) {
    if (response.includes('Emergency')) {
        emergencyAlert();
    } else if (response.includes('location')) {
        startLocationTracking();
    } else if (response.includes('fake call')) {
        initiateFakeCall();
    } else if (response.includes('siren')) {
        activateSiren();
    } else if (response.includes('safe') || response.includes('shelter')) {
        showSection('shelters');
    }
}

function sendQuickCommand(command) {
    const input = document.getElementById('aiTextInput');
    input.value = command;
    sendAIMessage();
}

function addAIMessage(message, sender, isTyping = false) {
    const messagesContainer = document.getElementById('aiMessages');
    if (!messagesContainer) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    if (isTyping) {
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <p><i class="fas fa-ellipsis-h"></i> ${message}</p>
            </div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-${sender === 'assistant' ? 'robot' : 'user'}"></i>
            </div>
            <div class="message-content">
                <p>${message}</p>
                <span class="message-time">${new Date().toLocaleTimeString()}</span>
            </div>
        `;
    }
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function removeTypingIndicator() {
    const typingMessages = document.querySelectorAll('.assistant-message p:has(.fa-ellipsis-h)');
    typingMessages.forEach(msg => {
        msg.closest('.assistant-message').remove();
    });
}

function handleAIEnter(event) {
    if (event.key === 'Enter') {
        sendAIMessage();
    }
}

// Enhanced Complaints Functions
async function submitComplaint(event) {
    event.preventDefault();
    
    const data = {
        title: document.getElementById('complaintTitle').value,
        description: document.getElementById('complaintDescription').value,
        category: document.getElementById('complaintCategory').value,
        location: document.getElementById('complaintLocation').value,
        time: document.getElementById('complaintTime').value
    };
    
    try {
        const response = await fetch('/api/complaints', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('✅ Complaint submitted successfully!', 'success');
            document.getElementById('complaintForm').reset();
            addToActivity('Submitted new complaint');
            loadNotifications();
            loadRecommendations();
        } else {
            showNotification('❌ Failed to submit complaint. Please try again.', 'error');
        }
    } catch (error) {
        showNotification('❌ Network error. Please try again.', 'error');
    }
}

function showComplaintHistory() {
    const modal = document.getElementById('complaintHistoryModal');
    if (modal) {
        modal.classList.add('active');
        loadComplaintHistory();
    }
}

function closeComplaintHistory() {
    const modal = document.getElementById('complaintHistoryModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function loadComplaintHistory() {
    const historyList = document.getElementById('complaintHistoryList');
    if (!historyList) return;
    
    // First try to load from server
    fetch('/api/complaints/history')
        .then(response => response.json())
        .then(serverComplaints => {
            if (serverComplaints.length > 0) {
                displayComplaints(serverComplaints);
            } else {
                // Fall back to local storage
                const localComplaints = getComplaintHistory();
                displayComplaints(localComplaints);
            }
        })
        .catch(error => {
            console.error('Error loading complaints:', error);
            // Fall back to local storage
            const localComplaints = getComplaintHistory();
            displayComplaints(localComplaints);
        });
}

function displayComplaints(complaints) {
    const historyList = document.getElementById('complaintHistoryList');
    if (!historyList) return;
    
    if (complaints.length === 0) {
        historyList.innerHTML = `
            <div class="empty-history">
                <i class="fas fa-clipboard-list"></i>
                <h4>No Complaints Yet</h4>
                <p>You haven't submitted any complaints. Submit your first complaint using the form above.</p>
            </div>
        `;
        return;
    }
    
    // Sort by date (newest first)
    complaints.sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt));
    
    historyList.innerHTML = complaints.map(complaint => {
        const createdAt = complaint.created_at || complaint.createdAt;
        const location = complaint.location || '';
        
        return `
        <div class="history-item" data-status="${complaint.status}" data-date="${createdAt.split('T')[0]}">
            <div class="history-item-header">
                <span class="history-item-title">${escapeHtml(complaint.title)}</span>
                <span class="history-item-date">${formatDate(createdAt)}</span>
            </div>
            <div class="history-item-details">
                <div class="history-detail">
                    <i class="fas fa-tag"></i>
                    <span>${capitalizeFirst(complaint.category)}</span>
                </div>
                ${location ? `
                    <div class="history-detail">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${escapeHtml(location)}</span>
                    </div>
                ` : ''}
                <div class="history-detail">
                    <i class="fas fa-clock"></i>
                    <span>${formatTime(createdAt)}</span>
                </div>
            </div>
            <p class="history-item-description">${escapeHtml(complaint.description)}</p>
            <span class="history-status ${complaint.status}">
                ${getStatusIcon(complaint.status)} ${capitalizeFirst(complaint.status)}
            </span>
        </div>
    `}).join('');
}

function filterHistory() {
    const statusFilter = document.getElementById('historyFilter')?.value || 'all';
    const dateFilter = document.getElementById('historyDateFilter')?.value || '';
    const historyItems = document.querySelectorAll('.history-item');
    
    historyItems.forEach(item => {
        const itemStatus = item.dataset.status;
        const itemDate = item.dataset.date;
        
        let show = true;
        
        if (statusFilter !== 'all' && itemStatus !== statusFilter) {
            show = false;
        }
        
        if (dateFilter && itemDate !== dateFilter) {
            show = false;
        }
        
        item.style.display = show ? 'block' : 'none';
    });
}

function viewComplaintHistory() {
    showComplaintHistory();
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function getStatusIcon(status) {
    switch (status) {
        case 'pending':
            return '<i class="fas fa-hourglass-half"></i>';
        case 'in-progress':
            return '<i class="fas fa-spinner"></i>';
        case 'resolved':
            return '<i class="fas fa-check-circle"></i>';
        default:
            return '<i class="fas fa-circle"></i>';
    }
}

// Enhanced Tips Functions
async function loadTips() {
    try {
        const response = await fetch('/api/tips');
        const tips = await response.json();
        displayTips(tips);
    } catch (error) {
        console.error('Error loading tips:', error);
        showNotification('Failed to load safety tips.', 'error');
    }
}

function displayTips(tips) {
    const tipsList = document.getElementById('tipsList');
    
    if (!tipsList) return;
    
    if (tips.length === 0) {
        tipsList.innerHTML = '<p>No safety tips available.</p>';
        return;
    }
    
    tipsList.innerHTML = tips.map(tip => `
        <div class="tip-card" data-category="${tip.category}">
            <h4>${tip.title}</h4>
            <p>${tip.content}</p>
            <span class="tip-category">${tip.category}</span>
        </div>
    `).join('');
}

function filterTips(category) {
    const tipCards = document.querySelectorAll('.tip-card');
    const categoryBtns = document.querySelectorAll('.category-btn');
    
    // Update active button
    categoryBtns.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Filter tips
    tipCards.forEach(card => {
        if (category === 'all' || card.dataset.category === category) {
            card.style.display = 'block';
            card.style.animation = 'fadeIn 0.5s ease';
        } else {
            card.style.display = 'none';
        }
    });
    
    addToActivity(`Filtered tips by ${category}`);
}

function refreshTips() {
    loadTips();
    showNotification('Safety tips refreshed', 'success');
    addToActivity('Refreshed safety tips');
}

// Notifications Functions - Enhanced
function toggleNotifications() {
    const notificationsPanel = document.getElementById('notificationsPanel');
    if (notificationsPanel) {
        notificationsPanel.classList.toggle('active');
        
        // Add animation class
        if (notificationsPanel.classList.contains('active')) {
            notificationsPanel.style.animation = 'slideInRight 0.3s ease forwards';
        }
    }
}

function openNotification(element) {
    // Mark as read if unread
    if (element.classList.contains('unread')) {
        element.classList.remove('unread');
        const indicator = element.querySelector('.unread-indicator');
        if (indicator) {
            indicator.remove();
        }
        
        // Update count
        const countElement = document.querySelector('.notification-count');
        if (countElement) {
            const currentCount = parseInt(countElement.textContent) || 0;
            if (currentCount > 0) {
                countElement.textContent = currentCount - 1;
            }
        }
    }
    
    // Add click animation
    element.style.transform = 'scale(0.98)';
    setTimeout(() => {
        element.style.transform = '';
    }, 150);
}

function dismissNotification(button) {
    const notificationItem = button.closest('.notification-item');
    if (notificationItem) {
        notificationItem.style.transform = 'translateX(100%)';
        notificationItem.style.opacity = '0';
        
        setTimeout(() => {
            notificationItem.remove();
            updateNotificationCount();
        }, 300);
    }
}

function markNotificationAsRead(button) {
    const notificationItem = button.closest('.notification-item');
    if (notificationItem && notificationItem.classList.contains('unread')) {
        notificationItem.classList.remove('unread');
        const indicator = notificationItem.querySelector('.unread-indicator');
        if (indicator) {
            indicator.remove();
        }
        updateNotificationCount();
    }
}

function performNotificationAction(notificationId, actionType) {
    // Perform action based on notification type
    switch(actionType) {
        case 'location':
            showSection('location');
            break;
        case 'complaint':
            showSection('complaints');
            break;
        case 'shelter':
            showSection('shelters');
            break;
        case 'ai':
            showSection('ai-assistant');
            break;
    }
    
    // Close notifications panel
    const notificationsPanel = document.getElementById('notificationsPanel');
    if (notificationsPanel) {
        notificationsPanel.classList.remove('active');
    }
}

function markAllAsRead() {
    const unreadItems = document.querySelectorAll('.notification-item.unread');
    unreadItems.forEach(item => {
        item.classList.remove('unread');
        const indicator = item.querySelector('.unread-indicator');
        if (indicator) {
            indicator.remove();
        }
    });
    
    // Update notification count
    const countElement = document.querySelector('.notification-count');
    const headerBadge = document.getElementById('headerNotificationBadge');
    if (countElement) {
        countElement.textContent = '0';
    }
    if (headerBadge) {
        headerBadge.textContent = '0';
        headerBadge.style.display = 'none';
    }
    
    showNotification('All notifications marked as read', 'success');
    addToActivity('Marked all notifications as read');
}

function filterNotifications(filter, element) {
    const notificationItems = document.querySelectorAll('.notification-item');
    const tabButtons = document.querySelectorAll('.tab-notification');
    
    // Update active tab button
    tabButtons.forEach(btn => btn.classList.remove('active'));
    if (element) {
        element.classList.add('active');
    } else {
        // Find the button that matches the filter
        tabButtons.forEach(btn => {
            if (btn.dataset.filter === filter) {
                btn.classList.add('active');
            }
        });
    }
    
    // Filter notifications
    notificationItems.forEach(item => {
        switch(filter) {
            case 'unread':
                item.style.display = item.classList.contains('unread') ? 'flex' : 'none';
                break;
            case 'important':
                item.style.display = item.classList.contains('important') || item.classList.contains('priority-high') ? 'flex' : 'none';
                break;
            case 'emergency':
                item.style.display = item.classList.contains('emergency') || item.classList.contains('priority-critical') ? 'flex' : 'none';
                break;
            default:
                item.style.display = 'flex';
        }
    });
    
    addToActivity(`Filtered notifications by ${filter}`);
}

function clearAllNotifications() {
    if (confirm('Are you sure you want to clear all notifications?')) {
        const notificationsList = document.querySelector('.notifications-list');
        if (notificationsList) {
            notificationsList.innerHTML = `
                <div class="empty-notifications">
                    <i class="fas fa-bell-slash"></i>
                    <h4>No Notifications</h4>
                    <p>You're all caught up!</p>
                </div>
            `;
        }
        
        const countElement = document.querySelector('.notification-count');
        const headerBadge = document.getElementById('headerNotificationBadge');
        if (countElement) {
            countElement.textContent = '0';
        }
        if (headerBadge) {
            headerBadge.textContent = '0';
            headerBadge.style.display = 'none';
        }
        
        // Update tab counts and stats
        updateTabCounts();
        
        showNotification('All notifications cleared', 'info');
        addToActivity('Cleared all notifications');
    }
}

function openNotificationSettings() {
    const modal = document.getElementById('notificationSettingsModal');
    if (modal) {
        modal.classList.add('active');
    }
}

function closeNotificationSettings() {
    const modal = document.getElementById('notificationSettingsModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function saveNotificationSettings() {
    const settings = {
        emergency: document.getElementById('settingEmergency')?.checked,
        location: document.getElementById('settingLocation')?.checked,
        tips: document.getElementById('settingTips')?.checked,
        sound: document.getElementById('settingSound')?.checked,
        vibration: document.getElementById('settingVibration')?.checked,
        quietHours: document.getElementById('settingQuietHours')?.checked,
        quietStart: document.getElementById('quietStart')?.value,
        quietEnd: document.getElementById('quietEnd')?.value,
        retention: document.getElementById('retentionPeriod')?.value
    };
    
    // Save to localStorage
    localStorage.setItem('notificationSettings', JSON.stringify(settings));
    
    showNotification('Notification settings saved successfully!', 'success');
    closeNotificationSettings();
    addToActivity('Saved notification settings');
}

function resetNotificationSettings() {
    // Reset all settings to default
    document.getElementById('settingEmergency').checked = true;
    document.getElementById('settingLocation').checked = true;
    document.getElementById('settingTips').checked = true;
    document.getElementById('settingSound').checked = true;
    document.getElementById('settingVibration').checked = true;
    document.getElementById('settingQuietHours').checked = false;
    document.getElementById('quietStart').value = '22:00';
    document.getElementById('quietEnd').value = '07:00';
    document.getElementById('retentionPeriod').value = '30';
    
    document.getElementById('quietHoursTime').style.display = 'none';
    
    showNotification('Settings reset to defaults', 'info');
}

// Toggle quiet hours time display
document.getElementById('settingQuietHours')?.addEventListener('change', function() {
    const timeSection = document.getElementById('quietHoursTime');
    if (timeSection) {
        timeSection.style.display = this.checked ? 'flex' : 'none';
    }
});

// Notification History Functions
function showNotificationHistory() {
    const modal = document.getElementById('notificationHistoryModal');
    if (modal) {
        modal.classList.add('active');
        loadNotificationHistory();
    }
}

function closeNotificationHistory() {
    const modal = document.getElementById('notificationHistoryModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function loadNotificationHistory() {
    const historyList = document.getElementById('historyNotificationsList');
    if (!historyList) return;
    
    // Load archived notifications from localStorage
    const archived = JSON.parse(localStorage.getItem('archivedNotifications') || '[]');
    
    if (archived.length === 0) {
        historyList.innerHTML = `
            <div class="empty-history">
                <i class="fas fa-inbox"></i>
                <h4>No Notification History</h4>
                <p>Archived notifications will appear here</p>
            </div>
        `;
        return;
    }
    
    historyList.innerHTML = archived.map(notif => `
        <div class="notification-item archived" data-id="${notif.id}">
            <div class="notification-icon-wrapper ${notif.type}">
                <div class="notification-icon">
                    <i class="fas fa-${notif.icon}"></i>
                </div>
            </div>
            <div class="notification-content">
                <div class="notification-header">
                    <div class="notification-type">
                        <span>${notif.title}</span>
                    </div>
                    <span class="notification-time">${notif.time}</span>
                </div>
                <p class="notification-message">${notif.message}</p>
            </div>
        </div>
    `).join('');
}

function searchHistory(query) {
    const items = document.querySelectorAll('#historyNotificationsList .notification-item');
    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(query.toLowerCase()) ? 'flex' : 'none';
    });
}

function filterHistoryType(type) {
    const items = document.querySelectorAll('#historyNotificationsList .notification-item');
    items.forEach(item => {
        if (type === 'all') {
            item.style.display = 'flex';
        } else {
            item.style.display = 'flex';
        }
    });
}

function filterHistoryDate(date) {
    showNotification(`Filtering by ${date}`, 'info');
}

function clearHistory() {
    if (confirm('Are you sure you want to clear all notification history?')) {
        localStorage.removeItem('archivedNotifications');
        loadNotificationHistory();
        showNotification('History cleared', 'success');
    }
}

function exportHistory() {
    const archived = JSON.parse(localStorage.getItem('archivedNotifications') || '[]');
    const dataStr = JSON.stringify(archived, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'notification_history.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showNotification('History exported successfully!', 'success');
}

// Archive notification
function archiveNotification() {
    const id = window.currentNotificationId;
    if (!id) return;
    
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const notif = notifications.find(n => n.id === id);
    
    if (notif) {
        const archived = JSON.parse(localStorage.getItem('archivedNotifications') || '[]');
        archived.push(notif);
        localStorage.setItem('archivedNotifications', JSON.stringify(archived));
        
        // Remove from current notifications
        const newNotifications = notifications.filter(n => n.id !== id);
        localStorage.setItem('notifications', JSON.stringify(newNotifications));
        
        showNotification('Notification archived', 'success');
    }
    
    closeNotificationDetail();
    loadNotifications();
}

// Snooze notification
function snoozeNotification() {
    showNotification('Notification snoozed for 1 hour', 'info');
    closeNotificationDetail();
}

// Delete notification
function deleteNotification() {
    const id = window.currentNotificationId;
    if (!id) return;
    
    if (confirm('Are you sure you want to delete this notification?')) {
        const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
        const newNotifications = notifications.filter(n => n.id !== id);
        localStorage.setItem('notifications', JSON.stringify(newNotifications));
        
        showNotification('Notification deleted', 'success');
    }
    
    closeNotificationDetail();
    loadNotifications();
}

function closeNotificationDetail() {
    const modal = document.getElementById('notificationDetailModal');
    if (modal) {
        modal.classList.remove('active');
        window.currentNotificationId = null;
    }
}

// Search notifications
function searchNotifications(query) {
    const items = document.querySelectorAll('.notifications-list .notification-item');
    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(query.toLowerCase()) ? 'flex' : 'none';
    });
}

// Time filter
function applyTimeFilter(filter) {
    showNotification(`Filtering notifications: ${filter}`, 'info');
}

// Sort notifications
function sortNotifications(order) {
    const list = document.getElementById('notificationsList');
    const items = Array.from(list.querySelectorAll('.notification-item'));
    
    items.sort((a, b) => {
        const timeA = a.dataset.time || '';
        const timeB = b.dataset.time || '';
        
        if (order === 'newest') {
            return new Date(timeB) - new Date(timeA);
        } else if (order === 'oldest') {
            return new Date(timeA) - new Date(timeB);
        } else if (order === 'priority') {
            const priorityA = a.classList.contains('priority-critical') ? 3 : a.classList.contains('priority-high') ? 2 : 1;
            const priorityB = b.classList.contains('priority-critical') ? 3 : b.classList.contains('priority-high') ? 2 : 1;
            return priorityB - priorityA;
        }
    });
    
    items.forEach(item => list.appendChild(item));
}

// Archive all notifications
function archiveAllNotifications() {
    if (confirm('Are you sure you want to archive all notifications?')) {
        const items = document.querySelectorAll('.notification-item');
        const archived = JSON.parse(localStorage.getItem('archivedNotifications') || '[]');
        
        items.forEach(item => {
            const title = item.querySelector('.notification-type span')?.textContent || '';
            const message = item.querySelector('.notification-message')?.textContent || '';
            
            archived.push({
                id: Date.now() + Math.random(),
                title: title,
                message: message,
                time: new Date().toLocaleString(),
                type: 'system',
                icon: 'bell'
            });
        });
        
        localStorage.setItem('archivedNotifications', JSON.stringify(archived));
        clearAllNotifications();
        showNotification('All notifications archived', 'success');
    }
}

// Update notification stats
function updateNotificationStats() {
    const total = document.querySelectorAll('.notification-item').length;
    const unread = document.querySelectorAll('.notification-item.unread').length;
    const read = total - unread;
    
    const totalEl = document.getElementById('totalNotifications');
    const unreadEl = document.getElementById('unreadNotifications');
    const readEl = document.getElementById('readNotifications');
    
    if (totalEl) totalEl.textContent = total;
    if (unreadEl) unreadEl.textContent = unread;
    if (readEl) readEl.textContent = read;
}

// Close modals when clicking outside
document.addEventListener('click', function(event) {
    // Notification Settings Modal
    const settingsModal = document.getElementById('notificationSettingsModal');
    if (settingsModal && settingsModal.classList.contains('active')) {
        const modalContent = settingsModal.querySelector('.notification-modal-content');
        if (modalContent && !modalContent.contains(event.target)) {
            closeNotificationSettings();
        }
    }
    
    // Notification History Modal
    const historyModal = document.getElementById('notificationHistoryModal');
    if (historyModal && historyModal.classList.contains('active')) {
        const modalContent = historyModal.querySelector('.notification-modal-content');
        if (modalContent && !modalContent.contains(event.target)) {
            closeNotificationHistory();
        }
    }
    
    // Notification Detail Modal
    const detailModal = document.getElementById('notificationDetailModal');
    if (detailModal && detailModal.classList.contains('active')) {
        const modalContent = detailModal.querySelector('.notification-modal-content');
        if (modalContent && !modalContent.contains(event.target)) {
            closeNotificationDetail();
        }
    }
});

// Close modals on Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeNotificationSettings();
        closeNotificationHistory();
        closeNotificationDetail();
    }
});

function addNotificationToPanel(title, message, type, priority = 'medium', createdAt) {
    const notificationsList = document.querySelector('.notifications-list');
    if (!notificationsList) return;
    
    // Remove empty state if exists
    const emptyState = notificationsList.querySelector('.empty-notifications');
    if (emptyState) {
        emptyState.remove();
    }
    
    const notificationItem = document.createElement('div');
    
    // Build class list based on priority
    let classList = ['notification-item', 'unread'];
    if (priority === 'high') {
        classList.push('priority-high', 'important');
    } else if (priority === 'critical') {
        classList.push('priority-critical', 'emergency', 'important');
    }
    notificationItem.className = classList.join(' ');
    
    // Get icon based on type
    const icons = {
        location: 'map-marker-alt',
        complaint_status: 'exclamation-circle',
        shelter: 'home',
        emergency: 'exclamation-triangle',
        safety_tip: 'lightbulb',
        ai: 'robot',
        system: 'cog'
    };
    
    const icon = icons[type] || 'bell';
    const timeAgo = getTimeAgo(new Date(createdAt));
    
    // Build icon wrapper class based on type
    let iconWrapperClass = type;
    if (priority === 'critical') {
        iconWrapperClass = 'emergency';
    } else if (priority === 'high') {
        iconWrapperClass = 'warning';
    }
    
    notificationItem.innerHTML = `
        <div class="unread-indicator"></div>
        <div class="notification-icon-wrapper ${iconWrapperClass}">
            <div class="notification-icon">
                <i class="fas fa-${icon}"></i>
            </div>
        </div>
        <div class="notification-content">
            <div class="notification-header">
                <div class="notification-type">
                    <i class="fas fa-${icon}"></i>
                    <span>${type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                </div>
                <div class="notification-meta-row">
                    <span class="notification-time">
                        <i class="fas fa-clock"></i>
                        ${timeAgo}
                    </span>
                </div>
            </div>
            <p class="notification-message">${message}</p>
            <div class="notification-footer-row">
                <span class="notification-category">
                    <i class="fas fa-tag"></i>
                    ${type.replace('_', ' ')}
                </span>
                <div class="notification-actions-inline">
                    <button class="action-inline-btn" onclick="markNotificationAsRead(this)" title="Mark as read">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="action-inline-btn" onclick="performNotificationAction(this, '${type}')" title="View">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-inline-btn" onclick="dismissNotification(this)" title="Dismiss">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        </div>
        ${priority === 'high' || priority === 'critical' ? '<div class="notification-priority-badge"><i class="fas fa-star"></i></div>' : ''}
    `;
    
    // Add click handler
    notificationItem.onclick = function(e) {
        if (!e.target.closest('.notification-actions-inline') && !e.target.closest('.action-inline-btn')) {
            openNotification(this);
        }
    };
    
    // Insert at the top
    notificationsList.insertBefore(notificationItem, notificationsList.firstChild);
    
    // Update count
    updateNotificationCount();
    updateTabCounts();
}

function getTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
        return 'Just now';
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours}h ago`;
    } else {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days}d ago`;
    }
}

function updateNotificationCount() {
    const unreadCount = document.querySelectorAll('.notification-item.unread').length;
    const countElement = document.querySelector('.notification-count');
    const headerBadge = document.getElementById('headerNotificationBadge');
    
    if (countElement) {
        countElement.textContent = unreadCount;
        countElement.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
    
    if (headerBadge) {
        headerBadge.textContent = unreadCount;
        headerBadge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
    
    // Update stats bar
    updateNotificationStats();
}

function enableLocation() {
    showSection('location');
    showNotification('Enable location services in the tracking section', 'info');
}

// Utility Functions
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Add icon based on type
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    else if (type === 'error') icon = 'exclamation-circle';
    else if (type === 'warning') icon = 'exclamation-triangle';
    
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Style the notification
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '15px 20px',
        borderRadius: '10px',
        color: 'white',
        fontWeight: '500',
        zIndex: '10000',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease',
        maxWidth: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '15px',
        boxShadow: '0 5px 15px rgba(0, 0, 0, 0.2)',
        cursor: 'pointer'
    });
    
    // Set background color based on type
    switch (type) {
        case 'success':
            notification.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
            break;
        case 'error':
            notification.style.background = 'linear-gradient(135deg, #dc3545, #fd7e14)';
            break;
        case 'warning':
            notification.style.background = 'linear-gradient(135deg, #ffc107, #fd7e14)';
            notification.style.color = '#212529';
            break;
        default:
            notification.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
    }
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (document.body.contains(notification)) {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }
    }, 5000);
    
    // Play notification sound
    const notificationSound = document.getElementById('notificationSound');
    if (notificationSound) {
        notificationSound.play().catch(e => console.log('Notification audio not available:', e.message));
    }
}

// Emergency alert function (global scope)
window.emergencyAlert = emergencyAlert;

// Notification functions (global scope)
window.openNotificationSettings = openNotificationSettings;
window.closeNotificationSettings = closeNotificationSettings;
window.saveNotificationSettings = saveNotificationSettings;
window.resetNotificationSettings = resetNotificationSettings;
window.showNotificationHistory = showNotificationHistory;
window.closeNotificationHistory = closeNotificationHistory;
window.searchHistory = searchHistory;
window.filterHistoryType = filterHistoryType;
window.filterHistoryDate = filterHistoryDate;
window.clearHistory = clearHistory;
window.exportHistory = exportHistory;
window.archiveNotification = archiveNotification;
window.snoozeNotification = snoozeNotification;
window.deleteNotification = deleteNotification;
window.closeNotificationDetail = closeNotificationDetail;
window.searchNotifications = searchNotifications;
window.applyTimeFilter = applyTimeFilter;
window.sortNotifications = sortNotifications;
window.archiveAllNotifications = archiveAllNotifications;
window.updateNotificationStats = updateNotificationStats;

// Mobile Navigation Functions
function toggleMobileNav(forceClose = false) {
    const mobileNav = document.getElementById('mobileNav');
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    
    if (forceClose || (mobileNav && mobileNav.classList.contains('active'))) {
        mobileNav.classList.remove('active');
        hamburgerBtn.classList.remove('active');
        document.body.classList.remove('nav-open');
    } else if (mobileNav && hamburgerBtn) {
        mobileNav.classList.add('active');
        hamburgerBtn.classList.add('active');
        document.body.classList.add('nav-open');
    }
}

function initMobileNav() {
    // Setup hamburger menu toggle
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMobileNav();
        });
    }
    
    // Close nav on overlay click
    const mobileNavOverlay = document.getElementById('mobileNavOverlay');
    if (mobileNavOverlay) {
        mobileNavOverlay.addEventListener('click', toggleMobileNav);
    }
    
    // Close nav on window resize (desktop)
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && document.body.classList.contains('nav-open')) {
            toggleMobileNav(true);
        }
    });
    
    // Setup mobile resize observer for maps
    const resizeObserver = new ResizeObserver(() => {
        if (currentMap) currentMap.invalidateSize();
        if (sheltersMap) sheltersMap.invalidateSize();
    });
    
    // Observe map containers
    ['map', 'shelterMap'].forEach(id => {
        const element = document.getElementById(id);
        if (element) resizeObserver.observe(element);
    });
}

// Initialize mobile nav on DOM load
document.addEventListener('DOMContentLoaded', initMobileNav);

// Make toggleMobileNav globally available
window.toggleMobileNav = toggleMobileNav;

// Mobile-optimized notification function
overrideNotificationPosition();

function overrideNotificationPosition() {
    const originalShowNotification = showNotification;
    
    window.showNotification = function(message, type = 'info') {
        // Call original function
        originalShowNotification(message, type);
        
        // Additional mobile optimizations
        if (isMobile()) {
            setTimeout(() => {
                const notification = document.querySelector('.notification:last-child');
                if (notification) {
                    notification.style.top = '10px';
                    notification.style.left = '10px';
                    notification.style.right = '10px';
                    notification.style.maxWidth = 'none';
                    notification.style.width = 'auto';
                    notification.style.transform = 'translateX(0)';
                }
            }, 50);
        }
    };
}

// Prevent zoom on input focus (iOS)
if (isMobile()) {
    document.addEventListener('focusin', function(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
            // Use meta viewport to prevent zoom
            const viewportMeta = document.querySelector('meta[name=viewport]');
            if (viewportMeta) {
                const content = viewportMeta.getAttribute('content');
                viewportMeta.setAttribute('content', content.replace(/maximum-scale=[\d.]+/, 'maximum-scale=1'));
            }
        }
    });
    
    document.addEventListener('focusout', function(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
            // Restore zoom
            const viewportMeta = document.querySelector('meta[name=viewport]');
            if (viewportMeta) {
                const content = viewportMeta.getAttribute('content');
                viewportMeta.setAttribute('content', content.replace(/maximum-scale=[\d.]+/, 'maximum-scale=5'));
            }
            // Scroll to position
            window.scrollTo(0, 0);
        }
    });
}

// Swipe gestures for notifications panel
if (isMobile()) {
    const notificationsPanel = document.getElementById('notificationsPanel');
    if (notificationsPanel) {
        let touchStartX = 0;
        let touchEndX = 0;
        
        notificationsPanel.addEventListener('touchstart', function(e) {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        notificationsPanel.addEventListener('touchend', function(e) {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });
        
        function handleSwipe() {
            const swipeThreshold = 50;
            const diff = touchStartX - touchEndX;
            
            if (diff > swipeThreshold) {
                // Swipe left - close panel
                notificationsPanel.classList.remove('active');
            } else if (diff < -swipeThreshold) {
                // Swipe right - already open
            }
        }
    }
    
    // Swipe to close history modal
    const historyModal = document.getElementById('complaintHistoryModal');
    if (historyModal) {
        let modalTouchStartY = 0;
        
        historyModal.addEventListener('touchstart', function(e) {
            modalTouchStartY = e.changedTouches[0].screenY;
        }, { passive: true });
        
        historyModal.addEventListener('touchend', function(e) {
            const touchEndY = e.changedTouches[0].screenY;
            if (modalTouchStartY - touchEndY < -100) {
                // Swipe down - close modal
                historyModal.classList.remove('active');
            }
        }, { passive: true });
    }
}

// Optimize map popups for mobile
if (typeof L !== 'undefined') {
    L.Popup.prototype.options.closeButton = isMobile();
    L.Popup.prototype.options.maxWidth = isMobile() ? '280px' : '300px';
    L.Popup.prototype.options.autoPanPadding = isMobile() ? [10, 10] : [50, 50];
}

// Emergency Contacts and SMS Functions
function loadEmergencyContacts() {
    // Load emergency contacts from the server
    fetch('/api/emergency-contacts')
        .then(response => response.json())
        .then(data => {
            console.log('Emergency contacts data:', data);
            if (data.success) {
                displayEmergencyContacts(data.contacts);
            }
        })
        .catch(error => {
            console.error('Error loading emergency contacts:', error);
        });
}

function displayEmergencyContacts(contacts) {
    console.log('Displaying emergency contacts:', contacts);
    
    // Try multiple possible container IDs
    let container = document.getElementById('currentContacts');
    console.log('Container currentContacts found:', !!container);
    
    if (!container) {
        container = document.getElementById('emergencyCurrentContacts');
        console.log('Container emergencyCurrentContacts found:', !!container);
    }
    if (!container) return;
    
    if (contacts.length === 0) {
        container.innerHTML = '<p class="no-contacts">No emergency contacts set up</p>';
        return;
    }
    
    const contactsHTML = contacts.map(contact => `
        <div class="user-contact-card">
            <div class="contact-info">
                <h5>${contact.name}</h5>
                <span class="contact-number">${contact.phone}</span>
            </div>
            <button class="contact-call-btn" onclick="callEmergency('${contact.phone}')">
                <i class="fas fa-phone"></i>
            </button>
        </div>
    `).join('');
    
    container.innerHTML = contactsHTML;
    console.log('Emergency contacts displayed successfully');
}

function setupSMSCharCounter() {
    const textarea = document.getElementById('customSMSMessage');
    const counter = document.getElementById('charCount');
    
    if (textarea && counter) {
        textarea.addEventListener('input', updateCharCounter);
        updateCharCounter();
    } else {
        // Retry after a short delay in case elements aren't loaded yet
        setTimeout(() => {
            const textareaRetry = document.getElementById('customSMSMessage');
            const counterRetry = document.getElementById('charCount');
            if (textareaRetry && counterRetry) {
                textareaRetry.addEventListener('input', updateCharCounter);
                updateCharCounter();
            }
        }, 500);
    }
}

function updateCharCounter() {
    const textarea = document.getElementById('customSMSMessage');
    const counter = document.getElementById('charCount');
    
    if (textarea && counter) {
        const length = textarea.value.length;
        counter.textContent = length;
        
        if (length > 160) {
            counter.style.color = '#e74c3c';
        } else if (length > 140) {
            counter.style.color = '#f39c12';
        } else {
            counter.style.color = '#27ae60';
        }
    }
}

// SMS Gateway Functions
function updateEmergencyContacts() {
    const name = document.getElementById('emergencyContactName').value.trim();
    const phone = document.getElementById('emergencyContactPhone').value.trim();
    
    if (!phone) {
        showNotification('Phone number is required', 'error');
        return;
    }
    
    fetch('/api/sms/update-contacts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            phone_number: phone,
            emergency_contact_name: name
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Emergency contact updated successfully', 'success');
            document.getElementById('emergencyContactName').value = '';
            document.getElementById('emergencyContactPhone').value = '';
            loadEmergencyContacts();
        } else {
            showNotification(data.error || 'Failed to update contact', 'error');
        }
    })
    .catch(error => {
        console.error('Error updating emergency contacts:', error);
        showNotification('Failed to update contact', 'error');
    });
}

function sendHelpEmergencySMS() {
    if (!confirm('Send emergency help request to all contacts?')) {
        return;
    }
    
    fetch('/api/sms/emergency-help', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Emergency help request sent!', 'success');
        } else {
            showNotification(data.error || 'Failed to send help request', 'error');
        }
    })
    .catch(error => {
        console.error('Error sending help SMS:', error);
        showNotification('Failed to send help request', 'error');
    });
}

function showCustomSMSPopup() {
    // Scroll to custom SMS section
    const customSMSSection = document.querySelector('.custom-sms-section');
    if (customSMSSection) {
        customSMSSection.scrollIntoView({ behavior: 'smooth' });
        document.getElementById('customSMSMessage').focus();
    }
}

function sendCustomSMS(event) {
    event.preventDefault();
    
    const recipient = document.getElementById('customSMSRecipient').value.trim();
    const message = document.getElementById('customSMSMessage').value.trim();
    
    if (!recipient || !message) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    fetch('/api/sms/send', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            recipients: recipient.split(',').map(r => r.trim()),
            message: message
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('SMS sent successfully!', 'success');
            document.getElementById('customSMSForm').reset();
            updateCharCounter();
        } else {
            showNotification(data.error || 'Failed to send SMS', 'error');
        }
    })
    .catch(error => {
        console.error('Error sending SMS:', error);
        showNotification('Failed to send SMS', 'error');
    });
}

function clearCustomSMS() {
    document.getElementById('customSMSForm').reset();
    updateCharCounter();
}