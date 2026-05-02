// Firebase
import { db, auth } from './firebase.js';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

// STATE
const state = {
  type: null,
  address: '',
  date: '',
  time: '',
  phone: '',
  notes: '',
  doctorId: ''
};

let currentStep = 1;


function goStep(n) {
       if (n === 2 && !validateStep1()) return;
if (n === 3 && !validateStep2()) return;
if (n === 4 && !validateStep3()) return;
  if (n === 4) buildSummary();
  document.getElementById('panel-' + currentStep).classList.remove('active');
  document.getElementById('panel-' + n).classList.add('active');
  updateProgress(n);
  currentStep = n;

  window.scrollTo({ top: 0, behavior: 'smooth' });
}


function updateProgress(n) {
for (let i = 1; i <= 4; i++) {
              const dot = document.getElementById('dot-' + i);
          dot.classList.remove('active', 'done');
            if (i < n) dot.classList.add('done');
                  else if (i === n) dot.classList.add('active');
}
  for (let i = 1; i <= 3; i++) {
 const line = document.getElementById('line-' + i);
    line.classList.toggle('done', i < n);
  }
}






function selectType(type) {
        state.type = type;
        document.getElementById('card-clinic').classList.toggle('selected', type === 'clinic');
         document.getElementById('card-home').classList.toggle('selected', type === 'home');
  const addressBox = document.getElementById('address-box');
                    addressBox.style.display = type === 'home' ? 'block' : 'none';
  document.getElementById('btn-next-1').disabled = false;
}

function validateStep1() {
               if (!state.type) { alert('Please select a visit type.'); return false; }
  if (state.type === 'home') {
            const addr = document.getElementById('address').value.trim();
             if (!addr) { alert('Please enter your address for the home visit.'); return false; }
    state.address = addr;
  } return true;}


window.addEventListener('DOMContentLoaded', async function () {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('appt-date').setAttribute('min', today);

  const params = new URLSearchParams(window.location.search);
  state.doctorId = params.get('doctorId') || '';
  console.log('doctorId:', state.doctorId);
 
if (state.doctorId) {
  try {
    const docSnap = await getDoc(doc(db, 'users', state.doctorId));
    if (docSnap.exists()) {
      const data = docSnap.data();
      const fullName = `Dr. ${data.firstName || ''} ${data.lastName || ''}`.trim();
      document.querySelector('.doctor-info h3').textContent = fullName;
      document.querySelector('.doctor-info p').textContent  = data.specialty || '';
      const initials = (data.firstName?.[0] || '') + (data.lastName?.[0] || '');
      document.querySelector('.doctor-avatar').textContent  = initials.toUpperCase() || 'DR';
    }
  } catch (err) {
    console.error('Error loading doctor:', err);
  }
}

  // ── CHECK DOCTOR CAPACITY ──────────────────────────────────────
  if (state.doctorId) {
    try {
      const [docSnap, apptSnap] = await Promise.all([
        getDoc(doc(db, 'users', state.doctorId)),
        getDocs(query(
          collection(db, 'appointments'),
          where('doctorId', '==', state.doctorId),
          where('status', '!=', 'rejected')
        ))
      ]);

      if (docSnap.exists()) {
        const maxAppts = docSnap.data().maxAppointments || 20;

        // Count only future/today appointments (past ones free up the slot)
        let activeCount = 0;
        apptSnap.forEach(d => {
          const apptDate = d.data().date || '';
          if (apptDate >= today) activeCount++;
        });

        if (activeCount >= maxAppts) {
          // Disable the entire booking form
          document.querySelector('.panel-wrap').innerHTML = `
            <div style="
              text-align:center; padding:60px 30px;
              background:#fff; border-radius:20px;
              box-shadow:0 4px 24px rgba(0,0,0,0.08);
            ">
              <div style="font-size:64px; margin-bottom:20px;">🚫</div>
              <h2 style="color:#234A6B; font-size:22px; font-weight:800; margin-bottom:10px;">
                Doctor Unavailable
              </h2>
              <p style="color:#7a8aab; font-size:14px; max-width:360px; margin:0 auto 28px;">
                This doctor has reached their maximum appointment capacity.
                Please try again later or choose another doctor.
              </p>
              <a href="doctorslist.html" style="
                display:inline-block; background:linear-gradient(135deg,#0086FF,#0179e2);
                color:#fff; font-weight:700; font-size:14px; padding:14px 32px;
                border-radius:12px; text-decoration:none;
                box-shadow:0 4px 16px rgba(0,134,255,0.3);
              ">Browse Other Doctors</a>
            </div>`;
          document.querySelector('.progress-wrap').style.display = 'none';
          return;
        }
      }
    } catch (err) {
      console.error('Capacity check error:', err);
    }
  }
  // ──────────────────────────────────────────────────────────────

  document.getElementById('appt-date').addEventListener('change', async function () {
              state.date = this.value;
    state.time = ''; 
             checkStep2();
    await markBookedSlots(); 
  });
});

