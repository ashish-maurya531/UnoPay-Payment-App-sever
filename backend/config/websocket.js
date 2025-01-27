const WebSocket = require("ws");

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server });

  wss.on("connection", (ws) => {
    console.log("New client connected");

    // Handle messages from clients (optional)
    ws.on("message", (message) => {
      console.log(`Received message: ${message}`);
    });

    // Handle client disconnection
    ws.on("close", () => {
      console.log("Client disconnected");
    });
  });

  // Global broadcast function to send messages to all clients
  global.broadcastMessage = (message) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };
}

module.exports = { setupWebSocket };
