import React, { useState, useEffect } from 'react';
import Cipher from './games/Cipher';
import Crash from './games/Crash';
import { getUser } from '../services/api';

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
    const [forceReload, setForceReload] = useState(0);
    const [userData, setUserData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        setIsLoading(true);
        try {
            const userData = await getUser(userId);
            setUserData(userData);
        } catch (error) {
            console.error('Error fetching user data:', error);
        } finally {
            setIsLoading(false);
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
                <GameComponent key={forceReload} userId={userId} />
            </div>
        ) : (
            <p>Game not implemented yet.</p>
        );
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="games-container">
            {!selectedGame ? (
                <div className="games-grid">
                    {games.map(game => {
                        if (game.id === 1 && userData) { // Cipher game
                            const nextAvailableTime = new Date(userData.next_cipher_time);
                            const canSolveCipher = new Date() >= nextAvailableTime;
                            if (!canSolveCipher) {
                                return (
                                    <div key={game.id} className="game-item disabled">
                                        <i className={`fas ${game.icon}`}></i>
                                        <span>{game.name} (Next available: {nextAvailableTime.toLocaleString()})</span>
                                    </div>
                                );
                            }
                        }
                        return (
                            <div key={game.id} className="game-item" onClick={() => setSelectedGame(game)}>
                                <i className={`fas ${game.icon}`}></i>
                                <span>{game.name}</span>
                            </div>
                        );
                    })}
                </div>
            ) : (
                renderGame()
            )}
        </div>
    );
}

export default Games;
