document.addEventListener("DOMContentLoaded", () => {
    let slideIndex = 0;
    const slides = document.querySelectorAll(".slide");

    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.style.opacity = i === index ? "1" : "0"; 
        });
    }

    function nextSlide() {
        slideIndex = (slideIndex + 1) % slides.length;
        showSlide(slideIndex);
    }

    
    setInterval(nextSlide, 5000);

   
    showSlide(slideIndex);
});
document.getElementById("subscription-form").addEventListener("submit", function(event) {
    event.preventDefault(); // Prevent form submission

    const emailInput = document.getElementById("email");
    const message = document.getElementById("subscription-message");

    if (emailInput.value) {
        message.textContent = `Thank you for subscribing! A confirmation email has been sent to ${emailInput.value}.`;
        message.classList.remove("hidden");

        // Clear the input field
        emailInput.value = "";
    }
});

