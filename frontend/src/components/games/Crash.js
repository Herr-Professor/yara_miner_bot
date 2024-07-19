import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';

const Crash = ({ userId, onBalanceUpdate }) => {
    const [balance, setBalance] = useState(0);
    const [betAmount, setBetAmount] = useState('');
    const [multiplier, setMultiplier] = useState(1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isCrashed, setIsCrashed] = useState(false);
    const [cashoutMultiplier, setCashoutMultiplier] = useState(null);
    const [error, setError] = useState('');
    const [gameHistory, setGameHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const intervalRef = useRef(null);
    const crashPointRef = useRef(null);

    useEffect(() => {
        fetchUserBalance();
    }, [userId]);

    const fetchUserBalance = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`https://herrprofessor.pythonanywhere.com/api/user/${userId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch user balance');
            }
            const userData = await response.json();
            setBalance(userData.balance);
        } catch (error) {
            console.error('Failed to fetch user balance:', error);
            toast.error('Failed to fetch user balance. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBetChange = (e) => {
        const value = e.target.value;
        if (/^\d*\.?\d*$/.test(value) && parseFloat(value) <= balance) {
            setBetAmount(value);
            setError('');
        } else {
            setError('Invalid bet amount');
        }
    };

    const startGame = async () => {
        if (!betAmount || parseFloat(betAmount) <= 0) {
            setError('Please enter a valid bet amount');
            return;
        }

        setError('');
        setIsPlaying(true);
        setIsCrashed(false);
        setCashoutMultiplier(null);
        crashPointRef.current = generateCrashPoint();

        try {
            const response = await fetch('https://herrprofessor.pythonanywhere.com/api/update_balance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, amount: -parseFloat(betAmount) }),
            });
            if (!response.ok) {
                throw new Error('Failed to update balance');
            }
            const data = await response.json();
            setBalance(data.new_balance);
            onBalanceUpdate(data.new_balance);
        } catch (error) {
            console.error('Failed to update balance:', error);
            toast.error('Failed to update balance. Please try again later.');
            setIsPlaying(false);
            return;
        }

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
        const rand = Math.random() * 100;
        if (rand <= 70) {
            return (Math.random() * (2.2 - 1.2) + 1.2).toFixed(2);
        } else if (rand <= 90) {
            return (Math.random() * (5.5 - 2.3) + 2.3).toFixed(2);
        } else if (rand <= 97) {
            return (Math.random() * (10.3 - 5.6) + 5.6).toFixed(2);
        } else if (rand <= 99) {
            return (Math.random() * (20.0 - 10.3) + 10.3).toFixed(2);
        } else {
            return (Math.random() * (50.0 - 20.0) + 20.0).toFixed(2);
        }
    };

    const cashout = async () => {
        if (!isPlaying || isCrashed) return;

        clearInterval(intervalRef.current);
        setIsPlaying(false);
        setCashoutMultiplier(multiplier);

        const winAmount = parseFloat(betAmount) * multiplier;
        try {
            const response = await fetch('https://herrprofessor.pythonanywhere.com/api/update_balance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, amount: winAmount - parseFloat(betAmount) }),
            });
            if (!response.ok) {
                throw new Error('Failed to update balance');
            }
            const data = await response.json();
            setBalance(data.new_balance);
            onBalanceUpdate(data.new_balance);
            setGameHistory((prev) => [...prev, { multiplier, bet: betAmount, win: winAmount }]);
            toast.success(`You won ${(winAmount - parseFloat(betAmount)).toFixed(2)} YARA!`);
        } catch (error) {
            console.error('Failed to update balance:', error);
            toast.error('Failed to update balance. Please try again later.');
        }
    };

    const endGame = async () => {
        clearInterval(intervalRef.current);
        setIsPlaying(false);
        setIsCrashed(true);
        try {
            const response = await fetch('https://herrprofessor.pythonanywhere.com/api/update_balance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, amount: -parseFloat(betAmount) }),
            });
            if (!response.ok) {
                throw new Error('Failed to update balance');
            }
            const data = await response.json();
            setBalance(data.new_balance);
            onBalanceUpdate(data.new_balance);
            setGameHistory((prev) => [...prev, { multiplier: crashPointRef.current, bet: betAmount, win: 0 }]);
            toast.error(`You lost ${betAmount} YARA!`);
        } catch (error) {
            console.error('Failed to update balance:', error);
            toast.error('Failed to update balance. Please try again later.');
        }
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="crash-game">
            <h2>Crash Game</h2>
            <p>Balance: {balance.toFixed(2)} YARA</p>
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
                {isCrashed && <p className="crash-message">Crashed at {crashPointRef.current}x</p>}
                {cashoutMultiplier && (
                    <p className="cashout-message">
                        Cashed out at {cashoutMultiplier.toFixed(2)}x!
                        Won: {(parseFloat(betAmount) * cashoutMultiplier - parseFloat(betAmount)).toFixed(2)} YARA
                    </p>
                )}
            </div>
            <div className="game-history">
                <h3>Game History</h3>
                <ul>
                    {gameHistory.map((game, index) => (
                        <li key={index}>
                            {game.multiplier.toFixed(2)}x - Bet: {game.bet} YARA, Win: {game.win.toFixed(2)} YARA
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default Crash;
