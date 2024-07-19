import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';

const GRID_SIZE = 20;
const CELL_SIZE = 20;
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

    const generateRandomPosition = () => ({
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
    });

    const generateFood = useCallback(() => {
        let newFood;
        do {
            newFood = generateRandomPosition();
        } while (
            snake.some(segment => segment.x === newFood.x && segment.y === newFood.y) ||
            obstacles.some(obstacle => obstacle.x === newFood.x && obstacle.y === newFood.y)
        );
        setFood(newFood);
    }, [snake, obstacles]);

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
    }, [snake, food, obstacles]);

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
        if (!food && isPlaying) {
            generateFood();
        }
    }, [food, isPlaying, generateFood]);

    useEffect(() => {
        const handleKeyPress = (e) => {
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
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [isPlaying, direction]);

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

    const endGame = async () => {
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
    };

    useEffect(() => {
        if (gameOver) {
            endGame();
        }
    }, [gameOver]);

    return (
        <div className="snake-game">
            <h2>Snake Game</h2>
            <div className="game-info">
                <p>Score: {score}</p>
                <p>Tokens Earned: {earnedTokens}</p>
            </div>
            <div 
                className="game-board" 
                style={{
                    width: GRID_SIZE * CELL_SIZE, 
                    height: GRID_SIZE * CELL_SIZE,
                    position: 'relative',
                }}
            >
                {snake.map((segment, index) => (
                    <div
                        key={index}
                        className="snake-segment"
                        style={{
                            left: segment.x * CELL_SIZE,
                            top: segment.y * CELL_SIZE,
                            width: CELL_SIZE,
                            height: CELL_SIZE,
                        }}
                    />
                ))}
                {food && (
                    <div
                        className="food"
                        style={{
                            left: food.x * CELL_SIZE,
                            top: food.y * CELL_SIZE,
                            width: CELL_SIZE,
                            height: CELL_SIZE,
                        }}
                    />
                )}
                {obstacles.map((obstacle, index) => (
                    <div
                        key={`obstacle-${index}`}
                        className="obstacle"
                        style={{
                            left: obstacle.x * CELL_SIZE,
                            top: obstacle.y * CELL_SIZE,
                            width: CELL_SIZE,
                            height: CELL_SIZE,
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
        </div>
    );
};

export default Snake;