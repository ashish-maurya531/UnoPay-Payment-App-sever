const express = require('express');
const axios = require('axios');
const authenticateToken = require("../middleware/auth");



// Configuration
const AUTHORIZED_KEY = 'YOUR_AUTHORIZED_KEY';
const API_BASE_URL = 'https://api.cashkavach.com/api';

// 1. Payout Transfer
async function payoutTransfer(payload) {
    try {
        const response = await axios.post(`${API_BASE_URL}/PayoutTransfer`, payload, {
            headers: {
                'AuthorizedKey': AUTHORIZED_KEY,  // Added missing key
                'Content-Type': 'application/json'
            },
            maxBodyLength: Infinity
        });
        return response.data;
    } catch (error) {
        console.error('Payout Transfer Error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || "Payout transfer failed");
    }
}

// 2. Check Payout Status
async function checkPayoutStatus(orderId) {
    try {
        const response = await axios.post(`${API_BASE_URL}/DoCheckStatus`, 
            { orderId },
            {
                headers: {
                    'AuthorizedKey': AUTHORIZED_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error('Check Status Error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || "Payout status check failed");
    }
}

// 3. Get Balance
async function getBalance() {
    try {
        const response = await axios.post(`${API_BASE_URL}/CheckBalance`, 
            { balanceType: 'MAIN' },
            {
                headers: {
                    'AuthorizedKey': AUTHORIZED_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error('Get Balance Error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || "Balance check failed");
    }
}

module.exports = { payoutTransfer, checkPayoutStatus, getBalance };