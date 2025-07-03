document.addEventListener("DOMContentLoaded", function () {
  // Check authentication and initialize app
  initializeApp();
});

// =============================================================================
// 🔐 AUTHENTICATION & SESSION MANAGEMENT
// =============================================================================

async function initializeApp() {
  try {
    // Verify authentication status
    const authStatus = await checkAuthentication();

    if (!authStatus.isLoggedIn) {
      // Redirect to login if not authenticated
      window.location.href = "/login?error=Access denied. Please log in first!";
      return;
    }

    // Display user info
    displayUserInfo(authStatus.user);

    // Initialize event listeners
    initializeEventListeners();

    // Load passwords from backend
    await initializePasswordList();

    // Load initial health data
    await loadPasswordHealth();
  } catch (error) {
    console.error("Erro na inicialização:", error);
    showToast("Something went wrong. Please, log in again", "error");
    setTimeout(() => (window.location.href = "/login"), 2000);
  }
}

async function checkAuthentication() {
  try {
    const response = await fetch("/auth/check", {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error at auth verification:", error);
    return { isLoggedIn: false, user: null };
  }
}

function displayUserInfo(user) {
  const userDisplay = document.getElementById("username-display");
  if (userDisplay && user) {
    userDisplay.innerHTML = `Welcome, ${escapeHtml(user.name)}`;
  }
}

// =============================================================================
// 🎯 EVENT LISTENERS SETUP
// =============================================================================

function initializeEventListeners() {
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
      const passwordGeneratorModal = new bootstrap.Modal(
        document.getElementById("passwordGeneratorModal"),
      );
      passwordGeneratorModal.show();
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

  // Clear search functionality
  const clearSearchBtn = document.getElementById("clear-search");
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener("click", function () {
      document.getElementById("search-passwords").value = "";
      filterPasswords();
    });
  }

  // Refresh passwords functionality
  const refreshPasswordsBtn = document.getElementById("refresh-passwords");
  if (refreshPasswordsBtn) {
    refreshPasswordsBtn.addEventListener("click", async function () {
      const btn = this;
      const originalHtml = btn.innerHTML;

      btn.disabled = true;
      btn.innerHTML = '<i class="fa fa-spin fa-refresh"></i>';

      try {
        await initializePasswordList();
        await loadPasswordHealth(); // Refresh health data too
        showToast("Passwords refreshed successfully!");
      } catch (error) {
        showToast("Error refreshing passwords: " + error.message, "error");
      } finally {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
      }
    });
  }

  // Standalone password generator
  setupStandaloneGenerator();

  // Password strength indicator in add modal
  setupPasswordStrengthIndicator();

  // Other functionality placeholders
  setupPlaceholderFunctionality();

  setupEditPasswordModal();
}

function setupStandaloneGenerator() {
  const standaloneElements = {
    generateBtn: document.getElementById("generate-standalone-password"),
    passwordInput: document.getElementById("standalone-generated-password"),
    copyBtn: document.getElementById("copy-standalone-password"),
    lengthSlider: document.getElementById("standalone-password-length"),
    lengthValue: document.getElementById("standalone-length-value"),
    includeUppercase: document.getElementById("standalone-include-uppercase"),
    includeLowercase: document.getElementById("standalone-include-lowercase"),
    includeNumbers: document.getElementById("standalone-include-numbers"),
    includeSymbols: document.getElementById("standalone-include-symbols"),
  };

  if (standaloneElements.generateBtn) {
    standaloneElements.generateBtn.addEventListener(
      "click",
      generateStandalonePassword,
    );

    standaloneElements.lengthSlider.addEventListener("input", function () {
      standaloneElements.lengthValue.textContent = this.value;
    });

    standaloneElements.copyBtn.addEventListener("click", function () {
      copyToClipboard(standaloneElements.passwordInput.value);
      showToast("Password copied to clipboard!");
    });

    // Generate initial password
    generateStandalonePassword();
  }

  async function generateStandalonePassword() {
    const options = {
      length: parseInt(standaloneElements.lengthSlider.value),
      includeUppercase: standaloneElements.includeUppercase.checked,
      includeLowercase: standaloneElements.includeLowercase.checked,
      includeNumbers: standaloneElements.includeNumbers.checked,
      includeSymbols: standaloneElements.includeSymbols.checked,
    };

    try {
      const result = await generatePasswordFromAPI(options);
      if (result && result.success) {
        standaloneElements.passwordInput.value = result.password;
      }
    } catch (error) {
      generatePasswordLocal(options);
      standaloneElements.passwordInput.value =
        document.getElementById("generated-password").value;
    }
  }
}

function setupPasswordStrengthIndicator() {
  const passwordInput = document.getElementById("password");
  const strengthIndicator = document.getElementById(
    "password-strength-indicator",
  );
  const strengthBar = document.getElementById("password-strength-bar");
  const strengthText = document.getElementById("password-strength-text");

  if (passwordInput) {
    passwordInput.addEventListener("input", function () {
      const password = this.value;

      if (password.length === 0) {
        strengthIndicator.classList.add("d-none");
        return;
      }

      strengthIndicator.classList.remove("d-none");

      const strength = calculatePasswordStrength(password);
      const percentage = (strength / 5) * 100;

      strengthBar.style.width = percentage + "%";
      strengthBar.className = "progress-bar";

      if (strength >= 4) {
        strengthBar.classList.add("bg-success");
        strengthText.textContent = "Strong";
      } else if (strength >= 2) {
        strengthBar.classList.add("bg-warning");
        strengthText.textContent = "Medium";
      } else {
        strengthBar.classList.add("bg-danger");
        strengthText.textContent = "Weak";
      }
    });
  }
}

function setupPlaceholderFunctionality() {
  // Change password functionality
  const changePasswordLink = document.getElementById("change-password-link");
  if (changePasswordLink) {
    changePasswordLink.addEventListener("click", function (e) {
      e.preventDefault();
      showToast("Change password functionality coming soon!", "info");
    });
  }

  // Export data functionality
  const exportDataLink = document.getElementById("export-data-link");
  if (exportDataLink) {
    exportDataLink.addEventListener("click", function (e) {
      e.preventDefault();
      showToast("Export functionality coming soon!", "info");
    });
  }

  // Import data functionality
  const importDataLink = document.getElementById("import-data-link");
  if (importDataLink) {
    importDataLink.addEventListener("click", function (e) {
      e.preventDefault();
      showToast("Import functionality coming soon!", "info");
    });
  }
}

// =============================================================================
// 📡 PASSWORD API FUNCTIONS
// =============================================================================

async function loadPasswordsFromAPI() {
  try {
    const response = await fetch("/passwords", {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401) {
      window.location.href =
        "/login?error=Session expired! Please, log in again.";
      return [];
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      return result.passwords || [];
    } else {
      throw new Error(result.error || "Error while loading passwords");
    }
  } catch (error) {
    console.error("Error while loading passwords:", error);
    showToast("Error loading passwords: " + error.message, "error");
    return [];
  }
}

async function savePasswordToAPI(passwordData) {
  try {
    const response = await fetch("/passwords", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(passwordData),
    });

    if (response.status === 401) {
      window.location.href =
        "/login?error=Session expired! Please, log in again";
      return null;
    }

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `HTTP ${response.status}`);
    }

    return result;
  } catch (error) {
    console.error("Erro ao salvar senha:", error);
    throw error;
  }
}

