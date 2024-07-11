import React from 'react';

function Leaderboard() {
    // This is mock data. 
    const leaders = [
        { id: 1, name: 'Player 1', score: 10000 },
        { id: 2, name: 'Player 2', score: 9500 },
        { id: 3, name: 'Player 3', score: 9000 },
    ];

    return (
        <div className="leaderboard">
            <h2>Top Players</h2>
            <ul>
                {leaders.map(leader => (
                    <li key={leader.id}>
                        <span className="player-name">{leader.name}</span>
                        <span className="player-score">{leader.score} YARA</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default Leaderboard;