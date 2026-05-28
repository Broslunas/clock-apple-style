// Unified client-side controller for Broslunas Clock
import { 
    playFlipSound, 
    startAlarmSound, 
    stopAlarmSound, 
    setMute, 
    getMute 
} from './audio.js';
import { navigate } from 'astro:transitions/client';

// --- BASE DE DATOS DE TEMAS PREDEFINIDOS ---
const themes = [
    { name: "🍎 Mac Classic", bg: "linear-gradient(135deg, #0e0e10, #17171a)", card: "#2c2c2e", text: "#ffffff", pageText: "#ffffff", accent: "#ff9500" },
    { name: "✨ macOS Sonoma", bg: "linear-gradient(135deg, #b893f0, #e8a0ab, #89bde0)", card: "rgba(255,255,255,0.76)", text: "#1c1c1f", pageText: "#ffffff", accent: "#5e5ce6" },
    { name: "⌚ watchOS Ultra", bg: "linear-gradient(135deg, #000000, #0a0a0a)", card: "#161617", text: "#ff453a", pageText: "#ff453a", accent: "#ff453a" },
    { name: "🍊 Hermès Special", bg: "linear-gradient(135deg, #111112, #212124)", card: "#ff9500", text: "#000000", pageText: "#ff9500", accent: "#ff9500" },
    { name: "🧊 Glass Minimal", bg: "linear-gradient(135deg, #e5e5ea, #d1d1d6)", card: "rgba(255, 255, 255, 0.8)", text: "#1d1d1f", pageText: "#1d1d1f", accent: "#007aff" },
    { name: "🌌 iOS Aurora", bg: "linear-gradient(135deg, #0a1128, #1c0a35)", card: "rgba(255,255,255,0.12)", text: "#ffffff", pageText: "#f4f4f5", accent: "#bf5af2" },
    { name: "🎨 Apple Arcade", bg: "linear-gradient(135deg, #ff2d55, #ff9500)", card: "#ffffff", text: "#ff2d55", pageText: "#ffffff", accent: "#ff2d55" },
    { name: "🏁 Stealth Dark", bg: "linear-gradient(135deg, #000000, #040405)", card: "#0a0a0b", text: "rgba(255,255,255,0.22)", pageText: "rgba(255,255,255,0.45)", accent: "#8e8e93" }
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
        focusDuration: 25, // minutos
        breakDuration: 5,  // minutos
        timeLeft: 25 * 60,  // segundos
        interval: null
    },
    timer: {
        isRunning: false,
        duration: 1800,  // 30 min (segundos)
        timeLeft: 1800,
        interval: null
    },
    loopsInitialized: false
};

const state = window.broslunasState;

let soundThrottleTimeout = null;
function triggerFlipSoundThrottled() {
    if (soundThrottleTimeout || !state.isMechSounds || state.isMuted) return;
    playFlipSound();
    soundThrottleTimeout = setTimeout(() => {
        soundThrottleTimeout = null;
    }, 40);
}

// --- ACTUALIZADOR DE TARJETAS FLIP ---
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

// --- PERSISTENCIA LOCAL STORAGE ---
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
            alarms: state.alarms
        };
        localStorage.setItem('apple_flip_clock_state', JSON.stringify(toSave));
    } catch (e) {
        console.warn("Error guardando localStorage:", e);
    }
}

