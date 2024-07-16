import { API_BASE_URL } from '../frontend/src/config';
import { handleTelegramMessage } from '../frontend/src/services/api';

const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const crypto = require('crypto');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.json());
app.use(bodyParser.json());

const PORT = process.env.PORT || 5000;
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || '7031484757:AAFxCtzFo5QiXzbO9_-tA-2wLGEasvtqxug';
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;
const WEBHOOK_URL = process.env.WEBHOOK_URL || `${API_BASE_URL}/webhook`;

// Conditional CORS configuration
if (process.env.NODE_ENV === 'production') {
    app.use(cors({
        origin: 'https://yara-miner-bot.vercel.app',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        allowedHeaders: 'Content-Type',
    }));
}

// Set up Telegram webhook
axios.post(`${TELEGRAM_API}/setWebhook`, {
    url: WEBHOOK_URL
})
.then(response => {
    console.log('Webhook set:', response.data);
})
.catch(error => {
    console.error('Error setting webhook:', error);
});

// Updated Webhook endpoint
app.post('/webhook', async (req, res) => {
    const { message } = req.body;
    if (message) {
        try {
            await handleTelegramMessage(message);
            res.sendStatus(200);
        } catch (error) {
            console.error('Error handling webhook:', error);
            res.sendStatus(500);
        }
    } else {
        res.sendStatus(400);
    }
});

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

// Start the server
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));