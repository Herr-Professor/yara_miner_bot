import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import './Crash.css';

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
    const [autoCashout, setAutoCashout] = useState('');

    const intervalRef = useRef(null);
    const crashPointRef = useRef(null);
    const canvasRef = useRef(null);

    useEffect(() => {
        fetchUserBalance();
    }, [userId]);

    useEffect(() => {
        if (isPlaying) {
            drawChart();
        }
    }, [multiplier, isPlaying]);

    const fetchUserBalance = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`https://herrprofessor.pythonanywhere.com/api/user/${userId}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch user balance');
            }
            const userData = await response.json();
            setBalance(userData.balance);
            onBalanceUpdate(userData.balance);
        } catch (error) {
            console.error('Failed to fetch user balance:', error);
            toast.error(`Failed to fetch user balance: ${error.message}`);
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

    const updateBalance = async (amount) => {
        try {
            const response = await fetch('https://herrprofessor.pythonanywhere.com/api/update_balance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, amount: amount }),
            });
            if (!response.ok) {
                throw new Error('Failed to update balance');
            }
            const data = await response.json();
            setBalance(data.new_balance);
            onBalanceUpdate(data.new_balance);
            return data.new_balance;
        } catch (error) {
            console.error('Failed to update balance:', error);
            toast.error('Failed to update balance. Please try again.');
            throw error;
        }
    };

    const startGame = async () => {
        if (!betAmount || parseFloat(betAmount) <= 0 || parseFloat(betAmount) > balance) {
            setError('Please enter a valid bet amount');
            return;
        }

        setError('');
        setIsPlaying(true);
        setIsCrashed(false);
        setCashoutMultiplier(null);
        crashPointRef.current = generateCrashPoint();

        try {
            await updateBalance(-parseFloat(betAmount));
            
            setMultiplier(1);
            intervalRef.current = setInterval(() => {
                setMultiplier((prev) => {
                    const newMultiplier = parseFloat((prev + 0.01).toFixed(2));
                    if (newMultiplier >= parseFloat(crashPointRef.current)) {
                        endGame();
                    } else if (autoCashout && newMultiplier >= parseFloat(autoCashout)) {
                        cashout();
                    }
                    return newMultiplier;
                });
            }, 100);
        } catch (error) {
            setIsPlaying(false);
            toast.error('Failed to start game. Please try again.');
        }
    };

    const cashout = async () => {
        if (!isPlaying || isCrashed) return;

        clearInterval(intervalRef.current);
        setIsPlaying(false);
        setCashoutMultiplier(multiplier);

        const winAmount = parseFloat((parseFloat(betAmount) * multiplier).toFixed(2));
        try {
            const newBalance = await updateBalance(winAmount);
            setGameHistory((prev) => [{multiplier, bet: betAmount, win: winAmount}, ...prev.slice(0, 9)]);
            toast.success(`You won ${(winAmount - parseFloat(betAmount)).toFixed(2)} YARA!`);
        } catch (error) {
            // Error handling is done in updateBalance function
        }
    };

    const endGame = () => {
        clearInterval(intervalRef.current);
        setIsPlaying(false);
        setIsCrashed(true);
        setGameHistory((prev) => [{multiplier: crashPointRef.current, bet: betAmount, win: 0}, ...prev.slice(0, 9)]);
        toast.error(`You lost ${betAmount} YARA!`);
    };

    const drawChart = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);
        ctx.beginPath();
        ctx.moveTo(0, height);

        for (let i = 0; i <= multiplier - 1; i += 0.01) {
            const x = (i / (multiplier - 1)) * width;
            const y = height - (Math.pow(1.0065, i * 100) / Math.pow(1.0065, (multiplier - 1) * 100)) * height;
            ctx.lineTo(x, y);
        }

        ctx.strokeStyle = isCrashed ? 'red' : 'green';
        ctx.lineWidth = 2;
        ctx.stroke();
    };

    const handleAutoCashoutChange = (e) => {
        const value = e.target.value;
        if (/^\d*\.?\d*$/.test(value)) {
            setAutoCashout(value);
        }
    };

    if (isLoading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div className="crash-game">
            <h2>Crash Game</h2>
            <p className="balance">Balance: {balance.toFixed(2)} YARA</p>
            <div className="game-display">
                <canvas ref={canvasRef} width="400" height="200"></canvas>
                <p className="multiplier">{multiplier.toFixed(2)}x</p>
                {isCrashed && <p className="crash-message">Crashed at {crashPointRef.current}x</p>}
                {cashoutMultiplier && (
                    <p className="cashout-message">
                        Cashed out at {cashoutMultiplier.toFixed(2)}x!
                        Won: {(parseFloat(betAmount) * cashoutMultiplier - parseFloat(betAmount)).toFixed(2)} YARA
                    </p>
                )}
            </div>
            <div className="bet-controls">
                <input
                    type="text"
                    value={betAmount}
                    onChange={handleBetChange}
                    placeholder="Enter bet amount"
                    disabled={isPlaying}
                />
                <input
                    type="text"
                    value={autoCashout}
                    onChange={handleAutoCashoutChange}
                    placeholder="Auto cashout at"
                    disabled={isPlaying}
                />
                <button onClick={startGame} disabled={isPlaying} className={isPlaying ? 'disabled' : ''}>
                    Start Game
                </button>
                <button onClick={cashout} disabled={!isPlaying || isCrashed} className={!isPlaying || isCrashed ? 'disabled' : ''}>
                    Cash Out
                </button>
            </div>
            {error && <p className="error">{error}</p>}
            <div className="game-history">
                <h3>Game History</h3>
                <ul>
                    {gameHistory.map((game, index) => (
                        <li key={index} className={game.win > 0 ? 'win' : 'loss'}>
                            {game.multiplier.toFixed(2)}x - Bet: {game.bet} YARA, Win: {game.win.toFixed(2)} YARA
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default Crash;