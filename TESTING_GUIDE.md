# Testing Guide for Web Synthesizers Refinements

## Quick Verification Tests

### Test 1: Tempo Sync Between Instruments

**Setup:**
1. Open these files in separate browser tabs:
   - `Drum Machine v2.html`
   - `Step Sequencer.html`
   - `FM Synth.html`
   - `Lush Drone Machine v1.html`

**Test Steps:**
1. On Drum Machine v2:
   - Click "Play"
   - Adjust tempo to 140 BPM
   - Click "Broadcast" button
2. Check Console on Other Tabs:
   - Should see: "🎵 [Instrument]: Tempo synced to 140 BPM"
3. On Step Sequencer:
   - Should see status flash "Tempo synced!"
   - Verify tempo knob updated to 140
4. Open Browser Console (F12) and verify logs

**Expected Results:**
✅ All instruments show "Tempo synced!" message
✅ Drum machine and step sequencer play at same tempo
✅ Console logs show successful sync
❌ No JavaScript errors

---

### Test 2: FM Synth Algorithm Switching

**Setup:**
1. Open `FM Synth.html`
2. Open Browser Console (F12)

**Test Steps:**
1. Type in console: `synth.setAlgorithm(1)`
   - Should see: "🎛️ Switching to Algorithm 1: Cascade"
2. Play some notes - test tone
3. Type in console: `synth.setAlgorithm(5)`
   - Should see: "🎛️ Switching to Algorithm 5: Additive"
4. Play same notes - should sound completely different
5. Try all 8 algorithms (1-8)

**Algorithm Sound Characteristics:**
- Algorithm 1 (Cascade): Bright, bell-like
- Algorithm 2 (Dual Mod): Rich harmonics
- Algorithm 3 (Parallel): Warm, layered
- Algorithm 4 (Triple Mod): Complex, metallic
- Algorithm 5 (Additive): Smooth, organ-like
- Algorithm 6 (Dual Cascade): Evolving timbre
- Algorithm 7 (Fan Out): Lush pads
- Algorithm 8 (Dual Stack): Layered, thick

**Expected Results:**
✅ Each algorithm produces distinctly different timbres
✅ No audio clicks or pops when switching
✅ Console logs show algorithm changes
❌ No stuck notes or audio artifacts

---

### Test 3: LFO Tempo Sync (FM Synth)

**Setup:**
1. Open `Drum Machine v2.html` and `FM Synth.html`
2. Open console on FM Synth tab

**Test Steps:**
1. On Drum Machine:
   - Set tempo to 120 BPM
   - Click "Broadcast"
2. On FM Synth console:
   - Type: `synth.updateLFO('tempoSync', true)`
   - Type: `synth.updateLFO('division', '8n')`
   - Should see: "🎵 LFO synced to 8n at 120 BPM = X.XX Hz"
3. Enable LFO modulation (adjust LFO knobs in UI)
4. On Drum Machine, change tempo to 140 BPM and broadcast
5. FM Synth LFO should automatically adjust

**Note Divisions:**
- `1n` = 1 bar = slowest
- `2n` = half note
- `4n` = quarter note
- `8n` = eighth note (default)
- `16n` = sixteenth note
- `32n` = 32nd note = fastest

**Expected Results:**
✅ LFO frequency changes when tempo changes
✅ Console shows recalculated LFO frequency
✅ LFO modulation is audible and tempo-locked
❌ No audio dropouts

---

### Test 4: LFO Tempo Sync (Drone Machine)

**Setup:**
1. Open `Drum Machine v2.html` and `Lush Drone Machine v1.html`
2. Open console on Drone Machine tab

**Test Steps:**
1. On Drum Machine:
   - Set tempo to 100 BPM
   - Click "Broadcast"
2. On Drone Machine console:
   - Type: `synth.toggleLFOTempoSync()`
   - Should see: "LFO Tempo Sync: true"
   - Should see: "🎵 Drone LFO synced to 8n at 100 BPM = X.XX Hz"
3. Start the drone (click "Start")
4. Adjust LFO Depth knob to hear modulation
5. Change tempo on drum machine and verify LFO adjusts

**Expected Results:**
✅ Drone LFO locks to tempo
✅ Filter modulation is tempo-synced
✅ Console shows sync confirmations
❌ No phase issues or glitches

---

### Test 5: Multi-Instrument Jam Session

**The Ultimate Test:**

**Setup:**
1. Open all 4 synthesizers in separate tabs
2. Set master tempo on Drum Machine to 120 BPM

