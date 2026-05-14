// Gerenciador de conexões WebSocket
const clients = new Set();
let wss = null;

function init(server) {
  const { WebSocketServer } = require('ws');
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    clients.add(ws);
    ws.on('close', () => clients.delete(ws));
    ws.on('error', () => clients.delete(ws));
    // Enviar estado atual ao conectar
    ws.send(JSON.stringify({ type: 'connected', clients: clients.size }));
  });

  console.log('✅ WebSocket server iniciado');
  return wss;
}

function broadcast(data) {
  const msg = JSON.stringify(data);
  let sent = 0;
  clients.forEach(ws => {
    if (ws.readyState === 1) { ws.send(msg); sent++; }
  });
  return sent;
}

function getCount() { return clients.size; }

module.exports = { init, broadcast, getCount };
