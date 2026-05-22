const { WebSocketServer } = require('ws');
const os = require('os');
const pty = require('node-pty');

const port = 3002;
const wss = new WebSocketServer({ port });

console.log(`[SSH BRIDGE] WebSocket Server listening on port ${port}`);

wss.on('connection', (ws) => {
  console.log('[SSH BRIDGE] Client connected. Spawning SSH shell...');

  // Spawn SSH connection
  let shell;
  try {
    shell = pty.spawn('ssh', ['-i', '~/.ssh/SkyWarrior', 'root@165.245.132.86'], {
      name: 'xterm-color',
      cols: 80,
      rows: 24,
      cwd: process.env.HOME,
      env: process.env
    });
  } catch (err) {
    console.error('[SSH BRIDGE] Failed to spawn shell:', err);
    if (ws.readyState === 1) {
      ws.send(JSON.stringify({ type: 'output', data: `\r\n[BRIDGE ERROR] Failed to spawn SSH process: ${err.message}\r\n` }));
      ws.close();
    }
    return;
  }

  ws.on('message', (message) => {
    try {
      const msg = JSON.parse(message);
      if (msg.type === 'input') {
        shell.write(msg.data);
      } else if (msg.type === 'resize') {
        shell.resize(msg.cols, msg.rows);
      }
    } catch (e) {
      // Raw string input fallback
      shell.write(message.toString());
    }
  });

  shell.on('data', (data) => {
    if (ws.readyState === 1) { // WebSocket.OPEN
      ws.send(JSON.stringify({ type: 'output', data }));
    }
  });

  shell.on('exit', (exitCode) => {
    console.log(`[SSH BRIDGE] Process exited with code ${exitCode}`);
    if (ws.readyState === 1) {
      ws.send(JSON.stringify({ type: 'exit', code: exitCode }));
      ws.close();
    }
  });

  ws.on('close', () => {
    console.log('[SSH BRIDGE] Client disconnected. Terminating shell...');
    shell.kill();
  });
});
