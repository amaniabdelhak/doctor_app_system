// ══════════════════════════════════════════════════
// MOCK DATA — replace with Firebase Firestore later
// ══════════════════════════════════════════════════
let doctors = [
  { id: 1, name: 'Dr. Sarah Johnson', specialty: 'Cardiologist',     email: 'sarah@medbook.com', limit: 20, current: 18 },
  { id: 2, name: 'Dr. Ali Benali',    specialty: 'Dermatologist',    email: 'ali@medbook.com',   limit: 15, current: 7  },
  { id: 3, name: 'Dr. Amina Cherif',  specialty: 'Pediatrician',     email: 'amina@medbook.com', limit: 10, current: 10 },
  { id: 4, name: 'Dr. Omar Hadj',     specialty: 'General Practice', email: 'omar@medbook.com',  limit: 25, current: 5  },
];

// Notifications = messages sent to patients after doctor's decision
// status: 'accepted' | 'rejected' | 'pending' (pending = doctor hasn't responded yet)
let notifications = [
  { id: 1, patient: 'Youssef Brahim', doctor: 'Dr. Sarah Johnson', type: 'Clinic Visit', date: '2026-04-20', time: '09:00 AM', status: 'accepted' },
  { id: 2, patient: 'Fatima Zahra',   doctor: 'Dr. Ali Benali',    type: 'Home Visit',   date: '2026-04-21', time: '10:30 AM', status: 'rejected' },
  { id: 3, patient: 'Karim Meziani',  doctor: 'Dr. Amina Cherif',  type: 'Clinic Visit', date: '2026-04-19', time: '02:00 PM', status: 'accepted' },
  { id: 4, patient: 'Nadia Bouzidi',  doctor: 'Dr. Sarah Johnson', type: 'Home Visit',   date: '2026-04-22', time: '03:30 PM', status: 'pending'  },
  { id: 5, patient: 'Mourad Lahlou',  doctor: 'Dr. Omar Hadj',     type: 'Clinic Visit', date: '2026-04-23', time: '11:00 AM', status: 'pending'  },
];

let currentFilter = 'all';
let nextId = 5;

// SVG icons
const icons = {
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
  x:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  clock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
};

// ══════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════
window.addEventListener('DOMContentLoaded', function () {
  // TODO: verify admin session from Firebase Auth
  // onAuthStateChanged(auth, user => {
  //   if (!user) { window.location.href = 'home.html'; return; }
  //   getDoc(doc(db, 'users', user.uid)).then(snap => {
  //     if (snap.data().role !== 'admin') window.location.href = 'home.html';
  //   });
  // });
  renderAll();
});

// ══════════════════════════════════════════════════
// NAVIGATION
// ══════════════════════════════════════════════════
const sectionTitles = {
  overview:      ['Overview',               'Welcome back, Admin'],
  doctors:       ['Doctors',                'Manage your medical team'],
  notifications: ['Patient Notifications',  'Messages sent to patients after doctor decisions'],
};

