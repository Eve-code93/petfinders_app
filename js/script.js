// Global API Token
let accessToken = null;

const CLIENT_ID = "FxSBHzyN9KCHSxR2LcNhWaBXuZzzBKlAVQSZDsvOwBfrGJj0GW";
const CLIENT_SECRET = "VhPICrlPsoJ24gJ1DBB5Qu5Twh34MIOx7SWeFwKK";

// Get Access Token
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

        localStorage.setItem("petfinder_token", accessToken);
        localStorage.setItem("token_expiry", Date.now() + data.expires_in * 1000);

        console.log("✅ Access Token Retrieved:", accessToken);
        return accessToken;
    } catch (error) {
        console.error("❌ Failed to get access token:", error);
    }
}

// Get valid token (checks expiry)
async function getValidToken() {
    const storedToken = localStorage.getItem("petfinder_token");
    const tokenExpiry = localStorage.getItem("token_expiry");

    if (storedToken && tokenExpiry && Date.now() < tokenExpiry) {
        accessToken = storedToken;
        return accessToken;
    }

    console.log("🔄 Token expired, refreshing...");
    return await getAccessToken();
}

document.addEventListener("DOMContentLoaded", function () {
    const themeToggle = document.getElementById("theme-toggle");
    const themeIcon = document.getElementById("theme-icon");
    const body = document.body;

    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark-mode") {
        body.classList.add("dark-mode");
        themeIcon.textContent = "☀️"; // Sun icon for light mode
        themeToggle.textContent = " Light Mode";
    } else {
        themeIcon.textContent = "🌙"; // Moon icon for dark mode
        themeToggle.textContent = " Dark Mode";
    }

    // Toggle Theme
    themeToggle.addEventListener("click", function () {
        if (body.classList.contains("dark-mode")) {
            body.classList.remove("dark-mode");
            themeIcon.textContent = "🌙"; // Switch to moon icon
            themeToggle.textContent = " Dark Mode";
            localStorage.setItem("theme", "light-mode");
        } else {
            body.classList.add("dark-mode");
            themeIcon.textContent = "☀️"; // Switch to sun icon
            themeToggle.textContent = " Light Mode";
            localStorage.setItem("theme", "dark-mode");
        }
    });
});



// Fetch pets with filters
async function fetchPets(type = "", age = "", size = "", page = 1) {
    try {
        const token = await getValidToken();
        let url = `https://api.petfinder.com/v2/animals?page=${page}`;

        const params = new URLSearchParams();
        if (type) params.append("type", type);
        if (age) params.append("age", age);
        if (size) params.append("size", size);
        url += `&${params.toString()}`;

        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) throw new Error(`Failed to fetch pets (Status: ${response.status})`);

        const data = await response.json();
        if (!data || !data.animals) throw new Error("Invalid API response");

        console.log("API Response:", data.animals);
        categorizePets(data.animals);
    } catch (error) {
        console.error("❌ Error fetching pets:", error);
    }
}

// Categorize pets
function categorizePets(pets) {
    if (!Array.isArray(pets)) {
        console.error("❌ Error: pets is not an array.");
        return;
    }

    const dogs = [];
    const cats = [];
    const otherpets = [];
    const newArrivals = [];

    const now = new Date();
    pets.forEach(pet => {
        const daysListed = Math.floor((now - new Date(pet.published_at)) / (1000 * 60 * 60 * 24));
        if (daysListed <= 7) newArrivals.push(pet);
        if (pet.type.toLowerCase() === "dog") dogs.push(pet);
        else if (pet.type.toLowerCase() === "cat") cats.push(pet);
        else otherpets.push(pet);
    });

    updatePetsDisplay(dogs, cats, otherpets, newArrivals);
}

// Display pets
function updatePetsDisplay(dogs, cats, otherpets, newArrivals) {
    displayPets("dogs-list", dogs);
    displayPets("cats-list", cats);
    displayPets("otherpets-list", otherpets);
    displayPets("latest-pets-list", newArrivals);
}

let currentIndex = 0;
let petsWithPictures = [];

