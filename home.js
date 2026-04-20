// ─── MODAL ─────────────────────────────────────────────────
function openModal(tab) {
    document.getElementById('modalOverlay').classList.add('active');
    switchTab(tab);
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
}

function closeOnOverlay(e) {
    if (e.target === document.getElementById('modalOverlay')) closeModal();
}

function switchTab(tab) {
    document.getElementById('loginForm').style.display = tab === 'login' ? 'block' : 'none';
    document.getElementById('signupForm').style.display = tab === 'signup' ? 'block' : 'none';
    document.getElementById('tabLogin').classList.toggle('active', tab === 'login');
    document.getElementById('tabSignup').classList.toggle('active', tab === 'signup');
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeModal();
});

// ─── LOGIN SUBMIT ───────────────────────────────────────────
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const email    = document.getElementById('login-email');
    const password = document.getElementById('login-password');
    let valid = true;

    // Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.value)) {
        showError(email, 'loginEmailError', 'Please enter a valid email.');
        valid = false;
    } else {
        clearError(email, 'loginEmailError');
    }

    // Password
    if (!password.value || password.value.length < 6) {
        showError(password, 'loginPasswordError', 'Password must be at least 6 characters.');
        valid = false;
    } else {
        clearError(password, 'loginPasswordError');
    }

    if (valid) {
        const redirectTo = localStorage.getItem('mhabook_redirect_after_login') || 'doctor_profile.html';
         localStorage.removeItem('mhabook_redirect_after_login');
         localStorage.setItem('mhabook_logged_in', 'true');
         localStorage.setItem('mhabook_role', 'patient');
         window.location.href = redirectTo;
    }
});

// ─── SIGNUP SUBMIT ──────────────────────────────────────────
document.getElementById('signupForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const firstName       = document.getElementById('signup-firstName');
    const lastName        = document.getElementById('signup-lastName');
    const email           = document.getElementById('signup-email');
    const phone           = document.getElementById('signup-phone');
    const role            = document.getElementById('signup-role');
    const password        = document.getElementById('signup-password');
    const confirmPassword = document.getElementById('signup-confirmPassword');
    let valid = true;

    // First Name
    if (!firstName.value.trim()) {
        showError(firstName, 'su-firstNameError', 'First name is required.');
        valid = false;
    } else {
        clearError(firstName, 'su-firstNameError');
    }

    // Last Name
    if (!lastName.value.trim()) {
        showError(lastName, 'su-lastNameError', 'Last name is required.');
        valid = false;
    } else {
        clearError(lastName, 'su-lastNameError');
    }

    // Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.value)) {
        showError(email, 'su-emailError', 'Please enter a valid email.');
        valid = false;
    } else {
        clearError(email, 'su-emailError');
    }

    // Phone
    const phoneRegex = /^[0-9+\s\-]{7,15}$/;
    if (!phoneRegex.test(phone.value.trim())) {
        showError(phone, 'su-phoneError', 'Please enter a valid phone number.');
        valid = false;
    } else {
        clearError(phone, 'su-phoneError');
    }

    // Role
    if (!role.value) {
        showError(role, 'su-roleError', 'Please select a role.');
        valid = false;
    } else {
        clearError(role, 'su-roleError');
    }

    // Password
    if (password.value.length < 6) {
        showError(password, 'su-passwordError', 'Password must be at least 6 characters.');
        valid = false;
    } else {
        clearError(password, 'su-passwordError');
    }

    // Confirm Password
    if (confirmPassword.value !== password.value) {
        showError(confirmPassword, 'su-confirmError', 'Passwords do not match.');
        valid = false;
    } else {
        clearError(confirmPassword, 'su-confirmError');
    }

    if (valid) {
        // TODO: Firebase Authentication signup
        console.log('Sign Up:', email.value, role.value);

        // Reset form after successful signup
        resetSignupForm();

        // window.location.href = 'dashboard.html';
    }
});

// ─── RESET SIGNUP ───────────────────────────────────────────
function resetSignupForm() {
    const ids = ['signup-firstName','signup-lastName','signup-email',
                 'signup-phone','signup-role','signup-password','signup-confirmPassword'];

    ids.forEach(id => {
        const el = document.getElementById(id);
        el.value = '';
        el.classList.remove('invalid', 'filled');
    });

    document.querySelectorAll('#signupForm .error-msg').forEach(el => {
        el.classList.remove('show');
        el.textContent = '';
    });
}

// ─── HELPERS ────────────────────────────────────────────────
function showError(input, errorId, message) {
    input.classList.add('invalid');
    let errorEl = document.getElementById(errorId);
    if (!errorEl) {
        errorEl = document.createElement('span');
        errorEl.id = errorId;
        errorEl.classList.add('error-msg');
        input.insertAdjacentElement('afterend', errorEl);
    }
    errorEl.textContent = message;
    errorEl.classList.add('show');
}

function clearError(input, errorId) {
    input.classList.remove('invalid');
    const errorEl = document.getElementById(errorId);
    if (errorEl) errorEl.classList.remove('show');
}

function signupRedirect() {
    const role = document.querySelector("#signupForm select").value;
    const redirectTo = localStorage.getItem('mhabook_redirect_after_login');
    localStorage.removeItem('mhabook_redirect_after_login');

    if (role === "Patient") {
        localStorage.setItem('mhabook_logged_in', 'true');
        localStorage.setItem('mhabook_role', 'patient');
        window.location.href = redirectTo || 'booking.html';
    } 
    else if (role === "Doctor") {
        localStorage.setItem('mhabook_logged_in', 'true');
        localStorage.setItem('mhabook_role', 'doctor');
        window.location.href = redirectTo || 'doctor_profile.html';
    } 
    else {
        alert("Please select a role first.");
    }
}

const user = JSON.parse(localStorage.getItem("user"));

const loginBtn = document.getElementById("loginBtn");
const profileCircle = document.getElementById("profileCircle");

if (user) {
  loginBtn.style.display = "none";
  profileCircle.style.display = "flex";

  profileCircle.textContent = user.name[0].toUpperCase();

  profileCircle.onclick = () => {
    window.location.href = "profile.html";
  };

} else {
  loginBtn.style.display = "block";
  profileCircle.style.display = "none";

  loginBtn.onclick = () => {
    window.location.href = "login.html";
  };
}