async function deletePasswordFromAPI(passwordId) {
  try {
    const response = await fetch(`/passwords/${passwordId}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (response.status === 401) {
      window.location.href =
        "/login?error=Session expired. Please, log in again";
      return false;
    }

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `HTTP ${response.status}`);
    }

    return result.success;
  } catch (error) {
    console.error("Erro ao deletar senha:", error);
    throw error;
  }
}

async function generatePasswordFromAPI(options = {}) {
  try {
    const response = await fetch("/passwords/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(options),
    });

    if (response.status === 401) {
      window.location.href =
        "/login?error=Session expired! Please, log in again.";
      return null;
    }

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `HTTP ${response.status}`);
    }

    return result;
  } catch (error) {
    console.error("Erro ao gerar senha:", error);
    throw error;
  }
}

// =============================================================================
// 💊 PASSWORD HEALTH API FUNCTIONS
// =============================================================================

async function loadPasswordHealth() {
  try {
    const response = await fetch("/passwords/health", {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      updateHealthDisplay(result.health);
      return result.health;
    } else {
      throw new Error(result.error || "Erro ao carregar análise");
    }
  } catch (error) {
    console.error("Erro ao carregar health:", error);
    return null;
  }
}

function updateHealthDisplay(health) {
  if (!health) return;

  // Update main statistics
  document.getElementById("total-passwords").textContent =
    health.totalPasswords;
  document.getElementById("strong-passwords").textContent =
    health.strongPasswords;
  document.getElementById("weak-passwords").textContent = health.weakPasswords;
  document.getElementById("security-score").textContent = health.overallScore;

  // Update health-specific metrics if health section is visible
  const healthWeakCount = document.getElementById("health-weak-count");
  const healthDuplicateCount = document.getElementById(
    "health-duplicate-count",
  );
  const healthOldCount = document.getElementById("health-old-count");

  if (healthWeakCount) {
    healthWeakCount.textContent = health.weakPasswords;
    healthDuplicateCount.textContent = health.duplicatePasswords;
    healthOldCount.textContent = health.oldPasswords;
  }
}

async function loadPasswordForEdit(passwordId) {
  try {
    const response = await fetch(`/passwords/${passwordId}`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401) {
      window.location.href =
        "/login?error=Session expired. Please log in again.";
      return;
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      populateEditModal(result.password);
    } else {
      throw new Error(result.error || "Error loading password");
    }
  } catch (error) {
    console.error("Error loading password:", error);
    throw error;
  }
}

function populateEditModal(password) {
  document.getElementById("edit-password-id").value = password.id;
  document.getElementById("edit-website").value = password.website;
  document.getElementById("edit-username").value = password.username;
  document.getElementById("edit-password").value = password.password;
  document.getElementById("edit-category").value = password.category;
  document.getElementById("edit-notes").value = password.notes || "";
  document.getElementById("edit-favorite").checked = password.favorite;

  // Atualizar indicador de força da senha
  const event = new Event("input");
  document.getElementById("edit-password").dispatchEvent(event);

  // Esconder alerta de mudança de senha
  const alert = document.getElementById("password-change-alert");
  if (alert) {
    alert.classList.add("d-none");
  }
}

async function updatePassword() {
  const passwordId = document.getElementById("edit-password-id").value;
  const website = document.getElementById("edit-website").value;
  const username = document.getElementById("edit-username").value;
  const password = document.getElementById("edit-password").value;
  const category = document.getElementById("edit-category").value;
  const notes = document.getElementById("edit-notes").value;
  const favorite = document.getElementById("edit-favorite").checked;

  if (!website || !username || !password) {
    showToast("Please fill out all required fields.", "error");
    return;
  }

  // Show loading state
  const updateBtn = document.getElementById("update-password");
  const btnContent = updateBtn.querySelector(".btn-content");
  const btnLoading = updateBtn.querySelector(".btn-loading");

  btnContent.classList.add("d-none");
  btnLoading.classList.remove("d-none");
  updateBtn.disabled = true;

  try {
    const passwordData = {
      website: website.trim(),
      username: username.trim(),
      password: password,
      category: category || "other",
      notes: notes?.trim() || "",
      favorite: favorite,
    };

    const response = await fetch(`/passwords/${passwordId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(passwordData),
    });

    if (response.status === 401) {
      window.location.href =
        "/login?error=Session expired. Please log in again.";
      return;
    }

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `HTTP ${response.status}`);
    }

    if (result.success) {
      showToast("Password updated successfully!");

      const modal = bootstrap.Modal.getInstance(
        document.getElementById("editPasswordModal"),
      );
      modal.hide();

      await initializePasswordList();
      await loadPasswordHealth();
    }
  } catch (error) {
    console.error("Error updating password:", error);
    showToast("Error updating password: " + error.message, "error");
  } finally {
    btnContent.classList.remove("d-none");
    btnLoading.classList.add("d-none");
    updateBtn.disabled = false;
  }
}

