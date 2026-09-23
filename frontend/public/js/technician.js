// ============================================================================
// Tableau de bord technicien : association de cartes, diagnostic des bornes
// ============================================================================
document.getElementById('userName').textContent = localStorage.getItem('sc_name') || 'Technicien';

function showAlert(message, type = 'error') {
  document.getElementById('alertBox').innerHTML =
    `<div class="alert alert-${type}">${message}</div>`;
}

async function loadDevices() {
  const data = await apiFetch('/technician/devices');
  const body = document.getElementById('devicesBody');
  if (!data || data.error || !data.devices || data.devices.length === 0) {
    body.innerHTML = '<tr><td colspan="4" class="empty-state">Aucune borne enregistrée.</td></tr>';
    return;
  }
  body.innerHTML = data.devices.map(d => `
    <tr>
      <td>${d.device_name}</td>
      <td>${d.location}</td>
      <td><span class="pill ${d.is_online ? 'pill-ok' : 'pill-refuse'}">${d.is_online ? 'En ligne' : 'Hors ligne'}</span></td>
      <td>${d.last_seen_at ? new Date(d.last_seen_at).toLocaleString('fr-FR') : 'Jamais'}</td>
    </tr>
  `).join('');
}

document.getElementById('associateForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const uid = document.getElementById('uid').value.trim().toUpperCase();
  const email = document.getElementById('email').value.trim();

  const data = await apiFetch('/technician/associate-card', {
    method: 'POST',
    body: JSON.stringify({ uid, email }),
  });

  if (data && !data.error) {
    showAlert(data.message, 'success');
    e.target.reset();
  } else {
    showAlert(data?.error || "Erreur lors de l'association.");
  }
});

document.getElementById('unblockForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const uid = document.getElementById('uUid').value.trim().toUpperCase();
  const data = await apiFetch('/technician/unblock-card', {
    method: 'POST',
    body: JSON.stringify({ uid }),
  });
  if (data && !data.error) {
    showAlert(data.message, 'success');
    e.target.reset();
  } else {
    showAlert(data?.error || 'Erreur lors du déblocage.');
  }
});

loadDevices();
setInterval(loadDevices, 15000);
