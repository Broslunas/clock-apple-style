// Web Audio API Sound Synthesizer for Apple Flip Clock Pro
let audioCtx = null;
let isMuted = false;
let alarmInterval = null;
let alarmOscillators = [];

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

export const setMute = (mute) => {
    isMuted = mute;
    if (audioCtx && mute) {
        // Suspend context to make sure no sound gets through
    } else if (audioCtx && !mute) {
        audioCtx.resume();
    }
};

export const getMute = () => isMuted;

// Synthesize a realistic mechanical flip click
export const playFlipSound = () => {
    if (isMuted) return;
    initAudio();
    if (!audioCtx) return;

    try {
        const now = audioCtx.currentTime;

        // 1. High frequency mechanical leaf strike (click/scrape)
        // Create noise buffer
        const bufferSize = audioCtx.sampleRate * 0.02; // 20ms of noise
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noiseNode = audioCtx.createBufferSource();
        noiseNode.buffer = buffer;

        const noiseFilter = audioCtx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(3200, now);
        noiseFilter.Q.setValueAtTime(4, now);

        const noiseGain = audioCtx.createGain();
        noiseGain.gain.setValueAtTime(0.08, now); // soft strike
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

        noiseNode.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(audioCtx.destination);

        // 2. Low-mid mechanical thud/body vibration
        const thudOsc = audioCtx.createOscillator();
        thudOsc.type = 'triangle';
        thudOsc.frequency.setValueAtTime(95, now);
        thudOsc.frequency.exponentialRampToValueAtTime(40, now + 0.05);

        const thudFilter = audioCtx.createBiquadFilter();
        thudFilter.type = 'lowpass';
        thudFilter.frequency.setValueAtTime(200, now);

        const thudGain = audioCtx.createGain();
        thudGain.gain.setValueAtTime(0.35, now); // thud strength
        thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        thudOsc.connect(thudFilter);
        thudFilter.connect(thudGain);
        thudGain.connect(audioCtx.destination);

        // Start both
        noiseNode.start(now);
        noiseNode.stop(now + 0.02);

        thudOsc.start(now);
        thudOsc.stop(now + 0.06);
    } catch (e) {
        console.warn("Failed to play flip sound:", e);
    }
};

// Play a premium harmonic bell/chime loop for alarms
export const startAlarmSound = () => {
    if (isMuted) return;
    initAudio();
    if (!audioCtx) return;

    // Avoid double alarm playing
    if (alarmInterval) return;

    const playChimeNode = () => {
        if (isMuted || !audioCtx) return;
        const now = audioCtx.currentTime;

        // Frecuencias para un acorde Apple clásico (La mayor 9: A, C#, E, B)
        const freqs = [440, 554.37, 659.25, 880];
        
        freqs.forEach((freq, index) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + (index * 0.08)); // arpegiado
            
            gain.gain.setValueAtTime(0.0, now);
            gain.gain.linearRampToValueAtTime(0.12, now + (index * 0.08) + 0.05); // ataque suave
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2); // desvanecimiento largo tipo campana

            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.start(now);
            osc.stop(now + 1.5);
            
            alarmOscillators.push({ osc, gain });
        });
    };

    // Play immediately and then repeat every 1.5s
    playChimeNode();
    alarmInterval = setInterval(playChimeNode, 1500);
};

export const stopAlarmSound = () => {
    if (alarmInterval) {
        clearInterval(alarmInterval);
        alarmInterval = null;
    }
    
    // Stop any active oscillators
    try {
        alarmOscillators.forEach(({ osc }) => {
            osc.stop();
        });
    } catch (e) {
        // Already stopped
    }
    alarmOscillators = [];
};
