import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000; // Use the PORT environment variable for deployment

// Allow frontend requests from multiple origins
app.use(cors({
    origin: ['http://127.0.0.1:3004', 'https://your-vercel-site.vercel.app', 'https://your-github-pages.github.io'],
    methods: ['GET', 'POST']
}));

// Store the access token globally and track expiry time
let accessToken = null;
let tokenExpiry = null;

// Function to get a new access token
async function getAccessToken() {
    try {
        const response = await fetch('https://api.petfinder.com/v2/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: process.env.VITE_PETFINDER_API_KEY, // Load from environment variables
                client_secret: process.env.VITE_PETFINDER_API_SECRET // Load from environment variables
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch access token: ${response.status}`);
        }

        const data = await response.json();
        if (!data.access_token) {
            throw new Error('Access token not found in API response');
        }

        accessToken = data.access_token;
        tokenExpiry = Date.now() + data.expires_in * 1000; // Save expiry time
        console.log('✅ Access Token Retrieved Successfully:', accessToken);
    } catch (error) {
        console.error('❌ Error during token retrieval:', error);
        throw error;
    }
}

// Middleware to ensure a valid access token is available
async function ensureAccessToken(req, res, next) {
    try {
        if (!accessToken || Date.now() > tokenExpiry) {
            console.log('🔄 Token expired or not found, refreshing...');
            await getAccessToken();
        }
        next();
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve access token' });
    }
}

// Root route for basic response
app.get('/', (req, res) => {
    res.send('Welcome to the Pet API! Use /pets to fetch pet data.');
});

// Proxy route to fetch pet data
app.get('/pets', ensureAccessToken, async (req, res) => {
    try {
        const type = req.query.type || 'dog'; // Default to 'dog' if no type is specified
        const petfinderURL = `https://api.petfinder.com/v2/animals?type=${type}&limit=6`;

        const response = await fetch(petfinderURL, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch pets: ${response.status}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('❌ Error fetching pets:', error);
        res.status(500).json({ error: 'Failed to fetch pet data' });
    }
});

// Logging middleware for debugging purposes
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Start the backend server
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