async function deletePasswordFromModal() {
  const passwordId = document.getElementById("edit-password-id").value;

  if (!confirm("Are you sure you want to delete this password?")) {
    return;
  }

  try {
    const success = await deletePasswordFromAPI(passwordId);

    if (success) {
      showToast("Password deleted successfully!");

      const modal = bootstrap.Modal.getInstance(
        document.getElementById("editPasswordModal"),
      );
      modal.hide();

      await initializePasswordList();
      await loadPasswordHealth();
    }
  } catch (error) {
    console.error("Error deleting password:", error);
    showToast("Error deleting password: " + error.message, "error");
  }
}

function setupEditPasswordModal() {
  const updateBtn = document.getElementById("update-password");
  if (updateBtn) {
    updateBtn.addEventListener("click", updatePassword);
  }

  const deleteBtn = document.getElementById("delete-password-modal");
  if (deleteBtn) {
    deleteBtn.addEventListener("click", deletePasswordFromModal);
  }

  const editGenerateBtn = document.getElementById("edit-generate-password");
  if (editGenerateBtn) {
    editGenerateBtn.addEventListener("click", function () {
      const passwordGeneratorModal = new bootstrap.Modal(
        document.getElementById("passwordGeneratorModal"),
      );

      document.getElementById("passwordGeneratorModal").dataset.editMode =
        "true";
      passwordGeneratorModal.show();
      generatePassword();
    });
  }

  const editToggleBtn = document.querySelector(
    "#editPasswordModal .toggle-password",
  );
  if (editToggleBtn) {
    editToggleBtn.addEventListener("click", togglePasswordVisibility);
  }

  setupEditPasswordStrengthIndicator();

  // Alerta de mudança de senha
  const editPasswordInput = document.getElementById("edit-password");
  if (editPasswordInput) {
    let originalPassword = "";

    document
      .getElementById("editPasswordModal")
      .addEventListener("shown.bs.modal", function () {
        originalPassword = editPasswordInput.value;
      });

    editPasswordInput.addEventListener("input", function () {
      const alert = document.getElementById("password-change-alert");
      if (alert && this.value !== originalPassword) {
        alert.classList.remove("d-none");
      } else if (alert) {
        alert.classList.add("d-none");
      }
    });
  }
}

