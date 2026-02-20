/* ═══════════════════════════════════════════
   USERVAULT — APPLICATION LOGIC
   app.js
═══════════════════════════════════════════ */

/* ── STATE ───────────────────────────────── */
const STORE_KEY = 'uv_users_v2';

let users      = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
let editingId  = null;
let deletingId = null;
let toastTimer = null;

/* Avatar palettes [ text-color, bg-color ] — vibrant, readable on light cards */
const PALETTES = [
  ['#fff', 'linear-gradient(135deg,#5b4ef8,#9b8dff)'],   // violet
  ['#fff', 'linear-gradient(135deg,#e8407a,#f47db0)'],   // rose
  ['#fff', 'linear-gradient(135deg,#0cb87e,#40d9a8)'],   // teal
  ['#fff', 'linear-gradient(135deg,#e88c0c,#f5b942)'],   // amber
  ['#fff', 'linear-gradient(135deg,#0e87cc,#4fbde8)'],   // sky
  ['#fff', 'linear-gradient(135deg,#9b30cc,#c87de8)'],   // purple
];


/* ══════════════════════════════════════════
   HELPERS
══════════════════════════════════════════ */

function getAvatar(fullName, id) {
  const idx        = id.charCodeAt(0) % PALETTES.length;
  const [fg, bg]   = PALETTES[idx];
  const initials   = (fullName || 'U')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return { initials, fg, bg };
}

function save() {
  localStorage.setItem(STORE_KEY, JSON.stringify(users));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}


/* ══════════════════════════════════════════
   RENDER
══════════════════════════════════════════ */

