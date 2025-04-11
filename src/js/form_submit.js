// Contact form handler script
document.addEventListener("DOMContentLoaded", function () {
  // Find the contact form
  const contactForm = document.getElementById("contact-form");

  // Check if the form exists on the page
  if (contactForm) {
    // Add event listener for form submission
    contactForm.addEventListener("submit", function (event) {
      // Prevent the default form submission
      event.preventDefault();

      // Perform validation
      if (validateForm()) {
        // Show success modal
        showSuccessModal();

        // Optional: Reset the form after successful "submission"
        contactForm.reset();
      }
    });
  }

  // Function to validate the form
  function validateForm() {
    let isValid = true;

    // Get form field values
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const subject = document.getElementById("subject").value;
    const message = document.getElementById("message").value.trim();
    const privacyPolicy = document.getElementById("privacy-policy").checked;

    // Optional CPF field (only validate if it has a value)
    const cpf = document.getElementById("cpf").value.trim();

    // Basic validation
    if (name === "") {
      showError("name", "Please enter your name");
      isValid = false;
    } else {
      removeError("name");
    }

    if (email === "") {
      showError("email", "Please enter your email address");
      isValid = false;
    } else if (!isValidEmail(email)) {
      showError("email", "Please enter a valid email address");
      isValid = false;
    } else {
      removeError("email");
    }

    if (subject === "" || subject === null) {
      showError("subject", "Please select a subject");
      isValid = false;
    } else {
      removeError("subject");
    }

    if (message === "") {
      showError("message", "Please enter your message");
      isValid = false;
    } else {
      removeError("message");
    }

    if (!privacyPolicy) {
      showError("privacy-policy", "You must agree to the privacy policy");
      isValid = false;
    } else {
      removeError("privacy-policy");
    }

    // Validate CPF only if it's not empty
    if (cpf !== "") {
      // Use the existing CPF validation function from valida_cpf.js
      if (typeof validarCPF === "function") {
        if (!validarCPF(cpf)) {
          showError("cpf", "Please enter a valid CPF");
          isValid = false;
        } else {
          removeError("cpf");
        }
      } else {
        // Fallback if validarCPF function is not available
        console.warn(
          "CPF validation function not found. Make sure valida_cpf.js is loaded.",
        );
      }
    }

    return isValid;
  }

  // Helper function to validate email format
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Function to show error message
  function showError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorId = `${fieldId}-error`;

    // Add error class to the field
    field.classList.add("is-invalid");

    // Create or update error message
    let errorElement = document.getElementById(errorId);
    if (!errorElement) {
      errorElement = document.createElement("div");
      errorElement.id = errorId;
      errorElement.className = "invalid-feedback";
      field.parentNode.appendChild(errorElement);
    }

    errorElement.textContent = message;
  }

  // Function to remove error message
  function removeError(fieldId) {
    const field = document.getElementById(fieldId);
    const errorId = `${fieldId}-error`;

    // Remove error class from the field
    field.classList.remove("is-invalid");
    field.classList.add("is-valid");

    // Remove error message if it exists
    const errorElement = document.getElementById(errorId);
    if (errorElement) {
      errorElement.remove();
    }
  }

  // Function to show success modal
  function showSuccessModal() {
    // Create modal element if it doesn't exist
    let successModal = document.getElementById("contact-success-modal");

    if (!successModal) {
      // Create modal HTML
      const modalHtml = `
        <div class="modal fade" id="contact-success-modal" tabindex="-1" aria-labelledby="contactSuccessModalLabel" aria-hidden="true">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header bg-success text-white">
                <h5 class="modal-title" id="contactSuccessModalLabel">Message Sent!</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
                <p>Thank you for your message! Our team will review it and get back to you soon.</p>
                <p class="small text-muted">(This is a demo for academic purposes, no data was actually sent)</p>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Close</button>
              </div>
            </div>
          </div>
        </div>
      `;

      // Add modal to the document
      document.body.insertAdjacentHTML("beforeend", modalHtml);
      successModal = document.getElementById("contact-success-modal");
    }

    // Show the modal
    const bsModal = new bootstrap.Modal(successModal);
    bsModal.show();
  }
});
