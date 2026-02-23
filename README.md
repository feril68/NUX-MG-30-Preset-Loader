# mg30-controller-electron

An Electron desktop application built with Vue 3 and TypeScript to control the NUX MG-30 modeling guitar processor.

## Project Setup

### Install

```bash
$ npm install
```

### Development

```bash
$ npm run dev
```

### MIDI Debug Logs (optional)

Use these environment variables only when troubleshooting MIDI detection/connection:

- `DEBUG_MIDI=1` enables main-process MIDI debug logs.
- `VITE_DEBUG_MIDI=1` enables renderer-side MIDI debug logs.

Windows PowerShell example:

```powershell
$env:DEBUG_MIDI="1"
$env:VITE_DEBUG_MIDI="1"
npm run dev
```

Git Bash example:

```bash
DEBUG_MIDI=1 VITE_DEBUG_MIDI=1 npm run dev
```

### Build

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```