function setupEditPasswordStrengthIndicator() {
  const editPasswordInput = document.getElementById("edit-password");
  const editStrengthIndicator = document.getElementById(
    "edit-password-strength-indicator",
  );
  const editStrengthBar = document.getElementById("edit-password-strength-bar");
  const editStrengthText = document.getElementById(
    "edit-password-strength-text",
  );

  if (editPasswordInput) {
    editPasswordInput.addEventListener("input", function () {
      const password = this.value;

      if (password.length === 0) {
        editStrengthIndicator.classList.add("d-none");
        return;
      }

      editStrengthIndicator.classList.remove("d-none");

      const strength = calculatePasswordStrength(password);
      const percentage = (strength / 5) * 100;

      editStrengthBar.style.width = percentage + "%";
      editStrengthBar.className = "progress-bar";

      if (strength >= 4) {
        editStrengthBar.classList.add("bg-success");
        editStrengthText.textContent = "Strong";
      } else if (strength >= 2) {
        editStrengthBar.classList.add("bg-warning");
        editStrengthText.textContent = "Medium";
      } else {
        editStrengthBar.classList.add("bg-danger");
        editStrengthText.textContent = "Weak";
      }
    });
  }
}

// =============================================================================
// 💊 FUNÇÕES DE PASSWORD HEALTH - VERSÃO SIMPLIFICADA QUE FUNCIONA
// =============================================================================

