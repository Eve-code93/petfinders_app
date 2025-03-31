// =============================================
// API Configuration (REPLACE WITH YOUR CREDENTIALS)
// =============================================
const PETFINDER_CONFIG = {
    CLIENT_ID: "FxSBHzyN9KCHSxR2LcNhWaBXuZzzBKlAVQSZDsvOwBfrGJj0GW",
    CLIENT_SECRET: "VhPICrlPsoJ24gJ1DBB5Qu5Twh34MIOx7SWeFwKK",
    API_URL: "https://api.petfinder.com/v2"
  };
  
  // =============================================
  // Global Variables
  // =============================================
  let accessToken = null;
  let currentDisplayIndex = 0;
  let allPets = [];
  let favoritePets = JSON.parse(localStorage.getItem('favoritePets')) || [];
  let rotationInterval = null;
  const PETS_PER_ROW = 5;
  const ROTATION_INTERVAL = 7000; // 7 seconds
  
  // =============================================
  // Authentication Management
  // =============================================

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
// ==================== FILTER FORM HANDLING ====================
document.addEventListener("DOMContentLoaded", () => {
    const findNowBtn = document.querySelector("#find-now-btn");
    const filterForm = document.querySelector("#filter-form");
    const closeFilterBtn = document.querySelector("#close-filter");

    // Open filter form
    findNowBtn.addEventListener("click", () => {
        filterForm.style.display = "flex";
    });

    // Close filter form
    closeFilterBtn.addEventListener("click", () => {
        filterForm.style.display = "none";
    });

    // Handle form submission
    document.querySelector("#pet-filter-form").addEventListener("submit", (event) => {
        event.preventDefault();
        
        // Get form data
        const petType = document.querySelector("#pet-type").value;
        const age = document.querySelector("#age").value;
        const size = document.querySelector("#size").value;
        const location = document.querySelector("#location").value;

        // Fetch pets with filters
        fetchPets(petType, age, size, location);

        // Hide the form
        filterForm.style.display = "none";
    });
});

