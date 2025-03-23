import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

function Leaderboard() {
    const [leaders, setLeaders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const fetchLeaderboard = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('https://yara-mine.onrender.com/api/leaderboard');
            if (!response.ok) {
                throw new Error('Failed to fetch leaderboard data');
            }
            const data = await response.json();
            setLeaders(data);
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            toast.error('Failed to load leaderboard. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <div className="loading">Loading leaderboard...</div>;
    }

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
                            <span className="player-balance">{leader.balance.toFixed(2)} </span>
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