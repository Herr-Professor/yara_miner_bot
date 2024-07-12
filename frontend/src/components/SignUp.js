import React, { useState } from 'react';
import { createUser } from '../services/api';

const SignUp = ({ onSignUp }) => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (username.length !== 5) {
      setError('Username must be exactly 5 characters long');
      return;
    }
    try {
      const response = await createUser(username);
      if (response.user_id && response.secret_code) {
        onSignUp(response.user_id, response.secret_code);
      } else {
        setError('Failed to create user. Please try again.');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div className="sign-up">
      <h2>Sign Up</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter 5-character username"
          maxLength={5}
          required
        />
        <button type="submit">Sign Up</button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default SignUp;