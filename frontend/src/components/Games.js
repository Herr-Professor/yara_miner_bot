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
    const [cipherStatus, setCipherStatus] = useState({ cipher_solved: false, next_cipher_time: new Date().getTime() + 24 * 60 * 60 * 1000 });

    const handleCipherClick = () => {
        const nextAvailableTime = new Date(cipherStatus.next_cipher_time);
        const currentTime = new Date();
        
        if (currentTime >= nextAvailableTime) {
            setSelectedGame(games.find(game => game.id === 1));
        } else {
            const formattedTime = nextAvailableTime.toLocaleString([], { hour: 'numeric', minute: 'numeric' });
            const message = `You have already solved the cipher. It will be available next at ${formattedTime} UTC.`;
            alert(message); // Replace with a toast or snack notification component
        }
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
                            key={game.id} 
                            className={`game-item ${game.id === 1 && cipherStatus.cipher_solved ? 'disabled' : ''}`} 
                            onClick={game.id === 1 ? handleCipherClick : () => setSelectedGame(game)}
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