async function loadHealthDetails() {
  console.log("🔍 loadHealthDetails() iniciada - versão auto-suficiente!");

  // 1. Carregar e renderizar senhas fracas
  try {
    console.log("📡 Buscando senhas fracas...");
    const weakResponse = await fetch("/passwords/health/weak", {
      credentials: "include",
    });
    const weakData = await weakResponse.json();

    console.log("📊 Dados weak:", weakData);

    const weakContainer = document.getElementById("weak-passwords-list");
    if (!weakContainer) {
      console.error("❌ Elemento weak-passwords-list não encontrado!");
      return;
    }

    if (weakData.success) {
      if (weakData.weakPasswords.length === 0) {
        weakContainer.innerHTML = `
          <div class="alert alert-success">
            <i class="fa fa-check me-2"></i>Great! No weak passwords found.
          </div>`;
      } else {
        let html = "";
        weakData.weakPasswords.forEach((pwd) => {
          html += `
            <div class="health-item p-3 mb-2" style="border-left: 4px solid #dc3545; background: #f8f9fa;">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <strong>${pwd.website}</strong><br>
                  <small class="text-muted">${pwd.username}</small>
                </div>
                <div>
                  <span class="badge bg-danger">Strength: ${pwd.strength}/5</span>
                </div>
              </div>
            </div>`;
        });
        weakContainer.innerHTML = html;
        console.log("✅ Senhas fracas renderizadas!");
      }
    } else {
      weakContainer.innerHTML = `
        <div class="alert alert-danger">
          Error loading weak passwords: ${weakData.error}
        </div>`;
    }
  } catch (error) {
    console.error("❌ Erro ao carregar senhas fracas:", error);
    const weakContainer = document.getElementById("weak-passwords-list");
    if (weakContainer) {
      weakContainer.innerHTML = `
        <div class="alert alert-danger">
          Error loading weak passwords: ${error.message}
        </div>`;
    }
  }

  // 2. Carregar e renderizar duplicadas
  try {
    console.log("📡 Buscando senhas duplicadas...");
    const dupResponse = await fetch("/passwords/health/duplicates", {
      credentials: "include",
    });
    const dupData = await dupResponse.json();

    console.log("📊 Dados duplicates:", dupData);

    const dupContainer = document.getElementById("duplicate-passwords-list");
    if (!dupContainer) {
      console.error("❌ Elemento duplicate-passwords-list não encontrado!");
      return;
    }

    if (dupData.success) {
      if (dupData.duplicates.length === 0) {
        dupContainer.innerHTML = `
          <div class="alert alert-success">
            <i class="fa fa-check me-2"></i>Excellent! No duplicate passwords found.
          </div>`;
      } else {
        let html = "";
        dupData.duplicates.forEach((dup) => {
          const websites = dup.accounts.map((acc) => acc.website).join(", ");
          html += `
            <div class="health-item p-3 mb-2" style="border-left: 4px solid #ffc107; background: #f8f9fa;">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <strong>Password used ${dup.count} times</strong><br>
                  <small class="text-muted">${websites}</small>
                </div>
                <div>
                  <span class="badge bg-warning text-dark">${dup.count} accounts</span>
                </div>
              </div>
            </div>`;
        });
        dupContainer.innerHTML = html;
        console.log("✅ Senhas duplicadas renderizadas!");
      }
    } else {
      dupContainer.innerHTML = `
        <div class="alert alert-danger">
          Error loading duplicates: ${dupData.error}
        </div>`;
    }
  } catch (error) {
    console.error("❌ Erro ao carregar senhas duplicadas:", error);
    const dupContainer = document.getElementById("duplicate-passwords-list");
    if (dupContainer) {
      dupContainer.innerHTML = `
        <div class="alert alert-danger">
          Error loading duplicates: ${error.message}
        </div>`;
    }
  }

  // 3. Carregar e renderizar senhas antigas
  try {
    console.log("📡 Buscando senhas antigas...");
    const oldResponse = await fetch("/passwords/health/old", {
      credentials: "include",
    });
    const oldData = await oldResponse.json();

    console.log("📊 Dados old:", oldData);

    const oldContainer = document.getElementById("old-passwords-list");
    if (!oldContainer) {
      console.error("❌ Elemento old-passwords-list não encontrado!");
      return;
    }

    if (oldData.success) {
      if (oldData.oldPasswords.length === 0) {
        oldContainer.innerHTML = `
          <div class="alert alert-success">
            <i class="fa fa-check me-2"></i>All passwords are recently updated!
          </div>`;
      } else {
        let html = "";
        oldData.oldPasswords.forEach((pwd) => {
          html += `
            <div class="health-item p-3 mb-2" style="border-left: 4px solid #17a2b8; background: #f8f9fa;">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <strong>${pwd.website}</strong><br>
                  <small class="text-muted">${pwd.username}</small>
                </div>
                <div>
                  <span class="badge bg-info">${pwd.daysOld} days old</span>
                </div>
              </div>
            </div>`;
        });
        oldContainer.innerHTML = html;
        console.log("✅ Senhas antigas renderizadas!");
      }
    } else {
      oldContainer.innerHTML = `
        <div class="alert alert-danger">
          Error loading old passwords: ${oldData.error}
        </div>`;
    }
  } catch (error) {
    console.error("❌ Erro ao carregar senhas antigas:", error);
    const oldContainer = document.getElementById("old-passwords-list");
    if (oldContainer) {
      oldContainer.innerHTML = `
        <div class="alert alert-danger">
          Error loading old passwords: ${error.message}
        </div>`;
    }
  }

  console.log("✅ loadHealthDetails() finalizada com sucesso!");
}

