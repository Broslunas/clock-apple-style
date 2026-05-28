// Unified client-side controller for Broslunas Clock
import { 
    playFlipSound, 
    startAlarmSound, 
    stopAlarmSound, 
    setMute, 
    getMute 
} from './audio.js';
import { setAmbient, setAmbientVolume, getAmbient, getAmbientVolume } from './ambient.js';
import { requestNotificationPermission, getNotificationPermission, fireNotification } from './notifications.js';
import { navigate } from 'astro:transitions/client';
import { languages } from './translations.js';

let currentLang = 'es';
let t = languages.es;

// --- BASE DE DATOS DE TEMAS PREDEFINIDOS ---
// --- BASE DE DATOS DE TEMAS PREDEFINIDOS ---
const themes = [
    { 
        name: "🍎 Mac Classic", 
        bg: "linear-gradient(135deg, #0e0e10, #17171a)", 
        card: "#2c2c2e", 
        text: "#ffffff", 
        pageText: "#ffffff", 
        accent: "#ff9500",
        fontSans: "'Outfit', sans-serif",
        fontMono: "'JetBrains Mono', monospace",
        radius: "18px"
    },
    { 
        name: "✨ macOS Sonoma", 
        bg: "linear-gradient(135deg, #b893f0, #e8a0ab, #89bde0)", 
        card: "rgba(255,255,255,0.76)", 
        text: "#1c1c1f", 
        pageText: "#ffffff", 
        accent: "#5e5ce6",
        fontSans: "'Outfit', sans-serif",
        fontMono: "'Outfit', sans-serif",
        radius: "20px",
        shadow: "0 8px 32px 0 rgba(31, 38, 135, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.45)",
        border: "rgba(255, 255, 255, 0.4)"
    },
    { 
        name: "⌚ watchOS Ultra", 
        bg: "linear-gradient(135deg, #000000, #0a0a0a)", 
        card: "#161617", 
        text: "#ff453a", 
        pageText: "#ff453a", 
        accent: "#ff453a",
        fontSans: "'Outfit', sans-serif",
        fontMono: "'JetBrains Mono', monospace",
        radius: "12px"
    },
    { 
        name: "🍊 Hermès Special", 
        bg: "linear-gradient(135deg, #111112, #212124)", 
        card: "#ff9500", 
        text: "#000000", 
        pageText: "#ff9500", 
        accent: "#ff9500",
        fontSans: "'Outfit', sans-serif",
        fontMono: "'Outfit', sans-serif",
        radius: "18px"
    },
    { 
        name: "🧊 Glass Minimal", 
        bg: "linear-gradient(135deg, #e5e5ea, #d1d1d6)", 
        card: "rgba(255, 255, 255, 0.8)", 
        text: "#1d1d1f", 
        pageText: "#1d1d1f", 
        accent: "#007aff",
        fontSans: "'Outfit', sans-serif",
        fontMono: "'Outfit', sans-serif",
        radius: "20px",
        shadow: "0 8px 32px 0 rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)",
        border: "rgba(255,255,255,0.6)"
    },
    { 
        name: "🌌 iOS Aurora", 
        bg: "linear-gradient(135deg, #0a1128, #1c0a35)", 
        card: "rgba(255,255,255,0.12)", 
        text: "#ffffff", 
        pageText: "#f4f4f5", 
        accent: "#bf5af2",
        fontSans: "'Outfit', sans-serif",
        fontMono: "'Outfit', sans-serif",
        radius: "18px",
        shadow: "0 8px 32px 0 rgba(0,0,0,0.37), inset 0 1px 0 rgba(255,255,255,0.1)"
    },
    { 
        name: "🎨 Apple Arcade", 
        bg: "linear-gradient(135deg, #ff2d55, #ff9500)", 
        card: "#ffffff", 
        text: "#ff2d55", 
        pageText: "#ffffff", 
        accent: "#ff2d55",
        fontSans: "'Outfit', sans-serif",
        fontMono: "'Outfit', sans-serif",
        radius: "18px"
    },
    { 
        name: "🏁 Stealth Dark", 
        bg: "linear-gradient(135deg, #000000, #040405)", 
        card: "#0a0a0b", 
        text: "rgba(255,255,255,0.22)", 
        pageText: "rgba(255,255,255,0.45)", 
        accent: "#8e8e93",
        fontSans: "'Outfit', sans-serif",
        fontMono: "'JetBrains Mono', monospace",
        radius: "12px"
    },
    { 
        name: "🔮 Cyberpunk Neon", 
        bg: "linear-gradient(135deg, #0d0015, #1d0030)", 
        card: "rgba(29, 0, 48, 0.65)", 
        text: "#00f3ff", 
        pageText: "#ff0055", 
        accent: "#00f3ff", 
        fontSans: "'Outfit', sans-serif", 
        fontMono: "'Share Tech Mono', monospace", 
        radius: "8px", 
        shadow: "0 0 20px rgba(255, 0, 85, 0.3), 0 0 40px rgba(0, 243, 255, 0.15), inset 0 0 10px rgba(0, 243, 255, 0.4)", 
        glow: "0 0 8px #00f3ff, 0 0 20px rgba(0, 243, 255, 0.3)", 
        border: "1px solid #00f3ff", 
        scanlines: "0"
    },
    { 
        name: "📟 Retro CRT Terminal", 
        bg: "linear-gradient(180deg, #050f05, #000000)", 
        card: "#000000", 
        text: "#33ff33", 
        pageText: "#33ff33", 
        accent: "#33ff33", 
        fontSans: "'JetBrains Mono', monospace", 
        fontMono: "'Press Start 2P', monospace", 
        radius: "0px", 
        shadow: "0 0 15px rgba(51, 255, 51, 0.2), inset 0 0 5px rgba(51, 255, 51, 0.4)", 
        glow: "0 0 6px #33ff33, 0 0 12px rgba(51, 255, 51, 0.3)", 
        border: "1px solid #33ff33", 
        scanlines: "0.15"
    },
    { 
        name: "🏛️ Royal Walnut", 
        bg: "linear-gradient(135deg, #111e15, #08100b)", 
        card: "#261b15", 
        text: "#f4ebd0", 
        pageText: "#d4af37", 
        accent: "#d4af37", 
        fontSans: "'Cinzel', serif", 
        fontMono: "'Cinzel', serif", 
        radius: "4px", 
        shadow: "0 15px 30px rgba(0,0,0,0.6), 0 0 0 1px rgba(212, 175, 55, 0.25)", 
        border: "1px solid rgba(212, 175, 55, 0.4)"
    },
    { 
        name: "🍵 Zen Matcha", 
        bg: "linear-gradient(135deg, #d3e4cd, #adc2a9)", 
        card: "rgba(255, 255, 255, 0.9)", 
        text: "#3a5a40", 
        pageText: "#3a5a40", 
        accent: "#588157", 
        fontSans: "'Outfit', sans-serif", 
        fontMono: "'Outfit', sans-serif", 
        radius: "28px", 
        shadow: "0 10px 30px rgba(58, 90, 64, 0.08)", 
        border: "rgba(58, 90, 64, 0.1)"
    },
    { 
        name: "🍭 Bubblegum Pop", 
        bg: "linear-gradient(135deg, #ff9a9e, #fecfef)", 
        card: "rgba(255, 255, 255, 0.85)", 
        text: "#ff4f79", 
        pageText: "#ff4f79", 
        accent: "#4fc3f7", 
        fontSans: "'Outfit', sans-serif", 
        fontMono: "'Outfit', sans-serif", 
        radius: "36px", 
        shadow: "0 15px 30px rgba(255, 79, 121, 0.12)", 
        border: "rgba(255, 79, 121, 0.2)"
    },
    { 
        name: "🌋 Lava Flow", 
        bg: "linear-gradient(135deg, #140707, #2c0e0e)", 
        card: "rgba(30, 20, 20, 0.85)", 
        text: "#ff5500", 
        pageText: "#ff5500", 
        accent: "#ff2200", 
        fontSans: "'Syne', sans-serif", 
        fontMono: "'JetBrains Mono', monospace", 
        radius: "12px", 
        shadow: "0 0 20px rgba(255, 34, 0, 0.25), 0 0 40px rgba(255, 85, 0, 0.1), inset 0 0 10px rgba(255, 85, 0, 0.3)", 
        glow: "0 0 8px #ff5500, 0 0 20px rgba(255, 85, 0, 0.25)", 
        border: "1px solid #ff5500"
    },
    { 
        name: "☕ Cozy Espresso", 
        bg: "linear-gradient(135deg, #2d241e, #1a1412)", 
        card: "#3d3029", 
        text: "#f5e6d3", 
        pageText: "#d9b48f", 
        accent: "#d9b48f", 
        fontSans: "'Outfit', sans-serif", 
        fontMono: "'Outfit', sans-serif", 
        radius: "16px", 
        shadow: "0 12px 24px rgba(0,0,0,0.5)", 
        border: "rgba(255,255,255,0.04)"
    },
    { 
        name: "❄️ Arctic Frost", 
        bg: "linear-gradient(135deg, #bfe3f2, #eef7fa, #9bcce3)", 
        card: "rgba(255, 255, 255, 0.65)", 
        text: "#1c5b73", 
        pageText: "#1c5b73", 
        accent: "#007aff", 
        fontSans: "'Outfit', sans-serif", 
        fontMono: "'JetBrains Mono', monospace", 
        radius: "16px", 
        shadow: "0 8px 32px rgba(28, 91, 115, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)", 
        glow: "0 0 8px rgba(255,255,255,0.8)", 
        border: "rgba(255,255,255,0.4)"
    }
];

