# Chronos

Chronos is a macOS time announcer with a React interface. It keeps the Mac awake and speaks the current time on a configurable schedule.

## Requirements

- macOS
- Node.js 18 or newer
- npm
- The macOS commands `say` and `caffeinate` (included with macOS)

## Install

From the Chronos project directory:

```bash
cd /Users/kiri/Developer/ark-git/07_MacTools/chronos
npm install
```

## Run Locally

Start the backend in one terminal:

```bash
npm run backend
```

The backend runs at `http://localhost:5001`.

Open a second terminal in the same project directory and start the React app:

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Use Chronos

1. Choose an announcement interval: `15s`, `30s`, `1m`, or `5m`.
2. For another value, enter a custom interval such as `10s`, `5m`, or `1h`.
3. Click the time orb to start announcing.
4. Click the orb again to stop announcing.

When active, Chronos announces the current time immediately and repeats it using the selected interval.

## Available Commands

```bash
npm start                 # Start the React development server
npm run backend           # Start the Express and Socket.IO backend
npm run build             # Create a production build
npm test                  # Run the React test command
```

## Troubleshooting

### Port already in use

The frontend uses port `3000` and the backend uses port `5001`. Stop any process already using those ports, then restart the corresponding command.

### The browser cannot connect to the backend

Make sure `npm run backend` is running before using the Chronos page. The React app connects to `http://localhost:5001`.

### No audio or wake-lock behavior

Chronos relies on macOS `say` and `caffeinate`. Test them directly in Terminal:

```bash
say "Chronos is ready"
caffeinate -h
```
