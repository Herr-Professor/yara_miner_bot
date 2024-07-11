import React from 'react';

const games = [
    { id: 1, name: 'Cipher', icon: 'fa-lock' },
    { id: 2, name: 'Crash', icon: 'fa-chart-line' },
    { id: 3, name: '2048', icon: 'fa-th' },
    { id: 4, name: 'Snake', icon: 'fa-snake' },
    { id: 5, name: 'Spinner', icon: 'fa-spinner' },
    { id: 6, name: 'Coming Soon', icon: 'fa-plus' },
    { id: 7, name: 'Coming Soon', icon: 'fa-plus' },
    { id: 8, name: 'Coming Soon', icon: 'fa-plus' },
];

function Games() {
    return (
        <div className="games-grid">
            {games.map(game => (
                <div key={game.id} className="game-item">
                    <i className={`fas ${game.icon}`}></i>
                    <span>{game.name}</span>
                </div>
            ))}
        </div>
    );
}

export default Games;