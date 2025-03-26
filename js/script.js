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

    if (storedToken && tokenExpiry && Date.now() < tokenExpiry) {
        accessToken = storedToken;
        return accessToken;
    }

    console.log("🔄 Token expired or missing, refreshing...");
    return await getAccessToken();
}

document.addEventListener("DOMContentLoaded", async () => {
    await getValidToken();
    fetchPets();
});

// Fetch pets from API with optional filters
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

        categorizePets(data.animals);
    } catch (error) {
        console.error("❌ Error fetching pets:", error);
    }
}

// Categorize pets by type
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

    displayPets("latest-pets-list", newArrivals);
    displayPets("dogs-list", dogs);
    displayPets("cats-list", cats);
}


function displayPets(containerId, pets) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`❌ Error: Container with ID '${containerId}' not found.`);
        return;
    }

    container.innerHTML = "";
    if (pets.length === 0) {
        container.innerHTML = "<p>No pets found.</p>";
        return;
    }

    pets.forEach(pet => {
        const petCard = document.createElement("div");
        petCard.classList.add("pet-card");

        const imageUrl = pet.photos.length > 0 ? pet.photos[0].medium : "default-image.jpg";
        petCard.innerHTML = `
            <img src="${imageUrl}" alt="${pet.name}" onerror="this.src='default-image.jpg'">
            <h3>${pet.name}</h3>
            <p>${pet.breeds.primary || "Unknown Breed"}</p>
            <button class="favorite-btn" data-id="${pet.id}">❤️ Favorite</button>
        `;

        container.appendChild(petCard);
    });

    addFavoriteEventListeners();
}


document.getElementById("pet-filter-form")?.addEventListener("submit", function (event) {
    event.preventDefault(); 

    const type = document.getElementById("type").value;
    const age = document.getElementById("age").value;
    const size = document.getElementById("size").value;

    console.log("🔍 Filtering pets with:", { type, age, size });
    fetchPets(type, age, size);
});

// Handle pagination
let currentPage = 1;

document.getElementById("next-page")?.addEventListener("click", function () {
    currentPage++;
    fetchPets("", "", "", currentPage);
});

document.getElementById("prev-page")?.addEventListener("click", function () {
    if (currentPage > 1) {
        currentPage--;
        fetchPets("", "", "", currentPage);
    }
});

// Toggle filter form visibility
document.getElementById("toggle-filter-button")?.addEventListener("click", function () {
    document.getElementById("filter-form").classList.toggle("hidden");
});

// Favorite pets
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

// Image slider functionality
document.addEventListener("DOMContentLoaded", function () {
    let slideIndex = 0;
    const slides = document.querySelectorAll(".slide");

    if (slides.length === 0) {
        console.error("No slides found! Check your image paths.");
        return;
    }

    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.style.display = i === index ? "block" : "none";
        });
    }

    function changeSlide(direction) {
        slideIndex = (slideIndex + direction + slides.length) % slides.length;
        showSlide(slideIndex);
    }

    document.querySelector(".prev")?.addEventListener("click", () => changeSlide(-1));
    document.querySelector(".next")?.addEventListener("click", () => changeSlide(1));
    showSlide(slideIndex);
});

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("subscription-form");
    const emailInput = document.getElementById("email");
    const message = document.getElementById("subscription-message");

    form.addEventListener("submit", (event) => {
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
