import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import './TwoZeroFourEight.css';

const TwoZeroFourEight = ({ userId, onBalanceUpdate }) => {
    const [board, setBoard] = useState([]);
    const [score, setScore] = useState(0);
    const [highestTile, setHighestTile] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const initializeBoard = useCallback(() => {
        const newBoard = Array(4).fill().map(() => Array(4).fill(0));
        addNewTile(newBoard);
        addNewTile(newBoard);
        setBoard(newBoard);
        setScore(0);
        setHighestTile(0);
        setGameOver(false);
    }, []);

    useEffect(() => {
        initializeBoard();
    }, [initializeBoard]);

    const addNewTile = (board) => {
        const emptyCells = [];
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (board[i][j] === 0) {
                    emptyCells.push([i, j]);
                }
            }
        }
        if (emptyCells.length > 0) {
            const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            board[row][col] = Math.random() < 0.9 ? 2 : 4;
        }
    };

    const move = useCallback((direction) => {
        if (gameOver) return;

        let newBoard = JSON.parse(JSON.stringify(board));
        let moved = false;
        let newScore = score;

        if (direction === 'left' || direction === 'right') {
            for (let i = 0; i < 4; i++) {
                const row = newBoard[i];
                const [mergedRow, rowScore] = mergeRow(row, direction === 'left');
                newBoard[i] = mergedRow;
                newScore += rowScore;
                if (JSON.stringify(row) !== JSON.stringify(mergedRow)) {
                    moved = true;
                }
            }
        } else {
            for (let j = 0; j < 4; j++) {
                const column = newBoard.map(row => row[j]);
                const [mergedColumn, columnScore] = mergeRow(column, direction === 'up');
                for (let i = 0; i < 4; i++) {
                    newBoard[i][j] = mergedColumn[i];
                }
                newScore += columnScore;
                if (JSON.stringify(column) !== JSON.stringify(mergedColumn)) {
                    moved = true;
                }
            }
        }

        if (moved) {
            addNewTile(newBoard);
            setBoard(newBoard);
            setScore(newScore);
            updateHighestTile(newBoard);
            checkGameOver(newBoard);
        }
    }, [board, gameOver, score]);

    const mergeRow = (row, reverse) => {
        let newRow = row.filter(cell => cell !== 0);
        if (reverse) newRow.reverse();
        let rowScore = 0;

        for (let i = 0; i < newRow.length - 1; i++) {
            if (newRow[i] === newRow[i + 1]) {
                newRow[i] *= 2;
                rowScore += newRow[i];
                newRow.splice(i + 1, 1);
            }
        }

        while (newRow.length < 4) {
            newRow.push(0);
        }

        if (reverse) newRow.reverse();
        return [newRow, rowScore];
    };

    const updateHighestTile = (board) => {
        const highest = Math.max(...board.flat());
        if (highest > highestTile) {
            setHighestTile(highest);
        }
    };

    const checkGameOver = (board) => {
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (board[i][j] === 0) return;
                if (i < 3 && board[i][j] === board[i + 1][j]) return;
                if (j < 3 && board[i][j] === board[i][j + 1]) return;
            }
        }
        setGameOver(true);
        handleGameOver();
    };

    const updateBalance = async (amount) => {
        try {
            const response = await fetch('https://herrprofessor.pythonanywhere.com/api/update_balance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, amount: amount }),
            });
            if (!response.ok) {
                throw new Error('Failed to update balance');
            }
            const data = await response.json();
            onBalanceUpdate(data.new_balance);
            return data.new_balance;
        } catch (error) {
            console.error('Failed to update balance:', error);
            toast.error('Failed to update balance. Please try again.');
            throw error;
        }
    };

    const handleGameOver = async () => {
        setIsLoading(true);
        const reward = calculateReward();
        try {
            const newBalance = await updateBalance(reward);
            toast.success(`Game Over! You earned ${reward} YARA! New balance: ${newBalance} YARA`);
        } catch (error) {
            // Error handling is done in updateBalance function
        } finally {
            setIsLoading(false);
        }
    };

    const calculateReward = () => {
        const rewardMap = {
            2048: 1000,
            1024: 500,
            512: 250,
            256: 100,
            128: 50,
            64: 25,
            32: 10,
            16: 5,
            8: 2,
            4: 1
        };
        for (const [tile, reward] of Object.entries(rewardMap)) {
            if (highestTile >= parseInt(tile)) {
                return reward;
            }
        }
        return 0;
    };

    const handleKeyDown = useCallback((e) => {
        if (gameOver) return;
        switch (e.key) {
            case 'ArrowLeft': move('left'); break;
            case 'ArrowRight': move('right'); break;
            case 'ArrowUp': move('up'); break;
            case 'ArrowDown': move('down'); break;
            default: break;
        }
    }, [gameOver, move]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

    return (
        <div className="two-zero-four-eight-game" tabIndex="0" onKeyDown={handleKeyDown}>
            <h2>2048 Game</h2>
            <p>Score: {score}</p>
            <p>Highest Tile: {highestTile}</p>
            <div className="game-board">
                {board.map((row, i) => (
                    <div key={i} className="row">
                        {row.map((cell, j) => (
                            <div key={`${i}-${j}`} className={`cell tile-${cell}`}>
                                {cell !== 0 && cell}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
            {gameOver && <p>Game Over! Highest tile: {highestTile}</p>}
            <button onClick={initializeBoard} disabled={isLoading}>
                {isLoading ? 'Loading...' : 'New Game'}
            </button>
            <div className="controls">
                <button onClick={() => move('up')}>Up</button>
                <button onClick={() => move('left')}>Left</button>
                <button onClick={() => move('right')}>Right</button>
                <button onClick={() => move('down')}>Down</button>
            </div>
        </div>
    );
};

export default TwoZeroFourEight;