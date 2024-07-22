import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const Cipher = ({ userId, onBalanceUpdate }) => {
    const [inputs, setInputs] = useState(Array(9).fill(''));
    const [message, setMessage] = useState('');
    const [reward, setReward] = useState(1000);
    const [solved, setSolved] = useState(false);
    const [nextAvailableTime, setNextAvailableTime] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchCipherStatus();
        const interval = setInterval(fetchCipherStatus, 60000); // Check every minute
        return () => clearInterval(interval);
    }, [userId]);

    const fetchCipherStatus = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`https://herrprofessor.pythonanywhere.com/api/user/${userId}`);
            const userData = await response.json();
            setSolved(userData.cipher_solved);
            setNextAvailableTime(userData.next_cipher_time);
        } catch (error) {
            console.error('Failed to fetch cipher status:', error);
            toast.error('Failed to fetch cipher status');
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
            setMessage("You've already solved today's cipher. The next one will be available at 12 PM UTC.");
            return;
        }

        const solution = inputs.join('');
        setIsLoading(true);
        try {
            const response = await fetch('https://herrprofessor.pythonanywhere.com/api/solve_cipher', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ user_id: userId, solution: solution }),
            });
            const data = await response.json();
            if (data.success) {
                setMessage(`Congratulations! You solved the cipher and earned ${reward} YARA! Your new balance is ${data.new_balance} YARA.`);
                setSolved(true);
                onBalanceUpdate(data.new_balance);
                setNextAvailableTime(data.next_cipher_time);
                toast.success('Cipher solved successfully!');
            } else {
                setMessage("Sorry, that's not correct. Try again!");
                toast.error('Incorrect solution');
            }
        } catch (error) {
            console.error('Failed to check solution:', error);
            toast.error('Failed to check solution');
        } finally {
            setIsLoading(false);
        }
    };

    const formatTimeLeft = () => {
        if (!nextAvailableTime) return '';
        const now = new Date();
        const next = new Date(nextAvailableTime);
        const diff = next - now;
        if (diff <= 0) return 'Available now!';
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `Next cipher in ${hours}h ${minutes}m`;
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="cipher-game">
            <h2>Cipher Game</h2>
            <p>Instructions: Solve the daily cipher. Enter your solution below.</p>
            <p>Total reward for correct solution: {reward} YARA</p>
            {solved ? (
                <div>
                    <p>You have already solved today's cipher. The next one will be available at 12:00 UTC.</p>
                    <p>{formatTimeLeft()}</p>
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
                            />
                        ))}
                    </div>
                    <button onClick={checkSolution} disabled={isLoading}>
                        {isLoading ? 'Checking...' : 'Check Solution'}
                    </button>
                    {message && <p className={`message ${message.includes('Congratulations') ? 'success' : 'error'}`}>{message}</p>}
                    <p>{formatTimeLeft()}</p>
                </div>
            )}
        </div>
    );
};

export default Cipher;