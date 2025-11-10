# UI Controls Guide - Web Synthesizers

## New Features Now Available in UI!

All the professional features added in this refinement are now accessible through intuitive UI controls.

---

## FM Synth - New Controls

### 1. FM Algorithm Selector
**Location:** Top panel, immediately after the header

**What it does:**
- Switches between 8 professional FM algorithms
- Changes how the 4 operators are routed
- Each algorithm produces vastly different timbres

**How to use:**
1. Click the dropdown menu labeled "Routing Configuration"
2. Select from 8 algorithms:
   - **Algorithm 1 - Cascade**: Classic 4→3→2→1 chain for bells and piano
   - **Algorithm 2 - Dual Mod**: Two modulators for rich harmonics
   - **Algorithm 3 - Parallel**: Parallel stacks for brass/strings
   - **Algorithm 4 - Triple Mod**: Three modulators for metallic tones
   - **Algorithm 5 - Additive**: All parallel for organ sounds
   - **Algorithm 6 - Dual Cascade**: Evolving timbres
   - **Algorithm 7 - Fan Out**: Lush pads
   - **Algorithm 8 - Dual Stack**: Thick layered sounds

3. The description below updates to show the current algorithm

**Sound Design Tips:**
- Start with Algorithm 1 for classic FM sounds
- Use Algorithm 5 (Additive) for smooth, clean tones
- Try Algorithm 4 (Triple Mod) for complex, evolving sounds
- Algorithm 7 (Fan Out) is great for ambient pads

---

### 2. LFO Tempo Sync
**Location:** LFO panel, right section

**What it does:**
- Synchronizes LFO rate to tempo from other instruments
- Uses note divisions (musical time) instead of Hz
- Keeps all modulation in time with drums/sequencer

**How to use:**

#### Enable Tempo Sync:
1. Find the "Tempo Sync" toggle in the LFO panel
2. Click the checkbox to enable
3. Label changes to "Rate (Synced)" to confirm
4. Division selector appears below

#### Set Note Division:
1. Choose from the dropdown:
   - **1n** = Whole note (4 beats) - Very slow
   - **2n** = Half note (2 beats)
   - **4n** = Quarter note (1 beat)
   - **8n** = Eighth note (½ beat) - Default
   - **16n** = Sixteenth note (¼ beat)
   - **32n** = Thirty-second note - Very fast

2. LFO automatically adjusts to tempo changes

#### Test It:
1. Open **Drum Machine v2** in another tab
2. Click "Play" and set tempo to 120 BPM
3. Click "Broadcast" button
4. FM Synth LFO syncs instantly!
5. Change drum tempo → FM LFO adjusts automatically

**When to Use:**
- Creating rhythmic modulation effects
- Keeping filter sweeps in time with beat
- Synchronizing vibrato with groove
- Building cohesive multi-instrument jams

---

## Drone Machine - New Controls

### LFO Tempo Sync Button
**Location:** Filter & Effects section, between LFO Depth and Reverb

**What it does:**
- Locks the LFO modulation to tempo from other instruments
- Changes filter sweeps from Hz to musical note divisions
- Perfect for rhythmic drone evolution

**How to use:**

#### Enable Sync:
1. Find the "LFO Sync" button
2. Click once to toggle ON
3. Button turns green and shows "ON"
4. Division dropdown appears below

#### Disable Sync:
1. Click the button again
2. Button turns blue and shows "OFF"
3. LFO returns to free-running mode (Hz)

#### Choose Division:
1. When sync is ON, select from dropdown:
   - Same options as FM Synth (1n to 32n)
   - Default: 8n (eighth notes)

#### Setup Multi-Synth Jam:
1. **Tab 1**: Open Drum Machine v2
   - Create a beat
   - Set tempo (e.g., 128 BPM)
   - Click "Broadcast"

2. **Tab 2**: Open Lush Drone Machine
   - Click "Start" to begin drone
   - Click "LFO Sync" button → ON
   - Set division to "4n" or "8n"
   - Adjust LFO Depth to taste

3. **Tab 3**: Open FM Synth
   - Enable LFO Tempo Sync
   - Play chords/melodies

4. All LFOs now move together in perfect sync!

**Pro Tips:**
- Slower divisions (1n, 2n) for evolving drones
- Faster divisions (16n, 32n) for pulsing, rhythmic effects
- Combine with Evolve mode for organic tempo-synced movement

---

## Complete Workflow Example

### Creating a Synchronized Multi-Synth Performance

**Step 1: Setup Your Environment**
```
Tab 1: Drum Machine v2.html
Tab 2: Step Sequencer.html
Tab 3: FM Synth.html
Tab 4: Lush Drone Machine v1.html
```

**Step 2: Master Tempo (Drum Machine)**
1. Click "Play"
2. Program a basic kick/snare pattern
3. Set tempo knob to 125 BPM
4. Click "Broadcast" button
5. Watch other tabs sync (check console logs)

**Step 3: Step Sequencer**
1. Verify tempo synced (should show "Tempo synced!")
2. Program a melodic sequence
3. Click "Play"
4. Sequence plays locked to drum tempo

**Step 4: FM Synth**
1. Select Algorithm 3 (Parallel) for warm sound
2. Enable LFO Tempo Sync checkbox
3. Set division to "8n"
4. Set LFO Filter to ~30 for subtle movement
5. Play chords on keyboard - filter sweeps in time!