// --- CONTROL DE ESTADO GLOBAL DE LA APP PERSISTENTE ---
window.broslunasState = window.broslunasState || {
    activeView: 'clock',
    isMuted: false,
    showSeconds: false,
    format24h: false,
    isMechSounds: true,
    activeThemeIndex: 0,
    customTheme: null,
    alarms: [],
    ambient: { type: 'off', volume: 0.4 },
    stopwatch: {
        isRunning: false,
        startTime: 0,
        elapsedTime: 0,
        interval: null,
        laps: []
    },
    pomodoro: {
        isRunning: false,
        isBreak: false,
        focusDuration: 25,
        breakDuration: 5,
        timeLeft: 25 * 60,
        interval: null
    },
    timer: {
        isRunning: false,
        duration: 1800,
        timeLeft: 1800,
        interval: null
    },
    worldClocks: [
        { timezone: 'Europe/Madrid', offsetMs: 0, label: 'Madrid' }
    ],
    loopsInitialized: false
};

const state = window.broslunasState;

// ──────────────────────────────────────────────────────────────
// FLIP CARD ENGINE
// ──────────────────────────────────────────────────────────────
let soundThrottleTimeout = null;
function triggerFlipSoundThrottled() {
    if (soundThrottleTimeout || !state.isMechSounds || state.isMuted) return;
    playFlipSound();
    soundThrottleTimeout = setTimeout(() => {
        soundThrottleTimeout = null;
    }, 40);
}

function updateCardIfNeeded(cardId, newValue) {
    const card = document.getElementById(cardId);
    if (!card) return;

    const topSpan = card.querySelector('.card-top span');
    const bottomSpan = card.querySelector('.card-bottom span');
    if (!topSpan || !bottomSpan) return;

    if (topSpan.textContent === newValue) return;

    const oldValue = topSpan.textContent;
    bottomSpan.textContent = newValue;

    triggerFlipSoundThrottled();

    const flipper = document.createElement('div');
    flipper.className = 'flipper-falling';
    flipper.innerHTML = `<span>${oldValue}</span>`;
    card.appendChild(flipper);

    topSpan.textContent = newValue;

    flipper.addEventListener('animationend', () => {
        flipper.remove();
    });
}

// ──────────────────────────────────────────────────────────────
// PERSISTENCIA LOCAL STORAGE
// ──────────────────────────────────────────────────────────────
function loadSavedState() {
    try {
        const saved = localStorage.getItem('apple_flip_clock_state');
        if (saved) {
            const parsed = JSON.parse(saved);
            state.isMuted = parsed.isMuted ?? false;
            state.showSeconds = parsed.showSeconds ?? false;
            state.format24h = parsed.format24h ?? false;
            state.isMechSounds = parsed.isMechSounds ?? true;
            state.activeThemeIndex = parsed.activeThemeIndex ?? 0;
            state.customTheme = parsed.customTheme ?? null;
            state.alarms = parsed.alarms ?? [];
            state.ambient = parsed.ambient ?? { type: 'off', volume: 0.4 };

            if (parsed.worldClocks && Array.isArray(parsed.worldClocks)) {
                state.worldClocks = parsed.worldClocks;
            } else if (parsed.worldClock) {
                // Migrate from old single world clock format
                state.worldClocks = [{
                    timezone: parsed.worldClock.selectedTimezone ?? 'Europe/Madrid',
                    offsetMs: parsed.worldClock.offsetMs ?? 0,
                    label: (parsed.worldClock.selectedTimezone ?? 'Europe/Madrid').split('/').pop().replace(/_/g, ' ')
                }];
            }
            
            setMute(state.isMuted);
        }
    } catch (e) {
        console.warn("Error leyendo localStorage:", e);
    }
}

function saveState() {
    try {
        const toSave = {
            isMuted: state.isMuted,
            showSeconds: state.showSeconds,
            format24h: state.format24h,
            isMechSounds: state.isMechSounds,
            activeThemeIndex: state.activeThemeIndex,
            customTheme: state.customTheme,
            alarms: state.alarms,
            ambient: state.ambient,
            worldClocks: state.worldClocks
        };
        localStorage.setItem('apple_flip_clock_state', JSON.stringify(toSave));
    } catch (e) {
        console.warn("Error guardando localStorage:", e);
    }
}

// ──────────────────────────────────────────────────────────────
// TEMAS
// ──────────────────────────────────────────────────────────────
function applyTheme(theme) {
    document.documentElement.style.setProperty('--bg-gradient', theme.bg);
    document.documentElement.style.setProperty('--flip-bg', theme.card);
    document.documentElement.style.setProperty('--flip-text', theme.text);
    document.documentElement.style.setProperty('--text-color', theme.pageText);
    document.documentElement.style.setProperty('--accent-color', theme.accent);

    // Custom typography, styling & CRT scanline properties
    document.documentElement.style.setProperty('--font-sans', theme.fontSans || "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif");
    document.documentElement.style.setProperty('--font-mono', theme.fontMono || "'JetBrains Mono', monospace");
    document.documentElement.style.setProperty('--flip-radius', theme.radius || "18px");
    document.documentElement.style.setProperty('--flip-shadow', theme.shadow || "0 20px 45px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.1)");
    document.documentElement.style.setProperty('--text-glow', theme.glow || "0 2px 4px rgba(0, 0, 0, 0.2)");
    document.documentElement.style.setProperty('--scanline-opacity', theme.scanlines || "0");
    document.documentElement.style.setProperty('--card-border', theme.border || "rgba(255, 255, 255, 0.06)");
}

function setThemeIndex(idx) {
    state.activeThemeIndex = idx;
    state.customTheme = null;
    applyTheme(themes[idx]);
    saveState();
}

function applyCustomTheme(custom) {
    state.activeThemeIndex = -1;
    state.customTheme = custom;
    applyTheme(custom);
    saveState();
}

// ──────────────────────────────────────────────────────────────
// SISTEMA DE ALARMAS
// ──────────────────────────────────────────────────────────────

// Days of week: 0=Mon, 1=Tue, ..., 6=Sun (ISO)
function addAlarm(hr, min, label, recurrence = 'once', customDays = []) {
    const newAlarm = {
        id: Date.now().toString(),
        hour: hr,
        minute: min,
        label: label || t.alarm_triggered_label_default,
        active: true,
        recurrence, // 'once' | 'daily' | 'weekdays' | 'weekends' | 'custom'
        customDays,  // array of 0-6 (Mon=0) for 'custom' recurrence
        firedToday: false
    };
    state.alarms.push(newAlarm);
    saveState();
    drawAlarmsList();
    updateActiveAlarmBadge();
}

function deleteAlarm(id) {
    state.alarms = state.alarms.filter(a => a.id !== id);
    saveState();
    drawAlarmsList();
    updateActiveAlarmBadge();
}

function toggleAlarmActive(id) {
    const alarm = state.alarms.find(a => a.id === id);
    if (alarm) {
        alarm.active = !alarm.active;
        saveState();
        updateActiveAlarmBadge();
    }
}

function updateActiveAlarmBadge() {
    const badge = document.getElementById('active-alarms-badge');
    if (!badge) return;
    const activeCount = state.alarms.filter(a => a.active).length;
    badge.style.display = activeCount > 0 ? 'inline-block' : 'none';
}

function getRecurrenceLabel(alarm) {
    switch (alarm.recurrence) {
        case 'daily':    return `🔁 ${t.alarm_rec_daily}`;
        case 'weekdays': return `🔁 ${t.alarm_rec_weekdays}`;
        case 'weekends': return `🔁 ${t.alarm_rec_weekends}`;
        case 'custom':   return `🔁 ${(alarm.customDays || []).map(d => (t.alarm_days_short || [])[d] || d).join(' ')}`;
        default:         return '';
    }
}

function drawAlarmsList() {
    const list = document.getElementById('sidebar-alarms-list');
    if (!list) return;

    if (state.alarms.length === 0) {
        list.innerHTML = `<p class="empty-list-text">${t.settings_alarm_none}</p>`;
        return;
    }

    list.innerHTML = '';
    state.alarms.forEach(alarm => {
        const item = document.createElement('div');
        item.className = 'alarm-item';
        
        const hrStr = String(alarm.hour).padStart(2, '0');
        const minStr = String(alarm.minute).padStart(2, '0');
        const recLabel = getRecurrenceLabel(alarm);

        item.innerHTML = `
            <div class="alarm-info">
                <span class="alarm-time">${hrStr}:${minStr}</span>
                <span class="alarm-lbl">${alarm.label}${recLabel ? ` <em style="font-size:0.72em;opacity:0.6">${recLabel}</em>` : ''}</span>
            </div>
            <div class="alarm-actions">
                <input type="checkbox" class="alarm-toggle" ${alarm.active ? 'checked' : ''} data-id="${alarm.id}" />
                <button class="delete-alarm-btn" data-id="${alarm.id}">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
        `;

        item.querySelector('.alarm-toggle').addEventListener('change', () => {
            toggleAlarmActive(alarm.id);
        });
        item.querySelector('.delete-alarm-btn').addEventListener('click', () => {
            deleteAlarm(alarm.id);
        });

        list.appendChild(item);
    });
}

