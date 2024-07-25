import React, { useState, useEffect } from 'react';
import { TonConnectButton } from '@tonconnect/ui-react';
import { useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import { Snackbar, Alert, Tabs, Tab, Box } from '@mui/material';

function Store({ userId, balance, setBalance }) {
    const [items, setItems] = useState([]);
    const [tonItems, setTonItems] = useState([]);
    const [balanceItems, setBalanceItems] = useState([]);
    const [tonConnectUI] = useTonConnectUI();
    const userFriendlyAddress = useTonAddress();
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
    const [activeTab, setActiveTab] = useState(0);
    const [lastPurchaseTime, setLastPurchaseTime] = useState(null);

    useEffect(() => {
        fetchStoreItems();
        fetchLastPurchaseTime();
    }, []);

    useEffect(() => {
        if (userFriendlyAddress) {
            updateWalletAddress(userFriendlyAddress);
        }
    }, [userFriendlyAddress, userId]);

    const updateWalletAddress = async (address) => {
        try {
            const response = await fetch('https://herrprofessor.pythonanywhere.com/api/user/update_wallet', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ user_id: userId, wallet_address: address }),
            });
            if (!response.ok) {
                throw new Error('Failed to update wallet address');
            }
        } catch (error) {
            console.error('Error updating wallet address:', error);
        }
    };

    const fetchStoreItems = async () => {
        try {
            const response = await fetch(`https://herrprofessor.pythonanywhere.com/api/store/items?user_id=${userId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch store items');
            }
            const items = await response.json();
            setItems(items);
            setTonItems(items.filter(item => item.currency === 'TON'));
            setBalanceItems(items.filter(item => item.currency === 'Balance'));
        } catch (error) {
            console.error('Error fetching store items:', error);
            showNotification('Failed to load store items', 'error');
        }
    };

    const fetchLastPurchaseTime = async () => {
        try {
            const response = await fetch(`https://herrprofessor.pythonanywhere.com/api/user/${userId}/last_purchase_time`);
            if (!response.ok) {
                throw new Error('Failed to fetch last purchase time');
            }
            const data = await response.json();
            setLastPurchaseTime(data.last_purchase_time);
        } catch (error) {
            console.error('Error fetching last purchase time:', error);
        }
    };

    const handlePurchase = async (item) => {
        if (item.currency === 'TON') {
            await handleTonPurchase(item);
        } else {
            await handleBalancePurchase(item);
        }
    };

    const handleTonPurchase = async (item) => {
        if (!userFriendlyAddress) {
            showNotification('Please connect your TON wallet first', 'warning');
            return;
        }

        const now = new Date();
        if (lastPurchaseTime && now - new Date(lastPurchaseTime) < 48 * 60 * 60 * 1000) {
            showNotification('You can only purchase a multiplier once every 48 hours', 'warning');
            return;
        }

        try {
            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 60 * 20,
                messages: [
                    {
                        address: "0:f995bb85149b3295b8df591c96c920c783a4cb30d3f329a2d8f6f2cb2f772b82",
                        amount: (item.price * 1e9).toString(),
                    }
                ]
            };

            const result = await tonConnectUI.sendTransaction(transaction);
            if (result) {
                await updateUserMultiplier(item.multiplier);
                setLastPurchaseTime(new Date().toISOString());
                showNotification(`Successfully purchased ${item.name}`, 'success');
            }
        } catch (error) {
            console.error('Purchase error:', error);
            showNotification('Purchase failed. Please try again.', 'error');
        }
    };

    const handleBalancePurchase = async (item) => {
        if (balance < item.price) {
            showNotification('Insufficient balance', 'error');
            return;
        }
    
        try {
            const response = await fetch('https://herrprofessor.pythonanywhere.com/api/purchase', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ user_id: userId, item_id: item.id }),
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Purchase failed');
            }
    
            const result = await response.json();
            setBalance(result.new_balance);
            showNotification(`Successfully purchased ${item.name}`, 'success');
        } catch (error) {
            console.error('Purchase error:', error);
            showNotification(error.message, 'error');
        }
    };

    const updateUserMultiplier = async (multiplier) => {
        try {
            const response = await fetch('https://herrprofessor.pythonanywhere.com/api/update_multiplier', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ user_id: userId, multiplier: multiplier }),
            });

            if (!response.ok) {
                throw new Error('Failed to update user multiplier');
            }
        } catch (error) {
            console.error('Error updating user multiplier:', error);
        }
    };

    const showNotification = (message, severity) => {
        setNotification({ open: true, message, severity });
    };

    const handleCloseNotification = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setNotification({ ...notification, open: false });
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    return (
        <div className="store">
            <TonConnectButton />
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={activeTab} onChange={handleTabChange}>
                    <Tab label="TON Store" />
                    <Tab label="Balance Store" />
                </Tabs>
            </Box>
            <Box sx={{ p: 3 }}>
                {activeTab === 0 && (
                    <div className="store-items">
                        {tonItems.map(item => (
                            <div key={item.id} className="store-item">
                                <h3>{item.name}</h3>
                                <p>{item.description}</p>
                                <p>Price: {item.price} TON</p>
                                <p>Multiplier: x{item.multiplier}</p>
                                <button onClick={() => handlePurchase(item)}>Buy</button>
                            </div>
                        ))}
                    </div>
                )}
                {activeTab === 1 && (
                    <div className="store-items">
                        {balanceItems.map(item => (
                            <div key={item.id} className="store-item">
                            <h3>{item.name}</h3>
                            <p>{item.description}</p>
                            <p>Price: {item.price} tokens</p>
                            <p>Mining Speed: x{item.multiplier}</p>
                        <button 
                            onClick={() => handlePurchase(item)} 
                            disabled={item.purchased}
                        >
                           {item.purchased ? 'Already Purchased' : 'Buy'}
                        </button>
                            </div>
                        ))}
                    </div>
                )}
            </Box>
            <Snackbar open={notification.open} autoHideDuration={6000} onClose={handleCloseNotification}>
                <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }}>
                    {notification.message}
                </Alert>
            </Snackbar>
        </div>
    );
}

export default Store;