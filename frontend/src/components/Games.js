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

function Games({ userId, onBalanceUpdate }) {
    const [selectedGame, setSelectedGame] = useState(null);
    const [forceReload, setForceReload] = useState(0);

    const handleGameClick = (game) => {
        setSelectedGame(game);
    };

    const renderGame = () => {
        if (!selectedGame) return null;
        const GameComponent = selectedGame.component;
        return GameComponent ? (
            <div className="selected-game">
                <button className="back-button" onClick={() => { 
                    setSelectedGame(null); 
                    setForceReload(forceReload + 1); // Force reloading the game component
                }}>
                    <i className="fas fa-arrow-left"></i> Back to Games
                </button>
                <GameComponent 
                    key={forceReload} 
                    userId={userId} 
                    onBalanceUpdate={onBalanceUpdate}
                />
            </div>
        ) : (
            <div>
                <button className="back-button" onClick={() => setSelectedGame(null)}>
                    <i className="fas fa-arrow-left"></i> Back to Games
                </button>
                <p>Game not implemented yet.</p>
            </div>
        );
    };

    return (
        <div className="games-container">
            {!selectedGame ? (
                <div className="games-grid">
                    {games.map(game => (
                        <div 
                            key={(link unavailable)} 
                            className="game-item" 
                            onClick={() => handleGameClick(game)}
                        >
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