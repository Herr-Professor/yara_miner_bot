import React from 'react';

function Balance({ balance }) {
    return (
        <div className="balance">
            <h2>Balance</h2>
            <p>{balance} YARA</p>
        </div>
    );
}

export default Balance;