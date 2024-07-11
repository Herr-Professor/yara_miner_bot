import React, { useState } from 'react';
import { useSpring, animated } from 'react-spring';

function ComboSystem({ onComboSubmit }) {
    const [combo, setCombo] = useState('');

    const inputAnimation = useSpring({
        from: { width: '100%' },
        to: { width: combo.length === 5 ? '120%' : '100%' },
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onComboSubmit(combo);
        setCombo('');
    };

    return (
        <div className="combo-system">
            <h2>Combo System</h2>
            <form onSubmit={handleSubmit}>
                <animated.input 
                    type="text" 
                    value={combo} 
                    onChange={(e) => setCombo(e.target.value)} 
                    maxLength={5} 
                    placeholder="Enter 5-letter combo"
                    style={inputAnimation}
                />
                <button type="submit">Submit Combo</button>
            </form>
        </div>
    );
}

export default ComboSystem;
