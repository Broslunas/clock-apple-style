// Broslunas Clock — Ambient Sound Engine (Web Audio API, no external files needed)

let audioCtx = null;
let ambientNodes = [];
let ambientGainNode = null;
let currentAmbient = 'off';
let ambientVolume = 0.4;

function getAudioCtx() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

function stopAmbient() {
    ambientNodes.forEach(n => {
        try { n.stop(); } catch (e) { /* already stopped */ }
    });
    ambientNodes = [];
    if (ambientGainNode) {
        ambientGainNode.disconnect();
        ambientGainNode = null;
    }
}

// ─── Rain ────────────────────────────────────────────────────
function startRain(ctx, masterGain) {
    // White noise for rain base
    const bufferSize = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.5;
    }
    
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 1400;
    lowpass.Q.value = 0.8;
    
    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 200;
    
    source.connect(lowpass);
    lowpass.connect(highpass);
    highpass.connect(masterGain);
    source.start();
    ambientNodes.push(source);

    // Occasional drop impact (subtle low thump)
    function scheduleDrop() {
        if (currentAmbient !== 'rain') return;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 60 + Math.random() * 40;
        g.gain.setValueAtTime(0.06 * ambientVolume, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
        osc.connect(g);
        g.connect(masterGain);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
        setTimeout(scheduleDrop, 80 + Math.random() * 220);
    }
    scheduleDrop();
}

// ─── Café ────────────────────────────────────────────────────
function startCafe(ctx, masterGain) {
    // Low pink noise (crowd murmur)
    const bufferSize = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 700;
    noise.connect(lp);
    lp.connect(masterGain);
    noise.start();
    ambientNodes.push(noise);

    // Cup clinks
    function scheduleClink() {
        if (currentAmbient !== 'cafe') return;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 1800 + Math.random() * 600;
        const t = ctx.currentTime;
        g.gain.setValueAtTime(0.12 * ambientVolume, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(t);
        osc.stop(t + 0.4);
        setTimeout(scheduleClink, 3000 + Math.random() * 7000);
    }
    setTimeout(scheduleClink, 2000 + Math.random() * 3000);
}

// ─── Forest ──────────────────────────────────────────────────
function startForest(ctx, masterGain) {
    // Wind base (pink noise filtered)
    const bufferSize = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
        b6 = white * 0.115926;
    }
    const wind = ctx.createBufferSource();
    wind.buffer = buffer;
    wind.loop = true;
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 400;
    bandpass.Q.value = 0.4;
    wind.connect(bandpass);
    bandpass.connect(masterGain);
    wind.start();
    ambientNodes.push(wind);

    // Bird chirps
    function scheduleBird() {
        if (currentAmbient !== 'forest') return;
        const freqs = [2200, 2600, 3000, 2800, 3400];
        const numChirps = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < numChirps; i++) {
            setTimeout(() => {
                if (currentAmbient !== 'forest') return;
                const osc = ctx.createOscillator();
                const g = ctx.createGain();
                osc.type = 'sine';
                const baseFreq = freqs[Math.floor(Math.random() * freqs.length)];
                osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.3, ctx.currentTime + 0.08);
                const t = ctx.currentTime;
                g.gain.setValueAtTime(0.08 * ambientVolume, t);
                g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
                osc.connect(g);
                g.connect(masterGain);
                osc.start(t);
                osc.stop(t + 0.2);
            }, i * (100 + Math.random() * 120));
        }
        setTimeout(scheduleBird, 3000 + Math.random() * 8000);
    }
    setTimeout(scheduleBird, 1000 + Math.random() * 3000);
}

// ─── Waves ───────────────────────────────────────────────────
function startWaves(ctx, masterGain) {
    const bufferSize = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.6;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 600;

    // LFO for wave rhythm (~0.15 Hz)
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.15;
    lfoGain.gain.value = 0.5;
    lfo.connect(lfoGain);
    lfoGain.connect(masterGain.gain);
    lfo.start();
    ambientNodes.push(lfo);

    source.connect(lp);
    lp.connect(masterGain);
    source.start();
    ambientNodes.push(source);
}

// ─── Mechanical Keyboard ────────────────────────────────────
function startKeyboard(ctx, masterGain) {
    function scheduleClick() {
        if (currentAmbient !== 'keyboard') return;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = 800 + Math.random() * 400;
        const t = ctx.currentTime;
        g.gain.setValueAtTime(0.15 * ambientVolume, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);

        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 500;

        osc.connect(hp);
        hp.connect(g);
        g.connect(masterGain);
        osc.start(t);
        osc.stop(t + 0.05);

        // Occasional double-tap
        if (Math.random() > 0.7) {
            const osc2 = ctx.createOscillator();
            const g2 = ctx.createGain();
            osc2.type = 'square';
            osc2.frequency.value = 750 + Math.random() * 300;
            const t2 = t + 0.06 + Math.random() * 0.04;
            g2.gain.setValueAtTime(0.1 * ambientVolume, t2);
            g2.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.03);
            const hp2 = ctx.createBiquadFilter();
            hp2.type = 'highpass';
            hp2.frequency.value = 500;
            osc2.connect(hp2);
            hp2.connect(g2);
            g2.connect(masterGain);
            osc2.start(t2);
            osc2.stop(t2 + 0.04);
        }

        setTimeout(scheduleClick, 120 + Math.random() * 280);
    }
    scheduleClick();
}

// ─── Public API ──────────────────────────────────────────────
export function setAmbient(type, vol = ambientVolume) {
    ambientVolume = vol;
    currentAmbient = type;
    stopAmbient();

    if (type === 'off') return;

    const ctx = getAudioCtx();
    ambientGainNode = ctx.createGain();
    ambientGainNode.gain.value = vol;
    ambientGainNode.connect(ctx.destination);

    switch (type) {
        case 'rain':      startRain(ctx, ambientGainNode);     break;
        case 'cafe':      startCafe(ctx, ambientGainNode);     break;
        case 'forest':    startForest(ctx, ambientGainNode);   break;
        case 'waves':     startWaves(ctx, ambientGainNode);    break;
        case 'keyboard':  startKeyboard(ctx, ambientGainNode); break;
    }
}

export function setAmbientVolume(vol) {
    ambientVolume = vol;
    if (ambientGainNode) {
        ambientGainNode.gain.setTargetAtTime(vol, audioCtx.currentTime, 0.1);
    }
}

export function getAmbient() {
    return currentAmbient;
}

export function getAmbientVolume() {
    return ambientVolume;
}
