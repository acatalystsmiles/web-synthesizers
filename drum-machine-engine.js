// Advanced Drum Machine Engine
class DrumMachine {
    constructor() {
        this.isPlaying = false;
        this.currentStep = 0;
        this.stepCount = 16;
        this.drums = {};
        this.rollActive = false;
        this.rollTime = '32n';
        this.rollDepth = 4;
        this.initializeAudio();
        this.initializePatterns();
        this.setupTempoSync();
    }

    setupTempoSync() {
        try {
            this.syncChannel = new BroadcastChannel('music_tempo_sync');
            this.syncChannel.onmessage = (event) => {
                if (event.data.type === 'tempo' && !this.isBroadcasting) {
                    this.updateTempo(event.data.value);
                    this.showSyncIndicator();
                    if (knobs.tempo) {
                        knobs.tempo.setValue(event.data.value);
                        document.querySelector('[data-value="tempo"]').textContent = Math.round(event.data.value);
                    }
                }
            };
        } catch (e) {
            console.log('BroadcastChannel not supported');
        }
        this.isBroadcasting = false;
    }

    showSyncIndicator() {
        const indicator = document.getElementById('sync-indicator');
        indicator.classList.add('active');
        setTimeout(() => indicator.classList.remove('active'), 200);
    }

    broadcastTempo(tempo) {
        if (this.syncChannel) {
            this.isBroadcasting = true;
            this.syncChannel.postMessage({ type: 'tempo', value: tempo });
            setTimeout(() => this.isBroadcasting = false, 100);
        }
    }

    async initializeAudio() {
        // Master volume
        this.masterVolume = new Tone.Volume(-6).toDestination();

        // Shared reverb for all drums
        this.masterReverb = new Tone.Reverb({
            decay: 2,
            wet: 1 // Reverb send will control amount
        }).connect(this.masterVolume);

        await this.masterReverb.generate();

        // Create drum voices
        this.createDrumVoices();

        this.tempo = 120;
        this.swing = 0;
    }

