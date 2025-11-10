/**
 * Step Sequencer Module
 * Converted from standalone Step Sequencer.html for use in Simple DAW
 *
 * This is a 16-step melodic sequencer with dual oscillators and effects
 */

class StepSequencerModule {
    constructor(outputNode) {
        this.output = outputNode;
        this.isPlaying = false;
        this.currentStep = 0;
        this.stepCount = 16;
        this.tempo = 120;
        this.gateLength = 0.5;

        this.initializeAudio();
        this.initializeSequence();
    }

    async initializeAudio() {
        // Effects chain: oscillators -> envelope -> filter -> reverb -> output

        // Reverb
        this.reverb = new Tone.Reverb({
            decay: 2,
            wet: 0.3
        }).connect(this.output);

        await this.reverb.generate();

        // Filter
        this.filter = new Tone.Filter({
            frequency: 5000,
            type: "lowpass",
            rolloff: -24
        }).connect(this.reverb);

        // Envelope for each note
        this.envelope = new Tone.AmplitudeEnvelope({
            attack: 0.01,
            decay: 0.1,
            sustain: 0.3,
            release: 0.2
        }).connect(this.filter);

        // Two oscillators
        this.osc1 = new Tone.Oscillator({
            type: "triangle",
            volume: -6
        }).connect(this.envelope);

        this.osc2 = new Tone.Oscillator({
            type: "sawtooth",
            volume: -6
        }).connect(this.envelope);

        // Start oscillators (envelope will control amplitude)
        this.osc1.start();
        this.osc2.start();

        // Sequence
        this.sequence = null;
    }

    initializeSequence() {
        // Default sequence: C major scale pattern
        const defaultNotes = ['C4', 'E4', 'G4', 'C5', 'B4', 'G4', 'E4', 'C4',
                             'D4', 'F4', 'A4', 'D5', 'C5', 'A4', 'F4', 'D4'];

        this.steps = Array(16).fill(null).map((_, i) => ({
            active: true,
            pitch: defaultNotes[i],
            velocity: 0.7
        }));
    }

    start() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.currentStep = 0;

        this.sequence = new Tone.Sequence((time, step) => {
            this.currentStep = step;
            this.triggerStep(step, time);
        }, Array.from({length: this.stepCount}, (_, i) => i), "16n");

