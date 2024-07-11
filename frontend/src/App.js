import React, { useState, useEffect } from 'react';
import { useTransition, animated } from 'react-spring';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header from './components/Header';
import Balance from './components/Balance';
import ClaimButton from './components/ClaimButton';
import TaskList from './components/TaskList';
import Games from './components/Games';
import Leaderboard from './components/Leaderboard';
import ReferralSystem from './components/ReferralSystem';
import './App.css';

function App() {
    const [balance, setBalance] = useState(0);
    const [nextClaimTime, setNextClaimTime] = useState(new Date().getTime() + 8 * 60 * 60 * 1000);
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
        const interval = setInterval(() => {
            setMiningProgress(prev => {
                if (prev < 3500) {
                    return prev + 1;
                }
                clearInterval(interval);
                return 3500;
            });
        }, (8 * 60 * 60 * 1000) / 3500); // 8 hours divided by 3500 steps

        return () => clearInterval(interval);
    }, []);

    const handleClaim = () => {
        try {
            setBalance(prevBalance => prevBalance + 100);
            setNextClaimTime(new Date().getTime() + 8 * 60 * 60 * 1000);
            setMiningProgress(0);
            toast.success('Tokens claimed successfully!');
        } catch (error) {
            toast.error('Failed to claim tokens. Please try again.');
        }
    };

    const handleTaskComplete = (taskId) => {
        try {
            setTasks(prevTasks => 
                prevTasks.map(task => 
                    task.id === taskId 
                        ? { ...task, completed: true } 
                        : task
                )
            );
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                setBalance(prevBalance => prevBalance + task.reward);
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

    return (
        <div className="App">
            <Header />
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
                    {item === 'leaderboard' && <Leaderboard />}
                    {item === 'referral' && <ReferralSystem balance={balance} setBalance={setBalance} />}
                </animated.div>
            ))}
            <ToastContainer position="bottom-right" />
        </div>
    );
}

export default App;