    createDrumVoices() {
        // KICK
        const kickOsc = new Tone.Oscillator(60, 'sine').start();
        const kickEnv = new Tone.AmplitudeEnvelope({
            attack: 0.001,
            decay: 0.3,
            sustain: 0,
            release: 0.3
        });

        const kickDry = new Tone.Gain(1).connect(this.masterVolume);
        const kickReverbSend = new Tone.Gain(0).connect(this.masterReverb);

        kickEnv.connect(kickDry);
        kickEnv.connect(kickReverbSend);

        this.drums.kick = {
            name: 'Kick',
            osc: kickOsc,
            envelope: kickEnv,
            volume: new Tone.Volume(0),
            reverbSend: kickReverbSend,
            basePitch: 60,
            trigger: (time, velocity) => {
                const vel = velocity * this.drums.kick.velocityScale;
                kickOsc.frequency.setValueAtTime(this.drums.kick.tone, time);
                kickOsc.frequency.exponentialRampToValueAtTime(this.drums.kick.basePitch, time + 0.3);
                kickEnv.triggerAttackRelease(0.3, time, vel);
            },
            pattern: Array(16).fill({ active: false, velocity: 0.8 }),
            velocityScale: 1.0,
            tone: 150,
            reverb: 0
        };

        kickOsc.disconnect();
        kickOsc.connect(this.drums.kick.volume);
        this.drums.kick.volume.connect(kickEnv);

        // SNARE
        const snareNoise = new Tone.Noise('white').start();
        const snareFilter = new Tone.Filter(2000, 'highpass');
        const snareEnv = new Tone.AmplitudeEnvelope({
            attack: 0.001,
            decay: 0.2,
            sustain: 0,
            release: 0.2
        });

        const snareDry = new Tone.Gain(1).connect(this.masterVolume);
        const snareReverbSend = new Tone.Gain(0).connect(this.masterReverb);

        snareFilter.connect(snareEnv);
        snareEnv.connect(snareDry);
        snareEnv.connect(snareReverbSend);

        this.drums.snare = {
            name: 'Snare',
            noise: snareNoise,
            filter: snareFilter,
            envelope: snareEnv,
            volume: new Tone.Volume(0),
            reverbSend: snareReverbSend,
            trigger: (time, velocity) => {
                const vel = velocity * this.drums.snare.velocityScale;
                snareFilter.frequency.value = this.drums.snare.tone;
                snareEnv.triggerAttackRelease(0.2, time, vel);
            },
            pattern: Array(16).fill({ active: false, velocity: 0.8 }),
            velocityScale: 1.0,
            tone: 2000,
            reverb: 0
        };

        snareNoise.disconnect();
        snareNoise.connect(this.drums.snare.volume);
        this.drums.snare.volume.connect(snareFilter);

        // HI-HAT CLOSED
        const hatNoise = new Tone.Noise('white').start();
        const hatFilter = new Tone.Filter(8000, 'highpass');
        const hatEnv = new Tone.AmplitudeEnvelope({
            attack: 0.001,
            decay: 0.05,
            sustain: 0,
            release: 0.05
        });

        const hatDry = new Tone.Gain(1).connect(this.masterVolume);
        const hatReverbSend = new Tone.Gain(0).connect(this.masterReverb);

        hatFilter.connect(hatEnv);
        hatEnv.connect(hatDry);
        hatEnv.connect(hatReverbSend);

        this.drums.hihat = {
            name: 'Hi-Hat',
            noise: hatNoise,
            filter: hatFilter,
            envelope: hatEnv,
            volume: new Tone.Volume(-3),
            reverbSend: hatReverbSend,
            trigger: (time, velocity) => {
                const vel = velocity * this.drums.hihat.velocityScale;
                hatFilter.frequency.value = this.drums.hihat.tone;
                hatEnv.triggerAttackRelease(0.05, time, vel);
            },
            pattern: Array(16).fill({ active: false, velocity: 0.6 }),
            velocityScale: 1.0,
            tone: 8000,
            reverb: 0
        };

        hatNoise.disconnect();
        hatNoise.connect(this.drums.hihat.volume);
        this.drums.hihat.volume.connect(hatFilter);

        // OPEN HAT
        const openHatNoise = new Tone.Noise('white').start();
        const openHatFilter = new Tone.Filter(7000, 'highpass');
        const openHatEnv = new Tone.AmplitudeEnvelope({
            attack: 0.001,
            decay: 0.3,
            sustain: 0,
            release: 0.3
        });

        const openHatDry = new Tone.Gain(1).connect(this.masterVolume);
        const openHatReverbSend = new Tone.Gain(0).connect(this.masterReverb);

        openHatFilter.connect(openHatEnv);
        openHatEnv.connect(openHatDry);
        openHatEnv.connect(openHatReverbSend);

        this.drums.openhat = {
            name: 'Open Hat',
            noise: openHatNoise,
            filter: openHatFilter,
            envelope: openHatEnv,
            volume: new Tone.Volume(-6),
            reverbSend: openHatReverbSend,
            trigger: (time, velocity) => {
                const vel = velocity * this.drums.openhat.velocityScale;
                openHatFilter.frequency.value = this.drums.openhat.tone;
                openHatEnv.triggerAttackRelease(0.3, time, vel);
            },
            pattern: Array(16).fill({ active: false, velocity: 0.7 }),
            velocityScale: 1.0,
            tone: 7000,
            reverb: 0
        };

        openHatNoise.disconnect();
        openHatNoise.connect(this.drums.openhat.volume);
        this.drums.openhat.volume.connect(openHatFilter);

        // CLAP
        const clapNoise = new Tone.Noise('pink').start();
        const clapFilter = new Tone.Filter(1500, 'bandpass');
        const clapEnv = new Tone.AmplitudeEnvelope({
            attack: 0.001,
            decay: 0.15,
            sustain: 0,
            release: 0.15
        });

        const clapDry = new Tone.Gain(1).connect(this.masterVolume);
        const clapReverbSend = new Tone.Gain(0).connect(this.masterReverb);

        clapFilter.connect(clapEnv);
        clapEnv.connect(clapDry);
        clapEnv.connect(clapReverbSend);

        this.drums.clap = {
            name: 'Clap',
            noise: clapNoise,
            filter: clapFilter,
            envelope: clapEnv,
            volume: new Tone.Volume(-3),
            reverbSend: clapReverbSend,
            trigger: (time, velocity) => {
                const vel = velocity * this.drums.clap.velocityScale;
                clapFilter.frequency.value = this.drums.clap.tone;
                clapEnv.triggerAttackRelease(0.05, time, vel * 0.7);
                clapEnv.triggerAttackRelease(0.05, time + 0.03, vel * 0.5);
                clapEnv.triggerAttackRelease(0.15, time + 0.06, vel);
            },
            pattern: Array(16).fill({ active: false, velocity: 0.8 }),
            velocityScale: 1.0,
            tone: 1500,
            reverb: 0
        };

        clapNoise.disconnect();
        clapNoise.connect(this.drums.clap.volume);
        this.drums.clap.volume.connect(clapFilter);

        // TOM
        const tomOsc = new Tone.Oscillator(120, 'sine').start();
        const tomEnv = new Tone.AmplitudeEnvelope({
            attack: 0.001,
            decay: 0.25,
            sustain: 0,
            release: 0.25
        });

        const tomDry = new Tone.Gain(1).connect(this.masterVolume);
        const tomReverbSend = new Tone.Gain(0).connect(this.masterReverb);

        tomEnv.connect(tomDry);
        tomEnv.connect(tomReverbSend);

        this.drums.tom = {
            name: 'Tom',
            osc: tomOsc,
            envelope: tomEnv,
            volume: new Tone.Volume(0),
            reverbSend: tomReverbSend,
            basePitch: 120,
            trigger: (time, velocity) => {
                const vel = velocity * this.drums.tom.velocityScale;
                tomOsc.frequency.setValueAtTime(this.drums.tom.tone, time);
                tomOsc.frequency.exponentialRampToValueAtTime(this.drums.tom.basePitch, time + 0.25);
                tomEnv.triggerAttackRelease(0.25, time, vel);
            },
            pattern: Array(16).fill({ active: false, velocity: 0.8 }),
            velocityScale: 1.0,
            tone: 180,
            reverb: 0
        };

        tomOsc.disconnect();
        tomOsc.connect(this.drums.tom.volume);
        this.drums.tom.volume.connect(tomEnv);

        // CLAVE
        const claveOsc = new Tone.Oscillator(2500, 'square').start();
        const claveFilter = new Tone.Filter(3000, 'bandpass', -12);
        const claveEnv = new Tone.AmplitudeEnvelope({
            attack: 0.001,
            decay: 0.02,
            sustain: 0,
            release: 0.02
        });

        const claveDry = new Tone.Gain(1).connect(this.masterVolume);
        const claveReverbSend = new Tone.Gain(0).connect(this.masterReverb);

        claveFilter.connect(claveEnv);
        claveEnv.connect(claveDry);
        claveEnv.connect(claveReverbSend);

        this.drums.clave = {
            name: 'Clave',
            osc: claveOsc,
            filter: claveFilter,
            envelope: claveEnv,
            volume: new Tone.Volume(-6),
            reverbSend: claveReverbSend,
            basePitch: 2000,
            trigger: (time, velocity) => {
                const vel = velocity * this.drums.clave.velocityScale;
                claveOsc.frequency.setValueAtTime(this.drums.clave.tone, time);
                claveOsc.frequency.exponentialRampToValueAtTime(this.drums.clave.basePitch, time + 0.02);
                claveFilter.frequency.value = this.drums.clave.tone * 1.2;
                claveEnv.triggerAttackRelease(0.02, time, vel);
            },
            pattern: Array(16).fill({ active: false, velocity: 0.8 }),
            velocityScale: 1.0,
            tone: 2500,
            reverb: 0
        };

        claveOsc.disconnect();
        claveOsc.connect(this.drums.clave.volume);
        this.drums.clave.volume.connect(claveFilter);
    }

