import React, { useState, useEffect } from 'react';
import Cipher from './games/Cipher';
import Crash from './games/Crash';
import { getUser, getCipherStatus } from '../services/api';

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
    const [cipherStatus, setCipherStatus] = useState({ cipher_solved: false, next_cipher_time: null });

    useEffect(() => {
        fetchUserData();
        fetchCipherStatus();
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

    const fetchCipherStatus = async () => {
        try {
            const status = await getCipherStatus(userId);
            setCipherStatus(status);
        } catch (error) {
            console.error('Error fetching cipher status:', error);
        }
    };

    const handleCipherClick = () => {
        const nextAvailableTime = new Date(cipherStatus.next_cipher_time);
        const currentTime = new Date();
        
        if (currentTime >= nextAvailableTime) {
            setSelectedGame(games.find(game => game.id === 1));
        } else {
            const hoursUntilAvailable = (nextAvailableTime - currentTime) / (1000 * 60 * 60);
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
                <GameComponent key={forceReload} userId={userId} />
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

    if (isLoading) {
        return <div>Loading...</div>;
    }

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