// ──────────────────────────────────────────────────────────────
// ALARM TRIGGER & OVERLAY
// ──────────────────────────────────────────────────────────────
let triggeredAlarmData = null;
function triggerAlarm(alarm) {
    triggeredAlarmData = alarm;
    
    const overlay = document.getElementById('alarm-triggered-overlay');
    const labelEl = document.getElementById('triggered-alarm-label');
    const timeEl = document.getElementById('triggered-alarm-time');

    if (labelEl) labelEl.textContent = alarm.label || t.alarm_triggered_label_default;
    if (timeEl) {
        const h = String(alarm.hour).padStart(2, '0');
        const m = String(alarm.minute).padStart(2, '0');
        timeEl.textContent = `${h}:${m}`;
    }

    if (overlay) overlay.style.display = 'flex';
    startAlarmSound();

    // System notification when page is in background
    fireNotification(
        t.notifications_alarm_title,
        alarm.label || t.alarm_triggered_label_default
    );
}

function dismissAlarm() {
    stopAlarmSound();
    const overlay = document.getElementById('alarm-triggered-overlay');
    if (overlay) overlay.style.display = 'none';

    if (triggeredAlarmData && triggeredAlarmData.id) {
        const alarm = state.alarms.find(a => a.id === triggeredAlarmData.id);
        if (alarm) {
            if (alarm.recurrence === 'once') {
                // Deactivate one-time alarms after firing
                alarm.active = false;
            } else {
                // Mark as fired today so it doesn't re-fire this minute
                alarm.firedToday = true;
            }
            saveState();
            drawAlarmsList();
            updateActiveAlarmBadge();
        }
    }
    triggeredAlarmData = null;
}

function snoozeAlarm() {
    stopAlarmSound();
    const overlay = document.getElementById('alarm-triggered-overlay');
    if (overlay) overlay.style.display = 'none';

    if (triggeredAlarmData) {
        const now = new Date();
        const snoozeTime = new Date(now.getTime() + 5 * 60 * 1000);
        
        const snoozeAlarmObj = {
            id: 'snooze-' + Date.now(),
            hour: snoozeTime.getHours(),
            minute: snoozeTime.getMinutes(),
            label: `${t.alarm_snoozed_prefix}${triggeredAlarmData.label}`,
            active: true,
            recurrence: 'once',
            customDays: [],
            firedToday: false
        };
        
        state.alarms.push(snoozeAlarmObj);
        saveState();
        drawAlarmsList();
        updateActiveAlarmBadge();
    }
    triggeredAlarmData = null;
}

// Recurring alarm day check
function alarmShouldFireToday(alarm) {
    const now = new Date();
    // JS getDay: 0=Sun, 1=Mon, ..., 6=Sat
    // We use: 0=Mon, ..., 5=Sat, 6=Sun
    const jsDay = now.getDay();
    const isoDay = jsDay === 0 ? 6 : jsDay - 1; // Convert to Mon=0

    switch (alarm.recurrence) {
        case 'once':     return true;
        case 'daily':    return true;
        case 'weekdays': return isoDay <= 4; // Mon-Fri
        case 'weekends': return isoDay >= 5; // Sat-Sun
        case 'custom':   return (alarm.customDays || []).includes(isoDay);
        default:         return true;
    }
}

// Reset firedToday at midnight
let lastMidnightReset = -1;
function checkMidnightReset() {
    const now = new Date();
    const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
    if (dayOfYear !== lastMidnightReset) {
        lastMidnightReset = dayOfYear;
        state.alarms.forEach(alarm => { alarm.firedToday = false; });
        saveState();
    }
}

let lastCheckedMinute = -1;
function checkAlarms() {
    checkMidnightReset();
    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();

    if (currentMin === lastCheckedMinute) return;
    lastCheckedMinute = currentMin;

    state.alarms.forEach(alarm => {
        if (
            alarm.active &&
            !alarm.firedToday &&
            alarm.hour === currentHour &&
            alarm.minute === currentMin &&
            alarmShouldFireToday(alarm)
        ) {
            triggerAlarm(alarm);
        }
    });
}

// ──────────────────────────────────────────────────────────────
// VISTA 1: RELOJ CLÁSICO
// ──────────────────────────────────────────────────────────────
function updateClock() {
    if (state.activeView !== 'clock') return;

    const now = new Date();
    
    const dateOptions = { weekday: 'long', day: 'numeric', month: 'long' };
    const dateEl = document.getElementById('clock-date');
    if (dateEl) {
        const locale = currentLang === 'en' ? 'en-US' : currentLang === 'fr' ? 'fr-FR' : currentLang === 'pt' ? 'pt-BR' : currentLang === 'de' ? 'de-DE' : 'es-ES';
        dateEl.textContent = now.toLocaleDateString(locale, dateOptions).toUpperCase();
    }

    let hours = now.getHours();
    let ampm = hours >= 12 ? 'PM' : 'AM';
    
    if (!state.format24h) {
        hours = hours % 12 || 12;
    }

    const hStr = String(hours).padStart(2, '0');
    const mStr = String(now.getMinutes()).padStart(2, '0');
    const sStr = String(now.getSeconds()).padStart(2, '0');

    updateCardIfNeeded('h1', hStr[0]);
    updateCardIfNeeded('h2', hStr[1]);
    updateCardIfNeeded('m1', mStr[0]);
    updateCardIfNeeded('m2', mStr[1]);

    const sGroup = document.getElementById('clock-s-group');
    const sColon = document.getElementById('clock-s-colon');

    if (state.showSeconds) {
        if (sGroup) sGroup.style.display = 'flex';
        if (sColon) sColon.style.display = 'block';
        updateCardIfNeeded('s1', sStr[0]);
        updateCardIfNeeded('s2', sStr[1]);
    } else {
        if (sGroup) sGroup.style.display = 'none';
        if (sColon) sColon.style.display = 'none';
    }

    const ampmEl = document.getElementById('clock-ampm');
    if (ampmEl) {
        ampmEl.textContent = ampm;
        ampmEl.style.display = state.format24h ? 'none' : 'block';
    }
}

// ──────────────────────────────────────────────────────────────
// VISTA 5: MÚLTIPLES RELOJES MUNDIALES
// ──────────────────────────────────────────────────────────────
const majorTimezones = [
    "Africa/Cairo", "Africa/Johannesburg", "Africa/Lagos", "Africa/Nairobi",
    "America/Argentina/Buenos_Aires", "America/Bogota", "America/Caracas",
    "America/Chicago", "America/Denver", "America/Los_Angeles",
    "America/Mexico_City", "America/New_York", "America/Santiago",
    "America/Sao_Paulo", "Asia/Bangkok", "Asia/Dubai", "Asia/Hong_Kong",
    "Asia/Jakarta", "Asia/Jerusalem", "Asia/Kolkata", "Asia/Manila",
    "Asia/Riyadh", "Asia/Seoul", "Asia/Shanghai", "Asia/Singapore",
    "Asia/Tokyo", "Atlantic/Azores", "Australia/Adelaide", "Australia/Brisbane",
    "Australia/Melbourne", "Australia/Perth", "Australia/Sydney",
    "Europe/Amsterdam", "Europe/Athens", "Europe/Berlin", "Europe/Brussels",
    "Europe/Budapest", "Europe/Dublin", "Europe/Istanbul", "Europe/Lisbon",
    "Europe/London", "Europe/Madrid", "Europe/Moscow", "Europe/Paris",
    "Europe/Rome", "Europe/Vienna", "Europe/Warsaw", "Europe/Zurich",
    "Pacific/Auckland", "Pacific/Honolulu"
];

let availableTimezones = [];

