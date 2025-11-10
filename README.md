# Simple DAW - Digital Audio Workstation

A browser-based DAW for loading, recording, arranging, mixing, and exporting your step sequencer instruments.

## Architecture Overview

### Core Components

1. **Track System**
   - Each track hosts one instrument instance
   - Independent volume, pan, solo, and mute controls
   - Visual waveform display when armed/recorded
   - Color-coded for easy identification

2. **Transport Controls**
   - Master play/stop/record
   - Tempo control (synced across all instruments)
   - Position indicator showing current playback time
   - Loop region support

3. **Mixer View**
   - Per-track channel strips with:
     - Volume fader (-∞ to +6 dB)
     - Pan control (L-R)
     - Solo/Mute buttons
     - Track color indicator
   - Master output fader
   - Level meters for visual feedback

4. **Timeline/Arrangement**
   - Bar/beat grid display
   - Clip-based arrangement
   - Clips can be:
     - Recorded audio
     - Pattern snapshots from instruments
   - Drag clips to arrange on timeline
   - Visual length indicators

5. **Instrument Loading**
   - Load instruments into tracks dynamically
   - Each instrument runs in isolation
   - Instruments maintain their own UI and controls
   - All instruments sync to master Transport

6. **Recording System**
   - Arm individual tracks for recording
   - Real-time recording with visual feedback
   - Overdub support
   - Count-in before recording starts

7. **Export System**
   - Export full mix to WAV
   - Solo/mute respected during export
   - Offline rendering (faster than real-time)
   - Progress indicator
   - Automatic download when complete

## Technical Stack

- **Tone.js** - Audio engine and synthesis
- **Web Audio API** - Low-level audio processing
- **BroadcastChannel** - Cross-tab tempo sync (inherited from instruments)
- **LocalStorage** - Project and pattern saving
- **Canvas API** - Waveform visualization

## Audio Signal Flow

```
[Instrument 1] → [Track 1 Channel] → [Solo/Mute Logic] → [Master Bus] → Output
[Instrument 2] → [Track 2 Channel] → [Solo/Mute Logic] → [Master Bus] → Output
[Instrument 3] → [Track 3 Channel] → [Solo/Mute Logic] → [Master Bus] → Output
```

Each track has:
- Tone.Channel (volume + pan)
- Solo/Mute state
- Recording buffer
- Visual meter

## Key Features

### Current Implementation
- ✅ Load multiple instrument instances
- ✅ Independent track mixing (volume, pan)
- ✅ Solo/mute functionality
- ✅ Master transport control
- ✅ Tempo synchronization
- ✅ Real-time level meters
- ✅ Record individual tracks
- ✅ Export full mix to WAV
- ✅ Save/load projects

### Future Enhancements
- Timeline view with clips
- Automation recording (parameter changes)
- Multiple takes per track
- Track effects (EQ, compression)
- Send effects (reverb, delay buses)
- MIDI file export
- Stem export (individual tracks)

## File Structure

```
AI Tone Generator/
├── README.md                    # This file
├── INTEGRATION_GUIDE.md         # How to adapt instruments for DAW
├── Simple DAW.html              # Main DAW application
├── instruments/                 # Adapted instrument modules
│   ├── step-sequencer-module.js
│   ├── drum-machine-module.js
│   └── drone-machine-module.js
├── Step Sequencer.html          # Original standalone instrument
├── Drum Machine v2.html         # Original standalone instrument
└── Lush Drone Machine v1.html   # Original standalone instrument
```

## Usage

### Quick Start

1. Open `Simple DAW.html` in a modern browser
2. Click "Add Track" to create a new track
3. Select an instrument from the dropdown
4. Adjust track volume/pan in the mixer
5. Click Play on the master transport
6. Click "Export Mix" when ready to render

### Recording Workflow

1. Arm a track by clicking the record button on that track
2. Click the master Record button to start recording
3. Recording captures the live output of the instrument
4. Stop recording and the clip appears on the timeline
5. Repeat for other tracks

### Mixing

- Use track faders to balance levels
- Pan controls to position in stereo field
- Solo to isolate specific tracks
- Mute to silence tracks temporarily
- Master fader for overall output level

### Exporting

- Click "Export Mix" button
- DAW renders the full timeline offline (faster than real-time)
- Solo/mute settings are respected
- Automatic WAV download when complete
- 44.1kHz, 16-bit stereo by default

## Browser Compatibility

Requires a modern browser with:
- Web Audio API support
- ES6+ JavaScript
- Canvas API
- Download attribute support

Tested on:
- Chrome 90+
- Firefox 88+
- Edge 90+
- Safari 14+

## Performance Considerations

- Each instrument is an independent audio graph
- Recommended maximum: 8-12 simultaneous tracks
- Complex instruments (many oscillators) count as "heavier" tracks
- Offline rendering allows for more tracks than real-time playback
- Use solo/mute to reduce CPU load during editing

## Limitations

- Browser-based, so limited by JavaScript performance
- No VST/AU plugin support (native instruments only)
- No multi-threading (Web Workers not used for audio)
- Export limited to WAV format
- No MIDI input (future enhancement)

## Contributing Instruments

See `INTEGRATION_GUIDE.md` for detailed instructions on:
- Adapting existing HTML instruments to modules
- Creating new instrument modules from scratch
- Instrument API requirements
- Best practices for DAW integration

## License

Open source - feel free to modify and extend!