        this.sequence.start(0);
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
    }

    triggerStep(step, time) {
        if (step >= this.stepCount) return;

        const stepData = this.steps[step];
        if (!stepData.active) return;

        // Set oscillator frequencies
        const freq = Tone.Frequency(stepData.pitch).toFrequency();
        this.osc1.frequency.setValueAtTime(freq, time);
        this.osc2.frequency.setValueAtTime(freq, time);

        // Trigger envelope with velocity
        const duration = (60 / this.tempo) * this.gateLength;
        this.envelope.triggerAttackRelease(duration, time, stepData.velocity);
    }

    updateStep(index, data) {
        this.steps[index] = { ...this.steps[index], ...data };
    }

    setTempo(bpm) {
        this.tempo = bpm;
        // Transport tempo is handled by DAW
    }

    updateGateLength(length) {
        this.gateLength = length;
    }

    updateOscMix(mix) {
        // Mix: 0 = all osc1, 100 = all osc2
        const osc1Vol = -60 + ((100 - mix) / 100) * 54; // -60 to -6 dB
        const osc2Vol = -60 + (mix / 100) * 54;
        this.osc1.volume.rampTo(osc1Vol, 0.1);
        this.osc2.volume.rampTo(osc2Vol, 0.1);
    }

    updateFilter(freq) {
        this.filter.frequency.rampTo(freq, 0.1);
    }

    updateReverb(wet) {
        this.reverb.wet.rampTo(wet / 100, 0.1);
    }

    updateOscWave(osc, type) {
        this[osc].type = type;
    }

    updateStepCount(count) {
        const wasPlaying = this.isPlaying;
        if (wasPlaying) this.stop();

        this.stepCount = count;

        if (wasPlaying) {
            setTimeout(() => this.start(), 100);
        }
    }

    randomizeSequence() {
        const notes = ['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3',
                     'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4',
                     'C5', 'D5', 'E5', 'F5'];

        this.steps.forEach((step, i) => {
            step.pitch = notes[Math.floor(Math.random() * notes.length)];
            step.velocity = 0.3 + Math.random() * 0.7;
            step.active = Math.random() > 0.3; // 70% chance of being active
        });
    }

    clearSequence() {
        this.steps.forEach(step => {
            step.active = false;
            step.velocity = 0.7;
        });
    }

    dispose() {
        this.stop();

        if (this.osc1) this.osc1.dispose();
        if (this.osc2) this.osc2.dispose();
        if (this.envelope) this.envelope.dispose();
        if (this.filter) this.filter.dispose();
        if (this.reverb) this.reverb.dispose();
    }

    getState() {
        return {
            steps: JSON.parse(JSON.stringify(this.steps)),
            stepCount: this.stepCount,
            tempo: this.tempo,
            gateLength: this.gateLength,
            osc1Type: this.osc1.type,
            osc2Type: this.osc2.type,
            filterFreq: this.filter.frequency.value,
            reverbWet: this.reverb.wet.value
        };
    }

    setState(state) {
        this.steps = JSON.parse(JSON.stringify(state.steps));
        this.stepCount = state.stepCount || 16;
        this.tempo = state.tempo || 120;
        this.gateLength = state.gateLength || 0.5;

        if (state.osc1Type) this.osc1.type = state.osc1Type;
        if (state.osc2Type) this.osc2.type = state.osc2Type;
        if (state.filterFreq) this.filter.frequency.value = state.filterFreq;
        if (state.reverbWet) this.reverb.wet.value = state.reverbWet;
    }

    getUI() {
        const container = document.createElement('div');
        container.className = 'step-sequencer-ui';
        container.style.cssText = 'padding: 20px;';

        container.innerHTML = `
            <style>
                .step-sequencer-ui {
                    color: #e0e0e0;
                }
                .seq-control-group {
                    margin-bottom: 20px;
                    padding: 15px;
                    background: rgba(40, 40, 60, 0.3);
                    border-radius: 8px;
                }
                .seq-control-group h4 {
                    margin-bottom: 12px;
                    color: #6a9bd8;
                    font-size: 0.9em;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                .seq-control-row {
                    display: grid;
                    grid-template-columns: 120px 1fr 80px;
                    gap: 10px;
                    align-items: center;
                    margin-bottom: 10px;
                }
                .seq-control-row label {
                    font-size: 0.85em;
                    color: #9a9aaa;
                }
                .seq-control-row input[type="range"] {
                    width: 100%;
                }
                .seq-control-row select {
                    width: 100%;
                    padding: 5px;
                    background: #3a3a4a;
                    border: 1px solid #4a4a5a;
                    color: #e0e0e0;
                    border-radius: 4px;
                }
                .seq-control-row .value {
                    text-align: right;
                    font-family: 'Courier New', monospace;
                    color: #6a9bd8;
                    font-size: 0.9em;
                }
                .seq-grid {
                    display: grid;
                    grid-template-columns: repeat(16, 1fr);
                    gap: 4px;
                    margin-top: 15px;
                }
                .seq-step {
                    aspect-ratio: 1;
                    background: rgba(60, 60, 80, 0.5);
                    border: 2px solid rgba(100, 100, 150, 0.3);
                    border-radius: 4px;
                    cursor: pointer;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.6em;
                    transition: all 0.15s ease;
                }
                .seq-step:hover {
                    background: rgba(80, 80, 100, 0.6);
                    border-color: rgba(106, 155, 216, 0.5);
                }
                .seq-step.active {
                    background: rgba(106, 155, 216, 0.4);
                    border-color: #6a9bd8;
                }
                .seq-step.playing {
                    background: rgba(106, 155, 216, 0.8);
                    border-color: #7aabf8;
                    box-shadow: 0 0 12px rgba(106, 155, 216, 0.6);
                }
                .seq-buttons {
                    display: flex;
                    gap: 10px;
                    margin-top: 15px;
                }
                .seq-button {
                    padding: 8px 16px;
                    background: #4a4a5a;
                    border: none;
                    border-radius: 4px;
                    color: #e0e0e0;
                    cursor: pointer;
                    font-size: 0.85em;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                .seq-button:hover {
                    background: #5a5a6a;
                }
            </style>

            <div class="seq-control-group">
                <h4>Oscillators</h4>
                <div class="seq-control-row">
                    <label>Osc 1 Type</label>
                    <select id="osc1-type">
                        <option value="sine">Sine</option>
                        <option value="triangle" selected>Triangle</option>
                        <option value="sawtooth">Sawtooth</option>
                        <option value="square">Square</option>
                    </select>
                    <div class="value"></div>
                </div>
                <div class="seq-control-row">
                    <label>Osc 2 Type</label>
                    <select id="osc2-type">
                        <option value="sine">Sine</option>
                        <option value="triangle">Triangle</option>
                        <option value="sawtooth" selected>Sawtooth</option>
                        <option value="square">Square</option>
                    </select>
                    <div class="value"></div>
                </div>
                <div class="seq-control-row">
                    <label>Osc Mix</label>
                    <input type="range" id="osc-mix" min="0" max="100" value="50">
                    <div class="value" id="osc-mix-val">50</div>
                </div>
            </div>

            <div class="seq-control-group">
                <h4>Effects</h4>
                <div class="seq-control-row">
                    <label>Filter</label>
                    <input type="range" id="filter" min="200" max="10000" value="5000">
                    <div class="value" id="filter-val">5000 Hz</div>
                </div>
                <div class="seq-control-row">
                    <label>Reverb</label>
                    <input type="range" id="reverb" min="0" max="100" value="30">
                    <div class="value" id="reverb-val">30%</div>
                </div>
                <div class="seq-control-row">
                    <label>Gate Length</label>
                    <input type="range" id="gate" min="10" max="100" value="50">
                    <div class="value" id="gate-val">50%</div>
                </div>
            </div>

            <div class="seq-control-group">
                <h4>Step Grid</h4>
                <div class="seq-grid" id="step-grid"></div>
                <div class="seq-buttons">
                    <button class="seq-button" id="randomize">Randomize</button>
                    <button class="seq-button" id="clear">Clear</button>
                </div>
            </div>
        `;

        // Build step grid
        const grid = container.querySelector('#step-grid');
        for (let i = 0; i < 16; i++) {
            const step = document.createElement('div');
            step.className = 'seq-step';
            step.dataset.step = i;
            if (this.steps[i].active) step.classList.add('active');
            step.textContent = (i + 1);
            step.addEventListener('click', () => {
                this.steps[i].active = !this.steps[i].active;
                step.classList.toggle('active', this.steps[i].active);
            });
            grid.appendChild(step);
        }

        // Bind controls
        container.querySelector('#osc1-type').addEventListener('change', (e) => {
            this.updateOscWave('osc1', e.target.value);
        });

        container.querySelector('#osc2-type').addEventListener('change', (e) => {
            this.updateOscWave('osc2', e.target.value);
        });

        container.querySelector('#osc-mix').addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            this.updateOscMix(val);
            container.querySelector('#osc-mix-val').textContent = val;
        });

        container.querySelector('#filter').addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            this.updateFilter(val);
            container.querySelector('#filter-val').textContent = val + ' Hz';
        });

        container.querySelector('#reverb').addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            this.updateReverb(val);
            container.querySelector('#reverb-val').textContent = val + '%';
        });

        container.querySelector('#gate').addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            this.updateGateLength(val / 100);
            container.querySelector('#gate-val').textContent = val + '%';
        });

        container.querySelector('#randomize').addEventListener('click', () => {
            this.randomizeSequence();
            // Update grid UI
            grid.querySelectorAll('.seq-step').forEach((step, i) => {
                step.classList.toggle('active', this.steps[i].active);
            });
        });

        container.querySelector('#clear').addEventListener('click', () => {
            this.clearSequence();
            // Update grid UI
            grid.querySelectorAll('.seq-step').forEach((step) => {
                step.classList.remove('active');
            });
        });

        // Animate current step
        setInterval(() => {
            grid.querySelectorAll('.seq-step').forEach((step, i) => {
                step.classList.toggle('playing', i === this.currentStep && this.isPlaying);
            });
        }, 50);

        return container;
    }

    static getInfo() {
        return {
            name: "Step Sequencer",
            version: "1.0",
            author: "AI Tone Generator",
            description: "16-step melodic sequencer with dual oscillators"
        };
    }
}

// Export for use in DAW
if (typeof window !== 'undefined') {
    window.StepSequencerModule = StepSequencerModule;
}
