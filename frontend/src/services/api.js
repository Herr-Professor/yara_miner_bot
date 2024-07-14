import { API_BASE_URL } from '../config';

const headers = {
  'Content-Type': 'application/json',
};

export const createUser = async (username) => {
  try {
    const response = await fetch(`${API_BASE_URL}/user`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ username }),
    });
    return response.json();
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const login = async (secretCode) => {
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ secret_code: secretCode }),
    });
    return response.json();
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

export const getUser = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/${userId}`);
    return response.json();
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

export const claimTokens = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/claim`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ user_id: userId }),
    });
    return response.json();
  } catch (error) {
    console.error('Error claiming tokens:', error);
    throw error;
  }
};

export const addReferral = async (referrerCode, referredId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/referral`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ referrer_code: referrerCode, referred_id: referredId }),
    });
    return response.json();
  } catch (error) {
    console.error('Error adding referral:', error);
    throw error;
  }
};

export const updateBalance = async (userId, points) => {
  try {
    const response = await fetch(`${API_BASE_URL}/update_balance`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ user_id: userId, points }),
    });
    if (!response.ok) {
      throw new Error('Failed to update balance');
    }
    return response.json();
  } catch (error) {
    console.error('Error updating balance:', error);
    throw error;
  }
};

export const getLeaderboard = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/leaderboard`);
    return response.json();
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    throw error;
  }
};

export const getUserReferrals = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/${userId}/referrals`);
    return response.json();
  } catch (error) {
    console.error('Error fetching user referrals:', error);
    throw error;
  }
};

export const claimReferralRewards = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/${userId}/claim-referrals`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ user_id: userId }),
    });
    return response.json();
  } catch (error) {
    console.error('Error claiming referral rewards:', error);
    throw error;
  }
};

export const updateLastReferralClaimTime = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/${userId}/update-referral-claim-time`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ user_id: userId }),
    });
    return response.json();
  } catch (error) {
    console.error('Error updating referral claim time:', error);
    throw error;
  }
};

export const getBalance = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/${userId}/balance`);
    if (!response.ok) {
      throw new Error('Failed to fetch balance');
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching balance:', error);
    throw error;
  }
};

export const updateBalanceDirectly = async (userId, newBalance) => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/${userId}/balance`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ balance: newBalance }),
    });
    if (!response.ok) {
      throw new Error('Failed to update balance');
    }
    return response.json();
  } catch (error) {
    console.error('Error updating balance:', error);
    throw error;
  }
};

export const getCipherStatus = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/${userId}/cipher-status`);
    if (!response.ok) {
      throw new Error('Failed to fetch cipher status');
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching cipher status:', error);
    throw error;
  }
};

export const updateCipherStatus = async (userId, solved, nextTime) => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/${userId}/update-cipher-status`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ solved, next_time: nextTime }),
    });
    if (!response.ok) {
      throw new Error('Failed to update cipher status');
    }
    return response.json();
  } catch (error) {
    console.error('Error updating cipher status:', error);
    throw error;
  }
};

