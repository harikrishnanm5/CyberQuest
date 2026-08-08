const { WebSocketServer } = require('ws');
const os = require('os');
const pty = require('node-pty');
require('dotenv').config();

const port = process.env.PORT || 3002;
const bridgeToken = process.env.BRIDGE_TOKEN;
const wss = new WebSocketServer({ port });

console.log(`[SSH BRIDGE] WebSocket Server listening on port ${port}`);

wss.on('connection', (ws) => {
  console.log('[SSH BRIDGE] Client connected. Waiting for authentication...');

  let authenticated = false;
  let shell;

  ws.on('message', (message) => {
    if (!authenticated) {
      try {
        const msg = JSON.parse(message);
        if (msg.type === 'auth' && msg.token === bridgeToken) {
          authenticated = true;
          console.log('[SSH BRIDGE] Authentication successful. Spawning SSH shell...');

          try {
            shell = pty.spawn('ssh', ['-i', process.env.SSH_KEY_PATH, process.env.SSH_TARGET], {
              name: 'xterm-color',
              cols: 80,
              rows: 24,
              cwd: process.env.HOME,
              env: process.env
            });

            shell.on('data', (data) => {
              if (ws.readyState === 1) {
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

            ws.send(JSON.stringify({ type: 'auth_success', data: 'Authenticated. Session established.' }));
          } catch (err) {
            console.error('[SSH BRIDGE] Failed to spawn shell:', err);
            ws.send(JSON.stringify({ type: 'output', data: `\r\n[BRIDGE ERROR] Failed to spawn SSH process: ${err.message}\r\n` }));
            ws.close();
          }
        } else {
          console.warn('[SSH BRIDGE] Authentication failed. Closing connection.');
          ws.send(JSON.stringify({ type: 'error', data: 'Invalid authentication token.' }));
          ws.close();
        }
      } catch (e) {
        console.warn('[SSH BRIDGE] Invalid auth message format.');
        ws.close();
      }
      return;
    }

    // Handle post-auth input
    try {
      const msg = JSON.parse(message);
      if (msg.type === 'input') {
        shell.write(msg.data);
      } else if (msg.type === 'resize') {
        shell.resize(msg.cols, msg.rows);
      }
    } catch (e) {
      shell.write(message.toString());
    }
  });

  ws.on('close', () => {
    console.log('[SSH BRIDGE] Client disconnected.');
    if (shell) shell.kill();
  });
});
