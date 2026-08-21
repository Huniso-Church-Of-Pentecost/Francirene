document.addEventListener('DOMContentLoaded', function() {
    initThemeToggle();
});

function initThemeToggle() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark-mode');
    }
    // Ensure icons reflect current theme even when light
    updateThemeIcon(savedTheme === 'dark');

    // Click handler for theme toggle buttons
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.theme-toggle');
        if (!btn) return;
        e.preventDefault();
        const isDarkMode = document.documentElement.classList.toggle('dark-mode');
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
        updateThemeIcon(isDarkMode);
    });

    // Ensure every .theme-toggle has an <i> icon (fallback)
    const toggles = document.querySelectorAll('.theme-toggle');
    toggles.forEach(toggle => {
        if (!toggle.querySelector('i')) {
            const i = document.createElement('i');
            i.className = 'fas fa-moon';
            toggle.appendChild(i);
        }
    });

    // Keyboard shortcut: 't' toggles theme
    document.addEventListener('keydown', (e) => {
        if (e.key === 't' || e.key === 'T') {
            const isDarkMode = document.documentElement.classList.toggle('dark-mode');
            localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
            updateThemeIcon(isDarkMode);
        }
    });
}

function updateThemeIcon(isDarkMode) {
    const toggles = document.querySelectorAll('.theme-toggle');
    toggles.forEach(toggle => {
        const icon = toggle.querySelector('i');
        if (!icon) return;
        if (isDarkMode) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
            toggle.classList.add('active');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
            toggle.classList.remove('active');
        }
    });
}
