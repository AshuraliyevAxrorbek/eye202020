// ===== STATE MANAGEMENT =====
const AppState = {
    timer: {
        isRunning: false,
        isPaused: false,
        currentMode: 'work', // 'work' or 'break'
        timeRemaining: 20 * 60, // seconds
        workDuration: 20 * 60,
        breakDuration: 20,
        totalElapsed: 0
    },
    settings: {
        workDuration: 20,
        breakDuration: 20,
        soundEnabled: true,
        notificationsEnabled: true,
        autoNight: false
    },
    stats: {
        totalSessions: 0,
        todaySessions: 0,
        streakDays: 0,
        lastSessionDate: null,
        weeklyData: [0, 0, 0, 0, 0, 0, 0],
        totalMinutes: 0
    },
    nightMode: {
        enabled: false,
        warmth: 50,
        brightness: 80
    }
};

// ===== STORAGE =====
const Storage = {
    save() {
        localStorage.setItem('eyeCareState', JSON.stringify(AppState));
    },
    
    load() {
        const saved = localStorage.getItem('eyeCareState');
        if (saved) {
            const parsed = JSON.parse(saved);
            Object.assign(AppState.settings, parsed.settings || {});
            Object.assign(AppState.stats, parsed.stats || {});
            Object.assign(AppState.nightMode, parsed.nightMode || {});
            
            AppState.timer.workDuration = AppState.settings.workDuration * 60;
            AppState.timer.breakDuration = AppState.settings.breakDuration;
            AppState.timer.timeRemaining = AppState.timer.workDuration;
        }
    }
};

// ===== DOM ELEMENTS =====
const DOM = {
    timerDisplay: document.getElementById('timerDisplay'),
    timerLabel: document.getElementById('timerLabel'),
    timerStatus: document.getElementById('timerStatus'),
    progressCircle: document.getElementById('progressCircle'),
    startPauseBtn: document.getElementById('startPauseBtn'),
    resetBtn: document.getElementById('resetBtn'),
    skipBtn: document.getElementById('skipBtn'),
    todaySessions: document.getElementById('todaySessions'),
    streakDays: document.getElementById('streakDays'),
    notification: document.getElementById('notification'),
    notificationTitle: document.getElementById('notificationTitle'),
    notificationMessage: document.getElementById('notificationMessage'),
    
    // Screens
    screens: document.querySelectorAll('.screen'),
    navItems: document.querySelectorAll('.nav-item'),
    backBtns: document.querySelectorAll('.back-btn'),
    
    // Focus Mode
    focusBtn: document.getElementById('focusBtn'),
    focusMode: document.getElementById('focusMode'),
    exitFocus: document.getElementById('exitFocus'),
    focusTimer: document.getElementById('focusTimer'),
    focusLabel: document.getElementById('focusLabel'),
    
    // Exercise Modal
    exerciseModal: document.getElementById('exerciseModal'),
    exerciseCards: document.querySelectorAll('.exercise-card'),
    closeExercise: document.getElementById('closeExercise'),
    exerciseAnimation: document.getElementById('exerciseAnimation'),
    exerciseModalTitle: document.getElementById('exerciseModalTitle'),
    exerciseInstructions: document.getElementById('exerciseInstructions'),
    exerciseTime: document.getElementById('exerciseTime'),
    exerciseProgressCircle: document.getElementById('exerciseProgressCircle'),
    startExercise: document.getElementById('startExercise'),
    
    // Night Mode
    nightModeToggle: document.getElementById('nightModeToggle'),
    warmthSlider: document.getElementById('warmthSlider'),
    brightnessSlider: document.getElementById('brightnessSlider'),
    autoNightToggle: document.getElementById('autoNightToggle'),
    warmthValue: document.getElementById('warmthValue'),
    brightnessValue: document.getElementById('brightnessValue'),
    
    // Settings
    settingsBtn: document.querySelector('.settings-btn'),
    settingsModal: document.getElementById('settingsModal'),
    closeSettings: document.getElementById('closeSettings'),
    workDurationInput: document.getElementById('workDuration'),
    breakDurationInput: document.getElementById('breakDuration'),
    soundToggle: document.getElementById('soundToggle'),
    notificationToggle: document.getElementById('notificationToggle'),
    saveSettings: document.getElementById('saveSettings'),
    
    // Stats
    totalSessions: document.getElementById('totalSessions'),
    totalMinutes: document.getElementById('totalMinutes'),
    healthScore: document.getElementById('healthScore'),
    weeklyChart: document.getElementById('weeklyChart'),
    
    // Action cards
    actionCards: document.querySelectorAll('.action-card')
};

