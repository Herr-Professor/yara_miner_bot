import React, { useState, useEffect } from 'react';
import { updateBalance, getUser } from '../../services/api';

const Cipher = ({ userId }) => {
    const [inputs, setInputs] = useState(Array(9).fill(''));
    const [message, setMessage] = useState('');
    const [reward, setReward] = useState(1000);
    const [solved, setSolved] = useState(false);
    const [balance, setBalance] = useState(null);
    const [nextAvailableTime, setNextAvailableTime] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        setIsLoading(true);
        try {
            const userData = await getUser(userId);
            setBalance(userData.balance);
            setSolved(userData.cipher_solved);
            setNextAvailableTime(userData.next_cipher_time);
        } catch (error) {
            console.error('Error fetching user data:', error);
            setMessage('Failed to fetch user data. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (index, value) => {
        const newInputs = [...inputs];
        newInputs[index] = value.toUpperCase();
        setInputs(newInputs);
    };

    const checkSolution = async () => {
        if (solved) {
            setMessage("You've already solved this cipher. Wait for the next one.");
            return;
        }

        const solution = inputs.join('');
        if (solution === 'HELLWORLD') {
            try {
                const now = new Date().toISOString();
                const nextTime = new Date();
                nextTime.setUTCHours(12, 0, 0, 0); // Set next available time to 12:00 UTC
                if (nextTime <= new Date()) {
                    nextTime.setDate(nextTime.getDate() + 1);
                }
                const nextAvailableTimeISO = nextTime.toISOString();
                const result = await updateBalance(userId, reward, now, nextAvailableTimeISO);
                if (result && result.new_balance !== undefined) {
                    setBalance(result.new_balance);
                    setMessage(`Congratulations! You solved the cipher and earned ${reward} YARA! Your new balance is ${result.new_balance} YARA.`);
                    setSolved(true);
                    setNextAvailableTime(nextAvailableTimeISO);
                } else {
                    throw new Error('Invalid response from server');
                }
            } catch (error) {
                console.error('Error updating balance:', error);
                setMessage('You solved the cipher, but there was an error updating your balance. Please try again.');
            }
        } else {
            setMessage("Sorry, that's not correct. Try again!");
        }
    };

    const canSolveCipher = nextAvailableTime ? new Date() >= new Date(nextAvailableTime) : true;

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="cipher-game">
            <h2>Cipher Game</h2>
            <p>Instructions: Solve the cipher presented. Enter your solution below.</p>
            <p>Total reward for correct solution: {reward} YARA</p>
            <p>Your current balance: {balance !== null ? `${balance} YARA` : 'Loading...'}</p>
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
