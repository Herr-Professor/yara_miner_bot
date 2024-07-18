import React, { useState, useEffect, useRef } from 'react';

const Crash = ({ initialBalance = 1000 }) => {
    const [balance, setBalance] = useState(initialBalance);
    const [betAmount, setBetAmount] = useState('');
    const [multiplier, setMultiplier] = useState(1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isCrashed, setIsCrashed] = useState(false);
    const [cashoutMultiplier, setCashoutMultiplier] = useState(null);
    const [error, setError] = useState('');
    const [gameHistory, setGameHistory] = useState([]);

    const intervalRef = useRef(null);
    const crashPointRef = useRef(null);

    const handleBetChange = (e) => {
        const value = e.target.value;
        if (/^\d*\.?\d*$/.test(value) && parseFloat(value) <= balance) {
            setBetAmount(value);
            setError('');
        } else {
            setError('Invalid bet amount');
        }
    };

    const startGame = () => {
        if (!betAmount || parseFloat(betAmount) <= 0) {
            setError('Please enter a valid bet amount');
            return;
        }

        setError('');
        setIsPlaying(true);
        setIsCrashed(false);
        setCashoutMultiplier(null);
        crashPointRef.current = generateCrashPoint();

        intervalRef.current = setInterval(() => {
            setMultiplier((prev) => {
                const newMultiplier = prev + 0.01;
                if (newMultiplier >= crashPointRef.current) {
                    endGame();
                }
                return newMultiplier;
            });
        }, 100);
    };

    const generateCrashPoint = () => {
        return Math.floor(Math.random() * 5) + 1.5;
    };

    const cashout = () => {
        if (!isPlaying || isCrashed) return;

        clearInterval(intervalRef.current);
        setIsPlaying(false);
        setCashoutMultiplier(multiplier);

        const winAmount = parseFloat(betAmount) * multiplier;
        setBalance((prev) => prev + winAmount - parseFloat(betAmount));
        setGameHistory((prev) => [...prev, { multiplier, bet: betAmount, win: winAmount }]);
    };

    const endGame = () => {
        clearInterval(intervalRef.current);
        setIsPlaying(false);
        setIsCrashed(true);
        setBalance((prev) => prev - parseFloat(betAmount));
        setGameHistory((prev) => [...prev, { multiplier: crashPointRef.current, bet: betAmount, win: 0 }]);
    };

    return (
        <div className="crash-game">
            <h2>Crash Game</h2>
            <p>Balance: {balance.toFixed(2)}</p>
            <div className="bet-controls">
                <input
                    type="text"
                    value={betAmount}
                    onChange={handleBetChange}
                    placeholder="Enter bet amount"
                    disabled={isPlaying}
                />
                <button onClick={startGame} disabled={isPlaying}>
                    Start Game
                </button>
                <button onClick={cashout} disabled={!isPlaying || isCrashed}>
                    Cash Out
                </button>
            </div>
            {error && <p className="error">{error}</p>}
            <div className="game-display">
                <p className="multiplier">{multiplier.toFixed(2)}x</p>
                {isCrashed && <p className="crash-message">Crashed at {crashPointRef.current.toFixed(2)}x</p>}
                {cashoutMultiplier && (
                    <p className="cashout-message">
                        Cashed out at {cashoutMultiplier.toFixed(2)}x! 
                        Won: {(parseFloat(betAmount) * cashoutMultiplier - parseFloat(betAmount)).toFixed(2)}
                    </p>
                )}
            </div>
            <div className="game-history">
                <h3>Game History</h3>
                <ul>
                    {gameHistory.map((game, index) => (
                        <li key={index}>
                            {game.multiplier.toFixed(2)}x - Bet: {game.bet}, Win: {game.win.toFixed(2)}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default Crash;