    initializePatterns() {
        // Basic rock beat
        this.drums.kick.pattern[0] = { active: true, velocity: 1.0 };
        this.drums.kick.pattern[4] = { active: true, velocity: 0.8 };
        this.drums.kick.pattern[8] = { active: true, velocity: 1.0 };
        this.drums.kick.pattern[12] = { active: true, velocity: 0.8 };

        this.drums.snare.pattern[4] = { active: true, velocity: 1.0 };
        this.drums.snare.pattern[12] = { active: true, velocity: 1.0 };

        for (let i = 0; i < 16; i += 2) {
            this.drums.hihat.pattern[i] = { active: true, velocity: 0.6 };
        }
    }

    start() {
        if (this.isPlaying) return;

        Tone.Transport.bpm.value = this.tempo;
        Tone.Transport.swing = this.swing;
        this.isPlaying = true;
        this.currentStep = 0;

        this.sequence = new Tone.Sequence((time, step) => {
            this.currentStep = step;
            this.triggerStep(step, time);
        }, Array.from({length: this.stepCount}, (_, i) => i), "16n");

        this.sequence.start(0);
        Tone.Transport.start();
    }

    stop() {
        if (!this.isPlaying) return;

        this.isPlaying = false;
        this.currentStep = 0;

        if (this.sequence) {
            this.sequence.stop();
            this.sequence.dispose();
            this.sequence = null;
        }

        Tone.Transport.stop();
    }