async function fetchTimezoneTime(timezone, clockEntry) {
    clockEntry.isLoading = true;
    
    try {
        const response = await fetch(`https://timeapi.io/api/Time/current/zone?timeZone=${encodeURIComponent(timezone)}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        
        const apiLocal = new Date(data.year, data.month - 1, data.day, data.hour, data.minute, data.seconds, data.milliSeconds || 0);
        clockEntry.offsetMs = apiLocal.getTime() - Date.now();
        clockEntry.timezone = timezone;
        clockEntry.label = timezone.split('/').pop().replace(/_/g, ' ');
    } catch (e) {
        console.warn("TimeAPI error, falling back to Intl:", e);
        try {
            const formatter = new Intl.DateTimeFormat('en-US', {
                timeZone: timezone,
                year: 'numeric', month: 'numeric', day: 'numeric',
                hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false
            });
            const parts = formatter.formatToParts(new Date());
            const pm = {};
            parts.forEach(p => pm[p.type] = p.value);
            const apiLocal = new Date(+pm.year, +pm.month - 1, +pm.day, +pm.hour, +pm.minute, +pm.second);
            clockEntry.offsetMs = apiLocal.getTime() - Date.now();
        } catch (err) {
            clockEntry.offsetMs = 0;
        }
    } finally {
        clockEntry.isLoading = false;
        saveState();
        renderWorldClocks();
    }
}

function getTimeStringForClock(clockEntry) {
    const now = new Date(Date.now() + clockEntry.offsetMs);
    let h = now.getHours();
    const ampm = h >= 12 ? 'PM' : 'AM';
    if (!state.format24h) h = h % 12 || 12;
    const hStr = String(h).padStart(2, '0');
    const mStr = String(now.getMinutes()).padStart(2, '0');
    const sStr = String(now.getSeconds()).padStart(2, '0');
    return { hStr, mStr, sStr, ampm, full: `${hStr}:${mStr}` };
}

function getDateStringForClock(clockEntry) {
    const now = new Date(Date.now() + clockEntry.offsetMs);
    const localeCode = currentLang === 'en' ? 'en-US' : currentLang === 'fr' ? 'fr-FR' : currentLang === 'pt' ? 'pt-BR' : currentLang === 'de' ? 'de-DE' : 'es-ES';
    return now.toLocaleDateString(localeCode, { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase();
}

// Render the multi-clock grid (replaces old single-clock flip display)
function renderWorldClocks() {
    if (state.activeView !== 'world-clock') return;
    const grid = document.getElementById('world-clocks-grid');
    if (!grid) return;

    grid.innerHTML = '';
    state.worldClocks.forEach((clockEntry, idx) => {
        const timeData = getTimeStringForClock(clockEntry);
        const dateStr = getDateStringForClock(clockEntry);

        const card = document.createElement('div');
        card.className = 'world-clock-card';
        card.setAttribute('data-idx', idx);

        card.innerHTML = `
            <div class="wc-card-header">
                <div class="wc-card-location">${clockEntry.label || clockEntry.timezone.replace(/_/g, ' ')}</div>
                <div class="wc-card-actions">
                    ${state.worldClocks.length > 1 ? `
                    <button class="wc-remove-btn" title="${t.wc_remove}" data-idx="${idx}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>` : ''}
                </div>
            </div>
            <div class="wc-card-time" id="wc-time-${idx}">
                <span class="wc-hours">${timeData.hStr}</span>
                <span class="wc-colon">:</span>
                <span class="wc-minutes">${timeData.mStr}</span>
                ${state.showSeconds ? `<span class="wc-colon-s">:</span><span class="wc-seconds">${timeData.sStr}</span>` : ''}
                ${!state.format24h ? `<span class="wc-ampm">${timeData.ampm}</span>` : ''}
            </div>
            <div class="wc-card-date">${dateStr}</div>
        `;

        card.querySelector('.wc-remove-btn')?.addEventListener('click', () => {
            state.worldClocks.splice(idx, 1);
            saveState();
            renderWorldClocks();
            updateAddClockButton();
        });

        grid.appendChild(card);
    });
}

// Tick: update all world clock times every second
function updateWorldClocks() {
    if (state.activeView !== 'world-clock') return;
    const grid = document.getElementById('world-clocks-grid');
    if (!grid) return;

    state.worldClocks.forEach((clockEntry, idx) => {
        const timeEl = document.getElementById(`wc-time-${idx}`);
        if (!timeEl) return;
        const timeData = getTimeStringForClock(clockEntry);

        const hoursEl = timeEl.querySelector('.wc-hours');
        const minsEl = timeEl.querySelector('.wc-minutes');
        const secsEl = timeEl.querySelector('.wc-seconds');
        const ampmEl = timeEl.querySelector('.wc-ampm');
        const colonS = timeEl.querySelector('.wc-colon-s');

        if (hoursEl) hoursEl.textContent = timeData.hStr;
        if (minsEl) minsEl.textContent = timeData.mStr;

        if (state.showSeconds) {
            if (!secsEl) {
                // Add seconds if not present
                renderWorldClocks();
                return;
            }
            secsEl.textContent = timeData.sStr;
        }
        if (ampmEl) ampmEl.textContent = timeData.ampm;
    });
}

function updateAddClockButton() {
    const addBtn = document.getElementById('wc-add-btn');
    if (addBtn) {
        addBtn.disabled = state.worldClocks.length >= 6;
        addBtn.title = state.worldClocks.length >= 6 ? t.wc_max_reached : t.wc_add_timezone;
        addBtn.textContent = t.wc_add_timezone;
    }
}

// ──────────────────────────────────────────────────────────────
// VISTA 2: CRONÓMETRO
// ──────────────────────────────────────────────────────────────
function drawStopwatch() {
    const time = state.stopwatch.elapsedTime;
    const mins = Math.floor(time / 60000);
    const secs = Math.floor((time % 60000) / 1000);
    const ms = Math.floor((time % 1000) / 10);

    updateCardIfNeeded('sw-m1', String(mins).padStart(2, '0')[0]);
    updateCardIfNeeded('sw-m2', String(mins).padStart(2, '0')[1]);
    updateCardIfNeeded('sw-s1', String(secs).padStart(2, '0')[0]);
    updateCardIfNeeded('sw-s2', String(secs).padStart(2, '0')[1]);
    updateCardIfNeeded('sw-ms1', String(ms).padStart(2, '0')[0]);
    updateCardIfNeeded('sw-ms2', String(ms).padStart(2, '0')[1]);
}

function runStopwatchLoop() {
    state.stopwatch.elapsedTime = Date.now() - state.stopwatch.startTime;
    drawStopwatch();
}

function formatTimeMs(time) {
    const mins = Math.floor(time / 60000);
    const secs = Math.floor((time % 60000) / 1000);
    const ms = Math.floor((time % 1000) / 10);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
}

function drawLapsList() {
    const list = document.getElementById('laps-list');
    if (!list) return;
    list.innerHTML = '';
    state.stopwatch.laps.forEach(lap => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${t.sw_btn_lap} ${lap.num}</td><td>+${formatTimeMs(lap.delta)}</td><td>${formatTimeMs(lap.total)}</td>`;
        list.appendChild(tr);
    });
}

// ──────────────────────────────────────────────────────────────
// VISTA 3: POMODORO
// ──────────────────────────────────────────────────────────────
function drawPomodoro() {
    const minutes = Math.floor(state.pomodoro.timeLeft / 60);
    const seconds = state.pomodoro.timeLeft % 60;

    updateCardIfNeeded('pom-m1', String(minutes).padStart(2, '0')[0]);
    updateCardIfNeeded('pom-m2', String(minutes).padStart(2, '0')[1]);
    updateCardIfNeeded('pom-s1', String(seconds).padStart(2, '0')[0]);
    updateCardIfNeeded('pom-s2', String(seconds).padStart(2, '0')[1]);

    const totalDuration = (state.pomodoro.isBreak ? state.pomodoro.breakDuration : state.pomodoro.focusDuration) * 60;
    const pct = state.pomodoro.timeLeft / totalDuration;
    const bar = document.getElementById('pom-progress-bar');
    if (bar) {
        const sizeFactor = window.innerWidth <= 600 ? 477 : (window.innerWidth <= 900 ? 691 : 848);
        bar.style.strokeDashoffset = String(sizeFactor * (1 - pct));
    }
}

function triggerPomodoroEnd() {
    const pom = state.pomodoro;
    const wasBreak = pom.isBreak;
    const nextBreakState = !pom.isBreak;
    
    const label = wasBreak
        ? `${t.pom_break_end_title} ${t.pom_break_end_desc}`
        : `${t.pom_focus_end_title} ${t.pom_focus_end_desc}`;
    
    triggerAlarm({
        id: 'pomodoro-system',
        hour: new Date().getHours(),
        minute: new Date().getMinutes(),
        label
    });

    // System notification
    fireNotification(
        wasBreak ? t.notifications_pomodoro_break : t.notifications_pomodoro_focus,
        wasBreak ? t.pom_break_end_desc : t.pom_focus_end_desc
    );

    pom.isBreak = nextBreakState;
    pom.timeLeft = (pom.isBreak ? pom.breakDuration : pom.focusDuration) * 60;
    pom.isRunning = false;
    clearInterval(pom.interval);
    pom.interval = null;

    const statusBadge = document.getElementById('pomodoro-status');
    if (statusBadge) {
        statusBadge.textContent = pom.isBreak ? t.pom_badge_break : t.pom_badge_focus;
        statusBadge.style.color = pom.isBreak ? "#30d158" : "var(--accent-color)";
        statusBadge.style.borderColor = pom.isBreak ? "#30d158" : "var(--accent-color)";
        statusBadge.style.background = pom.isBreak ? "rgba(48, 209, 88, 0.08)" : "rgba(255, 149, 0, 0.08)";
    }

    const pomStartBtn = document.getElementById('pom-start-btn');
    if (pomStartBtn) {
        pomStartBtn.textContent = t.sw_btn_start;
        pomStartBtn.style.background = 'var(--text-color)';
        pomStartBtn.style.color = '#000';
    }

    drawPomodoro();
}

