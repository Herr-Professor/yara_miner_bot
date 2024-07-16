import React from 'react';

function Username({ username }) {
    return (
        <div className="username-display">
            <h2>Welcome, @{username}</h2>
        </div>
    );
}

export default Username;