    triggerStep(step, time) {
        Object.keys(this.drums).forEach(drumKey => {
            const drum = this.drums[drumKey];
            const stepData = drum.pattern[step];

            if (stepData && stepData.active) {
                drum.trigger(time, stepData.velocity);
            }
        });
    }

    triggerSnareRoll() {
        if (!this.isPlaying) return;

        const now = Tone.now();
        const rollInterval = Tone.Time(this.rollTime).toSeconds();

        for (let i = 0; i < this.rollDepth; i++) {
            const time = now + (i * rollInterval);
            const velocity = 0.5 + (i / this.rollDepth) * 0.5; // Crescendo
            this.drums.snare.trigger(time, velocity);
        }
    }

    updateStep(drum, step, data) {
        this.drums[drum].pattern[step] = { ...this.drums[drum].pattern[step], ...data };
    }

    updateDrumVolume(drum, value) {
        const db = -30 + (value / 100) * 30;
        this.drums[drum].volume.volume.rampTo(db, 0.05);
    }

    updateDrumVelocity(drum, value) {
        this.drums[drum].velocityScale = value / 100;
    }

    updateDrumTone(drum, value) {
        this.drums[drum].tone = value;
    }

    updateDrumReverb(drum, value) {
        this.drums[drum].reverb = value;
        this.drums[drum].reverbSend.gain.rampTo(value / 100, 0.1);
    }

    updateTempo(bpm) {
        this.tempo = bpm;
        Tone.Transport.bpm.value = bpm;
    }

    updateSwing(amount) {
        this.swing = amount / 100;
        Tone.Transport.swing = this.swing;
    }

    updateMasterVolume(value) {
        const db = -30 + (value / 100) * 24;
        this.masterVolume.volume.rampTo(db, 0.05);
    }

    updateRollTime(value) {
        const times = ['64n', '32n', '16n', '8n'];
        this.rollTime = times[value];
    }

    updateRollDepth(value) {
        this.rollDepth = value;
    }

    randomizeDrum(drum) {
        this.drums[drum].pattern = this.drums[drum].pattern.map(() => ({
            active: Math.random() > 0.7,
            velocity: 0.3 + Math.random() * 0.7
        }));
    }

    randomizeAll() {
        Object.keys(this.drums).forEach(drum => this.randomizeDrum(drum));
    }

    clearDrum(drum) {
        this.drums[drum].pattern = Array(16).fill({ active: false, velocity: 0.8 });
    }

    clearAll() {
        Object.keys(this.drums).forEach(drum => this.clearDrum(drum));
    }

    getState() {
        const state = {
            tempo: this.tempo,
            swing: this.swing,
            rollTime: this.rollTime,
            rollDepth: this.rollDepth,
            drums: {}
        };

        Object.keys(this.drums).forEach(drum => {
            state.drums[drum] = {
                pattern: JSON.parse(JSON.stringify(this.drums[drum].pattern)),
                volume: this.drums[drum].volume.volume.value,
                velocityScale: this.drums[drum].velocityScale,
                tone: this.drums[drum].tone,
                reverb: this.drums[drum].reverb
            };
        });

        return state;
    }

    setState(state) {
        this.tempo = state.tempo || 120;
        this.swing = state.swing || 0;
        this.rollTime = state.rollTime || '32n';
        this.rollDepth = state.rollDepth || 4;

        Tone.Transport.bpm.value = this.tempo;
        Tone.Transport.swing = this.swing;

        if (state.drums) {
            Object.keys(state.drums).forEach(drum => {
                if (this.drums[drum]) {
                    this.drums[drum].pattern = JSON.parse(JSON.stringify(state.drums[drum].pattern));
                    if (state.drums[drum].volume !== undefined) {
                        this.drums[drum].volume.volume.value = state.drums[drum].volume;
                    }
                    if (state.drums[drum].velocityScale !== undefined) {
                        this.drums[drum].velocityScale = state.drums[drum].velocityScale;
                    }
                    if (state.drums[drum].tone !== undefined) {
                        this.drums[drum].tone = state.drums[drum].tone;
                    }
                    if (state.drums[drum].reverb !== undefined) {
                        this.drums[drum].reverb = state.drums[drum].reverb;
                        this.drums[drum].reverbSend.gain.value = state.drums[drum].reverb / 100;
                    }
                }
            });
        }
    }
}