// ==================== NOTIFICATION SYSTEM ====================
function showNotification(message, isSuccess = true) {
    const notification = document.createElement('div');
    notification.className = `notification ${isSuccess ? 'success' : 'error'}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}



  async function getAccessToken() {
    try {
      const response = await fetch(`${PETFINDER_CONFIG.API_URL}/oauth2/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: PETFINDER_CONFIG.CLIENT_ID,
          client_secret: PETFINDER_CONFIG.CLIENT_SECRET
        })
      });
  
      if (!response.ok) throw new Error(`Authentication failed: ${response.status}`);
      
      const data = await response.json();
      accessToken = data.access_token;
      localStorage.setItem('petfinder_token', accessToken);
      localStorage.setItem('token_expiry', Date.now() + (data.expires_in * 1000));
      
      return accessToken;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  }
  
  async function getValidToken() {
    const storedToken = localStorage.getItem('petfinder_token');
    const tokenExpiry = localStorage.getItem('token_expiry');
    return (storedToken && tokenExpiry && Date.now() < tokenExpiry) ? storedToken : await getAccessToken();
  }
  
  // =============================================
  // Pet Data Fetching (Only with Photos)
  // =============================================
  async function fetchPetsWithPhotos() {
    try {
      const pets = await fetchPets();
      return pets.filter(pet => pet.photos && pet.photos.length > 0);
    } catch (error) {
      console.error('Error fetching pets with photos:', error);
      return [];
    }
  }
  
  async function fetchPets(type = "", age = "", size = "", location = "", page = 1) {
    try {
      const token = await getValidToken();
      let url = `${PETFINDER_CONFIG.API_URL}/animals?page=${page}&limit=50`;
      
      const params = new URLSearchParams();
      if (type) params.append('type', type);
      if (age) params.append('age', age);
      if (size) params.append('size', size);
      if (location) params.append('location', location);
      
      const response = await fetch(`${url}&${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error(`API request failed: ${response.status}`);
      
      const data = await response.json();
      return data.animals || [];
    } catch (error) {
      console.error('Error fetching pets:', error);
      return [];
    }
  }
  
  // =============================================
  // Favorites Management
  // =============================================
  function toggleFavorite(petId) {
    const index = favoritePets.indexOf(petId);
    if (index === -1) {
      favoritePets.push(petId);
    } else {
      favoritePets.splice(index, 1);
    }
    localStorage.setItem('favoritePets', JSON.stringify(favoritePets));
    updateFavoriteButtons();
  }
  
  function isFavorite(petId) {
    return favoritePets.includes(petId);
  }
  
  function updateFavoriteButtons() {
    document.querySelectorAll('.favorite-btn').forEach(btn => {
      const petId = btn.dataset.petId;
      btn.innerHTML = isFavorite(petId) ? '❤️ Favorited' : '♡ Favorite';
      btn.classList.toggle('active', isFavorite(petId));
    });
  }

  // =============================================
  // Display Functions (Only Animals with Photos)
  // =============================================
  function displayPetRows(containerId, pets) {
    const container = document.getElementById(containerId);
    if (!container) return;
  
    // Clear previous interval if exists
    if (rotationInterval) {
      clearInterval(rotationInterval);
    }
  
    // Filter pets with photos
    const petsWithPhotos = pets.filter(pet => pet.photos && pet.photos.length > 0);
    
    if (petsWithPhotos.length === 0) {
      container.innerHTML = '<p class="no-pets">No pets with photos available.</p>';
      return;
    }
  
    // Function to display a specific set of pets
    const showPetSubset = (startIndex) => {
      const subset = [];
      for (let i = 0; i < PETS_PER_ROW; i++) {
        const index = (startIndex + i) % petsWithPhotos.length;
        subset.push(petsWithPhotos[index]);
      }
      renderPets(container, subset);
    };
  
    // Initial display
    showPetSubset(currentDisplayIndex);
  
    // Set up rotation
    rotationInterval = setInterval(() => {
      currentDisplayIndex = (currentDisplayIndex + PETS_PER_ROW) % petsWithPhotos.length;
      showPetSubset(currentDisplayIndex);
    }, ROTATION_INTERVAL);
  }
  
  function renderPets(container, pets) {
    container.innerHTML = pets.map(pet => `
      <div class="pet-card">
        <div class="pet-image">
          <img src="${pet.photos[0].medium}" 
               alt="${pet.name || 'Pet image'}" 
               onerror="this.src='https://via.placeholder.com/300x200?text=Image+Not+Available'">
        </div>
        <div class="pet-info">
          <h3>${pet.name || 'No name'}</h3>
          <p>${pet.breeds?.primary || 'Unknown breed'}</p>
          <p>${pet.age || 'Age unknown'}</p>
          <button class="favorite-btn ${isFavorite(pet.id) ? 'active' : ''}" 
                  data-pet-id="${pet.id}">
            ${isFavorite(pet.id) ? '❤️ Favorited' : '♡ Favorite'}
          </button>
        </div>
      </div>
    `).join('');
  
    // Add event listeners to new buttons
    document.querySelectorAll('.favorite-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        toggleFavorite(btn.dataset.petId);
      });
    });
  }
  
  // =============================================
  // Initialization
  // =============================================
  async function initializeApp() {
    try {
      // Load pets with photos only
      allPets = await fetchPetsWithPhotos();
      
      // Categorize pets
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const dogs = allPets.filter(pet => pet.type?.toLowerCase() === 'dog');
      const cats = allPets.filter(pet => pet.type?.toLowerCase() === 'cat');
      const others = allPets.filter(pet => !['dog', 'cat'].includes(pet.type?.toLowerCase()));
      const newArrivals = allPets.filter(pet => new Date(pet.published_at) > oneWeekAgo);
  
      // Display with rotation
      displayPetRows('dogs-list', dogs);
      displayPetRows('cats-list', cats);
      displayPetRows('others-list', others);
      displayPetRows('latest-pets-list', newArrivals);
  
    } catch (error) {
      console.error('Initialization error:', error);
      document.querySelectorAll('.pet-list').forEach(el => {
        el.innerHTML = '<p class="error">Failed to load pets. Please try again later.</p>';
      });
    }
  }
  
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
  // Start the application
  document.addEventListener('DOMContentLoaded', initializeApp);