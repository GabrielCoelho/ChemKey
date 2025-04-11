// ChemKey Application JavaScript

document.addEventListener("DOMContentLoaded", function () {
  // Check if the user is logged in
  checkAuthentication();

  // Initialize event listeners
  initializeEventListeners();

  // Initialize password list
  initializePasswordList();
});

// Authentication check
function checkAuthentication() {
  // This is a simple check - in a real app, you'd use sessions, tokens, etc.
  if (!sessionStorage.getItem("loggedIn")) {
    // Redirect to login page if not logged in
    window.location.href = "login.html";
    return;
  }

  // Display the username
  const username = sessionStorage.getItem("username") || "User";
  document.getElementById("user-display").textContent = `Welcome, ${username}`;
}

// Set up all event listeners
function initializeEventListeners() {
  // Logout button
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      sessionStorage.removeItem("loggedIn");
      sessionStorage.removeItem("username");
      window.location.href = "index.html";
    });
  }

  // Password visibility toggles
  document.querySelectorAll(".toggle-password").forEach((button) => {
    button.addEventListener("click", togglePasswordVisibility);
  });

  // Add password form submission
  const savePasswordBtn = document.getElementById("save-password");
  if (savePasswordBtn) {
    savePasswordBtn.addEventListener("click", savePassword);
  }

  // Password generator button in the form
  const generatePasswordBtn = document.getElementById("generate-password");
  if (generatePasswordBtn) {
    generatePasswordBtn.addEventListener("click", function () {
      // Open the password generator modal
      const passwordGeneratorModal = new bootstrap.Modal(
        document.getElementById("passwordGeneratorModal"),
      );
      passwordGeneratorModal.show();

      // Generate an initial password
      generatePassword();
    });
  }

  // Generate new password in the generator modal
  const generateNewPasswordBtn = document.getElementById(
    "generate-new-password",
  );
  if (generateNewPasswordBtn) {
    generateNewPasswordBtn.addEventListener("click", generatePassword);
  }

  // Use the generated password button
  const useGeneratedPasswordBtn = document.getElementById(
    "use-generated-password",
  );
  if (useGeneratedPasswordBtn) {
    useGeneratedPasswordBtn.addEventListener("click", useGeneratedPassword);
  }

  // Password length slider in generator
  const passwordLengthSlider = document.getElementById("password-length");
  if (passwordLengthSlider) {
    passwordLengthSlider.addEventListener("input", function () {
      document.getElementById("length-value").textContent = this.value;
    });
  }

  // Copy password buttons
  document.querySelectorAll(".copy-password").forEach((button) => {
    button.addEventListener("click", copyPassword);
  });

  // Copy generated password button
  const copyGeneratedBtn = document.querySelector(".copy-generated");
  if (copyGeneratedBtn) {
    copyGeneratedBtn.addEventListener("click", function () {
      const generatedPassword = document.getElementById("generated-password");
      copyToClipboard(generatedPassword.value);
      showToast("Password copied to clipboard!");
    });
  }

  // Favorite toggle buttons
  document.querySelectorAll(".favorite-toggle").forEach((star) => {
    star.addEventListener("click", function () {
      this.classList.toggle("fa-star-o");
      this.classList.toggle("fa-star");
      this.classList.toggle("active");
    });
  });

  // Edit password buttons
  document.querySelectorAll(".edit-password").forEach((button) => {
    button.addEventListener("click", editPassword);
  });

  // Delete password buttons
  document.querySelectorAll(".delete-password").forEach((button) => {
    button.addEventListener("click", deletePassword);
  });

  // Search passwords functionality
  const searchInput = document.getElementById("search-passwords");
  if (searchInput) {
    searchInput.addEventListener("input", filterPasswords);
  }

  // Filter by category
  const categoryFilter = document.getElementById("filter-category");
  if (categoryFilter) {
    categoryFilter.addEventListener("change", filterPasswords);
  }

  // Sort passwords
  const sortSelect = document.getElementById("sort-by");
  if (sortSelect) {
    sortSelect.addEventListener("change", sortPasswords);
  }
}

