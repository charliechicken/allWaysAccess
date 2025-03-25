const SETTINGS_KEY = 'accessibility_settings';

class AccessibilitySettings {
    constructor() {
        this.settings = this.loadSettings();
        this.init();
    }

    loadSettings() {
        const saved = localStorage.getItem(SETTINGS_KEY);
        return saved ? JSON.parse(saved) : {
            darkMode: false,
            highContrast: false,
            fontSize: 100 // percentage
        };
    }

    saveSettings() {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
        this.applySettings();
    }

    applySettings() {
        // Dark mode
        document.documentElement.classList.toggle('dark-mode', this.settings.darkMode);
        
        // High contrast
        document.documentElement.classList.toggle('high-contrast', this.settings.highContrast);
        
        // Font size
        document.body.style.fontSize = `${this.settings.fontSize}%`;
    }

    init() {
        this.applySettings();
    }

    toggleDarkMode() {
        this.settings.darkMode = !this.settings.darkMode;
        this.saveSettings();
    }

    toggleHighContrast() {
        this.settings.highContrast = !this.settings.highContrast;
        this.saveSettings();
    }

    adjustFontSize(increase) {
        this.settings.fontSize = Math.max(80, Math.min(150, this.settings.fontSize + (increase ? 10 : -10)));
        this.saveSettings();
    }
} 