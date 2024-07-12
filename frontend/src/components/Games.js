// src/components/Games.js
import React, { useState } from 'react';
import Cipher from './games/Cipher';
import Crash from './games/Crash';

const games = [
    { id: 1, name: 'Cipher', icon: 'fa-lock', component: Cipher },
    { id: 2, name: 'Crash', icon: 'fa-chart-line', component: Crash },
    { id: 3, name: '2048', icon: 'fa-th' },
    { id: 4, name: 'Snake', icon: 'fa-snake' },
    { id: 5, name: 'Spinner', icon: 'fa-spinner' },
    { id: 6, name: 'Coming Soon', icon: 'fa-plus' },
    { id: 7, name: 'Coming Soon', icon: 'fa-plus' },
    { id: 8, name: 'Coming Soon', icon: 'fa-plus' },
];

function Games({ userId }) {
    const [selectedGame, setSelectedGame] = useState(null);

    const renderGame = () => {
        if (!selectedGame) return null;
        const GameComponent = selectedGame.component;
        return GameComponent ? (
            <div className="selected-game">
                <button className="back-button" onClick={() => setSelectedGame(null)}>
                    <i className="fas fa-arrow-left"></i> Back to Games
                </button>
                <GameComponent userId={userId} />
            </div>
        ) : (
            <p>Game not implemented yet.</p>
        );
    };

    return (
        <div className="games-container">
            {!selectedGame ? (
                <div className="games-grid">
                    {games.map(game => (
                        <div key={game.id} className="game-item" onClick={() => setSelectedGame(game)}>
                            <i className={`fas ${game.icon}`}></i>
                            <span>{game.name}</span>
                        </div>
                    ))}
                </div>
            ) : (
                renderGame()
            )}
        </div>
    );
}

export default Games;