// Initialize/load saved passwords
function initializePasswordList() {
  // Check if we have any passwords saved in local storage
  let passwords = getPasswordsFromStorage();

  // If there are no passwords, show the empty state
  if (passwords.length === 0) {
    document.getElementById("passwords-table").classList.add("d-none");
    document.getElementById("empty-state").classList.remove("d-none");
  } else {
    document.getElementById("passwords-table").classList.remove("d-none");
    document.getElementById("empty-state").classList.add("d-none");

    // Render the passwords in the table
    renderPasswordsList(passwords);
  }
}

// Save a new password
function savePassword() {
  // Get form values
  const website = document.getElementById("website").value;
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const category = document.getElementById("category").value;
  const notes = document.getElementById("notes").value;

  // Simple validation
  if (!website || !username || !password) {
    alert("Please fill out all required fields.");
    return;
  }

  // Create password object
  const newPassword = {
    id: Date.now().toString(), // Simple unique ID
    website: website,
    username: username,
    password: password,
    category: category,
    notes: notes,
    favorite: false,
    dateAdded: new Date().toISOString(),
    strength: calculatePasswordStrength(password),
  };

  // Add to password list
  let passwords = getPasswordsFromStorage();
  passwords.push(newPassword);
  savePasswordsToStorage(passwords);

  // Update UI
  renderPasswordsList(passwords);

  // Show success message
  showToast("Password saved successfully!");

  // Hide the modal
  const modal = bootstrap.Modal.getInstance(
    document.getElementById("addPasswordModal"),
  );
  modal.hide();

  // Clear the form
  document.getElementById("add-password-form").reset();

  // Make sure the password table is visible
  document.getElementById("passwords-table").classList.remove("d-none");
  document.getElementById("empty-state").classList.add("d-none");
}

// Toggle password visibility
function togglePasswordVisibility(event) {
  const button = event.currentTarget;
  const passwordField = button.previousElementSibling;

  if (!passwordField) return;

  if (passwordField.type === "password") {
    passwordField.type = "text";
    button.querySelector("i").classList.remove("fa-eye");
    button.querySelector("i").classList.add("fa-eye-slash");
    button.setAttribute("title", "Hide Password");
  } else {
    passwordField.type = "password";
    button.querySelector("i").classList.remove("fa-eye-slash");
    button.querySelector("i").classList.add("fa-eye");
    button.setAttribute("title", "Show Password");
  }
}

// Generate a random password
function generatePassword() {
  const length = parseInt(document.getElementById("password-length").value);
  const includeUppercase = document.getElementById("include-uppercase").checked;
  const includeLowercase = document.getElementById("include-lowercase").checked;
  const includeNumbers = document.getElementById("include-numbers").checked;
  const includeSymbols = document.getElementById("include-symbols").checked;

  let charset = "";
  if (includeLowercase) charset += "abcdefghijklmnopqrstuvwxyz";
  if (includeUppercase) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (includeNumbers) charset += "0123456789";
  if (includeSymbols) charset += "!@#$%^&*()-_=+[]{}|;:,.<>?";

  // Default to lowercase if nothing is selected
  if (charset === "") charset = "abcdefghijklmnopqrstuvwxyz";

  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }

  // Update the generated password field
  document.getElementById("generated-password").value = password;
}

// Use the generated password in the add password form
function useGeneratedPassword() {
  const generatedPassword = document.getElementById("generated-password").value;
  document.getElementById("password").value = generatedPassword;

  // Close the generator modal
  const modal = bootstrap.Modal.getInstance(
    document.getElementById("passwordGeneratorModal"),
  );
  modal.hide();
}

// Copy password to clipboard
function copyPassword(event) {
  const button = event.currentTarget;
  const passwordField = button.previousElementSibling.previousElementSibling;

  if (!passwordField) return;

  // Copy to clipboard
  copyToClipboard(passwordField.value);

  // Show toast notification
  showToast("Password copied to clipboard!");
}

// Helper function to copy text to clipboard
function copyToClipboard(text) {
  // Create a temporary textarea element
  const textarea = document.createElement("textarea");
  textarea.value = text;
  document.body.appendChild(textarea);

  // Select and copy
  textarea.select();
  document.execCommand("copy");

  // Remove the textarea
  document.body.removeChild(textarea);
}