// Knob Controller
class Knob {
    constructor(element, config) {
        this.element = element;
        this.indicator = element.querySelector('.knob-indicator');
        this.config = {
            min: config.min || 0,
            max: config.max || 100,
            value: config.value || 50,
            step: config.step || 1,
            onChange: config.onChange || (() => {})
        };

        this.isDragging = false;
        this.startY = 0;
        this.startValue = this.config.value;

        this.bindEvents();
        this.updateRotation();
    }

    bindEvents() {
        this.element.addEventListener('mousedown', this.onMouseDown.bind(this));
        document.addEventListener('mousemove', this.onMouseMove.bind(this));
        document.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.element.addEventListener('touchstart', this.onTouchStart.bind(this));
        document.addEventListener('touchmove', this.onTouchMove.bind(this));
        document.addEventListener('touchend', this.onTouchEnd.bind(this));
    }

    onMouseDown(e) {
        e.preventDefault();
        this.isDragging = true;
        this.startY = e.clientY;
        this.startValue = this.config.value;
        this.element.style.cursor = 'grabbing';
    }

    onTouchStart(e) {
        this.isDragging = true;
        this.startY = e.touches[0].clientY;
        this.startValue = this.config.value;
    }

    onMouseMove(e) {
        if (!this.isDragging) return;

        const deltaY = this.startY - e.clientY;
        const sensitivity = 0.5;
        const range = this.config.max - this.config.min;
        const delta = (deltaY * sensitivity * range) / 100;

        let newValue = this.startValue + delta;
        newValue = Math.max(this.config.min, Math.min(this.config.max, newValue));
        newValue = Math.round(newValue / this.config.step) * this.config.step;

        if (newValue !== this.config.value) {
            this.config.value = newValue;
            this.updateRotation();
            this.config.onChange(newValue);
        }
    }

    onTouchMove(e) {
        if (!this.isDragging) return;

        const deltaY = this.startY - e.touches[0].clientY;
        const sensitivity = 0.5;
        const range = this.config.max - this.config.min;
        const delta = (deltaY * sensitivity * range) / 100;

        let newValue = this.startValue + delta;
        newValue = Math.max(this.config.min, Math.min(this.config.max, newValue));
        newValue = Math.round(newValue / this.config.step) * this.config.step;

        if (newValue !== this.config.value) {
            this.config.value = newValue;
            this.updateRotation();
            this.config.onChange(newValue);
        }
    }

    onMouseUp() {
        this.isDragging = false;
        this.element.style.cursor = 'pointer';
    }

    onTouchEnd() {
        this.isDragging = false;
    }

    updateRotation() {
        const percentage = (this.config.value - this.config.min) / (this.config.max - this.config.min);
        const degrees = -135 + (percentage * 270);
        this.indicator.style.transform = `translateX(-50%) rotate(${degrees}deg)`;
        this.indicator.style.transformOrigin = 'center bottom';
    }

    setValue(value) {
        this.config.value = Math.max(this.config.min, Math.min(this.config.max, value));
        this.updateRotation();
    }

    getValue() {
        return this.config.value;
    }
}

// Pattern Manager
class PatternManager {
    constructor() {
        this.storageKey = 'drumMachinePatternsV2';
    }

    save(name, state) {
        const patterns = this.getAll();
        patterns[name] = state;
        localStorage.setItem(this.storageKey, JSON.stringify(patterns));
    }

    load(name) {
        const patterns = this.getAll();
        return patterns[name] || null;
    }

    delete(name) {
        const patterns = this.getAll();
        delete patterns[name];
        localStorage.setItem(this.storageKey, JSON.stringify(patterns));
    }

    getAll() {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : {};
    }

    getNames() {
        return Object.keys(this.getAll());
    }
}

// Initialize
const drumMachine = new DrumMachine();
const patternManager = new PatternManager();
const knobs = {};
const drumKnobs = {};

