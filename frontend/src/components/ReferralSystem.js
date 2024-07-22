import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

function ReferralSystem({ userId }) {
    const [referralLink, setReferralLink] = useState('');
    const [referrals, setReferrals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchReferralData();
    }, [userId]);

    const fetchReferralData = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`https://herrprofessor.pythonanywhere.com/api/referrals/${userId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch referral data');
            }
            const data = await response.json();
            setReferralLink(data.referral_link);
            setReferrals(data.referrals || []); // Use an empty array if no referrals
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

    if (isLoading) {
        return <div>Loading referral data...</div>;
    }

    return (
        <div className="referral-system">
            <p>Your referral link:</p>
            <button onClick={() => copyToClipboard(referralLink, 'Copied to clipboard!')}>
                Copy Link
            </button>
            <p>Share this link with your friends to an additional 2000 $YARA!</p>

            <div className="claim-all-section">
                <h3>Your Referrals: {referrals.length}</h3>
            </div>

            <h3>Referral Details</h3>
            {referrals.length > 0 ? (
                <ul>
                    {referrals.map(referral => (
                        <li key={referral.id}>
                            <span> {referral.username}</span>
                            <span> {referral.balance} YARA</span>
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