// Edit a password entry
function editPassword(event) {
  // In a real app, this would populate a modal with the password details
  const row = event.currentTarget.closest("tr");
  const passwordId = row.dataset.id;

  alert(
    "Edit functionality would open a modal with the password details for editing.",
  );

  // For this demo, we're just showing an alert
}

// Delete a password entry
function deletePassword(event) {
  // Get the password row
  const row = event.currentTarget.closest("tr");
  const passwordId = row.dataset.id;

  // Confirm deletion
  if (confirm("Are you sure you want to delete this password?")) {
    // Remove from UI
    row.remove();

    // Remove from storage
    let passwords = getPasswordsFromStorage();
    passwords = passwords.filter((p) => p.id !== passwordId);
    savePasswordsToStorage(passwords);

    // Show success message
    showToast("Password deleted successfully!");

    // Check if we need to show the empty state
    if (passwords.length === 0) {
      document.getElementById("passwords-table").classList.add("d-none");
      document.getElementById("empty-state").classList.remove("d-none");
    }
  }
}

// Filter passwords based on search and category
function filterPasswords() {
  const searchText = document
    .getElementById("search-passwords")
    .value.toLowerCase();
  const category = document.getElementById("filter-category").value;

  // Get all password rows
  const rows = document.querySelectorAll("#passwords-list tr");

  rows.forEach((row) => {
    const website = row
      .querySelector("td:nth-child(2)")
      .textContent.toLowerCase();
    const username = row
      .querySelector("td:nth-child(3)")
      .textContent.toLowerCase();
    const rowCategory = row.dataset.category;

    // Check if the row matches both the search text and category filter
    const matchesSearch =
      website.includes(searchText) || username.includes(searchText);
    const matchesCategory = category === "" || rowCategory === category;

    // Show or hide the row
    if (matchesSearch && matchesCategory) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });
}

// Sort passwords by the selected criteria
function sortPasswords() {
  const sortBy = document.getElementById("sort-by").value;
  const tbody = document.getElementById("passwords-list");
  const rows = Array.from(tbody.querySelectorAll("tr"));

  // Sort the rows
  rows.sort((a, b) => {
    if (sortBy === "name") {
      const nameA = a
        .querySelector("td:nth-child(2)")
        .textContent.toLowerCase();
      const nameB = b
        .querySelector("td:nth-child(2)")
        .textContent.toLowerCase();
      return nameA.localeCompare(nameB);
    } else if (sortBy === "date") {
      const dateA = new Date(a.dataset.dateAdded);
      const dateB = new Date(b.dataset.dateAdded);
      return dateB - dateA; // Most recent first
    } else if (sortBy === "strength") {
      const strengthA = parseInt(a.dataset.strength);
      const strengthB = parseInt(b.dataset.strength);
      return strengthB - strengthA; // Strongest first
    }
    return 0;
  });

  // Reapply the sorted rows
  rows.forEach((row) => tbody.appendChild(row));
}

// Calculate password strength (simplified)
function calculatePasswordStrength(password) {
  // This is a very simplified strength calculation
  // A real implementation would be more sophisticated

  let strength = 0;

  // Length check
  if (password.length >= 12) {
    strength += 2;
  } else if (password.length >= 8) {
    strength += 1;
  }

  // Character variety checks
  if (/[A-Z]/.test(password)) strength += 1; // Uppercase
  if (/[a-z]/.test(password)) strength += 1; // Lowercase
  if (/[0-9]/.test(password)) strength += 1; // Numbers
  if (/[^A-Za-z0-9]/.test(password)) strength += 1; // Special characters

  // Return a value between 0-5
  return Math.min(5, strength);
}

// Render strength indicator
function renderStrengthIndicator(strength) {
  let strengthClass = "strength-weak";
  let strengthLabel = "Weak";

  if (strength >= 4) {
    strengthClass = "strength-strong";
    strengthLabel = "Strong";
  } else if (strength >= 2) {
    strengthClass = "strength-medium";
    strengthLabel = "Medium";
  }

  return `
    <div class="strength-meter">
      <div class="strength-bar ${strengthClass}"></div>
      <span class="strength-label">${strengthLabel}</span>
    </div>
  `;
}

