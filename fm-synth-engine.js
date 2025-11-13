// FM Synth Engine
// 4-operator FM synthesizer with keyboard control and drone mode

class FMSynth {
    constructor() {
        this.isInitialized = false;
        this.droneMode = false;
        this.activeVoices = new Map();
        this.keyboardMap = this.createKeyboardMap();
        this.pressedKeys = new Set();
        this.audioStarted = false;

        this.initializeAudio();
        this.initializeUI();
        this.initializeKeyboard();

        // Click anywhere to start audio
        document.addEventListener('click', async () => {
            if (!this.audioStarted) {
                await Tone.start();
                this.audioStarted = true;
                this.updateLatencyDisplay(); // Update latency after audio starts
                this.updateStatus('Ready - Press keys to play');
                console.log('Audio initialized');
            }
        }, { once: true });
    }

    async initializeAudio() {
        // LATENCY OPTIMIZATION: Set to lowest latency mode
        Tone.context.latencyHint = 'interactive';
        Tone.context.lookAhead = 0; // Minimize lookahead for lowest latency

        // Log actual latency for debugging
        console.log('🎵 Audio Latency:',
            Math.round((Tone.context.baseLatency + Tone.context.outputLatency) * 1000), 'ms');

        // Master chain
        this.masterVolume = new Tone.Volume(-8).toDestination();

        // Audio analyzer for visualization sync (FFT for frequency analysis)
        this.analyzer = new Tone.Analyser('fft', 512);
        this.masterVolume.connect(this.analyzer);

        // BroadcastChannel for sending audio data to visualizations
        try {
            this.audioChannel = new BroadcastChannel('web-synth-audio');
            // Send audio data periodically
            setInterval(() => {
                if (this.analyzer) {
                    const fftValues = this.analyzer.getValue();
                    const frequencyBands = this.analyzeFrequencyBands(fftValues);

                    this.audioChannel.postMessage({
                        type: 'audioData',
                        rms: frequencyBands.rms,
                        bass: frequencyBands.bass,
                        mid: frequencyBands.mid,
                        high: frequencyBands.high
                    });
                }
            }, 50); // 20 times per second
        } catch (e) {
            console.log('BroadcastChannel not available:', e);
        }

        // Reverb
        this.reverb = new Tone.Reverb({
            decay: 2.5,
            wet: 0.25
        }).connect(this.masterVolume);

        await this.reverb.generate();

        // Filter
        this.filter = new Tone.Filter({
            frequency: 2000,
            type: 'lowpass',
            Q: 1
        }).connect(this.reverb);

        // LFO
        this.lfo = new Tone.LFO({
            frequency: 2,
            type: 'sine'
        }).start();

        // Voice pool
        this.voices = [];
        this.maxPolyphony = 6;

        for (let i = 0; i < this.maxPolyphony; i++) {
            this.voices.push(this.createVoice());
        }

        // Parameters - better default levels for smoother sound
        this.params = {
            osc1: { level: 0.7, detune: 0, wave: 'sine' },  // No FM on carrier
            osc2: { level: 0.3, detune: 0, fm: 0, wave: 'sine' },
            osc3: { level: 0.2, detune: 0, fm: 0, wave: 'sine' },
            osc4: { level: 0.1, detune: 0, fm: 0, wave: 'sine' },
            ampEnv: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.8 },
            filterEnv: { attack: 0.05, decay: 0.3, sustain: 0.5, amount: 2000 },
            filter: { freq: 2000, res: 1, type: 'lowpass' },
            lfo: { rate: 2.0, pitch: 0, filter: 0, amp: 0, wave: 'sine' },
            reverb: { decay: 2.5, wet: 25 },
            master: { volume: 70 }
        };

        this.isInitialized = true;
        console.log('FM Synth initialized');

        // Display latency info
        this.updateLatencyDisplay();

