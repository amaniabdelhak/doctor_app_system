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