// Render the list of passwords
function renderPasswordsList(passwords) {
  const tbody = document.getElementById("passwords-list");
  tbody.innerHTML = "";

  passwords.forEach((password) => {
    const tr = document.createElement("tr");
    tr.dataset.id = password.id;
    tr.dataset.category = password.category;
    tr.dataset.dateAdded = password.dateAdded;
    tr.dataset.strength = password.strength;

    const favoriteIcon = password.favorite ? "fa-star active" : "fa-star-o";

    tr.innerHTML = `
      <td><i class="fa ${favoriteIcon} favorite-toggle"></i></td>
      <td>
        <div class="site-info">
          <img src="/api/placeholder/16/16" alt="Site icon" class="site-icon">
          <span>${password.website}</span>
        </div>
      </td>
      <td>${password.username}</td>
      <td>
        <div class="password-field">
          <input type="password" class="form-control-plaintext password-value" value="${password.password}" readonly>
          <button class="btn btn-sm toggle-password" title="Show Password">
            <i class="fa fa-eye"></i>
          </button>
          <button class="btn btn-sm copy-password" title="Copy Password">
            <i class="fa fa-copy"></i>
          </button>
        </div>
      </td>
      <td>${renderStrengthIndicator(password.strength)}</td>
      <td>
        <div class="btn-group">
          <button class="btn btn-sm btn-outline-secondary edit-password" title="Edit">
            <i class="fa fa-pencil"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger delete-password" title="Delete">
            <i class="fa fa-trash"></i>
          </button>
        </div>
      </td>
    `;

    // Add event listeners for the new row
    tr.querySelector(".toggle-password").addEventListener(
      "click",
      togglePasswordVisibility,
    );
    tr.querySelector(".copy-password").addEventListener("click", copyPassword);
    tr.querySelector(".favorite-toggle").addEventListener("click", function () {
      this.classList.toggle("fa-star-o");
      this.classList.toggle("fa-star");
      this.classList.toggle("active");

      // Update favorite status in storage
      const passwords = getPasswordsFromStorage();
      const passwordToUpdate = passwords.find((p) => p.id === tr.dataset.id);
      if (passwordToUpdate) {
        passwordToUpdate.favorite = !passwordToUpdate.favorite;
        savePasswordsToStorage(passwords);
      }
    });
    tr.querySelector(".edit-password").addEventListener("click", editPassword);
    tr.querySelector(".delete-password").addEventListener(
      "click",
      deletePassword,
    );

    tbody.appendChild(tr);
  });
}

// Helper function to show a toast notification
function showToast(message) {
  // Create toast container if it doesn't exist
  let toastContainer = document.getElementById("toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toast-container";
    toastContainer.className = "position-fixed bottom-0 end-0 p-3";
    document.body.appendChild(toastContainer);
  }

  // Create toast element
  const toastId = `toast-${Date.now()}`;
  const toastHtml = `
    <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="toast-header">
        <strong class="me-auto">ChemKey</strong>
        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
      <div class="toast-body">
        ${message}
      </div>
    </div>
  `;

  toastContainer.insertAdjacentHTML("beforeend", toastHtml);

  // Initialize and show the toast
  const toastElement = document.getElementById(toastId);
  const bsToast = new bootstrap.Toast(toastElement, {
    autohide: true,
    delay: 3000,
  });
  bsToast.show();

  // Remove the toast element after it's hidden
  toastElement.addEventListener("hidden.bs.toast", function () {
    toastElement.remove();
  });
}

// Storage functions
function getPasswordsFromStorage() {
  const passwordsJSON = localStorage.getItem("chemkey_passwords");
  return passwordsJSON ? JSON.parse(passwordsJSON) : [];
}

function savePasswordsToStorage(passwords) {
  localStorage.setItem("chemkey_passwords", JSON.stringify(passwords));
}

// Update login verification to work with the existing login system
// When user logs in successfully from login.html, save to sessionStorage
document.addEventListener("DOMContentLoaded", function () {
  // Set login status in sessionStorage when redirected from login page
  // This code actually runs from the app.js script, but is included to match
  // the login functionality in valida_user.js
  const urlParams = new URLSearchParams(window.location.search);
  const loginSuccess = urlParams.get("login");

  if (loginSuccess === "success") {
    sessionStorage.setItem("loggedIn", "true");
    sessionStorage.setItem("username", "teste@teste");
  }
});