// ===== TIMER LOGIC =====
let timerInterval = null;

const Timer = {
    start() {
        if (AppState.timer.isRunning) return;
        
        AppState.timer.isRunning = true;
        AppState.timer.isPaused = false;
        
        timerInterval = setInterval(() => {
            if (AppState.timer.timeRemaining > 0) {
                AppState.timer.timeRemaining--;
                AppState.timer.totalElapsed++;
                Timer.updateDisplay();
                Timer.updateProgress();
            } else {
                Timer.complete();
            }
        }, 1000);
        
        Timer.updateUI();
    },
    
    pause() {
        clearInterval(timerInterval);
        AppState.timer.isRunning = false;
        AppState.timer.isPaused = true;
        Timer.updateUI();
    },
    
    reset() {
        clearInterval(timerInterval);
        AppState.timer.isRunning = false;
        AppState.timer.isPaused = false;
        AppState.timer.currentMode = 'work';
        AppState.timer.timeRemaining = AppState.timer.workDuration;
        AppState.timer.totalElapsed = 0;
        Timer.updateDisplay();
        Timer.updateProgress();
        Timer.updateUI();
    },
    
    skip() {
        Timer.complete();
    },
    
    complete() {
        clearInterval(timerInterval);
        
        if (AppState.timer.currentMode === 'work') {
            // Work session completed
            AppState.timer.currentMode = 'break';
            AppState.timer.timeRemaining = AppState.timer.breakDuration;
            Stats.recordSession();
            Timer.showNotification('Dam olish vaqti!', '20 soniya 6 metr uzoqlikga qarang');
            Sound.play();
        } else {
            // Break completed
            AppState.timer.currentMode = 'work';
            AppState.timer.timeRemaining = AppState.timer.workDuration;
            Timer.showNotification('Ish vaqti!', 'Yana 20 daqiqa ishlang');
            Sound.play();
        }
        
        AppState.timer.isRunning = false;
        Timer.updateDisplay();
        Timer.updateProgress();
        Timer.updateUI();
        
        // Auto-restart if was running
        setTimeout(() => {
            Timer.start();
        }, 1000);
    },
    
    updateDisplay() {
        const minutes = Math.floor(AppState.timer.timeRemaining / 60);
        const seconds = AppState.timer.timeRemaining % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        DOM.timerDisplay.textContent = timeString;
        if (DOM.focusTimer) DOM.focusTimer.textContent = timeString;
        
        if (AppState.timer.currentMode === 'work') {
            DOM.timerLabel.textContent = 'Ish rejimi';
            DOM.timerStatus.textContent = AppState.timer.isRunning ? 'Faol' : 'Dam olish vaqti';
        } else {
            DOM.timerLabel.textContent = 'Dam olish';
            DOM.timerStatus.textContent = AppState.timer.isRunning ? 'Ko\'zlaringizni dam oldiring' : 'Tayyor';
        }
    },
    
    updateProgress() {
        const totalDuration = AppState.timer.currentMode === 'work' 
            ? AppState.timer.workDuration 
            : AppState.timer.breakDuration;
        const progress = (totalDuration - AppState.timer.timeRemaining) / totalDuration;
        const circumference = 2 * Math.PI * 120;
        const offset = circumference - (progress * circumference);
        
        DOM.progressCircle.style.strokeDashoffset = offset;
    },
    
    updateUI() {
        const playIcon = DOM.startPauseBtn.querySelector('.play-icon');
        const pauseIcon = DOM.startPauseBtn.querySelector('.pause-icon');
        const btnText = DOM.startPauseBtn.querySelector('.btn-text');
        
        if (AppState.timer.isRunning) {
            playIcon.classList.add('hidden');
            pauseIcon.classList.remove('hidden');
            btnText.textContent = 'Pauza';
        } else {
            playIcon.classList.remove('hidden');
            pauseIcon.classList.add('hidden');
            btnText.textContent = AppState.timer.isPaused ? 'Davom' : 'Boshlash';
        }
    },
    
    showNotification(title, message) {
        if (!AppState.settings.notificationsEnabled) return;
        
        DOM.notificationTitle.textContent = title;
        DOM.notificationMessage.textContent = message;
        DOM.notification.classList.add('show');
        
        // Request system notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: message,
                icon: '/icon-192.png',
                badge: '/icon-192.png'
            });
        }
        
        setTimeout(() => {
            DOM.notification.classList.remove('show');
        }, 4000);
    }
};