        // Initialize MIDI
        this.initializeMIDI();
    }

    createVoice() {
        // Create 4 oscillators with FM routing
        // Osc4 -> Osc3 -> Osc2 -> Osc1 -> Output

        const voice = {
            osc1: new Tone.Oscillator({ type: 'sine' }),
            osc2: new Tone.Oscillator({ type: 'sine' }),
            osc3: new Tone.Oscillator({ type: 'sine' }),
            osc4: new Tone.Oscillator({ type: 'sine' }),

            // FM modulators (control how much one osc modulates another)
            fmGain1: new Tone.Gain(0), // Osc2 modulates Osc1
            fmGain2: new Tone.Gain(0), // Osc3 modulates Osc2
            fmGain3: new Tone.Gain(0), // Osc4 modulates Osc3

            // Level controls - better defaults
            level1: new Tone.Gain(0.7),
            level2: new Tone.Gain(0.3),
            level3: new Tone.Gain(0.2),
            level4: new Tone.Gain(0.1),

            // Mixer for all oscillators
            mixer: new Tone.Gain(0.25),

            // Envelope
            envelope: new Tone.AmplitudeEnvelope({
                attack: 0.01,
                decay: 0.2,
                sustain: 0.5,
                release: 0.8,
                attackCurve: 'linear',
                releaseCurve: 'exponential'
            }),

            active: false,
            note: null
        };

        // FM routing: Osc4 -> Osc3 frequency
        voice.osc4.connect(voice.fmGain3);
        voice.fmGain3.connect(voice.osc3.frequency);

        // FM routing: Osc3 -> Osc2 frequency
        voice.osc3.connect(voice.fmGain2);
        voice.fmGain2.connect(voice.osc2.frequency);

        // FM routing: Osc2 -> Osc1 frequency
        voice.osc2.connect(voice.fmGain1);
        voice.fmGain1.connect(voice.osc1.frequency);

        // Audio routing: All oscs to mixer
        voice.osc1.connect(voice.level1);
        voice.osc2.connect(voice.level2);
        voice.osc3.connect(voice.level3);
        voice.osc4.connect(voice.level4);

        voice.level1.connect(voice.mixer);
        voice.level2.connect(voice.mixer);
        voice.level3.connect(voice.mixer);
        voice.level4.connect(voice.mixer);

        // Mixer to envelope to filter
        voice.mixer.connect(voice.envelope);
        voice.envelope.connect(this.filter);

        // Start oscillators
        voice.osc1.start();
        voice.osc2.start();
        voice.osc3.start();
        voice.osc4.start();

        return voice;
    }

    getFreeVoice() {
        // Find inactive voice
        let voice = this.voices.find(v => !v.active);

        // If no free voice, steal oldest
        if (!voice) {
            voice = this.voices[0];
            if (voice.active) {
                voice.envelope.triggerRelease();
            }
        }

        return voice;
    }

    noteOn(note, velocity = 0.7) {
        if (!this.audioStarted) {
            this.updateStatus('Click first to enable audio');
            return;
        }

        // In drone mode, only one note at a time
        if (this.droneMode) {
            this.stopAllNotes();
        }

        const voice = this.getFreeVoice();
        const freq = Tone.Frequency(note).toFrequency();

        voice.active = true;
        voice.note = note;
        voice.velocity = velocity;

        // Set base frequencies for all oscillators
        voice.osc1.frequency.setValueAtTime(freq + this.params.osc1.detune, Tone.now());
        voice.osc2.frequency.setValueAtTime(freq + this.params.osc2.detune, Tone.now());
        voice.osc3.frequency.setValueAtTime(freq + this.params.osc3.detune, Tone.now());
        voice.osc4.frequency.setValueAtTime(freq + this.params.osc4.detune, Tone.now());

        // Set FM amounts (frequency * fm amount)
        voice.fmGain1.gain.setValueAtTime(freq * this.params.osc2.fm, Tone.now());
        voice.fmGain2.gain.setValueAtTime(freq * this.params.osc3.fm, Tone.now());
        voice.fmGain3.gain.setValueAtTime(freq * this.params.osc4.fm, Tone.now());

        // Set levels (scaled by velocity)
        voice.level1.gain.setValueAtTime(this.params.osc1.level * velocity, Tone.now());
        voice.level2.gain.setValueAtTime(this.params.osc2.level * velocity, Tone.now());
        voice.level3.gain.setValueAtTime(this.params.osc3.level * velocity, Tone.now());
        voice.level4.gain.setValueAtTime(this.params.osc4.level * velocity, Tone.now());

        // Trigger envelope (velocity affects volume)
        voice.envelope.triggerAttack(Tone.now(), velocity);

        // Trigger filter envelope
        const now = Tone.now();
        const baseFreq = this.params.filter.freq;
        const envAmount = this.params.filterEnv.amount;

        this.filter.frequency.cancelScheduledValues(now);
        this.filter.frequency.setValueAtTime(baseFreq, now);
        this.filter.frequency.linearRampToValueAtTime(
            baseFreq + envAmount,
            now + this.params.filterEnv.attack
        );
        this.filter.frequency.linearRampToValueAtTime(
            baseFreq + (envAmount * this.params.filterEnv.sustain),
            now + this.params.filterEnv.attack + this.params.filterEnv.decay
        );

        this.activeVoices.set(note, voice);
        this.updateStatus(`Playing: ${note}`);
    }

    noteOff(note) {
        const voice = this.activeVoices.get(note);
        if (!voice) return;

        voice.envelope.triggerRelease(Tone.now());
        this.activeVoices.delete(note);

        // Mark as inactive after release (use current envelope release time)
        const releaseTime = this.droneMode ? 2000 : (voice.envelope.release * 1000);
        setTimeout(() => {
            voice.active = false;
        }, releaseTime + 100); // Add small buffer

        // Return filter to base frequency
        if (this.activeVoices.size === 0) {
            const now = Tone.now();
            const filterReleaseTime = this.droneMode ? 2.0 : this.params.ampEnv.release;
            this.filter.frequency.cancelScheduledValues(now);
            this.filter.frequency.linearRampToValueAtTime(
                this.params.filter.freq,
                now + filterReleaseTime
            );
            this.updateStatus('Ready');
        }
    }

    stopAllNotes() {
        this.activeVoices.forEach((voice, note) => {
            voice.envelope.triggerRelease(Tone.now());

            // Mark as inactive after release
            const releaseTime = this.droneMode ? 2000 : (voice.envelope.release * 1000);
            setTimeout(() => {
                voice.active = false;
            }, releaseTime + 100);
        });
        this.activeVoices.clear();
        this.updateStatus('Ready');
    }

    // Parameter updates
    updateOscillator(oscNum, param, value) {
        const oscKey = `osc${oscNum}`;

        if (param === 'level') {
            // Convert 0-100 to 0-1 range
            this.params[oscKey].level = value / 100;

            // Update all voices immediately (they'll use this value on next note)
            this.voices.forEach(voice => {
                voice[`level${oscNum}`].gain.rampTo(value / 100, 0.01);
            });

        } else if (param === 'wave') {
            this.params[oscKey].wave = value;
            this.voices.forEach(voice => {
                voice[oscKey].type = value;
            });

        } else if (param === 'fm') {
            // FM amount: 0-100 maps to 0-10 (frequency multiplier)
            this.params[oscKey].fm = value / 10;

            // Update active voices only
            this.activeVoices.forEach(voice => {
                if (oscNum > 1) {
                    const freq = Tone.Frequency(voice.note).toFrequency();
                    const fmGainIndex = oscNum - 1; // osc2 uses fmGain1, etc.
                    voice[`fmGain${fmGainIndex}`].gain.rampTo(freq * (value / 10), 0.01);
                }
            });

        } else if (param === 'detune') {
            this.params[oscKey].detune = value;

            // Update active voices only
            this.activeVoices.forEach(voice => {
                const baseFreq = Tone.Frequency(voice.note).toFrequency();
                voice[oscKey].frequency.rampTo(baseFreq + value, 0.01);
            });
        }
    }

    updateAmpEnvelope(param, value) {
        this.params.ampEnv[param] = value;

        // Update all voices
        this.voices.forEach(voice => {
            voice.envelope[param] = value;
        });
    }

    updateFilterEnvelope(param, value) {
        this.params.filterEnv[param] = value;
    }

    updateFilter(param, value) {
        this.params.filter[param] = value;

        if (param === 'freq') {
            this.filter.frequency.rampTo(value, 0.05);
        } else if (param === 'res') {
            this.filter.Q.rampTo(value, 0.05);
        } else if (param === 'type') {
            this.filter.type = value;
        }
    }

    updateLFO(param, value) {
        this.params.lfo[param] = value;

        if (param === 'rate') {
            this.lfo.frequency.rampTo(value, 0.1);
        } else if (param === 'wave') {
            this.lfo.type = value;
        } else if (param === 'filter') {
            // Disconnect first
            this.lfo.disconnect();
            this.lfo.start();

            if (value > 0) {
                // Reconnect with scaled modulation
                this.lfo.amplitude.value = value * 20; // Scale for filter
                this.lfo.connect(this.filter.frequency);
            }
        } else if (param === 'pitch') {
            // Pitch modulation (vibrato)
            this.lfo.disconnect();
            this.lfo.start();

            if (value > 0) {
                this.lfo.amplitude.value = value;
                // Connect to all oscillators
                this.voices.forEach(voice => {
                    this.lfo.connect(voice.osc1.detune);
                    this.lfo.connect(voice.osc2.detune);
                    this.lfo.connect(voice.osc3.detune);
                    this.lfo.connect(voice.osc4.detune);
                });
            }
        }
    }

    updateReverb(param, value) {
        this.params.reverb[param] = value;

        if (param === 'wet') {
            this.reverb.wet.rampTo(value / 100, 0.1);
        }
    }

    updateMasterVolume(value) {
        this.params.master.volume = value;
        const db = -30 + (value / 100) * 22; // -30 to -8 dB
        this.masterVolume.volume.rampTo(db, 0.05);
    }

    toggleDrone() {
        this.droneMode = !this.droneMode;

        const droneSwitch = document.getElementById('drone-switch');
        const droneLed = document.getElementById('drone-led');

        droneSwitch.classList.toggle('active', this.droneMode);
        droneLed.classList.toggle('active', this.droneMode);

        if (this.droneMode) {
            // Set long envelopes for drone mode
            this.voices.forEach(voice => {
                voice.envelope.attack = 0.8;
                voice.envelope.decay = 0.5;
                voice.envelope.sustain = 1.0;
                voice.envelope.release = 2.0;
            });
            this.updateStatus('Drone Mode: ON');
            console.log('Drone mode activated');
        } else {
            // Restore normal envelopes
            this.voices.forEach(voice => {
                voice.envelope.attack = this.params.ampEnv.attack;
                voice.envelope.decay = this.params.ampEnv.decay;
                voice.envelope.sustain = this.params.ampEnv.sustain;
                voice.envelope.release = this.params.ampEnv.release;
            });
            this.updateStatus('Drone Mode: OFF');
            console.log('Drone mode deactivated');
            setTimeout(() => this.updateStatus('Ready'), 1500);
        }
    }

    // MIDI Support
    async initializeMIDI() {
        if (!navigator.requestMIDIAccess) {
            console.log('⚠️ Web MIDI API not supported in this browser');
            this.updateStatus('Web MIDI not supported - use computer keyboard');
            return;
        }

        try {
            const midiAccess = await navigator.requestMIDIAccess();
            console.log('🎹 MIDI Access granted');

            // Store MIDI inputs
            this.midiInputs = [];

            midiAccess.inputs.forEach(input => {
                console.log('🎹 MIDI Device:', input.name);
                this.midiInputs.push(input);

                input.onmidimessage = (msg) => this.handleMIDIMessage(msg);
            });

            // Listen for device changes
            midiAccess.onstatechange = (e) => {
                if (e.port.type === 'input') {
                    if (e.port.state === 'connected') {
                        console.log('🎹 MIDI Connected:', e.port.name);
                        e.port.onmidimessage = (msg) => this.handleMIDIMessage(msg);
                        this.midiInputs.push(e.port);
                        this.updateStatus(`MIDI Connected: ${e.port.name}`);
                        this.updateMIDILed(true);
                    } else if (e.port.state === 'disconnected') {
                        console.log('🎹 MIDI Disconnected:', e.port.name);
                        this.midiInputs = this.midiInputs.filter(i => i.id !== e.port.id);
                        this.updateMIDILed(this.midiInputs.length > 0);
                        if (this.midiInputs.length === 0) {
                            this.updateStatus('No MIDI devices - use computer keyboard');
                        }
                    }
                }
            };

            if (this.midiInputs.length > 0) {
                this.updateStatus(`MIDI Ready: ${this.midiInputs[0].name}`);
                this.updateMIDILed(true);
            } else {
                this.updateStatus('No MIDI devices found - use computer keyboard');
                this.updateMIDILed(false);
            }

        } catch (err) {
            console.error('❌ MIDI Access Error:', err);
            this.updateStatus('MIDI access denied - use computer keyboard');
        }
    }

    handleMIDIMessage(msg) {
        const [status, data1, data2] = msg.data;
        const command = status & 0xf0;
        const channel = status & 0x0f;

        switch (command) {
            case 0x90: // Note On
                if (data2 > 0) { // Velocity > 0
                    const note = Tone.Frequency(data1, "midi").toNote();
                    const velocity = data2 / 127; // Convert 0-127 to 0-1
                    this.noteOn(note, velocity);
                    this.highlightKey(note, true);
                } else {
                    // Note on with velocity 0 = note off
                    const note = Tone.Frequency(data1, "midi").toNote();
                    this.noteOff(note);
                    this.highlightKey(note, false);
                }
                break;

            case 0x80: // Note Off
                const note = Tone.Frequency(data1, "midi").toNote();
                this.noteOff(note);
                this.highlightKey(note, false);
                break;

            case 0xb0: // Control Change
                this.handleMIDICC(data1, data2);
                break;

            case 0xe0: // Pitch Bend
                this.handlePitchBend(data1, data2);
                break;
        }
    }

    handleMIDICC(cc, value) {
        // Map common MIDI CCs to synth parameters
        const normalized = value / 127;

        switch (cc) {
            case 1: // Mod Wheel -> LFO Pitch
                this.updateLFO('pitch', normalized * 100);
                break;
            case 74: // Filter Cutoff
                this.updateFilter('freq', 20 + (normalized * 9980));
                break;
            case 71: // Filter Resonance
                this.updateFilter('res', normalized * 20);
                break;
            case 91: // Reverb
                this.updateReverb('wet', normalized * 100);
                break;
        }
    }

    handlePitchBend(lsb, msb) {
        // Pitch bend: -8192 to +8191 (14-bit)
        const bendValue = (msb << 7) | lsb;
        const normalized = (bendValue - 8192) / 8192; // -1 to +1

        // Apply pitch bend to all active voices (±2 semitones)
        const bendAmount = normalized * 200; // ±200 cents = 2 semitones
        this.activeVoices.forEach(voice => {
            const baseFreq = Tone.Frequency(voice.note).toFrequency();
            const bentFreq = baseFreq * Math.pow(2, bendAmount / 1200);

            voice.osc1.frequency.rampTo(bentFreq + this.params.osc1.detune, 0.01);
            voice.osc2.frequency.rampTo(bentFreq + this.params.osc2.detune, 0.01);
            voice.osc3.frequency.rampTo(bentFreq + this.params.osc3.detune, 0.01);
            voice.osc4.frequency.rampTo(bentFreq + this.params.osc4.detune, 0.01);
        });
    }

    // Keyboard mapping
    createKeyboardMap() {
        return {
            // Lower octave (Z to M)
            'KeyZ': 'C3',
            'KeyS': 'C#3',
            'KeyX': 'D3',
            'KeyD': 'D#3',
            'KeyC': 'E3',
            'KeyV': 'F3',
            'KeyG': 'F#3',
            'KeyB': 'G3',
            'KeyH': 'G#3',
            'KeyN': 'A3',
            'KeyJ': 'A#3',
            'KeyM': 'B3',

            // Upper octave (Q to P)
            'KeyQ': 'C4',
            'Digit2': 'C#4',
            'KeyW': 'D4',
            'Digit3': 'D#4',
            'KeyE': 'E4',
            'KeyR': 'F4',
            'Digit5': 'F#4',
            'KeyT': 'G4',
            'Digit6': 'G#4',
            'KeyY': 'A4',
            'Digit7': 'A#4',
            'KeyU': 'B4',
            'KeyI': 'C5',
            'Digit9': 'C#5',
            'KeyO': 'D5',
            'Digit0': 'D#5',
            'KeyP': 'E5'
        };
    }

    initializeKeyboard() {
        // Computer keyboard input
        document.addEventListener('keydown', async (e) => {
            if (e.repeat) return;

            const note = this.keyboardMap[e.code];
            if (note && !this.pressedKeys.has(e.code)) {
                if (!this.audioStarted) {
                    await Tone.start();
                    this.audioStarted = true;
                }
                this.pressedKeys.add(e.code);
                this.noteOn(note);
                this.highlightKey(note, true);
            }
        });

        document.addEventListener('keyup', (e) => {
            const note = this.keyboardMap[e.code];
            if (note && this.pressedKeys.has(e.code)) {
                this.pressedKeys.delete(e.code);
                this.noteOff(note);
                this.highlightKey(note, false);
            }
        });

        // Create visual keyboard
        this.createVisualKeyboard();
    }

    createVisualKeyboard() {
        const keyboard = document.getElementById('keyboard');
        const octaves = [
            { start: 'C3', keys: ['C3', 'C#3', 'D3', 'D#3', 'E3', 'F3', 'F#3', 'G3', 'G#3', 'A3', 'A#3', 'B3'] },
            { start: 'C4', keys: ['C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4'] },
            { start: 'C5', keys: ['C5', 'C#5', 'D5', 'D#5', 'E5'] }
        ];

        let whiteKeyIndex = 0;
        const whiteKeyWidth = 40;

        octaves.forEach(octave => {
            octave.keys.forEach((note, i) => {
                const isBlack = note.includes('#');
                const key = document.createElement('div');
                key.className = `key ${isBlack ? 'black' : 'white'}`;
                key.dataset.note = note;

                // Find keyboard shortcut
                const shortcut = Object.entries(this.keyboardMap).find(([k, n]) => n === note);
                if (shortcut) {
                    const keyName = shortcut[0].replace('Key', '').replace('Digit', '');
                    key.innerHTML = `<span>${keyName}</span>`;
                }

                if (isBlack) {
                    key.style.left = `${(whiteKeyIndex * whiteKeyWidth) - 15}px`;
                } else {
                    whiteKeyIndex++;
                }

                key.addEventListener('mousedown', async (e) => {
                    e.preventDefault();
                    if (!this.audioStarted) {
                        await Tone.start();
                        this.audioStarted = true;
                    }
                    this.noteOn(note);
                });

                key.addEventListener('mouseup', (e) => {
                    e.preventDefault();
                    this.noteOff(note);
                });

                key.addEventListener('mouseleave', (e) => {
                    if (key.classList.contains('active')) {
                        this.noteOff(note);
                    }
                });

                key.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                });

                keyboard.appendChild(key);
            });
        });
    }

    highlightKey(note, active) {
        const key = document.querySelector(`[data-note="${note}"]`);
        if (key) {
            key.classList.toggle('active', active);
        }
    }

    updateStatus(message) {
        const statusText = document.getElementById('statusText');
        const statusIndicator = document.getElementById('statusIndicator');

        statusText.textContent = message;
        statusIndicator.classList.toggle('active', message.includes('Playing') || message.includes('Drone Mode: ON'));
    }

    updateLatencyDisplay() {
        const latencyMs = Math.round((Tone.context.baseLatency + Tone.context.outputLatency) * 1000);
        const latencyEl = document.getElementById('latencyDisplay');

        if (latencyEl) {
            latencyEl.textContent = `${latencyMs}ms`;

            // Color code based on latency
            if (latencyMs < 10) {
                latencyEl.style.color = '#4ade80'; // Green - excellent
            } else if (latencyMs < 20) {
                latencyEl.style.color = '#d4a574'; // Tan - good
            } else if (latencyMs < 50) {
                latencyEl.style.color = '#fbbf24'; // Yellow - okay
            } else {
                latencyEl.style.color = '#ef4444'; // Red - high
            }
        }
    }

    analyzeFrequencyBands(fftValues) {
        // FFT values are in decibels (-100 to 0)
        // Convert to linear scale (0 to 1) for easier processing
        const dbToLinear = (db) => Math.pow(10, db / 20);

        // Split frequency spectrum into bands
        // Assuming 512 FFT bins covering 0-22050 Hz (typical sample rate / 2)
        const bins = fftValues.length;

        // Bass: 20-250 Hz (roughly bins 0-6)
        const bassStart = 0;
        const bassEnd = Math.floor(bins * (250 / 22050));

        // Mids: 250-4000 Hz (roughly bins 6-93)
        const midStart = bassEnd;
        const midEnd = Math.floor(bins * (4000 / 22050));

        // Highs: 4000-22050 Hz (roughly bins 93-512)
        const highStart = midEnd;
        const highEnd = bins;

        // Calculate average energy for each band
        const getBandEnergy = (start, end) => {
            let sum = 0;
            for (let i = start; i < end; i++) {
                sum += dbToLinear(fftValues[i]);
            }
            return sum / (end - start);
        };

        const bassEnergy = getBandEnergy(bassStart, bassEnd);
        const midEnergy = getBandEnergy(midStart, midEnd);
        const highEnergy = getBandEnergy(highStart, highEnd);

        // Calculate overall RMS
        let rmsSum = 0;
        for (let i = 0; i < bins; i++) {
            const linear = dbToLinear(fftValues[i]);
            rmsSum += linear * linear;
        }
        const rms = Math.sqrt(rmsSum / bins);

        return {
            rms: Math.min(rms, 1),
            bass: Math.min(bassEnergy, 1),
            mid: Math.min(midEnergy, 1),
            high: Math.min(highEnergy, 1)
        };
    }

    updateMIDILed(active) {
        const midiLed = document.getElementById('midiLed');
        if (midiLed) {
            if (active) {
                midiLed.classList.add('active');
            } else {
                midiLed.classList.remove('active');
            }
        }
    }

    // UI Initialization
    initializeUI() {
        // Initialize all knobs
        this.initializeKnobs();

        // Waveform selectors
        ['osc1', 'osc2', 'osc3', 'osc4'].forEach((osc, i) => {
            document.getElementById(`${osc}-wave`).addEventListener('change', (e) => {
                this.updateOscillator(i + 1, 'wave', e.target.value);
            });
        });

        // Filter type
        document.getElementById('filter-type').addEventListener('change', (e) => {
            this.updateFilter('type', e.target.value);
        });

        // LFO waveform
        document.getElementById('lfo-wave').addEventListener('change', (e) => {
            this.updateLFO('wave', e.target.value);
        });

        // Drone switch
        document.getElementById('drone-switch').addEventListener('click', () => {
            this.toggleDrone();
        });
    }

    initializeKnobs() {
        const knobConfigs = {
            // Oscillators - better defaults, no FM on Osc1 (carrier)
            'osc1-level': { min: 0, max: 100, value: 70, onChange: (v) => this.updateOscillator(1, 'level', v) },
            'osc1-detune': { min: -50, max: 50, value: 0, onChange: (v) => this.updateOscillator(1, 'detune', v) },
            // No FM knob for osc1 - it's the carrier

            'osc2-level': { min: 0, max: 100, value: 30, onChange: (v) => this.updateOscillator(2, 'level', v) },
            'osc2-detune': { min: -50, max: 50, value: 0, onChange: (v) => this.updateOscillator(2, 'detune', v) },
            'osc2-fm': { min: 0, max: 100, value: 0, onChange: (v) => this.updateOscillator(2, 'fm', v) },

            'osc3-level': { min: 0, max: 100, value: 20, onChange: (v) => this.updateOscillator(3, 'level', v) },
            'osc3-detune': { min: -50, max: 50, value: 0, onChange: (v) => this.updateOscillator(3, 'detune', v) },
            'osc3-fm': { min: 0, max: 100, value: 0, onChange: (v) => this.updateOscillator(3, 'fm', v) },

            'osc4-level': { min: 0, max: 100, value: 10, onChange: (v) => this.updateOscillator(4, 'level', v) },
            'osc4-detune': { min: -50, max: 50, value: 0, onChange: (v) => this.updateOscillator(4, 'detune', v) },
            'osc4-fm': { min: 0, max: 100, value: 0, onChange: (v) => this.updateOscillator(4, 'fm', v) },

            // Amp envelope
            'amp-attack': { min: 0.001, max: 2, value: 0.01, step: 0.001, format: (v) => v.toFixed(3), onChange: (v) => this.updateAmpEnvelope('attack', v) },
            'amp-decay': { min: 0.01, max: 2, value: 0.2, step: 0.01, format: (v) => v.toFixed(2), onChange: (v) => this.updateAmpEnvelope('decay', v) },
            'amp-sustain': { min: 0, max: 1, value: 0.5, step: 0.01, format: (v) => v.toFixed(2), onChange: (v) => this.updateAmpEnvelope('sustain', v) },
            'amp-release': { min: 0.01, max: 5, value: 0.8, step: 0.01, format: (v) => v.toFixed(2), onChange: (v) => this.updateAmpEnvelope('release', v) },

            // Filter
            'filter-freq': { min: 20, max: 10000, value: 2000, onChange: (v) => this.updateFilter('freq', v) },
            'filter-res': { min: 0.1, max: 20, value: 1, step: 0.1, format: (v) => v.toFixed(1), onChange: (v) => this.updateFilter('res', v) },

            // Filter envelope
            'filt-attack': { min: 0.001, max: 2, value: 0.05, step: 0.001, format: (v) => v.toFixed(3), onChange: (v) => this.updateFilterEnvelope('attack', v) },
            'filt-decay': { min: 0.01, max: 2, value: 0.3, step: 0.01, format: (v) => v.toFixed(2), onChange: (v) => this.updateFilterEnvelope('decay', v) },
            'filt-sustain': { min: 0, max: 1, value: 0.5, step: 0.01, format: (v) => v.toFixed(2), onChange: (v) => this.updateFilterEnvelope('sustain', v) },
            'filt-amount': { min: 0, max: 5000, value: 2000, onChange: (v) => this.updateFilterEnvelope('amount', v) },

            // LFO
            'lfo-rate': { min: 0.1, max: 20, value: 2.0, step: 0.1, format: (v) => v.toFixed(1), onChange: (v) => this.updateLFO('rate', v) },
            'lfo-pitch': { min: 0, max: 100, value: 0, onChange: (v) => this.updateLFO('pitch', v) },
            'lfo-filter': { min: 0, max: 100, value: 0, onChange: (v) => this.updateLFO('filter', v) },
            'lfo-amp': { min: 0, max: 100, value: 0, onChange: (v) => this.updateLFO('amp', v) },

            // Reverb
            'reverb-decay': { min: 0.1, max: 10, value: 2.5, step: 0.1, format: (v) => v.toFixed(1), onChange: (v) => this.updateReverb('decay', v) },
            'reverb-wet': { min: 0, max: 100, value: 25, onChange: (v) => this.updateReverb('wet', v) },

            // Master
            'master-volume': { min: 0, max: 100, value: 70, onChange: (v) => this.updateMasterVolume(v) }
        };

        document.querySelectorAll('[data-knob]').forEach(el => {
            const id = el.dataset.knob;
            const config = knobConfigs[id];
            if (!config) return;

            const knob = new Knob(el, config);
            const valueEl = document.querySelector(`[data-value="${id}"]`);

            if (valueEl) {
                const displayValue = config.format ? config.format(config.value) : Math.round(config.value);
                valueEl.textContent = displayValue;
            }

            el.knobInstance = knob;
        });
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
            format: config.format || null,
            onChange: config.onChange || (() => {})
        };

        this.isDragging = false;
        this.startY = 0;
        this.startValue = this.config.value;

        this.bindEvents();
        this.updateRotation();

        // Trigger initial value
        setTimeout(() => {
            this.config.onChange(this.config.value);
        }, 100);
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

        if (this.config.step) {
            newValue = Math.round(newValue / this.config.step) * this.config.step;
        }

        if (Math.abs(newValue - this.config.value) > 0.001) {
            this.config.value = newValue;
            this.updateRotation();
            this.updateDisplay();
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

        if (this.config.step) {
            newValue = Math.round(newValue / this.config.step) * this.config.step;
        }

        if (Math.abs(newValue - this.config.value) > 0.001) {
            this.config.value = newValue;
            this.updateRotation();
            this.updateDisplay();
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
        // Maps 0-100% to -135 to +135 degrees (270° range)
        // For detune (-50 to +50), value 0 = 50% = 0 degrees (12 o'clock) ✓
        const degrees = -135 + (percentage * 270);
        this.indicator.style.transform = `translateX(-50%) rotate(${degrees}deg)`;
        this.indicator.style.transformOrigin = 'center bottom';
    }

    updateDisplay() {
        const valueEl = document.querySelector(`[data-value="${this.element.dataset.knob}"]`);
        if (valueEl) {
            const displayValue = this.config.format ?
                this.config.format(this.config.value) :
                Math.round(this.config.value);
            valueEl.textContent = displayValue;
        }
    }

    setValue(value) {
        this.config.value = Math.max(this.config.min, Math.min(this.config.max, value));
        this.updateRotation();
        this.updateDisplay();
    }
}

// Initialize synth
console.log('Initializing FM Synth...');
const synth = new FMSynth();
console.log('FM Synth ready!');
