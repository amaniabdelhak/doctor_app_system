import { auth, db } from './firebase.js';
import {
  onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";
import {
                collection, getDocs, addDoc, deleteDoc,
         doc, query, where, orderBy, getDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";


let doctors       = [];   
let appointments  = [];   
let currentFilter = 'all';

const icons = {
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
  x:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  clock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
};


onAuthStateChanged(auth, async (user) => {
         if (!user) { window.location.href = 'home.html'; return; }

  try {
    const snap = await getDoc(doc(db, 'users', user.uid));
         if (!snap.exists() || snap.data().role !== 'admin') {
      window.location.href = 'home.html';
      return;}
    await loadAll();
  } catch (e) {
               console.error('Auth check error:', e);



    window.location.href = 'home.html';
  }
});



async function loadAll() {
  showLoading(true);
  try {
    await loadAppointments();
    await loadDoctors();
    renderAll();
  } catch (e) {
    console.error('loadAll error:', e);
  }
  showLoading(false);
}

async function loadDoctors() {
  const snap = await getDocs(query(
    collection(db, 'users'),
    where('role', '==', 'doctor')
  ));
  const today = new Date().toISOString().split('T')[0];

  const countMap   = {};  
  const pendingMap = {}; 

  appointments.forEach(a => {
    if (!a.doctorId) return;
    if (a.status !== 'rejected' && (a.date || '') >= today) {
      countMap[a.doctorId] = (countMap[a.doctorId] || 0) + 1;
    }
    if (a.status === 'pending') {
      pendingMap[a.doctorId] = (pendingMap[a.doctorId] || 0) + 1;
    }
  });

  doctors = [];
  snap.forEach(d => {
    const data = d.data();
    doctors.push({
      id:        d.id,
      name:      `Dr. ${data.firstName || ''} ${data.lastName || ''}`.trim(),
      specialty: data.specialty || '—',
      email:     data.email || '—',
      limit:     data.maxAppointments || 20,
      current:   countMap[d.id]   || 0,
      pending:   pendingMap[d.id] || 0,
    });
  });
}

async function loadAppointments() {
 
  const snap = await getDocs(collection(db, 'appointments'));
  const patientIds = new Set();
  const raw = [];
  snap.forEach(d => {
    raw.push({ id: d.id, ...d.data() });
    if (d.data().patientId) patientIds.add(d.data().patientId);
  });

  
  const nameMap = {};
  await Promise.all([...patientIds].map(async (pid) => {
    try {
      const ps = await getDoc(doc(db, 'users', pid));
      if (ps.exists()) {
        const p = ps.data();
        nameMap[pid] = `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Patient';
      }
    } catch (e) { }
  }));

  
  const docNameMap = {};
  doctors.forEach(d => docNameMap[d.id] = d.name);

  appointments = raw.map(a => ({
    ...a,
    patient: nameMap[a.patientId] || 'Unknown Patient',
    doctor:  docNameMap[a.doctorId] || 'Unknown Doctor',
  }));
}


function renderAll() {
  renderStats();
  renderRequestsTable();
  renderDoctorsTable();
  renderNotifications();
  updateBadge();
}


function renderStats() {
  const activeAppts = appointments.filter(n => n.status !== 'rejected');
  document.getElementById('stat-doctors').textContent  = doctors.length;
  document.getElementById('stat-requests').textContent = activeAppts.length;
  document.getElementById('stat-pending').textContent  = appointments.filter(n => n.status === 'pending').length;
  document.getElementById('stat-accepted').textContent = appointments.filter(n => n.status === 'accepted').length;
}


function renderRequestsTable()
 {
  const tbody = document.getElementById('requests-tbody');
  tbody.innerHTML = '';
  if (doctors.length === 0) 
    {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#7a8aab;padding:24px;">No doctors found.</td></tr>';
    return;
  }
  doctors.forEach(d => {
    const pct = d.current / d.limit;
    let pillClass, pillText;
    if (pct >= 1)        { pillClass = 'pill-full'; pillText = 'Not Available'; }
    else if (pct >= 0.8) { pillClass = 'pill-warn'; pillText = 'Nearly Full';   }
    else                 { pillClass = 'pill-ok';   pillText = 'Available';      }



    tbody.innerHTML += `
      <tr>
        <td>${d.name}</td>
        <td>${d.specialty}</td>
        <td><strong>${d.pending}</strong></td>
        <td>${d.limit}</td>
        <td><span class="pill ${pillClass}">${pillText}</span></td>
      </tr>`;
  });
}

function renderDoctorsTable() {
  const tbody = document.getElementById('doctors-tbody');
  tbody.innerHTML = '';
  if (doctors.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#7a8aab;padding:24px;">No doctors yet.</td></tr>';
    return;
  }
  doctors.forEach(d => {
    tbody.innerHTML += `
      <tr>
        <td>${d.name}</td>
        <td>${d.specialty}</td>
        <td>${d.email}</td>
        <td>${d.limit}</td>
        <td>${d.current}</td>
        <td><button class="btn-delete" onclick="deleteDoctor('${d.id}')">Delete</button></td>
      </tr>`;
  });
}

window.deleteDoctor = async function(id) {
  if (!confirm('Are you sure you want to remove this doctor?')) return;
  try {
                    await deleteDoc(doc(db, 'users', id));

    await loadAll();
  } catch (e) {
    console.error('Delete error:', e);
    alert('Failed to delete doctor. Please try again.'); }};


window.openAddDoctor = function() {
  document.getElementById('addDoctorModal').classList.add('active');};
window.closeAddDoctorBtn = function() {
  document.getElementById('addDoctorModal').classList.remove('active');
        document.getElementById('addDoctorForm').reset();

document.getElementById('add-error').textContent = '';};

window.closeAddDoctor = function(e) {
           if (e.target === document.getElementById('addDoctorModal')) closeAddDoctorBtn();};

document.getElementById('addDoctorForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const firstName = document.getElementById('doc-firstname').value.trim();
  const lastName  = document.getElementById('doc-lastname').value.trim();
  const specialty = document.getElementById('doc-specialty').value.trim();
const email     = document.getElementById('doc-email').value.trim();
const limit     = parseInt(document.getElementById('doc-limit').value);
  const errorEl   = document.getElementById('add-error');

         if (!firstName || !lastName || !specialty || !email || !limit) {
    errorEl.textContent = 'Please fill in all fields.';
    return;
  }

  const submitBtn = this.querySelector('.btn-submit');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Adding...';

  try {
    await addDoc(collection(db, 'users'), {
      firstName,
      lastName,
      specialty: specialty.toLowerCase(),
      email,
      maxAppointments: limit,
      role: 'doctor',
      rating: 4.5,
      address: 'Algeria',
      createdAt: serverTimestamp(),
    });

    closeAddDoctorBtn();
    await loadAll();
  } catch (err) {
    console.error('Add doctor error:', err);
    errorEl.textContent = 'Failed to add doctor. Please try again.';
  }

  submitBtn.disabled = false;
  submitBtn.textContent = 'Add Doctor';
});


function renderNotifications() {
  const list     = document.getElementById('notif-list');
  const filtered = currentFilter === 'all'
    ? appointments
    : appointments.filter(n => n.status === currentFilter);

  if (filtered.length === 0) {
    list.innerHTML = `<p class="empty-msg">No notifications found.</p>`;
    return;
  }

  
  const sorted = [...filtered].sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (b.status === 'pending' && a.status !== 'pending') return  1;
    return (b.date || '').localeCompare(a.date || '');
  });

  list.innerHTML = sorted.map(n => {
    const iconKey = n.status === 'accepted' ? 'check' : n.status === 'rejected' ? 'x' : 'clock';
    const msg = n.status === 'accepted'
      ? `Your appointment has been accepted by ${n.doctor}.`
      : n.status === 'rejected'
      ? `Your appointment was declined by ${n.doctor}.`
      : `Your request is waiting for ${n.doctor}'s response.`;

    const typeLabel = n.type === 'home' ? '🏠 Home Visit' : '🏥 Clinic Visit';

    return `
                <div class="notif-item ${n.status}">
                  <div class="notif-icon-wrap ${n.status}">${icons[iconKey]}</div>
              <div class="notif-info">
          <p class="notif-patient">${n.patient}</p>
                   <p class="notif-msg">${msg}</p>
          <p class="notif-detail">${typeLabel} · ${n.date || '—'} at ${n.time || '—'}</p>
    </div>
        <span class="pill pill-${n.status}">${capitalize(n.status)}</span>
 </div>`;
  }).join('');
}

window.filterNotifs = function(filter, btn) {
  currentFilter = filter;
 document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderNotifications();
};

function updateBadge() {
  const pending = appointments.filter(n => n.status === 'pending').length;
  const badge   = document.getElementById('notif-badge');
  badge.textContent = pending;
  badge.classList.toggle('show', pending > 0);
}


const sectionTitles = {
overview:      ['Overview',               'Welcome back, Admin'],
doctors:       ['Doctors',                'Manage your medical team'],
notifications: ['Patient Notifications',  'Messages sent to patients after doctor decisions'],
};

window.showSection = function(name, el) {
  document.querySelectorAll('.dash-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('section-' + name).classList.add('active');
  el.classList.add('active');
  document.getElementById('section-title').textContent = sectionTitles[name][0];
  document.getElementById('section-sub').textContent   = sectionTitles[name][1];
};

window.logout = async function() {
                          await signOut(auth);
                             window.location.href = 'home.html';
};

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function showLoading(show) {
  const el = document.getElementById('loading-overlay');
  if (el) el.style.display = show ? 'flex' : 'none';
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') window.closeAddDoctorBtn();
});