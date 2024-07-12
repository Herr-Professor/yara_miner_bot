import React, { useState, useEffect } from 'react';
import { useTransition, animated } from 'react-spring';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Balance from './components/Balance';
import ClaimButton from './components/ClaimButton';
import TaskList from './components/TaskList';
import Games from './components/Games';
import Leaderboard from './components/Leaderboard';
import ReferralSystem from './components/ReferralSystem';
import SignUp from './components/SignUp';
import './App.css';
import { login, getUser, claimTokens, updateGamePoints, getLeaderboard } from './services/api';

function App() {
    const [user, setUser] = useState(null);
    const [balance, setBalance] = useState(0);
    const [nextClaimTime, setNextClaimTime] = useState(null);
    const [tasks, setTasks] = useState([
        { id: 1, description: 'Claim tokens 3 times', reward: 50, completed: false },
        { id: 2, description: 'Invite 2 friends', reward: 100, completed: false },
        { id: 3, description: 'Reach 1000 tokens', reward: 200, completed: false },
    ]);
    const [activeTab, setActiveTab] = useState('main');
    const [miningProgress, setMiningProgress] = useState(0);

    const transitions = useTransition(activeTab, {
        from: { opacity: 0, transform: 'translateY(50px)' },
        enter: { opacity: 1, transform: 'translateY(0px)' },
        leave: { opacity: 0, transform: 'translateY(50px)' },
    });

    useEffect(() => {
        const storedSecretCode = localStorage.getItem('secretCode');
        if (storedSecretCode) {
            loginUser(storedSecretCode);
        }
    }, []);

    const loginUser = async (secretCode) => {
        try {
            const userData = await login(secretCode);
            setUser(userData);
            setBalance(userData.balance);
            setNextClaimTime(userData.last_claim ? new Date(userData.last_claim).getTime() + 8 * 60 * 60 * 1000 : new Date().getTime());
        } catch (error) {
            toast.error('Failed to log in. Please try again.');
        }
    };

    const handleSignUp = (userId, secretCode) => {
        localStorage.setItem('secretCode', secretCode);
        loginUser(secretCode);
    };

    useEffect(() => {
        if (nextClaimTime) {
            const interval = setInterval(() => {
                const now = new Date().getTime();
                const timeLeft = nextClaimTime - now;
                if (timeLeft > 0) {
                    setMiningProgress(3500 - (timeLeft / (8 * 60 * 60 * 1000)) * 3500);
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

    const handleTaskComplete = async (taskId) => {
        try {
            const task = tasks.find(t => t.id === taskId);
            if (task && !task.completed) {
                const newBalance = balance + task.reward;
                await updateGamePoints(user.user_id, newBalance);
                setBalance(newBalance);
                setTasks(prevTasks => 
                    prevTasks.map(t => 
                        t.id === taskId 
                            ? { ...t, completed: true } 
                            : t
                    )
                );
                toast.success(`Task completed! You earned ${task.reward} tokens.`);
            }
        } catch (error) {
            toast.error('Failed to complete task. Please try again.');
        }
    };

    const tabs = [
        { id: 'main', icon: 'fa-home', label: 'Main' },
        { id: 'games', icon: 'fa-gamepad', label: 'Games' },
        { id: 'leaderboard', icon: 'fa-trophy', label: 'Leaderboard' },
        { id: 'referral', icon: 'fa-user-plus', label: 'Referral' },
    ];

    if (!user) {
        return <SignUp onSignUp={handleSignUp} />;
    }

    return (
        <div className="App">
            <nav className="tab-navigation">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
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
                            <div className="balance-claim-container">
                                <Balance balance={balance} />
                                <ClaimButton 
                                    onClaim={handleClaim} 
                                    nextClaimTime={nextClaimTime}
                                    miningProgress={miningProgress}
                                />
                            </div>
                            <TaskList tasks={tasks} onTaskComplete={handleTaskComplete} />
                        </>
                    )}
                    {item === 'games' && <Games />}
                    {item === 'leaderboard' && <Leaderboard getLeaderboard={getLeaderboard} />}
                    {item === 'referral' && <ReferralSystem userId={user.user_id} balance={balance} setBalance={setBalance} />}
                </animated.div>
            ))}
            <ToastContainer position="bottom-right" />
        </div>
    );
}

export default App;