// =============================================================================
// 🎯 CONFIGURAÇÃO DE EVENT LISTENERS
// =============================================================================

function setupHealthEventListeners() {
  console.log("🎯 Configurando event listeners para health...");

  // Event listener para o clique na aba Health
  const healthNavLink = document.querySelector('[data-section="health"]');
  if (healthNavLink) {
    healthNavLink.addEventListener("click", function () {
      console.log("🎯 Aba Health clicada!");
      setTimeout(() => {
        loadHealthDetails();
      }, 200);
    });
    console.log("✅ Event listener da aba Health configurado!");
  } else {
    console.error("❌ Link da aba Health não encontrado!");
  }

  // Event listener para o botão refresh
  const refreshHealthBtn = document.getElementById("refresh-health");
  if (refreshHealthBtn) {
    refreshHealthBtn.addEventListener("click", function () {
      console.log("🔄 Refresh Health clicado!");
      loadHealthDetails();
    });
    console.log("✅ Event listener do refresh configurado!");
  } else {
    console.error("❌ Botão refresh health não encontrado!");
  }
}

// =============================================================================
// 🧪 FUNÇÃO DE TESTE COMPLETA
// =============================================================================

function testHealthSystem() {
  console.log("🧪 Testando sistema de health - versão auto-suficiente...");

  // Verificar se os elementos existem
  const elements = [
    "weak-passwords-list",
    "duplicate-passwords-list",
    "old-passwords-list",
  ];

  elements.forEach((id) => {
    const el = document.getElementById(id);
    console.log(`📍 ${id}:`, el ? "✅ Encontrado" : "❌ Não encontrado");
  });

  // Verificar se a aba health existe
  const healthTab = document.querySelector('[data-section="health"]');
  console.log(
    "📍 Health tab:",
    healthTab ? "✅ Encontrado" : "❌ Não encontrado",
  );

  // Testar carregamento
  console.log("🚀 Iniciando teste de carregamento...");
  loadHealthDetails();
}

// =============================================================================
// 🌍 DISPONIBILIZAR FUNÇÕES GLOBALMENTE
// =============================================================================

// Tornar funções disponíveis globalmente
window.loadHealthDetails = loadHealthDetails;
window.testHealthSystem = testHealthSystem;
window.setupHealthEventListeners = setupHealthEventListeners;

// =============================================================================
// 🚀 INICIALIZAÇÃO AUTOMÁTICA
// =============================================================================

// Configurar quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", function () {
  console.log("🚀 DOM carregado - configurando health system...");

  // Configurar event listeners
  setupHealthEventListeners();

  // Se já estiver na aba health, carregar dados
  const healthSection = document.getElementById("health-section");
  if (healthSection && !healthSection.classList.contains("d-none")) {
    console.log("🎯 Já na aba health - carregando dados...");
    setTimeout(() => {
      loadHealthDetails();
    }, 500);
  }
});

// =============================================================================
// 🎯 PASSWORD MANAGEMENT FUNCTIONS
// =============================================================================

async function initializePasswordList() {
  try {
    const passwords = await loadPasswordsFromAPI();

    if (passwords.length === 0) {
      document.getElementById("passwords-table").classList.add("d-none");
      document.getElementById("empty-state").classList.remove("d-none");
    } else {
      document.getElementById("passwords-table").classList.remove("d-none");
      document.getElementById("empty-state").classList.add("d-none");
      renderPasswordsList(passwords);
    }
  } catch (error) {
    console.error("Erro ao inicializar lista de senhas:", error);
    showToast("Error loading passwords", "error");
  }
}

