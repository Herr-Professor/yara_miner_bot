import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import './Snake.css';

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 1, y: 0 };
const INITIAL_SPEED = 200;
const SPEED_INCREASE = 10;
const SPEED_INCREASE_INTERVAL = 5;
const OBSTACLE_INTERVAL = 10;

const Snake = ({ userId, onBalanceUpdate }) => {
    const [snake, setSnake] = useState(INITIAL_SNAKE);
    const [direction, setDirection] = useState(INITIAL_DIRECTION);
    const [food, setFood] = useState(null);
    const [obstacles, setObstacles] = useState([]);
    const [gameOver, setGameOver] = useState(false);
    const [score, setScore] = useState(0);
    const [speed, setSpeed] = useState(INITIAL_SPEED);
    const [isPlaying, setIsPlaying] = useState(false);
    const [earnedTokens, setEarnedTokens] = useState(0);
    const [cellSize, setCellSize] = useState(20);
    const gameboardRef = useRef(null);

    const generateRandomPosition = useCallback(() => ({
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
    }), []);

    const generateFood = useCallback(() => {
        let newFood;
        do {
            newFood = generateRandomPosition();
        } while (
            snake.some(segment => segment.x === newFood.x && segment.y === newFood.y) ||
            obstacles.some(obstacle => obstacle.x === newFood.x && obstacle.y === newFood.y)
        );
        setFood(newFood);
    }, [snake, obstacles, generateRandomPosition]);

    const generateObstacle = useCallback(() => {
        let newObstacle;
        do {
            newObstacle = generateRandomPosition();
        } while (
            snake.some(segment => segment.x === newObstacle.x && segment.y === newObstacle.y) ||
            (food && food.x === newObstacle.x && food.y === newObstacle.y) ||
            obstacles.some(obstacle => obstacle.x === newObstacle.x && obstacle.y === newObstacle.y)
        );
        setObstacles(prevObstacles => [...prevObstacles, newObstacle]);
    }, [snake, food, obstacles, generateRandomPosition]);

    const moveSnake = useCallback(() => {
        if (!isPlaying || gameOver) return;

        const newHead = {
            x: (snake[0].x + direction.x + GRID_SIZE) % GRID_SIZE,
            y: (snake[0].y + direction.y + GRID_SIZE) % GRID_SIZE,
        };

        if (
            snake.some(segment => segment.x === newHead.x && segment.y === newHead.y) ||
            obstacles.some(obstacle => obstacle.x === newHead.x && obstacle.y === newHead.y)
        ) {
            setGameOver(true);
            return;
        }

        const newSnake = [newHead, ...snake];

        if (food && newHead.x === food.x && newHead.y === food.y) {
            setScore(prevScore => prevScore + 1);
            generateFood();
            if (score > 0 && score % SPEED_INCREASE_INTERVAL === 0) {
                setSpeed(prevSpeed => Math.max(prevSpeed - SPEED_INCREASE, 50));
            }
            if (score > 0 && score % OBSTACLE_INTERVAL === 0) {
                generateObstacle();
            }
            updateEarnedTokens(newSnake.length);
        } else {
            newSnake.pop();
        }

        setSnake(newSnake);
    }, [isPlaying, gameOver, snake, direction, food, obstacles, score, generateFood, generateObstacle]);

    useEffect(() => {
        const handleResize = () => {
            if (gameboardRef.current) {
                const smallerDimension = Math.min(window.innerWidth, window.innerHeight);
                const newCellSize = Math.floor((smallerDimension * 0.9) / GRID_SIZE);
                setCellSize(newCellSize);
                
                // Adjust speed based on screen size
                const speedAdjustment = Math.max(1, Math.floor(newCellSize / 20));
                setSpeed(prevSpeed => Math.min(prevSpeed * speedAdjustment, INITIAL_SPEED));
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!food && isPlaying) {
            generateFood();
        }
    }, [food, isPlaying, generateFood]);

    const handleKeyPress = useCallback((e) => {
        if (!isPlaying) return;
        switch (e.key) {
            case 'ArrowUp':
                if (direction.y === 0) setDirection({ x: 0, y: -1 });
                break;
            case 'ArrowDown':
                if (direction.y === 0) setDirection({ x: 0, y: 1 });
                break;
            case 'ArrowLeft':
                if (direction.x === 0) setDirection({ x: -1, y: 0 });
                break;
            case 'ArrowRight':
                if (direction.x === 0) setDirection({ x: 1, y: 0 });
                break;
            default:
                break;
        }
    }, [isPlaying, direction]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [handleKeyPress]);

    useEffect(() => {
        if (isPlaying && !gameOver) {
            const gameLoop = setInterval(moveSnake, speed);
            return () => clearInterval(gameLoop);
        }
    }, [isPlaying, gameOver, speed, moveSnake]);

    const startGame = () => {
        setSnake(INITIAL_SNAKE);
        setDirection(INITIAL_DIRECTION);
        setFood(null);
        setObstacles([]);
        setGameOver(false);
        setScore(0);
        setSpeed(INITIAL_SPEED);
        setIsPlaying(true);
        setEarnedTokens(0);
    };

    const updateEarnedTokens = (snakeLength) => {
        const newTokens = Math.floor(snakeLength * (snakeLength / 10));
        setEarnedTokens(newTokens);
    };

    const endGame = useCallback(async () => {
        setIsPlaying(false);
        setGameOver(true);

        try {
            const response = await fetch('https://herrprofessor.pythonanywhere.com/api/update_balance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, amount: earnedTokens }),
            });
            if (!response.ok) {
                throw new Error('Failed to update balance');
            }
            const data = await response.json();
            onBalanceUpdate(data.new_balance);
            toast.success(`Game Over! You earned ${earnedTokens} YARA tokens!`);
        } catch (error) {
            console.error('Failed to update balance:', error);
            toast.error('Failed to update balance. Please try again later.');
        }
    }, [userId, earnedTokens, onBalanceUpdate]);

    useEffect(() => {
        if (gameOver) {
            endGame();
        }
    }, [gameOver, endGame]);

    const handleTouchStart = useCallback((e) => {
        if (!isPlaying) return;
        const touch = e.touches[0];
        const startX = touch.clientX;
        const startY = touch.clientY;

        const handleTouchEnd = (e) => {
            const touch = e.changedTouches[0];
            const endX = touch.clientX;
            const endY = touch.clientY;

            const diffX = endX - startX;
            const diffY = endY - startY;

            if (Math.abs(diffX) > Math.abs(diffY)) {
                // Horizontal swipe
                if (diffX > 0 && direction.x === 0) {
                    setDirection({ x: 1, y: 0 });
                } else if (diffX < 0 && direction.x === 0) {
                    setDirection({ x: -1, y: 0 });
                }
            } else {
                // Vertical swipe
                if (diffY > 0 && direction.y === 0) {
                    setDirection({ x: 0, y: 1 });
                } else if (diffY < 0 && direction.y === 0) {
                    setDirection({ x: 0, y: -1 });
                }
            }

            document.removeEventListener('touchend', handleTouchEnd);
        };

        document.addEventListener('touchend', handleTouchEnd);
    }, [isPlaying, direction]);

    useEffect(() => {
        const gameboard = gameboardRef.current;
        if (gameboard) {
            gameboard.addEventListener('touchstart', handleTouchStart);
            return () => gameboard.removeEventListener('touchstart', handleTouchStart);
        }
    }, [handleTouchStart]);

    const handleDirectionButton = (newDirection) => {
        if (!isPlaying) return;
        switch (newDirection) {
            case 'up':
                if (direction.y === 0) setDirection({ x: 0, y: -1 });
                break;
            case 'down':
                if (direction.y === 0) setDirection({ x: 0, y: 1 });
                break;
            case 'left':
                if (direction.x === 0) setDirection({ x: -1, y: 0 });
                break;
            case 'right':
                if (direction.x === 0) setDirection({ x: 1, y: 0 });
                break;
            default:
                break;
        }
    };

    return (
        <div className="snake-game">
            <h2>Snake Game</h2>
            <div className="game-info">
                <p>Score: {score}</p>
                <p>Tokens Earned: {earnedTokens}</p>
            </div>
            <div 
                ref={gameboardRef}
                className="game-board" 
                style={{
                    width: GRID_SIZE * cellSize, 
                    height: GRID_SIZE * cellSize,
                }}
            >
                {snake.map((segment, index) => (
                    <div
                        key={index}
                        className="snake-segment"
                        style={{
                            left: segment.x * cellSize,
                            top: segment.y * cellSize,
                            width: cellSize,
                            height: cellSize,
                        }}
                    />
                ))}
                {food && (
                    <div
                        className="food"
                        style={{
                            left: food.x * cellSize,
                            top: food.y * cellSize,
                            width: cellSize,
                            height: cellSize,
                        }}
                    />
                )}
                {obstacles.map((obstacle, index) => (
                    <div
                        key={`obstacle-${index}`}
                        className="obstacle"
                        style={{
                            left: obstacle.x * cellSize,
                            top: obstacle.y * cellSize,
                            width: cellSize,
                            height: cellSize,
                        }}
                    />
                ))}
            </div>
            {!isPlaying && (
                <button onClick={startGame} className="start-button">
                    {gameOver ? 'Play Again' : 'Start Game'}
                </button>
            )}
            {gameOver && <p className="game-over">Game Over!</p>}
            <div className="control-buttons">
                <button onClick={() => handleDirectionButton('up')}>↑</button>
                <button onClick={() => handleDirectionButton('left')}>←</button>
                <button onClick={() => handleDirectionButton('right')}>→</button>
                <button onClick={() => handleDirectionButton('down')}>↓</button>
            </div>
        </div>
    );
};

export default Snake;