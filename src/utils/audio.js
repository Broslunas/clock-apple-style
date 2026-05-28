// Web Audio API Sound Synthesizer for Broslunas Clock
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

// Synthesize a premium, ultra-subtle, organic tick (ideal for concentration)
export const playFlipSound = () => {
    if (isMuted) return;
    initAudio();
    if (!audioCtx) return;

    try {
        const now = audioCtx.currentTime;

        // 1. Extremely soft paper brush (simulating a soft page turn / leaf strike)
        const bufferSize = audioCtx.sampleRate * 0.015; // 15ms
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noiseNode = audioCtx.createBufferSource();
        noiseNode.buffer = buffer;

        const noiseFilter = audioCtx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(2500, now);
        noiseFilter.Q.setValueAtTime(3, now);

        const noiseGain = audioCtx.createGain();
        noiseGain.gain.setValueAtTime(0.006, now); // Extremely quiet brush
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.01);

        noiseNode.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(audioCtx.destination);

        // 2. Gentle, low-frequency warm sine bump (tactile feel without sharp transients)
        const sineOsc = audioCtx.createOscillator();
        sineOsc.type = 'sine';
        sineOsc.frequency.setValueAtTime(140, now);
        sineOsc.frequency.exponentialRampToValueAtTime(70, now + 0.025);

        const sineGain = audioCtx.createGain();
        sineGain.gain.setValueAtTime(0.03, now); // Warm, round tick bump
        sineGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

        sineOsc.connect(sineGain);
        sineGain.connect(audioCtx.destination);

        // Start both nodes
        noiseNode.start(now);
        noiseNode.stop(now + 0.015);

        sineOsc.start(now);
        sineOsc.stop(now + 0.03);
    } catch (e) {
        console.warn("Failed to play flip sound:", e);
    }
};

// Play a relaxing, meditative Zen Tibetan Singing Bowl loop for alarms
export const startAlarmSound = () => {
    if (isMuted) return;
    initAudio();
    if (!audioCtx) return;

    // Avoid double alarm playing
    if (alarmInterval) return;

    const playChimeNode = () => {
        if (isMuted || !audioCtx) return;
        const now = audioCtx.currentTime;

        // Zen Singing Bowl harmonics (fundamental + slightly detuned overtones for warm vibrato/beating)
        const harmonics = [
            { freq: 220, gainVal: 0.08, decay: 5.5, attack: 0.15 },      // Fundamental (A3)
            { freq: 220.5, gainVal: 0.06, decay: 5.2, attack: 0.2 },     // Beating tone
            { freq: 440, gainVal: 0.04, decay: 4.5, attack: 0.1 },      // Octave (A4)
            { freq: 660, gainVal: 0.02, decay: 3.8, attack: 0.25 },     // Perfect fifth (E5)
            { freq: 880, gainVal: 0.01, decay: 3.0, attack: 0.08 }      // Double octave (A5)
        ];
        
        harmonics.forEach(({ freq, gainVal, decay, attack }) => {
            try {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now);
                
                gain.gain.setValueAtTime(0.0, now);
                gain.gain.linearRampToValueAtTime(gainVal, now + attack); // Smooth mallet-like attack
                gain.gain.exponentialRampToValueAtTime(0.001, now + decay); // Soothing, long decay
                
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                
                osc.start(now);
                osc.stop(now + decay + 0.1);
                
                const oscRef = { osc, gain };
                alarmOscillators.push(oscRef);
                
                // Clean up oscillator references once stopped
                setTimeout(() => {
                    alarmOscillators = alarmOscillators.filter(item => item !== oscRef);
                }, (decay + 0.5) * 1000);
            } catch (e) {
                console.warn("Error creating alarm node:", e);
            }
        });
    };

    // Play immediately and then repeat every 6 seconds (providing space for concentration)
    playChimeNode();
    alarmInterval = setInterval(playChimeNode, 6000);
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
