# Chronos

Chronos is a macOS time announcer with a TypeScript React interface. It keeps the Mac awake and speaks the current time on a configurable schedule.

The frontend uses Tailwind CSS, a shadcn-style `components/ui` structure, React Three Fiber for the gradient orb, Lucide icons, and a static starfield background.

## Features

- Live local time displayed inside a GPU-rendered gradient orb
- Click the orb to start immediate time announcements
- Click the orb again to stop announcements
- Circular hit testing keeps clicks outside the orb inactive
- Preset intervals: `15s`, `30s`, `1m`, and `5m`
- Custom intervals using seconds, minutes, or hours, such as `10s`, `5m`, or `1h`
- macOS wake lock through `caffeinate`
- macOS voice announcements through `say`
- Live backend status and log updates through Socket.IO
- Static starfield background from `public/starfield.jpg`
- Egyptian-themed header navigation with clock, balance, and settings icons

## Requirements

- macOS
- Node.js 18 or newer
- npm
- A browser with WebGL support for the gradient orb
- The macOS commands `say` and `caffeinate` (included with macOS)

Check the installed tools:

```bash
node --version
npm --version
which say
which caffeinate
```

## Project Structure

```text
chronos/
├── chronos-backend/
│   └── server.js                 Express and Socket.IO backend
├── chronos-frontend/
│   └── chronos.sh                macOS announcement and wake-lock script
├── public/
│   ├── index.html
│   └── starfield.jpg             Static page background
├── src/
│   ├── components/ui/
│   │   └── gradient-orb.tsx       React Three Fiber shader component
│   ├── App.tsx                   Chronos page and controls
│   ├── App.css                   App-specific CSS
│   ├── index.css                 Tailwind entry styles
│   └── index.js                  CRA bootstrap entrypoint
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## Install

From the Chronos project directory:

```bash
cd /Users/kiri/Developer/ark-git/07_MacTools/chronos
npm install
```

## Run Locally

Start the backend in one terminal:

```bash
cd /Users/kiri/Developer/ark-git/07_MacTools/chronos
npm run backend
```

The backend listens on `http://localhost:5001`.

Open a second terminal and start the React development server:

```bash
cd /Users/kiri/Developer/ark-git/07_MacTools/chronos
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Both processes must remain running while using the application.

## Use Chronos

1. Select a preset interval or enter a custom value.
2. Click inside the center of the orb to start announcing.
3. Chronos announces the current time immediately.
4. Chronos repeats the announcement using the selected interval.
5. Click inside the orb again to stop the script.

The orb's visible time updates every second. The backend status indicator and live log line update through Socket.IO.

## Backend API

The backend exposes these endpoints on port `5001`:

| Method | Endpoint     | Purpose                                                     |
| ------ | ------------ | ----------------------------------------------------------- |
| `POST` | `/api/start` | Starts the announcement script with `{ "interval": "30s" }` |
| `POST` | `/api/stop`  | Stops the complete Chronos process group                    |

The backend also provides a Socket.IO connection at the same origin with these events:

- `status-update` - reports whether the announcement process is running
- `log` - streams script output and errors to the frontend

## Available Commands

```bash
npm start              # Start the React development server on port 3000
npm run backend        # Start the Express and Socket.IO backend on port 5001
npm run build          # Create an optimized production build
npm test               # Run the React test command
npm run format         # Format supported project files with Prettier
npm run format:check   # Verify that files match the Prettier configuration
```

## Formatting

Formatting is configured in `.prettierrc.json` and ignored paths are listed in `.prettierignore`.

Before opening a pull request or pushing changes, run:

```bash
npm run format:check
npm run build
```

To apply formatting automatically:

```bash
npm run format
```

## Static Background Asset

The page background is loaded from `public/starfield.jpg`. To replace it, keep the same filename or update the `starfieldStyle` reference in `src/App.tsx`.

## Troubleshooting

### Port already in use

The frontend uses port `3000` and the backend uses port `5001`. Find the process using a port with:

```bash
lsof -i :3000
lsof -i :5001
```

Stop the conflicting process, then restart the corresponding Chronos command.

### The browser cannot connect to the backend

Make sure `npm run backend` is running before using the Chronos page. The frontend connects to `http://localhost:5001` for REST requests and Socket.IO updates.

### No audio or wake-lock behavior

Chronos relies on macOS `say` and `caffeinate`. Test them directly in Terminal:

```bash
say "Chronos is ready"
caffeinate -h
```

The announcement script is located at `chronos-frontend/chronos.sh`.

### The orb is blank

Ensure WebGL is enabled in the browser and that the browser has permission to use hardware acceleration. The rest of the Chronos interface can load without WebGL, but the gradient orb requires it.
