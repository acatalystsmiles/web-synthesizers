# Muybridge Horse Animation

A code-generated, Muybridge-style sequential animation of a galloping horse, created for exhibition/installation display.

## Quick Launch

### Method 1: Double-Click (Easiest)
1. Locate the file: `muybridge-horse.html`
2. Double-click the file
3. Your default web browser will open and display the animation

### Method 2: Drag to Browser
1. Open any modern web browser (Chrome, Firefox, Safari, Edge)
2. Drag `muybridge-horse.html` into the browser window
3. The animation will load and begin playing

### Method 3: File Menu
1. Open your web browser
2. Go to **File → Open File** (or press `Ctrl+O` / `Cmd+O`)
3. Navigate to and select `muybridge-horse.html`
4. Click **Open**

---

## Controls

### View Modes
- **Animated**: Single large horse looping continuously (best for exhibition)
- **Grid**: All 16 frames displayed in a 4×4 grid (study mode)
- **Hybrid**: Animated horse on top, frame grid on bottom (combined view)

### Playback Controls
- **Play/Pause**: Start or stop the animation
- **Prev/Next**: Step through frames manually
- **Speed Slider**: Adjust animation from 2-24 FPS (default: 12 FPS)
- **Fullscreen**: Toggle fullscreen mode for installation display

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `SPACE` | Play/Pause |
| `1` | Animated mode |
| `2` | Grid mode |
| `3` | Hybrid mode |
| `←` | Previous frame |
| `→` | Next frame |
| `F` | Fullscreen toggle |
| `ESC` | Exit fullscreen |

---

## Exhibition Setup

### For Installation Display:
1. Open `muybridge-horse.html` in fullscreen mode (click button or press `F`)
2. Select **Animated** mode for continuous looping
3. Adjust speed to taste (recommend 8-12 FPS for the classic feel)
4. Set browser to prevent sleep mode:
   - **Chrome/Edge**: Install "Keep Awake" extension OR use `chrome://settings` → turn off sleep
   - **Firefox**: Use `about:config` → set `browser.sessionstore.interval` to high value
   - **Safari**: System Preferences → Energy Saver → prevent sleep

### Recommended Settings:
- **Mode**: Animated
- **Speed**: 12 FPS (natural gallop) or 6 FPS (studious pace)
- **Display**: Fullscreen on 1920x1080 or higher resolution monitor/projector
- **Browser**: Chrome or Firefox (best performance)

---

## Technical Specifications

- **Resolution**: 1080 × 1080 pixels (square format)
- **Frames**: 16 hand-coded vector silhouettes
- **Format**: Single self-contained HTML file (no external dependencies)
- **File Size**: ~36 KB
- **Browser Requirements**: Any modern browser (Chrome, Firefox, Safari, Edge)
- **Internet Required**: No (works completely offline)
- **Installation**: None needed

---

## Troubleshooting

### Animation doesn't start
- Check that JavaScript is enabled in your browser
- Try a different browser (recommend Chrome or Firefox)

### Display looks wrong
- Ensure browser window is at least 1080 pixels wide
- Try zooming to 100% (`Ctrl+0` / `Cmd+0`)
- Enter fullscreen mode for best display

### Performance issues
- Close other browser tabs
- Lower the FPS setting if animation stutters
- Try a different browser

### Fullscreen won't work
- Some browsers require user gesture (click button, don't use auto-fullscreen)
- Try the `F` keyboard shortcut
- Check browser permissions (allow fullscreen)

---

## About the Animation

This animation recreates Eadweard Muybridge's groundbreaking 1878 photographic motion study *The Horse in Motion*. All 16 frames are generated through code as vector silhouettes, honoring Muybridge's high-contrast aesthetic while using modern web technologies.

**Key Features**:
- **Historically authentic**: Black silhouettes on sepia background
- **Film strip aesthetic**: Rounded square frame with sprocket hole design
- **Educational**: Grid and hybrid modes allow detailed study of gallop mechanics
- **Exhibition-ready**: Fullscreen support, keyboard controls, adjustable timing

**Gallop Cycle Phases**:
- Frames 1-4: Gathered/compression (legs under body)
- Frames 5-8: Extension (including "floating" moment with all legs off ground)
- Frames 9-12: Mid-stride (back legs coming forward)
- Frames 13-16: Recovery (returning to gathered position)

---

## Credits

Inspired by **Eadweard Muybridge**'s *The Horse in Motion* (1878)

Created with:
- HTML5 Canvas API
- Pure JavaScript (no frameworks)
- CSS3 styling
- Love for motion studies and animation history

---

## Files Included

- `muybridge-horse.html` - The animation (this is all you need!)
- `MUYBRIDGE-README.md` - These instructions
- `DECISION_LOG.md` - Detailed rationale for all design and technical decisions

---

## License

This animation is created for exhibition/installation use. Feel free to use, modify, and display as needed.

---

**For questions, technical issues, or exhibition inquiries, refer to DECISION_LOG.md for detailed implementation notes.**

Enjoy the animation! 🐴
