import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getUser, getUserReferrals, claimReferralRewards, updateLastReferralClaimTime } from '../services/api';

function ReferralSystem({ userId, balance, setBalance }) {
    const [referralCode, setReferralCode] = useState('');
    const [lastClaimTime, setLastClaimTime] = useState(null);
    const [canClaim, setCanClaim] = useState(true);
    const [timeUntilNextClaim, setTimeUntilNextClaim] = useState(0);
    const [referrals, setReferrals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchUserData();
    }, [userId]);

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

    const fetchUserData = async () => {
        setIsLoading(true);
        try {
            const userData = await getUser(userId);
            setReferralCode(userData.referral_code);
            setLastClaimTime(userData.last_referral_claim);
            
            const referralsData = await getUserReferrals(userId);
            setReferrals(referralsData);
        } catch (error) {
            toast.error('Failed to fetch user data. Please try again.');
            console.error('Error fetching user data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(referralCode);
        toast.success('Referral code copied to clipboard!');
    };

    const claimAll = async () => {
        if (canClaim && referrals.length > 0) {
            try {
                const result = await claimReferralRewards(userId);
                if (result.message === "Referral rewards claimed successfully") {
                    const newBalance = balance + result.reward;
                    setBalance(newBalance);
                    setLastClaimTime(new Date().toISOString());
                    setCanClaim(false);
                    toast.success(`Claimed ${result.reward} YARA from ${referrals.length} referrals!`);
                    await updateLastReferralClaimTime(userId);
                    fetchUserData(); // Refresh user data after claiming
                } else {
                    toast.warning(result.message);
                }
            } catch (error) {
                toast.error('Failed to claim rewards. Please try again.');
                console.error('Error claiming rewards:', error);
            }
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

    if (isLoading) {
        return <div>Loading referral data...</div>;
    }

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
                            <span>User {referral.name}</span>
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