function showSection(name, el) {
  document.querySelectorAll('.dash-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('section-' + name).classList.add('active');
  el.classList.add('active');
  document.getElementById('section-title').textContent = sectionTitles[name][0];
  document.getElementById('section-sub').textContent   = sectionTitles[name][1];
}

function logout() {
  // TODO: signOut(auth).then(() => window.location.href = 'home.html');
  window.location.href = 'home.html';
}

// ══════════════════════════════════════════════════
// RENDER ALL
// ══════════════════════════════════════════════════
function renderAll() {
  renderStats();
  renderRequestsTable();
  renderDoctorsTable();
  renderNotifications();
  updateBadge();
}

// ── STATS ──────────────────────────────────────────
function renderStats() {
  document.getElementById('stat-doctors').textContent  = doctors.length;
  document.getElementById('stat-requests').textContent = notifications.length;
  document.getElementById('stat-pending').textContent  = notifications.filter(n => n.status === 'pending').length;
  document.getElementById('stat-accepted').textContent = notifications.filter(n => n.status === 'accepted').length;
}

// ── REQUESTS TABLE ─────────────────────────────────
function renderRequestsTable() {
  const tbody = document.getElementById('requests-tbody');
  tbody.innerHTML = '';
  doctors.forEach(doc => {
    const pct = doc.current / doc.limit;
    let pillClass, pillText;
    if (pct >= 1)        { pillClass = 'pill-full'; pillText = 'Full'; }
    else if (pct >= 0.8) { pillClass = 'pill-warn'; pillText = 'Nearly Full'; }
    else                 { pillClass = 'pill-ok';   pillText = 'Available'; }

    tbody.innerHTML += `
      <tr>
        <td>${doc.name}</td>
        <td>${doc.specialty}</td>
        <td><strong>${doc.current}</strong></td>
        <td>${doc.limit}</td>
        <td><span class="pill ${pillClass}">${pillText}</span></td>
      </tr>`;
  });
}

// ── DOCTORS TABLE ──────────────────────────────────
function renderDoctorsTable() {
  const tbody = document.getElementById('doctors-tbody');
  tbody.innerHTML = '';
  doctors.forEach(doc => {
    tbody.innerHTML += `
      <tr>
        <td>${doc.name}</td>
        <td>${doc.specialty}</td>
        <td>${doc.email}</td>
        <td>${doc.limit}</td>
        <td>${doc.current}</td>
        <td><button class="btn-delete" onclick="deleteDoctor(${doc.id})">Delete</button></td>
      </tr>`;
  });
}

function deleteDoctor(id) {
  if (!confirm('Are you sure you want to remove this doctor?')) return;
  doctors = doctors.filter(d => d.id !== id);
  // TODO: deleteDoc(doc(db, 'doctors', id))
  renderAll();
}

// ── ADD DOCTOR ─────────────────────────────────────
function openAddDoctor() {
  document.getElementById('addDoctorModal').classList.add('active');
}
function closeAddDoctorBtn() {
  document.getElementById('addDoctorModal').classList.remove('active');
  document.getElementById('addDoctorForm').reset();
  document.getElementById('add-error').textContent = '';
}
function closeAddDoctor(e) {
  if (e.target === document.getElementById('addDoctorModal')) closeAddDoctorBtn();
}

document.getElementById('addDoctorForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const name      = document.getElementById('doc-name').value.trim();
  const specialty = document.getElementById('doc-specialty').value.trim();
  const email     = document.getElementById('doc-email').value.trim();
  const limit     = parseInt(document.getElementById('doc-limit').value);
  const errorEl   = document.getElementById('add-error');

  if (!name || !specialty || !email || !limit) {
    errorEl.textContent = 'Please fill in all fields.';
    return;
  }
  // TODO: addDoc(collection(db, 'doctors'), { name, specialty, email, limit, current: 0 })
  doctors.push({ id: nextId++, name, specialty, email, limit, current: 0 });
  closeAddDoctorBtn();
  renderAll();
});

// ── NOTIFICATIONS ──────────────────────────────────
// These are READ-ONLY for admin — doctor is the one who accepts/rejects
// Patient sees their status in their own profile (Firestore listener)
function renderNotifications() {
  const list     = document.getElementById('notif-list');
  const filtered = currentFilter === 'all'
    ? notifications
    : notifications.filter(n => n.status === currentFilter);

  if (filtered.length === 0) {
    list.innerHTML = `<p class="empty-msg">No notifications found.</p>`;
    return;
  }

  list.innerHTML = filtered.map(n => {
    const iconKey = n.status === 'accepted' ? 'check' : n.status === 'rejected' ? 'x' : 'clock';
    const msg = n.status === 'accepted'
      ? `Your appointment has been accepted by ${n.doctor}.`
      : n.status === 'rejected'
      ? `Your appointment was declined by ${n.doctor}.`
      : `Your request is waiting for ${n.doctor}'s response.`;

    return `
      <div class="notif-item ${n.status}">
        <div class="notif-icon-wrap ${n.status}">${icons[iconKey]}</div>
        <div class="notif-info">
          <p class="notif-patient">${n.patient}</p>
          <p class="notif-msg">${msg}</p>
          <p class="notif-detail">${n.type} · ${n.date} at ${n.time}</p>
        </div>
        <span class="pill pill-${n.status}">${capitalize(n.status)}</span>
      </div>`;
  }).join('');
}

function filterNotifs(filter, btn) {
  currentFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderNotifications();
}

function updateBadge() {
  const pending = notifications.filter(n => n.status === 'pending').length;
  const badge   = document.getElementById('notif-badge');
  badge.textContent = pending;
  badge.classList.toggle('show', pending > 0);
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeAddDoctorBtn();
});