async function savePassword() {
  const website = document.getElementById("website").value;
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const category = document.getElementById("category").value;
  const notes = document.getElementById("notes").value;

  if (!website || !username || !password) {
    showToast("Please fill out all required fields.", "error");
    return;
  }

  // Show loading state
  const saveBtn = document.getElementById("save-password");
  const btnContent = saveBtn.querySelector(".btn-content");
  const btnLoading = saveBtn.querySelector(".btn-loading");

  btnContent.classList.add("d-none");
  btnLoading.classList.remove("d-none");
  saveBtn.disabled = true;

  try {
    const passwordData = {
      website: website.trim(),
      username: username.trim(),
      password: password,
      category: category || "other",
      notes: notes?.trim() || "",
    };

    const result = await savePasswordToAPI(passwordData);

    if (result && result.success) {
      showToast("Password saved successfully!");

      const modal = bootstrap.Modal.getInstance(
        document.getElementById("addPasswordModal"),
      );
      modal.hide();

      document.getElementById("add-password-form").reset();

      // Hide strength indicator
      document
        .getElementById("password-strength-indicator")
        .classList.add("d-none");

      await initializePasswordList();
      await loadPasswordHealth(); // Refresh health data
    }
  } catch (error) {
    console.error("Erro ao salvar senha:", error);
    showToast("Error saving password: " + error.message, "error");
  } finally {
    btnContent.classList.remove("d-none");
    btnLoading.classList.add("d-none");
    saveBtn.disabled = false;
  }
}

async function deletePassword(event) {
  const row = event.currentTarget.closest("tr");
  const passwordId = row.dataset.id;

  if (!confirm("Are you sure you want to delete this password?")) {
    return;
  }

  try {
    const success = await deletePasswordFromAPI(passwordId);

    if (success) {
      row.remove();
      showToast("Password deleted successfully!");

      const remainingRows = document.querySelectorAll("#passwords-list tr");
      if (remainingRows.length === 0) {
        document.getElementById("passwords-table").classList.add("d-none");
        document.getElementById("empty-state").classList.remove("d-none");
      }

      await loadPasswordHealth(); // Refresh health data
    }
  } catch (error) {
    console.error("Erro ao deletar senha:", error);
    showToast("Error deleting password: " + error.message, "error");
  }
}

// =============================================================================
// 🎲 PASSWORD GENERATOR
// =============================================================================

async function generatePassword() {
  const length = parseInt(document.getElementById("password-length").value);
  const includeUppercase = document.getElementById("include-uppercase").checked;
  const includeLowercase = document.getElementById("include-lowercase").checked;
  const includeNumbers = document.getElementById("include-numbers").checked;
  const includeSymbols = document.getElementById("include-symbols").checked;

  const options = {
    length,
    includeUppercase,
    includeLowercase,
    includeNumbers,
    includeSymbols,
  };

  try {
    const result = await generatePasswordFromAPI(options);

    if (result && result.success) {
      document.getElementById("generated-password").value = result.password;
    }
  } catch (error) {
    console.error("Erro ao gerar senha:", error);
    generatePasswordLocal(options);
  }
}

function generatePasswordLocal(options) {
  const {
    length = 16,
    includeUppercase = true,
    includeLowercase = true,
    includeNumbers = true,
    includeSymbols = true,
  } = options;

  let charset = "";
  if (includeLowercase) charset += "abcdefghijklmnopqrstuvwxyz";
  if (includeUppercase) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (includeNumbers) charset += "0123456789";
  if (includeSymbols) charset += "!@#$%^&*()-_=+[]{}|;:,.<>?";

  if (charset === "") charset = "abcdefghijklmnopqrstuvwxyz";

  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }

  document.getElementById("generated-password").value = password;
}

function useGeneratedPassword() {
  const generatedPassword = document.getElementById("generated-password").value;
  const modal = document.getElementById("passwordGeneratorModal");

  // Verificar se estamos em modo de edição
  if (modal.dataset.editMode === "true") {
    document.getElementById("edit-password").value = generatedPassword;

    // Trigger strength indicator update para edit modal
    const event = new Event("input");
    document.getElementById("edit-password").dispatchEvent(event);

    // Limpar flag de modo de edição
    delete modal.dataset.editMode;
  } else {
    // Modo normal - modal de adicionar
    document.getElementById("password").value = generatedPassword;

    // Trigger strength indicator update para add modal
    const event = new Event("input");
    document.getElementById("password").dispatchEvent(event);
  }

  // Fechar modal do gerador
  const generatorModal = bootstrap.Modal.getInstance(
    document.getElementById("passwordGeneratorModal"),
  );
  generatorModal.hide();
}

// =============================================================================
// 🎨 UI HELPER FUNCTIONS
// =============================================================================

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

function copyPassword(event) {
  const button = event.currentTarget;
  const passwordField = button.previousElementSibling.previousElementSibling;

  if (!passwordField) return;

  copyToClipboard(passwordField.value);
  showToast("Password copied to clipboard!");
}

