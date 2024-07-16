import { API_BASE_URL } from '../config';
const axios = require('axios');

const headers = {
  'Content-Type': 'application/json',
};

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || '7031484757:AAFxCtzFo5QiXzbO9_-tA-2wLGEasvtqxug';
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

// Add new function to handle Telegram messages
export const handleTelegramMessage = async (message) => {
  const chatId = message.chat.id;
  const username = message.from.username;

  try {
    // Store the username in the database
    await createUser(username);

    // Send a response back to the user
    await axios.post(`${TELEGRAM_API}/sendMessage`, {
      chat_id: chatId,
      text: `Hello, ${username}! Welcome to our bot.`
    });

    return { success: true, message: 'User created and welcomed' };
  } catch (error) {
    console.error('Error handling Telegram message:', error);
    throw error;
  }
};

// Add a new function to check if a user exists
export const checkUserExists = async (username) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/user/check/${username}`);
    return response.data;
  } catch (error) {
    console.error('Error checking if user exists:', error);
    throw error;
  }
};

// Modify the createUser function to handle Telegram usernames
export const createUser = async (username) => {
  try {
    // First, check if the user already exists
    const userExists = await checkUserExists(username);
    
    if (userExists.exists) {
      return { success: true, message: 'User already exists', user: userExists.user };
    }

    // If the user doesn't exist, create a new one
    const response = await axios.post(`${API_BASE_URL}/user`, {
      username,
      platform: 'telegram'
    }, { headers });

    return response.data;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const login = async (secretCode) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/login`, {
      secret_code: secretCode
    }, { headers });

    return response.data;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

export const getUser = async (userId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

export const claimTokens = async (userId) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/claim`, {
      user_id: userId
    }, { headers });

    return response.data;
  } catch (error) {
    console.error('Error claiming tokens:', error);
    throw error;
  }
};

export const addReferral = async (referrerCode, referredId) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/referral`, {
      referrer_code: referrerCode,
      referred_id: referredId
    }, { headers });

    return response.data;
  } catch (error) {
    console.error('Error adding referral:', error);
    throw error;
  }
};

export const updateBalance = async (userId, points) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/update_balance`, {
      user_id: userId,
      points
    }, { headers });

    return response.data;
  } catch (error) {
    console.error('Error updating balance:', error);
    throw error;
  }
};

export const getLeaderboard = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/leaderboard`);
    return response.data;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    throw error;
  }
};

export const getUserReferrals = async (userId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/user/${userId}/referrals`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user referrals:', error);
    throw error;
  }
};

export const claimReferralRewards = async (userId) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/user/${userId}/claim-referrals`, {
      user_id: userId
    }, { headers });

    return response.data;
  } catch (error) {
    console.error('Error claiming referral rewards:', error);
    throw error;
  }
};

export const updateLastReferralClaimTime = async (userId) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/user/${userId}/update-referral-claim-time`, {
      user_id: userId
    }, { headers });

    return response.data;
  } catch (error) {
    console.error('Error updating referral claim time:', error);
    throw error;
  }
};

export const getBalance = async (userId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/user/${userId}/balance`);
    return response.data;
  } catch (error) {
    console.error('Error fetching balance:', error);
    throw error;
  }
};

export const updateBalanceDirectly = async (userId, newBalance) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/user/${userId}/balance`, {
      balance: newBalance
    }, { headers });

    return response.data;
  } catch (error) {
    console.error('Error updating balance:', error);
    throw error;
  }
};

export const getCipherStatus = async (userId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/user/${userId}/cipher-status`);
    return response.data;
  } catch (error) {
    console.error('Error fetching cipher status:', error);
    throw error;
  }
};

export const updateCipherStatus = async (userId, solved, nextTime) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/user/${userId}/update-cipher-status`, {
      solved,
      next_time: nextTime
    }, { headers });

    return response.data;
  } catch (error) {
    console.error('Error updating cipher status:', error);
    throw error;
  }
};
