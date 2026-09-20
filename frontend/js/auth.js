// ============================================================================
// Gestion du formulaire de connexion + redirection selon le rôle
// ============================================================================
const API_BASE = window.SMART_CAMPUS_API || 'http://localhost:4000/api';

function showAlert(message, type = 'error') {
  const box = document.getElementById('alertBox');
  box.innerHTML = `<div class="alert alert-${type === 'error' ? 'error' : 'success'}">${message}</div>`;
}

// Si déjà connecté, redirige directement
(function redirectIfLoggedIn() {
  const isLoginPage = !!document.getElementById('loginForm');
  if (!isLoginPage) return;
  const token = localStorage.getItem('sc_token');
  const role = localStorage.getItem('sc_role');
  if (token && role) redirectByRole(role);
})();

function redirectByRole(role) {
  const pages = { STUDENT: 'student.html', TECHNICIAN: 'technician.html', ADMIN: 'admin.html' };
  window.location.href = pages[role] || 'index.html';
}

const form = document.getElementById('loginForm');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const btn = document.getElementById('submitBtn');
    btn.disabled = true;
    btn.textContent = 'Connexion...';

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        showAlert(data.error || 'Connexion impossible.');
        return;
      }

      localStorage.setItem('sc_token', data.token);
      localStorage.setItem('sc_role', data.user.role);
      localStorage.setItem('sc_name', data.user.fullName);
      redirectByRole(data.user.role);
    } catch (err) {
      showAlert("Impossible de contacter le serveur. Vérifiez qu'il est démarré (voir README).");
    } finally {
      btn.disabled = false;
      btn.textContent = 'Se connecter';
    }
  });
}

// Utilitaire partagé par les autres pages : requête authentifiée
async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('sc_token');
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  if (res.status === 401) {
    localStorage.clear();
    window.location.href = 'index.html';
    return null;
  }
  return res.json();
}

function logout() {
  localStorage.clear();
  window.location.href = 'index.html';
}
