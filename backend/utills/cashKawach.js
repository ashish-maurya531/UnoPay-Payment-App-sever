const express = require('express');
const axios = require('axios');
const authenticateToken = require("../middleware/auth");
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const AUTHORIZED_KEY = process.env.CASHKAVACH_AUTHORIZED_KEY;
const API_BASE_URL = process.env.CASHKAVACH_API_BASE_URL;

// 1. Payout Transfer
async function payoutTransfer(payload) {
    try {
        // Check if balance is sufficient before proceeding
        const balanceData = await getBalance();
        const currentBalance = parseFloat(balanceData.dataContent); // Ensure the API returns 'balance' field
        const transferAmount = parseFloat(payload.Amount);
        const requiredBalance = transferAmount + 10;

        if (currentBalance < requiredBalance) {
            return 'Low payout API balance';
        }

        // Proceed with the payout transfer
        const response = await axios.post(`${API_BASE_URL}/PayoutTransfer`, payload, {
            headers: {
                'AuthorizedKey': AUTHORIZED_KEY,
                'Content-Type': 'application/json'
            },
            maxBodyLength: Infinity
        });
        return response.data;
    } catch (error) {
        console.error('Payout Transfer Error:', error.response?.data || error.message);
        throw new Error(error.message || "Payout transfer failed");
    }
}

// 2. Check Payout Status (unchanged)
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

// 3. Get Balance (unchanged)
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