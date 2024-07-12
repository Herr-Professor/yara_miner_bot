// src/components/games/Cipher.js
import React, { useState } from 'react';
import { updateGamePoints } from '../../services/api';  // Assuming you have this API function

const Cipher = ({ userId }) => {
    const [inputs, setInputs] = useState(Array(10).fill(''));
    const [message, setMessage] = useState('');
    const [reward, setReward] = useState(100);  // Example reward amount

    const handleInputChange = (index, value) => {
        const newInputs = [...inputs];
        newInputs[index] = value.toUpperCase();
        setInputs(newInputs);
    };

    const checkSolution = async () => {
        const solution = inputs.join('');
        // This is where you'd check if the solution is correct
        // For this example, let's say the correct answer is "HELLOWORLD"
        if (solution === "HELLOWORLD") {
            try {
                await updateGamePoints(userId, reward);
                setMessage("Congratulations! You solved the cipher and earned " + reward + " points!");
            } catch (error) {
                setMessage("You solved the cipher, but there was an error updating your points. Please try again.");
            }
        } else {
            setMessage("Sorry, that's not correct. Try again!");
        }
    };

    return (
        <div className="cipher-game">
            <h2>Cipher Game</h2>
            <p>Instructions: Solve the cipher presented in the Telegram channel. Enter your solution below.</p>
            <p>Total reward for correct solution: {reward} points</p>
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
            <button onClick={checkSolution}>Check Solution</button>
            {message && <p className={`message ${message.includes("Congratulations") ? "success" : "error"}`}>{message}</p>}
        </div>
    );
};

export default Cipher;