**Test Steps:**
1. **Drum Machine**:
   - Create a basic kick/snare pattern
   - Click "Play" and "Broadcast"
2. **Step Sequencer**:
   - Program a melodic sequence
   - Click "Play"
   - Verify it's in sync with drums
3. **FM Synth**:
   - Enable LFO tempo sync (console)
   - Set Algorithm 3 (Parallel)
   - Play chord over the pattern
4. **Drone Machine**:
   - Start the drone
   - Enable LFO tempo sync (console)
   - Add subtle filter modulation

**Expected Results:**
✅ All instruments play in perfect sync
✅ Tempo changes affect all instruments
✅ No drift over time
✅ Everything sounds musical together
❌ No timing glitches

---

## Debugging Common Issues

### Issue: "BroadcastChannel not supported"

**Solution:**
- Use a modern browser (Chrome 54+, Firefox 38+, Edge 79+)
- Safari doesn't support BroadcastChannel - use Chrome/Firefox

### Issue: No tempo sync happening

**Check:**
1. Are all tabs from the same origin (same domain)?
2. Check browser console for errors
3. Verify BroadcastChannel API is supported
4. Try refreshing all tabs

### Issue: Algorithm switching causes audio clicks

**Workaround:**
- Release all keys before switching algorithms
- This is a known issue to be fixed

### Issue: LFO tempo sync not working

**Check:**
1. Is tempo sync enabled? (console command)
2. Is the division set? (default is '8n')
3. Is LFO depth > 0? (modulation needs to be audible)
4. Check console logs for sync messages

---

## Performance Testing

### Memory Leak Test:

1. Open Chrome Task Manager (Shift+Esc)
2. Play/stop instruments repeatedly for 5 minutes
3. Monitor memory usage - should stay relatively stable

### CPU Usage Test:

1. Open all 4 instruments
2. Play all simultaneously
3. Check CPU usage (should be < 30% on modern hardware)

---

## Browser Compatibility

| Browser | Tempo Sync | Algorithms | LFO Sync | Notes |
|---------|------------|------------|----------|-------|
| Chrome 90+ | ✅ | ✅ | ✅ | Recommended |
| Firefox 88+ | ✅ | ✅ | ✅ | Recommended |
| Edge 90+ | ✅ | ✅ | ✅ | Chromium-based |
| Safari | ❌ | ✅ | ⚠️ | No BroadcastChannel |
| Opera | ✅ | ✅ | ✅ | Chromium-based |

---

## Console Commands Reference

### FM Synth:
```javascript
// Switch algorithm (1-8)
synth.setAlgorithm(3);

// Enable LFO tempo sync
synth.updateLFO('tempoSync', true);

// Set LFO note division
synth.updateLFO('division', '8n'); // Options: '1n', '2n', '4n', '8n', '16n', '32n'

// Check current algorithm
synth.currentAlgorithm;

// Check current tempo
synth.tempo;
```

### Drone Machine:
```javascript
// Toggle LFO tempo sync
synth.toggleLFOTempoSync();

// Set division (must modify parameters directly for now)
synth.parameters.lfoDivision = '4n';
synth.updateLFOTempoSync();

// Check sync status
synth.lfoTempoSync;
```

### Drum Machine:
```javascript
// Broadcast tempo manually
drumMachine.broadcastTempo(140);

// Update tempo
drumMachine.updateTempo(128);
```

---

## What's Working (✅) vs To-Do (❌)

### ✅ Working:
- Tempo sync via BroadcastChannel
- FM algorithm switching
- LFO tempo sync logic
- Dynamic voice routing
- Algorithm definitions (8 types)
- Visual sync indicators
- Console logging

### ❌ Needs UI:
- Algorithm selector dropdown in FM Synth
- LFO tempo sync toggle buttons
- Note division selectors
- Visual algorithm display
- Sync status indicators

### ⚠️ Known Issues:
- Algorithm switching while notes are held may click
- Safari doesn't support BroadcastChannel
- UI controls missing for new features

---

## Next Testing Phase

After UI implementation:
1. User acceptance testing
2. Cross-browser verification
3. Performance benchmarking
4. Sound quality evaluation
5. Long-term stability testing

---

## Reporting Issues

If you find bugs:
1. Note which browser/version
2. Reproduction steps
3. Console error messages
4. Expected vs actual behavior

---

Generated: 2025-11-10
Test Version: v1.0.0
