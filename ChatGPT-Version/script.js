const STORAGE_KEY = "um_users_v3";

/* DOM */
const userForm = document.getElementById("userForm");
const editId = document.getElementById("editId");

const fullNameEl = document.getElementById("fullName");
const emailEl = document.getElementById("email");
const phoneEl = document.getElementById("phone");
const passwordEl = document.getElementById("password");
const confirmPasswordEl = document.getElementById("confirmPassword");

const roleValueEl = document.getElementById("roleValue");
const roleLabel = document.getElementById("roleLabel");

const formTitle = document.getElementById("formTitle");
const submitBtn = document.getElementById("submitBtn");
const resetBtn = document.getElementById("resetBtn");
const modeChip = document.getElementById("modeChip");

const userList = document.getElementById("userList");
const userCount = document.getElementById("userCount");
const emptyState = document.getElementById("emptyState");

const searchInput = document.getElementById("searchInput");

/* Toast */
const toast = document.getElementById("toast");
const toastTitle = document.getElementById("toastTitle");
const toastMsg = document.getElementById("toastMsg");
const toastDot = document.getElementById("toastDot");
const toastClose = document.getElementById("toastClose");

/* Password toggles */
document.getElementById("togglePassword").addEventListener("click", () => {
  passwordEl.type = passwordEl.type === "password" ? "text" : "password";
});
document.getElementById("toggleConfirmPassword").addEventListener("click", () => {
  confirmPasswordEl.type = confirmPasswordEl.type === "password" ? "text" : "password";
});

/* Custom dropdown: SORT */
const sortDropdown = document.getElementById("sortDropdown");
const sortBtn = document.getElementById("sortBtn");
const sortMenu = document.getElementById("sortMenu");
const sortLabel = document.getElementById("sortLabel");
let currentSort = "newest";

/* Custom dropdown: ROLE */
const roleDropdown = document.getElementById("roleDropdown");
const roleBtn = document.getElementById("roleBtn");
const roleMenu = document.getElementById("roleMenu");

let lastUpdatedId = null;

/* Utils */
function uid() {
  return "u_" + Date.now() + "_" + Math.random().toString(16).slice(2);
}

function getUsers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function initialsFromName(name) {
  const parts = name.trim().split(/\s+/).slice(0,2);
  return parts.map(p => p[0]?.toUpperCase() || "").join("");
}

/* Toast */
function showToast(title, msg, type="ok") {
  toastTitle.textContent = title;
  toastMsg.textContent = msg;
  toastDot.style.background = (type === "ok") ? "#16a34a" : "#b00020";
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("show"), 2500);
}
toastClose.addEventListener("click", () => toast.classList.remove("show"));

/* Validation */
function setError(inputEl, errorElId, msg) {
  const err = document.getElementById(errorElId);
  err.textContent = msg || "";
  if (inputEl) {
    if (msg) inputEl.classList.add("invalid");
    else inputEl.classList.remove("invalid");
  }
}