// ===== SOUND =====
const Sound = {
    play() {
        if (!AppState.settings.soundEnabled) return;
        
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    }
};

// ===== STATS =====
const Stats = {
    recordSession() {
        const today = new Date().toDateString();
        
        // Update total sessions
        AppState.stats.totalSessions++;
        
        // Update today's sessions
        if (AppState.stats.lastSessionDate !== today) {
            AppState.stats.todaySessions = 1;
            AppState.stats.lastSessionDate = today;
            
            // Update streak
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayString = yesterday.toDateString();
            
            if (AppState.stats.lastSessionDate === yesterdayString) {
                AppState.stats.streakDays++;
            } else {
                AppState.stats.streakDays = 1;
            }
        } else {
            AppState.stats.todaySessions++;
        }
        
        // Update weekly data
        const dayIndex = new Date().getDay();
        AppState.stats.weeklyData[dayIndex]++;
        
        // Update total minutes
        AppState.stats.totalMinutes += AppState.settings.workDuration;
        
        // Update UI
        Stats.updateDisplay();
        Stats.checkAchievements();
        
        Storage.save();
    },
    
    updateDisplay() {
        DOM.todaySessions.textContent = AppState.stats.todaySessions;
        DOM.streakDays.textContent = AppState.stats.streakDays;
        
        if (DOM.totalSessions) {
            DOM.totalSessions.textContent = AppState.stats.totalSessions;
        }
        if (DOM.totalMinutes) {
            DOM.totalMinutes.textContent = AppState.stats.totalMinutes;
        }
        if (DOM.healthScore) {
            const score = Math.min(100, (AppState.stats.totalSessions * 2));
            DOM.healthScore.textContent = `${score}%`;
        }
        
        Stats.updateChart();
    },
    
    updateChart() {
        if (!DOM.weeklyChart) return;
        
        const bars = DOM.weeklyChart.querySelectorAll('.chart-bar');
        const maxValue = Math.max(...AppState.stats.weeklyData, 1);
        
        bars.forEach((bar, index) => {
            const value = AppState.stats.weeklyData[index];
            const percentage = (value / maxValue) * 100;
            bar.style.setProperty('--height', `${percentage}%`);
        });
    },
    
    checkAchievements() {
        // Achievement 1: First session
        if (AppState.stats.totalSessions >= 1) {
            document.getElementById('achievement1')?.classList.remove('locked');
            document.getElementById('achievement1')?.classList.add('unlocked');
        }
        
        // Achievement 2: 3-day streak
        if (AppState.stats.streakDays >= 3) {
            document.getElementById('achievement2')?.classList.remove('locked');
            document.getElementById('achievement2')?.classList.add('unlocked');
        }
        
        // Achievement 3: 50 sessions
        if (AppState.stats.totalSessions >= 50) {
            document.getElementById('achievement3')?.classList.remove('locked');
            document.getElementById('achievement3')?.classList.add('unlocked');
        }
    }
};

// ===== NAVIGATION =====
const Navigation = {
    init() {
        DOM.navItems.forEach(item => {
            item.addEventListener('click', () => {
                const screenName = item.dataset.screen;
                Navigation.showScreen(screenName);
            });
        });
        
        DOM.actionCards.forEach(card => {
            const screenName = card.dataset.screen;
            if (screenName) {
                card.addEventListener('click', () => {
                    Navigation.showScreen(screenName);
                });
            }
        });
        
        DOM.backBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                Navigation.showScreen('home');
            });
        });
    },
    
    showScreen(screenName) {
        // Update screens
        DOM.screens.forEach(screen => {
            screen.classList.remove('active');
        });
        
        const targetScreen = document.getElementById(`${screenName}Screen`);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }
        
        // Update nav
        DOM.navItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.screen === screenName) {
                item.classList.add('active');
            }
        });
        
        // Update stats when showing stats screen
        if (screenName === 'stats') {
            Stats.updateDisplay();
        }
    }
};

