const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

app.use(express.static("public"));

let gameSocket = null;

const players = {
    1: null,
    2: null
};

function send(socket, data) {
    if (
        socket &&
        socket.readyState === WebSocket.OPEN
    ) {
        socket.send(JSON.stringify(data));
    }
}

function sendLobbyStatus() {
    send(gameSocket, {
        type: "lobby",
        player1: players[1] !== null,
        player2: players[2] !== null
    });
}

wss.on("connection", (socket) => {

    console.log("Device connected");

    let role = null;
    let playerNumber = null;

    socket.send(JSON.stringify({
        type: "connected"
    }));

    socket.on("message", (message) => {

        let data;

        try {
            data = JSON.parse(message.toString());
        } catch {
            return;
        }

        // GAME CONNECTED
        if (data.type === "join" && data.role === "game") {

            role = "game";
            gameSocket = socket;

            console.log("GAME connected");

            sendLobbyStatus();

            return;
        }

        // PHONE CONNECTED
        if (
            data.type === "join" &&
            data.role === "controller"
        ) {

            const requestedPlayer =
                Number(data.player);

            if (
                requestedPlayer !== 1 &&
                requestedPlayer !== 2
            ) {
                return;
            }

            if (
                players[requestedPlayer] &&
                players[requestedPlayer] !== socket
            ) {

                send(socket, {
                    type: "player_full",
                    player: requestedPlayer
                });

                return;
            }

            role = "controller";
            playerNumber = requestedPlayer;

            players[playerNumber] = socket;

            console.log(
                `PLAYER ${playerNumber} connected`
            );

            send(socket, {
                type: "player_assigned",
                player: playerNumber
            });

            sendLobbyStatus();

            return;
        }

        // PHONE MOVEMENT / SWING
        if (
            role === "controller" &&
            playerNumber !== null
        ) {

            if (
                data.type === "move" ||
                data.type === "swing"
            ) {

                data.player = playerNumber;

                send(gameSocket, data);
            }
        }

    });

    socket.on("close", () => {

        console.log("Device disconnected");

        if (role === "game") {

            if (gameSocket === socket) {
                gameSocket = null;
            }

            return;
        }

        if (
            role === "controller" &&
            playerNumber !== null
        ) {

            if (
                players[playerNumber] === socket
            ) {
                players[playerNumber] = null;
            }

            send(gameSocket, {
                type: "player_disconnected",
                player: playerNumber
            });

            sendLobbyStatus();
        }

    });

});

server.listen(3000, "0.0.0.0", () => {

    console.log(
        "Rally Rivals server running on port 3000"
    );

});