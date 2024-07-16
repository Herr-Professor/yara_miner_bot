import { API_BASE_URL } from '../config';
const axios = require('axios');

const headers = {
  'Content-Type': 'application/json',
};

// New function to validate Telegram WebApp data
export const validateTelegramWebAppData = async (initData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/validate-telegram-data`, { initData }, { headers });
    return response.data;
  } catch (error) {
    console.error('Error validating Telegram WebApp data:', error);
    throw error;
  }
};

// Function to get user data including Telegram username
export const getUserData = async (initData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/user-data`, { initData }, { headers });
    return response.data;
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
};

// Modified function to get user data
export const getUser = async (initData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/user`, { initData }, { headers });
    return response.data;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

// Modified function to claim tokens
export const claimTokens = async (initData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/claim`, { initData }, { headers });
    return response.data;
  } catch (error) {
    console.error('Error claiming tokens:', error);
    throw error;
  }
};

// Modified function to add referral
export const addReferral = async (initData, referrerCode) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/referral`, {
      initData,
      referrer_code: referrerCode
    }, { headers });
    return response.data;
  } catch (error) {
    console.error('Error adding referral:', error);
    throw error;
  }
};

// Modified function to update balance
export const updateBalance = async (initData, points) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/update_balance`, {
      initData,
      points
    }, { headers });
    return response.data;
  } catch (error) {
    console.error('Error updating balance:', error);
    throw error;
  }
};

// The following functions don't need user-specific data, so they remain unchanged
export const getLeaderboard = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/leaderboard`);
    return response.data;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    throw error;
  }
};

// Modified function to get user referrals
export const getUserReferrals = async (initData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/user-referrals`, { initData }, { headers });
    return response.data;
  } catch (error) {
    console.error('Error fetching user referrals:', error);
    throw error;
  }
};

// Modified function to claim referral rewards
export const claimReferralRewards = async (initData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/claim-referrals`, { initData }, { headers });
    return response.data;
  } catch (error) {
    console.error('Error claiming referral rewards:', error);
    throw error;
  }
};

// Modified function to update last referral claim time
export const updateLastReferralClaimTime = async (initData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/update-referral-claim-time`, { initData }, { headers });
    return response.data;
  } catch (error) {
    console.error('Error updating referral claim time:', error);
    throw error;
  }
};

// Modified function to get balance
export const getBalance = async (initData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/balance`, { initData }, { headers });
    return response.data;
  } catch (error) {
    console.error('Error fetching balance:', error);
    throw error;
  }
};

// Modified function to update balance directly
export const updateBalanceDirectly = async (initData, newBalance) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/update-balance-direct`, {
      initData,
      balance: newBalance
    }, { headers });
    return response.data;
  } catch (error) {
    console.error('Error updating balance:', error);
    throw error;
  }
};

// Modified function to get cipher status
export const getCipherStatus = async (initData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/cipher-status`, { initData }, { headers });
    return response.data;
  } catch (error) {
    console.error('Error fetching cipher status:', error);
    throw error;
  }
};

// Modified function to update cipher status
export const updateCipherStatus = async (initData, solved, nextTime) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/update-cipher-status`, {
      initData,
      solved,
      next_time: nextTime
    }, { headers });
    return response.data;
  } catch (error) {
    console.error('Error updating cipher status:', error);
    throw error;
  }
};