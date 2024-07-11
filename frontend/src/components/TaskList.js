import React from 'react';

function TaskList({ tasks, onTaskComplete }) {
    return (
        <div className="task-list">
            <h2>Tasks</h2>
            <ul>
                {tasks.map(task => (
                    <li key={task.id} className="task-item">
                        <div className="task-info">
                            <p>{task.description}</p>
                            <p>Reward: {task.reward} YARA</p>
                        </div>
                        <button 
                            onClick={() => onTaskComplete(task.id)} 
                            disabled={task.completed}
                            className="task-complete-button"
                        >
                            {task.completed ? 'Completed' : 'Complete'}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default TaskList;