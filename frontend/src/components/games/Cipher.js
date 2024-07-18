import React, { useState, useEffect } from 'react';

const Cipher = ({ userId, initialBalance = 1000 }) => {
    const [inputs, setInputs] = useState(Array(9).fill(''));
    const [message, setMessage] = useState('');
    const [reward, setReward] = useState(1000);
    const [solved, setSolved] = useState(false);
    const [balance, setBalance] = useState(initialBalance);
    const [nextAvailableTime, setNextAvailableTime] = useState(null);

    useEffect(() => {
        // Simulate fetching user data
        const now = new Date();
        if (now.getUTCHours() >= 12) {
            now.setDate(now.getDate() + 1);
        }
        now.setUTCHours(12, 0, 0, 0);
        setNextAvailableTime(now.toISOString());
    }, []);

    const handleInputChange = (index, value) => {
        const newInputs = [...inputs];
        newInputs[index] = value.toUpperCase();
        setInputs(newInputs);
    };

    const checkSolution = () => {
        if (solved) {
            setMessage("You've already solved this cipher. Wait for the next one.");
            return;
        }

        const solution = inputs.join('');
        if (solution === 'HELLWORLD') {
            const newBalance = balance + reward;
            setBalance(newBalance);
            setMessage(`Congratulations! You solved the cipher and earned ${reward} YARA! Your new balance is ${newBalance} YARA.`);
            setSolved(true);
            
            const nextTime = new Date();
            nextTime.setUTCHours(12, 0, 0, 0);
            if (nextTime <= new Date()) {
                nextTime.setDate(nextTime.getDate() + 1);
            }
            setNextAvailableTime(nextTime.toISOString());
        } else {
            setMessage("Sorry, that's not correct. Try again!");
        }
    };

    const canSolveCipher = nextAvailableTime ? new Date() >= new Date(nextAvailableTime) : true;

    return (
        <div className="cipher-game">
            <h2>Cipher Game</h2>
            <p>Instructions: Solve the cipher presented. Enter your solution below.</p>
            <p>Total reward for correct solution: {reward} YARA</p>
            <p>Your current balance: {balance} YARA</p>
            {solved ? (
                <div>
                    <p>You have already solved this cipher. Please come back at 12:00 UTC for the next one.</p>
                    <p>Next available time to solve: {new Date(nextAvailableTime).toLocaleString()}</p>
                </div>
            ) : (
                <div>
                    <div className="cipher-inputs">
                        {inputs.map((input, index) => (
                            <input
                                key={index}
                                type="text"
                                maxLength="1"
                                value={input}
                                onChange={(e) => handleInputChange(index, e.target.value)}
                                disabled={!canSolveCipher}
                            />
                        ))}
                    </div>
                    <button onClick={checkSolution} disabled={!canSolveCipher}>
                        Check Solution
                    </button>
                    {message && <p className={`message ${message.includes('Congratulations') ? 'success' : 'error'}`}>{message}</p>}
                </div>
            )}
        </div>
    );
};

export default Cipher;