function clearErrors() {
  setError(fullNameEl, "errFullName", "");
  setError(emailEl, "errEmail", "");
  // role is custom, no input element border
  document.getElementById("errRole").textContent = "";
  setError(phoneEl, "errPhone", "");
  setError(passwordEl, "errPassword", "");
  setError(confirmPasswordEl, "errConfirmPassword", "");
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

function emailExists(email, excludeId = null) {
  const users = getUsers();
  return users.some(u => u.email.toLowerCase() === email.toLowerCase() && u.id !== excludeId);
}

function validateForm(isEdit) {
  let ok = true;

  const fullName = fullNameEl.value.trim();
  const email = emailEl.value.trim();
  const role = roleValueEl.value.trim();
  const phone = phoneEl.value.trim();
  const password = passwordEl.value;
  const confirmPassword = confirmPasswordEl.value;

  if (!fullName) { setError(fullNameEl, "errFullName", "Full name is required."); ok = false; }
  else setError(fullNameEl, "errFullName", "");

  if (!email) { setError(emailEl, "errEmail", "Email is required."); ok = false; }
  else if (!isValidEmail(email)) { setError(emailEl, "errEmail", "Enter a valid email address."); ok = false; }
  else setError(emailEl, "errEmail", "");

  if (!role) {
    document.getElementById("errRole").textContent = "Role is required.";
    ok = false;
  } else {
    document.getElementById("errRole").textContent = "";
  }

  if (phone && phone.replace(/\D/g, "").length < 9) {
    setError(phoneEl, "errPhone", "Phone number looks too short.");
    ok = false;
  } else setError(phoneEl, "errPhone", "");

  if (!isEdit) {
    if (!password) { setError(passwordEl, "errPassword", "Password is required."); ok = false; }
    else if (password.length < 8) { setError(passwordEl, "errPassword", "Password must be at least 8 characters."); ok = false; }
    else setError(passwordEl, "errPassword", "");

    if (!confirmPassword) { setError(confirmPasswordEl, "errConfirmPassword", "Confirm your password."); ok = false; }
    else if (confirmPassword !== password) { setError(confirmPasswordEl, "errConfirmPassword", "Passwords do not match."); ok = false; }
    else setError(confirmPasswordEl, "errConfirmPassword", "");
  } else {
    if (password) {
      if (password.length < 8) { setError(passwordEl, "errPassword", "Password must be at least 8 characters."); ok = false; }
      else setError(passwordEl, "errPassword", "");

      if (!confirmPassword) { setError(confirmPasswordEl, "errConfirmPassword", "Confirm your new password."); ok = false; }
      else if (confirmPassword !== password) { setError(confirmPasswordEl, "errConfirmPassword", "Passwords do not match."); ok = false; }
      else setError(confirmPasswordEl, "errConfirmPassword", "");
    } else {
      setError(passwordEl, "errPassword", "");
      setError(confirmPasswordEl, "errConfirmPassword", "");
    }
  }

  return ok;
}

/* Render */
function applySearchAndSort(users) {
  const q = searchInput.value.trim().toLowerCase();
  let filtered = users.filter(u => {
    const hay = `${u.fullName} ${u.email} ${u.role} ${u.phone || ""}`.toLowerCase();
    return hay.includes(q);
  });

  if (currentSort === "newest") filtered.sort((a,b) => b.createdAt - a.createdAt);
  if (currentSort === "oldest") filtered.sort((a,b) => a.createdAt - b.createdAt);
  if (currentSort === "nameAZ") filtered.sort((a,b) => a.fullName.localeCompare(b.fullName));
  if (currentSort === "nameZA") filtered.sort((a,b) => b.fullName.localeCompare(a.fullName));

  return filtered;
}

function renderUsers() {
  const users = getUsers();
  const shown = applySearchAndSort(users);

  userCount.textContent = `${users.length} user${users.length === 1 ? "" : "s"}`;

  if (users.length === 0) {
    emptyState.style.display = "block";
    userList.innerHTML = "";
    return;
  }
  emptyState.style.display = "none";

  if (shown.length === 0) {
    userList.innerHTML = `
      <div class="empty" style="padding:16px;">
        <div class="empty-icon">🔎</div>
        <h3>No matches</h3>
        <p>Try a different search.</p>
      </div>
    `;
    return;
  }

  userList.innerHTML = shown.map(u => {
    const updatedClass = (u.id === lastUpdatedId) ? "updated" : "";
    const savedTime = new Date(u.createdAt).toLocaleString();
    const initials = initialsFromName(u.fullName);

    return `
      <div class="user-card ${updatedClass}">
        <div class="user-top">
          <div class="user-left">
            <div class="avatar">${escapeHtml(initials)}</div>
            <div>
              <p class="user-name">${escapeHtml(u.fullName)}</p>
              <div class="user-meta">
                <span class="badge role">${escapeHtml(u.role)}</span>
                <span class="badge email">${escapeHtml(u.email)}</span>
                ${u.phone ? `<span class="badge phone">${escapeHtml(u.phone)}</span>` : ""}
              </div>
              <div class="small-muted">Saved: ${escapeHtml(savedTime)}</div>
            </div>
          </div>

          <div class="icon-actions">
            <button class="icon-btn" title="Edit" onclick="startEdit('${u.id}')">✏️</button>
            <button class="icon-btn danger" title="Delete" onclick="deleteUser('${u.id}')">🗑️</button>
          </div>
        </div>
      </div>
    `;
  }).join("");

  if (lastUpdatedId) {
    clearTimeout(renderUsers._t);
    renderUsers._t = setTimeout(() => {
      lastUpdatedId = null;
      renderUsers();
    }, 2200);
  }
}

/* CRUD */
userForm.addEventListener("submit", (e) => {
  e.preventDefault();
  clearErrors();

  const isEdit = Boolean(editId.value);
  if (!validateForm(isEdit)) return;

  const fullName = fullNameEl.value.trim();
  const email = emailEl.value.trim();
  const role = roleValueEl.value.trim();
  const phone = phoneEl.value.trim();
  const password = passwordEl.value;

  if (emailExists(email, isEdit ? editId.value : null)) {
    setError(emailEl, "errEmail", "This email is already registered.");
    return;
  }

  const users = getUsers();

  if (!isEdit) {
    users.push({
      id: uid(),
      fullName,
      email,
      role,
      phone: phone || "",
      password,
      createdAt: Date.now(),
      updatedAt: null
    });
    saveUsers(users);
    showToast("Success ✅", "You successfully registered.");
    resetForm();
    renderUsers();
    return;
  }

  const id = editId.value;
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return;

  users[idx] = {
    ...users[idx],
    fullName,
    email,
    role,
    phone: phone || "",
    password: password ? password : users[idx].password,
    updatedAt: Date.now()
  };

  saveUsers(users);
  lastUpdatedId = id;
  showToast("Updated ✅", "Record updated successfully.");
  resetForm();
  renderUsers();
});

window.startEdit = function(id) {
  const u = getUsers().find(x => x.id === id);
  if (!u) return;

  editId.value = u.id;
  fullNameEl.value = u.fullName;
  emailEl.value = u.email;

  // set role custom dropdown
  roleValueEl.value = u.role;
  roleLabel.textContent = u.role;

  phoneEl.value = u.phone || "";
  passwordEl.value = "";
  confirmPasswordEl.value = "";

  formTitle.textContent = "Edit User";
  submitBtn.textContent = "Update User";
  modeChip.textContent = "EDIT";

  window.scrollTo({ top: 0, behavior: "smooth" });
};

window.deleteUser = function(id) {
  const users = getUsers();
  const u = users.find(x => x.id === id);
  if (!u) return;

  if (!confirm(`Delete user "${u.fullName}"?`)) return;

  saveUsers(users.filter(x => x.id !== id));
  if (editId.value === id) resetForm();
  showToast("Deleted 🗑️", "Record deleted successfully.");
  renderUsers();
};

function resetForm() {
  userForm.reset();
  editId.value = "";
  formTitle.textContent = "Create User";
  submitBtn.textContent = "Save User";
  modeChip.textContent = "CREATE";

  // reset role dropdown
  roleValueEl.value = "";
  roleLabel.textContent = "Select role";

  clearErrors();
  passwordEl.type = "password";
  confirmPasswordEl.type = "password";
}
resetBtn.addEventListener("click", resetForm);

/* Search */
searchInput.addEventListener("input", renderUsers);

/* ✅ Dropdown helpers */
function setupDropdown(dropdownEl, btnEl, menuEl, onPick) {
  btnEl.addEventListener("click", () => dropdownEl.classList.toggle("open"));

  menuEl.addEventListener("click", (e) => {
    const item = e.target.closest(".select-item");
    if (!item) return;
    onPick(item.dataset.value, item.textContent);
    dropdownEl.classList.remove("open");
  });
}

/* SORT dropdown */
setupDropdown(sortDropdown, sortBtn, sortMenu, (value, text) => {
  currentSort = value;
  sortLabel.textContent = text;
  renderUsers();
});

/* ROLE dropdown */
setupDropdown(roleDropdown, roleBtn, roleMenu, (value, text) => {
  roleValueEl.value = value;
  roleLabel.textContent = text;
});

/* Close dropdowns when clicking outside */
document.addEventListener("click", (e) => {
  if (!sortDropdown.contains(e.target)) sortDropdown.classList.remove("open");
  if (!roleDropdown.contains(e.target)) roleDropdown.classList.remove("open");
});

/* Init */
renderUsers();
