// ChemKey Application JavaScript - Client-side

document.addEventListener("DOMContentLoaded", function () {
  // Initialize event listeners
  initializeEventListeners();
  // Load password list
  loadPasswords();
});

// Set up all event listeners
function initializeEventListeners() {
  // Logout button
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout);
  }

  // Add password form submission
  const savePasswordBtn = document.getElementById("save-password");
  if (savePasswordBtn) {
    savePasswordBtn.addEventListener("click", savePassword);
  }

  // Password generator button
  const generatePasswordBtn = document.getElementById("generate-password");
  if (generatePasswordBtn) {
    generatePasswordBtn.addEventListener("click", openPasswordGenerator);
  }

  // Generate new password in modal
  const generateNewPasswordBtn = document.getElementById("generate-new-password");
  if (generateNewPasswordBtn) {
    generateNewPasswordBtn.addEventListener("click", generatePassword);
  }

  // Use generated password
  const useGeneratedPasswordBtn = document.getElementById("use-generated-password");
  if (useGeneratedPasswordBtn) {
    useGeneratedPasswordBtn.addEventListener("click", useGeneratedPassword);
  }

  // Password length slider
  const passwordLengthSlider = document.getElementById("password-length");
  if (passwordLengthSlider) {
    passwordLengthSlider.addEventListener("input", function () {
      document.getElementById("length-value").textContent = this.value;
    });
  }

  // Search and filter functionality
  const searchInput = document.getElementById("search-passwords");
  if (searchInput) {
    searchInput.addEventListener("input", filterPasswords);
  }

  const categoryFilter = document.getElementById("filter-category");
  if (categoryFilter) {
    categoryFilter.addEventListener("change", filterPasswords);
  }

  const sortSelect = document.getElementById("sort-by");
  if (sortSelect) {
    sortSelect.addEventListener("change", sortPasswords);
  }

  // Copy generated password
  const copyGeneratedBtn = document.querySelector(".copy-generated");
  if (copyGeneratedBtn) {
    copyGeneratedBtn.addEventListener("click", function () {
      const generatedPassword = document.getElementById("generated-password");
      copyToClipboard(generatedPassword.value);
      showToast("Password copied to clipboard!");
    });
  }
}

// Handle logout
async function handleLogout() {
  try {
    const response = await fetch('/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const result = await response.json();

    if (result.success) {
      window.location.href = result.redirectUrl || '/';
    } else {
      showToast('Error during logout: ' + result.error, 'error');
    }
  } catch (error) {
    console.error('Logout error:', error);
    showToast('Error during logout. Please try again.', 'error');
  }
}

// Load passwords from API
async function loadPasswords() {
  try {
    const response = await fetch('/passwords');
    const result = await response.json();

    if (result.success) {
      renderPasswordsList(result.passwords);

      if (result.passwords.length === 0) {
        showEmptyState();
      } else {
        hideEmptyState();
      }
    } else {
      showToast('Error loading passwords: ' + result.error, 'error');
    }
  } catch (error) {
    console.error('Error loading passwords:', error);
    showToast('Error loading passwords. Please refresh the page.', 'error');
  }
}

// Save a new password
async function savePassword() {
  const website = document.getElementById("website").value;
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const category = document.getElementById("category").value;
  const notes = document.getElementById("notes").value;

  // Client-side validation
  if (!website || !username || !password) {
    showToast("Please fill out all required fields.", 'error');
    return;
  }

  try {
    const response = await fetch('/passwords', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        website,
        username,
        password,
        category,
        notes
      })
    });

    const result = await response.json();

    if (result.success) {
      showToast(result.message);

      // Close modal
      const modal = bootstrap.Modal.getInstance(document.getElementById("addPasswordModal"));
      modal.hide();

      // Clear form
      document.getElementById("add-password-form").reset();

      // Reload passwords
      loadPasswords();

    } else {
      showToast('Error saving password: ' + result.error, 'error');
    }

  } catch (error) {
    console.error('Error saving password:', error);
    showToast('Error saving password. Please try again.', 'error');
  }
}