// Create drum track UI
function createDrumUI() {
    const container = document.getElementById('drum-tracks');
    container.innerHTML = '';

    // Define tone ranges for each drum type
    const toneRanges = {
        kick: { min: 40, max: 200, default: 150, format: (v) => Math.round(v) + ' Hz' },
        snare: { min: 500, max: 5000, default: 2000, format: (v) => Math.round(v) + ' Hz' },
        hihat: { min: 5000, max: 12000, default: 8000, format: (v) => Math.round(v) + ' Hz' },
        openhat: { min: 4000, max: 10000, default: 7000, format: (v) => Math.round(v) + ' Hz' },
        clap: { min: 800, max: 3000, default: 1500, format: (v) => Math.round(v) + ' Hz' },
        tom: { min: 80, max: 250, default: 180, format: (v) => Math.round(v) + ' Hz' },
        clave: { min: 1500, max: 4000, default: 2500, format: (v) => Math.round(v) + ' Hz' }
    };

    Object.keys(drumMachine.drums).forEach(drumKey => {
        const drum = drumMachine.drums[drumKey];
        const toneRange = toneRanges[drumKey];
        const row = document.createElement('div');
        row.className = 'drum-row';

        row.innerHTML = `
            <div class="drum-label">${drum.name}</div>
            <div class="drum-steps" data-drum="${drumKey}">
                ${Array.from({length: 16}, (_, i) => `
                    <div class="step-pad ${drum.pattern[i].active ? 'active' : ''}"
                         data-drum="${drumKey}" data-step="${i}">
                        <div class="step-velocity" style="height: ${drum.pattern[i].velocity * 100}%"></div>
                    </div>
                `).join('')}
            </div>
            <div class="drum-controls">
                <div class="knob-container">
                    <div class="knob-wrapper">
                        <div class="knob" data-drum-knob="${drumKey}-vol">
                            <div class="knob-indicator"></div>
                            <div class="knob-center"></div>
                        </div>
                    </div>
                    <div class="control-label">Vol</div>
                    <div class="knob-value" data-drum-value="${drumKey}-vol">75</div>
                </div>
                <div class="knob-container">
                    <div class="knob-wrapper">
                        <div class="knob" data-drum-knob="${drumKey}-vel">
                            <div class="knob-indicator"></div>
                            <div class="knob-center"></div>
                        </div>
                    </div>
                    <div class="control-label">Vel</div>
                    <div class="knob-value" data-drum-value="${drumKey}-vel">100</div>
                </div>
                <div class="knob-container">
                    <div class="knob-wrapper">
                        <div class="knob" data-drum-knob="${drumKey}-tone">
                            <div class="knob-indicator"></div>
                            <div class="knob-center"></div>
                        </div>
                    </div>
                    <div class="control-label">Tone</div>
                    <div class="knob-value" data-drum-value="${drumKey}-tone">${toneRange.format(toneRange.default)}</div>
                </div>
                <div class="knob-container">
                    <div class="knob-wrapper">
                        <div class="knob" data-drum-knob="${drumKey}-rev">
                            <div class="knob-indicator"></div>
                            <div class="knob-center"></div>
                        </div>
                    </div>
                    <div class="control-label">Rev</div>
                    <div class="knob-value" data-drum-value="${drumKey}-rev">0</div>
                </div>
            </div>
        `;

        container.appendChild(row);

        // Initialize drum knobs
        drumKnobs[`${drumKey}-vol`] = new Knob(row.querySelector(`[data-drum-knob="${drumKey}-vol"]`), {
            min: 0,
            max: 100,
            value: 75,
            onChange: (value) => {
                row.querySelector(`[data-drum-value="${drumKey}-vol"]`).textContent = Math.round(value);
                drumMachine.updateDrumVolume(drumKey, value);
            }
        });

        drumKnobs[`${drumKey}-vel`] = new Knob(row.querySelector(`[data-drum-knob="${drumKey}-vel"]`), {
            min: 0,
            max: 200,
            value: 100,
            onChange: (value) => {
                row.querySelector(`[data-drum-value="${drumKey}-vel"]`).textContent = Math.round(value);
                drumMachine.updateDrumVelocity(drumKey, value);
            }
        });

        drumKnobs[`${drumKey}-tone`] = new Knob(row.querySelector(`[data-drum-knob="${drumKey}-tone"]`), {
            min: toneRange.min,
            max: toneRange.max,
            value: toneRange.default,
            onChange: (value) => {
                row.querySelector(`[data-drum-value="${drumKey}-tone"]`).textContent = toneRange.format(value);
                drumMachine.updateDrumTone(drumKey, value);
            }
        });

        drumKnobs[`${drumKey}-rev`] = new Knob(row.querySelector(`[data-drum-knob="${drumKey}-rev"]`), {
            min: 0,
            max: 100,
            value: 0,
            onChange: (value) => {
                row.querySelector(`[data-drum-value="${drumKey}-rev"]`).textContent = Math.round(value);
                drumMachine.updateDrumReverb(drumKey, value);
            }
        });
    });

    // Add step pad listeners
    document.querySelectorAll('.step-pad').forEach(pad => {
        let velocityMode = false;

        pad.addEventListener('click', (e) => {
            const drum = e.currentTarget.dataset.drum;
            const step = parseInt(e.currentTarget.dataset.step);
            const isActive = !drumMachine.drums[drum].pattern[step].active;

            drumMachine.updateStep(drum, step, { active: isActive });
            e.currentTarget.classList.toggle('active', isActive);
        });

        pad.addEventListener('mousedown', (e) => {
            if (e.button === 2 || e.shiftKey) {
                e.preventDefault();
                velocityMode = true;
            }
        });

        pad.addEventListener('mousemove', (e) => {
            if (velocityMode && e.buttons === 1) {
                const rect = pad.getBoundingClientRect();
                const y = e.clientY - rect.top;
                const velocity = 1 - (y / rect.height);
                const clampedVelocity = Math.max(0.1, Math.min(1, velocity));

                const drum = pad.dataset.drum;
                const step = parseInt(pad.dataset.step);

                drumMachine.updateStep(drum, step, { velocity: clampedVelocity });
                pad.querySelector('.step-velocity').style.height = (clampedVelocity * 100) + '%';
            }
        });

        pad.addEventListener('mouseup', () => {
            velocityMode = false;
        });

        pad.addEventListener('contextmenu', (e) => e.preventDefault());
    });
}