// ===== EXERCISES =====
const exercises = {
    blink: {
        title: 'Sekin Miltillash',
        icon: '😌',
        instructions: 'Ko\'zlaringizni sekin va to\'liq yoping, keyin oching. Har 4 soniyada bir marta takrorlang. Bu ko\'z quruqligini kamaytiradi.'
    },
    rotate: {
        title: 'Ko\'z Aylantirish',
        icon: '🔄',
        instructions: 'Ko\'zlaringizni soat yo\'nalishi bo\'yicha 5 marta aylantiring, keyin teskari yo\'nalishda 5 marta. Boshingiz harakatsiz.'
    },
    focus: {
        title: 'Yaqin-Uzoq Fokuslash',
        icon: '🎯',
        instructions: 'Barmoq uchingizga 3 soniya qarang, keyin uzoq joyga 3 soniya qarang. Ko\'z muskullari uchun yaxshi.'
    },
    palming: {
        title: 'Palming',
        icon: '🙌',
        instructions: 'Kaftlaringizni bir-biriga ishqalab isiting, keyin yopiq ko\'zlaringiz ustiga qo\'ying. Chuqur nafas oling va dam oling.'
    },
    figure8: {
        title: 'Sakkiz Shakli',
        icon: '8️⃣',
        instructions: 'Ko\'zlaringiz bilan havoda katta 8 raqamini chizing. Avval bir yo\'nalishda, keyin teskari.'
    },
    diagonal: {
        title: 'Diagonal Harakat',
        icon: '↗️',
        instructions: 'Ko\'zlaringizni yuqori chap burchakdan pastki o\'ng burchakga olib boring. Keyin teskari. Sekin va silliq.'
    },
    rapid: {
        title: 'Tez Miltillash',
        icon: '⚡',
        instructions: '10 soniya davomida tez-tez miltillang, keyin ko\'zlaringizni 5 soniya yoping va dam oling.'
    }
};

let currentExercise = null;
let exerciseInterval = null;
let exerciseTimeRemaining = 30;

const Exercise = {
    open(type) {
        currentExercise = type;
        const exercise = exercises[type];
        
        DOM.exerciseAnimation.textContent = exercise.icon;
        DOM.exerciseModalTitle.textContent = exercise.title;
        DOM.exerciseInstructions.textContent = exercise.instructions;
        DOM.exerciseTime.textContent = '30';
        DOM.startExercise.textContent = 'Boshlash';
        
        DOM.exerciseModal.classList.add('active');
        
        // Reset progress
        exerciseTimeRemaining = 30;
        DOM.exerciseProgressCircle.style.strokeDashoffset = 0;
    },
    
    close() {
        DOM.exerciseModal.classList.remove('active');
        Exercise.stop();
    },
    
    start() {
        exerciseTimeRemaining = 30;
        DOM.startExercise.textContent = 'Dam oling...';
        DOM.startExercise.disabled = true;
        
        exerciseInterval = setInterval(() => {
            exerciseTimeRemaining--;
            DOM.exerciseTime.textContent = exerciseTimeRemaining;
            
            const progress = (30 - exerciseTimeRemaining) / 30;
            const circumference = 2 * Math.PI * 90;
            const offset = circumference * (1 - progress);
            DOM.exerciseProgressCircle.style.strokeDashoffset = offset;
            
            if (exerciseTimeRemaining <= 0) {
                Exercise.complete();
            }
        }, 1000);
    },
    
    stop() {
        clearInterval(exerciseInterval);
        DOM.startExercise.disabled = false;
    },
    
    complete() {
        clearInterval(exerciseInterval);
        DOM.startExercise.textContent = 'Yakunlandi! ✓';
        Sound.play();
        
        setTimeout(() => {
            Exercise.close();
        }, 1500);
    }
};

// ===== NIGHT MODE =====
const NightMode = {
    init() {
        DOM.nightModeToggle.checked = AppState.nightMode.enabled;
        DOM.warmthSlider.value = AppState.nightMode.warmth;
        DOM.brightnessSlider.value = AppState.nightMode.brightness;
        DOM.autoNightToggle.checked = AppState.settings.autoNight;
        
        NightMode.updateValues();
        NightMode.apply();
    },
    
    toggle() {
        AppState.nightMode.enabled = DOM.nightModeToggle.checked;
        NightMode.apply();
        Storage.save();
    },
    
    updateWarmth() {
        AppState.nightMode.warmth = parseInt(DOM.warmthSlider.value);
        NightMode.updateValues();
        NightMode.apply();
        Storage.save();
    },
    
    updateBrightness() {
        AppState.nightMode.brightness = parseInt(DOM.brightnessSlider.value);
        NightMode.updateValues();
        NightMode.apply();
        Storage.save();
    },
    
    updateValues() {
        DOM.warmthValue.textContent = `${AppState.nightMode.warmth}%`;
        DOM.brightnessValue.textContent = `${AppState.nightMode.brightness}%`;
    },
    
    apply() {
        if (AppState.nightMode.enabled) {
            document.body.classList.add('night-mode-active');
            
            const warmthIntensity = AppState.nightMode.warmth / 100;
            const brightnessValue = AppState.nightMode.brightness / 100;
            
            document.body.style.filter = `
                sepia(${warmthIntensity * 0.3})
                hue-rotate(${warmthIntensity * 20}deg)
                brightness(${brightnessValue})
            `;
        } else {
            document.body.classList.remove('night-mode-active');
            document.body.style.filter = '';
        }
    },
    
    checkAutoEnable() {
        if (!AppState.settings.autoNight) return;
        
        const hour = new Date().getHours();
        if (hour >= 20 || hour < 6) {
            AppState.nightMode.enabled = true;
            DOM.nightModeToggle.checked = true;
            NightMode.apply();
        }
    }
};