function copyToClipboard(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

async function editPassword(event) {
  const row = event.currentTarget.closest("tr");
  const passwordId = row.dataset.id;

  if (!passwordId) {
    showToast("Password ID not found", "error");
    return;
  }

  try {
    await loadPasswordForEdit(passwordId);
    const editModal = new bootstrap.Modal(
      document.getElementById("editPasswordModal"),
    );
    editModal.show();
  } catch (error) {
    console.error("Error loading password for edit:", error);
    showToast("Error loading password: " + error.message, "error");
  }
}

// =============================================================================
// 🔍 FILTERING AND SORTING
// =============================================================================

function filterPasswords() {
  const searchText = document
    .getElementById("search-passwords")
    .value.toLowerCase();
  const category = document.getElementById("filter-category").value;

  const rows = document.querySelectorAll("#passwords-list tr");

  rows.forEach((row) => {
    const website = row
      .querySelector("td:nth-child(2)")
      .textContent.toLowerCase();
    const username = row
      .querySelector("td:nth-child(3)")
      .textContent.toLowerCase();
    const rowCategory = row.dataset.category;

    const matchesSearch =
      website.includes(searchText) || username.includes(searchText);
    const matchesCategory = category === "" || rowCategory === category;

    if (matchesSearch && matchesCategory) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });
}

function sortPasswords() {
  const sortBy = document.getElementById("sort-by").value;
  const tbody = document.getElementById("passwords-list");
  const rows = Array.from(tbody.querySelectorAll("tr"));

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
      return dateB - dateA;
    } else if (sortBy === "strength") {
      const strengthA = parseInt(a.dataset.strength);
      const strengthB = parseInt(b.dataset.strength);
      return strengthB - strengthA;
    } else if (sortBy === "category") {
      const categoryA = a.dataset.category;
      const categoryB = b.dataset.category;
      return categoryA.localeCompare(categoryB);
    }
    return 0;
  });

  rows.forEach((row) => tbody.appendChild(row));
}

// =============================================================================
// 📊 PASSWORD RENDERING
// =============================================================================

function calculatePasswordStrength(password) {
  let strength = 0;

  if (password.length >= 12) {
    strength += 2;
  } else if (password.length >= 8) {
    strength += 1;
  }

  if (/[A-Z]/.test(password)) strength += 1;
  if (/[a-z]/.test(password)) strength += 1;
  if (/[0-9]/.test(password)) strength += 1;
  if (/[^A-Za-z0-9]/.test(password)) strength += 1;

  return Math.min(5, strength);
}

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

      // TODO: Update favorite status via API
      showToast("Favorite status updated!", "info");
    });
    tr.querySelector(".edit-password").addEventListener("click", editPassword);
    tr.querySelector(".delete-password").addEventListener(
      "click",
      deletePassword,
    );

    tbody.appendChild(tr);
  });
}

// =============================================================================
// 🛠️ UTILITY FUNCTIONS
// =============================================================================

function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, function (m) {
    return map[m];
  });
}

function showToast(message, type = "success") {
  let toastContainer = document.getElementById("toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toast-container";
    toastContainer.className = "position-fixed bottom-0 end-0 p-3";
    document.body.appendChild(toastContainer);
  }

  const toastId = `toast-${Date.now()}`;
  const toastClass =
    type === "error"
      ? "text-bg-danger"
      : type === "info"
        ? "text-bg-info"
        : "text-bg-success";

  const toastHtml = `
    <div id="${toastId}" class="toast ${toastClass}" role="alert" aria-live="assertive" aria-atomic="true">
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

  const toastElement = document.getElementById(toastId);
  const bsToast = new bootstrap.Toast(toastElement, {
    autohide: true,
    delay: type === "error" ? 5000 : 3000,
  });
  bsToast.show();

  toastElement.addEventListener("hidden.bs.toast", function () {
    toastElement.remove();
  });
}

// =============================================================================
// 🌍 GLOBAL FUNCTIONS FOR INLINE SCRIPTS
// =============================================================================

// Make these functions available globally for the inline scripts in app.ejs
window.loadPasswordHealth = loadPasswordHealth;
window.updateHealthDisplay = updateHealthDisplay;
window.escapeHtml = escapeHtml;
window.showToast = showToast;
