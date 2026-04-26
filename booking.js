// ✅ استيراد Firebase
import { db, auth } from './firebase.js';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
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

// ─── STEP NAVIGATION ───────────────────────────────────────
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

// ─── PROGRESS BAR ──────────────────────────────────────────
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

// ─── STEP 1: TYPE ──────────────────────────────────────────
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
  }
  return true;
}

// ─── STEP 2: SCHEDULE ──────────────────────────────────────
window.addEventListener('DOMContentLoaded', function () {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('appt-date').setAttribute('min', today);

  // قراءة doctorId من URL
  const params = new URLSearchParams(window.location.search);
  state.doctorId = params.get('doctorId') || '';

  document.getElementById('appt-date').addEventListener('change', async function () {
    state.date = this.value;
    state.time = ''; // reset الوقت المختار عند تغيير التاريخ
    checkStep2();
    await markBookedSlots(); // ✅ تحقق من الأوقات المحجوزة وعطّلها
  });
});

// ✅ جلب الأوقات المحجوزة وتعطيلها بصرياً
async function markBookedSlots() {
  const slots = document.querySelectorAll('.time-slot');

  // إعادة كل الأوقات لحالتها الطبيعية أولاً
  slots.forEach(s => {
    s.classList.remove('booked', 'selected');
    s.style.pointerEvents = '';
    s.style.opacity = '';
    s.style.cursor = '';
    s.style.background = '';
    s.style.color = '';
    s.style.border = '';
    s.style.textDecoration = '';
    // إزالة badge المحجوز إن وجد
    const badge = s.querySelector('.booked-badge');
    if (badge) badge.remove();
    // إعادة النص الأصلي (إزالة "Booked" من النص)
    s.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) return;
    });
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

    // تطبيق التعطيل على الأوقات المحجوزة
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

        // إضافة نص "Booked" صغير تحت الوقت
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
  // منع اختيار الوقت المحجوز
  if (el.classList.contains('booked')) return;

  document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
  el.classList.add('selected');
  // أخذ الوقت فقط (بدون نص booked-badge)
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
    return false;
  }
  document.getElementById('phone').style.borderColor = '#E0E0E0';
  return true;
}

// ─── STEP 4: SUMMARY ───────────────────────────────────────
function buildSummary() {
  state.phone = document.getElementById('phone').value.trim();
  state.notes = document.getElementById('notes').value.trim();

  document.getElementById('sum-type').textContent =
    state.type === 'clinic' ? '🏥 Clinic Visit' : '🏠 Home Visit';

  const addressRow = document.getElementById('sum-address-row');
  if (state.type === 'home' && state.address) {
    addressRow.style.display = 'flex';
    document.getElementById('sum-address').textContent = state.address;
  } else {
    addressRow.style.display = 'none';
  }

  const dateObj = new Date(state.date);
  const formatted = dateObj.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  document.getElementById('sum-date').textContent = formatted;
  document.getElementById('sum-time').textContent = state.time;
  document.getElementById('sum-phone').textContent = state.phone || '—';
  document.getElementById('sum-notes').textContent = state.notes || '—';
}

// ─── CONFIRM ───────────────────────────────────────────────
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

    // تحقق أخير عند الضغط على Confirm (احتياط)
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

    // حفظ الحجز في Firestore
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

// تصدير الدوال للـ HTML
window.goStep         = goStep;
window.selectType     = selectType;
window.selectTime     = selectTime;
window.confirmBooking = confirmBooking;
window.validateStep3  = validateStep3;
window.buildSummary   = buildSummary;