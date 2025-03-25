let accessToken = null; // Global variable for API access token

const CLIENT_ID = "FxSBHzyN9KCHSxR2LcNhWaBXuZzzBKlAVQSZDsvOwBfrGJj0GW";
const CLIENT_SECRET = "VhPICrlPsoJ24gJ1DBB5Qu5Twh34MIOx7SWeFwKK";

// Function to get a new access token
async function getAccessToken() {
    const url = "https://api.petfinder.com/v2/oauth2/token";
    const params = new URLSearchParams({
        grant_type: "client_credentials",
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET
    });

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: params
        });

        if (!response.ok) throw new Error(`Error: ${response.status}`);

        const data = await response.json();
        accessToken = data.access_token;

        // Store token in localStorage with expiry timestamp
        localStorage.setItem("petfinder_token", accessToken);
        localStorage.setItem("token_expiry", Date.now() + data.expires_in * 1000);

        console.log("✅ Access Token Retrieved:", accessToken);
        return accessToken;
    } catch (error) {
        console.error("❌ Failed to get access token:", error);
    }
}

// Function to get a valid access token (checks if expired)
async function getValidToken() {
    const storedToken = localStorage.getItem("petfinder_token");
    const tokenExpiry = localStorage.getItem("token_expiry");

    // If token is valid (not expired)
    if (storedToken && tokenExpiry && Date.now() < tokenExpiry) {
        accessToken = storedToken;
        return accessToken;
    }

    // If token is missing or expired, get a new one
    console.log("🔄 Token expired or missing, refreshing...");
    return await getAccessToken();
}

// Fetch pets when the page loads
document.addEventListener("DOMContentLoaded", async () => {
    await getValidToken();
    fetchPets();
});

// Function to fetch pets from Petfinder API
async function fetchPets() {
    try {
        const token = await getValidToken(); // Get valid token (will auto-refresh if expired)
        const response = await fetch("https://api.petfinder.com/v2/animals", {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) throw new Error(`Failed to fetch pets (Status: ${response.status})`);

        const data = await response.json();

        if (!data || !data.animals) {
            throw new Error("Invalid API response: Expected an array of animals");
        }

        categorizePets(data.animals); // Ensure it's an array before categorizing
    } catch (error) {
        console.error("❌ Error fetching pets:", error);
    }
}

// Function to categorize and display pets
function categorizePets(pets) {
    if (!Array.isArray(pets)) {
        console.error("❌ Error: pets is not an array.");
        return;
    }

    const dogs = [];
    const cats = [];
    const otherPets = [];
    const newArrivals = [];

    const now = new Date();
    pets.forEach(pet => {
        const daysListed = Math.floor((now - new Date(pet.published_at)) / (1000 * 60 * 60 * 24));
        if (daysListed <= 7) newArrivals.push(pet);
        if (pet.type.toLowerCase() === "dog") dogs.push(pet);
        else if (pet.type.toLowerCase() === "cat") cats.push(pet);
        else otherPets.push(pet);
    });

    // ✅ Display pets in respective categories
    displayPets("latest-pets-list", newArrivals);
    displayPets("dogs-list", dogs);
    displayPets("cats-list", cats);
    displayPets("others-list", otherPets);
}

// Function to display pets in respective sections
function displayPets(containerId, pets) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`❌ Error: Container with ID '${containerId}' not found.`);
        return;
    }

    container.innerHTML = ""; // Clear previous content

    pets.forEach(pet => {
        const petCard = document.createElement("div");
        petCard.classList.add("pet-card");

        // Fixing image loading with fallback
        const imageUrl = pet.photos.length > 0 ? pet.photos[0].medium : "default-image.jpg";

        petCard.innerHTML = `
            <img src="${imageUrl}" alt="${pet.name}" onerror="this.src='default-image.jpg'">
            <h3>${pet.name}</h3>
            <p>${pet.breeds.primary || "Unknown Breed"}</p>
        `;

        container.appendChild(petCard);
    });
}

