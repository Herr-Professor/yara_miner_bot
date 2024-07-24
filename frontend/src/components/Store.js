import React, { useState, useEffect } from 'react';
import { TonConnectButton } from '@tonconnect/ui-react';
import { useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import { Snackbar, Alert } from '@mui/material';

function Store({ userId, balance, setBalance }) {
    const [items, setItems] = useState([]);
    const [tonConnectUI] = useTonConnectUI();
    const userFriendlyAddress = useTonAddress();
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

    useEffect(() => {
        fetchStoreItems();
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
            const response = await fetch('https://herrprofessor.pythonanywhere.com/api/store/items');
            if (!response.ok) {
                throw new Error('Failed to fetch store items');
            }
            const items = await response.json();
            setItems(items);
        } catch (error) {
            console.error('Error fetching store items:', error);
            showNotification('Failed to load store items', 'error');
        }
    };

    const handlePurchase = async (item) => {
        if (!userFriendlyAddress) {
            showNotification('Please connect your TON wallet first', 'warning');
            return;
        }

        try {
            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 60 * 20, // Valid for 20 minutes
                messages: [
                    {
                        address: "0:f995bb85149b3295b8df591c96c920c783a4cb30d3f329a2d8f6f2cb2f772b82",
                        amount: (item.price * 1e9).toString(), // Convert TON to nanotons
                    }
                ]
            };

            const result = await tonConnectUI.sendTransaction(transaction);
            if (result) {
                showNotification(`Successfully purchased ${item.name}`, 'success');
            }
        } catch (error) {
            console.error('Purchase error:', error);
            showNotification('Purchase failed. Please try again.', 'error');
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

    return (
        <div className="store">
            <TonConnectButton />
            <div className="store-items">
                {items.map(item => (
                    <div key={item.id} className="store-item">
                        <h3>{item.name}</h3>
                        <p>{item.description}</p>
                        <p>Price: {item.price} TON</p>
                        <button onClick={() => handlePurchase(item)}>Buy</button>
                    </div>
                ))}
            </div>
            <Snackbar open={notification.open} autoHideDuration={6000} onClose={handleCloseNotification}>
                <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }}>
                    {notification.message}
                </Alert>
            </Snackbar>
        </div>
    );
}

export default Store;