// STATE
const state = {
  type: null,
  address: '',
  date: '',
  time: '',
  phone: '',
  notes: ''
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

  document.getElementById('appt-date').addEventListener('change', function () {
    state.date = this.value;
    checkStep2();
  });
});

function selectTime(el) {
  document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
  el.classList.add('selected');
  state.time = el.textContent;
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

  // Loading state
  confirmBtn.disabled = true;
  confirmBtn.textContent = 'Submitting...';
  confirmBtn.style.background = '#888';

  try {
    // TODO: replace with Firebase Firestore call
    // await addDoc(collection(db, 'appointments'), {
    //   type: state.type,
    //   address: state.address,
    //   date: state.date,
    //   time: state.time,
    //   phone: state.phone,
    //   notes: state.notes,
    //   status: 'pending',
    //   createdAt: serverTimestamp()
    // });

    // Simulating network delay
    await new Promise(resolve => setTimeout(resolve, 1800));

    // Show pending message
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