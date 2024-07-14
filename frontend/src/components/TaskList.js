import React from 'react';

function TaskList({ tasks, onTaskComplete }) {
    return (
        <div className="task-list">
            <h2>Tasks</h2>
            <p>No active tasks at the moment. Play games to earn more points!</p>
        </div>
    );
}

export default TaskList;