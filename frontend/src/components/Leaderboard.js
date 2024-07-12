import React, { useState, useEffect } from 'react';
import { getLeaderboard } from '../services/api';
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
            const leaderboardData = await getLeaderboard();
            setLeaders(leaderboardData);
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            toast.error('Failed to fetch leaderboard. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <div>Loading leaderboard...</div>;
    }

    return (
        <div className="leaderboard">
            <h2>Top Players</h2>
            {leaders.length > 0 ? (
                <ul>
                    {leaders.map((leader, index) => (
                        <li key={leader.user_id}>
                            <span className="player-rank">{index + 1}</span>
                            <span className="player-name">User {leader.user_id.slice(0, 6)}</span>
                            <span className="player-score">{leader.points} YARA</span>
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