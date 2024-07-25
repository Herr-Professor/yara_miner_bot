import React, { useState, useEffect, useContext } from 'react';
import { useTransition, animated } from 'react-spring';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Balance from './components/Balance';
import ClaimButton from './components/ClaimButton';
import TaskList from './components/TaskList';
import Username from './components/Username';
import Leaderboard from './components/Leaderboard';
import ReferralSystem from './components/ReferralSystem';
import Cipher from './components/Cipher';
import Store from './components/Store';
import { TelegramContext } from './context/TelegramContext';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import './App.css';

function App() {
    const { telegramUser } = useContext(TelegramContext);
    const [user, setUser] = useState(null);
    const [balance, setBalance] = useState(0);
    const [nextClaimTime, setNextClaimTime] = useState(null);
    const [activeTab, setActiveTab] = useState('main');
    const [miningProgress, setMiningProgress] = useState(0);
    const [balanceMultiplier, setBalanceMultiplier] = useState(1);
    const [cipherStatus, setCipherStatus] = useState({ solved: false, nextAvailableTime: null });
    const [timeLeft, setTimeLeft] = useState('');
    
    const tg = window.Telegram.WebApp;
    const theme = {
        bg_color: tg.bgColor,
        text_color: tg.textColor,
        hint_color: tg.hintColor,
        link_color: tg.linkColor,
        button_color: tg.buttonColor,
        button_text_color: tg.buttonTextColor,
    };

    const transitions = useTransition(activeTab, {
        from: { opacity: 0, transform: 'translateY(50px)' },
        enter: { opacity: 1, transform: 'translateY(0px)' },
        leave: { opacity: 0, transform: 'translateY(50px)' },
    });

    useEffect(() => {
        if (nextClaimTime) {
            const interval = setInterval(() => {
                const now = new Date().getTime();
                const timeLeft = nextClaimTime - now;
                const baseClaimAmount = 3500;
                const multipliedClaimAmount = baseClaimAmount * balanceMultiplier;
                
                if (timeLeft > 0) {
                    setMiningProgress(Math.round(multipliedClaimAmount - (timeLeft / (8 * 60 * 60 * 1000)) * multipliedClaimAmount));
                } else {
                    setMiningProgress(multipliedClaimAmount);
                    clearInterval(interval);
                }
            }, 1000);
    
            return () => clearInterval(interval);
        }
    }, [nextClaimTime, balanceMultiplier]);

    useEffect(() => {
        let timer;
        if (cipherStatus.nextAvailableTime) {
            timer = setInterval(() => {
                const now = new Date().getTime();
                const distance = new Date(cipherStatus.nextAvailableTime).getTime() - now;
                
                if (distance < 0) {
                    setTimeLeft('Available now!');
                    clearInterval(timer);
                } else {
                    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                    setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
                }
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [cipherStatus.nextAvailableTime]);

    const handleClaim = async () => {
        if (!user) return;
    
        try {
            const response = await fetch('https://herrprofessor.pythonanywhere.com/api/claim', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ user_id: user.user_id }),
            });
            const data = await response.json();
            if (data.success) {
                setBalance(data.new_balance);
                setNextClaimTime(new Date().getTime() + 8 * 60 * 60 * 1000);
                setMiningProgress(0);
                return { success: true, claimedAmount: data.claimed_amount };
            } else {
                throw new Error(data.error || 'Failed to claim tokens');
            }
        } catch (error) {
            console.error('Failed to claim tokens:', error);
            throw error;
        }
    };

    const fetchCipherStatus = async () => {
        if (!user) return;
        try {
            const response = await fetch(`https://herrprofessor.pythonanywhere.com/api/user/${user.user_id}`);
            if (!response.ok) {
                throw new Error('Failed to fetch cipher status');
            }
            const userData = await response.json();
            setCipherStatus({
                solved: userData.cipher_solved,
                nextAvailableTime: userData.next_cipher_time
            });
        } catch (error) {
            console.error('Failed to fetch cipher status:', error);
            toast.error('Failed to fetch cipher status. Please try again later.');
        }
    };

    const fetchUserData = async () => {
        if (!telegramUser) {
            console.log("No telegram user data available");
            return;
        }
    
        console.log("Attempting to fetch user data for:", telegramUser.id);
        console.log("Telegram WebApp initData:", window.Telegram.WebApp.initData);
        console.log("Telegram WebApp initDataUnsafe:", window.Telegram.WebApp.initDataUnsafe);
    
        const referralCode = window.Telegram.WebApp.initDataUnsafe.start_param || null;
        console.log("Referral code from start_param:", referralCode);
    
        try {
            const response = await fetch('https://herrprofessor.pythonanywhere.com/api/user/check_and_create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: telegramUser.id.toString(),
                    username: telegramUser.username || `User${telegramUser.id}`,
                    referral_code: referralCode,
                    start_param: window.Telegram.WebApp.initDataUnsafe.start_param
                }),
            });
    
            console.log("Response status:", response.status);
    
            if (!response.ok) {
                const errorText = await response.text();
                console.error("Error response:", errorText);
                throw new Error(`Failed to fetch user data: ${response.status} ${errorText}`);
            }
    
            const userData = await response.json();
            console.log("Received user data:", userData);

            setUser(userData);
            setBalance(userData.balance);
            setBalanceMultiplier(userData.balance_multiplier || 1);
            setNextClaimTime(userData.last_claim ? new Date(userData.last_claim).getTime() + 8 * 60 * 60 * 1000 : new Date().getTime());
            setCipherStatus({
                solved: userData.cipher_solved,
                nextAvailableTime: userData.next_cipher_time
            });
        } catch (error) {
            console.error('Failed to fetch user data:', error);
            toast.error(`Failed to fetch user data: ${error.message}`);
        }
    };

    useEffect(() => {
        if (telegramUser) {
            fetchUserData();
        }
    }, [telegramUser]);

    useEffect(() => {
        const tg = window.Telegram.WebApp;
        tg.BackButton.show();
        tg.BackButton.onClick(() => {
            if (activeTab !== 'main') {
                setActiveTab('main');
            } else {
                tg.close();
            }
        });
        return () => {
            tg.BackButton.hide();
        };
    }, [activeTab]);

    const tabs = [
        { id: 'main', icon: 'fa-home', label: 'Main' },
        { id: 'cipher', icon: 'fa-lock', label: 'Cipher' },
        { id: 'leaderboard', icon: 'fa-trophy', label: 'Leaderboard' },
        { id: 'referral', icon: 'fa-user-plus', label: 'Referral' },
        { id: 'store', icon: 'fa-store', label: 'Store' },
    ];

    return (
        <TonConnectUIProvider manifestUrl="https://yara-miner-bot.vercel.app/tonconnect-manifest.json">
            <div className="App" style={{
                backgroundColor: theme.bg_color,
                color: theme.text_color
            }}>
                <nav className="tab-navigation">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                            style={{
                                backgroundColor: theme.button_color,
                                color: theme.button_text_color
                            }}
                        >
                            <i className={`fas ${tab.icon}`}></i>
                            <span className="tab-label">{tab.label}</span>
                        </button>
                    ))}
                </nav>
                {transitions((style, item) => (
                    <animated.div style={style} className="tab-content">
                        {item === 'main' && (
                            user ? (
                                <>
                                    <Username username={user.username} />
                                    <div className="balance-claim-container">
                                        <Balance balance={balance} />
                                        <ClaimButton 
                                            onClaim={handleClaim} 
                                            nextClaimTime={nextClaimTime}
                                            miningProgress={miningProgress}
                                            balanceMultiplier={balanceMultiplier}
                                        />
                                    </div>
                                    <TaskList userId={user.user_id} onBalanceUpdate={setBalance} />
                                    <div className="cipher-game">
                                        <h3>Cipher Game</h3>
                                        {cipherStatus.solved ? (
                                            <p>Next available: {timeLeft}</p>
                                        ) : (
                                            <>
                                                <p>{timeLeft}</p>
                                                <button 
                                                    onClick={() => setActiveTab('cipher')}
                                                    disabled={cipherStatus.nextAvailableTime && new Date() < new Date(cipherStatus.nextAvailableTime)}
                                                >
                                                    Play Cipher
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <p>Loading user data...</p>
                            )
                        )}
                        {item === 'cipher' && user && (
                            <Cipher 
                                userId={user.user_id} 
                                onBalanceUpdate={setBalance}
                                onGameComplete={fetchCipherStatus}
                            />
                        )}
                        {item === 'leaderboard' && <Leaderboard />}
                        {item === 'referral' && user && <ReferralSystem userId={user.user_id} balance={balance} setBalance={setBalance} />}
                        {item === 'store' && user && (
                            <Store 
                                userId={user.user_id} 
                                balance={balance} 
                                setBalance={setBalance} 
                            />
                        )}
                    </animated.div>
                ))}
                <ToastContainer position="bottom-right" />
            </div>
        </TonConnectUIProvider>
    );
}

export default App;