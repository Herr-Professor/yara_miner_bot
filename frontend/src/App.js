import React, { useState, useEffect } from 'react';
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
import './App.css';
import { getUser, claimTokens, updateBalance, getLeaderboard } from './services/api';

function App() {
    const [user, setUser] = useState(null);
    const [username, setUsername] = useState('');
    const [balance, setBalance] = useState(0);
    const [nextClaimTime, setNextClaimTime] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [activeTab, setActiveTab] = useState('main');
    const [miningProgress, setMiningProgress] = useState(0);
    const [theme, setTheme] = useState({});

    const transitions = useTransition(activeTab, {
        from: { opacity: 0, transform: 'translateY(50px)' },
        enter: { opacity: 1, transform: 'translateY(0px)' },
        leave: { opacity: 0, transform: 'translateY(50px)' },
    });

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            const initData = window.Telegram.WebApp.initData;
            const userData = await getUserData(initData);
            setUser(userData);
            setBalance(userData.balance);
            setNextClaimTime(userData.last_claim ? new Date(userData.last_claim).getTime() + 8 * 60 * 60 * 1000 : new Date().getTime());
        } catch (error) {
            console.error('Failed to fetch user data:', error);
        }
    };

    const handleClaim = async () => {
        try {
            const initData = window.Telegram.WebApp.initData;
            const response = await claimTokens(initData);
            setBalance(response.new_balance);
            setNextClaimTime(new Date().getTime() + 8 * 60 * 60 * 1000);
            setMiningProgress(0);
            toast.success('Tokens claimed successfully!');
        } catch (error) {
            toast.error('Failed to claim tokens. Please try again.');
        }
    };

    const handleViewportChange = ({ isStateStable }) => {
        // Adjust UI based on viewport changes if needed
        if (isStateStable) {
            // Viewport has finished changing
        }
    };

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

    const handleClaim = async () => {
        try {
            const response = await claimTokens(user.user_id);
            setBalance(response.new_balance);
            setNextClaimTime(new Date().getTime() + 8 * 60 * 60 * 1000);
            setMiningProgress(0);
            toast.success('Tokens claimed successfully!');
        } catch (error) {
            toast.error('Failed to claim tokens. Please try again.');
        }
    };

    const tabs = [
        { id: 'main', icon: 'fa-home', label: 'Main' },
        { id: 'games', icon: 'fa-gamepad', label: 'Games' },
        { id: 'leaderboard', icon: 'fa-trophy', label: 'Leaderboard' },
        { id: 'referral', icon: 'fa-user-plus', label: 'Referral' },
    ];

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div className="App" style={{
            backgroundColor: theme.bg_color,
            color: theme.text_color
        }}>
            <nav className="tab-navigation">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            setActiveTab(tab.id);
                            if (tab.id !== 'main') {
                                window.Telegram.WebApp.BackButton.show();
                            } else {
                                window.Telegram.WebApp.BackButton.hide();
                            }
                        }}
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
                    {item === 'leaderboard' && <Leaderboard getLeaderboard={getLeaderboard} />}
                    {item === 'referral' && <ReferralSystem userId={user.user_id} balance={balance} setBalance={setBalance} />}
                </animated.div>
            ))}
            <ToastContainer position="bottom-right" />
        </div>
    );
}

export default App;