import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

function ReferralSystem({ userId, balance, setBalance }) {
    const [referralCode, setReferralCode] = useState('REF123456');
    const [lastClaimTime, setLastClaimTime] = useState(new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString());
    const [canClaim, setCanClaim] = useState(false);
    const [timeUntilNextClaim, setTimeUntilNextClaim] = useState(0);
    const [referrals, setReferrals] = useState([
        { id: 1, username: 'User1', balance: 1000 },
        { id: 2, username: 'User2', balance: 1500 },
        { id: 3, username: 'User3', balance: 2000 },
    ]);

    useEffect(() => {
        const timer = setInterval(() => {
            if (lastClaimTime) {
                const timeSinceClaim = Date.now() - new Date(lastClaimTime).getTime();
                const fourHours = 4 * 60 * 60 * 1000;
                if (timeSinceClaim >= fourHours) {
                    setCanClaim(true);
                    setTimeUntilNextClaim(0);
                } else {
                    setCanClaim(false);
                    setTimeUntilNextClaim(fourHours - timeSinceClaim);
                }
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [lastClaimTime]);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(referralCode);
        toast.success('Referral code copied to clipboard!');
    };

    const claimAll = () => {
        if (canClaim && referrals.length > 0) {
            const reward = referrals.reduce((sum, referral) => sum + referral.balance * 0.25, 0);
            const newBalance = balance + reward;
            setBalance(newBalance);
            setLastClaimTime(new Date().toISOString());
            setCanClaim(false);
            toast.success(`Claimed ${reward} YARA from ${referrals.length} referrals!`);
        } else if (!canClaim) {
            toast.warning('You need to wait before claiming again.');
        } else {
            toast.info('No rewards to claim at the moment.');
        }
    };

    const formatTime = (ms) => {
        const hours = Math.floor(ms / (60 * 60 * 1000));
        const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
        const seconds = Math.floor((ms % (60 * 1000)) / 1000);
        return `${hours}h ${minutes}m ${seconds}s`;
    };

    return (
        <div className="referral-system">
            <p>Your referral code: {referralCode}</p>
            <button onClick={copyToClipboard}>Copy Code</button>
            <p>Share this code with your friends to earn 25% of their profits!</p>

            <div className="claim-all-section">
                <h3>Your Referrals: {referrals.length}</h3>
                <p>Total Claimable: Calculated on claim</p>
                <button onClick={claimAll} disabled={!canClaim || referrals.length === 0}>
                    {canClaim ? 'Claim All' : `Next claim in ${formatTime(timeUntilNextClaim)}`}
                </button>
            </div>

            <h3>Referral Details</h3>
            {referrals.length > 0 ? (
                <ul>
                    {referrals.map(referral => (
                        <li key={referral.id}>
                            <span>User {referral.username}</span>
                            <span>Balance: {referral.balance} YARA</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>You haven't referred anyone yet.</p>
            )}
        </div>
    );
}

export default ReferralSystem;