// Open password generator modal
function openPasswordGenerator() {
  const passwordGeneratorModal = new bootstrap.Modal(document.getElementById("passwordGeneratorModal"));
  passwordGeneratorModal.show();
  generatePassword(); // Generate initial password
}

// Generate password
async function generatePassword() {
  const length = parseInt(document.getElementById("password-length").value);
  const includeUppercase = document.getElementById("include-uppercase").checked;
  const includeLowercase = document.getElementById("include-lowercase").checked;
  const includeNumbers = document.getElementById("include-numbers").checked;
  const includeSymbols = document.getElementById("include-symbols").checked;

  try {
    const response = await fetch('/passwords/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        length,
        includeUppercase,
        includeLowercase,
        includeNumbers,
        includeSymbols
      })
    });

    const result = await response.json();

    if (result.success) {
      document.getElementById("generated-password").value = result.password;
    } else {
      showToast('Error generating password: ' + result.error, 'error');
    }

  } catch (error) {
    console.error('Error generating password:', error);
    showToast('Error generating password. Please try again.', 'error');
  }
}

// Use generated password
function useGeneratedPassword() {
  const generatedPassword = document.getElementById("generated-password").value;
  document.getElementById("password").value = generatedPassword;

  // Close generator modal
  const modal = bootstrap.Modal.getInstance(document.getElementById("passwordGeneratorModal"));
  modal.hide();
}

