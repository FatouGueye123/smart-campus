// ============================================================================
// Tableau de bord étudiant : solde, historique, blocage de carte
// ============================================================================
document.getElementById('userName').textContent = localStorage.getItem('sc_name') || 'Étudiant';

const STATUS_LABEL = { OK: 'Autorisé', FRAUDE: 'Fraude', REFUSE: 'Refusé' };
const STATUS_CLASS = { OK: 'pill-ok', FRAUDE: 'pill-fraude', REFUSE: 'pill-refuse' };
const SERVICE_LABEL = { restaurant: 'Restaurant', bibliotheque: 'Bibliothèque', transport: 'Transport', photocopie: 'Photocopie' };

function showAlert(message, type = 'error') {
  document.getElementById('alertBox').innerHTML =
    `<div class="alert alert-${type}">${message}</div>`;
}

async function loadCard() {
  const data = await apiFetch('/student/card');
  if (!data) return;
  if (data.error) {
    showAlert(data.error);
    return;
  }
  document.getElementById('balanceValue').textContent = `${data.card.balance} FCFA`;
  document.getElementById('statusValue').textContent =
    data.card.status === 'ACTIVE' ? 'Active' : data.card.status === 'BLOCKED' ? 'Bloquée' : 'Non assignée';
  document.getElementById('uidValue').textContent = data.card.uid;

  document.getElementById('blockBtn').disabled = data.card.status === 'BLOCKED';
  if (data.card.status === 'BLOCKED') {
    document.getElementById('blockBtn').textContent = 'Carte déjà bloquée';
  }
}

async function loadHistory() {
  const data = await apiFetch('/student/history');
  const body = document.getElementById('historyBody');
  if (!data || data.error || !data.history || data.history.length === 0) {
    body.innerHTML = '<tr><td colspan="4" class="empty-state">Aucune transaction pour le moment.</td></tr>';
    return;
  }
  body.innerHTML = data.history.map(tx => `
    <tr>
      <td>${new Date(tx.created_at).toLocaleString('fr-FR')}</td>
      <td>${SERVICE_LABEL[tx.service] || tx.service}</td>
      <td>${tx.amount > 0 ? tx.amount + ' FCFA' : '—'}</td>
      <td><span class="pill ${STATUS_CLASS[tx.status]}">${STATUS_LABEL[tx.status]}</span></td>
    </tr>
  `).join('');
}

document.getElementById('blockBtn').addEventListener('click', async () => {
  if (!confirm('Confirmer le blocage immédiat de votre carte ?')) return;
  const data = await apiFetch('/student/block', { method: 'POST' });
  if (data && !data.error) {
    showAlert('Carte bloquée avec succès.', 'success');
    loadCard();
  } else {
    showAlert(data?.error || 'Erreur lors du blocage.');
  }
});

loadCard();
loadHistory();
