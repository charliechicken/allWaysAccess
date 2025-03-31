const SETTINGS_KEY = 'accessibility_settings';

// Update the color scheme
const modernColors = {
    primary: '#FF5733', // Bright orange like in the reference
    background: '#FFFFFF',
    text: '#000000',
    secondary: '#F5F5F5'
};

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

    // Add modern toggle UI
    createToggleUI() {
        return `
            <div class="fixed bottom-8 right-8 bg-white rounded-lg shadow-lg p-4">
                <div class="flex flex-col gap-4">
                    <button class="modern-toggle">
                        <span class="toggle-slider"></span>
                        Dark Mode
                    </button>
                    <button class="modern-toggle">
                        <span class="toggle-slider"></span>
                        High Contrast
                    </button>
                </div>
            </div>
        `;
    }
} 