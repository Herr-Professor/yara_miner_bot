import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

function ReferralSystem({ balance, setBalance }) {
    const [referralCode] = useState('ABC123');
    const [lastClaimTime, setLastClaimTime] = useState(null);
    const [canClaim, setCanClaim] = useState(true);
    const [timeUntilNextClaim, setTimeUntilNextClaim] = useState(0);

    // Mock data for referrals
    const [referrals, setReferrals] = useState([
        { id: 1, name: 'Alice', totalEarning: 1000, lastClaim: 800, claimable: 50 },
        { id: 2, name: 'Bob', totalEarning: 1500, lastClaim: 1000, claimable: 125 },
        { id: 3, name: 'Charlie', totalEarning: 800, lastClaim: 500, claimable: 75 },
    ]);

    const totalClaimable = referrals.reduce((sum, referral) => sum + referral.claimable, 0);

    useEffect(() => {
        const timer = setInterval(() => {
            if (lastClaimTime) {
                const timeSinceClaim = Date.now() - lastClaimTime;
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
        if (canClaim && totalClaimable > 0) {
            // Update the main balance
            setBalance(prevBalance => prevBalance + totalClaimable);
            
            // Reset claimable amounts and update lastClaim
            setReferrals(referrals.map(referral => ({
                ...referral,
                lastClaim: referral.totalEarning,
                claimable: 0
            })));

            setLastClaimTime(Date.now());
            setCanClaim(false);
            
            toast.success(`Claimed ${totalClaimable} YARA from ${referrals.length} referrals!`);
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
                <p>Total Claimable: {totalClaimable} YARA</p>
                <button onClick={claimAll} disabled={!canClaim || totalClaimable === 0}>
                    {canClaim ? 'Claim All' : `Next claim in ${formatTime(timeUntilNextClaim)}`}
                </button>
            </div>

            <h3>Referral Details</h3>
            <ul>
                {referrals.map(referral => (
                    <li key={referral.id}>
                        <span>{referral.name}</span>
                        <span>Claimable: {referral.claimable} YARA</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default ReferralSystem;