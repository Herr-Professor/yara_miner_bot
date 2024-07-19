import React, { useState, useEffect } from 'react';
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
    const [cipherStatus, setCipherStatus] = useState({ solved: false, nextAvailableTime: null });
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        if (selectedGame && selectedGame.id === 1) {
            fetchCipherStatus();
        }
    }, [selectedGame, userId]);

    useEffect(() => {
        let timer;
        if (cipherStatus.nextAvailableTime) {
            timer = setInterval(() => {
                const now = new Date().getTime();
                const distance = new Date(cipherStatus.nextAvailableTime).getTime() - now;
                
                if (distance < 0) {
                    setTimeLeft('Available now!');
                    clearInterval(timer);
                } else {
                    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                    setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
                }
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [cipherStatus.nextAvailableTime]);

    const fetchCipherStatus = async () => {
        try {
            const response = await fetch(`https://herrprofessor.pythonanywhere.com/api/user/${userId}`);
            const userData = await response.json();
            setCipherStatus({
                solved: userData.cipher_solved,
                nextAvailableTime: userData.next_cipher_time
            });
        } catch (error) {
            console.error('Failed to fetch cipher status:', error);
        }
    };

    const handlePlayCipher = () => {
        if (!cipherStatus.solved && (!cipherStatus.nextAvailableTime || new Date() >= new Date(cipherStatus.nextAvailableTime))) {
            setSelectedGame(games.find(game => game.id === 1));
        }
    };

    const renderGame = () => {
        if (!selectedGame) return null;
        const GameComponent = selectedGame.component;
        return GameComponent ? (
            <div className="selected-game">
                <button className="back-button" onClick={() => { 
                    setSelectedGame(null); 
                    setForceReload(forceReload + 1);
                }}>
                    <i className="fas fa-arrow-left"></i> Back to Games
                </button>
                <GameComponent 
                    key={forceReload} 
                    userId={userId} 
                    onBalanceUpdate={onBalanceUpdate}
                    onGameComplete={fetchCipherStatus}
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
                        <div key={game.id} className="game-item">
                            <i className={`fas ${game.icon}`}></i>
                            <span>{game.name}</span>
                            {game.id === 1 && (
                                <div>
                                    <button 
                                        onClick={handlePlayCipher}
                                        disabled={cipherStatus.solved || (cipherStatus.nextAvailableTime && new Date() < new Date(cipherStatus.nextAvailableTime))}
                                    >
                                        Play
                                    </button>
                                    {cipherStatus.solved ? (
                                        <p>Next available: {timeLeft}</p>
                                    ) : (
                                        <p>{timeLeft}</p>
                                    )}
                                </div>
                            )}
                            {game.id !== 1 && (
                                <button onClick={() => setSelectedGame(game)}>
                                    Play
                                </button>
                            )}
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