function displayPets(containerId, pets, itemsToShow = 5) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`❌ Error: Container '${containerId}' not found.`);
        return;
    }

    // Debug: Check the API response
    console.log("Pets from API:", pets);

    // Filter pets that have photos, but allow fallback if none have photos
    petsWithPictures = pets.filter(pet => pet.photos && pet.photos.length > 0);

    // Debug: Check how many pets have images
    console.log("Filtered Pets with Images:", petsWithPictures.length);

    if (petsWithPictures.length === 0) {
        container.innerHTML = "<p>No pets with pictures available.</p>";
        return;
    }

    function updateDisplay() {
        const petsToDisplay = [];
        for (let i = 0; i < itemsToShow; i++) {
            petsToDisplay.push(petsWithPictures[(currentIndex + i) % petsWithPictures.length]);
        }

        const fragment = document.createDocumentFragment();
        
        petsToDisplay.forEach((pet) => {
            const petCard = document.createElement("div");
            petCard.classList.add("pet-card");

            // Debug: Check each pet's photos array
            console.log(`Pet: ${pet.name}, Photos:`, pet.photos);

            // Use first available image or a placeholder
            const imageUrl = (pet.photos.length > 0 && pet.photos[0].medium) 
                ? pet.photos[0].medium 
                : "placeholder.jpg";
            const age = pet.age || "Unknown Age";

            petCard.innerHTML = `
                <img src="${imageUrl}" alt="${pet.name}" onerror="this.src='placeholder.jpg';">
                <h3>${pet.name}</h3>
                <p><strong>Breed:</strong> ${pet.breeds.primary || "Unknown Breed"}</p>
                <p><strong>Age:</strong> ${age}</p>
                <button class="favorite-btn" data-id="${pet.id}">❤️ Favorite</button>
            `;

            fragment.appendChild(petCard);
        });

        container.style.opacity = "0";

        setTimeout(() => {
            container.innerHTML = "";
            container.appendChild(fragment);
            container.style.opacity = "1";
            addFavoriteEventListeners();
        }, 500);

        currentIndex = (currentIndex + itemsToShow) % petsWithPictures.length;
    }

    updateDisplay();
    setInterval(updateDisplay, 5000);
}


document.addEventListener("DOMContentLoaded", () => {
    const findNowBtn = document.querySelector("#find-now-btn");
    const filterForm = document.querySelector("#filter-form");
    const closeFilterBtn = document.querySelector("#close-filter");

    // Open filter form
    findNowBtn.addEventListener("click", () => {
        filterForm.style.display = "flex"; // Show the form
    });

    // Close filter form
    closeFilterBtn.addEventListener("click", () => {
        filterForm.style.display = "none"; // Hide the form
    });

    // Handle form submission
    document.querySelector("#pet-filter-form").addEventListener("submit", (event) => {
        event.preventDefault(); // Prevent actual submission for now

        // Get form data
        const petType = document.querySelector("#pet-type").value;
        const age = document.querySelector("#age").value;
        const size = document.querySelector("#size").value;
        const location = document.querySelector("#location").value;

        console.log(`Searching for a ${size} ${petType}, Age: ${age}, Location: ${location}`);

        // Hide the form after submission
        filterForm.style.display = "none";
    });
});



// Handle Favorite Pets
function addFavoriteEventListeners() {
    document.querySelectorAll(".favorite-btn").forEach(button => {
        button.addEventListener("click", function () {
            const petId = this.dataset.id;
            saveFavoritePet(petId);
            this.textContent = "❤️ Favorited";
            this.disabled = true;
        });
    });
}

function saveFavoritePet(petId) {
    let favorites = JSON.parse(localStorage.getItem("favorite_pets")) || [];
    if (!favorites.includes(petId)) {
        favorites.push(petId);
        localStorage.setItem("favorite_pets", JSON.stringify(favorites));
    }
}

// Subscription Form Validation
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("subscription-form");
    const emailInput = document.getElementById("email");
    const message = document.getElementById("subscription-message");

    form?.addEventListener("submit", (event) => {
        event.preventDefault();

        const email = emailInput.value.trim();

        if (email === "") {
            message.textContent = "Please enter a valid email address.";
            message.style.color = "red";
        } else {
            message.textContent = `Thank you for subscribing! A confirmation email has been sent to ${email}.`;
            message.style.color = "green";
            emailInput.value = "";
        }

        message.classList.remove("hidden");
    });
});

// Fetch pets on page load
document.addEventListener("DOMContentLoaded", async () => {
    await getValidToken();
    fetchPets();
});
