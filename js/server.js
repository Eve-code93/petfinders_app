require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

const PETFINDER_API_URL = "https://api.petfinder.com/v2/animals";
const API_KEY = process.env.PETFINDER_API_KEY;
const API_SECRET = process.env.PETFINDER_API_SECRET;

// Function to get an OAuth2 access token
async function getAccessToken() {
    try {
        const response = await axios.post("https://api.petfinder.com/v2/oauth2/token", {
            grant_type: "client_credentials",
            client_id: API_KEY,
            client_secret: API_SECRET,
        });
        return response.data.access_token;
    } catch (error) {
        console.error("Error getting access token:", error);
        throw new Error("Failed to get API token");
    }
}

// Endpoint to fetch pet data
app.get("/api/pets", async (req, res) => {
    try {
        const token = await getAccessToken();
        const response = await axios.get(PETFINDER_API_URL, {
            headers: { Authorization: `Bearer ${token}` },
        });
        res.json(response.data);
    } catch (error) {
        console.error("Error fetching pet data:", error);
        res.status(500).json({ error: "Failed to fetch pets" });
    }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