function runPomodoroTick() {
    if (state.pomodoro.timeLeft <= 0) {
        triggerPomodoroEnd();
        return;
    }
    state.pomodoro.timeLeft--;
    drawPomodoro();
}

// ──────────────────────────────────────────────────────────────
// VISTA 4: TEMPORIZADOR
// ──────────────────────────────────────────────────────────────
function drawTimer() {
    const hours = Math.floor(state.timer.timeLeft / 3600);
    const minutes = Math.floor((state.timer.timeLeft % 3600) / 60);
    const seconds = state.timer.timeLeft % 60;

    updateCardIfNeeded('tm-h1', String(hours).padStart(2, '0')[0]);
    updateCardIfNeeded('tm-h2', String(hours).padStart(2, '0')[1]);
    updateCardIfNeeded('tm-m1', String(minutes).padStart(2, '0')[0]);
    updateCardIfNeeded('tm-m2', String(minutes).padStart(2, '0')[1]);
    updateCardIfNeeded('tm-s1', String(seconds).padStart(2, '0')[0]);
    updateCardIfNeeded('tm-s2', String(seconds).padStart(2, '0')[1]);

    // Ocultar cifras innecesarias
    const hoursGroup = document.getElementById('tm-hours-group');
    const colonH = document.getElementById('tm-colon-h');
    const minutesGroup = document.getElementById('tm-minutes-group');
    const colonM = document.getElementById('tm-colon-m');
    const container = document.querySelector('#view-timer .progress-ring-container');

    if (hours > 0) {
        if (hoursGroup) hoursGroup.classList.remove('collapsed');
        if (colonH) colonH.classList.remove('collapsed');
        if (minutesGroup) minutesGroup.classList.remove('collapsed');
        if (colonM) colonM.classList.remove('collapsed');
        if (container) {
            container.classList.remove('hide-hours');
            container.classList.remove('hide-hours-minutes');
        }
    } else {
        if (hoursGroup) hoursGroup.classList.add('collapsed');
        if (colonH) colonH.classList.add('collapsed');

        if (minutes > 0) {
            if (minutesGroup) minutesGroup.classList.remove('collapsed');
            if (colonM) colonM.classList.remove('collapsed');
            if (container) {
                container.classList.add('hide-hours');
                container.classList.remove('hide-hours-minutes');
            }
        } else {
            if (minutesGroup) minutesGroup.classList.add('collapsed');
            if (colonM) colonM.classList.add('collapsed');
            if (container) {
                container.classList.remove('hide-hours');
                container.classList.add('hide-hours-minutes');
            }
        }
    }

    const pct = state.timer.timeLeft / state.timer.duration;
    const bar = document.getElementById('timer-progress-bar');
    if (bar) {
        const sizeFactor = window.innerWidth <= 600 ? 477 : (window.innerWidth <= 900 ? 691 : 848);
        bar.style.strokeDashoffset = String(sizeFactor * (1 - pct));
    }
}

function triggerTimerEnd() {
    const tm = state.timer;
    triggerAlarm({
        id: 'timer-system',
        hour: new Date().getHours(),
        minute: new Date().getMinutes(),
        label: t.timer_finished
    });

    // System notification
    fireNotification(t.notifications_timer, '');

    tm.timeLeft = tm.duration;
    tm.isRunning = false;
    clearInterval(tm.interval);
    tm.interval = null;

    const tmStartBtn = document.getElementById('timer-start-btn');
    if (tmStartBtn) {
        tmStartBtn.textContent = t.sw_btn_start;
        tmStartBtn.style.background = 'var(--text-color)';
        tmStartBtn.style.color = '#000';
    }

    drawTimer();
}

function runTimerTick() {
    if (state.timer.timeLeft <= 0) {
        triggerTimerEnd();
        return;
    }
    state.timer.timeLeft--;
    drawTimer();
}

// ──────────────────────────────────────────────────────────────
// SETTINGS & SIDEBAR HELPERS
// ──────────────────────────────────────────────────────────────
function toggleSettings() {
    const settingsSidebar = document.getElementById('settings-sidebar');
    if (settingsSidebar) settingsSidebar.classList.toggle('open');
    const toast = document.getElementById('toast-tip');
    if (toast) toast.style.opacity = '0';
}

function toggleSidebar() {
    const sidebar = document.getElementById('app-sidebar');
    const hamburgerBtn = document.getElementById('hamburger-btn');
    if (sidebar && hamburgerBtn) {
        const isOpen = sidebar.classList.toggle('open');
        hamburgerBtn.setAttribute('aria-expanded', String(isOpen));
    }
    const toast = document.getElementById('toast-tip');
    if (toast) toast.style.opacity = '0';
}

function updateMuteUI() {
    const sidebarMuteBtn = document.getElementById('sidebar-mute-btn');
    if (!sidebarMuteBtn) return;
    const volOnIcon = sidebarMuteBtn.querySelector('.vol-icon-on');
    const volOffIcon = sidebarMuteBtn.querySelector('.vol-icon-off');
    if (state.isMuted) {
        if (volOnIcon) volOnIcon.style.display = 'none';
        if (volOffIcon) volOffIcon.style.display = 'block';
        sidebarMuteBtn.classList.add('active');
    } else {
        if (volOnIcon) volOnIcon.style.display = 'block';
        if (volOffIcon) volOffIcon.style.display = 'none';
        sidebarMuteBtn.classList.remove('active');
    }
}

