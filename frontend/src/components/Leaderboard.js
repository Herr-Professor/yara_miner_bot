import React from 'react';

function Leaderboard() {
    // Mock data for the leaderboard
    const leaders = [
        { username: 'Player1', balance: 10000 },
        { username: 'Player2', balance: 9500 },
        { username: 'Player3', balance: 9000 },
        { username: 'Player4', balance: 8500 },
        { username: 'Player5', balance: 8000 },
        { username: 'Player6', balance: 7500 },
        { username: 'Player7', balance: 7000 },
        { username: 'Player8', balance: 6500 },
        { username: 'Player9', balance: 6000 },
        { username: 'Player10', balance: 5500 },
    ];

    return (
        <div className="leaderboard">
            <h2>Top Players</h2>
            {leaders.length > 0 ? (
                <ul>
                    {leaders.map((leader, index) => (
                        <li key={index}>
                            <span className="player-rank">{index + 1}</span>
                            <span className="player-name">
                                {leader.username ? ` ${leader.username}` : 'Unknown'}
                            </span>
                            <span className="player-balance">{leader.balance} YARA</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No leaderboard data available.</p>
            )}
        </div>
    );
}

export default Leaderboard;