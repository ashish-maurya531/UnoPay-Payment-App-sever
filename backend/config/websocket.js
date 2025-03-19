// const WebSocket = require("ws");

// function setupWebSocket(server) {
//   // Attach WebSocket server to the HTTP server
//   const wss = new WebSocket.Server({ server });

//   wss.on("connection", (ws) => {
//     console.log("🟢 New client connected");

//     // Log total connected clients
//     console.log(`👥 Total connected clients: ${wss.clients.size}`);

//     // Send a welcome message to the client
//     ws.send(JSON.stringify({ title: "Welcome", body: "Connected to WebSocket server!" }));

//     // Handle messages from the client
//     ws.on("message", (message) => {
//       console.log(`📩 Received message from client: ${message}`);
//     });

//     // Handle client disconnection
//     ws.on("close", () => {
//       console.log("🔴 Client disconnected");
//       console.log(`👥 Total connected clients: ${wss.clients.size}`);
//     });

//     // Handle connection errors
//     ws.on("error", (err) => {
//       console.error("❌ WebSocket error:", err.message);
//     });
//   });

//   // Broadcast function to send a message to all connected clients
//   global.broadcastMessage = (message) => {
//     wss.clients.forEach((client) => {
//       if (client.readyState === WebSocket.OPEN) {
//         client.send(message); // Send the message to all open clients
//       }
//     });
//     console.log("📢 Broadcast message sent to all clients.");
//   };
// }

// module.exports = { setupWebSocket };
