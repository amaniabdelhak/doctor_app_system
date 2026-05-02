import { auth, db } from './firebase.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";





function openModal(tab) 
{
  document.getElementById('modalOverlay').classList.add('active');
  switchTab(tab || 'login');
}

function closeModal() 
{
                         document.getElementById('modalOverlay').classList.remove('active');
                           clearAllErrors();
}

function closeOnOverlay(e) 
{
  if (e.target === document.getElementById('modalOverlay')) closeModal();
}

function switchTab(tab)
 {
  document.getElementById('loginForm').style.display  = tab === 'login'  ? 'block' : 'none';
     document.getElementById('signupForm').style.display = tab === 'signup' ? 'block' : 'none';
  clearAllErrors();}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});
window.openModal  = openModal;
  window.closeModal = closeModal;
  window.closeOnOverlay = closeOnOverlay;
window.switchTab  = switchTab;




function showError(inputEl, message) {
            inputEl.classList.add('invalid');
   let err = inputEl.nextElementSibling;
  if (!err || !err.classList.contains('error-msg')) {
          err = document.createElement('span');
             err.classList.add('error-msg');
                inputEl.insertAdjacentElement('afterend', err);
  }
  err.textContent = message;

  err.classList.add('show');


}

function clearError(inputEl) {
  inputEl.classList.remove('invalid');
          const err = inputEl.nextElementSibling;
  if (err && err.classList.contains('error-msg')) {
             err.classList.remove('show');
    err.textContent = '';
             }}
function clearAllErrors() 
{
      document.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
                 document.querySelectorAll('.error-msg').forEach(el => {
                       el.classList.remove('show');
                              el.textContent = '';
                                    });}

function isValidEmail(email) {


  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

}



function setLoading(btn, isLoading) {
  btn.disabled = isLoading;
  btn.textContent = isLoading ? 'Please wait...' : btn.dataset.label;
}


function redirectByRole(role) {
if (role === 'admin') {
        window.location.href = 'admin-dashboard.html';
  } else if (role === 'doctor') {
    window.location.href = 'dp.html';
  } else
     {
    window.location.href = 'patientProfile.html';}}



document.getElementById('loginForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  clearAllErrors();

  const emailEl    = document.getElementById('login-email');
  const passwordEl = document.getElementById('login-password');
  const submitBtn  = this.querySelector('.submit-btn');

  let valid = true;


    if (!emailEl.value.trim()) {
        showError(emailEl, 'Email is required');
          valid = false;
               } else if (!isValidEmail(emailEl.value.trim())) {
         showError(emailEl, 'Enter a valid email address');
         valid = false;
   }

         if (!passwordEl.value) {
    showError(passwordEl, 'Password is required');
       valid = false;
  }

           if (!valid) return;

         if (!submitBtn.dataset.label) submitBtn.dataset.label = submitBtn.textContent;
          setLoading(submitBtn, true);

  try {
             const credential = await signInWithEmailAndPassword(
             auth,
      emailEl.value.trim(),
      passwordEl.value
    );

           const userDoc = await getDoc(doc(db, 'users', credential.user.uid));

    if (!userDoc.exists()) {
      closeModal();
      window.location.href = 'home.html';
      return;
    }

    const data = userDoc.data();
    closeModal();
    redirectByRole(data.role);

  } catch (err) {
    handleAuthError(err, emailEl, passwordEl);
  } finally {
    setLoading(submitBtn, false);
  }
});