// ===== FOCUS MODE =====
const FocusMode = {
    open() {
        DOM.focusMode.classList.add('active');
        document.body.style.overflow = 'hidden';
    },
    
    close() {
        DOM.focusMode.classList.remove('active');
        document.body.style.overflow = '';
    }
};

// ===== SETTINGS =====
const Settings = {
    open() {
        DOM.workDurationInput.value = AppState.settings.workDuration;
        DOM.breakDurationInput.value = AppState.settings.breakDuration;
        DOM.soundToggle.checked = AppState.settings.soundEnabled;
        DOM.notificationToggle.checked = AppState.settings.notificationsEnabled;
        
        DOM.settingsModal.classList.add('active');
    },
    
    close() {
        DOM.settingsModal.classList.remove('active');
    },
    
    save() {
        AppState.settings.workDuration = parseInt(DOM.workDurationInput.value);
        AppState.settings.breakDuration = parseInt(DOM.breakDurationInput.value);
        AppState.settings.soundEnabled = DOM.soundToggle.checked;
        AppState.settings.notificationsEnabled = DOM.notificationToggle.checked;
        
        AppState.timer.workDuration = AppState.settings.workDuration * 60;
        AppState.timer.breakDuration = AppState.settings.breakDuration;
        
        if (!AppState.timer.isRunning) {
            Timer.reset();
        }
        
        Storage.save();
        Settings.close();
        
        Timer.showNotification('Saqlandi', 'Sozlamalar muvaffaqiyatli yangilandi');
    }
};

// ===== NOTIFICATIONS PERMISSION =====
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

// ===== EVENT LISTENERS =====
function initEventListeners() {
    // Timer controls
    DOM.startPauseBtn.addEventListener('click', () => {
        if (AppState.timer.isRunning) {
            Timer.pause();
        } else {
            Timer.start();
        }
    });
    
    DOM.resetBtn.addEventListener('click', () => Timer.reset());
    DOM.skipBtn.addEventListener('click', () => Timer.skip());
    
    // Focus mode
    DOM.focusBtn?.addEventListener('click', () => FocusMode.open());
    DOM.exitFocus?.addEventListener('click', () => FocusMode.close());
    
    // Exercises
    DOM.exerciseCards.forEach(card => {
        card.addEventListener('click', () => {
            const exerciseType = card.dataset.exercise;
            Exercise.open(exerciseType);
        });
    });
    
    DOM.closeExercise?.addEventListener('click', () => Exercise.close());
    DOM.startExercise?.addEventListener('click', () => Exercise.start());
    
    // Night mode
    DOM.nightModeToggle?.addEventListener('change', () => NightMode.toggle());
    DOM.warmthSlider?.addEventListener('input', () => NightMode.updateWarmth());
    DOM.brightnessSlider?.addEventListener('input', () => NightMode.updateBrightness());
    DOM.autoNightToggle?.addEventListener('change', () => {
        AppState.settings.autoNight = DOM.autoNightToggle.checked;
        Storage.save();
    });
    
    // Settings
    DOM.settingsBtn?.addEventListener('click', () => Settings.open());
    DOM.closeSettings?.addEventListener('click', () => Settings.close());
    DOM.saveSettings?.addEventListener('click', () => Settings.save());
    
    // Close modals on backdrop click
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                backdrop.parentElement.classList.remove('active');
            }
        });
    });
}

// ===== PWA SERVICE WORKER =====
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(reg => console.log('Service Worker registered'))
            .catch(err => console.log('Service Worker registration failed'));
    });
}

// ===== INITIALIZATION =====
function init() {
    Storage.load();
    Navigation.init();
    Timer.updateDisplay();
    Timer.updateProgress();
    Stats.updateDisplay();
    NightMode.init();
    initEventListeners();
    requestNotificationPermission();
    NightMode.checkAutoEnable();
    
    // Check auto night mode every hour
    setInterval(() => {
        NightMode.checkAutoEnable();
    }, 60 * 60 * 1000);
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}