// ──────────────────────────────────────────────────────────────
// AMBIENT SOUND UI BINDING
// ──────────────────────────────────────────────────────────────
function setupAmbientUI() {
    const container = document.getElementById('ambient-controls');
    if (!container) return;

    // Sync buttons
    container.querySelectorAll('.ambient-btn').forEach(btn => {
        const type = btn.getAttribute('data-ambient');
        btn.classList.toggle('active', type === state.ambient.type);
        btn.onclick = () => {
            state.ambient.type = type;
            saveState();
            setAmbient(type, state.ambient.volume);
            container.querySelectorAll('.ambient-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        };
    });

    // Volume slider
    const slider = document.getElementById('ambient-volume-slider');
    if (slider) {
        slider.value = Math.round(state.ambient.volume * 100);
        slider.oninput = (e) => {
            const vol = parseInt(e.target.value) / 100;
            state.ambient.volume = vol;
            setAmbientVolume(vol);
            saveState();
        };
    }

    // Restore ambient on page load
    if (state.ambient.type !== 'off') {
        setAmbient(state.ambient.type, state.ambient.volume);
    }
}

// ──────────────────────────────────────────────────────────────
// NOTIFICATIONS UI BINDING
// ──────────────────────────────────────────────────────────────
function setupNotificationsUI() {
    const btn = document.getElementById('notifications-enable-btn');
    const statusEl = document.getElementById('notifications-status');
    if (!btn || !statusEl) return;

    function updateNotifUI() {
        const perm = getNotificationPermission();
        if (perm === 'granted') {
            statusEl.textContent = t.notifications_granted;
            statusEl.style.color = '#30d158';
            btn.style.display = 'none';
        } else if (perm === 'denied') {
            statusEl.textContent = t.notifications_denied;
            statusEl.style.color = '#ff453a';
            btn.style.display = 'none';
        } else {
            statusEl.textContent = '';
            btn.style.display = 'block';
        }
    }

    updateNotifUI();

    btn.onclick = async () => {
        await requestNotificationPermission();
        updateNotifUI();
    };
}

// ──────────────────────────────────────────────────────────────
// ONE-TIME INITIALIZATION
// ──────────────────────────────────────────────────────────────
const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

if (!state.loopsInitialized) {
    loadSavedState();
    
    // Background loops
    setInterval(() => {
        updateClock();
        updateWorldClocks();
        checkAlarms();
    }, 200);

    // Document-level keydown (registered once)
    window.addEventListener('keydown', (e) => {
        const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
        if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return;

        const key = e.key.toLowerCase();

        if (triggeredAlarmData) {
            if (key === 'd' || key === 'escape' || key === 'enter') {
                e.preventDefault(); dismissAlarm(); return;
            }
            if (key === 's') {
                e.preventDefault(); snoozeAlarm(); return;
            }
        }

        if (key === 'h' || key === 'escape') { e.preventDefault(); toggleSidebar(); return; }
        if (key === '.') { e.preventDefault(); toggleSettings(); return; }

        if (key === 'f') {
            e.preventDefault();
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
            } else {
                document.exitFullscreen?.();
            }
            return;
        }

        if (key === 'm') {
            e.preventDefault();
            state.isMuted = !state.isMuted;
            setMute(state.isMuted);
            updateMuteUI();
            saveState();
            return;
        }

        const prefix = currentLang === 'en' ? '/en' : currentLang === 'fr' ? '/fr' : currentLang === 'pt' ? '/pt' : currentLang === 'de' ? '/de' : '';
        if (key === '1' || key === 'c') { e.preventDefault(); navigate(`${prefix}/`); return; }
        if (key === '2') { e.preventDefault(); navigate(`${prefix}/stopwatch`); return; }
        if (key === '3' || key === 'p') { e.preventDefault(); navigate(`${prefix}/pomodoro`); return; }
        if (key === '4') { e.preventDefault(); navigate(`${prefix}/timer`); return; }
        if (key === '5' || key === 'w') { e.preventDefault(); navigate(`${prefix}/world-clock`); return; }

        if (e.key === ' ') {
            e.preventDefault();
            if (state.activeView === 'stopwatch') document.getElementById('sw-start-btn')?.click();
            else if (state.activeView === 'pomodoro') document.getElementById('pom-start-btn')?.click();
            else if (state.activeView === 'timer') document.getElementById('timer-start-btn')?.click();
            return;
        }

        if (key === 'r') {
            e.preventDefault();
            if (state.activeView === 'stopwatch') document.getElementById('sw-reset-btn')?.click();
            else if (state.activeView === 'pomodoro') document.getElementById('pom-reset-btn')?.click();
            else if (state.activeView === 'timer') document.getElementById('timer-reset-btn')?.click();
            return;
        }

        if (key === 'l') {
            e.preventDefault();
            if (state.activeView === 'stopwatch') document.getElementById('sw-lap-btn')?.click();
            return;
        }
    });

    document.addEventListener('click', (e) => {
        const sidebar = document.getElementById('app-sidebar');
        const hamburgerBtn = document.getElementById('hamburger-btn');
        if (sidebar && sidebar.classList.contains('open') && hamburgerBtn) {
            if (!sidebar.contains(e.target) && !hamburgerBtn.contains(e.target)) {
                toggleSidebar();
            }
        }
    });

    document.addEventListener('mousemove', (e) => {
        const target = document.getElementById('parallax-target');
        if (!target || isTouchDevice) return;
        const maxTilt = 10;
        const x = (e.clientX / window.innerWidth - 0.5) * maxTilt;
        const y = (e.clientY / window.innerHeight - 0.5) * -maxTilt;
        target.style.setProperty('--tilt-x', `${y}deg`);
        target.style.setProperty('--tilt-y', `${x}deg`);
    });

    document.addEventListener('mouseleave', () => {
        const target = document.getElementById('parallax-target');
        if (target) {
            target.style.setProperty('--tilt-x', '0deg');
            target.style.setProperty('--tilt-y', '0deg');
        }
    });

    state.loopsInitialized = true;
}

// ──────────────────────────────────────────────────────────────
// PER-PAGE-LOAD SETUP (runs on every Astro view transition)
// ──────────────────────────────────────────────────────────────
document.addEventListener('astro:page-load', () => {
    // 0. Detect language
    const path = window.location.pathname;
    if (path.startsWith('/en')) currentLang = 'en';
    else if (path.startsWith('/fr')) currentLang = 'fr';
    else if (path.startsWith('/pt')) currentLang = 'pt';
    else if (path.startsWith('/de')) currentLang = 'de';
    else currentLang = 'es';
    t = languages[currentLang] || languages.es;

    // 1. Determine active view
    if (path === '/' || /^\/(en|fr|pt|de)\/?$/.test(path)) state.activeView = 'clock';
    else if (path.includes('/world-clock')) state.activeView = 'world-clock';
    else if (path.includes('/stopwatch')) state.activeView = 'stopwatch';
    else if (path.includes('/pomodoro')) state.activeView = 'pomodoro';
    else if (path.includes('/timer')) state.activeView = 'timer';

    // Toast
    const toast = document.getElementById('toast-tip');
    if (toast) toast.innerHTML = t.toast_hint_html;

    // 2. Sync Sidebar active state
    document.querySelectorAll('.menu-item[data-view]').forEach(item => {
        item.classList.toggle('active', item.getAttribute('data-view') === state.activeView);
    });

    // Auto-collapse sidebar on mobile
    const sidebar = document.getElementById('app-sidebar');
    if (sidebar && sidebar.classList.contains('open') && window.innerWidth <= 600) {
        toggleSidebar();
    }

    // 3. Apply theme
    if (state.customTheme) applyTheme(state.customTheme);
    else applyTheme(themes[state.activeThemeIndex] || themes[0]);

    // 4. Settings Panel bindings
    const format24hCB = document.getElementById('setting-format-24h');
    if (format24hCB) {
        format24hCB.checked = state.format24h;
        format24hCB.onchange = (e) => { state.format24h = e.target.checked; saveState(); updateClock(); renderWorldClocks(); };
    }

    const showSecondsCB = document.getElementById('setting-show-seconds');
    if (showSecondsCB) {
        showSecondsCB.checked = state.showSeconds;
        showSecondsCB.onchange = (e) => { state.showSeconds = e.target.checked; saveState(); updateClock(); renderWorldClocks(); };
    }

    const mechSoundsCB = document.getElementById('setting-mech-sounds');
    if (mechSoundsCB) {
        mechSoundsCB.checked = state.isMechSounds;
        mechSoundsCB.onchange = (e) => { state.isMechSounds = e.target.checked; saveState(); };
    }

    // Themes grid
    const grid = document.getElementById('presets-grid');
    if (grid) {
        grid.innerHTML = '';
        themes.forEach((theme, idx) => {
            const card = document.createElement('div');
            card.className = `theme-card${idx === state.activeThemeIndex ? ' active' : ''}`;
            card.innerText = theme.name;
            card.style.background = theme.bg;
            card.style.color = theme.text;
            card.style.borderColor = theme.accent;
            card.onclick = () => {
                document.querySelectorAll('#presets-grid .theme-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                setThemeIndex(idx);
            };
            grid.appendChild(card);
        });
    }

    // Sync Custom Theme inputs if state has customTheme
    if (state.customTheme) {
        if (document.getElementById('custom-bg-1')) document.getElementById('custom-bg-1').value = state.customTheme.bg1 || '#1c1c1e';
        if (document.getElementById('custom-bg-2')) document.getElementById('custom-bg-2').value = state.customTheme.bg2 || '#111112';
        if (document.getElementById('custom-card-color')) document.getElementById('custom-card-color').value = state.customTheme.cardColor || '#2c2c2e';
        if (document.getElementById('custom-text-color')) document.getElementById('custom-text-color').value = state.customTheme.textColor || '#ffffff';
        if (document.getElementById('custom-card-opacity')) document.getElementById('custom-card-opacity').value = state.customTheme.opacityVal || '95';
        if (document.getElementById('custom-font-select')) document.getElementById('custom-font-select').value = state.customTheme.fontVal || 'outfit';
        if (document.getElementById('custom-radius-select')) document.getElementById('custom-radius-select').value = state.customTheme.radiusVal || '18px';
        if (document.getElementById('custom-style-select')) document.getElementById('custom-style-select').value = state.customTheme.styleVal || 'default';
    }

    // Custom theme builder
    const applyCustomBtn = document.getElementById('apply-custom-theme-btn');
    if (applyCustomBtn) {
        applyCustomBtn.onclick = () => {
            const bg1 = document.getElementById('custom-bg-1').value;
            const bg2 = document.getElementById('custom-bg-2').value;
            const cardColor = document.getElementById('custom-card-color').value;
            const textColor = document.getElementById('custom-text-color').value;
            const opacity = parseInt(document.getElementById('custom-card-opacity').value) / 100;
            const r = parseInt(cardColor.slice(1, 3), 16);
            const g = parseInt(cardColor.slice(3, 5), 16);
            const b = parseInt(cardColor.slice(5, 7), 16);

            const fontVal = document.getElementById('custom-font-select').value;
            const radiusVal = document.getElementById('custom-radius-select').value;
            const styleVal = document.getElementById('custom-style-select').value;

            // Build font values
            let fontSans = "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
            let fontMono = "'JetBrains Mono', monospace";
            if (fontVal === 'mono') {
                fontMono = "'JetBrains Mono', monospace";
            } else if (fontVal === 'cinzel') {
                fontSans = "'Cinzel', serif";
                fontMono = "'Cinzel', serif";
            } else if (fontVal === 'playfair') {
                fontSans = "'Playfair Display', serif";
                fontMono = "'Playfair Display', serif";
            } else if (fontVal === 'retro') {
                fontSans = "'JetBrains Mono', monospace";
                fontMono = "'Press Start 2P', monospace";
            } else if (fontVal === 'cyber') {
                fontSans = "'Outfit', sans-serif";
                fontMono = "'Share Tech Mono', monospace";
            } else if (fontVal === 'syne') {
                fontSans = "'Syne', sans-serif";
                fontMono = "'Syne', sans-serif";
            }

            // Build style details based on styleVal
            let shadow = "0 20px 45px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.1)";
            let glow = "0 2px 4px rgba(0, 0, 0, 0.2)";
            let scanlines = "0";
            let border = "rgba(255, 255, 255, 0.06)";

            if (styleVal === 'neon') {
                shadow = "0 0 20px rgba(255, 0, 85, 0.35), 0 0 40px rgba(0, 243, 255, 0.18), inset 0 0 10px rgba(0, 243, 255, 0.4)";
                glow = "0 0 8px #00f3ff, 0 0 20px rgba(0, 243, 255, 0.3)";
                border = "1px solid #00f3ff";
            } else if (styleVal === 'lava') {
                shadow = "0 0 20px rgba(255, 34, 0, 0.35), 0 0 40px rgba(255, 85, 0, 0.18), inset 0 0 10px rgba(255, 85, 0, 0.4)";
                glow = "0 0 8px #ff5500, 0 0 20px rgba(255, 85, 0, 0.3)";
                border = "1px solid #ff5500";
            } else if (styleVal === 'crt') {
                shadow = "0 0 15px rgba(51, 255, 51, 0.25), inset 0 0 5px rgba(51, 255, 51, 0.4)";
                glow = "0 0 6px #33ff33, 0 0 12px rgba(51, 255, 51, 0.3)";
                border = "1px solid #33ff33";
                scanlines = "0.15";
            } else if (styleVal === 'glass') {
                shadow = "0 8px 32px 0 rgba(31, 38, 135, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)";
                border = "1px solid rgba(255, 255, 255, 0.25)";
            }

            applyCustomTheme({
                name: "Personalizado",
                bg: `linear-gradient(135deg, ${bg1}, ${bg2})`,
                card: `rgba(${r}, ${g}, ${b}, ${opacity})`,
                text: textColor,
                pageText: textColor,
                accent: textColor,
                fontSans,
                fontMono,
                radius: radiusVal,
                shadow,
                glow,
                scanlines,
                border,
                // store original selections for repopulating UI:
                bg1,
                bg2,
                cardColor,
                textColor,
                opacityVal: document.getElementById('custom-card-opacity').value,
                fontVal,
                radiusVal,
                styleVal
            });

            // Uncheck any active preset cards in the grid since custom is now active
            document.querySelectorAll('#presets-grid .theme-card').forEach(c => c.classList.remove('active'));
        };
    }

    // 5. Alarms
    // Recurrence select binding
    const recurrenceSelect = document.getElementById('alarm-recurrence');
    const customDaysRow = document.getElementById('alarm-custom-days-row');
    if (recurrenceSelect && customDaysRow) {
        recurrenceSelect.onchange = () => {
            customDaysRow.style.display = recurrenceSelect.value === 'custom' ? 'flex' : 'none';
        };
        customDaysRow.style.display = recurrenceSelect.value === 'custom' ? 'flex' : 'none';
    }

    const addAlarmBtn = document.getElementById('add-alarm-btn');
    if (addAlarmBtn) {
        addAlarmBtn.onclick = () => {
            const hrInput = document.getElementById('alarm-hour');
            const minInput = document.getElementById('alarm-minute');
            const lblInput = document.getElementById('alarm-label');
            const recSel = document.getElementById('alarm-recurrence');
            
            let hr = parseInt(hrInput.value);
            let min = parseInt(minInput.value);
            let label = lblInput.value.trim();
            let recurrence = recSel ? recSel.value : 'once';
            let customDays = [];

            if (recurrence === 'custom') {
                document.querySelectorAll('.day-toggle-btn.selected').forEach(btn => {
                    customDays.push(parseInt(btn.getAttribute('data-day')));
                });
            }

            if (isNaN(hr) || hr < 0 || hr > 23 || isNaN(min) || min < 0 || min > 59) {
                alert(t.validation_invalid_time);
                return;
            }

            addAlarm(hr, min, label, recurrence, customDays);
            hrInput.value = '';
            minInput.value = '';
            lblInput.value = '';
            if (recSel) recSel.value = 'once';
            document.querySelectorAll('.day-toggle-btn').forEach(btn => btn.classList.remove('selected'));
            if (customDaysRow) customDaysRow.style.display = 'none';
        };
    }

    // Day toggle buttons for custom recurrence
    document.querySelectorAll('.day-toggle-btn').forEach(btn => {
        btn.onclick = () => btn.classList.toggle('selected');
    });

    // Language buttons
    const langBtnEs = document.getElementById('lang-btn-es');
    const langBtnEn = document.getElementById('lang-btn-en');
    const langBtnFr = document.getElementById('lang-btn-fr');
    const langBtnPt = document.getElementById('lang-btn-pt');
    const langBtnDe = document.getElementById('lang-btn-de');

    const switchLang = (targetLang) => {
        const prefix = targetLang === 'es' ? '' : `/${targetLang}`;
        let currentPath = window.location.pathname;
        // Strip current lang prefix
        currentPath = currentPath.replace(/^\/(en|fr|pt|de)/, '') || '/';
        navigate(`${prefix}${currentPath}`);
    };

    if (langBtnEs) langBtnEs.onclick = () => { if (currentLang !== 'es') switchLang('es'); };
    if (langBtnEn) langBtnEn.onclick = () => { if (currentLang !== 'en') switchLang('en'); };
    if (langBtnFr) langBtnFr.onclick = () => { if (currentLang !== 'fr') switchLang('fr'); };
    if (langBtnPt) langBtnPt.onclick = () => { if (currentLang !== 'pt') switchLang('pt'); };
    if (langBtnDe) langBtnDe.onclick = () => { if (currentLang !== 'de') switchLang('de'); };

    drawAlarmsList();
    updateActiveAlarmBadge();

    // 6. Mute
    const sidebarMuteBtn = document.getElementById('sidebar-mute-btn');
    if (sidebarMuteBtn) {
        sidebarMuteBtn.onclick = () => {
            state.isMuted = !state.isMuted;
            setMute(state.isMuted);
            updateMuteUI();
            saveState();
        };
    }
    updateMuteUI();

    // Settings / Hamburger buttons
    document.getElementById('sidebar-settings-btn')?.addEventListener('click', toggleSettings);
    document.getElementById('close-settings-btn')?.addEventListener('click', toggleSettings);
    const hamburgerBtn = document.getElementById('hamburger-btn');
    if (hamburgerBtn) hamburgerBtn.onclick = toggleSidebar;

    // 7. Alarm overlay buttons
    document.getElementById('btn-alarm-dismiss')?.addEventListener('click', dismissAlarm);
    document.getElementById('btn-alarm-snooze')?.addEventListener('click', snoozeAlarm);

    if (triggeredAlarmData) triggerAlarm(triggeredAlarmData);

    // 8. Ambient sound UI
    setupAmbientUI();

    // 9. Notifications UI
    setupNotificationsUI();

    // 10. View-specific setup
    if (state.activeView === 'clock') {
        updateClock();

    } else if (state.activeView === 'stopwatch') {
        const sw = state.stopwatch;
        const swStartBtn = document.getElementById('sw-start-btn');
        const swLapBtn = document.getElementById('sw-lap-btn');
        const swResetBtn = document.getElementById('sw-reset-btn');

        if (swStartBtn && swLapBtn && swResetBtn) {
            if (sw.isRunning) {
                swStartBtn.textContent = t.sw_btn_pause;
                swStartBtn.style.background = '#ff3b30';
                swStartBtn.style.color = '#fff';
                swLapBtn.disabled = false;
                swResetBtn.disabled = true;
            } else {
                swStartBtn.textContent = t.sw_btn_start;
                swStartBtn.style.background = 'var(--text-color)';
                swStartBtn.style.color = '#000';
                swLapBtn.disabled = true;
                swResetBtn.disabled = sw.elapsedTime === 0;
            }

            swStartBtn.onclick = () => {
                if (!sw.isRunning) {
                    sw.isRunning = true;
                    sw.startTime = Date.now() - sw.elapsedTime;
                    sw.interval = setInterval(runStopwatchLoop, 30);
                    swStartBtn.textContent = t.sw_btn_pause;
                    swStartBtn.style.background = '#ff3b30';
                    swStartBtn.style.color = '#fff';
                    swLapBtn.disabled = false;
                    swResetBtn.disabled = true;
                } else {
                    sw.isRunning = false;
                    clearInterval(sw.interval);
                    sw.interval = null;
                    swStartBtn.textContent = t.sw_btn_start;
                    swStartBtn.style.background = 'var(--text-color)';
                    swStartBtn.style.color = '#000';
                    swLapBtn.disabled = true;
                    swResetBtn.disabled = false;
                }
            };

            swLapBtn.onclick = () => {
                if (!sw.isRunning) return;
                const lapTime = sw.elapsedTime;
                const lastLapTotal = sw.laps.length > 0 ? sw.laps[0].total : 0;
                sw.laps.unshift({ num: sw.laps.length + 1, delta: lapTime - lastLapTotal, total: lapTime });
                drawLapsList();
            };

            swResetBtn.onclick = () => {
                sw.isRunning = false;
                clearInterval(sw.interval);
                sw.interval = null;
                sw.elapsedTime = 0;
                sw.laps = [];
                drawStopwatch();
                drawLapsList();
                swStartBtn.textContent = t.sw_btn_start;
                swStartBtn.style.background = 'var(--text-color)';
                swStartBtn.style.color = '#000';
                swLapBtn.disabled = true;
                swResetBtn.disabled = true;
            };
        }

        drawStopwatch();
        drawLapsList();

    } else if (state.activeView === 'pomodoro') {
        const pom = state.pomodoro;
        const pomStartBtn = document.getElementById('pom-start-btn');
        const pomResetBtn = document.getElementById('pom-reset-btn');
        const statusBadge = document.getElementById('pomodoro-status');

        if (pomStartBtn && pomResetBtn) {
            if (pom.isRunning) {
                pomStartBtn.textContent = t.sw_btn_pause;
                pomStartBtn.style.background = '#ff3b30';
                pomStartBtn.style.color = '#fff';
            } else {
                pomStartBtn.textContent = t.sw_btn_start;
                pomStartBtn.style.background = 'var(--text-color)';
                pomStartBtn.style.color = '#000';
            }

            if (statusBadge) {
                statusBadge.textContent = pom.isBreak ? t.pom_badge_break : t.pom_badge_focus;
                statusBadge.style.color = pom.isBreak ? "#30d158" : "var(--accent-color)";
                statusBadge.style.borderColor = pom.isBreak ? "#30d158" : "var(--accent-color)";
                statusBadge.style.background = pom.isBreak ? "rgba(48, 209, 88, 0.08)" : "rgba(255, 149, 0, 0.08)";
            }

            document.querySelectorAll('#pom-presets .preset-pill').forEach(b => {
                b.classList.toggle('active', parseInt(b.getAttribute('data-focus')) === pom.focusDuration && parseInt(b.getAttribute('data-break')) === pom.breakDuration);
            });

            pomStartBtn.onclick = () => {
                if (!pom.isRunning) {
                    pom.isRunning = true;
                    pom.interval = setInterval(runPomodoroTick, 1000);
                    pomStartBtn.textContent = t.sw_btn_pause;
                    pomStartBtn.style.background = '#ff3b30';
                    pomStartBtn.style.color = '#fff';
                } else {
                    pom.isRunning = false;
                    clearInterval(pom.interval);
                    pom.interval = null;
                    pomStartBtn.textContent = t.sw_btn_start;
                    pomStartBtn.style.background = 'var(--text-color)';
                    pomStartBtn.style.color = '#000';
                }
            };

            pomResetBtn.onclick = () => {
                pom.isRunning = false;
                clearInterval(pom.interval);
                pom.interval = null;
                pom.isBreak = false;
                pom.timeLeft = pom.focusDuration * 60;
                if (statusBadge) {
                    statusBadge.textContent = t.pom_badge_focus;
                    statusBadge.style.color = "var(--accent-color)";
                    statusBadge.style.borderColor = "var(--accent-color)";
                    statusBadge.style.background = "rgba(255, 149, 0, 0.08)";
                }
                pomStartBtn.textContent = t.sw_btn_start;
                pomStartBtn.style.background = 'var(--text-color)';
                pomStartBtn.style.color = '#000';
                drawPomodoro();
            };
        }

        document.querySelectorAll('#pom-presets .preset-pill').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('#pom-presets .preset-pill').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const focus = parseInt(btn.getAttribute('data-focus') || "25");
                const breakT = parseInt(btn.getAttribute('data-break') || "5");
                pom.isRunning = false;
                clearInterval(pom.interval);
                pom.interval = null;
                pom.focusDuration = focus;
                pom.breakDuration = breakT;
                pom.isBreak = false;
                pom.timeLeft = focus * 60;
                if (statusBadge) {
                    statusBadge.textContent = t.pom_badge_focus;
                    statusBadge.style.color = "var(--accent-color)";
                    statusBadge.style.borderColor = "var(--accent-color)";
                    statusBadge.style.background = "rgba(255, 149, 0, 0.08)";
                }
                if (pomStartBtn) {
                    pomStartBtn.textContent = t.sw_btn_start;
                    pomStartBtn.style.background = 'var(--text-color)';
                    pomStartBtn.style.color = '#000';
                }
                drawPomodoro();
            };
        });

        drawPomodoro();

    } else if (state.activeView === 'timer') {
        const tm = state.timer;
        const tmStartBtn = document.getElementById('timer-start-btn');
        const tmResetBtn = document.getElementById('timer-reset-btn');

        if (tmStartBtn && tmResetBtn) {
            if (tm.isRunning) {
                tmStartBtn.textContent = t.sw_btn_pause;
                tmStartBtn.style.background = '#ff3b30';
                tmStartBtn.style.color = '#fff';
            } else {
                tmStartBtn.textContent = t.sw_btn_start;
                tmStartBtn.style.background = 'var(--text-color)';
                tmStartBtn.style.color = '#000';
            }

            document.querySelectorAll('#timer-presets .preset-pill').forEach(b => {
                b.classList.toggle('active', parseInt(b.getAttribute('data-seconds')) === tm.duration);
            });

            tmStartBtn.onclick = () => {
                if (!tm.isRunning) {
                    tm.isRunning = true;
                    tm.interval = setInterval(runTimerTick, 1000);
                    tmStartBtn.textContent = t.sw_btn_pause;
                    tmStartBtn.style.background = '#ff3b30';
                    tmStartBtn.style.color = '#fff';
                } else {
                    tm.isRunning = false;
                    clearInterval(tm.interval);
                    tm.interval = null;
                    tmStartBtn.textContent = t.sw_btn_start;
                    tmStartBtn.style.background = 'var(--text-color)';
                    tmStartBtn.style.color = '#000';
                }
            };

            tmResetBtn.onclick = () => {
                tm.isRunning = false;
                clearInterval(tm.interval);
                tm.interval = null;
                tm.timeLeft = tm.duration;
                tmStartBtn.textContent = t.sw_btn_start;
                tmStartBtn.style.background = 'var(--text-color)';
                tmStartBtn.style.color = '#000';
                drawTimer();
            };
        }

        document.querySelectorAll('#timer-presets .preset-pill').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('#timer-presets .preset-pill').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const secs = parseInt(btn.getAttribute('data-seconds') || "1800");
                tm.isRunning = false;
                clearInterval(tm.interval);
                tm.interval = null;
                tm.duration = secs;
                tm.timeLeft = secs;
                if (tmStartBtn) {
                    tmStartBtn.textContent = t.sw_btn_start;
                    tmStartBtn.style.background = 'var(--text-color)';
                    tmStartBtn.style.color = '#000';
                }
                drawTimer();
            };
        });

        drawTimer();

    } else if (state.activeView === 'world-clock') {
        // Fetch available timezones list
        if (availableTimezones.length === 0) {
            fetch('https://timeapi.io/api/TimeZone/AvailableTimeZones')
                .then(r => r.json())
                .then(list => {
                    if (Array.isArray(list) && list.length > 0) availableTimezones = list;
                    else availableTimezones = majorTimezones;
                })
                .catch(() => { availableTimezones = majorTimezones; });
        }

        // Fetch time for any clocks that have no offsetMs yet (first load)
        state.worldClocks.forEach((clockEntry, idx) => {
            if (!clockEntry.offsetMs || clockEntry.offsetMs === 0) {
                fetchTimezoneTime(clockEntry.timezone, clockEntry);
            }
        });

        // Render current clocks
        renderWorldClocks();
        updateAddClockButton();

        // Add timezone button
        const addBtn = document.getElementById('wc-add-btn');
        const searchInput = document.getElementById('timezone-search');
        const dropdown = document.getElementById('timezone-dropdown');

        const renderDropdown = (filterText) => {
            if (!dropdown) return;
            dropdown.innerHTML = '';
            const query = filterText.toLowerCase().trim();
            if (!query) { dropdown.style.display = 'none'; return; }
            const listToUse = availableTimezones.length > 0 ? availableTimezones : majorTimezones;
            const filtered = listToUse.filter(tz => tz.toLowerCase().includes(query)).slice(0, 10);
            if (filtered.length === 0) {
                dropdown.innerHTML = `<div class="timezone-item" style="pointer-events:none;opacity:0.5;">${t.wc_no_results}</div>`;
            } else {
                filtered.forEach(tz => {
                    const item = document.createElement('div');
                    item.className = 'timezone-item';
                    item.textContent = tz.replace(/_/g, ' ');
                    item.onclick = () => {
                        if (state.worldClocks.length >= 6) {
                            showShareToast(t.wc_max_reached);
                            return;
                        }
                        if (searchInput) searchInput.value = '';
                        dropdown.style.display = 'none';
                        const newEntry = { timezone: tz, offsetMs: 0, label: tz.split('/').pop().replace(/_/g, ' ') };
                        state.worldClocks.push(newEntry);
                        saveState();
                        renderWorldClocks();
                        updateAddClockButton();
                        fetchTimezoneTime(tz, newEntry);
                    };
                    dropdown.appendChild(item);
                });
            }
            dropdown.style.display = 'flex';
        };

        if (searchInput) {
            searchInput.placeholder = t.wc_search_placeholder;
            searchInput.oninput = (e) => renderDropdown(e.target.value);
            document.addEventListener('click', (e) => {
                if (dropdown && !dropdown.contains(e.target) && e.target !== searchInput) {
                    dropdown.style.display = 'none';
                }
            });
        }

        if (addBtn) {
            addBtn.onclick = () => {
                if (searchInput) searchInput.focus();
            };
        }
    }

    // Fade out hint toast
    setTimeout(() => {
        const toast = document.getElementById('toast-tip');
        if (toast) toast.style.opacity = '0';
    }, 6000);
});
