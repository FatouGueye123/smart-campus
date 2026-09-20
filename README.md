# Smart Campus — Carte étudiante intelligente et sécurisée

Plateforme complète : borne RFID/NFC (ESP32, simulée sur Wokwi) → backend
Node.js/Express + PostgreSQL → tableaux de bord web (Étudiant, Technicien,
Administrateur), avec détection d'anomalie type IA anti-fraude.

```
smart-campus/
├── hardware/     Firmware ESP32 (Wokwi) + schéma de câblage
├── database/     Schéma PostgreSQL + données de démonstration
├── backend/      API REST Express (auth JWT, 3 rôles, endpoint bornes)
└── frontend/     Login + 3 tableaux de bord (HTML/CSS/JS vanilla)
```

## Comptes de démonstration
| Rôle        | Email                  | Mot de passe   |
|-------------|------------------------|----------------|
| Admin       | admin@campus.edu       | Admin#2026     |
| Technicien  | tech@campus.edu        | Tech#2026      |
| Étudiant    | awa.diop@campus.edu    | Student#2026   |

⚠️ Les hachages fournis dans `database/seed.sql` sont des exemples. Génère
les vrais hachages avant le premier lancement (étape 2 ci-dessous).

---

## Étape 1 — Base de données PostgreSQL

```bash
createdb smart_campus
psql -d smart_campus -f database/schema.sql
```

Génère de vrais mots de passe hachés puis remplace-les dans `seed.sql` :

```bash
cd backend
npm install          # installe bcrypt entre autres
node scripts/hash.js "Admin#2026"
node scripts/hash.js "Tech#2026"
node scripts/hash.js "Student#2026"
```

Colle chaque hachage obtenu dans `database/seed.sql` (un par utilisateur),
puis charge les données :

```bash
psql -d smart_campus -f ../database/seed.sql
```

## Étape 2 — Backend (API)

```bash
cd backend
cp .env.example .env     # puis édite .env : DB_*, JWT_SECRET
npm install
npm run dev               # démarre sur http://localhost:4000
```

Vérifie que ça répond :
```bash
curl http://localhost:4000/api/health
```

Teste la connexion :
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@campus.edu","password":"Admin#2026"}'
```

## Étape 3 — Frontend

Le frontend est en HTML/CSS/JS pur : pas de build nécessaire. Ouvre
`frontend/public/index.html` avec une petite extension de serveur local
(ex. l'extension VS Code "Live Server"), ou lance :

```bash
cd frontend/public
python3 -m http.server 5500
```
puis ouvre `http://localhost:5500`.

Par défaut, le frontend appelle `http://localhost:4000/api`. Pour changer
l'URL de l'API (ex. une fois le backend déployé en ligne), ajoute avant les
scripts dans chaque page HTML :
```html
<script>window.SMART_CAMPUS_API = "https://ton-backend-deploye.com/api";</script>
```

## Étape 4 — Firmware Wokwi + Wokwi Gateway (le lien "réaliste")

C'est l'étape qui relie vraiment la carte simulée à ton vrai backend.

1. Va sur [wokwi.com](https://wokwi.com), crée un nouveau projet **ESP32**.
2. Colle `hardware/sketch.ino` dans l'éditeur de code, et `hardware/diagram.json`
   dans l'onglet diagram.json (ou reconstruis le câblage à la main avec le
   README du dossier `hardware/`).
3. Installe les bibliothèques Wokwi nécessaires (MFRC522, Adafruit SSD1306,
   Adafruit GFX, ArduinoJson) via le panneau "Library Manager" de Wokwi.
4. Comme tu as déjà installé le **Wokwi Gateway** (`wokwigw`) :
   - Lance-le dans un terminal : `wokwigw`
   - Dans l'éditeur Wokwi (wokwi.com), ouvre la palette de commandes
     (`F1`) → **"Enable Private Wokwi IoT Gateway"**.
   - Le firmware utilise déjà l'hôte spécial `host.wokwi.internal` pour
     atteindre ton backend local (`http://host.wokwi.internal:4000/...`) —
     rien à changer si ton backend tourne sur le port 4000.
5. Assure-toi que ton backend (Étape 2) tourne toujours, puis lance la
   simulation Wokwi et clique sur le lecteur RFID pour "scanner" une carte.
6. Regarde la console série Wokwi : tu dois voir la requête partir et la
   réponse du backend (autorisé / refusé / anomalie) s'afficher sur l'OLED
   simulé, avec la LED et le buzzer qui réagissent.
7. Connecte-toi ensuite au tableau de bord **Administrateur** (Étape 3) :
   la transaction apparaît en direct dans le journal d'audit.

> Si tu n'as pas (ou plus) le Wokwi Gateway sous la main : le firmware
> fonctionne aussi en pointant `SERVER_URL` vers un backend déployé
> publiquement (Render, Railway, Fly.io...) — voir Étape 6.

## Étape 5 — Publier le projet sur GitHub

```bash
cd smart-campus
git init
git add .
git commit -m "Smart Campus : plateforme carte étudiante intelligente"
git branch -M main
git remote add origin https://github.com/<ton-utilisateur>/smart-campus.git
git push -u origin main
```

Vérifie avant de pousser que `.env` réel n'est **pas** suivi par git
(`backend/.gitignore` l'exclut déjà). Pense aussi à retirer les vrais
hachages de mots de passe de `seed.sql` si tu ne veux pas les exposer,
ou à les remplacer par les valeurs d'exemple avant publication.

## Étape 6 — Rendre la démo accessible en ligne (pour ton CV)

Pour que quelqu'un puisse tester sans tout installer :
1. Déploie le **backend** + **PostgreSQL** sur un hébergeur gratuit adapté
   à Node (Render, Railway, Fly.io proposent un plan gratuit avec Postgres managé).
2. Déploie le **frontend** (dossier `frontend/public`) sur Vercel, Netlify
   ou GitHub Pages — ce sont juste des fichiers statiques.
3. Mets à jour `window.SMART_CAMPUS_API` dans les pages HTML pour pointer
   vers l'URL du backend déployé.
4. Mets ce lien dans ton CV / LinkedIn, avec le lien du dépôt GitHub à côté
   pour montrer le code (architecture, sécurité, IA anti-fraude).

## Ce qui rend le projet crédible pour un recruteur
- **Sécurité** : mots de passe hachés (bcrypt), JWT avec expiration,
  contrôle d'accès par rôle (middleware dédié), clé d'authentification
  séparée pour les bornes matérielles.
- **IoT réel** : firmware ESP32 fonctionnel sur Wokwi, relié à une vraie
  API via le Wokwi Gateway — pas juste une maquette visuelle.
- **IA anti-fraude** : heuristique de détection d'anomalie exposée
  clairement comme un point d'extension vers un vrai modèle
  (Isolation Forest / Random Forest) entraîné sur l'historique complet.
- **Architecture propre** : séparation claire hardware / backend / base de
  données / frontend, avec un contrat de données identique entre le
  firmware et l'API.