document.getElementById('signupForm').addEventListener('submit', async function(e) {
  e.preventDefault();
                  clearAllErrors();

     const firstName = document.getElementById('signup-firstName');
  const lastName  = document.getElementById('signup-lastName');
      const email     = document.getElementById('signup-email');
            const phone     = document.getElementById('signup-phone');
              const role      = document.getElementById('signup-role');
                const password  = document.getElementById('signup-password');
                    const confirm   = document.getElementById('signup-confirmPassword');
                    const submitBtn = this.querySelector('.submit-btn');

              let valid = true;

  if (!firstName.value.trim()) { showError(firstName, 'First name is required'); valid = false; }
          if (!lastName.value.trim())  { showError(lastName,  'Last name is required');  valid = false; }

       if (!email.value.trim()) 
        {
    showError(email, 'Email is required'); valid = false;
  } else if (!isValidEmail(email.value.trim())) {
    showError(email, 'Enter a valid email address'); valid = false;
  }

  if (!phone.value.trim()) 
    { showError(phone, 'Phone number is required'); valid = false; }

  if (!role.value) 
    { showError(role, 'Please select a role'); valid = false; }

  if (!password.value) 
    {
    showError(password, 'Password is required'); valid = false;
  } else if (password.value.length < 6) {
    showError(password, 'Password must be at least 6 characters'); valid = false;
  }

  if (!confirm.value) 
    {
    showError(confirm, 'Please confirm your password'); valid = false;
  } else if (confirm.value !== password.value) {
    showError(confirm, 'Passwords do not match'); valid = false;
  }

  if (!valid) return;

  if (role.value === 'doctor') {
    showError(role, 'Doctor accounts are created by admin only. Please contact us.');
    return;
  }

  if (!submitBtn.dataset.label) submitBtn.dataset.label = submitBtn.textContent;
  setLoading(submitBtn, true);

  try {
    const credential = await createUserWithEmailAndPassword(
      auth,
      email.value.trim(),
      password.value
    );

    await setDoc(doc(db, 'users', credential.user.uid), {
      firstName:  firstName.value.trim(),
      lastName:   lastName.value.trim(),
      email:      email.value.trim(),
      phone:      phone.value.trim(),
      role:       'patient',
      createdAt:  serverTimestamp()
    });

    closeModal();

    
    window.location.href = 'patientProfile.html';

  } catch (err) {
    handleAuthError(err, email, password);
  } finally {
    setLoading(submitBtn, false);
  }
});




async function handleLogout() {
  try {
    await signOut(auth);
  } catch (e) {
          console.error('Logout error:', e);
  }
}

window.handleLogout = handleLogout;




onAuthStateChanged(auth, async (user) => {
  const init = () => {
    const profileCircle = document.getElementById('profilecircle');
    const loginBtn      = document.querySelector('.login-btn');

    if (user) {
     
      if (loginBtn)      loginBtn.style.display      = 'none';
      if (profileCircle) {
        profileCircle.style.display  = 'flex';
        profileCircle.style.cursor   = 'pointer';

        profileCircle.addEventListener('click', async () => {
          const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
          const data = userDoc.data();
          redirectByRole(data.role);
        });
      }
    } else {
      if (loginBtn)      loginBtn.style.display      = '';
      if (profileCircle) profileCircle.style.display = 'none';
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
});




function handleAuthError(err, emailEl, passwordEl) {
  console.error('Auth error:', err.code, err.message);
  switch (err.code) {
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
      showError(emailEl, 'No account found with this email');
      break;
    case 'auth/wrong-password':
      showError(passwordEl, 'Incorrect password');
      break;
    case 'auth/email-already-in-use':
      showError(emailEl, 'This email is already registered. Try logging in.');
      break;
    case 'auth/weak-password':
      showError(passwordEl, 'Password must be at least 6 characters');
      break;
    case 'auth/too-many-requests':
      showError(emailEl, 'Too many attempts. Please try again later.');
      break;
    case 'auth/network-request-failed':
      showError(emailEl, 'Network error. Check your connection.');
      break;
    default:
      showError(emailEl, 'Something went wrong. Please try again.');
  }
}



const specialtyMap = {
  'cardio': 'cardiology', 'cardiologist': 'cardiology', 'cardiology': 'cardiology', 'heart': 'cardiology',
  'neuro': 'neurology',   'neurologist': 'neurology',   'neurology': 'neurology',   'brain': 'neurology',
  'derm': 'dermatology',  'dermatologist': 'dermatology','dermatology': 'dermatology','skin': 'dermatology',
  'gyne': 'gynecology',   'gynecologist': 'gynecology',  'gynecology': 'gynecology',
  'ortho': 'orthopedics', 'orthopedist': 'orthopedics',  'orthopedics': 'orthopedics','bone': 'orthopedics', 'bones': 'orthopedics',
  'surgery': 'surgery',   'surgeon': 'surgery',          'surgical': 'surgery',
  'onco': 'oncology',     'oncologist': 'oncology',      'oncology': 'oncology',     'cancer': 'oncology',
  'general': 'general',   'gp': 'general',
};

        window.goToSpecialty = function() {
            const raw = (document.getElementById('heroSearch')?.value || '').trim().toLowerCase();
  if (!raw) { window.location.href = 'doctorslist.html'; return; }
              const matched = specialtyMap[raw]
    || specialtyMap[Object.keys(specialtyMap).find(k => k.includes(raw) || raw.includes(k))];
  window.location.href = matched
    ? `doctorslist.html?specialty=${matched}`
    : `doctorslist.html?search=${encodeURIComponent(raw)}`;
};

window.handleHeroSearch = function(e) {
  if (e.key === 'Enter') window.goToSpecialty();
};