async function markBookedSlots() {
      const slots = document.querySelectorAll('.time-slot');

  slots.forEach(s => {
    s.classList.remove('booked', 'selected');
    s.style.pointerEvents = '';
    s.style.opacity = '';
    s.style.cursor = '';
    s.style.background = '';
    s.style.color = '';
    s.style.border = '';
    s.style.textDecoration = '';
    const badge = s.querySelector('.booked-badge');
    if (badge) badge.remove();
    s.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) return;});
  });
  if (!state.date || !state.doctorId) return;
    try {
    const q = query(
      collection(db, 'appointments'),
      where('doctorId', '==', state.doctorId),
      where('date', '==', state.date),
      where('status', '!=', 'rejected')
    );
    const snap = await getDocs(q);

    const bookedTimes = [];
    snap.forEach(d => bookedTimes.push(d.data().time));

    slots.forEach(slot => {
              const slotTime = slot.textContent.trim();
      if (bookedTimes.includes(slotTime)) {
        slot.classList.add('booked');
               slot.style.pointerEvents = 'none';
                slot.style.opacity = '0.35';
              slot.style.cursor = 'not-allowed';
                slot.style.background = '#f5f5f5';
                  slot.style.color = '#aaa';
        slot.style.border = '1.5px dashed #ccc';
         slot.style.textDecoration = 'line-through';

        const badge = document.createElement('span');
        badge.className = 'booked-badge';
        badge.textContent = '🔴 Booked';
        badge.style.cssText = `
          display: block;
          font-size: 9px;
          font-weight: 700;
          color: #e74c3c;
          margin-top: 3px;
          letter-spacing: 0.5px;
          text-decoration: none;
        `;
        slot.appendChild(badge);
      }
    });

  } catch (err) {
    console.error('Error fetching booked slots:', err);
  }
}

function selectTime(el) {
  if (el.classList.contains('booked')) return;

  document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
  el.classList.add('selected');
  state.time = el.firstChild.textContent.trim();
  checkStep2();
}

function checkStep2() {
  document.getElementById('btn-next-2').disabled = !(state.date && state.time);
}

function validateStep2() {
  if (!state.date) { alert('Please select a date.'); return false; }
  if (!state.time) { alert('Please select a time slot.'); return false; }
  return true;
}

function validateStep3() {
         const phone = document.getElementById('phone').value.trim();
               if (!phone || !/^[0-9+\s\-]{7,15}$/.test(phone)) {
    document.getElementById('phone').style.borderColor = '#e74c3c';
                   document.getElementById('phone').placeholder = 'Phone number is required!';
                    return false;}
document.getElementById('phone').style.borderColor = '#E0E0E0';
  return true;
}

function buildSummary() {
  const doctorName = document.querySelector('.doctor-info h3').textContent;
  document.getElementById('sum-doctor').textContent = doctorName;
  document.getElementById('sum-doctor-success').textContent = doctorName;
  document.getElementById('sum-doctor').textContent = document.querySelector('.doctor-info h3').textContent;
  state.phone = document.getElementById('phone').value.trim();
  state.notes = document.getElementById('notes').value.trim();
  document.getElementById('sum-type').textContent =
              state.type === 'clinic' ? '🏥 Clinic Visit' : '🏠 Home Visit';
  const addressRow = document.getElementById('sum-address-row');
  if (state.type === 'home' && state.address) {
    addressRow.style.display = 'flex';

    document.getElementById('sum-address').textContent = state.address;
  } else { addressRow.style.display = 'none';}
  const dateObj = new Date(state.date);
        const formatted = dateObj.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  document.getElementById('sum-date').textContent = formatted;
  document.getElementById('sum-time').textContent = state.time;
   document.getElementById('sum-phone').textContent = state.phone || '—';
  document.getElementById('sum-notes').textContent = state.notes || '—';
}

async function confirmBooking() {
  const confirmBtn = document.querySelector('.btn-confirm');
  confirmBtn.disabled = true;
  confirmBtn.textContent = 'Submitting...';
  confirmBtn.style.background = '#888';





  try {
    const user = auth.currentUser;
    if (!user) {
      alert('You must be logged in to book an appointment.');
      confirmBtn.disabled = false;
      confirmBtn.textContent = '✓ Confirm Booking';
      confirmBtn.style.background = '#1a9e5c';
      return;
    }

    const q = query(
      collection(db, 'appointments'),
   where('doctorId', '==', state.doctorId),
    where('date', '==', state.date),
        where('time', '==', state.time),
      where('status', '!=', 'rejected')
    );
     const existing = await getDocs(q);
    if (!existing.empty) {
      alert('Sorry, this time slot was just booked. Please go back and choose another time.');
      confirmBtn.disabled = false;
      confirmBtn.textContent = '✓ Confirm Booking';
      confirmBtn.style.background = '#1a9e5c';
      return;
    }
//حفظ للفاير بيز
    await addDoc(collection(db, 'appointments'), {
      patientId:  user.uid,
      doctorId:   state.doctorId,
      type:       state.type,
      address:    state.address || '',
      date:       state.date,
      time:       state.time,
      phone:      state.phone,
      notes:      state.notes || '',
      status:     'pending',
      createdAt:  serverTimestamp()
    });


    document.getElementById('panel-4').classList.remove('active');
    document.getElementById('panel-success').classList.add('active');
    updateProgress(5);
    window.scrollTo({ top: 0, behavior: 'smooth' });

  } catch (error) {
    console.error('Booking error:', error);
    confirmBtn.disabled = false;
    confirmBtn.textContent = '✓ Confirm Booking';
    confirmBtn.style.background = '#1a9e5c';
    alert('Something went wrong. Please try again.');
  }
}

//of html
window.goStep         = goStep;
window.selectType     = selectType;
window.selectTime     = selectTime;
window.confirmBooking = confirmBooking;
window.validateStep3  = validateStep3;
window.buildSummary   = buildSummary;