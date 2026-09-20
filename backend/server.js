// ============================================================================
// SMART CAMPUS — Point d'entrée du backend Express
// ============================================================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const techRoutes = require('./routes/techRoutes');
const adminRoutes = require('./routes/adminRoutes');
const hardwareRoutes = require('./routes/hardwareRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'smart-campus-backend' });
});

app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/technician', techRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/hardware', hardwareRoutes);

// Gestionnaire d'erreurs générique
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Erreur interne du serveur.' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Smart Campus backend démarré sur http://localhost:${PORT}`);
});
