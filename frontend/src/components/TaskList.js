import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

function TaskList({ userId, onBalanceUpdate }) {
    const [tasks, setTasks] = useState([]);

    useEffect(() => {
        fetchTasks();
        const intervalId = setInterval(fetchTasks, 120000); // Refresh every minute
        return () => clearInterval(intervalId);
    }, [fetchTasks])

    const fetchTasks = async () => {
        try {
            const response = await fetch(`https://herrprofessor.pythonanywhere.com/api/tasks?user_id=${userId}`);
            if (!response.ok) throw new Error('Failed to fetch tasks');
            const data = await response.json();
            setTasks(data);
        } catch (error) {
            console.error('Error fetching tasks:', error);
            toast.error('Failed to load tasks. Please try again later.');
        }
    };

    const handleCompleteTask = async (taskId, taskType, taskUrl) => {
        if (taskType === 'referral') {
            await verifyTask(taskId);
        } else if (taskType === 'telegram' || taskType === 'twitter') {
            window.open(taskUrl, '_blank');
            await verifyTask(taskId);
        } else if (taskType === 'achievement') {
            // Handle achievement tasks
            await verifyTask(taskId);
        } else {
            console.error('Unknown task type:', taskType);
        }
        await fetchTasks();
    };

    const verifyTask = async (taskId) => {
        try {
            const response = await fetch('https://herrprofessor.pythonanywhere.com/api/verify_task', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, task_id: taskId }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to verify task');
            }
            await fetchTasks();
            toast.success('Task completed! You can claim your reward in 1 minute.');
        } catch (error) {
            console.error('Error verifying task:', error);
            toast.error(error.message || 'Failed to verify task. Please try again.');
        }
    };

    const handleClaimTask = async (taskId) => {
        try {
            const response = await fetch('https://herrprofessor.pythonanywhere.com/api/claim_task', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, task_id: taskId }),
            });
            if (!response.ok) throw new Error('Failed to claim task');
            const data = await response.json();
            onBalanceUpdate(data.new_balance);
            await fetchTasks();
            toast.success('Reward claimed successfully!');
        } catch (error) {
            console.error('Error claiming task:', error);
            toast.error('Failed to claim reward. Please try again.');
        }
        await fetchTasks();
    };

    return (
        <div className="task-list">
            <h2>Tasks</h2>
            <button onClick={fetchTasks}>Refresh Tasks</button>
            {tasks.length === 0 ? (
                <p>No active tasks at the moment. Check back later!</p>
            ) : (
                <ul>
                    {tasks.map((task) => (
                        <li key={task.id}>
                            <span>{task.description}</span>
                            <span>Reward: {task.reward}</span>
                            {!task.completed ? (
                                <button onClick={() => handleCompleteTask(task.id, task.type, task.url)}>
                                    {task.type === 'referral' ? 'Check Referrals' : 'Complete'}
                                </button>
                            ) : !task.claimed ? (
                                task.cooldown > 0 ? (
                                    <span>Cooldown: {Math.ceil(task.cooldown / 60)} minutes</span>
                                ) : (
                                    <button onClick={() => handleClaimTask(task.id)}>Claim</button>
                                )
                            ) : null}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default TaskList;