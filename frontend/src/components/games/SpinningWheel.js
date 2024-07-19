import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const SpinningWheel = ({ userId, onBalanceUpdate }) => {
    const [balance, setBalance] = useState(0);
    const [freeSpins, setFreeSpins] = useState(3);
    const [betAmount, setBetAmount] = useState('');
    const [isSpinning, setIsSpinning] = useState(false);
    const [result, setResult] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const wheelOptions = [
        { label: 'x2', value: 'x2', chance: 50 },
        { label: 'x3', value: 'x3', chance: 25 },
        { label: '+1000', value: 1000, chance: 20 },
        { label: '+10000', value: 10000, chance: 10 },
        { label: '0', value: 0, chance: 75 },
        { label: '$1', value: 1, chance: 5 },
        { label: '$5', value: 5, chance: 2 },
        { label: '/2', value: '/2', chance: 50 },
        { label: '/3', value: '/3', chance: 35 },
        { label: '-1000', value: -1000, chance: 35 },
        { label: '-10000', value: -10000, chance: 35 },
    ];

    // Duplicate each option and add two more '0's
    const fullWheel = [
        ...wheelOptions,
        ...wheelOptions,
        { label: '0', value: 0, chance: 75 },
        { label: '0', value: 0, chance: 75 },
    ];

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
        }
    };

    const spin = async () => {
        if (isSpinning) return;

        let cost = 0;
        if (freeSpins > 0) {
            setFreeSpins(freeSpins - 1);
        } else {
            if (!betAmount || parseFloat(betAmount) <= 0) {
                toast.error('Please enter a valid bet amount');
                return;
            }
            cost = parseFloat(betAmount);
            if (cost > balance) {
                toast.error('Insufficient balance');
                return;
            }
        }

        setIsSpinning(true);
        setResult(null);

        // Simulate spinning animation
        const spinDuration = 3000; // 3 seconds
        const intervalDuration = 100; // 0.1 seconds
        const intervals = spinDuration / intervalDuration;
        let currentInterval = 0;

        const spinInterval = setInterval(() => {
            const randomIndex = Math.floor(Math.random() * fullWheel.length);
            setResult(fullWheel[randomIndex]);
            currentInterval++;

            if (currentInterval >= intervals) {
                clearInterval(spinInterval);
                handleSpinResult(fullWheel[randomIndex], cost);
            }
        }, intervalDuration);
    };

    const handleSpinResult = async (result, cost) => {
        let winAmount = 0;
        let newBalance = balance - cost;

        switch (result.value) {
            case 'x2':
                winAmount = newBalance;
                newBalance *= 2;
                break;
            case 'x3':
                winAmount = newBalance * 2;
                newBalance *= 3;
                break;
            case '/2':
                newBalance = Math.floor(newBalance / 2);
                break;
            case '/3':
                newBalance = Math.floor(newBalance / 3);
                break;
            default:
                if (typeof result.value === 'number') {
                    winAmount = result.value;
                    newBalance += result.value;
                }
        }

        try {
            const response = await fetch('https://herrprofessor.pythonanywhere.com/api/update_balance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, amount: newBalance - balance }),
            });
            if (!response.ok) {
                throw new Error('Failed to update balance');
            }
            const data = await response.json();
            setBalance(data.new_balance);
            onBalanceUpdate(data.new_balance);

            if (winAmount > 0) {
                toast.success(`You won ${winAmount} YARA!`);
            } else if (winAmount < 0) {
                toast.error(`You lost ${-winAmount} YARA!`);
            } else {
                toast.info('No change in balance');
            }
        } catch (error) {
            console.error('Failed to update balance:', error);
            toast.error('Failed to update balance. Please try again later.');
        } finally {
            setIsSpinning(false);
        }
    };

    const buySpins = async () => {
        const spinCost = 1000; // Cost of one spin
        if (balance < spinCost) {
            toast.error('Insufficient balance to buy spins');
            return;
        }

        try {
            const response = await fetch('https://herrprofessor.pythonanywhere.com/api/update_balance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, amount: -spinCost }),
            });
            if (!response.ok) {
                throw new Error('Failed to update balance');
            }
            const data = await response.json();
            setBalance(data.new_balance);
            onBalanceUpdate(data.new_balance);
            setFreeSpins(freeSpins + 1);
            toast.success('You bought 1 spin!');
        } catch (error) {
            console.error('Failed to buy spin:', error);
            toast.error('Failed to buy spin. Please try again later.');
        }
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="spinning-wheel-game">
            <h2>Spinning Wheel</h2>
            <p>Balance: {balance.toFixed(2)} YARA</p>
            <p>Free Spins: {freeSpins}</p>
            <div className="bet-controls">
                <input
                    type="text"
                    value={betAmount}
                    onChange={handleBetChange}
                    placeholder="Enter bet amount"
                    disabled={isSpinning || freeSpins > 0}
                />
                <button onClick={spin} disabled={isSpinning}>
                    {isSpinning ? 'Spinning...' : 'Spin'}
                </button>
                <button onClick={buySpins} disabled={isSpinning || balance < 1000}>
                    Buy Spin (1000 YARA)
                </button>
            </div>
            <div className="wheel-display">
                {result && (
                    <p className="result">
                        Result: {result.label} ({result.chance}% chance)
                    </p>
                )}
            </div>
            <div className="wheel-options">
                <h3>Wheel Options:</h3>
                <ul>
                    {wheelOptions.map((option, index) => (
                        <li key={index}>
                            {option.label} ({option.chance}% chance)
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default SpinningWheel;