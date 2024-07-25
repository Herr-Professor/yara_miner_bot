import React, { useState, useEffect } from 'react';
import { useSpring, animated } from 'react-spring';
import { toast } from 'react-toastify';

function ClaimButton({ onClaim, nextClaimTime, miningProgress, balanceMultiplier }) {
    const [timeLeft, setTimeLeft] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const baseClaimAmount = 3500;
    const multipliedClaimAmount = baseClaimAmount * balanceMultiplier;

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

    const progressAnimation = useSpring({
        width: `${(miningProgress / multipliedClaimAmount) * 100}%`,
        from: { width: '0%' },
    });

    const handleClick = async () => {
        setIsLoading(true);
        try {
            const result = await onClaim();
            if (result.success) {
                toast.success(`Tokens claimed successfully! You received ${result.claimedAmount} tokens.`);
            }
        } catch (error) {
            console.error('Failed to claim tokens:', error);
            toast.error(error.message || 'Failed to claim tokens. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="claim-button">
            <div className="mining-progress">
                <animated.div className="progress-bar" style={progressAnimation} />
                <p className="progress-text">{miningProgress} / {multipliedClaimAmount}</p>
            </div>
            <p className="time-left">{timeLeft}</p>
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