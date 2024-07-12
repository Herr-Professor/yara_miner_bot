// src/services/api.js
import { API_BASE_URL } from '../config';

export const createUser = async (telegramId, name) => {
  const response = await fetch(`${API_BASE_URL}/user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ telegram_id: telegramId, name })
  });
  return response.json();
};

export const getUser = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/user/${userId}`);
  return response.json();
};

export const claimTokens = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId })
  });
  return response.json();
};

export const addReferral = async (referrerCode, referredId) => {
  const response = await fetch(`${API_BASE_URL}/referral`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ referrer_code: referrerCode, referred_id: referredId })
  });
  return response.json();
};

export const updateGamePoints = async (userId, points) => {
  const response = await fetch(`${API_BASE_URL}/game_points`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, points })
  });
  return response.json();
};

export const getLeaderboard = async () => {
  const response = await fetch(`${API_BASE_URL}/leaderboard`);
  return response.json();
};

export const getUserReferrals = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/user/${userId}/referrals`);
  return response.json();
};

export const claimReferralRewards = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/user/${userId}/claim-referrals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId })
  });
  return response.json();
};

export const updateLastReferralClaimTime = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/user/${userId}/update-referral-claim-time`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId })
  });
  return response.json();
};