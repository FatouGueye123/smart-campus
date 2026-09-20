// Génère un hachage bcrypt pour un mot de passe donné.
// Usage : node scripts/hash.js "MonMotDePasse"
const bcrypt = require('bcrypt');

const password = process.argv[2];
if (!password) {
  console.error('Usage : node scripts/hash.js "MonMotDePasse"');
  process.exit(1);
}

bcrypt.hash(password, 10).then((hash) => {
  console.log(hash);
});
