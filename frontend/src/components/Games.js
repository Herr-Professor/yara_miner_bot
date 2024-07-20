import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Cipher from './games/Cipher';
import Crash from './games/Crash';
import TwoZeroFourEight from './games/TwoZeroFourEight';
import SpinningWheel from './games/SpinningWheel';
import Snake from './games/Snake';

const games = [
    { id: 1, name: 'Cipher', icon: 'fa-lock', component: Cipher },
    { id: 2, name: 'Crash', icon: 'fa-chart-line', component: Crash },
    { id: 3, name: '2048', icon: 'fa-th', component: TwoZeroFourEight },
    { id: 4, name: 'Snake', icon: 'fa-snake', component: Snake },
    { id: 5, name: 'Spinner', icon: 'fa-spinner', component: SpinningWheel },
    { id: 6, name: 'Coming Soon', icon: 'fa-plus' },
    { id: 7, name: 'Coming Soon', icon: 'fa-plus' },
    { id: 8, name: 'Coming Soon', icon: 'fa-plus' },
];

function Games({ userId, onBalanceUpdate }) {
    const [selectedGame, setSelectedGame] = useState(null);
    const [forceReload, setForceReload] = useState(0);
    const [cipherStatus, setCipherStatus] = useState({ solved: false, nextAvailableTime: null });
    const [timeLeft, setTimeLeft] = useState('');
    const [isLoading, setIsLoading] = useState(false);

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
        setIsLoading(true);
        try {
            const response = await fetch(`https://herrprofessor.pythonanywhere.com/api/user/${userId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch cipher status');
            }
            const userData = await response.json();
            setCipherStatus({
                solved: userData.cipher_solved,
                nextAvailableTime: userData.next_cipher_time
            });
        } catch (error) {
            console.error('Failed to fetch cipher status:', error);
            toast.error('Failed to fetch cipher status. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePlayCipher = () => {
        if (!cipherStatus.solved && (!cipherStatus.nextAvailableTime || new Date() >= new Date(cipherStatus.nextAvailableTime))) {
            setSelectedGame(games.find(game => game.id === 1));
        }
    };

    const fetchUserBalance = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`https://herrprofessor.pythonanywhere.com/api/user/${userId}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch user balance');
            }
            const userData = await response.json();
            onBalanceUpdate(userData.balance);
        } catch (error) {
            console.error('Failed to fetch user balance:', error);
            toast.error(`Failed to fetch user balance: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGameExit = () => {
        setSelectedGame(null);
        setForceReload(prevState => prevState + 1);
        fetchUserBalance();
    };

    const renderGame = () => {
        if (!selectedGame) return null;
        const GameComponent = selectedGame.component;
        return GameComponent ? (
            <div className="selected-game">
                <button className="back-button" onClick={handleGameExit}>
                    <i className="fas fa-arrow-left"></i> Back to Games
                </button>
                <GameComponent 
                    key={forceReload} 
                    userId={userId} 
                    onBalanceUpdate={onBalanceUpdate}
                    onGameComplete={selectedGame.id === 1 ? fetchCipherStatus : undefined}
                />
            </div>
        ) : (
            <div>
                <button className="back-button" onClick={handleGameExit}>
                    <i className="fas fa-arrow-left"></i> Back to Games
                </button>
                <p>Game not implemented yet.</p>
            </div>
        );
    };

    return (
        <div className="games-container">
            <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
            {isLoading ? (
                <div className="loading">Loading...</div>
            ) : !selectedGame ? (
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