// ============================================================================
// Tableau de bord administrateur : audit, fraude, recharge, gestion accès
// ============================================================================
document.getElementById('userName').textContent = localStorage.getItem('sc_name') || 'Administrateur';

const STATUS_LABEL = { OK: 'Autorisé', FRAUDE: 'Fraude', REFUSE: 'Refusé' };
const STATUS_CLASS = { OK: 'pill-ok', FRAUDE: 'pill-fraude', REFUSE: 'pill-refuse' };
const SERVICE_LABEL = { restaurant: 'Restaurant', bibliotheque: 'Bibliothèque', transport: 'Transport', photocopie: 'Photocopie' };

function showAlert(message, type = 'error') {
  document.getElementById('alertBox').innerHTML = `<div class="alert alert-${type}">${message}</div>`;
}

async function loadAudit() {
  const data = await apiFetch('/admin/audit');
  if (!data || data.error) return;

  document.getElementById('kpiTx').textContent = data.transactions.length;
  document.getElementById('kpiFraud').textContent = data.pendingFraudAlerts.length;

  const auditBody = document.getElementById('auditBody');
  auditBody.innerHTML = data.transactions.length === 0
    ? '<tr><td colspan="7" class="empty-state">Aucune transaction.</td></tr>'
    : data.transactions.slice(0, 30).map(tx => `
        <tr>
          <td>${new Date(tx.created_at).toLocaleString('fr-FR')}</td>
          <td>${tx.student || 'Inconnu'}</td>
          <td>${tx.uid}</td>
          <td>${SERVICE_LABEL[tx.service] || tx.service}</td>
          <td>${tx.amount > 0 ? tx.amount + ' FCFA' : '—'}</td>
          <td><span class="pill ${STATUS_CLASS[tx.status]}">${STATUS_LABEL[tx.status]}</span></td>
          <td>${Math.round(tx.risk_score * 100)}%</td>
        </tr>
      `).join('');

  const fraudBody = document.getElementById('fraudBody');
  fraudBody.innerHTML = data.pendingFraudAlerts.length === 0
    ? '<tr><td colspan="4" class="empty-state">Aucune alerte en attente.</td></tr>'
    : data.pendingFraudAlerts.map(f => `
        <tr>
          <td>${f.student || 'Inconnu'}</td>
          <td>${f.uid}</td>
          <td>${f.reason}</td>
          <td>${new Date(f.created_at).toLocaleString('fr-FR')}</td>
        </tr>
      `).join('');
}

async function loadUsers() {
  const data = await apiFetch('/admin/users');
  const body = document.getElementById('usersBody');
  if (!data || data.error || data.users.length === 0) {
    body.innerHTML = '<tr><td colspan="5" class="empty-state">Aucun utilisateur.</td></tr>';
    return;
  }
  document.getElementById('kpiUsers').textContent = data.users.filter(u => u.is_active).length;
  body.innerHTML = data.users.map(u => `
    <tr>
      <td>${u.full_name}</td>
      <td>${u.email}</td>
      <td>${u.role}</td>
      <td><span class="pill ${u.is_active ? 'pill-ok' : 'pill-refuse'}">${u.is_active ? 'Actif' : 'Désactivé'}</span></td>
      <td>
        <button class="btn" style="padding:5px 10px; font-size:11.5px;" onclick="toggleAccess(${u.id}, ${!u.is_active})">
          ${u.is_active ? 'Désactiver' : 'Réactiver'}
        </button>
      </td>
    </tr>
  `).join('');
}

async function toggleAccess(userId, nextState) {
  const data = await apiFetch(`/admin/users/${userId}/access`, {
    method: 'POST',
    body: JSON.stringify({ isActive: nextState }),
  });
  if (data && !data.error) {
    showAlert(data.message, 'success');
    loadUsers();
  } else {
    showAlert(data?.error || 'Erreur.');
  }
}
async function loadCards() {
  const data = await apiFetch('/admin/cards');
  const body = document.getElementById('cardsBody');
  if (!data || data.error || data.cards.length === 0) {
    body.innerHTML = '<tr><td colspan="5" class="empty-state">Aucune carte enregistrée.</td></tr>';
    return;
  }
  const statusLabel = { ACTIVE: 'Active', BLOCKED: 'Bloquée', UNASSIGNED: 'Non assignée' };
  const statusClass = { ACTIVE: 'pill-ok', BLOCKED: 'pill-fraude', UNASSIGNED: 'pill-refuse' };
  body.innerHTML = data.cards.map(c => `
    <tr>
      <td>${c.uid}</td>
      <td>${c.student || '—'}</td>
      <td>${c.balance} FCFA</td>
      <td><span class="pill ${statusClass[c.status]}">${statusLabel[c.status]}</span></td>
      <td>${c.last_scanned_at ? new Date(c.last_scanned_at).toLocaleString('fr-FR') : 'Jamais'}</td>
    </tr>
  `).join('');
}

document.getElementById('rechargeForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const uid = document.getElementById('rUid').value.trim().toUpperCase();
  const amount = Number(document.getElementById('rAmount').value);

  const data = await apiFetch('/admin/recharge', {
    method: 'POST',
    body: JSON.stringify({ uid, amount }),
  });

  if (data && !data.error) {
    showAlert(data.message, 'success');
    e.target.reset();
  } else {
    showAlert(data?.error || 'Erreur lors de la recharge.');
  }
});

loadAudit();
loadUsers();
loadCards();
setInterval(() => { loadAudit(); loadCards(); }, 15000);