// Render passwords list
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
      <td><i class="fa ${favoriteIcon} favorite-toggle" data-id="${password.id}"></i></td>
      <td>
        <div class="site-info">
          <span>${escapeHtml(password.website)}</span>
        </div>
      </td>
      <td>${escapeHtml(password.username)}</td>
      <td>
        <div class="password-field">
          <input type="password" class="form-control-plaintext password-value" value="${escapeHtml(password.password)}" readonly>
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
          <button class="btn btn-sm btn-outline-secondary edit-password" data-id="${password.id}" title="Edit">
            <i class="fa fa-pencil"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger delete-password" data-id="${password.id}" title="Delete">
            <i class="fa fa-trash"></i>
          </button>
        </div>
      </td>
    `;

    // Add event listeners for the new row
    addRowEventListeners(tr);
    tbody.appendChild(tr);
  });
}

// Add event listeners to password row
function addRowEventListeners(row) {
  row.querySelector(".toggle-password").addEventListener("click", togglePasswordVisibility);
  row.querySelector(".copy-password").addEventListener("click", copyPassword);
  row.querySelector(".favorite-toggle").addEventListener("click", toggleFavorite);
  row.querySelector(".edit-password").addEventListener("click", editPassword);
  row.querySelector(".delete-password").addEventListener("click", deletePassword);
}

// Toggle password visibility
function togglePasswordVisibility(event) {
  const button = event.currentTarget;
  const passwordField = button.previousElementSibling;
  const icon = button.querySelector("i");

  if (passwordField.type === "password") {
    passwordField.type = "text";
    icon.classList.remove("fa-eye");
    icon.classList.add("fa-eye-slash");
    button.setAttribute("title", "Hide Password");
  } else {
    passwordField.type = "password";
    icon.classList.remove("fa-eye-slash");
    icon.classList.add("fa-eye");
    button.setAttribute("title", "Show Password");
  }
}

// Copy password to clipboard
function copyPassword(event) {
  const button = event.currentTarget;
  const passwordField = button.previousElementSibling.previousElementSibling;

  copyToClipboard(passwordField.value);
  showToast("Password copied to clipboard!");
}

// Toggle favorite status
async function toggleFavorite(event) {
  const icon = event.currentTarget;
  const passwordId = icon.dataset.id;

  icon.classList.toggle("fa-star-o");
  icon.classList.toggle("fa-star");
  icon.classList.toggle("active");

  // TODO: Update favorite status on server
  // For now, just update UI
}

// Edit password (placeholder)
function editPassword(event) {
  const passwordId = event.currentTarget.dataset.id;
  showToast("Edit functionality coming soon!", 'info');
}

// Delete password
async function deletePassword(event) {
  const passwordId = event.currentTarget.dataset.id;

  if (!confirm("Are you sure you want to delete this password?")) {
    return;
  }

  try {
    const response = await fetch(`/passwords/${passwordId}`, {
      method: 'DELETE'
    });

    const result = await response.json();

    if (result.success) {
      showToast(result.message);
      loadPasswords(); // Reload the list
    } else {
      showToast('Error deleting password: ' + result.error, 'error');
    }

  } catch (error) {
    console.error('Error deleting password:', error);
    showToast('Error deleting password. Please try again.', 'error');
  }
}

// Filter passwords
function filterPasswords() {
  const searchText = document.getElementById("search-passwords").value.toLowerCase();
  const category = document.getElementById("filter-category").value;
  const rows = document.querySelectorAll("#passwords-list tr");

  rows.forEach((row) => {
    const website = row.querySelector("td:nth-child(2)").textContent.toLowerCase();
    const username = row.querySelector("td:nth-child(3)").textContent.toLowerCase();
    const rowCategory = row.dataset.category;

    const matchesSearch = website.includes(searchText) || username.includes(searchText);
    const matchesCategory = category === "" || rowCategory === category;

    row.style.display = matchesSearch && matchesCategory ? "" : "none";
  });
}

// Sort passwords
function sortPasswords() {
  const sortBy = document.getElementById("sort-by").value;
  const tbody = document.getElementById("passwords-list");
  const rows = Array.from(tbody.querySelectorAll("tr"));

  rows.sort((a, b) => {
    if (sortBy === "name") {
      const nameA = a.querySelector("td:nth-child(2)").textContent.toLowerCase();
      const nameB = b.querySelector("td:nth-child(2)").textContent.toLowerCase();
      return nameA.localeCompare(nameB);
    } else if (sortBy === "date") {
      const dateA = new Date(a.dataset.dateAdded);
      const dateB = new Date(b.dataset.dateAdded);
      return dateB - dateA;
    } else if (sortBy === "strength") {
      const strengthA = parseInt(a.dataset.strength);
      const strengthB = parseInt(b.dataset.strength);
      return strengthB - strengthA;
    }
    return 0;
  });

  rows.forEach((row) => tbody.appendChild(row));
}

// Show/hide empty state
function showEmptyState() {
  document.getElementById("passwords-table").classList.add("d-none");
  document.getElementById("empty-state").classList.remove("d-none");
}

function hideEmptyState() {
  document.getElementById("passwords-table").classList.remove("d-none");
  document.getElementById("empty-state").classList.add("d-none");
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

// Utility functions
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    // Success handled by caller
  }).catch(() => {
    // Fallback for older browsers
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showToast(message, type = 'success') {
  let toastContainer = document.getElementById("toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toast-container";
    toastContainer.className = "position-fixed bottom-0 end-0 p-3";
    document.body.appendChild(toastContainer);
  }

  const toastId = `toast-${Date.now()}`;
  const bgClass = type === 'error' ? 'bg-danger' : type === 'info' ? 'bg-info' : 'bg-success';

  const toastHtml = `
    <div id="${toastId}" class="toast ${bgClass} text-white" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="toast-header ${bgClass} text-white border-0">
        <strong class="me-auto">ChemKey</strong>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
      <div class="toast-body">
        ${message}
      </div>
    </div>
  `;

  toastContainer.insertAdjacentHTML("beforeend", toastHtml);

  const toastElement = document.getElementById(toastId);
  const bsToast = new bootstrap.Toast(toastElement, {
    autohide: true,
    delay: 3000,
  });
  bsToast.show();

  toastElement.addEventListener("hidden.bs.toast", function () {
    toastElement.remove();
  });
}
