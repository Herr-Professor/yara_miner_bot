const express = require('express');
const mongoose = require('mongoose');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const crypto = require('crypto');
require('dotenv').config();

app.use(express.json());

const PORT = process.env.PORT || 5000;

http.listen(PORT, () => console.log(`Server running on port ${PORT}`));

let currentGame = null;

function startNewGame() {
    const serverSeed = crypto.randomBytes(32).toString('hex');
    const clientSeed = 'This should be provided by the client';
    const nonce = 0; // This should increment for each game

    const hash = crypto.createHash('sha256')
        .update(serverSeed + clientSeed + nonce)
        .digest('hex');

    const crashPoint = (100 / (1 - (parseInt(hash.slice(0, 13), 16) / Math.pow(2, 52)))) / 100;

    currentGame = {
        id: Date.now(),
        crashPoint: crashPoint,
        startTime: Date.now(),
        players: new Map()
    };

    io.emit('gameStart', { gameId: currentGame.id });

    setTimeout(() => {
        io.emit('gameCrash', { gameId: currentGame.id, crashPoint: currentGame.crashPoint });
        currentGame = null;
        startNewGame();
    }, (crashPoint - 1) * 1000);
}

io.on('connection', (socket) => {
    socket.on('placeBet', (data) => {
        if (!currentGame || currentGame.players.has(data.userId)) return;

        // Verify user balance here

        currentGame.players.set(data.userId, { betAmount: data.betAmount, autoCashout: data.autoCashout });
    });

    socket.on('cashout', (data) => {
        if (!currentGame || !currentGame.players.has(data.userId)) return;

        const player = currentGame.players.get(data.userId);
        const currentMultiplier = (Date.now() - currentGame.startTime) / 1000 + 1;

        if (currentMultiplier < currentGame.crashPoint) {
            const winAmount = player.betAmount * currentMultiplier;
            // Update user balance here
            io.to(socket.id).emit('cashoutSuccess', { winAmount: winAmount });
            currentGame.players.delete(data.userId);
        }
    });
});

startNewGame();