// Update step highlighting
function updateStepHighlight() {
    document.querySelectorAll('.step-pad').forEach((pad) => {
        const step = parseInt(pad.dataset.step);
        const isPlaying = step === drumMachine.currentStep && drumMachine.isPlaying;
        pad.classList.toggle('playing', isPlaying);
    });
}

setInterval(updateStepHighlight, 50);

// Initialize master knobs
function initKnobs() {
    const knobConfigs = {
        'tempo': { min: 40, max: 240, value: 120 },
        'swing': { min: 0, max: 80, value: 0, format: (v) => Math.round(v) + '%' },
        'master': { min: 0, max: 100, value: 75 },
        'roll-time': { min: 0, max: 3, value: 1, step: 1, format: (v) => ['64n', '32n', '16n', '8n'][v] },
        'roll-depth': { min: 2, max: 16, value: 4, step: 1 }
    };

    document.querySelectorAll('[data-knob]').forEach(el => {
        const id = el.dataset.knob;
        const config = knobConfigs[id];
        const valueEl = document.querySelector(`[data-value="${id}"]`);

        knobs[id] = new Knob(el, {
            ...config,
            onChange: (value) => {
                const displayValue = config.format ? config.format(value) : Math.round(value);
                valueEl.textContent = displayValue;
                handleKnobChange(id, value);
            }
        });

        const displayValue = config.format ? config.format(config.value) : Math.round(config.value);
        valueEl.textContent = displayValue;
    });

    Object.keys(knobs).forEach(id => handleKnobChange(id, knobs[id].getValue()));
}

function handleKnobChange(id, value) {
    switch(id) {
        case 'tempo':
            drumMachine.updateTempo(value);
            break;
        case 'swing':
            drumMachine.updateSwing(value);
            break;
        case 'master':
            drumMachine.updateMasterVolume(value);
            break;
        case 'roll-time':
            drumMachine.updateRollTime(value);
            break;
        case 'roll-depth':
            drumMachine.updateRollDepth(value);
            break;
    }
}

// Tempo sync button
document.getElementById('syncBtn').addEventListener('click', () => {
    drumMachine.broadcastTempo(drumMachine.tempo);
    document.getElementById('status').textContent = 'Tempo broadcasted!';
    setTimeout(() => {
        document.getElementById('status').textContent = drumMachine.isPlaying ? 'Playing...' : 'Ready';
    }, 1500);
});

