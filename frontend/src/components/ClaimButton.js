import React, { useState, useEffect } from 'react';
import { useSpring, animated } from 'react-spring';

function ClaimButton({ onClaim, nextClaimTime, miningProgress }) {
    const [timeLeft, setTimeLeft] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date().getTime();
            const distance = nextClaimTime - now;
            
            if (distance < 0) {
                setTimeLeft('Claim Now!');
            } else {
                const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [nextClaimTime]);

    const buttonAnimation = useSpring({
        from: { scale: 1 },
        to: { scale: isLoading ? 0.95 : 1 },
    });

    const handleClick = async () => {
        setIsLoading(true);
        await onClaim();
        setIsLoading(false);
    };

    return (
        <div className="claim-button">
            <h2>Mining Progress</h2>
            <p>{miningProgress} / 3500</p>
            <p>{timeLeft}</p>
            <animated.button 
                onClick={handleClick} 
                disabled={timeLeft !== 'Claim Now!' || isLoading}
                style={buttonAnimation}
            >
                {isLoading ? 'Claiming...' : (timeLeft === 'Claim Now!' ? 'Claim Tokens' : 'Mining...')}
            </animated.button>
        </div>
    );
}

export default ClaimButton;