// --- MANEJO DE TEMAS ---
function applyTheme(theme) {
    document.documentElement.style.setProperty('--bg-gradient', theme.bg);
    document.documentElement.style.setProperty('--flip-bg', theme.card);
    document.documentElement.style.setProperty('--flip-text', theme.text);
    document.documentElement.style.setProperty('--text-color', theme.pageText);
    document.documentElement.style.setProperty('--accent-color', theme.accent);
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

// --- SISTEMA DE ALARMAS ---
function addAlarm(hr, min, label) {
    const newAlarm = {
        id: Date.now().toString(),
        hour: hr,
        minute: min,
        label: label || "Alarma",
        active: true
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

function drawAlarmsList() {
    const list = document.getElementById('sidebar-alarms-list');
    if (!list) return;

    if (state.alarms.length === 0) {
        list.innerHTML = '<p class="empty-list-text">No hay alarmas configuradas.</p>';
        return;
    }

    list.innerHTML = '';
    state.alarms.forEach(alarm => {
        const item = document.createElement('div');
        item.className = 'alarm-item';
        
        const hrStr = String(alarm.hour).padStart(2, '0');
        const minStr = String(alarm.minute).padStart(2, '0');

        item.innerHTML = `
            <div class="alarm-info">
                <span class="alarm-time">${hrStr}:${minStr}</span>
                <span class="alarm-lbl">${alarm.label}</span>
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

// --- DISPARADOR DE OVERLAY DE ALARMA ---
let triggeredAlarmData = null;
function triggerAlarm(alarm) {
    triggeredAlarmData = alarm;
    
    const overlay = document.getElementById('alarm-triggered-overlay');
    const labelEl = document.getElementById('triggered-alarm-label');
    const timeEl = document.getElementById('triggered-alarm-time');

    if (labelEl) labelEl.textContent = alarm.label || "¡Alarma!";
    if (timeEl) {
        const h = String(alarm.hour).padStart(2, '0');
        const m = String(alarm.minute).padStart(2, '0');
        timeEl.textContent = `${h}:${m}`;
    }

    if (overlay) overlay.style.display = 'flex';
    startAlarmSound();
}

function dismissAlarm() {
    stopAlarmSound();
    const overlay = document.getElementById('alarm-triggered-overlay');
    if (overlay) overlay.style.display = 'none';

    if (triggeredAlarmData && triggeredAlarmData.id) {
        if (state.alarms.some(a => a.id === triggeredAlarmData.id)) {
            const activeAlarm = state.alarms.find(a => a.id === triggeredAlarmData.id);
            if (activeAlarm) activeAlarm.active = false;
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
            label: `Pospuesto: ${triggeredAlarmData.label}`,
            active: true
        };
        
        state.alarms.push(snoozeAlarmObj);
        saveState();
        drawAlarmsList();
        updateActiveAlarmBadge();
    }
    triggeredAlarmData = null;
}

// Chequeo de alarmas cada minuto
let lastCheckedMinute = -1;
function checkAlarms() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();

    if (currentMin === lastCheckedMinute) return;
    lastCheckedMinute = currentMin;

    state.alarms.forEach(alarm => {
        if (alarm.active && alarm.hour === currentHour && alarm.minute === currentMin) {
            triggerAlarm(alarm);
        }
    });
}

// --- VISTA 1: CONTROLADOR DE RELOJ ---
function updateClock() {
    if (state.activeView !== 'clock') return;

    const now = new Date();
    
    const dateOptions = { weekday: 'long', day: 'numeric', month: 'long' };
    const dateEl = document.getElementById('clock-date');
    if (dateEl) {
        dateEl.textContent = now.toLocaleDateString('es-ES', dateOptions).toUpperCase();
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

// --- VISTA 2: CONTROLADOR CRONÓMETRO ---
function drawStopwatch() {
    const time = state.stopwatch.elapsedTime;
    
    const mins = Math.floor(time / 60000);
    const secs = Math.floor((time % 60000) / 1000);
    const ms = Math.floor((time % 1000) / 10);

    const mStr = String(mins).padStart(2, '0');
    const sStr = String(secs).padStart(2, '0');
    const msStr = String(ms).padStart(2, '0');

    updateCardIfNeeded('sw-m1', mStr[0]);
    updateCardIfNeeded('sw-m2', mStr[1]);
    updateCardIfNeeded('sw-s1', sStr[0]);
    updateCardIfNeeded('sw-s2', sStr[1]);
    updateCardIfNeeded('sw-ms1', msStr[0]);
    updateCardIfNeeded('sw-ms2', msStr[1]);
}

function runStopwatchLoop() {
    const now = Date.now();
    state.stopwatch.elapsedTime = now - state.stopwatch.startTime;
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
        tr.innerHTML = `
            <td>Vuelta ${lap.num}</td>
            <td>+${formatTimeMs(lap.delta)}</td>
            <td>${formatTimeMs(lap.total)}</td>
        `;
        list.appendChild(tr);
    });
}

// --- VISTA 3: CONTROLADOR POMODORO ---
function drawPomodoro() {
    const minutes = Math.floor(state.pomodoro.timeLeft / 60);
    const seconds = state.pomodoro.timeLeft % 60;

    const mStr = String(minutes).padStart(2, '0');
    const sStr = String(seconds).padStart(2, '0');

    updateCardIfNeeded('pom-m1', mStr[0]);
    updateCardIfNeeded('pom-m2', mStr[1]);
    updateCardIfNeeded('pom-s1', sStr[0]);
    updateCardIfNeeded('pom-s2', sStr[1]);

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
    const nextBreakState = !pom.isBreak;
    
    triggerAlarm({
        id: 'pomodoro-system',
        hour: new Date().getHours(),
        minute: new Date().getMinutes(),
        label: pom.isBreak ? "¡Descanso Terminado! A trabajar." : "¡Focus Terminado! Momento de descansar."
    });

    pom.isBreak = nextBreakState;
    pom.timeLeft = (pom.isBreak ? pom.breakDuration : pom.focusDuration) * 60;
    pom.isRunning = false;
    clearInterval(pom.interval);
    pom.interval = null;

    const statusBadge = document.getElementById('pomodoro-status');
    if (statusBadge) {
        statusBadge.textContent = pom.isBreak ? "DESCANSO" : "TRABAJO";
        statusBadge.style.color = pom.isBreak ? "#30d158" : "var(--accent-color)";
        statusBadge.style.borderColor = pom.isBreak ? "#30d158" : "var(--accent-color)";
        statusBadge.style.background = pom.isBreak ? "rgba(48, 209, 88, 0.08)" : "rgba(255, 149, 0, 0.08)";
    }

    const pomStartBtn = document.getElementById('pom-start-btn');
    if (pomStartBtn) {
        pomStartBtn.textContent = 'Iniciar';
        pomStartBtn.style.background = 'var(--text-color)';
        pomStartBtn.style.color = '#000';
    }

    drawPomodoro();
}

function runPomodoroTick() {
    const pom = state.pomodoro;
    if (pom.timeLeft <= 0) {
        triggerPomodoroEnd();
        return;
    }
    pom.timeLeft--;
    drawPomodoro();
}

// --- VISTA 4: CONTROLADOR TEMPORIZADOR (TIMER) ---
function drawTimer() {
    const hours = Math.floor(state.timer.timeLeft / 3600);
    const minutes = Math.floor((state.timer.timeLeft % 3600) / 60);
    const seconds = state.timer.timeLeft % 60;

    const hStr = String(hours).padStart(2, '0');
    const mStr = String(minutes).padStart(2, '0');
    const sStr = String(seconds).padStart(2, '0');

    updateCardIfNeeded('tm-h1', hStr[0]);
    updateCardIfNeeded('tm-h2', hStr[1]);
    updateCardIfNeeded('tm-m1', mStr[0]);
    updateCardIfNeeded('tm-m2', mStr[1]);
    updateCardIfNeeded('tm-s1', sStr[0]);
    updateCardIfNeeded('tm-s2', sStr[1]);

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
        label: "Temporizador Terminado"
    });

    tm.timeLeft = tm.duration;
    tm.isRunning = false;
    clearInterval(tm.interval);
    tm.interval = null;

    const tmStartBtn = document.getElementById('timer-start-btn');
    if (tmStartBtn) {
        tmStartBtn.textContent = 'Iniciar';
        tmStartBtn.style.background = 'var(--text-color)';
        tmStartBtn.style.color = '#000';
    }

    drawTimer();
}

function runTimerTick() {
    const tm = state.timer;
    if (tm.timeLeft <= 0) {
        triggerTimerEnd();
        return;
    }
    tm.timeLeft--;
    drawTimer();
}

// --- AJUSTES Y BINDEOS LATERALES ---
function toggleSettings() {
    const settingsSidebar = document.getElementById('settings-sidebar');
    if (settingsSidebar) {
        settingsSidebar.classList.toggle('open');
    }
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

// ==========================================
// INITIALIZATION AND PAGE EVENT BINDINGS
// ==========================================

const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

// --- ONE-TIME INITIALIZATION (Runs once per session) ---
if (!state.loopsInitialized) {
    loadSavedState();
    
    // Background Loops
    setInterval(() => {
        updateClock();
        checkAlarms();
    }, 200);

    // Document / Window Level Listeners (Only register once!)
    window.addEventListener('keydown', (e) => {
        const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
        if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return;

        const key = e.key.toLowerCase();

        // Alarm overlay handlers
        if (triggeredAlarmData) {
            if (key === 'd' || key === 'escape' || key === 'enter') {
                e.preventDefault();
                dismissAlarm();
                return;
            }
            if (key === 's') {
                e.preventDefault();
                snoozeAlarm();
                return;
            }
        }

        // Sidebar and Settings
        if (key === 'h' || key === 'escape') {
            e.preventDefault();
            toggleSidebar();
            return;
        }
        if (key === '.') {
            e.preventDefault();
            toggleSettings();
            return;
        }

        // Fullscreen
        if (key === 'f') {
            e.preventDefault();
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(err => {
                    console.warn("Fullscreen error:", err);
                });
            } else {
                if (document.exitFullscreen) document.exitFullscreen();
            }
            return;
        }

        // Mute
        if (key === 'm') {
            e.preventDefault();
            state.isMuted = !state.isMuted;
            setMute(state.isMuted);
            updateMuteUI();
            saveState();
            return;
        }

        // View Navigations (Router-friendly!)
        if (key === '1' || key === 'c') {
            e.preventDefault();
            navigate('/');
            return;
        }
        if (key === '2' || key === 's') {
            e.preventDefault();
            navigate('/stopwatch');
            return;
        }
        if (key === '3' || key === 'p') {
            e.preventDefault();
            navigate('/pomodoro');
            return;
        }
        if (key === '4' || key === 't') {
            e.preventDefault();
            navigate('/timer');
            return;
        }

        // Play/Pause Action (Space)
        if (e.key === ' ') {
            e.preventDefault();
            if (state.activeView === 'stopwatch') {
                document.getElementById('sw-start-btn')?.click();
            } else if (state.activeView === 'pomodoro') {
                document.getElementById('pom-start-btn')?.click();
            } else if (state.activeView === 'timer') {
                document.getElementById('timer-start-btn')?.click();
            }
            return;
        }

        // Reset Action (R)
        if (key === 'r') {
            e.preventDefault();
            if (state.activeView === 'stopwatch') {
                document.getElementById('sw-reset-btn')?.click();
            } else if (state.activeView === 'pomodoro') {
                document.getElementById('pom-reset-btn')?.click();
            } else if (state.activeView === 'timer') {
                document.getElementById('timer-reset-btn')?.click();
            }
            return;
        }

        // Lap Action (L)
        if (key === 'l') {
            e.preventDefault();
            if (state.activeView === 'stopwatch') {
                document.getElementById('sw-lap-btn')?.click();
            }
            return;
        }
    });

    // Close sidebar click outside
    document.addEventListener('click', (e) => {
        const sidebar = document.getElementById('app-sidebar');
        const hamburgerBtn = document.getElementById('hamburger-btn');
        if (sidebar && sidebar.classList.contains('open') && hamburgerBtn) {
            if (!sidebar.contains(e.target) && !hamburgerBtn.contains(e.target)) {
                toggleSidebar();
            }
        }
    });

    // 3D Parallax tilt
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

// --- SETUP RUNS ON EVERY PAGE TRANSITION (astro:page-load) ---
document.addEventListener('astro:page-load', () => {
    // 1. Determine active view based on url path
    const path = window.location.pathname;
    if (path === '/' || path.endsWith('/index.html')) {
        state.activeView = 'clock';
    } else if (path.includes('/stopwatch')) {
        state.activeView = 'stopwatch';
    } else if (path.includes('/pomodoro')) {
        state.activeView = 'pomodoro';
    } else if (path.includes('/timer')) {
        state.activeView = 'timer';
    }

    // 2. Sync Sidebar link states
    document.querySelectorAll('.menu-item[data-view]').forEach(item => {
        const itemVal = item.getAttribute('data-view');
        if (itemVal === state.activeView) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Auto collapse sidebar in mobile when navigating
    const sidebar = document.getElementById('app-sidebar');
    if (sidebar && sidebar.classList.contains('open') && window.innerWidth <= 600) {
        toggleSidebar();
    }

    // 3. Apply Current Theme
    if (state.customTheme) {
        applyTheme(state.customTheme);
    } else {
        applyTheme(themes[state.activeThemeIndex]);
    }

    // 4. Bind Settings Panel Event Listeners
    const format24hCheckbox = document.getElementById('setting-format-24h');
    if (format24hCheckbox) {
        format24hCheckbox.checked = state.format24h;
        format24hCheckbox.onchange = (e) => {
            state.format24h = e.target.checked;
            saveState();
            updateClock();
        };
    }

    const showSecondsCheckbox = document.getElementById('setting-show-seconds');
    if (showSecondsCheckbox) {
        showSecondsCheckbox.checked = state.showSeconds;
        showSecondsCheckbox.onchange = (e) => {
            state.showSeconds = e.target.checked;
            saveState();
            updateClock();
        };
    }

    const mechSoundsCheckbox = document.getElementById('setting-mech-sounds');
    if (mechSoundsCheckbox) {
        mechSoundsCheckbox.checked = state.isMechSounds;
        mechSoundsCheckbox.onchange = (e) => {
            state.isMechSounds = e.target.checked;
            saveState();
        };
    }

    // Themes selection list setup
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

    // Custom Theme Builder binding
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
            const cardRgba = `rgba(${r}, ${g}, ${b}, ${opacity})`;

            const custom = {
                name: "Personalizado",
                bg: `linear-gradient(135deg, ${bg1}, ${bg2})`,
                card: cardRgba,
                text: textColor,
                pageText: textColor,
                accent: textColor
            };
            applyCustomTheme(custom);
        };
    }

    // 5. Alarms list setup & Bindings
    const addAlarmBtn = document.getElementById('add-alarm-btn');
    if (addAlarmBtn) {
        addAlarmBtn.onclick = () => {
            const hrInput = document.getElementById('alarm-hour');
            const minInput = document.getElementById('alarm-minute');
            const lblInput = document.getElementById('alarm-label');

            let hr = parseInt(hrInput.value);
            let min = parseInt(minInput.value);
            let label = lblInput.value.trim();

            if (isNaN(hr) || hr < 0 || hr > 23 || isNaN(min) || min < 0 || min > 59) {
                alert("Por favor introduce una hora (0-23) y minutos (0-59) válidos.");
                return;
            }

            addAlarm(hr, min, label);

            hrInput.value = '';
            minInput.value = '';
            lblInput.value = '';
        };
    }

    drawAlarmsList();
    updateActiveAlarmBadge();

    // 6. Bind Mute Trigger and Sync UI
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

    // Bind sidebar Settings toggle buttons
    const sidebarSettingsBtn = document.getElementById('sidebar-settings-btn');
    const closeSettingsBtn = document.getElementById('close-settings-btn');
    if (sidebarSettingsBtn) sidebarSettingsBtn.onclick = toggleSettings;
    if (closeSettingsBtn) closeSettingsBtn.onclick = toggleSettings;

    // Bind hamburger btn click handler
    const hamburgerBtn = document.getElementById('hamburger-btn');
    if (hamburgerBtn) {
        // Re-toggle listener (as the button template is persisted but we need handler bindings)
        hamburgerBtn.onclick = toggleSidebar;
    }

    // 7. Bind Alarm Triggered Overlay buttons
    document.getElementById('btn-alarm-dismiss')?.addEventListener('click', dismissAlarm);
    document.getElementById('btn-alarm-snooze')?.addEventListener('click', snoozeAlarm);

    // If an alarm is active and ringing, pop overlay back on new page!
    if (triggeredAlarmData) {
        triggerAlarm(triggeredAlarmData);
    }

    // 8. Bind View-Specific Controls and Sync States
    if (state.activeView === 'clock') {
        updateClock();
    } else if (state.activeView === 'stopwatch') {
        const sw = state.stopwatch;
        const swStartBtn = document.getElementById('sw-start-btn');
        const swLapBtn = document.getElementById('sw-lap-btn');
        const swResetBtn = document.getElementById('sw-reset-btn');

        if (swStartBtn && swLapBtn && swResetBtn) {
            // Re-sync UI states
            if (sw.isRunning) {
                swStartBtn.textContent = 'Pausa';
                swStartBtn.style.background = '#ff3b30';
                swStartBtn.style.color = '#fff';
                swLapBtn.disabled = false;
                swResetBtn.disabled = true;
            } else {
                swStartBtn.textContent = 'Iniciar';
                swStartBtn.style.background = 'var(--text-color)';
                swStartBtn.style.color = '#000';
                swLapBtn.disabled = true;
                swResetBtn.disabled = sw.elapsedTime === 0;
            }

            // Click Handlers
            swStartBtn.onclick = () => {
                if (!sw.isRunning) {
                    sw.isRunning = true;
                    sw.startTime = Date.now() - sw.elapsedTime;
                    sw.interval = setInterval(runStopwatchLoop, 30);
                    
                    swStartBtn.textContent = 'Pausa';
                    swStartBtn.style.background = '#ff3b30';
                    swStartBtn.style.color = '#fff';
                    swLapBtn.disabled = false;
                    swResetBtn.disabled = true;
                } else {
                    sw.isRunning = false;
                    clearInterval(sw.interval);
                    sw.interval = null;

                    swStartBtn.textContent = 'Iniciar';
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
                const lapDelta = lapTime - lastLapTotal;

                sw.laps.unshift({
                    num: sw.laps.length + 1,
                    delta: lapDelta,
                    total: lapTime
                });
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

                swStartBtn.textContent = 'Iniciar';
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
            // Re-sync UI states
            if (pom.isRunning) {
                pomStartBtn.textContent = 'Pausa';
                pomStartBtn.style.background = '#ff3b30';
                pomStartBtn.style.color = '#fff';
            } else {
                pomStartBtn.textContent = 'Iniciar';
                pomStartBtn.style.background = 'var(--text-color)';
                pomStartBtn.style.color = '#000';
            }

            if (statusBadge) {
                statusBadge.textContent = pom.isBreak ? "DESCANSO" : "TRABAJO";
                statusBadge.style.color = pom.isBreak ? "#30d158" : "var(--accent-color)";
                statusBadge.style.borderColor = pom.isBreak ? "#30d158" : "var(--accent-color)";
                statusBadge.style.background = pom.isBreak ? "rgba(48, 209, 88, 0.08)" : "rgba(255, 149, 0, 0.08)";
            }

            // Sync preset pills active styling
            document.querySelectorAll('#pom-presets .preset-pill').forEach(b => {
                const f = parseInt(b.getAttribute('data-focus'));
                const br = parseInt(b.getAttribute('data-break'));
                if (f === pom.focusDuration && br === pom.breakDuration) {
                    b.classList.add('active');
                } else {
                    b.classList.remove('active');
                }
            });

            pomStartBtn.onclick = () => {
                if (!pom.isRunning) {
                    pom.isRunning = true;
                    pom.interval = setInterval(runPomodoroTick, 1000);
                    pomStartBtn.textContent = 'Pausa';
                    pomStartBtn.style.background = '#ff3b30';
                    pomStartBtn.style.color = '#fff';
                } else {
                    pom.isRunning = false;
                    clearInterval(pom.interval);
                    pom.interval = null;
                    pomStartBtn.textContent = 'Iniciar';
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
                    statusBadge.textContent = "TRABAJO";
                    statusBadge.style.color = "var(--accent-color)";
                    statusBadge.style.borderColor = "var(--accent-color)";
                    statusBadge.style.background = "rgba(255, 149, 0, 0.08)";
                }

                pomStartBtn.textContent = 'Iniciar';
                pomStartBtn.style.background = 'var(--text-color)';
                pomStartBtn.style.color = '#000';
                
                drawPomodoro();
            };
        }

        // Preset buttons
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
                    statusBadge.textContent = "TRABAJO";
                    statusBadge.style.color = "var(--accent-color)";
                    statusBadge.style.borderColor = "var(--accent-color)";
                    statusBadge.style.background = "rgba(255, 149, 0, 0.08)";
                }

                if (pomStartBtn) {
                    pomStartBtn.textContent = 'Iniciar';
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
            // Re-sync UI states
            if (tm.isRunning) {
                tmStartBtn.textContent = 'Pausa';
                tmStartBtn.style.background = '#ff3b30';
                tmStartBtn.style.color = '#fff';
            } else {
                tmStartBtn.textContent = 'Iniciar';
                tmStartBtn.style.background = 'var(--text-color)';
                tmStartBtn.style.color = '#000';
            }

            // Sync presets styling
            document.querySelectorAll('#timer-presets .preset-pill').forEach(b => {
                const s = parseInt(b.getAttribute('data-seconds'));
                if (s === tm.duration) {
                    b.classList.add('active');
                } else {
                    b.classList.remove('active');
                }
            });

            tmStartBtn.onclick = () => {
                if (!tm.isRunning) {
                    tm.isRunning = true;
                    tm.interval = setInterval(runTimerTick, 1000);
                    tmStartBtn.textContent = 'Pausa';
                    tmStartBtn.style.background = '#ff3b30';
                    tmStartBtn.style.color = '#fff';
                } else {
                    tm.isRunning = false;
                    clearInterval(tm.interval);
                    tm.interval = null;
                    tmStartBtn.textContent = 'Iniciar';
                    tmStartBtn.style.background = 'var(--text-color)';
                    tmStartBtn.style.color = '#000';
                }
            };

            tmResetBtn.onclick = () => {
                tm.isRunning = false;
                clearInterval(tm.interval);
                tm.interval = null;
                tm.timeLeft = tm.duration;

                tmStartBtn.textContent = 'Iniciar';
                tmStartBtn.style.background = 'var(--text-color)';
                tmStartBtn.style.color = '#000';
                
                drawTimer();
            };
        }

        // Preset buttons
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
                    tmStartBtn.textContent = 'Iniciar';
                    tmStartBtn.style.background = 'var(--text-color)';
                    tmStartBtn.style.color = '#000';
                }

                drawTimer();
            };
        });

        drawTimer();
    }

    // Fade out keyboard hints toast
    setTimeout(() => {
        const toast = document.getElementById('toast-tip');
        if (toast) toast.style.opacity = '0';
    }, 6000);
});
