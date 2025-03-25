import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
app.use(cors());

// Petfinder API credentials
const API_KEY = 'FxSBHzyN9KCHSxR2LcNhWaBXuZzzBKlAVQSZDsvOwBfrGJj0GW';
const API_SECRET = 'VhPICrlPsoJ24gJ1DBB5Qu5Twh34MIOx7SWeFwKK';

// Root route (to avoid "Cannot GET /" error)
app.get('/', (req, res) => {
    res.send('Welcome to the Pet Finder API. Use /pets to fetch pet data.');
});

// Function to get access token
async function getAccessToken() {
    const response = await fetch('https://api.petfinder.com/v2/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: API_KEY,
            client_secret: API_SECRET.trim() 
        })
    });

    const data = await response.json();
    return data.access_token;
}

// Pets endpoint
app.get('/pets', async (req, res) => {
    try {
        const token = await getAccessToken();
        const response = await fetch('https://api.petfinder.com/v2/animals?type=dog', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching pets:', error);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

// Start server
const PORT = 4000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