function renderCards() {
  const q    = document.getElementById('searchInput').value.toLowerCase();
  const sort = document.getElementById('sortSelect').value;

  let list = [...users];
  if (q) {
    list = list.filter(u =>
      `${u.firstName} ${u.lastName} ${u.email} ${u.role} ${u.dept || ''}`
        .toLowerCase().includes(q)
    );
  }

  list.sort((a, b) => {
    if (sort === 'newest')  return b.createdAt - a.createdAt;
    if (sort === 'oldest')  return a.createdAt - b.createdAt;
    if (sort === 'name-az') return `${a.firstName}${a.lastName}`.localeCompare(`${b.firstName}${b.lastName}`);
    if (sort === 'name-za') return `${b.firstName}${b.lastName}`.localeCompare(`${a.firstName}${a.lastName}`);
    return 0;
  });

  document.getElementById('stat-total').textContent   = users.length;
  document.getElementById('stat-admins').textContent  = users.filter(u => u.role === 'Admin').length;
  document.getElementById('stat-showing').textContent = list.length;

  const grid = document.getElementById('userGrid');

  if (!list.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        <h3>${q ? 'No results found' : 'No users yet'}</h3>
        <p>${q ? 'Try a different search term.' : 'Click "Add User" to get started.'}</p>
      </div>`;
    return;
  }

  grid.innerHTML = list.map((u, i) => {
    const { initials, fg, bg } = getAvatar(`${u.firstName} ${u.lastName}`, u.id);
    const roleClass = 'role-' + u.role.toLowerCase();
    const dateStr   = new Date(u.createdAt).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
    // Stagger card animation
    const delay = `animation-delay:${i * 50}ms`;

    return `
    <div class="user-card ${u.justUpdated ? 'updated' : ''}" id="card-${u.id}" style="${delay}">

      <div class="card-header">
        <div class="avatar" style="background:${bg};color:${fg}">${initials}</div>

        <div class="card-info">
          <div class="card-name">${u.firstName} ${u.lastName}</div>
          <span class="card-role ${roleClass}">${u.role}</span>
        </div>

        <div class="card-actions">
          <button class="icon-btn edit" onclick="openEdit('${u.id}')" title="Edit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="icon-btn delete" onclick="openConfirm('${u.id}')" title="Delete">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6"/><path d="M14 11v6"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="card-body">
        <div class="card-field">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
          <span>${u.email}</span>
        </div>

        ${u.phone ? `
        <div class="card-field">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.38 2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
          <span>${u.phone}</span>
        </div>` : ''}

        ${u.dept ? `
        <div class="card-field">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="7" width="20" height="14" rx="2"/>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
          </svg>
          <span>${u.dept}</span>
        </div>` : ''}
      </div>

      <div class="card-footer">
        <span>ID: ${u.id.slice(-6).toUpperCase()}</span>
        <span>Added ${dateStr}</span>
      </div>

    </div>`;
  }).join('');

  users.forEach(u => { if (u.justUpdated) u.justUpdated = false; });
}


/* ══════════════════════════════════════════
   MODAL — ADD / EDIT
══════════════════════════════════════════ */

function openModal() {
  editingId = null;
  document.getElementById('modalTitle').textContent    = 'Add New User';
  document.getElementById('submitBtn').textContent     = 'Create User';
  document.getElementById('pwGroup').style.display     = '';
  document.getElementById('pwConfGroup').style.display = '';
  resetForm();
  openOverlay('formOverlay');
}

function openEdit(id) {
  const u = users.find(x => x.id === id);
  if (!u) return;
  editingId = id;

  document.getElementById('modalTitle').textContent    = 'Edit User';
  document.getElementById('submitBtn').textContent     = 'Save Changes';
  document.getElementById('pwGroup').style.display     = 'none';
  document.getElementById('pwConfGroup').style.display = 'none';

  document.getElementById('fFirstName').value = u.firstName;
  document.getElementById('fLastName').value  = u.lastName;
  document.getElementById('fEmail').value     = u.email;
  document.getElementById('fPhone').value     = u.phone || '';
  document.getElementById('fRole').value      = u.role;
  document.getElementById('fDept').value      = u.dept  || '';

  clearErrors();
  openOverlay('formOverlay');
}

function closeModal() {
  closeOverlay('formOverlay');
  resetForm();
  editingId = null;
}

function handleOverlayClick(e) {
  if (e.target.id === 'formOverlay') closeModal();
}


/* ══════════════════════════════════════════
   MODAL — CONFIRM DELETE
══════════════════════════════════════════ */

function openConfirm(id) {
  deletingId = id;
  const u = users.find(x => x.id === id);
  document.getElementById('confirmMsg').textContent =
    `"${u.firstName} ${u.lastName}" will be permanently removed. This cannot be undone.`;
  openOverlay('confirmOverlay');
}

function closeConfirm() {
  closeOverlay('confirmOverlay');
  deletingId = null;
}

function handleConfirmOverlayClick(e) {
  if (e.target.id === 'confirmOverlay') closeConfirm();
}

function confirmDelete() {
  if (!deletingId) return;
  const u = users.find(x => x.id === deletingId);
  users = users.filter(x => x.id !== deletingId);
  save();
  closeConfirm();
  renderCards();
  showToast('User Deleted', `${u.firstName} ${u.lastName} has been removed.`, 'e');
}


/* ══════════════════════════════════════════
   OVERLAY HELPERS
══════════════════════════════════════════ */

function openOverlay(id) {
  document.getElementById(id).classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeOverlay(id) {
  document.getElementById(id).classList.remove('open');
  document.body.style.overflow = '';
}


/* ══════════════════════════════════════════
   FORM — VALIDATION & SUBMIT
══════════════════════════════════════════ */

function resetForm() {
  document.getElementById('userForm').reset();
  clearErrors();
}

function clearErrors() {
  document.querySelectorAll('.error-msg').forEach(el => el.classList.remove('show'));
  document.querySelectorAll('.form-input').forEach(el => el.classList.remove('error'));
}

function showError(fieldId) {
  document.getElementById(fieldId).classList.add('error');
  document.getElementById('e-' + fieldId).classList.add('show');
}

function validateForm(isEdit) {
  clearErrors();
  let valid = true;
  const v = id => document.getElementById(id).value.trim();

  if (!v('fFirstName'))                                   { showError('fFirstName'); valid = false; }
  if (!v('fLastName'))                                    { showError('fLastName');  valid = false; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v('fEmail')))   { showError('fEmail');    valid = false; }
  if (!v('fRole'))                                        { showError('fRole');      valid = false; }

  if (!isEdit) {
    if (v('fPassword').length < 8)            { showError('fPassword');     valid = false; }
    if (v('fPasswordConf') !== v('fPassword')) { showError('fPasswordConf'); valid = false; }
  }

  return valid;
}

document.getElementById('userForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const isEdit = !!editingId;
  if (!validateForm(isEdit)) return;
  const v = id => document.getElementById(id).value.trim();

  if (isEdit) {
    const u = users.find(x => x.id === editingId);
    u.firstName   = v('fFirstName');
    u.lastName    = v('fLastName');
    u.email       = v('fEmail');
    u.phone       = v('fPhone');
    u.role        = v('fRole');
    u.dept        = v('fDept');
    u.justUpdated = true;
    save();
    closeModal();
    renderCards();
    showToast('User Updated', `${u.firstName} ${u.lastName} was updated.`, 's');
  } else {
    const newUser = {
      id:        uid(),
      firstName: v('fFirstName'),
      lastName:  v('fLastName'),
      email:     v('fEmail'),
      phone:     v('fPhone'),
      role:      v('fRole'),
      dept:      v('fDept'),
      createdAt: Date.now(),
    };
    users.unshift(newUser);
    save();
    closeModal();
    renderCards();
    showToast('User Created', `${newUser.firstName} ${newUser.lastName} added successfully.`, 's');
  }
});


/* ══════════════════════════════════════════
   PASSWORD EYE TOGGLE
══════════════════════════════════════════ */

function togglePw(inputId, btn) {
  const inp    = document.getElementById(inputId);
  const isText = inp.type === 'text';
  inp.type     = isText ? 'password' : 'text';
  btn.innerHTML = isText
    ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
         <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
       </svg>`
    : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
         <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94
                  M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19
                  m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
         <line x1="1" y1="1" x2="23" y2="23"/>
       </svg>`;
}


/* ══════════════════════════════════════════
   TOAST
══════════════════════════════════════════ */

function showToast(title, msg, type = 's') {
  const toast = document.getElementById('toast');
  const icon  = document.getElementById('toastIcon');

  document.getElementById('toastTitle').textContent = title;
  document.getElementById('toastMsg').textContent   = msg;
  icon.className  = 'toast-icon ' + type;
  icon.innerHTML  = type === 's'
    ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
         <polyline points="20 6 9 17 4 12"/>
       </svg>`
    : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
         <polyline points="3 6 5 6 21 6"/>
         <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
       </svg>`;

  clearTimeout(toastTimer);
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}


/* ══════════════════════════════════════════
   INIT
══════════════════════════════════════════ */
renderCards();
