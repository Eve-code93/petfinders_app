import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 4000;

// Allow frontend requests from http://127.0.0.1:3004
app.use(cors({ origin: 'http://127.0.0.1:3004' }));

// Store the access token globally
let accessToken = null;

// Function to get a new access token
async function getAccessToken() {
    const response = await fetch('https://api.petfinder.com/v2/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: process.env.PETFINDER_API_KEY, 
            client_secret: process.env.PETFINDER_API_SECRET
        })
    });

    const data = await response.json();
    accessToken = data.access_token;
}

// Middleware to ensure we have a valid token before each request
async function ensureAccessToken(req, res, next) {
    if (!accessToken) await getAccessToken();
    next();
}

// Proxy route to fetch pets
app.get('/pets', ensureAccessToken, async (req, res) => {
    try {
        const type = req.query.type || 'dog'; // Default to 'dog'
        const petfinderURL = `https://api.petfinder.com/v2/animals?type=${type}&limit=6`;

        const response = await fetch(petfinderURL, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching pets:', error);
        res.status(500).json({ error: 'Failed to fetch pet data' });
    }
});

// Start the backend server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
