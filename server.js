const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

app.use(express.static("public"));

wss.on("connection", (socket) => {
    console.log("A device connected!");

    socket.send(JSON.stringify({
        type: "connected"
    }));

    socket.on("message", (message) => {
        console.log("Received:", message.toString());

        // Send the message to every connected device
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message.toString());
            }
        });
    });

    socket.on("close", () => {
        console.log("Device disconnected");
    });
});

server.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});