**Step 5: Drone Machine**
1. Adjust oscillators for deep pad
2. Click "Start"
3. Click "LFO Sync" button → ON
4. Set division to "2n" (slow evolution)
5. Adjust LFO Depth to ~40
6. Enable "Evolve" for organic movement

**Step 6: Adjust & Perform**
1. Change tempo on drum machine
2. All instruments adjust automatically
3. Try different FM algorithms on the fly
4. Adjust LFO divisions for rhythmic variation

**Result:** Four synchronized instruments playing together in perfect time!

---

## Keyboard Shortcuts

### FM Synth:
- **Z-M** keys: Play notes (chromatic)
- **A-K** keys (top row): Play notes (chromatic continuation)
- **Drone Mode Switch**: Toggles drone mode (single note sustain)

### Console Commands (for advanced users):
```javascript
// FM Synth
synth.setAlgorithm(5);  // Switch to algorithm 5
synth.updateLFO('division', '4n');  // Change division

// Drone Machine
synth.toggleLFOTempoSync();  // Toggle sync
synth.parameters.lfoDivision = '16n';  // Set division
synth.updateLFOTempoSync();  // Apply change
```

---

## Troubleshooting

### "Tempo Synced!" message doesn't appear
**Solution:**
- Make sure all tabs are from the same origin
- Check browser supports BroadcastChannel API (Chrome/Firefox/Edge)
- Safari doesn't support BroadcastChannel - use Chrome
- Try refreshing all tabs

### LFO doesn't sync
**Check:**
1. Is tempo sync toggle ON?
2. Is division selector visible?
3. Did you click "Broadcast" on drum machine?
4. Check browser console (F12) for sync messages

### Algorithm switching causes audio clicks
**Workaround:**
- Release all keys before switching algorithms
- This is a known limitation being addressed

### No sound from synthesizers
**Check:**
1. Did you click on the page first? (audio context activation)
2. Is master volume up?
3. Check browser didn't auto-mute the tab
4. Look for error messages in console

---

## Visual Indicators

### FM Synth:
- **Algorithm Description**: Updates when you change algorithms
- **Rate (Synced)**: Label changes when tempo sync is on
- **Division Selector**: Only visible when sync enabled

### Drone Machine:
- **Button Color**: Blue (OFF) → Green (ON)
- **Status Text**: "Tempo Synced!" flashes when sync received

### General:
- **Console Logs**:
  - `🎵 FM Synth: Tempo synced to 120 BPM`
  - `🎵 Drone: Tempo synced to 120 BPM`
  - `🎵 LFO synced to 8n at 120 BPM = 4.00 Hz`

---

## Best Practices

### Performance Tips:
1. **Don't open too many tabs** - 4-5 synths max for smooth performance
2. **Use Chrome or Firefox** - Best Web Audio API support
3. **Lower LFO rates** when using fast divisions (16n, 32n)
4. **Start simple** - Get drums + one synth working first

### Sound Design:
1. **Algorithm Selection** - Choose based on desired timbre
2. **FM Amounts** - Start low (10-20) and increase gradually
3. **LFO Sync** - Match divisions to groove (4n/8n for most music)
4. **Layering** - Use different algorithms on different synths

### Tempo Sync:
1. **Set master tempo first** on drum machine
2. **Broadcast immediately** after tempo change
3. **Enable sync** on instruments before playing
4. **Adjust divisions** to taste after sync is working

---

## Feature Compatibility

| Feature | FM Synth | Drone Machine | Step Sequencer | Drum Machine |
|---------|----------|---------------|----------------|--------------|
| Tempo Sync | ✅ | ✅ | ✅ | ✅ (broadcasts) |
| LFO Sync | ✅ | ✅ | N/A | N/A |
| Algorithms | ✅ (8 types) | N/A | N/A | N/A |
| MIDI Support | ✅ | ❌ | ❌ | ❌ |
| Patch Save/Load | ❌ | ✅ | ✅ | ✅ |

---

## What's Next?

### Already Implemented (Backend):
- ✅ 8 FM Algorithms with dynamic routing
- ✅ Tempo sync via BroadcastChannel
- ✅ LFO tempo sync with note divisions
- ✅ Velocity sensitivity
- ✅ Visual feedback

### UI Now Complete:
- ✅ Algorithm selector dropdown
- ✅ LFO tempo sync toggle
- ✅ Division selectors
- ✅ Visual indicators

### Future Enhancements:
- Per-operator velocity sensitivity controls
- Envelope curve shapes (exp, lin, log)
- Drone unison/voice spreading
- More FM algorithms (total of 16, like DX7)
- Preset browser system
- Performance macros

---

## Credits

**Built with:**
- Tone.js - Web Audio API framework
- BroadcastChannel API - Cross-tab communication
- Vanilla JavaScript - No dependencies

**Inspired by:**
- Yamaha DX7 - FM synthesis algorithms
- Native Instruments FM8 - Modern FM design
- Modular synthesis principles

---

## Feedback & Issues

Found a bug? Have a feature request?

**Console Debugging:**
1. Open browser console (F12)
2. Look for error messages
3. Check sync messages (🎵 emoji)
4. Note browser and version

**Common Info Needed:**
- Browser and version
- Which synthesizers
- Steps to reproduce
- Expected vs actual behavior

---

**Version:** 1.1.0
**Last Updated:** 2025-11-10
**Compatibility:** Chrome 90+, Firefox 88+, Edge 90+
