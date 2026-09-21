const express = require('express');
const http = require('http');
const { spawn } = require('child_process');
const cors = require('cors');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: 'http://localhost:3000', methods: ['GET', 'POST'] },
});

app.use(cors());
app.use(express.json());

let scriptProcess = null;

// Helper to broadcast status changes to frontend
const broadcastStatus = () => {
  io.emit('status-update', { isRunning: scriptProcess !== null });
};

// WebSocket connection for real-time logs
io.on('connection', (socket) => {
  socket.emit('status-update', { isRunning: scriptProcess !== null });
});

// Start Route
app.post('/api/start', (req, res) => {
  const { interval } = req.body;

  if (!interval) {
    return res
      .status(400)
      .json({ error: 'Interval is required (e.g., 5m, 30s)' });
  }

  if (scriptProcess !== null) {
    return res.status(400).json({ error: 'Script is already running' });
  }

  const scriptPath = path.join(
    __dirname,
    '..',
    'chronos-frontend',
    'chronos.sh',
  );

  // Put the shell and all of its children in their own process group so Stop
  // can terminate sleep, say, and caffeinate together.
  scriptProcess = spawn('bash', [scriptPath, interval], { detached: true });
  broadcastStatus();

  // Capture standard output and stream it to the UI
  scriptProcess.stdout.on('data', (data) => {
    io.emit('log', data.toString());
  });

  // Capture errors
  scriptProcess.stderr.on('data', (data) => {
    io.emit('log', `Error: ${data.toString()}`);
  });

  // Cleanup references when process exits
  scriptProcess.on('error', (error) => {
    io.emit('log', `Failed to start script: ${error.message}`);
  });

  scriptProcess.on('close', (code) => {
    io.emit('log', `Process exited with code ${code}`);
    scriptProcess = null;
    broadcastStatus();
  });

  return res.json({ message: 'Script started successfully' });
});

// Stop Route (Simulates Ctrl+C)
app.post('/api/stop', (req, res) => {
  if (scriptProcess === null) {
    return res.status(400).json({ error: 'Script is not running' });
  }

  // Signal the whole detached process group, not only the bash parent.
  const processGroupId = scriptProcess.pid;
  try {
    process.kill(-processGroupId, 'SIGTERM');
  } catch (error) {
    if (error.code !== 'ESRCH') {
      return res
        .status(500)
        .json({ error: `Could not stop script: ${error.message}` });
    }
  }

  return res.json({ message: 'Stop signal sent to script' });
});

const PORT = 5001;
server.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
