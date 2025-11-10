# Instrument Integration Guide

This guide explains how to adapt your existing standalone instruments to work as modules in the Simple DAW.

## Overview

Your standalone instruments (Step Sequencer, Drum Machine, etc.) are currently self-contained HTML files. To use them in the DAW, we need to:

1. Extract the audio engine class
2. Create a modular interface
3. Expose necessary controls
4. Handle DAW lifecycle events

## The Instrument API

Every instrument module must implement this interface:

```javascript
class InstrumentModule {
    constructor(outputNode) {
        // outputNode: Tone.Channel where instrument should connect
        // Initialize your instrument and connect to outputNode
    }

    // Lifecycle methods
    start() {
        // Start playing/generating audio
        // Called when DAW transport starts
    }

    stop() {
        // Stop playing/generating audio
        // Called when DAW transport stops
    }

    dispose() {
        // Clean up resources
        // Called when track is removed
    }

    // State management
    getState() {
        // Return JSON-serializable object with all settings
        return { /* your state */ };
    }

    setState(state) {
        // Restore from saved state
    }

    // UI integration (optional)
    getUI() {
        // Return HTML element for instrument controls
        // Can return null if no UI needed
        return domElement;
    }

    // Metadata
    static getInfo() {
        return {
            name: "Instrument Name",
            version: "1.0",
            author: "Your Name"
        };
    }
}
```

## Step-by-Step Conversion

### Step 1: Extract the Audio Engine

Take your existing instrument class (e.g., `StepSequencer`) and prepare it for module use.

**Before (standalone):**
```javascript
class StepSequencer {
    constructor() {
        this.masterVolume = new Tone.Volume(-8).toDestination();
        // ... rest of initialization
    }
}
```

**After (module):**
```javascript
class StepSequencerModule {
    constructor(outputNode) {
        this.output = outputNode;
        this.masterVolume = new Tone.Volume(-8).connect(this.output);
        // ... rest of initialization
    }
}
```

**Key Change:** Instead of `.toDestination()`, connect to the provided `outputNode`.

### Step 2: Adapt Transport Control

Your instruments already use `Tone.Transport`, which is perfect. The DAW will control the transport, so your instrument just needs to respond.

**Ensure these methods exist:**
```javascript
start() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    // Don't start Tone.Transport here - DAW handles it
    // Just set up your sequence
    this.sequence = new Tone.Sequence(/* ... */);
    this.sequence.start(0);
}

stop() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    if (this.sequence) {
        this.sequence.stop();
        this.sequence.dispose();
    }
    // Don't stop Tone.Transport - DAW handles it
}
```

### Step 3: Handle Tempo Sync

Remove BroadcastChannel code - the DAW handles tempo sync internally.

**Remove:**
```javascript
// Remove this setup
this.syncChannel = new BroadcastChannel('music_tempo_sync');
this.syncChannel.onmessage = (event) => { /* ... */ };
```

**Replace with:**
```javascript
setTempo(bpm) {
    this.tempo = bpm;
    // Just store it, DAW will update Tone.Transport
}
```

### Step 4: Create UI (Optional)

You can provide a control panel for the instrument.

```javascript
getUI() {
    const container = document.createElement('div');
    container.className = 'instrument-controls';
    container.innerHTML = `
        <div class="control-group">
            <label>Filter</label>
            <input type="range" class="filter-knob" min="200" max="10000" value="5000">
        </div>
        <!-- Add your controls -->
    `;

    // Bind event listeners
    container.querySelector('.filter-knob').addEventListener('input', (e) => {
        this.updateFilter(e.target.value);
    });

    return container;
}
```

### Step 5: State Management

Implement save/load for your instrument settings.

```javascript
getState() {
    return {
        steps: JSON.parse(JSON.stringify(this.steps)),
        tempo: this.tempo,
        filterFreq: this.filter.frequency.value,
        reverbWet: this.reverb.wet.value,
        // Include all parameters that should persist
    };
}

setState(state) {
    this.steps = JSON.parse(JSON.stringify(state.steps));
    this.tempo = state.tempo;
    this.filter.frequency.value = state.filterFreq;
    this.reverb.wet.value = state.reverbWet;
    // Restore all parameters
}
```

## Complete Example: Step Sequencer Module

Here's a minimal conversion of your Step Sequencer:

```javascript
// step-sequencer-module.js
class StepSequencerModule {
    constructor(outputNode) {
        this.output = outputNode;
        this.isPlaying = false;
        this.currentStep = 0;
        this.stepCount = 16;
        this.tempo = 120;

        this.initializeAudio();
        this.initializeSequence();
    }

    async initializeAudio() {
        // Create your audio graph
        this.reverb = new Tone.Reverb({
            decay: 2,
            wet: 0.3
        }).connect(this.output);

        await this.reverb.generate();

        this.filter = new Tone.Filter({
            frequency: 5000,
            type: "lowpass"
        }).connect(this.reverb);

        this.envelope = new Tone.AmplitudeEnvelope({
            attack: 0.01,
            decay: 0.1,
            sustain: 0.3,
            release: 0.2
        }).connect(this.filter);

        this.osc = new Tone.Oscillator({
            type: "triangle"
        }).connect(this.envelope).start();
    }

    initializeSequence() {
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
            const stepData = this.steps[step];
            if (stepData.active) {
                this.osc.frequency.setValueAtTime(
                    Tone.Frequency(stepData.pitch).toFrequency(),
                    time
                );
                this.envelope.triggerAttackRelease(0.2, time, stepData.velocity);
            }
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

    dispose() {
        this.stop();
        if (this.osc) this.osc.dispose();
        if (this.envelope) this.envelope.dispose();
        if (this.filter) this.filter.dispose();
        if (this.reverb) this.reverb.dispose();
    }

    getState() {
        return {
            steps: JSON.parse(JSON.stringify(this.steps)),
            stepCount: this.stepCount,
            tempo: this.tempo
        };
    }

    setState(state) {
        this.steps = JSON.parse(JSON.stringify(state.steps));
        this.stepCount = state.stepCount || 16;
        this.tempo = state.tempo || 120;
    }

    static getInfo() {
        return {
            name: "Step Sequencer",
            version: "1.0",
            author: "AI Tone Generator"
        };
    }
}

// Export for DAW to use
window.StepSequencerModule = StepSequencerModule;
```

## Common Pitfalls

### ❌ Don't Control Tone.Transport Directly
```javascript
// BAD
Tone.Transport.start();
Tone.Transport.stop();
Tone.Transport.bpm.value = 120;
```

```javascript
// GOOD - Let DAW control it
this.sequence.start(0);  // Relative to transport
this.sequence.stop();
this.tempo = 120;  // Store value, don't set transport
```

### ❌ Don't Connect to Destination Directly
```javascript
// BAD
this.volume = new Tone.Volume(-8).toDestination();
```

```javascript
// GOOD
this.volume = new Tone.Volume(-8).connect(this.output);
```

### ❌ Don't Use BroadcastChannel for Sync
```javascript
// BAD - Remove this
this.syncChannel = new BroadcastChannel('music_tempo_sync');
```

```javascript
// GOOD - DAW handles sync internally
// No cross-tab sync needed
```

## Testing Your Module

Create a simple test HTML file:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Instrument Test</title>
    <script src="https://unpkg.com/tone@14.8.49/build/Tone.js"></script>
    <script src="your-instrument-module.js"></script>
</head>
<body>
    <button id="start">Start</button>
    <button id="stop">Stop</button>

    <script>
        const testChannel = new Tone.Channel().toDestination();
        const instrument = new StepSequencerModule(testChannel);

        document.getElementById('start').addEventListener('click', async () => {
            await Tone.start();
            Tone.Transport.start();
            instrument.start();
        });

        document.getElementById('stop').addEventListener('click', () => {
            instrument.stop();
            Tone.Transport.stop();
        });
    </script>
</body>
</html>
```

## Advanced Topics

### Parameter Automation
(Future feature)

```javascript
automateParameter(paramName, value, time) {
    switch(paramName) {
        case 'filter':
            this.filter.frequency.rampTo(value, time);
            break;
        // ... other parameters
    }
}
```

### Custom UI Styling

The DAW provides these CSS classes you can use:
- `.instrument-controls` - Main container
- `.control-group` - Parameter group
- `.knob-container` - Knob control wrapper
- `.control-label` - Parameter label

### Performance Tips

1. **Use shared reverbs/delays** when possible
2. **Dispose unused nodes** in dispose() method
3. **Avoid creating/destroying nodes** during playback
4. **Use rampTo() for smooth parameter changes**
5. **Limit polyphony** to prevent CPU spikes

## Next Steps

1. Convert your Step Sequencer using the example above
2. Test it with the test HTML
3. Load it into the DAW
4. Repeat for Drum Machine and Drone Machine

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify Tone.js version (14.8.49 recommended)
3. Ensure all audio nodes are connected
4. Test standalone before integrating

Happy music making!
