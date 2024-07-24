import React, { useState, useEffect } from 'react';
import { TonConnectButton } from '@tonconnect/ui-react';
import { useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';

function Store({ userId, balance, setBalance }) {
    const [items, setItems] = useState([]);
    const [tonConnectUI] = useTonConnectUI();
    const userFriendlyAddress = useTonAddress();

    useEffect(() => {
        fetchStoreItems();
    }, []);

    useEffect(() => {
        if (userFriendlyAddress) {
            updateWalletAddress(userFriendlyAddress);
        }
    }, [userFriendlyAddress, userId]);

    useEffect(() => {
        const connectStoredWallet = async () => {
            try {
                const response = await fetch(`https://herrprofessor.pythonanywhere.com/api/user/${userId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch user data');
                }
                const userData = await response.json();
                if (userData.wallet_address) {
                    await tonConnectUI.connectWallet();
                }
            } catch (error) {
                console.error('Error connecting stored wallet:', error);
            }
        };
        connectStoredWallet();
    }, [userId, tonConnectUI]);

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
            // You might want to show an error message to the user here
        }
    };

    const handlePurchase = async (item) => {
        if (!userFriendlyAddress) {
            alert("Please connect your TON wallet first.");
            return;
        }

        try {
            const transaction = {
                messages: [
                    {
                        address: "UQD5lbuFFJsylbjfWRyWySDHg6TLMNPzKaLY9vLLL3crgg1l",
                        amount: (item.price * 1e9).toString(), // Convert TON to nanotons
                    }
                ]
            };

            const result = await tonConnectUI.sendTransaction(transaction);
            if (result) {
                alert(`Successfully purchased ${item.name}`);
            }
        } catch (error) {
            alert('Purchase failed. Please try again.');
        }
    };

    return (
        <div className="store">
            <h2>Store</h2>
            <TonConnectButton />
            {userFriendlyAddress}
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
        </div>
    );
}

export default Store;