// Snare roll button
document.getElementById('rollBtn').addEventListener('click', () => {
    drumMachine.triggerSnareRoll();
});

// Transport controls
const playBtn = document.getElementById('playBtn');
const stopBtn = document.getElementById('stopBtn');
const status = document.getElementById('status');

playBtn.addEventListener('click', async () => {
    await Tone.start();
    drumMachine.start();
    playBtn.disabled = true;
    playBtn.classList.remove('active');
    stopBtn.disabled = false;
    stopBtn.classList.add('active');
    status.textContent = 'Playing...';
    status.classList.add('active');
});

stopBtn.addEventListener('click', () => {
    drumMachine.stop();
    stopBtn.disabled = true;
    stopBtn.classList.remove('active');
    playBtn.disabled = false;
    status.textContent = 'Stopped';
    status.classList.remove('active');
});

// Randomize & Clear
document.getElementById('randomizeBtn').addEventListener('click', () => {
    drumMachine.randomizeAll();
    createDrumUI();
});

document.getElementById('clearBtn').addEventListener('click', () => {
    drumMachine.clearAll();
    createDrumUI();
});

// Pattern management
function updatePatternList() {
    const select = document.getElementById('pattern-list');
    select.innerHTML = '<option value="">Select Pattern...</option>';

    patternManager.getNames().forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        select.appendChild(option);
    });
}

document.getElementById('saveBtn').addEventListener('click', () => {
    const name = document.getElementById('pattern-name').value.trim();
    if (!name) {
        alert('Please enter a pattern name');
        return;
    }

    const state = drumMachine.getState();
    state.knobs = {};
    Object.keys(knobs).forEach(id => {
        state.knobs[id] = knobs[id].getValue();
    });
    state.drumKnobs = {};
    Object.keys(drumKnobs).forEach(id => {
        state.drumKnobs[id] = drumKnobs[id].getValue();
    });

    patternManager.save(name, state);
    updatePatternList();
    status.textContent = `Saved: ${name}`;
    setTimeout(() => status.textContent = drumMachine.isPlaying ? 'Playing...' : 'Ready', 2000);
});

document.getElementById('loadBtn').addEventListener('click', () => {
    const select = document.getElementById('pattern-list');
    const name = select.value;

    if (!name) {
        alert('Please select a pattern');
        return;
    }

    const state = patternManager.load(name);
    if (!state) {
        alert('Pattern not found');
        return;
    }

    const wasPlaying = drumMachine.isPlaying;
    if (wasPlaying) drumMachine.stop();

    drumMachine.setState(state);

    // Update knobs
    if (state.knobs) {
        Object.keys(state.knobs).forEach(id => {
            if (knobs[id]) {
                knobs[id].setValue(state.knobs[id]);
                const config = knobs[id].config;
                const displayValue = config.format ? config.format(state.knobs[id]) : Math.round(state.knobs[id]);
                document.querySelector(`[data-value="${id}"]`).textContent = displayValue;
            }
        });
    }

    if (state.drumKnobs) {
        Object.keys(state.drumKnobs).forEach(id => {
            if (drumKnobs[id]) {
                drumKnobs[id].setValue(state.drumKnobs[id]);
                const displayValue = drumKnobs[id].config.format ?
                    drumKnobs[id].config.format(state.drumKnobs[id]) :
                    Math.round(state.drumKnobs[id]);
                document.querySelector(`[data-drum-value="${id}"]`).textContent = displayValue;
            }
        });
    }

    document.getElementById('pattern-name').value = name;
    createDrumUI();

    if (wasPlaying) {
        setTimeout(() => drumMachine.start(), 100);
    }

    status.textContent = `Loaded: ${name}`;
    setTimeout(() => status.textContent = drumMachine.isPlaying ? 'Playing...' : 'Ready', 2000);
});

document.getElementById('deleteBtn').addEventListener('click', () => {
    const select = document.getElementById('pattern-list');
    const name = select.value;

    if (!name) {
        alert('Please select a pattern to delete');
        return;
    }

    if (confirm(`Delete pattern "${name}"?`)) {
        patternManager.delete(name);
        updatePatternList();
        status.textContent = `Deleted: ${name}`;
        setTimeout(() => status.textContent = drumMachine.isPlaying ? 'Playing...' : 'Ready', 2000);
    }
});

// Initialize everything
setTimeout(() => {
    initKnobs();
    createDrumUI();
    updatePatternList();
}, 100);
