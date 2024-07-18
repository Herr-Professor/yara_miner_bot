import React, { useState, useEffect, useContext } from 'react';
import { useTransition, animated } from 'react-spring';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Balance from './components/Balance';
import ClaimButton from './components/ClaimButton';
import TaskList from './components/TaskList';
import Games from './components/Games';
import Username from './components/Username';
import Leaderboard from './components/Leaderboard';
import ReferralSystem from './components/ReferralSystem';
import { TelegramContext } from './TelegramContext';
import './App.css';

function App() {
    const { telegramUser } = useContext(TelegramContext);

    // Use telegramUser.username instead of a separate state
    const username = telegramUser ? telegramUser.username : 'Unknown';
    const [user, setUser] = useState({ user_id: telegramUser ? telegramUser.id : '123', balance: 1000 });
    const [balance, setBalance] = useState(1000);
    const [nextClaimTime, setNextClaimTime] = useState(new Date().getTime() + 8 * 60 * 60 * 1000);
    const [activeTab, setActiveTab] = useState('main');
    const [miningProgress, setMiningProgress] = useState(0);
    
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
                if (timeLeft > 0) {
                    setMiningProgress(Math.round(3500 - (timeLeft / (8 * 60 * 60 * 1000)) * 3500));
                } else {
                    setMiningProgress(3500);
                    clearInterval(interval);
                }
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [nextClaimTime]);

    const handleClaim = () => {
        setBalance(prevBalance => prevBalance + 100);
        setNextClaimTime(new Date().getTime() + 8 * 60 * 60 * 1000);
        setMiningProgress(0);
        toast.success('Tokens claimed successfully!');
    };

    /*
    const fetchUserData = async () => {
        try {
            const userData = await getUserData(telegramUser.id);
            setUser(userData);
            setBalance(userData.balance);
            setNextClaimTime(userData.last_claim ? new Date(userData.last_claim).getTime() + 8 * 60 * 60 * 1000 : new Date().getTime());
        } catch (error) {
            console.error('Failed to fetch user data:', error);
        }
    };
    */

    useEffect(() => {
        const tg = window.Telegram.WebApp;
        tg.BackButton.show();
        tg.BackButton.onClick(() => {
            // Handle back button click
        });
        return () => {
            tg.BackButton.hide();
        };
    }, []);

    const tabs = [
        { id: 'main', icon: 'fa-home', label: 'Main' },
        { id: 'games', icon: 'fa-gamepad', label: 'Games' },
        { id: 'leaderboard', icon: 'fa-trophy', label: 'Leaderboard' },
        { id: 'referral', icon: 'fa-user-plus', label: 'Referral' },
    ];

    return (
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
                    <>
                        <Username username={username} />
                        <div className="balance-claim-container">
                            <Balance balance={balance} />
                            <ClaimButton 
                                onClaim={handleClaim} 
                                nextClaimTime={nextClaimTime}
                                miningProgress={miningProgress}
                            />
                        </div>
                        <TaskList />
                    </>
                    )}
                    {item === 'games' && <Games userId={user.user_id} onBalanceUpdate={setBalance} />}
                    {item === 'leaderboard' && <Leaderboard />}
                    {item === 'referral' && <ReferralSystem userId={user.user_id} balance={balance} setBalance={setBalance} />}
                </animated.div>
            ))}
            <ToastContainer position="bottom-right" />
        </div>
    );
}

export default App;
