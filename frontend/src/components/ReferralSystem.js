import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

function ReferralSystem({ userId, balance, setBalance }) {
    const [referralLink, setReferralLink] = useState('');
    const [lastClaimTime, setLastClaimTime] = useState(null);
    const [canClaim, setCanClaim] = useState(false);
    const [timeUntilNextClaim, setTimeUntilNextClaim] = useState(0);
    const [referrals, setReferrals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchReferralData();
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

    const fetchReferralData = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`https://herrprofessor.pythonanywhere.com/api/referrals/${userId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch referral data');
            }
            const data = await response.json();
            setReferralLink(data.referral_link);
            setLastClaimTime(data.last_claim_time);
            setReferrals(data.referrals);
        } catch (error) {
            console.error('Failed to fetch referral data:', error);
            toast.error('Failed to fetch referral data');
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = (text, message) => {
        navigator.clipboard.writeText(text)
            .then(() => toast.success(message))
            .catch(err => {
                console.error('Failed to copy:', err);
                toast.error('Failed to copy');
            });
    };

    const claimAll = async () => {
        if (canClaim && referrals.length > 0) {
            try {
                const response = await fetch('https://herrprofessor.pythonanywhere.com/api/claim_referrals', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ user_id: userId }),
                });
                const data = await response.json();
                if (data.success) {
                    setBalance(data.new_balance);
                    setLastClaimTime(new Date().toISOString());
                    setCanClaim(false);
                    toast.success(`Claimed ${data.reward} YARA from ${referrals.length} referrals!`);
                    fetchReferralData(); // Refresh referral data after claiming
                } else {
                    toast.error(data.error || 'Failed to claim rewards');
                }
            } catch (error) {
                console.error('Failed to claim rewards:', error);
                toast.error('Failed to claim rewards');
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
            <p>Your referral link:</p>
            <button onClick={() => copyToClipboard(referralLink, 'Referral link copied to clipboard!')}>
                Copy Link
            </button>
            <p>Share this link with your friends to earn 25% of their profits!</p>

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
